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

    let $info = $('<div>');
    $info.addClass('row');
    $info.addClass('toolbar-info');
    $info.css('background-color', "#000");
    $info.css('width', 300);
    $info.css('height', 80);
    $info.css('position', 'absolute');
    $info.css('top', this.y);
    $info.css('right', 0);
    console.log($info)

    $("#app").append($info)

  }

  renderInfo () {
    const obj = this.parent.target_selected;
    if (!obj || obj === this.inspecting) {
      return false;
    }
    this.inspecting = obj;
    console.log({obj})
    const $info = $(".toolbar-info");
    $info.html("");
    const $div1 = $('<div class="col-6">');
    $div1.append('<p class="mb-0">Type: ' + this.inspecting.type + '</p>');
    $div1.append('<p class="mb-0">X: ' + this.inspecting.x + ' Y: ' + this.inspecting.y + '</p>');
    $div1.append('<p class="mb-0">Walkable: <input disabled type="checkbox" ' + (this.inspecting.walkable ? 'checked' : '') + '></p>');

    $info.append($div1);
    
    const $div2 = $('<div class="col-6">');
    const $color = $('<span>');
    $color.css('width', 15)
    $color.css('height', 15)
    $color.css('display', 'inline-block');
    $color.css('background-color', this.inspecting.color);
    $color.css('margin-right', 10);
    const $colorText = $('<p class="mb-0">')
    $colorText.append($color);
    $colorText.append('<small>' + this.inspecting.color + '</small>');
    $div2.append($colorText);

    $div2.append('<p class="mb-0">Size: ' + this.inspecting.size + '</p>');

    $info.append($div2);
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