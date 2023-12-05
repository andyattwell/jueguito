import $ from 'jquery';

class Menu {
  constructor(parentId) {
    this.parentId = parentId;
    this.items = [
      {
        label: 'Mapa',
        children: [
          {
            label: 'Generar',
            id: 'open-map'
          },
          {
            label: 'Guardar',
            id: 'save-map'
          },
          {
            label: 'Abrir',
            id: 'open-map'
          }
        ]
      },
      {
        label: 'Editar',
        children: [
          {
            label: 'Editar celdas',
            id: 'edit-map'
          },
        ]
      }
    ];
    this.drawMenu();
  }

  drawMenu () {
    const $parent = $("#"+this.parentId);
    $parent.remove("#app-menu");
    let $menu = $('<div class="navbar navbar-dark bg-dark" id="app-menu">');
    
    let $brandBtn = $('<a class="navbar-brand" href="#">Navbar</a>');
    $menu.append($brandBtn);

    let $togglerBtn = $('<button class="navbar-toggler">');
    $togglerBtn.attr('data-toggle', 'collapse');
    $togglerBtn.attr('data-target', '#navbarNavAltMarkup');
    $togglerBtn.attr('aria-controls', 'navbarNavAltMarkup');
    $togglerBtn.attr('aria-expanded', 'false');
    $togglerBtn.attr('aria-label', 'Toggle navigation');
    $togglerBtn.html('<span class="navbar-toggler-icon"></span>');
    $menu.append($togglerBtn);

    let $divContainer = $('<div class="collapse navbar-collapse" id="navbarSupportedContent">')
    let $ul = $('<ul class="navbar-nav mr-auto">');

    this.items.forEach((item) => {
      let $li = $('<li class="nav-item active">');
      $li.text(item.label);
      $ul.append($li);
    })
    
    $divContainer.append($ul);
    $menu.append($divContainer);
    $parent.append($menu);
  }
}

export default Menu