// 월 업무 정리: 해당 월 주간 보고(제출본)를 업무별로 묶고, 진척·지연·한 일을 정리합니다.
// 서버(teamwork/report-ai, mode=monthly-review)의 계산과 같은 규칙을 씁니다.
const str=(v,n=3000)=>String(v??'').trim().slice(0,n);
export const monthEnd=month=>{const [y,m]=month.split('-').map(Number);return new Date(Date.UTC(y,m,0)).toISOString().slice(0,10);};
export function monthReportsOf(reports,userId,month){return reports.filter(r=>r.user_id===userId&&r.status==='submitted'&&String(r.week_start).startsWith(month)).sort((a,b)=>a.week_start.localeCompare(b.week_start));}
export function monthlyTasks(reports,month,today){
 const end=monthEnd(month),cut=today<end?today:end,map=new Map();
 for(const r of [...reports].sort((a,b)=>String(a.week_start).localeCompare(String(b.week_start))))(r.items||[]).forEach((i,n)=>{const key=String(i.id||r.id+'-'+n).slice(0,120);const t=map.get(key)||{task_key:key,title:'',project:'',service:'',start_date:'',target_date:'',weeks:[]};Object.assign(t,{title:str(i.title,300),project:str(i.project,100),service:str(i.service,30),start_date:str(i.start_date,10)||t.start_date||r.week_start,target_date:str(i.target_date,10)});t.weeks.push({week:r.week_start,state:str(i.state,10),progress:Number(i.progress)||0,result:str(i.result),week_done:str(i.week_done),next_todo:str(i.next_todo)});map.set(key,t);});
 return [...map.values()].map(t=>{const first=t.weeks[0],last=t.weeks.at(-1);return {...t,first_progress:first.progress,final_state:last.state,final_progress:last.progress,result:last.result,delayed:!!t.target_date&&t.target_date<cut&&last.state!=='완료'};});
}
export function reviewStats(tasks){return {total:tasks.length,done:tasks.filter(t=>t.final_state==='완료').length,doing:tasks.filter(t=>t.final_state==='진행').length,hold:tasks.filter(t=>t.final_state==='보류').length,late:tasks.filter(t=>t.delayed).length,progress:tasks.length?Math.round(tasks.reduce((n,t)=>n+t.final_progress,0)/tasks.length):0};}
// 작성자 입력: 업무별 개선 방향·목표 일정 + 월 미션
export function collectImprovements(tasks,read){return tasks.map(t=>({task_key:t.task_key,title:t.title,direction:str(read(t.task_key,'direction'),2000),target_date:/^\d{4}-\d{2}-\d{2}$/.test(read(t.task_key,'target_date'))?read(t.task_key,'target_date'):''})).filter(x=>x.direction||x.target_date);}
// 데모 모드용 예시 분석(실제 AI 호출 없음)
export function demoReview(tasks){return {overview:'데모 예시입니다. 실제 화면에서는 이 달의 주간 보고를 AI가 분석해 업무 흐름을 요약합니다.',tasks:tasks.map(t=>({task_key:t.task_key,title:t.title,progress_summary:t.first_progress+'%에서 '+t.final_progress+'%로 진행되었습니다('+t.final_state+').',strengths:t.final_progress>t.first_progress?'매주 진척을 꾸준히 보고했습니다.':'진행 상황을 빠짐없이 기록했습니다.',weaknesses:t.weeks.some(w=>!w.week_done)?'일부 주차에 금주 한 일이 비어 있어 진행 근거가 부족합니다.':'성과를 수치로 표현하면 더 명확해집니다.',delayed:t.delayed,delay_reason:t.delayed?'목표 일정 이후에도 완료되지 않았습니다(추정: 일정 재조정 미반영).':'',response_plan:t.delayed?'남은 작업을 나눠 새 목표 일정을 정하고 다음 주간 보고에서 확인합니다.':''})),model:'demo',generated_at:new Date().toISOString()};}
