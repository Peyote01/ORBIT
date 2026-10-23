# ORBIT — prototype design
## Goal
A chaotic 15–25 minute cooperative salvage run: the crew argues over clues, cargo space, fuel and deadlines while sharing one vulnerable ship and bank account. No realistic orbital mechanics.

## Established rules
- 2–4 people join a room code, walk around a shared ship and share 1,000 starting credits.
- Contract board offers free and paid salvage rights, including expensive contracts visible from the start. Multiple accepted jobs remain available. Coordinate-only leads and destroyed NPC ships have unauthorized salvage.
- Grapple and rotate derelicts; scan thrusters, doors, paint, landing gear and brand. Compare in-game manufacturer records: at least three matching components support identification, all five give certainty. Models suggest cargo and value, not guaranteed manifests.
- Manipulate all salvage with handheld tractor beams (no hand-carry/auto-stow system), then secure crates on a cubic-meter grid. Check dimensions, overlap, support and height. Largest permitted crate is 4×4×8m (128m³). A 2×2×1 crate occupies 4m³.
- Captain's Crunch destroys all contents left inside and converts the wreck into Scrap, with shutters hiding conversion.
- Two markets change prices with in-game days. Fuel, repairs, weapons, armor, grapple, cargo shielding and bigger ships compete with quota cash.
- Departure after salvage may trigger raiders or police. Police give 20 seconds warning, scan for five seconds, then offer a fine or confrontation. Fighting gives 30 seconds before distress transmission and reinforcements.
- NPC destruction restores a starter ship and removes upgrades, retaining credits less outstanding fine. Quota repossession instead fully restarts at 1,000 credits.
- Quota lasts seven travel days. First station departure in each quota is free. Subsequent station departures and departures from wrecks where salvage was taken count a day. Unfinished wrecks cannot be farmed for free departures after taking cargo.
- Quota is checked on arrival. At a market, players sell before settlement. If the quota becomes due while at a wreck, the crew can still return to Market A or B to sell cargo; new wreck travel is restricted until settlement or extension. Rescue tow remains an emergency option. This arrival/settlement policy is a prototype decision requiring playtest approval.
- One extension per ship adds seven days to the SAME quota. Prototype exposes this when payment is due. Buying a new ship grants its own extension.
- Shielding is per bay and protects only contents stored there. Detection odds are 0.5^level, rolled per bay per inspection. Initial conversion halves volume; further upgrades never shrink it further.

## Prototype tunings, not final design
Initial quota 1,500; later quotas grow 35%, rounded to 50. Starting two holds total 64m³. Ship range costs 10–35 fuel. Free personal wrecks lead into small corporate and bank wrecks. Three model archetypes, eight cargo types, one enemy per hazardous wreck. Crew respawn at medbay and drop carried cargo. Sidearms are supplied; starter ship has no cannon. Shield cap six, ship-size cap two. Installed upgrades transfer on bigger-hull purchase.

## Known approximations to improve
- Exterior geometry currently varies mainly in paint and thrusters. All five clue categories work through scanning and the catalog, but doors, landing gear and branding need distinct visible meshes/decals before claiming the complete visual identification mechanic.
- Rotation is constrained while crew are outside. Wrecks use open decks and simplified collision; avatars can intersect cargo. Tractor cargo-grid packing is authoritative and may auto-tip a crate 90 degrees into a compatible bay; crates are not rigid-body simulations.
- Larger holds expand logically within the same prototype deck; ship art/interior must be resized for full-size crates. Biggest 128m³ crate is a capacity stress case.
- Rival destruction spawns extra illegal crates; it does not yet create a separate fully explorable rival wreck.
- Multi-million contracts are visible as progression placeholders; current cargo prices do not balance their cost. Do not buy these in a normal prototype run.
- No persistence, accounts, voice chat, mobile touch controls or production moderation. Escape/death and rescue-tow economics need balancing.
- Deadline enforcement gates new salvage travel but permits return to either market for selling, and requires an explicit settlement choice. Add a defined automatic payment/failure trigger after market unloading, so crews cannot indefinitely defer settlement.
These limitations are tracked honestly rather than represented as finished features.

## Dependencies and priority
Shared game state → room membership/input authority → ship locomotion → contracts/travel → grapple/scan → salvage/cargo grid → markets/fuel → quota/reset → inspections/combat → upgrades → hosted two-device acceptance.
Build every economic operation on server state. Render snapshots in the browser. Keep prices, rights, deadlines and collisions testable without WebGL.

## Playtest revisions — October 21
- C and the HUD Contracts button open the contract list anywhere, including EVA and transit; purchases still use the shared account and server validation.
- Room code remains visible with Copy code for invitations. Other devices need a reachable host address; localhost is only the local machine.
- Hold Shift to sprint at twice normal speed (also twice carrying speed), with 100 stamina, 25/second drain, and 20/second recovery. Exhaustion requires recovery to 25 before sprinting resumes.
- Identification is never a salvage gate. Crates may be recovered without scans, a model guess, or a grapple. Identification is planning information; model-specific doors/high-value part locations remain future work.
- Grapple remains necessary for rotating/scanning and Crunch. Hold-drag uses cursor capture; V scans during dragging. Rotation packets are limited to 20/second with immediate local preview and server acknowledgment.
- Crunch outputs largest-first Scrap crates from sizes 128, 64, 32, 16, 8, 4, 2, 1 m³. Maximum dimensions are 4×4×8m. No volume is discarded or invented. Prototype wreck yields are 16/40/160m³ by model. Output does not shrink to fit the current ship. Scrap sale value scales with volume.
