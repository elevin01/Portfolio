# The Hunter Trial

A standalone, three-dimensional Hunter × Hunter runner in the existing hidden arcade. Trial is the default. Endless is a separate choice alongside it, and never becomes the default after a page reload. Both modes offer Killua, Gon, Kurapika, Hisoka, three courses, and three difficulties. There are no unlocks or shared progression with the other games.

## Modes and route design

Trial has a finish line and three equal-length chapters. Endless continually generates the selected course, cycling its three environments every 650 metres. Speed and obstacle pressure eventually cap; scenery, hazards, and effects are recycled rather than accumulating with distance.

| Difficulty | Trial distance | Initial speed | Maximum normal speed | Composure | Zetsu recovery | Electricity per supply |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Rookie | 2,800 m | 10.5 m/s | 14 m/s | 3 | 4 aura/s | 30 |
| Hunter | 4,000 m | 13 m/s | 16.5 m/s | 2 | 2.8 aura/s | 23 |
| Veteran | 4,800 m | 15.5 m/s | 19 m/s | 2 | 1.8 aura/s | 17 |

Most waves offer an open lane. Occasional full-width hurdles, gaps, or hanging beams require a jump or slide; they never combine contradictory required actions. Later waves mix two occupied lanes more often. Signed junctions require a directional input in the last 35 metres, with clear space on either side. They are arcade input checkpoints on a winding route, not simulated branching street intersections.

Low obstacles cause a stumble and cost one composure point. A wall, missed landing, missed turn, or depleted composure ends the run. Thirty-five clean seconds restore one composure point. No route requires Nen to finish. Optional markers reward risk with points; electrical supplies support Killua's limited charge.

| Course | Three environments | Reference direction |
| --- | --- | --- |
| Hunter Exam | Underground marathon → staircase → Numere Wetlands | Long arched tunnel, rails and lamps, stair treads, dense trees and mist |
| Yorknew City | Auction district → rooftops → backstreets | Warm windows, stone buildings, street lamps, roof parapets and water tanks |
| Greed Island | Open country → training grounds → Masadora outskirts | Grassy routes, forest and rocky clearings, pale houses and pointed roofs |

The environments are original low-poly interpretations of the anime settings. They are not exact maps, episode recreations, or a claim that all four characters made the same journey. Character models and portraits follow their recognizable 2011 designs; the ability loadout follows the selected era. Durations, distances, costs, pickups, and difficulty scaling are arcade balance choices.

## Character kits and Nen

| Character | Exam Trial | Yorknew Trial | Greed Island Trial | Endless |
| --- | --- | --- | --- | --- |
| Killua | Skateboard; no trained Nen | Rhythm Echo | Lightning Palm | Godspeed; later, Chimera Ant-era kit |
| Gon | Fishing rod; no trained Nen | Fishing rod, before Jajanken | Jajanken | Jajanken |
| Kurapika | Twin blades; no trained Nen | Dowsing Chain and Holy Chain | Dowsing Chain and Holy Chain | Dowsing Chain and Holy Chain |
| Hisoka | Bungee Gum | Bungee Gum | Bungee Gum | Bungee Gum |

Trained characters have Ten as their normal state. Gyo spends 14 aura to reveal concealed aura threads for 4.5 seconds, with a 9-second cooldown. It does not predict physical hazards. Zetsu suppresses aura and accelerates recovery, but a Nen projectile causes two strikes while protection is lowered. Enter Zetsu before its 22-metre detection range to avoid being targeted; suppressing aura cannot erase an attack already aimed at the runner. Physical obstacles are unaffected. Activating an aura technique returns the character to Ten.

| Signature | Resource cost | Behavior |
| --- | --- | --- |
| Godspeed | 16 aura + 65 electricity | 3.5-second speed burst, one automatic reaction to a Nen projectile, 18-second cooldown. Terrain remains dangerous. |
| Lightning Palm | 25 aura + 35 electricity | Close-range electrical strike and a 1.1-second reaction window, 13-second cooldown. |
| Rhythm Echo | 25 aura | Confuses one projectile attack during a 2.5-second window, 13-second cooldown. It is an assassination technique, not a Nen ability. |
| Jajanken | 34 aura | Commits the lane and slows the runner for a 0.85-second charge, then releases the chosen form. 11-second cooldown. |
| Dowsing Chain | 27 aura | Intercepts one Nen projectile within 2.5 seconds, 12-second cooldown. |
| Holy Chain | 36 aura | Restores one lost composure point, 26-second cooldown. Cannot spend aura at full composure. |
| Bungee Gum | 28 aura | Requires an unused visible anchor 12–45 metres ahead. Attaches and retracts along a smooth airborne arc towards its lane. 10-second cooldown, no general invulnerability. |

Jajanken's Rock has an 11-metre reach and can break a wall or low obstacle; Scissors cuts low obstacles, overhead beams, and aura wires within 17 metres; Paper reaches low obstacles and Nen projectiles up to 32 metres away. Choose the form before charging. These are game-specific target rules grounded in the techniques' different uses.

Kurapika does not use Chain Jail against arbitrary obstacles or opponents: its Phantom Troupe restriction is preserved by leaving it out of this kit. Healing is a limited recovery mechanic, not unrestricted invulnerability or a full Emperor Time system. Likewise, Godspeed is not granted to Exam-era Killua. Electricity never regenerates through waiting or Zetsu; only electrical supplies replenish it. Ordinary aura recovery is 0.12/s, and pre-Nen stamina recovers at 0.8/s.

## Controls, animation, and lifecycle

- Arrows / WASD: lanes, jump, slide. Space jumps while the canvas has focus.
- 1: Gyo. 2: Zetsu. 3: signature. 4: Jajanken form or Holy Chain. P: pause.
- Touch: directional swipes, tap to jump, or visible movement and technique buttons.
- Closing the arcade, leaving the tab, losing focus, or opening the field guide pauses the run. Resume is explicit. Changing options previews them without overwriting the paused run; “Keep my run” restores it.
- Retrying a failure preserves the route seed. Starting from the selector or after a victory generates a fresh route. Records are separated by character, course, difficulty, and mode. Distance, score, and fastest Trial completion are stored locally; malformed or blocked storage does not block play.

Articulated characters run, jump, slide, lean into lane changes, stumble, and celebrate. Techniques add skateboarding, a committed Jajanken charge and three release forms, electrical arcs, afterimages, linked chains, elastic tethers, healing color, and breaking debris. Optional sound is synthesized locally. Reduced motion removes decorative effects, idle motion, and camera roll while preserving readable gameplay movement.

The 120 Hz model is independent of display frame rate, with interpolation and capped catch-up time. Scenery uses nine recycled chunks and instanced geometry. The renderer is loaded only when Hunter is selected; other games and the portfolio do not load Three.js. A WebGL 2 loading failure leaves the arcade navigable and presents a retry action.

## Implementation and verification

- `hunter-model.js`: deterministic generation, fixed-step simulation, collision rules, era-specific kits, resources, and validated records.
- `hunter-scene.js`: Three.js world, original geometry, instanced scenery, character rigs, and bounded effects.
- `hunter-art.js`: original SVG portraits, marks, and picker illustration.
- `game-hunter.js`: selection, HUD, keyboard/pointer controls, optional audio, lifecycle, and lazy scene loading.
- `hunter.css`: scoped desktop, narrow portrait, short landscape, and reduced-motion layouts.

Run `node --test tests/*.test.mjs`. Hunter tests cover every character/course/difficulty Trial through ordinary movement inputs, 24-kilometre Endless simulations on all three courses, jump/slide/gap collisions, turns, animation-independent movement, pause invariants, Nen restrictions and costs, target profiles, continuous Bungee Gum movement, pickups, and record isolation. The existing Flappy, Ghostbusters, and Slime model suites remain in the same command.

## References and dependency provenance

Primary visual and setting references: the [official NTV character profiles](https://www.ntv.co.jp/hunterhunter/character/), [official dictionary](https://www.ntv.co.jp/hunterhunter/dictionary/), and NTV episode summaries for [4](https://www.ntv.co.jp/hunterhunter/story/004.html), [5](https://www.ntv.co.jp/hunterhunter/story/005.html), [62](https://www.ntv.co.jp/hunterhunter/story/062.html), and [89](https://www.ntv.co.jp/hunterhunter/story/089.html). These informed character silhouettes, clothing colors, the Exam route, Masadora, Nen principles, and Jajanken's commitment. Reference artwork and anime audio are not distributed with the game.

Three.js **0.180.0** is vendored under its MIT license in `js/vendor/THREE-LICENSE.txt`. The ESM module and core were retrieved from `https://cdn.jsdelivr.net/npm/three@0.180.0/build/`. There is no runtime CDN request and no build step.

| File | SHA-256 |
| --- | --- |
| `three.module.min.js` | `e2b5ee6bccd38fd6d8a2428546b83c5f2426d84b152ef82be8055556e3b40eb6` |
| `three.core.min.js` | `61ba0df005b05991361d040d8ff670e1aadfd0ce7aeebd1fdb0725957a8957de` |
