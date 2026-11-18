import test from 'node:test';import assert from 'node:assert/strict';
import {homeSummary,dday,isLateTask} from '../home-summary.mjs';
const members=[{id:'a',name:'김가'},{id:'b',name:'이나'},{id:'c',name:'박다'}];
const reports=[
 {id:'r1',user_id:'a',week_start:'2026-11-09',status:'submitted',updated_at:'2026-11-13T09:00:00Z',items:[{id:'x',title:'옛 업무',state:'진행',progress:10,target_date:'2026-11-01'}]},
 {id:'r2',user_id:'a',week_start:'2026-11-16',status:'submitted',updated_at:'2026-11-18T09:00:00Z',items:[{id:'x',title:'랜딩 개편',project:'플랫폼',service:'닥터빌',state:'진행',progress:40,target_date:'2026-11-10'},{id:'y',title:'세미나',state:'완료',progress:100,target_date:'2026-11-12'},{id:'z',title:'제휴 메일',state:'진행',progress:20,target_date:'2026-11-22'}]},
 {id:'r3',user_id:'b',week_start:'2026-11-09',status:'submitted',updated_at:'2026-11-12T09:00:00Z',items:[{id:'k',title:'콘텐츠 이관',state:'보류',progress:0,target_date:'2026-11-30'}]},
 {id:'r4',user_id:'c',week_start:'2026-11-16',status:'draft',updated_at:'2026-11-18T10:00:00Z',items:[{id:'d',title:'초안',state:'진행',progress:0}]}
];
test('home summary follows the latest report per member and computes KPIs',()=>{
 const s=homeSummary({reports,members,today:'2026-11-18',week:'2026-11-16',userId:'a'});
 assert.equal(s.tasks.length,4);
 assert.deepEqual(s.kpis.map(k=>k.value),[2,'40%',1,1]);
 assert.equal(s.kpis[2].tone,'bad');assert.equal(s.kpis[3].tone,'warn');
 assert.deepEqual(s.late.map(i=>i.title),['랜딩 개편']);
 assert.deepEqual(s.upcoming.map(i=>i.title),['제휴 메일','콘텐츠 이관']);
 assert.deepEqual(s.stateCounts,[['진행',2],['완료',1],['보류',1]]);
 assert.deepEqual(s.ownerRows.map(r=>[r.name,r.total,r.done,r.late,r.submitted]),[['김가',3,1,1,true],['이나',1,0,0,false],['박다',0,0,0,false]]);
 assert.equal(s.submittedCount,1);
 assert.deepEqual(s.mine.map(i=>i.title),['랜딩 개편','제휴 메일']);
});
test('recent changes hide other members drafts but show own drafts',()=>{
 assert.deepEqual(homeSummary({reports,members,today:'2026-11-18',week:'2026-11-16',userId:'a'}).recent.map(r=>r.id),['r2','r1','r3']);
 assert.deepEqual(homeSummary({reports,members,today:'2026-11-18',week:'2026-11-16',userId:'c'}).recent.map(r=>r.id)[0],'r4');
});
test('d-day labels and lateness',()=>{
 assert.equal(dday('2026-11-18','2026-11-18'),'D-day');assert.equal(dday('2026-11-20','2026-11-18'),'D-2');assert.equal(dday('2026-11-10','2026-11-18'),'D+8');
 assert.equal(isLateTask({state:'완료',target_date:'2026-01-01'},'2026-11-18'),false);assert.equal(isLateTask({state:'진행'},'2026-11-18'),false);
});
