import * as THREE from 'three';

class Controls {
  constructor(parent) {
    this.parent = parent
    this.intersects = []
    this.hovered = {}
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2() 
    this.angle = 1.55;
    
    this.dragging = false;
    this.dragStart = null;
    this.altPressed = false;

    this.init();
  }

  init () {
    const self = this;

    window.addEventListener("keydown", (event) => {
      self.keyActionHandler(event.key);
    });

    // Right Click
    window.addEventListener("contextmenu", (e) => {
      if (e.target.tagName === 'CANVAS') {
        self.rightClickHandler(e)
      }
    });

    document.addEventListener('wheel', (e) => {
      self.zoomHandler(e);
    });

    window.addEventListener('resize', () => {
      self.parent.height = window.innerHeight;
      self.parent.width = window.innerWidth;
      self.parent.renderer.setSize( window.innerWidth, window.innerHeight );
      // self.toolbar.y = window.innerHeight - 95;
    })

    window.addEventListener('dblclick', (e) => {
      self.dblclickHandler(e);
    })

    // Click event;
    window.addEventListener('mousedown', (e) => {
      self.clickHandler(e);
    })

    window.addEventListener('mouseup', (e) => {
      if (e.which === 2) {
        this.dragging = false;
        this.dragStart = null;
        return false;
      }
    })

    window.addEventListener("pointermove", (e) => {
      self.mouseMoveHandler(e)
    });
  }

  mouseMoveHandler(e) {
    if (!this.parent.camera) {
      return false;
    }

    this.mouse.set((e.clientX / this.parent.width) * 2 - 1, -(e.clientY / this.parent.height) * 2 + 1.15)
    this.raycaster.setFromCamera(this.mouse, this.parent.camera)
    this.intersects = this.raycaster.intersectObjects(this.parent.scene.children, true)

    Object.keys(this.hovered).forEach((key) => {
      const hit = this.intersects.find((hit) => hit.object.uuid === key)
      if (hit === undefined) {
        const hoveredItem = this.hovered[key]
        if (hoveredItem.object.onPointerOver) hoveredItem.object.onPointerOut(hoveredItem)
        this.parent.mapa.removePreview();
        delete this.hovered[key]
      }
    })

    if (this.intersects.length) {
      const hit = this.intersects[0]
      if (!this.hovered[hit.object.uuid]) {
        this.hovered[hit.object.uuid] = hit
        if (hit.object.onPointerOver && hit.object.type !== 'preview') hit.object.onPointerOver(hit)
        // Add tile preview
        if (this.parent.toolbar.selectedTool && !this.parent.mapa.previewTile && hit.object.type !== 'preview') {
          this.parent.mapa.addPreview(hit);
        }
      }

      // const self = this;
      // this.intersects.forEach((hit) => {
      //   if (hit.object.type === 'preview') {
      //     self.parent.mapa.removeTile(hit.object)
      //   }
      // })
    }

    // const hit = this.intersects[0];
    // if (hit && !this.hovered[hit.object.uuid]) {
    //   this.hovered[hit.object.uuid] = hit
    //   if (hit.object.onPointerOver) hit.object.onPointerOver(hit)
    //   console.log('onPointerOver')
    // }
    
    // if (hit && hit.object.onPointerMove) hit.object.onPointerMove(hit)
    // if (hit && hit.object) this.parent.mapa.removePreview(hit.object);

    if (this.dragging) {
      const x = this.dragStart ? (this.mouse.x - this.dragStart.x) * 3 : 0;
      const y = this.dragStart ? (this.mouse.y - this.dragStart.y) * 2 : 0;
      
      const oldObjectPosition = new THREE.Vector3();
      this.parent.camera.getWorldPosition(oldObjectPosition);

      const newObjectPosition = new THREE.Vector3();
      this.parent.camera.getWorldPosition(newObjectPosition);
      newObjectPosition.x -= x
      newObjectPosition.y -= y

      const delta = newObjectPosition.clone().sub(oldObjectPosition);
      this.parent.camera.position.add(delta);

      // ->>>>>>>>>>>>>>
      
      // vertical
      // let rotX = this.parent.camera.rotation.x
      // rotX += Math.PI * y
      // if (rotX + Math.PI * y < 1 && rotX + Math.PI * y > 0.5) {
      // }
      // // horizontal
      // let rotY = this.parent.camera.rotation.y;
      // rotY -= Math.PI * x
      // if (rotY - Math.PI * x < 0.3 && rotY - Math.PI * x > -0.3) {
      // }
      // let rotZ = this.parent.camera.rotation.z
      // rotZ -= Math.PI * x
      // if (rotZ - Math.PI * x < 0.3 && rotZ - Math.PI * x > -0.3) {
      // }
      // console.log({rotX, rotY, rotZ})

      // this.parent.camera.rotation.setFromVector3(new THREE.Vector3( rotX, rotY, rotZ));
      // this.parent.camera.lookAt(this.parent.camera.position.x, this.parent.camera.position.y + 10, this.parent.camera.position.z - 3)

      this.dragStart = {
        x: this.mouse.x,
        y: this.mouse.y
      };
    }
  }

  keyActionHandler(eventKey) {

    if (eventKey === 'p') {
      this.parent.pause();
      return false;
    }

    if (eventKey === 'r') {
      this.parent.newGame();
      return false;
    }
    
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
      this.parent.cosita_selected.following = false;
      this.parent.cosita_selected = null;
    }

    if (this.parent.target_selected) {
      if (this.parent.target_selected.deselect) {
        this.parent.target_selected.deselect()
      }
      this.parent.target_selected = null;
    }

    this.parent.toolbar?.deselect();
    const hit = this.intersects[0]
    if (hit && hit.object.type !== 'cosita' && hit.object.type !== 'Mesh') {
      this.parent.mapa.removeTile(hit.object)
    }

    return false;
  }

  clickHandler(e) {

    if (e.which === 1 && e.target.tagName === 'CANVAS') {
      const hit = this.intersects[0];
      if (hit) {
        if (
          this.parent.toolbar.selectedTool 
          && hit.object.type !== 'cosita' 
          && hit.object.type !== 'Mesh'
        ) {
          // this.parent.mapa.replaceTile(hit.object, this.parent.toolbar.selectedTool.name)
          this.parent.mapa.addTile(hit, this.parent.toolbar.selectedTool.name)
          return false;
        }


        if (this.parent.cosita_selected && hit.object.type !== 'cosita' && hit.object.type !== 'Mesh') {
          
          if (this.parent.target_selected) {
            if (this.parent.target_selected.deselect) {
              this.parent.target_selected.deselect();
            }
          }

          this.parent.target_selected = hit.object;
          this.parent.cosita_selected.moveTo(hit.object)
        } else {
          
          if (this.parent.cosita_selected) {
            this.parent.cosita_selected.deselect();
          }
          
          if (this.parent.target_selected && this.parent.target_selected.deselect) {
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
    } else if (e.which === 2) {
      this.dragging = true;
    }
  }

  zoomHandler(e) {
    if (e.target.tagName === 'CANVAS') {
      if (e.deltaY < 0) {
        if (this.parent.camera.position.z > 1) {
          this.parent.camera.position.z -= 1
          this.parent.camera.position.y += 1
        }
      } else {
        if (this.parent.camera.position.z < 8) {
          this.parent.camera.position.z += 1
          this.parent.camera.position.y -= 1
        }
      }
    }
  }

  dblclickHandler(e) {
    const hit = this.intersects[0];
    if (hit) {
      if (hit.object.type === 'cosita') {
        hit.object.following = true;
        this.parent.camera.position.x = hit.object.position.x
        this.parent.camera.position.y = hit.object.position.y - 2
        this.parent.camera.position.z = hit.object.position.z + 2
        this.parent.camera.lookAt(hit.object.position);
      }
    }
  }
}

export default Controls;