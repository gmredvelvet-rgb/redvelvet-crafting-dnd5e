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
// Canonical D&D5e IDs, shared by the 4.4/5 and 6 system series.
const TOOL_IDS = {
  herreria:["smith","woodcarver","carpenter"], alquimia:["alchemist","herb","pois","cook","brewer"],
  joyeria:["jeweler"], "trabajo-con-piel":["leatherworker","weaver","cobbler"],
  "equipo-vario":["tinker","carpenter","woodcarver","calligrapher","cartographer","painter","potter","glassblower","cobbler","weaver","leatherworker","smith"],
  construcciones:["carpenter","mason","smith","woodcarver","glassblower","alchemist","weaver"],
  edificios:["carpenter","mason","smith","tinker","weaver","leatherworker"]
};
const TOOL_NAMES = {
  smith:/smith|blacksmith|herrero|herrer|forja/i, carpenter:/carpenter|carpinter/i,
  woodcarver:/woodcarv|tallador|talla de madera/i, mason:/mason|albanil|canter/i,
  alchemist:/alchemist|alquim/i, herb:/herbalism|herbor|herbol/i,
  pois:/poisoner|envenenador/i, jeweler:/jeweler|jeweller|joyer/i,
  leatherworker:/leatherwork|curtidor|peleter/i, weaver:/weaver|tejedor/i,
  cobbler:/cobbler|zapater/i, tinker:/tinker|manitas|hojalater/i,
  cook:/cook|cocinero/i, brewer:/brewer|cervecer/i,
  calligrapher:/calligrapher|caligraf/i, cartographer:/cartographer|cartograf/i,
  painter:/painter|pintor/i, potter:/potter|alfarer/i, glassblower:/glassblow|soplador.*vidrio|vidriero/i
};
const normal = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
export function toolId(item) {
  const id = item.system?.type?.baseItem ?? item.system?.baseItem;
  if (id) return id; // A native ID takes precedence over a renamed item's display name.
  const name = normal(item.name);
  // Legacy loot/equipment tools need an explicit tool label. Crafting materials
  // (e.g. "Blacksmith Materials") must never grant access to an artisan check.
  if (item.type !== "tool" && !/tool|suppl|kit|herramient|utensil|suministr/.test(name)) return undefined;
  return Object.keys(TOOL_NAMES).find(key => TOOL_NAMES[key].test(name));
}
export function requiredTools(category, {piece, structure, item} = {}) {
  if (piece) return ({tablas:["carpenter","woodcarver"],carbon:["alchemist","woodcarver","carpenter"],
    piso:["carpenter","mason"],pared:["mason","carpenter"],techo:["carpenter","weaver"],
    puerta:["carpenter","smith"],ventana:["glassblower"],"mesa-trabajo":["carpenter","smith"],
    muebles:["carpenter","woodcarver"],escaleras:["carpenter","mason"]})[piece] ?? [];
  if (structure) {
    if (["scorpion","catapulta","arpon","jaula"].includes(structure)) return ["smith","tinker"];
    if (["ala-delta","paracaidas"].includes(structure)) return ["weaver","leatherworker"];
    if (structure === "arnes") return ["leatherworker"];
    if (["empalizada","barricada","carreta","puente","escalera","grua","ascensor","puesto","corral"].includes(structure)) return ["carpenter"];
    return ["mason","carpenter"];
  }
  if (item) {
    const name = normal(item.name);
    const subtype = item.system?.type?.value ?? item.system?.consumableType ?? "";
    if (category === "herreria") {
      if (/bow|staff|club|arco|baston|garrote/.test(name)) return ["woodcarver","carpenter"];
      return ["smith"];
    }
    if (category === "alquimia") {
      if (subtype === "food" || /ration|food|meal|bread|racion|comida|pan\b/.test(name)) return ["cook"];
      if (/ale\b|beer|wine|cerveza|vino/.test(name)) return ["brewer"];
      if (subtype === "poison" || /poison|veneno/.test(name)) return ["pois","alchemist"];
      if (/healing|curacion/.test(name)) return ["herb","alchemist"];
      return ["alchemist"];
    }
    if (category === "trabajo-con-piel") {
      if (/boot|shoe|sandal|bota|zapato/.test(name)) return ["cobbler","leatherworker"];
      if (/cloth|robe|cloak|padded|ropa|tunica|capa|acolchad/.test(name)) return ["weaver"];
      return ["leatherworker"];
    }
    if (category === "equipo-vario") {
      if (/map|chart|mapa/.test(name)) return ["cartographer"];
      if (/scroll|book|ink|pergamino|libro|tinta/.test(name)) return ["calligrapher"];
      if (/paint|portrait|pintura|retrato/.test(name)) return ["painter"];
      if (/pottery|clay|ceramic|arcilla|ceramic/.test(name)) return ["potter"];
      if (/glass|bottle|vidrio|botella/.test(name)) return ["glassblower"];
      if (/rope|net|cuerda|red\b/.test(name)) return ["weaver"];
      if (/wood|chest|furniture|madera|cofre|mueble/.test(name)) return ["carpenter","woodcarver"];
      return ["tinker"];
    }
  }
  return TOOL_IDS[category] ?? [];
}
export function toolsFor(actor, category, context = {}) {
  const ids = requiredTools(category,context);
  return actor.items.filter(item => finite(item.system?.quantity,1) > 0
    && ["tool","equipment","loot"].includes(item.type) && ids.includes(toolId(item)));
}
export function craftingModifier(actor, category, context = {}, selectedId) {
  const ids = requiredTools(category,context);
  const candidates = toolsFor(actor,category,context);
  const tool = candidates.find(item => item.id === selectedId)
    ?? candidates.sort((a,b) => ids.indexOf(toolId(a)) - ids.indexOf(toolId(b)))[0];
  const id = tool && toolId(tool);
  const prepared = id && actor.system?.tools?.[id];
  const ability = tool?.system?.ability || prepared?.ability || globalThis.CONFIG?.DND5E?.tools?.[id]?.ability || "int";
  const proficiency = finite(prepared?.value ?? tool?.system?.proficient);
  const mod = prepared?.total != null && Number.isFinite(Number(prepared.total)) ? Number(prepared.total)
    : finite(actor.system?.abilities?.[ability]?.mod) + Math.floor(finite(actor.system?.attributes?.prof) * proficiency);
  return {mod,rank:1,label:tool?.name ?? (ids.join(" / ") || "INT"),tool:id,item:tool,ability,candidates,required:ids.length > 0};
}
export class RollCancelledError extends Error {
  constructor() { super("Check cancelled"); this.name = "RollCancelledError"; }
}
/** Use the system's own builder and hooks; never replace a cancelled/failed check with a new roll. */
export async function rollCheck(actor, check) {
  if (check.required && !check.tool) throw new Error(`Missing crafting tool: ${check.label}`);
  const config = check.skill ? {skill:check.skill} : check.tool
    ? {tool:check.tool,item:check.item,ability:check.ability,bonus:check.item?.system?.bonus || undefined,prof:check.item?.system?.prof}
    : {ability:check.ability ?? "int"};
  const method = check.skill ? actor.rollSkill : check.tool ? actor.rollToolCheck
    : actor.rollAbilityCheck ?? actor.rollAbilityTest;
  if (typeof method !== "function") throw new Error("Native D&D5e check API unavailable");
  const result = await method.call(actor,config,{configure:true},{create:false});
  const roll = Array.isArray(result) ? result[0] : result;
  if (!roll) throw new RollCancelledError();
  if (!Number.isFinite(roll.total)) throw new Error("Invalid native D&D5e check result");
  // Keep the system metadata when publishing our flavored message separately.
  roll.options ??= {};
  roll.options.redvelvetCheck = {skill:config.skill,tool:config.tool,ability:roll.data?.abilityId ?? roll.options?.ability ?? config.ability};
  return roll;
}
export function naturalD20(roll) {
  const die = roll.dice?.find(die => die.faces === 20);
  const result = die?.results?.find(result => result.active !== false && !result.discarded && !result.rerolled);
  return result?.result ?? 10;
}
export async function publishCheck(roll, data) {
  const check = roll.options?.redvelvetCheck ?? {};
  const type = check.skill ? "skill" : check.tool ? "tool" : "ability";
  await roll.toMessage({...data,flags:{dnd5e:{messageType:"roll",roll:{type,skillId:check.skill,toolId:check.tool,ability:check.ability}}},
    ...(Number(String(globalThis.game?.system?.version ?? "4").split(".")[0]) >= 6
      ? {type:"check",system:{ability:check.ability,skill:check.skill,tool:check.tool}} : {})
  }).catch(error => console.warn("redvelvet-crafting-dnd5e","Chat unavailable",error));
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
