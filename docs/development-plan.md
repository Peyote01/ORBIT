# Development plan to October 30, 2026
## Architecture
Three.js ES modules render primitive assets. One Node.js process serves static files and a WebSocket room server. Simulation runs at 20Hz, snapshots at 10Hz. Server validates movement bounds, proximity, captain authority, money, cargo geometry and encounter timing. Action IDs suppress repeated purchases within a bounded reconnect session cache. No database in this prototype.

Why this stack: a compact browser build and one deployable service reduce setup dependencies before the deadline. Unity/UE5 remain possible later, but changing engines now would require redoing networking, builds and browser delivery.

## Milestones
- October 20–22: repository, rule tests, connection tests, first 3D client; run from VS Code and repair critical defects.
- October 23–24: complete two remote-player salvage → market → quota run. Fix collision, recovery, crew separation and confusing controls.
- October 25: deploy single-instance HTTPS/WebSocket server; verify external room join and reconnect. Hosting account choice/setup remains required.
- October 26–27: improve five visible identification components, cargo bay geometry, onboarding and quota deadline enforcement. Tune free contracts to sustain early progression.
- October 28: four-person session, weak-connection and reset tests; verify police timers and shielding.
- October 29: freeze new features; fix blockers, verify clean-browser access and submission URL.
- October 30: final remote smoke test and submit before the stated competition deadline. Recheck the program's official timezone and submission requirements.

## Release gates
Two independent physical devices on different networks can create/join the same room. New players complete a run from written in-game instructions. No duplicated money/items. Quota success, extension and repossession are demonstrated. Public URL remains reachable while creator's computer is off. Deploy restart behavior is disclosed.

## Asset workflow
Start with the procedural meshes included here. Use Blender for low-poly modular ship parts and export glTF/GLB for Three.js. Create five legible model signatures, three wreck silhouettes, a consistent crate set and console icons before decorative art. Keep an asset license ledger; only ship assets whose licenses permit redistribution in the game. Do not add unlicensed reference-game models. Asset selection and sourcing have not been performed by this commit.

## Deferred
Detailed ship destruction, persistent economy, large AI populations, procedural wreck interiors, full ship-to-ship maneuvering, voice, mobile input, advanced animation and photorealistic assets.
