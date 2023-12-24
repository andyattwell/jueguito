import * as THREE from 'three';
// import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// import $ from 'jquery';
import Cosita from "./Cosita.js";
import Mapa from "./Mapa.js";
import Menu from "./Menu.js";
import Controls from "./Controls.js"
// import Toolbar from "./Toolbar.js";
// import Inspector from "./Inspector.js";

class Jueguito {
  constructor(id) {
    this.id = id;
    this.mapa = null;
    this.cositas = [];
    this.menu = new Menu(this);
    this.toolbar = null;
    this.controls = new Controls(this);
    // this.inspector = new Inspector();
    this.playing = false;
    this.cosita_selected = null;
    this.target_selected = null;

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
    // this.controls = null

  }
  
  init() {
    const self = this
    // Keyboard
  }

  start() {

    this.camera = new THREE.PerspectiveCamera( 70, this.width / this.height, 0.01, 1000 );
    this.camera.position.z = 10
    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer( { antialias: true } );
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.renderer.setClearColor({ color: "#FFFFFF" })
    document.body.appendChild( this.renderer.domElement );

    // this.controls = new OrbitControls( this.camera, this.renderer.domElement );
    // this.controls.minPolarAngle = Math.PI * 0.7;
		// this.controls.maxPolarAngle =  Math.PI * 2;
		// this.controls.minAzimuthAngle =  0;
		// this.controls.maxAzimuthAngle =  0;
    // this.controls.addEventListener( 'change', (e) => {
    //   console.log(e.target)
    // } );

    // this.controls.enableDamping = true;   //damping 
    // this.controls.dampingFactor = 0.25;   //damping inertia
    // this.controls.enableZoom = true;      //Zooming
    // this.controls.autoRotate = true;       // enable rotation
    // this.controls.autoRotate = true;

    // this.controls.target.set(1, 0, 0)
    // this.controls.update();
    
    
    // ambient
    // this.scene.add( new THREE.AmbientLight( 0x222222 ) );
    // // light
    // var light = new THREE.DirectionalLight( 0xffffff, 1 );
    // light.position.set( 20,20, 1 );
    // this.scene.add( light );

    // this.menu.addEventListener('action', (data) => {
    //   if(typeof this[data.action] === 'function'){
    //     this[data.action](data.data);
    //   } else {
    //     console.log("Listener not implemented", data)
    //   }
    //   return false;
    // })

    this.animate();

  }

  animate() {
    const self = this
    // if (this.playing) {
    //   this.requestId = requestAnimationFrame( () => {
    //     self.animate()
    //   } );
    // }
    requestAnimationFrame( () => {
      self.animate()
    } );
    
    this.updateCositas();
    this.renderScene();

    // this.toolbar.render(this.ctx);
  
  }

  generateMap(data = null) {
    const self = this;
    this.stop();
    this.start();

    if (this.mapa) {
      let r = confirm('The current map will be lost.')
      if (!r) {
        return false;
      }
    }

    let grid = data?.grid ? data.grid : [];
    this.mapa = new Mapa(self.scene, grid);
    this.mapa.render(this.scene, this.zoom);
    // this.toolbar = new Toolbar(this, 0, window.innerHeight - 95);
    
    this.camera.position.y = -1
    this.camera.position.x = 3
    this.camera.position.z = 3
    this.camera.lookAt(3,0,2);

    let cositas = [];
    if (data?.cositas) {
      cositas = data.cositas;
    } else {
      cositas.push({x:1, y:1})
    }

    this.addCositas(cositas);
    this.play();
  }

  addCositas(cositas = []) {
    this.cositas = [];

    for (let index = 0; index < cositas.length; index++) {
      // let spawn = this.mapa.pickSpawn();
      let spawn = { x: cositas[index].x, y: cositas[index].y };
      let cosita = new Cosita(index, this.mapa, spawn);
      this.scene.add( cosita );
      this.cositas.push(cosita);
    }
  }

  renderScene = () => {
    if (this.renderer) this.renderer.render(this.scene, this.camera);
  };

  play() {
    if (!this.requestId) {
      this.playing = true;
      // const self = this;
      // console.log('ACA')
      // this.requestId = requestAnimationFrame(() => {
      //   console.log('ACA123')
      //   self.animate()
      // })
    }
  }

  stop() {
    if (this.requestId) {
      cancelAnimationFrame(this.requestId);
      this.requestId = null
      // this.playing = false;
      // this.requestId = undefined;
      // this.camera.remove();
      // this.camera = null;
      // this.controls.remove();
      // this.controls = null;
      // this.scene.remove();
      // this.scene = null;
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
      cosita.update(this.camera);
    })
  }

}

export default Jueguito