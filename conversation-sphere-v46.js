(()=>{'use strict';
const HOST='#home .homeTalkCard.chat-open .robotVisual';
let mounted=false,dead=false,renderer,scene,camera,root,shell,plasma,micro,halo,core,core2,rays=[],fragments=[],clock,ro,host;
let life=.2,target=.2,anger=0,lastColor=0;

function glowTexture(size=256){
  const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d'),h=size/2;
  const g=x.createRadialGradient(h,h,0,h,h,h);
  g.addColorStop(0,'rgba(255,255,255,1)');
  g.addColorStop(.035,'rgba(255,255,255,.98)');
  g.addColorStop(.10,'rgba(255,255,255,.62)');
  g.addColorStop(.22,'rgba(255,255,255,.18)');
  g.addColorStop(.42,'rgba(255,255,255,.035)');
  g.addColorStop(.68,'rgba(255,255,255,.004)');
  g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=g;x.fillRect(0,0,size,size);
  return new THREE.CanvasTexture(c);
}
function fragmentTexture(){
  const c=document.createElement('canvas');c.width=c.height=96;const x=c.getContext('2d');
  const g=x.createRadialGradient(48,48,0,48,48,48);
  g.addColorStop(0,'rgba(255,255,255,.95)');
  g.addColorStop(.12,'rgba(255,255,255,.42)');
  g.addColorStop(.34,'rgba(255,255,255,.10)');
  g.addColorStop(.62,'rgba(255,255,255,.01)');
  g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=g;x.fillRect(0,0,96,96);
  return new THREE.CanvasTexture(c);
}
function randomDir(){
  return new THREE.Vector3(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize();
}
function cloud(count,minR,maxR,size,opacity){
  const g=new THREE.BufferGeometry(),a=new Float32Array(count*3);
  for(let i=0;i<count;i++){
    const d=randomDir(),r=minR+Math.pow(Math.random(),1.7)*(maxR-minR);
    a[i*3]=d.x*r;a[i*3+1]=d.y*r;a[i*3+2]=d.z*r;
  }
  g.setAttribute('position',new THREE.BufferAttribute(a,3));
  const m=new THREE.PointsMaterial({color:0xffffff,size,transparent:true,opacity,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false});
  const p=new THREE.Points(g,m);return p;
}
function makeRay(i,tube=true){
  const dir=randomDir(),a=randomDir(),b=randomDir(),pts=[],steps=18,len=.62+Math.random()*.72;
  for(let j=0;j<steps;j++){
    const p=j/(steps-1),taper=Math.sin(p*Math.PI),q=dir.clone().multiplyScalar(.03+len*p);
    q.add(a.clone().multiplyScalar(Math.sin(p*Math.PI*(2.0+(i%5)*.08)+i*.67)*.064*taper));
    q.add(b.clone().multiplyScalar(Math.cos(p*Math.PI*1.75+i*.41)*.038*taper));
    pts.push(q);
  }
  const curve=new THREE.CatmullRomCurve3(pts);
  let geo,mat,obj;
  if(tube){
    geo=new THREE.TubeGeometry(curve,22,.0042+Math.random()*.0022,3,false);
    mat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.18+Math.random()*.12,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false});
    obj=new THREE.Mesh(geo,mat);
  }else{
    geo=new THREE.BufferGeometry().setFromPoints(curve.getPoints(28));
    mat=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.16+Math.random()*.10,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false});
    obj=new THREE.Line(geo,mat);
  }
  obj.renderOrder=18;root.add(obj);
  rays.push({obj,base:mat.opacity,phase:Math.random()*Math.PI*2,speed:.08+Math.random()*.18});
}
function card(){return document.querySelector('#home .professorPanel.homeTalkCard')}
function personality(c){
  if(c?.classList.contains('persona-hard'))return'hard';
  if(c?.classList.contains('persona-tranquilo'))return'tranquilo';
  return'doideira';
}
function visualState(c){
  if(c?.classList.contains('robot-angry'))return'angry';
  if(c?.classList.contains('robot-listening'))return'listening';
  if(c?.classList.contains('robot-thinking'))return'thinking';
  if(c?.classList.contains('robot-speaking')||c?.classList.contains('audio-speaking'))return'speaking';
  if(c?.classList.contains('robot-happy'))return'happy';
  if(c?.classList.contains('robot-oops'))return'oops';
  return'idle';
}
function palette(person,st,t){
  let h=.50,s=.80,l=.58;
  if(person==='tranquilo'){h=.49;s=.68;l=.57}
  else if(person==='doideira'){h=(.50+t*.025)%1;s=.94;l=.61}
  else if(person==='hard'){h=.56;s=.90;l=.57}
  const rage=person==='hard'&&st==='angry';
  anger+=(rage?1-anger:-anger)*.11;
  const base=new THREE.Color().setHSL(h,s,l);
  if(anger>.001)base.lerp(new THREE.Color(0xff1638),Math.min(1,anger));
  return{color:base,h:anger>.02?0:h,s:anger>.02?1:s,l:anger>.02?.57:l,rage:anger>.12};
}
function resize(){
  if(!host||!renderer)return;
  const r=host.getBoundingClientRect(),w=Math.max(1,r.width),h=Math.max(1,r.height);
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}
function mount(){
  host=document.querySelector(HOST);
  if(!host||host.querySelector('.conversationSphereV46'))return false;
  const wrap=document.createElement('div');wrap.className='conversationSphereV46';host.appendChild(wrap);

  scene=new THREE.Scene();
  camera=new THREE.PerspectiveCamera(48,1,.1,100);
  camera.position.z=5.55;

  renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.55));
  renderer.sortObjects=true;
  wrap.appendChild(renderer.domElement);

  root=new THREE.Group();scene.add(root);

  const geo=new THREE.IcosahedronGeometry(1.58,4);
  geo.setAttribute('color',new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count*3),3));
  shell=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({
    vertexColors:true,wireframe:true,transparent:true,opacity:.54,
    blending:THREE.NormalBlending,depthWrite:false,depthTest:false
  }));
  shell.renderOrder=30;root.add(shell);

  plasma=cloud(900,.10,1.18,.0125,.20);plasma.renderOrder=8;root.add(plasma);
  micro=cloud(360,.58,1.42,.0065,.075);micro.renderOrder=10;root.add(micro);
  halo=cloud(300,1.90,2.95,.020,.16);halo.renderOrder=2;scene.add(halo);

  const gt=glowTexture(),ft=fragmentTexture();
  core=new THREE.Sprite(new THREE.SpriteMaterial({
    map:gt,color:0xffffff,transparent:true,opacity:.66,
    blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false
  }));
  core.scale.set(1.06,1.06,1);core.renderOrder=1;root.add(core);

  core2=new THREE.Sprite(new THREE.SpriteMaterial({
    map:gt,color:0xffffff,transparent:true,opacity:.24,
    blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false
  }));
  core2.scale.set(.68,1.16,1);core2.rotation.z=.62;core2.renderOrder=2;root.add(core2);

  for(let i=0;i<28;i++)makeRay(i,true);
  for(let i=28;i<42;i++)makeRay(i,false);

  for(let i=0;i<170;i++){
    const d=randomDir(),r=.42+Math.pow(Math.random(),1.45)*1.02;
    const m=new THREE.SpriteMaterial({
      map:ft,color:0xffffff,transparent:true,opacity:.012+Math.random()*.036,
      blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false
    });
    const s=new THREE.Sprite(m);s.position.copy(d.multiplyScalar(r));
    const size=.014+Math.random()*.030;s.scale.set(size,size,1);s.renderOrder=12;root.add(s);
    fragments.push({s,base:s.position.clone(),opacity:m.opacity,phase:Math.random()*6.28,speed:.10+Math.random()*.18,size});
  }

  clock=new THREE.Clock();
  ro=new ResizeObserver(resize);ro.observe(host);resize();
  mounted=true;animate();return true;
}
function animate(){
  if(dead||!mounted)return;
  requestAnimationFrame(animate);

  const c=card(),active=!!document.querySelector('#home.conversation-focus .homeTalkCard.chat-open');
  const dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;
  if(!active){renderer.domElement.style.visibility='hidden';return}
  renderer.domElement.style.visibility='visible';

  const person=personality(c),st=visualState(c);
  target={idle:.20,listening:.48,thinking:.72,speaking:1,happy:.64,oops:.56,angry:1}[st]||.2;
  life+=(target-life)*.06;

  const pal=palette(person,st,t),col=pal.color;
  plasma.material.color.copy(col);micro.material.color.copy(col);halo.material.color.copy(col);core2.material.color.copy(col);

  shell.material.opacity=.46+life*.12+(pal.rage?.08:0);
  plasma.material.opacity=.15+life*.055+(pal.rage?.045:0);
  micro.material.opacity=.050+life*.024+(pal.rage?.018:0);
  halo.material.opacity=.11+life*.055;

  root.rotation.y+=(st==='thinking'?.0020:.00065)+(person==='doideira'?.00045:0);
  root.rotation.x=Math.sin(t*.16)*.035;
  halo.rotation.y-=.00055;

  const breathe=1+Math.sin(t*(.90+life*.38))*(.015+life*.018);
  root.scale.set(
    breathe*(1+Math.sin(t*.63)*.009),
    breathe*(1-Math.sin(t*.63)*.008),
    breathe
  );

  const pulse=1+Math.sin(t*1.12)*.035+life*.028;
  core.scale.set(1.02*pulse,1.02*pulse,1);
  core.material.opacity=.54+life*.08+(pal.rage?.07:0);
  core2.scale.set(.67*(1+Math.sin(t*.74)*.035),1.15*(1-Math.sin(t*.74)*.018),1);
  core2.rotation.z+=.0009+(pal.rage?.0017:0);
  core2.material.opacity=.18+life*.065+(pal.rage?.04:0);

  rays.forEach(r=>{
    r.obj.rotation.y+=r.speed*.0006;
    r.obj.rotation.x+=Math.sin(t*.22+r.phase)*.00012;
    r.obj.material.color.copy(col);
    r.obj.material.opacity=r.base*(.82+Math.sin(t*.86+r.phase)*.13+life*.34+(pal.rage?.55:0));
  });

  fragments.forEach(f=>{
    const q=1+Math.sin(t*f.speed+f.phase)*.040+(st==='speaking'?life*.010:0);
    f.s.position.set(f.base.x*q,f.base.y*q,f.base.z*q);
    f.s.material.color.copy(col);
    f.s.material.opacity=f.opacity*(.55+Math.sin(t*.72+f.phase)*.18+life*.20+(pal.rage?.25:0));
    const sc=f.size*(1+Math.sin(t*.61+f.phase)*.12);f.s.scale.set(sc,sc,1);
  });

  if(st==='angry'&&person==='hard'){
    root.rotation.z=Math.sin(t*23)*.022;
    root.scale.multiplyScalar(1+Math.sin(t*8.5)*.013);
  }else{
    root.rotation.z=Math.sin(t*.12)*.014;
  }

  if(t-lastColor>.045){
    lastColor=t;
    const ca=shell.geometry.attributes.color,pa=shell.geometry.attributes.position,tmp=new THREE.Color();
    for(let i=0;i<ca.count;i++){
      const y=pa.getY(i)/1.58;
      const hh=pal.rage?0:((pal.h+y*.12+t*.018)%1);
      tmp.setHSL(hh,pal.s,Math.max(.40,Math.min(.70,pal.l+y*.055)));
      ca.setXYZ(i,tmp.r,tmp.g,tmp.b);
    }
    ca.needsUpdate=true;
  }

  renderer.render(scene,camera);
}
function boot(){
  if(!window.THREE)return;
  let tries=0;const id=setInterval(()=>{tries++;if(mount()||tries>35)clearInterval(id)},160);
}
window.addEventListener('pagehide',()=>{dead=true;try{ro?.disconnect();renderer?.dispose()}catch{}});
document.readyState==='loading'
  ?document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,380),{once:true})
  :setTimeout(boot,380);
})();