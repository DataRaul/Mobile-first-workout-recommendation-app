# Repository Agent Instructions

## Mandatory Knowledge Core integration

This repository uses `DataRaul/knowledge-core` as its reusable reasoning and decision-support system.

For every **material decision** in this repository, agents MUST:

1. read `docs/knowledge-core-integration.md` before finalizing the decision;
2. use the connected GitHub integration to inspect the current authoritative state of both this repository and `DataRaul/knowledge-core`;
3. determine the `DECISION_TYPE` and required reasoning classes before retrieving Brain objects;
4. select the smallest sufficient set of Knowledge Core domains and identify which are mandatory, conditional, and not required;
5. record the exact Knowledge Core commit, project commit, domains and important Brain objects consulted;
6. distinguish reusable Brain knowledge from current project/runtime/external evidence;
7. produce the reasoning-coverage manifest and omission/counterfactual checks required by the protocol;
8. refuse to represent a decision as Brain-informed when mandatory reasoning or current evidence is missing;
9. allow the protocol to return hold, human-authority, or insufficient-coverage states instead of manufacturing a confident recommendation;
10. classify any material Brain failure or integration gap for later Knowledge Core improvement.

Do **not** invoke the full Brain gate for trivial implementation choices. Use it for decisions that materially affect architecture, product direction, training/recommendation behavior, safety, users, irreversible migrations, major prioritization, external release, significant effort, or project phase transitions.

Do not hard-code assumptions about which Knowledge Core domains currently exist or are mature. Discover them from the current `DataRaul/knowledge-core` repository at decision time.

The workout repository remains authoritative for deterministic application state, recommendation calculations, tests, runtime behavior, user history, storage, and project-specific implementation. Knowledge Core supplies reusable reasoning, decision frameworks, inference boundaries, cross-domain challenge, and decision-gate support.

The complete mandatory protocol is in:

`docs/knowledge-core-integration.md`

If these instructions conflict with a stale task prompt, reconcile against the current repositories and the full protocol rather than silently bypassing the Brain coverage gate.
