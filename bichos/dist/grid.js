// Grid occupancy uses cells, independent of the size of the illustration.
export const cellKey=cell=>`${cell.col},${cell.row}`;
export function footprintCells(anchor,width=1,height=1){
  return Array.from({length:width*height},(_,i)=>({col:anchor.col+i%width,row:anchor.row+Math.floor(i/width)}));
}
export function findPath(tiles,start,goal,occupied=new Set()){
  const available=new Map(tiles.map(tile=>{const c=tile.userData??tile;return [cellKey(c),c];}));
  const startKey=cellKey(start),goalKey=cellKey(goal);
  if(!available.has(startKey)||!available.has(goalKey)||occupied.has(goalKey)||available.get(goalKey).blocked)return null;
  const queue=[startKey],previous=new Map([[startKey,null]]);
  for(let i=0;i<queue.length;i++){
    const key=queue[i];if(key===goalKey)break;
    const cell=available.get(key);
    for(const [dc,dr] of [[1,0],[0,1],[-1,0],[0,-1]]){
      const next=cellKey({col:cell.col+dc,row:cell.row+dr});
      if(previous.has(next)||!available.has(next)||available.get(next).blocked||occupied.has(next))continue;
      previous.set(next,key);queue.push(next);
    }
  }
  if(!previous.has(goalKey))return null;
  const path=[];for(let key=goalKey;key!==startKey;key=previous.get(key))path.unshift(available.get(key));return path;
}
