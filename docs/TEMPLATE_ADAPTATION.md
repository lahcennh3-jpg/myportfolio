# Template adaptation

The supplied archive and documentation were read and inventoried before adaptation. The website retains static HTML/CSS/JavaScript architecture, the original grid/theme, responsive spacing, hero variants, mobile navigation, sticky header, bounded preloader, filters, carousel, native disclosures, scroll transitions and footer.

The public presentation is curated around four primary pages and four generic AI platform profiles derived from About. Product-specific research content and working plans are excluded. The project profiles describe security focus without presenting assessment results.

About now presents the full supplied biography and award recognition, a responsive two-column grid for four generic AI-system profiles, and the supplied security engineering approach. Three original user photos are included with intrinsic dimensions, descriptive alternative text and links to the originals. Project cards and photo galleries stack at narrow widths; certificate and trophy images use containment. The homepage About preview includes a short professional summary and award statement. Existing focus carousel and native disclosures remain available below the full About content.

Selected Work uses a two-column card grid with platform filters, short summaries and five focus tags per card. Four detail pages include the full corresponding security-focus paragraph and About links. The three older project URLs remain available as noindex equivalents; the original template detail routes now show the matching platform profile.

Home and Contact include the supplied name, email and mobile number alongside a responsive message form. The shared footer contains email and phone links on all routes. The form uses native POST to FormSubmit, named and labeled fields, required name/email/message fields, an optional subject, a hidden honeypot and the provider’s default CAPTCHA. The CSP permits the exact form provider origin. JavaScript adds a same-origin absolute return URL; submission still works without JavaScript using the provider’s default thank-you page. Mailbox activation and actual email delivery remain unverified and require the owner’s first-submission confirmation email.

| Original route | Current purpose |
|---|---|
| `index.html` | Home |
| `index-2.html` | Manual slider home variant |
| `index-3.html` | Static fallback home variant |
| `about.html` | Full supplied About text, recognition photos, four project profiles and engineering approach |
| `services.html` | About equivalent |
| `single-service.html` | About equivalent |
| `projects.html` | Selected work |
| `single-projects.html` | Enterprise AI assistant profile equivalent |
| `team.html` | About equivalent |
| `team-single.html` | About equivalent |
| `blog.html` | Selected work equivalent |
| `blog-details.html` | Enterprise AI assistant profile equivalent |
| `faq.html` | About and disclosures equivalent |
| `pricing.html` | About equivalent |
| `shop.html` | Selected work equivalent |
| `shop-details.html` | Multi-provider AI conversation profile equivalent |
| `contact.html` | Supplied contact details and native HTTPS message form |
| `thank-you.html` | Noindex return page with direct contact links; no email delivery claim |

| Additional route | Current purpose |
|---|---|
| `work/enterprise-ai-assistant.html` | Enterprise AI assistant security focus |
| `work/self-hosted-ai-chat.html` | Self-hosted AI chat security focus |
| `work/private-ai-knowledge.html` | Private AI knowledge security focus |
| `work/multi-provider-ai-conversation.html` | Multi-provider AI conversation security focus |
| `work/authorization.html` | Noindex enterprise assistant equivalent |
| `work/retrieval-permissions.html` | Noindex private knowledge equivalent |
| `work/tool-authorization.html` | Noindex multi-provider conversation equivalent |

## Verification boundary

Static content and HTTP checks cover the generated pages and allowlisted assets. Browser keyboard, motion, layout, console and production checks remain unverified. Required visual widths are 320, 375, 768, 1024, 1440 and 1920 pixels.

Production access was previously blocked by a Vercel 403 for the existing project scope. User-owned video footage was not supplied; the alternate video route uses the static fallback.

Copyright and license notices remain in retained assets. The membership-only text-animation plugin and demonstration portraits/logos are excluded. Comparable reveal behavior uses the retained animation tools and CSS. See the asset notices for details.
