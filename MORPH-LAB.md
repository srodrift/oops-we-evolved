# MORPH LAB

The home page is now an interactive isometric infrastructure laboratory. The original Spark and Pulse artwork is preserved in the World view; Pulse requires ATLAS acceptance, a saved harness and a successful rerun.

## Operator behavior

- **Run Mission** posts to `/api/cycle`, executing the existing harness and configured integrations. Each mission begins from the original failure scenario and creates a new approved version when successful.
- **Replay Execution** plays the current in-session report without another backend request. Pause, stage selection and playback speed affect only the view.
- **Reset View** rewinds the visualization and selects NOVA. It keeps the report and does not delete persistence.
- **Inspect Evidence** opens the recorded seven backend steps, including Raindrop event ID/delivery, proposal source/configuration, ATLAS tests, persistence readback and rerun. Download exports the same report as JSON.
- Select map infrastructure with a pointer, Tab then Enter, or Space to inspect its role.

The six UI stages map to backend steps 1, 2, 3, 4, 5 and 7. Persistence (step 6) appears in the operator console and evidence inspector. The backend returns a complete report; the animation is labeled **execution replay**, never presented as streamed events.

## Honest integration status

`orbital_uplink` and `ground_archive` are existing local scenario implementations. The unavailable tool actually throws, and the fallback actually executes; neither represents a remote communications service. No fabricated run or canned report is supplied by the UI.

Without `MONGODB_URI`, persistence uses the existing local file store. Without a Raindrop key, evidence is captured locally. Live delivery and MongoDB are shown only from report fields. OpenAI remains optional; the deterministic proposer is identified when used. Repository tests and ATLAS runtime requirements checks are different validations.

All report strings and API error responses redact configured integration secrets before they reach the browser. Keep credentials in environment variables; never commit them.

## Local preview

```sh
npm ci
npm run dev -- --port 3033
```

Open http://localhost:3033. Configure integrations using the existing `.env.example` when credentials are available.

## Validation

- Existing harness tests plus evidence-redaction test pass.
- Lint, TypeScript and production build pass.
- Chrome: Run produces recovery, evidence opens/closes, Replay and Reset do not issue a new POST, infrastructure selection works, World returns to Spark on rewind.
- Mobile at 390px: no horizontal overflow; controls and panels reflow.
- Live Raindrop/MongoDB checks were not run: no credentials in this checkout.

Screenshots are in `review/` (ready, recovered, evidence and mobile).
