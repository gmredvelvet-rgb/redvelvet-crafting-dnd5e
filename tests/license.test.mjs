import test from "node:test";
import assert from "node:assert/strict";
import {JSDOM} from "jsdom";
import jquery from "jquery";
import {installEnvironment} from "./fixture.mjs";
import {MODULE_ID} from "../scripts/assets.js";
import LicenseClient from "../scripts/license/license.js";
import LicenseUI from "../scripts/license/license-ui.js";
import {localize} from "../scripts/license/constants.js";
test("soft gate registers with active hub without opening its own prompt",async()=>{
  const dom=new JSDOM("<body></body>",{url:"http://localhost"});
  const env=installEnvironment({window:dom.window,jquery:jquery(dom.window)});
  const registered=[];game.modules.set("velvet-license-hub",{active:true,api:{apiVersion:1,register:id=>registered.push(id)}});
  await import("../scripts/license/boot.js?hub");await env.fire("init");await env.fire("ready");
  assert.deepEqual(registered,[MODULE_ID]);assert.equal(dom.window.document.querySelector('.vne-crf5e-license-card'),null);dom.window.close();
});
test("auth server outage leaves crafting callable and does not deny inventory access",async()=>{
  const dom=new JSDOM("<body></body>",{url:"http://localhost"});const env=installEnvironment({window:dom.window,jquery:jquery(dom.window)});
  const original=LicenseClient.prototype.initialize;LicenseClient.prototype.initialize=async()=>{throw Error("auth server offline");};
  try {
    await import("../scripts/crafting-dialog.js?license-outage");await import("../scripts/license/boot.js?outage");await env.fire("init");await env.fire("ready");
    const app=game.modules.get(MODULE_ID).api.open();assert.ok(app.element.querySelector('#rv-crafting-root'));await app.close();
  }finally {LicenseClient.prototype.initialize=original;LicenseUI.stopReminder();dom.window.close();}
});
test("localization uses the correct interpolation API on both generations",()=>{
  globalThis.game={release:{generation:13},i18n:{format:(key,data)=>`v13:${data.value}`,localize:(key,data)=>`v14:${data?.value}`}};
  assert.equal(localize("key",{value:5}),"v13:5");game.release.generation=14;assert.equal(localize("key",{value:7}),"v14:7");
});
