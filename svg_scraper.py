#!/usr/bin/env python3
"""
SVG Scrapper & Extractor for allsvgicons.com
Command-Line Interface Utility
"""

import argparse
import json
import os
import re
import sys
import urllib.request
import zipfile
from concurrent.futures import ThreadPoolExecutor, as_completed

USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

def parse_prefix_from_input(input_val):
    if not input_val:
        return ''
    val = input_val.strip().lower()
    if 'allsvgicons.com/pack/' in val:
        return val.split('allsvgicons.com/pack/')[1].split('/')[0]
    if 'allsvgicons.com/collections/' in val:
        coll = val.split('allsvgicons.com/collections/')[1].split('/')[0]
        mapping = {
            'flags': 'circle-flags',
            'emoji': 'openmoji',
            'brands': 'logos',
            'programming': 'devicon',
            'material': 'mdi',
            'weather': 'weather-icons',
            'cryptocurrency': 'cryptocurrency-color',
            'e-commerce': 'fluent',
            'arrows': 'lucide',
            'duotone': 'solar',
        }
        return mapping.get(coll, coll)
    return re.sub(r'[^a-z0-9_-]', '', val)

def fetch_icon_names(prefix):
    """Fetch complete list of icon names from Iconify catalog API."""
    url = f"https://api.iconify.design/collection?prefix={prefix}"
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    try:
        res = urllib.request.urlopen(req)
        data = json.loads(res.read().decode('utf-8'))
        icon_names = []
        if 'uncategorized' in data and isinstance(data['uncategorized'], list):
            icon_names.extend(data['uncategorized'])
        if 'categories' in data and isinstance(data['categories'], dict):
            for cat, icons in data['categories'].items():
                if isinstance(icons, list):
                    icon_names.extend(icons)
        return sorted(list(set(icon_names)))
    except Exception as e:
        print(f"[!] Error fetching collection catalog for prefix '{prefix}': {e}")
        return []

def download_single_svg(prefix, icon_name):
    """Fetch raw SVG content for an icon."""
    urls = [
        f"https://i.allsvgicons.com/{prefix}/{icon_name}.svg",
        f"https://api.iconify.design/{prefix}/{icon_name}.svg"
    ]
    for url in urls:
        try:
            req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
            with urllib.request.urlopen(req, timeout=10) as res:
                content = res.read().decode('utf-8')
                return icon_name, content
        except Exception:
            continue
    return icon_name, None

def extract_path_d(svg_markup):
    """Extract d attribute strings from <path> elements."""
    if not svg_markup:
        return []
    matches = re.findall(r'<path[^>]+d=["\']([^"\']+)["\']', svg_markup)
    return matches

def main():
    parser = argparse.ArgumentParser(description="Extract & download SVG icons from allsvgicons.com")
    parser.add_argument("--pack", "-p", help="Pack name or allsvgicons.com URL (e.g. lucide, circle-flags, https://allsvgicons.com/pack/lucide/)")
    parser.add_argument("--url", "-u", help="Alias for --pack URL")
    parser.add_argument("--output", "-o", help="Output directory to save SVG files")
    parser.add_argument("--zip", "-z", help="Save downloaded SVGs to a ZIP archive (e.g. icons.zip)")
    parser.add_argument("--export-paths", help="Save extracted SVG path d attributes to a JSON file (e.g. paths.json)")
    parser.add_argument("--export-sprite", help="Save combined SVG sprite sheet to file (e.g. sprite.svg)")
    parser.add_argument("--limit", "-l", type=int, default=0, help="Limit total number of icons to fetch (0 for all)")
    parser.add_argument("--workers", "-w", type=int, default=20, help="Number of concurrent worker threads")

    args = parser.parse_args()

    input_val = args.pack or args.url
    if not input_val:
        print("Error: Please specify --pack or --url. Example:")
        print("  python svg_scraper.py --pack lucide --output ./lucide_icons")
        print("  python svg_scraper.py --pack https://allsvgicons.com/collections/flags/ --zip flags.zip")
        sys.exit(1)

    prefix = parse_prefix_from_input(input_val)
    print(f"[*] Extracting icon set: '{prefix}'")

    icon_names = fetch_icon_names(prefix)
    if not icon_names:
        print(f"[!] No icons found for '{prefix}'. Exiting.")
        sys.exit(1)

    total_found = len(icon_names)
    print(f"[*] Found {total_found} total icons in collection.")

    if args.limit > 0 and args.limit < total_found:
        icon_names = icon_names[:args.limit]
        print(f"[*] Limiting download to {args.limit} icons.")

    print(f"[*] Downloading {len(icon_names)} SVG files using {args.workers} threads...")

    fetched_icons = {}
    paths_dict = {}

    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {executor.submit(download_single_svg, prefix, name): name for name in icon_names}
        completed = 0
        for future in as_completed(futures):
            completed += 1
            name, svg_content = future.result()
            if svg_content:
                fetched_icons[name] = svg_content
                paths_dict[name] = extract_path_d(svg_content)
            
            if completed % 50 == 0 or completed == len(icon_names):
                print(f"    Progress: {completed}/{len(icon_names)} ({len(fetched_icons)} succeeded)")

    print(f"\n[+] Successfully retrieved {len(fetched_icons)} SVGs.")

    # 1. Output directory
    if args.output:
        os.makedirs(args.output, exist_ok=True)
        for name, svg_str in fetched_icons.items():
            file_path = os.path.join(args.output, f"{name}.svg")
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(svg_str)
        print(f"[+] Saved {len(fetched_icons)} SVG files to directory: {args.output}")

    # 2. ZIP Archive
    if args.zip:
        zip_filename = args.zip if args.zip.endswith('.zip') else f"{args.zip}.zip"
        with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zf:
            for name, svg_str in fetched_icons.items():
                zf.writestr(f"{prefix}/{name}.svg", svg_str)
        print(f"[+] Created ZIP archive: {zip_filename}")

    # 3. Export Paths JSON
    if args.export_paths:
        json_filename = args.export_paths if args.export_paths.endswith('.json') else f"{args.export_paths}.json"
        with open(json_filename, 'w', encoding='utf-8') as f:
            json.dump(paths_dict, f, indent=2)
        print(f"[+] Saved SVG path data to JSON file: {json_filename}")

    # 4. Export Sprite Sheet
    if args.export_sprite:
        sprite_filename = args.export_sprite if args.export_sprite.endswith('.svg') else f"{args.export_sprite}.svg"
        sprite_lines = ['<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">']
        for name, svg_str in fetched_icons.items():
            viewbox_match = re.search(r'viewBox=["\']([^"\']+)["\']', svg_str)
            viewbox = viewbox_match.group(1) if viewbox_match else '0 0 24 24'
            inner_content = re.sub(r'</?svg[^>]*>', '', svg_str).strip()
            sprite_lines.append(f'  <symbol id="icon-{name}" viewBox="{viewbox}">\n    {inner_content}\n  </symbol>')
        sprite_lines.append('</svg>')
        with open(sprite_filename, 'w', encoding='utf-8') as f:
            f.write('\n'.join(sprite_lines))
        print(f"[+] Saved SVG sprite sheet to: {sprite_filename}")

    if not (args.output or args.zip or args.export_paths or args.export_sprite):
        print("\nNotice: No output option specified (--output, --zip, --export-paths, or --export-sprite).")
        print("Example path data for first icon:")
        first_icon = list(paths_dict.keys())[0]
        print(f"  Icon: '{first_icon}'")
        print(f"  Paths: {paths_dict[first_icon]}")

if __name__ == '__main__':
    main()
