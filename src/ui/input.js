/* Input routing. One delegated click handler drives the whole game. */

import { Snd } from '../core/audio.js';
import { loadRun, save } from '../core/persist.js';
import { BUSY, C, EV, G, NEXT, PENDING, POTSEL, RW, SEL,
         setDEAD, setG, setNEXT, setPENDING, setPOTSEL, setSEL } from '../core/state.js';
import { mk, pick } from '../core/util.js';
import { fire, mod } from '../game/hooks.js';
import { drawC, endTurn, exhaustC, toHand } from '../game/combat.js';
import { nodeAt } from '../game/map.js';
import { addGold, adoptRun, gainCard, grantRelic, heal, newRun, offerCards, potMax, raiseMaxHp,
         rollRelic, spendGold, transformCard } from '../game/run.js';
import { closeSheet, paintBar } from './chrome.js';
import { renderHand, showPile, tapCard, tapFoe, usePot } from './combat-view.js';
import { enterNode, toMap } from './map-view.js';
import { actComplete, renderRewards } from './rewards.js';
import { grantChoice, relicChoice, removeFlow, renderHandSelect, showDeck, showRelics, upgradeFlow } from './sheets.js';
import { renderShop } from './shop.js';
import { removalPrice, restHeal, shopPrice } from './rooms.js';
import { howTo, title } from './title.js';

/* Every listener the game installs, in one place. Called once from main.js. */
export function bindInput(){
  /* ══════════════ input ══════════════ */
  document.addEventListener('click', ev => {
    const t = ev.target.closest('[data-a]');
    if(!t){
      if(POTSEL !== null){ setPOTSEL(null); renderHand(); }
      if(SEL !== null && C){ setSEL(null); renderHand(); }
      return;
    }
    const a = t.dataset.a, i = +t.dataset.i;
    switch(a){
      case 'new': setDEAD(false); closeSheet(); newRun(); break;
      case 'title': setDEAD(false); closeSheet(); title(); break;
      case 'resume': loadRun().then(r => { if(r){ setG(adoptRun(r)); setDEAD(false); paintBar(); toMap(); } }); break;
      case 'how': howTo(); break;
      case 'snd': Snd.boot(); Snd.mute(!Snd.on); if(!Snd.on) Snd.stopDrone(); else if(C) Snd.startDrone(); paintBar(); break;
      case 'close': closeSheet(); break;
      case 'close-map': closeSheet(); toMap(); break;
      case 'close-next': closeSheet(); (NEXT || toMap)(); setNEXT(null); break;
      case 'cancel': closeSheet(); if(PENDING && PENDING.cancel) PENDING.cancel(); break;
      case 'deck': showDeck(); break;
      case 'relic': showRelics(); break;
      case 'node': Snd.play('ui'); enterNode(i); break;
      case 'card': tapCard(i); break;
      case 'foe': tapFoe(i); break;
      case 'end': endTurn(); break;
      case 'pot': usePot(i); break;
      case 'usepot': usePot(i); closeSheet(); break;
      case 'pile': showPile(t.dataset.p); break;
      case 'potcard': { if(!PENDING || !PENDING.cards) return; const c = PENDING.cards[i];
        toHand(c.id, c.lvl, true); setPENDING(null); closeSheet(); Snd.play('card'); renderHand(); break; }
      case 'hsel': { if(!PENDING || !PENDING.sel) return;
        const at = PENDING.sel.indexOf(i);
        if(at >= 0) PENDING.sel.splice(at,1); else PENDING.sel.push(i);
        Snd.play('select'); renderHandSelect(); break; }
      case 'hdone': { if(!PENDING || !PENDING.sel || !C) return;
        const mode = PENDING.mode, picked = PENDING.sel.map(k => C.hand[k]).filter(Boolean);
        setPENDING(null); closeSheet();
        C.hand = C.hand.filter(c => !picked.includes(c));
        if(mode === 'discard'){ C.disc.push(...picked); drawC(picked.length); }
        else picked.forEach(c => exhaustC(c));
        renderHand(); break; }
      case 'dpick': { if(!C || !C.disc[i]) return;
        const c = C.disc.splice(i,1)[0];
        c.free = C.turn; C.hand.push(c);
        setPENDING(null); closeSheet(); Snd.play('card'); renderHand(); break; }
      case 'tomap': toMap(); break;
      case 'actdone': actComplete(); break;
      case 'pick': { if(!PENDING || !PENDING.cards) return; const c = PENDING.cards[i];
        gainCard(c); closeSheet(); Snd.play('card'); save(); const t = PENDING.then; setPENDING(null); t(); break; }
      case 'skipcard': { if(!PENDING) return; closeSheet(); const t = PENDING.then; setPENDING(null); t(); break; }
      case 'rem': { if(!PENDING) return; G.deck.splice(i,1); closeSheet(); Snd.play('exhaust'); save();
        const t = PENDING.then; setPENDING(null); t(); break; }
      case 'up': { if(!PENDING) return; G.deck[i].lvl = 1; closeSheet(); Snd.play('relic'); save();
        const t = PENDING.then; setPENDING(null); t(); break; }
      case 'dup': { if(!PENDING) return; gainCard({ ...G.deck[i] }); closeSheet(); Snd.play('card'); save();
        const t = PENDING.then; setPENDING(null); t(); break; }
      case 'bottle': { if(!PENDING) return; G.deck[i].bottle = t.dataset.k; closeSheet(); Snd.play('relic'); save();
        const th = PENDING.then; setPENDING(null); th(); break; }
      case 'xform': { if(!PENDING) return; transformCard(i); if(G.deck[i]) G.deck[i].lvl = 1;
        closeSheet(); Snd.play('relic'); save();
        const th = PENDING.then; setPENDING(null); th(); break; }
      case 'rw-card': grantChoice(RW.cards, '', { then: () => { RW.cardTaken = true; closeSheet(); renderRewards(); } }); break;
      case 'rw-card2': grantChoice(RW.cards2, '', { then: () => { RW.card2Taken = true; closeSheet(); renderRewards(); } }); break;
      case 'rw-bowl': RW.cardTaken = true; raiseMaxHp(2); Snd.play('relic'); renderRewards(); break;
      case 'rw-relic': { const id = RW.relics[RW.relicTaken]; RW.relicTaken++;
        grantRelic(id, () => renderRewards()); break; }
      case 'rw-bossrelic': relicChoice(RW.bossRelics,
        { flavor: 'Three of them, laid out on the cloth. The rest go back in the dark.',
          then: () => { RW.bossRelicTaken = true; renderRewards(); } }); break;
      case 'rpick': { if(!PENDING || !PENDING.relics) return; const id = PENDING.relics[i];
        const th = PENDING.then; setPENDING(null); closeSheet(); grantRelic(id, th); break; }
      case 'skiprelic': { if(!PENDING) return; closeSheet(); const th = PENDING.then; setPENDING(null); th(); break; }
      case 'rw-pot': if(G.pots.length < potMax()) G.pots.push(RW.pot); RW.potTaken = true; Snd.play('pot'); renderRewards(); break;
      case 'rest-heal': heal(restHeal()); fire('rested'); toMap(); break;
      case 'rest-up': fire('rested'); upgradeFlow(); break;
      case 'rest-remove': fire('rested'); removeFlow(); break;
      case 'rest-card': fire('rested'); grantChoice(offerCards(3, 0), 'A sleeve of old negatives, none of them yours.',
        { then: toMap, skip: true }); break;
      case 'rest-lift': { G.rc.girya = (G.rc.girya || 0) + 1; G.liftStr = (G.liftStr || 0) + 3;
        fire('rested'); Snd.play('relic'); toMap(); break; }
      case 'rest-dig': fire('rested'); grantRelic(rollRelic()); break;
      case 'take-treasure': {
        addGold(+t.dataset.g);
        if(t.dataset.c) gainCard(mk(pick(['leak','rot'])));
        const ids = (t.dataset.i || '').split(',').filter(Boolean);
        if(!ids.length){ toMap(); break; }
        let n = 0;
        const step = () => { if(n >= ids.length){ toMap(); return; } grantRelic(ids[n++], step); };
        step(); break; }
      case 'opt': { if(!EV) return; const o = EV.o[i]; if(o.cost && G.gold < o.cost) return; Snd.play('ui'); o.go(); break; }
      case 'buy': {
        const S = nodeAt(G.at).shop, k = t.dataset.k;
        if(k === 'card'){ const o = S.cards[i], p = shopPrice(o.price); if(o.sold || G.gold < p) return;
          spendGold(p); o.sold = true; gainCard(o.c); Snd.play('coin'); }
        else if(k === 'relic'){ const o = S.relics[i], p = shopPrice(o.price); if(o.sold || G.gold < p) return;
          spendGold(p); o.sold = true; save();
          grantRelic(o.r, () => renderShop(S)); return; }
        else if(k === 'pot'){ const o = S.pots[i], p = shopPrice(o.price);
          if(o.sold || G.gold < p || G.pots.length >= potMax() || mod('potionBlocked', false)) return;
          spendGold(p); o.sold = true; G.pots.push(o.p); Snd.play('coin'); }
        else if(k === 'remove'){ const p = removalPrice(); if(S.removed || G.gold < p) return;
          spendGold(p); S.removed = true; Snd.play('coin'); removeFlow(() => { closeSheet(); renderShop(S); }); return; }
        save(); renderShop(S); break;
      }
    }
  });
  document.getElementById('deckbtn').addEventListener('click', () => { if(G) showDeck(); });
  ['pointerdown','keydown'].forEach(ev => document.addEventListener(ev, () => { Snd.boot(); Snd.resume(); }));
  document.getElementById('modal').addEventListener('click', ev => {
    if(ev.target.id === 'modal' && document.querySelector('#sheet [data-a="close"]')) closeSheet();
  });
  document.addEventListener('keydown', ev => {
    if(ev.key === 'Escape'){
      if(document.getElementById('modal').classList.contains('on')){
        if(document.querySelector('#sheet [data-a="close"]')) closeSheet();
      } else if(POTSEL !== null){ setPOTSEL(null); renderHand(); }
      else if(SEL !== null && C){ setSEL(null); renderHand(); }
      return;
    }
    if(!C || BUSY) return;
    if(ev.key === 'e' || ev.key === 'Enter'){ endTurn(); }
    const n = parseInt(ev.key, 10);
    if(n >= 1 && n <= 9 && C.hand[n-1]) tapCard(n-1);
  });
  /* mouse users get a vertical wheel to scroll the horizontal hand/relic strips */
  [['hand'],['relicbar']].forEach(([id]) => {
    document.addEventListener('wheel', ev => {
      const el = document.getElementById(id);
      if(!el || !el.contains(ev.target)) return;
      if(el.scrollWidth <= el.clientWidth) return;
      if(Math.abs(ev.deltaY) <= Math.abs(ev.deltaX)) return;
      el.scrollLeft += ev.deltaY;
      ev.preventDefault();
    }, {passive:false});
  });
}
