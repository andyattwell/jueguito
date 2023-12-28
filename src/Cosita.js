import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

class Cosita extends THREE.Mesh {
  constructor(map, spawn) {
    super()

    this.type = 'cosita';
    this.width = .15;
    this.height = .15;
    this.selected = false;
    this.speed = .5;
    this.color = "#FFFFFF"
    
    this.map = map;
    this.following = false;
    this.material = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0
    })
    
    this.geometry = new THREE.BoxGeometry(this.width, this.width, this.width);

    this.x = spawn ? spawn.x : 0; // cell x
    this.y = spawn ? spawn.y : 0; // cell y
    this.z = spawn ? spawn.z : 0; // cell z

    // const position = this.currentTile(this.x, this.y, this.z);
    this.current = this.map.grid[this.x][this.y][this.z];
    this.position.set(this.current.position.x, this.current.position.y, this.current.position.z + this.current.size / 2)

    this.lastTile = null;

    this.model = null;
    const loader = new GLTFLoader();
    const self = this
    loader.load( '../models/bear/scene.gltf', function ( gltf ) {

      let obj = gltf.scene.children[0]
      obj.scale.x = obj.scale.x * .05 
      obj.scale.y = obj.scale.y * .05
      obj.scale.z = obj.scale.z * .05

      obj.rotation.x = self.rotation.x
      obj.rotation.y = self.rotation.y
      obj.rotation.z = self.rotation.z

      
      self.add(obj);
      self.setColor();
      self.map.scene.add( self );

      // scene.add( gltf.scene );

    }, undefined, function ( error ) {

      console.error( {error} );

    } );
  }

  centerPosition(x, y) {
    let centerX = x * this.map.tileSize + this.map.tileSize / 2 - this.width / 2;
    let centerY =  y * this.map.tileSize + this.map.tileSize / 2 - this.height / 2;
    return {
      x: centerX,
      y: centerY
    }
  }


  getTilePosition(x, y, z) {
    if (x < 0) {
      x = 0
    }

    if (y < 0) {
      y = 0
    }

    if (z < 0) {
      z = 0
    }

    const cellX = parseInt(x / this.map.tileSize);
    const cellY = parseInt(y / this.map.tileSize);
    const cellZ = parseInt(z / this.map.tileSize);

    return {
      x: cellX,
      y: cellY,
      z: cellZ 
    }
  }

  update(camera, controls) {

    if (!this.currentPath || this.currentPath.length < 1) {
      return false;
    }

    let targetCell = this.currentPath[0];
    
    if (!targetCell) {
      return false;
    }

    let targetPosX = targetCell.position.x;
    let targetPosY = targetCell.position.y;
    let targetPosZ = targetCell.position.z + 0.03;

    let diffX = parseFloat(Math.abs(this.position.x - targetPosX).toFixed(2));
    let diffY = parseFloat(Math.abs(this.position.y - targetPosY).toFixed(2));
    let diffZ = parseFloat(Math.abs(this.position.z - targetPosZ).toFixed(2));

    let nextX = this.position.x;
    let nextY = this.position.y;
    let nextZ = this.position.z;

    const speed = (targetCell.speed || 0.1) * this.speed

    let direction = '';

    if (diffX > speed) {
      if (targetPosX > this.position.x) {
        nextX += speed; 
        direction = 'right';
      } else if (targetPosX < this.position.x) {
        nextX -= speed;
        direction = 'left';
      }
    } else if (diffY > speed) {
      if (targetPosY > this.position.y) {
        nextY += speed;
        direction = 'back';
      } else if (targetPosY < this.position.y) {
        nextY -= speed;
        direction = 'front';
      }
    }

    if (diffZ > 0) {
      if (targetPosZ > this.position.z) {
        nextZ += speed;
      } else if (targetPosZ < this.position.z) {
        nextZ -= speed;
      }
    }

    const oldObjectPosition = new THREE.Vector3();
    this.getWorldPosition(oldObjectPosition);
    
    this.x = nextX;
    this.y = nextY;
    this.x = nextZ;

    this.position.set(nextX, nextY, nextZ)

    let zRotation = 0;
    if (direction === 'back') {
      zRotation = - Math.PI / 2
    } else if (direction === 'front'){
      zRotation = Math.PI / 2;
    } else if (direction === 'left'){
      zRotation = 0;
    } else if (direction === 'right'){
      zRotation = Math.PI;
    }

    // this.rotation.set(this.rotation.x, this.rotation.y, Math.PI / 2)
    if (direction !== '') {
      this.rotation.setFromVector3(new THREE.Vector3( 0, 0, zRotation));
    }
    
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

    if (!speed) {
      console.log({diffY, diffX, speed:targetCell})
    }
    
    if (diffY <= speed && diffX <= speed && diffZ <= speed) {
      this.currentPath.shift();
      
      this.lastTile = this.current;
      this.lastTile.planned = false;
      this.lastTile.occupied = false;
      this.lastTile.setColor();

      this.current = targetCell;
      this.current.planned = false;
      this.current.occupied = true;
      this.current.setColor();

      const next = this.currentPath[this.currentPath.length-1];
      if (next) {
        this.moveTo(next)
      }
    }
  }

  moveTo(endTile) {
    const self = this;

    if (this.current === endTile) {
      this.currentPath = [];
      return false;
    }

    if (this.currentPath && this.currentPath.length >= 1) {
      // if (endTile === this.currentPath[this.currentPath.length -1]) {
      //   return false;
      // } else {
      //   this.currentPath.map(tile => {
      //     tile.planned = false;
      //     tile.setColor();
      //     return tile;
      //   });
      // }
      this.currentPath.map(tile => {
        tile.planned = false;
        tile.setColor();
        return tile;
      });
    }

    this.currentPath = this.map.findPath(this.current, endTile)
      .filter((tile) => tile !== self.current);

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
    // this.material.forEach((c, i) => {
    //   this.material.at(i).color.set(color || this.getColor())
    // })
    const obj = this.children[0].children[0];

    obj.children.forEach((c, i) => {
      let color = '';
      if (c.name === 'Object_2') {
        color = "#FF272A"
      } else if (c.name === 'Object_3') {
        color = "#F8FF16"
      } else if (c.name === 'Object_4') {
        color = "#F8FF16"
      } else if (c.name === 'Object_5') {
        color = "#00FF0F"
      } else if (c.name === 'Object_6') {
        color = "#F7FFE9"
      } else if (c.name === 'Object_7') {
        color = "#38000A"
      } else if (c.name === 'Object_8') {
        color = "#FF9215"
      } else if (c.name === 'Object_9') {
        color = "#F8FFAB"
      } else if (c.name === 'Object_10') {
        color = "#000000"
      }

      if (this.selected) {
        color = this.blendColors(color, "#af30ff", 0.5);
      } else if (this.hover) {
        color = this.blendColors(color, "#ffffff", 0.5);
      }

      c.material = new THREE.MeshBasicMaterial({
        color: color,
      })
    })

    // this.children.forEach((obj) => {
    //   obj.children.forEach((p) => {
    //     if (p.children) {
    //       p.children.forEach((c) => {
    //         c.material = new THREE.MeshBasicMaterial({
    //           color: color || this.getColor(),
    //         })
    //       })
    //     }
    //   })
    // })
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
