export const ZEBRA_VIEWS=['right','left','down','up'];
export const ZEBRA_SEQUENCES={idle:[0,1,0,0,1,0],walk:[2,3,2,3],zebraKick:[0,4,4,5,5,4,0,0],hit:[6,6,0],bleed:[6,0],death:[6,7,8,8]};
export const ZEBRA_DURATIONS={idle:.96,walk:.4,zebraKick:1.05,hit:.52,bleed:.7,death:1.05};
export const ZEBRA_IMPACT=.56;
export function zebraPose(action,progress){
  const sequence=ZEBRA_SEQUENCES[action]??ZEBRA_SEQUENCES.idle;
  return sequence[Math.min(sequence.length-1,Math.floor(Math.max(0,Math.min(1,progress))*sequence.length))];
}
