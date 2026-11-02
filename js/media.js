// Media that only runs while you can see it:
// - <video data-autoplay>: muted autoplay while on screen, paused otherwise
// - <iframe data-youtube="ID">: loaded the first time it's seen, then play/pause
// - [data-tweet]: X's widget script is fetched the first time a tweet is seen
// Hidden records/tracks and off-screen reel slides never intersect, so switching
// records pauses what you left and starts what you opened.

const VISIBLE = 0.4;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

export function initMedia() {
    initVideos();
    initYouTube();
    initTweets();
}

function initVideos() {
    const videos = document.querySelectorAll('video[data-autoplay]');

    const observer = new IntersectionObserver((entries) => {
        for (const { target: video, isIntersecting, intersectionRatio } of entries) {
            if (isIntersecting && intersectionRatio >= VISIBLE && !reducedMotion.matches) {
                video.play().catch(() => { /* blocked autoplay: controls remain */ });
            } else {
                video.pause();
            }
        }
    }, { threshold: [0, VISIBLE] });

    videos.forEach((video) => {
        video.muted = true; // the attribute alone isn't always honoured on iOS
        // With motion reduced, nothing starts on its own, so everything needs controls
        if (reducedMotion.matches) video.controls = true;
        observer.observe(video);
    });
}

function initYouTube() {
    const frames = document.querySelectorAll('iframe[data-youtube]');

    const command = (frame, func) => frame.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func, args: [] }), 'https://www.youtube.com');

    const observer = new IntersectionObserver((entries) => {
        for (const { target: frame, isIntersecting, intersectionRatio } of entries) {
            const visible = isIntersecting && intersectionRatio >= VISIBLE;
            if (visible && !frame.src) {
                const autoplay = reducedMotion.matches ? 0 : 1;
                frame.src = `https://www.youtube.com/embed/${frame.dataset.youtube}` +
                    `?enablejsapi=1&autoplay=${autoplay}&mute=1&playsinline=1&rel=0`;
            } else if (frame.src) {
                command(frame, visible && !reducedMotion.matches ? 'playVideo' : 'pauseVideo');
            }
        }
    }, { threshold: [0, VISIBLE] });

    frames.forEach((frame) => observer.observe(frame));
}

function initTweets() {
    const tweets = document.querySelectorAll('[data-tweet]');

    const observer = new IntersectionObserver((entries) => {
        for (const { target, isIntersecting } of entries) {
            if (!isIntersecting) continue;
            observer.unobserve(target);
            if (window.twttr?.widgets) {
                window.twttr.widgets.load(target);
            } else {
                const script = document.createElement('script');
                script.src = 'https://platform.x.com/widgets.js';
                script.async = true;
                script.charset = 'utf-8';
                document.body.append(script);
            }
        }
    });

    tweets.forEach((tweet) => observer.observe(tweet));
}
