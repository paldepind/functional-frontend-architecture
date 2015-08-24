const h = require('snabbdom/h');

module.exports = function svg(...args){
  const vnode = h(...args);
  vnode.data.ns = 'http://www.w3.org/2000/svg';
  return vnode;
}

