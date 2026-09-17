const state = {
  packName: '',
  icons: [], // Array of { name, shortName, packPrefix, svgText, paths, selected: bool }
  filteredIcons: [],
  selectedCount: 0,
  currentColor: '#f3f4f6',
  currentSize: '32',
  activeFormat: 'svg',
  isLoading: false,
};

// DOM References
const urlInput = document.getElementById('urlInput');
const presetSelect = document.getElementById('presetSelect');
const loadBtn = document.getElementById('loadBtn');
const filterInput = document.getElementById('filterInput');
const colorPickerBtn = document.getElementById('colorPickerBtn');
const colorPickerPopover = document.getElementById('colorPickerPopover');
const colorSwatchPreview = document.getElementById('colorSwatchPreview');
const colorHexText = document.getElementById('colorHexText');
const customHexInput = document.getElementById('customHexInput');
const swatchBtns = document.querySelectorAll('.swatch-btn');
const sizeSelect = document.getElementById('sizeSelect');
const formatSelect = document.getElementById('formatSelect');
const selectAllBtn = document.getElementById('selectAllBtn');
const deselectAllBtn = document.getElementById('deselectAllBtn');
const copyPathsBtn = document.getElementById('copyPathsBtn');
const downloadZipBtn = document.getElementById('downloadZipBtn');
const gridContainer = document.getElementById('gridContainer');
const statusText = document.getElementById('statusText');
const selectedCountText = document.getElementById('selectedCountText');
const toastContainer = document.getElementById('toastContainer');

// Modal DOM References
const codeModalOverlay = document.getElementById('codeModalOverlay');
const modalPreview = document.getElementById('modalPreview');
const modalPackBadge = document.getElementById('modalPackBadge');
const modalFormatBadge = document.getElementById('modalFormatBadge');
const modalTitle = document.getElementById('modalTitle');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalTabs = document.querySelectorAll('.modal-tab');
const modalCodeLang = document.getElementById('modalCodeLang');
const modalCodeContent = document.getElementById('modalCodeContent');
const modalCopyBtn = document.getElementById('modalCopyBtn');
const modalDownloadSvgBtn = document.getElementById('modalDownloadSvgBtn');

// Toast Utility (Safely escapes text to prevent <svg> HTML tag rendering bugs)
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = 'toast';
  
  let iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="8"/></svg>`;
  if (type === 'success') {
    iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  }

  toast.innerHTML = iconSvg;
  const textSpan = document.createElement('span');
  textSpan.textContent = message;
  toast.appendChild(textSpan);

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'all 0.2s ease';
    setTimeout(() => toast.remove(), 200);
  }, 2200);
}

// Format Labels & Names
const FORMAT_LABELS = {
  svg: 'SVG',
  react: 'React',
  vue: 'Vue',
  css: 'CSS',
  tailwind: 'Tailwind'
};

const FORMAT_TITLES = {
  react: 'React (JSX)',
  vue: 'Vue 3 SFC',
  css: 'CSS Data URI',
  tailwind: 'Tailwind SVG',
  svg: 'SVG markup',
  path: 'Path data'
};

// Convert string to clean PascalCase component name
function toPascalCase(str) {
  if (!str) return 'Icon';
  return str
    .replace(/[:_.-]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^[^a-zA-Z]/, 'Icon$&')
    .replace(/^[a-z]/, c => c.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '');
}

// Transform SVG markup into React (JSX/TSX) component
function svgToReactJsx(svgText, iconName = 'Icon') {
  if (!svgText) return '';
  const compName = toPascalCase(iconName);
  let jsx = svgText
    .replace(/class=/g, 'className=')
    .replace(/stroke-width=/g, 'strokeWidth=')
    .replace(/stroke-linecap=/g, 'strokeLinecap=')
    .replace(/stroke-linejoin=/g, 'strokeLinejoin=')
    .replace(/stroke-miterlimit=/g, 'strokeMiterlimit=')
    .replace(/fill-rule=/g, 'fillRule=')
    .replace(/clip-rule=/g, 'clipRule=')
    .replace(/clip-path=/g, 'clipPath=')
    .replace(/stop-color=/g, 'stopColor=')
    .replace(/stop-opacity=/g, 'stopOpacity=')
    .replace(/stroke-dasharray=/g, 'strokeDasharray=')
    .replace(/stroke-dashoffset=/g, 'strokeDashoffset=')
    .replace(/xmlns:xlink=/g, 'xmlnsXlink=')
    .replace(/xlink:href=/g, 'xlinkHref=');

  jsx = jsx.replace(/<svg\b([^>]*)>/i, '<svg$1 {...props}>');

  return `export function ${compName}(props) {\n  return (\n    ${jsx.split('\n').join('\n    ')}\n  );\n}\n\nexport default ${compName};`;
}

// Transform SVG markup into Vue 3 Single File Component template
function svgToVue(svgText) {
  if (!svgText) return '';
  const withAttrs = svgText.replace(/<svg\b([^>]*)>/i, '<svg$1 v-bind="$attrs">');
  return `<template>\n  ${withAttrs}\n</template>`;
}

// Transform SVG markup into ready-to-use CSS Data URI
function svgToCssDataUri(svgText) {
  if (!svgText) return '';
  const encoded = svgText
    .replace(/[\n\r]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/"/g, "'")
    .replace(/#/g, '%23')
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')
    .replace(/&/g, '%26');
  return `background-image: url("data:image/svg+xml,${encoded}");`;
}

// Inject standard Tailwind class configuration
function svgToTailwind(svgText) {
  if (!svgText) return '';
  if (svgText.includes('class=')) {
    return svgText.replace(/class="([^"]*)"/i, 'class="$1 w-6 h-6 text-current"');
  }
  return svgText.replace(/<svg\b([^>]*)>/i, '<svg$1 class="w-6 h-6 text-current">');
}

// Central code formatter
function getFormattedCode(icon, format) {
  if (!icon || !icon.svgText) return '';
  const styledSvg = applySvgStyles(icon.svgText, state.currentColor, state.currentSize);
  const name = icon.shortName || icon.name || 'icon';
  switch (format) {
    case 'react':
      return svgToReactJsx(styledSvg, name);
    case 'vue':
      return svgToVue(styledSvg);
    case 'css':
      return svgToCssDataUri(styledSvg);
    case 'tailwind':
      return svgToTailwind(styledSvg);
    case 'path':
      return icon.paths && icon.paths.length > 0 ? icon.paths.join(' ') : '';
    case 'svg':
    default:
      return styledSvg;
  }
}

// Copy in specified or active format
function copyFormattedCode(icon, format = state.activeFormat) {
  if (!icon || !icon.svgText) return;
  const code = getFormattedCode(icon, format);
  if (!code) {
    showToast('No code snippet available for this format', 'error');
    return;
  }
  navigator.clipboard.writeText(code);
  const name = icon.shortName || icon.name || 'icon';
  const title = FORMAT_TITLES[format] || format.toUpperCase();
  showToast(`Copied ${title} for '${name}'`, 'success');
}

// Copy Path string for a single icon
function copyIconPath(icon) {
  const pathData = icon.paths.join(' ');
  if (!pathData) {
    showToast('No path attribute found in this SVG', 'error');
    return;
  }
  navigator.clipboard.writeText(pathData);
  const name = icon.shortName || icon.name || 'icon';
  showToast(`Copied Path for '${name}'`, 'success');
}

// Copy full SVG code for a single icon
function copyIconSvgCode(icon) {
  copyFormattedCode(icon, state.activeFormat);
}

// Download a single SVG file directly to disk
function downloadSingleSvg(icon) {
  if (!icon || !icon.svgText) return;
  
  const styledSvg = applySvgStyles(icon.svgText, state.currentColor, state.currentSize);
  
  let rawName = icon.shortName || icon.name || 'icon';
  let cleanName = rawName.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  if (icon.packPrefix && !cleanName.startsWith(icon.packPrefix)) {
    cleanName = `${icon.packPrefix}_${cleanName}`;
  }
  if (!cleanName.endsWith('.svg')) {
    cleanName += '.svg';
  }

  const encodedSvg = encodeURIComponent(styledSvg);
  const dataUri = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;

  const link = document.createElement('a');
  link.setAttribute('href', dataUri);
  link.setAttribute('download', cleanName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast(`Downloaded ${cleanName}`, 'success');
}

// Parse Input string (URL, pack prefix, or search term)
function parseInput(inputVal) {
  if (!inputVal) return { type: 'empty' };
  let str = inputVal.trim();
  
  if (str.toLowerCase().includes('allsvgicons.com/search') || str.includes('?q=')) {
    try {
      const url = new URL(str.startsWith('http') ? str : 'https://' + str);
      const q = url.searchParams.get('q');
      if (q) return { type: 'search', query: q };
    } catch {
      const match = str.match(/[?&]q=([^&]+)/);
      if (match) return { type: 'search', query: decodeURIComponent(match[1]) };
    }
  }

  if (str.toLowerCase().includes('allsvgicons.com/pack/')) {
    const parts = str.split('allsvgicons.com/pack/')[1].split('/')[0];
    return { type: 'pack', prefix: parts.replace(/[^a-z0-9_-]/g, '') };
  }

  if (str.toLowerCase().includes('allsvgicons.com/collections/')) {
    const collection = str.split('allsvgicons.com/collections/')[1].split('/')[0];
    const map = {
      'flags': 'circle-flags',
      'emoji': 'openmoji',
      'brands': 'logos',
      'programming': 'devicon',
      'material': 'mdi',
      'weather': 'wi',
      'cryptocurrency': 'cryptocurrency-color',
      'e-commerce': 'fluent',
      'arrows': 'lucide',
      'duotone': 'solar',
      'brand-logos': 'logos',
    };
    return { type: 'pack', prefix: map[collection] || collection };
  }

  const knownPacks = [
    'academicons', 'akar-icons', 'ant-design', 'arcticons', 'at-icons', 'basil', 'bi', 
    'bitcoin-icons', 'boxicons', 'bpmn', 'brandico', 'bx', 'bxl', 'bxs', 'bytesize', 
    'carbon', 'catppuccin', 'cbi', 'charm', 'ci', 'cib', 'cif', 'cil', 'circle-flags', 
    'circum', 'clarity', 'codex', 'codicon', 'covid', 'cryptocurrency', 'cryptocurrency-color', 
    'cuida', 'dashicons', 'devicon', 'devicon-plain', 'dinkie-icons', 'duo-icons', 'ei', 'el',
    'element-plus', 'emojione', 'emojione-monotone', 'emojione-v1', 'entypo', 'entypo-social', 'eos-icons', 
    'ep', 'et', 'eva', 'f7', 'fa', 'fa-brands', 'fa-regular', 'fa-solid', 'fa6-brands', 
    'fa6-regular', 'fa6-solid', 'fa7-brands', 'fa7-regular', 'fa7-solid', 'fad', 'famicons', 'fe', 'feather', 'file-icons', 'flag', 'flagpack', 
    'flat-color-icons', 'flat-ui', 'flowbite', 'fluent', 'fluent-color', 'fluent-emoji', 'fluent-emoji-flat', 
    'fluent-emoji-high-contrast', 'fluent-mdl2', 'fontelico', 'fontisto', 'formkit', 
    'foundation', 'fxemoji', 'gala', 'game-icons', 'garden', 'gcp', 'geo', 'gamedev', 'gavel', 'gg', 'ginetex', 'gis', 'git-icon', 
    'gkey', 'gl', 'globus', 'glyphs', 'glyphs-poly', 'gravity-ui', 'griddy-icons', 'gridicons', 'grommet-icons', 'guidance', 'healthicons', 
    'heroicons', 'heroicons-outline', 'heroicons-solid', 'humbleicons', 'hugeicons', 'ic', 'icu', 'icomoon-free', 'icon-park', 'icon-park-outline', 'icon-park-solid', 'icon-park-twotone',
    'iconamoon', 'iconoir', 'icons8', 'il', 'ion', 'ion-icon', 'iwwa', 'ix', 'jam', 'k8s', 'la', 'lets-icons', 'line-md', 'lineicons', 'logos', 
    'ls', 'lsicon', 'lucide', 'lucide-lab', 'mage', 'majesticons', 'maki', 'map', 'marketeq', 'material-icon-theme', 'material-symbols', 'material-symbols-light', 'mdi', 'mdi-light', 'medical-icon', 
    'memory', 'meteo', 'meteocons', 'meteor-icons', 'mi', 'mingcute', 'mono-icons', 'mynaui', 'nimbus', 'nonicons', 'noto', 
    'noto-v1', 'nrk', 'octicon', 'oi', 'ooui', 'openmoji', 'osmic', 'oui', 'page-map', 'pajamas', 'pepicons', 'pepicons-pencil', 
    'pepicons-pop', 'pepicons-print', 'ph', 'picon', 'pinhead', 'pixel', 'pixelarticons', 'prime', 'proicons', 'ps', 'qlementine-icons', 'quill', 'radix-icons', 'ra', 'raphael', 'reicon', 'ri', 'rivet-icons', 'roentgen',
    'selfhst', 'si', 'si-glyph', 'sidekickicons', 'simple-icons', 'simple-line-icons', 'skill-icons', 'solar', 'stash', 'streamline', 'streamline-block', 'streamline-color', 'streamline-cyber', 'streamline-cyber-color', 'streamline-emojis', 'streamline-flex', 'streamline-flex-color', 'streamline-freehand', 'streamline-freehand-color', 'streamline-kameleon-color', 'streamline-logos', 'streamline-pixel', 'streamline-plump', 'streamline-plump-color', 'streamline-sharp', 'streamline-sharp-color', 'streamline-stickies-color', 'streamline-ultimate', 'streamline-ultimate-color', 'subway', 'svg-spinners',
    'system-uicons', 'tabler', 'tdesign', 'teenyicons', 'temaki', 'thesvg', 'thesvg-color', 'token', 'token-branded', 'topcoat', 'twemoji', 'typcn', 'uil', 'uim', 
    'uis', 'uit', 'uiw', 'unjs', 'vaadin', 'vadivam', 'vs', 'vscode-icons', 'websymbol', 'weui', 'whh', 
    'wi', 'wordpress', 'wpf', 'zondicons'
  ];

  const cleanStr = str.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (knownPacks.includes(cleanStr)) {
    return { type: 'pack', prefix: cleanStr };
  }

  return { type: 'search', query: str };
}

// Extract <path d="..."> attributes from SVG string
function extractPaths(svgText) {
  if (!svgText) return [];
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');
    const pathElems = doc.querySelectorAll('path');
    const dAttrs = [];
    pathElems.forEach(p => {
      const d = p.getAttribute('d');
      if (d) dAttrs.push(d.trim());
    });
    return dAttrs;
  } catch (e) {
    return [];
  }
}

// Search Specifically Within a Single Collection Pack (e.g. 'arrow' inside 'lucide')
async function fetchSearchInCollection(query, prefix) {
  state.isLoading = true;
  state.packName = prefix;
  gridContainer.innerHTML = `
    <div class="state-container">
      <div class="spinner"></div>
      <div class="state-title">Searching '${query}' in '${prefix}'...</div>
    </div>
  `;
  statusText.textContent = `Searching '${query}' inside '${prefix}'...`;

  try {
    const res = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(query)}&prefix=${prefix}&limit=300`);
    if (!res.ok) throw new Error(`Search error ${res.status}`);
    const data = await res.json();

    const iconKeys = data.icons || [];
    if (iconKeys.length === 0) {
      throw new Error(`No icons found matching '${query}' in '${prefix}'.`);
    }

    const fetchedIcons = await fetchSvgBatch(iconKeys);
    if (fetchedIcons.length === 0) {
      throw new Error(`Could not download SVGs for '${query}' in '${prefix}'.`);
    }

    state.icons = fetchedIcons;
    state.filteredIcons = [...fetchedIcons];
    state.isLoading = false;

    statusText.textContent = `Found ${fetchedIcons.length} icons matching '${query}' inside '${prefix}'`;
    renderGrid();

  } catch (err) {
    state.isLoading = false;
    gridContainer.innerHTML = `
      <div class="state-container">
        <div class="state-title">No Icons Found</div>
        <div class="state-desc">${err.message || `No icons matched '${query}' inside '${prefix}'.`}</div>
      </div>
    `;
    statusText.textContent = `No icons found for '${query}' in '${prefix}'.`;
  }
}

// Search 334k+ Icons Globally
async function fetchSearchGlobal(query) {
  state.isLoading = true;
  state.packName = `Search: "${query}"`;
  gridContainer.innerHTML = `
    <div class="state-container">
      <div class="spinner"></div>
      <div class="state-title">Searching for '${query}' across all collections...</div>
    </div>
  `;
  statusText.textContent = `Searching 334k+ icons for '${query}'...`;

  try {
    const res = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=250`);
    if (!res.ok) throw new Error(`Search error ${res.status}`);
    const data = await res.json();

    const iconKeys = data.icons || [];
    if (iconKeys.length === 0) {
      throw new Error(`No icons found matching '${query}'.`);
    }

    const fetchedIcons = await fetchSvgBatch(iconKeys);
    if (fetchedIcons.length === 0) {
      throw new Error(`Could not fetch SVG files for search '${query}'.`);
    }

    state.icons = fetchedIcons;
    state.filteredIcons = [...fetchedIcons];
    state.isLoading = false;

    statusText.textContent = `Found ${fetchedIcons.length} icons matching '${query}' across all collections`;
    renderGrid();

  } catch (err) {
    state.isLoading = false;
    gridContainer.innerHTML = `
      <div class="state-container">
        <div class="state-title">No Icons Found</div>
        <div class="state-desc">${err.message || 'No icons matched your query.'}</div>
      </div>
    `;
    statusText.textContent = `No icons found for '${query}'.`;
  }
}

// Batch fetch SVG strings for an array of icon keys ("prefix:name" or "name") using Iconify bulk JSON API
async function fetchSvgBatch(iconKeys, defaultPrefix = '') {
  const fetchedIcons = [];
  
  const prefixGroupMap = {};
  iconKeys.forEach(key => {
    let prefix = defaultPrefix;
    let name = key;
    if (key.includes(':')) {
      const parts = key.split(':');
      prefix = parts[0];
      name = parts.slice(1).join(':');
    }
    if (!prefixGroupMap[prefix]) prefixGroupMap[prefix] = [];
    prefixGroupMap[prefix].push(name);
  });

  const prefixes = Object.keys(prefixGroupMap);
  const BATCH_SIZE = 80;

  for (const prefix of prefixes) {
    const names = prefixGroupMap[prefix];
    for (let i = 0; i < names.length; i += BATCH_SIZE) {
      const batch = names.slice(i, i + BATCH_SIZE);
      const url = `https://api.iconify.design/${prefix}.json?icons=${batch.join(',')}`;

      try {
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (json.icons) {
            Object.keys(json.icons).forEach(name => {
              const data = json.icons[name];
              const w = data.width || json.width || 24;
              const h = data.height || json.height || 24;
              const svgText = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 ${w} ${h}">${data.body}</svg>`;
              
              fetchedIcons.push({
                name: `${prefix}:${name}`,
                shortName: name,
                packPrefix: prefix,
                svgText: svgText,
                paths: extractPaths(svgText),
                selected: false
              });
            });
          }
        }
      } catch (e) {
        console.warn(`Bulk JSON fetch error for ${prefix}:`, e);
      }
    }
  }

  return fetchedIcons;
}

// Fetch ENTIRE Icon Pack Collection (NO 300 CAP! Loads 100% of collection icons)
async function fetchCollection(prefix) {
  if (!prefix) {
    showToast('Please enter a valid pack name or keyword', 'error');
    return;
  }

  state.isLoading = true;
  state.packName = prefix;
  gridContainer.innerHTML = `
    <div class="state-container">
      <div class="spinner"></div>
      <div class="state-title">Loading 100% of '${prefix}' Collection...</div>
      <div class="state-desc">Retrieving collection catalog index...</div>
    </div>
  `;
  statusText.textContent = `Loading collection '${prefix}' index...`;

  try {
    let iconNames = [];

    // 1. Fetch complete collection index catalog
    try {
      const res = await fetch(`https://api.iconify.design/collection?prefix=${prefix}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.uncategorized)) {
          iconNames.push(...data.uncategorized);
        }
        if (data.categories) {
          Object.values(data.categories).forEach(arr => {
            if (Array.isArray(arr)) iconNames.push(...arr);
          });
        }
        iconNames = Array.from(new Set(iconNames));
      }
    } catch (e) {
      console.warn('Iconify API failed:', e);
    }

    if (iconNames.length === 0) {
      return fetchSearchGlobal(prefix);
    }

    statusText.textContent = `Found ${iconNames.length} icons in '${prefix}'. Downloading 100% of collection...`;

    // 2. Fetch 100% of icons using 80-item bulk JSON API (Fast parallel batching!)
    const fetchedIcons = [];
    const BATCH_SIZE = 80;

    for (let i = 0; i < iconNames.length; i += BATCH_SIZE) {
      const batchNames = iconNames.slice(i, i + BATCH_SIZE);
      const url = `https://api.iconify.design/${prefix}.json?icons=${batchNames.join(',')}`;

      try {
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (json.icons) {
            Object.keys(json.icons).forEach(name => {
              const data = json.icons[name];
              const w = data.width || json.width || 24;
              const h = data.height || json.height || 24;
              const svgText = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 ${w} ${h}">${data.body}</svg>`;
              
              fetchedIcons.push({
                name: `${prefix}:${name}`,
                shortName: name,
                packPrefix: prefix,
                svgText: svgText,
                paths: extractPaths(svgText),
                selected: false
              });
            });
          }
        }
      } catch (e) {
        console.warn(`Bulk download error in ${prefix}:`, e);
      }

      statusText.textContent = `Downloaded ${fetchedIcons.length} of ${iconNames.length} icons from '${prefix}'...`;
    }

    if (fetchedIcons.length === 0) {
      throw new Error(`Could not fetch SVG files for '${prefix}'.`);
    }

    state.icons = fetchedIcons;
    state.filteredIcons = [...fetchedIcons];
    state.isLoading = false;

    statusText.textContent = `Loaded ALL ${fetchedIcons.length} SVG icons from '${prefix}'`;
    renderGrid();

  } catch (err) {
    state.isLoading = false;
    gridContainer.innerHTML = `
      <div class="state-container">
        <div class="state-title">Unable to Load Icons</div>
        <div class="state-desc">${err.message || 'Network error occurred.'}</div>
      </div>
    `;
    statusText.textContent = `Error loading '${prefix}'.`;
  }
}

// Router for Search & Load Buttons
function handleSearchAndLoad() {
  const query = urlInput.value.trim();
  const selectedPack = presetSelect.value;

  // 1. If input is an explicit allsvgicons.com URL:
  const parsed = parseInput(query);
  if (parsed.type === 'pack' && query.toLowerCase().includes('allsvgicons.com/pack/')) {
    return fetchCollection(parsed.prefix);
  }

  // 2. If user typed a search query AND selected a specific collection pack:
  if (query && selectedPack) {
    return fetchSearchInCollection(query, selectedPack);
  }

  // 3. If user typed a search query with NO collection selected (Global Search mode):
  if (query && !selectedPack) {
    return fetchSearchGlobal(query);
  }

  // 4. If user selected a collection from dropdown with NO text typed:
  if (selectedPack) {
    return fetchCollection(selectedPack);
  }

  showToast('Please enter a search keyword or select an icon pack', 'error');
}

// Render Grid Cards
function renderGrid() {
  if (state.filteredIcons.length === 0) {
    gridContainer.innerHTML = `
      <div class="state-container">
        <div class="state-title">No matching icons</div>
      </div>
    `;
    updateSelectedCount();
    return;
  }

  gridContainer.innerHTML = '';
  const fragment = document.createDocumentFragment();

  // Display limit for smooth rendering
  const displayLimit = Math.min(state.filteredIcons.length, 600);
  const displayIcons = state.filteredIcons.slice(0, displayLimit);

  displayIcons.forEach((icon, idx) => {
    const card = document.createElement('div');
    card.className = `icon-card ${icon.selected ? 'selected' : ''}`;
    card.dataset.index = idx;

    const styledSvg = applySvgStyles(icon.svgText, state.currentColor, state.currentSize);
    const isGlobalSearch = state.packName.startsWith('Search:') || state.packName.startsWith('Global');
    const badgeMarkup = (isGlobalSearch && icon.packPrefix) 
      ? `<div class="icon-card-badge" title="Collection: ${icon.packPrefix}">${icon.packPrefix}</div>` 
      : '';

    card.innerHTML = `
      ${badgeMarkup}
      <div class="icon-card-check" title="Toggle selection">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <div class="card-corner-actions">
        <button class="card-action-btn inspect-btn" title="Inspect & Code Formats" type="button">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
        </button>
        <button class="card-action-btn download-btn" title="Save .svg directly" type="button">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </button>
      </div>
      <div class="icon-preview">${styledSvg}</div>
      <div class="icon-name" title="${icon.shortName || icon.name}">${icon.shortName || icon.name}</div>
      <div class="card-copied-indicator">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>Copied!</span>
      </div>
    `;

    // Click anywhere on card body to 1-Click Copy in active format!
    card.addEventListener('click', (e) => {
      if (e.target.closest('.card-action-btn') || e.target.closest('.icon-card-check')) return;
      copyFormattedCode(icon, state.activeFormat);
      card.classList.add('just-copied');
      setTimeout(() => card.classList.remove('just-copied'), 650);
    });

    // Checkbox toggle
    const checkBtn = card.querySelector('.icon-card-check');
    checkBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      icon.selected = !icon.selected;
      card.classList.toggle('selected', icon.selected);
      updateSelectedCount();
    });

    // Inspect & Code modal trigger
    const inspectBtn = card.querySelector('.inspect-btn');
    inspectBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openCodeModal(icon);
    });

    // Download SVG trigger
    const downloadBtn = card.querySelector('.download-btn');
    downloadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      downloadSingleSvg(icon);
    });

    fragment.appendChild(card);
  });

  gridContainer.appendChild(fragment);
  updateSelectedCount();
}

// Modify SVG stroke / fill color and size
function applySvgStyles(svgText, color, size) {
  if (!svgText) return '';
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');
    const svgElem = doc.querySelector('svg');
    if (!svgElem) return svgText;

    svgElem.setAttribute('width', `${size}px`);
    svgElem.setAttribute('height', `${size}px`);

    if (color && color !== '#f3f4f6') {
      svgElem.style.color = color;
      const children = doc.querySelectorAll('path, circle, rect, polygon, polyline, g');
      children.forEach(el => {
        const stroke = el.getAttribute('stroke');
        const fill = el.getAttribute('fill');
        if (stroke && stroke !== 'none') {
          el.setAttribute('stroke', color);
        }
        if (fill && fill !== 'none' && fill !== 'transparent') {
          el.setAttribute('fill', color);
        }
      });
    }

    return new XMLSerializer().serializeToString(doc);
  } catch {
    return svgText;
  }
}

// Update Selected Count Badge
function updateSelectedCount() {
  const count = state.icons.filter(i => i.selected).length;
  state.selectedCount = count;
  selectedCountText.textContent = `Selected: ${count} of ${state.icons.length} icons`;
}

// --- Action Listeners ---

loadBtn.addEventListener('click', handleSearchAndLoad);

presetSelect.addEventListener('change', () => {
  const selectedPack = presetSelect.value;
  const query = urlInput.value.trim();

  if (query && selectedPack) {
    fetchSearchInCollection(query, selectedPack);
  } else if (selectedPack) {
    fetchCollection(selectedPack);
  } else if (query) {
    fetchSearchGlobal(query);
  }
});

urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    handleSearchAndLoad();
  }
});

filterInput.addEventListener('input', () => {
  const query = filterInput.value.trim().toLowerCase();
  if (!query) {
    state.filteredIcons = [...state.icons];
  } else {
    state.filteredIcons = state.icons.filter(i => 
      i.name.toLowerCase().includes(query) || 
      (i.packPrefix && i.packPrefix.toLowerCase().includes(query))
    );
  }
  renderGrid();
});

// Custom Color Picker Controller
function setColor(color) {
  if (!color) return;
  let cleanColor = color.trim();
  if (cleanColor !== 'currentColor' && !cleanColor.startsWith('#') && /^[0-9a-fA-F]{3,6}$/.test(cleanColor)) {
    cleanColor = '#' + cleanColor;
  }
  state.currentColor = cleanColor;
  if (colorSwatchPreview) {
    colorSwatchPreview.style.backgroundColor = cleanColor === 'currentColor' ? '#ffffff' : cleanColor;
  }
  if (colorHexText) {
    colorHexText.textContent = cleanColor.toLowerCase();
  }
  
  swatchBtns.forEach(btn => {
    const match = btn.dataset.color.toLowerCase() === cleanColor.toLowerCase();
    btn.classList.toggle('active', match);
  });
  renderGrid();
}

function toggleColorPopover(show) {
  if (!colorPickerPopover) return;
  const isOpen = show !== undefined ? show : !colorPickerPopover.classList.contains('open');
  colorPickerPopover.classList.toggle('open', isOpen);
  colorPickerBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  if (isOpen && customHexInput) {
    customHexInput.value = state.currentColor.replace('#', '');
  }
}

function closeColorPopover() {
  toggleColorPopover(false);
}

if (colorPickerBtn) {
  colorPickerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleColorPopover();
  });
}

swatchBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    setColor(btn.dataset.color);
    closeColorPopover();
  });
});

if (customHexInput) {
  customHexInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (/^#?[0-9a-fA-F]{3}$|^#?[0-9a-fA-F]{6}$/.test(val)) {
      setColor(val);
    }
  });

  customHexInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      closeColorPopover();
    }
  });
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.color-picker-wrapper')) {
    closeColorPopover();
  }
});

sizeSelect.addEventListener('change', (e) => {
  state.currentSize = e.target.value;
  renderGrid();
});

// Format selector change listener
formatSelect.addEventListener('change', (e) => {
  state.activeFormat = e.target.value;
  const title = FORMAT_TITLES[state.activeFormat] || state.activeFormat.toUpperCase();
  showToast(`Active copy format: ${title}`, 'info');
});

// Modal State & Handlers
let activeModalIcon = null;
let activeModalTab = 'react';

function openCodeModal(icon) {
  if (!icon) return;
  activeModalIcon = icon;

  const styledSvg = applySvgStyles(icon.svgText, state.currentColor, '32');
  modalPreview.innerHTML = styledSvg;
  modalTitle.textContent = icon.shortName || icon.name || 'Icon';
  modalPackBadge.textContent = (icon.packPrefix || state.packName || 'ICON').toUpperCase();

  if (['react', 'vue', 'css', 'tailwind', 'svg'].includes(state.activeFormat)) {
    activeModalTab = state.activeFormat;
  } else {
    activeModalTab = 'react';
  }

  updateModalTabUI();
  codeModalOverlay.classList.add('open');
  codeModalOverlay.setAttribute('aria-hidden', 'false');
}

function closeCodeModal() {
  codeModalOverlay.classList.remove('open');
  codeModalOverlay.setAttribute('aria-hidden', 'true');
  activeModalIcon = null;
}

function updateModalTabUI() {
  modalTabs.forEach(tab => {
    const isCurrent = tab.dataset.tab === activeModalTab;
    tab.classList.toggle('active', isCurrent);
    tab.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
  });

  const titles = {
    react: 'JSX / TSX Component',
    vue: 'Vue 3 Single File Component',
    css: 'CSS background-image rule',
    tailwind: 'Tailwind utility class SVG',
    svg: 'Raw SVG markup',
    path: 'SVG Path (d="..." string)'
  };
  modalCodeLang.textContent = titles[activeModalTab] || activeModalTab.toUpperCase();
  modalFormatBadge.textContent = FORMAT_TITLES[activeModalTab] || activeModalTab.toUpperCase();

  if (activeModalIcon) {
    const code = getFormattedCode(activeModalIcon, activeModalTab);
    modalCodeContent.textContent = code;
  }
}

modalCloseBtn.addEventListener('click', closeCodeModal);

codeModalOverlay.addEventListener('click', (e) => {
  if (e.target === codeModalOverlay) closeCodeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && codeModalOverlay.classList.contains('open')) {
    closeCodeModal();
  }
});

modalTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    activeModalTab = tab.dataset.tab;
    updateModalTabUI();
  });
});

modalCopyBtn.addEventListener('click', () => {
  if (!activeModalIcon) return;
  copyFormattedCode(activeModalIcon, activeModalTab);
  const span = modalCopyBtn.querySelector('span');
  if (span) {
    const oldText = span.textContent;
    span.textContent = 'Copied!';
    setTimeout(() => { span.textContent = oldText; }, 1500);
  }
});

modalCodeContent.parentElement.addEventListener('click', () => {
  if (!activeModalIcon) return;
  copyFormattedCode(activeModalIcon, activeModalTab);
});

modalDownloadSvgBtn.addEventListener('click', () => {
  if (activeModalIcon) downloadSingleSvg(activeModalIcon);
});

selectAllBtn.addEventListener('click', () => {
  state.filteredIcons.forEach(i => i.selected = true);
  renderGrid();
});

deselectAllBtn.addEventListener('click', () => {
  state.icons.forEach(i => i.selected = false);
  renderGrid();
});

// Copy Paths
copyPathsBtn.addEventListener('click', () => {
  const targetIcons = state.icons.filter(i => i.selected);
  const items = targetIcons.length > 0 ? targetIcons : state.filteredIcons;

  if (items.length === 0) {
    showToast('No icons available to copy paths', 'error');
    return;
  }

  const pathMap = {};
  items.forEach(i => {
    pathMap[i.name] = i.paths.join(' ');
  });

  const jsonStr = JSON.stringify(pathMap, null, 2);
  navigator.clipboard.writeText(jsonStr);
  showToast(`Copied ${items.length} icon paths!`, 'success');
});

// Download ZIP (Includes 100% of all loaded collection icons!)
downloadZipBtn.addEventListener('click', async () => {
  const targetIcons = state.icons.filter(i => i.selected);
  const items = targetIcons.length > 0 ? targetIcons : state.filteredIcons;

  if (items.length === 0) {
    showToast('No icons available to download', 'error');
    return;
  }

  const zipClass = window.JSZip || (typeof JSZip !== 'undefined' ? JSZip : null);
  if (!zipClass) {
    showToast('JSZip library error', 'error');
    return;
  }

  showToast(`Compressing ${items.length} icons into ZIP...`, 'info');

  const zip = new zipClass();
  const folderName = state.packName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'svg-icons';
  const folder = zip.folder(folderName);

  items.forEach(icon => {
    const styledSvg = applySvgStyles(icon.svgText, state.currentColor, state.currentSize);
    let fileName = (icon.shortName || icon.name || 'icon').replace(/[^a-zA-Z0-9_-]/g, '_');
    if (!fileName.endsWith('.svg')) fileName += '.svg';
    folder.file(fileName, styledSvg);
  });

  const content = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(content);
  a.download = `${folderName}.zip`;
  a.click();

  showToast(`Downloaded ZIP with ${items.length} files!`, 'success');
});

// Initial startup
document.addEventListener('DOMContentLoaded', () => {
  fetchCollection('circle-flags');
});
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  fetchCollection('circle-flags');
}
