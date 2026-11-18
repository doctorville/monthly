// 마일스톤 보드: 팜빌 PM 보드와 같은 형태(좌: 업무 정보 / 우: 월 단위 타임라인)
const DAY=864e5;
export const validDate=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'');
const ms=d=>Date.parse(d+'T00:00:00Z');
const addMonth=(m,n)=>{const d=new Date(m+'-01T00:00:00Z');d.setUTCMonth(d.getUTCMonth()+n);return d.toISOString().slice(0,7);};
export const isLateItem=(i,today)=>i.state!=='완료'&&validDate(i.target_date)&&i.target_date<today;
// 표시할 월 목록: 이번 달을 포함해 업무 기간을 덮되 최소 min개월, 최대 max개월
export function boardMonths(items,today,{min=8,max=12}={}){
 const dates=items.flatMap(i=>[i.start_date,i.target_date]).filter(validDate),now=today.slice(0,7);
 let first=now;for(const d of dates)if(d.slice(0,7)<first)first=d.slice(0,7);
 const floor=addMonth(now,-(max-3));if(first<floor)first=floor;
 let last=addMonth(first,min-1);for(const d of dates)if(d.slice(0,7)>last)last=d.slice(0,7);
 const cap=addMonth(first,max-1);if(last>cap)last=cap;
 const out=[];for(let m=first;m<=last;m=addMonth(m,1))out.push(m);return out;
}
export function timeline(months){
 const start=ms(months[0]+'-01'),end=ms(addMonth(months.at(-1),1)+'-01');
 const raw=d=>(ms(d)-start)/(end-start)*100,pos=d=>Math.min(100,Math.max(0,raw(d)));
 return {pos,inRange:d=>validDate(d)&&raw(d)>=0&&raw(d)<=100,ticks:months.map(m=>({month:m,left:pos(m+'-01'),label:m.slice(2,4)+'.'+m.slice(5)}))};
}
// 업무 막대: 시작일(없으면 보고 주간)부터 목표 일정까지, 목표 일정에 마름모 표시
export function barOf(item,tl,fallbackStart){
 const s=validDate(item.start_date)?item.start_date:validDate(fallbackStart)?fallbackStart:null,e=validDate(item.target_date)?item.target_date:null;
 if(!s&&!e)return null;
 const lo=[s,e].filter(Boolean).sort()[0],hi=[s,e].filter(Boolean).sort().at(-1);
 const left=tl.pos(lo);return {left,width:Math.max(.6,tl.pos(hi)-left),diamond:e?tl.pos(e):null};
}
export function boardStats(items,today){
 const in7=new Date(ms(today)+7*DAY).toISOString().slice(0,10);
 return {total:items.length,active:items.filter(i=>i.state==='진행').length,late:items.filter(i=>isLateItem(i,today)).length,dueSoon:items.filter(i=>i.state!=='완료'&&validDate(i.target_date)&&i.target_date>=today&&i.target_date<=in7).length};
}
// 그룹 묶음(입력 순서 유지)과 그룹 요약
export function groupEntries(entries,keyOf){const map=new Map();for(const x of entries){const k=keyOf(x)||'미지정';if(!map.has(k))map.set(k,[]);map.get(k).push(x);}return [...map].map(([key,rows])=>({key,rows}));}
export function groupSummary(rows,today){
 const items=rows.map(x=>x.item),starts=rows.map(x=>validDate(x.item.start_date)?x.item.start_date:x.week).filter(validDate).sort(),ends=items.map(i=>i.target_date).filter(validDate).sort();
 return {start:starts[0]||'',end:ends.at(-1)||'',progress:items.length?Math.round(items.reduce((n,i)=>n+Number(i.progress||0),0)/items.length):0,late:items.filter(i=>isLateItem(i,today)).length};
}
export function matchEntry(x,{query='',state=''},today){
 const i=x.item,q=query.trim().toLowerCase();
 if(state==='지연'?!isLateItem(i,today):state&&i.state!==state)return false;
 return !q||[i.title,i.project,i.service,i.result,x.ownerName].some(v=>String(v||'').toLowerCase().includes(q));
}
