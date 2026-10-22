import {MotionTrack} from './motion.js';
import * as T from '/vendor/three.module.js';
import {STATIONS,GOODS,holdDimensions} from '/shared/game.js';
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
 box(ship,[0,1.5,10.4],[9,3,.2],0x253b43);box(ship,[0,.3,-10.4],[9,.6,.2],0x465d69);
 const grid=new T.GridHelper(20,20,0x47616b,0x2d4049);grid.position.y=.015;grid.scale.x=.44;ship.add(grid);
 for(const [key,pos]of Object.entries(STATIONS)){
  if(key==='cargo')continue;
  box(ship,[pos[0],.55,pos[2]],[.8,1.1,.7],key==='scanner'?0x376c75:0x435460);
  box(ship,[pos[0],1.15,pos[2]],[.9,.12,.6],0x81c8b4);
  label(ship,key.toUpperCase(),[pos[0],1.9,pos[2]],'#d2d6c4',1.7);
 }
 label(ship,'AIRLOCK →',[3,2.4,7.8],'#e6b963',2);
 label(ship,'ORBIT / SALVAGE DIVISION',[0,3,-10],'#e6b963',4);
 const stars=new T.BufferGeometry(),v=[];for(let i=0;i<1500;i++){const a=Math.random()*Math.PI*2,z=Math.random()*2-1,r=160;v.push(Math.cos(a)*Math.sqrt(1-z*z)*r,z*r,Math.sin(a)*Math.sqrt(1-z*z)*r);}
 stars.setAttribute('position',new T.Float32BufferAttribute(v,3));scene.add(new T.Points(stars,new T.PointsMaterial({color:0xb5d0ef,size:.25})));
 const planet=new T.Mesh(new T.SphereGeometry(24,32,20),material(0x234455));planet.position.set(-65,-25,-95);scene.add(planet);

 const dynamic=new T.Group();scene.add(dynamic);
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
  for(const c of s.cargo){
   let pos=c.pos,dims=c.dims;
   if(c.state==='secured'){
    const b=s.ship.containers.find(b=>b.id===c.container),i=s.ship.containers.indexOf(b);dims=c.packedDims;
    pos=[(i===0?-b.dims[0]:0)+c.cell[0]+dims[0]/2,c.cell[1]+dims[1]/2,c.cell[2]+dims[2]/2];
   }else{pos=[...pos];pos[1]+=dims[1]/2;if(c.state==='held'&&c.carrier===id)continue;}
   keep('cargo:'+c.id,c.type+':'+dims.join(',')+':'+c.illegal,root=>{
    const m=box(root,[0,0,0],dims.map(n=>n*.96),GOODS[c.type].color);
    m.add(new T.LineSegments(new T.EdgesGeometry(m.geometry),new T.LineBasicMaterial({color:c.illegal?0xf46e72:0x15232d})));
   },pos,c.state==='held');
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
 return {update,frame,setScannerYaw:value=>scannerYaw=value,setMode:m=>mode=m,stats:()=>({created,disposed,objects:entries.size,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures})};
}
