import * as THREE from 'three';
import Cosita from "./Cosita.js";
import Mapa from "./Mapa.js";
import Menu from "./Menu.js";
import Controls from "./Controls.js"
import Toolbar from "./Toolbar.js";
// import Inspector from "./Inspector.js";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class Jueguito {
  constructor() {
    this.settings = this.getSettingsFromStorage();
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
    this.orbitControls = null;

  }
  
  start() {

    this.camera = new THREE.PerspectiveCamera( 45, this.width / this.height, 0.01, 1000 );
    this.camera.position.z = 5
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer( { antialias: true } );


    this.renderer.setSize( this.width, this.height );
    this.renderer.setClearColor({ color: "#000000" })
    document.querySelector('#app').appendChild( this.renderer.domElement );

    this.orbitControls = new OrbitControls( this.camera, this.renderer.domElement );

    //controls.update() must be called after any manual changes to the camera's transform
    // camera.position.set( 0, 20, 100 );
    // this.orbitControls.update();

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
    // if (this.mapa) {
    //   let r = confirm('The current map will be lost.')
    //   if (!r) {
    //     return false;
    //   }
    // }

    if (data?.options) {
      this.settings = this.saveSettings(data.options);
    }
    
    this.scene.clear();

    // const axesHelper = new THREE.AxesHelper( 5 );
    // this.scene.add( axesHelper );

    this.mapa = new Mapa(self.scene, data?.grid, this.settings);

    this.camera.position.y = 2
    this.camera.position.x = this.mapa.cols / 2 * this.mapa.tileSize
    this.camera.position.z = 3

    this.camera.lookAt(0, 0, 0);

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

  saveSettings(options) {
    if (window.localStorage) {
      if (options.mapSeedStr) {
        options.mapSeed = this.getSeedFromString(options.mapSeedStr)
      }
      localStorage.setItem('mapSettings', JSON.stringify(options));
    }
    return options;
  }

  getSettingsFromStorage() {
    let settings = {}
    if (window.localStorage) {
      const temp = localStorage.getItem('mapSettings');
      if (temp && temp !== '') {
        settings = JSON.parse(temp);
        settings.mapSeed = this.getSeedFromString(settings.mapSeedStr)
      }
    }
    return settings;
  }

  getSeedFromString(seedStr) {
    let seedFloat = '0.';
    let count = 0;
    let minCount = 16;
    if (seedStr) {
      for (let c = 0; c < seedStr.length; c++) {
        const char = seedStr.charAt(c);
        seedFloat += '' + char.charCodeAt(0) * 16
        const b = seedStr.charAt(parseInt(seedStr.length - c));
        if (b) {
          seedFloat += ''+ b.charCodeAt(0) * 16
        }
        count++;
      }

      if (count < minCount) {
        for (let x = 0; x < minCount - count; x++) {
          const char = seedStr.charAt(parseInt(seedFloat * x));
          seedFloat += '' + char.charCodeAt(0) * 16
          const b = seedStr.charAt(parseInt(seedStr.length - 1 - x));
          if (b) {
            seedFloat += ''+ b.charCodeAt(0) * 16
          }
        }
      }
      return parseFloat(seedFloat);
    }
    return null;
  }

  selectTile(instanceId) {
    // let currentIndex = 0;
    let tile = null;

    for (let x = 0; x < this.mapa.grid.length; x++) {
      for (let z = 0; z < this.mapa.grid[x].length; z++) {
        for (let y = 0; y < this.mapa.grid[x][z].length; y++) {
          if (!this.mapa.grid[x][z][y]) {
            continue;
          }
          this.mapa.grid[x][z][y].selected = false;
          this.mapa.grid[x][z][y].setColor();
          if (this.mapa.grid[x][z][y].gridIndex === instanceId) {
            tile = this.mapa.grid[x][z][y]
            this.mapa.grid[x][z][y].selected = true;
            this.mapa.grid[x][z][y].setColor();
            break;
          }
        }
      }
    }

    this.target_selected = tile;
    this.mapa.updateInstancedMesh();
  }

}

export default Jueguito