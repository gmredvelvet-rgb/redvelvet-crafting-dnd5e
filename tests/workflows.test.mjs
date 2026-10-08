import test from "node:test";
import assert from "node:assert/strict";
import {JSDOM} from "jsdom";
import jquery from "jquery";
import {installEnvironment} from "./fixture.mjs";
import {MODULE_ID} from "../scripts/assets.js";
const flush=()=>new Promise(resolve=>setImmediate(resolve));
async function setup(tag) {
  const dom=new JSDOM("<body></body>",{url:"http://localhost/"});const env=installEnvironment({window:dom.window,jquery:jquery(dom.window)});await env.seed();
  await import(`../scripts/crafting-dialog.js?${tag}`);await env.fire("init");await env.fire("ready");
  const app=game.modules.get(MODULE_ID).api.open();
  return {dom,env,app,click:selector=>app.element.querySelector(selector).click(),material:name=>env.actor.items.find(it=>it.flags?.[MODULE_ID]?.material===name || it.name===name)};
}
async function icons(app,run) {
  const originals={setInterval:globalThis.setInterval,clearInterval:globalThis.clearInterval,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout,performance:globalThis.performance};let time=0,id=0;const timers=new Map();
  globalThis.performance={now:()=>time};globalThis.setInterval=fn=>{timers.set(++id,{fn,interval:true});return id;};globalThis.clearInterval=key=>timers.delete(key);globalThis.setTimeout=fn=>{timers.set(++id,{fn,interval:false});return id;};globalThis.clearTimeout=key=>timers.delete(key);
  try {
    await run();await flush();
    for(let step=0;step<3;step++) {
      const button=[...app.element.querySelectorAll('.rv-forge-icon')].find(el=>!el.classList.contains('hit') && !el.classList.contains('miss'));assert.ok(button);
      for(let tick=0;tick<45;tick++) {time+=100;for(const timer of [...timers.values()])if(timer.interval)timer.fn();if(button.style.boxShadow && button.style.boxShadow!=="none")break;}
      button.click();assert.ok(button.classList.contains('hit'));
      time+=400;for(const [key,timer] of [...timers])if(!timer.interval){timers.delete(key);timer.fn();}await flush();
    }
    await flush();
  }finally {Object.assign(globalThis,originals);}
}
test("gathering consumes four monster parts and produces leather on three hits",async()=>{
  const f=await setup('gather');try {
    f.click('[data-category="recoleccion"]');f.click('[data-gather="piel-rec"]');
    const before=f.material('Monster Parts').system.quantity;const leather=f.material('Leatherwork Materials').system.quantity;
    await icons(f.app,()=>f.click('#rv-btn-gather-start'));
    assert.equal(f.material('Monster Parts').system.quantity,before-4);assert.ok(f.material('Leatherwork Materials').system.quantity>leather);
  }finally {await f.app.close();f.dom.window.close();}
});
test("building planks spends the correct materials and grants one piece",async()=>{
  const f=await setup('building');try {
    f.click('[data-category="construcciones"]');f.click('[data-build="tablas"]');
    const before=f.material('Wood').system.quantity;const planks=f.material('Planks').system.quantity;
    await icons(f.app,()=>f.click('#rv-btn-build-start'));
    assert.equal(f.material('Wood').system.quantity,before-3);assert.equal(f.material('Planks').system.quantity,planks+1);
  }finally {await f.app.close();f.dom.window.close();}
});
test("complete structure upgrade replaces the previous level only after success",async()=>{
  const f=await setup('structures');try {
    await f.env.actor.createEmbeddedDocuments('Item',[{name:'Warehouse Lvl 1',type:'loot',system:{quantity:1},flags:{[MODULE_ID]:{material:'Warehouse Lvl 1'}}}]);
    await f.env.actor.createEmbeddedDocuments('Item',['Floor Tile 10x10','Wall Section 10x10','Roof Section 10x10','Reinforced Door'].map(name=>({name,type:'loot',system:{quantity:100},flags:{[MODULE_ID]:{material:name}}})));
    f.click('[data-category="edificios"]');f.click('[data-struct="almacen"]');f.click('[data-lvl="2"]');
    await icons(f.app,()=>f.click('#rv-btn-struct-start'));
    assert.equal(f.material('Warehouse Lvl 1'),undefined);assert.equal(f.material('Warehouse Lvl 2').system.quantity,1);
  }finally {await f.app.close();f.dom.window.close();}
});
test("farm cycle persists between windows and harvests exactly once after five daily rolls",async()=>{
  let f=await setup('farming');try {
    await f.env.actor.createEmbeddedDocuments('Item',[{name:'Farm Plot',type:'loot',system:{quantity:1},flags:{[MODULE_ID]:{material:'Farm Plot'}}}]);
    f.click('[data-category="cultivos"]');f.click('#rv-btn-farm-start');await flush();
    assert.equal(f.env.actor.getFlag(MODULE_ID,'farmCycle').day,0);
    await f.app.close();f.app=game.modules.get(MODULE_ID).api.open();f.click=selector=>f.app.element.querySelector(selector).click();
    f.click('[data-category="cultivos"]');const before=f.material('Food Supplies').system.quantity;
    for(let day=0;day<5;day++) {f.click('#rv-btn-farm-daily');f.click('#rv-btn-farm-daily');await flush();}
    assert.equal(f.material('Food Supplies').system.quantity,before+75);assert.equal(f.env.actor.getFlag(MODULE_ID,'farmCycle'),undefined);
    f.click('#rv-btn-farm-daily');await flush();assert.equal(f.material('Food Supplies').system.quantity,before+75);
  }finally {await f.app.close();f.dom.window.close();}
});
test("scavenging applies the Monster Scavenger feat bonus exactly once per attempt",async()=>{
  const f=await setup('scavenging');try {
    await f.env.actor.createEmbeddedDocuments('Item',[{name:'Monster Scavenger',type:'feat',system:{}}]);f.click('[data-category="monstruos"]');
    const before=f.material('Monster Parts').system.quantity;await icons(f.app,()=>{f.click('#rv-btn-scav-start');f.click('#rv-btn-scav-start');});
    assert.equal(f.material('Monster Parts').system.quantity,before+30);
  }finally {await f.app.close();f.dom.window.close();}
});
test("salvage failure restores the destroyed last item rather than losing it",async()=>{
  const f=await setup('salvage');try {
    const [sword]=await f.env.actor.createEmbeddedDocuments('Item',[{name:'Longsword',type:'weapon',system:{quantity:1,price:{value:10,denomination:'gp'},rarity:'common'}}]);
    f.env.documents=new Map([[sword.uuid,sword]]);f.click('[data-category="reciclaje"]');
    const drop=new f.dom.window.Event('drop',{bubbles:true,cancelable:true});drop.dataTransfer={getData:()=>JSON.stringify({type:'Item',uuid:sword.uuid})};f.app.element.querySelector('#rv-salvage-dropzone').dispatchEvent(drop);await flush();
    f.env.actor.failUpdate=true;f.click('#rv-btn-salvage');await flush();
    assert.equal(f.env.actor.items.get(sword.id).system.quantity,1);
    assert.ok(f.env.notices.some(message=>String(message).includes('Attempt cancelled')));
  }finally {await f.app.close();f.dom.window.close();}
});
