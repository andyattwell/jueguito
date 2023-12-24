import $ from 'jquery';
import * as THREE from 'three';

class Cube extends THREE.Mesh {
  constructor(color, type) {
    super()
    this.color = color;
    this.material = [
      new THREE.MeshBasicMaterial({color: color}),
      new THREE.MeshBasicMaterial({color: color}),
      new THREE.MeshBasicMaterial({color: color}),
      new THREE.MeshBasicMaterial({color: color}),
      new THREE.MeshBasicMaterial({color: color}),
      new THREE.MeshBasicMaterial({color: color})
    ];

    // this.material = new THREE.MeshStandardMaterial(cubeMaterials);
    this.geometry = new THREE.BoxGeometry(.2, .2, .2);

    this.cubeSize = .2
    this.cubeActive = false
  }

}

//constructor function to create all the grid points as objects containind the data for the points
class GridPoint extends Cube {
  constructor(x, y) {
    super("#FFFFFF")

    this.x = x; // x location of the grid point
    this.y = y; // y location of the grid point
    this.f = 0; // total cost function
    this.g = 0; // cost function from start to the current grid point
    this.h = 0; // heuristic estimated cost function from current grid point to the goal
    this.neighbors = []; // neighbors of the current grid point
    this.top_parent = undefined; // immediate source of the current grid point

    this.color = "#FFFFFF";

  }

  // update neighbors array for a given grid point
  updateNeighbors = function (grid, cols, rows) {
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

class Tile extends GridPoint {
  constructor(x, y, id, size) {
    super(x, y);

    // this.id = id; // tile id
    // this.type = type; // path | water | rock
    this.size = size; // size in pixels
    this.left = x * size; // x position in pixels
    this.top = y * size; // y position in pixels
    this.walkable = true;
    this.occupied = false; // is the current tile ocupied?
    this.selected = false; // is the current tile selected?
    this.color = "#000000"; // tile color based on the type
    this.hover = false;

  }

  getColor = function () {
    let typeColor = this.color;
    let specialColor = false;

    if (this.selected === true) {
      specialColor = '#fff033'
    } if (this.hover === true) {
      specialColor = '#fff0ff'
    } if (this.planned === true) {
      specialColor = "#fff700";
    } else if (this.occupied === true) {
      specialColor = '#e000ff' 
    }

    let color = typeColor

    if (specialColor) {
      color = this.blendColors(color, specialColor, 0.5);
    }

    return color;
  }

  setColor = function (color) {
    this.material.forEach((c, i) => {
      this.material.at(i).color.set(color || this.getColor())
    })
  }

  onClick() {
    this.selected = true;
    this.setColor()
  }

  deselect() {
    this.selected = false;
    this.setColor()
  }

  onResize(width, height, aspect) {}

  onPointerOver(e) {
    this.hover = true;
    this.setColor();
  }

  onPointerOut(e) {
    this.hover = false;
    this.setColor();
  }
  
  blendColors(colorA, colorB, amount) {
    const [rA, gA, bA] = colorA.match(/\w\w/g).map((c) => parseInt(c, 16));
    const [rB, gB, bB] = colorB.match(/\w\w/g).map((c) => parseInt(c, 16));
    const r = Math.round(rA + (rB - rA) * amount).toString(16).padStart(2, '0');
    const g = Math.round(gA + (gB - gA) * amount).toString(16).padStart(2, '0');
    const b = Math.round(bA + (bB - bA) * amount).toString(16).padStart(2, '0');
    return '#' + r + g + b;
  }

}

class Rock extends Tile {
  constructor(x, y, id, size) {
    super(x, y, id, size);
    this.type = 'rock';
    this.walkable = false;
    this.color = "#685e70";
    this.setColor();
  }
}

class Water extends Tile {
  constructor(x, y, id, size) {
    super(x, y, id, size);
    this.type = 'water';
    this.walkable = false;
    this.color = "#2093d5";
    this.setColor();
  }
}

class Path extends Tile {
  constructor(x, y, id, size) {
    super(x, y, id, size);
    this.type = 'path';
    this.walkable = true;
    this.color = "#aa9f2b";
    this.setColor();
  }
}

class Grass extends Tile {
  constructor(x, y, id, size) {
    super(x, y, id, size);
    this.type = 'grass';
    this.walkable = true;
    this.color = "#51d343";
    this.setColor();
  }
}

class Mapa {
  
  constructor(scene, data = null) {
    this.cols = data.length ? data.length : 60;
    this.rows = data.length ? data[0].length : 60;
    this.grid = new Array(this.cols);
    
    this.closedSet = [];
    this.openSet = [];
    
    this.tileSize = 0.2;
    
    this.listeners = {};
    
    this.offsetX = 0;
    this.offsetY = 0;
    
    this.scene = scene;
    this.viewArea = {
      width: window.innerWidth,
      height: window.innerHeight,
    }

    if (data.length) {
      this.import(data);
    } else {
      this.generate();
    }
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

  import(data) {
    this.grid = new Array(data.length);
    for (let x = 0; x < data.length; x++) {
      this.grid[x] = new Array(data[x].length);
      for (let y = 0; y < data[x].length; y++) {
        const tileData = data[x][y];
        let entity = Path;
        if (tileData.type === 'rock') {
          entity = Rock;
        } else if (tileData.type === 'water') {
          entity = Water;
        } else if (tileData.type === 'grass') {
          entity = Grass;
        }

        this.grid[x][y] = new entity(
          tileData.x,
          tileData.y, 
          tileData.id,
          tileData.size
        );
      }
    }
    this.updateNeighbors();
  }

  generate() {
    //making a 2D array
    for (let i = 0; i < this.cols; i++) {
      this.grid[i] = new Array(this.rows);
    }

    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        let type = this.getRandomTile();
        let entity = Path;
        if (type === 'rock') {
          entity = Rock;
        } else if (type === 'water') {
          entity = Water;
        } else if (type === 'grass') {
          entity = Grass;
        }
        this.grid[x][y] = new entity(
          x,
          y, 
          x * y + 1,
          this.tileSize
        );
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
          type: tile.type,
          id: tile.id,
          size: tile.size
        })
      }
      data.push(row)
    }
    return data;
  }

  findPath(startX, startY, endX, endY) {
    console.log({startX, startY, endX, endY})
    
    let start = this.grid[startX][startY];
    let end = this.grid[endX][endY];
    let openSet = [start];
    let closedSet = [];
    let path = [];

    if (end === start) {
      return [];
    }

    if (end.walkable !== true || end.occupied === true) {
      let newEnd = null
      for (let index = 0; index < end.neighbors.length; index++) {
        if (!newEnd && end.neighbors[index].walkable === true && end.neighbors[index].occupied === false){
          newEnd = end.neighbors[index];
        }
      }
      end = newEnd;
    }
    
    while (openSet.length > 0) {
      //assumption lowest index is the first one to begin with
      let lowestIndex = 0;
      for (let i = 0; i < openSet.length; i++) {
        if (openSet[i].f < openSet[lowestIndex].f) {
          lowestIndex = i;
        }
      }

      let current = openSet[lowestIndex];
      if (current === end) {
        let temp = current;
        path.push(temp);
        while (temp.top_parent) {
          try {
            path.push(temp.top_parent);
            temp = temp.top_parent;
          } catch (error) {
            temp.top_parent = null
          }
        }
        this.clearAll();
        return path.reverse();
      }

      if (current !== start) {
        closedSet.push(current);
      }
  
      //remove current from openSet
      openSet.splice(lowestIndex, 1);
      
      let neighbors = current.neighbors;

      for (let i = 0; i < neighbors.length; i++) {
        let neighbor = neighbors[i];

        if (neighbor === start) {
          continue;
        }

        if (closedSet.includes(neighbor)) {
          continue;
        }

        let possibleG = current.g + 1;
  
        if (!openSet.includes(neighbor)) {

          neighbor.g = possibleG;
          neighbor.h = this.heuristic(neighbor, end);
          neighbor.f = neighbor.g + neighbor.h;

          neighbor.f += neighbor.walkable !== true ? 10000 : 0;
          neighbor.f += neighbor.occupied ? 10000 : 0;

          neighbor.top_parent = current;
          
          if (neighbor.walkable !== true || neighbor.occupied == true) {
            continue;
          }

          if (!neighbor.occupied) {
            openSet.push(neighbor);
          }
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
    for (let i = 0; i < this.cols; i++) {
      for (let j = 0; j < this.rows; j++) {
        this.grid[i][j].f = 0;
        this.grid[i][j].g = 0;
        this.grid[i][j].h = 0;
        this.grid[i][j].top_parent = undefined;
      }
    }
  }

  drag(start, mousePosition, zoom) {
    const x = start ? (mousePosition.x - start.x) : 0;
    const y = start ? (mousePosition.y - start.y) : 0;
    if (this.offsetY <= 0) {
      this.offsetY += y;
    } else {
      this.offsetY = 0;
    }
    if (this.offsetX <= 0) {
      this.offsetX += x
    } else {
      this.offsetX = 0
    }
  }

  scroll(keyName, zoom) {
    switch (keyName) {
      case "w":
        if (this.offsetY < 0) {
          this.offsetY += this.tileSize * zoom;
        }
        break;
      case "s":
        if (this.offsetY * -1 < (this.rows * this.tileSize) * zoom - this.ctx.canvas.height) {
          this.offsetY -= this.tileSize * zoom;
        }
        break;
      case "a":
        if (this.offsetX < 0) {
          this.offsetX += this.tileSize * zoom
        }
        break;
      case "d":
        if (this.offsetX * -1 < (this.cols * this.tileSize) * zoom - this.ctx.canvas.width) {
          this.offsetX -= this.tileSize * zoom
        }
        break;
      default:
        break;
    }
  }

  render(scene) {
    for (let i = 0; i < this.cols; i++) {
      for (let j = 0; j < this.rows; j++) {
        const tile = this.grid[i][j];
        tile.position.set(i * this.tileSize, j * this.tileSize, -2)
        scene.add( tile );
      }
    }
    return scene
  }

  getRandomTile() {
    const types = [
      'path', 
      'grass', 
      'path', 
      'path', 
      'path', 
      'grass',
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
      if (tile && tile.walkable === true) {
        spawn = tile
      }
    }
    i++;

    return spawn || this.grid[0][0];
  }

  replaceTile(tile, type) {
    // let entity = Path;
    let color = "#aa9f2b";
    let walkable = true;
    if (type === 'grass') {
      // entity = Grass;
      walkable = true;
      color = "#51d343";
    } else if (type === 'rock') {
      // entity = Rock;
      walkable = false;
      color = "#685e70";
    } else if (type === 'water') {
      // entity = Water;
      walkable = false;
      color = "#2093d5";
    }

    this.grid[tile.x][tile.y].type = type;
    this.grid[tile.x][tile.y].color = color;
    this.grid[tile.x][tile.y].walkable = walkable;
    // this.grid[tile.x][tile.y] = new entity(tile.x, tile.y, tile.id, tile.size)
    // this.updateNeighbors();
  }
}

export {
  Rock, Path, Grass, Water
}

export default Mapa