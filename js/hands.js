// Hand doodles for the crate-dig animation. No dependencies, no global state.
//
// createHands(scene) -> { left, right }
// Each controller: { el, setPose(name), poses, grip }
//   grip: {x, y} in 0..1 of the element's own box for the CURRENT pose
//         (where the hand touches a record). Updated by setPose.
//
// right: viewBox 400x200 (2:1). Fingers on the left, forearm trails off to the RIGHT edge.
// left:  viewBox 300x260. Fingers at the upper-right, forearm trails off to the BOTTOM-LEFT.
// Size with --hand-size (element width); height follows the aspect ratio.

export const RIGHT_POSES = ['rest', 'reach', 'flip', 'grip'];
export const LEFT_POSES = ['rest', 'hold'];

const NS = 'http://www.w3.org/2000/svg';

const RIGHT = {
  viewBox: '0 0 400 200',
  // The forearm runs on past the box (the svg overflows) and fades out along this line
  fade: [330, 0, 760, 0],
  poses: {
    rest: {
      grip: { x: 0.15, y: 0.5 },
      paths: [
        'M900,234 L420,114 C340,96 250,74 176,60 C150,50 118,44 92,52 C70,58 54,72 58,88 C60,100 74,102 88,98 C70,106 64,122 78,128 C92,132 104,124 114,120 C108,134 118,146 134,142 C150,138 160,126 178,118 C240,128 330,150 420,174 L900,294 Z',
        ['line', 'M88,98 C102,95 114,90 124,82'],
        ['line', 'M114,120 C124,116 132,108 140,100'],
      ],
    },
    reach: {
      grip: { x: 0.09, y: 0.5 },
      paths: [
        'M900,232 L420,112 C340,96 260,80 190,66 C160,58 120,50 70,56 C42,60 24,74 30,88 C36,100 58,98 92,95 C62,102 54,116 70,120 C90,124 110,116 132,114 C124,128 132,142 150,140 C166,136 178,126 190,118 C250,128 330,150 420,172 L900,292 Z',
        ['line', 'M92,95 C112,92 132,86 152,80'],
        ['line', 'M132,114 C146,110 158,102 168,94'],
      ],
    },
    flip: {
      grip: { x: 0.2, y: 0.46 },
      paths: [
        'M900,230 L420,110 C340,92 270,72 202,58 C172,46 138,32 106,36 C74,40 48,58 44,84 C42,104 52,122 66,130 C78,134 88,126 84,114 C82,106 78,98 84,92 C98,88 112,92 124,100 C128,114 140,130 160,126 C172,122 182,116 190,112 C250,126 330,150 420,172 L900,292 Z',
        ['line', 'M80,58 C68,68 62,84 68,102'],
        ['line', 'M96,50 C86,58 80,66 78,74'],
      ],
    },
    grip: {
      grip: { x: 0.22, y: 0.4 },
      paths: [
        'M900,232 L420,112 C340,94 270,74 204,62 C178,38 140,32 112,40 C80,50 58,72 60,98 C62,122 84,138 110,138 C140,140 166,132 190,116 C250,128 330,150 420,172 L900,292 Z',
        ['line', 'M84,58 C78,68 78,80 82,90'],
        ['line', 'M102,48 C96,58 96,70 100,78'],
        'M98,80 C122,70 152,76 162,94 C166,110 142,118 120,112 C100,106 86,94 98,80 Z',
        ['line', 'M112,92 C124,90 136,94 144,100'],
      ],
    },
  },
};

const LEFT = {
  viewBox: '0 0 300 260',
  fade: [90, 200, -200, 470],
  poses: {
    rest: {
      grip: { x: 0.76, y: 0.34 },
      paths: [
        // three loose finger loops behind the palm
        'M214,26 C234,18 254,30 252,50 C250,66 234,72 220,68 C202,62 200,36 214,26 Z',
        'M246,62 C268,58 286,74 282,94 C278,110 260,114 246,106 C230,96 230,66 246,62 Z',
        'M244,104 C264,102 278,118 272,134 C266,148 248,150 236,140 C224,128 228,106 244,104 Z',
        // arm + palm
        'M-352,564 L-52,282 C20,214 90,150 146,104 C150,76 178,58 208,62 C236,68 250,98 242,124 C236,142 216,152 196,148 C186,152 176,154 168,152 C120,196 66,252 22,322 L-278,604 Z',
        // thumb loop
        'M138,128 C156,120 176,132 172,150 C168,166 148,170 136,160 C124,150 126,134 138,128 Z',
        ['line', 'M216,70 C226,84 236,92 246,96'],
      ],
    },
    hold: {
      grip: { x: 0.82, y: 0.45 },
      paths: [
        // arm + palm pressed flat
        'M-352,564 L-52,282 C20,214 90,150 146,104 C150,70 180,52 206,60 C214,90 214,132 204,152 C196,160 180,160 168,152 C120,196 66,252 22,322 L-278,604 Z',
        // four fingers curled in a tight column around the corner
        'M200,22 C228,14 262,24 262,42 C262,58 232,66 204,58 C190,48 190,30 200,22 Z',
        'M204,62 C236,56 268,66 268,84 C268,100 236,108 206,100 C194,90 194,70 204,62 Z',
        'M206,104 C236,98 266,110 264,126 C262,142 232,150 206,142 C196,132 196,112 206,104 Z',
        'M202,146 C228,142 254,152 250,168 C246,182 222,188 200,182 C190,172 190,154 202,146 Z',
        // thumb in front, across the palm
        'M116,118 C140,100 176,104 192,120 C198,136 178,148 154,146 C128,144 108,136 116,118 Z',
        ['line', 'M128,126 C144,124 160,126 172,132'],
      ],
    },
  },
};

let fadeIds = 0;

// <mask> that fades the forearm out along def.fade = [x1, y1, x2, y2] (opaque -> clear)
function buildFade(svg, def) {
  if (!def.fade) return null;
  const id = 'hand-fade-' + ++fadeIds;
  const [x1, y1, x2, y2] = def.fade;
  const defs = document.createElementNS(NS, 'defs');
  const grad = document.createElementNS(NS, 'linearGradient');
  grad.setAttribute('id', id + '-g');
  grad.setAttribute('gradientUnits', 'userSpaceOnUse');
  Object.entries({ x1, y1, x2, y2 }).forEach(([k, v]) => grad.setAttribute(k, v));
  for (const [offset, color] of [[0, '#fff'], [1, '#000']]) {
    const stop = document.createElementNS(NS, 'stop');
    stop.setAttribute('offset', offset);
    stop.setAttribute('stop-color', color);
    grad.appendChild(stop);
  }
  const mask = document.createElementNS(NS, 'mask');
  mask.setAttribute('id', id);
  mask.setAttribute('maskUnits', 'userSpaceOnUse');
  const rect = document.createElementNS(NS, 'rect');
  Object.entries({ x: -1000, y: -1000, width: 3000, height: 3000, fill: `url(#${id}-g)` })
    .forEach(([k, v]) => rect.setAttribute(k, v));
  mask.setAttribute('x', -1000);
  mask.setAttribute('y', -1000);
  mask.setAttribute('width', 3000);
  mask.setAttribute('height', 3000);
  mask.appendChild(rect);
  defs.append(grad, mask);
  svg.appendChild(defs);
  return `url(#${id})`;
}

function buildSvg(def) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', def.viewBox);
  svg.setAttribute('focusable', 'false');
  const fade = buildFade(svg, def);
  for (const [name, pose] of Object.entries(def.poses)) {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'hand-pose');
    if (fade) g.setAttribute('mask', fade);
    g.dataset.pose = name;
    for (const p of pose.paths) {
      const path = document.createElementNS(NS, 'path');
      if (Array.isArray(p)) {
        path.setAttribute('class', p[0]);
        path.setAttribute('d', p[1]);
      } else {
        path.setAttribute('d', p);
      }
      g.appendChild(path);
    }
    svg.appendChild(g);
  }
  return svg;
}

function makeHand(scene, side, def) {
  const el = document.createElement('div');
  el.className = 'hand hand-' + side;
  el.setAttribute('aria-hidden', 'true');
  el.appendChild(buildSvg(def));
  scene.appendChild(el);
  const ctrl = {
    el,
    poses: Object.keys(def.poses),
    pose: null,
    grip: { x: 0, y: 0 },
    setPose(name) {
      if (!def.poses[name]) return;
      el.dataset.pose = name;
      ctrl.pose = name;
      ctrl.grip = { ...def.poses[name].grip };
    },
  };
  ctrl.setPose('rest');
  return ctrl;
}

export function createHands(scene) {
  return {
    left: makeHand(scene, 'left', LEFT),
    right: makeHand(scene, 'right', RIGHT),
  };
}
