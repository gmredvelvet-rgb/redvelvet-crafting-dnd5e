import test from "node:test";
import assert from "node:assert/strict";
import {JSDOM} from "jsdom";
import jquery from "jquery";
import {installEnvironment,item} from "./fixture.mjs";
import {MODULE_ID} from "../scripts/assets.js";
const flush=()=>new Promise(resolve=>setImmediate(resolve));
for(const generation of [13,14]) test(`v${generation}: actual UI launch, ownership, profession gating and inventory workflows`,async()=>{
  const dom=new JSDOM("<body></body>",{url:"http://localhost/"});
  const env=installEnvironment({window:dom.window,jquery:jquery(dom.window),generation});
  await env.seed();
  await import(`../scripts/crafting-dialog.js?generation=${generation}`);
  await env.fire("init");await env.fire("ready");
  const api=game.modules.get(MODULE_ID).api;
  const dialog=api.open();
  assert.equal(api.open(),dialog);
  assert.equal(dialog.raised,true);
  const click=selector=>dialog.element.querySelector(selector).click();
  const labels=()=>["edificios","cultivos","monstruos"].map(cat=>dialog.element.querySelector(`[data-category="${cat}"] .cat-label`).textContent);
  const shown=labels();click('#rv-lang-toggle');
  labels().forEach((label,index)=>assert.notEqual(label,shown[index]));
  click('#rv-lang-toggle');assert.deepEqual(labels(),shown);
  assert.equal(dialog.element.querySelector('[data-category="alquimia"]').disabled,true);
  assert.equal(dialog.element.querySelector('[data-category="herreria"]').disabled,false);
  click('[data-category="recoleccion"]');click('[data-gather="comida"]');
  click('#rv-btn-convert-plus');click('#rv-btn-convert-do');click('#rv-btn-convert-do');await flush();
  assert.equal(env.actor.items.find(it=>it.name==="Food Supplies").system.quantity,1999);
  const rations=env.actor.items.find(it=>it.flags?.[MODULE_ID]?.material==="Monster Rations");
  assert.equal(rations.system.quantity,1);assert.equal(rations.type,"consumable");assert.equal(rations.system.bulk,undefined);
  dialog.element.querySelector('.window-content').scrollTop=120;
  click('#rv-btn-back-gather');assert.equal(dialog.element.querySelector('.window-content').scrollTop,0);
  await dialog.close();
  game.user.isGM=false;env.actor.isOwner=false;
  api.open();assert.equal(env.dialogs.length,1);assert.match(env.notices.at(-1),/ownership/);
  env.actor.isOwner=true;game.user.isGM=true;
  assert.equal((hooks=>hooks[0](null,"/crafting"))(env.hooks.get("chatMessage")),true);
  dom.window.close();
});

test("forge success grants one item once; chat outage preserves the roll; close refunds an active attempt",async()=>{
  const dom=new JSDOM("<body></body>",{url:"http://localhost/"});
  const env=installEnvironment({window:dom.window,jquery:jquery(dom.window)});await env.seed();
  await import("../scripts/crafting-dialog.js?forge");await env.fire("init");await env.fire("ready");
  const api=game.modules.get(MODULE_ID).api;
  const recipe=item(env.actor,{name:"Longsword",type:"weapon",system:{quantity:50,price:{value:10,denomination:"gp"},rarity:"common"}});
  env.documents=new Map([[recipe.uuid,recipe]]);
  async function load(dialog) {
    dialog.element.querySelector('[data-category="herreria"]').click();
    const event=new dom.window.Event("drop",{bubbles:true,cancelable:true});
    event.dataTransfer={getData:()=>JSON.stringify({type:"Item",uuid:recipe.uuid})};
    dialog.element.querySelector("#rv-dropzone").dispatchEvent(event);await flush();
  }
  let dialog=api.open();await load(dialog);
  const mats=env.actor.items.find(it=>it.name==="Blacksmith Materials");const initial=mats.system.quantity;
  dialog.element.querySelector("#rv-btn-forge").click();dialog.element.querySelector("#rv-btn-forge").click();await flush();
  assert.equal(mats.system.quantity,initial-4);assert.equal(env.rollCount,1);
  await dialog.close();assert.equal(mats.system.quantity,initial);
  const originals={setInterval:globalThis.setInterval,clearInterval:globalThis.clearInterval,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout,performance:globalThis.performance};
  let time=0,id=0;const timers=new Map();
  globalThis.performance={now:()=>time};
  globalThis.setInterval=fn=>{timers.set(++id,{fn,interval:true});return id;};globalThis.clearInterval=key=>timers.delete(key);
  globalThis.setTimeout=fn=>{timers.set(++id,{fn,interval:false});return id;};globalThis.clearTimeout=key=>timers.delete(key);
  try {
    dialog=api.open();await load(dialog);env.failChat=true;
    dialog.element.querySelector("#rv-btn-forge").click();await flush();
    for(let i=0;i<3;i++) {
      time+=3300;for(const timer of [...timers.values()]) if(timer.interval)timer.fn();
      const unresolved=[...dialog.element.querySelectorAll(".rv-forge-icon")].find(el=>!el.classList.contains("hit") && !el.classList.contains("miss"));
      assert.ok(unresolved);unresolved.click();
      for(const [key,timer] of [...timers]) if(!timer.interval){timers.delete(key);timer.fn();}
      await flush();
    }
    await flush();
    const output=env.actor.items.filter(it=>it.name==="Longsword");assert.equal(output.length,1);assert.equal(output[0].system.quantity,1);
    assert.equal(dialog.element.querySelector(".rv-take-btn").disabled,true);
    assert.equal(env.rollCount,2);await dialog.close();assert.equal(mats.system.quantity,initial-4);
  } finally {Object.assign(globalThis,originals);dom.window.close();}
});
