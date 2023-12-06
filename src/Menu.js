import $ from 'jquery';
import { Dropdown } from 'bootstrap';

class Menu {
  constructor(parentId) {
    this.parentId = parentId;
    this.listeners = {};
    this.items = [
      {
        label: 'Mapa',
        children: [
          {
            label: 'Generar',
            id: 'generateMap'
          },
          {
            label: 'Guardar',
            id: 'saveMap'
          },
          {
            label: 'Abrir',
            id: 'openMap'
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
            self.menuBtnActionHandler($(e.target));
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
    this.emit('action', { action: $target.attr('id'), algo: '123' })
  }
}

export default Menu