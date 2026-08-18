# Knowledge Core Integration — Mandatory Brain Use / Reasoning Coverage Gate

This project uses:

DataRaul/knowledge-core

as its reusable reasoning / knowledge system.

Use the connected GitHub integration directly.

GitHub is the source of truth.

IMPORTANT:

Having access to Knowledge Core is NOT sufficient.

A project decision must not be treated as Brain-informed merely because:

- Knowledge Core exists;
- an LLM can browse it;
- one Brain was consulted;
- a related document was retrieved;
- or the final recommendation sounds reasonable.

For every MATERIAL decision, the project must explicitly determine:

1. what decision is actually being made;
2. what classes of reasoning are required;
3. which Knowledge Core domains are mandatory;
4. which exact Brain objects were consulted;
5. what current project/external evidence is required;
6. what reasoning remains missing;
7. whether the Brain is actually qualified to answer the decision;
8. whether the decision may safely advance.

==================================================
0. CORE INVARIANT
==================================================

Use this invariant:

> Correct knowledge that is not routed into the relevant decision is operationally equivalent to missing knowledge for that decision.

And:

> Passing a narrow/local validation gate must never silently satisfy a broader decision gate.

And:

> A Brain-informed decision must prove reasoning coverage, not merely produce an answer.

==================================================
1. IDENTIFY MATERIAL DECISIONS
==================================================

Do not invoke this machinery for trivial implementation choices.

Use it for decisions that materially affect:

- money;
- production effort;
- capital;
- users;
- legal/tax exposure;
- market selection;
- product direction;
- architecture;
- irreversible migrations;
- external publication;
- trading/investment research;
- major prioritization;
- safety;
- reputation;
- significant time commitments;
- project phase transitions.

Before such a decision is made, create or resolve an explicit:

DECISION_TYPE

Examples:

- opportunity_selection
- production_entry
- market_validation
- experiment_launch
- architecture_migration
- investment_research_escalation
- paper_trading_entry
- product_launch
- legal_interpretation
- pricing_decision
- acquisition_decision

Use project-specific names where appropriate.

==================================================
2. DETERMINE REQUIRED REASONING BEFORE RETRIEVAL
==================================================

Do NOT start by searching random Knowledge Core files.

First ask:

> What kinds of reasoning would a competent multidisciplinary review require for this decision?

Map those capabilities to the smallest sufficient Knowledge Core domains.

Classify domains as:

MANDATORY
CONDITIONAL
NOT_REQUIRED

Example:

A commercial YouTube opportunity decision might require:

MANDATORY:
- youtube
- audience_demand
- business_models
- decision_frameworks
- project_execution

CONDITIONAL:
- content_operations
- content_packaging
- software_data

A Market Lab research decision may instead require:

MANDATORY:
- market
- decision_frameworks
- software_data

CONDITIONAL:
- macro_geopolitics
- project_execution
- business_models

Do not load every Brain by default.

Use the smallest coherent reasoning set.

==================================================
3. REQUIRE A REASONING COVERAGE MANIFEST
==================================================

Before a material recommendation can be treated as complete, generate a machine-readable or clearly structured manifest equivalent to:

{
  "decision_type": "...",
  "project_commit": "...",
  "knowledge_core_commit": "...",

  "mandatory_domains": [],
  "conditional_domains": [],

  "consulted_domains": [],
  "missing_mandatory_domains": [],

  "consulted_objects": [],

  "required_current_evidence": [],
  "available_current_evidence": [],
  "missing_current_evidence": [],

  "known_contradictions": [],
  "unresolved_questions": [],

  "human_authority_required": [],

  "reasoning_coverage":
      "COMPLETE | INCOMPLETE | BLOCKED",

  "decision_state": "..."
}

Persist this where repository architecture supports it.

==================================================
4. THE BRAIN MAY BLOCK BY INSUFFICIENCY
==================================================

The Brain must be allowed to return:

INSUFFICIENT_REASONING_COVERAGE

MISSING_MANDATORY_BRAIN

MISSING_CURRENT_EVIDENCE

INSUFFICIENT_SAMPLE_FOR_CLAIM

COMPARATIVE_EVIDENCE_REQUIRED

ECONOMIC_EVIDENCE_REQUIRED

LEGAL_AUTHORITY_REQUIRED

HUMAN_JUDGMENT_REQUIRED

CONTRADICTORY_EVIDENCE

DECISION_TYPE_NOT_SUPPORTED

BRAIN_NOT_MATURE_FOR_DECISION

If one of these conditions materially affects the decision, do not manufacture a confident recommendation.

==================================================
5. DISTINGUISH KNOWLEDGE FROM CURRENT EVIDENCE
==================================================

Knowledge Core contains reusable reasoning.

It does NOT automatically contain current truth about:

- markets;
- prices;
- laws;
- competitors;
- software versions;
- platform behavior;
- current demand;
- current economics;
- current geopolitical conditions;
- the project's actual runtime state.

The Brain may therefore correctly conclude:

> The methodology is known, but current evidence is required.

This is a successful Brain response.

Do not force a conclusion merely because the Brain has a relevant object.

==================================================
6. CHECK FOR REASONING OMISSION
==================================================

Before approving the recommendation, explicitly ask:

> What important category of reasoning might be entirely absent from this analysis?

Check for omissions such as:

- demand without economics;
- competition without demand;
- revenue without costs;
- average performance without distribution;
- sample size without sample relevance;
- correlation without causal boundary;
- opportunity without alternatives;
- recommendation without reversibility;
- implementation without operational risk;
- legal conclusion without jurisdiction/current authority;
- trading signal without temporal/data-leakage checks;
- growth without retention;
- production readiness without comparative market readiness.

The purpose is to detect a missing dimension, not merely errors inside dimensions already considered.

==================================================
7. CHECK LOCAL GATE VS GLOBAL DECISION
==================================================

For every project phase transition ask:

> What exactly did the previous gate establish?

Examples:

Human review passing may establish:

- semantic relevance;
- feasibility;
- qualitative repeatability.

It may NOT establish:

- market attractiveness;
- comparative opportunity;
- economics;
- durability;
- production readiness.

A technical test passing may establish:

- software correctness under tested conditions.

It may NOT establish:

- business viability;
- security;
- scalability;
- user demand.

Never promote:

LOCAL_GATE_PASS

into:

BROADER_DECISION_PASS

without explicitly evaluating the broader decision.

==================================================
8. COUNTERFACTUAL CHALLENGE
==================================================

Before a material commitment, ask:

1. What evidence would make this recommendation wrong?
2. What plausible alternative has not been investigated?
3. What assumption contributes most to the conclusion?
4. Are multiple signals actually derived from one underlying source?
5. Would we reach the same conclusion if one major evidence source disappeared?
6. Are we selecting this option because it is best, or merely because it is the one we studied?

Record material answers.

==================================================
9. RISK / REVERSIBILITY SHOULD SET THE EVIDENCE BAR
==================================================

Use the principle:

risk × cost × irreversibility
→ determines required evidence strength

A cheap, reversible experiment may proceed with weaker evidence.

A costly or difficult-to-reverse commitment requires stronger evidence.

Do not confuse:

"not fully proven"

with:

"no experiment may be run."

But equally do not confuse:

"a cheap experiment is permissible"

with:

"the opportunity has been validated."

==================================================
10. KNOWLEDGE CORE PROVENANCE
==================================================

Every Brain-assisted material decision should pin:

- exact Knowledge Core commit;
- exact domains used;
- exact important objects used;
- current project commit/state;
- external/current evidence used where relevant.

Do not say:

"the Brain says"

without making it possible to determine what the Brain actually consisted of at the time.

==================================================
11. BRAIN FAILURE DETECTION
==================================================

After completing the decision analysis, ask:

> Did Knowledge Core materially fail us during this decision?

Classify any problem as:

KNOWLEDGE_GAP
necessary reusable knowledge does not exist

MATURITY_GAP
relevant domain exists but is not mature enough

ROUTING_GAP
knowledge exists but was not selected

OBJECT_RETRIEVAL_GAP
correct domain was selected but necessary object was missed

DECISION_TYPE_GAP
the actual decision was not represented

EVIDENCE_GAP
current evidence was missing

INTEGRATION_GAP
the Brain produced the right warning but the project ignored it

AUTHORITY_GAP
human/legal/other authority was required

FALSE_COMPLETION
a smaller gate was incorrectly treated as a larger validation

NO_BRAIN_FAILURE
the Brain performed as intended

Persist material failures for later Knowledge Core retrospective analysis.

==================================================
12. FINAL MATERIAL-DECISION OUTPUT
==================================================

Before a material project transition, produce:

DECISION:
[...]

BRAIN COVERAGE:
[...]

CURRENT EVIDENCE:
[...]

MISSING REASONING/EVIDENCE:
[...]

COUNTERARGUMENT / FAILURE CONDITIONS:
[...]

REVERSIBILITY:
[...]

BRAIN FAILURE CLASSIFICATION:
[...]

FINAL STATE:
PROCEED
PROCEED_AS_CHEAP_REVERSIBLE_TEST
HOLD_FOR_EVIDENCE
HOLD_FOR_REASONING
HUMAN_DECISION_REQUIRED
REJECT

Do not allow fluent prose to substitute for this decision discipline.

==================================================
13. IMPLEMENTATION PRINCIPLE
==================================================

The objective is not to make Knowledge Core control this project.

The project remains authoritative for:

- deterministic state;
- calculations;
- tests;
- runtime behavior;
- external evidence;
- project-specific execution.

Knowledge Core supplies:

- reusable reasoning;
- decision frameworks;
- inference boundaries;
- failure detection;
- cross-domain challenge;
- decision-gate support.

The desired architecture is:

PROJECT STATE
+
CURRENT EVIDENCE
+
DECISION TYPE
↓
REQUIRED BRAIN CAPABILITIES
↓
SMALLEST SUFFICIENT KNOWLEDGE PACK
↓
REASONING COVERAGE CHECK
↓
DECISION / HOLD / HUMAN AUTHORITY
↓
PROVENANCE
↓
RETROSPECTIVE FEEDBACK

Use this protocol for every material decision in this project.
