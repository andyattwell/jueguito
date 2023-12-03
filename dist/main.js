/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (function() { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/Cosita.js":
/*!***********************!*\
  !*** ./src/Cosita.js ***!
  \***********************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("__webpack_require__.r(__webpack_exports__);\nclass Cosita {\n  constructor(width = 30, height = 30, x = 50, y = 50) {\n    this.width = width;\n    this.height = height;\n    this.x = x;\n    this.y = y;\n    this.speed = 0;\n    this.element = null;\n    this.isMoving = false;\n    this.init();\n  }\n\n  init() {\n    this.createCosita().then((co) => {\n      setTimeout(() => {\n        console.log(\"Aca\");\n      }, 300);\n    });\n    // document.body.appendChild();\n  }\n\n  move(dir) {\n    console.log({dir})\n    if (this.isMoving) {\n      return false;\n    }\n\n    this.isMoving = true;\n    const step = 80;\n\n    let nextX = this.x;\n    let nextY = this.y;\n\n    switch (dir) {\n      case \"up\":\n        if (nextY - step >= 0) {\n          nextY -= step;\n        } else {\n          nextY = 0;\n        }\n        break;\n      case \"down\":\n        if (\n          nextY + step + this.height <\n          document.documentElement.scrollHeight\n        ) {\n          nextY += step;\n        } else {\n          nextY = document.documentElement.scrollHeight - this.height;\n        }\n        break;\n      case \"left\":\n        if (nextX - step > 0) {\n          nextX -= step;\n        } else {\n          nextX = 0;\n        }\n        break;\n      case \"right\":\n        if (nextX + step + this.width < document.documentElement.scrollWidth) {\n          nextX += step;\n        } else {\n          nextX = document.documentElement.scrollWidth - this.width;\n        }\n        break;\n      default:\n        break;\n    }\n    // console.log(\"move\", { dir, nextX, nextY });\n\n    let id = null;\n    clearInterval(id);\n    id = setInterval(frame, 4);\n    let self = this;\n\n    let diffX = 0;\n    let diffY = 0;\n\n    let smallStep = 1;\n    let third = parseInt(step / 3);\n    let half = parseInt(step / 2);\n\n    function frame() {\n      diffY = Math.abs(parseInt(nextY - self.y));\n      diffX = Math.abs(parseInt(nextX - self.x));\n      let totalDiff = Math.max(diffX, diffY);\n\n      if (diffY == 0 && diffX == 0) {\n        clearInterval(id);\n        self.isMoving = false;\n      } else {\n        if (totalDiff > third) {\n          smallStep = 3;\n        } else if (totalDiff > half) {\n          smallStep = 6;\n        } else {\n          smallStep = 1;\n        }\n\n        if (dir === \"up\" && self.y > nextY) {\n          self.y = self.y - smallStep;\n        } else if (dir === \"down\" && self.y < nextY) {\n          self.y = self.y + smallStep;\n        } else if (dir === \"left\" && self.x > nextX) {\n          self.x = self.x - smallStep;\n        } else if (dir === \"right\" && self.x < nextX) {\n          self.x = self.x + smallStep;\n        }\n\n        self.element.style.top = self.y + \"px\";\n        self.element.style.left = self.x + \"px\";\n      }\n    }\n  }\n\n  push(force) {}\n\n  createCosita() {\n    let self = this;\n    return new Promise((resolve, reject) => {\n      // console.log(\"New Cosita\", this.x, this.y, this.width, this.height);\n\n      let _el = document.createElement(\"div\");\n      _el.className = \"Cosita\";\n      _el.style.left = `${this.x}px`;\n      _el.style.top = `${this.y}px`;\n      _el.style.width = `${this.width}px`;\n      _el.style.height = `${this.height}px`;\n\n      _el.addEventListener(\"click\", (el, evt) => {\n        this.move();\n      });\n\n      document.getElementsByClassName(\"Mapa\")[0].appendChild(_el);\n\n      self.element = _el;\n\n      return resolve(_el);\n    });\n  }\n\n  get position() {\n    return [this.x, this.y];\n  }\n\n  get size() {\n    return [this.width, this.height];\n  }\n}\n/* harmony default export */ __webpack_exports__[\"default\"] = (Cosita);\n\n\n//# sourceURL=webpack://jueguito/./src/Cosita.js?");

/***/ }),

/***/ "./src/Jueguito.js":
/*!*************************!*\
  !*** ./src/Jueguito.js ***!
  \*************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _Cosita_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Cosita.js */ \"./src/Cosita.js\");\n\n\nclass Jueguito {\n  constructor() {\n    this.status = 0;\n    this.mapa = null;\n    this.cosita = null;\n  }\n\n  start() {\n    let self = this;\n    this.status = 1;\n    this.createMapa().then(() => {});\n    self.cosita = new _Cosita_js__WEBPACK_IMPORTED_MODULE_0__[\"default\"](\n      50,\n      50,\n      document.documentElement.scrollWidth / 2,\n      document.documentElement.scrollHeight / 2\n    );\n    document.body.addEventListener(\"keydown\", (event) => {\n      self.keyAction(event.key);\n    });\n  }\n\n  createMapa() {\n    let self = this;\n    return new Promise((resolve, reject) => {\n      self.mapa = document.createElement(\"div\");\n      self.mapa.className = \"Mapa\";\n      document.body.appendChild(self.mapa);\n      resolve();\n    });\n  }\n\n  keyAction(keyName) {\n    // console.log(\"key: \" + keyName);\n    switch (keyName) {\n      case \"w\":\n        this.cosita.move(\"up\");\n        break;\n      case \"s\":\n        this.cosita.move(\"down\");\n        break;\n      case \"a\":\n        this.cosita.move(\"left\");\n        break;\n      case \"d\":\n        this.cosita.move(\"right\");\n        break;\n      default:\n        console.log({keyName})\n    }\n  }\n}\n\n/* harmony default export */ __webpack_exports__[\"default\"] = (Jueguito);\n\n//# sourceURL=webpack://jueguito/./src/Jueguito.js?");

/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _Jueguito_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Jueguito.js */ \"./src/Jueguito.js\");\n// import _ from 'lodash';\n\nvar jueguito = new _Jueguito_js__WEBPACK_IMPORTED_MODULE_0__[\"default\"]();\njueguito.start();\n\n\n//# sourceURL=webpack://jueguito/./src/index.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	!function() {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = function(exports) {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	}();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./src/index.js");
/******/ 	
/******/ })()
;