import test from 'node:test';import assert from 'node:assert/strict';
import {monthReportsOf,monthlyTasks,reviewStats,collectImprovements,demoReview,monthEnd} from '../monthly-review.mjs';
const reports=[
 {id:'r0',user_id:'a',status:'submitted',week_start:'2026-10-26',items:[{id:'A',title:'이전 달',state:'진행',progress:10}]},
 {id:'r1',user_id:'a',status:'submitted',week_start:'2026-11-02',items:[{id:'A',title:'랜딩',project:'플랫폼',service:'닥터빌',state:'진행',progress:30,target_date:'2026-11-10',week_done:'시안'},{id:'B',title:'세미나',state:'진행',progress:50,target_date:'2026-11-30'}]},
 {id:'r2',user_id:'a',status:'submitted',week_start:'2026-11-09',items:[{id:'A',title:'랜딩',project:'플랫폼',service:'닥터빌',state:'진행',progress:60,target_date:'2026-11-10',result:'시안 확정',week_done:'개발'},{id:'B',title:'세미나',state:'완료',progress:100,target_date:'2026-11-30'}]},
 {id:'r3',user_id:'a',status:'draft',week_start:'2026-11-16',items:[{id:'C',title:'초안',state:'진행',progress:0}]},
 {id:'r4',user_id:'b',status:'submitted',week_start:'2026-11-02',items:[{id:'X',title:'남의 업무',state:'진행',progress:0}]}];
test('월 업무 정리는 해당 월·본인·제출본만 업무별로 묶고 지연을 계산한다',()=>{
 const rs=monthReportsOf(reports,'a','2026-11');assert.deepEqual(rs.map(r=>r.id),['r1','r2']);
 const t=monthlyTasks(rs,'2026-11','2026-11-20');
 assert.deepEqual(t.map(x=>[x.task_key,x.weeks.length,x.first_progress,x.final_progress,x.final_state,x.delayed]),[['A',2,30,60,'진행',true],['B',2,50,100,'완료',false]]);
 assert.equal(t[0].result,'시안 확정');assert.equal(t[0].start_date,'2026-11-02');assert.deepEqual(t[0].weeks.map(w=>w.week_done),['시안','개발']);
 assert.deepEqual(reviewStats(t),{total:2,done:1,doing:1,hold:0,late:1,progress:80});
 assert.equal(monthEnd('2026-02'),'2026-02-28');
 assert.equal(monthlyTasks(rs,'2026-11','2026-11-05')[0].delayed,false);
});
test('작성자 입력은 내용이 있는 업무만 저장하고 날짜 형식을 검사한다',()=>{
 const t=monthlyTasks(monthReportsOf(reports,'a','2026-11'),'2026-11','2026-11-20');
 const v={A:{direction:' 일정 먼저 확정 ',target_date:'2026-12-15'},B:{direction:'',target_date:'bad'}};
 assert.deepEqual(collectImprovements(t,(k,f)=>v[k][f]),[{task_key:'A',title:'랜딩',direction:'일정 먼저 확정',target_date:'2026-12-15'}]);
});
test('데모 분석은 지연 업무에만 지연 이유·대응 방안을 채운다',()=>{
 const t=monthlyTasks(monthReportsOf(reports,'a','2026-11'),'2026-11','2026-11-20'),d=demoReview(t);
 assert.equal(d.model,'demo');assert.ok(d.tasks[0].delay_reason&&d.tasks[0].response_plan);assert.equal(d.tasks[1].delay_reason,'');
});
