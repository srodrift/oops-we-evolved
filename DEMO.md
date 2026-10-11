# Oops, We Evolved! — one-minute demo

## Problem

An agent can fail when its primary API goes down. Simply switching to a responding API is unsafe if the fallback returns the wrong answer. This experiment repairs the agent's harness from failure evidence and approves the change only when it satisfies the user's task.

The operator supplies an incident brief. The mission is to retrieve its first-line headline exactly. Tools run locally: the primary throws a real error; the archive returns either the user's correct headline or a deliberately corrupt one. This is a bounded resilience experiment, not a general-purpose incident assistant.

## Narration

**0–7s:** “Oops, We Evolved! tests what happens when an agent’s API breaks. Can we repair its harness and still deliver the correct answer?”

**7–14s:** “I enter my incident brief. The agent must retrieve this exact headline from the archive.”

**14–28s:** “Run Mission executes the tools. The primary actually fails. Raindrop failure evidence drives a proposal that enables the fallback. What you see afterward is the recorded execution replay.”

**28–35s:** “Verification compares the tool’s output with my source. The approved harness is saved, read back, and used for a fresh successful run.”

**35–42s:** “We can inspect the actual Raindrop event ID, error, changed configuration, tests, and MongoDB Atlas persistence result.”

**42–55s:** “Now I corrupt the fallback. It responds, but its answer is wrong. The same verification rejects the repair and does not save it.”

**55–60s:** “That’s Oops, We Evolved!—agent recovery with evidence before approval.”

## Recording

The provided MP4 and WebM are silent browser recordings with explanatory captions. Read the narration over it, or record the working app yourself. Rotate and zoom the 3D view, enter a brief, run Primary outage, inspect evidence, then run Corrupt fallback.

The updated recording uses live Raindrop terminal-event delivery and MongoDB Atlas persistence, verified by the strict integration check. The proposer is deterministic and tools are controlled local implementations. See deliverables/live-sponsor-proof.json for independent database readback and rejection evidence. Raindrop dashboard indexing and separately batched telemetry were not independently verified.

Re-record with `node scripts/record-demo.mjs` against the local server on port 3034. Set `MORPH_RECORD_LIVE=1` to require verified live integration reports. Set `MORPH_BASE_URL` or `MORPH_BROWSER_PATH` if needed. Install Playwright's ffmpeg once using `npx playwright install ffmpeg`.
