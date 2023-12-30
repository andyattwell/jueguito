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
            label: 'Nuevo',
            id: 'newGame',
            callback: () => {
              this.generateMap();
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
            label: 'Guardar',
            id: 'saveMap',
            callback: () => {
              this.saveMap();
            }
          },
          {
            label: 'Play',
            id: 'play'
          },
          {
            label: 'Pause',
            id: 'pause'
          },
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

  createModal() {
    const $modal = $('<div class="modal" tabindex="-1" role="dialog" id="generate-modal"></div>');
    $modal.html(`
      <div class="modal-dialog" role="document">
        <div class="modal-content bg-dark text-white">
          <div class="modal-header">
            <h5 class="modal-title">Nuevo mapa</h5>
            <button type="button" class="close close-modal" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-primary" id="generate-submit">Generar</button>
            <button type="button" class="btn btn-secondary close-modal" data-dismiss="modal">Cancelar</button>
          </div>
        </div>
      </div>
    `)
    
    $("#app").append($modal)

    const $form = $('<form id="generate-form">')

    // Cols
    $form.append(
      $('<div class="form-group row mb-3">').append(
        $('<div class="col-sm-3">').append(
          $('<label for="cols" class="form-label ms-3">Rows</label>')
          ),
          $('<div class="col-sm-9">').append(
          $('<input type="number" name="cols" id="cols" value="40" class="form-control"/>')
        )
      )
    )

    // Rows
    $form.append(
      $('<div class="form-group row mb-3">').append(
        $('<div class="col-sm-3">').append(
          $('<label for="rows" class="form-label ms-3">Cols</label>')
          ),
          $('<div class="col-sm-9">').append(
          $('<input type="number" name="rows" id="rows" value="40" class="form-control"/>')
        )
      )
    )

    // mapNoiseScale
    $form.append(
      $('<div class="form-group row mb-3">').append(
        $('<div class="col-sm-3">').append(
          $('<label for="mapNoiseScale" class="form-label ms-3">Scale</label>')
          ),
          $('<div class="col-sm-9">').append(
          $('<input type="number" value="0.150" step="0.001" min="0.001" max="1" name="mapNoiseScale" id="mapNoiseScale" class="form-control"/>')
        )
      )
    )

    // Octaves
    $form.append(
      $('<div class="form-group row mb-3">').append(
        $('<div class="col-sm-3">').append(
          $('<label for="mapNoiseOctaves" class="form-label ms-3">Octaves</label>')
          ),
          $('<div class="col-sm-9">').append(
          $('<input type="number" min="1" max="6" value="3" name="mapNoiseOctaves" id="mapNoiseOctaves" class="form-control"/>')
        )
      )
    )

    // Persistance
    $form.append(
      $('<div class="form-group row mb-3">').append(
        $('<div class="col-sm-3">').append(
          $('<label for="mapNoisePersistance" class="form-label ms-3">Persistance</label>')
          ),
          $('<div class="col-sm-9">').append(
          $('<input type="number" min="0.001" step="0.001" max="1" value=".9" name="mapNoisePersistance" id="mapNoisePersistance" class="form-control"/>')
        )
      )
    )

    // Lacunarity
    $form.append(
      $('<div class="form-group row mb-3">').append(
        $('<div class="col-sm-3">').append(
          $('<label for="mapNoiseLacunarity" class="form-label ms-3">Lacunarity</label>')
          ),
          $('<div class="col-sm-9">').append(
          $('<input type="number" value="0.1355" min="0.0001" max="1" step="0.0001" name="mapNoiseLacunarity" id="mapNoiseLacunarity" class="form-control"/>')
        )
      )
    )
    
    // Offset
    $form.append(
      $('<div class="form-group row mb-3">').append(
        
        $('<div class="col-sm-3">').append(
          $('<label for="offsetX" class="form-label ms-3">Offset x, y</label>')
        ),

        $('<div class="col-sm-9">').append(
          $('<div class="form-group row">').append(
            $('<div class="col-sm-6">').append(
              $('<input type="number" value="0" name="offset[x]" id="offsetX" class="form-control"/>')
            ),
            $('<div class="col-sm-6">').append(
              $('<input type="number" value="0" name="offset[y]" id="offsetY" class="form-control"/>')
            )
          )
        )
      )
    )

    // Seed
    $form.append(
      $('<div class="form-group row mb-3">').append(
        $('<div class="col-sm-3">').append(
          $('<label for="mapSeed" class="form-label ms-3">Seed</label>')
          ),
          $('<div class="col-sm-9">').append(
          $('<input type="text" name="mapSeed" id="mapSeed" class="form-control"/>')
        )
      )
    )

    $modal.find('.modal-body').append($form)
    $("#generate-modal").show();

    const self = this
    $("#generate-submit").on('click', function (e) {
      e.preventDefault();
      const vals = $("#generate-form").serializeArray();
      let options = {
        offset: {}
      };
      vals.forEach((input) => {
        if (input.name === 'offset[x]') {
          options.offset.x = input.value
        } else if (input.name === 'offset[y]') {
          options.offset.y = input.value
        } else {
          options[input.name] = input.value
        }
      })
      // let typesSelected = [];
      // $(".type-check:checked").each((index, check) => {
      //   typesSelected.push({
      //     type: $(check).attr('name'),
      //     prob: $('input[name="' + $(check).attr('name') + '_prob"]').val()
      //   })
      // })
      self.emit('action', {
        action: 'newGame', data: {
          options        
        }
      })
      console.log({options})
      $modal.hide();
      return false;
    })

    $(".close-modal").on("click", function (e) {
      $("#generate-modal").hide();
    })
  }
  generateMap() {
    
    if ($("#generate-modal").length === 0) {
      this.createModal();
    } else {
      $("#generate-modal").show()
    }

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
        z: c.position.z,
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