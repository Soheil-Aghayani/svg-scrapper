const state = {
  packName: '',
  icons: [], // Array of { name, shortName, packPrefix, svgText, paths, selected: bool }
  filteredIcons: [],
  selectedCount: 0,
  basket: [], // Array of { id, name, shortName, packPrefix, svgText, paths }
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
const addSelectedToBasketBtn = document.getElementById('addSelectedToBasketBtn');
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
const modalTabs = document.querySelectorAll('#codeModalOverlay .modal-tab');
const modalCodeLang = document.getElementById('modalCodeLang');
const modalCodeContent = document.getElementById('modalCodeContent');
const modalCopyBtn = document.getElementById('modalCopyBtn');
const modalDownloadSvgBtn = document.getElementById('modalDownloadSvgBtn');

// Project Basket Tray DOM References
const projectBasketTray = document.getElementById('projectBasketTray');
const basketToggleBtn = document.getElementById('basketToggleBtn');
const basketBadgeCount = document.getElementById('basketBadgeCount');
const basketSubtitle = document.getElementById('basketSubtitle');
const basketChevronBtn = document.getElementById('basketChevronBtn');
const basketExportBtn = document.getElementById('basketExportBtn');
const basketZipBtn = document.getElementById('basketZipBtn');
const basketClearBtn = document.getElementById('basketClearBtn');
const basketItemsStrip = document.getElementById('basketItemsStrip');

// Basket Modal DOM References
const basketModalOverlay = document.getElementById('basketModalOverlay');
const basketModalCountBadge = document.getElementById('basketModalCountBadge');
const basketModalFormatBadge = document.getElementById('basketModalFormatBadge');
const basketModalTitle = document.getElementById('basketModalTitle');
const basketModalCloseBtn = document.getElementById('basketModalCloseBtn');
const basketModalTabs = document.querySelectorAll('#basketModalOverlay .modal-tab');
const basketCodeLang = document.getElementById('basketCodeLang');
const basketCodeContent = document.getElementById('basketCodeContent');
const basketCopyCodeBtn = document.getElementById('basketCopyCodeBtn');
const basketDownloadFileBtn = document.getElementById('basketDownloadFileBtn');

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

    const inBasket = isIconInBasket(icon);

    card.innerHTML = `
      ${badgeMarkup}
      <div class="icon-card-check" title="Toggle selection">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <div class="card-corner-actions">
        <button class="card-action-btn basket-btn ${inBasket ? 'in-basket' : ''}" title="${inBasket ? 'Remove from Basket' : 'Add to Basket'}" type="button">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="${inBasket ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
            <path d="M3 6h18"></path>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
        </button>
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

    // Basket toggle trigger
    const basketBtn = card.querySelector('.basket-btn');
    basketBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleBasket(icon);
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
  if (e.key === 'Escape') {
    if (codeModalOverlay && codeModalOverlay.classList.contains('open')) {
      closeCodeModal();
    }
    if (basketModalOverlay && basketModalOverlay.classList.contains('open')) {
      closeBasketModal();
    }
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

// ==========================================================================
// Project Basket & Multi-Icon Component Bundle System
// ==========================================================================

const BASKET_STORAGE_KEY = 'svg_scrapper_basket_v1';

function getIconId(icon) {
  if (!icon) return '';
  const prefix = icon.packPrefix || state.packName || '';
  const name = icon.name || icon.shortName || '';
  return prefix ? `${prefix}:${name}` : name;
}

function loadBasketFromStorage() {
  try {
    const raw = localStorage.getItem(BASKET_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        state.basket = parsed;
      }
    }
  } catch (err) {
    console.warn('Could not load basket from localStorage:', err);
    state.basket = [];
  }
  renderBasketTray();
}

function saveBasketToStorage() {
  try {
    localStorage.setItem(BASKET_STORAGE_KEY, JSON.stringify(state.basket));
  } catch (err) {
    console.warn('Could not save basket to localStorage:', err);
  }
}

function isIconInBasket(icon) {
  if (!icon) return false;
  const id = getIconId(icon);
  return state.basket.some(item => item.id === id);
}

function addToBasket(icon) {
  if (!icon || !icon.svgText) return;
  const id = getIconId(icon);
  if (state.basket.some(b => b.id === id)) {
    showToast(`'${icon.shortName || icon.name}' is already in Project Basket`, 'info');
    return;
  }
  state.basket.push({
    id,
    name: icon.name || icon.shortName,
    shortName: icon.shortName || icon.name,
    packPrefix: icon.packPrefix || state.packName,
    svgText: icon.svgText,
    paths: icon.paths || []
  });
  saveBasketToStorage();
  renderBasketTray();
  updateCardBasketStates();
  showToast(`Added '${icon.shortName || icon.name}' to Project Basket`, 'success');
}

function removeFromBasket(iconId) {
  const prevCount = state.basket.length;
  state.basket = state.basket.filter(item => item.id !== iconId);
  if (state.basket.length < prevCount) {
    saveBasketToStorage();
    renderBasketTray();
    updateCardBasketStates();
  }
}

function toggleBasket(icon) {
  if (!icon) return;
  const id = getIconId(icon);
  if (isIconInBasket(icon)) {
    removeFromBasket(id);
    showToast(`Removed '${icon.shortName || icon.name}' from basket`, 'info');
  } else {
    addToBasket(icon);
  }
}

function addSelectedToBasket() {
  const selected = state.icons.filter(i => i.selected);
  if (selected.length === 0) {
    showToast('No icons currently selected. Check icons or click Select All.', 'error');
    return;
  }

  let addedCount = 0;
  selected.forEach(icon => {
    const id = getIconId(icon);
    if (!state.basket.some(b => b.id === id)) {
      state.basket.push({
        id,
        name: icon.name || icon.shortName,
        shortName: icon.shortName || icon.name,
        packPrefix: icon.packPrefix || state.packName,
        svgText: icon.svgText,
        paths: icon.paths || []
      });
      addedCount++;
    }
  });

  saveBasketToStorage();
  renderBasketTray();
  updateCardBasketStates();

  if (addedCount > 0) {
    showToast(`Added ${addedCount} icon${addedCount === 1 ? '' : 's'} to Project Basket!`, 'success');
  } else {
    showToast('Selected icons are already in Project Basket', 'info');
  }
}

function clearBasket() {
  if (state.basket.length === 0) return;
  state.basket = [];
  saveBasketToStorage();
  renderBasketTray();
  updateCardBasketStates();
  showToast('Cleared Project Basket', 'info');
}

function updateCardBasketStates() {
  if (!gridContainer) return;
  const cards = gridContainer.querySelectorAll('.icon-card');
  cards.forEach(card => {
    const idx = parseInt(card.dataset.index, 10);
    const icon = state.filteredIcons[idx];
    if (icon) {
      const inBasket = isIconInBasket(icon);
      const basketBtn = card.querySelector('.basket-btn');
      if (basketBtn) {
        basketBtn.classList.toggle('in-basket', inBasket);
        basketBtn.setAttribute('title', inBasket ? 'Remove from Basket' : 'Add to Basket');
        const svg = basketBtn.querySelector('svg');
        if (svg) {
          svg.setAttribute('fill', inBasket ? 'currentColor' : 'none');
        }
      }
    }
  });
}

function renderBasketTray() {
  if (!projectBasketTray) return;
  const count = state.basket.length;

  if (count === 0) {
    projectBasketTray.classList.add('empty');
    if (basketBadgeCount) basketBadgeCount.textContent = '0';
    if (basketSubtitle) basketSubtitle.textContent = '0 icons collected';
    if (basketItemsStrip) basketItemsStrip.innerHTML = '';
    return;
  }

  projectBasketTray.classList.remove('empty');
  if (basketBadgeCount) basketBadgeCount.textContent = count;
  if (basketSubtitle) basketSubtitle.textContent = `${count} icon${count === 1 ? '' : 's'} collected`;

  if (basketItemsStrip) {
    basketItemsStrip.innerHTML = '';
    const frag = document.createDocumentFragment();

    state.basket.forEach(item => {
      const chip = document.createElement('div');
      chip.className = 'basket-chip';
      chip.title = `${item.packPrefix ? item.packPrefix + ':' : ''}${item.name}`;

      const miniSvg = applySvgStyles(item.svgText, state.currentColor, '18');

      chip.innerHTML = `
        <div class="basket-chip-thumb">${miniSvg}</div>
        <span class="basket-chip-name">${item.shortName || item.name}</span>
        <button class="basket-chip-remove" type="button" title="Remove from basket">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      `;

      const removeBtn = chip.querySelector('.basket-chip-remove');
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeFromBasket(item.id);
        showToast(`Removed '${item.shortName || item.name}' from basket`, 'info');
      });

      frag.appendChild(chip);
    });

    basketItemsStrip.appendChild(frag);
  }
}

// Basket Tray Collapse / Expand Toggle
if (basketToggleBtn) {
  basketToggleBtn.addEventListener('click', () => {
    projectBasketTray.classList.toggle('collapsed');
  });
}

// Bundle Generators
function generateReactBundle(basketIcons, isTypeScript = true) {
  if (!basketIcons || basketIcons.length === 0) return '// Project Basket is empty';

  const usedNames = new Set();
  const components = basketIcons.map(icon => {
    let name = toPascalCase(icon.shortName || icon.name);
    let uniqueName = name;
    let counter = 2;
    while (usedNames.has(uniqueName)) {
      uniqueName = `${name}${counter++}`;
    }
    usedNames.add(uniqueName);

    const vbMatch = (icon.svgText || '').match(/viewBox="([^"]*)"/i);
    const viewBox = vbMatch ? vbMatch[1] : '0 0 24 24';

    let inner = (icon.svgText || '')
      .replace(/<svg\b[^>]*>/i, '')
      .replace(/<\/svg>/i, '')
      .trim()
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
      .replace(/stroke-dashoffset=/g, 'strokeDashoffset=');

    const typeDef = isTypeScript ? '(props: IconProps)' : '(props)';
    const code = `export function ${uniqueName}${typeDef} {\n  const { size = 24, width, height, ...rest } = props;\n  return (\n    <svg\n      viewBox="${viewBox}"\n      width={width || size}\n      height={height || size}\n      fill="none"\n      stroke="currentColor"\n      strokeWidth={2}\n      strokeLinecap="round"\n      strokeLinejoin="round"\n      {...rest}\n    >\n      ${inner}\n    </svg>\n  );\n}`;

    return { name: uniqueName, code };
  });

  const header = isTypeScript
    ? `// SVG Scrapper - Project Icons Bundle (${basketIcons.length} icons)\nimport React from 'react';\n\nexport interface IconProps extends React.SVGProps<SVGSVGElement> {\n  size?: number | string;\n}\n\n`
    : `// SVG Scrapper - Project Icons Bundle (${basketIcons.length} icons)\nimport React from 'react';\n\n`;

  const compBody = components.map(c => c.code).join('\n\n');
  const exportAll = `\n\nexport const Icons = {\n${components.map(c => `  ${c.name},`).join('\n')}\n};\n\nexport default Icons;\n`;

  return header + compBody + exportAll;
}

function generateVueBundle(basketIcons) {
  if (!basketIcons || basketIcons.length === 0) return '// Project Basket is empty';
  const usedNames = new Set();
  const components = basketIcons.map(icon => {
    let name = toPascalCase(icon.shortName || icon.name);
    let uniqueName = name;
    let counter = 2;
    while (usedNames.has(uniqueName)) {
      uniqueName = `${name}${counter++}`;
    }
    usedNames.add(uniqueName);

    const styledSvg = applySvgStyles(icon.svgText, 'currentColor', '24');
    return {
      name: uniqueName,
      code: `export const ${uniqueName} = {\n  name: '${uniqueName}',\n  props: {\n    size: { type: [Number, String], default: 24 }\n  },\n  render() {\n    return h('span', {\n      class: 'svg-icon',\n      style: { display: 'inline-flex', width: this.size + 'px', height: this.size + 'px' },\n      innerHTML: \`${styledSvg}\`\n    });\n  }\n};`
    };
  });

  const header = `// SVG Scrapper - Vue 3 Icon Bundle (${basketIcons.length} icons)\nimport { h } from 'vue';\n\n`;
  const compBody = components.map(c => c.code).join('\n\n');
  const exportAll = `\n\nexport const Icons = {\n${components.map(c => `  ${c.name},`).join('\n')}\n};\n\nexport default Icons;\n`;

  return header + compBody + exportAll;
}

function generateSvgSprite(basketIcons) {
  if (!basketIcons || basketIcons.length === 0) return '<!-- Project Basket is empty -->';
  const symbols = basketIcons.map(icon => {
    const cleanId = (icon.shortName || icon.name).replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
    const id = `icon-${cleanId}`;
    const vbMatch = (icon.svgText || '').match(/viewBox="([^"]*)"/i);
    const viewBox = vbMatch ? vbMatch[1] : '0 0 24 24';
    const inner = (icon.svgText || '')
      .replace(/<svg\b[^>]*>/i, '')
      .replace(/<\/svg>/i, '')
      .trim();
    return `    <symbol id="${id}" viewBox="${viewBox}">\n      ${inner}\n    </symbol>`;
  }).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">\n  <defs>\n${symbols}\n  </defs>\n</svg>`;
}

function generateJsonPaths(basketIcons) {
  const mapping = {};
  basketIcons.forEach(icon => {
    const key = icon.shortName || icon.name;
    mapping[key] = icon.paths && icon.paths.length > 0 ? icon.paths.join(' ') : '';
  });
  return JSON.stringify(mapping, null, 2);
}

function downloadFile(filename, content, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`Downloaded ${filename}`, 'success');
}

async function downloadBasketZip() {
  if (state.basket.length === 0) {
    showToast('Project Basket is empty', 'error');
    return;
  }
  const zipClass = window.JSZip || (typeof JSZip !== 'undefined' ? JSZip : null);
  if (!zipClass) {
    showToast('JSZip library not available', 'error');
    return;
  }
  showToast(`Packaging ${state.basket.length} basket icons into ZIP...`, 'info');
  const zip = new zipClass();
  const folder = zip.folder('project-icons');
  state.basket.forEach(icon => {
    const styledSvg = applySvgStyles(icon.svgText, state.currentColor, state.currentSize);
    let fileName = (icon.shortName || icon.name || 'icon').replace(/[^a-zA-Z0-9_-]/g, '_');
    if (!fileName.endsWith('.svg')) fileName += '.svg';
    folder.file(fileName, styledSvg);
  });
  const content = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(content);
  a.download = 'project_icons_bundle.zip';
  a.click();
  showToast(`Downloaded ZIP with ${state.basket.length} icons!`, 'success');
}

// Basket Modal Controller
let activeBasketTab = 'react-tsx';

function openBasketModal() {
  if (state.basket.length === 0) {
    showToast('Project Basket is empty! Add icons using the + button on cards.', 'error');
    return;
  }

  if (basketModalCountBadge) {
    basketModalCountBadge.textContent = `${state.basket.length} ICONS`;
  }

  updateBasketModalUI();
  basketModalOverlay.classList.add('open');
  basketModalOverlay.setAttribute('aria-hidden', 'false');
}

function closeBasketModal() {
  basketModalOverlay.classList.remove('open');
  basketModalOverlay.setAttribute('aria-hidden', 'true');
}

function getBasketBundleContent(tab) {
  switch (tab) {
    case 'react-tsx':
      return generateReactBundle(state.basket, true);
    case 'react-jsx':
      return generateReactBundle(state.basket, false);
    case 'vue':
      return generateVueBundle(state.basket);
    case 'sprite':
      return generateSvgSprite(state.basket);
    case 'json':
      return generateJsonPaths(state.basket);
    default:
      return '';
  }
}

function getBasketFileInfo(tab) {
  switch (tab) {
    case 'react-tsx':
      return { filename: 'Icons.tsx', mime: 'text/typescript' };
    case 'react-jsx':
      return { filename: 'Icons.jsx', mime: 'text/javascript' };
    case 'vue':
      return { filename: 'icons.js', mime: 'text/javascript' };
    case 'sprite':
      return { filename: 'sprite.svg', mime: 'image/svg+xml' };
    case 'json':
      return { filename: 'icons.json', mime: 'application/json' };
    default:
      return { filename: 'icons.txt', mime: 'text/plain' };
  }
}

function updateBasketModalUI() {
  basketModalTabs.forEach(tab => {
    const isCurrent = tab.dataset.tab === activeBasketTab;
    tab.classList.toggle('active', isCurrent);
    tab.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
  });

  const titles = {
    'react-tsx': 'Icons.tsx (TypeScript Component Bundle)',
    'react-jsx': 'Icons.jsx (React Component Bundle)',
    'vue': 'icons.js (Vue 3 Components)',
    'sprite': 'sprite.svg (SVG Sprite Sheet)',
    'json': 'icons.json (JSON Path Data)'
  };
  const badges = {
    'react-tsx': 'React (TSX)',
    'react-jsx': 'React (JSX)',
    'vue': 'Vue 3',
    'sprite': 'SVG Sprite',
    'json': 'JSON Paths'
  };

  if (basketCodeLang) basketCodeLang.textContent = titles[activeBasketTab] || activeBasketTab.toUpperCase();
  if (basketModalFormatBadge) basketModalFormatBadge.textContent = badges[activeBasketTab] || activeBasketTab.toUpperCase();

  const code = getBasketBundleContent(activeBasketTab);
  if (basketCodeContent) {
    basketCodeContent.textContent = code;
  }
}

if (basketExportBtn) {
  basketExportBtn.addEventListener('click', openBasketModal);
}

if (basketZipBtn) {
  basketZipBtn.addEventListener('click', downloadBasketZip);
}

if (basketClearBtn) {
  basketClearBtn.addEventListener('click', () => {
    if (confirm('Clear all icons from Project Basket?')) {
      clearBasket();
    }
  });
}

if (addSelectedToBasketBtn) {
  addSelectedToBasketBtn.addEventListener('click', addSelectedToBasket);
}

if (basketModalCloseBtn) {
  basketModalCloseBtn.addEventListener('click', closeBasketModal);
}

if (basketModalOverlay) {
  basketModalOverlay.addEventListener('click', (e) => {
    if (e.target === basketModalOverlay) closeBasketModal();
  });
}

basketModalTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    activeBasketTab = tab.dataset.tab;
    updateBasketModalUI();
  });
});

if (basketCopyCodeBtn) {
  basketCopyCodeBtn.addEventListener('click', () => {
    const code = getBasketBundleContent(activeBasketTab);
    if (!code) return;
    navigator.clipboard.writeText(code);
    const span = basketCopyCodeBtn.querySelector('span');
    if (span) {
      const old = span.textContent;
      span.textContent = 'Copied!';
      setTimeout(() => { span.textContent = old; }, 1500);
    }
    showToast(`Copied ${activeBasketTab.toUpperCase()} bundle to clipboard!`, 'success');
  });
}

if (basketDownloadFileBtn) {
  basketDownloadFileBtn.addEventListener('click', () => {
    const code = getBasketBundleContent(activeBasketTab);
    if (!code) return;
    const { filename, mime } = getBasketFileInfo(activeBasketTab);
    downloadFile(filename, code, mime);
  });
}

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
  loadBasketFromStorage();
  fetchCollection('circle-flags');
});
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  loadBasketFromStorage();
  fetchCollection('circle-flags');
}
