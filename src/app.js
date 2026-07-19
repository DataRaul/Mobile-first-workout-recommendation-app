import { COMMON_EQUIPMENT, CONSTRAINTS, EQUIPMENT_PRESETS, GOALS, LEVELS } from "./config.js";
import { loadExercises, mediaUrl, uniqueValues } from "./dataset.js";
import { DEFAULT_STATE, exportState, importState, loadState, resetState, saveState } from "./storage.js";
import { acceptProgram, currentWeek, findReplacement, generateProgram, nextWorkout } from "./programme.js";

let state = loadState();
let exercises = [];
let byId = new Map();
let browserLimit = 24;
let restInterval = null;
let restRemaining = 0;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const escapeHtml = value => String(value??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const labelize = value => String(value||"").replaceAll("_"," ").replace(/\b\w/g,m=>m.toUpperCase());

function persist(){ saveState(state); }
function toast(message){ const el=$("#toast"); el.textContent=message; el.hidden=false; clearTimeout(el._t); el._t=setTimeout(()=>el.hidden=true,2800); }
function view(id){ $$(".view").forEach(v=>v.classList.toggle("active",v.id===id)); $$("#bottomNav button").forEach(b=>b.classList.toggle("active",b.dataset.view===id)); $("#bottomNav").hidden=["loadingView","onboardingView","plannerView","sessionView"].includes(id); window.scrollTo({top:0,behavior:"smooth"}); }
function ex(id){ return byId.get(String(id)); }
function instructionSteps(item){ const lang=state.preferences?.language||"en"; return item.instruction_steps?.[lang] || item.instruction_steps?.en || String(item.instructions?.[lang]||item.instructions?.en||"").split(/(?<=[.!?])\s+/).filter(Boolean); }
function goal(){ return GOALS[state.profile?.goal]||GOALS.general; }

function renderOnboarding(edit=false){
  const p=state.profile||{name:"",goal:"hypertrophy",level:"starter",daysPerWeek:3,sessionMinutes:60,durationWeeks:12,equipmentPreset:"machines",equipment:[],constraints:[],favorites:[]};
  $("#onboardingView").innerHTML=`
    <div class="hero"><div class="eyebrow">${edit?"Update profile":"First-time setup"}</div><h1>${edit?"Update your training profile":"Build a programme that fits you"}</h1><p>Choose the goal, schedule, equipment and safety constraints. The app will recommend a stable multi-week routine—not a random daily list.</p></div>
    <form id="profileForm" class="card grid">
      <div class="grid two">
        <label class="field">Name<input name="name" value="${escapeHtml(p.name)}" placeholder="Your name"></label>
        <label class="field">Primary goal<select name="goal">${Object.entries(GOALS).map(([k,v])=>`<option value="${k}" ${p.goal===k?"selected":""}>${v.label}</option>`).join("")}</select></label>
        <label class="field">Experience<select name="level">${Object.entries(LEVELS).map(([k,v])=>`<option value="${k}" ${p.level===k?"selected":""}>${v}</option>`).join("")}</select></label>
        <label class="field">Training days per week<select name="daysPerWeek">${[2,3,4,5,6].map(n=>`<option ${p.daysPerWeek==n?"selected":""}>${n}</option>`).join("")}</select></label>
        <label class="field">Typical session<select name="sessionMinutes">${[30,45,60,75].map(n=>`<option value="${n}" ${p.sessionMinutes==n?"selected":""}>${n} minutes</option>`).join("")}</select></label>
        <label class="field">Programme length<select name="durationWeeks">${[8,10,12,16].map(n=>`<option value="${n}" ${p.durationWeeks==n?"selected":""}>${n} weeks</option>`).join("")}</select></label>
      </div>
      <fieldset><legend>Training environment</legend><div class="option-grid">${Object.entries(EQUIPMENT_PRESETS).map(([k,v])=>`<label class="option"><input type="radio" name="equipmentPreset" value="${k}" ${p.equipmentPreset===k?"checked":""}><span>${v.label}</span></label>`).join("")}</div></fieldset>
      <fieldset id="customEquipment" class="${p.equipmentPreset==="custom"?"":"hidden"}"><legend>Custom equipment</legend><div class="option-grid">${COMMON_EQUIPMENT.map(item=>`<label class="option"><input type="checkbox" name="equipment" value="${item}" ${(p.equipment||[]).includes(item)?"checked":""}><span>${labelize(item)}</span></label>`).join("")}</div></fieldset>
      <fieldset><legend>Pain and movement constraints</legend><p class="notice">These are conservative software filters, not medical clearance. Stop any exercise that increases symptoms.</p><div class="option-grid">${Object.entries(CONSTRAINTS).map(([k,v])=>`<label class="option"><input type="checkbox" name="constraints" value="${k}" ${(p.constraints||[]).includes(k)?"checked":""}><span>${v}</span></label>`).join("")}</div></fieldset>
      <div class="actions"><button class="btn primary" type="submit">${edit?"Save and rebuild recommendation":"Build my programme"}</button>${edit?`<button id="cancelProfile" class="btn ghost" type="button">Cancel</button>`:""}</div>
    </form>`;
  $("#profileForm").addEventListener("change",e=>{ if(e.target.name==="equipmentPreset") $("#customEquipment").classList.toggle("hidden",e.target.value!=="custom"); });
  $("#profileForm").addEventListener("submit",e=>{
    e.preventDefault(); const f=new FormData(e.currentTarget);
    state.profile={...p,name:String(f.get("name")||"").trim(),goal:String(f.get("goal")),level:String(f.get("level")),daysPerWeek:Number(f.get("daysPerWeek")),sessionMinutes:Number(f.get("sessionMinutes")),durationWeeks:Number(f.get("durationWeeks")),equipmentPreset:String(f.get("equipmentPreset")),equipment:f.getAll("equipment").map(String),constraints:f.getAll("constraints").map(String),favorites:p.favorites||[]};
    try { state.draftProgram=generateProgram(exercises,state.profile,state,0); if(edit) state.activeProgram=null; state.activeSession=null; persist(); renderPlanner(); view("plannerView"); } catch(err){ alert(err.message); }
  });
  $("#cancelProfile")?.addEventListener("click",()=>{ renderProfile(); view("profileView"); });
}

function workoutHtml(workout){ return `<div class="programme-workout"><div class="summary-row"><div><h3>${escapeHtml(workout.name)}</h3><p>${workout.exercises.length} exercises · approximately ${state.profile.sessionMinutes} minutes</p></div></div>${workout.exercises.map((item,i)=>{const e=ex(item.exerciseId);return `<div class="exercise-line"><span class="number">${i+1}</span><div><strong>${escapeHtml(e?.name||item.exerciseId)}</strong><small>${labelize(e?.app.group)} · ${labelize(e?.equipment)} · ${item.sets} × ${item.reps}</small></div><button class="btn small ghost inspect-exercise" data-id="${item.exerciseId}">View</button></div>`}).join("")}</div>`; }

function bindInspect(){ $$(".inspect-exercise").forEach(b=>b.addEventListener("click",()=>openExercise(b.dataset.id))); }

function renderPlanner(){
  const program=state.draftProgram; if(!program){ state.draftProgram=generateProgram(exercises,state.profile,state,0); persist(); return renderPlanner(); }
  $("#plannerView").innerHTML=`<div class="hero"><div class="eyebrow">Programme recommendation</div><h1>${escapeHtml(program.title)}</h1><p>${goal().summary}</p><div class="chips"><span class="chip">${program.daysPerWeek} days/week</span><span class="chip">${program.sessionMinutes} min/session</span><span class="chip">${program.splitName}</span><span class="chip">${LEVELS[state.profile.level]}</span></div></div>
    <div class="card"><h2>Why this fits</h2><p>The routine uses your goal, experience, available equipment and active safety filters. Core exercises remain stable so progress can be measured.</p><div class="notice"><strong>Progression:</strong> ${escapeHtml(program.progression)}</div></div>
    <div class="card"><div class="summary-row"><div><h2>Weekly routine</h2><p>Review the complete recommendation before accepting it.</p></div></div>${program.workouts.map(workoutHtml).join("")}</div>
    <div class="actions"><button id="acceptProgram" class="btn primary">Accept programme</button><button id="anotherProgram" class="btn">Generate another</button><button id="adjustProfile" class="btn ghost">Adjust profile</button></div>`;
  bindInspect();
  $("#acceptProgram").onclick=()=>{ state.activeProgram=acceptProgram(program); state.draftProgram=null; persist(); renderAll(); view("todayView"); toast("Programme accepted. Your routine is now active."); };
  $("#anotherProgram").onclick=()=>{ state.draftProgram=generateProgram(exercises,state.profile,state,(program.variation||0)+1); persist(); renderPlanner(); };
  $("#adjustProfile").onclick=()=>{ renderOnboarding(true); view("onboardingView"); };
}

function renderToday(){
  if(!state.activeProgram){ renderPlanner(); return; }
  const p=state.activeProgram, workout=nextWorkout(p), week=currentWeek(p), total=p.durationWeeks*p.daysPerWeek;
  const completed=p.completedSessions||0; const percent=Math.min(100,completed/total*100);
  $("#todayView").innerHTML=`<div class="hero"><div class="eyebrow">Today</div><h1>${state.profile.name?`${escapeHtml(state.profile.name)}, `:""}${state.activeSession?"resume your workout":"your next session is ready"}</h1><p>Your accepted programme remains stable. Change individual exercises only when needed.</p></div>
    <article class="card today-card"><div class="summary-row"><div><div class="eyebrow">Week ${week} of ${p.durationWeeks}</div><h2>${escapeHtml(state.activeSession?.workoutName||workout.name)}</h2><p>${workout.exercises.length} exercises · approximately ${p.sessionMinutes} minutes</p></div><div class="metric"><strong>${completed}/${total}</strong><span>sessions</span></div></div><div class="progress-track"><span style="width:${percent}%"></span></div><div class="actions"><button id="startSession" class="btn primary">${state.activeSession?"Resume workout":"Start workout"}</button><button id="previewRoutine" class="btn">View routine</button></div></article>
    <div class="card"><h2>Programme rules</h2><p>${escapeHtml(p.progression)}</p><div class="chips">${p.reviewWeeks.map(w=>`<span class="chip">Review week ${w}</span>`).join("")}</div></div>`;
  $("#startSession").onclick=()=>{ if(!state.activeSession) createSession(); renderSession(); view("sessionView"); };
  $("#previewRoutine").onclick=()=>{ renderRoutine(); view("routineView"); };
}

function createSession(){
  const workout=nextWorkout(state.activeProgram);
  state.activeSession={id:`session-${Date.now()}`,programId:state.activeProgram.id,workoutId:workout.id,workoutName:workout.name,startedAt:new Date().toISOString(),currentIndex:0,exercises:workout.exercises.map(item=>({...item,setsLog:Array.from({length:item.sets},(_,i)=>({set:i+1,weight:"",reps:"",rir:"",done:false}))}))}; persist();
}

function previousPerformance(exerciseId){
  for(const session of [...state.history].reverse()){ const item=session.exercises?.find(e=>e.exerciseId===exerciseId); if(item) return item.setsLog?.filter(s=>s.done).map(s=>`${s.weight||"—"} × ${s.reps||"—"}`).join(", "); }
  return "No previous logged sets";
}

function renderSession(){
  const s=state.activeSession; if(!s){ renderToday(); return; }
  const item=s.exercises[s.currentIndex], e=ex(item.exerciseId), completedSets=s.exercises.flatMap(x=>x.setsLog).filter(x=>x.done).length, totalSets=s.exercises.flatMap(x=>x.setsLog).length;
  $("#sessionView").innerHTML=`<div class="exercise-stage"><div class="summary-row"><div><div class="eyebrow">${escapeHtml(s.workoutName)} · Exercise ${s.currentIndex+1}/${s.exercises.length}</div><h1>${escapeHtml(e.name)}</h1></div><button id="exitSession" class="btn ghost small">Exit</button></div><div class="progress-track"><span style="width:${completedSets/totalSets*100}%"></span></div>
    <article class="card" style="margin-top:14px"><img id="sessionMedia" class="exercise-media" src="${mediaUrl(e.image)}" alt="${escapeHtml(e.name)}"><div class="exercise-title-row"><div><h2>${escapeHtml(e.name)}</h2><p>${labelize(e.app.group)} · ${labelize(e.equipment)} · target: ${escapeHtml(e.target)}</p></div><button id="toggleMedia" class="btn small">Show animation</button></div><div class="chips"><span class="chip">${item.sets} sets</span><span class="chip">${item.reps}</span><span class="chip">${item.restSeconds}s rest</span></div><p><strong>Previous:</strong> ${escapeHtml(previousPerformance(e.id))}</p><details><summary>How to perform it</summary><ol class="instructions">${instructionSteps(e).map(step=>`<li>${escapeHtml(step)}</li>`).join("")}</ol></details></article>
    <article class="card"><h2>Record sets</h2><div class="set-table">${item.setsLog.map((set,i)=>`<div class="set-row ${set.done?"done":""}" data-set="${i}"><strong>${i+1}</strong><input data-field="weight" value="${escapeHtml(set.weight)}" inputmode="decimal" placeholder="kg"><input data-field="reps" value="${escapeHtml(set.reps)}" inputmode="numeric" placeholder="reps"><input class="rir-field" data-field="rir" value="${escapeHtml(set.rir)}" inputmode="numeric" placeholder="RIR"><button class="set-check ${set.done?"done":""}" data-action="set-done">${set.done?"✓":"○"}</button></div>`).join("")}</div></article>
    <div class="actions"><button id="replaceToday" class="btn">Replace for today</button><button id="replaceRoutine" class="btn">Replace in routine</button><button id="machineUnavailable" class="btn danger">Not available at this gym</button></div>
    <div class="actions"><button id="prevExercise" class="btn ghost" ${s.currentIndex===0?"disabled":""}>Previous</button><button id="nextExercise" class="btn primary">${s.currentIndex===s.exercises.length-1?"Finish workout":"Next exercise"}</button></div><div id="restTimer"></div></div>`;
  let gif=false; $("#toggleMedia").onclick=()=>{gif=!gif; $("#sessionMedia").src=mediaUrl(gif?e.gif_url:e.image); $("#toggleMedia").textContent=gif?"Show image":"Show animation";};
  $$(".set-row input").forEach(input=>input.addEventListener("change",evt=>{ const row=evt.target.closest(".set-row"), set=item.setsLog[Number(row.dataset.set)]; set[evt.target.dataset.field]=evt.target.value; persist(); }));
  $$("[data-action='set-done']").forEach(btn=>btn.onclick=()=>{ const row=btn.closest(".set-row"), set=item.setsLog[Number(row.dataset.set)]; set.done=!set.done; persist(); if(set.done) startRest(item.restSeconds); renderSession(); });
  $("#exitSession").onclick=()=>{ renderToday(); view("todayView"); };
  $("#prevExercise").onclick=()=>{ s.currentIndex--; persist(); renderSession(); };
  $("#nextExercise").onclick=()=>{ if(s.currentIndex<s.exercises.length-1){s.currentIndex++;persist();renderSession();} else finishSession(); };
  $("#replaceToday").onclick=()=>replaceCurrent(false);
  $("#replaceRoutine").onclick=()=>replaceCurrent(true);
  $("#machineUnavailable").onclick=()=>{ if(!state.gym.unavailableExerciseIds.includes(e.id)) state.gym.unavailableExerciseIds.push(e.id); persist(); replaceCurrent(true); toast("Exercise marked unavailable at this gym and replaced in the routine."); };
  renderRest();
}

function replaceCurrent(permanent){
  const s=state.activeSession,item=s.exercises[s.currentIndex],ids=s.exercises.map(x=>x.exerciseId),replacement=findReplacement(exercises,item.exerciseId,ids,state.profile,state,state.profile.goal);
  if(!replacement) return alert("No eligible replacement was found with the current equipment and safety filters.");
  const old=item.exerciseId; item.exerciseId=replacement.id; item.setsLog=item.setsLog.map((set,i)=>({set:i+1,weight:"",reps:"",rir:"",done:false}));
  if(permanent){ const workout=state.activeProgram.workouts.find(w=>w.id===s.workoutId); const template=workout.exercises.find(x=>x.exerciseId===old); if(template) template.exerciseId=replacement.id; }
  persist(); renderSession(); toast(permanent?"Routine updated.":"Replaced for this session only.");
}

function startRest(seconds){ clearInterval(restInterval); restRemaining=seconds; restInterval=setInterval(()=>{restRemaining--;renderRest();if(restRemaining<=0){clearInterval(restInterval);toast("Rest complete");}},1000); }
function renderRest(){ const el=$("#restTimer"); if(!el||restRemaining<=0){if(el)el.innerHTML="";return;} el.innerHTML=`<div class="rest-timer"><strong>Rest ${Math.floor(restRemaining/60)}:${String(restRemaining%60).padStart(2,"0")}</strong><button id="skipRest" class="btn small">Skip</button></div>`; $("#skipRest").onclick=()=>{clearInterval(restInterval);restRemaining=0;renderRest();}; }

function finishSession(){
  const s=state.activeSession; const done=s.exercises.flatMap(x=>x.setsLog).filter(x=>x.done).length; if(done===0&&!confirm("No sets are marked complete. Finish anyway?")) return;
  s.completedAt=new Date().toISOString(); state.history.push(s); state.activeSession=null; state.activeProgram.completedSessions=(state.activeProgram.completedSessions||0)+1; state.activeProgram.nextWorkoutIndex=((state.activeProgram.nextWorkoutIndex||0)+1)%state.activeProgram.workouts.length; persist(); renderAll(); view("progressView"); toast("Workout completed and added to progress.");
}

function renderRoutine(){
  const p=state.activeProgram; if(!p){ $("#routineView").innerHTML=`<div class="hero"><h1>No active routine</h1><p>Build and accept a programme first.</p></div>`; return; }
  $("#routineView").innerHTML=`<div class="hero"><div class="eyebrow">My routine</div><h1>${escapeHtml(p.title)}</h1><p>Week ${currentWeek(p)} of ${p.durationWeeks} · ${p.completedSessions||0} sessions complete.</p></div><div class="card"><h2>Progression</h2><p>${escapeHtml(p.progression)}</p></div><div class="card"><h2>Workout templates</h2>${p.workouts.map(workoutHtml).join("")}</div><div class="actions"><button id="endProgram" class="btn danger">End and rebuild programme</button></div>`;
  bindInspect(); $("#endProgram").onclick=()=>{if(confirm("End the active programme? Completed workout history will be kept.")){state.activeProgram=null;state.activeSession=null;state.draftProgram=generateProgram(exercises,state.profile,state,0);persist();renderPlanner();view("plannerView");}};
}

function sessionVolume(session){ return session.exercises.flatMap(x=>x.setsLog||[]).reduce((sum,set)=>sum+(Number(set.weight)||0)*(Number(set.reps)||0),0); }
function renderProgress(){
  const sessions=state.history, sets=sessions.flatMap(s=>s.exercises.flatMap(x=>x.setsLog||[])).filter(x=>x.done).length, volume=Math.round(sessions.reduce((sum,s)=>sum+sessionVolume(s),0));
  $("#progressView").innerHTML=`<div class="hero"><div class="eyebrow">Progress</div><h1>Your training record</h1><p>All data stays in this browser unless you export it.</p></div><div class="stat-grid"><div class="stat"><strong>${sessions.length}</strong><span>workouts</span></div><div class="stat"><strong>${sets}</strong><span>completed sets</span></div><div class="stat"><strong>${volume.toLocaleString()}</strong><span>kg-rep volume</span></div><div class="stat"><strong>${state.activeProgram?currentWeek(state.activeProgram):"—"}</strong><span>programme week</span></div></div><div class="card" style="margin-top:14px"><h2>Recent workouts</h2>${sessions.length?sessions.slice().reverse().slice(0,12).map(s=>`<div class="exercise-line"><span class="number">✓</span><div><strong>${escapeHtml(s.workoutName)}</strong><small>${new Date(s.completedAt).toLocaleDateString()} · ${s.exercises.flatMap(x=>x.setsLog).filter(x=>x.done).length} sets · ${sessionVolume(s).toLocaleString()} volume</small></div></div>`).join(""):`<p>No completed workouts yet.</p>`}</div>`;
}

function browserResults(){ const q=normalize($("#exerciseSearch")?.value),cat=$("#categoryFilter")?.value||"",eq=$("#equipmentFilter")?.value||""; return exercises.filter(e=>(!q||normalize(`${e.name} ${e.target} ${e.muscle_group}`).includes(q))&&(!cat||e.category===cat)&&(!eq||e.equipment===eq)); }
function normalize(v){return String(v||"").toLowerCase();}
function renderExercises(reset=false){ if(reset)browserLimit=24; const categories=uniqueValues(exercises,"category"),equipment=uniqueValues(exercises,"equipment"); $("#exercisesView").innerHTML=`<div class="hero"><div class="eyebrow">Exercise library</div><h1>All ${exercises.length.toLocaleString()} exercises</h1><p>Search the complete source dataset. Programme recommendations use additional movement, difficulty, goal and safety enrichment calculated by this app.</p></div><div class="exercise-toolbar"><input id="exerciseSearch" placeholder="Search name, muscle or target"><select id="categoryFilter"><option value="">All body parts</option>${categories.map(v=>`<option>${escapeHtml(v)}</option>`).join("")}</select><select id="equipmentFilter"><option value="">All equipment</option>${equipment.map(v=>`<option>${escapeHtml(v)}</option>`).join("")}</select></div><div id="browserCount"></div><div id="exerciseGrid" class="exercise-grid"></div><div class="actions"><button id="loadMore" class="btn">Load more</button></div>`; ["exerciseSearch","categoryFilter","equipmentFilter"].forEach(id=>$("#"+id).addEventListener(id==="exerciseSearch"?"input":"change",()=>{browserLimit=24;renderBrowserGrid();})); $("#loadMore").onclick=()=>{browserLimit+=24;renderBrowserGrid();}; renderBrowserGrid(); }
function renderBrowserGrid(){ const results=browserResults(),shown=results.slice(0,browserLimit); $("#browserCount").innerHTML=`<p>${results.length.toLocaleString()} matching exercises</p>`; $("#exerciseGrid").innerHTML=shown.map(e=>`<button class="exercise-browser-card" data-id="${e.id}"><img loading="lazy" src="${mediaUrl(e.image)}" alt=""><div><strong>${escapeHtml(e.name)}</strong><small>${labelize(e.app.group)} · ${labelize(e.equipment)}</small></div></button>`).join(""); $$(".exercise-browser-card").forEach(b=>b.onclick=()=>openExercise(b.dataset.id)); $("#loadMore").hidden=shown.length>=results.length; }

function openExercise(id){ const e=ex(id); if(!e)return; $("#exerciseDialogContent").innerHTML=`<img class="exercise-media" src="${mediaUrl(e.gif_url||e.image)}" alt="${escapeHtml(e.name)}"><div class="eyebrow" style="margin-top:14px">${labelize(e.category)}</div><h2>${escapeHtml(e.name)}</h2><div class="chips"><span class="chip">${labelize(e.equipment)}</span><span class="chip">Target: ${escapeHtml(e.target)}</span><span class="chip">${labelize(e.app.movement)}</span><span class="chip">Complexity ${e.app.complexity}/4</span></div><ol class="instructions">${instructionSteps(e).map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ol><p class="notice">Automated safety enrichment: ${e.app.safetyFlags.length?e.app.safetyFlags.map(x=>CONSTRAINTS[x]).join(", "):"no specific flag detected"}. This is not medical advice.</p>`; $("#exerciseDialog").showModal(); }

function renderProfile(){ const p=state.profile; $("#profileView").innerHTML=`<div class="hero"><div class="eyebrow">Profile</div><h1>${escapeHtml(p?.name||"Training profile")}</h1><p>Changing programme inputs rebuilds the recommendation. History is retained.</p></div><div class="card"><div class="chips"><span class="chip">${goal().label}</span><span class="chip">${LEVELS[p.level]}</span><span class="chip">${p.daysPerWeek} days/week</span><span class="chip">${p.sessionMinutes} min</span><span class="chip">${EQUIPMENT_PRESETS[p.equipmentPreset]?.label}</span>${(p.constraints||[]).map(c=>`<span class="chip">${CONSTRAINTS[c]}</span>`).join("")}</div><div class="actions"><button id="editProfile" class="btn primary">Edit profile</button></div></div><div class="card"><h2>Data and sharing</h2><p>Export the profile, routine, gym observations and history to move them to another browser or send them to the repository owner.</p><div class="actions"><button id="exportData" class="btn">Export data</button><label class="btn">Import data<input id="importData" type="file" accept="application/json" hidden></label><button id="resetData" class="btn danger">Reset all local data</button></div></div><div class="card"><h2>Gym learning</h2><p>${state.gym.unavailableExerciseIds.length} exercise or machine variants are currently marked unavailable at this gym.</p><button id="resetGym" class="btn ghost">Clear unavailable list</button></div>`;
  $("#editProfile").onclick=()=>{renderOnboarding(true);view("onboardingView");}; $("#exportData").onclick=()=>exportState(state); $("#importData").onchange=async e=>{try{state=await importState(e.target.files[0]);renderAll();routeInitial();toast("Data imported.");}catch(err){alert(err.message);}}; $("#resetData").onclick=()=>{if(confirm("Delete the local profile, programme and history from this browser?")){state=resetState();renderOnboarding();view("onboardingView");}}; $("#resetGym").onclick=()=>{state.gym.unavailableExerciseIds=[];persist();renderProfile();};
}

function renderAll(){ renderToday(); renderRoutine(); renderProgress(); renderExercises(true); renderProfile(); $("#headerSubtitle").textContent=state.activeProgram?`Week ${currentWeek(state.activeProgram)} · ${goal().label}`:"Personal programme"; }
function routeInitial(){ if(!state.profile){renderOnboarding();view("onboardingView");} else if(state.activeSession){renderAll();renderSession();view("sessionView");} else if(state.activeProgram){renderAll();view("todayView");} else {if(!state.draftProgram)state.draftProgram=generateProgram(exercises,state.profile,state,0);persist();renderPlanner();view("plannerView");} }
function bindGlobal(){ $$("#bottomNav button").forEach(b=>b.onclick=()=>{ const id=b.dataset.view; if(id==="todayView")renderToday();if(id==="routineView")renderRoutine();if(id==="progressView")renderProgress();if(id==="exercisesView")renderExercises(true);if(id==="profileView")renderProfile();view(id);}); $("#brandButton").onclick=()=>{if(state.activeSession){renderSession();view("sessionView");}else if(state.activeProgram){renderToday();view("todayView");}}; $("#closeExerciseDialog").onclick=()=>$("#exerciseDialog").close(); }

async function init(){
  bindGlobal();
  try { exercises=await loadExercises(); byId=new Map(exercises.map(e=>[String(e.id),e])); $("#datasetBadge").textContent=`${exercises.length.toLocaleString()} exercises`; $("#datasetBadge").classList.add("ready"); routeInitial(); if("serviceWorker" in navigator) navigator.serviceWorker.register("./service-worker.js").catch(()=>{}); }
  catch(err){ $("#loadingView").innerHTML=`<div><h1>Exercise library unavailable</h1><p>${escapeHtml(err.message)}</p><button class="btn primary" onclick="location.reload()">Retry</button></div>`; }
}
init();
