import $ from 'jquery';

//constructor function to create all the grid points as objects containind the data for the points
function GridPoint(x, y, id, type, left, top) {
  this.x = x; //x location of the grid point
  this.y = y; //y location of the grid point
  this.f = 0; //total cost function
  this.g = 0; //cost function from start to the current grid point
  this.h = 0; //heuristic estimated cost function from current grid point to the goal
  this.neighbors = []; // neighbors of the current grid point
  this.parent = undefined; // immediate source of the current grid point
  this.type = type
  this.id = id,
  this.left = left,
  this.top = top

  // update neighbors array for a given grid point
  this.updateNeighbors = function (grid, cols, rows) {
    let i = this.x;
    let j = this.y;
    if (i < cols - 1) {
      this.neighbors.push(grid[i + 1][j]);
    }
    if (i > 0) {
      this.neighbors.push(grid[i - 1][j]);
    }
    if (j < rows - 1) {
      this.neighbors.push(grid[i][j + 1]);
    }
    if (j > 0) {
      this.neighbors.push(grid[i][j - 1]);
    }
  };
}

class Mapa {
  
  constructor(containerId, cols = 16, rows = 10) {
    this.cols = cols;
    this.rows = rows;
    this.grid = new Array(cols);
    this.closedSet = [];
    this.openSet = [];
    this.tileSize = 60;
    this.tileArray = [];
    this.containerId = containerId;
    this.$container = $("#"+containerId);
    this.map = null;
    this.listeners = {};
  }

  emit(method, payload = null) {
    const callback = this.listeners[method];
    if(typeof callback === 'function'){
      callback(payload);
    }
  }

  addEventListener(method,callback) {
    this.listeners[method] = callback;
  }

  removeEventListener (method) {
    delete this.listeners[method];
  }

  init(data = null) {
    //making a 2D array
    for (let i = 0; i < this.cols; i++) {
      this.grid[i] = new Array(this.rows);
    }

    let tileId = 0;
    for (let i = 0; i < this.cols; i++) {
      for (let j = 0; j < this.rows; j++) {
        let tileData = {}
        tileData.x = i;
        tileData.y = j;
        tileData.id = tileId;
        tileData.type = this.getRandomTile();
        tileData.left = i * this.tileSize;
        tileData.top = i * this.tileSize;

        if (data) {
          tileData = data[i][j];
        }

        this.grid[i][j] = new GridPoint(
          tileData.x,
          tileData.y, 
          tileData.id, 
          tileData.type,
          tileData.left,
          tileData.top
        );
        tileId++;
      }
    }
  
    this.updateNeighbors();
  }

  updateNeighbors() {
    for (let i = 0; i < this.cols; i++) {
      for (let j = 0; j < this.rows; j++) {
        this.grid[i][j].updateNeighbors(this.grid, this.cols, this.rows);
      }
    }
  }

  exportGrid () {
    let data = []
    for (let x = 0; x < this.cols; x++) {
      let row = [];
      for (let y = 0; y < this.rows; y++) {
        const tile = this.grid[x][y];
        row.push({
          x: tile.x,
          y: tile.y,
          f: 0,
          g: 0,
          h: 0,
          neighbors: [],
          parent: [],
          type: tile.type,
          id: tile.id,
          left: tile.left,
          top: tile.top
        })
      }
      data.push(row)
    }
    return data;
  }

  search(startX, startY, endX, endY) {
    let start = this.grid[startX][startY];
    let end = this.grid[endX][endY];
    let openSet = [start];
    let closedSet = [];
    let path = [];
    
    while (openSet.length > 0) {
      //assumption lowest index is the first one to begin with
      let lowestIndex = 0;
      for (let i = 0; i < openSet.length; i++) {
        if (openSet[i].f < openSet[lowestIndex].f) {
          lowestIndex = i;
        }
      }

      let current = openSet[lowestIndex];
      if (current.type !== 'path') {
        continue;
      }

      if (current === end) {
        let temp = current;
        path.push(temp);
        while (temp.parent) {
          path.push(temp.parent);
          temp = temp.parent;
        }
        this.clearAll();
        return path.reverse();
      }
      closedSet.push(current);
  
      //remove current from openSet
      openSet.splice(lowestIndex, 1);
      
      let neighbors = current.neighbors;
  
      for (let i = 0; i < neighbors.length; i++) {
        let neighbor = neighbors[i];
        
        if (neighbor.type !== 'path' || closedSet.includes(neighbor)) {
          continue;
        }

        let possibleG = current.g + 1;
  
        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor);
          neighbor.g = possibleG;
          neighbor.h = this.heuristic(neighbor, end);
          neighbor.f = neighbor.g + neighbor.h;
          // neighbor.f = neighbor.type === 'path' ? neighbor.f : 0;
          neighbor.parent = current;
        }
      }
      
    }
    //no solution by default
    return [];
  
  }

  heuristic(position0, position1) {
    let d1 = Math.abs(position1.x - position0.x);
    let d2 = Math.abs(position1.y - position0.y);
    
    return d1 + d2;
  }

  clearAll() {
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        this.grid[i][j].f = 0;
        this.grid[i][j].g = 0;
        this.grid[i][j].h = 0;
        this.grid[i][j].parent = undefined;
      }
    }
  }

  generateGrid() {
    let tileId = 0;

    for (let y = 0; y < this.rows; y++) {
      this.tileArray[y] = [];
      for (let x = 0; x < this.cols; x++) {
        this.tileArray[y][x] = {
          type: this.getRandomTile(),
          id: tileId,
          left: x * this.tileSize,
          top: y * this.tileSize
        };
        tileId++;
      }
    }
  }

  drawMap() {
    const self = this;
    let $map = $('<div class="map">');
    $map.css('width', this.tileArray.length * this.tileSize)
    $map.css('height', this.tileArray.length * this.tileSize)

    for (let i = 0; i < this.cols; i++) {
      for (let j = 0; j < this.rows; j++) {
        const tile = this.grid[i][j];
        let $tileDiv = $('<div>');
        $tileDiv.addClass('tile');
        $tileDiv.addClass(tile.type);
        $tileDiv.attr('data-cell', i);
        $tileDiv.attr('data-row', j);
        $tileDiv.attr('id', "tile-" + tile.id);
        $tileDiv.css('width', this.tileSize);
        $tileDiv.css('height', this.tileSize);
        $tileDiv.css('left', i * this.tileSize);
        $tileDiv.css('top', j * this.tileSize);
        $tileDiv.text(i + " " + j);
        $tileDiv.on('click', (e) => {
          e.preventDefault();
          self.tileClickHandler($tileDiv, i, j);
        })
        $map.append($tileDiv);
      }
    }

    return $map;
  }

  getRandomTile() {
    const types = [
      'path', 
      'path', 
      'path', 
      'path', 
      'path', 
      'path', 
      'rock', 
      'water'
    ];
    // const types = [
    //   'path', 
    // ];
    const randomNumber = parseInt(Math.random() * types.length);
    return types[randomNumber];
  }

  tileClickHandler($tileDiv, x, y) {
    $('.tile').removeClass('selected');
    $tileDiv.addClass('selected');
    this.emit('click', {x, y})
  }

  pickSpawn() {
    let spawn = false;
    let i = 0;
    
    while(!spawn && i < 9) {
      let randomRow = parseInt(Math.random() * this.rows);
      let randomCol = parseInt(Math.random() * this.cols);
      let tile = this.grid[randomCol][randomRow];
      if (tile && tile.type === 'path') {
        spawn = tile
      }
    }
    i++;

    return spawn || this.grid[0][0];
  }
}

export default Mapa