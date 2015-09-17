var Maybe = require('ramda-fantasy/src/Maybe');

module.exports = function emptyToNothing(val){ 
  return val.length === 0 ? Maybe.Nothing() : Maybe(val) ;
}
