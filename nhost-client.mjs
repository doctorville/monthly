// Nhost(doctorville) 연결 클라이언트.
// 기존 화면 코드가 쓰던 supabase-js의 일부 API(auth.signInWithOtp/verifyOtp/getSession/signOut, from().select()…, rpc, functions.invoke)를
// 같은 형태({data,error})로 제공하므로 화면 코드는 거의 그대로 동작합니다.
// - 로그인: Nhost Auth 이메일 인증코드(OTP)  /signin/otp/email, /signin/otp/email/verify, /token, /signout
// - 데이터: Nhost Function teamwork/db (토큰 검증 후 DB의 RLS 정책으로 권한 판단)
// - GPT 요약·팀원 계정: Nhost Function teamwork/report-ai, teamwork/member-admin
const STORE='teamwork.nhost.session';

export function nhostUrls(cfg={}){
 const sub=String(cfg.nhostSubdomain||'').trim(),region=String(cfg.nhostRegion||'').trim();
 const base=service=>sub&&region?'https://'+sub+'.'+service+'.'+region+'.nhost.run/v1':'';
 const authUrl=String(cfg.authUrl||base('auth')).replace(/\/+$/,''),functionsUrl=String(cfg.functionsUrl||base('functions')).replace(/\/+$/,'');
 return {authUrl,functionsUrl,configured:!!(authUrl&&functionsUrl)};
}
export const isConfigured=cfg=>nhostUrls(cfg).configured;

function memoryStorage(){const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};}
function defaultStorage(){try{const s=globalThis.localStorage;s.setItem('__t','1');s.removeItem('__t');return s;}catch{return memoryStorage();}}
const toUser=u=>u?{id:u.id,email:u.email||null,user_metadata:{name:u.displayName||''},raw:u}:null;
const asSession=s=>s?{access_token:s.accessToken,refresh_token:s.refreshToken,expires_at:Math.floor(s.expiresAt/1000),user:toUser(s.user)}:null;
const authError=(status,body,fallback)=>({status,code:body?.error||String(status||''),message:body?.message||body?.error||fallback||'요청 실패'});

class Query{
 constructor(client,table){this.c=client;this.spec={action:'select',table,columns:'*',filters:[],order:[]};}
 select(columns='*'){if(this.spec.action==='select')this.spec.columns=columns;else{this.spec.returning=true;this.spec.columns=columns;}return this;}
 insert(values){Object.assign(this.spec,{action:'insert',values,columns:'*'});return this;}
 update(values){Object.assign(this.spec,{action:'update',values,columns:'*'});return this;}
 delete(){Object.assign(this.spec,{action:'delete',columns:'*'});return this;}
 filter(op,col,val){this.spec.filters.push([op,col,val]);return this;}
 eq(c,v){return this.filter('eq',c,v);} neq(c,v){return this.filter('neq',c,v);}
 gt(c,v){return this.filter('gt',c,v);} gte(c,v){return this.filter('gte',c,v);} lt(c,v){return this.filter('lt',c,v);} lte(c,v){return this.filter('lte',c,v);}
 like(c,v){return this.filter('like',c,v);} ilike(c,v){return this.filter('ilike',c,v);} in(c,v){return this.filter('in',c,v);} is(c,v){return this.filter('is',c,v);}
 match(obj){for(const [k,v] of Object.entries(obj))this.eq(k,v);return this;}
 order(col,{ascending=true,nullsFirst}={}){this.spec.order.push(nullsFirst===undefined?[col,ascending]:[col,ascending,nullsFirst]);return this;}
 limit(n){this.spec.limit=n;return this;}
 single(){this.spec.single='single';return this;}
 maybeSingle(){this.spec.single='maybe';return this;}
 then(resolve,reject){return this.c._db(this.spec).then(resolve,reject);}
}

export function createClient(cfg={},{fetch:fetchImpl=globalThis.fetch.bind(globalThis),storage=defaultStorage(),now=()=>Date.now()}={}){
 const {authUrl,functionsUrl}=nhostUrls(cfg);
 let session=null,refreshing=null;
 const save=s=>{session=s;if(s)storage.setItem(STORE,JSON.stringify(s));else storage.removeItem(STORE);};
 const load=()=>{try{const s=JSON.parse(storage.getItem(STORE)||'null');return s&&s.accessToken&&s.refreshToken?s:null;}catch{return null;}};
 const fromNhost=s=>({accessToken:s.accessToken,refreshToken:s.refreshToken,expiresAt:now()+Number(s.accessTokenExpiresIn||900)*1000,user:s.user});
 async function post(url,body,token){
  const r=await fetchImpl(url,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});
  const text=await r.text();let json=null;try{json=text?JSON.parse(text):null;}catch{}
  return {ok:r.ok,status:r.status,json,response:r};
 }
 async function refresh(){
  const latest=load();if(latest&&(!session||latest.refreshToken!==session.refreshToken))session=latest; // 다른 탭이 먼저 갱신한 경우
  if(!session)return null;
  if(session.expiresAt-now()>60000)return session;
  if(!refreshing)refreshing=(async()=>{const r=await post(authUrl+'/token',{refreshToken:session.refreshToken});
   if(!r.ok){const again=load();if(again&&again.refreshToken!==session.refreshToken&&again.expiresAt-now()>60000){session=again;return session;}save(null);return null;}
   const next=fromNhost(r.json);if(!next.user)next.user=session.user;save(next);return next;})().finally(()=>{refreshing=null;});
  return refreshing;
 }
 async function token(){const s=await refresh();if(!s)throw Object.assign(Error('로그인이 만료되었습니다. 다시 로그인해주세요.'),{status:401});return s.accessToken;}
 const client={
  auth:{
   async getSession(){try{return {data:{session:asSession(await refresh())},error:null};}catch(err){return {data:{session:null},error:err};}},
   async signInWithOtp({email}){const r=await post(authUrl+'/signin/otp/email',{email:String(email||'').trim().toLowerCase()});return r.ok?{data:{},error:null}:{data:null,error:authError(r.status,r.json,'인증코드를 보내지 못했습니다.')};},
   async verifyOtp({email,token:otp}){const r=await post(authUrl+'/signin/otp/email/verify',{email:String(email||'').trim().toLowerCase(),otp:String(otp||'')});
    if(!r.ok||!r.json?.session)return {data:null,error:authError(r.status,r.json,'인증코드가 맞지 않습니다.')};
    save(fromNhost(r.json.session));return {data:{session:asSession(session),user:toUser(session.user)},error:null};},
   async signOut(){const s=session||load();save(null);if(s){try{await post(authUrl+'/signout',{refreshToken:s.refreshToken},s.accessToken);}catch{}}return {error:null};}
  },
  from:table=>new Query(client,table),
  rpc:(fn,args={})=>client._db({action:'rpc',fn,args}),
  functions:{
   async invoke(name,{body}={}){
    let t;try{t=await token();}catch(err){return {data:null,error:{message:err.message,context:new Response(JSON.stringify({error:err.message}),{status:401})}};}
    let r;try{r=await fetchImpl(functionsUrl+'/teamwork/'+name,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+t},body:JSON.stringify(body||{})});}
    catch(err){return {data:null,error:{message:'서버에 연결하지 못했습니다: '+err.message}}}
    if(!r.ok)return {data:null,error:{message:'함수 오류 (HTTP '+r.status+')',context:r}};
    try{return {data:await r.json(),error:null};}catch{return {data:null,error:{message:'함수 응답을 해석하지 못했습니다.',context:r}};}
   }
  },
  async _db(spec){
   try{
    const t=await token();
    const r=await fetchImpl(functionsUrl+'/teamwork/db',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+t},body:JSON.stringify(spec)});
    const text=await r.text();let json=null;try{json=text?JSON.parse(text):null;}catch{}
    if(!r.ok||json?.error)return {data:null,error:{message:json?.error?.message||('DB 요청 실패 (HTTP '+r.status+')'),code:json?.error?.code||String(r.status),details:json?.error?.details||null,hint:json?.error?.hint||null,status:r.status}};
    return {data:json?.data??null,error:null};
   }catch(err){return {data:null,error:{message:err.message||'DB 요청 실패',code:String(err.status||'NETWORK'),status:err.status}};}
  }
 };
 session=load();
 return client;
}
