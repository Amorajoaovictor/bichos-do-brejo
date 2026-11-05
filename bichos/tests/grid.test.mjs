import test from 'node:test';
import assert from 'node:assert/strict';
import { cellKey,footprintCells,findPath } from '../dist/grid.js';

const board=()=>Array.from({length:36},(_,i)=>({col:i%6,row:Math.floor(i/6),blocked:false}));

test('a boss occupies exactly the four cells of a 2 by 2 square',()=>{
  assert.deepEqual(footprintCells({col:2,row:2},2,2),[{col:2,row:2},{col:3,row:2},{col:2,row:3},{col:3,row:3}]);
});
test('none of the four boss cells can be a movement destination',()=>{
  const cells=footprintCells({col:2,row:2},2,2),occupied=new Set(cells.map(cellKey));
  for(const goal of cells)assert.equal(findPath(board(),{col:0,row:2},goal,occupied),null);
});
test('movement takes a continuous detour around the entire boss',()=>{
  const occupied=new Set(footprintCells({col:2,row:2},2,2).map(cellKey));
  const start={col:0,row:2},goal={col:5,row:2},path=findPath(board(),start,goal,occupied);
  assert.equal(path.length,7);
  assert.deepEqual([path.at(-1).col,path.at(-1).row],[5,2]);
  let previous=start;for(const cell of path){assert.equal(occupied.has(cellKey(cell)),false);assert.equal(Math.abs(cell.col-previous.col)+Math.abs(cell.row-previous.row),1);previous=cell;}
});
test('terrain and another moving creature also block a route',()=>{
  const tiles=board();tiles.forEach(t=>{if(t.col===2)t.blocked=true;});
  assert.equal(findPath(tiles,{col:0,row:2},{col:5,row:2}),null);
  assert.equal(findPath(board(),{col:0,row:0},{col:1,row:0},new Set(['1,0'])),null);
});
test('missing board cells cannot be entered and staying put is valid',()=>{
  const tiles=board().filter(t=>t.col!==5||t.row!==5);
  assert.equal(findPath(tiles,{col:0,row:0},{col:5,row:5}),null);
  assert.deepEqual(findPath(tiles,{col:0,row:0},{col:0,row:0}),[]);
});
