import $ from 'jquery';

class Cosita {
  constructor(id, map, spawn) {
    this.id = id;
    this.type = 'cosita';
    this.width = 15;
    this.height = 15;
    this.isMoving = false;
    this.selected = false;
    this.speed = 1;
    this.color = "#FFFFFF"
    
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

    const _ct = this.currentTile();
    this.current = this.map.grid[_ct.x][_ct.y]; // current tile

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

  currentTile() {
    const cellX = parseInt(this.x / this.map.tileSize);
    const cellY = parseInt(this.y / this.map.tileSize);

    return {
      x: cellX,
      y: cellY,
    }
  }

  update() {

    if (this.currentPath === null || this.currentPath.length < 1) {
      return false;
    }

    let targetCell = this.currentPath[0];
    
    if (!targetCell) {
      return false;
    }

    let targetPosX = targetCell.left + targetCell.size / 2 - this.width / 2;
    let targetPosY = targetCell.top + targetCell.size / 2 - this.height / 2;

    let diffX = Math.abs(parseInt(this.x - targetPosX));
    let diffY = Math.abs(parseInt(this.y - targetPosY));

    let nextX = this.x;
    let nextY = this.y;
    const speed = (targetCell.speed || 0.1) * this.speed
    if (diffX >= 1) {
      if (targetPosX > this.x) {
        nextX += speed; 
      } else if (targetPosX < this.x) {
        nextX -= speed; 
      }
    }

    if (diffY >= 1) {
      if (targetPosY > this.y) {
        nextY += speed;
      } else if (targetPosY < this.y) {
        nextY -= speed;
      }
    }

    this.x = nextX
    this.y = nextY

    if (diffY <= 1 && diffX <= 1) {
      this.currentPath.shift();
      targetCell.planned = false;
      
      if (!this.current || this.current != targetCell) {
        this.current.occupied = false;
        this.lastTile = this.current;
        this.current = targetCell;
        this.current.occupied = true;
      }

      const last = this.currentPath[this.currentPath.length-1];
      if (last) {
        this.moveTo(last.x, last.y)
      }
    }
  }

  moveTo(endX, endY) {

    const tile = this.currentTile()
    const self = this;
    if (this.currentPath && this.currentPath.length >= 1) {
      this.currentPath.map(tile => {
        tile.planned = false;
        return tile;
      });
    }

    this.currentPath = this.map.findPath(tile.x, tile.y, endX, endY)
      .filter((tile) => tile !== self.current);

    if (this.currentPath.length === 0) {
      this.currentPath = [this.current]
    }

    this.currentPath.map(tile => {
      tile.planned = true;
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

  draw (ctx, zoom) {

    if (this.map.offsetX + this.x * zoom  < 0 || this.map.offsetX + this.x * zoom  > this.map.viewArea.width) {
      return;
    }

    if (this.map.offsetY + this.y * zoom  < 0 || this.map.offsetY + this.y * zoom  > this.map.viewArea.height) {
      return;
    }

    ctx.beginPath();
    ctx.rect(this.map.offsetX + this.x * zoom , this.map.offsetY + this.y * zoom , this.width * zoom, this.height * zoom);
    ctx.fillStyle = this.selected ? '#f5f230' : this.color;
    ctx.fill();
    ctx.closePath();
  }
}
export default Cosita
