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

      title.textContent = song['song-title'];
      artist.textContent = song.artist;
      year.textContent = song.year;
      genre.textContent = song.genre;
      packName.textContent = song['pack-name'];
      releaseDate.textContent = song['release-date'];
      price.textContent = song.price;

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
        const titleMatch = song['song-title'].toLowerCase().includes(searchQuery);
        const artistMatch = song.artist.toLowerCase().includes(searchQuery);
        return titleMatch || artistMatch;
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
