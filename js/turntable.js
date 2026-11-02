// Turntable accent: lifts the arm, swaps the record label, drops the arm.
// The label colour comes from the player's --sleeve variable via CSS.

const SWAP_MS = 320;

export function createTurntable(el) {
    if (!el) return { load() {} };

    const label = el.querySelector('.turntable__label-text');
    let timer;

    return {
        load(text, { animate = true } = {}) {
            clearTimeout(timer);
            if (!animate) {
                label.textContent = text;
                return;
            }
            el.classList.add('is-swapping');
            timer = setTimeout(() => {
                label.textContent = text;
                el.classList.remove('is-swapping');
            }, SWAP_MS);
        },
    };
}
