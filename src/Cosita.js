import $ from 'jquery';

class Cosita {
  constructor(map, containerId, spawn) {
    this.id = null;
    this.containerId = containerId;
    this.width = 30;
    this.height = 30;
    this.x = spawn.x;
    this.y = spawn.y;
    this.element = null;
    this.isMoving = false;

    this.map = map;
    this.interval = null;
    this.currentCell = spawn ? spawn : map.grid[0][0];
    this.currentPath = null
    
    this.listeners = {};

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
    const pos = self.centerPosition(self.x, self.y)
    self.element.css('top', pos.y);
    self.element.css('left', pos.x);

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
    console.log(keyName, {x,y, cols: this.map.cols, rows: this.map.rows})
    switch (keyName) {
      case "w":
        if (this.y - 1 >= 0) {
          y -= 1;
        }
        break;
      case "s":
        if (this.y + 1 < this.map.rows) {
          y += 1;
        }
        break;
      case "a":
        if (this.x - 1 >= 0) {
          x -= 1;
        }
        break;
      case "d":
        if (this.x + 1 < this.map.cols) {
          x += 1;
        }
        break;
      default:
        break;
    }
    console.log('2', {x,y})

    if (this.x !== x || this.y !== y) {
      // if (this.isMoving) {
      //   this.stopMoving();
      //   this.currentPath = [];
      // }
      // this.takeStep(x, y);
      this.currentPath = [this.map.grid[x][y]];
      this.followPath();
    }
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

      $(".tile").removeClass('next');
      $('#tile-'+targetCell.id).addClass('next');

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

  detectCollision(nextCell) {
 
    if (nextCell.type === 'path') {
      return false
    }
    
    const myBoundry = {
      left: parseInt(this.element.position().left),
      right: parseInt(this.element.position().left + this.width * 2),
      top: parseInt(this.element.position().top),
      bottom: parseInt(this.element.position().top + this.height),
    }

    const tileBoundry = {
      left: parseInt($('#tile-'+nextCell.id).position().left),
      right: parseInt($('#tile-'+nextCell.id).position().left + $('#tile-'+nextCell.id).width()),
      top: parseInt($('#tile-'+nextCell.id).position().top),
      bottom: parseInt($('#tile-'+nextCell.id).position().top + $('#tile-'+nextCell.id).height()),
    }

    let collition = false

    if (myBoundry.bottom >= tileBoundry.top) {
      collition = 'bottom';
    } else if (myBoundry.top >= tileBoundry.bottom) {
      collition = 'top';
    } else if (myBoundry.right >= tileBoundry.left) {
      collition = 'right';
    } else if (myBoundry.left >= tileBoundry.right) {
      collition = 'left';
    }

    if (collition) {
      return false;
    }

    return true;

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
}
export default Cosita
