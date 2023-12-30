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
    this.time = 0;
  }
  
  start() {

    this.camera = new THREE.PerspectiveCamera( 45, this.width / this.height, 0.01, 1000 );
    this.camera.position.z = 5
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

  animate(time) {
    const self = this
    this.time = time
    // if (this.playing) {
    //   this.requestId = requestAnimationFrame( () => {
    //     self.animate()
    //   } );
    // }
    requestAnimationFrame( (time) => {
      self.animate(time)
    } );
    
    this.updateCositas(time);
    this.renderScene();
    this.toolbar && this.toolbar.renderInfo();

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

    // const axesHelper = new THREE.AxesHelper( 5 );
    // this.scene.add( axesHelper );

    let grid = data?.grid ? data.grid : [];
    const options = data?.options;
    this.mapa = new Mapa(self.scene, grid, options);
    
    this.camera.position.y = -3
    this.camera.position.x = this.mapa.cols / 2 * this.mapa.tileSize
    this.camera.position.z = 8

    this.camera.lookAt(this.mapa.cols / 2 * this.mapa.tileSize, this.mapa.rows / 2 * this.mapa.tileSize, 0);

    this.toolbar = new Toolbar(this);

    // let cositas = [{
    //   x: this.mapa.cols / 2, 
    //   y: this.mapa.rows / 2, 
    //   z:0
    // },
    // {
    //   x: this.mapa.cols / 2 + 1, 
    //   y: this.mapa.rows / 2, 
    //   z:0
    // }];
    this.cositas = [];

    if (data?.cositas) {
      cositas = data.cositas;
      this.addCositas(cositas);
    }
    
    this.play();
  }

  resize() {
    this.height = window.innerHeight;
    this.width = window.innerWidth;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize( window.innerWidth, window.innerHeight );
  }

  addLight() {
    const spotLight = new THREE.SpotLight( 0xffffff );
    spotLight.position.set( this.cositas[0].x, this.cositas[0].y, 10 );
    // spotLight.map = new THREE.TextureLoader().load( url );

    spotLight.castShadow = true;

    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;

    spotLight.shadow.camera.near = 500;
    spotLight.shadow.camera.far = 4000;
    spotLight.shadow.camera.fov = 30;

    this.scene.add( spotLight );

  }

  addCositas(cositas = []) {

    for (let index = 0; index < cositas.length; index++) {
      let cosita = new Cosita(this.mapa, cositas[index], this.time);
      this.cositas.push(cosita);
    }
  }

  removeCosita(cosita) {
    cosita.clearPath();
    this.cositas = this.cositas.filter((c) => c !== cosita);
    this.scene.remove(cosita);
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

  updateCositas(time) {
    this.cositas.forEach((cosita) => {
      cosita.update(time);
    })
  }

}

export default Jueguito