/* Stroked 24x24 card glyphs and the intent icons drawn above enemies. */

/* ── card art glyphs (24×24, stroked) ─────────────────────────── */
export const GLY = {
flame:'<path d="M12 3c3 4 5 5.5 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 .4 1.4 1 2 1.8 2.2C10.4 8 11 5.6 12 3z"/>',
shield:'<path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z"/>',
sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/>',
twin:'<path d="M4 19L15 5M9 19L20 5M5 6l2-2M17 20l2-2"/>',
pin:'<path d="M12 3v9M12 21v-3M8 12h8l-1 3H9z"/><circle cx="12" cy="3" r="1.6"/>',
eye:'<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.6"/>',
drop:'<path d="M12 3c4 5 6 7 6 10a6 6 0 0 1-12 0c0-3 2-5 6-10z"/>',
fog:'<path d="M3 9h13M6 13h15M3 17h12"/>',
bolt:'<path d="M13 2L5 13h6l-2 9 9-12h-6z"/>',
swarm:'<path d="M6 8l3 3-3 3M13 5l3 3-3 3M11 14l3 3-3 3"/>',
cards:'<rect x="4" y="6" width="11" height="14" rx="1"/><path d="M8 4h9a2 2 0 0 1 2 2v11"/>',
up:'<path d="M12 20V6M6 12l6-6 6 6"/>',
burst:'<path d="M12 2v5M12 17v5M2 12h5M17 12h5M5 5l3.5 3.5M15.5 15.5L19 19M19 5l-3.5 3.5M8.5 15.5L5 19"/><circle cx="12" cy="12" r="2.4"/>',
lens:'<circle cx="12" cy="12" r="9"/><path d="M12 3l5 8h-10zM21 12l-5 8-5-8"/>',
moth:'<path d="M12 8c-2-4-7-5-9-2s1 8 5 9c2 .5 4-.5 4-2zM12 8c2-4 7-5 9-2s-1 8-5 9c-2 .5-4-.5-4-2z"/><path d="M12 8v10M11 5l-1-2M13 5l1-2"/>',
clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
skull:'<path d="M6 11a6 6 0 1 1 12 0v4l-2 2v3H8v-3l-2-2z"/><circle cx="9.5" cy="11" r="1.4"/><circle cx="14.5" cy="11" r="1.4"/>',
hand:'<path d="M8 12V5a1.6 1.6 0 0 1 3.2 0v6M11.2 11V4a1.6 1.6 0 0 1 3.2 0v7M14.4 11V6a1.6 1.6 0 0 1 3.2 0v9a6 6 0 0 1-6 6h-1a5 5 0 0 1-5-5v-4l1.6-1.5z"/>',
vial:'<path d="M9 3h6M10.5 3v7L6 19a2 2 0 0 0 1.8 3h8.4A2 2 0 0 0 18 19l-4.5-9V3"/><path d="M8 15h8"/>',
key:'<circle cx="7" cy="12" r="4"/><path d="M11 12h10M18 12v4M15 12v3"/>',
plate:'<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M7 8h10M7 12h6"/>',
spool:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.4"/><path d="M12 3.5v3.6M12 16.9v3.6M3.5 12h3.6M16.9 12h3.6"/>',
blade:'<path d="M3 21l7.5-7.5M10.5 13.5l7.6-7.6a2.9 2.9 0 0 0-4.1-4.1L6.4 9.4z"/><path d="M6.4 9.4l4.1 4.1"/>',
anvil:'<path d="M3 7H18L21.5 9 16.5 11H13v4h5v4.5H6V15h3v-4H3Z"/>',
ingot:'<path d="M3.5 17.5l3-8h11l3 8z"/><path d="M6.5 9.5h11M8 13.5h8"/>',
wave:'<path d="M3 20a9.5 9.5 0 0 1 18 0M6.5 20a6 6 0 0 1 11 0M10 20a2.5 2.5 0 0 1 4 0"/>',
heart:'<path d="M12 20.5S4.5 15.6 4.5 10.4A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7.5 2.4c0 5.2-7.5 10.1-7.5 10.1z"/>',
crack:'<path d="M13.5 2L8 10.5h5L9 22M13.5 2l4.5 8.5h-4"/>',
};
export const glyph = (k, cls='') => `<svg class="${cls}" viewBox="0 0 24 24">${GLY[k]||GLY.plate}</svg>`;

/* ── intent icons ─────────────────────────────────────────────── */
export const IC = {
atk:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 20L18 6M14 4h6v6"/><path d="M4 20l3-1 1-3"/></svg>',
def:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z"/></svg>',
buff:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 20V6M6 12l6-6 6 6"/></svg>',
deb:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 4v14M6 12l6 6 6-6"/></svg>',
};
