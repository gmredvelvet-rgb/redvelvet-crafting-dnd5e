export const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
export function priceGP(item) {
  const price = item.system?.price;
  const value = typeof price === "object" && price ? finite(price.value) * ({pp:10,gp:1,ep:.5,sp:.1,cp:.01}[String(price.denomination ?? "gp").toLowerCase()] ?? 1)
    : finite(price ?? item.system?.cost ?? item.system?.value);
  return Math.max(0, value);
}
export function batchCost(item, rarity) {
  return Math.max(1, Math.floor(priceGP(item) * ({common:.4,uncommon:.5,rare:.6}[rarity] ?? .5)));
}
export function degreeOfSuccess(total, dc, natural) {
  const degrees = ["critical_failure", "failure", "success", "critical_success"];
  let index = total >= dc + 10 ? 3 : total >= dc ? 2 : total <= dc - 10 ? 0 : 1;
  if (natural === 20) index = Math.min(3, index + 1);
  if (natural === 1) index = Math.max(0, index - 1);
  return degrees[index];
}
const TOOL_IDS = {herreria:["smith"],alquimia:["alchemist","herb"],joyeria:["jeweler"],"trabajo-con-piel":["leatherworker","weaver"],"equipo-vario":["tinker","carpenter"],construcciones:["carpenter","mason","smith","woodcarver"],edificios:["carpenter","mason","smith","woodcarver"]};
const TOOL_NAMES = {herreria:/smith|blacksmith|herrero|herrer|forja/i,alquimia:/alchemist|alquim|herbalism|herbor|herbol/i,
  joyeria:/jeweler|jeweller|joyer/i,"trabajo-con-piel":/leatherwork|curtidor|cuero|weaver|tejedor/i,"equipo-vario":/tinker|carpenter|carpinter|artesano/i,
  construcciones:/carpenter|carpinter|mason|albanil|smith|herrero|herrer|woodcarv|tallador/i,edificios:/carpenter|carpinter|mason|albanil|smith|herrero|herrer|woodcarv|tallador/i};
export function toolsFor(actor, category) {
  return actor.items.filter(item => {
    if (finite(item.system?.quantity,1) <= 0) return false;
    const base = item.system?.type?.baseItem ?? item.system?.baseItem;
    const name = String(item.name ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return ["tool","equipment","loot"].includes(item.type) && (TOOL_IDS[category]?.includes(base) || TOOL_NAMES[category]?.test(name));
  });
}
export function craftingModifier(actor, category) {
  const int = finite(actor.system?.abilities?.int?.mod);
  const tool = toolsFor(actor, category)[0];
  const id = tool?.system?.type?.baseItem ?? tool?.system?.baseItem;
  const prepared = id && actor.system?.tools?.[id];
  if (prepared?.total != null && Number.isFinite(Number(prepared.total))) return {mod: Number(prepared.total),rank:1,label:tool.name};
  const ability = tool?.system?.ability || globalThis.CONFIG?.DND5E?.tools?.[id]?.ability || "int";
  const abilityMod = finite(actor.system?.abilities?.[ability]?.mod,int);
  const proficiency = finite(prepared?.value ?? tool?.system?.proficient);
  return {mod:abilityMod + Math.floor(finite(actor.system?.attributes?.prof) * proficiency),rank:1,label:tool?.name ?? "INT"};
}
export function craftedItemData(item) {
  const data = structuredClone(item.toObject());
  delete data._id;
  delete data.folder;
  delete data.ownership;
  data.system ??= {};
  data.system.quantity = 1;
  if ("equipped" in data.system) data.system.equipped = false;
  if ("attuned" in data.system) data.system.attuned = false;
  return data;
}
export const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
