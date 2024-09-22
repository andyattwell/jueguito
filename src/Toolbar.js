class Toolbar {

  constructor(parent, x = 0, y = 0) {
    this.parent = parent;
    this.x = x
    this.y = y
    this.width = 400
    this.height = 40
    this.buttonSize = 40
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
    this.mousePosition = {x: 0, y: 0}
  }

  render(ctx) {
    ctx.beginPath();
    ctx.rect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = "#4e4e4e";
    ctx.fill();
    ctx.closePath();

    for (let i = 0; i < this.buttons.length; i++) {
      ctx.beginPath();
      ctx.rect(this.buttonSize * i, this.y, this.buttonSize, this.buttonSize);
      ctx.fillStyle = this.buttons[i].color;
      ctx.fill();
      if (this.buttons[i].name === this.selectedTool?.name) {
        ctx.strokeStyle = '#ffb800';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.closePath();


      ctx.fillStyle = '#fff';
      ctx.font="10px Arial";
      ctx.strokeStyle = "#fff";
      const textx = this.buttonSize * i;
      const texty = this.y + 10;
      ctx.fillText(this.buttons[i].name, textx, texty);
    }

    if (this.selectedTool) {
      ctx.beginPath();
      ctx.strokeStyle = '#000000';
      ctx.rect(this.mousePosition.x, this.mousePosition.y, 30, 30);
      ctx.fillStyle = this.selectedTool.color;
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
      ctx.closePath();
    }
  }

  handleClick (mouseX, mouseY) {
    let match = false;
    for (let i = 0; i < this.buttons.length; i++) {
      const btn = this.buttons[i];
      const btnX = this.buttonSize * i;
      const btnY = this.y;

      if (
        (mouseX >= btnX && mouseX <= btnX + this.buttonSize) &&
        (mouseY >= btnY && mouseY <= btnY + this.buttonSize)
      ) {
        match = btn
      }
    }
    
    if (match) {
      console.log('Match', match)
      this.selectedTool = match
    }
  }

  useTool(tile) {
    this.parent.mapa.replaceTile(tile, this.selectedTool.name)
  }
}

export default Toolbar