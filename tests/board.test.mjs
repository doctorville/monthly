import test from 'node:test';import assert from 'node:assert/strict';
import {boardMonths,timeline,barOf,boardStats,groupEntries,groupSummary,matchEntry,isLateItem} from '../board.mjs';
test('board months cover this month and task dates, at least 8 and at most 12 months',()=>{
 assert.deepEqual(boardMonths([],'2026-11-18'),['2026-11','2026-12','2027-01','2027-02','2027-03','2027-04','2027-05','2027-06']);
 const m=boardMonths([{start_date:'2026-09-01',target_date:'2027-10-31'}],'2026-11-18');
 assert.equal(m[0],'2026-09');assert.equal(m.length,12);
 assert.equal(boardMonths([{start_date:'2024-01-01'}],'2026-11-18')[0],'2026-02');
});
test('bars run from start (or report week) to target with a diamond at the target',()=>{
 const tl=timeline(['2026-11','2026-12']);
 assert.equal(tl.pos('2026-11-01'),0);assert.equal(Math.round(tl.pos('2026-12-01')),49);assert.equal(tl.pos('2027-03-01'),100);
 const b=barOf({start_date:'2026-11-01',target_date:'2026-12-01'},tl,'');assert.equal(b.left,0);assert.equal(Math.round(b.width),49);assert.equal(Math.round(b.diamond),49);
 const f=barOf({target_date:''},tl,'2026-11-16');assert.equal(f.diamond,null);assert(f.width>0);
 assert.equal(barOf({},tl,''),null);
 assert(tl.inRange('2026-11-18'));assert(!tl.inRange('2027-02-01'));
});
test('stats, lateness, grouping and filters',()=>{
 const items=[{state:'진행',target_date:'2026-11-10',title:'랜딩',project:'플랫폼 운영',progress:40},{state:'진행',target_date:'2026-11-20',title:'제휴',project:'플랫폼 운영',progress:20},{state:'완료',target_date:'2026-11-01',title:'세미나',project:'콘텐츠 운영',progress:100},{state:'보류',title:'이관',project:'콘텐츠 운영',progress:0}];
 assert.deepEqual(boardStats(items,'2026-11-18'),{total:4,active:2,late:1,dueSoon:1});
 assert.equal(isLateItem(items[2],'2026-11-18'),false);
 const entries=items.map((item,index)=>({item,index,week:'2026-11-16',ownerName:'김가'}));
 const g=groupEntries(entries,x=>x.item.project);assert.deepEqual(g.map(x=>[x.key,x.rows.length]),[['플랫폼 운영',2],['콘텐츠 운영',2]]);
 assert.deepEqual(groupSummary(g[0].rows,'2026-11-18'),{start:'2026-11-16',end:'2026-11-20',progress:30,late:1});
 assert.deepEqual(entries.filter(x=>matchEntry(x,{state:'지연'},'2026-11-18')).map(x=>x.item.title),['랜딩']);
 assert.deepEqual(entries.filter(x=>matchEntry(x,{query:'콘텐츠'},'2026-11-18')).map(x=>x.item.title),['세미나','이관']);
 assert.deepEqual(entries.filter(x=>matchEntry(x,{query:'김가',state:'완료'},'2026-11-18')).map(x=>x.item.title),['세미나']);
});
