import test from "node:test";
import assert from "node:assert/strict";
import {priceGP,batchCost,degreeOfSuccess,toolsFor,craftingModifier,craftedItemData,escapeHTML} from "../scripts/dnd5e-adapter.js";
import {CraftingSession} from "../scripts/session.js";
import {actor} from "./fixture.mjs";

test("native D&D currency denominations, legacy values and invalid prices",()=>{
  for(const [denomination,value] of Object.entries({pp:10,gp:1,ep:.5,sp:.1,cp:.01})) assert.equal(priceGP({system:{price:{value:10,denomination}}}),10*value);
  assert.equal(priceGP({system:{price:100}}),100);
  assert.equal(priceGP({system:{price:{value:"invalid"}}}),0);
  assert.equal(priceGP({system:{price:-100}}),0);
  assert.equal(batchCost({system:{price:100}},"rare"),60);
});
test("natural dice adjust exactly one degree, including exceptional modifiers",()=>{
  assert.equal(degreeOfSuccess(15,15,10),"success");
  assert.equal(degreeOfSuccess(5,15,20),"failure");
  assert.equal(degreeOfSuccess(30,15,1),"success");
  assert.equal(degreeOfSuccess(14,15,1),"critical_failure");
});
test("specific tool IDs and Spanish names unlock only their profession",async()=>{
  const a=actor();
  await a.createEmbeddedDocuments("Item",[{name:"Herramientas de herrero",type:"tool",system:{quantity:1,type:{baseItem:"smith"}}}]);
  assert.equal(toolsFor(a,"herreria").length,1);
  assert.equal(toolsFor(a,"alquimia").length,0);
  assert.equal(craftingModifier(a,"herreria").mod,7);
  await a.items.find(()=>true).update({"system.quantity":0});
  assert.equal(toolsFor(a,"herreria").length,0);
});
test("crafted stacks produce one unequipped unit without duplicate ID",async()=>{
  const a=actor();const [it]=await a.createEmbeddedDocuments("Item",[{name:"Sword",type:"weapon",system:{quantity:99,equipped:true}}]);
  const data=craftedItemData(it);
  assert.equal(data._id,undefined);assert.equal(data.system.quantity,1);assert.equal(data.system.equipped,false);assert.equal(it.system.quantity,99);
  assert.equal(escapeHTML('<img onerror="x">'),"&lt;img onerror=&quot;x&quot;&gt;");
});
test("action lock prevents double spending before first await",async()=>{
  const a=actor();const [it]=await a.createEmbeddedDocuments("Item",[{name:"Wood",type:"loot",system:{quantity:10}}]);
  const s=new CraftingSession(a);let attempts=0;
  const run=s.action(async()=>{attempts++;await s.actor.items.get(it.id).update({"system.quantity":7});});
  await Promise.all([run(),run()]);assert.equal(attempts,1);assert.equal(it.system.quantity,7);await s.close();assert.equal(it.system.quantity,7);
});
test("closing active minigame restores materials and clears every timer",async()=>{
  const a=actor();const [it]=await a.createEmbeddedDocuments("Item",[{name:"Wood",type:"loot",system:{quantity:10}}]);
  const s=new CraftingSession(a);let ticks=0;
  await s.action(async()=>{await s.actor.items.get(it.id).update({"system.quantity":7});s.interval(()=>ticks++,10);s.timeout(()=>ticks++,20);},true)();
  await s.close();assert.equal(it.system.quantity,10);assert.equal(s.timers.size,0);assert.equal(ticks,0);
});
test("reward failure rolls back all inputs and previous partial refunds",async()=>{
  const a=actor();const [it]=await a.createEmbeddedDocuments("Item",[{name:"Wood",type:"loot",system:{quantity:10}}]);const errors=[];
  const s=new CraftingSession(a,error=>errors.push(error));
  await s.action(async()=>{const material=s.actor.items.get(it.id);await material.update({"system.quantity":4});await material.update({"system.quantity":6});a.failCreate=true;await s.actor.createEmbeddedDocuments("Item",[{name:"Product",type:"loot",system:{quantity:1}}]);})();
  assert.equal(it.system.quantity,10);assert.equal(errors.length,1);
});
test("flags and deleted stacks are restored on cancellation",async()=>{
  const a=actor();const [it]=await a.createEmbeddedDocuments("Item",[{name:"Old Structure",type:"loot",system:{quantity:1}}]);
  const s=new CraftingSession(a,()=>{});
  await s.action(async()=>{await s.actor.items.get(it.id).delete();await s.actor.setFlag("crafting","cycle",{day:1});throw Error("cancel");})();
  assert.equal(a.items.get(it.id).name,"Old Structure");assert.equal(a.getFlag("crafting","cycle"),undefined);
});
test("close during a pending inventory write waits then refunds",async()=>{
  const a=actor();const [it]=await a.createEmbeddedDocuments("Item",[{name:"Wood",type:"loot",system:{quantity:10}}]);
  const update=it.update;let release;const wait=new Promise(resolve=>release=resolve);
  it.update=async patch=>{await wait;return update(patch);};
  const s=new CraftingSession(a);const active=s.action(async()=>{await s.actor.items.get(it.id).update({"system.quantity":7});s.timeout(()=>{},100);},true)();
  const closing=s.close();release();await Promise.all([active,closing]);assert.equal(it.system.quantity,10);
});
