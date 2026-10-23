# Manual acceptance checklist
Record browser/device, steps, expected outcome and actual outcome for each failure.
- Open public HTTPS URL in private windows on two separate devices/networks. Create/join room, verify both avatars move; fifth player is refused.
- Recover at least two crates cooperatively using handheld tractor beams only; attempt simultaneous attachment to one crate. Exactly one tractor owner. Verify E near loose cargo never hand-picks it up and CARGO has no auto-stow button.
- Tractor a 4×2×4 m (32 m³) scrap crate fully aboard and secure it in an empty 2×4×4 m starter bay. The green grid should appear and automatically tip it to 2×4×4; adding shielding or an occupied cell must block full-bay storage.
- When quota becomes due at a wreck, return to either Market A or B and sell cargo; trying to depart to another wreck must be rejected.
- Fit 1×1×1 and 2×1×2 crates; reject overlapping, unsupported and oversized placements. Check larger-hull visuals.
- Read posters; scan three components, propose model, complete five scans. Ensure scanner closes and EVA remains usable.
- Leave loot inside, Crunch, verify it is gone and only Scrap replaces the hull.
- Compare markets; sell then refuel. Verify shared balances immediately agree.
- Track first free departure, six salvage/return departures and seventh-day arrival. Test successful payment, one extension to day 14, failure/repossession and subsequent fresh run.
- Buy a shielded bay, upgrade to level four; capacity remains half original. Loose and other-bay illegal crates remain exposed.
- Police: warning20, scan5, correct fine; pay; fight before30; fail and face reinforcements. NPC destruction retains bank minus fine.
- Disconnect/reconnect within60 seconds, captain disconnect, empty room expires, refresh and server restart.
- Leave game running for30 minutes; check browser memory, server stability, input throttling and multiple rooms.
- Confirm controls are understandable without the developer explaining them. Current desktop-only input must be disclosed.

## Loose cargo and quota settlement regression
- Release a tractored crate inside the ship. Verify departing from NAV is denied with **Unsecured cargo aboard** and does not burn fuel or advance the day.
- At a market dock, retarget that loose crate with the tractor and secure it, or discard it using the CARGO console. Verify it disappears from the deck and departures work again. A loose crate outside the ship must not block travel.
- With day 6/7 and enough cash to cover quota, leave a wreck carrying only secured cargo for a market. The HUD must never read 8/7; on docking the payment is deducted exactly once and the new quota begins at day 0/7.
- With day 7/7 and insufficient cash, dock and sell cargo. If the sale raises cash above the quota, payment must be deducted automatically, without clicking SETTLE. If still insolvent, allow selling and transfers between markets while keeping day capped at 7/7.
