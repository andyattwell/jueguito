import $ from 'jquery';

class Inspector {

  init() {
    let $inspactor = $('<div id="inspector">');
    $inspactor.append('<h1>Inspector</h1>');
    $("#app").append($inspactor)
  }

  showInfo(type, data) {
    $("#inspector").html("")

    if (type === 'tile') {{
      $("#inspector").append('<p>Tile ID: ' + data.id + "</p>")
      $("#inspector").append('<p>Tile Type: ' + data.type + "</p>")
      $("#inspector").append('<p>Tile X: ' + data.x + "</p>")
      $("#inspector").append('<p>Tile Y: ' + data.y + "</p>")
      $("#inspector").append('<p>left: ' + data.left + "</p>")
      $("#inspector").append('<p>top: ' + data.top + "</p>")
      $("#inspector").append('<p>occupied: ' + data.occupied + "</p>")
    }}

    if (type === 'cosita') {
      $("#inspector").append('<p>Cosita ID: ' + data.id + "</p>")
    }
  }
}

export default Inspector