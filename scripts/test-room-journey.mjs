import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
const exports = {};
runInNewContext(ts.transpileModule(readFileSync(new URL('../src/roomJourneyMath.ts',import.meta.url),'utf8'),{ compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
const { roomRoute, sampleRoomRoute, ROOM_STATIONS } = exports;
test('all five tour routes interpolate continuous grounded feet and stop exactly at their destination', () => {
  let from = ROOM_STATIONS.entrance;
  for (const station of ['desk','cards','mirror','diary','door']) {
    const route = roomRoute(from,station); let previous = from; let arrived = false;
    for (let d = 0; d < 1500; d += 7) {
      const point = sampleRoomRoute(route,d);
      assert.ok(Math.hypot(point.x-previous.x,point.y-previous.y) <= 7.001);
      assert.ok(exports.isRoomFloor(point));
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


test('the tour advances through all furniture before the door', () => {
  const seen = []; let station = 'entrance';
  while ((station = exports.nextTourStation(station))) seen.push(station);
  assert.deepEqual(seen, ['desk', 'cards', 'mirror', 'diary', 'door']);
});

test('floor targets and furniture routes remain inside the connected walkable floor', () => {
  for (const point of [{x:100,y:100},{x:250,y:620},{x:650,y:420},{x:900,y:700}]) assert.equal(exports.isRoomFloor(point), false);
  const points = [{x:395,y:300},{x:500,y:450},{x:720,y:700}, ...Object.values(ROOM_STATIONS)];
  for (const from of points) for (const to of points) {
    assert.equal(exports.isRoomFloor(to),true);
    const route = roomRoute(from,to);
    for (let d=0;d<2000;d+=3) {
      const sample = sampleRoomRoute(route,d);
      assert.equal(exports.isRoomFloor(sample),true);
      if(sample.done) { assert.equal(sample.x,to.x); assert.equal(sample.y,to.y); break; }
    }
  }
});

test('diary approach does not double back through upper waypoints or stand on desk books', () => {
  assert.equal(exports.isRoomFloor({x:550,y:390}),false);
  for (const start of [ROOM_STATIONS.mirror, ROOM_STATIONS.cards, ROOM_STATIONS.entrance]) {
    const route = roomRoute(start, 'diary');
    for(let i=1;i<route.length;i++) {
      assert.ok(route[i].x >= route[i-1].x, 'no horizontal backtracking');
      assert.ok(route[i].y >= 355, 'stay at the lower aisle edge instead of detouring to the upper aisle');
    }
    const length = route.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p.x-route[i].x,p.y-route[i].y),0);
    assert.ok(length <= Math.hypot(590-start.x,360-start.y)+100);
  }
});
