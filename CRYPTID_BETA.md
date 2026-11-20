# Cryptid Beta

A 2–5 player deduction mode integrated with the existing Party Game Hub. Create a
Cryptid room, select the player count, then add individual bots or fill the
remaining seats in the lobby. Original has eleven fixed stages plus Random;
Deep Sea has six fixed stages and Volcano has three. Fixed layouts receive
fresh private clues each game. Both creation and
lobby screens show selectable previews. Player counts use 2/3/4/5-player buttons;
maps are selected directly with stage cards. The host must save lobby changes before
starting; guests see the saved selection. Only the host can manage settings. Bots
are marked in the player list; only connected human participants may host.

Mouse wheel zoom is anchored at the pointer (75–300%). Left-button dragging
pans the board; a short click selects a cell, while dragging suppresses selection.
Large shape legends distinguish player squares/discs from map symbols. Player
markers carry seat numbers, and a selected legal placement has a preview.

The original procedural 108-cell hex map uses five terrains, animal territories,
and six structures. Each participant receives a distinct clue. The generator
accepts a puzzle only when all clues intersect at exactly one cell. Readiness,
two clockwise rounds of initial negative markers, questions, sequential searches,
extra disclosures, results, and cumulative scoring are supported. A win awards
one point; a host-aborted game awards none. Return to the lobby for another map.


Original games for 3–5 players use 51 clue patterns (23 positive and 28 exclusions).
Deep Sea and Volcano have 55 themed patterns. Two-player games add five positive
single-terrain clues to their theme pool, then enumerate valid pairs to guarantee
a unique answer on every fixed stage. This two-player adaptation is described in
the guide. Stage badges count eligible unordered sets for the selected player count.
There is no clue-set selector; legacy room preferences are ignored and cleared
when starting a new round. The exclusions include
not in one terrain, not in either of two terrains, and outside the terrain,
animal or structure distance bands. Negative distance clues require at least
N + 1 hexes from every matching target; distance zero is included in the excluded
band. Only nontrivial clues with 6–90 allowed cells can be dealt, and the joint
solution must still be unique. A button opens a scrollable dialog listing every clue type in the game’s
full pool. This is the public pool, never a list of players’ assigned private clues.

Existing discs are skipped during search responses. The search stops on the
first negative response, without revealing later responses. Searching a cell
with the searcher's disc requires another positive disclosure. If there is no
legal cell for an extra disclosure, Beta records that exception and skips that
step. This is a digital edge-case rule, not an additional penalty.

The host runs bot actions and sequential search reveals using RTDB transactions.
Each command checks the game number, revision, phase and actor to reject stale or
duplicate submissions. Bot inference receives only its own clue and public
markers; it does not read the solution or other players' assigned clues. Bots
have two difficulties, selected for the whole table before starting and frozen
in the round state. Normal retains the original random legal placements and
occasional early search. Hard chooses placements that reveal less about its clue,
weights possible answer cells from opponent clue hypotheses, and evaluates the
expected answer entropy after both outcomes of every legal question, including
questions outside its own candidate cells. It searches when one candidate remains,
the highest estimated probability reaches 85%, or no useful question remains.
These are probability estimates from public evidence, not knowledge of the answer.
Ties still use randomness. A disconnected human's seat and clue
are retained and their manual action waits for reconnection. The host can abort
if a participant cannot return. Host reassignment uses the hub's existing logic.

## Beta privacy boundary

This release uses the hub's existing client-authoritative shared room. Clues are
hidden in the user interface, not protected from inspecting the room's data.
The host is not a trusted server. Use with trusted friends for testing, not as
an anti-cheat implementation. No new Firebase rules, credentials, authentication
configuration, or server deployment are required by this release. A later
production version needs authenticated private clue paths and server-authoritative
puzzle generation and move validation. The lobby includes this disclosure.

## Files

- `cryptid-engine.js`: pure puzzle generation, rules and bot inference; also
  exports a CommonJS module for tests.
- `cryptid.js`: room, lobby, SVG board, notes, controls and result integration.
- `index.html`, `script.js`, `style.css`: existing hub entry points.

## Verification

Run `node --test tests/cryptid.test.js`. This checks 240 generated puzzles,
90 complete simulated games, marker honesty and permanence, unique solutions,
search stop order, existing-disc costs, score idempotency, revision guards,
reconnection-compatible seats, host aborts and bot permissions/caps.
