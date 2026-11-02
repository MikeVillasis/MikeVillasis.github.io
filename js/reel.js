// Film reel carousel. The strip is a native scroll-snap row (so it swipes on
// phones); PREV/NEXT step it and the counter follows whichever slide is in view.

export function initReels() {
    document.querySelectorAll('[data-reel]').forEach(initReel);
}

function initReel(reel) {
    const strip = reel.querySelector('.reel__strip');
    const slides = [...strip.children];
    const prev = reel.querySelector('[data-reel-prev]');
    const next = reel.querySelector('[data-reel-next]');
    const count = reel.querySelector('.reel__count');
    let current = 0;

    const goTo = (i) => {
        const target = slides[Math.max(0, Math.min(slides.length - 1, i))];
        strip.scrollTo({ left: target.offsetLeft - strip.offsetLeft, behavior: 'smooth' });
    };

    prev.addEventListener('click', () => goTo(current - 1));
    next.addEventListener('click', () => goTo(current + 1));

    const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            current = slides.indexOf(entry.target);
            count.textContent = `${current + 1} / ${slides.length}`;
            prev.disabled = current === 0;
            next.disabled = current === slides.length - 1;
        }
    }, { root: strip, threshold: 0.6 });

    slides.forEach((slide) => observer.observe(slide));
}
