/* Specimen plates: one 100x100 drawing per enemy, keyed by its `art` field. */

/* ── specimen plates (enemy art, 0 0 100 100) ─────────────────── */
export const ART = {
fish:`<g fill="var(--chalk)"><path d="M14 58q14-16 34-16t34 12q-12 12-34 12T14 58z"/>
<path d="M82 54q9-4 14-9-2 8-4 13z"/></g>
<g stroke="var(--plate0)" stroke-width="2" fill="none"><path d="M34 46v22M46 43v25M58 43v24M70 46v20"/></g>
<g stroke="var(--chalk)" stroke-width="2.2" fill="none" stroke-linecap="round">
<path d="M20 56q-8-8-14-9M20 60q-9 3-15 2M28 68l-4 12M42 70l-2 13M56 70l1 13M70 66l5 11"/></g>
<circle cx="24" cy="55" r="2.4" fill="var(--plate0)"/>`,

moth:`<g fill="var(--chalk)"><path d="M50 44Q34 20 18 24 6 27 8 42q2 15 24 20 14 3 18-4z"/>
<path d="M50 44Q66 20 82 24 94 27 92 42q-2 15-24 20-14 3-18-4z"/>
<path d="M50 30q5 5 5 15t-5 31q-5-21-5-31t5-15z"/><circle cx="50" cy="29" r="5"/></g>
<g fill="var(--plate0)"><circle cx="27" cy="38" r="4.6"/><circle cx="73" cy="38" r="4.6"/>
<circle cx="48" cy="28" r="1.2"/><circle cx="52" cy="28" r="1.2"/></g>
<g stroke="var(--plate0)" stroke-width="1.6" fill="none"><path d="M20 45q14 6 27 3M80 45q-14 6-27 3"/></g>
<g stroke="var(--chalk)" stroke-width="2.4" fill="none" stroke-linecap="round">
<path d="M47 26q-5-9-14-12M53 26q5-9 14-12"/></g>`,

grub:`<g fill="var(--chalk)"><path d="M22 82q-8-26 4-40t26-12q18 2 23 20t-3 32q-26 6-50 0z"/>
<path d="M40 32q4-12 10-16 6 4 8 16z" opacity=".9"/>
<path d="M26 80q1 10 4.5 11T35 80zM45 82q1 11 4.5 12T54 82zM66 80q1 10 4.5 11T75 80z"/></g>
<g stroke="var(--plate0)" stroke-width="2.4" fill="none"><path d="M24 60q26 6 52 0M26 70q24 6 47 0M30 48q20 5 40 0"/></g>
<g fill="var(--plate0)"><ellipse cx="42" cy="40" rx="4" ry="5"/><ellipse cx="60" cy="40" rx="4" ry="5"/></g>
<path d="M46 22q4-10 4-16 2 6 4 16z" fill="var(--sun)"/>`,

jar:`<g fill="none" stroke="var(--chalk)" stroke-width="3"><path d="M28 78V48q0-22 22-22t22 22v30"/><path d="M22 78h56M46 22h8"/></g>
<g fill="var(--chalk)"><path d="M50 40q-7 8-7 16t7 12q7-4 7-12t-7-16z" opacity=".95"/>
<rect x="20" y="78" width="60" height="7" rx="2"/></g>
<g stroke="var(--plate0)" stroke-width="1.8" fill="none"><path d="M47 52q3 4 6 0"/></g>
<g stroke="var(--chalk)" stroke-width="1.4" fill="none" opacity=".5"><path d="M36 44q-3 12 0 26M64 44q3 12 0 26"/></g>`,

wader:`<g stroke="var(--chalk)" stroke-width="3.4" fill="none" stroke-linecap="round">
<path d="M40 54L28 90M46 56l-4 34M58 56l6 34M64 52l14 38M50 36V24"/></g>
<g fill="var(--chalk)"><path d="M32 48q10-14 18-14t18 14q-6 12-18 12t-18-12z"/>
<path d="M50 12a7 7 0 0 1 6 10l6 9-11-6q-8-2-8-7a7 7 0 0 1 7-6z"/></g>
<g fill="var(--plate0)"><circle cx="43" cy="46" r="3"/><circle cx="57" cy="46" r="3"/><circle cx="52" cy="18" r="1.6"/></g>
<g stroke="var(--plate0)" stroke-width="1.8" fill="none"><path d="M38 54q12 5 24 0"/></g>`,

foxfire:`<g fill="var(--chalk)"><path d="M50 18q14 18 14 30a14 14 0 0 1-28 0c0-6 3-11 7-15 1 5 3 7 5 8-2-8 0-16 2-23z"/></g>
<g fill="var(--plate0)"><ellipse cx="45" cy="46" rx="3" ry="4"/><ellipse cx="56" cy="46" rx="3" ry="4"/></g>
<g stroke="var(--sun)" stroke-width="2" fill="none" opacity=".8"><path d="M50 66q-4 8-2 14M50 66q4 8 2 14"/></g>`,

archivist:`<g fill="var(--chalk)"><path d="M50 12q16 0 20 18l6 58H24l6-58q4-18 20-18z"/></g>
<g fill="var(--plate0)"><path d="M38 26q12-8 24 0-4 18-12 20t-12-20z"/></g>
<g stroke="var(--chalk)" stroke-width="2.6" fill="none" stroke-linecap="round">
<path d="M30 44L14 56M70 44l16 12M14 56v-8M86 56v-8"/></g>
<g fill="var(--sun)"><path d="M12 48q2-8 2-10 1 4 2 10zM84 48q2-8 2-10 1 4 2 10z"/>
<circle cx="44" cy="34" r="2.4"/><circle cx="56" cy="34" r="2.4"/></g>
<g stroke="var(--plate0)" stroke-width="2" fill="none"><path d="M34 62h32M32 72h36"/></g>`,

halide:`<g fill="var(--chalk)"><path d="M50 14l22 26-22 46-22-46z"/></g>
<g stroke="var(--plate0)" stroke-width="2" fill="none"><path d="M50 14v72M28 40h44M38 62h24"/></g>
<g fill="var(--sun)"><path d="M50 40l7 10-7 12-7-12z"/></g>`,

warden:`<g fill="var(--chalk)"><path d="M26 74q0-40 24-46t24 46z"/><rect x="20" y="74" width="60" height="8" rx="3"/>
<circle cx="50" cy="88" r="5"/></g>
<g fill="var(--plate0)"><ellipse cx="40" cy="52" rx="5" ry="7"/><ellipse cx="60" cy="52" rx="5" ry="7"/>
<ellipse cx="50" cy="66" rx="7" ry="5"/></g>
<g stroke="var(--plate0)" stroke-width="1.8" fill="none"><path d="M44 66q6 4 12 0"/></g>
<g stroke="var(--chalk)" stroke-width="2" fill="none" opacity=".55"><path d="M18 60q-6 4-8 10M82 60q6 4 8 10"/></g>`,

blot:`<g fill="var(--chalk)"><path d="M50 14q23 1 30 19t-7 35q-15 15-34 11T13 58q-3-19 9-30t28-14z"/>
<path d="M20 80q2 11 5.5 12T30 80zM45 86q2 10 5.5 11T55 86zM72 78q2 10 5.5 11T82 78z"/></g>
<g fill="var(--plate0)"><circle cx="41" cy="45" r="9"/><circle cx="64" cy="51" r="5.5"/></g>
<circle cx="41" cy="45" r="3.2" fill="var(--sun)"/>
<g stroke="var(--plate0)" stroke-width="2" fill="none"><path d="M28 64q14 7 30 2"/></g>`,

beetle:`<g fill="var(--chalk)"><path d="M50 20q23 0 27 25t-27 37q-23-12-27-37t27-25z"/></g>
<g stroke="var(--plate0)" stroke-width="2.6" fill="none"><path d="M50 22v58M31 42h38M29 56h42"/></g>
<g stroke="var(--chalk)" stroke-width="3" fill="none" stroke-linecap="round">
<path d="M28 40L11 31M28 55H9M30 68L14 78M72 40l17-9M72 55h19M70 68l16 10M44 20l-6-11M56 20l6-11"/></g>
<g fill="var(--sun)"><circle cx="50" cy="34" r="3"/></g>`,

fume:`<g fill="var(--chalk)" opacity=".96"><path d="M26 64q-13 0-13-10t15-11q0-15 17-15 6-10 18-6t12 15q13 2 13 12t-15 15q-7 8-19 6t-17-8q-6 3-11 2z"/></g>
<g fill="var(--plate0)"><ellipse cx="42" cy="46" rx="4.2" ry="6.4"/><ellipse cx="61" cy="46" rx="4.2" ry="6.4"/>
<path d="M44 60q7 5 14 0-7 8-14 0z"/></g>
<g stroke="var(--chalk)" stroke-width="2.2" fill="none" opacity=".55" stroke-linecap="round">
<path d="M33 74q7 6 0 13M50 77q7 6 0 13M67 74q7 6 0 13"/></g>`,

wickmaid:`<g fill="var(--chalk)"><path d="M50 28q13 0 16 15l6 41H28l6-41q3-15 16-15z"/><circle cx="50" cy="22" r="9.5"/></g>
<g fill="var(--plate0)"><circle cx="46" cy="21" r="2.2"/><circle cx="54" cy="21" r="2.2"/></g>
<g stroke="var(--chalk)" stroke-width="3.2" fill="none" stroke-linecap="round"><path d="M35 46L21 35M21 35v-7"/></g>
<path d="M18 28q3-9 3-12 1 6 3 12z" fill="var(--sun)"/>
<g stroke="var(--plate0)" stroke-width="2" fill="none"><path d="M37 62h26M35 72h30"/></g>`,

curator:`<g fill="var(--chalk)"><rect x="16" y="17" width="68" height="7" rx="2"/><path d="M39 17h22v-9H39z"/>
<path d="M50 28q15 0 18 17l6 43H26l6-43q3-17 18-17z"/></g>
<g fill="var(--plate0)"><rect x="39" y="35" width="22" height="11" rx="2"/></g>
<g fill="var(--sun)"><circle cx="45" cy="40.5" r="2.4"/><circle cx="55" cy="40.5" r="2.4"/></g>
<g stroke="var(--chalk)" stroke-width="3.2" fill="none" stroke-linecap="round"><path d="M31 54L13 62M69 54l18 8"/></g>
<g stroke="var(--plate0)" stroke-width="2" fill="none"><path d="M34 62h32M32 73h36"/></g>`,

collector:`<g fill="var(--chalk)">
<path d="M48 40Q30 6 12 14 0 20 6 40q6 18 30 22 10 2 12-6z"/>
<path d="M52 40Q70 6 88 14q12 6 6 26-6 18-30 22-10 2-12-6z"/>
<ellipse cx="50" cy="52" rx="8" ry="26"/><circle cx="50" cy="24" r="10"/></g>
<g fill="var(--plate0)"><circle cx="46" cy="22" r="2.6"/><circle cx="54" cy="22" r="2.6"/>
<circle cx="24" cy="34" r="7"/><circle cx="76" cy="34" r="7"/></g>
<g fill="var(--sun)"><circle cx="24" cy="34" r="2.6"/><circle cx="76" cy="34" r="2.6"/></g>
<g stroke="var(--chalk)" stroke-width="2.6" fill="none" stroke-linecap="round">
<path d="M44 14q-4-8-10-10M56 14q4-8 10-10M50 78v14M38 84l12 8 12-8"/></g>
<g stroke="var(--plate0)" stroke-width="1.8" fill="none"><path d="M16 30q16 6 26 16M84 30q-16 6-26 16M46 44h8M46 56h8"/></g>`,

/* ── act I — remaining bosses ── */
emulsion:`<g fill="var(--chalk)"><path d="M50 8q20 18 26 38t-6 34q-20 12-40 0T24 46 50 8z"/></g>
<g fill="var(--plate0)"><ellipse cx="38" cy="46" rx="7" ry="9"/><ellipse cx="62" cy="46" rx="7" ry="9"/>
<path d="M34 66q16 12 32 0-4 14-16 14T34 66z"/></g>
<g fill="var(--sun)"><circle cx="38" cy="43" r="2.6"/><circle cx="62" cy="43" r="2.6"/></g>
<g fill="var(--chalk)" opacity=".75"><path d="M28 82q2 10 5 10t4-10zM50 88q2 9 4 9t3-9zM68 80q2 11 5 11t4-11z"/></g>
<g stroke="var(--plate0)" stroke-width="2" fill="none" opacity=".6"><path d="M32 30q18-8 36 0"/></g>`,

press:`<g fill="var(--chalk)"><rect x="12" y="10" width="76" height="12" rx="2"/>
<rect x="16" y="76" width="68" height="14" rx="2"/><rect x="24" y="40" width="52" height="22" rx="2"/></g>
<g stroke="var(--chalk)" stroke-width="4" fill="none"><path d="M24 22v54M76 22v54"/></g>
<g fill="var(--plate0)"><rect x="32" y="46" width="12" height="10" rx="1"/><rect x="56" y="46" width="12" height="10" rx="1"/></g>
<g fill="var(--sun)"><circle cx="38" cy="51" r="3"/><circle cx="62" cy="51" r="3"/>
<rect x="26" y="66" width="48" height="4" rx="2" opacity=".8"/></g>
<g stroke="var(--plate0)" stroke-width="2" fill="none"><path d="M18 16h64M22 84h56"/></g>`,

/* ── act II — the gallery ── */
frame:`<g fill="var(--chalk)"><path d="M14 12h72v76H14z"/>
<circle cx="14" cy="12" r="5"/><circle cx="86" cy="12" r="5"/><circle cx="14" cy="88" r="5"/><circle cx="86" cy="88" r="5"/></g>
<g fill="var(--plate0)"><rect x="24" y="22" width="52" height="56"/></g>
<g fill="var(--sun)"><circle cx="40" cy="46" r="4"/><circle cx="60" cy="46" r="4"/></g>
<g stroke="var(--chalk)" stroke-width="2" fill="none"><path d="M19 17h62v66H19z"/></g>
<g stroke="var(--sun)" stroke-width="1.6" fill="none" opacity=".7"><path d="M36 62q14 8 28 0"/></g>`,

print:`<g fill="var(--chalk)"><path d="M24 10h52v66q-13 10-26 4t-26 4z"/></g>
<g fill="var(--plate0)" opacity=".85"><ellipse cx="41" cy="40" rx="5" ry="7"/><ellipse cx="59" cy="40" rx="5" ry="7"/>
<path d="M40 58q10 7 20 0-3 9-10 9t-10-9z"/></g>
<g stroke="var(--plate0)" stroke-width="1.6" fill="none" opacity=".55"><path d="M30 22h40M30 28h30M30 70h40"/></g>
<g fill="var(--sun)" opacity=".8"><circle cx="41" cy="38" r="1.8"/><circle cx="59" cy="38" r="1.8"/></g>`,

twin:`<g fill="var(--chalk)"><path d="M34 22q12 0 14 14v34q-2 12-14 12T20 70V36q2-14 14-14z"/>
<path d="M66 22q12 0 14 14v34q-2 12-14 12T52 70V36q2-14 14-14z"/></g>
<g fill="var(--plate0)"><ellipse cx="30" cy="42" rx="4" ry="6"/><ellipse cx="70" cy="42" rx="4" ry="6"/></g>
<g fill="var(--sun)"><circle cx="30" cy="40" r="1.8"/><circle cx="70" cy="40" r="1.8"/></g>
<g stroke="var(--plate0)" stroke-width="2" fill="none" opacity=".7"><path d="M50 20v60M26 58h10M64 58h10"/></g>
<g stroke="var(--chalk)" stroke-width="2" fill="none"><path d="M16 84h68"/></g>`,

sitter:`<g fill="var(--chalk)"><circle cx="50" cy="26" r="14"/>
<path d="M50 42q20 0 24 20l4 26H22l4-26q4-20 24-20z"/></g>
<g fill="var(--plate0)"><ellipse cx="44" cy="24" rx="3.4" ry="4.6"/><ellipse cx="56" cy="24" rx="3.4" ry="4.6"/>
<path d="M44 34q6 4 12 0-3 6-6 6t-6-6z"/></g>
<g stroke="var(--chalk)" stroke-width="3" fill="none" stroke-linecap="round"><path d="M50 12V4M42 8h16"/></g>
<g fill="var(--sun)"><circle cx="44" cy="22" r="1.6"/><circle cx="56" cy="22" r="1.6"/></g>
<g stroke="var(--plate0)" stroke-width="2" fill="none"><path d="M32 66h36M30 78h40"/></g>`,

rope:`<g fill="var(--chalk)"><rect x="44" y="30" width="12" height="52" rx="3"/>
<ellipse cx="50" cy="86" rx="20" ry="6"/><circle cx="50" cy="24" r="9"/></g>
<g stroke="var(--chalk)" stroke-width="5" fill="none" stroke-linecap="round"><path d="M50 34q-26 10-26 26"/></g>
<g fill="var(--plate0)"><circle cx="46" cy="22" r="2.4"/><circle cx="54" cy="22" r="2.4"/></g>
<g fill="var(--sun)"><circle cx="24" cy="62" r="4"/></g>
<g stroke="var(--plate0)" stroke-width="1.8" fill="none" opacity=".7"><path d="M44 44h12M44 56h12M44 68h12"/></g>`,

rat:`<g fill="var(--chalk)"><path d="M22 62q0-16 18-18t28 8q10 6 10 14t-12 10H34q-12 0-12-14z"/>
<path d="M30 44q-6-10-2-14 6 0 10 8z"/><circle cx="70" cy="52" r="10"/></g>
<g stroke="var(--chalk)" stroke-width="3" fill="none" stroke-linecap="round"><path d="M24 70q-14 4-16 14"/></g>
<g fill="var(--plate0)"><circle cx="74" cy="49" r="2.6"/><circle cx="31" cy="41" r="2"/></g>
<g fill="var(--sun)"><circle cx="79" cy="55" r="2"/></g>
<g stroke="var(--chalk)" stroke-width="1.8" fill="none" stroke-linecap="round"><path d="M78 58l10 3M78 54l10-2"/></g>`,

retoucher:`<g fill="var(--chalk)"><circle cx="44" cy="24" r="12"/>
<path d="M44 38q18 0 21 18l4 30H22l4-30q3-18 18-18z"/></g>
<g fill="var(--plate0)"><rect x="34" y="18" width="22" height="8" rx="3"/></g>
<g fill="var(--sun)"><circle cx="39" cy="22" r="2.4"/><circle cx="51" cy="22" r="2.4"/><circle cx="84" cy="36" r="3.4"/></g>
<g stroke="var(--chalk)" stroke-width="3" fill="none" stroke-linecap="round"><path d="M64 56l18-18"/></g>
<g stroke="var(--plate0)" stroke-width="2" fill="none"><path d="M30 62h28M28 74h32"/></g>`,

varnish:`<g fill="var(--chalk)"><path d="M50 14q22 6 24 30t-8 34q-16 10-32 0T26 44 50 14z"/></g>
<g fill="var(--plate0)"><path d="M34 40q8-6 14 0-6 8-14 0zM52 40q8-6 14 0-6 8-14 0z"/>
<path d="M40 62q10 8 20 0-4 10-10 10t-10-10z"/></g>
<g fill="var(--sun)"><circle cx="41" cy="40" r="1.8"/><circle cx="59" cy="40" r="1.8"/></g>
<g fill="var(--chalk)" opacity=".8"><path d="M30 78q2 12 5 12t4-12zM60 80q2 10 4 10t4-10z"/></g>
<g stroke="var(--plate0)" stroke-width="1.6" fill="none" opacity=".5"><path d="M36 24q14-6 28 0"/></g>`,

cabinet:`<g fill="var(--chalk)"><rect x="18" y="8" width="64" height="84" rx="3"/></g>
<g fill="var(--plate0)"><rect x="26" y="16" width="48" height="52" rx="2"/></g>
<g fill="var(--chalk)"><path d="M50 30q9 0 11 10t-3 20H42q-5-10-3-20t11-10z"/></g>
<g fill="var(--plate0)"><circle cx="45" cy="40" r="2.6"/><circle cx="55" cy="40" r="2.6"/></g>
<g fill="var(--sun)"><circle cx="45" cy="39" r="1.2"/><circle cx="55" cy="39" r="1.2"/></g>
<g stroke="var(--plate0)" stroke-width="2" fill="none"><path d="M28 76h44M34 84h32"/></g>`,

ambro:`<g fill="var(--chalk)"><rect x="20" y="14" width="60" height="72" rx="2"/></g>
<g fill="var(--plate0)"><rect x="27" y="21" width="46" height="58" rx="1"/></g>
<g stroke="var(--chalk)" stroke-width="2.4" fill="none" stroke-linecap="round">
<path d="M50 21v20l-14 10 14 8-8 20M50 41l16-8M36 51l-9 8M42 79l14 7"/></g>
<g fill="var(--sun)"><circle cx="50" cy="41" r="3.4"/></g>
<g stroke="var(--sun)" stroke-width="1.2" fill="none" opacity=".45"><path d="M27 21l46 58M73 21L27 79"/></g>`,

usher:`<g fill="var(--chalk)"><path d="M50 8q9 0 9 10v6h-18v-6q0-10 9-10z"/>
<circle cx="50" cy="30" r="11"/><path d="M50 42q17 0 20 18l4 30H26l4-30q3-18 20-18z"/></g>
<g fill="var(--plate0)"><rect x="38" y="20" width="24" height="6" rx="2"/>
<ellipse cx="45" cy="30" rx="3" ry="4"/><ellipse cx="55" cy="30" rx="3" ry="4"/></g>
<g stroke="var(--chalk)" stroke-width="3" fill="none" stroke-linecap="round"><path d="M72 58v14"/></g>
<g fill="var(--sun)"><rect x="66" y="72" width="12" height="14" rx="2"/></g>
<g stroke="var(--plate0)" stroke-width="2" fill="none"><path d="M34 62h32M32 76h36"/></g>`,

wax:`<g fill="var(--chalk)"><path d="M50 16q14 4 16 22t-2 30q-1 18-14 18t-14-18q-4-12-2-30T50 16z"/>
<path d="M36 60q-6 10-4 18t8 6zM64 62q6 10 4 18t-8 6z"/></g>
<g fill="var(--plate0)"><ellipse cx="44" cy="40" rx="4" ry="6"/><ellipse cx="56" cy="40" rx="4" ry="6"/>
<path d="M44 56q6 8 12 0-2 10-6 10t-6-10z"/></g>
<g fill="var(--sun)"><path d="M50 4q4 8 4 10a4 4 0 0 1-8 0c0-2 2-6 4-10z"/>
<circle cx="44" cy="38" r="1.8"/><circle cx="56" cy="38" r="1.8"/></g>`,

negman:`<g fill="var(--plate0)" stroke="var(--chalk)" stroke-width="2.6">
<circle cx="50" cy="26" r="13"/><path d="M50 40q19 0 22 20l4 28H24l4-28q3-20 22-20z"/></g>
<g fill="var(--chalk)"><ellipse cx="44" cy="24" rx="4" ry="5.4"/><ellipse cx="56" cy="24" rx="4" ry="5.4"/>
<path d="M42 34q8 6 16 0-4 8-8 8t-8-8z"/></g>
<g fill="var(--plate0)"><circle cx="44" cy="24" r="1.6"/><circle cx="56" cy="24" r="1.6"/></g>
<g stroke="var(--chalk)" stroke-width="2" fill="none" opacity=".8"><path d="M32 62h36M30 76h40"/></g>`,

chandel:`<g stroke="var(--chalk)" stroke-width="3" fill="none"><path d="M50 6v16"/></g>
<g fill="var(--chalk)"><path d="M50 22q16 0 20 14t-20 20q-20-6-20-20t20-14z"/>
<path d="M30 36Q12 26 8 38t18 18q8 2 10-4zM70 36q18-10 22 2t-18 18q-8 2-10-4z"/></g>
<g fill="var(--plate0)"><circle cx="43" cy="34" r="3"/><circle cx="57" cy="34" r="3"/>
<circle cx="22" cy="42" r="4"/><circle cx="78" cy="42" r="4"/></g>
<g fill="var(--sun)"><path d="M38 60q3 10 3 14t-3 6zM50 62q3 12 3 16t-3 6zM62 60q3 10 3 14t-3 6z"/>
<circle cx="43" cy="33" r="1.4"/><circle cx="57" cy="33" r="1.4"/></g>`,

vitrine:`<g fill="var(--chalk)" opacity=".16"><rect x="21" y="13" width="58" height="70"/></g>
<g fill="none" stroke="var(--chalk)" stroke-width="3.4"><rect x="18" y="10" width="64" height="76" rx="2"/></g>
<g fill="var(--chalk)"><rect x="14" y="86" width="72" height="8" rx="2"/>
<path d="M50 30q12 0 14 14t-4 26H40q-6-12-4-26t14-14z"/></g>
<g fill="var(--plate0)"><ellipse cx="44" cy="44" rx="3.6" ry="5"/><ellipse cx="56" cy="44" rx="3.6" ry="5"/></g>
<g fill="var(--sun)"><circle cx="44" cy="43" r="1.6"/><circle cx="56" cy="43" r="1.6"/></g>
<g stroke="var(--chalk)" stroke-width="1.6" fill="none" opacity=".5"><path d="M28 14v68M72 14v68"/></g>`,

choir:`<g fill="var(--chalk)"><path d="M26 44q8 0 10 10l3 30H13l3-30q2-10 10-10z"/>
<path d="M74 44q8 0 10 10l3 30H61l3-30q2-10 10-10z"/>
<path d="M50 30q11 0 13 13l4 41H33l4-41q2-13 13-13z"/></g>
<g fill="var(--plate0)"><path d="M20 46q6-4 12 0-3 10-6 10t-6-10z"/><path d="M68 46q6-4 12 0-3 10-6 10t-6-10z"/>
<path d="M42 34q8-5 16 0-4 13-8 13t-8-13z"/></g>
<g fill="var(--sun)"><circle cx="23" cy="49" r="1.6"/><circle cx="29" cy="49" r="1.6"/>
<circle cx="71" cy="49" r="1.6"/><circle cx="77" cy="49" r="1.6"/>
<circle cx="46" cy="38" r="2"/><circle cx="54" cy="38" r="2"/></g>
<g stroke="var(--plate0)" stroke-width="1.8" fill="none"><path d="M38 66h24M36 76h28"/></g>`,

salon:`<g fill="var(--chalk)"><rect x="8" y="14" width="34" height="30" rx="2"/><rect x="58" y="14" width="34" height="30" rx="2"/>
<rect x="26" y="52" width="48" height="36" rx="2"/></g>
<g fill="var(--plate0)"><rect x="13" y="19" width="24" height="20"/><rect x="63" y="19" width="24" height="20"/>
<rect x="32" y="58" width="36" height="24"/></g>
<g fill="var(--sun)"><circle cx="25" cy="29" r="5"/><circle cx="75" cy="29" r="5"/></g>
<g stroke="var(--sun)" stroke-width="2.4" fill="none" stroke-linecap="round"><path d="M40 70q10 8 20 0"/></g>
<g stroke="var(--chalk)" stroke-width="2" fill="none"><path d="M25 14V6M75 14V6M50 52v-8"/></g>`,

argentine:`<g fill="var(--chalk)"><rect x="28" y="12" width="44" height="32" rx="3"/>
<path d="M50 46q20 0 23 20l5 26H22l5-26q3-20 23-20z"/></g>
<g fill="var(--plate0)"><circle cx="50" cy="28" r="12"/></g>
<g fill="var(--chalk)"><circle cx="50" cy="28" r="6"/></g>
<g fill="var(--sun)"><circle cx="50" cy="28" r="2.6"/><rect x="60" y="16" width="8" height="5" rx="1"/></g>
<g stroke="var(--chalk)" stroke-width="3" fill="none" stroke-linecap="round"><path d="M28 60L10 74M72 60l18 14"/></g>
<g stroke="var(--plate0)" stroke-width="2" fill="none"><path d="M32 68h36M30 80h40"/></g>`,

longgallery:`<g fill="none" stroke="var(--chalk)" stroke-width="3"><path d="M6 92V38q0-16 44-16t44 16v54"/></g>
<g fill="none" stroke="var(--chalk)" stroke-width="2.4" opacity=".8"><path d="M18 92V46q0-12 32-12t32 12v46"/></g>
<g fill="none" stroke="var(--chalk)" stroke-width="2" opacity=".6"><path d="M30 92V54q0-9 20-9t20 9v38"/></g>
<g fill="var(--plate0)"><path d="M40 92V62q0-5 10-5t10 5v30z"/></g>
<g fill="var(--sun)"><circle cx="50" cy="72" r="6"/></g>
<g fill="var(--plate0)"><circle cx="50" cy="72" r="2.4"/></g>`,

/* ── act III — the aperture ── */
caustic:`<g fill="none" stroke="var(--chalk)" stroke-width="3" stroke-linecap="round">
<path d="M10 24q12-11 24 0t24 0 22 0M10 78q12-11 24 0t24 0 22 0"/></g>
<g fill="var(--chalk)"><ellipse cx="50" cy="50" rx="27" ry="17"/></g>
<g fill="var(--plate0)"><ellipse cx="41" cy="47" rx="4" ry="5.4"/><ellipse cx="59" cy="47" rx="4" ry="5.4"/>
<path d="M42 57q8 6 16 0-4 7-8 7t-8-7z"/></g>
<g fill="var(--sun)"><circle cx="41" cy="46" r="1.8"/><circle cx="59" cy="46" r="1.8"/></g>
<g stroke="var(--sun)" stroke-width="2" fill="none" opacity=".6" stroke-linecap="round">
<path d="M12 50q7-6 13 0M75 50q7-6 13 0"/></g>`,

airydisc:`<g fill="none" stroke="var(--chalk)" stroke-width="2.4" opacity=".55"><circle cx="50" cy="50" r="40"/></g>
<g fill="none" stroke="var(--chalk)" stroke-width="3" opacity=".8"><circle cx="50" cy="50" r="28"/></g>
<g fill="var(--chalk)"><circle cx="50" cy="50" r="16"/></g>
<g fill="var(--plate0)"><circle cx="44" cy="46" r="3.4"/><circle cx="56" cy="46" r="3.4"/>
<path d="M43 57q7 6 14 0-3 7-7 7t-7-7z"/></g>
<g fill="var(--sun)"><circle cx="44" cy="45" r="1.5"/><circle cx="56" cy="45" r="1.5"/></g>`,

lumen:`<g fill="var(--chalk)"><path d="M50 10q16 0 18 18v34q0 12-6 18-8-6-12 4-4-10-12-4-6-6-6-18V28q2-18 18-18z"/></g>
<g fill="var(--plate0)"><ellipse cx="43" cy="34" rx="4.4" ry="7"/><ellipse cx="57" cy="34" rx="4.4" ry="7"/></g>
<g fill="var(--sun)"><circle cx="43" cy="32" r="2"/><circle cx="57" cy="32" r="2"/></g>
<g stroke="var(--sun)" stroke-width="2" fill="none" opacity=".65" stroke-linecap="round">
<path d="M36 20q-8-6-10-14M64 20q8-6 10-14"/></g>
<g stroke="var(--chalk)" stroke-width="2" fill="none" opacity=".4"><path d="M40 52h20"/></g>`,

diffract:`<g stroke="var(--chalk)" stroke-width="3" fill="none" stroke-linecap="round">
<path d="M50 88V54M50 54L20 20M50 54L36 12M50 54l14-42M50 54l30-34"/></g>
<g fill="var(--chalk)"><circle cx="50" cy="56" r="12"/></g>
<g fill="var(--plate0)"><ellipse cx="45" cy="54" rx="3" ry="4"/><ellipse cx="55" cy="54" rx="3" ry="4"/></g>
<g fill="var(--sun)"><circle cx="20" cy="20" r="3"/><circle cx="36" cy="12" r="3"/>
<circle cx="64" cy="12" r="3"/><circle cx="80" cy="20" r="3"/></g>`,

overexp:`<g fill="var(--chalk)"><circle cx="50" cy="28" r="16"/>
<path d="M50 44q22 0 25 22l4 26H21l4-26q3-22 25-22z"/></g>
<g fill="var(--plate0)"><circle cx="50" cy="28" r="9"/></g>
<g fill="var(--sun)" opacity=".9"><circle cx="50" cy="28" r="3.4"/></g>
<g stroke="var(--chalk)" stroke-width="2.4" fill="none" opacity=".55" stroke-linecap="round">
<path d="M50 6V0M28 12l-4-6M72 12l4-6M18 30h-8M82 30h8"/></g>
<g stroke="var(--plate0)" stroke-width="2" fill="none"><path d="M32 66h36M30 80h40"/></g>`,

shard:`<g fill="var(--chalk)"><path d="M50 8l26 34-14 46H38L24 42z"/></g>
<g fill="var(--plate0)"><path d="M50 20l14 22-14 30-14-30z"/></g>
<g fill="var(--sun)"><path d="M50 32l7 11-7 15-7-15z"/></g>
<g stroke="var(--chalk)" stroke-width="1.8" fill="none" opacity=".6"><path d="M24 42h52M38 88l12-30 12 30"/></g>`,

corona:`<g fill="none" stroke="var(--chalk)" stroke-width="9"><circle cx="50" cy="50" r="26"/></g>
<g fill="var(--plate0)"><circle cx="50" cy="50" r="20"/></g>
<g fill="var(--sun)"><circle cx="42" cy="46" r="3.4"/><circle cx="58" cy="46" r="3.4"/></g>
<g stroke="var(--sun)" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".85">
<path d="M50 12V2M50 88v10M12 50H2M88 50h10M23 23l-7-7M77 77l7 7M77 23l7-7M23 77l-7 7"/></g>
<g stroke="var(--chalk)" stroke-width="2" fill="none"><path d="M42 60q8 6 16 0"/></g>`,

blackbody:`<g fill="var(--plate0)" stroke="var(--chalk)" stroke-width="3"><circle cx="50" cy="52" r="32"/></g>
<g fill="var(--chalk)"><ellipse cx="40" cy="46" rx="5" ry="7"/><ellipse cx="60" cy="46" rx="5" ry="7"/></g>
<g fill="var(--plate0)"><circle cx="40" cy="46" r="2"/><circle cx="60" cy="46" r="2"/></g>
<g stroke="var(--chalk)" stroke-width="2.4" fill="none"><path d="M38 66q12 8 24 0"/></g>
<g stroke="var(--sun)" stroke-width="2" fill="none" opacity=".5" stroke-linecap="round">
<path d="M50 12v6M18 32l5 4M82 32l-5 4"/></g>`,

photonchoir:`<g fill="var(--chalk)"><circle cx="30" cy="34" r="13"/><circle cx="70" cy="34" r="13"/>
<circle cx="50" cy="62" r="16"/></g>
<g fill="var(--plate0)"><circle cx="26" cy="32" r="3"/><circle cx="34" cy="32" r="3"/>
<circle cx="66" cy="32" r="3"/><circle cx="74" cy="32" r="3"/>
<circle cx="44" cy="58" r="3.6"/><circle cx="56" cy="58" r="3.6"/></g>
<g fill="var(--sun)"><circle cx="30" cy="42" r="2"/><circle cx="70" cy="42" r="2"/><circle cx="50" cy="72" r="2.6"/></g>
<g stroke="var(--sun)" stroke-width="1.6" fill="none" opacity=".5"><path d="M40 40q10 6 20 0M36 48L46 56M64 48L54 56"/></g>`,

theburn:`<g fill="var(--chalk)"><path d="M50 10q18 14 22 32t-6 34q-16 14-32 0T28 42 50 10z"/></g>
<g fill="var(--plate0)"><path d="M50 26q12 12 14 26t-14 26q-14-12-14-26t14-26z"/></g>
<g fill="var(--sun)"><path d="M50 40q6 8 6 14t-6 12q-6-6-6-12t6-14z"/></g>
<g stroke="var(--sun)" stroke-width="2" fill="none" opacity=".7" stroke-linecap="round">
<path d="M30 22q-6-6-8-12M70 22q6-6 8-12M22 60q-8 2-14 0M78 60q8 2 14 0"/></g>`,

apblade:`<g fill="var(--chalk)"><path d="M50 8l30 18v34L50 92 20 60V26z"/></g>
<g fill="var(--plate0)"><path d="M50 24l18 11v22L50 76 32 57V35z"/></g>
<g stroke="var(--chalk)" stroke-width="2.4" fill="none"><path d="M50 24L32 57M50 24l18 33M32 57h36"/></g>
<g fill="var(--sun)"><circle cx="50" cy="48" r="6"/></g>
<g fill="var(--plate0)"><circle cx="50" cy="48" r="2.4"/></g>`,

umbra:`<g fill="var(--plate0)" stroke="var(--chalk)" stroke-width="2.4">
<path d="M50 12q18 0 20 20v30q0 22-20 30-20-8-20-30V32q2-20 20-20z"/></g>
<g fill="var(--chalk)"><ellipse cx="43" cy="38" rx="4" ry="6"/><ellipse cx="57" cy="38" rx="4" ry="6"/></g>
<g fill="var(--plate0)"><circle cx="43" cy="38" r="1.6"/><circle cx="57" cy="38" r="1.6"/></g>
<g stroke="var(--chalk)" stroke-width="2" fill="none" opacity=".7"><path d="M42 58q8 6 16 0"/></g>
<g stroke="var(--sun)" stroke-width="2.4" fill="none" opacity=".5" stroke-linecap="round"><path d="M34 76q16 9 32 0"/></g>`,

unfixed:`<g fill="var(--chalk)"><path d="M50 12q16 0 18 18v22H32V30q2-18 18-18z"/><path d="M32 52h36l-3 16H35z"/></g>
<g fill="var(--chalk)" opacity=".55"><path d="M36 70h28l-3 12H39z"/></g>
<g fill="var(--chalk)" opacity=".25"><path d="M40 84h20l-2 8H42z"/></g>
<g fill="var(--plate0)"><ellipse cx="43" cy="34" rx="4" ry="6"/><ellipse cx="57" cy="34" rx="4" ry="6"/></g>
<g fill="var(--sun)"><circle cx="43" cy="33" r="1.8"/><circle cx="57" cy="33" r="1.8"/></g>
<g stroke="var(--plate0)" stroke-width="1.8" fill="none" opacity=".6"><path d="M38 60h24"/></g>`,

shutter:`<g fill="var(--chalk)"><circle cx="50" cy="50" r="38"/></g>
<g fill="var(--plate0)"><path d="M50 20l26 15v30L50 80 24 65V35z"/></g>
<g fill="var(--chalk)"><path d="M50 30l17 10v20L50 70 33 60V40z"/></g>
<g fill="var(--plate0)"><circle cx="50" cy="50" r="11"/></g>
<g fill="var(--sun)"><circle cx="50" cy="50" r="5"/></g>
<g stroke="var(--plate0)" stroke-width="2" fill="none"><path d="M50 20v10M76 35l-9 5M76 65l-9-5M50 80V70M24 65l9-5M24 35l9 5"/></g>`,

heliograph:`<g fill="var(--chalk)"><circle cx="50" cy="34" r="22"/></g>
<g fill="var(--plate0)"><circle cx="50" cy="34" r="15"/></g>
<g fill="var(--sun)"><circle cx="50" cy="34" r="8"/></g>
<g stroke="var(--chalk)" stroke-width="3.4" fill="none" stroke-linecap="round"><path d="M50 56v22M32 92l18-14 18 14"/></g>
<g stroke="var(--sun)" stroke-width="2.2" fill="none" opacity=".8" stroke-linecap="round">
<path d="M50 4v8M22 12l6 6M78 12l-6 6M18 34h-8M82 34h8"/></g>
<g fill="var(--plate0)"><circle cx="46" cy="31" r="2"/><circle cx="54" cy="31" r="2"/></g>`,

silentframe:`<g fill="none" stroke="var(--chalk)" stroke-width="7"><rect x="16" y="10" width="68" height="80" rx="2"/></g>
<g fill="var(--plate0)"><rect x="23" y="17" width="54" height="66"/></g>
<g fill="var(--chalk)"><ellipse cx="38" cy="44" rx="8" ry="11"/><ellipse cx="62" cy="44" rx="8" ry="11"/></g>
<g fill="var(--plate0)"><circle cx="38" cy="44" r="3.4"/><circle cx="62" cy="44" r="3.4"/></g>
<g fill="var(--sun)"><circle cx="38" cy="43" r="1.6"/><circle cx="62" cy="43" r="1.6"/></g>
<g stroke="var(--chalk)" stroke-width="2.6" fill="none" stroke-linecap="round"><path d="M38 68h24"/></g>`,

aperture:`<g fill="none" stroke="var(--chalk)" stroke-width="4"><circle cx="50" cy="50" r="44"/></g>
<g fill="var(--chalk)"><path d="M50 12l30 18v40L50 88 20 70V30z"/></g>
<g fill="var(--plate0)"><path d="M50 24l20 12v28L50 76 30 64V36z"/></g>
<g stroke="var(--chalk)" stroke-width="2.6" fill="none"><path d="M50 24L30 64M50 24l20 40M30 64h40M50 76V50M30 36l20 14M70 36L50 50"/></g>
<g fill="var(--sun)"><circle cx="50" cy="50" r="9"/></g>
<g fill="var(--plate0)"><circle cx="50" cy="50" r="3.4"/></g>`,

daguerre:`<g fill="var(--chalk)"><circle cx="50" cy="24" r="15"/>
<path d="M50 40q21 0 24 22l4 30H22l4-30q3-22 24-22z"/></g>
<g fill="var(--plate0)"><path d="M50 12q10 0 11 12t-11 14q-11-2-11-14T50 12z"/></g>
<g fill="var(--sun)"><circle cx="45" cy="24" r="2.6"/><circle cx="55" cy="24" r="2.6"/></g>
<g stroke="var(--chalk)" stroke-width="2.6" fill="none" opacity=".6"><path d="M26 62h48M24 76h52M28 88h44"/></g>
<g stroke="var(--sun)" stroke-width="2" fill="none" opacity=".7" stroke-linecap="round"><path d="M32 44L20 34M68 44l12-10"/></g>`,

latentimage:`<g fill="var(--plate0)" stroke="var(--chalk)" stroke-width="3"><rect x="12" y="10" width="76" height="80" rx="2"/></g>
<g fill="var(--chalk)" opacity=".9"><path d="M50 22q14 0 16 16v14H34V38q2-16 16-16z"/></g>
<g fill="var(--chalk)" opacity=".6"><path d="M34 52h32l-3 16H37z"/></g>
<g fill="var(--chalk)" opacity=".3"><path d="M38 68h24l-3 14H41z"/></g>
<g fill="var(--plate0)"><ellipse cx="44" cy="36" rx="4" ry="6"/><ellipse cx="56" cy="36" rx="4" ry="6"/></g>
<g fill="var(--sun)"><circle cx="44" cy="35" r="2"/><circle cx="56" cy="35" r="2"/></g>
<g stroke="var(--sun)" stroke-width="1.6" fill="none" opacity=".5"><path d="M18 16h64M18 84h64"/></g>`,
};
export const artSvg = k => `<svg class="art" viewBox="0 0 100 100">${ART[k]||ART.grub}</svg>`;
