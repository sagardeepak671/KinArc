import {baseExercise,exercises} from './exercises.mjs';
// Compute the included knee angle in image pixels to preserve the camera aspect ratio.
export function knee(points, side, width, height, exercise="Knee bend") {
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<32||height<32)return null;
  const originalExercise=exercise; exercise=baseExercise(exercise);
  const config=exercises[originalExercise];
  const compound=exercise==='Bodyweight squat'||exercise==='Hip hinge';
  const base=config?.joints||[23,25,27];
  const selected=side==='right'?1:0;
  const alternate=side==='right'?0:1;
  const visible=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.visibility>=.45&&p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1;
  const sidePoints=offset=>{
    const indices=base.map(i=>i+offset);
    if(indices.some(i=>i<0||i>=33))return null;
    return indices.map(i=>points?.[i]);
  };
  let joints=sidePoints(selected);
  if(joints?.some(p=>!visible(p))){
    const opposite=sidePoints(alternate);
    if(opposite?.every(p=>visible(p)))joints=opposite;
  }
  if(!joints?.every(p=>visible(p))){
    const name=baseExercise(originalExercise);
    if(name==='Arm raise'){
      const shoulderIndex=11+(side==='right'?1:0);
      const wristIndex=15+(side==='right'?1:0);
      let shoulder=points?.[shoulderIndex],wrist=points?.[wristIndex];
      if(!visible(shoulder)||!visible(wrist)){
        shoulder=points?.[11+(side==='right'?0:1)];
        wrist=points?.[15+(side==='right'?0:1)];
      }
      if(!visible(shoulder)||!visible(wrist))return null;
      const sx=shoulder.x*width,sy=shoulder.y*height,wx=wrist.x*width,wy=wrist.y*height;
      const armLength=Math.hypot(wx-sx,wy-sy);
      if(armLength<Math.min(width,height)*.035)return null;
      const angle=Math.atan2(Math.abs(wx-sx),wy-sy)*180/Math.PI;
      return {angle,pixels:[{x:sx,y:sy},{x:wx,y:wy}],secondary:angle};
    }
    if(compound){
      const hipIndex=23+(side==='right'?1:0),kneeIndex=25+(side==='right'?1:0),ankleIndex=27+(side==='right'?1:0);
      let hip=points?.[hipIndex],knee=points?.[kneeIndex],ankle=points?.[ankleIndex];
      if(!visible(hip)||!visible(knee)||!visible(ankle)){
        hip=points?.[23+(side==='right'?0:1)];
        knee=points?.[25+(side==='right'?0:1)];
        ankle=points?.[27+(side==='right'?0:1)];
      }
      if(!visible(hip)||!visible(knee))return null;
      const pixels=[{x:hip.x*width,y:hip.y*height},{x:knee.x*width,y:knee.y*height},...(visible(ankle)?[{x:ankle.x*width,y:ankle.y*height}]:[])];
      function measure([a,b,c]) {
        const ax=a.x-b.x,ay=a.y-b.y,bx=c.x-b.x,by=c.y-b.y;
        if(Math.min(Math.hypot(ax,ay),Math.hypot(bx,by))<Math.min(width,height)*.035)return null;
        return Math.atan2(Math.abs(ax*by-ay*bx),ax*bx+ay*by)*180/Math.PI;
      }
      const kneeAngle=pixels.length===3&&visible(ankle)?measure([hip&&pixels[0],pixels[1],pixels[2]]):null;
      if(exercise==='Hip hinge'){
        if(!visible(points?.[11+(side==='right'?1:0)])&&!visible(points?.[12+(side==='right'?0:1)]))return null;
        const shoulderIndex=11+(side==='right'?1:0);
        const shoulder=visible(points?.[shoulderIndex])?points?.[shoulderIndex]:points?.[11+(side==='right'?0:1)];
        if(!visible(shoulder))return null;
        const shoulderPixels={x:shoulder.x*width,y:shoulder.y*height};
        const hipAngle=measure([shoulderPixels,pixels[0],pixels[1]]);
        if(hipAngle===null)return null;
        return {angle:hipAngle,pixels:[shoulderPixels,...pixels.slice(0,2)],secondary:kneeAngle};
      }
      if(kneeAngle===null)return null;
      return {angle:kneeAngle,pixels,secondary:null};
    }
    return null;
  }
  const pixels=joints.map(p=>({x:p.x*width,y:p.y*height}));
  function measure([hip,joint,ankle]) {
  const ax = hip.x-joint.x, ay = hip.y-joint.y, bx = ankle.x-joint.x, by = ankle.y-joint.y;
  if (Math.min(Math.hypot(ax, ay), Math.hypot(bx, by)) < Math.min(width,height)*.035) return null;
  const angle = Math.atan2(Math.abs(ax*by-ay*bx), ax*bx+ay*by)*180/Math.PI;
  return angle;
  }
  const kneeAngle=measure(compound?pixels.slice(1):pixels);
  const hipAngle=compound?measure(pixels.slice(0,3)):null;
  if(kneeAngle===null || (compound && hipAngle===null))return null;
  return {angle:exercise==='Hip hinge'?hipAngle:kneeAngle,pixels,secondary:exercise==='Hip hinge'?kneeAngle:hipAngle};
}

export class CycleTracker {
  constructor(exercise="Knee bend",range={}){this.exercise=exercise;const def=exercises[exercise]||exercises["Knee bend"];this.range={start:range.start??def.start,end:range.end??def.end};if(!Number.isFinite(this.range.start)||!Number.isFinite(this.range.end)||this.range.start<0||this.range.start>180||this.range.end<0||this.range.end>180||Math.abs(this.range.start-this.range.end)<10||(def.raised?this.range.start>=this.range.end:this.range.start<=this.range.end))throw Error("Keep the two endpoints at least 10 degrees apart in the exercise direction.");this.reps=0;this.min=null;this.max=null;this.resetSignal()}
  resetSignal(){this.angle=null;this.phase='waiting';this.last=null;this.zone=null;this.since=0}
  observe(value, time, secondary){
    if (!Number.isFinite(value)){this.resetSignal();return}
    if(this.last!==null&&time<=this.last){this.resetSignal();return}
    if(this.last!==null && time-this.last>650)this.resetSignal();
    const weight=this.last===null?1:1-Math.exp(-(time-this.last)/95);
    this.angle=this.angle===null?value:this.angle+weight*(value-this.angle);
    this.last=time;
    const n=Math.round(this.angle);
    this.min=this.min===null?n:Math.min(n,this.min);this.max=this.max===null?n:Math.max(n,this.max);
    const name=baseExercise(this.exercise); const raise=name==='Arm raise';
    const zone=(raise?this.angle<=this.range.start:this.angle>=this.range.start)?'extended':(raise?this.angle>=this.range.end:this.angle<=this.range.end)?'bent':'between';
    if(zone!==this.zone){this.zone=zone;this.since=time}
    if(time-this.since<180)return;
    if(zone==='extended'){if(this.phase==='bent')this.reps++;this.phase='extended'}
    const coordinated=name==='Hip hinge'?secondary>=140:name==='Bodyweight squat'?!Number.isFinite(secondary)||(this.exercise==='Mini squat'?secondary<=165:secondary<=135):true;
    if(zone==='bent' && coordinated && this.phase==='extended')this.phase='bent';
  }
}
