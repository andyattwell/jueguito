import Cosita from "./Cosita.js";
import Mapa from "./Mapa.js";
import Menu from "./Menu.js";
import $ from 'jquery';

class Jueguito {
  constructor(id) {
    this.id = id;
    this.status = 0;
    this.mapa = null;
    this.cosita = null;
    this.menu = new Menu(id);
  }

  async start() {
    this.status = 1;
    const self = this
    
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
  }

  keyActionHandler(eventKey) {
    this.cosita.keyAction(eventKey);
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

    let $game = $('<div class="game-container" id="game1">');
    
    this.mapa = new Mapa(this.id, 12, 12);
    this.mapa.init(grid);
    let $map = this.mapa.drawMap();
    let spawn = this.mapa.pickSpawn();
    this.cosita = new Cosita(this.mapa, 'game1', spawn);
    let $cosita = this.cosita.createCosita();

    
    $map.append($cosita);
    $game.append($map);

    $("#"+this.id).append($game)

    const self = this;
    this.mapa.addEventListener('click', (tile) => {
      self.cosita.moveTo(tile.x, tile.y)
    })

  }

}

export default Jueguito