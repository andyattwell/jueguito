import $ from 'jquery';

class Cosita {
  constructor(id, map, spawn) {
    this.id = id;
    this.type = 'cosita';
    this.width = 15;
    this.height = 15;
    this.isMoving = false;
    this.selected = false;
    this.speed = 3;
    
    this.map = map;
    this.interval = null;
    this.currentPath = null
    
    this.listeners = {};
    
    if (spawn) {
      const pos = this.centerPosition(spawn.x, spawn.y);
      this.x = pos.x;
      this.y = pos.y;
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

    const collition = this.detectCollision(targetX, targetY);

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
    if (this.selected === true) {
      this.color = "#f5f230";
    } else {
      this.color = "#fff";
    }

    if (this.currentPath === null || this.currentPath.length < 1) {
      return false;
    }

    const targetCell = this.currentPath[0];

    if (!targetCell) {
      return false;
    }

    let targetPosX = targetCell.left + targetCell.size / 2 - this.width / 2;
    let targetPosY = targetCell.top + targetCell.size / 2 - this.height / 2;
    
    let diffX = Math.abs(parseInt(this.x - targetPosX));
    let diffY = Math.abs(parseInt(this.y - targetPosY));

    let nextX = this.x;
    let nextY = this.y;

    if (diffX >= 1) {
      if (targetPosX > this.x) {
        nextX += this.speed; 
      } else if (targetPosX < this.x) {
        nextX -= this.speed; 
      }
    }

    if (diffY >= 1) {
      if (targetPosY > this.y) {
        nextY += this.speed;
      } else if (targetPosY < this.y) {
        nextY -= this.speed;
      }
    }

    this.x = nextX
    this.y = nextY

    if (diffY <= 1 && diffX <= 1) {
      this.currentPath.shift();
      targetCell.planned = false;
    }
  }

  moveTo(endX, endY) {
    const tile = this.currentTile()
    if (this.currentPath && this.currentPath.length > 1) {
      this.currentPath.map(tile => {
        tile.planned = false;
        return tile;
      });
    }
    this.currentPath = this.map.search(tile.x, tile.y, endX, endY);
    this.currentPath.map(tile => {
      tile.planned = true;
      return tile;
    });
  }

  detectCollision(targetX, targetY) {
    let collition = false
    const cellX = parseInt(targetX / this.map.tileSize);
    const cellY = parseInt(targetY / this.map.tileSize);

    const nextCell = this.map.grid[cellX][cellY];

    if (!nextCell) {
      return false;
    }

    if (nextCell.type !== 'path') {
      // this.map.grid[cellX][cellY].color = "#f53051";
      return nextCell;
    }

    return collition;

  }

  stopMoving() {
    clearInterval(this.interval);
    this.interval = null
    this.isMoving = false;
  }

  draw (ctx) {
    ctx.beginPath();
    ctx.rect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }
}
export default Cosita
