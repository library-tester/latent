/* Saving is silently optional: without a host `storage` the game just forgets. */

import { G } from './state.js';

/* ── persistence (silently optional) ─────────────────────────── */
export async function save(){ try{ if(window.storage && G) await window.storage.set('latent:run', JSON.stringify(G)); }catch(e){} }
export async function clearRun(){ try{ if(window.storage) await window.storage.delete('latent:run'); }catch(e){} }
export async function loadRun(){ try{ if(!window.storage) return null; const r = await window.storage.get('latent:run'); return r && r.value ? JSON.parse(r.value) : null; }catch(e){ return null; } }
export async function best(v){ try{ if(!window.storage) return 0; if(v!==undefined){ await window.storage.set('latent:best', String(v)); return v; } const r = await window.storage.get('latent:best'); return r ? +r.value : 0; }catch(e){ return 0; } }
