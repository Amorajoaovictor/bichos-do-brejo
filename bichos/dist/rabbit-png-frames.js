import {barragePulse,barrageFlush} from './animation.js';

export const RABBIT_PNG_ROOT='/art/farrapo/png-v1/';
export const RABBIT_PNG_VIEWS=['right','left','down','up'];
export const RABBIT_PNG_TIMING={idle:1.92,walk:.48,rabbit:1.05,barrage:2.3,hit:.52,bleed:.7,death:1.15};
export const RABBIT_RELIEF_HOLD=1.8;
export const RABBIT_PNG_POSES=27;
export const rabbitReliefFrame=progress=>progress<.18?24:progress<.6?25:26;
export const rabbitPreviewDuration=kind=>RABBIT_PNG_TIMING[kind]+(kind==='barrage'?RABBIT_RELIEF_HOLD:0);
export function rabbitPreviewProgress(kind,elapsed){
  const duration=RABBIT_PNG_TIMING[kind];
  if(kind==='death')return Math.max(0,Math.min(1,elapsed/duration));
  const cycle=Math.max(0,elapsed)%rabbitPreviewDuration(kind);
  return Math.min(1,cycle/duration);
}
export function rabbitFrame(kind,progress,emotion='neutral',reliefProgress=1){
  const p=Math.max(0,Math.min(1,progress));
  if(kind==='barrage')return p>=1?24:p<.18?12:barragePulse(p)>.48?14:13;
  if(kind==='rabbit')return p<.12?0:p<.38?8:p<.45?9:p<.60?10:p<.9?11:0;
  if(kind==='walk')return p<.17?4:p<.36?5:p<.82?6:p<.96?7:0;
  if(kind==='death')return p<.2?20:p<.47?21:p<.78?22:23;
  if(kind==='hit'||kind==='bleed')return 16+Math.min(3,Math.floor(p*4));
  if(emotion==='relief')return rabbitReliefFrame(reliefProgress);
  if(emotion==='strain')return 13;
  if(emotion==='panic')return 12;
  return p<.18?0:p<.42?1:p<.76?3:p<.81?2:0;
}
export const rabbitFrameURL=(view,index)=>`${RABBIT_PNG_ROOT}quadros/${view}-${String(index).padStart(2,'0')}.png`;
export {barrageFlush};
