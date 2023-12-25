import * as THREE from 'three';

class Cosita extends THREE.Mesh {
  constructor(map, spawn) {
    super()
    
    this.type = 'cosita';
    this.width = .15;
    this.height = .15;
    this.selected = false;
    this.speed = .05;
    this.color = "#FFFFFF"
    
    this.map = map;
    this.currentPath = null;
    this.lastTile = null;
    this.following = false;
    
    this.x = spawn ? spawn.x : 1;
    this.y = spawn ? spawn.y : 1;

    this.material = [
      new THREE.MeshBasicMaterial({color: this.color}),
      new THREE.MeshBasicMaterial({color: this.color}),
      new THREE.MeshBasicMaterial({color: this.color}),
      new THREE.MeshBasicMaterial({color: this.color}),
      new THREE.MeshBasicMaterial({color: this.color}),
      new THREE.MeshBasicMaterial({color: this.color})
    ];

    // this.material = new THREE.MeshStandardMaterial(cubeMaterials);
    this.geometry = new THREE.BoxGeometry(this.width, this.width, this.width);

    const _ct = this.currentTile(this.x, this.y);
    this.current = this.map.grid[_ct.x][_ct.y]; // current tile
    this.position.set(this.x, this.y, this.height / 2)
  }

  centerPosition(x, y) {
    let centerX = x * this.map.tileSize + this.map.tileSize / 2 - this.width / 2;
    let centerY =  y * this.map.tileSize + this.map.tileSize / 2 - this.height / 2;
    return {
      x: centerX,
      y: centerY
    }
  }


  currentTile(x, y) {
    if (x < 0) {
      x = 1
    }
    if (y < 0) {
      y = 1
    }
    const cellX = parseInt(x / this.map.tileSize);
    const cellY = parseInt(y / this.map.tileSize);

    return {
      x: cellX,
      y: cellY,
    }
  }

  update(camera, controls) {

    if (this.currentPath === null || this.currentPath.length < 1) {
      return false;
    }

    let targetCell = this.currentPath[0];
    
    if (!targetCell) {
      return false;
    }

    let targetPosX = targetCell.position.x;
    let targetPosY = targetCell.position.y;

    let diffX = parseFloat(Math.abs(this.position.x - targetPosX).toFixed(2));
    let diffY = parseFloat(Math.abs(this.position.y - targetPosY).toFixed(2));

    let nextX = this.position.x;
    let nextY = this.position.y;

    if (diffX >= this.speed) {
      if (targetPosX > this.position.x) {
        nextX += this.speed; 
      } else if (targetPosX < this.position.x) {
        nextX -= this.speed; 
      }
    }

    if (diffY >= this.speed) {
      if (targetPosY > this.position.y) {
        nextY += this.speed;
      } else if (targetPosY < this.position.y) {
        nextY -= this.speed;
      }
    }

    const oldObjectPosition = new THREE.Vector3();
    this.getWorldPosition(oldObjectPosition);
    
    this.position.set(nextX, nextY)
    
    if (this.following) {
      const oldObjectPosition = new THREE.Vector3();
      camera.getWorldPosition(oldObjectPosition);
      const newObjectPosition = new THREE.Vector3();
      camera.getWorldPosition(newObjectPosition);
      newObjectPosition.x = nextX
      newObjectPosition.y = nextY - 2
      newObjectPosition.z = this.position.z + 2
      const delta = newObjectPosition.clone().sub(oldObjectPosition);
      camera.position.add(delta);
      camera.lookAt(this.position);
    }

    if (diffY <= this.speed && diffX <= this.speed) {
      this.currentPath.shift();
      targetCell.planned = false;
      targetCell.setColor();
      
      if (!this.current || this.current != targetCell) {
        this.current.occupied = false;
        this.current.setColor();
        this.lastTile = this.current;
        this.current = targetCell;
        this.current.occupied = true;
        // const last = this.currentPath[this.currentPath.length-1];
        // if (last) {
        //   this.moveTo(last)
        // }
      }
      
      
    }
  }

  moveTo(end) {
    const endtile = this.currentTile(end.position.x, end.position.y)
    const tile = this.currentTile(this.position.x, this.position.y)
    const self = this;

    if (this.currentPath && this.currentPath.length >= 1) {
      this.currentPath.map(tile => {
        tile.planned = false;
        tile.setColor();
      });
    }

    this.currentPath = this.map.findPath(tile.x, tile.y, endtile.x, endtile.y)
      .filter((tile) => tile !== self.current);
      // console.log('currentPath', this.currentPath)

    // if (this.currentPath.length === 0) {
    //   this.currentPath = [this.current]
    // }

    this.currentPath.map(tile => {
      tile.planned = true;
      tile.setColor();
      return tile;
    });
  }

  blendColors(colorA, colorB, amount) {
    const [rA, gA, bA] = colorA.match(/\w\w/g).map((c) => parseInt(c, 16));
    const [rB, gB, bB] = colorB.match(/\w\w/g).map((c) => parseInt(c, 16));
    const r = Math.round(rA + (rB - rA) * amount).toString(16).padStart(2, '0');
    const g = Math.round(gA + (gB - gA) * amount).toString(16).padStart(2, '0');
    const b = Math.round(bA + (bB - bA) * amount).toString(16).padStart(2, '0');
    return '#' + r + g + b;
  }

  getColor = function () {
    let color = this.color;
    let specialColor = false;

    if (this.selected === true) {
      specialColor = '#fe350c'
    } if (this.hover === true) {
      specialColor = '#fed20c'
    }

    if (specialColor) {
      color = this.blendColors(color, specialColor, 0.5);
    }

    return color;
  }

  setColor(color) {
    this.material.forEach((c, i) => {
      this.material.at(i).color.set(color || this.getColor())
    })
  }

  onPointerOver(e) {
    this.hover = true
    this.setColor();
  }

  onPointerOut(e) {
    this.hover = false
    this.setColor();
  }

  onClick(e) {
    this.selected = true;
    this.setColor();
  }
  
  deselect() {
    this.selected = false;
    this.setColor();
  }
}
export default Cosita
