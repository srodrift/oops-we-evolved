# Oops, We Evolved!

A self-improving agent harness. the agent runs a task, a configured tool really throws, Raindrop evidence records that failure, MORPH proposes a new harness, requirements verification tests it, and the approved version is what the next run loads.

## The cycle

1. **the agent** executes “retrieve the arena status brief” with harness v1.
2. **orbital_uplink** is invoked and throws `ToolUnavailableError`. The executor does not skip the call or swap tools on its own.
3. **Raindrop evidence** captures that throw as one Raindrop failure event: a tool span (`name`, `input`, `error`, `durationMs`) and a `selfDiagnose` diagnostic (`eventId`, `description`, `category`, `source`, `sentiment`). The diagnosis is read from that event. With `RAINDROP_API_KEY` or `RAINDROP_WRITE_KEY`, the official `raindrop-ai` SDK sends the same event (`begin` → `trackTool({ error })` → `selfDiagnose` → `finish`). With no key, a local adapter returns that event and nothing is sent. Diagnosis is never skipped.
4. **Harness repair** cites that event (id, span, error) as the reason it disables the span's tool, enables the other available `fetch_brief` tool, names that fallback in a rule, adds the live-fallback guardrail, and retains the failure in context. An OpenAI model may write the proposal when `OPENAI_API_KEY` is set. The cause is still copied from the Raindrop event. A deterministic proposer covers the demo.
5. **requirements verification** reruns the task and accepts the proposal only when the mutation cites that same event and the rerun no longer throws the span's error and returns the expected headline.
6. The approved version is stored in MongoDB Atlas when `MONGODB_URI` is set, otherwise in `data/harness-versions.json`.
7. **the agent** loads that version in a fresh read and returns `GROUND ARCHIVE // ARENA NOMINAL`.

## Run it

```bash
npm install
npm test
npm run cycle
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to operate **Oops, We Evolved!**, the interactive 3D infrastructure control room. Enter your incident brief, choose **Primary outage** or **Corrupt fallback** and press **Run Mission** to execute the real harness. Recorded results replay through six stages; zoom, pan, pause, step, inspect evidence and compare the configuration changes. **Replay Execution** and **Reset View** never call the backend. See [MORPH-LAB.md](MORPH-LAB.md) for controls, verification and the short demo sequence.

`npm run cycle` prints the same report as JSON. Exit code is 0 when the second the agent run succeeds.

Copy `.env.example` to `.env.local` only if you want Atlas, Raindrop, or OpenAI. The cycle, the tests, and the UI all run with no keys.

## What keys change

| Variable                                   | When unset                                                           | When set                                                                     |
| ------------------------------------------ | -------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `MONGODB_URI`                              | Versions go to `data/harness-versions.json`                          | Versions go to `morph.harness_versions` via the official MongoDB Node driver |
| `RAINDROP_API_KEY` or `RAINDROP_WRITE_KEY` | The same failure event is held locally and still drives the mutation | That event is sent to Raindrop                                               |
| `OPENAI_API_KEY`                           | Deterministic proposer                                               | `gpt-4o-mini` may propose; invalid JSON falls back                           |
| `ELEVENLABS_API_KEY`                       | Unused                                                               | Unused                                                                       |

`.env`, `.env.local`, and other `.env*` files are gitignored. `.env.example` is the only env file that belongs in git, and it has empty values.

## Tests

`npm test` runs the cycle with a temp file store and the local Raindrop adapter. It does not use the network or any API key. It checks that v1 throws from a real `orbital_uplink` call, Raindrop evidence diagnoses that Raindrop span, the repair’s tool swap cites the span (including a decoy span that is not `orbital_uplink`), requirements verification rejects a proposal that ignores the span or still enables it, a second store instance loads version 2, and the rerun no longer throws that error.

## Browser verification

Start the app, then run `npm run test:browser`. Install Chromium once with `npx playwright install chromium`, or set `MORPH_BROWSER_PATH` to an installed Chrome executable. `MORPH_BASE_URL` defaults to `http://localhost:3033`; `MORPH_CAPTURE_DIR=review` saves screenshots. The browser check executes real recovery and rejection experiments, verifies replay isolation, camera controls, frozen packet motion, reduced motion, evidence download, keyboard navigation, mobile layout and explicit HTTP-error handling.

Deployment remains separate from the review branch.

## Live sponsor proof

Configure `MONGODB_URI` and `RAINDROP_API_KEY` (or `RAINDROP_WRITE_KEY`) in the gitignored `.env.local`, then run `npm run verify:sponsors`. This loads Next's environment configuration and requires live sponsor credentials; local adapters cannot pass. It runs recovery and corrupt-fallback rejection, checks Raindrop terminal-event acknowledgement, reads the saved harness through a new MongoDB client, verifies the same event ID survived persistence, and verifies rejection does not create a new version.

A successful run writes redacted `deliverables/live-sponsor-proof.json`. Match the event ID in the Raindrop dashboard to confirm remote visibility. Terminal-event acknowledgement does not independently establish dashboard indexing or separately batched tool/signal delivery. The tools themselves remain controlled local implementations. Restart the demo after changing credentials.
