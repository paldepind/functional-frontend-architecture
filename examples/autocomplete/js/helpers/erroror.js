module.exports = function errorOr(fn){ 
  return function(val){ 
    return val instanceof Error ? val : fn(val);
  } 
}

