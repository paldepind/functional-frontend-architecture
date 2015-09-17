var curry = require('ramda/src/curry');
var noop = function(){};

module.exports = curry( function caseKey(handlers,e) {
  var k = e.key || e.keyCode;
  var mapHandlers = handlers.reduce(function(o,handler){
            for (var i=0;i<handler[0].length;++i) 
              o[handler[0][i]] = handler[1];
            return o;
          }, {});
  return hasOwnProperty.call(mapHandlers,k) ? mapHandlers[k](e) : noop() ;
});


