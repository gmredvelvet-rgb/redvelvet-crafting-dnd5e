const actorLocks = new Set();
const clone = value => value === undefined ? undefined : structuredClone(value);
const read = (object, path) => path.split(".").reduce((value,key) => value?.[key],object);
// Foundry defines embedded collections (actor.items) as read-only, non-configurable properties, and a
// Proxy may not answer those with another value. Each proxy therefore wraps an empty stand-in that
// shares the document's prototype, and every trap reads from the real document.
const wrap = (target, get) => new Proxy(Object.create(Object.getPrototypeOf(target)), {
  get: (_,key) => get(target,key), has: (_,key) => key in target
});

/** Local, reversible inventory operations. Document methods are never patched globally. */
export class CraftingSession {
  constructor(actor, onError = console.error) {
    this.source = actor;
    this.key = actor.uuid ?? actor.id;
    this.onError = onError;
    this.journal = [];
    this.timers = new Map();
    this.items = new WeakMap();
    this.busy = false;
    this.closed = false;
    const self = this;
    const collection = wrap(actor.items, (target,key) => {
      if (key === "get") return id => self.item(target.get(id));
      if (key === "find") return predicate => self.item(target.find(item => predicate(self.item(item))));
      if (key === "filter") return predicate => target.filter(item => predicate(self.item(item))).map(item => self.item(item));
      const value = Reflect.get(target,key,target);
      return typeof value === "function" ? value.bind(target) : value;
    });
    this.actor = wrap(actor, (target,key) => {
      if (key === "items") return collection;
      if (key === "createEmbeddedDocuments") return async (type,data,options) => {
        const docs = await target.createEmbeddedDocuments(type,data,options);
        if (self.busy) self.journal.push(async () => target.deleteEmbeddedDocuments(type,docs.map(doc => doc.id)));
        return docs.map(doc => self.item(doc));
      };
      if (key === "setFlag" || key === "unsetFlag") return async (scope,flag,value) => {
        const old = clone(target.getFlag(scope,flag));
        const result = await target[key](scope,flag,value);
        if (self.busy) self.journal.push(() => old === undefined ? target.unsetFlag(scope,flag) : target.setFlag(scope,flag,old));
        return result;
      };
      const value = Reflect.get(target,key,target);
      return typeof value === "function" ? value.bind(target) : value;
    });
  }
  item(document) {
    if (!document || this.items.has(document)) return document && this.items.get(document);
    const self = this;
    const proxy = wrap(document, (target,key) => {
      if (key === "update") return async patch => {
        const previous = Object.fromEntries(Object.keys(patch).map(path => [path,clone(read(target,path))]));
        const result = await target.update(patch);
        if (self.busy) self.journal.push(async () => {
          const live = self.source.items.get(target.id);
          if (!live) throw new Error(`Cannot restore missing item ${target.name}`);
          const restore = {...previous};
          // Restore our delta without overwriting a concurrent inventory change.
          if ("system.quantity" in patch) restore["system.quantity"] = Number(live.system.quantity) + Number(previous["system.quantity"]) - Number(patch["system.quantity"]);
          await live.update(restore);
        });
        return result;
      };
      if (key === "delete") return async () => {
        const snapshot = target.toObject();
        const result = await target.delete();
        if (self.busy) self.journal.push(() => self.source.createEmbeddedDocuments("Item",[snapshot],{keepId:true}));
        return result;
      };
      const value = Reflect.get(target,key,target);
      return typeof value === "function" ? value.bind(target) : value;
    });
    this.items.set(document,proxy);
    return proxy;
  }
  action(callback, long=false) {
    const self = this;
    return function (...args) {
      if (self.closed || self.busy || actorLocks.has(self.key)) {args[0]?.preventDefault?.(); return;}
      self.busy = true;
      actorLocks.add(self.key);
      self.pending = (async () => {
        try {
          const result = await callback.apply(this,args);
          if (!self.closed && (!long || self.timers.size === 0)) self.commit();
          return result;
        } catch(error) { await self.fail(error); }
      })();
      return self.pending;
    };
  }
  async finalize(callback) {
    if (this.closed || !this.busy || this.finishing) return;
    this.finishing = true;
    this.pending = (async () => {
      try { await callback(); this.commit(); }
      catch(error) { await this.fail(error); }
      finally { this.finishing = false; }
    })();
    return this.pending;
  }
  commit() {
    this.journal.length = 0;
    this.busy = false;
    actorLocks.delete(this.key);
  }
  async rollback() {
    const failures = [];
    while (this.journal.length) {
      try { await this.journal.pop()(); } catch(error) { failures.push(error); }
    }
    this.busy = false;
    actorLocks.delete(this.key);
    return failures.length ? new AggregateError(failures,"Inventory restoration failed; GM review required") : null;
  }
  async fail(error) {
    this.clearTimers();
    const restoreError = await this.rollback();
    this.onError(restoreError ?? error);
  }
  interval(callback, ms) {
    if (this.closed) return null;
    const id = globalThis.setInterval(() => { if (!this.closed) callback(); },ms);
    this.timers.set(id,"interval");
    return id;
  }
  timeout(callback, ms) {
    if (this.closed) return null;
    const id = globalThis.setTimeout(() => {this.timers.delete(id); if (!this.closed) callback();},ms);
    this.timers.set(id,"timeout");
    return id;
  }
  clearInterval(id) {globalThis.clearInterval(id); this.timers.delete(id);}
  clearTimers() {
    for (const [id,type] of this.timers) type === "interval" ? globalThis.clearInterval(id) : globalThis.clearTimeout(id);
    this.timers.clear();
  }
  async close() {
    this.closed = true;
    this.clearTimers();
    await this.pending;
    const restoreError = await this.rollback();
    if (restoreError) this.onError(restoreError);
  }
}
