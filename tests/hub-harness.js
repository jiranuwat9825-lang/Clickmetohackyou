'use strict';
// Minimal DOM and transactional RTDB doubles for executing the actual hub scripts.
// No production connection, timers, or external packages are used by these tests.
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
module.exports=function loadHub(options={}){
 const elements=new Map(),errors=[],intervals=[],listeners=new Map();
 let state=null,now=1_000_000;
 class Element{
  constructor(){this.children=[];this.dataset={};this.hidden=false;this.value='';this.textContent='';this.innerHTML='';this.disabled=false;this.style={};this.classList={add(){},remove(){},toggle(){}};this.parentElement=this;this.events={};}
  get options(){return this.children;}
  append(...children){this.children.push(...children);}prepend(...children){this.children.unshift(...children);}replaceChildren(...children){this.children=[...children];}
  setAttribute(k,v){this[k]=String(v);}getAttribute(k){return this[k]??null;}addEventListener(k,fn){this.events[k]=fn;}remove(){}focus(){}scrollIntoView(){}querySelectorAll(){return [];}querySelector(){return new Element();}click(){return this.onclick?.();}
 }
 const document={getElementById(id){if(!elements.has(id))elements.set(id,new Element());return elements.get(id);},createElement(){return new Element();},querySelector(){return new Element();},querySelectorAll(){return [];},addEventListener(){},body:new Element(),documentElement:new Element()};
 const store=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};};
 function get(path){if(path==='.info/serverTimeOffset')return 0;if(path==='.info/connected')return true;if(path==='rooms')return state?{test:state}:null;if(path==='rooms/test')return state;return null;}
 function snapshot(v){return {val:()=>structuredClone(v),exists:()=>v!=null};}
 const db={ref(p){return {key:p.split('/').pop(),child:s=>db.ref(p+'/'+s),on(event,callback){listeners.set(p,callback);},off(){listeners.delete(p);},once:async()=>snapshot(get(p)),onDisconnect:()=>({remove:async()=>{},cancel:async()=>{}}),set:async value=>{if(p==='rooms/test')state=structuredClone(value);},remove:async()=>{},update:async()=>{},push:()=>db.ref('rooms/test'),transaction:async fn=>{
   const next=fn(structuredClone(get(p))),committed=next!==undefined;
   if(committed&&p==='rooms/test')state=next;
   return {committed,snapshot:snapshot(committed?next:get(p))};
  }};}};
 const firebase={initializeApp(){},database:Object.assign(()=>db,{ServerValue:{get TIMESTAMP(){return now;}}})};
 class Clock extends Date{static now(){return now;}}
 const session=store();for(const [key,value] of Object.entries(options.session||{}))session.setItem(key,value);
 const context=vm.createContext({document,firebase,console:{log(){},info(){},warn(){},error(...args){errors.push(args);}},localStorage:store(),sessionStorage:session,setTimeout(){return 1;},clearTimeout(){},setInterval(fn){intervals.push(fn);return intervals.length;},Date:Clock,Math,structuredClone,window:{matchMedia:()=>({matches:false}),location:{}},navigator:{clipboard:{writeText:async()=>{}}},URL,URLSearchParams});
 for(const file of (options.addons===false?['script.js']:['script.js','forbidden-engine.js','forbidden.js','insider.js','whoami_custom.js','avalon.js','cryptid-engine.js','cryptid.js','cheese-engine.js','cheese.js','tabletop-engine.js','tabletop.js','arcade-engine.js','arcade.js']))vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context,{filename:file});
 return {run:s=>vm.runInContext(s,context),element:id=>document.getElementById(id),errors,intervals,listeners,now:v=>{now=v;},getRoom:()=>state,setRoom(r,me='a'){
  state=structuredClone(r);context.testRoom=structuredClone(r);context.testMe=me;
  vm.runInContext("roomId='test';myId=testMe;myName=testMe;nameConfirmed=true;roomState=testRoom;isHost=roomState.hostId===myId;",context);
 },sync(){context.testRoom=structuredClone(state);vm.runInContext('roomState=testRoom;isHost=roomState.hostId===myId;',context);}};
};
