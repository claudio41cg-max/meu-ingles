(()=>{'use strict';
const HOST='#home .homeTalkCard.chat-open .robotVisual';
let mounted=false,dead=false,renderer,scene,camera,root,shell,innerPts,plasma,halo,core,core2,rays=[],clock,ro,host;
function tex(){
  const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
  const g=x.createRadialGradient(128,128,0,128,128,128);
  g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.035,'rgba(255,255,255,.98)');
  g.addColorStop(.11,'rgba(255,255,255,.58)');g.addColorStop(.24,'rgba(255,255,255,.18)');
  g.addColorStop(.48,'rgba(255,255,255,.025)');g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=g;x.fillRect(0,0,256,256);return new THREE.CanvasTexture(c);
}
function randPoint(minR,maxR){
  const u=Math.random(),v=Math.random(),th=2*Math.PI*u,ph=Math.acos(2*v-1),r=minR+Math.random()*(maxR-minR);
  return new THREE.Vector3(r*Math.sin(ph)*Math.cos(th),r*Math.cos(ph),r*Math.sin(ph)*Math.sin(th));
}
function points(count,minR,maxR,size,opacity){
  const g=new THREE.BufferGeometry(),a=new Float32Array(count*3);
  for(let i=0;i<count;i++){const p=randPoint(minR,maxR);a[i*3]=p.x;a[i*3+1]=p.y;a[i*3+2]=p.z}
  g.setAttribute('position',new THREE.BufferAttribute(a,3));
  return new THREE.Points(g,new THREE.PointsMaterial({color:0xffffff,size,transparent:true,opacity,blending:THREE.AdditiveBlending,depthWrite:false}));
}
function makeRay(i){
  const dir=randPoint(1,1).normalize(),side=randPoint(1,1).normalize(),pts=[],n=15,len=.55+Math.random()*.72;
  for(let j=0;j<n;j++){const p=j/(n-1),q=dir.clone().multiplyScalar(.03+len*p);q.add(side.clone().multiplyScalar(Math.sin(p*Math.PI*2+i*.63)*.05*Math.sin(p*Math.PI)));pts.push(q)}
  const g=new THREE.BufferGeometry().setFromPoints(pts);
  const m=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.14+Math.random()*.10,blending:THREE.AdditiveBlending,depthWrite:false});
  const line=new THREE.Line(g,m);root.add(line);rays.push({line,base:m.opacity,phase:Math.random()*6.28,speed:.08+Math.random()*.16});
}
function card(){return document.querySelector('#home .professorPanel.homeTalkCard')}
function personality(c){if(c?.classList.contains('persona-hard'))return'hard';if(c?.classList.contains('persona-tranquilo'))return'tranquilo';return'doideira'}
function state(c){if(c?.classList.contains('robot-angry'))return'angry';if(c?.classList.contains('robot-listening'))return'listening';if(c?.classList.contains('robot-thinking'))return'thinking';if(c?.classList.contains('robot-speaking')||c?.classList.contains('audio-speaking'))return'speaking';if(c?.classList.contains('robot-happy'))return'happy';if(c?.classList.contains('robot-oops'))return'oops';return'idle'}
let life=.2,target=.2,hue=.50,anger=0,last=0;
function palette(person,st,t){
  let h=.50,s=.78,l=.58,speed=.018;
  if(person==='tranquilo'){h=.50;s=.68;l=.56;speed=.010}
  if(person==='doideira'){h=(.50+t*.018)%1;s=.92;l=.60;speed=.045}
  if(person==='hard'){h=.56;s=.88;l=.56;speed=.028}
  const rage=person==='hard'&&st==='angry';anger+=(rage?1:0-anger)*.12;
  if(rage||anger>.01){const c=new THREE.Color().setHSL(h,s,l);const r=new THREE.Color(0xff1838);c.lerp(r,Math.min(1,anger));return{c,h:c.getHSL({h:0,s:0,l:0}).h,s:1,l:.58,rage:true}}
  hue=(hue+speed*.0015)%1;return{c:new THREE.Color().setHSL(h,s,l),h,s,l,rage:false}
}
function resize(){if(!host||!renderer)return;const r=host.getBoundingClientRect(),w=Math.max(1,r.width),h=Math.max(1,r.height);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
function mount(){
  host=document.querySelector(HOST);if(!host||host.querySelector('.conversationSphereV46'))return false;
  const wrap=document.createElement('div');wrap.className='conversationSphereV46';host.appendChild(wrap);
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(48,1,.1,100);camera.position.z=5.2;
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));wrap.appendChild(renderer.domElement);
  root=new THREE.Group();scene.add(root);
  const g=new THREE.IcosahedronGeometry(1.52,3);g.setAttribute('color',new THREE.BufferAttribute(new Float32Array(g.attributes.position.count*3),3));
  shell=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,wireframe:true,transparent:true,opacity:.45,depthWrite:false}));root.add(shell);
  innerPts=points(380,.16,1.14,.012,.13);root.add(innerPts);
  plasma=points(720,.10,1.04,.018,.18);root.add(plasma);
  halo=points(260,1.85,2.85,.022,.20);scene.add(halo);
  const tx=tex();
  core=new THREE.Sprite(new THREE.SpriteMaterial({map:tx,color:0xffffff,transparent:true,opacity:.92,blending:THREE.AdditiveBlending,depthWrite:false}));core.scale.set(1.42,1.42,1);root.add(core);
  core2=new THREE.Sprite(new THREE.SpriteMaterial({map:tx,color:0xffffff,transparent:true,opacity:.34,blending:THREE.AdditiveBlending,depthWrite:false}));core2.scale.set(.86,1.35,1);core2.rotation.z=.6;root.add(core2);
  for(let i=0;i<28;i++)makeRay(i);
  clock=new THREE.Clock();ro=new ResizeObserver(resize);ro.observe(host);resize();mounted=true;animate();return true;
}
function animate(){
  if(dead||!mounted)return;requestAnimationFrame(animate);
  const c=card(),active=!!document.querySelector('#home.conversation-focus .homeTalkCard.chat-open'),dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;
  if(!active){renderer.domElement.style.visibility='hidden';return}else renderer.domElement.style.visibility='visible';
  const p=personality(c),st=state(c),cfg={idle:.2,listening:.48,thinking:.70,speaking:1,happy:.62,oops:.55,angry:1}[st]||.2;target=cfg;life+=(target-life)*.06;
  const pal=palette(p,st,t),col=pal.c;
  shell.material.color.copy(col);innerPts.material.color.copy(col);plasma.material.color.copy(col);halo.material.color.copy(col);core2.material.color.copy(col);
  shell.material.opacity=.34+life*.16+(pal.rage?.12:0);plasma.material.opacity=.12+life*.08+(pal.rage?.08:0);halo.material.opacity=.13+life*.08;
  root.rotation.y+=(st==='thinking'?.0022:.0008)+(p==='doideira'?.0006:0);root.rotation.x=Math.sin(t*.19)*.04;halo.rotation.y-=.0007;
  const breathe=1+Math.sin(t*(.95+life*.55))*(.02+life*.025);root.scale.set(breathe*(1+Math.sin(t*.63)*.012),breathe*(1-Math.sin(t*.63)*.010),breathe);
  const pulse=1+Math.sin(t*1.2)*.05+life*.055;core.scale.setScalar(1.35*pulse);core.material.opacity=.76+life*.14+(pal.rage?.10:0);
  core2.rotation.z+=.0012+(pal.rage?.002:0);core2.material.opacity=.24+life*.12;
  rays.forEach(r=>{r.line.rotation.y+=r.speed*.0007;r.line.material.color.copy(col);r.line.material.opacity=r.base*(.72+Math.sin(t*.9+r.phase)*.18+life*.45+(pal.rage?.55:0))});
  if(st==='angry'&&p==='hard'){root.rotation.z=Math.sin(t*24)*.025;root.scale.multiplyScalar(1+Math.sin(t*9)*.018)}else root.rotation.z=Math.sin(t*.13)*.018;
  const ca=shell.geometry.attributes.color,pa=shell.geometry.attributes.position,tmp=new THREE.Color();
  if(t-last>.05){last=t;for(let i=0;i<ca.count;i++){const y=pa.getY(i)/1.52,hh=pal.rage?0:((pal.h+y*.10+t*.012)%1);tmp.setHSL(hh,pal.s,pal.l+y*.045);ca.setXYZ(i,tmp.r,tmp.g,tmp.b)}ca.needsUpdate=true}
  renderer.render(scene,camera);
}
function boot(){if(!window.THREE)return;let tries=0;const id=setInterval(()=>{tries++;if(mount()||tries>30)clearInterval(id)},180)}
window.addEventListener('pagehide',()=>{dead=true;try{ro?.disconnect();renderer?.dispose()}catch{}});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,420),{once:true}):setTimeout(boot,420);
})();