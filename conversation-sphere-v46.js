(()=>{
'use strict';

const HOST='#home .homeTalkCard.chat-open .robotVisual';
let mount=null;
let renderer=null;
let scene=null;
let camera=null;
let resizeObserver=null;
let stopped=false;

function getCard(){
  return document.querySelector('#home .professorPanel.homeTalkCard');
}

function getVisualState(){
  const card=getCard();
  if(!card)return {mode:'idle',hard:false,angry:false};

  const hard=card.classList.contains('persona-hard');
  const angry=hard&&card.classList.contains('robot-angry');

  let mode='idle';
  if(card.classList.contains('robot-listening'))mode='listening';
  else if(card.classList.contains('robot-thinking'))mode='thinking';
  else if(card.classList.contains('robot-speaking')||card.classList.contains('audio-speaking'))mode='speaking';

  return {mode,hard,angry};
}

function start(){
  if(!window.THREE)return false;

  mount=document.querySelector(HOST);
  if(!mount)return false;
  if(mount.querySelector('.conversationSphereV46'))return true;

  const sphereMount=document.createElement('div');
  sphereMount.className='conversationSphereV46';
  mount.appendChild(sphereMount);

  // ==========================================================
  // CENA
  // ==========================================================

  scene=new THREE.Scene();

  camera=new THREE.PerspectiveCamera(
    48,
    1,
    .1,
    100
  );

  camera.position.z=7.2;

  renderer=new THREE.WebGLRenderer({
    antialias:true,
    alpha:true
  });

  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  sphereMount.appendChild(renderer.domElement);

  const group=new THREE.Group();
  scene.add(group);


  // ==========================================================
  // ESFERA EXTERNA
  // ==========================================================

  const geo=new THREE.IcosahedronGeometry(1.65,4);
  const pos=geo.attributes.position;
  const original=new Float32Array(pos.array);

  geo.setAttribute(
    'color',
    new THREE.BufferAttribute(
      new Float32Array(pos.count*3),
      3
    )
  );

  const shellColor=geo.attributes.color;

  const shell=new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({
      vertexColors:true,
      wireframe:true,
      transparent:true,
      opacity:.43,
      blending:THREE.NormalBlending,
      depthWrite:false
    })
  );

  shell.renderOrder=10;
  group.add(shell);


  // ==========================================================
  // CAMADA COLORIDA INTERNA
  // ==========================================================

  const innerGeo=new THREE.IcosahedronGeometry(1.39,4);
  const innerOriginal=new Float32Array(
    innerGeo.attributes.position.array
  );

  innerGeo.setAttribute(
    'color',
    new THREE.BufferAttribute(
      new Float32Array(
        innerGeo.attributes.position.count*3
      ),
      3
    )
  );

  const innerColor=innerGeo.attributes.color;

  const inner=new THREE.Mesh(
    innerGeo,
    new THREE.MeshBasicMaterial({
      vertexColors:true,
      transparent:true,
      opacity:.13,
      depthWrite:false
    })
  );

  group.add(inner);


  // ==========================================================
  // TEXTURAS
  // ==========================================================

  function makeCoreTexture(){

    const size=256;
    const canvas=document.createElement('canvas');

    canvas.width=size;
    canvas.height=size;

    const ctx=canvas.getContext('2d');

    const g=ctx.createRadialGradient(
      128,128,0,
      128,128,128
    );

    g.addColorStop(0,'rgba(255,255,255,1)');
    g.addColorStop(.025,'rgba(255,255,255,.98)');
    g.addColorStop(.07,'rgba(255,255,255,.72)');
    g.addColorStop(.14,'rgba(255,255,255,.32)');
    g.addColorStop(.24,'rgba(245,253,255,.10)');
    g.addColorStop(.38,'rgba(240,250,255,.025)');
    g.addColorStop(.55,'rgba(230,248,255,.005)');
    g.addColorStop(1,'rgba(220,245,255,0)');

    ctx.fillStyle=g;
    ctx.fillRect(0,0,size,size);

    return new THREE.CanvasTexture(canvas);
  }

  function makeFragmentTexture(){

    const size=128;
    const canvas=document.createElement('canvas');

    canvas.width=size;
    canvas.height=size;

    const ctx=canvas.getContext('2d');

    const g=ctx.createRadialGradient(
      64,64,0,
      64,64,64
    );

    g.addColorStop(0,'rgba(255,255,255,.95)');
    g.addColorStop(.10,'rgba(255,255,255,.48)');
    g.addColorStop(.28,'rgba(250,254,255,.12)');
    g.addColorStop(.48,'rgba(245,253,255,.025)');
    g.addColorStop(.70,'rgba(240,252,255,.004)');
    g.addColorStop(1,'rgba(255,255,255,0)');

    ctx.fillStyle=g;
    ctx.fillRect(0,0,size,size);

    return new THREE.CanvasTexture(canvas);
  }

  const coreTexture=makeCoreTexture();
  const fragmentTexture=makeFragmentTexture();


  // ==========================================================
  // ALMA / PLASMA
  // ==========================================================

  const soul=new THREE.Group();
  group.add(soul);


  // ==========================================================
  // CENTRO DE ENERGIA
  // ==========================================================

  const coreGlow=new THREE.Sprite(
    new THREE.SpriteMaterial({
      map:coreTexture,
      color:0xffffff,
      transparent:true,
      opacity:.92,
      blending:THREE.AdditiveBlending,
      depthWrite:false
    })
  );

  coreGlow.scale.set(1.52,1.52,1);
  soul.add(coreGlow);


  // ==========================================================
  // BRILHO IRREGULAR CENTRAL
  // ==========================================================

  const coreGlow2=new THREE.Sprite(
    new THREE.SpriteMaterial({
      map:coreTexture,
      color:0xf9feff,
      transparent:true,
      opacity:.36,
      blending:THREE.AdditiveBlending,
      depthWrite:false
    })
  );

  coreGlow2.scale.set(.95,1.55,1);
  coreGlow2.rotation.z=.63;
  soul.add(coreGlow2);


  // ==========================================================
  // RAIOS DO NÚCLEO
  // ==========================================================

  const coreRays=[];
  const CORE_RAY_COUNT=42;

  for(let r=0;r<CORE_RAY_COUNT;r++){

    const direction=new THREE.Vector3(
      Math.random()-.5,
      Math.random()-.5,
      Math.random()-.5
    ).normalize();

    const sideA=new THREE.Vector3(
      Math.random()-.5,
      Math.random()-.5,
      Math.random()-.5
    ).normalize();

    const sideB=new THREE.Vector3(
      Math.random()-.5,
      Math.random()-.5,
      Math.random()-.5
    ).normalize();

    const length=
      .52+
      Math.pow(Math.random(),1.35)*.84;

    const points=[];
    const steps=27;

    for(let j=0;j<steps;j++){

      const p=j/(steps-1);

      const distance=.018+length*p;

      const taper=Math.sin(p*Math.PI);

      const bendA=
        Math.sin(
          p*Math.PI*(2.0+Math.random()*.7)+
          r*.71
        )*.068*taper;

      const bendB=
        Math.cos(
          p*Math.PI*1.85+
          r*.43
        )*.047*taper;

      const point=
        direction.clone().multiplyScalar(distance);

      point.add(
        sideA.clone().multiplyScalar(bendA)
      );

      point.add(
        sideB.clone().multiplyScalar(bendB)
      );

      points.push(point);
    }

    const curve=
      new THREE.CatmullRomCurve3(points);

    const rayGeo=
      new THREE.TubeGeometry(
        curve,
        32,
        .0031+Math.random()*.0023,
        4,
        false
      );

    const rayMaterial=
      new THREE.MeshBasicMaterial({
        color:0xffffff,
        transparent:true,
        opacity:.15+Math.random()*.10,
        blending:THREE.AdditiveBlending,
        depthWrite:false
      });

    const ray=
      new THREE.Mesh(
        rayGeo,
        rayMaterial
      );

    soul.add(ray);

    coreRays.push({
      mesh:ray,
      opacity:rayMaterial.opacity,
      phase:Math.random()*Math.PI*2,
      speed:.10+Math.random()*.20
    });
  }


  // ==========================================================
  // FILAMENTOS FINOS
  // ==========================================================

  const filaments=[];
  const FILAMENT_COUNT=52;

  for(let i=0;i<FILAMENT_COUNT;i++){

    const dir=new THREE.Vector3(
      Math.random()-.5,
      Math.random()-.5,
      Math.random()-.5
    ).normalize();

    const sideA=new THREE.Vector3(
      Math.random()-.5,
      Math.random()-.5,
      Math.random()-.5
    ).normalize();

    const sideB=new THREE.Vector3(
      Math.random()-.5,
      Math.random()-.5,
      Math.random()-.5
    ).normalize();

    const start=.25+Math.random()*.24;

    const end=
      .58+
      Math.pow(Math.random(),.75)*.82;

    const pts=[];
    const count=17;

    for(let j=0;j<count;j++){

      const p=j/(count-1);

      const radius=
        start+
        (end-start)*p;

      const taper=
        Math.pow(
          Math.sin(p*Math.PI),
          .7
        );

      const point=
        dir.clone().multiplyScalar(radius);

      point.add(
        sideA.clone().multiplyScalar(
          Math.sin(
            p*Math.PI*2.3+
            i*.71
          )*.045*taper
        )
      );

      point.add(
        sideB.clone().multiplyScalar(
          Math.cos(
            p*Math.PI*1.7+
            i*.37
          )*.032*taper
        )
      );

      pts.push(point);
    }

    const curve=
      new THREE.CatmullRomCurve3(pts);

    const fg=
      new THREE.TubeGeometry(
        curve,
        20,
        .0012+Math.random()*.0015,
        3,
        false
      );

    const material=
      new THREE.MeshBasicMaterial({
        color:0xffffff,
        transparent:true,
        opacity:.018+Math.random()*.040,
        blending:THREE.AdditiveBlending,
        depthWrite:false
      });

    const mesh=
      new THREE.Mesh(
        fg,
        material
      );

    soul.add(mesh);

    filaments.push({
      mesh,
      opacity:material.opacity,
      phase:Math.random()*Math.PI*2,
      speed:.08+Math.random()*.16
    });
  }


  // ==========================================================
  // PARTÍCULAS INTERNAS
  // ==========================================================

  const PLASMA_COUNT=1050;

  const plasmaGeo=
    new THREE.BufferGeometry();

  const plasmaPositions=
    new Float32Array(
      PLASMA_COUNT*3
    );

  const plasmaBase=
    new Float32Array(
      PLASMA_COUNT*3
    );

  for(let i=0;i<PLASMA_COUNT;i++){

    const theta=
      Math.random()*Math.PI*2;

    const phi=
      Math.acos(
        2*Math.random()-1
      );

    const directionNoise=
      Math.sin(theta*2.73)*.11+
      Math.cos(phi*4.31)*.09+
      Math.sin(
        theta*4.17+
        phi*2.3
      )*.08+
      (Math.random()-.5)*.32;

    const maxRadius=
      1.10+
      directionNoise;

    const distribution=
      Math.pow(
        Math.random(),
        2.15
      );

    const radius=
      .13+
      distribution*
      Math.max(
        .48,
        maxRadius
      );

    const x=
      radius*
      Math.sin(phi)*
      Math.cos(theta);

    const y=
      radius*
      Math.cos(phi);

    const z=
      radius*
      Math.sin(phi)*
      Math.sin(theta);

    plasmaPositions[i*3]=x;
    plasmaPositions[i*3+1]=y;
    plasmaPositions[i*3+2]=z;

    plasmaBase[i*3]=x;
    plasmaBase[i*3+1]=y;
    plasmaBase[i*3+2]=z;
  }

  plasmaGeo.setAttribute(
    'position',
    new THREE.BufferAttribute(
      plasmaPositions,
      3
    )
  );

  const plasmaMaterial=
    new THREE.PointsMaterial({
      color:0xffffff,
      size:.011,
      transparent:true,
      opacity:.19,
      blending:THREE.AdditiveBlending,
      depthWrite:false
    });

  const plasmaParticles=
    new THREE.Points(
      plasmaGeo,
      plasmaMaterial
    );

  soul.add(plasmaParticles);


  // ==========================================================
  // FRAGMENTOS
  // ==========================================================

  const fragments=[];
  const FRAGMENT_COUNT=230;

  for(let i=0;i<FRAGMENT_COUNT;i++){

    const theta=
      Math.random()*Math.PI*2;

    const phi=
      Math.acos(
        2*Math.random()-1
      );

    const irregularEdge=
      .78+
      Math.sin(theta*3.17)*.15+
      Math.cos(phi*4.6)*.12+
      Math.sin(
        theta*1.8+
        phi*3.2
      )*.10+
      (Math.random()-.5)*.43;

    const radius=
      .42+
      Math.pow(
        Math.random(),
        1.55
      )*
      Math.max(
        .30,
        irregularEdge
      );

    const normalized=
      THREE.MathUtils.clamp(
        (radius-.42)/1.20,
        0,
        1
      );

    const material=
      new THREE.SpriteMaterial({
        map:fragmentTexture,
        color:0xffffff,
        transparent:true,
        opacity:.01,
        blending:THREE.AdditiveBlending,
        depthWrite:false
      });

    const fragment=
      new THREE.Sprite(
        material
      );

    fragment.position.set(
      radius*Math.sin(phi)*Math.cos(theta),
      radius*Math.cos(phi),
      radius*Math.sin(phi)*Math.sin(theta)
    );

    const size=
      THREE.MathUtils.lerp(
        .035,
        .006,
        normalized
      )*
      (
        .55+
        Math.random()*.8
      );

    fragment.scale.set(
      size,
      size,
      1
    );

    soul.add(fragment);

    const fade=
      Math.pow(
        1-normalized,
        1.45
      );

    fragments.push({
      sprite:fragment,
      base:fragment.position.clone(),
      phase:Math.random()*Math.PI*2,
      speed:.08+Math.random()*.26,
      size,
      opacity:
        (.012+Math.random()*.045)*
        fade
    });
  }


  // ==========================================================
  // MICROFRAGMENTOS
  // ==========================================================

  const MICRO_COUNT=420;

  const microGeo=
    new THREE.BufferGeometry();

  const microPositions=
    new Float32Array(
      MICRO_COUNT*3
    );

  const microBase=
    new Float32Array(
      MICRO_COUNT*3
    );

  for(let i=0;i<MICRO_COUNT;i++){

    const theta=
      Math.random()*Math.PI*2;

    const phi=
      Math.acos(
        2*Math.random()-1
      );

    const edge=
      .83+
      Math.sin(theta*4.37)*.16+
      Math.cos(phi*5.13)*.13+
      Math.sin(
        theta*2.7-
        phi*3.1
      )*.10+
      (Math.random()-.5)*.48;

    const radius=
      .58+
      Math.pow(
        Math.random(),
        1.85
      )*
      Math.max(
        .25,
        edge
      );

    const x=
      radius*
      Math.sin(phi)*
      Math.cos(theta);

    const y=
      radius*
      Math.cos(phi);

    const z=
      radius*
      Math.sin(phi)*
      Math.sin(theta);

    microPositions[i*3]=x;
    microPositions[i*3+1]=y;
    microPositions[i*3+2]=z;

    microBase[i*3]=x;
    microBase[i*3+1]=y;
    microBase[i*3+2]=z;
  }

  microGeo.setAttribute(
    'position',
    new THREE.BufferAttribute(
      microPositions,
      3
    )
  );

  const microMaterial=
    new THREE.PointsMaterial({
      color:0xffffff,
      size:.0065,
      transparent:true,
      opacity:.085,
      blending:THREE.AdditiveBlending,
      depthWrite:false
    });

  const microFragments=
    new THREE.Points(
      microGeo,
      microMaterial
    );

  soul.add(microFragments);


  // ==========================================================
  // POEIRA FINAL
  // ==========================================================

  const END_COUNT=180;

  const endGeo=
    new THREE.BufferGeometry();

  const endPositions=
    new Float32Array(
      END_COUNT*3
    );

  const endBase=
    new Float32Array(
      END_COUNT*3
    );

  for(let i=0;i<END_COUNT;i++){

    const theta=
      Math.random()*Math.PI*2;

    const phi=
      Math.acos(
        2*Math.random()-1
      );

    const directional=
      1.00+
      Math.sin(theta*3.91)*.18+
      Math.cos(phi*5.72)*.14+
      (Math.random()-.5)*.52;

    const radius=
      .73+
      Math.pow(
        Math.random(),
        2.25
      )*
      Math.max(
        .18,
        directional
      );

    const x=
      radius*
      Math.sin(phi)*
      Math.cos(theta);

    const y=
      radius*
      Math.cos(phi);

    const z=
      radius*
      Math.sin(phi)*
      Math.sin(theta);

    endPositions[i*3]=x;
    endPositions[i*3+1]=y;
    endPositions[i*3+2]=z;

    endBase[i*3]=x;
    endBase[i*3+1]=y;
    endBase[i*3+2]=z;
  }

  endGeo.setAttribute(
    'position',
    new THREE.BufferAttribute(
      endPositions,
      3
    )
  );

  const endMaterial=
    new THREE.PointsMaterial({
      color:0xf9feff,
      size:.0045,
      transparent:true,
      opacity:.035,
      blending:THREE.AdditiveBlending,
      depthWrite:false
    });

  const endDust=
    new THREE.Points(
      endGeo,
      endMaterial
    );

  soul.add(endDust);


  // ==========================================================
  // HALO EXTERNO
  // ==========================================================

  const halo=
    new THREE.Group();

  group.add(halo);

  function particleCloud(
    count,
    minR,
    maxR,
    size,
    color,
    opacity
  ){

    const g=
      new THREE.BufferGeometry();

    const a=
      new Float32Array(
        count*3
      );

    for(let i=0;i<count;i++){

      const radius=
        minR+
        Math.random()*
        (maxR-minR);

      const theta=
        Math.random()*
        Math.PI*2;

      const phi=
        Math.acos(
          2*Math.random()-1
        );

      a[i*3]=
        radius*
        Math.sin(phi)*
        Math.cos(theta);

      a[i*3+1]=
        radius*
        Math.sin(phi)*
        Math.sin(theta);

      a[i*3+2]=
        -Math.abs(
          radius*
          Math.cos(phi)
        )-.35;
    }

    g.setAttribute(
      'position',
      new THREE.BufferAttribute(
        a,
        3
      )
    );

    const p=
      new THREE.Points(
        g,
        new THREE.PointsMaterial({
          color,
          size,
          transparent:true,
          opacity,
          blending:THREE.AdditiveBlending,
          depthWrite:false
        })
      );

    halo.add(p);

    return p;
  }

  const dust=
    particleCloud(
      520,
      2.45,
      3.75,
      .024,
      0x55eaff,
      .35
    );

  const spark=
    particleCloud(
      75,
      2.7,
      4,
      .052,
      0x8d7cff,
      .35
    );


  // ==========================================================
  // ESTRELAS
  // ==========================================================

  const sg=
    new THREE.BufferGeometry();

  const starCount=220;

  const sa=
    new Float32Array(
      starCount*3
    );

  for(let i=0;i<starCount;i++){

    const radius=
      7+
      Math.random()*10;

    const theta=
      Math.random()*
      Math.PI*2;

    const phi=
      Math.acos(
        2*Math.random()-1
      );

    sa[i*3]=
      radius*
      Math.sin(phi)*
      Math.cos(theta);

    sa[i*3+1]=
      radius*
      Math.sin(phi)*
      Math.sin(theta);

    sa[i*3+2]=
      radius*
      Math.cos(phi);
  }

  sg.setAttribute(
    'position',
    new THREE.BufferAttribute(
      sa,
      3
    )
  );

  const stars=
    new THREE.Points(
      sg,
      new THREE.PointsMaterial({
        color:0x70dce8,
        size:.018,
        transparent:true,
        opacity:.18
      })
    );

  scene.add(stars);


  // ==========================================================
  // ESTADOS
  // ==========================================================

  let mode='idle';

  const clock=
    new THREE.Clock();

  let life=.18;
  let targetLife=.18;
  let hue=.5;

  const modes={

    idle:{
      label:'SISTEMA ONLINE',
      life:.18,
      hueSpeed:.015,
      sat:.55,
      light:.5
    },

    listening:{
      label:'OUVINDO...',
      life:.48,
      hueSpeed:.05,
      sat:.8,
      light:.58
    },

    thinking:{
      label:'PENSANDO...',
      life:.70,
      hueSpeed:.08,
      sat:.85,
      light:.60
    },

    speaking:{
      label:'FALANDO...',
      life:1,
      hueSpeed:.12,
      sat:.9,
      light:.62
    }

  };

  let micLevel=0;
  let wordPulse=0;


  // ==========================================================
  // MODOS DE COR
  // ==========================================================

  const colorMode='gradient';


  // ==========================================================
  // ANIMAÇÃO DO PLASMA
  // ==========================================================

  function animateSoul(
    t,
    life,
    voice
  ){

    soul.rotation.y+=
      .00031+
      life*.00016;

    soul.rotation.x=
      Math.sin(t*.13)*.042;

    soul.rotation.z=
      Math.sin(t*.09)*.022;


    // CENTRO

    const corePulse=
      1+
      Math.sin(t*.93)*.045+
      Math.sin(t*1.71)*.018+
      life*.025+
      voice*.07;

    coreGlow.scale.set(
      1.52*corePulse,
      1.52*corePulse,
      1
    );

    coreGlow.material.opacity=
      .78+
      life*.09+
      voice*.11;


    const irregularPulse=
      1+
      Math.sin(
        t*.71+.8
      )*.065+
      voice*.055;

    coreGlow2.scale.set(
      .95*irregularPulse,
      1.55*
      (
        1-
        irregularPulse*.018
      ),
      1
    );

    coreGlow2.rotation.z+=
      .00065;

    coreGlow2.material.opacity=
      .26+
      life*.045+
      voice*.07;


    // RAIOS

    coreRays.forEach(ray=>{

      ray.mesh.rotation.y+=
        ray.speed*.001;

      ray.mesh.rotation.x+=
        Math.sin(
          t*.25+
          ray.phase
        )*.00027;

      ray.mesh.material.opacity=
        ray.opacity*
        (
          .88+
          Math.sin(
            t*.82+
            ray.phase
          )*.12+
          life*.17+
          voice*.31
        );
    });


    // FILAMENTOS

    filaments.forEach(f=>{

      f.mesh.rotation.y+=
        f.speed*.00045;

      f.mesh.rotation.x+=
        Math.sin(
          t*.17+
          f.phase
        )*.00013;

      f.mesh.material.opacity=
        f.opacity*
        (
          .58+
          Math.sin(
            t*.57+
            f.phase
          )*.18+
          life*.09+
          voice*.14
        );
    });


    // PARTÍCULAS INTERNAS

    const pa=
      plasmaGeo
      .attributes
      .position
      .array;

    for(let i=0;i<PLASMA_COUNT;i++){

      const k=i*3;

      const bx=plasmaBase[k];
      const by=plasmaBase[k+1];
      const bz=plasmaBase[k+2];

      const phase=
        i*.619;

      const pulse=
        Math.sin(
          t*.34+
          phase
        )*.017;

      const outward=
        1+
        pulse+
        voice*.007;

      pa[k]=
        bx*outward+
        Math.sin(
          t*.26+
          phase
        )*.009;

      pa[k+1]=
        by*outward+
        Math.cos(
          t*.23+
          phase
        )*.009;

      pa[k+2]=
        bz*outward+
        Math.sin(
          t*.20+
          phase*.77
        )*.006;
    }

    plasmaGeo
    .attributes
    .position
    .needsUpdate=true;

    plasmaMaterial.opacity=
      .145+
      life*.033+
      voice*.045;


    // FRAGMENTOS

    fragments.forEach(f=>{

      const b=f.base;

      const pulse=
        Math.sin(
          t*f.speed+
          f.phase
        );

      const outward=
        1+
        pulse*.055+
        voice*.013;

      f.sprite.position.set(

        b.x*outward+
        Math.sin(
          t*.28+
          f.phase
        )*.014,

        b.y*outward+
        Math.cos(
          t*.24+
          f.phase
        )*.014,

        b.z*outward+
        Math.sin(
          t*.20+
          f.phase
        )*.009
      );

      const flicker=
        .38+
        Math.sin(
          t*.81+
          f.phase
        )*.23+
        Math.sin(
          t*.37+
          f.phase*1.7
        )*.09;

      f.sprite.material.opacity=
        Math.max(
          0,
          f.opacity*
          flicker*
          (
            1+
            life*.12+
            voice*.20
          )
        );

      const scalePulse=
        f.size*
        (
          1+
          Math.sin(
            t*.68+
            f.phase
          )*.18
        );

      f.sprite.scale.set(
        scalePulse,
        scalePulse,
        1
      );
    });


    // MICROFRAGMENTOS

    const ma=
      microGeo
      .attributes
      .position
      .array;

    for(let i=0;i<MICRO_COUNT;i++){

      const k=i*3;

      const bx=microBase[k];
      const by=microBase[k+1];
      const bz=microBase[k+2];

      const phase=i*.47;

      const angle=
        t*
        (
          .014+
          (i%9)*.0011
        );

      const cs=
        Math.cos(angle);

      const sn=
        Math.sin(angle);

      const rx=
        bx*cs-
        bz*sn;

      const rz=
        bx*sn+
        bz*cs;

      const breathe=
        1+
        Math.sin(
          t*.27+
          phase
        )*.012;

      ma[k]=
        rx*breathe+
        Math.sin(
          t*.22+
          phase
        )*.008;

      ma[k+1]=
        by*breathe+
        Math.cos(
          t*.19+
          phase
        )*.009;

      ma[k+2]=
        rz*breathe;
    }

    microGeo
    .attributes
    .position
    .needsUpdate=true;

    microMaterial.opacity=
      .057+
      life*.018+
      voice*.024;


    // POEIRA FINAL

    const ea=
      endGeo
      .attributes
      .position
      .array;

    for(let i=0;i<END_COUNT;i++){

      const k=i*3;

      const bx=endBase[k];
      const by=endBase[k+1];
      const bz=endBase[k+2];

      const phase=
        i*.73;

      const breathe=
        1+
        Math.sin(
          t*.18+
          phase
        )*.010;

      ea[k]=
        bx*breathe+
        Math.sin(
          t*.15+
          phase
        )*.007;

      ea[k+1]=
        by*breathe+
        Math.cos(
          t*.14+
          phase
        )*.007;

      ea[k+2]=
        bz*breathe;
    }

    endGeo
    .attributes
    .position
    .needsUpdate=true;

    endMaterial.opacity=
      .020+
      life*.007+
      voice*.010;
  }


  // ==========================================================
  // LOOP PRINCIPAL
  // ==========================================================

  let elapsed=0;

  function animate(){

    if(stopped)return;

    requestAnimationFrame(
      animate
    );

    const active=!!document.querySelector('#home.conversation-focus .homeTalkCard.chat-open');
    renderer.domElement.style.visibility=active?'visible':'hidden';
    if(!active)return;

    const dt=
      Math.min(
        clock.getDelta(),
        .05
      );

    elapsed+=dt;

    const t=elapsed;

    const appState=getVisualState();
    mode=appState.mode;

    const cfg=
      modes[mode];

    targetLife=
      cfg.life;

    life+=
      (targetLife-life)*
      (
        targetLife>life
        ?.055
        :.012
      );


    // ÁUDIO / REAÇÃO VISUAL

    if(mode==='listening'){

      const simulatedMic=
        .10+
        (
          Math.sin(t*5.7)+
          Math.sin(t*9.1)*.55+
          1.55
        )*.035;

      micLevel+=
        (simulatedMic-micLevel)*.25;

    }else{

      micLevel+=
        (0-micLevel)*.15;
    }

    if(mode==='speaking'){

      const speechEnergy=
        .13+
        (
          Math.sin(t*7.8)+
          Math.sin(t*12.4)*.55+
          Math.sin(t*3.7)*.35+
          1.9
        )*.045;

      wordPulse+=
        (speechEnergy-wordPulse)*.30;

    }else{

      wordPulse+=
        (0-wordPulse)*.12;
    }

    const voice=
      mode==='listening'
      ?micLevel
      :wordPulse;


    // ========================================================
    // CORES
    // ========================================================

    const boost=
      voice*.25;

    let sat=
      Math.min(
        1,
        cfg.sat+boost
      );

    let vertexHueFn;
    let lightBase=
      cfg.light;

    let lightVaries=
      false;

    hue=
      (
        hue+
        dt*cfg.hueSpeed
      )%1;

    vertexHueFn=
      ny=>
      (
        hue+
        ny*.4-
        t*.06+
        1
      )%1;

    lightVaries=true;


    // HARD COM RAIVA: única alteração de cor sobre a esfera original
    if(appState.angry){

      sat=1;
      lightBase=.56;
      vertexHueFn=()=>0;
      lightVaries=false;

      dust.material.color.setHex(0xff203d);
      spark.material.color.setHex(0xff6a45);
      plasmaMaterial.color.setHex(0xffe7ea);
      microMaterial.color.setHex(0xff8a97);
      endMaterial.color.setHex(0xff6678);
      coreGlow.material.color.setHex(0xffd8dd);
      coreGlow2.material.color.setHex(0xff203d);

      coreRays.forEach(r=>r.mesh.material.color.setHex(0xff314c));
      filaments.forEach(f=>f.mesh.material.color.setHex(0xff5368));

    }else{

      dust.material.color.setHex(0x55eaff);
      spark.material.color.setHex(0x8d7cff);
      plasmaMaterial.color.setHex(0xffffff);
      microMaterial.color.setHex(0xffffff);
      endMaterial.color.setHex(0xf9feff);
      coreGlow.material.color.setHex(0xffffff);
      coreGlow2.material.color.setHex(0xf9feff);

      coreRays.forEach(r=>r.mesh.material.color.setHex(0xffffff));
      filaments.forEach(f=>f.mesh.material.color.setHex(0xffffff));
    }


    // ========================================================
    // MOVIMENTO
    // ========================================================

    group.rotation.y+=
      mode==='thinking'
      ?.0018
      :.00065;

    group.rotation.x=
      Math.sin(t*.18)*.025;

    halo.rotation.y-=
      mode==='thinking'
      ?.002
      :.00055;

    halo.rotation.z=
      Math.sin(t*.1)*.04;


    // ========================================================
    // DEFORMAÇÃO DA ESFERA
    // ========================================================

    const state=
      .028+
      life*.12;

    const breath=
      Math.sin(
        t*
        (
          1.05+
          life*.28
        )
      )*
      (
        .019+
        life*.012
      );

    const tremor=
      (
        Math.sin(t*17.3)+
        Math.sin(t*23.7)*.55
      )*
      (
        .0008+
        life*.0022
      );

    const tmpColor=
      new THREE.Color();

    for(let i=0;i<pos.count;i++){

      const k=i*3;

      const x=original[k];
      const y=original[k+1];
      const z=original[k+2];

      const len=
        Math.sqrt(
          x*x+
          y*y+
          z*z
        )||1;

      const nx=x/len;
      const ny=y/len;
      const nz=z/len;

      const wave1=
        Math.sin(
          nx*2.8+
          ny*1.7+
          t*(.8+life*.35)
        );

      const wave2=
        Math.sin(
          ny*3.1-
          nz*2.2-
          t*(.62+life*.28)
        );

      const wave3=
        Math.cos(
          nz*2.6+
          nx*1.9+
          t*(.5+life*.22)
        );

      const cellular=
        wave1*.5+
        wave2*.3+
        wave3*.2;

      const lobe=
        Math.sin(
          nx*1.8+
          t*.43
        )*
        Math.cos(
          ny*1.6-
          t*.36
        )*
        (
          .021+
          life*.018
        );

      const talk=
        (
          life+
          voice*1.6
        )*
        (
          Math.sin(
            t*3.4+
            nx*2.5
          )*.025
          +
          Math.sin(
            t*1.85+
            ny*3.1
          )*.02
          +
          Math.cos(
            t*2.45+
            nz*2
          )*.012
        );

      const micro=
        tremor*
        Math.sin(
          i*1.73+
          t*4.1
        );

      const s=
        1+
        breath+
        cellular*state+
        lobe+
        talk+
        micro;

      pos.array[k]=x*s;
      pos.array[k+1]=y*s;
      pos.array[k+2]=z*s;

      const vHue=
        vertexHueFn(ny);

      tmpColor.setHSL(
        vHue,
        sat,
        lightBase+
        (
          lightVaries
          ?ny*.06
          :0
        )
      );

      shellColor.setXYZ(
        i,
        tmpColor.r,
        tmpColor.g,
        tmpColor.b
      );
    }

    pos.needsUpdate=true;
    shellColor.needsUpdate=true;


    // ========================================================
    // CAMADA COLORIDA INTERNA
    // ========================================================

    for(
      let i=0;
      i<innerColor.count;
      i++
    ){

      const k=i*3;

      const x=
        innerOriginal[k];

      const y=
        innerOriginal[k+1];

      const z=
        innerOriginal[k+2];

      const len=
        Math.sqrt(
          x*x+
          y*y+
          z*z
        )||1;

      const ny=y/len;

      const vHue=
        vertexHueFn(
          ny+.08
        );

      tmpColor.setHSL(
        vHue,
        sat,
        (lightBase-.08)+
        (
          lightVaries
          ?ny*.05
          :0
        )
      );

      innerColor.setXYZ(
        i,
        tmpColor.r,
        tmpColor.g,
        tmpColor.b
      );
    }

    innerColor.needsUpdate=true;


    // PLASMA

    animateSoul(
      t,
      life,
      voice
    );


    // RESPIRAÇÃO GERAL

    const squash=
      .009+
      life*.032+
      voice*.02;

    group.scale.x=
      1+
      Math.sin(t*.68)*
      squash;

    group.scale.y=
      1-
      Math.sin(t*.68)*
      squash*.72;

    group.scale.z=
      1+
      Math.cos(t*.54)*
      squash*.58;

    if(appState.angry){
      group.rotation.z+=Math.sin(t*20)*.0025;
    }

    renderer.render(
      scene,
      camera
    );
  }

  function resize(){

    if(!mount||!renderer)return;

    const box=mount.getBoundingClientRect();

    const w=Math.max(1,box.width);
    const h=Math.max(1,box.height);

    camera.aspect=
      w/h;

    camera.updateProjectionMatrix();

    renderer.setSize(
      w,
      h,
      false
    );
  }

  resizeObserver=new ResizeObserver(resize);
  resizeObserver.observe(mount);
  resize();

  animate();

  return true;
}

function boot(){
  let attempts=0;
  const timer=setInterval(()=>{
    attempts++;
    if(start()||attempts>40)clearInterval(timer);
  },150);
}

window.addEventListener('pagehide',()=>{
  stopped=true;
  try{resizeObserver?.disconnect()}catch{}
  try{renderer?.dispose()}catch{}
});

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,350),{once:true});
}else{
  setTimeout(boot,350);
}

})();