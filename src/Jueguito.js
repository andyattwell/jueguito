import * as THREE from 'three';
import Cosita from "./Cosita.js";
import Mapa from "./Mapa.js";
import Menu from "./Menu.js";
import Controls from "./Controls.js"
import Toolbar from "./Toolbar.js";
// import Inspector from "./Inspector.js";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Plane } from './Tile.js';

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

    this.pathOverlay = new THREE.Object3D()
    this.selectOverlay = new THREE.Object3D();
  }
  
  start() {

    this.camera = new THREE.OrthographicCamera( this.width / - 2, this.width / 2, this.height / 2, this.height / - 2, 1, 1000 )
    this.camera.position.set(2, 2, 2);
    this.camera.lookAt(0, 0, 0);
    this.camera.zoom = 5
    this.camera.far = 2000
    this.camera.near = 1

    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer( { antialias: true } );

    this.renderer.setSize( this.width, this.height );
    this.renderer.setClearColor({ color: "#000000" })
    document.querySelector('#app').appendChild( this.renderer.domElement );

    this.orbitControls = new OrbitControls( this.camera, this.renderer.domElement );
    this.orbitControls.maxZoom = 20
    this.orbitControls.minZoom = 5
    this.orbitControls.zoomToCursor = true
    this.orbitControls.zoomSpeed = 1
    

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
    this.renderScene();
    this.updateCositas(time);
    this.renderer.updateProjectionMatrix
    this.toolbar && this.toolbar.renderInfo();
    
    requestAnimationFrame( (time) => {
      self.animate(time)
    } );
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

    this.pathOverlay = new THREE.Object3D();
    this.scene.add(this.pathOverlay);
    this.selectOverlay = new THREE.Object3D();
    this.scene.add(this.selectOverlay);

    this.resize();
    this.camera.position.y = 650
    this.camera.position.x = this.width / 2 - this.width / 4
    this.camera.position.z = this.width / 2 - this.width / 4
    this.camera.lookAt(this.mapa.rows / 2, 0, this.mapa.cols / 2)
    this.orbitControls.target = new THREE.Vector3(this.mapa.rows / 2, 0, this.mapa.cols / 2)
    // this.camera.lookAt(100,500,500);
    if (this.orbitControls) {
      this.orbitControls.update();
    }
    this.toolbar = new Toolbar(this);

    this.cositas = []
    // data.cositas = [{
    //   x: 10,
    //   y: 10
    // }];

    if (data?.cositas) {
      this.addCositas(data.cositas);
    }
    
    this.play();
  }

  resize() {
    this.height = window.innerHeight;
    this.width = window.innerWidth;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.renderer.setPixelRatio(window.devicePixelRatio);
  }

  addLight() {
    const spotLight = new THREE.SpotLight( 0xffffff );
    spotLight.position.set( this.cositas[0].x, this.cositas[0].y, 10 );
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
      let cosita = new Cosita(this, this.mapa, cositas[index], this.time);
      this.cositas.push(cosita);
      this.scene.add(cosita);
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
    this.pathOverlay.clear()

    this.cositas.forEach((cosita) => {
      cosita.update(time);

      if (cosita.currentPath) {
        this.paintPath(cosita.currentPath)
      }
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

  paintPath(pathArray) {
    if (pathArray && pathArray.length >= 1) {
      pathArray.forEach((gridPoint, i) => {
        const plane = new Plane(gridPoint.x, gridPoint.y, gridPoint.z, "#FFFFF", gridPoint.tile.size, i)
        this.pathOverlay.add(plane)
      });
    }
  }

  selectTile(instanceId) {
    this.selectOverlay.clear();
    const tile = this.mapa.tiles[instanceId];
    if (!tile) {
      console.log('Tile not found', instanceId)
      return;
    }
    const gridPoint = this.mapa.grid[tile.x][tile.z][tile.y];
    const plane = new Plane(gridPoint.x, gridPoint.y, gridPoint.z, "#FFFFF", tile.size, 0)
    this.selectOverlay.add(plane);
    this.target_selected = tile;
  }

}

export default Jueguito