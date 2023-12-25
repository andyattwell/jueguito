import * as THREE from 'three';
class GridPoint extends THREE.Mesh {
  constructor(x, y) {
    super()

    this.x = x; // x location of the grid point
    this.y = y; // y location of the grid point
    this.f = 0; // total cost function
    this.g = 0; // cost function from start to the current grid point
    this.h = 0; // heuristic estimated cost function from current grid point to the goal
    this.neighbors = []; // neighbors of the current grid point
    this.top_parent = undefined; // immediate source of the current grid point

    this.size = .2; // size in pixels
    this.left = x * .2; // x position in pixels
    this.top = y * .2; // y position in pixels
    this.walkable = true;
    this.occupied = false; // is the current tile ocupied?
    this.selected = false; // is the current tile selected?
    this.color = "#000000"; // tile color based on the type
    this.hover = false;

    this.name = "tile-" + (this.x * this.y + 1)

  }

  // update neighbors array for a given grid point
  updateNeighbors = function (grid, cols, rows) {
    let i = this.x;
    let j = this.y;
    this.neighbors = [];
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

  getColor () {
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

  blendColors(colorA, colorB, amount) {
    const [rA, gA, bA] = colorA.match(/\w\w/g).map((c) => parseInt(c, 16));
    const [rB, gB, bB] = colorB.match(/\w\w/g).map((c) => parseInt(c, 16));
    const r = Math.round(rA + (rB - rA) * amount).toString(16).padStart(2, '0');
    const g = Math.round(gA + (gB - gA) * amount).toString(16).padStart(2, '0');
    const b = Math.round(bA + (bB - bA) * amount).toString(16).padStart(2, '0');
    return '#' + r + g + b;
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
}

class Cube extends GridPoint {
  constructor(x, y, color, size) {
    super(x, y)
    this.color = color;
    this.material = [
      new THREE.MeshBasicMaterial({color: color}),
      new THREE.MeshBasicMaterial({color: color}),
      new THREE.MeshBasicMaterial({color: color}),
      new THREE.MeshBasicMaterial({color: color}),
      new THREE.MeshBasicMaterial({color: color}),
      new THREE.MeshBasicMaterial({color: color})
    ];
    this.position.set(this.left, this.top, this.size / 2)
      // this.material = new THREE.MeshStandardMaterial(cubeMaterials);
    this.geometry = new THREE.BoxGeometry(size, size, size);
  }
}

class Plane extends GridPoint {
  constructor(x, y, color, size) {
    super(x, y)
    this.color = color;
    this.material = new THREE.MeshBasicMaterial({color: color})
    this.geometry = new THREE.PlaneGeometry(size, size)
    this.position.set(this.left, this.top, 0)
    this.speed = .03
  }

  setColor (color) {
    this.material = new THREE.MeshBasicMaterial({color: color || this.getColor()})
  }
}

class Rock extends Cube {
  constructor(x, y, size) {
    super(x, y, "#685e70", size);
    this.type = 'rock';
    this.walkable = false;
    this.setColor();
  }

  setColor (color) {
    this.material.forEach((c, i) => {
      this.material.at(i).color.set(color || this.getColor())
    })
  }
}

class Water extends Plane {
  constructor(x, y, size) {
    super(x, y, "#2093d5", size);
    this.type = 'water';
    // this.walkable = false;
    this.walkable = true;
    this.speed = .01
    this.setColor();
  }
}

class Path extends Plane {
  constructor(x, y, size) {
    super(x, y, "#aa9f2b", size);
    this.type = 'path';
    this.walkable = true;
    this.speed = .05
    this.setColor();
  }
}

class Grass extends Plane {
  constructor(x, y, size) {
    super(x, y, "#51d343", size);
    this.type = 'grass';
    this.walkable = true;
    this.speed = .04
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
    
    this.offsetX = 0;
    this.offsetY = 0;

    this.scene = scene;

    if (data.length) {
      this.import(data);
    } else {
      this.generate();
    }
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

        // if (neighbor.walkable !== true || neighbor.occupied == true) {
        //   continue;
        // }

        let possibleG = current.g + 1;
  
        if (!openSet.includes(neighbor)) {

          neighbor.g = possibleG;
          neighbor.h = this.heuristic(neighbor, end);
          neighbor.f = neighbor.g + neighbor.h;

          if (neighbor.walkable !== true || neighbor.occupied) {
            neighbor.f += 10000;
          } else {
            neighbor.f -= (parseInt(neighbor.speed * 100))
          }

          neighbor.top_parent = current;
          

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

  render(scene) {
    for (let i = 0; i < this.cols; i++) {
      for (let j = 0; j < this.rows; j++) {
        const tile = this.grid[i][j];
        tile.position.set(tile.left, tile.top, tile.z)
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

  replaceTile(tile, newType) {
    if (tile.type === newType) {
      return false;
    }
    let entity = Path;
    if (newType === 'grass') {
      entity = Grass;
    } else if (newType === 'rock') {
      entity = Rock;
    } else if (newType === 'water') {
      entity = Water;
    }

    const newTile = new entity(tile.x, tile.y, tile.size)
    this.grid[tile.x][tile.y] = newTile;

    this.scene.remove(tile);
    this.scene.add(newTile);

    this.updateNeighbors();
  }
}

export {
  Rock, Path, Grass, Water
}

export default Mapa