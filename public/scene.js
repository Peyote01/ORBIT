import * as T from '/vendor/three.module.js';
import {STATIONS,GOODS,holdDimensions} from '/shared/game.js';
export function createScene(canvas){
 const renderer=new T.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));
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
 const dynamic=new T.Group();scene.add(dynamic);let signature='',last=null,me=null,mode=null;
 function clear(){dynamic.traverse(o=>{o.geometry?.dispose();if(o.material){o.material.map?.dispose();o.material.dispose();}});dynamic.clear();}
 function update(s,id){
  last=s;me=s.players.find(p=>p.id===id);
  const sig=JSON.stringify([s.cargo,s.players.map(p=>[p.id,p.pos,p.hp,p.connected]),s.wreck,s.phase,s.ship.containers]);
  if(sig===signature)return;signature=sig;clear();
  if(s.wreck&&s.phase==='salvage'&&!s.wreck.crunched&&!s.wreck.crunchAt){
   const w=s.wreck,g=new T.Group();g.position.set(0,0,-32);g.rotation.y=w.yaw;dynamic.add(g);
   box(g,[0,-.25,0],[12,.5,14],0x36464c);box(g,[0,2,-6],[12,4,.35],w.visual.color);
   for(const x of [-6,6]){box(g,[x,1,0],[.4,2,13],w.visual.color);box(g,[x,3,0],[.2,.2,13],0x708186);}
   const count=w.visual.thrusters||2;for(let i=0;i<count;i++)box(g,[-4+i*8/Math.max(1,count-1),1,7],[1.4,1.4,2],0x476a80);
   label(g,w.owner,[0,4,0],'#e6b963',5);
   if(w.rivalHP>0){box(dynamic,[15,2,-35],[6,3,9],0x75545b);label(dynamic,'RIVAL VESSEL',[15,5,-35],'#ef7d7d',4);}
  }
  for(const c of s.cargo){
   let pos=c.pos,dims=c.dims;
   if(c.state==='secured'){
    const b=s.ship.containers.find(b=>b.id===c.container),i=s.ship.containers.indexOf(b);dims=c.packedDims;
    pos=[(i===0?-b.dims[0]:0)+c.cell[0]+dims[0]/2,c.cell[1]+dims[1]/2,c.cell[2]+dims[2]/2];
   }else{pos=[...pos];pos[1]+=dims[1]/2;if(c.state==='held'&&c.carrier===id)continue;}
   const m=box(dynamic,pos,dims.map(n=>n*.96),GOODS[c.type].color);
   const edge=new T.LineSegments(new T.EdgesGeometry(m.geometry),new T.LineBasicMaterial({color:c.illegal?0xf46e72:0x15232d}));m.add(edge);
  }
  for(const b of s.ship.containers){
   const d=holdDimensions(b),i=s.ship.containers.indexOf(b);
   label(dynamic,b.name+' '+(d[0]*d[1]*d[2])+'m³'+(b.shield?' SHIELDED':''),[i===0?-1.5:1.5,4.5,2],b.shield?'#a295ef':'#9bcac0',2.6);
  }
  for(const p of s.players)if(p.id!==id&&p.connected){box(dynamic,[p.pos[0],p.pos[1]+.8,p.pos[2]],[.55,1.6,.55],0xcca35e);label(dynamic,p.name,[p.pos[0],p.pos[1]+2,p.pos[2]],'#e6d1ab',1.7);}
  for(const e of s.wreck?.enemies||[])if(e.hp>0){box(dynamic,[e.pos[0],e.pos[1]+.7,e.pos[2]],[.8,1.4,.8],e.kind==='creature'?0xa075aa:0xc36561);label(dynamic,e.kind+' '+e.hp,[e.pos[0],2.3,e.pos[2]],'#ef8585',2);}
 }
 function frame(yaw,pitch){
  renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  if(mode==='scanner'&&last?.phase==='salvage'){camera.position.set(0,10,-13);camera.lookAt(0,0,-32);}
  else if(me){const target=new T.Vector3(me.pos[0],me.pos[1]+1.65,me.pos[2]);camera.position.lerp(target,.45);camera.rotation.set(pitch,yaw,0,'YXZ');}
  else{camera.position.set(21,14,24);camera.lookAt(0,0,-5);}
  renderer.render(scene,camera);
 }
 return {update,frame,setMode:m=>mode=m};
}
