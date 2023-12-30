import $ from 'jquery';

class Toolbar {

  constructor(parent) {
    this.parent = parent;
    
    this.width = 400;
    this.height = 80;

    this.color = "#0d0b0b";

    this.x = 0;
    this.y = this.parent.height - this.height;

    this.buttons = [
      {
        name: 'path',
        color: '#aa9f2b'
      },
      {
        name: 'grass',
        color: '#51d343'
      },
      {
        name: 'rock',
        color: '#685e70'
      },
      {
        name: 'water',
        color: '#2093d5'
      },
      {
        name: 'prize',
        color: '#ce1fd7'
      },
      {
        name: 'cosita',
        color: '#fff'
      }
    ];
    this.selectedTool = null
    this.buttonSize = 80;

    this.inspecting = null
    
    $(() => {
      this.render();
    })
  }

  render() {
    let self = this;
    let container = $('<div>');
    const yPos = this.y;
    container.addClass('toolbar');
    container.css('background-color', this.color);
    container.css('width', this.buttons.length * 80);
    container.css('height', this.height);
    container.css('top', this.y);
    container.css('left', this.x);

    for (let i = 0; i < this.buttons.length; i++) {
      let btn = $('<div>');
      btn.addClass('toolbar-btn');
      btn.css('background-color', this.buttons[i].color);
      btn.css('width', this.buttonSize);
      btn.css('height', this.buttonSize);
      btn.css('top', this.y);
      btn.css('left', this.x + i * this.buttonSize);
      btn.text(this.buttons[i].name)
      
      btn.on("click", (e) => {
        e.preventDefault();
        self.handleToolClick(btn, this.buttons[i]);
        return false;
      })

      container.append(btn)
    }

    $("#app").append(container);
  }

  renderInfo () {
    const obj = this.parent.target_selected;
    if (!obj || obj === this.inspecting) {
      return false;
    }
    this.inspecting = obj;
    console.log({obj})
    
    let $info = $(".toolbar-info");
    if ($info.length === 0) {

      $info = $('<div>');
      $info.addClass('row');
      $info.addClass('toolbar-info');
      $info.css('background-color', "#000");
      $info.css('width', 300);
      $info.css('height', 160);
      $info.css('position', 'absolute');
      $info.css('bottom', 0);
      $info.css('right', 0);
      $("#app").append($info);

      const $colorBox = $('<span id="tileColor">');
      $colorBox.css('width', 15)
      $colorBox.css('height', 15)
      $colorBox.css('display', 'inline-block');
      $colorBox.css('background-color', this.inspecting.color);
      $colorBox.css('margin-right', 10);

      $info.append(
        $('<div class="col-6">').append(
          $('<p class="mb-0" id="tileType">Type: ' + this.inspecting.type + '</p>'),
          $('<p class="mb-0">X: <span id="tileX">' + this.inspecting.x + '</span> - Y: <span id="tileY">' + this.inspecting.y + '</span></p>'),
          $('<p class="mb-0">Neighbors: <span id="tileNeighbors"></span></p>'),
          $('<p class="mb-0">Walkable: <input id="tileWalkable" disabled type="checkbox" ' + (this.inspecting.walkable ? 'checked' : '') + '></p>'),
          $('<p class="mb-0">Occupied: <input id="tileOccupied" disabled type="checkbox" ' + (this.inspecting.occupied ? 'checked' : '') + '></p>')
        ),
        $('<div class="col-6">').append(
          $('<p class="mb-0">').append(
            $colorBox,
            $('<small>' + this.inspecting.color + '</small>')
          ),
          $('<p class="mb-0">Size: ' + this.inspecting.size + '</p>'),
        )
      );
    }

    $("#tileColor").css('background-color', this.inspecting.color);
    $("#tileColor").next('small').text(this.inspecting.color);
    $("#tileType").text(this.inspecting.type);
    $("#tileX").text(this.inspecting.x);
    $("#tileY").text(this.inspecting.y);
    $("#tileWalkable").attr('checked', this.inspecting.walkable);
    // this.inspecting.walkable ? 'checked' : ''
    $("#tileOccupied").attr('checked',this.inspecting.occupied);
    $("#tileNeighbors").text(this.inspecting.neighbors ? this.inspecting.neighbors.length : 0);
    // const $info = $(".toolbar-info");
    // $info.html("");

  }

  deselect() {
    this.selectedTool = null;
    $('.toolbar-btn').removeClass('active');
  }

  handleToolClick(btn, tool) {
    this.selectedTool = tool
    $('.toolbar-btn').removeClass('active');
    btn.addClass('active');
  }

  useTool(tile) {
    this.parent.mapa.replaceTile(tile, this.selectedTool.name)
  }
}

export default Toolbar