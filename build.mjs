import {mkdir,copyFile,writeFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
for(const file of ['index.html','style.css','app.js','core.mjs','weekly.mjs','portal.mjs','excel.mjs','metrics.mjs','dashboard-db.mjs','team-goals.mjs','home-summary.mjs','board.mjs','theme.mjs','monthly-review.mjs','team-responsibilities.mjs','handover.mjs','member-admin.mjs','goal-management.mjs','personal-goals.mjs','kpi-export.mjs','report-design.mjs','nhost-client.mjs','report-ai.mjs','monthly-report.mjs','config.js'])await copyFile(file,'dist/'+file);
// Nhost 연결 정보(공개 값만): NHOST_SUBDOMAIN, NHOST_REGION. 함수 주소를 직접 지정하려면 NHOST_AUTH_URL·NHOST_FUNCTIONS_URL.
const env=process.env,cfg={nhostSubdomain:env.NHOST_SUBDOMAIN||'',nhostRegion:env.NHOST_REGION||'',authUrl:env.NHOST_AUTH_URL||'',functionsUrl:env.NHOST_FUNCTIONS_URL||''};
if(!!cfg.nhostSubdomain!==!!cfg.nhostRegion)throw Error('NHOST_SUBDOMAIN과 NHOST_REGION을 모두 설정하세요.');
for(const k of ['authUrl','functionsUrl'])if(cfg[k]&&!/^https:\/\//.test(cfg[k]))throw Error(k+'는 HTTPS 주소여야 합니다.');
if(/secret|admin/i.test(Object.values(cfg).join(' ')))throw Error('관리자 비밀값은 브라우저 설정에 넣을 수 없습니다.');
if(Object.values(cfg).some(Boolean))await writeFile('dist/config.js','window.REPORT_CONFIG = '+JSON.stringify(Object.fromEntries(Object.entries(cfg).filter(([,v])=>v)))+';\n');
console.log('빌드 완료: dist/ (config.js 포함)');
