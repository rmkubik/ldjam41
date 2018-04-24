const game = document.getElementById('game');
const uiEl = document.getElementById('ui');
// const baseURL = 'http://rmkubik.local:8000/';
const url = new UrlHelper(this);
let tiles = [];
// const types = {
//   fire: '🔥',
//   // fire_big: '💥',
//   water: '🌊',
//   // farm: '🌽',
//   mountain: '⛰️',
//   tree: '🌳',
//   pine: '🌲',
//   house: '🏠',
//   empty: ' '
// }
// const imgs = {
//   fire: 'ryan_fire.png',
//   fire_big: 'ryan_fire.png',
//   water: 'ryan_ocean.png',
//   // farm: '🌽',
//   mountain: 'ryan_big mountain boys.png',
//   tree: 'ryan_tree 1.png',
//   pine: 'ryan_tree 2.png',
//   house: 'ryan_house.png',
//   empty: 'ryan_grass.png'
// }
const tileTypes = {
  fire: {
      icon: '🔥',
      img: 'ryan_fire.png',
      frame: 0,
      frames: [
          'ryan_fire.png',
          'ryan_fire 2.png',
          'ryan_fire 3.png',
          'ryan_fire 4.png'
      ]
  },
  water: {
      icon: '🌊',
      img: 'ryan_ocean.png',
      frame: 0,
      frames: [
          'ryan_ocean.png',
          'ryan_ocean 2.png'
      ],
      frameRate: 5,
      frameRateCount: 0
  },
  mountain: {
      icon: '⛰️',
      img: 'ryan_big mountain boys.png',
      frame: 0
  },
  tree: {
      icon: '🌳',
      img: 'ryan_tree 1.png',
      frame: 0
  },
  pine: {
      icon: '🌲',
      img: 'ryan_tree 2.png',
      frame: 0
  },
  house: {
      icon: '🏠',
      img: 'ryan_house.png',
      frame: 0
  },
  empty: {
      icon: ' ',
      img: 'ryan_grass.png',
      frame: 0
  }
}
const gameStyles = {
    margin: 10,
    gridColumnGap: 0,
    gridRowGap: 0
}
const tileStyles = {
    width: 40,
    height: 40
}
const tileClass = 'tile';
let { s = getRandomSeed(), w = 8, h = 8, lvl } = url.params;
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
state.initialHouseCount = 0;

init(game, w, h);
tiles = getRandomTiles(w, h);
state.initialHouseCount = countHouses(tiles);
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

        const tileImg = document.createElement('img');
        tileImg.className = 'tile';
        tile.append(tileImg);

        const featureImg = document.createElement('img');
        featureImg.className = 'feature';
        tile.append(featureImg);

        gameEl.append(tile)
    }
    setInterval(animate, 100);
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
            const img = tile.querySelector('.tile');
            const fImg = tile.querySelector('.feature');
            if (isTileType(tiles[row][col], tileTypes.fire)) {
                fImg.src = `assets/${tileTypes.fire.frames[tiles[row][col].frame]}`;
                fImg.style.display = 'inline-block';
                img.src = `assets/${tileTypes.empty.img}`;
            } else if (isTileType(tiles[row][col], tileTypes.water)) {
                fImg.src = `assets/${tiles[row][col].frames[tiles[row][col].frame]}`;
                fImg.style.display = 'inline-block';
                img.src = `assets/${tileTypes.empty.img}`;
            } else {
                fImg.src = '';
                fImg.style.display = 'none';
                img.src = `assets/${tiles[row][col].img}`;
            }
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

function animate() {
    const flatTiles = [].concat(...tiles);
    // need to cast string ids to ints
    const fireFrameIds = Object.keys(tileTypes.fire.frames).map(id => parseInt(id));
    const waterFrameIds = Object.keys(tileTypes.water.frames).map(id => parseInt(id));

    flatTiles.forEach(tile => {
        if (isTileType(tile, tileTypes.fire)) {
            tile.frame = [
                ...fireFrameIds.slice(0, tile.frame),
                ...fireFrameIds.slice(tile.frame + 1)
            ][getRandomInt(fireFrameIds.length - 1)];
        } else if (isTileType(tile, tileTypes.water)) {
            if (tile.frameRateCount - tile.frameRate === 0) {
                const frames = [
                    ...waterFrameIds.slice(0, tile.frame),
                    ...waterFrameIds.slice(tile.frame + 1)
                ];
                tile.frame = waterFrameIds.length - 1 === 1
                    ? frames[0]
                    : frames[getRandomInt(waterFrameIds.length - 1)];
                tile.frameRateCount = 0;
            } else {
                tile.frameRateCount++;
            }
        }
    });
    render(tiles, state);
}

function addInputHandlers() {
    document.addEventListener('keydown', event => {
        if (event.key === ' ') {
            update();
        }
        if (event.key === 'b') {
            animate();
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
        state.initialHouseCount = countHouses(tiles);
        render(tiles, state);
    }

    uiEl.querySelector('#reset-level').onclick = () => {
        rng = new Random(s);
        tiles = getRandomTiles(w, h);
        state.initialHouseCount = countHouses(tiles);
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
    if (
        tiles[a.row][a.col].icon === tileTypes.water.icon
        || tiles[b.row][b.col].icon === tileTypes.water.com
    ) {
        tiles[a.row][a.col] = createTileByIcon(tileTypes.water.icon);
        tiles[b.row][b.col] = createTileByIcon(tileTypes.water.icon);
    } else {
        switchTiles(a, b);
    }
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
      return isTileType(tile, tileTypes.tree) || isTileType(tile, tileTypes.pine)
        ? count + 1
        : count;
    }, 0);

    const houseCount = countHouses(tiles);

    // const farmCount = flatTiles.reduce((count, tile) => {
    //   return isTileType(tile, tileTypes.farm) ? count + 1 : count;
    // }, 0);

    return houseCount;
}

function countHouses(tiles) {
    const flatTiles = [].concat(...tiles);

    return flatTiles.reduce((count, tile) => {
      return isTileType(tile, tileTypes.house) ? count + 1 : count;
    }, 0);
}

function renderUI(uiEl) {
    uiEl.querySelector('#stats #houses').innerHTML = `Houses Left: ${state.score}/${state.initialHouseCount}`;
    uiEl.querySelector('#stats #move-count').innerHTML = `Swaps Made: ${state.swapsMade}`;
    uiEl.querySelector('#seed-value').innerHTML = `Seed: ${s}`;
    uiEl.querySelector('#share').querySelector('input').value = `${url.baseURL}?s=${s}`;
}

function getRandomTiles(w, h) {
    const nextTiles = []
    for (let row = 0; row < w; row++) {
      nextTiles.push([]);
      for (let col = 0; col < h; col++) {
        nextTiles[row].push(getRandomTile());
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
  switch (curr.icon) {
  	case tileTypes.tree.icon:
  	case tileTypes.pine.icon:
    case tileTypes.house.icon:
    // case tileTypes.farm.icon:
    	return neighbors.some(n => n.icon === tileTypes.fire.icon)
          	? createTileByIcon(tileTypes.fire.icon)
            : curr;
    // case tileTypes.fire.icon:
    //     return neighbors.some(n => n === tileTypes.water.icon)
    //         ? createTileByIcon(tileTypes.empty.icon)
    //         : curr
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
    return tiles[a.row][a.col].icon === tiles[b.row][b.col].icon;
}

function isFireSpreadDone(tiles) {
    for (let row = 0; row < w; row++) {
      for (let col = 0; col < h; col++) {
          // if (tiles[row][col].icon === ' ')
        const neighbors = getNeighbors(
            row,
            col,
            currentTiles
        );
      }
    }
}

// function getImgUrlByType(type) {
//     return imgs[Object.entries(types).find(([name, icon]) => {
//         return icon === type;
//     })[0]];
// }

// function getTypeById(id) {
//     const typeKeys = Object.entries(types);
//     return typeKeys[id][1];
// }

function createTileById(id) {
    const types = Object.entries(tileTypes);
    return Object.assign({}, types[id][1]);
}

function createTileByIcon(type) {
    const types = Object.entries(tileTypes);
    return Object.assign(
        {},
        types.find(([name, tile]) => {
            return tile.icon === type;
        })[1]
    );
}

function isTileType(a, b) {
    return a.icon === b.icon;
}

function getRandomTile() {
    const typeCount = Object.keys(tileTypes).length;
    return createTileById(getRandomInt(typeCount));
}

// function getRandomType() {
//     const typeCount = Object.keys(types).length;
//     return getTypeById(getRandomInt(typeCount));
// }

// max non inclusive
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
