/* ==========================================================================
   Bibs Band — Music Library
   Rock Band 4 style browser: covers, per-instrument difficulty meters, band
   stars, search, a filter drawer and chunked (lazy) list rendering.
   ========================================================================== */

(() => {
  'use strict';

  /* --------------------------------------------------------------- config */

  // One local catalogue per game, each a flat array of songs
  const DATA_SOURCES = [
    'assets/json/rock-band.json',
    'assets/json/fortnite-festival.json'
  ];

  // Fortnite Festival's free jam tracks rotate daily at 00:00 UTC and there is
  // no official public endpoint for them, so we read a community mirror of it.
  const FESTIVAL_TRACKS_URLS = [
    'https://fnfestival.co/data/tracks.json',
    'https://raw.githubusercontent.com/FNFestival/fnfestival.github.io/main/data/tracks.json'
  ];
  const FESTIVAL_GAME_NAME = 'Fortnite Festival';

  const FALLBACK_COVERS = {
    'Rock Band 4': 'assets/img/cover-rb4.jpg',
    'Fortnite Festival': 'assets/img/cover-fn-festival.jpg'
  };
  const DEFAULT_COVER = 'assets/img/cover-rb4.jpg';

  const DEVIL_LEVEL = 6;
  const MAX_STARS = 5;
  const FIRST_CHUNK = 90;
  const NEXT_CHUNK = 180;
  const TYPE_DELAY = 140;

  const INSTRUMENTS = [
    { key: 'guitar', label: 'Guitar' },
    { key: 'bass', label: 'Bass' },
    { key: 'drums', label: 'Drums' },
    { key: 'vocals', label: 'Vocals' }
  ];

  const SOURCE_OPTIONS = [
    { value: 'all', label: 'All Songs' },
    { value: 'Rock Band 4', label: 'Rock Band 4' },
    { value: 'Fortnite Festival', label: 'Fortnite Festival' }
  ];

  const INSTRUMENT_OPTIONS = [
    { value: 'band', label: 'Band' },
    ...INSTRUMENTS.map(({ key, label }) => ({ value: key, label }))
  ];

  const LEVEL_OPTIONS = [
    { value: 0, label: 'Any' },
    { value: 1, label: '1+' },
    { value: 2, label: '2+' },
    { value: 3, label: '3+' },
    { value: 4, label: '4+' },
    { value: 5, label: '5+' },
    { value: DEVIL_LEVEL, label: 'Devil' }
  ];

  const SORT_OPTIONS = [
    { value: 'artist', label: 'Artist', summary: 'Sorted by Artist' },
    { value: 'title', label: 'Song', summary: 'Sorted by Song' },
    { value: 'difficulty', label: 'Difficulty', summary: 'Sorted by Difficulty' },
    { value: 'source', label: 'Source', summary: 'Sorted by Song Source' }
  ];

  const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });

  /* ------------------------------------------------------------------ dom */

  const dom = {
    search: document.getElementById('search-bar'),
    searchClear: document.getElementById('search-clear'),
    filterToggle: document.getElementById('filter-toggle'),
    filterBadge: document.getElementById('filter-badge'),
    random: document.getElementById('random-song'),
    sortSummary: document.getElementById('sort-summary'),
    songCount: document.getElementById('song-count'),
    songCountLabel: document.getElementById('song-count-label'),
    songCountExtra: document.getElementById('song-count-extra'),
    chips: document.getElementById('active-filters'),
    list: document.getElementById('song-list'),
    library: document.getElementById('library'),
    loader: document.getElementById('loader'),
    loaderText: document.getElementById('loader-text'),
    empty: document.getElementById('empty'),
    emptyReset: document.getElementById('empty-reset'),
    sentinel: document.getElementById('sentinel'),
    panel: document.getElementById('filter-panel'),
    scrim: document.getElementById('scrim'),
    closePanel: document.getElementById('filter-close'),
    panelReset: document.getElementById('filter-reset'),
    panelDone: document.getElementById('filter-done'),
    panelDoneCount: document.getElementById('filter-done-count'),
    rows: Array.from(document.querySelectorAll('.filter-row')),
    valueSource: document.getElementById('value-source'),
    valueInstrument: document.getElementById('value-instrument'),
    valueMinLevel: document.getElementById('value-minLevel'),
    valueSort: document.getElementById('value-sort')
  };

  /* ---------------------------------------------------------------- state */

  const state = {
    songs: [],
    query: '',
    source: 'all',
    instrument: 'band',
    minLevel: 0,
    sort: 'artist',
    filtered: [],
    rendered: 0,
    groupCursor: null,
    groupCounts: new Map()
  };

  let observer = null;
  let typeTimer = 0;
  let scrimTimer = 0;

  /* ----------------------------------------------------------------- data */

  async function init() {
    bindEvents();

    try {
      const songs = await fetchLocalSongs();
      state.songs = songs.map(normalizeSong).filter(Boolean);
      dom.loader.hidden = true;

      refresh();
      loadFestivalTracks();
    } catch (error) {
      dom.loaderText.textContent = 'Could not load the song library';
      console.error('Failed to load the song library', error);
    }
  }

  // Every local catalogue is required, so a missing file fails the boot
  async function fetchLocalSongs() {
    const lists = await Promise.all(
      DATA_SOURCES.map(async url => {
        const response = await fetch(url, { cache: 'no-cache' });
        if (!response.ok) {
          throw new Error(`${url} responded with ${response.status}`);
        }
        return response.json();
      })
    );

    return lists.reduce((all, list) => all.concat(Array.isArray(list) ? list : []), []);
  }

  // Turn a raw JSON entry into the shape the renderer expects
  function normalizeSong(raw) {
    if (!raw) {
      return null;
    }

    const title = (raw['song-title'] || raw.title || '').toString().trim();
    if (!title) {
      return null;
    }

    const artist = (raw.artist || '').toString().trim() || 'Unknown Artist';
    const game = (raw.game || '').toString().trim() || 'Unknown Source';
    const source = raw.difficulties || {};

    const difficulties = { band: levelOf(source.band) };
    INSTRUMENTS.forEach(instrument => {
      difficulties[instrument.key] = levelOf(source[instrument.key]);
    });

    return {
      title,
      artist,
      game,
      cover: (raw.cover || '').toString().trim(),
      difficulties,
      searchText: normalizeText(`${title} ${artist} ${game}`)
    };
  }

  // 0 means "no part / not rated", 6 is the Rock Band "devil" tier
  function levelOf(value) {
    const level = Math.round(Number(value));
    if (!Number.isFinite(level) || level <= 0) {
      return 0;
    }
    return Math.min(level, DEVIL_LEVEL);
  }

  function normalizeText(value) {
    return (value || '').toString().toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  }

  // Sort ignores leading articles so "The Killers" files under K
  function sortName(value) {
    return (value || '').toString().replace(/^(the|a|an)\s+/i, '').toLowerCase();
  }

  function slug(value) {
    return (value || '').toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'unknown';
  }

  function fallbackCover(game) {
    return FALLBACK_COVERS[game] || DEFAULT_COVER;
  }

  function shortSource(game) {
    if (game === 'Rock Band 4') {
      return 'RB4';
    }
    if (game === FESTIVAL_GAME_NAME) {
      return 'Festival';
    }
    return game.slice(0, 8).toUpperCase();
  }

  /* -------------------------------------------------------------- filters */

  function computeFiltered() {
    const words = normalizeText(state.query).split(' ').filter(Boolean);

    const matches = state.songs.filter(song => {
      if (state.source !== 'all' && song.game !== state.source) {
        return false;
      }

      if (state.minLevel > 0 && levelFor(song, state.instrument) < state.minLevel) {
        return false;
      }

      if (words.length && !words.every(word => song.searchText.includes(word))) {
        return false;
      }

      return true;
    });

    return matches.sort(comparator());
  }

  function levelFor(song, instrument) {
    return instrument === 'band' ? song.difficulties.band : song.difficulties[instrument] || 0;
  }

  function comparator() {
    switch (state.sort) {
      case 'title':
        return (a, b) => collator.compare(a.title, b.title) || collator.compare(a.artist, b.artist);

      case 'difficulty':
        return (a, b) =>
          levelFor(b, state.instrument) - levelFor(a, state.instrument) ||
          collator.compare(a.title, b.title);

      case 'source':
        return (a, b) =>
          collator.compare(a.game, b.game) ||
          collator.compare(sortName(a.artist), sortName(b.artist)) ||
          collator.compare(a.title, b.title);

      default:
        return (a, b) =>
          collator.compare(sortName(a.artist), sortName(b.artist)) ||
          collator.compare(a.title, b.title);
    }
  }

  // Artist and source sorts group the list under sticky headers
  function groupOf(song) {
    if (state.sort === 'artist') {
      return song.artist;
    }
    if (state.sort === 'source') {
      return song.game;
    }
    return null;
  }

  function buildGroupCounts() {
    state.groupCounts.clear();

    state.filtered.forEach(song => {
      const group = groupOf(song);
      if (group === null) {
        return;
      }
      state.groupCounts.set(group, (state.groupCounts.get(group) || 0) + 1);
    });
  }

  /* ------------------------------------------------------------ rendering */

  function refresh({ keepScroll = false } = {}) {
    state.filtered = computeFiltered();
    buildGroupCounts();

    dom.list.textContent = '';
    state.rendered = 0;
    state.groupCursor = null;

    dom.empty.hidden = state.filtered.length > 0;
    dom.sentinel.hidden = state.filtered.length === 0;

    updateSummary();
    updateCounts();
    syncPanel();

    if (state.filtered.length) {
      appendRows(FIRST_CHUNK);
    }

    if (!keepScroll) {
      dom.library.scrollTop = 0;
    }

    observeSentinel(state.rendered < state.filtered.length);
  }

  function appendRows(count) {
    if (state.rendered >= state.filtered.length) {
      observeSentinel(false);
      return;
    }

    const fragment = document.createDocumentFragment();
    const end = Math.min(state.filtered.length, state.rendered + count);

    for (let index = state.rendered; index < end; index++) {
      const song = state.filtered[index];
      const group = groupOf(song);

      if (group !== null && group !== state.groupCursor) {
        state.groupCursor = group;
        fragment.appendChild(createGroupHeader(group));
      }

      fragment.appendChild(createSongRow(song, index));
    }

    state.rendered = end;
    dom.list.appendChild(fragment);

    if (state.rendered >= state.filtered.length) {
      observeSentinel(false);
    }
  }

  function createGroupHeader(name) {
    const header = document.createElement('div');
    header.className = 'group';

    const title = document.createElement('h2');
    title.className = 'group__name';
    title.textContent = name;
    title.title = name;

    const count = state.groupCounts.get(name) || 0;
    const meta = document.createElement('span');
    meta.className = 'group__count';
    meta.textContent = `${count} ${count === 1 ? 'Song' : 'Songs'}`;

    header.append(title, meta);
    return header;
  }

  function createSongRow(song, index) {
    const row = document.createElement('article');
    row.className = index % 2 ? 'song is-alt' : 'song';
    row.dataset.index = String(index);
    row.setAttribute('role', 'listitem');

    // cover art, with the RB4 / Festival art as fallback
    const art = document.createElement('div');
    art.className = 'song__art';

    const image = document.createElement('img');
    image.alt = '';
    image.width = 56;
    image.height = 56;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.src = song.cover || fallbackCover(song.game);
    image.addEventListener('error', () => {
      const fallback = fallbackCover(song.game);
      if (image.dataset.fallback === '1') {
        image.classList.add('is-missing');
        return;
      }
      image.dataset.fallback = '1';
      image.src = fallback;
    });

    art.appendChild(image);

    const body = document.createElement('div');
    body.className = 'song__body';

    const title = document.createElement('h3');
    title.className = 'song__title';
    title.textContent = song.title;
    title.title = song.title;

    const artist = document.createElement('p');
    artist.className = 'song__artist';
    artist.textContent = song.artist;
    artist.title = song.artist;

    body.append(title, artist);

    const meta = document.createElement('div');
    meta.className = 'song__meta';

    const source = document.createElement('span');
    source.className = `source source--${slug(song.game)}`;
    source.textContent = shortSource(song.game);
    source.title = song.game;

    const instruments = document.createElement('div');
    instruments.className = 'instruments';
    INSTRUMENTS.forEach(instrument => {
      instruments.appendChild(createInstrumentMeter(instrument, song));
    });

    meta.append(source, instruments, createBandStars(song));
    row.append(art, body, meta);

    return row;
  }

  function createInstrumentMeter(instrument, song) {
    const level = song.difficulties[instrument.key] || 0;

    const item = document.createElement('span');
    item.className = 'instrument';
    item.dataset.level = String(level);
    item.setAttribute('role', 'img');
    item.setAttribute('aria-label', `${instrument.label}: ${levelLabel(level)}`);
    item.title = `${instrument.label}: ${levelLabel(level)}`;

    const icon = document.createElement('span');
    icon.className = `icon instrument__icon icon--${instrument.key}`;
    icon.setAttribute('aria-hidden', 'true');
    item.appendChild(icon);

    if (level >= DEVIL_LEVEL) {
      const devil = document.createElement('span');
      devil.className = 'icon instrument__devil icon--devil';
      devil.setAttribute('aria-hidden', 'true');
      item.appendChild(devil);
    } else {
      const pips = document.createElement('span');
      pips.className = 'pips';
      pips.style.setProperty('--fill', `${(level / MAX_STARS) * 100}%`);
      item.appendChild(pips);
    }

    return item;
  }

  function createBandStars(song) {
    const level = song.difficulties.band || 0;

    const wrap = document.createElement('div');
    wrap.className = 'band';

    const rating = document.createElement('span');
    rating.className = 'rating';
    rating.style.setProperty('--fill', `${(Math.min(level, MAX_STARS) / MAX_STARS) * 100}%`);

    if (level === 0) {
      rating.classList.add('is-empty');
    }
    if (level >= DEVIL_LEVEL) {
      rating.classList.add('is-devil');
    }

    wrap.appendChild(rating);

    if (level >= DEVIL_LEVEL) {
      const devil = document.createElement('span');
      devil.className = 'icon band__devil icon--devil';
      devil.setAttribute('aria-hidden', 'true');
      wrap.appendChild(devil);
    }

    const label = level > 0 ? `Band difficulty ${levelLabel(level)}` : 'Band difficulty not listed';
    wrap.title = label;
    wrap.setAttribute('role', 'img');
    wrap.setAttribute('aria-label', label);

    return wrap;
  }

  function levelLabel(level) {
    if (!level) {
      return 'not listed';
    }
    if (level >= DEVIL_LEVEL) {
      return 'devil tier';
    }
    return `${level} of ${MAX_STARS}`;
  }

  /* -------------------------------------------------------------- summary */

  function updateSummary() {
    const option = SORT_OPTIONS.find(item => item.value === state.sort);
    dom.sortSummary.textContent = option ? option.summary : '';
  }

  function updateCounts() {
    const total = state.songs.length;
    const shown = state.filtered.length;

    dom.songCount.textContent = shown.toLocaleString();
    dom.songCountLabel.textContent = shown === 1 ? 'Song' : 'Songs';

    const isFiltered = shown !== total;
    dom.songCountExtra.hidden = !isFiltered;
    dom.songCountExtra.textContent = isFiltered ? `of ${total.toLocaleString()}` : '';

    const active = activeFilterCount();
    dom.filterBadge.hidden = active === 0;
    dom.filterBadge.textContent = String(active);

    dom.panelDoneCount.textContent = shown.toLocaleString();

    renderChips();
  }

  function activeFilterCount() {
    return (state.source !== 'all' ? 1 : 0) + (state.minLevel > 0 ? 1 : 0);
  }

  function renderChips() {
    const chips = [];

    if (state.source !== 'all') {
      chips.push({
        label: labelOf(SOURCE_OPTIONS, state.source),
        clear: () => { state.source = 'all'; }
      });
    }

    if (state.minLevel > 0) {
      chips.push({
        label: `${labelOf(INSTRUMENT_OPTIONS, state.instrument)} ${labelOf(LEVEL_OPTIONS, state.minLevel)}`,
        clear: () => { state.minLevel = 0; }
      });
    }

    dom.chips.textContent = '';
    dom.chips.hidden = chips.length === 0;

    chips.forEach(chip => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'chip';
      button.setAttribute('aria-label', `Remove filter: ${chip.label}`);

      const text = document.createElement('span');
      text.textContent = chip.label;

      const icon = document.createElement('span');
      icon.className = 'icon icon--close';
      icon.setAttribute('aria-hidden', 'true');

      button.append(text, icon);
      button.addEventListener('click', () => {
        chip.clear();
        refresh();
      });

      dom.chips.appendChild(button);
    });
  }

  function labelOf(options, value) {
    const option = options.find(item => item.value === value);
    return option ? option.label : String(value);
  }

  /* --------------------------------------------------------------- panel */

  function syncPanel() {
    dom.valueSource.textContent = labelOf(SOURCE_OPTIONS, state.source);
    dom.valueInstrument.textContent = labelOf(INSTRUMENT_OPTIONS, state.instrument);
    dom.valueMinLevel.textContent = labelOf(LEVEL_OPTIONS, state.minLevel);
    dom.valueSort.textContent = labelOf(SORT_OPTIONS, state.sort);
  }

  function optionsFor(name) {
    if (name === 'source') {
      return SOURCE_OPTIONS;
    }
    if (name === 'instrument') {
      return INSTRUMENT_OPTIONS;
    }
    if (name === 'minLevel') {
      return LEVEL_OPTIONS;
    }
    return SORT_OPTIONS;
  }

  function currentValue(name) {
    if (name === 'source') {
      return state.source;
    }
    if (name === 'instrument') {
      return state.instrument;
    }
    if (name === 'minLevel') {
      return state.minLevel;
    }
    return state.sort;
  }

  function setValue(name, value) {
    if (name === 'source') {
      state.source = value;
    } else if (name === 'instrument') {
      state.instrument = value;
    } else if (name === 'minLevel') {
      state.minLevel = value;
    } else {
      state.sort = value;
    }
  }

  function cycle(name, step) {
    const options = optionsFor(name);
    const index = Math.max(0, options.findIndex(option => option.value === currentValue(name)));
    const next = options[(index + step + options.length) % options.length];

    setValue(name, next.value);
    refresh();
  }

  function resetFilters() {
    state.source = 'all';
    state.instrument = 'band';
    state.minLevel = 0;
    state.sort = 'artist';
    state.query = '';
    dom.search.value = '';
    dom.searchClear.hidden = true;
    refresh();
  }

  function isPanelOpen() {
    return dom.panel.classList.contains('is-open');
  }

  function setPanel(open) {
    dom.panel.classList.toggle('is-open', open);
    dom.panel.setAttribute('aria-hidden', open ? 'false' : 'true');
    dom.filterToggle.setAttribute('aria-expanded', open ? 'true' : 'false');

    window.clearTimeout(scrimTimer);
    dom.scrim.hidden = false;
    window.requestAnimationFrame(() => dom.scrim.classList.toggle('is-open', open));

    if (!open) {
      scrimTimer = window.setTimeout(() => {
        if (!isPanelOpen()) {
          dom.scrim.hidden = true;
        }
      }, 280);
    }

    if (open) {
      dom.closePanel.focus({ preventScroll: true });
    }
  }

  /* --------------------------------------------------------------- events */

  function bindEvents() {
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          appendRows(NEXT_CHUNK);
        }
      }, { root: dom.library, rootMargin: '800px 0px' });
    }

    dom.search.addEventListener('input', () => {
      window.clearTimeout(typeTimer);
      typeTimer = window.setTimeout(() => {
        state.query = dom.search.value;
        dom.searchClear.hidden = dom.search.value === '';
        refresh();
      }, TYPE_DELAY);
    });

    dom.searchClear.addEventListener('click', () => {
      dom.search.value = '';
      dom.searchClear.hidden = true;
      state.query = '';
      refresh();
      dom.search.focus();
    });

    dom.filterToggle.addEventListener('click', () => setPanel(!isPanelOpen()));
    dom.closePanel.addEventListener('click', () => setPanel(false));
    dom.panelDone.addEventListener('click', () => setPanel(false));
    dom.scrim.addEventListener('click', () => setPanel(false));
    dom.panelReset.addEventListener('click', resetFilters);
    dom.emptyReset.addEventListener('click', resetFilters);
    dom.random.addEventListener('click', pickRandom);

    dom.rows.forEach(row => {
      row.addEventListener('click', () => cycle(row.dataset.cycle, 1));
      row.addEventListener('keydown', event => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          event.preventDefault();
          cycle(row.dataset.cycle, 1);
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          event.preventDefault();
          cycle(row.dataset.cycle, -1);
        }
      });
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && isPanelOpen()) {
        setPanel(false);
        dom.filterToggle.focus({ preventScroll: true });
      }
    });
  }

  function observeSentinel(enabled) {
    if (!observer) {
      return;
    }

    if (enabled) {
      observer.observe(dom.sentinel);
    } else {
      observer.unobserve(dom.sentinel);
    }
  }

  function pickRandom() {
    if (!state.filtered.length) {
      return;
    }

    const index = Math.floor(Math.random() * state.filtered.length);
    while (state.rendered <= index) {
      appendRows(NEXT_CHUNK);
    }

    const row = dom.list.querySelector(`.song[data-index="${index}"]`);
    if (!row) {
      return;
    }

    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    row.classList.add('is-highlight');
    window.setTimeout(() => row.classList.remove('is-highlight'), 2400);
  }

  /* ------------------------------------------------------------- festival */

  // Today's featured tracks are the ones last featured at the file's lastUpdated stamp
  function mergeFestivalTracks(festivalData) {
    if (!festivalData || !festivalData._metadata) {
      return 0;
    }

    const featuredAt = festivalData._metadata.lastUpdated;
    const known = new Set(state.songs.map(songKey));
    let added = 0;

    Object.keys(festivalData).forEach(trackKey => {
      if (trackKey === '_metadata') {
        return;
      }

      const track = festivalData[trackKey];
      if (!track || !track.title || track.lastFeatured !== featuredAt) {
        return;
      }

      const song = normalizeSong({
        'song-title': track.title,
        artist: track.artist,
        game: FESTIVAL_GAME_NAME
      });

      if (!song) {
        return;
      }

      const key = songKey(song);
      if (known.has(key)) {
        return;
      }

      known.add(key);
      state.songs.push(song);
      added++;
    });

    return added;
  }

  function songKey(song) {
    return [song.title, song.artist, song.game].map(normalizeText).join('|');
  }

  // Try each Festival mirror in order so one dead source doesn't break the list
  async function fetchFestivalData() {
    let lastError;

    for (const url of FESTIVAL_TRACKS_URLS) {
      try {
        const response = await fetch(url, { cache: 'no-cache' });
        if (!response.ok) {
          throw new Error(`${url} responded with ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  }

  // Lazily: only after the local list is already on screen
  function loadFestivalTracks() {
    const start = () => {
      fetchFestivalData()
        .then(festivalData => {
          const added = mergeFestivalTracks(festivalData);
          if (added === 0) {
            return;
          }

          // Don't yank the list away if the visitor has already scrolled or searched
          if (dom.library.scrollTop < 400) {
            refresh({ keepScroll: true });
          } else {
            updateCounts();
          }
        })
        .catch(error => console.warn('Could not load Fortnite Festival tracks:', error));
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(start, { timeout: 2000 });
    } else {
      window.setTimeout(start, 0);
    }
  }

  /* ----------------------------------------------------------------- boot */

  init();
})();



