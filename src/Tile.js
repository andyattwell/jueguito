import * as THREE from 'three';

class GridPoint extends THREE.Mesh {
  constructor(x, z, y, gridIndex) {
    super()

    this.gridIndex = gridIndex
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
    let j = this.z;

    const minY = this.y >= 1 ? this.y - 1 : 0;
    const maxY = this.y + 1;

    this.neighbors = [];

    // the floor (z 0) is a plane with no height

    for (let y = minY; y <= maxY; y++) {
      // left
      if (i < cols - 1 && grid[i + 1][j][y]) {
        // console.log({left: grid[i + 1][j][z]})
        this.neighbors.push(grid[i + 1][j][y]);
      }

      // right
      if (i > 0 && grid[i - 1][j][y]) {
        this.neighbors.push(grid[i - 1][j][y]);
      }

      // front
      if (j < rows - 1 && grid[i][j + 1][y]) {
        this.neighbors.push(grid[i][j + 1][y]);
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
      if (j > 0 && grid[i][j - 1][y]) {
        this.neighbors.push(grid[i][j - 1][y]);
        
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
    let typeColor = this.typeColor;
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
  constructor(x, z, y, color, size, gridIndex) {
    super(x, z, y, gridIndex)
    this.typeColor = color;
    this.color = color;
    this.size = size;
    this.opacity = 1;
    this.material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 1
    })
    this.resetGeometry();
  }

  resetGeometry() {
    this.geometry = new THREE.BoxGeometry(this.size, this.size, this.size);
    this.position.set(this.x * this.size, this.y * this.size - .1, this.z * this.size)
  }

  setColor (color) {
    let _color = color || this.getColor();
    if (!_color) {
      return false;
    }
    this.color = _color;
    this.material = new THREE.MeshBasicMaterial({
      color: _color,
      opacity: this.opacity
    })
  }
}

class Plane extends GridPoint {
  constructor(x, z, y, color, size, gridIndex) {
    super(x, z, y, gridIndex)
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
  constructor(x, z, y, size, gridIndex) {
    super(x, z, y, null, size, gridIndex)
    this.type = 'air';
    this.walkable = true;
    this.visible = false;
  }

}

class Snow extends Cube {
  constructor(x, z, y, size, gridIndex) {
    super(x, z, y, "#FFFFFF", size, gridIndex)
    this.type = 'snow';
    this.walkable = true;
    this.setColor();
  }
}

class Rock extends Cube {
  constructor(x, z, y, size, gridIndex) {
    super(x, z, y, "#685e70", size, gridIndex)
    this.type = 'rock';
    this.walkable = false;
    this.typeColor = Math.random() < 0.5 ? "#554e5a" : "#685e70";
    this.setColor();
  }
}

class Water extends Cube {
  constructor(x, z, y, size, gridIndex) {
    super(x, z, y, "#2093d5", size, gridIndex);
    this.type = 'water';
    // this.walkable = false;
    this.walkable = true;
    this.speed = .01
    this.setColor();
  }
}

class Path extends Cube {
  constructor(x, z, y, size, gridIndex) {
    super(x, z, y,"#aa9f2b", size, gridIndex);
    this.type = 'path';
    this.walkable = true;
    this.speed = .05
    this.setColor();
  }
}

class Grass extends Cube {
  constructor(x, z, y, size, gridIndex) {
    super(x, z, y, "#51d343", size, gridIndex);
    this.type = 'grass';
    this.walkable = true;
    this.speed = .04
    this.setColor();
  }
}

class Preview extends Cube {
  constructor(x, z, y, size) {
    super(x, z, y, "#3af4ff", size);
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
  constructor(x, z, y, size) {
    super(x, z, y, "#ce1fd7", size);
    this.type = 'prize';
    this.walkable = false;
    this.setColor();
  }
}

export {
  GridPoint, Cube, Plane, Air, Rock, Water, Path, Grass, Preview, Prize, Snow
}