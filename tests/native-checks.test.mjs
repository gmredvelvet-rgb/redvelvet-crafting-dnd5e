import test from "node:test";
import assert from "node:assert/strict";
import {JSDOM} from "jsdom";
import jquery from "jquery";
import {actor,installEnvironment} from "./fixture.mjs";
import {MODULE_ID} from "../scripts/assets.js";
import {craftingModifier,requiredTools,toolId,toolsFor,rollCheck,publishCheck,naturalD20,degreeOfSuccess,RollCancelledError} from "../scripts/dnd5e-adapter.js";
const flush=()=>new Promise(resolve=>setImmediate(resolve));

test("recipes distinguish every supported artisan profession and do not use inventory order",async()=>{
  const a=actor();
  await a.createEmbeddedDocuments("Item",["smith","mason","carpenter","glassblower","weaver"].map(id=>({name:id,type:"tool",system:{quantity:1,type:{baseItem:id}}})));
  assert.equal(craftingModifier(a,"construcciones",{piece:"tablas"}).tool,"carpenter");
  assert.equal(craftingModifier(a,"construcciones",{piece:"pared"}).tool,"mason");
  assert.equal(craftingModifier(a,"construcciones",{piece:"ventana"}).tool,"glassblower");
  for(const [category,name,id] of [
    ["herreria","Longsword","smith"],["herreria","Longbow","woodcarver"],
    ["alquimia","Potion of Healing","herb"],["alquimia","Poison","pois"],
    ["alquimia","Rations","cook"],["alquimia","Beer","brewer"],
    ["joyeria","Gold Ring","jeweler"],["trabajo-con-piel","Cloak","weaver"],
    ["trabajo-con-piel","Leather Armor","leatherworker"],["trabajo-con-piel","Boots","cobbler"],
    ["equipo-vario","Map","cartographer"],["equipo-vario","Book","calligrapher"],
    ["equipo-vario","Portrait","painter"],["equipo-vario","Clay pot","potter"],
    ["equipo-vario","Glass bottle","glassblower"],["equipo-vario","Rope","weaver"],
    ["equipo-vario","Chest","carpenter"],["equipo-vario","Mechanical kit","tinker"]
  ]) assert.equal(requiredTools(category,{item:{name,system:{}}})[0],id,name);
  assert.deepEqual(requiredTools("edificios",{structure:"paracaidas"}),["weaver","leatherworker"]);
  assert.deepEqual(requiredTools("edificios",{structure:"arnes"}),["leatherworker"]);
});
test("canonical IDs win over misleading names; localized legacy names retain tool proficiency",async()=>{
  assert.equal(toolId({name:"Smith's Tools",system:{type:{baseItem:"carpenter"}}}),"carpenter");
  assert.equal(toolId({name:"Herramientas de albañil",system:{}}),"mason");
  const a=actor();await a.createEmbeddedDocuments("Item",[{name:"Herramientas de herrero",type:"tool",system:{quantity:1}}]);
  assert.equal(craftingModifier(a,"herreria").mod,7);
  assert.equal(craftingModifier(a,"herreria").tool,"smith");
});
test("native tool check receives the real item and bonuses, returns the system total unchanged",async()=>{
  const a=actor();const [item]=await a.createEmbeddedDocuments("Item",[{name:"Smith's Tools",type:"tool",system:{quantity:1,type:{baseItem:"smith"},ability:"str",bonus:"1d4",proficient:2}}]);
  const returned={total:31,data:{abilityId:"dex"},options:{},dice:[{faces:4,results:[{result:4}]},{faces:20,results:[{result:1,discarded:true,active:false},{result:20,active:true}]}]};
  let calls=0;a.rollToolCheck=async(config,dialog,message)=>{
    calls++;assert.equal(config.tool,"smith");assert.equal(config.item,item);assert.equal(config.bonus,"1d4");assert.equal(config.ability,"str");
    assert.equal(dialog.configure,true);assert.equal(message.create,false);return [returned];
  };
  const roll=await rollCheck(a,craftingModifier(a,"herreria"));
  assert.equal(roll,returned);assert.equal(roll.total,31);assert.equal(calls,1);assert.equal(naturalD20(roll),20);
  assert.equal(roll.options.redvelvetCheck.ability,"dex");
  let chatCount=0;roll.toMessage=async message=>{chatCount++;assert.equal(message.flags.dnd5e.roll.toolId,"smith");assert.equal(message.flags.dnd5e.roll.ability,"dex");throw Error("offline");};
  await publishCheck(roll,{flavor:"Craft"});assert.equal(calls,1);assert.equal(chatCount,1);
  assert.doesNotThrow(()=>JSON.stringify(roll.options));
});
test("skill rolls use native skill IDs and accept a single legacy Roll result",async()=>{
  const a=actor();const roll={total:27,options:{},dice:[]};
  a.rollSkill=async config=>{assert.equal(config.skill,"nat");return roll;};
  assert.equal(await rollCheck(a,{skill:"nat"}),roll);
});
test("advantage, disadvantage and rerolls use the kept d20, ignoring bonus dice",()=>{
  for(const results of [
    [{result:1,discarded:true},{result:20,active:true}],
    [{result:20,discarded:true},{result:1,active:true}],
    [{result:1,rerolled:true},{result:13,active:true}]
  ]) {
    const kept=results[1].result;
    const roll={dice:[{faces:4,results:[{result:4}]},{faces:20,results}]};
    assert.equal(naturalD20(roll),kept);
    assert.equal(degreeOfSuccess(15,15,naturalD20(roll)),kept===20 ? "critical_success" : kept===1 ? "failure" : "success");
  }
});
test("a cancelled or rejected native roll is never replaced by a generic roll",async()=>{
  const a=actor();let calls=0;a.rollSkill=async()=>{calls++;return null;};
  await assert.rejects(rollCheck(a,{skill:"sur"}),RollCancelledError);assert.equal(calls,1);
  a.rollSkill=async()=>{calls++;throw Error("system error");};
  await assert.rejects(rollCheck(a,{skill:"sur"}),/system error/);assert.equal(calls,2);
});
async function setup(tag,generation=14) {
  const dom=new JSDOM("<body></body>",{url:"http://localhost/"});const env=installEnvironment({window:dom.window,jquery:jquery(dom.window),generation});await env.seed();
  await import(`../scripts/crafting-dialog.js?checks=${tag}`);await env.fire("init");await env.fire("ready");
  const app=game.modules.get(MODULE_ID).api.open();
  return {dom,env,app,click:selector=>app.element.querySelector(selector).click()};
}
for(const generation of [13,14]) test(`v${generation}: cancelling the native carpenter check refunds materials and restores the recipe for retry`,async()=>{
  const f=await setup(`cancel${generation}`,generation);try {
    f.click('[data-category="construcciones"]');f.click('[data-build="tablas"]');
    f.env.cancelCheck=true;const wood=f.env.actor.items.find(it=>it.name==="Wood");const before=wood.system.quantity;
    f.click('#rv-btn-build-start');await flush();await flush();
    assert.equal(wood.system.quantity,before);assert.equal(f.env.rollCount,0);
    assert.equal(f.env.nativeChecks.length,1);assert.equal(f.env.nativeChecks[0].config.tool,"carpenter");
    assert.equal(f.app.element.isConnected,true);assert.match(f.env.notices.at(-1),/materiales devueltos/);
    f.env.cancelCheck=false;f.click('#rv-btn-build-start');await flush();
    assert.equal(f.env.nativeChecks.length,2);assert.equal(f.env.rollCount,1);
    await f.app.close();assert.equal(wood.system.quantity,before);
  }finally {await f.env.dialogs.at(-1).close();f.dom.window.close();}
});
test("UI tool selection uses the chosen tool and its displayed modifier",async()=>{
  const f=await setup("picker");try {
    f.env.actor.system.tools.carpenter={total:9,value:2,ability:"str"};
    f.env.actor.system.tools.mason={total:5,value:1,ability:"str"};
    f.click('[data-category="construcciones"]');f.click('[data-build="piso"]');
    const select=f.app.element.querySelector('[aria-label="Herramienta de fabricación"]');
    assert.equal(select.options.length,2);
    select.value=f.env.actor.items.find(it=>it.system.type?.baseItem==="mason").id;
    select.dispatchEvent(new f.dom.window.Event("change",{bubbles:true}));
    assert.match(f.app.element.querySelector('#rv-build-stats').textContent,/Crafting \+5 \(mason tools\)/);
    f.click('#rv-btn-build-start');await flush();assert.equal(f.env.nativeChecks[0].config.tool,"mason");
  }finally {await f.app.close();f.dom.window.close();}
});
test("wrong or depleted tools never reserve materials or start a native check",async()=>{
  const f=await setup("missing");try {
    f.click('[data-category="construcciones"]');f.click('[data-build="ventana"]');
    const material=f.env.actor.items.find(it=>it.name==="Construction Materials");const before=material.system.quantity;
    f.click('#rv-btn-build-start');await flush();assert.equal(material.system.quantity,before);assert.equal(f.env.nativeChecks.length,0);
    f.click('[data-build="tablas"]');const tool=f.env.actor.items.find(it=>it.system.type?.baseItem==="carpenter");await tool.update({"system.quantity":0});
    f.click('#rv-btn-build-start');await flush();assert.equal(material.system.quantity,before);assert.equal(f.env.nativeChecks.length,0);
  }finally {await f.app.close();f.dom.window.close();}
});

test("crafting materials and generic artisan tools do not impersonate a profession",async()=>{
  const a=actor();await a.createEmbeddedDocuments("Item",[
    {name:"Blacksmith Materials",type:"loot",system:{quantity:2000}},
    {name:"Alchemy Materials",type:"loot",system:{quantity:2000}},
    {name:"Crafting Tools",type:"tool",system:{quantity:1}}
  ]);
  assert.equal(toolsFor(a,"herreria").length,0);assert.equal(toolsFor(a,"alquimia").length,0);
  assert.equal(craftingModifier(a,"herreria").tool,undefined);
});
