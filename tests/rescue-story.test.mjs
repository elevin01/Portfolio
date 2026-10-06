import test from 'node:test';
import assert from 'node:assert/strict';
import { MISSIONS } from '../js/rescue-model.js';
import { STORIES, storyFrame, reaction } from '../js/rescue-story.js';
test('artwork remembers damage as the trap grows stronger',()=>{
  for(const progress of [0,.1,.5,.51,.9]){
    let lastRow=-1;
    for(let misses=0;misses<6;misses++){
      const frame=storyFrame('playing',misses,progress);
      assert.ok(Math.floor(frame/4)>=lastRow);lastRow=Math.floor(frame/4);
      assert.equal(frame%4,progress===0?0:progress<=.5?1:2);
    }
  }
});
test('rescue reveals the free image; failure closes the restraint',()=>{
  for(let misses=0;misses<6;misses++)assert.equal(storyFrame('won',misses,1)%4,3);
  assert.equal(storyFrame('lost',6,.9),8);
});
test('every mission has a full original story with valid speakers and responses',()=>{
  for(const mission of MISSIONS){
    const story=STORIES[mission.id];assert.equal(story.intro.length,3);assert.equal(story.idle.length,2);
    for(const line of [...story.intro,...story.hit,...story.miss,...story.idle,story.won,story.lost]){
      assert.ok(mission[line[0]]);assert.ok(line[1].length>12);
    }
    for(const kind of ['hit','miss','won','lost'])assert.equal(reaction(mission.id,kind,3,.6,2).length,2);
  }
});
