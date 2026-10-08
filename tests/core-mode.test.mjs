import test from "node:test";
import assert from "node:assert/strict";
import {JSDOM} from "jsdom";
import jquery from "jquery";
import {installEnvironment} from "./fixture.mjs";
import {MODULE_ID} from "../scripts/assets.js";
import {halfCost,timingFor,refundFor,payFromPurse,purseValue,coinLabel,searchEntries,toEntry,normalize} from "../scripts/core-crafting.js";

test("core rules: half price, strike windows and refunds by hits",()=>{
  assert.equal(halfCost(5000),2500);
  assert.equal(halfCost(5),3);
  assert.equal(halfCost(1),1);
  assert.deepEqual([12,0,-5,-12].map(margin=>timingFor(margin).limit),[4500,3200,2200,1500]);
  for(const margin of [12,0,-5,-12]) {const t=timingFor(margin);assert.ok(t.start<t.end && t.end<t.limit);}
  assert.deepEqual([3,2,1,0].map(hits=>refundFor(hits,2500)),[0,1250,833,0]);
});

test("paying keeps the purse intact, breaks one coin for change and refuses a short purse",()=>{
  assert.deepEqual(payFromPurse({pp:0,gp:30,ep:0,sp:5,cp:2},2500),{pp:0,gp:5,ep:0,sp:5,cp:2});
  assert.deepEqual(payFromPurse({pp:1,gp:0,ep:0,sp:0,cp:0},250),{pp:0,gp:7,ep:0,sp:5,cp:0});
  assert.deepEqual(payFromPurse({pp:0,gp:2,ep:0,sp:0,cp:0},1),{pp:0,gp:1,ep:0,sp:9,cp:9});
  assert.deepEqual(payFromPurse({pp:0,gp:1,ep:1,sp:3,cp:0},175),{pp:0,gp:0,ep:0,sp:0,cp:5});
  assert.equal(payFromPurse({gp:24,sp:9,cp:9},2500),null);
  assert.equal(payFromPurse({gp:"x"},1),null);
  assert.equal(payFromPurse({gp:5},-1),null);
  // Whatever the mix, the purse loses exactly the cost.
  for(const purse of [{pp:3,gp:7,ep:5,sp:13,cp:41},{pp:0,gp:0,ep:9,sp:0,cp:3},{pp:2,gp:0,ep:0,sp:0,cp:0}]) {
    for(const cost of [1,7,49,50,99,101,449,1234]) {
      const next=payFromPurse(purse,cost);
      if(purseValue(purse)<cost) assert.equal(next,null);
      else {assert.equal(purseValue(next),purseValue(purse)-cost);assert.ok(Object.values(next).every(amount=>amount>=0));}
    }
  }
  const t=key=>key.split(".")[1];
  assert.equal(coinLabel(2575,t),"25 gp 7 sp 5 cp");
  assert.equal(coinLabel(0,t),"0 gp");
});

const adapter={moduleId:"test",itemTypes:["weapon","consumable"],detectCategory:item=>item.type==="weapon"?"herreria":"alquimia",
  priceCp:item=>Math.round((item.system?.price?.value??0)*100),dc:()=>13,meta:()=>"",rank:item=>item.system?.price?.value??0};
test("only priced items of craftable types become recipes; search ignores accents and case",()=>{
  assert.equal(toEntry(adapter,{uuid:"a",name:"Gem",type:"loot",system:{price:{value:50}}}),null);
  assert.equal(toEntry(adapter,{uuid:"a",name:"Relic",type:"weapon",system:{price:{value:0}}}),null);
  assert.equal(toEntry(adapter,{name:"No id",type:"weapon",system:{price:{value:5}}}),null);
  const entries=[["Espada Élfica","weapon",50],["Poción de curación","consumable",50],["Dagger","weapon",2]]
    .map(([name,type,value],i)=>toEntry(adapter,{uuid:`u${i}`,name,type,system:{price:{value}}}));
  assert.deepEqual(entries.map(entry=>[entry.category,entry.cost]),[["herreria",2500],["alquimia",2500],["herreria",100]]);
  assert.deepEqual(searchEntries(entries,"ELFICA").rows.map(entry=>entry.name),["Espada Élfica"]);
  assert.equal(searchEntries(entries,"").total,3);
  assert.deepEqual(searchEntries(entries,"",2),{total:3,rows:entries.slice(0,2)});
  assert.equal(normalize("  Poción "),"pocion");
});

/** Drives the real Core window with a virtual clock, so strike timing is exact. */
async function workshop(generation,{tools=false}={}) {
  const dom=new JSDOM("<body></body>",{url:"http://localhost/"});
  const env=installEnvironment({window:dom.window,jquery:jquery(dom.window),generation});
  env.craftingMode="core";
  if(tools) await env.seed();
  let clock=0;const frames=[];
  Object.defineProperty(globalThis,"performance",{value:{now:()=>clock},configurable:true});
  globalThis.requestAnimationFrame=fn=>frames.push(fn);
  globalThis.cancelAnimationFrame=()=>{};
  class ApplicationV2 {
    constructor(options) {this.options=options;this.id=options.id;}
    async render() {
      this.element=document.createElement("div");
      const content=document.createElement("div");
      this.element.append(content);
      this._replaceHTML(await this._renderHTML(),content);
      document.body.append(this.element);
      this._onRender({}, {});
      return this;
    }
    bringToFront() {this.raised=true;}
    async close() {this.element?.remove();return this;}
  }
  foundry.applications.api.ApplicationV2=ApplicationV2;
  foundry.utils={debounce:fn=>fn};
  const a=env.actor;
  a.system.currency={pp:0,gp:100,ep:0,sp:0,cp:0};
  a.update=async patch=>{
    if(a.failPurse) {a.failPurse=false;throw Error("purse failed");}
    for(const [path,value] of Object.entries(patch)) {
      const parts=path.split(".");let target=a;
      for(const key of parts.slice(0,-1)) target=target[key];
      target[parts.at(-1)]=structuredClone(value);
    }
  };
  const source=(id,name,type,price,extra={})=>({uuid:`Compendium.world.gear.Item.${id}`,name,type,img:"icons/svg/sword.svg",
    system:{price:{value:price,denomination:"gp"},rarity:"common",quantity:20,equipped:true,...extra},
    toObject() {return {_id:id,name,type,img:this.img,system:structuredClone(this.system)};}});
  const docs=[source("sword","Longsword","weapon",50),source("potion","Potion of Healing","consumable",50),source("gem","Ruby","loot",5000),source("free","Heirloom Blade","weapon",0)];
  env.documents=new Map(docs.map(doc=>[doc.uuid,doc]));
  game.packs=[{documentName:"Item",visible:true,title:"Gear",collection:"world.gear",getIndex:async()=>docs},
    {documentName:"Actor",visible:true,getIndex:async()=>{throw Error("not an item pack");}},
    {documentName:"Item",visible:false,getIndex:async()=>{throw Error("hidden pack");}}];
  await import(`../scripts/crafting-dialog.js?core=${generation}-${Math.random()}`);
  await env.fire("init");await env.fire("ready");
  const api=game.modules.get(MODULE_ID).api;
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const until=async check=>{for(let i=0;i<200;i++) {if(check()) return;await wait(10);} throw Error("Timed out waiting for the workshop");};
  const f={env,a,api,wait,until,frames,
    advance(ms) {clock+=ms;for(const fn of frames.splice(0)) fn();},
    query:selector=>f.app.element.querySelector(selector),
    all:selector=>[...f.app.element.querySelectorAll(selector)],
    /** Strikes at the given moments; null lets that icon run out. */
    async play(moments) {
      for(const [index,moment] of moments.entries()) {
        await until(()=>f.all(".rvc-strike").length===index+1);
        if(moment===null) f.advance(60000);
        else {f.advance(moment);f.all(".rvc-strike").at(-1).click();}
      }
      await until(()=>f.query(".rvc-result").classList.length>1);
    }
  };
  return f;
}

for(const generation of [13,14]) test(`v${generation}: core workshop charges half the price, runs the native check and delivers on three hits`,async()=>{
  const f=await workshop(generation,{tools:true});
  assert.equal(game.settings.get(MODULE_ID,"craftingMode"),"core");
  f.app=f.api.open();
  await f.until(()=>f.query(".rvc"));
  assert.equal(f.api.open(),f.app,"one window per actor");
  assert.equal(f.env.dialogs.length,0,"core mode never builds the extended dialog");
  assert.equal(f.query(".rvc").dataset.screen,"menu");
  assert.equal(f.all("[data-category]").length,5);
  f.query('[data-category="herreria"]').click();
  await f.until(()=>f.all(".rvc-row").length>0);
  // Loot and unpriced items are not recipes; the potion belongs to another trade.
  assert.deepEqual(f.all(".rvc-row strong").map(node=>node.textContent),["Longsword"]);
  f.query(".rvc-search").value="zzz";f.query(".rvc-search").dispatchEvent(new f.app.element.ownerDocument.defaultView.Event("input"));
  assert.equal(f.all(".rvc-row").length,0);
  f.query(".rvc-search").value="long";f.query(".rvc-search").dispatchEvent(new f.app.element.ownerDocument.defaultView.Event("input"));
  f.query(".rvc-row").click();
  await f.until(()=>f.query(".rvc").dataset.screen==="bench");
  assert.equal(f.query(".rvc-item-name").textContent,"Longsword");
  assert.equal(f.query(".rvc-craft").disabled,false);

  f.env.rollResult=20;
  f.query(".rvc-craft").click();
  await f.play([3000,3000,3000]);
  assert.equal(f.env.nativeChecks.at(-1).kind,"tool","the smith's tools drive the check");
  assert.equal(f.a.system.currency.gp,75,"half of 50 gp");
  const crafted=f.a.items.find(item=>item.name==="Longsword");
  assert.ok(crafted);
  assert.equal(crafted.system.quantity,1);assert.equal(crafted.system.equipped,false);assert.notEqual(crafted.id,"sword");
  assert.ok(f.query(".rvc-result").classList.contains("rvc-success"));
  assert.deepEqual(f.env.chat.at(-1).whisper,["gm"]);
  assert.match(f.env.chat.at(-1).content,/Longsword/);
  assert.equal(f.query(".rvc-craft").disabled,false,"another attempt is possible afterwards");

  // Two hits: no item, half the coin back.
  const before=f.a.items.size;
  f.query(".rvc-craft").click();
  await f.play([3000,3000,null]);
  assert.equal(f.a.items.size,before);
  assert.equal(purse(f.a),7500-2500+1250);
  assert.ok(f.query(".rvc-result").classList.contains("rvc-failure"));

  // A click outside the window is a miss; no hits means no refund.
  const funds=purse(f.a);
  f.query(".rvc-craft").click();
  await f.play([10,10,10]);
  assert.equal(purse(f.a),funds-2500);
  await f.app.close();
});

const purse=actor=>["pp","gp","ep","sp","cp"].reduce((sum,coin,i)=>sum+actor.system.currency[coin]*[1000,100,50,10,1][i],0);

test("core workshop: short purse, cancelled check, failures and closing mid-game never lose or mint coin",async()=>{
  const f=await workshop(14);
  f.app=f.api.openCore();
  await f.until(()=>f.query(".rvc"));
  f.query('[data-category="herreria"]').click();
  await f.until(()=>f.all(".rvc-row").length>0);
  f.query(".rvc-row").click();
  await f.until(()=>f.query(".rvc").dataset.screen==="bench");

  f.a.system.currency={pp:0,gp:24,ep:0,sp:9,cp:9};
  f.app.afford();
  assert.equal(f.query(".rvc-craft").disabled,true,"cannot start without the coin");
  await f.app.craft();
  assert.equal(purse(f.a),2499);assert.equal(f.env.nativeChecks.length,0);

  f.a.system.currency={pp:0,gp:100,ep:0,sp:0,cp:0};
  f.env.cancelCheck=true;
  await f.app.craft();
  assert.equal(purse(f.a),10000,"cancelling the check dialog returns the coin");
  assert.equal(f.env.nativeChecks.at(-1).kind,"ability","without artisan tools the check is plain Intelligence");
  assert.equal(f.env.nativeChecks.at(-1).config.ability,"int");
  assert.equal(f.all(".rvc-strike").length,0);
  f.env.cancelCheck=false;

  const error=console.error;console.error=()=>{};
  try {
    f.env.failRoll=true;
    await f.app.craft();
    assert.equal(purse(f.a),10000,"a failed roll returns the coin");
    f.env.failRoll=false;
    f.a.failCreate=true;f.env.rollResult=20;
    const attempt=f.app.craft();
    await f.play([3000,3000,3000]).catch(()=>{});
    await attempt;
    assert.equal(purse(f.a),10000,"an item that could not be delivered is not charged");
    assert.equal(f.a.items.find(item=>item.name==="Longsword"),undefined);
  } finally {console.error=error;}

  // Dropping an item from another trade is refused; dropping a matching one selects it.
  const drop=uuid=>f.app.drop({preventDefault() {},dataTransfer:{getData:()=>JSON.stringify({type:"Item",uuid})}});
  await drop("Compendium.world.gear.Item.potion");
  assert.equal(f.query(".rvc-item-name").textContent,"Longsword");
  await drop("Compendium.world.gear.Item.gem");
  assert.equal(f.query(".rvc-item-name").textContent,"Longsword");
  assert.equal(f.env.notices.length>=2,true);

  // Closing during the mini-game counts the rest as misses: one hit returns a third.
  const attempt=f.app.craft();
  await f.until(()=>f.all(".rvc-strike").length===1);
  f.advance(3000);f.all(".rvc-strike")[0].click();
  await f.wait(20);
  await f.app.close();
  await attempt;
  assert.equal(purse(f.a),10000-2500+833);
  assert.equal(f.a.items.find(item=>item.name==="Longsword"),undefined);
  const reopened=f.api.openCore();
  assert.notEqual(reopened,f.app,"a closed workshop can be opened again");
  await f.until(()=>reopened.element);
  await reopened.close();
});

test("the world setting chooses the workshop: core by default, extended on request",async()=>{
  const dom=new JSDOM("<body></body>",{url:"http://localhost/"});
  const env=installEnvironment({window:dom.window,jquery:jquery(dom.window),generation:14});
  env.craftingMode=undefined;
  await env.seed();
  await import(`../scripts/crafting-dialog.js?mode=${Math.random()}`);
  await env.fire("init");await env.fire("ready");
  assert.equal(env.settingDefaults.get(`${MODULE_ID}.craftingMode`).default,"core");
  assert.equal(env.settingDefaults.get(`${MODULE_ID}.craftingMode`).scope,"world");
  assert.deepEqual(Object.keys(env.settingDefaults.get(`${MODULE_ID}.craftingMode`).choices),["core","extended"]);
  const api=game.modules.get(MODULE_ID).api;
  await game.settings.set(MODULE_ID,"craftingMode","extended");
  const dialog=api.open();
  assert.equal(env.dialogs.length,1);assert.ok(dialog.element.querySelector("#rv-crafting-root"));
  await dialog.close();
  assert.equal(api.openExtended(),env.dialogs.at(-1));
  await env.dialogs.at(-1).close();
});
