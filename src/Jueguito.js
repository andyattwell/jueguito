import Cosita from "./Cosita.js";
import Mapa from "./Mapa.js";
import Menu from "./Menu.js";
import $ from 'jquery';

class Jueguito {
  constructor(id) {
    this.id = id;
    this.status = 0;
    this.mapa = null;
    this.cosita = null;
    this.menu = new Menu(id);
  }

  start() {
    let self = this;
    this.status = 1;
    this.mapa = new Mapa(this.id, 6, 6);
    self.cosita = new Cosita(this.mapa);

  }

}

export default Jueguito