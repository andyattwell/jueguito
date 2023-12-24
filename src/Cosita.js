import $ from 'jquery';
import * as THREE from 'three';

class Cosita extends THREE.Mesh {
  constructor(id, map, spawn) {
    super()
    
    // this.id = id;
    this.type = 'cosita';
    this.width = .15;
    this.height = .15;
    this.isMoving = false;
    this.selected = false;
    this.speed = .05;
    this.color = "#FFFFFF"
    this.cubeActive = false;
    
    this.map = map;
    this.interval = null;
    this.currentPath = null;
    this.lastTile = null;
    
    this.listeners = {};
    
    if (spawn) {
      // const pos = this.centerPosition(spawn.x, spawn.y);
      this.x = spawn.x;
      this.y = spawn.y;
    } else {
      this.x = 0;
      this.y = 0;
    }

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
    this.position.set(this.x, this.y, -1.8)
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

  centerPosition(x, y) {
    let centerX = x * this.map.tileSize + this.map.tileSize / 2 - this.width / 2;
    let centerY =  y * this.map.tileSize + this.map.tileSize / 2 - this.height / 2;
    return {
      x: centerX,
      y: centerY
    }
  }

  keyAction(keyName) {
    let x = this.x;
    let y = this.y;
    let targetX = this.x;
    let targetY = this.y;

    switch (keyName) {
      case "w":
        if (this.y - this.speed >= 0) {
          y -= this.speed;
          targetY = y;
        }
        break;
      case "s":
        if (this.y + this.height + this.speed < this.map.rows * this.map.tileSize) {
          y += this.speed;
          targetY = y + this.width;
        }
        break;
      case "a":
        if (this.x - this.speed >= 0) {
          x -= this.speed;
          targetX = x;
        }
        break;
      case "d":
        if (this.x + this.width + this.speed < this.map.cols * this.map.tileSize) {
          x += this.speed;
          targetX = x + this.width;
        }
        break;
      default:
        break;
    }

    const collition = this.detectCollitionV2(targetX, targetY);
    if (collition) {
      return false;
    }
    
    this.x = x;
    this.y = y;

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

    // let targetPosX = targetCell.left + targetCell.size / 2 - this.width / 2;
    // let targetPosY = targetCell.top + targetCell.size / 2 - this.height / 2;

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

    // const newObjectPosition = new THREE.Vector3();
    // this.getWorldPosition(newObjectPosition);
    // const delta = newObjectPosition.clone().sub(oldObjectPosition);
    // camera.position.add(delta);

    // controls.update()
    

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

  detectCollitionV2(targetX, targetY) {
    const self  = this;
    let collition = false
    // const cellX = parseInt(targetX / this.map.tileSize);
    // const cellY = parseInt(targetY / this.map.tileSize);

    // this.current = this.map.grid[cellX][cellY];
    // if (this.current.type !== 'path') {
    //   return true;
    // }
    // console.log({nextCell})
    const myBoundry = {
      left: targetX,
      right: targetX + this.width,
      top: targetY,
      bottom: targetY + this.height,
    }

    // console.log('current', this.current)
    for (let x = 0; x < this.map.cols; x++) {
      for (let y = 0; y < this.map.rows; y++) {
        const cell = this.map.grid[x][y];
        
        if(cell.walkable !== true) {
          
          const tileBoundry = {
            left: cell.left,
            right: cell.left + self.map.tileSize,
            top: cell.top,
            bottom: cell.top + self.map.tileSize,
          }

          const left = 
            (myBoundry.left <= tileBoundry.right && 
            myBoundry.left >= tileBoundry.left)

          const right = 
            (
            myBoundry.right - this.width >= tileBoundry.left && 
            myBoundry.left <= tileBoundry.right
          )
          
          const top = 
            (myBoundry.top <= tileBoundry.bottom &&
            myBoundry.top >= tileBoundry.top)
          
          const bottom = 
            (myBoundry.bottom >= tileBoundry.top &&
            myBoundry.bottom <= tileBoundry.bottom)
            
          if ( 
            (left && top) ||
            (left && bottom) ||
            (right && top) ||
            (right && bottom) 
          ) {
            console.log(cell.id, {
              left, 
              right, 
              top, 
              bottom
            })
            cell.color = "#000";
            collition = true;
          }

        }   

      }
    }

    return collition;
  }

  detectCollision(targetX, targetY) {
    let collition = false
    const cellX = parseInt(targetX / this.map.tileSize);
    const cellY = parseInt(targetY / this.map.tileSize);

    const nextCell = this.map.grid[cellX][cellY];

    if (!nextCell) {
      return false;
    }

    if (nextCell.walkable !== true) {
      // this.map.grid[cellX][cellY].color = "#f53051";
      return nextCell;
    }

    return collition;

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
    console.log('ACA')
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
