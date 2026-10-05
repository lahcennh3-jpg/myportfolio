# Ahmed — AI Security Engineering Portfolio

A static portfolio for Ahmed Amhdour’s AI application and product security direction.

The opening homepage section presents Ahmed Amhdour’s full name and a personal introduction covering his AI security role, sensitive-data protection, authorization and agent security boundaries. Header and footer branding use the same full name. The opening section uses professional focus language without describing learning or studying.

The public site contains **Home, Selected Work, About and Contact**, with four generic AI platform profiles. Product identities, named study dependencies, research inputs, detailed learning plans and research downloads are excluded from the current source and build output. Required asset notices remain intact.

## Content and evidence

Selected Work uses the same four platform profiles as About: enterprise AI assistants, self-hosted AI chat, private AI knowledge workspaces, and multi-provider AI conversation platforms. Cards include concise summaries, five security-focus tags and platform filters. Each profile links to a detail page with its platform context, the full supplied security scope and links back to About. These profiles describe security focus and contain no assessment results or claims of completed engagements.

About contains Ahmed’s supplied biography, GITEX AFRICA 2026 Rising Star (Individual) award statement, four generic AI-system project profiles and full security engineering approach. The homepage has a short professional About summary and award line, without learning or studying language. The portrait, award-presentation photo and certificate/trophy photo are supplied originals, copied without pixel changes; the jury screenshot is not published. Photo links open the full original image.

The original template’s 18 routes remain available as generic portfolio equivalents. The three previous project URLs remain as noindex equivalents of the matching platform profiles. The alternative slider and static video-fallback routes, mobile navigation, sticky header, filtering, carousel, disclosures, scroll transitions and footer remain supported.

## Contact and message delivery

Home and Contact display Ahmed Amhdour, `ahmedamhdour@gmail.com` and `+212 610 374 791`, preserving the supplied international number `00212610374791`. Email and phone links also appear in the shared footer.

The contact form sends a native HTTPS POST to `https://formsubmit.co/ahmedamhdour@gmail.com`. It provides labeled name, email, subject and message fields, browser validation, a hidden honeypot and FormSubmit’s default CAPTCHA. Submissions are processed by FormSubmit, which is disclosed beside the form. The security policy allows form submission only to this origin and the site itself; client-side network connections remain restricted to the site.

**Mailbox activation is required and has not been verified.** According to [FormSubmit’s setup guide](https://formsubmit.co/), the first submission triggers a confirmation email. Submit one test message through the deployed form, complete any provider verification, then follow the activation link received at `ahmedamhdour@gmail.com` (check spam if necessary). Submit another message to verify delivery and the reply address. No external submission or activation email was sent during implementation.

JavaScript adds an absolute thank-you URL derived from the current page’s origin and deployment path; query strings and fragments are excluded from the submitted page URL. Without JavaScript, native submission uses FormSubmit’s default confirmation page. The local thank-you page offers direct contact links and does not claim email delivery.

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
| `data/portfolio.json` | Public profile, contact details and form endpoint, full About text, photo descriptions and metadata for the four selected projects |
| `src/layout.html` | Shared static shell and four-item navigation |
| `scripts/build.mjs` | Static generator and explicit public asset allowlist |
| `scripts/check-content.mjs` | Disclosure, artifact, link and evidence-status checks |
| `scripts/check.mjs` | HTML, links, fragments and asset checks |
| `scripts/check-http.mjs` | Local HTTP integration and security-header checks |
| `assets/` | Retained template/vendor files and portfolio overrides |
| `docs/` | Adaptation, provenance, asset notices and verification reports |

## Verification

The production build and content checks pass for 26 HTML pages and 18 assets, including three original JPEG photos. Content verification checks all 18 supplied About paragraphs, the four matching Selected Work profiles on six listing pages, five focus tags per project, twelve approach focus areas, eight methodology steps and three legacy project URLs. Four contact forms are checked for their endpoint, required fields, accessible labels and spam protection; all pages include the supplied email and phone links in the footer. Static validation checks 985 link/asset references. Local HTTP validation checks 26 pages + 18 assets + robots.txt = 45 nonempty HTTP 200 responses, all carrying the intended security headers and contact form policy; the photos use `image/jpeg`. Six isolated JavaScript checks verify return URLs across root and subpath deployments, query strings, local previews, non-HTTP pages and rejected cross-origin return paths, without making submissions. A disclosure audit compares the output with all 143 former study-project identities; none appear in the published content or project links. Obsolete encoded staging payloads are removed from the current source. These checks do not confirm mailbox activation or email delivery.

## Publishing

Vercel build configuration uses `npm run build:production` and output `public`. Source is published on GitHub `main`. The repository-linked project is `myportfolio` under `amhdour1s-projects`. GitHub reported a successful Vercel deployment for preceding content revision `bda126fcfad077a995d1d80880c41c141d79ac3f`; its [deployment record](https://vercel.com/amhdour1s-projects/myportfolio/63F9Sj883UQD3jhGoc2Mjn54n8Cw) is linked from the GitHub commit status. New revisions are checked through the repository-linked deployment status. Project management access still returns 403 and requires reauthentication to that scope. The production origin, deployment target and live browser behavior remain unverified.

Set `productionUrl` only after verifying the actual HTTPS origin, then rebuild to generate canonical metadata and the sitemap. Duplicate template routes are noindex and point to the corresponding primary page when an origin is available.

Local checks do not establish browser layout, keyboard or motion behavior, console cleanliness, or production availability. The requested six viewport checks remain outstanding.

## Publication boundary

The current website and main source omit the full research system. Previous Git commits remain historical records; removing current files or navigation does not remove earlier repository versions or copies. Repository visibility and any history rewrite are separate actions, not part of this content revision.

See `docs/CONTENT_PROVENANCE.md`, `docs/TEMPLATE_ADAPTATION.md` and `docs/THIRD_PARTY_NOTICES.md` for source scope and retained attribution.
