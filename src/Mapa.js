import {ImprovedNoise} from './lib/ImprovedNoise.js';
import NoiseGenerator from './NoiseGenerator.js';
import { Rock, Water, Path, Grass, Preview, Prize, Snow, GridPoint } from './Tile.js'
import * as THREE from 'three';
import {Cube} from './Tile.js'

class Mapa {
  
  noiseGenerator = new NoiseGenerator()
  constructor(scene, data = [], options = {}) {

    this.cols = options.mapWidth ? parseInt(options.mapWidth) : 40;
    this.rows = options.mapDepth ? parseInt(options.mapDepth) : 40;
    this.height = options.mapHeight ? parseInt(options.mapHeight) : 40;

    this.maxZ = 12;
    this.grid = [];
    this.tiles = [];
    
    this.closedSet = [];
    this.openSet = [];
    
    this.tileSize = 4;
    
    this.offsetX = 0;
    this.offsetY = 0;

    this.scene = scene;

    this.generateGrid();

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

  generateGrid() {
    let count = 0;
    for (let x = 0; x < this.cols; x++) {
      this.grid[x] = new Array(this.rows);
      for (let z = 0; z < this.rows; z++) {
        this.grid[x][z] = new Array(this.height);
        for (let y = 0; y < this.height; y++) {
          this.grid[x][z][y] = new GridPoint(
            x,
            z,
            y,
            count
          );
          count++;
        }
      }
    }
  }

  generate(options = {}) {
    this.generateGrid(options);
    let noiseMap;
    if (!options.mapFlat) {
      noiseMap = this.noiseGenerator.generateNoiseMap(options);
    }

    let count = 0;
    for (let x = 0; x < this.cols; x++) {
      for (let z = 0; z < this.rows; z++) {
        let currentHeight = !options.mapFlat ? parseInt(noiseMap[x][z] * 15) : options.mapAltitude;
        currentHeight = currentHeight < 0 ? 0 : currentHeight;

        for (let h = 0; h <= currentHeight; h++) {
          if (options.mapAltitude && h >= options.mapAltitude * 10) {
            continue;
          }

          let tile = this.getTileFromNoise(x, z, h, currentHeight);

          if (tile) {
            this.tiles[count] = new tile(
              this,
              x,
              z,
              h,
              this.tileSize,
              count
            );
            count++;
          }
        }
      }
    }

    this.totalCubes = count;

    this.updateNeighbors();
    // const geometry = new THREE.BoxGeometry(.2, .2, .2);
    this.updateInstancedMesh();
    
  }

  updateInstancedMesh() {

    if (this.scene.getObjectByName('meshmap')) {
      this.scene.getObjectByName('meshmap').dispose();
      this.scene.remove(this.scene.getObjectByName('meshmap'))
    }
    const tile = new Cube(this, 0, 0, 0, "#fff", this.tileSize);
    const mesh = new THREE.InstancedMesh(tile.geometry, tile.material, this.tiles.length);
    mesh.name = 'meshmap';
    this.scene.add(mesh);
    mesh.updateMatrix();
    
    let current = 0;
    for (let x = 0; x < this.tiles.length; x++) {
      const dummyTile = this.tiles[x];
      if (dummyTile) {
        dummyTile.resetGeometry();
        dummyTile.updateMatrix();
        mesh.setMatrixAt(current, dummyTile.matrix)
        mesh.setColorAt(current, new THREE.Color(dummyTile.color))
      }
      current++;
    }
    mesh.updateMatrix();

  }

  getTileFromNoise(x, z, h, noiseVal, flat) {

    if (flat) {
      noiseVal = 3;
    }
    
    if (noiseVal !== h) {
      if (
        (x === 0) ||
        (x === this.cols) ||
        (z === 0) ||
        (z === this.rows) ||
        h === 0
      ) {
        return Rock
      } else {
        this.grid[x][z][h] = null
      }
    }

    noiseVal = parseInt(noiseVal)
    noiseVal = h;
    console.log(noiseVal)
    if (noiseVal >= 12) {
      return Snow;
    } else if (noiseVal <= 11 && noiseVal >= 7) {
      return parseInt(Math.random() * 8) <= 0 ? Path : Rock;
    } else if (noiseVal <= 6 && noiseVal >= 4) {
      return Grass;
    } else if (noiseVal <= 6 && noiseVal >= 4) {
      return parseInt(Math.random() * 8) <= 0 ? Grass : Path;
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

    if ((end.walkable !== true || end.occupied === true) && end.neighbors) {
      let newEnd = null
      for (let index = 0; index < end.neighbors.length; index++) {
        if (!newEnd && end.neighbors[index].walkable === true && end.neighbors[index].occupied === false){
          newEnd = end.neighbors[index];
          break;
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

  removeTile(instanceId) {
    const tile = this.tiles[instanceId];
    if (!tile) {
      return false;
    }

    delete this.grid[tile.x][tile.y][tile.z];
    this.updateNeighbors();

    // this.tiles.splice(instanceId, 1);
    delete this.tiles[instanceId];
    this.updateInstancedMesh();
  }

  addTile(hit, newType) {

    const tile = this.tiles[hit.instanceId];
    
    let x = parseInt(tile.x + hit.normal.x)
    let y = parseInt(tile.y + hit.normal.y)
    let z = parseInt(tile.z + hit.normal.z)

    // if (this.previewTile) {
    //   x = parseInt(this.previewTile.x);
    //   y = parseInt(this.previewTile.y);
    //   z = parseInt(this.previewTile.z);
    //   this.removePreview();
    // }

    if (x < 0 || x >= this.cols || z < 0 || z >= this.rows || y < 0 || y >= this.maxZ) {
      return false;
    }

    let entity = this.getTileTypeFromString(newType)

    const newTile = new entity(x, z, y, tile.size);
    this.grid[x][z][y] = new GridPoint(x, z, y);
    console.log('add', newTile)
    this.tiles.push(newTile);
    this.updateNeighbors();
    this.updateInstancedMesh();
  }

  addPreview(hit, newType) {
    console.log('addPreview')
    const tile = this.tiles[hit.instanceId];
    
    let x = parseInt(tile.x + hit.normal.x)
    let y = parseInt(tile.y + hit.normal.y)
    let z = parseInt(tile.z + hit.normal.z)

    if (x < 0 || x >= this.cols || z < 0 || z >= this.rows || y < 0 || y >= this.maxZ) {
      return false;
    }
    
    const prev = new Preview(x, z, y, tile.size)
    this.tiles.push(prev);
    this.previewTile = prev;
    // this.previewTile.instanceId = hit.instanceId;
    this.updateInstancedMesh();
  }

  removePreview() {
    if (!this.previewTile) {
      return false;
    }
    console.log('remove', this.previewTile)
    delete this.tiles[this.previewTile.instanceId];
    this.previewTile = null;
    this.updateInstancedMesh();

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

export default Mapa