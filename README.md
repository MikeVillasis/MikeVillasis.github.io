# MikeVillasis.github.io

Portfolio of Miguel Villasis Miranda, served by GitHub Pages at https://mikevillasis.github.io/.
Themed as a record store: each section is a record in a wooden crate, pulled out into a player below it.

No build step: plain HTML, CSS and ES modules, served straight from `main`.

```
index.html      all content, as semantic HTML (readable with JS off)
css/            base (tokens), layout, profile (crate front + polaroid), crate, player, media
js/             main (entry), tabs, shelf (crate states), tracks, reel, media
assets/img/     profile photo
assets/video/   project clips
docs/           resume PDF (keep this path: it's linked from the resume)
```

## Run locally

ES modules don't load from `file://`, and the videos need a server that supports range requests:

```bash
npx http-server . -p 8080 -c-1
```

## Adding a record

1. Add a `.sleeve` button to `.crate__records` in `index.html` (set `--i`, the depth: 0 is the front record, higher is further back; renumber the others so depths stay 0..n-1, and give it `data-record` and `data-state="standing"`).
2. Add a matching `<article class="record" role="tabpanel">` inside `#player`.
3. Add a `--c-<record>` colour in `css/base.css`.
4. Adjust the tab stagger in `css/crate.css` if there are not five records (`.sleeve__tab` uses `--i * 25%`, i.e. 100% / (n - 1)) and the `4 *` in `--bay-h`.

Each sleeve's `data-state` (`standing`, `flipped`, `out`) is set by `js/shelf.js` and turned into a transform by `css/crate.css`.
