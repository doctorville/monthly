import {emptyMetrics,numberedMetricTitles,dayShift,numberValue,comparison} from './metrics.mjs?v=20261118-ia';
import {weeklyStats,weeklyReportTitles,weeklyTaskRows,weeklyWorkNotes} from './weekly.mjs?v=20261118-ia';
export function weeklyExcelRows(s){const date=d=>d?new Date(d+'T00:00:00Z'):null;return {
 tasks:[['업무 분야','업무내용','서비스','담당자','상태','진행률','시작일','목표 일정','주요성과'],...weeklyTaskRows(s).map(i=>[i.project||'업무 분야 미지정',i.title,i.service||'',i.ownerName,i.state,i.progress/100,date(i.start),date(i.target_date),i.result||''])],
 notes:[['담당자','주요 업무 외 한 일','할 일'],...weeklyWorkNotes(s).map(n=>[n.name,n.done||'없음',n.todo||'없음'])]
};}
const full=[[2,14]],metricSpans=[[2,4],[5,6],[7,7],[8,14]],taskSpans=[[2,2],[3,4],[5,5],[6,6],[7,7],[8,8],[9,9],[10,10],[11,14]],noteSpans=[[2,3],[4,8],[9,14]];
const width=20.625,bodyLine=15.5,maxLines=22;
function charWidth(c){return /[^\u0000-\u00ff]/u.test(c)?2:1;}
function wrappedLines(text,capacity){let count=1,line=0;for(const c of String(text)){if(c==='\n'){count++;line=0;}else{const next=charWidth(c);if(line+next>capacity){count++;line=0;}line+=next;}}return count;}
export function splitExcelText(value,capacity,limit=maxLines){if(typeof value!=='string')return [value];const chars=Array.from(value),chunks=[];let start=0,line=0,lines=1;for(let i=0;i<chars.length;i++){const c=chars[i],cost=charWidth(c);if(c==='\n'){lines++;line=0;}else{if(line+cost>capacity){lines++;line=0;}line+=cost;}if(lines>limit){const cut=c==='\n'?i+1:i;if(cut>start){chunks.push(chars.slice(start,cut).join(''));start=cut;}lines=1;line=cut>i?0:cost;}}if(start<chars.length||!chunks.length)chunks.push(chars.slice(start).join(''));return chunks;}
const capacity=([first,last])=>(last-first+1)*width-3;
const numberFormat=(value,unit='')=>('#,##0'+(Number.isInteger(value)?'':'.00'))+(unit?'"'+unit.replaceAll('"','')+'"':'');
export function weeklyExcelLayout(s){
 const rows=[],data=weeklyExcelRows(s),summary=s.metrics||emptyMetrics(s.week);let cursor=5;
 const add=(values,spans=full,kind='body',formats=[])=>{const chunks=values.map((value,i)=>splitExcelText(value,capacity(spans[i]))),count=Math.max(1,...chunks.map(c=>c.length));for(let part=0;part<count;part++){const cells=spans.map(([from,to],i)=>({from,to,value:chunks[i]?.[part]??'',numFmt:formats[i]}));const lines=Math.max(1,...cells.map(c=>wrappedLines(c.value instanceof Date?'2026-12-31':c.value,capacity([c.from,c.to]))));rows.push({row:cursor++,kind,cells,height:Math.max(26.1,Math.min(409.5,lines*bodyLine+8))});}};
 const text=(value,kind='body')=>add([value],full,kind),gap=()=>{rows.push({row:cursor++,kind:'gap',height:16,cells:[]});};
 const stats=weeklyStats(s);text('기간: '+s.week+' ~ '+dayShift(s.week,6)+' · 제출 마감: '+dayShift(s.week,4)+' 금요일');text('보고 인원 '+stats.people+'명'+(stats.members?' / '+stats.members+'명':'')+' · 주요 업무 '+stats.items+'건 · 완료 '+stats.done+'건 · 진행 '+stats.doing+'건 · 보류 '+stats.hold+'건');gap();
 text(weeklyReportTitles[0],'section');
 numberedMetricTitles('1').forEach((title,index)=>{
  const part=summary.sections?.[index]||{};text(title,'subsection');text('집계 기간: '+(part.period||s.week+' ~ '+dayShift(s.week,6)));
  for(const platform of ['닥터빌','팜빌']){
   text(platform,'platform');add(['지표명','전주 값','금주 값','증감 비교'],metricSpans,'tableHeader');
   const metrics=(part.rows||[]).filter(r=>(r.platform||(/^\[팜빌\]/.test(r.label)?'팜빌':'닥터빌'))===platform);
   if(!metrics.length)add(['지표','자료 미확인','자료 미확인',''],metricSpans);
   metrics.forEach(r=>{const previous=numberValue(r.previous),current=numberValue(r.value);add([r.label.replace(/^\[(닥터빌|팜빌)\]\s*/,''),previous??'자료 미확인',current??'자료 미확인',comparison(r)],metricSpans,'body',['',numberFormat(previous,r.unit),numberFormat(current,r.unit),'']);});
   for(const detail of (part.platform_details||[part]).filter(p=>(p.platform||'닥터빌')===platform)){
    if(!detail.detail_headers)continue;text(detail.detail_title||'상세');const count=detail.detail_headers.length;
    const spans=count===4?[[2,3],[4,5],[6,7],[8,14]]:count===5?[[2,6],[7,8],[9,10],[11,12],[13,14]]:count===6?[[2,5],[6,7],[8,9],[10,11],[12,12],[13,14]]:Array.from({length:count},(_,i)=>[2+Math.floor(i*13/count),1+Math.floor((i+1)*13/count)]);
    add(detail.detail_headers,spans,'tableHeader');for(const values of detail.detail_rows||[])add(spans.map((_,i)=>values[i]??''),spans);if(!detail.detail_rows?.length)text('해당 기간 상세 자료 없음');
   }
  }gap();
 });
 text(weeklyReportTitles[1],'section');data.tasks.forEach((values,i)=>add(values,taskSpans,i?'body':'tableHeader',i?['','','','','','0%','yyyy-mm-dd','yyyy-mm-dd','']:[]));if(data.tasks.length===1)text('입력된 주요 업무가 없습니다.');gap();gap();
 text(weeklyReportTitles[2],'section');data.notes.forEach((values,i)=>add(values,noteSpans,i?'body':'tableHeader'));if(data.notes.length===1)text('작성된 내용이 없습니다.');gap();gap();
 return {title:s.week+' 주간 업무성과 리포트',rows,lastRow:cursor-3};
}
export function buildWeeklyExcel(ExcelJS,s){
 const book=new ExcelJS.Workbook(),layout=weeklyExcelLayout(s);book.creator=s.author;book.created=new Date(s.created_at);
 const sheet=book.addWorksheet('주간 업무성과 리포트',{views:[{state:'frozen',ySplit:3,showGridLines:false}],pageSetup:{paperSize:9,orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0,printTitlesRow:'2:3',margins:{left:.7,right:.7,top:.75,bottom:.75,header:.3,footer:.3}}});
 sheet.columns=[{width:1.625},...Array.from({length:13},()=>({width}))];sheet.getRow(1).height=9.95;sheet.getRow(2).height=30;sheet.getRow(3).height=24;
 const border={top:{style:'thin',color:{argb:'FF000000'}},bottom:{style:'thin',color:{argb:'FF000000'}},left:{style:'thin',color:{argb:'FF000000'}},right:{style:'thin',color:{argb:'FF000000'}}};
 sheet.mergeCells('B2:N3');const title=sheet.getCell('B2');title.value=layout.title;title.font={name:'맑은 고딕',size:16,bold:true,color:{argb:'FFFFFFFF'}};title.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF595959'}};title.alignment={horizontal:'center',vertical:'middle',wrapText:true};title.border=border;
 let body=0;
 for(const record of layout.rows){const row=sheet.getRow(record.row);row.height=record.height;if(record.kind==='gap')continue;const dark=['section','tableHeader'].includes(record.kind),fill=dark?'FF595959':record.kind==='subsection'?'FFD9D9D9':record.kind==='body'&&body++%2?'FFF8F9FA':'FFFFFFFF';
  for(const data of record.cells){if(data.to>data.from)sheet.mergeCells(record.row,data.from,record.row,data.to);const cell=sheet.getCell(record.row,data.from);cell.value=data.value===''?null:data.value;cell.font={name:'맑은 고딕',size:record.kind==='platform'?14:record.kind==='subsection'?12:11,bold:dark||record.kind==='platform'||record.kind==='subsection',color:{argb:dark?'FFFFFFFF':'FF000000'}};cell.alignment={vertical:'middle',horizontal:dark||typeof data.value==='number'||data.value instanceof Date?'center':'left',wrapText:true};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:fill}};cell.border=border;if(data.numFmt)cell.numFmt=data.numFmt;}
 }
 sheet.pageSetup.printArea='B1:N'+layout.lastRow;return book;
}
let excelModule;
export async function weeklyExcelBlob(s){if(!globalThis.ExcelJS)excelModule||=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';script.onload=()=>resolve(globalThis.ExcelJS);script.onerror=()=>{excelModule=null;reject(Error('Excel 모듈을 불러오지 못했습니다. 네트워크를 확인해주세요.'));};document.head.append(script);});const ExcelJS=globalThis.ExcelJS||await excelModule,book=buildWeeklyExcel(ExcelJS,s);return new Blob([await book.xlsx.writeBuffer()],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});}
