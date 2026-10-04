# WAAN → Ahmed portfolio checklist

The original archive and both embedded ZIPs were fully extracted before edits. `template-inventory.json` records every original file, all 18 HTML pages, sections, forms, links, assets, headings, animation hooks, stylesheet references, and script headers. The supplied documentation was read in full; some documented versions differ from the actual bundled versions, so the actual files were used.

## Component preservation

| Original component | Adaptation | State |
|---|---|---|
| Static HTML/CSS/JavaScript architecture | Build emits plain HTML and retained local CSS/JS; no React or Next.js | Implemented |
| Bootstrap grid | Original Bootstrap 5.0.2 CSS and `container` / `row` / column layouts | Retained |
| Large two-column hero | Ahmed’s career direction and Onyx lab scope | Adapted |
| Alternate slider/video routes | Slider route has three manual, evidence-aware hero slides. Video route supports a supplied local MP4 through `heroVideo`, with a static fallback when footage is absent | Implemented, browser unverified; user-owned footage not supplied |
| Header and top bar | Wordmark, verified GitHub route, portfolio navigation, draft source notice | Adapted |
| Mobile navigation | Original MeanMenu plugin with labels, expanded state, keyboard activation and Escape | Implemented, browser unverified |
| Sticky header | WAAN’s scroll threshold retained, with space reserved for the fixed header | Implemented, browser unverified |
| Preloader | Bounded wordmark loading treatment; no indefinite blocker and no dependency without JavaScript | Adapted, browser unverified |
| About/service cards | Six topic clusters with scope labels, without invented expertise percentages | Adapted |
| Skills/progress presentation | Security focus and roadmap; no fabricated scores | Adapted |
| Feature section | Onyx study surfaces, with explicit planned scope | Adapted |
| Brand strip | Proposed transfer/reference ecosystem, without fake company endorsements | Adapted |
| Portfolio grid and category filters | C01–C08 candidates; keyboard-accessible native filtering and result counts | Implemented, browser unverified |
| Portfolio detail page | All 24 requested case-study fields on each track page | Implemented |
| Testimonial carousel | Original Slick carousel repurposed to evidence labels; fake endorsements removed | Implemented, browser unverified |
| Counters | Accurate identifiers/candidate counts, rather than fake project or customer totals | Adapted |
| Team/timeline rows | Planned engineering-practice strands; no employers or paid jobs | Adapted |
| Contact design | Original section composition with GitHub route; no unconfigured submission | Adapted |
| Blog/research cards | Evidence-gated research and supporting-lab empty states | Adapted |
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

## Outstanding requirements

- Import and verify the entire missing Onyx catalog, not a fabricated reconstruction.
- Reconcile every mission’s exact content, evidence status, supporting recipe, and ecosystem relationship.
- Review variant hero behavior and any evidence-media interactions; supply user-owned footage if the optional video treatment is desired.
- Perform browser layout, keyboard, motion, console, and asset checks at 320, 375, 768, 1024, 1440, and large-desktop widths.
- Complete GitHub `main` delivery and Vercel production linking/deployment only after content is complete.
- Open and verify the actual production deployment. No production result is asserted in this draft.
