# Mobile-first Workout Recommendation App

A mobile-first, static workout recommender for hypertrophy training. It is designed for a very small group of users, runs entirely in the browser, stores personal data locally, and can be hosted free on GitHub Pages.

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

## GitHub Pages

This repository contains a Pages deployment workflow.

1. Open **Settings → Pages**.
2. Set **Source** to **GitHub Actions**.
3. Open the **Actions** tab and allow the initial deployment to complete.

Expected URL:

`https://dataraul.github.io/Mobile-first-workout-recommendation-app/`

## How the two-user Kraftwerk workflow works

1. Each user records whether a machine is available or unavailable.
2. Use **Data → Export all data** to download a JSON file.
3. Send that file to the repository owner.
4. The owner imports it locally, reviews the changes in **Gym**, and updates `data/gyms/kraftwerk.json` when the observations should become canonical.
5. Commit the reviewed canonical gym profile to GitHub.

There are no accounts or automatic cloud writes in this MVP.

## Data ownership

Profiles, equipment observations, preferences, and workout history remain in the browser's `localStorage`. Exported JSON files can be reviewed and imported manually.

## Medical disclaimer

This app is a planning aid, not medical advice. Pain and injury filters reduce unsuitable suggestions but do not make an exercise medically safe for a specific person. Stop if an exercise causes pain and follow guidance from a qualified clinician or physiotherapist.

## License

PolyForm Noncommercial License 1.0.0. Personal and other noncommercial use is permitted. Commercial use is not permitted without separate permission from the copyright holder.
