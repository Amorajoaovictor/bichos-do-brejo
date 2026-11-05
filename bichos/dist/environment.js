import { cellKey } from './grid.js';

export const PROP_LAYOUT=[
  {id:'pedra-1',kind:'rock',cell:{col:6,row:3}},
  {id:'pedra-2',kind:'rock',cell:{col:7,row:5}},
  {id:'pedra-3',kind:'rock',cell:{col:5,row:5}},
  {id:'pedra-4',kind:'rock',cell:{col:4,row:1}},
  {id:'tronco-1',kind:'log',cell:{col:4,row:4}},
  {id:'tronco-2',kind:'log',cell:{col:3,row:5}},
];
export const PROP_STATS={rock:{name:'Pedra',damage:4,range:3},log:{name:'Tronco',damage:8,range:4}};
export const propDistance=(a,b)=>Math.abs(a.col-b.col)+Math.abs(a.row-b.row);
export function traceLog(combat,prop,actor){
  const dc=prop.cell.col-actor.cell.col,dr=prop.cell.row-actor.cell.row,path=[],hits=[],seen=new Set();
  if(Math.abs(dc)+Math.abs(dr)!==1)return {path,hits};
  for(let step=1;step<=PROP_STATS.log.range;step++){
    const cell=combat.tiles.find(c=>c.col===prop.cell.col+dc*step&&c.row===prop.cell.row+dr*step);
    if(!cell||cell.blocked||combat.props.some(p=>p!==prop&&!p.used&&p.kind==='log'&&cellKey(p.cell)===cellKey(cell))||combat.heroes.some(h=>h.hp>0&&cellKey(h.cell)===cellKey(cell)))break;
    path.push(cell);
    for(const enemy of combat.enemies)if(enemy.hp>0&&!seen.has(enemy.id)&&combat.cellsOf(enemy).some(c=>cellKey(c)===cellKey(cell))){hits.push({target:enemy.id,step});seen.add(enemy.id);}
  }
  return {path,hits};
}
