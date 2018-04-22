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

init(game, w, h);
tiles = getRandomTiles(w, h);
render(tiles, w, h);
const score = calcScore(tiles);
renderScore(scoreEl, score)
addInputHandlers();

console.log(getNextTiles(w, h, tiles));

function init(gameEl, w, h) {
    gameEl.style['grid-template-columns'] = 'min-content '.repeat(w);
    gameEl.style.margin = `${gameStyles.margin}px`;
    gameEl.style['grid-column-gap'] = `${gameStyles.gridColumnGap}px`;
    gameEl.style['grid-row-gap'] = `${gameStyles.gridRowGap}px`;
    for (i = 0; i < w * h; i++) {
        const tile = document.createElement('div');
        tile.style.width = tileStyles.width;
        tile.style.height = tileStyles.height;
        tile.className = 'tile';
        tile.id = i;
        tile.innerHTML = types.empty;
        gameEl.append(tile)
    }
}

function render(tiles) {
    for (row = 0; row < w; row++) {
        for (col = 0; col < h; col++) {
            const tile = document.getElementById((row * w) + col);
            tile.innerHTML = tiles[row][col];
        }
    }
}

function addInputHandlers() {
    document.addEventListener('keydown', event => {
        if (event.key === ' ') {
            tiles = getNextTiles(w, h, tiles);
            render(tiles);
        }
    });

    document.addEventListener('click', event => {
        console.log(getTileCoordFromMouseEvent(event));
    });
}

function getTileCoordFromMouseEvent(event) {
    const tileWidth = (gameStyles.gridColumnGap / 2) + tileStyles.width;
    const tileHeight = (gameStyles.gridRowGap / 2) + tileStyles.height;

    return {
        row: Math.floor(event.y / tileHeight),
        col: Math.floor(event.x / tileWidth)
    }
}

function swap() {

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

function getTypeById(id) {
    const typeKeys = Object.entries(types);
    return typeKeys[id][1];
}

function getRandomType() {
    const typeCount = Object.keys(types).length;
    return getTypeById(getRandomInt(typeCount));
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}
