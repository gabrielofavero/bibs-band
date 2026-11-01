// Fortnite Festival's free jam tracks rotate daily at 00:00 UTC and there is no
// official public endpoint for them, so we read a community mirror of that rotation.
const FESTIVAL_TRACKS_URLS = [
  'https://fnfestival.co/data/tracks.json',
  'https://raw.githubusercontent.com/FNFestival/fnfestival.github.io/main/data/tracks.json'
];
const FESTIVAL_GAME_NAME = 'Fortnite Festival';

// Everything shown in the table: local JSON first, Festival tracks get merged in later
const allSongs = [];

// Load the local JSON file, render it, then lazily add today's Festival rotation
fetch('assets/json/rock-band.json')
  .then(response => response.json())
  .then(localSongs => {
    localSongs.forEach(song => allSongs.push(song));

    // Find the table body
    const tableBody = document.querySelector('#songs-table tbody');

    // Currently selected game filter ('all' shows every game)
    let selectedGame = 'all';

    // Friendly short labels used on small screens
    const shortGameNames = {
      'Rock Band 4': 'RB4',
      'Fortnite Festival': 'FN Festival'
    };

    // Turn a game name into a css-friendly class name
    function gameSlug(game) {
      return game.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'unknown';
    }

    // Build the game badge shown in the table
    function createGameCell(song) {
      const cell = document.createElement('td');
      const game = song.game || '-';
      cell.className = 'game-cell';

      const badge = document.createElement('span');
      badge.className = 'game-badge game-badge--' + gameSlug(game);

      const full = document.createElement('span');
      full.className = 'game-badge__full';
      full.textContent = game;

      const short = document.createElement('span');
      short.className = 'game-badge__short';
      short.textContent = shortGameNames[game] || game;

      badge.appendChild(full);
      badge.appendChild(short);
      cell.appendChild(badge);

      return cell;
    }

    // Define a function to create a table row for a song
    function createTableRow(song) {
      const row = document.createElement('tr');
      const title = document.createElement('td');
      const artist = document.createElement('td');
      const game = createGameCell(song);

      title.style.width = '40%';
      title.textContent = song['song-title'] || '-';
      artist.style.width = '40%';
      artist.textContent = song.artist || '-';

      row.appendChild(title);
      row.appendChild(artist);
      row.appendChild(game);

      return row;
    }

    // Normalize a value so "The Killers" and "the killers!" compare equal
    function normalizeText(value) {
      return (value || '').toString().toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
    }

    // The game is part of the key: the same song can exist for RB4 *and* Festival
    function songKey(song) {
      return [
        normalizeText(song['song-title']),
        normalizeText(song.artist),
        normalizeText(song.game)
      ].join('|');
    }

    // Today's featured jam tracks are the entries last featured at the file's own lastUpdated stamp
    function mergeFestivalTracks(festivalData) {
      if (!festivalData || !festivalData._metadata) {
        return 0;
      }

      const featuredAt = festivalData._metadata.lastUpdated;
      const knownSongs = new Set(allSongs.map(songKey));
      let added = 0;

      Object.keys(festivalData).forEach(trackKey => {
        if (trackKey === '_metadata') {
          return;
        }

        const track = festivalData[trackKey];
        if (!track || !track.title || track.lastFeatured !== featuredAt) {
          return;
        }

        const song = {
          'song-title': track.title,
          artist: track.artist || '-',
          game: FESTIVAL_GAME_NAME
        };

        const dedupeKey = songKey(song);
        if (knownSongs.has(dedupeKey)) {
          return;
        }

        knownSongs.add(dedupeKey);
        allSongs.push(song);
        added++;
      });

      return added;
    }

    // Try each Festival source in order so a dead mirror doesn't break the list
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

    // Lazy: only start this once the local list is already on screen
    function loadFestivalTracks() {
      const start = () => {
        fetchFestivalData()
          .then(festivalData => {
            const added = mergeFestivalTracks(festivalData);
            if (added > 0) {
              renderFilterCounts();
              renderSongs();
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

    // Search the songs based on the search bar content
    function renderSongs() {
      const searchQuery = searchBar.value.trim().toLowerCase().replace(/[^\w\s]/g, '');
      const queryWords = searchQuery.split(/\s+/).filter(word => word);

      const filteredSongs = allSongs.filter(song => {
        // Game filter first
        if (selectedGame !== 'all' && (song.game || '') !== selectedGame) {
          return false;
        }

        if (queryWords.length === 0) {
          return true;
        }

        // Build the searchable text for the song
        const fields = [
          song['song-title'],
          song.artist,
          song.game
        ].map(value => (value || '').toLowerCase().replace(/[^\w\s]/g, ''));

        // Every query word must be included in at least one field
        return queryWords.every(word => fields.some(field => field.includes(word)));
      });

      tableBody.innerHTML = '';

      filteredSongs.forEach(song => {
        tableBody.appendChild(createTableRow(song));
      });
    }

    // Find the search bar and render the initial list
    const searchBar = document.querySelector('#search-bar');

    // Wire up the game filter buttons and show how many songs each game has
    const filterButtons = Array.from(document.querySelectorAll('.game-filter'));

    function renderFilterCounts() {
      const gameCounts = allSongs.reduce((counts, song) => {
        const game = song.game || '-';
        counts[game] = (counts[game] || 0) + 1;
        return counts;
      }, {});

      filterButtons.forEach(button => {
        // Remember the original label so counts never stack up on re-render
        if (!button.dataset.label) {
          button.dataset.label = button.textContent;
        }

        const game = button.dataset.game;
        const count = game === 'all' ? allSongs.length : (gameCounts[game] || 0);
        button.textContent = `${button.dataset.label} (${count})`;
      });
    }

    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        selectedGame = button.dataset.game;
        filterButtons.forEach(other => other.classList.toggle('is-active', other === button));
        renderSongs();
      });
    });

    renderFilterCounts();
    renderSongs();

    // Re-render the list while the user types
    searchBar.addEventListener('input', renderSongs);

    // The list is on screen, so fetch today's Festival rotation in the background
    loadFestivalTracks();

    // Make the table responsive on mobile devices
    function makeTableResponsive() {
      const viewportWidth = window.innerWidth;
      const isMobile = viewportWidth < 971;
      const isSemiMobile = viewportWidth < 1541;

      if (isMobile || isSemiMobile) {
        // Reduce body padding
        document.body.style.padding = '10px';

        if (!isMobile) {
          // Reset body padding
          document.body.style.padding = '50px 90px';
        }
      }
    }

    makeTableResponsive();
    window.addEventListener('resize', makeTableResponsive);
  });


