# Ahmed — AI Security Engineering Portfolio

A static portfolio adapted from the supplied **WAAN Business Consulting HTML template by zcube**, for Ahmed’s **AI Security Engineer / AI Application & Product Security Engineer — 2026+** career direction.

**Current state: review draft. No production deployment has been completed.**

The supplied website brief and template are available. The required `onyx_security_mission_catalog_2026-09-30_final (1).md` was not included in the available attachments. The connected Vercel tools returned no accessible teams or projects. Individual mission titles, execution evidence, verified supporting labs, and the full ecosystem register cannot yet be confirmed.

## What the draft contains

- The adapted WAAN hero, grid and spacing system, responsive theme, mobile menu, sticky navigation, gallery filtering, evidence carousel, practice timeline, contact layout, scroll transitions, and footer.
- Home, About, Security Focus, Onyx Lab, case-study tracks, mission registry, ecosystem, methodology, evidence, roadmap, research, supporting labs, contact, and credits.
- All **M01–M40 identifiers** with detail pages. **Zero catalog mission records have been imported.** Missing titles and experiment details remain explicitly pending.
- All **C01–C08 portfolio candidates**, allocated as specified in the brief. Each preserves the requested **24-field case-study format**. Design questions and proposed controls are labelled as plans; no execution results are invented.
- The ten ecosystem names specified in the brief. The complete catalog project register is still required.
- No invented employer, customer, testimonial, years of experience, skill percentages, email address, telephone number, LinkedIn account, vulnerability, or professional assessment.

## Local development

Node.js is sufficient. There are no package dependencies to install.

```bash
npm run build
npm run check
npm run check:http
npm run preview
```

The local static preview prints its address (port `8765` by default). Stop it with `Ctrl+C`. Set `PORT` to change the port.

```bash
npm run build:production
```

The production command intentionally refuses to publish until catalog import and content verification are complete. Missing evidence must be resolved by importing the source, not by bypassing the gate.

## Directory structure

```text
assets/css/            Original WAAN grid/theme/responsive CSS and portfolio overrides
assets/js/vendor/      Retained jQuery, MeanMenu, Slick, GSAP, and ScrollTrigger files
assets/js/portfolio.js Accessible interaction adaptation and filtering
data/portfolio.json    Source state, focus clusters, tracks, roadmap, ecosystem, evidence
src/layout.html       WAAN-derived static shell, shared navigation, metadata, footer
scripts/build.mjs     Escaped, data-driven static page generation
scripts/check.mjs     Source, links, headings, IDs, mission and case-study checks
scripts/serve.mjs     Local preview with the intended deployment security headers
docs/                 Inventory, adaptation checklist, provenance, verification
public/               Generated static output (not committed)
vercel.json           Static output and deployment headers
```

## Evidence principles

`SRC` denotes a source observation; `DOC` a documented behavior; `INF` a stated inference; `PLAN` a proposed experiment; and `RUN` observed execution within a named surface. Supporting recipe execution, a synthetic lab, native/runtime verification, independent assessment, and professional operating experience are separate gates.

Currently the case-study tracks are **PLAN / Case Study Candidate**, based on the supplied brief. Individual mission evidence classifications remain **unknown / catalog pending**, rather than automatically becoming `PLAN` or `RUN`. No supporting lab is labelled executed or verified.

## Updating content and statuses

1. Read and reconcile the entire original catalog, including all M01–M40 entries, portfolio allocations, supporting recipes, assessment sections, transfer relationships, capstone, and project register.
2. Populate `missions` in `data/portfolio.json` with all 40 exact IDs, source-backed titles, problems, surfaces, responsibilities, deliverables, domains, status, classification, and `sourceRefs`.
3. Keep source observations, plans, inferences, and runtime observations distinct. Record the actual catalog revision in `source.catalogRevision` and mark `catalogAvailable` only after the source has been read.
4. Populate `supportingLabs` only with observed execution records. A `RUN` record must include `observedExecution`, `executionSurface`, and `sourceRefs`, with narrow limitations.
5. Reconcile the eight tracks and the full ecosystem register with the catalog. The current case-study pages are design candidates; completed case-study evidence needs to be integrated into the generator before upgrading their status.
6. Run the checks and complete browser QA. Set `publishReady` only after content verification. Do not treat this Boolean as substitute evidence.
7. Set `productionUrl` to the verified HTTPS origin when available, then rebuild for canonical metadata and sitemap generation.

## Vercel deployment

Use **Other / static output**, with `npm run build:production` and `public` as the output directory. `vercel.json` records these settings. Link the project to `lahcennh3-jpg/myportfolio` and set the production branch to `main` once the completed source is ready to merge.

The draft is kept on `draft/ai-security-portfolio` while source import is blocked. The initial `main` branch contains this truthful project README; it is not a finished deployed website.

An accessible Vercel team is required before the repository can be linked with the connected Vercel tool. Team/project creation, automatic deployment, production URL, live asset loading, and live navigation have **not** been verified.

## Verification

Static compilation and the authored checks pass for **86 HTML pages**, **3,277 link/asset references**, **40 mission identifiers**, and **24 fields in each of eight candidate tracks**. The generated report is `docs/static-verification.json`.

The HTTP integration check also passes: **86 pages + 14 asset files + robots.txt = 101 responses**, all nonempty HTTP 200 responses with the intended security headers. This test runs the preview server and its requests in the same process; it does not establish browser rendering or a production deployment. Its report is `docs/http-verification.json`.

The cloud browser could not open the local HTTP preview; direct local-file navigation was also rejected by its URL policy. Browser visual QA, the six requested viewport checks, actual CSS layout, browser console, and live production checks remain **unverified**. The presence of responsive CSS does not establish that those checks passed.

## Attribution and licenses

The supplied archive’s documentation identifies WAAN and zcube. Copyright/license notices remain in the retained vendor files. No blanket MIT license is asserted for the template or dependencies. Template demonstration images and logos are not used as personal or project evidence. The bundled member-only SplitText plugin is excluded; its intended reveal effect is adapted through GSAP and CSS.

See `docs/TEMPLATE_ADAPTATION.md`, `docs/TEMPLATE_INVENTORY.md`, and `docs/THIRD_PARTY_NOTICES.md` for the preservation and attribution details.
