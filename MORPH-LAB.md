# Oops, We Evolved!

The home page is now an interactive 3D infrastructure control room with stage-specific packet motion, a Raindrop evidence station, zoom/pan/fit camera controls and an event stream. The interface is focused on the operational simulation; the World tab has been removed. Original artwork assets remain in the repository.

## Experiments

Supply your own incident brief. Its first nonempty line is the expected headline. The local archive stores this source; verification compares the actual tool output against that headline. This is a bounded retrieval experiment, not an open-ended chatbot.

Both choices execute local tool implementations through the real harness; neither supplies a mock report.

- **Primary outage**: the uplink throws, the archive returns the correct headline, and requirements verification can approve recovery.
- **Corrupt fallback**: the uplink throws, the archive responds with the wrong headline. The tool response succeeds but requirements fail; requirements verification rejects the candidate and saves nothing.

Changing the selector does not change the backend or an existing recorded report. Run Mission applies the selected fault to a new execution.

## Operator behavior

- **Run Mission** posts to `/api/cycle`, executing the existing harness and configured integrations. Each mission begins from the selected failure scenario and creates a new approved version when successful.
- **Replay Execution** plays the current in-session report without another backend request. Pause freezes the packets and timeline. Step advances one stage. Stage selection and playback speed affect only the view. Future results stay queued until their replay stage.
- **Reset View** rewinds the visualization and selects the agent. It keeps the report, resets the camera and does not delete persistence.
- **Inspect Evidence** opens the recorded seven backend steps, including Raindrop event ID/delivery, proposal source/configuration, requirements verification tests, persistence readback and rerun. Download exports the same report as JSON.
- Select map infrastructure with a pointer, Tab then Enter, or Space to inspect its role. The operator inspector includes equivalent buttons for mobile. Follow execution focus highlights each stage actor; selecting infrastructure turns automatic focus off.
- **3D Orbit** uses WebGL geometry: drag to rotate, scroll to zoom, Shift-drag to pan. Rotation, zoom, Fit and Auto orbit affect only the camera. **Blueprint** provides a 2D view and is the fallback if WebGL is unavailable.
- Drag the blueprint map to pan. Zoom in/out changes camera scale; Fit map resets framing. These controls never change the harness.

The six UI stages map to backend steps 1, 2, 3, 4, 5 and 7. Persistence (step 6) appears in the operator console and evidence inspector. The backend returns a complete report; the animation is labeled **execution replay**, never presented as streamed events.

## Honest integration status

`orbital_uplink` and `ground_archive` are existing local scenario implementations. The unavailable tool actually throws, and the fallback actually executes; neither represents a remote communications service. No fabricated run or canned report is supplied by the UI.

Without `MONGODB_URI`, persistence uses the existing local file store. Without a Raindrop key, evidence is captured locally. Live delivery and MongoDB are shown only from report fields. OpenAI remains optional; the deterministic proposer is identified when used. Repository tests and requirements verification runtime requirements checks are different validations.

All report strings and API error responses redact configured integration secrets before they reach the browser. Keep credentials in environment variables; never commit them.

## Local preview

```sh
npm ci
npm run dev -- --port 3033
```

Open http://localhost:3033. Configure integrations using the existing `.env.example` when credentials are available.

## Validation

- 17 harness, evidence-redaction, replay-gating and rejection tests pass.
- Lint, TypeScript and production build pass.
- Chrome against the production build: real Run produces recovery; the corrupt fallback is rejected; evidence opens/closes and exports the actual report; Replay and Reset do not issue a new POST; zoom/pan/fit, packet freeze/resume, stage focus, reduced motion and keyboard inspection work.
- Mobile at 390px: no horizontal overflow; controls and panels reflow.
- Live Raindrop/MongoDB checks were not run: no credentials in this checkout.

Screenshots are in `review/` (ready, diagnosis, mutation, recovered, rejected, evidence and mobile).

To reproduce browser verification, install Chromium with `npx playwright install chromium` and run `npm run test:browser` against a running local app. Set `MORPH_BASE_URL` for another port, `MORPH_BROWSER_PATH` for installed Chrome, and `MORPH_CAPTURE_DIR=review` to refresh screenshots.

## One-minute demo

1. Enter an incident brief, choose **Primary outage** and Run Mission. Point out the live request label, then the explicitly recorded replay.
2. Follow the red failure into Raindrop evidence, the cited event into MORPH, and requirements verification testing into the green recovered route. Pause or step to explain any stage.
3. Inspect Evidence and show the actual event ID, delivery status, configuration and persistence readback. Name the integration mode honestly.
4. Choose **Corrupt fallback** and Run Mission. Show that a responding tool still fails requirements; requirements verification rejects it and nothing is saved.
