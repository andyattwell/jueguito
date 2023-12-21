import Cosita from "./Cosita.js";
import Mapa from "./Mapa.js";
import Menu from "./Menu.js";
// import Inspector from "./Inspector.js";
import $ from 'jquery';

class Jueguito {
  constructor(id) {
    this.id = id;
    this.mapa = null;
    this.cositas = [];
    this.menu = new Menu(this);
    // this.inspector = new Inspector();
    this.playing = false;
    this.object_selected = null;

    this.canvas = null;
    this.ctx = null;
    this.requestId = null;
    this.zoom = 1;
  }

  async start() {
    const self = this

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

  }

  generateMap(data = null) {
    const self = this;

    if (this.mapa) {
      let r = confirm('The current map will be lost.')
      if (!r) {
        return false;
      }
    }


    $('canvas').remove();
    this.ctx = null;

    const $canvas = $('<canvas>');
    $canvas.css('background-color', '#030303');
    $("#"+this.id).append($canvas);
    this.canvas = $canvas;
    self.ctx = this.canvas[0].getContext('2d');

    let grid = data?.grid ? data.grid : [];
    this.mapa = new Mapa(self.ctx, grid);

    $canvas.attr('width', window.innerWidth);
    $canvas.attr('height',window.innerHeight);

    let cositas = [];
    if (data?.cositas) {
      cositas = data.cositas;
    } else {
      cositas.push({x:1, y:1})
    }

    self.addCositas(cositas);
    
    this.play();

    $(this.canvas).on('click', (e) => {
      self.clickHandler(e);
    })

    $(this.canvas).on("contextmenu", (e) => {
      self.rightClickHandler(e)
    });

    $(this.canvas).on("contextmenu", (e) => {
      self.rightClickHandler(e)
    });
    
    $(window).bind('mousewheel DOMMouseScroll', function(event){
      if ($(event.target).is('canvas')) {
        if (event.originalEvent.wheelDelta > 0 || event.originalEvent.detail < 0) {
          if (self.zoom < 2){
            self.zoom += 0.1;
          }
        }
        else if (self.zoom > 0.6){
          self.zoom -= 0.1;
        }
      }
    });

    $(window).on('resize', () => {
      self.mapa.viewArea = {
        width: window.innerWidth,
        height: window.innerHeight,
      }
      self.canvas.attr('width', window.innerWidth);
      self.canvas.attr('height',window.innerHeight);
    })
  }

  addCositas(cositas = []) {
    this.cositas = [];

    for (let index = 0; index < cositas.length; index++) {
      // let spawn = this.mapa.pickSpawn();
      let spawn = { x: cositas[index].x, y: cositas[index].y };
      let cosita = new Cosita(index, this.mapa, spawn);
      this.cositas.push(cosita);
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

  render (now) {
    this.requestId = undefined;
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    
    this.mapa.drawMap(this.ctx, this.zoom);

    this.updateCositas();
    // this.menu.showInfo(this.object_selected);

    this.drawCositas();
    this.play();
    // this.cositasColition();
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

  // cositasColition () {
  //   for (let y = 0; y < this.mapa.grid.length; y++) {
  //     for (let x = 0; x < this.mapa.grid[y].length; x++) {
  //       const tile = this.mapa.grid[y][x];
  //       tile.occupied = false;

  //       for (let c = 0; c < this.cositas.length; c++) {
  //         const cosita = this.cositas[c];
  //         if (
  //           cosita.x >= tile.left && 
  //           cosita.x <= tile.left + tile.size &&
  //           cosita.y >= tile.top &&
  //           cosita.y <= tile.top + tile.size
  //         ) {
  //           tile.occupied = true
  //         }
  //       }
        
  //     }
      
  //   }
  // }

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
    if (this.mapa) {
      this.mapa.scroll(eventKey);
    }
  }

  clickHandler(e) {

    if (!this.requestId) {
      return false;
    }

    const self = this;
    const position = $('canvas').position();
    let mouseX = e.pageX;
    if (this.mapa.offsetX < 0) {
      mouseX -= this.mapa.offsetX
    }
    let mouseY = e.pageY - position.top;
    if (this.mapa.offsetY < 0) {
      mouseY -= this.mapa.offsetY
    }
    let match = null;

    self.mapa.grid.forEach(cols => {
      cols.forEach((tile) => {
        tile.selected = false;
        return tile
      })
    })

    self.cositas.forEach(cosita => {
      const left = cosita.x * this.zoom <= mouseX;
      const right = (cosita.x + cosita.width) * this.zoom >= mouseX;
      const top = mouseY >= cosita.y * this.zoom;
      const bottom = mouseY <= (cosita.y + cosita.height) * this.zoom;
      cosita.selected = false
      cosita.color = "#fff";
      if (left === true && right === true && top === true && bottom === true  ) {
        cosita.selected = true;
        cosita.color = "#f5f230";
        match = cosita;
      }
    });

    if (!match) {
      const cellX = parseInt((mouseX / self.mapa.tileSize) / this.zoom);
      const cellY = parseInt((mouseY / self.mapa.tileSize) / this.zoom);

      const tile = self.mapa.grid[cellX][cellY];
      if (tile) {
        match = tile
        tile.selected = true;
      }
    }

    self.object_selected = match
    self.menu.showInfo(self.object_selected);
  }

  rightClickHandler(e) {
    e.preventDefault();
    
    if (!this.requestId) {
      return false;
    }

    if (this.object_selected && this.object_selected.type === 'cosita') {
      const position = $('canvas').position();
      let mouseX = e.pageX;
      if (this.mapa.offsetX < 0) {
        mouseX -= this.mapa.offsetX
      }
      let mouseY = e.pageY - position.top;
      if (this.mapa.offsetY < 0) {
        mouseY -= this.mapa.offsetY
      }
      const cellX = parseInt(mouseX / this.mapa.tileSize / this.zoom);
      const cellY = parseInt(mouseY / this.mapa.tileSize / this.zoom);
  
      const tile = this.mapa.grid[cellX][cellY];
      if (tile) {
        this.object_selected.moveTo(tile.x, tile.y)
      }
    } else if (this.object_selected) {
      this.object_selected.selected = false;
      this.object_selected = null;
      this.menu.removeInfo();
    }

    return false;
  }

}

export default Jueguito