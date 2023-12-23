import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import $ from 'jquery';
import Cosita from "./Cosita.js";
import Mapa from "./Mapa.js";
import Menu from "./Menu.js";
import Toolbar from "./Toolbar.js";
// import Inspector from "./Inspector.js";

class Jueguito {
  constructor(id) {
    this.id = id;
    this.mapa = null;
    this.cositas = [];
    this.menu = new Menu(this);
    this.toolbar = null;
    // this.inspector = new Inspector();
    this.playing = false;
    this.object_selected = null;

    this.canvas = null;
    this.ctx = null;
    this.requestId = null;
    this.zoom = 1;
    this.dragging = false;
    this.dragStart = null;
    this.mousePosition = {x:0, y:0};
    this.altPressed = false;

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.camera = null
    this.scene = null
    this.renderer = null
    this.controls = null

    this.intersects = []
    this.hovered = {}
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2() 
    this.angle = 1.55;
  }

  async start() {
    const self = this

    this.camera = new THREE.PerspectiveCamera( 45, this.width / this.height, 0.01, 1000 );
    this.camera.position.z = 10
    // this.camera = new THREE.OrthographicCamera( this.width / - 2, this.width / 2, this.height / 2, this.height / - 2, 1, 500 );
    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer( { antialias: true } );
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.renderer.setClearColor({ color: "#FFFFFF" })

    this.controls = new OrbitControls( this.camera, this.renderer.domElement );
    // this.camera.position.z = 0;
    // this.camera.position.y = 0;
    // this.camera.position.x = 0;
    // this.camera.rotateX(0);
    // this.camera.rotateY(45);
    this.camera.zoom = 1;
    this.camera.position.x = 9;
    this.camera.position.y = -9;
    this.camera.position.z = 9;
    // this.camera.rotation.x = 1.1150399418827637;
    // this.camera.rotation.y = 0.003664588616978133;
    // this.camera.rotation.z = -0.007475933354720052;
    // this.camera.lookAt(3, 3, 0)
    this.controls.target.set(9, 0, 0)
    this.controls.update();
    
    document.body.appendChild( this.renderer.domElement );
    
    // ambient
    this.scene.add( new THREE.AmbientLight( 0x222222 ) );
    // light
    var light = new THREE.DirectionalLight( 0xffffff, 1 );
    light.position.set( 20,20, 1 );
    this.scene.add( light );

    // this.controls.addEventListener('change', (e) => {
    //   console.log(e.target.object.rotation)
    // })
    // this.renderer.setAnimationLoop( this.animation );
    
    // const geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );
    // const material = new THREE.MeshNormalMaterial();
    
    // const mesh = new THREE.Mesh( geometry, material );    
    // mesh.position.set(0,0,-7.0)
    // this.scene.add( mesh );

    this.menu.addEventListener('action', (data) => {
      if(typeof this[data.action] === 'function'){
        this[data.action](data.data);
      } else {
        console.log("Listener not implemented", data)
      }
      return false;
    })

    $(document).on("keydown", (event) => {
      self.keyActionHandler(event.key);
    });

    this.animate();

  }

  animate() {
    const self = this
    requestAnimationFrame( () => {
      self.animate()
    } );

    // cube.rotation.x += 0.01;
    // cube.rotation.y += 0.01;
    this.updateCositas();
    // self.controls.update();
    // this.drawCositas();
    // this.toolbar.render(this.ctx);

    // this.cositas.forEach(cosita => {
    //   cosita.update();
    // });
  
    self.renderer.render( self.scene, self.camera );
  }

  generateMap(data = null) {
    const self = this;

    if (this.mapa) {
      let r = confirm('The current map will be lost.')
      if (!r) {
        return false;
      }
    }

    // $('canvas').remove();
    // this.ctx = null;

    // const $canvas = $('<canvas>');
    // $canvas.css('background-color', '#030303');
    // $("#"+this.id).append($canvas);
    // this.canvas = $canvas;
    // self.ctx = this.canvas[0].getContext('2d');

    let grid = data?.grid ? data.grid : [];
    this.mapa = new Mapa(self.scene, grid);
    this.mapa.render(this.scene, this.zoom);
    // this.toolbar = new Toolbar(this, 0, window.innerHeight - 95);

    let cositas = [];
    if (data?.cositas) {
      cositas = data.cositas;
    } else {
      cositas.push({x:1, y:1})
    }

    self.addCositas(cositas);
    self.addListeners();
    // this.play();
    // this.animate();
  }

  addListeners() {
    const self = this;

    window.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      self.rightClickHandler(e)
      return false;
    });
    
    window.addEventListener('mousewheel DOMMouseScroll', function(event){
      const position = $('canvas').position();
      let mouseX = event.pageX;
      let mouseY = event.pageY - position.top;
      
      if ($(event.target).is('canvas')) {
        const cellX = parseInt((mouseX / self.mapa.tileSize) / self.zoom);
        const cellY = parseInt((mouseY / self.mapa.tileSize) / self.zoom);

        if (event.originalEvent.wheelDelta > 0 || event.originalEvent.detail < 0) {
          if (self.camera.position.z > 0) {
            self.camera.position.set(self.camera.position.x, self.camera.position.y, self.camera.position.z - 1)
          }
        } else {
          if (self.camera.position.z < 8) {
            self.camera.position.set(self.camera.position.x, self.camera.position.y, self.camera.position.z + 1)
          }
        }
        
      }
    });

    window.addEventListener('resize', () => {
      self.mapa.viewArea = {
        width: window.innerWidth,
        height: window.innerHeight,
      }
      this.renderer.setSize( window.innerWidth, window.innerHeight );
      // self.toolbar.y = window.innerHeight - 95;
    })

    window.addEventListener('mousedown', (e) => {
      self.clickHandler(e);
    })

    // window.addEventListener('mouseup', (e) => {
    //   if (e.which === 2) {
    //     this.dragging = false;
    //     this.dragStart = null;
    //     return false;
    //   }
    // })

    window.addEventListener("pointermove", (e) => {
      const position = $('canvas').position();
      self.mousePosition = {
        x: e.clientX,
        y: e.clientY - position.top
      }

      this.mouse.set((e.clientX / this.width) * 2 - 1, -(e.clientY / this.height) * 2 + 1.2)
      this.raycaster.setFromCamera(this.mouse, this.camera)
      this.intersects = this.raycaster.intersectObjects(this.scene.children, true)

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
    
      this.intersects.forEach((hit) => {
        // If a hit has not been flagged as hovered we must call onPointerOver
        if (!this.hovered[hit.object.uuid]) {
          this.hovered[hit.object.uuid] = hit
          if (hit.object.onPointerOver) hit.object.onPointerOver(hit)
        }
        // Call onPointerMove
        if (hit.object.onPointerMove) hit.object.onPointerMove(hit)
      })

      // self.toolbar.mousePosition = self.mousePosition

      // if (self.dragging) {
        
      //   const x = self.dragStart ? (self.mousePosition.x - self.dragStart.x) * .03 : 0;
      //   const y = self.dragStart ? (self.mousePosition.y - self.dragStart.y) * .03 : 0;
        
      //   let newX = self.camera.position.x;
      //   let newY = self.camera.position.y;
        
      //   newY += y
      //   newX += x

      //   self.camera.position.set(newX, newY, self.camera.position.z)
      //   self.dragStart = self.mousePosition;
      // }
    });
  }

  addCositas(cositas = []) {
    this.cositas = [];

    for (let index = 0; index < cositas.length; index++) {
      // let spawn = this.mapa.pickSpawn();
      let spawn = { x: cositas[index].x, y: cositas[index].y };
      let cosita = new Cosita(index, this.mapa, spawn);
      this.scene.add( cosita );
      this.cositas.push(cosita);
      // cosita.createCube(this.scene);
    }
  }

  play() {
    const self = this;
    if (!this.requestId && this.ctx) {
      $("#"+this.id).children('#pause-menu').remove()
      this.playing = true;
      this.requestId = window.requestAnimationFrame((time) => {
        self.render(time)
      });
    }
  }

  stop() {
    if (this.requestId) {
      $("#"+this.id).append("<div id='pause-menu'><p>Pause</p></div>")
      this.playing = false;
      window.cancelAnimationFrame(this.requestId);
      this.requestId = undefined;
    }
  }

  pause () {
    if (!this.requestId) {
      this.play()
    } else {
      this.stop()
    }
  }

  updateCositas() {
    this.cositas.forEach((cosita) => {
      cosita.update();
    })
  }

  drawCositas () {
    for (let index = 0; index < this.cositas.length; index++) {
      const cosita = this.cositas[index];
      cosita.draw(this.ctx, this.zoom);
    }
  }

  keyActionHandler(eventKey) {

    if (eventKey === 'p') {
      this.pause();
      return false;
    }

    if (eventKey === 'r') {
      this.generateMap();
      return false;
    }

    // if (this.object_selected && this.object_selected.type === 'cosita') {
    //   this.object_selected.keyAction(eventKey);
    // }

    // if (this.mapa) {
    //   this.mapa.scroll(eventKey, this.zoom);
    // }
    var radius = 180; 
    // console.log(eventKey, this.camera.position.x)
    switch (eventKey) {
      case "w":
        this.camera.position.y = this.camera.position.y+1;
        break;
      case "s":
        this.camera.position.y = this.camera.position.y-1;
        break;
      case "a":
        this.camera.position.x = this.camera.position.x-1;
        break;
      case "d":
        this.camera.position.x = this.camera.position.x+1;
        break;
      case "e":
        // rotate clockwise
        // this.angle += 0.01;
        // this.camera.position.x = radius * Math.cos( this.angle );  
        // this.camera.position.z = radius * Math.sin( this.angle );
        // console.log(this.controls)
        this.camera.rotation.y -= Math.PI * 0.25;
        this.controls.update();
        break;
      case "q":
        // rotate counter clockwise
        // this.angle -= 0.01;
        // this.camera.position.x = radius * Math.cos( this.angle );  
        // this.camera.position.z = radius * Math.sin( this.angle );
        this.camera.rotation.y += Math.PI * 0.25;
        this.controls.update();
        break;
      default:
        break;
    }
    this.controls.update();

  }

  clickHandler(e) {

    if (e.which === 1) {
      console.log('ACA')
      const hit = this.intersects[0];
      if (hit) {
        
        if (hit.object.type === 'cosita') {
          this.object_selected = hit.object;
          hit.object.onClick(hit)
    
          this.camera.position.x = hit.object.position.x
          this.camera.position.y = hit.object.position.y - 3
          this.camera.position.z = hit.object.position.z + 2
          this.camera.lookAt(hit.object.position);
          // this.camera.rotation.y = 0
          // this.camera.rotation.x = 0
          // this.camera.zoom = 300
          this.controls.target.set(hit.object.position.x, hit.object.position.y, hit.object.position.z)
          this.controls.update();
        }


        if (this.object_selected && this.object_selected.type === 'cosita' && hit.object.type !== 'cosita') {
          this.object_selected.moveTo(hit.object.position.x, hit.object.position.y)
        }
        // if (hit.object.onClick) hit.object.onClick(hit)
  
      }
    }
    
  }

  rightClickHandler(e) {
    e.preventDefault();
    if (this.object_selected && this.object_selected.type === 'cosita') {
      this.object_selected.onClick()
      this.object_selected = null;
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

}

export default Jueguito