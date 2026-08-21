/* Every card in the game, plus how a card works out what it costs right now. */

import { C } from '../core/state.js';
import { R, pick } from '../core/util.js';
import { ENEMIES } from './enemies.js';
import { hasR } from './relics.js';
import { allSt, blk, drawC, est, exhaustC, hit, hitAll, light, pow, spendLight, toHand } from '../game/combat.js';
import { heal, loseHp } from '../game/run.js';
import { paintPlayer } from '../ui/combat-view.js';
import { flash, fxSelf, paintLight } from '../ui/fx.js';

/* ── cards ────────────────────────────────────────────────────
   v: values indexed by upgrade level. tg: needs a target.       */
export const V = (c, k) => CARDS[c.id].v[k][c.lvl || 0];
export const CARDS = {
/* starter */
burn:{n:'Burn',t:'attack',r:'starter',c:1,g:'flame',tg:1,v:{d:[6,9]},
  x:c=>`Deal <b>${V(c,'d')}</b> damage.`, p:(c,e)=>hit(e,V(c,'d'))},
dodge:{n:'Dodge',t:'skill',r:'starter',c:1,g:'shield',v:{b:[5,8]},
  x:c=>`Gain <i>${V(c,'b')}</i> Block.`, p:c=>blk(V(c,'b'))},
flare:{n:'Flare',t:'skill',r:'starter',c:0,g:'sun',v:{l:[3,5]},
  x:c=>`Gain <b>${V(c,'l')}</b> Light.`, p:c=>light(V(c,'l'))},
/* common */
scorch:{n:'Scorch',t:'attack',r:'common',c:1,g:'flame',tg:1,v:{d:[9,12]},
  x:c=>`Deal <b>${V(c,'d')}</b> damage.`, p:(c,e)=>hit(e,V(c,'d'))},
shutter:{n:'Shutter',t:'skill',r:'common',c:1,g:'shield',v:{b:[8,11]},
  x:c=>`Gain <i>${V(c,'b')}</i> Block.`, p:c=>blk(V(c,'b'))},
doubleexp:{n:'Double Exposure',t:'attack',r:'common',c:1,g:'twin',tg:1,v:{d:[4,6]},
  x:c=>`Deal <b>${V(c,'d')}</b> damage twice.`, p:(c,e)=>{hit(e,V(c,'d'));hit(e,V(c,'d'));}},
stopbath:{n:'Stop Bath',t:'attack',r:'common',c:1,g:'drop',tg:1,v:{d:[7,9],w:[1,2]},
  x:c=>`Deal <b>${V(c,'d')}</b> damage. Apply ${V(c,'w')} Weak.`,
  p:(c,e)=>{hit(e,V(c,'d'));est(e,'weak',V(c,'w'));}},
pin:{n:'Pin',t:'attack',r:'common',c:0,g:'pin',tg:1,v:{d:[3,5],u:[1,2]},
  x:c=>`Deal <b>${V(c,'d')}</b> damage. Apply ${V(c,'u')} Vulnerable.`,
  p:(c,e)=>{hit(e,V(c,'d'));est(e,'vuln',V(c,'u'));}},
silver:{n:'Silver',t:'skill',r:'common',c:1,g:'sun',v:{l:[4,6]},
  x:c=>`Gain <b>${V(c,'l')}</b> Light. Draw 1.`, p:c=>{light(V(c,'l'));drawC(1);}},
emulsion:{n:'Emulsion',t:'skill',r:'common',c:1,g:'drop',v:{b:[5,7],l:[3,4]},
  x:c=>`Gain <i>${V(c,'b')}</i> Block and <b>${V(c,'l')}</b> Light.`,
  p:c=>{blk(V(c,'b'));light(V(c,'l'));}},
contact:{n:'Contact Sheet',t:'skill',r:'common',c:0,g:'cards',ex:1,v:{n:[2,3]},
  x:c=>`Draw ${V(c,'n')}. Exhaust.`, p:c=>drawC(V(c,'n'))},
sparkgap:{n:'Spark Gap',t:'attack',r:'common',c:1,g:'bolt',v:{d:[5,7]},
  x:c=>`Deal <b>${V(c,'d')}</b> damage to ALL.`, p:c=>hitAll(V(c,'d'))},
fog:{n:'Fog',t:'skill',r:'common',c:1,g:'fog',v:{w:[2,3]},
  x:c=>`Apply ${V(c,'w')} Weak to ALL.`, p:c=>allSt('weak',V(c,'w'))},
bellows:{n:'Bellows',t:'skill',r:'common',c:1,g:'shield',v:{b:[6,8],e:[3,5]},
  x:c=>`Gain <i>${V(c,'b')}</i> Block. If Light 5+, <i>${V(c,'e')}</i> more.`,
  p:c=>{blk(V(c,'b'));if(C&&C.light>=5)blk(V(c,'e'));}},
gaslight:{n:'Gaslight',t:'attack',r:'common',c:2,g:'flame',tg:1,v:{d:[14,18]},
  x:c=>`Deal <b>${V(c,'d')}</b> damage.`, p:(c,e)=>hit(e,V(c,'d'))},
/* uncommon */
overexpose:{n:'Overexpose',t:'attack',r:'uncommon',c:2,g:'burst',tg:1,v:{m:[2,3]},
  x:c=>`Spend all Light. Deal <b>${V(c,'m')}×Light</b> damage.`,
  p:(c,e)=>{const l=spendLight();hit(e,l*V(c,'m'));if(l>0)flash();}},
solarize:{n:'Solarize',t:'skill',r:'uncommon',c:1,g:'lens',v:{b:[4,7]},
  x:c=>`Spend all Light. Gain <i>Light+${V(c,'b')}</i> Block.`,
  p:c=>{const l=spendLight();blk(l+V(c,'b'));}},
swarm:{n:'Swarm',t:'attack',r:'uncommon',c:2,g:'swarm',tg:1,v:{d:[3,4]},
  x:c=>`Deal <b>${V(c,'d')}</b> damage 4 times.`,
  p:(c,e)=>{for(let i=0;i<4;i++) hit(e,V(c,'d'));}},
cyanide:{n:'Cyanide Wash',t:'skill',r:'uncommon',c:1,g:'vial',tg:1,v:{t:[5,8]},
  x:c=>`Apply ${V(c,'t')} Tarnish.`, p:(c,e)=>est(e,'tarnish',V(c,'t'))},
aperture:{n:'Aperture',t:'power',r:'uncommon',c:1,g:'lens',v:{s:[2,3]},
  x:c=>`Gain ${V(c,'s')} Strength.`, p:c=>{if(!C)return;C.str+=V(c,'s');fxSelf('+'+V(c,'s')+' STR','lit');}},
glassplate:{n:'Glass Plate',t:'skill',r:'uncommon',c:2,g:'plate',v:{b:[14,18]},
  x:c=>`Gain <i>${V(c,'b')}</i> Block.`, p:c=>blk(V(c,'b'))},
flashpowder:{n:'Flashpowder',t:'skill',r:'uncommon',c:1,g:'burst',ex:1,v:{l:[6,9]},
  x:c=>`Gain <b>${V(c,'l')}</b> Light. Draw 2. Exhaust.`, p:c=>{light(V(c,'l'));drawC(2);}},
ignite:{n:'Ignite',t:'attack',r:'uncommon',c:1,g:'flame',tg:1,v:{d:[8,11],l:[4,5]},
  x:c=>`Deal <b>${V(c,'d')}</b> damage. Gain <b>${V(c,'l')}</b> Light.`,
  p:(c,e)=>{hit(e,V(c,'d'));light(V(c,'l'));}},
longexp:{n:'Long Exposure',t:'attack',r:'uncommon',c:3,g:'clock',tg:1,v:{d:[22,29]},
  x:c=>`Deal <b>${V(c,'d')}</b> damage.`, p:(c,e)=>hit(e,V(c,'d'))},
safelight:{n:'Safelight',t:'skill',r:'uncommon',c:1,g:'eye',v:{b:[5,8],w:[1,2]},
  x:c=>`Gain <i>${V(c,'b')}</i> Block. Apply ${V(c,'w')} Weak to ALL.`,
  p:c=>{blk(V(c,'b'));allSt('weak',V(c,'w'));}},
blowout:{n:'Blowout',t:'skill',r:'uncommon',c:1,g:'burst',v:{u:[2,3]},
  x:c=>`Spend 5 Light: apply ${V(c,'u')} Vulnerable to ALL.`,
  req:()=>!!C&&C.light>=5, p:c=>{if(!C)return;C.light-=5;paintLight();allSt('vuln',V(c,'u'));flash();}},
pushproc:{n:'Push Process',t:'skill',r:'uncommon',c:0,g:'bolt',v:{h:[3,2]},
  x:c=>`Lose ${V(c,'h')} HP. Gain 2 Energy.`, p:c=>{loseHp(V(c,'h'));if(C)C.energy+=2;}},
/* rare */
latentimg:{n:'Latent Image',t:'power',r:'rare',c:2,g:'moth',v:{l:[3,4]},
  x:c=>`Power: gain <b>${V(c,'l')}</b> Light at end of turn.`,
  p:c=>pow('latent',V(c,'l'))},
halation:{n:'Halation',t:'power',r:'rare',c:2,g:'burst',v:{d:[5,7]},
  x:c=>`Power: end of turn, if Light 5+, deal <b>${V(c,'d')}</b> to ALL.`,
  p:c=>pow('halation',V(c,'d'))},
reciprocity:{n:'Reciprocity',t:'power',r:'rare',c:3,g:'clock',v:{s:[2,3]},
  x:c=>`Power: gain ${V(c,'s')} Strength each turn.`,
  p:c=>pow('recip',V(c,'s'))},
fixer:{n:'Fixer',t:'power',r:'rare',c:2,g:'vial',v:{b:[5,7],l:[2,3]},
  x:c=>`Power: each turn gain <i>${V(c,'b')}</i> Block, <b>${V(c,'l')}</b> Light.`,
  p:c=>{pow('fixb',V(c,'b'));pow('fixl',V(c,'l'));}},
whiteout:{n:'Whiteout',t:'attack',r:'rare',c:3,g:'sun',tg:1,ex:1,v:{m:[3,4]},
  x:c=>`Spend all Light. Deal <b>${V(c,'m')}×Light</b> damage. Exhaust.`,
  p:(c,e)=>{const l=spendLight();if(l>0)flash();hit(e,l*V(c,'m'));}},
reclaim:{n:'Reclaim Silver',t:'attack',r:'rare',c:2,g:'hand',tg:1,v:{d:[12,16],h:[4,6]},
  x:c=>`Deal <b>${V(c,'d')}</b> damage. Heal ${V(c,'h')} HP.`,
  p:(c,e)=>{hit(e,V(c,'d'));heal(V(c,'h'));}},
/* common — second set */
undercut:{n:'Undercut',t:'attack',r:'common',c:1,g:'twin',tg:1,v:{d:[6,8],b:[4,6]},
  x:c=>`Deal <b>${V(c,'d')}</b> damage. Gain <i>${V(c,'b')}</i> Block.`,
  p:(c,e)=>{hit(e,V(c,'d'));blk(V(c,'b'));}},
rinse:{n:'Rinse',t:'skill',r:'common',c:0,g:'drop',v:{b:[4,6]},
  x:c=>`Gain <i>${V(c,'b')}</i> Block.`, p:c=>blk(V(c,'b'))},
grainc:{n:'Grain',t:'attack',r:'common',c:1,g:'swarm',v:{d:[3,4]},
  x:c=>`Deal <b>${V(c,'d')}</b> damage 3 times, at random.`,
  p:c=>{for(let i=0;i<3;i++){const a=C&&C.foes.filter(f=>f.alive);if(!a||!a.length)break;hit(pick(a),V(c,'d'));}}},
tripod:{n:'Tripod',t:'skill',r:'common',c:2,g:'plate',v:{b:[12,15],l:[2,3]},
  x:c=>`Gain <i>${V(c,'b')}</i> Block and <b>${V(c,'l')}</b> Light.`,
  p:c=>{blk(V(c,'b'));light(V(c,'l'));}},
snapshot:{n:'Snapshot',t:'attack',r:'common',c:0,g:'lens',tg:1,ex:1,v:{d:[5,8]},
  x:c=>`Deal <b>${V(c,'d')}</b> damage. Exhaust.`, p:(c,e)=>hit(e,V(c,'d'))},
wicktrim:{n:'Wick Trim',t:'attack',r:'common',c:1,g:'flame',tg:1,v:{d:[7,9],e:[4,6]},
  x:c=>`Deal <b>${V(c,'d')}</b>. If Light 5+, deal <b>${V(c,'e')}</b> more.`,
  p:(c,e)=>{hit(e,V(c,'d'));if(C&&C.light>=5)hit(e,V(c,'e'));}},
/* uncommon — second set */
plateslam:{n:'Plate Slam',t:'attack',r:'uncommon',c:1,g:'plate',tg:1,v:{},
  x:()=>`Deal damage equal to your <i>Block</i>.`, p:(c,e)=>hit(e,C?C.block:0)},
doublecoat:{n:'Double Coat',t:'skill',r:'uncommon',c:2,cu:1,g:'shield',v:{},
  x:()=>`Double your <i>Block</i>.`, p:c=>{if(C)blk(C.block);}},
burnin:{n:'Burn-in',t:'attack',r:'uncommon',c:2,g:'flame',tg:1,v:{d:[9,13],u:[2,2]},
  x:c=>`Deal <b>${V(c,'d')}</b> damage. Apply ${V(c,'u')} Vulnerable.`,
  p:(c,e)=>{hit(e,V(c,'d'));est(e,'vuln',V(c,'u'));}},
reversal:{n:'Reversal',t:'skill',r:'uncommon',c:1,g:'lens',v:{n:[4,3]},
  x:c=>`Spend all Light. +1 Strength per ${V(c,'n')} spent.`,
  p:c=>{const l=spendLight();const st=Math.floor(l/V(c,'n'));if(C&&st>0){C.str+=st;fxSelf('+'+st+' STR','lit');}}},
stopdown:{n:'Stop Down',t:'skill',r:'uncommon',c:1,g:'shield',tg:1,v:{b:[8,11],w:[1,2]},
  x:c=>`Gain <i>${V(c,'b')}</i> Block. Apply ${V(c,'w')} Weak.`,
  p:(c,e)=>{blk(V(c,'b'));est(e,'weak',V(c,'w'));}},
chemistry:{n:'Chemistry',t:'skill',r:'uncommon',c:1,g:'vial',v:{t:[3,5]},
  x:c=>`Apply ${V(c,'t')} Tarnish to ALL.`, p:c=>allSt('tarnish',V(c,'t'))},
winder:{n:'Winder',t:'skill',r:'uncommon',c:1,g:'cards',v:{n:[2,3]},
  x:c=>`Draw ${V(c,'n')} cards.`, p:c=>drawC(V(c,'n'))},
/* rare — second set */
silverbloom:{n:'Silver Bloom',t:'power',r:'rare',c:2,g:'burst',v:{d:[1,2]},
  x:c=>`Power: gaining Light deals <b>${V(c,'d')}</b> to a random enemy.`,
  p:c=>pow('bloom',V(c,'d'))},
retention:{n:'Retention',t:'power',r:'rare',c:3,cu:2,g:'shield',v:{},
  x:()=>`Power: your Block is no longer lost each turn.`, p:c=>pow('barricade',1)},
overdevelop:{n:'Overdevelop',t:'power',r:'rare',c:3,g:'clock',v:{l:[3,4]},
  x:c=>`Power: each turn gain <b>${V(c,'l')}</b> Light and 1 Strength.`,
  p:c=>{pow('odl',V(c,'l'));pow('recip',1);}},
ghostimg:{n:'Ghost Image',t:'power',r:'rare',c:2,g:'eye',v:{},
  x:()=>`Power: prevent the first damage you take each turn.`, p:c=>pow('ghost',1)},
hollowsun:{n:'Hollow Sun',t:'attack',r:'rare',c:3,g:'sun',ex:1,v:{d:[10,14]},
  x:c=>`Spend all Light. Deal <b>${V(c,'d')}+Light</b> to ALL. Exhaust.`,
  p:c=>{const l=spendLight();if(l>0)flash();hitAll(V(c,'d')+l);}},
/* common — third set */
puresilver:{n:'Pure Silver',t:'attack',r:'common',c:0,g:'ingot',tg:1,v:{d:[14,18]},
  x:c=>`Playable only if your hand is all Attacks. Deal <b>${V(c,'d')}</b> damage.`,
  req:()=>!!C && C.hand.every(h => CARDS[h.id].t === 'attack'),
  p:(c,e)=>hit(e,V(c,'d'))},
forcedev:{n:'Forced Development',t:'skill',r:'common',c:0,g:'up',v:{s:[2,3]},
  x:c=>`Gain ${V(c,'s')} Strength. Lose it at end of turn.`,
  p:c=>{if(!C)return;const s=V(c,'s');C.str+=s;C.tempStr+=s;fxSelf('+'+s+' STR','lit');paintPlayer();}},
/* uncommon — third set */
whirlwind:{n:'Sweep',t:'attack',r:'uncommon',c:0,xc:1,g:'wave',v:{d:[5,7]},
  x:c=>`Spend all Energy. Deal <b>${V(c,'d')}</b> damage to ALL, X times.`,
  p:(c,t,x)=>{for(let i=0;i<x;i++){if(!C||C.over)break;hitAll(V(c,'d'));}}},
rampage:{n:'Runaway Development',t:'attack',r:'uncommon',c:1,g:'spool',tg:1,v:{d:[8,8],e:[5,7]},
  x:c=>`Deal <b>${V(c,'d')+(c.up||0)}</b> damage. Its damage grows by ${V(c,'e')} for the rest of combat.`,
  p:(c,e)=>{hit(e,V(c,'d')+(c.up||0));c.up=(c.up||0)+V(c,'e');}},
feelnopain:{n:'Numb Fixer',t:'power',r:'uncommon',c:1,g:'vial',v:{b:[3,5]},
  x:c=>`Power: whenever a card is Exhausted, gain <i>${V(c,'b')}</i> Block.`,
  p:c=>pow('fnp',V(c,'b'))},
darkembrace:{n:'Dark Slide',t:'power',r:'uncommon',c:2,cu:1,g:'cards',v:{},
  x:()=>`Power: whenever a card is Exhausted, draw 1.`, p:c=>pow('embrace',1)},
combust:{n:'Flashover',t:'power',r:'uncommon',c:1,g:'burst',v:{d:[5,7]},
  x:c=>`Power: at end of turn, lose 1 HP and deal <b>${V(c,'d')}</b> damage to ALL.`,
  p:c=>pow('combust',V(c,'d'))},
flamebarrier:{n:'Sear Plate',t:'skill',r:'uncommon',c:2,g:'shield',v:{b:[12,16],d:[4,6]},
  x:c=>`Gain <i>${V(c,'b')}</i> Block. This turn, anything that attacks you takes <b>${V(c,'d')}</b>.`,
  p:c=>{blk(V(c,'b'));if(C){C.retal+=V(c,'d');paintPlayer();}}},
sentinel:{n:'Standby Plate',t:'skill',r:'uncommon',c:1,g:'plate',v:{b:[6,9],e:[2,3]},
  x:c=>`Gain <i>${V(c,'b')}</i> Block. If this is Exhausted, gain ${V(c,'e')} Energy.`,
  onEx:c=>{if(!C)return;C.energy+=V(c,'e');fxSelf('+'+V(c,'e')+' ENERGY','lit');paintPlayer();},
  p:c=>blk(V(c,'b'))},
dualwield:{n:'Duplicate Negative',t:'skill',r:'uncommon',c:1,g:'twin',v:{n:[1,2]},
  x:c=>`Add ${V(c,'n')===1?'a copy':V(c,'n')+' copies'} of a random Attack in your hand to your hand.`,
  p:c=>{if(!C)return;const a=C.hand.filter(h=>CARDS[h.id].t==='attack');if(!a.length)return;
    const s=pick(a);for(let i=0;i<V(c,'n');i++)toHand(s.id,s.lvl);}},
infernal:{n:'Contact Print',t:'skill',r:'uncommon',c:1,cu:0,g:'cards',ex:1,v:{},
  x:()=>`Add a random Attack that costs 0 this turn. Exhaust.`,
  p:c=>{toHand(pick(ATKPOOL()),0,true);}},
burningpact:{n:'Sacrificial Print',t:'skill',r:'uncommon',c:1,g:'blade',v:{n:[2,3]},
  x:c=>`Exhaust a random card in your hand. Draw ${V(c,'n')}.`,
  p:c=>{if(!C)return;if(C.hand.length){const j=R(C.hand.length),h=C.hand[j];C.hand.splice(j,1);exhaustC(h);}
    if(C&&!C.over)drawC(V(c,'n'));}},
hemo:{n:'Blood Developer',t:'attack',r:'uncommon',c:1,g:'heart',tg:1,v:{d:[15,20],h:[3,3]},
  x:c=>`Lose ${V(c,'h')} HP. Deal <b>${V(c,'d')}</b> damage.`,
  p:(c,e)=>{loseHp(V(c,'h'));if(C&&!C.over)hit(e,V(c,'d'));}},
secondwind:{n:'Purge Bath',t:'skill',r:'uncommon',c:1,g:'drop',v:{b:[5,7]},
  x:c=>`Exhaust every non-Attack in your hand. Gain <i>${V(c,'b')}</i> Block for each.`,
  p:c=>{if(!C)return;const out=C.hand.filter(h=>CARDS[h.id].t!=='attack');
    C.hand=C.hand.filter(h=>CARDS[h.id].t==='attack');
    for(const h of out){if(!C||C.over)break;exhaustC(h);if(C&&!C.over)blk(V(c,'b'));}}},
powerthrough:{n:'Fogged Stock',t:'skill',r:'uncommon',c:1,g:'fog',v:{b:[18,23]},
  x:c=>`Add 2 Light Leaks to your hand. Gain <i>${V(c,'b')}</i> Block.`,
  p:c=>{toHand('leak');toHand('leak');blk(V(c,'b'));}},
firebreath:{n:'Pyrograph',t:'power',r:'uncommon',c:1,g:'flame',v:{d:[2,3]},
  x:c=>`Power: whenever you play an Attack, deal <b>${V(c,'d')}</b> damage to ALL.`,
  p:c=>pow('fbreath',V(c,'d'))},
spotweak:{n:'Read the Meter',t:'skill',r:'uncommon',c:1,g:'eye',tg:1,v:{s:[3,4]},
  x:c=>`If the target intends to attack, gain ${V(c,'s')} Strength.`,
  p:(c,e)=>{if(!C||!e)return;const mv=ENEMIES[e.key].m[e.intent];
    const I=mv?(typeof mv.i==='function'?mv.i(e):mv.i):null;
    if(I&&(I.t==='atk'||(I.t==='def'&&I.d))){C.str+=V(c,'s');fxSelf('+'+V(c,'s')+' STR','lit');paintPlayer();}}},
dropkick:{n:'Follow Through',t:'attack',r:'uncommon',c:1,g:'bolt',tg:1,v:{d:[6,8]},
  x:c=>`Deal <b>${V(c,'d')}</b> damage. If it is Vulnerable, gain 1 Energy and draw 1.`,
  p:(c,e)=>{const v=!!(e&&e.st.vuln>0);hit(e,V(c,'d'));if(v&&C&&!C.over){C.energy++;drawC(1);paintPlayer();}}},
carnage:{n:'Ethereal Frame',t:'attack',r:'uncommon',c:2,g:'moth',tg:1,eth:1,v:{d:[20,26]},
  x:c=>`Ethereal — burns away if held at end of turn. Deal <b>${V(c,'d')}</b> damage.`,
  p:(c,e)=>hit(e,V(c,'d'))},
/* rare — third set */
corruption:{n:'Total Solarization',t:'power',r:'rare',c:3,cu:2,g:'crack',v:{},
  x:()=>`Power: your Skills cost 0, but Exhaust when played.`, p:c=>pow('corrupt',1)},
doubletap:{n:'Second Pass',t:'skill',r:'rare',c:1,g:'twin',v:{n:[1,2]},
  x:c=>`This turn, your next ${V(c,'n')===1?'Attack is':V(c,'n')+' Attacks are'} played twice.`,
  p:c=>{if(!C)return;C.dbl+=V(c,'n');fxSelf('SECOND PASS','lit');}},
juggernaut:{n:'Anvil',t:'power',r:'rare',c:2,g:'anvil',v:{d:[5,7]},
  x:c=>`Power: whenever you gain Block, deal <b>${V(c,'d')}</b> to a random enemy.`,
  p:c=>pow('jugg',V(c,'d'))},
reaper:{n:'Harvest',t:'attack',r:'rare',c:2,g:'heart',ex:1,v:{d:[8,10]},
  x:c=>`Deal <b>${V(c,'d')}</b> to ALL. Heal HP equal to damage that got through. Exhaust.`,
  p:c=>{if(!C)return;C.leech=0;hitAll(V(c,'d'));const g=C?C.leech:0;if(C)C.leech=null;if(g>0)heal(g);}},
fiendfire:{n:'Contact Burn',t:'attack',r:'rare',c:2,g:'blade',tg:1,ex:1,v:{d:[7,10]},
  x:c=>`Exhaust your hand. Deal <b>${V(c,'d')}</b> damage for each card Exhausted. Exhaust.`,
  p:(c,e)=>{if(!C)return;const h=[...C.hand];C.hand=[];
    for(const k of h){if(!C||C.over)break;exhaustC(k);}
    for(let i=0;i<h.length;i++){if(!C||C.over)break;hit(e,V(c,'d'));}}},
/* curse */
leak:{n:'Light Leak',t:'curse',r:'curse',c:0,g:'skull',un:1,v:{},
  x:()=>`Unplayable. It sits in hand and fogs the plate.`, p:()=>{}},
rot:{n:'Silver Rot',t:'curse',r:'curse',c:0,g:'skull',un:1,v:{},
  x:()=>`Unplayable. Lose 1 HP at end of turn while in hand.`, p:()=>{}},
};
export const POOL = r => Object.keys(CARDS).filter(k => CARDS[k].r === r);
export const baseCost = c => { const d = CARDS[c.id]; return (c.lvl && d.cu !== undefined) ? d.cu : d.c; };
export function costOf(c, live){
  const d = CARDS[c.id];
  let n = baseCost(c);
  if(live && C){
    // a card made free for the turn, or any Skill under Total Solarization
    if(c.free === C.turn || (C.powers.corrupt && d.t === 'skill')) return 0;
    if(hasR('contactframe') && !C.playedThisTurn) n = Math.max(0, n - 1);
  }
  return n;
}
/* attacks Contact Print can conjure — X-cost ones can't be handed out free */
export const ATKPOOL = () => Object.keys(CARDS).filter(k =>
  CARDS[k].t === 'attack' && CARDS[k].r !== 'starter' && !CARDS[k].xc);
