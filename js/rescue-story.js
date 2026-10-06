// Original fan dialogue written for these rescue encounters, not anime quotes.
export const STORIES = {
  naruto: {
    hint: 'The future Hokage needs a hint? How reassuring for her.',
    intro: [['enemy','Every receiver makes the pressure stronger. How long can she hold on?'],['hero','Hinata, look at me. I’m getting you out.'],['captive','The stones… they’re moving. Naruto, the inscription!']],
    hit: [['hero','There! One of the anchors is giving way.'],['captive','I can move my hand again. Keep going!'],['hero','The cracks are connecting. Just a little more.']],
    miss: [['enemy','Another anchor. Another weight she cannot carry.'],['captive','It’s getting heavier… but I’m still here.'],['enemy','Your opening is almost gone.']],
    idle: [['captive','I can still hear you. Take a breath.'],['hero','One letter at a time. We can figure this out.']],
    won: ['captive','The pressure’s gone… I knew you would reach me.'],
    lost: ['hero','Hinata! The anchors closed… I need another way through.']
  },
  sasuke: {
    hint: 'All that Uchiha pride… and you still ask me for help.',
    intro: [['enemy','Struggle, and the coils will only tighten.'],['hero','Sakura. Stay still. I’ll cut the seal that holds them.'],['captive','There’s an inscription beneath them. That’s what you need to break.']],
    hit: [['hero','The seal slipped. They’re losing their hold.'],['captive','My arm’s free. They’re pulling back!'],['hero','One more opening. I won’t miss it.']],
    miss: [['enemy','Careful. The next coil leaves less room.'],['captive','They’re climbing higher. Sasuke…'],['enemy','There is very little space left to save her.']],
    idle: [['hero','Ignore his voice. Look for an opening.'],['captive','I’m holding on. You can figure this out.']],
    won: ['captive','They’re gone. You broke it… thank you.'],
    lost: ['hero','The seal locked. I’ll find a way to undo it.']
  },
  sakura: {
    hint: 'Shall I move your hand for you, too?',
    intro: [['enemy','One last joint, and he becomes part of the collection.'],['hero','You’re not keeping him. Kankuro, tell me where it’s weakest.'],['captive','The inscription controls the frame. Break that and the joints come apart.']],
    hit: [['hero','A split in the wood. That’s our way in.'],['captive','That brace snapped! I can move again.'],['hero','The frame can’t take much more. Hold on.']],
    miss: [['enemy','Another thread. Every movement belongs to me.'],['captive','The braces are closing. Don’t let him finish.'],['enemy','The final joint is nearly in place.']],
    idle: [['hero','Steady hands. Clear mind. I can do this.'],['captive','I’m still fighting it. Take your time with this one.']],
    won: ['captive','No strings. No frame. I owe you one, Sakura.'],
    lost: ['hero','The frame closed… but this isn’t where I leave him.']
  },
  kakashi: {
    hint: 'The famous Copy Ninja. Waiting for someone else’s answer again.',
    intro: [['enemy','The current answers to me. Your student is running out of room.'],['hero','Naruto, conserve your strength. I’m coming through.'],['captive','There are marks in the water! They keep coming back together.']],
    hit: [['hero','The current broke there. Follow that weakness.'],['captive','The water’s pulling away from my arms!'],['hero','The surface is splitting. We’re almost through.']],
    miss: [['enemy','Another current closes around him.'],['captive','It’s getting harder to move!'],['enemy','The prison is almost complete.']],
    idle: [['hero','Steady. One letter at a time.'],['captive','I’m still here, sensei!']],
    won: ['captive','I can breathe… I’m out! Thanks, Kakashi-sensei.'],
    lost: ['hero','The current sealed. I need a different opening.']
  }
};
// Sheet: 4 columns = intact / weakened / breaking / free;
// 3 rows = early / tightening / critical. Damage survives further mistakes.
export function storyFrame(phase, misses, progress) {
  const pressure = Math.min(2, Math.floor(misses / 2));
  if (phase === 'won') return pressure * 4 + 3;
  if (phase === 'lost') return 8;
  const damage = progress <= 0 ? 0 : progress <= .5 ? 1 : 2;
  return pressure * 4 + damage;
}
export function reaction(mission, kind, misses, progress, hitCount) {
  const story = STORIES[mission];
  if (kind === 'won' || kind === 'lost') return story[kind];
  if (kind === 'miss') return story.miss[Math.min(2, Math.floor((misses - 1) / 2))];
  return story.hit[Math.min(2, Math.max(0, Math.ceil(progress * 3) - 1))] || story.hit[hitCount % 3];
}
