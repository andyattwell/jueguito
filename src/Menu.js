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
    let $brandBtn = $('<a class="navbar-brand" href="#">Navbar</a>');

    $container.append($brandBtn);

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

    let $ulInspector = $('<ul class="navbar-nav" id="inspector-nav">');
    let $liInspector = $('<li class="nav-item">');
    let $aInspector = $('<a class="nav-link" href="#">')
    $aInspector.text('Inspector');

    $aInspector.on('click', self.toggleInspector);

    $liInspector.append($aInspector);
    $ulInspector.append($liInspector);

    $container.append($ulInspector)
    
    $menu.append($container);

    
    $parent.append($menu);

  }
  
  menuBtnActionHandler($target) {
    this.emit('action', { action: $target.attr('id') })
  }

  toggleInspector (e) {
    e.preventDefault();
    if ($('#inspector').length >= 1) {
      $('#inspector').remove();
    } else {
      $('#inspector-nav').append('<div id="inspector">');
    }
    return false;
  }

  showInfo(item) {
    // $('#inspector-nav').remove("#inspector");
    // console.log('item', item)
    if (!item) {
      $('#inspector-nav').hide();
      return false;
    }
    $('#inspector-nav').show();

    let $inspactor = $('#inspector');

    if ($inspactor.length < 1) {
      return false
    }

    $inspactor.html("");

    $inspactor.append('<h1>Inspector</h1>');

    if (item.type === 'path' || item.type === 'water' || item.type === 'rock') {{
      $inspactor.append('<p>Tile ID: ' + item.id + "</p>")
      $inspactor.append('<p>Tile Type: ' + item.type + "</p>")
      $inspactor.append('<p>Tile X: ' + item.x + "</p>")
      $inspactor.append('<p>Tile Y: ' + item.y + "</p>")
      $inspactor.append('<p>left: ' + item.left + "</p>")
      $inspactor.append('<p>top: ' + item.top + "</p>")
      $inspactor.append('<p>occupied: ' + item.occupied + "</p>")
    }}

    if (item.type === 'cosita') {
      $inspactor.append('<p>Cosita ID: ' + item.id + "</p>")
      $inspactor.append('<p>X: ' + item.x + " - Y: " + item.y +"</p>")
      $inspactor.append('<p>Current Tile X: ' + item.currentTile().x + " - Y: " + item.currentTile().y +"</p>")
      if (item.currentPath && item.currentPath.length >= 1) {
        $inspactor.append('<p>Destination X: ' + item.currentPath[item.currentPath.length - 1].x + " - Y: " + item.currentPath[item.currentPath.length - 1].y +"</p>")
      }
    }

    $('#inspector-nav').append($inspactor)

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
      if(mapData.length > 0) {
        self.emit('action', { action: 'generateMap', data: mapData })
      }
      input.remove();
    })

  }

  saveMap() {
    const mapStr = JSON.stringify(this.parent.mapa.exportGrid());
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