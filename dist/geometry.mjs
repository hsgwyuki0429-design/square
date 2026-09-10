export const DEPTH=8, GRID=6**DEPTH, LIMIT=6000;
export function parseSide(value){
 const t=String(value).trim();
 if(!t)throw Error('短辺と長辺を入力してください。');
 if(!/^(?:\d+)(?:\.\d{1,2})?$/.test(t))throw Error('辺の長さは正の数で、小数は2桁まで入力してください。');
 const [a,b='']=t.split('.'); const n=Number(a)*100+Number(b.padEnd(2,'0'));
 if(!Number.isSafeInteger(n)||n<1||n>100000)throw Error('辺の長さは0.01〜1000で入力してください。');return n;
}
export function estimate(a,b){let n=0;while(b){n+=Math.floor(a/b);[a,b]=[b,a%b]}return n;}
export function random(seed){let h=2166136261;for(const c of String(seed))h=Math.imul(h^c.charCodeAt(0),16777619);return()=>{h+=0x6D2B79F5;let t=h;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export function generate({short='60',long='100',vertical=false,mode='focus',detail=900,strength=70,seed='2048',focus={x:.7,y:.53}}={}){
 let a=parseSide(short),b=parseSide(long),swapped=a>b;[a,b]=[Math.min(a,b),Math.max(a,b)];
 const count=estimate(b,a);if(count>LIMIT)throw Error(`基本分割だけで${count.toLocaleString()}個必要です（上限${LIMIT.toLocaleString()}個）。短辺を大きくするか、長辺を小さくしてください。`);
 const w=(vertical?a:b)*GRID,h=(vertical?b:a)*GRID;let rw=w,rh=h,x=0,y=0,id=0;const roots=[],events=[],rng=random(seed);
 const make=(x,y,s,depth,parent=null)=>({id:id++,x,y,s,depth,parent,color:Math.floor(rng()*12)});
 while(rw&&rh){if(rw>=rh){const q=Math.floor(rw/rh);for(let i=0;i<q;i++)roots.push(make(x+i*rh,y,rh,0));x+=q*rh;rw%=rh;}else{const q=Math.floor(rh/rw);for(let i=0;i<q;i++)roots.push(make(x,y+i*rw,rw,0));y+=q*rw;rh%=rw;}}
 const leaves=new Map(roots.map(s=>[s.id,s]));const budget=Math.min(LIMIT,Math.max(count,Number(detail)));let candidates=[...roots];
 while(mode!=='basic'&&leaves.size+3<=budget&&candidates.length){
  let best=-1,score=-Infinity;
  for(let i=0;i<candidates.length;i++){let s=candidates[i];if(s.depth>=DEPTH)continue;
   const dx=Math.max(s.x/w-focus.x,0,focus.x-(s.x+s.s)/w),dy=Math.max(s.y/h-focus.y,0,focus.y-(s.y+s.s)/h);
   const dist=Math.hypot(dx*w,dy*h)/Math.min(w,h);
   const p=mode==='focus'?Math.log(s.s/Math.min(w,h))-(1+Number(strength)/70)*Math.log(.07+dist)+rng()*.7:Math.log(s.s/Math.min(w,h))+rng()*5;
   if(p>score){score=p;best=i;}
  }
  if(best<0)break;const parent=candidates.splice(best,1)[0];const n=rng()<.28&&leaves.size+8<=budget?3:2;const size=parent.s/n;
  if(!Number.isSafeInteger(size))throw Error('分割精度の上限です。');
  const children=[];for(let j=0;j<n;j++)for(let i=0;i<n;i++)children.push(make(parent.x+i*size,parent.y+j*size,size,parent.depth+1,parent.id));
  leaves.delete(parent.id);for(const s of children)leaves.set(s.id,s);candidates.push(...children);events.push({parent,children});
 }
 return{w,h,a,b,swapped,roots,events,leaves:[...leaves.values()],seed,focus};
}
// Exact integer bounds, pairwise intersection and BigInt area are independent checks.
export function validate(model,parts=model.leaves){let area=0n;const sorted=[...parts].sort((a,b)=>a.x-b.x);let active=[];
 for(const s of sorted){if(![s.x,s.y,s.s].every(Number.isSafeInteger)||s.s<=0||s.x<0||s.y<0||s.x+s.s>model.w||s.y+s.s>model.h)throw Error('境界または正方形の精度が不正です');
 active=active.filter(t=>t.x+t.s>s.x);for(const t of active)if(s.y<t.y+t.s&&s.y+s.s>t.y)throw Error('正方形が重なっています');active.push(s);area+=BigInt(s.s)**2n;}
 if(area!==BigInt(model.w)*BigInt(model.h))throw Error('未充填の領域があります');return true;
}
