const game = document.getElementById('game');
const scoreEl = document.getElementById('score');
let tiles = [];
const types = {
  fire: '🔥',
  water: '🌊',
  farm: '🌽',
  mountain: '⛰️',
  tree: '🌳',
  pine: '🌲',
  house: '🏠',
  empty: ' '
}
const w = 8;
const h = 8;
const gameStyles = {
    margin: 10,
    gridColumnGap: 5,
    gridRowGap: 5
}
const tileStyles = {
    width: 25,
    height: 25
}
const tileClass = 'tile';
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
                    swap(state.selectedTile, position);
                    state.transition('noneSelected');
                } else {
                    state.selectedTile = position;
                }
            }
        }
    },
    'noneSelected'
);
const rng = new Random(1);

init(game, w, h);
tiles = getRandomTiles(w, h);
render(tiles, state);
const score = calcScore(tiles);
renderScore(scoreEl, score)
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
            tile.innerHTML = tiles[row][col];
        }
    }
}

function addInputHandlers() {
    document.addEventListener('keydown', event => {
        if (event.key === ' ') {
            tiles = getNextTiles(w, h, tiles);
            render(tiles, state);
        }
    });

    document.addEventListener('click', event => {
        state.action('select', getTileCoordFromMouseEvent(event));
        render(tiles, state);
    });
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
    const aOld = tiles[a.row][a.col];
    tiles[a.row][a.col] = tiles[b.row][b.col];
    tiles[b.row][b.col] = aOld;
}

function calcScore(tiles) {
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

    return Math.min(farmCount, houseCount);
}

function renderScore(scoreEl, score) {
    scoreEl.innerHTML = `Score: ${score}`;
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

function fsm(states, initialState) {
    this.currentState = initialState;

    return {
        action: function(action, ...args) {
            if (states[this.currentState][action]) {
                states[this.currentState][action](...args);
            }
        },

        transition: function(state) {
            console.log(state);
            this.currentState = state;
        },

        currentState: this.currentState
    }
}
