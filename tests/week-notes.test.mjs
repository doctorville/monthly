import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
test('업무 편집 창은 주요 성과 아래에 금주 한 일·차주 할 일을 좌우로 두고, 이월 시 새로 비운다',async()=>{const app=await readFile(new URL('../app.js',import.meta.url),'utf8'),css=await readFile(new URL('../style.css',import.meta.url),'utf8');
 const r=app.indexOf('data-field="result"'),d=app.indexOf('data-field="week_done"'),t=app.indexOf('data-field="next_todo"');assert.ok(r>0&&r<d&&d<t);
 assert.match(app,/<div class="task-week-notes"><div class="field"><label>금주 한 일/);assert.match(app,/<div class="field"><label>차주 할 일/);
 assert.match(app,/loadedTaskValues\(taskCatalog\(user\.id\),sel\.value,formItems,index\),week_done:'',next_todo:''/);assert.match(app,/id:itemId\(prev,i,n\),week_done:'',next_todo:''/);
 assert.match(css,/\.task-week-notes\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);});
