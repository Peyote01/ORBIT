// Timestamped position history. Rendering never changes authoritative game state.
export class MotionTrack {
 constructor(delay=65){this.delay=delay;this.samples=[];this.epoch=null;}
 push(time,pos,epoch=null){
  const last=this.samples.at(-1);
  if(epoch!==this.epoch||(last&&(time-last.time>500||Math.hypot(...pos.map((v,i)=>v-last.pos[i]))>10)))this.samples=[];
  this.epoch=epoch;
  if(this.samples.at(-1)?.time===time)this.samples.pop();
  this.samples.push({time,pos:[...pos]});
  if(this.samples.length>12)this.samples.shift();
 }
 sample(now,out){
  if(!this.samples.length)return null;
  const time=now-this.delay;
  while(this.samples.length>2&&this.samples[1].time<=time)this.samples.shift();
  const a=this.samples[0],b=this.samples[1]||a;
  const blend=b.time===a.time?1:Math.max(0,Math.min(1,(time-a.time)/(b.time-a.time)));
  for(let i=0;i<3;i++)out[i]=a.pos[i]+(b.pos[i]-a.pos[i])*blend;
  return out;
 }
}
