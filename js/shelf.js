// The shelf: picking a sleeve pulls its record into the player, recolours the
// player, swaps the turntable's record, and keeps the URL hash in sync (#credits).
// The stack works as a queue: the picked sleeve moves to the front and the ones
// that were in front of it go to the back, keeping their order.

import { createTabs } from './tabs.js';
import { createTurntable } from './turntable.js';

// Tab offset by depth (front first), so the stagger stays put while records move
const STAGGER = ['0%', '14%', '28%', '10%', '36%'];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

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
        // Rotating the queue keeps the cyclic order, so "up" (deeper into the
        // shelf) is always the next sleeve in the DOM
        nextKeys: ['ArrowUp', 'ArrowRight'],
        prevKeys: ['ArrowDown', 'ArrowLeft'],
        onSelect(sleeve, record, { initial }) {
            arrange(rotateTo(shelf.tabs, sleeve), { animate: !initial });

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

// Front-to-back order with `sleeve` at the front: [A B C D E] picking C -> [C D E A B]
function rotateTo(sleeves, sleeve) {
    const i = sleeves.indexOf(sleeve);
    return [...sleeves.slice(i), ...sleeves.slice(0, i)];
}

// Place each sleeve at its depth, then slide it there from where it was (FLIP)
function arrange(order, { animate }) {
    const before = new Map(order.map((s) => [s, s.getBoundingClientRect().top]));

    order.forEach((sleeve, depth) => {
        sleeve.style.setProperty('--row', String(order.length - depth));
        sleeve.style.setProperty('--tab-x', STAGGER[depth % STAGGER.length]);
    });

    if (!animate || reducedMotion.matches) return;
    for (const sleeve of order) {
        const dy = before.get(sleeve) - sleeve.getBoundingClientRect().top;
        if (!dy) continue;
        sleeve.animate(
            [{ transform: `translateY(${dy}px)` }, { transform: 'none' }],
            { duration: 450, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
        );
    }
}

// On phones the player sits below the shelf; scroll to it when it's mostly off screen.
function bringIntoView(player) {
    const top = player.getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight * 0.6) {
        player.scrollIntoView({ block: 'start' });
    }
}
