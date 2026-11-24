import {fileURLToPath} from 'node:url';process.chdir(fileURLToPath(new URL('../',import.meta.url)));
// Original KinArc instructional artwork. Geometry follows the demonstrated movement.
const {writeFile,mkdir}=await import('node:fs/promises');
const {exerciseList}=await import('../src/exercises.mjs');await mkdir('public/images/exercises',{recursive:true});
const polar=(p,l,d)=>[p[0]+l*Math.cos(d*Math.PI/180),p[1]+l*Math.sin(d*Math.PI/180)];
const line=(a,b,color,width=16,extra='')=>`<path d="M${a}L${b}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" ${extra}/>`;
const dot=(p,r,color)=>`<circle cx="${p[0]}" cy="${p[1]}" r="${r}" fill="${color}"/>`;
function pose(name){let hip=[187,186],shoulder=[190,112],knee=[195,246],ankle=[197,303],elbow=[195,157],hand=[195,203];let chair='';
 if(name==='Knee bend'){hip=[175,187];shoulder=[176,111];knee=[231,190];ankle=polar(knee,88,82);elbow=[178,152];hand=[210,178];chair=`<path d="M145 200h90 M151 200v109 M226 200v109" stroke="#82918b" fill="none" stroke-width="7" stroke-linecap="round"/>`}
 if(['Elbow curl','Hammer curl'].includes(name)){elbow=[193,159];hand=polar(elbow,46,-48)}
 if(name==='Arm raise'){shoulder=[199,112];hip=[199,186];elbow=polar(shoulder,49,-8);hand=polar(elbow,48,-8)}
 if(name==='Front raise'){elbow=polar(shoulder,49,-12);hand=polar(elbow,48,-12)}
 if(['Bodyweight squat','Mini squat'].includes(name)){const flex=name==='Mini squat'?30:67;ankle=[224,303];knee=polar(ankle,59,-90+flex*.34);hip=polar(knee,64,-90+flex*.34-flex);shoulder=polar(hip,78,-90+flex*.42);elbow=polar(shoulder,46,25);hand=polar(elbow,45,0)}
 if(['Hip hinge','Good morning'].includes(name)){ankle=[208,303];knee=polar(ankle,59,-82);hip=polar(knee,64,-105);shoulder=polar(hip,78,-45);elbow=polar(shoulder,47,65);hand=polar(elbow,46,65);if(name==='Good morning'){elbow=polar(shoulder,45,105);hand=polar(shoulder,32,145)}}
 if(name==='Standing hamstring curl'){knee=[187,246];ankle=polar(knee,60,150);elbow=[151,145];hand=[124,150];chair=`<path d="M120 135v173 M111 220h47 M155 220v88" stroke="#82918b" fill="none" stroke-width="7" stroke-linecap="round"/>`}
 const head=[shoulder[0]+1,shoulder[1]-35];const offset=p=>[p[0]-18,p[1]];
 let figure=chair+line(offset(hip),offset(knee),'#65766b',18)+line(offset(knee),name==='Standing hamstring curl'?[176,302]:offset(ankle),'#65766b',15);
 figure+=line(offset(ankle),[offset(ankle)[0]+18,offset(ankle)[1]+2],'#faf9f2',12);
 const farElbow=name==='Good morning'?[shoulder[0]+8,shoulder[1]+32]:[shoulder[0]-23,shoulder[1]+40],farHand=name==='Good morning'?[shoulder[0]+24,shoulder[1]+25]:[shoulder[0]-26,shoulder[1]+80];
 figure+=line([shoulder[0]-14,shoulder[1]+3],farElbow,'#bd8062',14)+line(farElbow,farHand,'#bd8062',12);
 figure+=line(hip,shoulder,'#f9f7ee',43)+line(hip,knee,'#2d4438',20)+line(knee,ankle,'#2d4438',16)+line(ankle,[ankle[0]+18,ankle[1]+2],'#f9f7ee',12);
 figure+=line([shoulder[0],shoulder[1]-5],[head[0],head[1]+17],'#dba17e',14)+dot(head,18,'#dba17e')+`<path d="M${head[0]-17} ${head[1]+1}q-4-31 22-22q18 5 13 22l-10-13-25 6" fill="#322e28"/>`;
 figure+=line(shoulder,elbow,'#dba17e',14)+line(elbow,hand,'#dba17e',12)+line(shoulder,polar(shoulder,19,Math.atan2(elbow[1]-shoulder[1],elbow[0]-shoulder[0])*180/Math.PI),'#f9f7ee',20)+dot(hand,7,'#dba17e');
 if(name==='Hammer curl')figure+=line(hand,[hand[0]-2,hand[1]-11],'#dba17e',5);
 const joints=[shoulder,hip,knee,ankle];return {figure,joints};
}
for(const e of exerciseList){const {figure}=pose(e.name);const bg={Legs:'#dee5d7',Arms:'#e8ded3',Shoulders:'#e4e6dc',Hips:'#e2dfd0'}[e.area];const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360"><title>${e.name} — original instructional illustration</title><rect width="480" height="360" fill="${bg}"/><path d="M35 317H445" stroke="#abb6a5"/><g transform="translate(30 -2)">${figure}</g></svg>`;await writeFile(`public/images/exercises/${e.id}.svg`,svg)}
const {figure,joints}=pose('Bodyweight squat');const skeleton=joints.slice(1).map((p,i)=>line(joints[i],p,'#b5ef85',2)).join('')+joints.map(p=>dot(p,4,'#b5ef85')).join('');
await writeFile('public/images/tracking-preview.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="680" height="440" viewBox="0 0 680 440"><rect width="680" height="440" fill="#233b2d"/><path d="M45 375H635" stroke="#607866"/><path d="M85 80v-25h25 M570 55h25v25 M85 335v25h25 M570 360h25v-25" fill="none" stroke="#7d9781" stroke-width="2"/><g transform="translate(118 34)">${figure}${skeleton}</g><text x="40" y="35" fill="#dbe7dc" font-family="sans-serif" font-size="13">Bodyweight squat · side view</text><rect x="460" y="110" width="160" height="130" rx="6" fill="#182a20"/><text x="478" y="139" fill="#c2d2c4" font-family="sans-serif" font-size="13">Visible landmarks</text><text x="478" y="170" fill="#b5ef85" font-family="sans-serif" font-size="15">Hip · knee · ankle</text><text x="478" y="205" fill="#c2d2c4" font-family="sans-serif" font-size="12">Bend, then return</text></svg>`);
await writeFile('public/images/camera-setup.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="450" viewBox="0 0 720 450"><g stroke="#617b68" fill="none" stroke-width="2"><path d="M255 105V75h30 M435 75h30v30 M255 300v30h30 M435 330h30v-30"/><circle cx="360" cy="137" r="22"/><path d="M360 159v80 M360 180l-40 45 M360 180l40 45 M360 239l-30 61 M360 239l30 61" stroke-width="9" stroke-linecap="round"/></g><text x="360" y="375" text-anchor="middle" fill="#c0cfc2" font-family="sans-serif" font-size="17">Your camera view will appear here</text><text x="360" y="401" text-anchor="middle" fill="#8ca493" font-family="sans-serif" font-size="13">Watch the guide, then start your camera</text></svg>`);
