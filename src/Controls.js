import * as THREE from 'three';

class Controls {
  constructor(parent) {
    this.parent = parent
    this.intersects = []
    this.hovered = {}
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2() 
    this.angle = 1.55;
    this.init();
  }

  init () {
    const self = this;

    window.addEventListener("keydown", (event) => {
      self.keyActionHandler(event.key);
    });

    // Right Click
    window.addEventListener("contextmenu", (e) => {
      self.rightClickHandler(e)
    });

    document.addEventListener('wheel', (e) => {
      self.zoomHandler(e);
    });

    window.addEventListener('resize', () => {
      self.parent.height = window.innerHeight;
      self.parent.width = window.innerWidth;
      self.parent.mapa.viewArea = {
        width: window.innerWidth,
        height: window.innerHeight,
      }
      self.parent.renderer.setSize( window.innerWidth, window.innerHeight );
      // self.toolbar.y = window.innerHeight - 95;
    })

    // Click event;
    window.addEventListener('mousedown', (e) => {
      self.clickHandler(e);
    })

    window.addEventListener('dblclick', (e) => {
      self.dblclickHandler(e);
    })

    window.addEventListener('mouseup', (e) => {
      if (e.which === 2) {
        this.dragging = false;
        this.dragStart = null;
        return false;
      }
    })

    window.addEventListener("pointermove", (e) => {
      if (!this.parent.camera) {
        return false;
      }
      self.mousePosition = {
        x: e.clientX,
        y: e.clientY
      }
      this.mouse.set((e.clientX / this.parent.width) * 2 - 1, -(e.clientY / this.parent.height) * 2 + 1.1)
      this.raycaster.setFromCamera(this.mouse, this.parent.camera)
      this.intersects = this.raycaster.intersectObjects(this.parent.scene.children, true)

      Object.keys(this.hovered).forEach((key) => {
        const hit = this.intersects.find((hit) => hit.object.uuid === key)
        if (hit === undefined) {
          const hoveredItem = this.hovered[key]
          if (hoveredItem.object.onPointerOver) hoveredItem.object.onPointerOut(hoveredItem)
          delete this.hovered[key]
        }
      })

      if (this.intersects.length) {
        if (!this.hovered[this.intersects[0].object.uuid]) {
          this.hovered[this.intersects[0].object.uuid] = this.intersects[0]
          if (this.intersects[0].object.onPointerOver) this.intersects[0].object.onPointerOver(this.intersects[0])
        }
      }

      const hit = this.intersects[0];
      if (hit && !this.hovered[hit.object.uuid]) {
        this.hovered[hit.object.uuid] = hit
        if (hit.object.onPointerOver) hit.object.onPointerOver(hit)
      }
      
      if (hit && hit.object.onPointerMove) hit.object.onPointerMove(hit)

      // this.intersects.forEach((hit) => {
      //   // If a hit has not been flagged as hovered we must call onPointerOver
      //   if (!this.hovered[hit.object.uuid]) {
      //     this.hovered[hit.object.uuid] = hit
      //     if (hit.object.onPointerOver) hit.object.onPointerOver(hit)
      //   }
      //   // Call onPointerMove
      //   if (hit.object.onPointerMove) hit.object.onPointerMove(hit)
      // })

      // self.toolbar.mousePosition = self.mousePosition

      if (self.dragging) {
        
        const x = self.dragStart ? (self.mousePosition.x - self.dragStart.x) * .03 : 0;
        const y = self.dragStart ? (self.mousePosition.y - self.dragStart.y) * .03 : 0;
        
        let newX = self.camera.position.x;
        let newY = self.camera.position.y;
        
        newY += y
        newX += x

        self.camera.position.set(newX, newY, self.camera.position.z)
        self.dragStart = self.mousePosition;
      }
    });
  }

  
  keyActionHandler(eventKey) {

    if (eventKey === 'p') {
      this.parent.pause();
      return false;
    }

    if (eventKey === 'r') {
      this.parent.generateMap();
      return false;
    }

    // if (this.object_selected && this.object_selected.type === 'cosita') {
    //   this.object_selected.keyAction(eventKey);
    // }

    // if (this.mapa) {
    //   this.mapa.scroll(eventKey, this.zoom);
    // }
    // var radius = 180; 
    // console.log(eventKey, this.camera.position.x)
    
    if (this.parent.camera) {
      const oldObjectPosition = new THREE.Vector3();
      this.parent.camera.getWorldPosition(oldObjectPosition);
      
      const newObjectPosition = new THREE.Vector3();
      this.parent.camera.getWorldPosition(newObjectPosition);

      switch (eventKey) {
        case "w":
          newObjectPosition.y += 0.2;
          break;
        case "s":
          newObjectPosition.y -= 0.2;
          break;
        case "a":
          newObjectPosition.x -= 0.2;
          break;
        case "d":
          newObjectPosition.x += 0.2;
          break;
        case "e":
          // console.log(this.camera)
          // newRotation.y += 0.2
          // this.camera.rotation.y = this.camera.rotation.x * -1;
          // this.camera.rotation.x = this.camera.rotation.y * -1;
          // // this.camera.rotation.z = 0;
          break;
        case "q":
          // this.camera.lookAt(new THREE.Vector3(0, -1, 0));
          // newRotation.y -= 0.2

          // this.camera.rotation.y = -this.camera.rotation.x * -1;
          // this.camera.rotation.x = -this.camera.rotation.y * -1;
          // console.log(this.camera.rotation)
          // this.camera.rotation.y += Math.PI * 0.02;
          // this.camera.rotation.z -= 0;
          // this.camera.rotation.x += Math.PI * 0.02;
          break;
        default:
          break;
      }

      const delta = newObjectPosition.clone().sub(oldObjectPosition);
      this.parent.camera.position.add(delta);
      
      // this.camera.lookAt(hit.object.position);
      // this.controls.target.set(new THREE.Vector3(0,0,0))
      // this.controls.update();

      // const deltaRot = newRotation.clone().sub(oldRotation);
      // this.camera.rotation.set(newRotation)
    }

  }
  
  rightClickHandler(e) {
    e.preventDefault();
    if (this.parent.cosita_selected) {
      this.parent.cosita_selected.deselect()
      this.parent.cosita_selected = null;
    }
    if (this.parent.target_selected) {
      this.parent.target_selected.deselect()
      this.parent.target_selected = null;
    }
    // if (!this.requestId) {
    //   return false;
    // }

    // if (this.toolbar.selectedTool) {
    //   this.toolbar.selectedTool = false
    //   if (this.object_selected) {
    //     this.object_selected.selected = false;
    //   }
    //   this.object_selected = null
    //   return false;
    // } else if (this.object_selected && this.object_selected.type === 'cosita') {
    //   const position = $('canvas').position();
    //   let mouseX = e.pageX;
    //   if (this.mapa.offsetX < 0) {
    //     mouseX -= this.mapa.offsetX
    //   }
    //   let mouseY = e.pageY - position.top;
    //   if (this.mapa.offsetY < 0) {
    //     mouseY -= this.mapa.offsetY
    //   }
    //   const cellX = parseInt(mouseX / this.mapa.tileSize / this.zoom);
    //   const cellY = parseInt(mouseY / this.mapa.tileSize / this.zoom);
  
    //   const tile = this.mapa.grid[cellX][cellY];
    //   if (tile) {
    //     this.object_selected.moveTo(tile.x, tile.y)
    //   }
    // } else if (this.object_selected) {
    //   this.object_selected.selected = false;
    //   this.object_selected = null;
    //   this.menu.removeInfo();
    // }

    return false;
  }

  clickHandler(e) {

    if (e.which === 1) {
      const hit = this.intersects[0];
      if (hit) {

        if (this.parent.cosita_selected && hit.object.type !== 'cosita') {
          
          if (this.parent.target_selected) {
            this.parent.target_selected.deselect();
          }

          this.parent.target_selected = hit.object;
          this.parent.cosita_selected.moveTo(hit.object)
        } else {
          
          if (this.parent.cosita_selected) {
            this.parent.cosita_selected.deselect();
          }
          
          if (this.parent.target_selected) {
            this.parent.target_selected.deselect();
          }

          if (hit.object.type === 'cosita') {
            this.parent.cosita_selected = hit.object;
          } else {
            this.parent.target_selected = hit.object;
          }
        }

        if (hit.object.onClick) hit.object.onClick(hit)
  
      }
    }
  }

  zoomHandler(e) {
    if (e.target.tagName === 'CANVAS') {
      console.log('wheel', e.deltaY)
      if (e.deltaY < 0) {
        if (this.parent.camera.position.z > 0) {
          this.parent.camera.position.set(
            this.parent.camera.position.x, 
            this.parent.camera.position.y, 
            this.parent.camera.position.z - 1
          )
        }
      } else {
        if (this.parent.camera.position.z < 8) {
          this.parent.camera.position.set(
            this.parent.camera.position.x, 
            this.parent.camera.position.y, 
            this.parent.camera.position.z + 1
          )
        }
      }
    }
  }

  dblclickHandler(e) {
    console.log('ACA')
    const hit = this.intersects[0];
    if (hit) {
      if (hit.object.type === 'cosita') {
        this.parent.camera.position.x = hit.object.position.x
        this.parent.camera.position.y = hit.object.position.y - 1
        this.parent.camera.position.z = hit.object.position.z + 1
        this.parent.camera.lookAt(hit.object.position);
      }
    }
  }
}

export default Controls;