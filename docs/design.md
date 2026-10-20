# ORBIT — prototype design
## Goal
A chaotic 15–25 minute cooperative salvage run: the crew argues over clues, cargo space, fuel and deadlines while sharing one vulnerable ship and bank account. No realistic orbital mechanics.

## Established rules
- 2–4 people join a room code, walk around a shared ship and share 1,000 starting credits.
- Contract board offers free and paid salvage rights, including expensive contracts visible from the start. Multiple accepted jobs remain available. Coordinate-only leads and destroyed NPC ships have unauthorized salvage.
- Grapple and rotate derelicts; scan thrusters, doors, paint, landing gear and brand. Compare in-game manufacturer records: at least three matching components support identification, all five give certainty. Models suggest cargo and value, not guaranteed manifests.
- Carry salvage physically, then secure crates on a cubic-meter grid. Check dimensions, overlap, support and height. Largest permitted crate is 4×4×8m (128m³). A 2×2×1 crate occupies 4m³.
- Captain's Crunch destroys all contents left inside and converts the wreck into Scrap, with shutters hiding conversion.
- Two markets change prices with in-game days. Fuel, repairs, weapons, armor, grapple, cargo shielding and bigger ships compete with quota cash.
- Departure after salvage may trigger raiders or police. Police give 20 seconds warning, scan for five seconds, then offer a fine or confrontation. Fighting gives 30 seconds before distress transmission and reinforcements.
- NPC destruction restores a starter ship and removes upgrades, retaining credits less outstanding fine. Quota repossession instead fully restarts at 1,000 credits.
- Quota lasts seven travel days. First station departure in each quota is free. Subsequent station departures and departures from wrecks where salvage was taken count a day. Unfinished wrecks cannot be farmed for free departures after taking cargo.
- Quota is checked on arrival. At a market, players sell before settlement. If arriving at a wreck on the deadline, use the extension or rescue tow. This arrival/settlement policy is a prototype decision requiring playtest approval.
- One extension per ship adds seven days to the SAME quota. Prototype exposes this when payment is due. Buying a new ship grants its own extension.
- Shielding is per bay and protects only contents stored there. Detection odds are 0.5^level, rolled per bay per inspection. Initial conversion halves volume; further upgrades never shrink it further.

## Prototype tunings, not final design
Initial quota 1,500; later quotas grow 35%, rounded to 50. Starting two holds total 64m³. Ship range costs 10–35 fuel. Free personal wrecks lead into small corporate and bank wrecks. Three model archetypes, eight cargo types, one enemy per hazardous wreck. Crew respawn at medbay and drop carried cargo. Sidearms are supplied; starter ship has no cannon. Shield cap six, ship-size cap two. Installed upgrades transfer on bigger-hull purchase.

## Known approximations to improve
- Exterior geometry currently varies mainly in paint and thrusters. All five clue categories work through scanning and the catalog, but doors, landing gear and branding need distinct visible meshes/decals before claiming the complete visual identification mechanic.
- Rotation is constrained while crew are outside. Wrecks use open decks and simplified collision; avatars can intersect cargo. Inventory packing is authoritative but crates are not rigid-body simulations.
- Larger holds expand logically within the same prototype deck; ship art/interior must be resized for full-size crates. Biggest 128m³ crate is a capacity stress case.
- Rival destruction spawns extra illegal crates; it does not yet create a separate fully explorable rival wreck.
- Multi-million contracts are visible as progression placeholders; current cargo prices do not balance their cost. Do not buy these in a normal prototype run.
- No persistence, accounts, voice chat, mobile touch controls or production moderation. Escape/death and rescue-tow economics need balancing.
- Deadline enforcement currently gates travel and requires an explicit settlement choice. Add a defined automatic payment/failure trigger after market unloading, so crews cannot indefinitely defer settlement.
These limitations are tracked honestly rather than represented as finished features.

## Dependencies and priority
Shared game state → room membership/input authority → ship locomotion → contracts/travel → grapple/scan → salvage/cargo grid → markets/fuel → quota/reset → inspections/combat → upgrades → hosted two-device acceptance.
Build every economic operation on server state. Render snapshots in the browser. Keep prices, rights, deadlines and collisions testable without WebGL.
