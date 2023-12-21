import $ from 'jquery';
import { Dropdown } from 'bootstrap';

class Menu {
  constructor(parent) {
    this.parent = parent
    this.parentId = parent.id;
    this.listeners = {};
    this.items = [
      {
        label: 'Juego',
        children: [
          {
            label: 'Play',
            id: 'play'
          },
          {
            label: 'Pause',
            id: 'pause'
          },
          {
            label: 'Stop',
            id: 'stop'
          }
        ]
      },
      {
        label: 'Mapa',
        children: [
          {
            label: 'Generar',
            id: 'generateMap'
          },
          {
            label: 'Guardar',
            id: 'saveMap',
            callback: () => {
              this.saveMap();
            }
          },
          {
            label: 'Abrir',
            id: 'openMap',
            callback: () => {
              this.openMap();
            }
          },
          {
            label: 'Editar celdas',
            id: 'editMap'
          }
        ],
      },
      {
        label: 'Cosita',
        children: [
          {
            label: 'Editar cosita',
            id: 'editCosita'
          }
        ]
      }
    ];
    this.drawMenu();
  }

  emit(method, payload = null) {
    const callback = this.listeners[method];
    if (typeof callback === 'function') {
      callback(payload);
    }
  }

  addEventListener(method, callback) {
    this.listeners[method] = callback;
  }

  removeEventListener(method) {
    delete this.listeners[method];
  }

  drawMenu() {
    const self = this
    const $parent = $("#" + this.parentId);
    $parent.remove("#app-menu");

    let $menu = $('<div class="navbar navbar-expand-sm navbar-dark bg-dark" id="app-menu">');
    let $container = $('<div class="container-fluid">')
    let $ul = $('<ul class="navbar-nav me-auto mb-2 mb-lg-0">');

    this.items.forEach((item) => {
      let $li = $('<li class="nav-item">');
      let $a = $('<a class="nav-link" href="#">')
      $a.attr('id', item.id)
      $a.text(item.label);
      if (item.class) {
        $li.addClass(item.class);
      }

      if (item.children) {
        $a.addClass('dropdown-toggle');
        $a.attr('id', 'navbarDropdown-' + item.id)
        $a.attr('role', 'button')
        $a.attr('data-bs-toggle', 'dropdown')
        $a.attr('aria-expanded', 'false')
        $li.addClass('dropdown');
        let $ciUl = $('<ul class="dropdown-menu dropdown-menu-dark" aria-labelledby="navbarDropdown-' + item.id + '">');
        item.children.forEach((ci) => {
          let $ciLi = $("<li>");
          let $ciA = $('<a class="dropdown-item" href="#">')
          $ciA.on('click', (e) => {
            e.preventDefault();
            if (ci.callback) {
              ci.callback();
            } else {
              self.menuBtnActionHandler($(e.target));
            }
          });
          $ciA.attr('id', ci.id);
          $ciA.text(ci.label);
          $ciLi.append($ciA);
          $ciUl.append($ciLi);
        });
        $li.append($ciUl)
      }

      $li.append($a);
      $ul.append($li);
    })
    $container.append($ul)
    $menu.append($container);
    $parent.append($menu);
  }
  
  menuBtnActionHandler($target) {
    this.emit('action', { action: $target.attr('id') })
  }

  removeInfo() {
    $('#inspector').remove();
  }

  showInfo(item) {
    let $inspactor = $('#inspector');
    if ($inspactor.length < 1) {
      $('#app-menu').append('<div id="inspector">');
      $inspactor = $('#inspector');
    }

    $inspactor.html('<div class="content">');
    $inspactor.append('<a href="#" class="toggle"></a>')

    

    if (item.type === 'cosita') {
      $inspactor.children('.content').append('<h5>Cosita ID: ' + item.id + "</h5>")
      $inspactor.children('.content').append('<p>X: ' + item.x + " - Y: " + item.y +"</p>")
      $inspactor.children('.content').append('<p>OffsetX: ' + item.map.offsetX + " - OffsetY: " + item.map.offsetY +"</p>")
      $inspactor.children('.content').append('<p>Canvas width: ' + item.map.ctx.canvas.width + " - Height: " + item.map.ctx.canvas.height +"</p>")
      $inspactor.children('.content').append('<p>Current Tile X: ' + item.currentTile().x + " - Y: " + item.currentTile().y +"</p>")
      if (item.currentPath && item.currentPath.length >= 1) {
        $inspactor.children('.content').append('<p>Destination X: ' + item.currentPath[item.currentPath.length - 1].x + " - Y: " + item.currentPath[item.currentPath.length - 1].y +"</p>")
      }
    } else {
      this.showTileInfo(item);
    }

    $('.toggle').on('click', function (e) {
      $('#inspector').toggleClass('open');
    })

  }

  showTileInfo(tile) {
    let $inspactor = $('#inspector > .content');
    const htmlResult = `
      <h5>Tile id: ${tile.id}</h5>
      <p>
        Type: <select class="form-control" value="${tile.type}" id="tileType">
          <option value="path" ${tile.type === 'path' ? 'selected' : ''}>Path</option>
          <option value="water" ${tile.type === 'water' ? 'selected' : ''}>Water</option>
          <option value="rock" ${tile.type === 'rock' ? 'selected' : ''}>Rock</option>
        </select>
      </p>
      <h5>Position: </h5>
      <p>
        <div class="row">
          <div class="col-6">
            X: ${tile.x}
          </div>
          <div class="col-6">
            Y: ${tile.y}
          </div>
        </div>
        <div class="row">
          <div class="col-6">
            Left: ${tile.left}
          </div>
          <div class="col-6">
            Top: ${tile.top}
          </div>
        </div>
      </p>
    `;

    $inspactor.html(htmlResult);

    $("select#tileType").on('change', (e) => {
      tile.type = $(e.target).val()
    })
  }

  openMap() {
    const self = this;
    let input = $('<input type="file">')
    input.attr('id', 'map-file')
    input.attr('name', 'map-file')
    input.css('display', 'none')
    $("#"+this.parentId).append(input)
    setTimeout(() => {
      input.trigger('click')
    }, 200)

    input.on('change', async (e) => {
      const file = e.target.files.item(0)
      const text = await file.text();
      const mapData = JSON.parse(text);
      self.emit('action', { action: 'generateMap', data: mapData })
      input.remove();
    })

  }

  saveMap() {
    let cositas = this.parent.cositas.map((c) => {
      return {
        x: c.x,
        y: c.y,
      }
    });
    const data = {
      grid: this.parent.mapa.exportGrid(),
      cositas
    }
    console.log({data})
    const mapStr = JSON.stringify(data);
    let file = new Blob([mapStr], {type: 'text/plain'});
    const filename = 'map.json';

    if (window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(file, filename);
    } else {
      let a = document.createElement("a")
      let url = URL.createObjectURL(file);
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
}

export default Menu