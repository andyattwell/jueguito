import $ from 'jquery';

class Cosita {
  constructor(map, containerId, spawn) {
    this.id = null;
    this.containerId = containerId;
    this.width = 15;
    this.height = 15;
    this.element = null;
    this.isMoving = false;
    this.color = '#fff';
    this.speed = 3;
    
    this.map = map;
    this.interval = null;
    this.currentCell = spawn ? spawn : map.grid[0][0];
    this.currentPath = null
    
    this.listeners = {};
    
    if (spawn) {
      const pos = this.centerPosition(spawn.x, spawn.y);
      this.x = pos.x;
      this.y = pos.y;
    }
    
    this.createCosita();

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

  createCosita() {
    let self = this;
    self.element = $("<div>");;
    self.element.addClass('Cosita');
    self.element.css('width', self.width);
    self.element.css('height', self.height);
    // const pos = self.centerPosition(self.x, self.y)
    self.element.css('top', this.y);
    self.element.css('left', this.x);

    const cositasCreated = $(document).find('.Cosita').length;
    self.id = cositasCreated + 1;

    self.element.on('click', () => {
      self.emit('selected', self);
      $(".Cosita").removeClass('selected');
      self.element.addClass('selected');
    })
    return self.element;
  }

  select () {
    this.color = '#f5f230';
  }

  deselect () {
    this.color = '#fff';
  }

  centerPosition(x, y) {
    let centerX = x * this.map.tileSize + this.map.tileSize / 2 - this.width / 2;
    let centerY =  y * this.map.tileSize + this.map.tileSize / 2 - this.height / 2;
    return {
      x: centerX,
      y: centerY
    }
  }

  getCurrentCell(posX, posY) {
    let x = parseInt(posX / this.map.tileSize);
    let y = parseInt(posY / this.map.tileSize);
    return { x, y }
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

  moveTo(endX, endY) {
    const cellX = parseInt(this.x / this.map.tileSize);
    const cellY = parseInt(this.y / this.map.tileSize);
    this.currentPath = this.map.search(cellX, cellY, endX, endY);
    // this.followPath();
    let self = this
    
    self.takeStep()
      .then(() => {
        self.currentPath.shift();
        if (self.currentPath.length > 0) {
          self.followPath();
        }
      })
  }

  async followPath() {
    if (this.currentPath.length < 1) {
      return false;
    }
    let self = this
    
    self.takeStep()
      .then(() => {
        self.currentPath.shift();
        if (self.currentPath.length > 0) {
          self.followPath();
        }
      })
  }

  takeStep() {
    let self = this;
    const targetCell = self.currentPath[0];

    return new Promise((resolve) => {
      if (self.isMoving) {
        return false;
      }
      
      self.isMoving = true;

      let cicles = 0;

      let targetPosX = targetCell.left + targetCell.size / 2 - self.width / 2;
      let targetPosY = targetCell.top + targetCell.size / 2 - self.height / 2;

      this.interval = setInterval(() => {
        
        let diffX = Math.abs(parseInt(self.x - targetPosX));
        let diffY = Math.abs(parseInt(self.y - targetPosY));

        let nextX = self.x;
        let nextY = self.y;

        if (diffX >= 1) {
          if (targetPosX > self.x) {
            nextX += this.speed; 
          } else if (targetPosX < self.x) {
            nextX -= this.speed; 
          }
        }

        if (diffY >= 1) {
          if (targetPosY > self.y) {
            nextY += this.speed;
          } else if (targetPosY < self.y) {
            nextY -= this.speed;
          }
        }

        self.x = nextX
        self.y = nextY

        if (diffY <= 1 && diffX <= 1 || cicles >= 500) {

          self.stopMoving();
          self.currentCell = targetCell;
          resolve(targetCell);
        }

        cicles++;
      }, 10)
    })
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
      this.map.grid[cellX][cellY].color = "#f53051";
      return nextCell;
    }

    return collition;

  }

  stopMoving() {
    clearInterval(this.interval);
    this.interval = null
    this.isMoving = false;
  }

  get position() {
    return [this.x, this.y];
  }

  get size() {
    return [this.width, this.height];
  }

  draw (ctx) {
    // const pos = this.centerPosition(this.x, this.y)
    ctx.beginPath();
    ctx.rect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }
}
export default Cosita
