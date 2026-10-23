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
WASD moves, click the scene to capture the mouse, Shift sprints, T equips or stows the tractor, left-click a loose crate to attach/release it (aim at its visible mesh), mouse wheel adjusts tractor distance, hold R while moving the mouse to rotate cargo, E locks an aligned crate when the cargo grid turns green, and Q/right-click releases the tractor. Hand-pickup and inventory auto-stow are disabled: all salvage uses the handheld tractor. V scans, F fires a sidearm, Space/Ctrl moves vertically during EVA, Esc releases the cursor/closes panels. Captain is marked ★.

1. Walk to BOARD, press E, accept a free contract.
2. Captain uses NAV to travel. Everyone must be aboard with no active tractor attachments.
3. SCANNER: lock grapple; drag the scene to rotate; V scans one of five categories. Compare manufacturer records. Three matches are high confidence; five are certain.
4. Exit the starboard rear airlock (right side near the back), move around the ship and approach the wreck. Aim at a loose crate and left-click to tractor it; E no longer picks up cargo.
5. Guide it toward the starboard rear airlock with the tractor. Follow the physical doorway, position the crate inside the visible cargo bays, rotate until the placement indicator turns green, and press E to secure it. Cargo can only be secured by the tractor's green-grid preview. The placement system automatically tips crates 90 degrees if that is required to fit the bay. Cargo shape, support and overlap rules still matter; volume alone is insufficient.
6. Return all crew aboard. Captain may Crunch: remaining contents are destroyed; the wreck becomes Scrap.
7. Navigate to Market A or B. Compare prices, sell, refuel, repair, and upgrade.
8. At quota deadline, you may still fly to either Market A or B, sell goods, and settle your payment; additional wrecks are blocked until payment or extension. One extension per ship grants seven more days for the same payment. Insufficient funds at settlement repossess the ship and reset cash to 1,000.

## Public hosting
Deploy the **entire Node application** to a host that supports long-running Node processes and WebSockets, with HTTPS and one server instance. Start command: `npm start`; service port: `PORT` (defaults to 3000); health endpoint: `/health`. Dockerfile included.

Static GitHub Pages/Netlify file hosting alone cannot run this multiplayer server. No hosting service has been provisioned by this commit. A public repository is not a playable game URL. Do not submit the repository URL as the competition's live game.

State is in memory: restarting the server resets all rooms. Empty rooms expire after five minutes; disconnected seats are held for 60 seconds. Do not scale to multiple instances without shared room routing/state. Room codes are for casual private sessions, not authentication.

## Scope and limitations
This is an intentionally small first prototype, not the full game. See [design](docs/design.md), [development plan](docs/development-plan.md), and [manual acceptance tests](docs/acceptance.md). Tests do not replace a remote two-person playtest.

## Aft cargo hatch (rear loading)
The back of the ship (positive Z, opposite the bridge) has two retractable bulkhead doors and a loading apron. Press **H** near the aft switch or cargo console to toggle it; **E** at the hatch switch also works. The cargo console includes an Open/Close button. Move bulky cargo through the open rear entrance with the tractor, rotate to fit the available cargo hold, and press E when the grid preview is green. The side EVA airlock remains available for players and smaller crates. Close the rear hatch before flying to the next location. Door closure is blocked if a crate or player occupies the entrance. Cargo that exceeds the starter ship's actual hold dimensions remains oversized and cannot be secured even if it passes through the doorway.

## Cargo handling refinement
The aft door now tests the **entire crate footprint throughout its crossing**, so crates no longer meet an invisible barrier midway through an otherwise open rear hatch. Keep a crate centered in the doorway and ensure its rotated width/height fit the hatch. Once the entire crate has cleared the rear wall, guide it near a clear cargo bay and press **E** when a green preview appears. Placement now uses a short-range magnetic assist to align the crate and settle it onto a supported floor cell (or onto a stable stack); it does not require pixel-perfect alignment or manual lowering to Y=0. The assist cannot pull cargo across the rear wall or through other crates, and the ship's actual hold capacity still applies.

## Tractor-only storage and full-capacity crates
All cargo is acquired by aiming and left-clicking with the handheld tractor. The hand-carry, Q drop and CARGO auto-stow inventory actions have been removed. A crate must be fully aboard and close to an unoccupied supported bay slot before E will secure it. The grid can automatically tip a box upright when required by bay geometry, e.g. a **4×2×4 m (32 m³)** scrap crate in a starter bay sized **2×4×4 m (32 m³)**. Shielding reduces effective bay height and can prevent full-volume placement. While quota payment is due, a captain may return to either market to sell salvage, but cannot travel to new salvage coordinates without paying or using an extension.

## Loose cargo and quota settlement
Any **unsecured, loose crate inside the ship** must be attached with the tractor and secured to a green grid position, or explicitly discarded at the CARGO console, before the captain can depart. Tractor pickup is also allowed when docked at a market to recover crates stranded by older versions; only loose crates already aboard may be attached while docked. Exterior loose cargo does not block departure and remains behind. Cargo consoles list loose crates aboard with a **Discard loose crate** action. Secured cargo remains saleable as before.

**Quota days are capped at the current deadline**, e.g. 7/7 (or 14/14 after the extension). When quota becomes due, return to Market A or B. If the shared credits already cover the payment, the quota is deducted once automatically on docking; otherwise sell secured cargo until the balance is sufficient, at which point it is immediately deducted. Insufficient funds do not cause repossession before the crew has a chance to sell, and the crew may travel between markets while due. Explicit manual settlement while underfunded still forfeits the ship. There is no extra 8/7 day.
