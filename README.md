<div align="center">

  # SVG Scrapper

  ### Search, customize, extract, and download SVG icons

  <p>
    A fast browser dashboard plus Python and Node.js CLI tools for exploring<br>
    Iconify collections and downloading SVG assets from allsvgicons.com.
  </p>

  <a href="https://github.com/Soheil-Aghayani/svg-scrapper">
    <img src="https://img.shields.io/badge/GITHUB-REPOSITORY-f8fafc?style=for-the-badge&labelColor=0f172a" alt="Open the SVG Scrapper GitHub repository">
  </a>
  <a href="https://iconify.design/">
    <img src="https://img.shields.io/badge/ICONIFY-CATALOG-60a5fa?style=for-the-badge&labelColor=0f172a" alt="Open the Iconify catalog">
  </a>
  <a href="https://allsvgicons.com/">
    <img src="https://img.shields.io/badge/ALLSVGICONS-SOURCE-2dd4bf?style=for-the-badge&labelColor=0f172a" alt="Open allsvgicons.com">
  </a>
</div>

<br>

<div align="center">

`SVG ICON TOOLKIT`  /  `WEB DASHBOARD`  /  `CLI UTILITIES`

`JavaScript`  `Python`  `Node.js`  `Vite`  `Iconify API`

</div>

## The idea

SVG Scrapper turns a large icon catalog into a practical workspace for frontend developers, designers, and anyone who needs clean SVG assets quickly. Search globally or within a collection, inspect the results visually, adjust color and size, copy path data or complete SVG markup, and export one icon or a ZIP bundle.

The project is intentionally lightweight. The web dashboard uses semantic HTML, custom CSS, browser APIs, and focused JavaScript. The same workflow is available from the terminal through small Python and Node.js utilities.

```text
$ input
keyword, collection prefix, or allsvgicons.com URL

$ workflow
catalog/search -> SVG markup -> preview -> path/SVG/file export

$ goal
make the right icon easy to find, inspect, and reuse
```

## What you can do

| Surface | Capabilities |
| --- | --- |
| Web dashboard | Search 334k+ icons globally or inside a selected collection, then preview up to 600 results smoothly in the browser |
| Icon controls | Change preview color and size, filter loaded results, select or deselect icons, and copy path data as JSON |
| Per-icon actions | Copy an SVG path, copy styled SVG markup, or save an individual `.svg` file |
| Batch export | Download selected or filtered icons as a ZIP archive with the current styling applied |
| URL parsing | Paste an `allsvgicons.com/pack/...` or `allsvgicons.com/collections/...` URL and load the matching collection |
| Python CLI | Download complete collections with concurrent workers and export directories, ZIP archives, path JSON, or SVG sprites |
| Node.js CLI | Download a limited set from a collection into a directory and create a companion `_paths.json` file |

## How the dashboard works

```text
Search keyword / collection / source URL
                  |
                  v
      Iconify search or catalog API
                  |
                  v
          Fetch SVG markup in batches
                  |
                  v
  Preview -> customize -> copy or export
```

The browser talks directly to the public Iconify API and SVG endpoints. For collection downloads, the CLI utilities try the allsvgicons.com SVG endpoint first, with the Iconify SVG endpoint as a fallback in the Python implementation.

## Run the web dashboard

Requirements: Node.js 18+ and npm.

```bash
git clone https://github.com/Soheil-Aghayani/svg-scrapper.git
cd svg-scrapper
npm install
npm run dev
```

Open the localhost URL printed by Vite. To create a production build or preview it locally:

```bash
npm run build
npm run preview
```

The dashboard loads JSZip from its browser CDN URL when creating ZIP archives, so an internet connection is required for live icon searches and ZIP export.

## Use the Python CLI

The Python utility supports collection prefixes and allsvgicons.com collection URLs.

```bash
# Download a complete collection into a ZIP archive
python svg_scraper.py --pack lucide --zip lucide_icons.zip

# Save a limited collection to a directory
python svg_scraper.py --pack heroicons --output ./heroicons --limit 100

# Extract path d attributes into JSON
python svg_scraper.py --pack circle-flags --export-paths flags_paths.json

# Build an SVG sprite with concurrent downloads
python svg_scraper.py --url https://allsvgicons.com/collections/flags/ \
  --limit 200 --workers 12 --export-sprite flags_sprite.svg
```

Useful options:

| Option | Purpose |
| --- | --- |
| `--pack`, `-p` | Collection prefix or allsvgicons.com URL |
| `--url`, `-u` | Alias for `--pack` |
| `--output`, `-o` | Directory for individual SVG files |
| `--zip`, `-z` | ZIP archive destination |
| `--export-paths` | JSON file containing extracted `path[d]` values |
| `--export-sprite` | Combined SVG sprite-sheet destination |
| `--limit`, `-l` | Maximum number of icons; `0` means all |
| `--workers`, `-w` | Number of concurrent download workers; default is `20` |

## Use the Node.js CLI

```bash
node cli.js --pack lucide --limit 30 --output ./lucide_icons
node cli.js --pack simple-icons --limit 50 --output ./brand_icons
```

The Node.js CLI reads the collection catalog, downloads the requested SVG files, and writes `_paths.json` beside them.

## Project structure

```text
index.html          SEO-ready web dashboard shell
style.css           Dark glassmorphism interface styling
app.js              Search, preview, selection, path, and ZIP workflows
svg_scraper.py      Concurrent Python downloader and exporter
cli.js              Node.js collection downloader
package.json        Vite scripts and project metadata
README.md           Project documentation
```

## SEO and discoverability

The dashboard includes a descriptive page title, keyword-aware meta description, author and application metadata, Open Graph and Twitter card tags, theme information, and `SoftwareApplication` structured data. The visible heading and supporting copy also describe the core search, extraction, and download use cases in plain language.

## Data, licensing, and responsible use

- Collection catalogs and search results are requested from the public [Iconify API](https://iconify.design/docs/api/).
- SVG downloads use [allsvgicons.com](https://allsvgicons.com/) and, in the Python CLI, the Iconify SVG endpoint as a fallback.
- Individual icon collections can have different authors and licenses. Review the source collection’s license before redistributing downloaded assets.
- SVG Scrapper is an independent utility and is not affiliated with Iconify or allsvgicons.com.
- Be considerate of public APIs and source services: avoid unnecessarily large or repeated downloads.

## About the builder

SVG Scrapper is built by [Soheil Aghayani](https://github.com/Soheil-Aghayani), an environmental engineer and software developer who enjoys turning complex information into useful tools and clear interfaces.

<div align="center">
  <br>
  <sub>Built with curiosity, practical tooling, and a healthy appreciation for well-formed paths.</sub>
</div>
