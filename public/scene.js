import {MotionTrack} from './motion.js';
import * as T from '/vendor/three.module.js';
import {STATIONS,GOODS,holdDimensions,tractorSlot,REAR_HATCH,rearHatchHeight} from '/shared/game.js';
export function createScene(canvas){
 const renderer=new T.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
 const scene=new T.Scene();scene.background=new T.Color(0x050c16);scene.fog=new T.Fog(0x050c16,80,180);
 const camera=new T.PerspectiveCamera(75,1,.1,500);camera.rotation.order='YXZ';
 scene.add(new T.HemisphereLight(0x9dc9ef,0x35454c,2.6));const sun=new T.DirectionalLight(0xffddab,3);sun.position.set(12,25,10);scene.add(sun);
 const material=(color,opacity=1)=>new T.MeshStandardMaterial({color,roughness:.75,transparent:opacity<1,opacity});
 function box(parent,pos,dims,color,opacity=1){const m=new T.Mesh(new T.BoxGeometry(...dims),material(color,opacity));m.position.set(...pos);parent.add(m);return m;}
 function label(parent,text,pos,color='#dae8e4',scale=2){
  const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');x.fillStyle='#102029';x.fillRect(0,0,512,128);x.fillStyle=color;x.font='bold 32px monospace';x.textAlign='center';x.fillText(text,256,72);
  const m=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(c)}));m.position.set(...pos);m.scale.set(scale,scale/4,1);parent.add(m);return m;
 }
 const ship=new T.Group();scene.add(ship);
 box(ship,[0,-.2,0],[9,.4,21],0x25353d);
 for(const x of [-4.5,4.5]){box(ship,[x,1.5,-2],[.18,3,16],0x28414b,.45);box(ship,[x,1.5,9.7],[.18,3,1],0x28414b,.45);}
 // Two powered bulkhead doors retract sideways to clear the full aft loading bay.
 const hatchDoors=[];
 let hatchProgress=0;
 const hatchPosts=[
  box(ship,[-4.35,1.65,REAR_HATCH.z],[.32,3.35,.45],0xe0ae52),
  box(ship,[4.35,1.65,REAR_HATCH.z],[.32,3.35,.45],0xe0ae52)
 ];
 const hatchCrown=box(ship,[0,3.27,REAR_HATCH.z],[8.9,.28,.5],0x536e7b);
 for(const sign of [-1,1]){
  const assembly=new T.Group();ship.add(assembly);
  assembly.position.set(sign*2.05,0,REAR_HATCH.z);
  box(assembly,[0,1.58,0],[4.07,3.05,.25],0x34505f);
  box(assembly,[0,2.9,.14],[3.9,.17,.08],0xf0b847);
  box(assembly,[0,.22,.15],[3.9,.18,.07],0xf0b847);
  for(let i=0;i<5;i++)box(assembly,[-1.5+i*.75,1.55,.15],[.17,2,.06],i%2?0x233842:0xc59b51);
  hatchDoors.push({assembly,sign});
 }
 const loadingApron=box(ship,[0,-.075,11.8],[8.25,.18,2.8],0x4a5e68);
  loadingApron.visible=false;
 box(ship,[0,.3,-10.4],[9,.6,.2],0x465d69);
 // Salvage ship: cargo rails, loading zones, structural ribs and industrial work lights.
 for(const x of [-3.9,-2.3,0,2.3,3.9])box(ship,[x,.08,3],[.09,.12,12],x===0?0xf2b94e:0x677985);
 for(const z of [-1,1,3,5,7,9])box(ship,[0,.08,z],[8.6,.06,.08],0x8e8f6b);
 for(const x of [-4.2,4.2])for(const z of [-7,-2,3,8]){
  box(ship,[x,2.95,z],[.28,.22,.34],0xdda04d);
  box(ship,[x,2.72,z],[.38,.14,.48],0xffdb83);
 }
 for(const z of [-7,0,7]){
  box(ship,[0,3.22,z],[8.8,.16,.23],0x435866);
  for(const x of [-4.2,4.2])box(ship,[x,1.5,z],[.24,3,.24],0x536570);
 }
 for(const x of [-2.4,2.4])for(const z of [1,4,7])box(ship,[x,.04,z],[.12,.035,1.2],0xe6ac49);
 box(ship,[4.35,1.5,7.5],[.12,3,3.2],0xc79142,.15);
 label(ship,'CARGO / TRACTOR ZONE',[0,3.2,4],'#f2c66f',3.8);
 const grid=new T.GridHelper(20,20,0x47616b,0x2d4049);grid.position.y=.015;grid.scale.x=.44;ship.add(grid);
 for(const [key,pos]of Object.entries(STATIONS)){
  if(key==='cargo')continue;
  box(ship,[pos[0],.55,pos[2]],[.8,1.1,.7],key==='scanner'?0x376c75:0x435460);
  box(ship,[pos[0],1.15,pos[2]],[.9,.12,.6],0x81c8b4);
  label(ship,key.toUpperCase(),[pos[0],1.9,pos[2]],'#d2d6c4',1.7);
 }
 label(ship,'AIRLOCK →',[3,2.4,7.8],'#e6b963',2);
 label(ship,'AFT CARGO HATCH / H TO TOGGLE',[0,3.75,9.9],'#f1c36c',5);
 label(ship,'ORBIT / SALVAGE DIVISION',[0,3,-10],'#e6b963',4);
 const stars=new T.BufferGeometry(),v=[];for(let i=0;i<1500;i++){const a=Math.random()*Math.PI*2,z=Math.random()*2-1,r=160;v.push(Math.cos(a)*Math.sqrt(1-z*z)*r,z*r,Math.sin(a)*Math.sqrt(1-z*z)*r);}
 stars.setAttribute('position',new T.Float32BufferAttribute(v,3));scene.add(new T.Points(stars,new T.PointsMaterial({color:0xb5d0ef,size:.25})));
 const planet=new T.Mesh(new T.SphereGeometry(24,32,20),material(0x234455));planet.position.set(-65,-25,-95);scene.add(planet);

// Encounter craft are entirely procedural, visible through the ship's translucent
 // hull sides. They are decorative only; damage and combat authority stay on server.
 const combatPosition=(type,elapsed)=>{
  const police=type==='police',side=police?-1:1;
  return [side*(16+Math.sin(elapsed*.53)*2.1),5.2+Math.sin(elapsed*.8)*1.3,-3.5+Math.cos(elapsed*.34)*5.8];
 };
 function buildHostileCraft(root,type){
  const police=type==='police';
  const hull=police?0xaac9da:0x6a4440,trim=police?0x32688a:0xb36543;
  // Sloped prow, wing pods, engines, hardpoints and navigational lights.
  box(root,[0,0,0],[4.0,1.55,9.4],hull);
  const prow=new T.Mesh(new T.ConeGeometry(2.05,4.5,4),material(hull));prow.rotation.x=-Math.PI/2;prow.rotation.y=Math.PI/4;prow.position.set(0,.12,-6.55);root.add(prow);
  box(root,[0,.9,-.5],[2.5,.8,3.6],police?0x244966:0x3a3035);
  for(const side of [-1,1]){
   box(root,[side*3.7,-.2,1],[4.5,.45,4.4],hull);
   box(root,[side*5.3,.1,-.7],[.75,1.0,5],trim);
   box(root,[side*1.35,-.3,4.7],[1.3,1.25,1.4],police?0x335d76:0x25272e);
   const exhaust=new T.Mesh(new T.CircleGeometry(.48,12),new T.MeshBasicMaterial({color:police?0x80caff:0xff9152,side:T.DoubleSide}));
   exhaust.position.set(side*1.35,-.3,5.43);root.add(exhaust);
   box(root,[side*3.2,.45,-1.9],[.35,.7,1.8],police?0x7bb6d6:0x31272a);
  }
  box(root,[0,1.42,1.6],[1.35,.8,1.7],police?0xd9e9f2:0x5a5554);
  if(police){
   box(root,[-.55,1.92,.45],[.8,.26,.5],0xe64f59);
   box(root,[.55,1.92,.45],[.8,.26,.5],0x4dafff);
   label(root,'PATROL / POLICE',[0,3.9,0],'#9adaff',6);
   const red=new T.PointLight(0xff4d56,3,12),blue=new T.PointLight(0x4d9dff,3,12);
   red.position.set(-.55,2.1,.4);blue.position.set(.55,2.1,.4);root.add(red,blue);
   root.userData.sirens=[red,blue];
   const scan=new T.Mesh(new T.ConeGeometry(6.2,13,20,1,true),new T.MeshBasicMaterial({color:0x59b8ff,transparent:true,opacity:.1,side:T.DoubleSide,depthWrite:false}));
   scan.rotation.z=-Math.PI/2;scan.position.set(7.5,0,0);root.add(scan);root.userData.scan=scan;
  }else{
   box(root,[0,1.5,-2],[3,.4,2.2],0xdd7743);
   for(const side of [-1,1])box(root,[side*4.7,.75,2.8],[.3,1.6,2.2],0x942d2f);
   label(root,'RAIDER / HOSTILE',[0,3.9,0],'#ffb584',6);
   const engine=new T.PointLight(0xff8740,3,15);engine.position.set(0,0,5.8);root.add(engine);
   root.userData.engines=[engine];
  }
 }
 function makeCombatBeam(root,color){
  const core=new T.Mesh(new T.CylinderGeometry(.07,.11,1,7),new T.MeshBasicMaterial({color,transparent:true,opacity:.95,depthWrite:false}));
  const aura=new T.Mesh(new T.CylinderGeometry(.19,.25,1,7),new T.MeshBasicMaterial({color,transparent:true,opacity:.24,depthWrite:false}));
  root.add(core,aura);root.userData.parts=[core,aura];
  const flash=new T.Mesh(new T.SphereGeometry(.45,8,6),new T.MeshBasicMaterial({color,transparent:true,opacity:.85}));
  root.add(flash);root.userData.flash=flash;
 }
 function alignCombatBeam(root,start,end){
  const a=new T.Vector3(...start),b=new T.Vector3(...end),v=b.clone().sub(a),len=v.length();
  for(const part of root.userData.parts){part.position.copy(a).addScaledVector(v,.5);part.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.clone().normalize());part.scale.set(1,len,1);}
  root.userData.flash.position.copy(b);
 }
 const dynamic=new T.Group();scene.add(dynamic);
 const aimRay=new T.Raycaster();
 const upAxis=new T.Vector3(0,1,0);
 let last=null,me=null,mode=null,previousFrame=performance.now(),width=0,height=0,pixelRatio=0;
 const entries=new Map(),cameraTrack=new MotionTrack(),sampled=[0,0,0];
 let receivedAt=0,epoch=null;
 let generation=0,created=0,disposed=0,scannerYaw=null;
 function dispose(root){root.traverse(o=>{o.geometry?.dispose();if(o.material){o.material.map?.dispose();o.material.dispose();}});root.removeFromParent();disposed++;}
 function keep(key,shape,build,pos=[0,0,0],smooth=false){
  let entry=entries.get(key);
  if(entry&&entry.shape!==shape){dispose(entry.root);entries.delete(key);entry=null;}
  if(!entry){
   const root=new T.Group();dynamic.add(root);build(root);
   root.position.set(...pos);entry={root,shape,target:new T.Vector3(...pos),smooth,generation,track:new MotionTrack()};entries.set(key,entry);created++;
  }
  entry.generation=generation;entry.target.set(...pos);entry.smooth=smooth;
  if(smooth)entry.track.push(receivedAt,pos,epoch);
  if(!smooth||entry.root.position.distanceToSquared(entry.target)>100)entry.root.position.copy(entry.target);
  return entry.root;
 }
 function update(s,id){
  last=s;me=s.players.find(p=>p.id===id);generation++;
  receivedAt=performance.now();epoch=s.code+':'+s.run+':'+id;
  if(me)cameraTrack.push(receivedAt,me.pos,epoch);
  if(s.wreck&&s.phase==='salvage'&&!s.wreck.crunched&&!s.wreck.crunchAt){
   const w=s.wreck;
   const g=keep('wreck',w.id+':'+w.visual.color+':'+w.visual.thrusters,root=>{
    box(root,[0,-.25,0],[12,.5,14],0x36464c);box(root,[0,2,-6],[12,4,.35],w.visual.color);
    for(const x of [-6,6]){box(root,[x,1,0],[.4,2,13],w.visual.color);box(root,[x,3,0],[.2,.2,13],0x708186);}
    const count=w.visual.thrusters||2;for(let i=0;i<count;i++)box(root,[-4+i*8/Math.max(1,count-1),1,7],[1.4,1.4,2],0x476a80);
   },[0,0,-32]);
   g.rotation.y=w.yaw;
   keep('wreck-label',w.owner,root=>label(root,w.owner,[0,0,0],'#e6b963',5),[0,4,-32]);
   if(w.rivalHP>0)keep('rival','rival',root=>{box(root,[0,0,0],[6,3,9],0x75545b);label(root,'RIVAL VESSEL',[0,3,0],'#ef7d7d',4);},[15,2,-35]);
  }
  // Server timestamps control weapon flashes so all crew see the same shots.
  if(s.encounter){
   const e=s.encounter;
   const craft=keep('encounter-ship',e.type,root=>buildHostileCraft(root,e.type),combatPosition(e.type,Math.max(0,s.time-(e.startedAt??s.time))));
   const elapsed=Math.max(0,s.time-(e.startedAt??s.time));
   craft.rotation.y=e.type==='police'?-Math.PI*.44:Math.PI*.44;
   craft.userData.scan&&(craft.userData.scan.visible=e.stage==='scanning');
   if(e.lastShotAt!=null&&s.time-e.lastShotAt<.38){
    const beam=keep('encounter-incoming-beam','incoming-'+e.type,root=>makeCombatBeam(root,e.type==='police'?0xff6171:0xffa358));
    alignCombatBeam(beam,[...craft.position],[e.type==='police'?-3.8:3.8,1.8,2.1]);
   }
   if(e.lastPlayerShotAt!=null&&s.time-e.lastPlayerShotAt<.26){
    const beam=keep('encounter-outgoing-beam','friendly',root=>makeCombatBeam(root,0x69eaff));
    alignCombatBeam(beam,[0,3,-8],[...craft.position]);
   }
  }
  if(s.combatVfx?.kind==='destroyed'&&s.time-s.combatVfx.at<1.5){
   const blast=keep('encounter-explosion',s.combatVfx.type,root=>{
    const particles=new T.Group();root.add(particles);
    for(let i=0;i<15;i++){
     const theta=i*2.4,up=((i*11)%9-4)/4;
     const m=new T.Mesh(new T.OctahedronGeometry(.22+(i%4)*.08),new T.MeshBasicMaterial({color:i%3?0xffbd69:0xd85b47}));
     m.position.set(Math.sin(theta)*3.4,up*2.5,Math.cos(theta)*3.5);particles.add(m);
    }
    const flash=new T.Mesh(new T.IcosahedronGeometry(3.2,1),new T.MeshBasicMaterial({color:0xffa34c,transparent:true,opacity:.55,depthWrite:false}));
    root.add(flash);root.userData.flash=flash;root.userData.particles=particles;
   },combatPosition(s.combatVfx.type,0));
   blast.userData.flash.scale.setScalar(.65+Math.min(1.4,s.time-s.combatVfx.at));
  }
  for(const c of s.cargo){
   let pos=c.pos,dims=c.dims;
   if(c.state==='secured'){
    const b=s.ship.containers.find(b=>b.id===c.container),i=s.ship.containers.indexOf(b);dims=c.packedDims;
    pos=[(i===0?-b.dims[0]:0)+c.cell[0]+dims[0]/2,c.cell[1]+dims[1]/2,c.cell[2]+dims[2]/2];
   }else{pos=[...pos];pos[1]+=dims[1]/2;if(c.state==='held'&&c.carrier===id)continue;}
   const cargoMesh=keep('cargo:'+c.id,c.type+':'+dims.join(',')+':'+c.illegal,root=>{
    const m=box(root,[0,0,0],dims.map(n=>n*.96),GOODS[c.type].color);
    m.add(new T.LineSegments(new T.EdgesGeometry(m.geometry),new T.LineBasicMaterial({color:c.illegal?0xf46e72:0x15232d})));
   },pos,c.state==='held'||c.state==='tractored');
   cargoMesh.userData.cargoId=c.id;
   cargoMesh.userData.targetable=c.state==='loose';
   cargoMesh.rotation.y=c.state==='secured'?0:(c.angle||0);
  }
  for(const p of s.players){
   if(!p.connected||!p.tractor)continue;
   const c=s.cargo.find(c=>c.id===p.tractor.id&&c.state==='tractored');if(!c)continue;
   const beam=keep('tractorbeam:'+p.id,'tractorbeam',root=>{
    const cylinder=new T.Mesh(new T.CylinderGeometry(.035,.08,1,8),new T.MeshBasicMaterial({color:0x74e4fa,transparent:true,opacity:.8,depthWrite:false}));
    root.add(cylinder);root.userData.core=cylinder;
    const glow=new T.PointLight(0x35c8ed,1.7,6);root.add(glow);root.userData.glow=glow;
   },[0,0,0]);
   const start=new T.Vector3(p.pos[0],p.pos[1]+1.4,p.pos[2]),end=new T.Vector3(c.pos[0],c.pos[1]+c.dims[1]/2,c.pos[2]);
   const diff=end.clone().sub(start),length=diff.length();
   beam.userData.core.position.copy(start).addScaledVector(diff,.5);
   beam.userData.core.quaternion.setFromUnitVectors(upAxis,diff.normalize());
   beam.userData.core.scale.set(1,length,1);beam.userData.glow.position.copy(end);
  }
  const local=s.players.find(p=>p.id===id);
  const attached=local?.tractor&&s.cargo.find(c=>c.id===local.tractor.id&&c.state==='tractored');
  const placement=attached?tractorSlot(s,attached):null;
  if(placement){
   const shape=placement.dims.join(',')+':'+placement.valid;
   keep('gridpreview',shape,root=>{
    const m=box(root,[0,0,0],placement.dims.map(n=>n*.99),placement.valid?0x53f0a1:0xf46c6c,.22);
    const wire=new T.LineSegments(new T.EdgesGeometry(m.geometry),new T.LineBasicMaterial({color:placement.valid?0x5bf4a2:0xff7373}));
    root.add(wire);
   },[placement.pos[0],placement.pos[1]+placement.dims[1]/2,placement.pos[2]]);
  }
  for(const b of s.ship.containers){
   const d=holdDimensions(b),i=s.ship.containers.indexOf(b),text=b.name+' '+(d[0]*d[1]*d[2])+'m³'+(b.shield?' SHIELDED':'');
   keep('bay:'+b.id,text,root=>label(root,text,[0,0,0],b.shield?'#a295ef':'#9bcac0',2.6),[i===0?-1.5:1.5,4.5,2]);
  }
  for(const p of s.players)if(p.id!==id&&p.connected){
   keep('player:'+p.id,p.name,root=>{box(root,[0,.8,0],[.55,1.6,.55],0xcca35e);label(root,p.name,[0,2,0],'#e6d1ab',1.7);},p.pos,true);
  }
  for(const e of s.wreck?.enemies||[])if(e.hp>0){
   keep('enemy:'+e.id,e.kind,root=>box(root,[0,.7,0],[.8,1.4,.8],e.kind==='creature'?0xa075aa:0xc36561),e.pos,true);
   keep('enemy-label:'+e.id,e.kind+e.hp,root=>label(root,e.kind+' '+e.hp,[0,2.3,0],'#ef8585',2),e.pos,true);
  }
  for(const [key,entry]of entries)if(entry.generation!==generation){dispose(entry.root);entries.delete(key);}
 }
 function frame(yaw,pitch){
  const now=performance.now(),dt=Math.min(.1,(now-previousFrame)/1000);previousFrame=now;
  const desired=last?.ship?.hatchOpen?1:0;
  hatchProgress+=(desired-hatchProgress)*Math.min(1,dt*9);
  const hatchHeight=last?.ship?rearHatchHeight(last):REAR_HATCH.height,scale=hatchHeight/REAR_HATCH.height;
  hatchCrown.position.y=hatchHeight+.07;
  for(const post of hatchPosts){post.position.y=hatchHeight/2;post.scale.y=scale;}
  for(const {assembly,sign} of hatchDoors){
   assembly.position.x=sign*(2.05+4.15*hatchProgress);
   assembly.scale.y=scale;
  }
  loadingApron.visible=hatchProgress>.05;
  if(last?.encounter){
   const e=last.encounter,elapsed=Math.max(0,last.time+(now-receivedAt)/1000-(e.startedAt??last.time));
   const craft=entries.get('encounter-ship')?.root;
   if(craft){
    craft.position.set(...combatPosition(e.type,elapsed));
    if(craft.userData.sirens){const which=Math.floor(elapsed*5)%2;craft.userData.sirens.forEach((light,i)=>light.intensity=i===which?5:.1);}
    if(craft.userData.scan?.visible)craft.userData.scan.material.opacity=.08+Math.sin(elapsed*3)*.035;
    const inBeam=entries.get('encounter-incoming-beam')?.root;if(inBeam)alignCombatBeam(inBeam,[...craft.position],[e.type==='police'?-3.8:3.8,1.8,2.1]);
    const outBeam=entries.get('encounter-outgoing-beam')?.root;if(outBeam)alignCombatBeam(outBeam,[0,3,-8],[...craft.position]);
   }
  }
  const ratio=Math.min(devicePixelRatio,1.5);
  if(width!==innerWidth||height!==innerHeight||pixelRatio!==ratio){
   width=innerWidth;height=innerHeight;pixelRatio=ratio;
   renderer.setPixelRatio(ratio);renderer.setSize(width,height,false);
   camera.aspect=width/height;camera.updateProjectionMatrix();
  }
  for(const entry of entries.values())if(entry.smooth){entry.track.sample(now,sampled);entry.root.position.set(...sampled);}
  if(mode==='scanner'&&last?.phase==='salvage'){camera.position.set(0,10,-13);camera.lookAt(0,0,-32);}
  else if(me){cameraTrack.sample(now,sampled);camera.position.set(sampled[0],sampled[1]+1.65,sampled[2]);camera.rotation.set(pitch,yaw,0,'YXZ');}
  else{camera.position.set(21,14,24);camera.lookAt(0,0,-5);}
  if(scannerYaw!==null&&entries.has('wreck'))entries.get('wreck').root.rotation.y=scannerYaw;
  renderer.render(scene,camera);
 }
 function targetCargo(){
  aimRay.setFromCamera(new T.Vector2(0,0),camera);
  aimRay.far=14;
  const targets=[...entries.values()].filter(e=>e.root.userData.targetable).map(e=>e.root);
  const hits=aimRay.intersectObjects(targets,true);
  for(const hit of hits){
   let node=hit.object;
   while(node&&!node.userData?.cargoId)node=node.parent;
   if(node?.userData.targetable)return node.userData.cargoId;
  }
  return null;
 }
 return {update,frame,targetCargo,setScannerYaw:value=>scannerYaw=value,setMode:m=>mode=m,stats:()=>({created,disposed,objects:entries.size,encounterShip:entries.has('encounter-ship'),incomingBeam:entries.has('encounter-incoming-beam'),outgoingBeam:entries.has('encounter-outgoing-beam'),combatExplosion:entries.has('encounter-explosion'),geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures})};
}
