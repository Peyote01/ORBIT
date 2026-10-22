# ORBIT
A browser-based cooperative 3D space salvage prototype for 2–4 players. Built with Three.js and an authoritative Node/WebSocket server.

**Status:** first playable source with an experimental multiplayer handheld tractor tool, not a deployed public game. Desktop keyboard and mouse. Generated primitive geometry; no purchased art.

## Run in VS Code
Install Node.js 22+, clone this repository, and check out `prototype/first-playable`. Open the repository folder in VS Code, then use its terminal:
```sh
npm install
npm start
```
Open http://localhost:3000. Start a crew, share the room code, and join from a second browser/device using the **same server URL**. A friend's localhost points to their computer, not yours. For LAN tests use the host computer's LAN IP and port 3000.

```sh
npm run check
npm test
npx playwright install chromium
npx playwright test
```

## Controls and first mission
WASD moves, click the scene to capture the mouse, Shift sprints, T equips or stows the tractor, left-click a loose crate to attach/release it (aim at its visible mesh), mouse wheel adjusts tractor distance, hold R while moving the mouse to rotate cargo, E locks an aligned crate when the cargo grid turns green, and Q/right-click releases the tractor. Existing E pickup/Q drop remains available when not attached. V scans, F fires a sidearm, Space/Ctrl moves vertically during EVA, Esc releases the cursor/closes panels. Captain is marked ★.

1. Walk to BOARD, press E, accept a free contract.
2. Captain uses NAV to travel. Everyone must be aboard with no carried crates.
3. SCANNER: lock grapple; drag the scene to rotate; V scans one of five categories. Compare manufacturer records. Three matches are high confidence; five are certain.
4. Exit the starboard rear airlock (right side near the back), move around the ship and approach the wreck. E recovers a crate.
5. Guide it toward the starboard rear airlock with the tractor. Follow the physical doorway, position the crate inside the visible cargo bays, rotate until the placement indicator turns green, and press E to secure it. You can also use the original E pickup / CARGO auto-stow method. Cargo shape, support and overlap rules still matter; volume alone is insufficient.
6. Return all crew aboard. Captain may Crunch: remaining contents are destroyed; the wreck becomes Scrap.
7. Navigate to Market A or B. Compare prices, sell, refuel, repair, and upgrade.
8. Pay a quota after seven travel days. One extension per ship grants seven more days for the same payment. Insufficient funds at settlement repossess the ship and reset cash to 1,000.

## Public hosting
Deploy the **entire Node application** to a host that supports long-running Node processes and WebSockets, with HTTPS and one server instance. Start command: `npm start`; service port: `PORT` (defaults to 3000); health endpoint: `/health`. Dockerfile included.

Static GitHub Pages/Netlify file hosting alone cannot run this multiplayer server. No hosting service has been provisioned by this commit. A public repository is not a playable game URL. Do not submit the repository URL as the competition's live game.

State is in memory: restarting the server resets all rooms. Empty rooms expire after five minutes; disconnected seats are held for 60 seconds. Do not scale to multiple instances without shared room routing/state. Room codes are for casual private sessions, not authentication.

## Scope and limitations
This is an intentionally small first prototype, not the full game. See [design](docs/design.md), [development plan](docs/development-plan.md), and [manual acceptance tests](docs/acceptance.md). Tests do not replace a remote two-person playtest.

## Experimental tractor branch
This feature is developed on `feature/handheld-tractor-cargo` to preserve the older prototype. To test it locally from an existing checkout:
```sh
git fetch origin
git switch feature/handheld-tractor-cargo
npm install
npm start
```
Visit http://localhost:3000 and enable Chrome graphics acceleration for smooth 3D rendering. Use a free contract, fly to a wreck, target a loose crate with the center crosshair and left-click. Server validation prevents attaching the same crate twice or moving it through other crates. The starboard rear airlock is the intended cargo entrance; large crates may be too wide for the starter hold. Beam motion uses server snapshots, so connection quality affects smoothness. New tractor code is experimental and has not received a full remote human playtest.

## Aft cargo hatch (rear loading)
The back of the ship (positive Z, opposite the bridge) has two retractable bulkhead doors and a loading apron. Press **H** near the aft switch or cargo console to toggle it; **E** at the hatch switch also works. The cargo console includes an Open/Close button. Move bulky cargo through the open rear entrance with the tractor, rotate to fit the available cargo hold, and press E when the grid preview is green. The side EVA airlock remains available for players and smaller crates. Close the rear hatch before flying to the next location. Door closure is blocked if a crate or player occupies the entrance. Cargo that exceeds the starter ship's actual hold dimensions remains oversized and cannot be secured even if it passes through the doorway.
