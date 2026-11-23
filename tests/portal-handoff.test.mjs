import test from 'node:test';import assert from 'node:assert/strict';
import {createClient} from '../nhost-client.mjs';
const mem=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),m};};
const cfg={nhostSubdomain:'sub',nhostRegion:'ap-southeast-1'};
const nhSession={accessToken:'a1',refreshToken:'r1',accessTokenExpiresIn:900,user:{id:'u1',email:'me@x.com'}};

test('portal handoff PAT signs in once and is removed',async()=>{
 const storage=mem(),calls=[];
 storage.setItem('portal.handoff.monthly',JSON.stringify({pat:'p1',exp:Date.now()+60000}));
 const fetch=async(url,o)=>{calls.push([url,JSON.parse(o.body)]);return new Response(JSON.stringify({session:nhSession}),{status:200});};
 const c=createClient(cfg,{fetch,storage});
 const {data}=await c.auth.getSession();
 assert.equal(data.session.user.email,'me@x.com');
 assert.match(calls[0][0],/\/signin\/pat$/);assert.deepEqual(calls[0][1],{personalAccessToken:'p1'});
 assert.equal(storage.getItem('portal.handoff.monthly'),null);
 await c.auth.getSession();assert.equal(calls.length,1);
});

test('expired or missing handoff falls back to normal login',async()=>{
 const storage=mem();let n=0;
 storage.setItem('portal.handoff.monthly',JSON.stringify({pat:'p1',exp:Date.now()-1}));
 const c=createClient(cfg,{fetch:async()=>{n++;return new Response('{}',{status:200});},storage});
 const {data}=await c.auth.getSession();
 assert.equal(data.session,null);assert.equal(n,0);assert.equal(storage.getItem('portal.handoff.monthly'),null);
});
