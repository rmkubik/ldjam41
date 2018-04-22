const game = document.getElementById('game');
const score = document.getElementById('score');
const tiles = [];
const colors = [
  '🔥',
  '🌊',
  '🌽',
  '⛰️',
  '🌳',
  '🌲',
  '🏠',
  ' '
];
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

game.style['grid-template-columns'] = 'min-content '.repeat(w);

for (let i = 0; i < w; i++) {
  tiles.push([]);
  for (let j = 0; j < h; j++) {
    tiles[i].push(getRandomInt(colors.length));
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.innerHTML = colors[tiles[i][j]];
    game.append(tile)
  }
}

const flatTiles = [].concat(...tiles);

const forestCount = flatTiles.reduce((count, tile) => {
  return colors[tile] === '🌳' || colors[tile] === '🌲' ? count + 1 : count;
}, 0);

const houseCount = flatTiles.reduce((count, tile) => {
  return colors[tile] === '🏠' ? count + 1 : count;
}, 0);

const farmCount = flatTiles.reduce((count, tile) => {
  return colors[tile] === '🌽' ? count + 1 : count;
}, 0);

score.innerHTML = `Score: ${Math.min(farmCount, houseCount)}`;

function getNextTiles(currentTiles) {
  const nextTiles = []
  for (let i = 0; i < w; i++) {
    nextTiles.push([]);
    for (let j = 0; j < h; j++) {
      nextTiles[i].push(getRandomInt(colors.length));
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.innerHTML = currentTiles;
    }
  }
  return nextTiles;
}

function evalNewState(curr, neighbors) {
  switch (curr) {
  	case '🌳':
  	case '🌲':
    	return neighbors.some(n => n === '🔥')
      	? '🔥'
        : curr;
    default:
    	return curr;
  }
}

function getNeighbors(col, row, tiles) {
  const cellExists = (row, col, tiles) => tiles[col] !== undefined && tiles[col][row] !== undefined;

  const neighbors = [];
  if (cellExists(row + 1, col, tiles)) {
    neighbors.push(tiles[col][row + 1]);
  }
  if (cellExists(row - 1, col, tiles)) {
    neighbors.push(tiles[col][row - 1]);
  }
  if (cellExists(row, col + 1, tiles)) {
    neighbors.push(tiles[col + 1][row]);
  }
  if (cellExists(row, col - 1, tiles)) {
    neighbors.push(tiles[col - 1][row]);
  }
  return neighbors;
}

console.log(getNeighbors(0, 0, tiles));

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}
