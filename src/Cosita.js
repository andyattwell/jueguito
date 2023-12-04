import $ from 'jquery';

class Cosita {
  constructor(map) {
    this.width = 30;
    this.height = 30;
    this.tileSize = 60;
    this.x = 3;
    this.y = 3;
    this.speed = 0;
    this.element = null;
    this.isMoving = false;
    this.moving = {
      up: false,
      down: false,
      left: false,
      right: false,
    }
    this.map = map;
    this.interval = null;
    this.targetCell = null;
    this.currentCell = map.tileArray[0][0];
    this.currentPath = null
    this.currentStep = 0
    this.init();

  }

  init() {
    this.createCosita()
  }

  createCosita() {
    let self = this;
    return new Promise((resolve, reject) => {

      self.element = $("<div>");;
      self.element.addClass('Cosita');
      self.element.css('width', self.width);
      self.element.css('height', self.height);
      const pos = self.centerPosition(self.x, self.y)
      self.element.css('top', pos.y);
      self.element.css('left', pos.x);
      self.map.$container.append(self.element);

      $(document).on("keydown", (event) => {
        self.keyAction(event.key);
      });

      $(".tile").on('click', (e) => {
        const row = $(e.target).attr('data-row');
        const col = $(e.target).attr('data-cell');
        self.move(col, row);
      });

      return resolve(self.element);
    });
  }

  centerPosition(x, y) {
    let centerX = x * this.tileSize + this.tileSize / 2 - this.width / 2;
    let centerY =  y * this.tileSize + this.tileSize / 2 - this.height / 2;
    return {
      x: centerX,
      y: centerY
    }
  }

  getCurrentCell(posX, posY) {
    let x = parseInt(posX / this.tileSize);
    let y = parseInt(posY / this.tileSize);
    return { x, y }
  }

  keyAction(keyName) {
    let x = this.x;
    let y = this.y;
    switch (keyName) {
      case "w":
        if (this.y - 1 >= 0) {
          y -= 1;
        }
        break;
      case "s":
        if (this.y + 1 < this.map.height) {
          y += 1;
        }
        break;
      case "a":
        if (this.x - 1 >= 0) {
          x -= 1;
        }
        break;
      case "d":
        if (this.x + 1 < this.map.width) {
          x += 1;
        }
        break;
      default:
        break;
    }
    if (this.x !== x || this.y !== y) {
      this.takeStep(x, y);
    }
  }

  move(x, y) {
    this.currentPath = this.drawPath(x, y);
    this.followPath();
  }

  drawPath(targetX, targetY) {

    $(".tile").removeClass('selected');
    $(".tile").removeClass('following');

    this.targetCell = this.map.tileArray[targetY][targetX];
    let path = this.choosePath(
      this.x, 
      this.y, 
      targetX, 
      targetY
    );

    return path
  }

  choosePath(currentX, currentY, targetX, targetY, trys = 0) {
    let path = [];
    let diffY = Math.abs(parseInt(currentY - targetY));
    let diffX = Math.abs(parseInt(currentX - targetX));

    let nextX = currentX;
    let nextY = currentY;
    let moveDirY = 'up';
    let moveDirX = 'up';
    //0 up, 1 right, 2 down, 3 right

    if (diffY > 0 && diffY > diffX) {
      if (targetY > currentY) {
        moveDirY = 'down'
        nextY++;
      } else if (targetY < currentY) {
        moveDirY = 'up'
        nextY--;
      }
    } else if (diffX > 0 && diffX > diffY || diffX == diffY) {
      if (targetX > currentX) {
        nextX++;
        moveDirX = 'right'
      } else if (targetX < currentX) {
        moveDirX = 'left'
        nextX--;
      }
    } 


    let targetCell = this.map.tileArray[nextY][nextX];
    let currentCell = this.map.tileArray[currentY][currentX];
    let isPath = this.detectCollision(targetCell)

    if (!isPath) {
      if (moveDirY === 'up' || moveDirY === 'down') {
        targetCell = this.map.tileArray[nextY][currentX];
        isPath = this.detectCollision(targetCell)
        if (isPath) {
          nextX = currentX;
        } else {
          let textX = currentX;
          if (moveDirX === 'left') {
            textX--;
          } else {
            textX++;
          }
          targetCell = this.map.tileArray[currentY][textX];
          isPath = this.detectCollision(targetCell)
        }
      }
    }

    if (!isPath) {
      if (moveDirX === 'left' || moveDirX === 'right') {
        targetCell = this.map.tileArray[currentY][nextX];
        isPath = this.detectCollision(targetCell)
        if (isPath) {
          nextY = currentY;
        } else {
        
          let textY = currentX;
          if (moveDirY === 'up') {
            textY++;
          } else {
            textY++;
          }
          targetCell = this.map.tileArray[textY][currentX];
          isPath = this.detectCollision(targetCell)
        }
      }
    }

    
    if (!isPath) {
      if (moveDirY === 'up' && this.map.tileArray[currentY+1]) {
        targetCell = this.map.tileArray[currentY+1][currentX];
        isPath = this.detectCollision(targetCell)
        if (isPath) {
          nextY = currentY+1;
        }
      }
      if (moveDirY === 'down') {
        targetCell = this.map.tileArray[currentY-1][currentX];
        isPath = this.detectCollision(targetCell)
        if (isPath) {
          nextY = currentY-1;
        }
      }
    }
    
    if (!isPath) {
      if (moveDirY === 'left') {
        targetCell = this.map.tileArray[currentY][currentX+1];
        isPath = this.detectCollision(targetCell)
        if (isPath) {
          nextX = currentX+1;
        }
      }
      if (moveDirY === 'down') {
        targetCell = this.map.tileArray[currentY][currentX-1];
        isPath = this.detectCollision(targetCell)
        if (isPath) {
          nextX = currentX+1;
        }
      }
    }

    // const targetCell = this.map.tileArray[nextY][nextX];
    // let isPath = this.detectCollision(targetCell);
    
    if (isPath) {
      
      // targetCell.$tile.addClass('following')
      // targetCell.$tile.text(trys)
      path.push([nextX, nextY]);
    } else {
      if (trys < 50) {
        path = path.concat(this.choosePath(nextX, nextY, targetX, targetY, trys+1));
      } else {
        return path;
      }
    }

    if (trys > 150) {
      return path;
    }
    
    if (!isPath || targetX != currentX || targetY != currentY) {      
      path = path.concat(this.choosePath(nextX, nextY, targetX, targetY, trys+1));
    }

    return path;

  }

  async followPath() {
    if (this.currentPath.length < 1) {
      return false;
    }
    let self = this
    self.takeStep(self.currentPath[0][0], self.currentPath[0][1])
      .then(() => {
        self.currentPath.shift();
        if (self.currentPath.length > 0) {
          self.followPath();
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
      const targetCell = self.map.tileArray[targetY][targetX];
      
      let colision = self.detectCollision(targetCell);
      if (!colision) {
        self.isMoving = false;
        return false;
      }
      targetCell.$tile.addClass('next');
      $('.tile').removeClass('selected');

      let step = 1;
      let cicles = 0;
      let targetPos = targetCell.$tile.position();
      let targetPosX = targetPos.left + self.tileSize / 2 - self.width / 2;
      let targetPosY = targetPos.top + self.tileSize / 2 - self.height / 2;

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
          targetCell.$tile.removeClass('next');
          targetCell.$tile.addClass('selected');
          // targetCell.$tile.addClass('following');
          resolve(targetCell);
        }
        cicles++;

      })
    })
  }

  detectCollision(nextCell) {
 
    $(".tile").removeClass('next');
    if (nextCell.type === 'path') {
      return true
    }

    const myBoundry = {
      left: parseInt(this.element.position().left),
      right: parseInt(this.element.position().left + this.width * 2),
      top: parseInt(this.element.position().top),
      bottom: parseInt(this.element.position().top + this.height),
    }

    const tileBoundry = {
      left: parseInt(nextCell.$tile.position().left),
      right: parseInt(nextCell.$tile.position().left + nextCell.$tile.width()),
      top: parseInt(nextCell.$tile.position().top),
      bottom: parseInt(nextCell.$tile.position().top + nextCell.$tile.height()),
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
