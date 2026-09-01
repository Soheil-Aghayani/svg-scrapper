// Minimal State
const state = {
  packName: '',
  icons: [], // Array of { name, shortName, packPrefix, svgText, paths, selected: bool }
  filteredIcons: [],
  selectedCount: 0,
  currentColor: '#f3f4f6',
  currentSize: '32',
  isLoading: false,
};

// DOM References
const urlInput = document.getElementById('urlInput');
const presetSelect = document.getElementById('presetSelect');
const loadBtn = document.getElementById('loadBtn');
const filterInput = document.getElementById('filterInput');
const colorPicker = document.getElementById('colorPicker');
const sizeSelect = document.getElementById('sizeSelect');
const selectAllBtn = document.getElementById('selectAllBtn');
const deselectAllBtn = document.getElementById('deselectAllBtn');
const copyPathsBtn = document.getElementById('copyPathsBtn');
const downloadZipBtn = document.getElementById('downloadZipBtn');
const gridContainer = document.getElementById('gridContainer');
const statusText = document.getElementById('statusText');
const selectedCountText = document.getElementById('selectedCountText');
const toastContainer = document.getElementById('toastContainer');

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
  const styledSvg = applySvgStyles(icon.svgText, state.currentColor, state.currentSize);
  navigator.clipboard.writeText(styledSvg);
  const name = icon.shortName || icon.name || 'icon';
  showToast(`Copied SVG code for '${name}'`, 'success');
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
      'weather': 'weather-icons',
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

  // 2. If user typed a search query AND selected a specific collection:
  if (query && selectedPack) {
    return fetchSearchInCollection(query, selectedPack);
  }

  // 3. If user typed a search query with NO collection selected:
  if (query && !selectedPack) {
    if (parsed.type === 'pack') {
      return fetchCollection(parsed.prefix);
    }
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
    const packTag = icon.packPrefix || state.packName || '';
    const badgeMarkup = packTag ? `<div class="icon-card-badge" title="Collection: ${packTag}">${packTag}</div>` : '';

    card.innerHTML = `
      ${badgeMarkup}
      <div class="icon-card-check">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <div class="icon-preview">${styledSvg}</div>
      <div class="icon-name" title="${icon.shortName || icon.name}">${icon.shortName || icon.name}</div>
      <div class="icon-actions">
        <button class="mini-btn copy-path-btn" title="Copy path (d=...)">Path</button>
        <button class="mini-btn copy-svg-btn" title="Copy <path> SVG">SVG</button>
        <button class="mini-btn download-btn" title="Save .svg file">Save</button>
      </div>
    `;

    // Click card body to instantly copy path (d=...)
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('mini-btn') || e.target.closest('.icon-card-check')) return;
      copyIconPath(icon);
    });

    // Toggle checkbox when clicking checkbox
    const checkBtn = card.querySelector('.icon-card-check');
    checkBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      icon.selected = !icon.selected;
      card.classList.toggle('selected', icon.selected);
      updateSelectedCount();
    });

    // 1-Click Copy Path Button
    const copyPathBtn = card.querySelector('.copy-path-btn');
    copyPathBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      copyIconPath(icon);
    });

    // 1-Click Copy SVG Code Button
    const copySvgBtn = card.querySelector('.copy-svg-btn');
    copySvgBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      copyIconSvgCode(icon);
    });

    // 1-Click Save SVG File Button
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

// Selecting from preset dropdown NEVER populates urlInput with URL strings!
presetSelect.addEventListener('change', () => {
  const selectedPack = presetSelect.value;
  const query = urlInput.value.trim();

  // If user typed a search keyword and selected a pack -> search inside that pack!
  if (query && selectedPack) {
    fetchSearchInCollection(query, selectedPack);
  } else if (selectedPack) {
    // Cleanly fetch 100% of the collection pack without modifying urlInput
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

colorPicker.addEventListener('input', (e) => {
  state.currentColor = e.target.value;
  renderGrid();
});

sizeSelect.addEventListener('change', (e) => {
  state.currentSize = e.target.value;
  renderGrid();
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
