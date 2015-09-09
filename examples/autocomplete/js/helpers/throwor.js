module.exports = function throwOr(fn){ 
  return function(val){ 
    if (val instanceof Error) { throw val; }
    return fn(val);
  } 
}


