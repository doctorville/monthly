import {latestTeamReports} from './core.mjs?v=20261118-ia';
// 홈 요약: 팜빌 PM 홈과 같은 구조(KPI 4개 → 지연 항목 / 다가오는 마감 / 업무 상태 / 담당자별 현황 / 내 진행 업무 / 최근 변경)
export const TASK_STATES=['진행','완료','보류'];
const shift=(day,n)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
export const isLateTask=(i,today)=>i.state!=='완료'&&!!i.target_date&&i.target_date<today;
export function dday(due,today){const n=Math.round((new Date(due+'T12:00:00Z')-new Date(today+'T12:00:00Z'))/864e5);return n===0?'D-day':n>0?'D-'+n:'D+'+(-n);}
export function homeSummary({reports,members,today,week,userId}){
 const latest=latestTeamReports(reports,week);
 const tasks=latest.flatMap(r=>(r.items||[]).map((i,n)=>({...i,key:r.user_id+':'+(i.id||r.id+'-'+n),owner:r.user_id,sourceWeek:r.week_start})));
 const submitted=new Set(reports.filter(r=>r.week_start===week&&r.status==='submitted').map(r=>r.user_id));
 const done=tasks.filter(i=>i.state==='완료').length;
 const progress=tasks.length?Math.round(tasks.reduce((n,i)=>n+Number(i.progress||0),0)/tasks.length):0;
 const late=tasks.filter(i=>isLateTask(i,today)).sort((a,b)=>a.target_date.localeCompare(b.target_date));
 const in7=shift(today,7),in14=shift(today,14);
 const open=i=>i.state!=='완료'&&i.target_date&&i.target_date>=today;
 const dueSoon=tasks.filter(i=>open(i)&&i.target_date<=in7);
 const upcoming=tasks.filter(i=>open(i)&&i.target_date<=in14).sort((a,b)=>a.target_date.localeCompare(b.target_date));
 const states=[...TASK_STATES,...new Set(tasks.map(i=>i.state).filter(s=>s&&!TASK_STATES.includes(s)))];
 const stateCounts=states.map(s=>[s,tasks.filter(i=>i.state===s).length]);
 const ownerRows=members.map(m=>{const ts=tasks.filter(i=>i.owner===m.id);return {id:m.id,name:m.name,total:ts.length,done:ts.filter(i=>i.state==='완료').length,late:ts.filter(i=>isLateTask(i,today)).length,submitted:submitted.has(m.id)};}).sort((a,b)=>b.total-a.total||String(a.name).localeCompare(String(b.name),'ko'));
 const mine=tasks.filter(i=>i.owner===userId&&i.state!=='완료').sort((a,b)=>(a.target_date||'9999').localeCompare(b.target_date||'9999'));
 const recent=reports.filter(r=>r.status==='submitted'||r.user_id===userId).slice().sort((a,b)=>String(b.updated_at||b.created_at||b.week_start).localeCompare(String(a.updated_at||a.created_at||a.week_start))).slice(0,8);
 return {
  kpis:[
   {label:'진행 중 업무',value:tasks.filter(i=>i.state==='진행').length,sub:'전체 '+tasks.length+'건',tone:''},
   {label:'전체 진행률',value:progress+'%',sub:'업무 '+done+'/'+tasks.length+' 완료',tone:''},
   {label:'지연',value:late.length,sub:'목표 일정 지난 미완료 업무',tone:late.length?'bad':''},
   {label:'7일 내 마감',value:dueSoon.length,sub:'미완료 업무',tone:dueSoon.length?'warn':''}
  ],
  tasks,late,upcoming,stateCounts,ownerRows,mine,recent,submittedCount:members.filter(m=>submitted.has(m.id)).length
 };
}
