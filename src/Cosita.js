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
      console.log({pos})
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

  deselect () {
    this.element.removeClass('selected');
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
      console.log({collition})
      return false;
    }
    
    this.x = x;
    this.y = y;

    // if (this.x !== x || this.y !== y) {
      // if (this.isMoving) {
      //   this.stopMoving();
      //   this.currentPath = [];
      // }
      // this.takeStep(x, y);
      // this.currentPath = [this.map.grid[x][y]];
      // this.followPath();
    // }
  }

  moveTo(endX, endY) {
    this.currentPath = this.map.search(this.x, this.y, endX, endY);
    $(".tile").removeClass("planned")
    for (let index = 0; index < this.currentPath.length; index++) {
      $("#tile-"+this.currentPath[index].id).addClass("planned");
    }
    this.followPath();
  }

  async followPath() {
    if (this.currentPath.length < 1) {
      return false;
    }
    let self = this
    self.takeStep(self.currentPath[0].x, self.currentPath[0].y)
      .then((tile) => {
        $("#tile-"+self.currentPath[0].id).removeClass("planned");
        self.currentPath.shift();
        if (self.currentPath.length > 0) {
          self.followPath();
        } else {
          $(".tile").removeClass("planned");
        }
      })
  }

  takeStep(targetX, targetY) {
    let self = this;

    return new Promise((resolve) => {
      if (self.isMoving) {
        return false;
      }
      
      self.isMoving = true;
      const targetCell = self.map.grid[targetX][targetY];
      
      // let colision = self.detectCollision(targetCell);
      if (targetCell.type !== 'path') {
        self.isMoving = false;
        return false;
      }

      // $(".tile").removeClass('next');
      // $('#tile-'+targetCell.id).addClass('next');

      let step = 1;
      let cicles = 0;
      let targetPos = $('#tile-'+targetCell.id).position();
      let targetPosX = targetPos.left + self.map.tileSize / 2 - self.width / 2;
      let targetPosY = targetPos.top + self.map.tileSize / 2 - self.height / 2;

      this.interval = setInterval(() => {
        let currentPos = self.element.position();
        let diffX = Math.abs(parseInt(currentPos.left - targetPosX));
        let diffY = Math.abs(parseInt(currentPos.top - targetPosY));

        let nextX = currentPos.left;
        let nextY = currentPos.top;

        if (diffX >= 1) {
          if (targetPosX > currentPos.left) {
            nextX += step; 
          } else if (targetPosX < currentPos.left) {
            nextX -= step; 
          }
        }

        if (diffY >= 1) {
          if (targetPosY > currentPos.top) {
            nextY += step;
          } else if (targetPosY < currentPos.top) {
            nextY -= step;
          }
        }

        self.element.css('left', nextX);
        self.element.css('top', nextY);

        if (diffY <= 1 && diffX <= 1 || cicles == 500) {
          self.x = targetX;
          self.y = targetY;
          self.stopMoving();
          self.currentCell = targetCell;
          resolve($('#tile-'+targetCell.id));
          $('#tile-'+targetCell.id).addClass('trail');
          setTimeout(() => {
            $('#tile-'+targetCell.id).removeClass('trail')
          }, 600);
        }
        cicles++;

      })
    })
  }

  detectCollision(targetX, targetY) {
    let collition = false
    const cellX = parseInt(targetX / this.map.tileSize);
    const cellY = parseInt(targetY / this.map.tileSize);

    const nextCell = this.map.grid[cellX][cellY];
    if (nextCell.type !== 'path') {
      this.map.grid[cellX][cellY].color = "#f53051";
      return true;
    }
    
    const myBoundry = {
      left: targetX,
      right: targetX + this.width,
      top: targetY,
      bottom: targetY + this.height,
    }
    
    // for (let i = 0; i < this.map.grid.length; i++) {
    //   for (let j = 0; j < this.map.grid[i].length; j++) {

    //     const nextCell = this.map.grid[i][j];
        
    //     if (nextCell.type === 'path') {
    //       continue;
    //     }
    //     // console.log('asdasd', nextCell.type)

    //     const tileBoundry = {
    //       left: nextCell.x * this.map.tileSize,
    //       right: nextCell.y * this.map.tileSize + this.map.tileSize,
    //       top: nextCell.y * this.map.tileSize,
    //       bottom: nextCell.y * this.map.tileSize + this.map.tileSize,
    //     }

    //     if (
    //       myBoundry.left <= tileBoundry.right && 
    //       myBoundry.right >= tileBoundry.left &&
    //       myBoundry.top <= tileBoundry.bottom &&
    //       myBoundry.botom >= tileBoundry.top
    //     ) {
    //       this.map.grid[i][j].color = "#f53051";
    //       collition = { myBoundry, tileBoundry };
    //     }
    
    //     // if (
    //     //   myBoundry.bottom >= tileBoundry.top
    //     // ) {
    //     //   collition = 'bottom';
    //     //   // nextCell.color = "#f53051";
          
    //     // }
    //     // if (myBoundry.top >= tileBoundry.bottom) {
    //     //   collition = 'top';
    //     // }
    //     // if (myBoundry.left >= tileBoundry.right) {
    //     //   collition = 'left';
    //     // }
    //   }
    // }

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
