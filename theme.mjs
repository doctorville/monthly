// 화면 테마: 화이트(기본)·블랙. 선택값은 이 브라우저에 저장되어 다음 접속에도 유지됩니다.
export const THEME_KEY='teamwork-theme';
export const THEMES={light:{label:'화이트',meta:'#626EE6'},dark:{label:'블랙',meta:'#0F1115'}};
export function readTheme(storage=globalThis.localStorage){try{return storage?.getItem(THEME_KEY)==='dark'?'dark':'light';}catch{return 'light';}}
export function applyTheme(theme,doc=globalThis.document){const t=theme==='dark'?'dark':'light';if(!doc)return t;if(t==='dark')doc.documentElement.dataset.theme='dark';else delete doc.documentElement.dataset.theme;doc.querySelector('meta[name="theme-color"]')?.setAttribute('content',THEMES[t].meta);return t;}
export function saveTheme(theme,storage=globalThis.localStorage){try{storage?.setItem(THEME_KEY,theme==='dark'?'dark':'light');}catch{}}
export function nextTheme(theme){return theme==='dark'?'light':'dark';}
// 버튼은 '바꿀 테마'를 보여줍니다. 현재 상태는 aria-pressed(블랙 사용 중 여부)로 전달합니다.
export function themeToggleHTML(theme){const dark=theme==='dark';return '<button type="button" id="theme-toggle" class="theme-toggle" aria-pressed="'+dark+'" title="화면 테마 변경">'+(dark?'<span aria-hidden="true">○</span> 화이트 테마':'<span aria-hidden="true">●</span> 블랙 테마')+'</button>';}
