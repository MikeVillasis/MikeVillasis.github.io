// The crate dig: HOW the crate gets from one arrangement to the next.
// shelf.js decides WHAT the arrangement is (a data-state per record); dig.play() gets there.
//
// One run =
//   1. put back  the open record leaves the player as a ghost, a hand carries it to its slot
//                and lowers the real sleeve in (standing)
//   2. dig       the left hand steadies the front of the pile; the right hand flips, one at a
//                time, every record that has to change between standing and flipped
//   3. pull      the right hand grips the picked record's top edge, lifts it out, and a ghost of
//                it zooms into the player, which then takes its colour and shows its content
//
// The target data-state values are written at the START of a run, so the DOM is always in its
// final logical state. Everything visual is a Web Animation (records, ghosts, player) scheduled
// up front on one clock, plus a rAF loop that places the hands on live record edges. Stopping a
// run cancels the animations, removes the ghosts and resets the hands: CSS then shows exactly
// the final state, so an interrupted run "jumps to the end" and the next one starts from there.
// Reduced motion (or no WAAPI): the states are swapped instantly, no hands.

import { createHands } from './hands.js';

// Timings, ms
const T = {
    putIn: 70,        // ghost lifts off the player, hand arrives
    putFly: 190,      // ghost flies back to the crate
    putLower: 120,    // hand lowers the sleeve into its slot
    handsIn: 150,     // hands enter when there is nothing to put back
    flipBudget: 320,  // all flips together, whatever their number...
    flipMin: 85,      // ...but no single flip faster than this
    flipMax: 180,     // ...or slower than this
    reach: 90,        // right hand moves to the picked record
    squeeze: 30,      // grip before lifting
    lift: 160,        // record rises out of the crate
    zoom: 300,        // ghost travels to the player
    fade: 170,        // ghost dissolves into the player
    reveal: 260,      // player content fades in
    handOut: 180,     // hands leave
};

const EASE_SNAP = 'cubic-bezier(0.5, 0.05, 0.6, 1)';     // a record falling / being pushed
const EASE_SETTLE = 'cubic-bezier(0.3, 0, 0.3, 1)';      // its small bounce back
const EASE_MOVE = 'cubic-bezier(0.45, 0, 0.2, 1)';       // carried by a hand
const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';

const EDGE_X = 0.72;  // where on a record's top edge the right hand grabs (share of its width)

const easeInOut = (u) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2);
const lerp = (a, b, u) => a + (b - a) * u;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function createDig({ scene, sleeves, player }) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const canAnimate = typeof Element.prototype.animate === 'function';
    let hands = null;
    let run = null;

    // Go to `states` (one data-state per sleeve). Returns true if it animates.
    function play({ states, panel, apply, scroll = false }) {
        stop();
        const from = sleeves.map((s) => s.dataset.state);
        if (reduced.matches || !canAnimate || !states.includes('out')) {
            setStates(states);
            apply();
            return false;
        }
        try {
            start({ from, to: states, panel, apply, scroll });
            return true;
        } catch (err) {
            // Anything unexpected: fall back to the instant swap rather than a half-built run
            stop();
            setStates(states);
            apply();
            console.error(err);
            return false;
        }
    }

    // Cancel the running sequence; CSS shows its final state.
    function stop() {
        const r = run;
        run = null;
        if (!r) return;
        r.dead = true;
        cancelAnimationFrame(r.raf);
        for (const a of r.anims) a.cancel();
        for (const g of r.ghosts) g.remove();
        for (const h of [hands.left, hands.right]) resetHand(h);
        if (r.unsmooth) document.documentElement.style.removeProperty('scroll-behavior');
        if (!r.applied) {
            r.applied = true;
            r.apply();
        }
    }

    function setStates(states) {
        sleeves.forEach((s, i) => {
            s.dataset.state = states[i];
        });
    }

    function start({ from, to, panel, apply, scroll }) {
        hands ??= createHands(scene);
        const n = sleeves.length;
        const N = to.indexOf('out');
        const M = from.indexOf('out');
        const hasPut = M >= 0 && M !== N;

        // --- Measure the resting poses (style only, no paint) ---
        setStates(Array(n).fill('standing'));
        const S = sleeves.map(readPose);
        setStates(Array(n).fill('flipped'));
        const F = sleeves.map(readPose);
        setStates(to);

        const crateEl = scene.closest('.crate') ?? scene;
        const tilt = parseFloat(getComputedStyle(crateEl).getPropertyValue('--crate-tilt')) || 0;
        const recH = sleeves[0].offsetHeight;
        const step = n > 1 ? Math.abs(S[0].ty - S[1].ty) : 0;
        // High enough to clear the front plank and the records standing in front
        const lift = recH - step + 8;
        const lifted = (i) => ({ ty: S[i].ty - lift, tz: S[i].tz, rx: -tilt, op: 1 });
        const hidden = (p) => ({ ...p, op: 0 });

        const sr0 = scene.getBoundingClientRect();
        const rel = (r) => ({ x: r.left - sr0.left, y: r.top - sr0.top, w: r.width, h: r.height });
        const measureAt = (i, p) => {
            sleeves[i].style.transform = poseTransform(p);
            const r = rel(sleeves[i].getBoundingClientRect());
            sleeves[i].style.removeProperty('transform');
            return r;
        };
        const gw = sleeves[0].offsetWidth;
        const gh = recH;
        const pr = rel(player.getBoundingClientRect());
        const onPlayer = { x: pr.x, y: pr.y, k: pr.w / gw };
        const box = (r) => ({ x: r.x, y: r.y, k: r.w / gw });

        // --- Which records flip, in what order ---
        const cur = from.map((s, i) => (i === M ? 'standing' : s));
        const want = to.map((s, i) => (i === N ? 'standing' : s));
        const flips = [];
        for (let i = n - 1; i >= 0; i--) if (cur[i] === 'flipped' && want[i] === 'standing') flips.push([i, 'up']);
        for (let i = 0; i < n; i++) if (cur[i] === 'standing' && want[i] === 'flipped') flips.push([i, 'down']);

        // --- Timeline ---
        const putLand = T.putIn + T.putFly;
        const putEnd = hasPut ? putLand + T.putLower : 0;
        const digStart = hasPut ? putEnd : T.handsIn;
        const s = flips.length ? clamp(T.flipBudget / flips.length, T.flipMin, T.flipMax) : 0;
        const pullAt = digStart + flips.length * s;
        const grab = pullAt + T.reach;
        const liftStart = grab + T.squeeze;
        const liftEnd = liftStart + T.lift;
        const land = liftEnd + T.zoom;
        const end = land + Math.max(T.reveal, T.fade, T.handOut) + 20;

        const r = {
            anims: [], ghosts: [], raf: 0, dead: false, applied: false, apply,
            land, liftEnd, end, scroll, scrollFrom: null, scrollTo: null, scrollLast: null,
            right: [], left: [],
        };
        run = r; // so that stop() can clean up even if building the run fails part-way

        // Per-record pose timelines, in absolute ms
        const tracks = sleeves.map((_, i) => {
            const p0 = from[i] === 'flipped' ? F[i] : from[i] === 'out' ? hidden(S[i]) : S[i];
            return [{ t: 0, p: p0 }];
        });
        const to_ = (i, t, p, easing = 'linear') => {
            const k = tracks[i];
            const last = k[k.length - 1];
            if (t > last.t) k.push({ t, p, easing });
            else Object.assign(last, { p });
        };
        const hold = (i, t) => {
            const k = tracks[i];
            const last = k[k.length - 1];
            if (t > last.t) k.push({ t, p: last.p });
        };
        const setEase = (i, easing) => {
            const k = tracks[i];
            k[k.length - 1].easing = easing;
        };

        // Contact points, scene-relative, read live every frame
        const edgeOf = (el) => (sr) => {
            const b = el.getBoundingClientRect();
            return { x: b.left - sr.left + EDGE_X * b.width, y: b.top - sr.top };
        };
        const front = scene.querySelector('.crate__front');
        const leftW = hands.left.el.offsetWidth;
        const frontCorner = (sr) => {
            const b = (front ?? scene).getBoundingClientRect();
            // in from the corner far enough that the palm shows inside the column
            const inset = clamp(leftW * 0.5, 20, b.width * 0.25);
            return { x: b.left - sr.left + inset, y: b.top - sr.top + 4 };
        };
        const R = r.right;
        const L = r.left;
        const key = (list, t, pose, at, out = false) => list.push({ t, pose, at, out });

        // 1. Put back
        if (hasPut) {
            const g = makeGhost(sleeves[M], gw, gh);
            r.ghosts.push(g);
            const mBox = box(measureAt(M, lifted(M)));
            r.anims.push(animateAt(g, [
                { t: 0, ...ghostFrame(onPlayer, 0), opacity: 0, easing: 'linear' },
                { t: T.putIn, ...ghostFrame(onPlayer, 0), opacity: 1, easing: EASE_MOVE },
                { t: T.putIn + T.putFly * 0.5, ...ghostFrame(mid(onPlayer, mBox, -18), -2), opacity: 1, easing: EASE_MOVE },
                { t: putLand, ...ghostFrame(mBox, 0), opacity: 1, easing: 'linear' },
                { t: putLand + 40, ...ghostFrame(mBox, 0), opacity: 0 },
            ], { fill: 'forwards' }));

            to_(M, putLand - 1, hidden(lifted(M)));
            to_(M, putLand, lifted(M));
            setEase(M, EASE_OUT);
            to_(M, putEnd, S[M]);

            const ge = edgeOf(g);
            const me = edgeOf(sleeves[M]);
            key(R, 0, 'reach', ge, true);
            key(R, T.putIn, 'grip', ge);
            key(R, putLand, 'grip', ge);
            key(R, putLand, 'grip', me);
            key(R, putEnd, 'reach', me);
        } else {
            const first = flips.length ? sleeves[flips[0][0]] : sleeves[N];
            key(R, 0, 'reach', edgeOf(first), true);
        }

        // Left hand steadies the front of the pile while the right one digs
        const leftIn = Math.max(0, digStart - T.handsIn);
        key(L, leftIn, 'hold', frontCorner, true);
        key(L, leftIn + T.handsIn, 'hold', frontCorner);
        key(L, liftStart, 'hold', frontCorner);
        key(L, liftStart + T.handOut, 'hold', frontCorner, true);

        // 2. Dig
        flips.forEach(([i, dir], k) => {
            const t0 = digStart + k * s;
            const contact = t0 + s * 0.35;
            const release = t0 + s;
            const settle = release + Math.max(90, s * 0.55);
            const target = dir === 'down' ? F[i] : S[i];
            const over = { ...target, rx: target.rx + (dir === 'down' ? -12 : 8) };
            hold(i, contact);
            setEase(i, EASE_SNAP);
            to_(i, release, over);
            setEase(i, EASE_SETTLE);
            to_(i, settle, target);
            cur[i] = dir === 'down' ? 'flipped' : 'standing';

            const e = edgeOf(sleeves[i]);
            key(R, contact, 'flip', e);
            key(R, release, 'reach', e);
        });

        // 3. Pull
        const ne = edgeOf(sleeves[N]);
        hold(N, liftStart);
        setEase(N, EASE_MOVE);
        to_(N, liftEnd, lifted(N));
        to_(N, liftEnd + 30, hidden(lifted(N)));

        const gp = makeGhost(sleeves[N], gw, gh);
        r.ghosts.push(gp);
        const nBox = box(measureAt(N, lifted(N)));
        r.anims.push(animateAt(gp, [
            { t: 0, ...ghostFrame(nBox, 0), opacity: 1, easing: EASE_MOVE },
            { t: T.zoom * 0.45, ...ghostFrame(mid(nBox, onPlayer, -26, 1.05), -3), opacity: 1, easing: EASE_MOVE },
            { t: T.zoom, ...ghostFrame(onPlayer, 0), opacity: 1, easing: 'ease-in' },
            { t: T.zoom + T.fade, ...ghostFrame(onPlayer, 0), opacity: 0 },
        ], { delay: liftEnd, fill: 'forwards' }));

        const gpe = edgeOf(gp);
        key(R, grab, 'grip', ne);
        key(R, liftEnd, 'grip', ne);
        key(R, liftEnd, 'grip', gpe);
        key(R, land, 'reach', gpe);
        key(R, land + T.handOut, 'reach', gpe, true);

        // Records
        tracks.forEach((k, i) => {
            if (k.length < 2) return;
            r.anims.push(animateAt(sleeves[i], k.map((f) => ({
                t: f.t, transform: poseTransform(f.p), opacity: f.p.op, easing: f.easing ?? 'linear',
            }))));
        });

        // Player: dims while it is empty, comes back as the record lands; content fades in
        r.anims.push(animateAt(player, hasPut
            ? [{ t: 0, opacity: 1 }, { t: 160, opacity: 0.3 }, { t: land, opacity: 0.3, easing: EASE_OUT }, { t: land + 240, opacity: 1 }]
            : [{ t: 0, opacity: 0.3 }, { t: land, opacity: 0.3, easing: EASE_OUT }, { t: land + 240, opacity: 1 }]));
        if (panel) {
            r.anims.push(animateAt(panel, [
                { t: 0, opacity: 0, transform: 'translateY(18px)' },
                { t: land - 40, opacity: 0, transform: 'translateY(18px)', easing: EASE_OUT },
                { t: land + T.reveal, opacity: 1, transform: 'translateY(0px)' },
            ]));
        }

        // Master clock: the hands follow it, and its end closes the run
        const clock = scene.animate([], { duration: end });
        r.clock = clock;
        r.anims.push(clock);
        r.hw = { right: size(hands.right.el), left: size(hands.left.el) };
        clock.finished.then(() => {
            if (run === r) stop();
        }, () => {});

        const frame = () => {
            if (r.dead) return;
            const t = clock.currentTime ?? 0;
            const sr = scene.getBoundingClientRect();
            const w = r.hw.right;
            driveHand(hands.right, R, t, sr, r.hw.right, { x: w.w * 0.8, y: w.h * 0.25 });
            driveHand(hands.left, L, t, sr, r.hw.left, { x: -r.hw.left.w * 0.7, y: r.hw.left.h * 0.7 });
            if (!r.applied && t >= land) {
                r.applied = true;
                apply();
            }
            driveScroll(r, t);
            r.raf = requestAnimationFrame(frame);
        };
        r.raf = requestAnimationFrame(frame);
        return r;
    }

    // While the record zooms to the player, bring the player into view (same rule as before:
    // only when its top is off screen or low on it).
    function driveScroll(r, t) {
        if (!r.scroll || t < r.liftEnd || r.scrollTo === false) return;
        if (r.scrollTo === null) {
            const top = player.getBoundingClientRect().top;
            if (top >= 0 && top <= window.innerHeight * 0.6) {
                r.scrollTo = false;
                return;
            }
            const margin = parseFloat(getComputedStyle(player).scrollMarginTop) || 0;
            r.scrollFrom = window.scrollY;
            r.scrollTo = Math.max(0, window.scrollY + top - margin);
            r.scrollLast = window.scrollY;
            // html has scroll-behavior: smooth; per-frame scrolling must not be smoothed again
            // (older Safari may not know behavior: 'instant')
            document.documentElement.style.scrollBehavior = 'auto';
            r.unsmooth = true;
        }
        // The visitor scrolled themselves: let them
        if (Math.abs(window.scrollY - r.scrollLast) > 3) {
            r.scrollTo = false;
            return;
        }
        const u = clamp((t - r.liftEnd) / (T.zoom + 60), 0, 1);
        const y = Math.round(lerp(r.scrollFrom, r.scrollTo, easeInOut(u)));
        window.scrollTo({ top: y, behavior: 'instant' });
        r.scrollLast = window.scrollY;
        if (u >= 1) r.scrollTo = false;
    }

    function makeGhost(sleeve, w, h) {
        const g = document.createElement('div');
        g.className = 'dig-ghost';
        g.setAttribute('aria-hidden', 'true');
        g.style.setProperty('--sleeve', sleeve.style.getPropertyValue('--sleeve'));
        g.style.setProperty('--i', sleeve.style.getPropertyValue('--i'));
        g.style.width = `${w}px`;
        g.style.height = `${h}px`;
        for (const child of sleeve.children) g.appendChild(child.cloneNode(true));
        scene.appendChild(g);
        return g;
    }

    return {
        play,
        stop,
        willAnimate: () => canAnimate && !reduced.matches,
        get running() {
            return run !== null;
        },
    };
}

// Hand placement: keyframes {t, pose, at(sceneRect) -> {x, y}, out}; between two keyframes the
// contact point moves from one live point to the other. `out` keyframes sit off towards where
// the arm comes from, fully transparent.
function driveHand(hand, keys, t, sr, box, off) {
    if (keys.length < 2 || t < keys[0].t || t >= keys[keys.length - 1].t) {
        hand.el.style.opacity = '0';
        return;
    }
    let i = 0;
    for (let j = 0; j < keys.length - 1; j++) if (keys[j].t <= t) i = j;
    const a = keys[i];
    const b = keys[i + 1];
    const u = b.t > a.t ? easeInOut(clamp((t - a.t) / (b.t - a.t), 0, 1)) : 1;
    if (hand.pose !== a.pose) hand.setPose(a.pose);
    const pa = a.at(sr);
    const pb = b.at(sr);
    const x = lerp(pa.x + (a.out ? off.x : 0), pb.x + (b.out ? off.x : 0), u);
    const y = lerp(pa.y + (a.out ? off.y : 0), pb.y + (b.out ? off.y : 0), u);
    const op = lerp(a.out ? 0 : 1, b.out ? 0 : 1, u);
    hand.el.style.transform = `translate3d(${x - hand.grip.x * box.w}px, ${y - hand.grip.y * box.h}px, 0)`;
    hand.el.style.opacity = String(op);
}

function resetHand(hand) {
    hand.el.style.removeProperty('transform');
    hand.el.style.removeProperty('opacity');
    hand.setPose('rest');
}

const size = (el) => ({ w: el.offsetWidth, h: el.offsetHeight });

// {ty, tz, rx, op} from the computed transform (translate3d(0, ty, tz) rotateX(rx)).
function readPose(el) {
    const cs = getComputedStyle(el);
    const m = cs.transform;
    const op = parseFloat(cs.opacity);
    if (!m || m === 'none') return { ty: 0, tz: 0, rx: 0, op };
    const v = m.slice(m.indexOf('(') + 1, -1).split(',').map(parseFloat);
    if (v.length === 16) {
        return { ty: v[13], tz: v[14], rx: (Math.atan2(v[6], v[5]) * 180) / Math.PI, op };
    }
    return { ty: v[5], tz: 0, rx: 0, op };
}

const poseTransform = (p) => `translate3d(0px, ${p.ty}px, ${p.tz}px) rotateX(${p.rx}deg)`;

const ghostFrame = (b, rot) => ({ transform: `translate(${b.x}px, ${b.y}px) scale(${b.k}) rotate(${rot}deg)` });

// A point part-way between two boxes, nudged up (an arc) and optionally scaled (towards you)
const mid = (a, b, up, grow = 1) => ({
    x: lerp(a.x, b.x, 0.5),
    y: lerp(a.y, b.y, 0.5) + up,
    k: lerp(a.k, b.k, 0.5) * grow,
});

// element.animate with keyframes given in absolute ms ({t, ...props}); offset = t / duration.
function animateAt(el, frames, { delay = 0, fill = 'none' } = {}) {
    const duration = Math.max(1, frames[frames.length - 1].t);
    const keyframes = frames.map(({ t, ...props }) => ({ ...props, offset: clamp(t / duration, 0, 1) }));
    return el.animate(keyframes, { duration, delay, fill });
}
