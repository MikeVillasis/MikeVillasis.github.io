// The crate: picking a record pulls it out of the crate and into the player.
// This module decides WHAT the crate looks like for a pick: the picked record gets
// data-state="out", every record in front of it (lower --i) is "flipped" forward, every record
// behind stays "standing". CSS (css/crate.css) turns those states into transforms.
// js/dig.js decides HOW to get there: the hands put the open record back, flip through the pile
// and pull the new one out (or, with reduced motion, an instant swap). The player is recoloured
// and retitled when the record lands, and the URL hash stays in sync (#credits).
// Introduction sits at the front of the crate, Contact Me at the back.

import { createTabs } from './tabs.js';
import { createDig } from './dig.js';

export function initShelf() {
    const records = document.querySelector('.crate__records');
    const player = document.getElementById('player');
    if (!records || !player) return;

    const now = {
        title: player.querySelector('.player__title'),
        code: player.querySelector('.player__code'),
    };

    const dig = createDig({
        scene: records.closest('.crate__scene') ?? records.parentElement,
        sleeves: [...records.querySelectorAll('[role="tab"]')],
        player,
    });

    let open = -1;      // index of the record in the player
    let deepLink = false;
    let animated = false;
    let restoreHash = null;

    const crate = createTabs(records, {
        // Records stand front-to-back, so "up" walks deeper into the crate
        nextKeys: ['ArrowUp', 'ArrowRight'],
        prevKeys: ['ArrowDown', 'ArrowLeft'],
        onSelect(sleeve, record, { initial }) {
            const id = sleeve.dataset.record;
            const picked = crate.tabs.indexOf(sleeve);
            if (!initial) {
                restoreHash = null;
                history.replaceState(null, '', `#${id}`);
            }

            // Picking the open record again: nothing to dig for
            if (picked === open) {
                if (!dig.running) bringIntoView(player);
                return;
            }
            open = picked;

            const states = crate.tabs.map((tab, depth) =>
                depth === picked ? 'out' : depth < picked ? 'flipped' : 'standing');

            const show = () => {
                player.style.setProperty('--sleeve', `var(--c-${id})`);
                now.title.textContent = sleeve.querySelector('.sleeve__title').textContent;
                now.code.textContent = sleeve.querySelector('.sleeve__code').textContent;
                if (restoreHash) {
                    restoreHash();
                    restoreHash = null;
                }
            };

            animated = dig.play({ states, panel: record, apply: show, scroll: !initial || deepLink });
            if (!animated && !initial) bringIntoView(player);
        },
    });

    const fromHash = () => crate.byPanelId(location.hash.slice(1));
    const linked = fromHash();
    deepLink = Boolean(linked);
    if (linked && dig.willAnimate()) {
        // Deep link with the intro dig: start at the crate and let dig.js scroll down to the
        // player as the record comes out. The browser would otherwise jump (smoothly, after
        // load) to the anchor, so hide the fragment until the record has landed.
        const hash = location.hash;
        history.replaceState(null, '', location.pathname + location.search);
        restoreHash = () => {
            if (!location.hash) history.replaceState(null, '', location.pathname + location.search + hash);
        };
        window.scrollTo({ top: 0, behavior: 'instant' });
    }
    crate.select(linked ?? crate.tabs[0], { initial: true });
    // Without motion: the old instant jump (the browser jumped before the other records were hidden)
    if (linked && !animated) player.scrollIntoView({ block: 'start' });

    window.addEventListener('hashchange', () => {
        const sleeve = fromHash();
        if (sleeve) crate.select(sleeve);
    });
}

// On phones the player sits below the crate; scroll to it when it's mostly off screen.
function bringIntoView(player) {
    const top = player.getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight * 0.6) {
        player.scrollIntoView({ block: 'start' });
    }
}
