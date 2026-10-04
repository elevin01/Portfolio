# The Hunter Trial: The long way there

A 2D side-scrolling runner in the hidden portfolio arcade. This replaces the original 3D experiment after playability feedback. Canvas 2D draws the entire game; there is no WebGL or third-party renderer dependency.

## Play first

- Auto-run from left to right. Space / Up / W jumps; Down / S slides; X / 3 uses one character action; P pauses. Phones have large persistent buttons plus up/down swipes on the canvas.
- The first hurdle, beam, and gap stop the course and ask for the correct input. Nothing advances while that prompt is open. After those examples, the run continues normally.
- Hurdles and sentries need a jump. Striped beams need a slide. Gaps have clearly lit edges and need a jump. All courses are possible without powers. Ground and collision height remain consistent across scenery changes.
- Three hearts allow recovery from mistakes, including missed gaps. A 1.5-second recovery window prevents repeated damage from the same obstacle. Retry reuses a failed route's seed.
- Powers are contextual. The button says which target is missing or how much energy/cooldown is needed. It becomes active only when that action can be used. No aimless aura buttons or lane/turn mechanics remain.

## Modes, length, and challenge

Trial is always the default after reload. Endless is a separate mode choice. Records use a new `portfolio.hunter-2d.v2` key, because distances and scores from the former 3D game are not comparable.

| Difficulty | Trial | Starting speed | Hazard spacing | Aura/stamina recovery |
| --- | --- | --- | --- | --- |
| Rookie | 1,800 m | 145 logical px/s | 400–510 px | 3.5/s |
| Hunter | 2,600 m | 170 logical px/s | 370–480 px | 2.5/s |
| Veteran | 3,200 m | 200 logical px/s | 350–460 px | 1.8/s |

Ten logical pixels represent one game metre. Trials take roughly two to three minutes, excluding the guided opening and pauses. Endless gradually accelerates to a 245 px/s ceiling. Generation and particles are bounded. There are recovery spaces between obstacles; jump/slide sequences never demand simultaneous conflicting actions.

## Art and locations

Original pixel-style sprites have articulated running legs and arms, tucked slides, jumping poses, and power effects. Background layers scroll at different speeds. Three chapters change the scenery within each course:

| Course | Chapters |
| --- | --- |
| Hunter Exam | Arched marathon tunnel → ascent motifs → misty Numere Wetlands |
| Yorknew | Auction district → rooftops → backstreets |
| Greed Island | Open country → training grounds → Masadora outskirts |

These are compact fan-made interpretations, not exact episode maps. The ascent is a visual chapter on a continuous playable ground plane. Obstacles and anonymous sentries are arcade inventions. No anime artwork or audio is distributed. Optional sound uses short locally synthesized tones. Reduced motion disables decorative particles, afterimages, and preview animation.

## One clear character action

| Character | Exam Trial | Yorknew Trial | Greed Island Trial | Endless |
| --- | --- | --- | --- | --- |
| Killua | Skateboard: long vault over a nearby hurdle or gap | Rhythm Echo: evade a sentry | Lightning Palm: stun a sentry | Godspeed: automatically evade a sentry |
| Gon | Fishing rod: retrieve the next badge | Fishing rod | Jajanken: Rock, charge then break a hurdle | Jajanken: Rock |
| Kurapika | Twin blades: cut a hurdle | Holy Chain: restore one heart | Holy Chain | Holy Chain |
| Hisoka | Bungee Gum: attach to a pink anchor and vault its hurdle or gap | Bungee Gum | Bungee Gum | Bungee Gum |

Bungee Gum is depicted as a visible tether and continuous arc. It is not teleportation or general invulnerability. Rock has a half-second charge and slows forward motion; it cannot be started too late to finish before its target. It does not remove gaps or beams. Holy Chain cannot spend energy at full health. Chain Jail is not used against arbitrary targets. Early Exam characters do not receive trained Nen abilities; Rhythm Echo is treated as an assassination technique, not Nen. Godspeed appears only in later-kit free play.

These interactions are deliberately simplified game adaptations. Godspeed provides a clearly readable single-sentry evade; it does not claim to implement the whole canon ability. Electricity only returns through marked supplies; aura and stamina regenerate. All signatures also have a six-second cooldown. Gyo, Zetsu toggles, extra attack forms, and multi-resource management were removed to make the runner easier to understand.

## Implementation and verification

- `hunter-model.js`: seeded generation, fixed 120 Hz physics, tutorial, target-aware powers, collision, resources, modes, and validated records.
- `hunter-scene.js`: direct Canvas 2D environments, pixel sprites, hazards, pickups, and bounded particles.
- `game-hunter.js`: selector, canvas lifecycle, keyboard/touch controls, HUD, pause/resume, and optional audio.
- `hunter.css`: scoped responsive controls and interface. The same 640 × 360 logical view is preserved across screen sizes, keeping reaction distances consistent.

Run `node --test tests/*.test.mjs` for all arcade model tests. Hunter coverage includes all 36 character/course/difficulty combinations without ability use or lost hearts, several timing offsets for every hazard/difficulty, five seeded 24 km Endless runs at the speed cap, tutorial waiting, pause invariants, contextual abilities, electrical limits, and record isolation.

Browser validation uses actual keyboard and native touch input, plus deterministic browser-clock advancement to play a complete Trial. It checks the finish overlay, retry, pause/resume, re-entry, Trial default after reload, two Bungee Gum activations, and closing the modal. Responsive smoke checks cover 1280 × 960, 390 × 844, 320 × 568, and 844 × 390. Model simulation alone is not evidence of visual quality or enjoyable play.

## Reference direction

The original setting/character research used NTV's [official character profiles](https://www.ntv.co.jp/hunterhunter/character/), [dictionary](https://www.ntv.co.jp/hunterhunter/dictionary/), and episode summaries for [4](https://www.ntv.co.jp/hunterhunter/story/004.html), [5](https://www.ntv.co.jp/hunterhunter/story/005.html), [62](https://www.ntv.co.jp/hunterhunter/story/062.html), and [89](https://www.ntv.co.jp/hunterhunter/story/089.html). The new pixel art follows that reference direction while prioritizing clear silhouettes and readable gameplay.
