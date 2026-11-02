// Accessible tablist behaviour shared by the shelf (records) and tracks (sub-tabs).
// Panels are shown/hidden with the [hidden] attribute, so the page still reads
// top-to-bottom when JS is off.

export function createTabs(tablist, { onSelect, nextKeys = ['ArrowRight', 'ArrowDown'], prevKeys = ['ArrowLeft', 'ArrowUp'] } = {}) {
    const tabs = [...tablist.querySelectorAll('[role="tab"]')];
    const panelOf = (tab) => document.getElementById(tab.getAttribute('aria-controls'));

    function select(tab, { focus = false, initial = false } = {}) {
        for (const t of tabs) {
            const on = t === tab;
            t.setAttribute('aria-selected', String(on));
            t.tabIndex = on ? 0 : -1;

            const panel = panelOf(t);
            if (!panel) continue;
            if (on && panel.hidden && !initial) replayEntrance(panel);
            panel.hidden = !on;
        }
        if (focus) tab.focus();
        onSelect?.(tab, panelOf(tab), { initial });
    }

    tablist.addEventListener('click', (event) => {
        const tab = event.target.closest('[role="tab"]');
        if (tab && tabs.includes(tab)) select(tab);
    });

    tablist.addEventListener('keydown', (event) => {
        const i = tabs.indexOf(document.activeElement);
        if (i < 0) return;

        let next;
        if (nextKeys.includes(event.key)) next = tabs[(i + 1) % tabs.length];
        else if (prevKeys.includes(event.key)) next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (event.key === 'Home') next = tabs[0];
        else if (event.key === 'End') next = tabs[tabs.length - 1];
        else return;

        event.preventDefault();
        select(next, { focus: true });
    });

    const byPanelId = (id) => tabs.find((t) => t.getAttribute('aria-controls') === id);

    return { tabs, select, byPanelId };
}

function replayEntrance(el) {
    el.classList.remove('is-entering');
    void el.offsetWidth; // restart the CSS animation
    el.classList.add('is-entering');
}
