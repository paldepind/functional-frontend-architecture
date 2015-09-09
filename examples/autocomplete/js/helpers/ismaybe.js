var Maybe = require('ramda-fantasy/src/Maybe');
module.exports = function isMaybe(val){ return Maybe.isNothing(val) || Maybe.isJust(val); }

