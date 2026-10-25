import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
const exports = {};
runInNewContext(ts.transpileModule(readFileSync(new URL('../src/roomJourneyMath.ts',import.meta.url),'utf8'),{ compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
const { roomRoute, sampleRoomRoute, ROOM_STATIONS } = exports;
test('desk, mirror and door routes interpolate continuous grounded feet and stop exactly at their destination', () => {
  let from = ROOM_STATIONS.entrance;
  for (const station of ['desk','mirror','door']) {
    const route = roomRoute(from,station); let previous = from; let arrived = false;
    for (let d = 0; d < 1500; d += 7) {
      const point = sampleRoomRoute(route,d);
      assert.ok(Math.hypot(point.x-previous.x,point.y-previous.y) <= 7.001);
      assert.ok(point.x >= 410 && point.x <= 600 && point.y >= 590 && point.y <= 760);
      if (point.done) { assert.equal(point.x,ROOM_STATIONS[station].x); assert.equal(point.y,ROOM_STATIONS[station].y); arrived=true; break; }
      previous=point;
    }
    assert.equal(arrived,true); from=ROOM_STATIONS[station];
  }
});
test('a stationary action does not invent travel or overshoot; walking frames can derive correct facing', () => {
  assert.equal(roomRoute(ROOM_STATIONS.desk,'desk').length,1);
  assert.equal(sampleRoomRoute([ROOM_STATIONS.desk],0).done,true);
  assert.equal(sampleRoomRoute([{x:0,y:0},{x:10,y:0}],5).facing,'right');
  assert.equal(sampleRoomRoute([{x:10,y:0},{x:0,y:0}],5).facing,'left');
});
