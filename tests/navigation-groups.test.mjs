import test from 'node:test';import assert from 'node:assert/strict';import {navigationHTML,subTabsHTML} from '../portal.mjs';
const section=(html,title)=>{const i=html.indexOf('<h2>'+title+'</h2>');return html.slice(i,html.indexOf('</section>',i));};
const ids=html=>[...html.matchAll(/data-view="([^"]+)"/g)].map(m=>m[1]);
test('three top-level groups: KPI 관리, 업무 관리, 업무 기록',()=>{
 const html=navigationHTML('dashboard',true);
 assert.deepEqual(ids(section(html,'KPI 관리')),['kpi-business','kpi-team','kpi-personal','kpi-goals']);
 for(const label of ['사업부 목표','팀 목표','개인 목표','목표 마일스톤 보드'])assert(section(html,'KPI 관리').includes(label));
 assert.deepEqual(ids(section(html,'업무 관리')),['kpi-rr','kpi-monthly-review','kpi-handover']);assert(section(html,'업무 관리').includes('월 업무 정리'));
 assert(section(html,'업무 관리').includes('개인 업무 R&amp;R'));
 assert.deepEqual(ids(section(html,'업무 기록')),['write','files','monthly-files','report-brief']);
 for(const label of ['주간업무성과 작성','주간업무성과 리포트','월간성과 리포트','업무성과 리포트 보고'])assert(section(html,'업무 기록').includes(label));
});
test('home stays on top, member admin only for managers, report brief only for managers',()=>{
 const manager=navigationHTML('dashboard',true),member=navigationHTML('dashboard',false);
 assert.equal(ids(manager)[0],'dashboard');assert.equal(ids(manager).at(-1),'members');
 assert(!member.includes('팀원 관리'));assert(!member.includes('report-brief'));
 assert(manager.includes('플랫폼 회원 통계'));
});
test('sub views highlight their parent menu',()=>{
 assert.match(navigationHTML('weekly',true),/data-view="files" class="active" aria-current="page"/);
 assert.match(navigationHTML('edit',false),/data-view="write" class="active"/);
 assert.match(navigationHTML('monthly',true),/data-view="monthly-files" class="active"/);
 assert.match(navigationHTML('report-brief-monthly',true),/data-view="report-brief" class="active"/);
});
test('sub tabs: generation tabs only for managers',()=>{
 assert.deepEqual(ids(subTabsHTML('files',true)),['files','weekly']);
 assert.equal(subTabsHTML('files',false),'');
 assert.deepEqual(ids(subTabsHTML('monthly',true)),['monthly-files','monthly']);
 assert.deepEqual(ids(subTabsHTML('edit',false)),['write','edit']);
 assert.deepEqual(ids(subTabsHTML('report-brief',true)),['report-brief','report-brief-monthly']);
 assert.equal(subTabsHTML('kpi-team',true),'');
 assert.match(subTabsHTML('weekly',true),/data-view="weekly" class="active" aria-current="page"/);
});
