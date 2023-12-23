import $ from 'jquery';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css'
import './css/main.scss';
import Jueguito from "./Jueguito.js";
// import three from "./three"

$(() => {
  var jueguito = new Jueguito("app");
  jueguito.start();
})
