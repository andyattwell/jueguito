import $ from 'jquery';

class Inspector {

  init() {
    let $inspactor = $('<div id="inspector">');
    $inspactor.append('<h1>Inspector</h1>');
    $("#app").append($inspactor)
  }

  hide () {
    $("#inspector").hide();
  }

  showInfo(match) {
    $("#inspector").html("");
    $("#inspector").show();
    if (match.type === 'path' || match.type === 'water' || match.type === 'stone') {{
      $("#inspector").append('<p>Tile ID: ' + match.id + "</p>")
      $("#inspector").append('<p>Tile Type: ' + match.type + "</p>")
      $("#inspector").append('<p>Tile X: ' + match.x + "</p>")
      $("#inspector").append('<p>Tile Y: ' + match.y + "</p>")
      $("#inspector").append('<p>left: ' + match.left + "</p>")
      $("#inspector").append('<p>top: ' + match.top + "</p>")
      $("#inspector").append('<p>occupied: ' + match.occupied + "</p>")
    }}

    if (match.type === 'cosita') {
      $("#inspector").append('<p>Cosita ID: ' + match.id + "</p>")
      $("#inspector").append('<p>X: ' + match.x + " - Y: " + match.y +"</p>")
      // $("#inspector").append('<p>Cositas: ' + match.total + "</p>")

      // match.cositas.forEach(cos => {
      //   $("#inspector").append('<p>--- Cos: ' + cos.id + " - " + (cos.selected === true ? "selected" : "no" )+ "</p>")
      
      // });
    }
  }
}

export default Inspector