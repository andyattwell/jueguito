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
      }
    ];
    this.selectedTool = null
    this.buttonSize = 80;
    
    $(() => {
      this.render();
    })
  }

  render() {

    let container = $('<div>');
    const yPos = this.y;
    container.addClass('toolbar');
    container.css('background-color', this.color);
    container.css('width', this.width);
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
    const self = this

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