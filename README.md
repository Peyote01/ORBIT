# ORBIT
A browser-based cooperative 3D space salvage prototype for 2–4 players. Built with Three.js and an authoritative Node/WebSocket server.

**Status:** first playable source, not a deployed public game. Desktop keyboard and mouse. Generated primitive geometry; no purchased art.

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
WASD moves, click the scene to capture the mouse, E opens the nearest console or picks up a crate, Q drops, V scans, F fires a sidearm, Space/Ctrl moves vertically during EVA, Esc releases the cursor/closes panels. Captain is marked ★.

1. Walk to BOARD, press E, accept a free contract.
2. Captain uses NAV to travel. Everyone must be aboard with no carried crates.
3. SCANNER: lock grapple; drag the scene to rotate; V scans one of five categories. Compare manufacturer records. Three matches are high confidence; five are certain.
4. Exit the starboard rear airlock (right side near the back), move around the ship and approach the wreck. E recovers a crate.
5. Carry it back, open CARGO, and stow it in a bay. Shapes must fit with support; volume alone is insufficient.
6. Return all crew aboard. Captain may Crunch: remaining contents are destroyed; the wreck becomes Scrap.
7. Navigate to Market A or B. Compare prices, sell, refuel, repair, and upgrade.
8. Pay a quota after seven travel days. One extension per ship grants seven more days for the same payment. Insufficient funds at settlement repossess the ship and reset cash to 1,000.

## Public hosting
Deploy the **entire Node application** to a host that supports long-running Node processes and WebSockets, with HTTPS and one server instance. Start command: `npm start`; service port: `PORT` (defaults to 3000); health endpoint: `/health`. Dockerfile included.

Static GitHub Pages/Netlify file hosting alone cannot run this multiplayer server. No hosting service has been provisioned by this commit. A public repository is not a playable game URL. Do not submit the repository URL as the competition's live game.

State is in memory: restarting the server resets all rooms. Empty rooms expire after five minutes; disconnected seats are held for 60 seconds. Do not scale to multiple instances without shared room routing/state. Room codes are for casual private sessions, not authentication.

## Scope and limitations
This is an intentionally small first prototype, not the full game. See [design](docs/design.md), [development plan](docs/development-plan.md), and [manual acceptance tests](docs/acceptance.md). Tests do not replace a remote two-person playtest.
