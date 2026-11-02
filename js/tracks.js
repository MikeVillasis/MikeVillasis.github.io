// Tracks: the sub-tabs inside a record (credits, projects).

import { createTabs } from './tabs.js';

export function initTracks() {
    document.querySelectorAll('.tracks').forEach((tablist) => {
        const tracks = createTabs(tablist, {
            onSelect(track, panel, { initial }) {
                // Keep the chosen chip in view when the row scrolls sideways on phones
                if (!initial) track.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            },
        });
        const selected = tracks.tabs.find((t) => t.getAttribute('aria-selected') === 'true');
        tracks.select(selected ?? tracks.tabs[0], { initial: true });
    });
}
