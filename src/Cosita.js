import $ from 'jquery';

class Cosita {
  constructor(map) {
    this.width = 30;
    this.height = 30;
    this.tileSize = 60;
    this.x = 0;
    this.y = 0;
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
    this.createCosita().then((co) => {
      setTimeout(() => {
        console.log("Cosita created");
      }, 300);
    });
    // document.body.appendChild();
  }

  createCosita() {
    let self = this;
    return new Promise((resolve, reject) => {
      console.log("New Cosita", this.x, this.y, this.width, this.height);

      self.element = $("<div>");;
      self.element.addClass('Cosita');
      self.element.css('width', self.width);
      self.element.css('height', self.height);
      // const pos = self.centerPosition(self.x, self.y)
      // console.log({pos})
      // self.element.css('top', pos.y);
      // self.element.css('left', pos.x);
      self.map.$container.append(self.element);
      
      // self.move(5, 3)

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
        } else {
          y = this.map.height - 1;
        }
        break;
      case "s":
        if (this.y + 1 < this.map.height) {
          y += 1;
        } else {
          y = 0;
        }
        break;
      case "a":
        if (this.x - 1 >= 0) {
          x -= 1;
        } else {
          x = this.map.width - 1;
        }
        break;
      case "d":
        if (this.x + 1 < this.map.width) {
          x += 1;
        } else {
          x = 0;
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
    console.log('move')
    if (this.isMoving) {
      this.stopMoving();
    }
    this.currentPath = this.drawPath(x, y);
    // this.transitionV2();
  }

  drawPath(targetX, targetY) {

    $(".tile").removeClass('selected');
    $(".tile").removeClass('following');

    const target = this.centerPosition(targetX, targetY);
    let path = [];
    this.targetCell = this.map.tileArray[targetY][targetX];

    let diffY = Math.abs(parseInt(targetY - this.element.position().left));
    let diffX = Math.abs(parseInt(targetX - this.element.position().top));

    let x = this.x
    let nextX = 0;
    let lastX = 0;
    let nextY = 0;
    let lastCell = null

    while (x != targetX) {
    
      if (diffX >= 1) {
        if (targetX > x) {
          nextX += 1; 
        } else if (targetX < x) {
          nextX -= 1; 
        }
      }

      const cell = this.map.tileArray[nextY][nextX];
      
      if (cell.type === 'path') {
        path.push([nextX, nextY]);
        cell.$tile.addClass('following')
        lastX = nextX;
        lastCell = cell
      } else {
        lastX = nextX - 1;
        break;
      }

      x++;
    }

    let y = this.y;
    while (y != targetY) {
      if (diffY >= 1) {
        if (targetY > y) {
          nextY += 1;
        } else if (targetY < y) {
          nextY -= 1;
        }

        const cell = this.map.tileArray[nextY][lastX];

        if (cell.type === 'path') {
          cell.$tile.addClass('following')
          path.push([lastX, nextY]);
          // lastY = nextY;
          lastCell = cell
        } else {
          // lastY = nextY - 1;
          break;
        }
      }
      y++;
    }

    console.log({path})
    $(".tile").removeClass('selected');
    if (path.length > 0 && lastCell) {
      lastCell.$tile.addClass('selected');
    }
    this.x = nextX;
    this.y = nextY;
    return path
  }

  takeStep(targetX, targetY) {

    if (this.isMoving) {
      return false;
    }

    this.isMoving = true;

    const targetCell = this.map.tileArray[targetY][targetX];

    let colision = this.detectCollision(targetCell);
    if (!colision) {
      this.isMoving = false;
      return false;
    }

    // this.x = targetCell.$tile.position().left
    // this.y = targetCell.$tile.position().top

    let self = this;
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
        targetCell.$tile.addClass('following');
      }
      cicles++;

    })
  }

  transitionV2 (x, y) {
    this.isMoving = true;
    const target = this.centerPosition(x, y);
    this.targetCell = this.map.tileArray[y][x];
    let i = 0;
    let self = this;
    // const origialPosition = {
    //   x: self.element.position().left,
    //   y: self.element.position().top
    // }
    // const totalDistance = {
    //   x: Math.abs(parseInt(origialPosition.x - target.x)),
    //   y: Math.abs(parseInt(origialPosition.y - target.y)),
    // }
    // const totalDiff = Math.max(totalDistance.x, totalDistance.y);
    this.interval = setInterval(() => {
      let currentX = self.element.position().left;
      let currentY = self.element.position().top;
    
      let nextX = currentX
      let nextY = currentY

      let step = 2;

      let diffY = Math.abs(parseInt(nextY - target.y));
      let diffX = Math.abs(parseInt(nextX - target.x));
      let moving = {
        up: false,
        down: false,
        left: false,
        right: false,
      }

      if (diffX >= 1) {
        if (target.x > currentX) {
          nextX += step; 
          moving.right = true;
        } else if (target.x < currentX) {
          moving.left = true;
          nextX -= step; 
        }
      }
      if (diffY >= 1) {
        if (target.y > currentY) {
          nextY += step;
          moving.down = true;
        } else if (target.y < currentY) {
          nextY -= step;
          moving.up = true;
        }
      }

      let nextCell = self.detectCollision(nextX, nextY, moving)

      if (!nextCell) {
        console.log('No path');
        self.stopMoving();
        return false;
      }
      
      self.element.css('left', nextX);
      self.element.css('top', nextY);

      self.x = nextCell.x;
      self.y = nextCell.y;
      // console.log(self.y, self.y, self.map.tileArray)
      self.currentCell = self.map.tileArray[self.y][self.x];

      if (diffY <= 1 && diffX <= 1 || i == 2000) {
        self.stopMoving();
        if (self.currentStep < self.currentPath.length) {
          self.transitionV2()
        }
      }

      i++;
    }, 10);

  }

  detectCollision(nextCell) {
 
    $(".tile").removeClass('next');
    nextCell.$tile.addClass('next');
    if (nextCell.type === 'path') {
      return true
    }
    console.log(nextCell.type !== 'rock')

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

    let currentX = parseInt(this.element.position().left);
    let currentY = parseInt(this.element.position().top);
    // console.log({currentX, currentY})

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
      console.log('colision ' + collition)
      return false;
    }

    return true;

  }

  findNextPosibleTile() {

  }

  stopMoving() {
    clearInterval(this.interval);
    this.interval = null
    console.log('stop')
    this.isMoving = false;
  }

  // transition (nextX, nextY) {
  //   console.log("transition", { nextX, nextY });
  //   let id = null;
  //   let self = this;
  //   this.isMoving = true;
  //   clearInterval(id);
  //   id = setInterval(frame, 4);
  //   let diffX = 0;
  //   let diffY = 0;
  //   let smallStep = 1;
  //   let step = 6;
  //   let third = parseInt(step / 3);
  //   let half = parseInt(step / 2);

  //   function frame() {
  //     diffY = Math.abs(parseInt(nextY - self.y));
  //     diffX = Math.abs(parseInt(nextX - self.x));
  //     let totalDiff = Math.max(diffX, diffY);

  //     if (diffY == 0 && diffX == 0) {
  //       clearInterval(id);
  //       self.isMoving = false;
  //     } else {
  //       if (totalDiff > third) {
  //         smallStep = 3;
  //       } else if (totalDiff > half) {
  //         smallStep = 6;
  //       } else {
  //         smallStep = 1;
  //       }

  //       if (self.y > nextY) {
  //         self.y = self.y - smallStep;
  //       } else if (self.y < nextY) {
  //         self.y = self.y + smallStep;
  //       } else if (self.x > nextX) {
  //         self.x = self.x - smallStep;
  //       } else if (self.x < nextX) {
  //         self.x = self.x + smallStep;
  //       }

  //       self.element.css('top', self.y);
  //       self.element.css('left', self.x);
  //     }
  //   }
  // }

  push(force) {}


  get position() {
    return [this.x, this.y];
  }

  get size() {
    return [this.width, this.height];
  }
}
export default Cosita
