/* Small helpers with no opinion about the game: randomness, arrays, timing. */

export const $ = s => document.querySelector(s);
export const R = n => Math.floor(Math.random() * n);
export const pick = a => a[R(a.length)];
export const rr = (a, b) => a + R(b - a + 1);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=R(i+1); [a[i],a[j]]=[a[j],a[i]]; } return a; }

export const mk = (id, lvl) => ({ id, lvl: lvl || 0 });
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII'];
