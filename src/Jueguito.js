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
    this.cosita_selected = null;

    this.canvas = null;
    this.ctx = null;
    this.requestId = null;
  }

  async start() {
    const self = this

    const $canvas = $('<canvas>');
    $canvas.attr('width', document.documentElement.scrollWidth);
    $canvas.attr('height', document.documentElement.scrollHeight);
    $canvas.css('background-color', '#030303');
    $("#"+this.id).append($canvas);
    this.canvas = $canvas;
    self.ctx = this.canvas[0].getContext('2d');

    this.menu.addEventListener('action', (data) => {
      if (data.action === 'generateMap') {
        self.generateMap();
      } else if (data.action === 'saveMap') {
        self.saveMap();
      } else if (data.action === 'openMap') {
        self.openMap();
      }
    })

    $(document).on("keydown", (event) => {
      self.keyActionHandler(event.key);
    });

    this.generateMap();
    this.inspector.init();
  }

  keyActionHandler(eventKey) {
    if (this.cosita_selected) {
      this.cosita_selected.keyAction(eventKey);
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
      console.log('change', e)
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
    console.log(mapStr);

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
    $(".game-container").remove();
    const self = this;

    let cols = grid ? grid.length : 24;
    let rows = grid ? grid[0].length : 10;
    this.mapa = new Mapa(this.id, cols, rows);
    this.mapa.init(grid);
    
    for (let index = 0; index < 3; index++) {
      let spawn = this.mapa.pickSpawn();
      let cosita = new Cosita(this.mapa, 'game1', spawn);
      this.cositas.push(cosita);
    }
    this.cosita_selected = this.cositas[0];
    this.cosita_selected.select();

    this.play();

    $(this.canvas).on('click', (e) => {
      const position = $('canvas').position();
      const mouseX = e.pageX;
      const mouseY = e.pageY - position.top;

      let match = null;

      self.cositas.forEach(cosita => {
        const left = cosita.x <= mouseX;
        const right = (cosita.x + cosita.width) >= mouseX;
        const top = mouseY >= cosita.y;
        const bottom = mouseY <= (cosita.y + cosita.height);

        if (left === true && right === true && top === true && bottom === true  ) {
          match = {
            type: 'cosita',
            data: cosita
          };
        }
      });

      if (!match) {
        const cellX = parseInt(mouseX / self.mapa.tileSize);
        const cellY = parseInt(mouseY / self.mapa.tileSize);

        const tile = self.mapa.grid[cellX][cellY];
        if (tile) {
          match = {
            type: 'tile',
            data: tile
          }
        }
      }


      if (match) {
        
        if (self.cosita_selected) {
          self.cosita_selected.deselect();
          self.cosita_selected = false;
        }

        if (match.type === 'cosita') {
          self.cosita_selected = match.data
          self.cosita_selected.select();
        }

        self.inspector.showInfo(match.type, match.data)
      }

    })

    $(self.canvas).on("contextmenu", (e) => {
      e.preventDefault();
      const position = $('canvas').position();
      const mouseX = e.pageX;
      const mouseY = e.pageY - position.top;

      const cellX = parseInt(mouseX / self.mapa.tileSize);
      const cellY = parseInt(mouseY / self.mapa.tileSize);

      const tile = self.mapa.grid[cellX][cellY];

      if (self.cosita_selected && tile) {
        if (self.mapa.grid[tile.x][tile.y].type === 'path') {
          self.cosita_selected.moveTo(tile.x, tile.y)
        }
      }
      return false;
    });

  }

  play() {
    const self = this;
    if (!this.requestId) {
      this.requestId = window.requestAnimationFrame((time) => {
        self.render(time)
      });
    }
  }

  stop() {
    if (this.requestId) {
       window.cancelAnimationFrame(this.requestId);
       this.requestId = undefined;
    }
  }

  render (now) {
    this.requestId = undefined;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.mapa.drawMap(this.ctx);
    this.drawCositas();
    this.play();
  }

  drawCositas () {
    for (let index = 0; index < this.cositas.length; index++) {
      const cosita = this.cositas[index];
      cosita.draw(this.ctx);
    }
  }

}

export default Jueguito