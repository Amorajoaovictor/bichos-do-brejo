// Shared by the sprite, the HTML viewer and the GIF exporter. Times are seconds;
// event positions and sequence stops are normalized to the action duration.
export const LION_CUB_PNG_ROOT='/art/leaozinho/png-v1/';
export const LION_CUB_VIEWS=Object.freeze(['right','left','down','up']);
export const LION_CUB_POSES=Object.freeze(['idle','breathe','walkA','walkB','biteprep','bitecontact','hurt','fall','death']);
export const LION_CUB_LAYOUT=Object.freeze({size:512,ground:452,margin:24,spriteSize:1.45});
export const LION_CUB_TIMING=Object.freeze({idle:.9,walk:.36,bite:.85,cubBite:.85,hit:.52,bleed:.7,death:1.05,summon:.45,spawn:.45,impact:.56});
export const LION_CUB_EVENTS=Object.freeze({bite:Object.freeze({impact:.56}),cubBite:Object.freeze({impact:.56})});
export const LION_CUB_SEQUENCES=Object.freeze({
  idle:Object.freeze([0,1,0]),walk:Object.freeze([2,3,2,3]),
  bite:Object.freeze([0,4,5,4,0]),hit:Object.freeze([6,6,0]),
  bleed:Object.freeze([6,0]),death:Object.freeze([6,7,8]),summon:Object.freeze([0,1,0]),
});
export const LION_CUB_ALIASES=Object.freeze({cubBite:'bite',spawn:'summon',hurt:'hit'});
// Contact starts exactly at the combat impact, rather than rounding it to an
// evenly spaced frame. Death never loops; pose 8 remains on screen.
export const LION_CUB_STOPS=Object.freeze({
  idle:Object.freeze([0,.3,.7]),walk:Object.freeze([0,.25,.5,.75]),
  bite:Object.freeze([0,.14,LION_CUB_EVENTS.bite.impact,.76,.9]),
  hit:Object.freeze([0,.35,.8]),bleed:Object.freeze([0,.75]),
  death:Object.freeze([0,.23,.68]),summon:Object.freeze([0,.4,.8]),
});
export const lionCubAction=kind=>LION_CUB_ALIASES[kind]??(Object.hasOwn(LION_CUB_SEQUENCES,kind)?kind:'idle');
export const lionCubClamp=value=>Math.max(0,Math.min(1,Number.isFinite(value)?value:0));
export function lionCubSequenceIndex(kind,progress){
  const stops=LION_CUB_STOPS[lionCubAction(kind)],p=lionCubClamp(progress);
  let index=0;
  while(index+1<stops.length&&p>=stops[index+1])index++;
  return index;
}
export function lionCubFrame(kind,progress){
  return LION_CUB_SEQUENCES[lionCubAction(kind)][lionCubSequenceIndex(kind,progress)];
}
export function lionCubProgress(kind,elapsed){
  const action=lionCubAction(kind),time=Math.max(0,Number.isFinite(elapsed)?elapsed:0),duration=LION_CUB_TIMING[action];
  return action==='death'||action==='summon'?lionCubClamp(time/duration):(time%duration)/duration;
}
export const lionCubFrameURL=(view,pose)=>`${LION_CUB_PNG_ROOT}quadros/${view}-${pose}.png`;
// Uniform scale keeps the feet at the shared baseline as the cub rises out of
// the ground. The same transform is used by the preview and the runtime rig.
export function lionCubSummonPose(progress){
  const p=lionCubClamp(progress),ease=p*p*(3-2*p);
  return {scale:.65+.35*ease,opacity:ease,rise:-.18*(1-ease)};
}
