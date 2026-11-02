// The shelf: picking a sleeve pulls its record into the player, recolours the
// player, swaps the turntable's record, and keeps the URL hash in sync (#credits).

import { createTabs } from './tabs.js';
import { createTurntable } from './turntable.js';

export function initShelf() {
    const stack = document.querySelector('.shelf__stack');
    const player = document.getElementById('player');
    if (!stack || !player) return;

    const turntable = createTurntable(player.querySelector('.turntable'));
    const now = {
        title: player.querySelector('.player__title'),
        code: player.querySelector('.player__code'),
    };

    const shelf = createTabs(stack, {
        // Sleeves stack front-to-back, so "up" walks deeper into the shelf
        nextKeys: ['ArrowUp', 'ArrowRight'],
        prevKeys: ['ArrowDown', 'ArrowLeft'],
        onSelect(sleeve, record, { initial }) {
            const id = sleeve.dataset.record;
            player.style.setProperty('--sleeve', `var(--c-${id})`);
            now.title.textContent = sleeve.querySelector('.sleeve__title').textContent;
            now.code.textContent = sleeve.querySelector('.sleeve__code').textContent;
            turntable.load(sleeve.querySelector('.sleeve__cat').textContent, { animate: !initial });

            if (initial) return;
            history.replaceState(null, '', `#${id}`);
            bringIntoView(player);
        },
    });

    const fromHash = () => shelf.byPanelId(location.hash.slice(1));
    const linked = fromHash();
    shelf.select(linked ?? shelf.tabs[0], { initial: true });
    // The browser jumped to the anchor before the other records were hidden
    if (linked) player.scrollIntoView({ block: 'start' });

    window.addEventListener('hashchange', () => {
        const sleeve = fromHash();
        if (sleeve) shelf.select(sleeve);
    });
}

// On phones the player sits below the shelf; scroll to it when it's mostly off screen.
function bringIntoView(player) {
    const top = player.getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight * 0.6) {
        player.scrollIntoView({ block: 'start' });
    }
}
