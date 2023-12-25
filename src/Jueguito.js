import * as THREE from 'three';
import Cosita from "./Cosita.js";
import Mapa from "./Mapa.js";
import Menu from "./Menu.js";
import Controls from "./Controls.js"
import Toolbar from "./Toolbar.js";
// import Inspector from "./Inspector.js";

class Jueguito {
  constructor() {
    this.mapa = null;
    this.cositas = [];
    this.menu = new Menu(this);
    this.toolbar = null;
    this.controls = new Controls(this);
    // this.inspector = new Inspector();
    this.playing = false;
    this.cosita_selected = null;
    this.target_selected = null;
    this.requestId = null;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.camera = null
    this.scene = null
    this.renderer = null

  }
  
  start() {

    this.camera = new THREE.PerspectiveCamera( 45, this.width / this.height, 0.01, 1000 );
    this.camera.position.z = 10
    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer( { antialias: true } );
    this.renderer.setSize( this.width, this.height );
    this.renderer.setClearColor({ color: "#000000" })
    document.querySelector('#app').appendChild( this.renderer.domElement );

    // ambient
    // this.scene.add( new THREE.AmbientLight( '#FFFFFF' ) );
    // light
    // var light = new THREE.DirectionalLight( '#FFFFFF', 1 );
    // light.position.set( 1,1,3);
    // this.scene.add( light );

    this.menu.addEventListener('action', (data) => {
      if(typeof this[data.action] === 'function'){
        this[data.action](data.data);
      } else {
        console.log("Listener not implemented", data)
      }
      return false;
    })

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

  }

  newGame(data = null) {
    const self = this;
    if (this.mapa) {
      let r = confirm('The current map will be lost.')
      if (!r) {
        return false;
      }
    }
    
    this.scene.clear();

    const axesHelper = new THREE.AxesHelper( 5 );
    this.scene.add( axesHelper );

    let grid = data?.grid ? data.grid : [];
    this.mapa = new Mapa(self.scene, grid);
    this.mapa.render(this.scene);

    this.camera.position.y = -1
    this.camera.position.x = 3
    this.camera.position.z = 3
    this.camera.lookAt(3,0,2);

    this.toolbar = new Toolbar(this);

    let cositas = [{x:2, y:2}];
    if (data?.cositas) {
      cositas = data.cositas;
    }
    
    this.addCositas(cositas);
    this.play();
  }

  addCositas(cositas = []) {
    this.cositas = [];

    for (let index = 0; index < cositas.length; index++) {
      // let spawn = this.mapa.pickSpawn();
      let spawn = { x: cositas[index].x, y: cositas[index].y };
      let cosita = new Cosita(this.mapa, spawn);
      this.scene.add( cosita );
      this.cositas.push(cosita);
    }
  }

  renderScene() {
    if (this.renderer) this.renderer.render(this.scene, this.camera);
  };

  play() {
    if (!this.requestId) {
      this.playing = true;
    }
  }

  stop() {
    if (this.requestId) {
      cancelAnimationFrame(this.requestId);
      this.requestId = null
      this.playing = false;
      this.requestId = undefined;
      this.camera.remove();
      this.camera = null;
      this.controls.remove();
      this.controls = null;
      this.scene.remove();
      this.scene = null;
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