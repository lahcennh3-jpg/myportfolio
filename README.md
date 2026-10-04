# Ahmed — AI Security Engineering Portfolio

A static portfolio for Ahmed Amhdour’s AI application and product security direction.

The opening homepage section presents Ahmed Amhdour’s full name and a personal introduction covering his AI security role, sensitive-data protection, authorization and agent security boundaries. Header and footer branding use the same full name. The opening section uses professional focus language without describing learning or studying.

The public site contains **Home, Selected Work, About and Contact**, with three generic study overviews. Product identities, named study dependencies, research inputs, detailed learning plans and research downloads are excluded from the current source and build output. Required asset notices remain intact.

## Content and evidence

The selected entries cover object authorization, retrieval permissions and tool authority. Each is explicitly a **Planned study** with execution and runtime results pending. No completed assessment, product finding, customer engagement or production experience is claimed.

About contains Ahmed’s supplied biography, GITEX AFRICA 2026 Rising Star (Individual) award statement, four generic AI-system project profiles and full security engineering approach. The homepage has a short professional About summary and award line, without learning or studying language. The portrait, award-presentation photo and certificate/trophy photo are supplied originals, copied without pixel changes; the jury screenshot is not published. Photo links open the full original image.

The original template’s 18 routes remain available as generic portfolio equivalents. The alternative slider and static video-fallback routes, mobile navigation, sticky header, filtering, carousel, disclosures, scroll transitions and footer remain supported.

## Build and verify

Node.js is sufficient; there are no package dependencies to install.

```bash
npm run build:production
npm run check:content
npm run check
npm run check:http
npm run preview
```

The preview uses port 8765 unless `PORT` is set. Generated output is `public` and is excluded from Git. The build copies an explicit asset allowlist and removes old output before writing the curated pages.

| Path | Purpose |
|---|---|
| `data/portfolio.json` | Public profile, full About text, photo descriptions and three generic planned studies |
| `src/layout.html` | Shared static shell and four-item navigation |
| `scripts/build.mjs` | Static generator and explicit public asset allowlist |
| `scripts/check-content.mjs` | Disclosure, artifact, link and evidence-status checks |
| `scripts/check.mjs` | HTML, links, fragments and asset checks |
| `scripts/check-http.mjs` | Local HTTP integration and security-header checks |
| `assets/` | Retained template/vendor files and portfolio overrides |
| `docs/` | Adaptation, provenance, asset notices and verification reports |

## Verification

The production build and content checks pass for 22 HTML pages and 18 assets, including three original JPEG photos. Content verification checks all 18 supplied About paragraphs, four project profiles, twelve focus areas and eight methodology steps. Static validation checks 763 link/asset references. Local HTTP validation checks 22 pages + 18 assets + robots.txt = 41 nonempty HTTP 200 responses, all carrying the intended security headers; the photos use `image/jpeg`. A disclosure audit compares the output with all 143 former study-project identities; none appear in the published content or project links. Obsolete encoded staging payloads are removed from the current source.

## Publishing

Vercel build configuration uses `npm run build:production` and output `public`. Source is published on GitHub `main`. The repository-linked project is `myportfolio` under `amhdour1s-projects`. GitHub reports a successful Vercel deployment for content revision `676aeb0ab060262de32346a066188c32415d2fc2`; its [deployment record](https://vercel.com/amhdour1s-projects/myportfolio/DnortcESrNN1KmcvkXvqmysvUUu4) is linked from the GitHub commit status. Project management access still returns 403 and requires reauthentication to that scope. The production origin, deployment target and live browser behavior remain unverified.

Set `productionUrl` only after verifying the actual HTTPS origin, then rebuild to generate canonical metadata and the sitemap. Duplicate template routes are noindex and point to the corresponding primary page when an origin is available.

Local checks do not establish browser layout, keyboard or motion behavior, console cleanliness, or production availability. The requested six viewport checks remain outstanding.

## Publication boundary

The current website and main source omit the full research system. Previous Git commits remain historical records; removing current files or navigation does not remove earlier repository versions or copies. Repository visibility and any history rewrite are separate actions, not part of this content revision.

See `docs/CONTENT_PROVENANCE.md`, `docs/TEMPLATE_ADAPTATION.md` and `docs/THIRD_PARTY_NOTICES.md` for source scope and retained attribution.
