import * as THREE from 'three';
import $ from 'jquery';

const width = window.innerWidth, 
      height = window.innerHeight;

// init

const camera = new THREE.PerspectiveCamera( 70, width / height, 0.01, 10 );
camera.position.z = 1;

const scene = new THREE.Scene();

const geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );
const material = new THREE.MeshNormalMaterial();

const mesh = new THREE.Mesh( geometry, material );
scene.add( mesh );

const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setSize( width, height );
renderer.setAnimationLoop( animation );
document.body.appendChild( renderer.domElement );

// animation

var rotationX = 0;
var rotationY = 0;

var positionX = 0;
var positionY = 0;

function animation( time ) {

	// mesh.rotation.x = time / 2000;
	// mesh.rotation.x = rotationX;
	// mesh.rotation.y = time / 1000;
	// mesh.rotation.y = rotationY;
  mesh.position.x = positionX;
  mesh.position.y = positionY;

	renderer.render( scene, camera );

}

$(() => {

  $("#app").append('<input type="number" id="rotationX" />');
  $("#app").append('<input type="number" id="rotationY" />');

  $("#rotationX").on("change", function (e) {
    positionX = $(this).val();
  })

  $("#rotationY").on("change", function (e) {
    positionY = $(this).val();
  })
})