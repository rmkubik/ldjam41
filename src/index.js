const game = document.getElementById('game');
const uiEl = document.getElementById('ui');
const baseURL = 'http://rmkubik.local:8000/';
let tiles = [];
const types = {
  fire: '🔥',
  water: '🌊',
  // farm: '🌽',
  mountain: '⛰️',
  tree: '🌳',
  pine: '🌲',
  house: '🏠',
  empty: ' '
}
const imgs = {
  fire: 'fire.png',
  water: 'ocean.png',
  // farm: '🌽',
  mountain: 'mountain.png',
  tree: 'tree.png',
  pine: 'tree.png',
  house: 'hovel.png',
  empty: 'grass.png'
}
const gameStyles = {
    margin: 10,
    gridColumnGap: 0,
    gridRowGap: 0
}
const tileStyles = {
    width: 25,
    height: 25
}
const tileClass = 'tile';
let { s = getRandomSeed(), w = 8, h = 8, lvl } = parseQueryParams();
let rng = new Random(s);

const state = fsm(
    {
        noneSelected: {
            select: (position) => {
                if (isTileInMap(position, w, h)) {
                    state.selectedTile = position;
                    state.transition('oneSelected');
                }
            }
        },
        oneSelected: {
            select: (position) => {
                if (
                    isTileInMap(position, w, h)
                    && areTilesAdjacent(state.selectedTile, position)
                ) {
                    if (!isSameTileType(tiles, state.selectedTile, position)) {
                        swap(state.selectedTile, position);
                        state.selectedTile = position;
                        update();
                    }
                } else if (
                    state.selectedTile.row === position.row
                    && state.selectedTile.col === position.col
                ) {
                    state.selectedTile = null;
                    state.transition('noneSelected');
                } else {
                    state.selectedTile = position;
                }
            }
        },
        '*': {
            skip: () => {
                console.log('skip');
                skipMove();
                update();
            },
            undo: () => {
                undoSwap();
            }
        }
    },
    'noneSelected'
);
state.swapsMade = 0;
state.moveHistory = [];
state.tileHistory = [];

init(game, w, h);
tiles = getRandomTiles(w, h);
render(tiles, state);
addInputHandlers();

function init(gameEl, w, h) {
    gameEl.style['grid-template-columns'] = 'min-content '.repeat(w);
    gameEl.style.margin = `${gameStyles.margin}px`;
    gameEl.style['grid-column-gap'] = `${gameStyles.gridColumnGap}px`;
    gameEl.style['grid-row-gap'] = `${gameStyles.gridRowGap}px`;
    for (i = 0; i < w * h; i++) {
        const tile = document.createElement('div');
        tile.style.width = tileStyles.width;
        tile.style.height = tileStyles.height;
        tile.className = tileClass;
        tile.id = i;
        tile.innerHTML = types.empty;
        const img = document.createElement('img');
        tile.append(img);
        gameEl.append(tile)
    }
}

function render(tiles, state) {
    for (row = 0; row < w; row++) {
        for (col = 0; col < h; col++) {
            const tile = document.getElementById((row * w) + col);
            tile.className = tileClass;
            if (state.selectedTile
                    && row === state.selectedTile.row
                    && col === state.selectedTile.col
                ) {
                    tile.className += ' selected';
            }
            const img = tile.querySelector('img');
            img.src = `assets/${getImgUrlByType(tiles[row][col])}`;
        }
    }
    state.score = updateUI(tiles);
    renderUI(uiEl, state);
}

function update() {
    state.tileHistory.push(tiles.map(row => [...row]));
    tiles = getNextTiles(w, h, tiles);
    render(tiles, state);
}

function addInputHandlers() {
    document.addEventListener('keydown', event => {
        if (event.key === ' ') {
            update();
        }
    });

    document.addEventListener('click', event => {
        state.action('select', getTileCoordFromMouseEvent(event));
        render(tiles, state);
    });

    uiEl.querySelector('#random-seed').onclick = () => {
        s = getRandomSeed();
        rng = new Random(s);
        tiles = getRandomTiles(w, h);
        render(tiles, state);
    }

    uiEl.querySelector('#reset-level').onclick = () => {
        rng = new Random(s);
        tiles = getRandomTiles(w, h);
        render(tiles, state);
    }

    uiEl.querySelector('#undo-move').onclick = () => {
        state.action('undo');
    }

    uiEl.querySelector('#skip-move').onclick = () => {
        state.action('skip');
    }
}

function getTileCoordFromMouseEvent(event) {
    const tileWidth = gameStyles.gridColumnGap + tileStyles.width;
    const tileHeight = gameStyles.gridRowGap + tileStyles.height;

    return {
        row: Math.floor((event.pageY - gameStyles.margin) / tileHeight),
        col: Math.floor((event.pageX - gameStyles.margin) / tileWidth)
    }
}

function swap(a, b) {
    switchTiles(a, b);
    state.swapsMade++;
    state.moveHistory.push({
        origin: a,
        dest: b
    });
}

function undoSwap() {
    if (state.tileHistory.length > 0) {
        if (state.moveHistory.length > 0) {
            const lastMove = state.moveHistory.pop();
            if (lastMove !== 'skip') {
                state.swapsMade--;
            }
        }
        const lastTiles = state.tileHistory.pop();
        tiles = lastTiles;
        // switchTiles(lastSwap.dest, lastSwap.origin);
    }
}

function skipMove() {
    state.moveHistory.push('skip');
}

function switchTiles(a, b) {
    const aOld = tiles[a.row][a.col];
    tiles[a.row][a.col] = tiles[b.row][b.col];
    tiles[b.row][b.col] = aOld;
}

function parseQueryParams() {
    const splitParamStrings = str => str.split('&');
    const paramStrings = splitParamStrings(window.location.search.substring(1));

    return paramStrings.reduce((params, string) => {
        const [key, val] = string.split('=');
        params[key] = val;
        return params;
    }, {});
}

function setQueryParams() {

}

function updateUI(tiles) {
    const flatTiles = [].concat(...tiles);

    const forestCount = flatTiles.reduce((count, tile) => {
      return tile === types.tree || tile === types.pine ? count + 1 : count;
    }, 0);

    const houseCount = flatTiles.reduce((count, tile) => {
      return tile === types.house ? count + 1 : count;
    }, 0);

    const farmCount = flatTiles.reduce((count, tile) => {
      return tile === types.farm ? count + 1 : count;
    }, 0);

    return houseCount;
}

function renderUI(uiEl) {
    uiEl.querySelector('#stats #houses').innerHTML = `Houses Left: ${state.score}`;
    uiEl.querySelector('#stats #move-count').innerHTML = `Swaps Made: ${state.swapsMade}`;
    uiEl.querySelector('#seed-value').innerHTML = `Seed: ${s}`;
    uiEl.querySelector('#share').querySelector('input').value = `${baseURL}?s=${s}`;
}

function getRandomTiles(w, h) {
    const nextTiles = []
    for (let row = 0; row < w; row++) {
      nextTiles.push([]);
      for (let col = 0; col < h; col++) {
        nextTiles[row].push(getRandomType());
      }
    }
    return nextTiles;
}

function getNextTiles(w, h, currentTiles) {
  const nextTiles = []
  for (let row = 0; row < w; row++) {
    nextTiles.push([]);
    for (let col = 0; col < h; col++) {
      nextTiles[row].push(
          evalNewState(
              currentTiles[row][col],
              getNeighbors(
                  row,
                  col,
                  currentTiles
              )
          )
      );
    }
  }
  return nextTiles;
}

function evalNewState(curr, neighbors) {
  switch (curr) {
  	case types.tree:
  	case types.pine:
    case types.house:
    case types.farm:
    	return neighbors.some(n => n === types.fire)
          	? types.fire
            : curr;
    case types.fire:
        return neighbors.some(n => n === types.water)
            ? types.empty
            : types.fire
    default:
    	return curr;
  }
}

function getNeighbors(row, col, tiles) {
  const cellExists = (row, col, tiles) => tiles[row] !== undefined && tiles[row][col] !== undefined;

  const neighbors = [];
  if (cellExists(row + 1, col, tiles)) {
    neighbors.push(tiles[row + 1][col]);
  }
  if (cellExists(row - 1, col, tiles)) {
    neighbors.push(tiles[row - 1][col]);
  }
  if (cellExists(row, col + 1, tiles)) {
    neighbors.push(tiles[row][col + 1]);
  }
  if (cellExists(row, col - 1, tiles)) {
    neighbors.push(tiles[row][col - 1]);
  }
  return neighbors;
}

function areTilesAdjacent(a, b) {
    const rowDiff = Math.abs(a.row - b.row);
    const colDiff = Math.abs(a.col - b.col);

    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

function isTileInMap(tile, w, h) {
    return (
        tile.row >= 0
        && tile.row < h
        && tile.col >= 0
        && tile.col < w
    );
}

function isSameTileType(tiles, a, b) {
    return tiles[a.row][a.col] === tiles[b.row][b.col];
}

function getImgUrlByType(type) {
    return imgs[Object.entries(types).find(([name, icon]) => {
        return icon === type;
    })[0]];
}

function getTypeById(id) {
    const typeKeys = Object.entries(types);
    return typeKeys[id][1];
}

function getRandomType() {
    const typeCount = Object.keys(types).length;
    return getTypeById(getRandomInt(typeCount));
}

function getRandomInt(max) {
  return Math.floor(rng.nextFloat() * max);
}

function getRandomSeed() {
    return Math.floor(Math.random() * Math.pow(10, 8));
}

function fsm(states, initialState) {
    this.currentState = initialState;

    return {
        action: function(action, ...args) {
            if (states[this.currentState][action]) {
                states[this.currentState][action](...args);
            } else if (states['*'] && states['*'][action]) {
                states['*'][action](...args);
            }
        },

        transition: function(state) {
            this.currentState = state;
        },

        currentState: this.currentState
    }
}
