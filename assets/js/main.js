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
      const year = document.createElement('td');
      const genre = document.createElement('td');
      const packName = document.createElement('td');
      const releaseDate = document.createElement('td');
      const price = document.createElement('td');
    
      title.style.width = '20%';
      title.textContent = song['song-title'] || '-';
      artist.style.width = '20%';
      artist.textContent = song.artist || '-';
      year.style.width = '10%';
      year.textContent = song.year || '-';
      genre.style.width = '10%';
      genre.textContent = song.genre || '-';
      packName.style.width = '20%';
      packName.textContent = song['pack-name'] || '-';
      releaseDate.style.width = '10%';
      releaseDate.textContent = song['release-date'] || '-';
      price.style.width = '10%';
      if (song.library) {
        price.textContent = 'In Library';
      } else if (song.price === 0) {
        price.textContent = 'Free';
      } else if (typeof song.price === 'string') {
        price.textContent = song.price;
      } else {
        price.textContent = 'R$ ' + song.price.toFixed(2).replace('.', ',');
      }
    
      row.appendChild(title);
      row.appendChild(artist);
      row.appendChild(year);
      row.appendChild(genre);
      row.appendChild(packName);
      row.appendChild(releaseDate);
      row.appendChild(price);
    
      return row;
    }
    

    // Add all the songs to the table
    Object.values(data).forEach(song => {
      tableBody.appendChild(createTableRow(song));
    });

    // Find the filter inputs and search bar
    const libraryFilter = document.querySelector('input[value="library"]');
    const wishlistFilter = document.querySelector('input[value="wishlist"]');
    const allFilter = document.querySelector('input[value="all"]');
    const searchBar = document.querySelector('#search-bar');

    // Define a function to filter the songs based on the filter inputs and search bar
    function filterSongs() {
      const libraryChecked = libraryFilter.checked;
      const wishlistChecked = wishlistFilter.checked;
      const allChecked = allFilter.checked;
      const searchQuery = searchBar.value.trim().toLowerCase();
    
      const filteredSongs = Object.values(data).filter(song => {
        if (allChecked) {
          return true;
        } else if (libraryChecked) {
          return song.library;
        } else if (wishlistChecked) {
          return song.wishlist;
        } else {
          return false;
        }
      }).filter(song => {
        const title = song['song-title'].toLowerCase();
        const artist = song.artist.toLowerCase();
        const queryWords = searchQuery.replace(/[^\w\s]/g, ' ').split(/\s+/);
    
        // Check if any of the query words are included in the song title or artist
        for (let i = 0; i < queryWords.length; i++) {
          if (title.includes(queryWords[i]) || artist.includes(queryWords[i])) {
            continue;
          } else {
            return false;
          }
        }
    
        return true;
      });
    
      tableBody.innerHTML = '';
    
      filteredSongs.forEach(song => {
        tableBody.appendChild(createTableRow(song));
      });
    }
    
    // Filter the songs based on the default filter settings
    filterSongs();

    // Add event listeners to the filter inputs and search bar
    libraryFilter.addEventListener('change', filterSongs);
    wishlistFilter.addEventListener('change', filterSongs);
    allFilter.addEventListener('change', filterSongs);
    searchBar.addEventListener('input', filterSongs);
  });
