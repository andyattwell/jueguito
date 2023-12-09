import Cosita from "./Cosita.js";
import Mapa from "./Mapa.js";
import Menu from "./Menu.js";
import Inspector from "./Inspector.js";
import $ from 'jquery';

class Jueguito {
  constructor(id) {
    this.id = id;
    this.mapa = null;
    this.cositas = [];
    this.menu = new Menu(id);
    this.inspector = new Inspector();
    this.object_selected = null;

    this.canvas = null;
    this.ctx = null;
    this.requestId = null;
  }

  async start() {
    const self = this

    this.menu.addEventListener('action', (data) => {
      if (data.action === 'generateMap') {
        self.generateMap();
      } else if (data.action === 'saveMap') {
        self.saveMap();
      } else if (data.action === 'openMap') {
        self.openMap();
      } else if (data.action === 'play') {
        self.play();
      } else if (data.action === 'pause') {
        self.pause();
      } else if (data.action === 'stop') {
        self.stop();
      }
    })

    $(document).on("keydown", (event) => {
      self.keyActionHandler(event.key);
    });

    this.generateMap();
    this.addCositas(3);
    this.inspector.init();
  }

  keyActionHandler(eventKey) {

    if (eventKey === 'p') {
      this.pause();
      return false;
    }

    if (this.object_selected && this.object_selected === 'cosita') {
      this.object_selected.keyAction(eventKey);
    }
  }

  openMap() {
    const self = this;
    let input = $('<input type="file">')
    input.attr('id', 'map-file')
    input.attr('name', 'map-file')
    input.css('display', 'none')
    $("#"+this.id).append(input)
    setTimeout(() => {
      input.trigger('click')
    }, 200)

    input.on('change', async (e) => {
      const file = e.target.files.item(0)
      const text = await file.text();
      const mapData = JSON.parse(text);
      if(mapData.length > 0) {
        self.generateMap(mapData)
      }
      input.remove();
    })

  }

  saveMap() {
    const mapStr = JSON.stringify(this.mapa.exportGrid());

    let file = new Blob([mapStr], {type: 'text/plain'});
    const filename = 'map.json';

    if (window.navigator.msSaveOrOpenBlob) // IE10+
      window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
      let a = document.createElement("a"),
              url = URL.createObjectURL(file);
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(function() {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);  
      }, 0); 
    }
  }

  generateMap(grid = null) {
    const self = this;
    let cols = grid ? grid.length : 20;
    let rows = grid ? grid[0].length : 20;
    this.mapa = new Mapa(this.id, cols, rows);
    $('canvas').remove();
    this.ctx = null;

    const $canvas = $('<canvas>');
    $canvas.attr('width', cols * this.mapa.tileSize);
    $canvas.attr('height', rows * this.mapa.tileSize);
    $canvas.css('background-color', '#030303');
    $("#"+this.id).append($canvas);
    this.canvas = $canvas;
    self.ctx = this.canvas[0].getContext('2d');

    this.mapa.init(grid);
    this.play();

    $(this.canvas).on('click', (e) => {
      self.clickHandler(e);
    })

    $(this.canvas).on("contextmenu", (e) => {
      e.preventDefault();
      const position = $('canvas').position();
      const mouseX = e.pageX;
      const mouseY = e.pageY - position.top;

      const cellX = parseInt(mouseX / self.mapa.tileSize);
      const cellY = parseInt(mouseY / self.mapa.tileSize);

      const tile = self.mapa.grid[cellX][cellY];
      console.log(typeof self.object_selected)
      if (
        (self.object_selected && self.object_selected.type === 'cosita') && tile
      ) {
        if (self.mapa.grid[tile.x][tile.y].type === 'path') {
          self.object_selected.moveTo(tile.x, tile.y)
        }
      }
      return false;
    });

  }

  clickHandler(e) {
    const self = this;
    const position = $('canvas').position();
    const mouseX = e.pageX;
    const mouseY = e.pageY - position.top;

    let match = null;

    self.mapa.grid.forEach(cols => {
      cols.forEach((tile) => {
        tile.selected = false;
        return tile
      })
    })

    self.cositas.forEach(cosita => {
      const left = cosita.x <= mouseX;
      const right = (cosita.x + cosita.width) >= mouseX;
      const top = mouseY >= cosita.y;
      const bottom = mouseY <= (cosita.y + cosita.height);
      cosita.selected = false
      if (left === true && right === true && top === true && bottom === true  ) {
        cosita.selected = true;
        match = cosita;
      }
    });

    if (!match) {
      const cellX = parseInt(mouseX / self.mapa.tileSize);
      const cellY = parseInt(mouseY / self.mapa.tileSize);

      const tile = self.mapa.grid[cellX][cellY];
      if (tile) {
        match = tile
        tile.selected = true;
      }
    }

    self.object_selected = match
  }

  addCositas(amount = 1) {
    this.cositas = [];

    for (let index = 0; index < amount; index++) {
      let spawn = this.mapa.pickSpawn();
      let cosita = new Cosita(index, this.mapa, spawn);
      this.cositas.push(cosita);
    }
  }

  play() {
    const self = this;
    if (!this.requestId) {
      $("#"+this.id).children('#pause-menu').remove()
      this.requestId = window.requestAnimationFrame((time) => {
        self.render(time)
      });
    }
  }

  stop() {
    if (this.requestId) {
      $("#"+this.id).append("<div id='pause-menu'><p>Pause</p></div>")
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
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.mapa.drawMap(this.ctx);

    this.updateCositas();

    if (this.object_selected) {
      this.inspector.showInfo(this.object_selected)
    } else {
      this.inspector.hide();
    }

    this.drawCositas();
    this.play();
    this.cositasColition();
  }

  updateCositas() {
    this.cositas.forEach((cosita) => {
      cosita.update();
    })
  }

  drawCositas () {
    for (let index = 0; index < this.cositas.length; index++) {
      const cosita = this.cositas[index];
      cosita.draw(this.ctx);
    }
  }

  cositasColition () {
    for (let y = 0; y < this.mapa.grid.length; y++) {
      for (let x = 0; x < this.mapa.grid[y].length; x++) {
        const tile = this.mapa.grid[y][x];
        tile.occupied = false;

        for (let c = 0; c < this.cositas.length; c++) {
          const cosita = this.cositas[c];
          if (
            cosita.x >= tile.left && 
            cosita.x <= tile.left + tile.size &&
            cosita.y >= tile.top &&
            cosita.y <= tile.top + tile.size
          ) {
            tile.occupied = true
          }
        }
        
      }
      
    }
  }

}

export default Jueguito