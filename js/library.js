(function () {
    'use strict';

    const search = document.querySelector('#search');
    const sort = document.querySelector('#sort');
    const filters = document.querySelectorAll('[data-filter]');
    const grid = document.querySelector('.library-grid');
    const note = document.querySelector('.library-toolbar__note');

    if (!search || !sort || !grid || !note) return;

    const tiles = Array.from(grid.querySelectorAll('.library-tile'));
    let activeFilter = 'all';

    function update() {
        const query = search.value.trim().toLowerCase();
        const visibleTiles = tiles.filter(function (tile) {
            const matchesQuery = tile.dataset.title.includes(query);
            const matchesFilter = activeFilter === 'all' || tile.dataset.status === activeFilter;
            return matchesQuery && matchesFilter;
        });

        tiles.forEach(function (tile) {
            tile.hidden = !visibleTiles.includes(tile);
        });

        visibleTiles.sort(function (first, second) {
            if (sort.value === 'title') {
                return first.dataset.title.localeCompare(second.dataset.title);
            }

            const key = sort.value === 'completion' ? 'completion' : 'hours';
            return Number(second.dataset[key]) - Number(first.dataset[key]);
        });

        visibleTiles.forEach(function (tile) {
            grid.appendChild(tile);
        });

        note.textContent = visibleTiles.length === 0
            ? 'No games match your filters'
            : visibleTiles.length + (visibleTiles.length === 1 ? ' game shown' : ' games shown');
    }

    filters.forEach(function (filter) {
        filter.addEventListener('click', function (event) {
            event.preventDefault();
            activeFilter = filter.dataset.filter;
            filters.forEach(function (item) {
                item.classList.toggle('library-toolbar__filter-link--active', item === filter);
                item.setAttribute('aria-pressed', item === filter ? 'true' : 'false');
            });
            update();
        });
    });

    search.addEventListener('input', update);
    sort.addEventListener('change', update);
    filters.forEach(function (filter) {
        filter.classList.toggle('library-toolbar__filter-link--active', filter.dataset.filter === activeFilter);
        filter.setAttribute('aria-pressed', filter.dataset.filter === activeFilter ? 'true' : 'false');
    });
    update();
})();
