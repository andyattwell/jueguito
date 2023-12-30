import * as THREE from 'three';
import {ImprovedNoise} from './lib/ImprovedNoise.js';
import NoiseGenerator from './NoiseGenerator.js';
class GridPoint extends THREE.Mesh {
  constructor(x, y, z) {
    super()

    this.x = x; // x location of the grid point
    this.y = y; // y location of the grid point
    this.z = z;
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

    // this.name = "tile-" + (this.z * 100 * this.x * this.y)

  }

  // update neighbors array for a given grid point
  updateNeighbors = function (grid, cols, rows, maxZ) {
    let i = this.x;
    let j = this.y;
    let z = this.z;

    this.neighbors = [];
    // left
    if (i < cols - 1 && grid[i + 1][j][z]) {
      this.neighbors.push(grid[i + 1][j][z]);
    }

    // right
    if (i > 0 && grid[i - 1][j][z]) {
      this.neighbors.push(grid[i - 1][j][z]);
    }

    // front
    if (j < rows - 1 && grid[i][j + 1][z]) {
      this.neighbors.push(grid[i][j + 1][z]);
    }

    // back
    if (j > 0 && grid[i][j - 1][z]) {
      this.neighbors.push(grid[i][j - 1][z]);
    }

    // up
    if (z < maxZ - 1 && grid[i][j][z + 1]) {
      this.neighbors.push(grid[i][j][z + 1]);
    }

    // down
    if (z > 0 && grid[i][j][z - 1]) {
      this.neighbors.push(grid[i][j][z - 1]);
    }

  };

  getColor () {
    if (!this.color) {
      return null;
    }
    let typeColor = this.color;
    let specialColor = false;

    if (this.selected === true) {
      specialColor = '#fff033'
    } if (this.hover === true) {
      specialColor = '#fff0ff'
    } if (this.planned === true) {
      specialColor = "#fff700";
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
  constructor(x, y, z, color, size) {
    super(x, y, z)
    this.color = color;
    this.size = size;
    this.opacity = 1;
    this.material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 1
    })
    if (z > 0) {
      this.geometry = new THREE.BoxGeometry(this.size, this.size, this.size);
      this.position.set(this.x * this.size, this.y * this.size, this.z * this.size - .1)
    } else {
      this.geometry = new THREE.PlaneGeometry(size, size)
      this.position.set(this.x * this.size, this.y * this.size, 0)
    }
    // let newZ = tile.z + tile.size;
    // if (tile.z > 0) {
    //   newZ = (tile.z + hit.normal.z) * tile.size + tile.size;
    // }
    // newTile.position.set(x * tile.size, y * tile.size, tile.z);

    
      // this.material = new THREE.MeshStandardMaterial(cubeMaterials);
    
  }

  setColor (color) {
    let _color = color || this.getColor();
    if (!_color) {
      return false;
    }
    this.material = new THREE.MeshBasicMaterial({
      color: _color,
      opacity: this.opacity
    })
  }
}

class Plane extends GridPoint {
  constructor(x, y, z,color, size) {
    super(x, y, z)
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

class Air extends Cube {
  constructor(x, y, z,size) {
    super(x, y, z, null, size);
    this.type = 'air';
    this.walkable = true;
    // this.material = null;
    this.visible = false;
    // this.setColor();
  }

}

class Rock extends Cube {
  constructor(x, y, z,size) {
    super(x, y, z, "#685e70", size);
    this.type = 'rock';
    this.walkable = false;
    this.color = Math.random() < 0.5 ? "#554e5a" : "#685e70";
    this.height = 0.5
    this.setColor();
  }

}

class Water extends Cube {
  constructor(x, y, z,size) {
    super(x, y, z,"#2093d5", size);
    this.type = 'water';
    // this.walkable = false;
    this.walkable = true;
    this.speed = .01
    this.height = 0.1
    this.setColor();
  }
}

class Path extends Cube {
  constructor(x, y, z,size) {
    super(x, y, z,"#aa9f2b", size);
    this.type = 'path';
    this.walkable = true;
    this.speed = .05
    this.height = 0.3
    this.setColor();
  }
}

class Grass extends Cube {
  constructor(x, y, z, size) {
    super(x, y, z, "#51d343", size);
    this.type = 'grass';
    this.walkable = true;
    this.speed = .04
    this.height = 0.2
    this.setColor();
  }
}

class Preview extends Cube {
  constructor(x, y, z, size) {
    super(x, y, z, "#3af4ff", size);
    this.type = 'preview';
    this.walkable = true;
    this.opacity = 0.8;
    this.material = new THREE.MeshBasicMaterial({
      color: "#3af4ff",
      transparent: true,
      opacity: 0.3
    })
  }
}

class Prize extends Cube {
  constructor(x, y, z, size) {
    super(x, y, z, "#ce1fd7", size);
    this.type = 'prize';
    this.walkable = false;
    this.setColor();
  }
}

class Mapa {
  
  noiseGenerator = new NoiseGenerator()
  constructor(scene, data = null, options = {}) {
    this.cols = data.length ? data.length : 48;
    this.rows = data.length ? data[0].length : 48;
    this.maxZ = 12;
    this.grid = [];
    
    this.closedSet = [];
    this.openSet = [];
    
    this.tileSize = 0.2;
    
    this.offsetX = 0;
    this.offsetY = 0;

    this.scene = scene;

    if (data.length) {
      this.import(data);
    } else {
      this.generate(options);
    }    
  }

  exportGrid () {
    let data = []

    for (let x = 0; x < this.cols; x++) {
      let row = [];

      for (let y = 0; y < this.rows; y++) {
        let h = [];

        for (let z = 0; z < this.grid[x][y].length; z++) {
          const tile = this.grid[x][y][z];
          if (tile === undefined) {
            continue;
          }
          h.push({
            x: tile.x,
            y: tile.y,
            z: tile.z,
            type: tile.type,
            size: tile.size
          })
        }
        row.push(h)
      }
      data.push(row)
    }

    return data;
  }

  import(data) {
    this.grid = new Array(data.length);
    for (let x = 0; x < data.length; x++) {
      this.grid[x] = new Array(data[x].length);
      for (let y = 0; y < data[x].length; y++) {
        this.grid[x][y] = new Array(data[x][y].length);
        for (let z = 0; z < data[x][y].length; z++) {
          const tileData = data[x][y][z];
          let entity = this.getTileTypeFromString(tileData.type);
          this.grid[x][y][z] = new entity(
            tileData.x,
            tileData.y,
            tileData.z,
            tileData.size
          );
          this.scene.add( this.grid[x][y][z] );
        }

      }
    }
    this.updateNeighbors();
  }

  generate(options = {}) {
    // Generate noise
    let mapWidth = options.mapWidth ? parseInt(options.mapWidth) : this.cols;
    let mapHeight = options.mapHeight ? parseInt(options.mapHeight) : this.rows;
    let mapSeed = options.mapSeed ? parseFloat(options.mapSeed) : Math.random();
    let mapNoiseScale = options.mapNoiseScale ? parseFloat(options.mapNoiseScale) : .15;
    let mapNoiseOctaves = options.mapNoiseOctaves ? parseInt(options.mapNoiseOctaves) : 3;
    let mapNoisePersistance = options.mapNoisePersistance ? parseFloat(options.mapNoisePersistance) : .9;
    let mapNoiseLacunarity = options.mapNoiseLacunarity ? parseFloat(options.mapNoiseLacunarity) : .1355;
    let mapNoiseOffset = options.offset ? options.offset : {
      x: 0,
      y: 0
    };

    mapNoiseOffset.x = parseInt(mapNoiseOffset.x)
    mapNoiseOffset.y = parseInt(mapNoiseOffset.y)

    //making a 2D array
    for (let i = 0; i < mapWidth; i++) {
      this.grid[i] = new Array(mapWidth);
      for (let x = 0; x < mapHeight; x++) {
        this.grid[i][x] = new Array();
      }
    }

    const noiseMap = this.noiseGenerator.generateNoiseMap(
      mapWidth,
      mapHeight,
      mapSeed,
      mapNoiseScale, 
      mapNoiseOctaves, 
      mapNoisePersistance, 
      mapNoiseLacunarity, 
      mapNoiseOffset
    );

    for (let x = 0; x < mapWidth; x++) {
      for (let y = 0; y < mapHeight; y++) {

        let currentHeight = noiseMap[x][y];

        for (let h = 0; h <= currentHeight * 10; h++) {
          let Tile = this.getTileFromNoise(currentHeight);
          this.grid[x][y][h] = new Tile(
            x,
            y,
            h,
            this.tileSize
          );
          this.grid[x][y][h].occupied = true
          this.scene.add( this.grid[x][y][h] );
        }

        this.grid[x][y][this.grid[x][y].length - 1].occupied = false;
      }
    }

    this.updateNeighbors();

  }
  getTileFromNoise(noiseVal) {
    
    if (noiseVal > .5) {
      return Rock;
    } else if (noiseVal <= .5 && noiseVal > .4) {
      const rock = parseInt(Math.random() * 8);
      if (rock <= 0) {
        return Rock;
      }
      return Path;
    } else if (noiseVal <= .4 && noiseVal > .2) {
      const path = parseInt(Math.random() * 4);
      if (path <= 0) {
        return Path;
      }
      return Grass;
    } else {
      return Water;
    }
  }

  getNoiseMapTile(x, y, rand) {
    const noise = new ImprovedNoise()

    const negX = rand < 0.5 ? 1 : -1;
    const negY = rand > 0.5 ? 1 : -1;

    const ns = noise.noise(x * rand, y * rand, 0)
    const r = parseInt(ns * 10) + 4;
    
    if (r > 6) {
      return Rock;
    } else if (r <= 6 && r > 5) {
      const rock = parseInt(Math.random() * 8);
      if (rock <= 0) {
        return Rock;
      } 
      return Path;
    } else if (r <= 5 && r > 1) {
      const path = parseInt(Math.random() * 4);
      if (path <= 0) {
        return Path;
      }
      return Grass;
    } else {
      // const rock = parseInt(Math.random() * 9);
      // if (rock <= 0) {
      //   return Rock;
      // }
      return Water;
    }
  }

  updateNeighbors() {
    for (let i = 0; i < this.cols; i++) {
      for (let j = 0; j < this.rows; j++) {
        for (let z = 0; z < this.grid[i][j].length; z++) {
          if (this.grid[i][j][z]) {
            this.grid[i][j][z].updateNeighbors(this.grid, this.cols, this.rows, this.maxZ);
          }
        }
      }
    }
  }

  findPath(start, end) {

    if (!end || end === undefined || end === null || !start || start === undefined || end === start) {
      return [];
    }

    let openSet = [start];
    let closedSet = [];
    let path = [];

    // let tileTop = this.grid[end.x][end.y][end.z + 1];
    // if (tileTop && tileTop.type !== 'air') {
    //   return [];
    // }

    if (end.walkable !== true || end.occupied === true && end.neighbors) {
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

      if (current === end || end === undefined) {
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

      if (
        current.walkable === true && 
        current.type !== 'air' && 
        current.occupied !== true
      ) {
        closedSet.push(current);
      }
  
      //remove current from openSet
      openSet.splice(lowestIndex, 1);
      
      let neighbors = current.neighbors;

      for (let i = 0; i < neighbors.length; i++) {
        let neighbor = neighbors[i];

        if (!neighbor || neighbor === undefined || end === undefined || end === null) {
          console.log({current, neighbor, end})
          // openSet = [];
          // closedSet = [];
          // return [];
          continue;
        }

        if (
          neighbor === start || 
          closedSet.includes(neighbor) ||
          neighbor.walkable !== true || 
          neighbor.occupied === true || 
          neighbor.type === 'air'
        ) {
          continue;
        }

        let possibleG = current.g + 1;
  
        if (!openSet.includes(neighbor)) {

          neighbor.g = possibleG;
          try {
            neighbor.h = this.heuristic(neighbor, end);
          } catch (error) {
            console.log({neighbor, end})
            console.log({error})
            openSet = [];
            closedSet = [];
            return [];
            continue;
          }
          neighbor.f = neighbor.g + neighbor.h;
          neighbor.f -= (parseInt(neighbor.speed * 500))

          // if (neighbor.walkable !== true || neighbor.occupied) {
          //   neighbor.f += 10000;
          // }

          neighbor.top_parent = current;
          openSet.push(neighbor);
        }
      }
      
    }
    //no solution by default
    return [];
  
  }

  heuristic(position0, position1) {
    let d1 = Math.abs(position1.x - position0.x);
    let d2 = Math.abs(position1.y - position0.y);
    let d3 = Math.abs(position1.z - position0.z);
    
    return d1 + d2 + d3;
  }

  clearAll() {
    for (let i = 0; i < this.cols; i++) {
      for (let j = 0; j < this.rows; j++) {
        for (let z = 0; z < this.grid[i][j].length; z++) {
          if (this.grid[i][j][z] === undefined) {
            continue;
          }
          this.grid[i][j][z].f = 0;
          this.grid[i][j][z].g = 0;
          this.grid[i][j][z].h = 0;
          this.grid[i][j][z].top_parent = undefined;
        }
      }
    }
  }

  render() {
    for (let i = 0; i < this.cols; i++) {
      for (let j = 0; j < this.rows; j++) {
        for (let z = 0; z <= this.grid[i][j].length; z++) {
          const tile = this.grid[i][j][z];
          if (tile && tile.type !== 'air') {
            // let newZ = tile.z + tile.size;
            // if (tile.z > 0) {
            //   newZ = tile.z * tile.size;
            // }
            // tile.position.set(tile.left, tile.top, newZ)
            this.scene.add( tile );
          }
        }
      }
    }
    return scene
  }

  getRandomTile(options) {
    
    let types = [
      Path, Grass, Water, Grass
    ];

    if (options && options.types) {
      types = []
      for (let i = 0; i < options.types.length; i++) {
        const element = options.types[i];
        const amount = element.prob * 10;

        let entity = this.getTileTypeFromString(tileData.type)

        for (let x = 0; x < amount; x++) {
          types.push(entity)
        }
      }
    }

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

  removeTile(tile) {
    if (!tile || tile === undefined || tile.z <= 0) {
      return false;
    }
    if (tile.z > 0 && this.grid[tile.x][tile.y][tile.z - 1]) {
      this.grid[tile.x][tile.y][tile.z - 1].occupied = false;
    }
    delete this.grid[tile.x][tile.y][tile.z];
    this.updateNeighbors();
    this.scene.remove(tile);
  }

  addTile(hit, newType) {

    const tile = hit.object;
    
    let x = parseInt(tile.x + hit.normal.x)
    let y = parseInt(tile.y + hit.normal.y)
    let z = parseInt(tile.z + hit.normal.z)

    if (this.previewTile) {
      x = parseInt(this.previewTile.x);
      y = parseInt(this.previewTile.y);
      z = parseInt(this.previewTile.z);
    }

    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows || z < 0 || z >= this.maxZ) {
      return false;
    }

    let entity = this.getTileTypeFromString(newType)

    const newTile = new entity(x, y, z, tile.size)
    tile.occupied = true;
    this.grid[x][y][z] = newTile;
    this.updateNeighbors();

    this.removePreview();
    this.scene.add(newTile);
  }

  addPreview(hit, newType) {
    const tile = hit.object;
    const x = tile.x + hit.normal.x
    const y = tile.y + hit.normal.y
    const z = tile.z + hit.normal.z

    if (z >= this.maxZ) {
      return false;
    }
    
    this.previewTile = new Preview(x, y, z, tile.size)
    this.scene.add(this.previewTile);
  }

  removePreview() {
    this.scene.remove(this.previewTile);
    this.previewTile = null;
  }

  replaceTile(tile, newType) {
    if (tile.type === newType) {
      return false;
    }
    let entity = this.getTileTypeFromString(tileData.type)

    const newTile = new entity(tile.x, tile.y, tile.z, tile.size)
    this.grid[tile.x][tile.y][tile.z] = newTile;

    this.scene.remove(tile);
    this.scene.add(newTile);

    this.updateNeighbors();
  }

  getTileTypeFromString(typeStr) {
    let entity = Path;
    if (typeStr === 'grass') {
      entity = Grass;
    } else if (typeStr === 'rock') {
      entity = Rock;
    } else if (typeStr === 'water') {
      entity = Water;
    } else if (typeStr === 'prize') {
      entity = Prize;
    } else if (typeStr === 'preview') {
      entity = Preview;
    }
    return entity;
  }
}

export {
  Rock, Path, Grass, Water
}

export default Mapa