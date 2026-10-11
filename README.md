# Oops, We Evolved!

A self-improving agent harness. NOVA runs a task, a configured tool really throws, GLITCH records that failure, MORPH proposes a new harness, ATLAS tests it, and the approved version is what the next run loads.

## The cycle

1. **NOVA** executes “retrieve the arena status brief” with harness v1.
2. **orbital_uplink** is invoked and throws `ToolUnavailableError`. The executor does not skip the call or swap tools on its own.
3. **GLITCH** captures that throw as one Raindrop failure event: a tool span (`name`, `input`, `error`, `durationMs`) and a `selfDiagnose` diagnostic (`eventId`, `description`, `category`, `source`, `sentiment`). The diagnosis is read from that event. With `RAINDROP_API_KEY` or `RAINDROP_WRITE_KEY`, the official `raindrop-ai` SDK sends the same event (`begin` → `trackTool({ error })` → `selfDiagnose` → `finish`). With no key, a local adapter returns that event and nothing is sent. Diagnosis is never skipped.
4. **MORPH** cites that event (id, span, error) as the reason it disables the span's tool, enables the other available `fetch_brief` tool, names that fallback in a rule, adds the live-fallback guardrail, and retains the failure in context. An OpenAI model may write the proposal when `OPENAI_API_KEY` is set. The cause is still copied from the Raindrop event. A deterministic proposer covers the demo.
5. **ATLAS** reruns the task and accepts the proposal only when the mutation cites that same event and the rerun no longer throws the span's error.
6. The approved version is stored in MongoDB Atlas when `MONGODB_URI` is set, otherwise in `data/harness-versions.json`.
7. **NOVA** loads that version in a fresh read and returns `GROUND ARCHIVE // ARENA NOMINAL`.

## Run it

```bash
npm install
npm test
npm run cycle
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and press **Run**. One press replays the whole cycle. NOVA shows the thrown error. GLITCH shows the Raindrop span that caused the change. MORPH cites that event beside harness v1 and the approved version. ATLAS shows the rerun no longer hits that span.

`npm run cycle` prints the same report as JSON. Exit code is 0 when the second NOVA run succeeds.

Copy `.env.example` to `.env.local` only if you want Atlas, Raindrop, or OpenAI. The cycle, the tests, and the UI all run with no keys.

## What keys change

| Variable | When unset | When set |
| --- | --- | --- |
| `MONGODB_URI` | Versions go to `data/harness-versions.json` | Versions go to `morph.harness_versions` via the official MongoDB Node driver |
| `RAINDROP_API_KEY` or `RAINDROP_WRITE_KEY` | The same failure event is held locally and still drives the mutation | That event is sent to Raindrop |
| `OPENAI_API_KEY` | Deterministic proposer | `gpt-4o-mini` may propose; invalid JSON falls back |
| `ELEVENLABS_API_KEY` | Unused | Unused |

`.env`, `.env.local`, and other `.env*` files are gitignored. `.env.example` is the only env file that belongs in git, and it has empty values.

## Tests

`npm test` runs the cycle with a temp file store and the local Raindrop adapter. It does not use the network or any API key. It checks that v1 throws from a real `orbital_uplink` call, GLITCH diagnoses that Raindrop span, MORPH's tool swap cites the span (including a decoy span that is not `orbital_uplink`), ATLAS rejects a proposal that ignores the span or still enables it, a second store instance loads version 2, and the rerun no longer throws that error.

## Later

Phase 2, not in this pass: three animated characters, ElevenLabs voices, and a game UI. Deployment is also deferred.
