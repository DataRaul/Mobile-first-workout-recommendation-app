# Mobile-first Workout Recommendation App

A mobile-first, static workout recommender for hypertrophy training. It is designed for a very small group of users, runs entirely in the browser, stores personal data locally, and is hosted free with GitHub Pages.

## Live app

`https://dataraul.github.io/Mobile-first-workout-recommendation-app/`

## Stage 3 MVP

- Hypertrophy-oriented workout generation
- Starter, intermediate, advanced, and pro levels
- Session-length-aware recommendations
- Machine-preferred or machine-only modes
- Pain and movement constraints for back, knee, elbow, shoulder, and shoulder extension
- Safety-aware exercise filtering
- Exercise rotation to reduce repetition
- One-tap substitutions
- Mark a machine unavailable and immediately replace the exercise
- Kraftwerk gym profile with equipment availability learning
- Local profiles with JSON export/import for sharing between two users
- No account, server, external API, tracking, or AI dependency
- Installable mobile web app shell

## Current behaviour of Generate workout

`Generate workout` creates a fresh valid workout proposal every time it is pressed. The recommendation score contains a small random tie-breaker, so repeated clicks can produce different exercises even when the profile has not changed.

For the current MVP, the intended behaviour is:

1. Press **Generate workout once** at the start of the session.
2. Review the proposed workout.
3. Use **Rotate** to replace only an exercise you do not want.
4. Use **Machine unavailable** when the required equipment cannot be used; the app records that observation and replaces the exercise.
5. Mark exercises **Complete** as the session progresses.

Repeatedly pressing **Generate workout** should be treated as discarding the current proposal and requesting a completely new session. This is functional, but it is not yet the ideal final user experience.

## User journey

### 1. First-time onboarding

On first use, the user should complete the Profile screen before generating a workout:

1. Enter a display name.
2. Select training level.
3. Select the normal session duration.
4. Choose machines preferred or machines only.
5. Add any pain or movement constraints.
6. Enable the Kraftwerk equipment profile when training at that gym.
7. Save the profile.

The profile is stored locally in that browser and device.

### 2. Post-onboarding setup

Before or during the first gym visits:

1. Open **Gym**.
2. Mark known machines as **Available**, **Unavailable**, or leave them **Unknown**.
3. Unknown machines remain eligible.
4. Unavailable machines are excluded from later recommendations.

The equipment map can be refined gradually rather than completed in one visit.

### 3. Normal workout usage

At the start of a session:

1. Open **Workout**.
2. Confirm the chips reflect the correct level, duration, equipment mode, gym, and pain filters.
3. Press **Generate workout once**.
4. Review the full proposed session before beginning.
5. Use **Rotate** for an exercise-specific substitution.
6. Use **Machine unavailable** when equipment is absent, occupied long-term, broken, or unsuitable.
7. Press **Complete** after each exercise.

### 4. End of workout

When every exercise is marked complete:

- the workout is added to local history;
- recent exercise IDs are retained for rotation logic;
- later recommendations favour exercises not used recently where suitable alternatives exist.

### 5. Returning use

On the next session:

1. Open the same browser and device.
2. Update the Profile only when level, duration, equipment preference, or constraints have changed.
3. Update the Gym map when new equipment information is discovered.
4. Generate the new session.

Profiles and history do not automatically sync across phones or browsers.

## Stage 3.1 product-flow improvements

The next product iteration should make the intended flow explicit in the interface:

- Show onboarding automatically when no saved profile exists.
- End onboarding with **Create my first workout**.
- Save the active workout locally.
- Restore the same active workout after refresh or reopening the site.
- Replace **Generate workout** with **Start today's workout** when no active session exists.
- Replace it with **Resume workout** when an unfinished session exists.
- Add a separate **New workout** action with a confirmation before discarding the active one.
- Keep **Rotate** as the normal way to change one exercise.
- Add an end-of-workout summary and clear next-session state.
- Add a visible history screen and simple progress indicators.

## How the two-user Kraftwerk workflow works

1. Each user records whether a machine is available or unavailable.
2. Use **Data → Export all data** to download a JSON file.
3. Send that file to the repository owner.
4. The owner imports it locally, reviews the changes in **Gym**, and updates `data/gyms/kraftwerk.json` when the observations should become canonical.
5. Commit the reviewed canonical gym profile to GitHub.

There are no accounts or automatic cloud writes in this MVP.

## Data ownership

Profiles, equipment observations, preferences, and workout history remain in the browser's `localStorage`. Exported JSON files can be reviewed and imported manually.

## Run locally

Because the application uses JavaScript modules, serve the repository with a local web server rather than opening `index.html` directly.

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Validate the exercise dataset

```bash
npm run validate
```

## GitHub Pages deployment

This is a static website and does not require a build process.

1. Open **Settings → Pages**.
2. Set **Source** to **Deploy from a branch**.
3. Select branch **main**.
4. Select folder **/(root)**.
5. Save.

## Medical disclaimer

This app is a planning aid, not medical advice. Pain and injury filters reduce unsuitable suggestions but do not make an exercise medically safe for a specific person. Stop if an exercise causes pain and follow guidance from a qualified clinician or physiotherapist.

## License

PolyForm Noncommercial License 1.0.0. Personal and other noncommercial use is permitted. Commercial use is not permitted without separate permission from the copyright holder.
