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
      genre.style.width = '15%';
      genre.textContent = song.genre || '-';
      packName.style.width = '8%';
      packName.textContent = song['pack-name'] || '-';
      releaseDate.style.width = '10%';
      releaseDate.textContent = song['release-date'] || '-';
      price.style.width = '17%';
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

    // Filter the songs based on the filter settings
    function filterSongs() {
      const libraryChecked = libraryFilter.checked;
      const wishlistChecked = wishlistFilter.checked;
      const allChecked = allFilter.checked;
      const searchQuery = searchBar.value.trim().toLowerCase().replace(/[^\w\s]/g, '');
    
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
        const title = song['song-title'].toLowerCase().replace(/[^\w\s]/g, '');
        const artist = song.artist.toLowerCase().replace(/[^\w\s]/g, '');
        const genre = song.genre.toLowerCase().replace(/[^\w\s]/g, '');
        const packName = song['pack-name'].toLowerCase().replace(/[^\w\s]/g, '');
        const releaseDate = song['release-date'].toLowerCase().replace(/[^\w\s]/g, '');
        const queryWords = searchQuery.split(/\s+/);
    
        // Check if any of the query words are included in the song title, artist, genre, pack name, or release date
        for (let i = 0; i < queryWords.length; i++) {
          if (title.includes(queryWords[i]) || artist.includes(queryWords[i]) || genre.includes(queryWords[i]) || packName.includes(queryWords[i]) || releaseDate.includes(queryWords[i])) {
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
    

    // Add all the songs to the table
    function addAllSongs() {
      Object.values(data).forEach(song => {
        tableBody.appendChild(createTableRow(song));
      });
    }

    // Find the filter inputs and search bar
    const libraryFilter = document.querySelector('input[value="library"]');
    const wishlistFilter = document.querySelector('input[value="wishlist"]');
    const allFilter = document.querySelector('input[value="all"]');
    const searchBar = document.querySelector('#search-bar');

    // Filter the songs based on the default filter settings
    filterSongs();

    // Add event listeners to the filter inputs and search bar
    libraryFilter.addEventListener('change', filterSongs);
    wishlistFilter.addEventListener('change', filterSongs);
    allFilter.addEventListener('change', filterSongs);
    searchBar.addEventListener('input', filterSongs);

    // Make the table responsive on mobile devices
    function makeTableResponsive() {
      const viewportWidth = window.innerWidth;
      const isMobile = viewportWidth < 971;
      const isSemiMobile = viewportWidth < 1541;

      if (isMobile || isSemiMobile) {
        // Reduce body padding
        document.body.style.padding = '10px';

        if (isMobile){
          // Hide the columns for Year, Genre, Pack Name, and Release Date
          const thList = document.querySelectorAll('th');
          thList[2].style.display = 'none'; // Year
          thList[3].style.display = 'none'; // Genre
          thList[4].style.display = 'none'; // Pack Name
          thList[5].style.display = 'none'; // Release Date
        } else {
          // Reset body padding
          document.body.style.padding = '50px 90px';
  
          // Show all table columns
          const thList = document.querySelectorAll('th');
          thList[2].style.display = 'table-cell'; // Year
          thList[3].style.display = 'table-cell'; // Genre
          thList[4].style.display = 'table-cell'; // Pack Name
          thList[5].style.display = 'table-cell'; // Release Date
        }
      }
    }

    makeTableResponsive();
    window.addEventListener('resize', makeTableResponsive);
  });


