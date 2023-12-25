import $ from 'jquery';
import { Rock, Path, Grass, Water } from './Mapa';

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
            id: 'newGame',
            callback: () => {
              this.generateMap();
            }
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
    const $parent = $("body");
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
    $('#inspector > .content').html(`
      <h5>Tile id: ${tile.id}</h5>
      <p>
        Type: <select class="form-control" value="${tile.type}" id="tileType">
          <option value="path" ${tile.type === 'path' ? 'selected' : ''}>Path</option>
          <option value="water" ${tile.type === 'grass' ? 'selected' : ''}>Grass</option>
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
    `);

    const self = this;
    $("select#tileType").on('change', (e) => {
      self.parent.mapa.replaceTile(tile, $(e.target).val())
    })
  }

  generateMap() {
    const $modal = $('<div class="modal" tabindex="-1" role="dialog" id="generate-modal"></div>');
    $modal.html(`
      <div class="modal-dialog" role="document">
        <div class="modal-content bg-dark text-white">
          <div class="modal-header">
            <h5 class="modal-title">Modal title</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-primary" id="generate-submit">Save changes</button>
            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    `)
    
    $("#app").append($modal)

    const $form = $('<form id="generate-form">')

    const tyleTypes = [
      {
        name: 'path',
        prob: .5
      },
      {
        name: 'grass',
        prob: .5
      },
      {
        name: 'water',
        prob: .25
      },
      {
        name: 'rock',
        prob: .25
      }
    ]
    $form.append('<h4 class="mb-3">Tile probabilities</h4>');

    for (let i = 0; i < tyleTypes.length; i++) {
      const tile = tyleTypes[i];
      const $formGroup = $('<div class="form-group row mb-3">');
      
      const $check = $('<input type="checkbox" name="'+tile.name+'" class="type-check"/>');
      const $label = $('<label for="'+tile.name+'" class="form-label ms-3">'+tile.name+'</label>')
      const col2 = $('<div class="col-sm-3">');
      col2.append($check);
      col2.append($label);
      $formGroup.append(col2)

      const $probInput = $('<input type="number" name="'+tile.name+'_prob" class="form-control-plaintext bg-white text-black" id="path-prob" max="1" min="0.1" step="0.1" value="'+tile.prob+'">')
      $probInput.hide();
      const col10 = $('<div class="col-sm-9">');
      col10.append($probInput);
      $formGroup.append(col10);
      $form.append($formGroup);

      $check.on('click', function () {
        if ($(this).is(':checked')) {
          $probInput.show();
        } else{
          $probInput.hide();
        }
      })
    }

    $modal.find('.modal-body').append($form)
    $("#generate-modal").show();

    const self = this
    $("#generate-submit").on('click', function (e) {
      e.preventDefault();
      // const vals = $("#generate-form").serializeArray();
      let typesSelected = [];
      $(".type-check:checked").each((index, check) => {
        typesSelected.push({
          type: $(check).attr('name'),
          prob: $('input[name="' + $(check).attr('name') + '_prob"]').val()
        })
      })
      console.log('ACA')
      self.emit('action', {action: 'newGame', data: {options: { types: typesSelected }}})
      $modal.hide();
      $modal.remove();
      return false;
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
      self.emit('action', { action: 'newGame', data: mapData })
      input.remove();
    })
  }

  saveMap() {
    let cositas = this.parent.cositas.map((c) => {
      return {
        x: c.position.x,
        y: c.position.y,
      }
    });
    const data = {
      grid: this.parent.mapa.exportGrid(),
      cositas
    }
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