# WAAN → Ahmed portfolio checklist

The original archive and both embedded ZIPs were fully extracted before edits. `template-inventory.json` records every original file, all 18 HTML pages, sections, forms, links, assets, headings, animation hooks, stylesheet references, and script headers. The supplied documentation was read in full; some documented versions differ from the actual bundled versions, so the actual files were used.

## Component preservation

| Original component | Adaptation | State |
|---|---|---|
| Static HTML/CSS/JavaScript architecture | Build emits plain HTML and retained local CSS/JS; no React or Next.js | Implemented |
| Bootstrap grid | Original Bootstrap 5.0.2 CSS and `container` / `row` / column layouts | Retained |
| Large two-column hero | Ahmed’s career direction and Onyx lab scope | Adapted |
| Alternate slider/video routes | Slider route has three manual, evidence-aware hero slides. Video route supports a supplied local MP4 through `heroVideo`, with a static fallback when footage is absent | Implemented, browser unverified; user-owned footage not supplied |
| Header and top bar | Wordmark, verified GitHub route, portfolio navigation, source/evidence disclosures | Adapted |
| Mobile navigation | Original MeanMenu plugin with labels, expanded state, keyboard activation and Escape | Implemented, browser unverified |
| Sticky header | WAAN’s scroll threshold retained, with space reserved for the fixed header | Implemented, browser unverified |
| Preloader | Bounded wordmark loading treatment; no indefinite blocker and no dependency without JavaScript | Adapted, browser unverified |
| About/service cards | Six topic clusters with scope labels, without invented expertise percentages | Adapted |
| Skills/progress presentation | Security focus and roadmap; no fabricated scores | Adapted |
| Feature section | Onyx study surfaces, with explicit planned scope | Adapted |
| Brand strip | Source-backed transfer/reference ecosystem, without fake company endorsements | Adapted |
| Portfolio grid and category filters | C01–C08 candidates; keyboard-accessible native filtering and result counts | Implemented, browser unverified |
| Portfolio detail page | All 24 requested case-study fields on each track page | Implemented |
| Testimonial carousel | Original Slick carousel repurposed to evidence labels; fake endorsements removed | Implemented, browser unverified |
| Counters | Accurate identifiers/candidate counts, rather than fake project or customer totals | Adapted |
| Team/timeline rows | Planned engineering-practice strands; no employers or paid jobs | Adapted |
| Contact design | Original section composition with GitHub route; no unconfigured submission | Adapted |
| Blog/research cards | Complete catalog research and four scoped supporting-recipe records | Adapted |
| FAQ/accordion | Native keyboard-accessible disclosures explaining evidence boundaries | Adapted |
| Shop and pricing pages | Ecosystem and evidence/assessment equivalents; no irrelevant sales claims | Adapted |
| Scroll reveal and hover states | Retained GSAP/ScrollTrigger with reduced-motion handling and CSS hover styles | Implemented, browser unverified |
| SplitText membership plugin | Comparable reveal without distributing the member-only plugin | Replaced deliberately |
| Stock photo lightboxes / parallax footage | No supplied evidence imagery or user-owned footage is available; stock imagery is not portrayed as personal work | Evidence assets pending |
| Footer | Portfolio navigation, verified source/profile links, WAAN attribution | Adapted |
| Responsive spacing | Original responsive file retained; explicit overrides at 479, 767, 991, 1199, 1600 pixels | Implemented, six viewport checks unverified |
| Accessibility | English language, one h1 per page, skip link, semantic controls, focus states, accessible filtering and no contact form | Static portions checked; browser behavior unverified |

## Original routes

| WAAN route | Portfolio purpose |
|---|---|
| `index.html` | Home |
| `index-2.html` | Retained alternate home route |
| `index-3.html` | Retained alternate home route with a static fallback |
| `about.html` | About and planned engineering practice |
| `services.html` | Security focus clusters |
| `single-service.html` | Onyx lab scope |
| `projects.html` | C01–C08 candidates |
| `single-projects.html` | C01 detail equivalent |
| `team.html` | M01–M40 registry |
| `team-single.html` | M01 record equivalent |
| `blog.html` | Research register |
| `blog-details.html` | Security methodology |
| `faq.html` | Evidence FAQ |
| `pricing.html` | Evidence and assessment gates |
| `shop.html` | Ecosystem register |
| `shop-details.html` | Onyx scope equivalent |
| `contact.html` | Supplied GitHub contact route |
| `thank-you.html` | Contact route; no message submission is claimed |

Additional descriptive URLs provide the mission, case-study, roadmap, methodology, ecosystem, and evidence views without requiring visitors to navigate the old demonstration labels.

## Catalog reconciliation

The complete catalog is imported: all 40 mission records and 640 A–P fields, exact C01–C08 allocations, 40 transfer routes, the 141-input ecosystem plus two distinct component owners, four recorded supporting runs and all 20 source sections. Original source bytes and recipe hashes are verified. Mission execution, independent assessment, native adapters and professional operating evidence remain pending.

## Outstanding delivery checks

- Review hero variants and browser interactions; user-owned footage remains optional and was not supplied.
- Perform browser layout, keyboard, motion, console and asset checks at 320, 375, 768, 1024, 1440 and 1920 pixel widths.
- Deploy the completed main source through the existing Vercel `mywebsite` project. Access currently returns 403 Forbidden and requires reauthentication to `amhdour1s-projects`.
- Verify the actual HTTPS production deployment and configure its confirmed canonical origin. No production success is asserted by local checks.
