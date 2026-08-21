/* The title screen and the how-to-play sheet. */

import { best, loadRun } from '../core/persist.js';
import { setC } from '../core/state.js';
import { ROMAN } from '../core/util.js';
import { ACTS } from '../data/acts.js';
import { artSvg } from '../data/art.js';
import { openSheet, paintBar, setScene } from './chrome.js';

/* ══════════════ title ══════════════ */
export async function title(){
  setC(null); paintBar();
  const saved = await loadRun();
  const b = await best();
  setScene(`<div class="center pad">
    <div class="hero">${artSvg('collector')}</div>
    <div id="titlemark">LATENT</div>
    <div class="rule" style="width:min(320px,70vw)"></div>
    <div class="sub">A deckbuilder in three acts. Climb the archive, the gallery and the aperture, gather Light, and fix the image before it fogs.</div>
    <div class="row" style="margin-top:6px">
      ${saved ? `<button class="btn primary" data-a="resume">Resume descent</button>` : ''}
      <button class="btn ${saved?'':'primary'}" data-a="new">${saved ? 'New run' : 'Begin descent'}</button>
    </div>
    <div class="tag" style="margin-top:10px">${b ? (b >= 4000 ? 'the image held — all three acts'
      : 'furthest — ' + (ACTS[Math.floor(b/1000)]||ACTS[1]).n + ', plate ' + ROMAN[(b%1000)-1]) : 'no plates recorded'}</div>
    <button class="tag" data-a="how" style="border:1px solid #3e7ca655;padding:7px 12px;border-radius:2px">How to play</button>
  </div>`);
}
export function howTo(){
  openSheet(`<header><span class="title">How to play</span></header><div class="body">
   <p style="font-size:13px;color:#cfe0ea">Each turn you get <b>3 Energy</b> and draw 5 cards. Play cards to deal damage or gain <i>Block</i>. Block is spent absorbing damage and disappears at the start of your next turn.</p>
   <p style="font-size:13px;color:#cfe0ea">Enemies show their <b>intent</b> above them — the exact damage they will deal, a shield if they are guarding, an arrow if they are strengthening or weakening.</p>
   <p style="font-size:13px;color:#cfe0ea"><b style="color:var(--sun)">Light</b> is this deck's engine. Many cards add Light; a few spend all of it at once for a payoff that scales with how much you saved. The plate brightens as it builds.</p>
   <div class="deckline"><span>Weak</span><span>deals 25% less damage</span></div>
   <div class="deckline"><span>Vulnerable</span><span>takes 50% more damage</span></div>
   <div class="deckline"><span>Tarnish</span><span>loses that much HP each turn, then fades by 1</span></div>
   <div class="deckline"><span>Strength</span><span>adds to every hit of an attack</span></div>
   <div class="deckline"><span>Thorns</span><span>hurts you back when you attack it</span></div>
   <div class="deckline"><span>Dexterity</span><span>adds to every Block a card gives</span></div>
   <div class="deckline"><span>Frail</span><span>Block from cards is 25% weaker</span></div>
   <div class="deckline"><span>Artifact</span><span>swallows the next debuff aimed at you</span></div>
   <div class="deckline"><span>Intangible</span><span>every hit this turn is reduced to 1</span></div>
   <div class="deckline"><span>Plated Armour</span><span>Block each turn; one plate falls off per hit taken</span></div>
   <div class="deckline"><span>Regeneration</span><span>heals you at the end of your turn, then fades by 1</span></div>
   <div class="deckline"><span>Exhaust</span><span>the card is gone for the rest of the fight</span></div>
   <div class="deckline"><span>Ethereal</span><span>Exhausts itself if still in hand when the turn ends</span></div>
   <div class="deckline"><span>Cost X</span><span>spends every Energy you have left, and scales with it</span></div>
   <p style="font-size:13px;color:#cfe0ea;margin-top:12px">Tap a card to play it. Attacks that could hit several enemies ask you to tap a target. Number keys and Enter work on a desktop.</p>
   <p style="font-size:13px;color:#cfe0ea">Ampoules sit beside the End turn button. Some ask you to tap an enemy first; some open a tray and let you choose.</p>
   <p style="font-size:13px;color:#cfe0ea">The speaker button in the top bar turns sound off and on. Your run saves itself, so you can close the tab mid-descent.</p>
   </div><footer><button class="btn" data-a="close">Close</button></footer>`);
}
