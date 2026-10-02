# Slime × NYC Crossing

A standalone arcade journey: get Rimuru from Midtown, through Bryant Park, to a Tempest portal at the East River. The miniature city is a stylized route, not a street map. Four difficulties offer progressively longer runs; each route has three equally sized districts. There is no forced scrolling or waiting penalty. Safe islands let players study traffic and choose an opening.

## Difficulty variants

Easy preserves the original 60-lane game, including the seeded street layouts, opening traffic, and ability balance. All four modes start with 100 magicules and all four skills. Harder modes increase traffic speed, density, long vehicles, and uninterrupted road stretches. Skill effects and durations stay intact; casting opportunities become scarcer.

| Mode | Lanes | Magicules per new lane | Per crystal | Per district arrival | Casting cost multiplier | Cooldown multiplier | Longest road stretch |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Easy | 60 | 1.5 | 8 | 15 | 1× | 1× | 4 lanes |
| Normal | 120 | 0.65 | 5 | 8 | 1.2× | 1.65× | 5 lanes |
| Hard | 180 | 0.3 | 3 | 5 | 1.4× | 2.6× | 6 lanes |
| Demon Lord | 300 | 0.15 | 2 | 3 | 1.65× | 3.8× | 7 lanes |

Costs and cooldowns round up to whole magicules/seconds. New-lane income alone takes 14 lanes to recover an Easy Beelzebub cast, versus 37 on Normal, 94 on Hard, and 220 on Demon Lord. Crystals matter increasingly on the harder routes. Waiting never produces magicules.

| Skill | Easy cost / recharge | Normal | Hard | Demon Lord |
| --- | --- | --- | --- | --- |
| Beelzebub | 20 / 4s | 24 / 7s | 28 / 11s | 33 / 16s |
| Storm Dragon | 55 / 16s | 66 / 27s | 77 / 42s | 91 / 61s |
| Raphael | 24 / 10s | 29 / 17s | 34 / 26s | 40 / 38s |
| Uriel | 28 / 9s | 34 / 15s | 40 / 24s | 47 / 35s |

Choose a mode before starting. The mode button during a run pauses it and opens the selector; selecting a card only previews the rules. Starting the selected crossing replaces the paused run, while “Keep my … run” resumes it intact. Retries and new routes retain the selected difficulty.

## Four abilities, four decisions

All four ultimate skills are available immediately. Their roles come from Tensura; the ranges, costs, durations, and cooldowns are game balance choices. The table below describes the original Easy balance. This is a crossing-game adaptation, not a claim that ordinary traffic could defeat the canonical Rimuru.

| Key | Skill | Crossing role | Cost | Duration | Cooldown |
| --- | --- | --- | ---: | ---: | ---: |
| 1 | Beelzebub / Beelzebuth, Lord of Gluttony | Devour traffic and obstacles roughly two tiles in the last movement direction; keeps consuming incoming hazards during the cast | 20 | 1.25 s | 4 s |
| 2 | Storm Dragon, Veldora | Summon Veldora to clear traffic and obstacles across four lanes ahead; the storm follows Rimuru | 55 | 3 s | 16 s |
| 3 | Raphael, Lord of Wisdom | Accelerated perception: traffic moves at 30% speed while hops remain responsive, with motion trails and immediate-hop collision estimates | 24 | 4.5 s | 10 s |
| 4 | Uriel, Lord of Vows | A layered barrier repels contacting traffic; obstacles still require navigation or another skill | 28 | 2.8 s | 9 s |

Raphael is presented as analysis and accelerated thought, not a canonical time-stop power. Forecasts describe the window for an immediate hop; they are not permanent safe zones. Uriel uses the barrier aspect of the skill. Beelzebub stores hazards through consumption. Veldora is a visible dragon summon, with a storm clearing the way.

Primary reference: the [official Tensura glossary](https://www.ten-sura.com/keyword), entries for 暴食之王 (Beelzebuth), 捕食者 (Predator), 智慧之王 (Raphael), 思考加速 (Thought Acceleration), 暴風之王 / 暴風竜召喚 (Veldora / Storm Dragon Summon), and 誓約之王 (Uriel). See also the [official Raphael profile](https://www.ten-sura.com/character/raphael).

## Resource economy and replay

- Start with 100 magicules; the reserve is capped at 100.
- Rewards follow the selected mode. District bonuses occur one-third and two-thirds of the way through that route, once each. Fractional income is accounted for to two decimal places.
- Waiting, backtracking, and consuming cars do not replenish the reserve. Cooldowns alone cannot create infinite skill use.
- A retry uses the same seed and opening traffic. A new route changes the seed. Each difficulty has its own best distance and fastest completed crossing. Sound and the last-started difficulty are also saved locally.
- Previous v1 distance and time records migrate to Easy in v2 storage. The legacy entry remains untouched; blocked or corrupt storage falls back safely.
- There is no shared inventory, unlock system, or progression connection to the other arcade games.

## Input and presentation

Arrow keys / WASD move one tile; Space hops forward while the play area is focused. 1–4 activate skills and P pauses. Touch players can swipe, tap the street to move up, or use the visible direction and skill buttons. A single buffered hop accepts quick input without building a long movement queue.

Custom Canvas/SVG artwork includes elastic slime hops, directional vortices with shrinking hazards, Veldora's moving wings, calculation overlays, barrier shells, taxis, buses, carts, rooftop water tanks, park trees, and riverfront bridge details. Optional synthesized sounds are created locally, without fetched assets. Reduced motion removes decorative particles, camera easing, rain, wing movement, and idle animation while retaining essential traffic movement and state cues.

## Implementation and verification

- `crossing-model.js`: deterministic generation, fixed-step rules, swept relative collisions, powers, forecasts, resource accounting.
- `crossing-records.js`: record validation, migration, and independent per-mode records.
- `crossing-renderer.js` / `crossing-art.js`: rendering and bounded transient effects; artwork never consumes the simulation's random stream.
- `game-crossing.js`: DOM, keyboard/pointer controls, optional audio, records, and arcade lifecycle.
- `crossing.css`: scoped desktop, narrow portrait, short landscape, and reduced-motion layouts.

The 120 Hz simulation is independent of display frame rate. Real skill time and perceived traffic time are separate. Elapsed frame time is capped; pausing freezes both. Closing the modal cancels animation frames, pointers, buffered input, effects, and sound. Returning to a suspended run requires an explicit resume.

Run the pure simulation suite with `node --test tests/*.test.mjs`. No build step or new runtime dependency is needed. Tests include original-Easy layout fingerprints, generated route safety, increasing traffic pressure, fractional rewards, scaled skill costs/cooldowns, extended finish boundaries, and record migration. Browser checks cover touch and keyboard input, completion, failure/retry, mode selection/cancellation, resources and skills, pause/resume, modal navigation, reduced motion, unavailable storage, and portrait/landscape layouts.
