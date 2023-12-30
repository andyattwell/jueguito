import * as THREE from 'three';

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
  updateNeighbors = function (grid, cols, rows) {
    let i = this.x;
    let j = this.y;

    const minZ = this.z >= 1 ? this.z - 1 : 0;
    const maxZ = this.z + 1;

    this.neighbors = [];

    // the floor (z 0) is a plane with no height

    for (let z = minZ; z <= maxZ; z++) {
      // left
      if (i < cols - 1 && grid[i + 1][j][z]) {
        // console.log({left: grid[i + 1][j][z]})
        this.neighbors.push(grid[i + 1][j][z]);
      }

      // right
      if (i > 0 && grid[i - 1][j][z]) {
        this.neighbors.push(grid[i - 1][j][z]);
      }

      // front
      if (j < rows - 1 && grid[i][j + 1][z]) {
        this.neighbors.push(grid[i][j + 1][z]);
        // front left
        // if (i < cols - 1 && grid[i + 1][j + 1][z]) {
        //   this.neighbors.push(grid[i + 1][j + 1][z]);
        // }

        // // front right
        // if (i > 0 && grid[i - 1][j + 1][z]) {
        //   this.neighbors.push(grid[i - 1][j + 1][z]);
        // }
      }

      // back
      if (j > 0 && grid[i][j - 1][z]) {
        this.neighbors.push(grid[i][j - 1][z]);
        
        // back left
        // if (i < cols - 1 && grid[i + 1][j - 1][z]) {
        //   this.neighbors.push(grid[i + 1][j - 1][z]);
        // }

        // // back right
        // if (i > 0 && grid[i - 1][j - 1][z]) {
        //   this.neighbors.push(grid[i - 1][j - 1][z]);
        // }
      }
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

export {
  GridPoint, Cube, Plane, Air, Rock, Water, Path, Grass, Preview, Prize
}