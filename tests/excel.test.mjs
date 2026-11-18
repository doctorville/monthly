import test from 'node:test';import assert from 'node:assert/strict';import {weeklyExcelRows} from '../excel.mjs';
test('Excel exports typed progress/dates and pairs 한 일 · 할 일 by reporter',()=>{const s={members:[{id:'a',name:'가'},{id:'b',name:'나'}],reports:[{user_id:'a',week_start:'2026-10-05',items:[{id:'t',project:'운영',title:'=업무',state:'진행',start_date:'2026-10-01',target_date:'2026-10-09',progress:55,result:'성과',service:'팜빌'}],issues:'[개발] 서버 지원',next_plan:'[운영] 게시'},{user_id:'b',week_start:'2026-10-05',items:[{id:'u',project:'운영',title:'시작일 없음',state:'완료',progress:100}],issues:'개발: 서버 지원',next_plan:''}]};const r=weeklyExcelRows(s);
 assert.deepEqual(r.tasks[0],['업무 분야','업무내용','서비스','담당자','상태','진행률','시작일','목표 일정','주요성과']);
 assert.equal(r.tasks[1][1],'=업무');assert.equal(r.tasks[1][5],0.55);assert.ok(r.tasks[1][6] instanceof Date);assert.ok(r.tasks[1][7] instanceof Date);
 assert.equal(r.tasks[2][6].toISOString().slice(0,10),'2026-10-05');assert.equal(r.tasks[2][7],null);
 assert.deepEqual(r.notes[0],['담당자','주요 업무 외 한 일','할 일']);assert.deepEqual(r.notes[1],['가','[개발] 서버 지원','[운영] 게시']);assert.deepEqual(r.notes[2],['나','개발: 서버 지원','없음']);});
