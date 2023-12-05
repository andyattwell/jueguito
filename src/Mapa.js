import $ from 'jquery';

class Mapa {
  
  constructor(containerId, width = 16, height = 10) {
    this.width = width;
    this.height = height;
    this.tileSize = 60;
    this.tileArray = [];
    this.containerId = containerId;
    this.$container = $("#"+containerId);
    this.map = null;
    this.listeners = {};
  }

  emit(method, payload = null) {
    const callback = this.listeners[method];
    if(typeof callback === 'function'){
      callback(payload);
    }
  }
  addEventListener(method,callback) {
    this.listeners[method] = callback;
  }

  removeEventListener (method) {
    delete this.listeners[method];
  }

  generateGrid() {
    let tileId = 0;
    for (let y = 0; y < this.height; y++) {
      this.tileArray[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.tileArray[y][x] = {
          type: this.getRandomTile(),
          id: tileId,
          left: x * this.tileSize,
          top: y * this.tileSize
        };
        tileId++;
      }
    }
  }

  drawMap() {
    const self = this;
    let $map = $('<div class="map">');
    $map.css('width', this.tileArray.length * this.tileSize)
    $map.css('height', this.tileArray.length * this.tileSize)

    for (let h = 0; h < this.tileArray.length; h++) {
      for (let w = 0; w < this.tileArray[h].length ; w++) {
        const tile = this.tileArray[h][w];
        let $tileDiv = $('<div>');
        $tileDiv.addClass('tile');
        $tileDiv.addClass(tile.type);
        $tileDiv.attr('data-cell', w);
        $tileDiv.attr('data-row', h);
        $tileDiv.attr('id', "tile-" + tile.id);
        $tileDiv.css('width', this.tileSize);
        $tileDiv.css('height', this.tileSize);
        // $tileDiv.css('line-height', self.tileSize + 'px');
        // $tileDiv.css('left', tile.left);
        // $tileDiv.css('top', tile.top);
        
        $tileDiv.css('left', w * this.tileSize);
        $tileDiv.css('top', h * this.tileSize);
        // $tileDiv.text(n);
        $tileDiv.on('click', (e) => {
          e.preventDefault();
          self.tileClickHandler($tileDiv, w, h);
        })
        $map.append($tileDiv);
      }
    }

    return $map;
  }

  getRandomTile() {
    const types = [
      'path', 
      'path', 
      'path', 
      'path', 
      'path', 
      'path', 
      'rock', 
      'water'
    ];
    // const types = [
    //   'path', 
    // ];
    const randomNumber = parseInt(Math.random() * types.length);
    return types[randomNumber];
  }

  tileClickHandler($tileDiv, x, y) {
    $('.tile').removeClass('selected');
    $tileDiv.addClass('selected');
    this.emit('click', {x, y})
  }
}

export default Mapa