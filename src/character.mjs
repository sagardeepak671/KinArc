import {baseExercise} from './exercise-types.mjs';
// Angles are measured at the same joint used by the live tracker.
export function portrait(ctx, exercise, side, degrees) {
  const originalExercise=exercise; exercise=baseExercise(exercise);
  const standingCurl=originalExercise==='Standing hamstring curl';
  const seated=exercise==='Knee bend'&&!standingCurl, front=originalExercise==='Arm raise',raise=exercise==='Arm raise';
  const rad=Math.PI/180;
  const end=([x,y],length,heading)=>[x+length*Math.cos(heading*rad),y+length*Math.sin(heading*rad)];
  const skin=['#f0b38d','#cd8665','#a35e47'], shirt=['#91a990','#668771','#496655'];
  const denim=['#686879','#4b4e61','#393c4b'], shoe=['#fff1d9','#dabfa0','#ad9077'];
  ctx.save();ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
  ctx.fillStyle='#ecdfcb';ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
  const scale=Math.min(ctx.canvas.width/640,ctx.canvas.height/350);
  ctx.translate(ctx.canvas.width/2,ctx.canvas.height/2);ctx.scale(side==='right'?-scale:scale,scale);ctx.translate(-320,-175);
  function segment(a,b,r1,r2,colors){
    ctx.save();ctx.translate(...a);ctx.rotate(Math.atan2(b[1]-a[1],b[0]-a[0]));
    const n=Math.hypot(b[0]-a[0],b[1]-a[1]),g=ctx.createLinearGradient(0,-r1,0,r1);
    colors.forEach((c,i)=>g.addColorStop(i/2,c));ctx.fillStyle=g;
    ctx.beginPath();ctx.moveTo(0,-r1);ctx.lineTo(n,-r2);ctx.arc(n,0,r2,-Math.PI/2,Math.PI/2);ctx.lineTo(0,r1);ctx.arc(0,0,r1,Math.PI/2,1.5*Math.PI);ctx.fill();ctx.restore();
  }
  function oval(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()}
  function leg(hip,knee,ankle){segment(hip,knee,18,14,denim);segment(knee,ankle,14,9,denim);segment(ankle,[ankle[0]+17,ankle[1]+4],10,8,shoe)}
  function arm(shoulder,elbow,hand){segment(shoulder,elbow,11,9,skin);segment(elbow,hand,9,6,skin);segment(shoulder,end(shoulder,17,Math.atan2(elbow[1]-shoulder[1],elbow[0]-shoulder[0])/rad),15,13,shirt);oval(...hand,8,9,skin[1]);if(originalExercise==='Hammer curl')segment([hand[0]-4,hand[1]],[hand[0]-4,hand[1]-12],4,3,skin)}
  oval(315,315,116,8,'#cfbda5');
  const hip=[294,190], shoulder=[304,105];
  const squat=exercise==='Bodyweight squat', hinge=exercise==='Hip hinge';
  if(squat||hinge){
    const ankle=[315,301], flex=180-degrees;
    const shin=squat?flex*.34:8;
    const knee=end(ankle,56,-90+shin);
    const pelvis=end(knee,58,-90+shin-(squat?flex:23));
    const lean=squat?flex*.42:flex-15;
    for(const offset of [-14,0])leg([pelvis[0]+offset,pelvis[1]],[knee[0]+offset,knee[1]],[ankle[0]+offset,ankle[1]]);
    ctx.translate(...pelvis);ctx.rotate(lean*rad);ctx.translate(-hip[0],-hip[1]);
  }
  if(standingCurl){segment([218,125],[218,300],7,7,shoe);segment([207,205],[246,205],8,8,shoe);segment([242,209],[242,300],7,7,shoe)}
  if(seated){segment([262,203],[262,300],10,10,shoe);segment([349,203],[349,300],10,10,shoe);segment([251,200],[359,200],11,11,shoe)}
  if(!squat&&!hinge){leg([279,191],seated?[339,206]:[273,247],seated?[329,298]:[266,301]);
  const k=seated?[372,190]:[309,247];
  leg(hip,k,seated?end(k,79,180-degrees):standingCurl?end(k,54,Math.atan2(hip[1]-k[1],hip[0]-k[0])/rad-degrees):[315,301]);}
  if(originalExercise==='Good morning')arm([275,106],[254,136],[294,126]);else if(standingCurl)arm([275,106],[246,133],[218,145]);else if(squat)arm([275,106],[311,136],[355,140]);else arm([275,106],seated?[281,150]:[263,151],seated?[325,173]:[264,198]);
  segment(hip,[294,113],22,27,shirt);
  segment([294,101],[294,81],10,11,skin);
  segment([294,73],[294,61],19,22,skin);
  oval(291,52,23,12,'#52413a');oval(278,56,11,12,'#52413a');
  oval(front?302:310,67,2,2,'#483a33');if(front)oval(287,67,2,2,'#483a33');
  oval(front?295:313,74,4,3,'#cf896a');
  const upper=squat?40:hinge?95:raise?Math.atan2(hip[1]-shoulder[1],hip[0]-shoulder[0])/rad-degrees:seated?67:88, elbow=end(shoulder,47,upper);
  const lower=squat?5:hinge?upper:raise?upper:seated?20:standingCurl?upper:upper-(180-degrees);
  if(originalExercise==='Good morning')arm(shoulder,[324,137],[280,126]);else arm(shoulder,elbow,end(elbow,48,lower));ctx.restore();
}
