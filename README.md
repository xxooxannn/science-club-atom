# ATOMS — Science Club of Rosybuds School

The official website of ATOMS, running at **atom.rosybuds.edu.np**.

Built with [Astro](https://astro.build) + Tailwind CSS v4. Fully static output — no server,
no database, nothing to maintain except content.

---

## Local development

```bash
npm install     # once
npm run dev     # dev server at http://localhost:4321
npm run build   # production build → dist/
```

## Deploying to the school's cPanel

The site is a static export, so deploying is just copying files:

1. Run `npm run build` on any computer with Node.js installed
2. Zip the **contents** of the `dist/` folder
3. Log in to cPanel → **File Manager** → open the subdomain folder (`atom.rosybuds.edu.np`'s docroot)
4. Upload the zip → right-click → Extract
5. Done. No `.htaccess` needed for a multi-page static site.

## Editing content (the part you'll actually do weekly)

| What | Where | How |
|---|---|---|
| Publish an article | `src/content/articles/` | Add a `my-post.md` file — copy the frontmatter style from an existing one. Rebuild + redeploy. |
| Publish a report | `src/content/reports/` | Same. Put the abstract in frontmatter; add a `file:` link to a hosted PDF when you have one. |
| Update events | `src/data/events.json` | Edit directly. `"upcoming": true/false` controls which section it shows in. |
| Change meeting time / email / footer info | `src/components/SiteFooter.astro`, `src/pages/join.astro` | Plain text edits. |
| Committee names | `src/pages/about.astro` | Replace the "Open position" placeholder cards. |

After any edit: `npm run build` → re-upload `dist/` to cPanel.

## Activating the submission form (one-time)

The form on `/join` is wired for [Web3Forms](https://web3forms.com) (free):

1. Go to web3forms.com → enter the club's email → receive an access key
2. Open `src/pages/join.astro`
3. Set `const formEnabled = true;`
4. Replace `YOUR_ACCESS_KEY` with the real key
5. Rebuild + redeploy

Submissions land in the club inbox — moderation happens before anything gets published here.

## Replacing placeholder photos

All photos currently point to `picsum.photos` placeholders (grayscale). Replace them with real
club photos:

- **Article images:** each article's frontmatter has an `image:` URL — swap the URL or drop the
  file into `public/` and reference it like `/images/cloud-chamber.jpg`
- **Home archive strip:** `src/pages/index.astro` — search for "PLACEHOLDER PHOTOS"
- **Recommended size:** 960×600 (8:5) for articles, 768×512 (3:2) for the strip

Search the whole codebase for `TODO` and `PLACEHOLDER` to find every spot waiting for real
content (club history milestones, committee names, contact email).

## Tech notes

- Fonts are self-hosted via Fontsource (Playfair Display, Outfit, IBM Plex Mono)
- Animations respect `prefers-reduced-motion`
- Colors live in one place: `src/styles/global.css` under `@theme`
