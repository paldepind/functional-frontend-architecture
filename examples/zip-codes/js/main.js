'use strict';

var app = require('./app');

window.addEventListener('DOMContentLoaded', function(){ 
  app(document.querySelector('#container'));
});
