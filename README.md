# MikeVillasis.github.io

Portfolio of Miguel Villasis Miranda, served by GitHub Pages at https://mikevillasis.github.io/.
Themed as a record store: each section is a record on a shelf, pulled out into a player.

No build step: plain HTML, CSS and ES modules, served straight from `main`.

```
index.html      all content, as semantic HTML (readable with JS off)
css/            base (tokens), layout, profile, shelf, player, turntable, media
js/             main (entry), tabs, shelf, tracks, reel, media, turntable
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

1. Add a `.sleeve` button to `.shelf__stack` in `index.html` (set `--row`, `--tab-x`, `data-record`).
2. Add a matching `<article class="record" role="tabpanel">` inside `#player`.
3. Add a `--c-<record>` colour in `css/base.css`.
