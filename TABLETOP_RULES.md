# Online bluffing games

## Rulesets

- **Coup:** base game, 2–6 players, three copies of five roles. All seven actions,
  character challenges, challengeable blocks, proof replacement, chosen influence
  loss, Ambassador exchange, assassination double loss, refund after a successfully
  challenged action, mandatory coup at ten coins, and the two-player starting coin
  exception. The previous winner starts the next game when still present.
- **Liar's Deck:** classic Liar's Bar card mode, 2–4 players. Six each of A/K/Q,
  two Jokers, five cards per player, random table rank, face-down plays of 1–3 cards.
  Only the next participant with cards can challenge the last play. Empty hands
  are skipped; the final holder automatically challenges the previous play.
  When all hands run out, the next round is dealt without a penalty. A fixed
  hidden losing position in six slots persists throughout the match. One penalty advances
  one slot. After resolution, redeal to the survivors.
- **Liar's Dice:** classic Liar's Bar dice mode, 2–4 players, five dice each.
  Ones are not wild. Raise quantity, or keep quantity and increase the face.
  A challenge succeeds only when actual count is below the bid. A Spot On call
  succeeds only when the count is exactly equal: then every other survivor takes
  one penalty; otherwise the caller takes one penalty. Two penalties eliminate
  a player. Survivors reroll each round.

## Online adaptations

The table waits for explicit responses rather than using a response timer. Coup
claims and blocks require everyone eligible to pass or a player to challenge;
once someone challenges that claim, the proof phase takes priority. Liar rounds
show the result until every survivor is ready. The loser starts the next Liar
round when still alive; otherwise the next living seat starts. Elimination risk
is shown as a neutral result, without weapon or poison animations. Each match
winner receives one hub point. Aborted matches award none. Host can return to the
lobby, fill bots, or close the series through the existing hub controls.

`tabletop-engine.js` validates phase, actor, values, and revision before committing
an atomic transition. `view()` excludes opponent hidden cards, dice, deck order,
and losing-slot positions. Bots receive only that same redacted view. Public
history records claims and revealed information, never hidden discards.

This follows the hub's existing shared, client-authoritative Firebase room model.
Redaction protects normal UI and bot inputs; it does not protect room data from a
participant inspecting network state. Server-enforced secrecy is a separate change.

## References

- Indie Boards & Cards, Coup rulebook: https://www.qugs.org/rules/r131357.pdf
- Curve Animation, Liar's Bar rules on its Steam page:
  https://store.steampowered.com/app/3097560/Liars_Bar/
- Curve Animation, Spot On update (three choices after a bid):
  https://store.steampowered.com/news/app/3097560/view/4532402556909912247
- Card counts and classic edge cases cross-checked against the in-game rules
  transcribed at https://www.liarsbar.net/g/rules-summary-for-deck-dice

## Checks

`node --test tests/*.test.js` covers rule boundaries, bot matches, private-view
redaction, stale commands, hub creation, lobby settings, and starting each game.
