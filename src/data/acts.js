/* The three acts: which specimens they draw from, and the shape of their maps. */

/* Three acts, each its own map and bestiary. Ten / seventeen / sixteen ordinary
   specimens, three elites and three possible bosses apiece. */
export const ACTS = {
1:{n:'The Archive', sub:'Plates, vermin, and whatever still eats silver down here.',
   easy:[['fish','fish','fish'],['moth','moth'],['grub'],['fish','moth'],['fume'],['foxfire','fish']],
   mid:[['grub','moth'],['jar'],['foxfire','foxfire'],['fish','fish','grub'],['moth','moth','moth'],
        ['blot'],['beetle'],['fume','fume'],['wickmaid','fish','fish']],
   hard:[['wader'],['jar','moth'],['grub','grub','foxfire'],['wader','fish','fish'],['jar','foxfire'],
         ['beetle','moth'],['blot','foxfire'],['wickmaid','grub'],['jar','fume'],['beetle','fume']],
   elite:[['archivist'],['halide','halide'],['warden'],['archivist','fish'],['halide','wickmaid']],
   boss:['collector','emulsion','press']},
2:{n:'The Gallery', sub:'What the archive chose to hang — and what came to look at it.',
   easy:[['saltprint','saltfade'],['platerat','platerat'],['frame'],['rope','saltprint'],
         ['chandel'],['twina','twinb']],
   mid:[['cabinet'],['sitter'],['ratnest'],['varnish','saltfade'],['ambro'],['usher','platerat'],
        ['frame','rope'],['wax','chandel'],['retoucher','saltprint']],
   hard:[['negman'],['cabinet','ambro'],['sitter','retoucher'],['usher','wax'],['varnish','varnish'],
         ['negman','rope'],['ratnest','platerat'],['ambro','chandel'],['sitter','twina','twinb'],
         ['cabinet','usher']],
   elite:[['curator'],['vitrine'],['choir'],['curator','frame'],['vitrine','saltfade']],
   boss:['salon','argentine','longgallery']},
3:{n:'The Aperture', sub:'No plates here. Only the light, and what it has made of itself.',
   easy:[['caustic'],['shardb','shardb'],['lumen'],['diffract'],['penumbra','shardb'],['solarghost']],
   mid:[['airydisc'],['overexp'],['sharda'],['photonchoir'],['umbra'],['corona','shardb'],
        ['theburn'],['lumen','solarghost'],['caustic','diffract']],
   hard:[['blackbody'],['apblade'],['unfixed'],['overexp','umbra'],['theburn','corona'],
         ['blackbody','penumbra'],['apblade','sharda'],['unfixed','lumen'],
         ['airydisc','photonchoir'],['umbra','umbra']],
   elite:[['shutterelite'],['heliograph'],['silentframe'],['shutterelite','shardb'],
          ['heliograph','penumbra']],
   boss:['aperture','daguerre','theimage']},
};

/* Each act is one map. Rows grow act to act, and every plan ends on the boss. */
export const ROW_PLAN = {
1:[['fight'],['fight','event'],['fight','event','shop'],['fight','fight','event'],
   ['treasure'],['fight','fight','elite','event'],['rest'],['fight','event','shop','event'],
   ['fight','elite','fight','event'],['fight','event','shop'],['elite','fight','fight','event'],
   ['treasure'],['fight','elite','event','shop'],['rest'],['boss']],
2:[['fight'],['fight','event'],['fight','fight','event'],['fight','elite','event','shop'],
   ['treasure'],['fight','fight','elite','event'],['rest'],['fight','event','shop','event'],
   ['fight','elite','fight','event'],['fight','fight','event','shop'],['elite','fight','fight','event'],
   ['treasure'],['fight','elite','event','shop'],['fight','event','shop'],['rest'],['boss']],
3:[['fight'],['fight','event'],['fight','fight','event'],['fight','elite','event','shop'],
   ['treasure'],['fight','elite','fight','event'],['rest'],['fight','event','shop','event'],
   ['fight','elite','fight','event'],['fight','fight','event','shop'],['elite','fight','fight','event'],
   ['treasure'],['fight','elite','event','shop'],['fight','fight','event'],['elite','fight','event','shop'],
   ['rest'],['boss']]};
