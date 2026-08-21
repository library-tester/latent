/* Input routing. One delegated click handler drives the whole game. */

import { Snd } from '../core/audio.js';
import { loadRun, save } from '../core/persist.js';
import { BUSY, C, EV, G, NEXT, PENDING, RW, SEL, setDEAD, setG, setNEXT, setPENDING, setSEL } from '../core/state.js';
import { hasR } from '../data/relics.js';
import { endTurn } from '../game/combat.js';
import { nodeAt } from '../game/map.js';
import { addGold, adoptRun, grantRelic, heal, newRun, potMax } from '../game/run.js';
import { closeSheet, paintBar } from './chrome.js';
import { renderHand, showPile, tapCard, tapFoe, usePot } from './combat-view.js';
import { enterNode, toMap } from './map-view.js';
import { actComplete, renderRewards } from './rewards.js';
import { grantChoice, removeFlow, showDeck, showRelics, upgradeFlow } from './sheets.js';
import { renderShop } from './shop.js';
import { howTo, title } from './title.js';

/* Every listener the game installs, in one place. Called once from main.js. */
export function bindInput(){
  /* ══════════════ input ══════════════ */
  document.addEventListener('click', ev => {
    const t = ev.target.closest('[data-a]');
    if(!t){
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
      case 'tomap': toMap(); break;
      case 'actdone': actComplete(); break;
      case 'pick': { if(!PENDING || !PENDING.cards) return; const c = PENDING.cards[i];
        G.deck.push(c); closeSheet(); Snd.play('card'); save(); const t = PENDING.then; setPENDING(null); t(); break; }
      case 'skipcard': { if(!PENDING) return; closeSheet(); const t = PENDING.then; setPENDING(null); t(); break; }
      case 'rem': { if(!PENDING) return; G.deck.splice(i,1); closeSheet(); Snd.play('exhaust'); save();
        const t = PENDING.then; setPENDING(null); t(); break; }
      case 'up': { if(!PENDING) return; G.deck[i].lvl = 1; closeSheet(); Snd.play('relic'); save();
        const t = PENDING.then; setPENDING(null); t(); break; }
      case 'dup': { if(!PENDING) return; G.deck.push({ ...G.deck[i] }); closeSheet(); Snd.play('card'); save();
        const t = PENDING.then; setPENDING(null); t(); break; }
      case 'rw-card': grantChoice(RW.cards, '', { then: () => { RW.cardTaken = true; closeSheet(); renderRewards(); } }); break;
      case 'rw-relic': RW.relicTaken = true; grantRelic(RW.relic, () => renderRewards()); break;
      case 'rw-pot': if(G.pots.length < potMax()) G.pots.push(RW.pot); RW.potTaken = true; Snd.play('pot'); renderRewards(); break;
      case 'rest-heal': heal(Math.floor(G.maxHp * (hasR('darkkey') ? .50 : .35))); toMap(); break;
      case 'rest-up': upgradeFlow(); break;
      case 'take-treasure': { addGold(+t.dataset.g); const r = t.dataset.i; if(r) grantRelic(r); else toMap(); break; }
      case 'opt': { if(!EV) return; const o = EV.o[i]; if(o.cost && G.gold < o.cost) return; Snd.play('ui'); o.go(); break; }
      case 'buy': {
        const S = nodeAt(G.at).shop, k = t.dataset.k;
        if(k === 'card'){ const o = S.cards[i]; if(o.sold || G.gold < o.price) return;
          G.gold -= o.price; o.sold = true; G.deck.push(o.c); Snd.play('coin'); }
        else if(k === 'relic'){ const o = S.relics[i]; if(o.sold || G.gold < o.price) return;
          G.gold -= o.price; o.sold = true; G.relics.push(o.r); Snd.play('relic');
          if(o.r === 'ferro'){ G.maxHp += 12; G.hp += 12; }
          if(o.r === 'blackglass'){ G.maxHp -= 10; G.hp = Math.min(G.hp, G.maxHp); } }
        else if(k === 'pot'){ const o = S.pots[i]; if(o.sold || G.gold < o.price || G.pots.length >= potMax()) return;
          G.gold -= o.price; o.sold = true; G.pots.push(o.p); Snd.play('coin'); }
        else if(k === 'remove'){ if(S.removed || G.gold < 75) return;
          G.gold -= 75; S.removed = true; Snd.play('coin'); removeFlow(() => { closeSheet(); renderShop(S); }); return; }
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
      } else if(SEL !== null && C){ setSEL(null); renderHand(); }
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
