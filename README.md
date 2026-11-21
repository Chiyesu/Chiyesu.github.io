# The Digital Frontier

The interactive 3D portfolio of Mashimbwa Chiyesu. Built with Next.js, TypeScript, Tailwind CSS, React Three Fiber, GSAP and Framer Motion. It has no backend or database.

## Install and run

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run build    # writes the static site to out/
```

## Update personal information

Edit `src/content/site.ts`:

- `links` holds your GitHub, LinkedIn, email and CV. Any `null` value displays as "To be added".
- For the CV, put the file at `public/cv.pdf` and set `cv: "/cv.pdf"`.
- `availability.status` can be `open`, `limited`, `unavailable` or `on-request`. Set `visible: false` to hide it.

Other content is in `src/content/`: `expertise.ts`, `experience.ts` and `thinking.ts`.

## Update projects

Edit `src/content/projects.ts`. Each entry generates a page at `/projects/<slug>`.

- `status` can be `completed`, `in-development`, `prototype`, `concept` or `null`. No badge shows while it is `null`.
- `contributions` and `links` display "To be added" while empty.
- To add screenshots, place them in `public/projects/<slug>/` and add them to `media`:

```ts
media: [{ src: "/projects/zitfuse/home.webp", alt: "Zitfuse home screen", width: 1280, height: 800 }],
```

## Replace the 3D asset

The hero loads `public/models/frontier.glb`, which must contain mesh nodes named `Ribbon`, `Core`, `RingA` and `RingB`. Materials are applied in `src/three/Sculpture.tsx`.

To regenerate the model, fallback poster and share image with Blender:

```bash
blender --background --factory-startup --python blender/build_sculpture.py -- public
```

To use a different model, export a Draco-compressed GLB with those node names, or update the node references in `Sculpture.tsx`.

### Section objects

Every other 3D object is procedural and lives in `src/three/models.tsx`. They all share one canvas. To add one, create the model, register it in `models`, add its name to `src/three/modelNames.ts`, and place it in any section:

```tsx
<Object3D name="globe" className="h-64 w-64" />
```

## Project structure

```text
blender/             Source script for the sculpture
public/              Model, Draco decoder and images
src/app/             Routes, metadata, sitemap and robots
src/components/      Layout, page sections and project components
src/content/         All editable content and its types
src/lib/             Device capability detection and GSAP setup
src/three/           3D scene, separate from the interface
```

## Deploy

The site is hosted on GitHub Pages at https://chiyesu.github.io. Every push to `main` builds and publishes it through `.github/workflows/deploy.yml`.

`npm run build` writes a static site to `out/`, so any static host can serve that folder. If the address changes, update `NEXT_PUBLIC_SITE_URL` in the workflow, because canonical links, the sitemap and social previews depend on it.
