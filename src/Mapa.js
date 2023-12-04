import $ from 'jquery';

class Mapa {
  
  constructor(containerId, width = 16, height = 10) {
    this.width = width;
    this.height = height;
    this.tileSize = 60;
    this.tileArray = [];
    this.containerId = containerId;
    this.$container = $("#"+containerId);
    this.map = null
    this.createMap();
  }

  createMap() {
    let self = this;
    return new Promise((resolve, reject) => {
      
      self.$map = $("<div>");
      self.$map.addClass("map");
      let n = 1;
      for (let h = 0; h < self.height; h++) {
        self.tileArray[h] = [];
        for (let w = 0; w < self.width; w++) {
          const randomType = self.getRandomTile();
          
          let tile = $('<div>');
          tile.addClass('tile');
          tile.addClass(randomType);
          tile.attr('data-cell', w);
          tile.attr('data-row', h);
          tile.attr('id', "tile-" + h * w);
          tile.css('width', self.tileSize);
          tile.css('height', self.tileSize);
          tile.css('line-height', self.tileSize + 'px');
          tile.css('left', w * self.tileSize);
          tile.css('top', h * self.tileSize);
          tile.text(n);
          self.$map.append(tile);

          self.tileArray[h][w] = {
            type: randomType,
            $tile: tile,
            id: n
          };
          n++
        }
      }

      $("#"+self.containerId).append(self.$map)

      resolve();
    });
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
}

export default Mapa