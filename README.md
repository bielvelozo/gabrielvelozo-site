# gabrielvelozo.pages.dev

Gabriel Velozo's site as a Shopify developer, in English (`/`) and Brazilian Portuguese (`/br/`). It walks a visitor along a line through four demo stores (Arara, Dewlane, Nocte, Inkly) and the parts of a store he builds: product page, cart and checkout, speed, apps.

Plain HTML, CSS and JavaScript in `site/`, no build step. Deployed to Cloudflare Pages:

```
wrangler pages deploy site --project-name gabrielvelozo --branch main
```

- `scripts/media.py` copies each store's video and converts its poster and prints to WebP, reading the `vitrine/` folders of the store repositories checked out next to this one. Inkly's images are committed as they are.
- `scripts/og.html` is the share image; render it at 1200×630 (add `#pt` for the Portuguese one) and save it under a new name (og2.jpg, og3.jpg…), because `/img/*` is cached for a week.

Fonts: Instrument Serif, Inter Tight and Geist Mono, all under the SIL Open Font License 1.1 (via Fontsource).
