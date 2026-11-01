// Load the JSON file
fetch('assets/json/rock-band.json')
  .then(response => response.json())
  .then(data => {
    // Find the table body
    const tableBody = document.querySelector('#songs-table tbody');

    // Define a function to create a table row for a song
    function createTableRow(song) {
      const row = document.createElement('tr');
      const title = document.createElement('td');
      const artist = document.createElement('td');

      title.style.width = '50%';
      title.textContent = song['song-title'] || '-';
      artist.style.width = '50%';
      artist.textContent = song.artist || '-';

      row.appendChild(title);
      row.appendChild(artist);

      return row;
    }

    // Search the songs based on the search bar content
    function renderSongs() {
      const searchQuery = searchBar.value.trim().toLowerCase().replace(/[^\w\s]/g, '');
      const queryWords = searchQuery.split(/\s+/).filter(word => word);

      const filteredSongs = data.filter(song => {
        if (queryWords.length === 0) {
          return true;
        }

        // Build the searchable text for the song
        const fields = [
          song['song-title'],
          song.artist
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

    renderSongs();

    // Re-render the list while the user types
    searchBar.addEventListener('input', renderSongs);

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


