export const SQUIRREL_IDLE_VIEWS=['right','left','down','up'];
export const SQUIRREL_IDLE_POSES=8;
export const SQUIRREL_IDLE_TEMPO=[1.42,1.22];

// The glances hang for a beat. The blink and the return from the toe bounce are quick.
export const SQUIRREL_IDLE_EXPOSURE=[
  [0,145],[1,75],[2,185],[1,65],[3,60],[4,90],[5,195],[4,65],[6,115],[7,95],[6,60],
];
export const SQUIRREL_IDLE_DURATION=SQUIRREL_IDLE_EXPOSURE.reduce((duration,[,ms])=>duration+ms,0);

export function squirrelIdleFrame(elapsedMs){
  let remaining=elapsedMs%SQUIRREL_IDLE_DURATION;
  for(const [pose,ms] of SQUIRREL_IDLE_EXPOSURE){
    if(remaining<ms)return pose;
    remaining-=ms;
  }
  return 0;
}
