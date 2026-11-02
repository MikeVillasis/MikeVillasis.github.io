// Media that only runs while you can see it:
// - <video data-autoplay>: muted autoplay while on screen, paused otherwise
// - <iframe data-youtube="ID">: loaded the first time it's seen, then play/pause
// - [data-tweet]: X's widget script is fetched the first time a tweet is seen;
//   the embed has no pause API, so leaving it reloads its iframe to stop sound
// Hidden records/tracks and off-screen reel slides never intersect, so switching
// records stops what you left and starts what you opened. Switching browser tabs
// stops everything; coming back resumes only what's on screen, muted again.

const VISIBLE = 0.4;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const watched = [];

export function initMedia() {
    initVideos();
    initYouTube();
    initTweets();

    document.addEventListener('visibilitychange', () => {
        for (const item of watched) {
            if (!item.inView) continue;
            if (document.hidden) item.hide(item.el);
            else item.show(item.el);
        }
    });
}

// Calls show/hide as each element enters or leaves the screen. `minRatio` 0
// means any overlap counts as in view.
function watch(elements, { show, hide, minRatio = VISIBLE }) {
    const items = new Map();
    const observer = new IntersectionObserver((entries) => {
        for (const { target, isIntersecting, intersectionRatio } of entries) {
            const item = items.get(target);
            const inView = isIntersecting && intersectionRatio >= minRatio;
            if (inView === item.inView) continue;
            item.inView = inView;
            if (inView && !document.hidden) show(target);
            else if (!inView) hide(target);
        }
    }, { threshold: [0, minRatio] });

    elements.forEach((el) => {
        const item = { el, show, hide, inView: false };
        items.set(el, item);
        watched.push(item);
        observer.observe(el);
    });
}

function initVideos() {
    const videos = document.querySelectorAll('video[data-autoplay]');
    videos.forEach((video) => {
        // With motion reduced, nothing starts on its own, so everything needs controls
        if (reducedMotion.matches) video.controls = true;
    });

    watch(videos, {
        show(video) {
            video.muted = true; // autoplay always restarts muted
            if (!reducedMotion.matches) video.play().catch(() => { /* blocked: controls remain */ });
        },
        hide(video) {
            video.pause();
        },
    });
}

function initYouTube() {
    const command = (frame, func) => frame.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func, args: [] }), 'https://www.youtube.com');

    watch(document.querySelectorAll('iframe[data-youtube]'), {
        show(frame) {
            if (!frame.src) {
                const autoplay = reducedMotion.matches ? 0 : 1;
                frame.src = `https://www.youtube.com/embed/${frame.dataset.youtube}` +
                    `?enablejsapi=1&autoplay=${autoplay}&mute=1&playsinline=1&rel=0`;
                return;
            }
            if (reducedMotion.matches) return;
            command(frame, 'mute');
            command(frame, 'playVideo');
        },
        hide(frame) {
            if (frame.src) command(frame, 'pauseVideo');
        },
    });
}

function initTweets() {
    let scriptAdded = false;

    watch(document.querySelectorAll('[data-tweet]'), {
        minRatio: 0,
        show(tweet) {
            if (scriptAdded) return;
            scriptAdded = true;
            const script = document.createElement('script');
            script.src = 'https://platform.x.com/widgets.js';
            script.async = true;
            script.charset = 'utf-8';
            document.body.append(script);
        },
        hide(tweet) {
            // Reloading the rendered embed is the only way to silence its video
            const frame = tweet.querySelector('iframe');
            if (frame?.src) frame.src = frame.src;
        },
    });
}
