System.registerDynamic("npm:flyd@0.1.14", ["npm:flyd@0.1.14/lib/index"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("npm:flyd@0.1.14/lib/index");
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:snabbdom@0.2.6", ["npm:snabbdom@0.2.6/snabbdom"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("npm:snabbdom@0.2.6/snabbdom");
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:babel-runtime@5.8.20/helpers/sliced-to-array", ["npm:babel-runtime@5.8.20/core-js/get-iterator", "npm:babel-runtime@5.8.20/core-js/is-iterable"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var _getIterator = require("npm:babel-runtime@5.8.20/core-js/get-iterator")["default"];
  var _isIterable = require("npm:babel-runtime@5.8.20/core-js/is-iterable")["default"];
  exports["default"] = (function() {
    function sliceIterator(arr, i) {
      var _arr = [];
      var _n = true;
      var _d = false;
      var _e = undefined;
      try {
        for (var _i = _getIterator(arr),
            _s; !(_n = (_s = _i.next()).done); _n = true) {
          _arr.push(_s.value);
          if (i && _arr.length === i)
            break;
        }
      } catch (err) {
        _d = true;
        _e = err;
      } finally {
        try {
          if (!_n && _i["return"])
            _i["return"]();
        } finally {
          if (_d)
            throw _e;
        }
      }
      return _arr;
    }
    return function(arr, i) {
      if (Array.isArray(arr)) {
        return arr;
      } else if (_isIterable(Object(arr))) {
        return sliceIterator(arr, i);
      } else {
        throw new TypeError("Invalid attempt to destructure non-iterable instance");
      }
    };
  })();
  exports.__esModule = true;
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/flip", ["npm:ramda@0.17.1/src/internal/_curry1", "npm:ramda@0.17.1/src/internal/_slice", "npm:ramda@0.17.1/src/curry"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry1 = require("npm:ramda@0.17.1/src/internal/_curry1");
  var _slice = require("npm:ramda@0.17.1/src/internal/_slice");
  var curry = require("npm:ramda@0.17.1/src/curry");
  module.exports = _curry1(function flip(fn) {
    return curry(function(a, b) {
      var args = _slice(arguments);
      args[0] = b;
      args[1] = a;
      return fn.apply(this, args);
    });
  });
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:snabbdom@0.2.6/modules/props", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  function updateProps(oldVnode, vnode) {
    var key,
        cur,
        old,
        elm = vnode.elm,
        oldProps = oldVnode.data.props || {},
        props = vnode.data.props || {};
    for (key in props) {
      cur = props[key];
      old = oldProps[key];
      if (old !== cur) {
        elm[key] = cur;
      }
    }
  }
  module.exports = {
    create: updateProps,
    update: updateProps
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:snabbdom@0.2.6/modules/class", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  function updateClass(oldVnode, vnode) {
    var cur,
        name,
        elm = vnode.elm,
        oldClass = oldVnode.data.class || {},
        klass = vnode.data.class || {};
    for (name in klass) {
      cur = klass[name];
      if (cur !== oldClass[name]) {
        elm.classList[cur ? 'add' : 'remove'](name);
      }
    }
  }
  module.exports = {
    create: updateClass,
    update: updateClass
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:snabbdom@0.2.6/modules/attributes", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var booleanAttrs = ["allowfullscreen", "async", "autofocus", "autoplay", "checked", "compact", "controls", "declare", "default", "defaultchecked", "defaultmuted", "defaultselected", "defer", "disabled", "draggable", "enabled", "formnovalidate", "hidden", "indeterminate", "inert", "ismap", "itemscope", "loop", "multiple", "muted", "nohref", "noresize", "noshade", "novalidate", "nowrap", "open", "pauseonexit", "readonly", "required", "reversed", "scoped", "seamless", "selected", "sortable", "spellcheck", "translate", "truespeed", "typemustmatch", "visible"];
  var booleanAttrsDict = {};
  for (var i = 0,
      len = booleanAttrs.length; i < len; i++) {
    booleanAttrsDict[booleanAttrs[i]] = true;
  }
  function updateAttrs(oldVnode, vnode) {
    var key,
        cur,
        old,
        elm = vnode.elm,
        oldAttrs = oldVnode.data.attrs || {},
        attrs = vnode.data.attrs || {};
    for (key in attrs) {
      cur = attrs[key];
      old = oldAttrs[key];
      if (old !== cur) {
        if (!cur && booleanAttrsDict[key])
          elm.removeAttribute(key);
        else
          elm.setAttribute(key, cur);
      }
    }
    for (key in oldAttrs) {
      if (!(key in attrs)) {
        elm.removeAttribute(key);
      }
    }
  }
  module.exports = {
    create: updateAttrs,
    update: updateAttrs
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:snabbdom@0.2.6/modules/eventlisteners", ["npm:snabbdom@0.2.6/is"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var is = require("npm:snabbdom@0.2.6/is");
  function arrInvoker(arr) {
    return function() {
      arr.length === 2 ? arr[0](arr[1]) : arr[0].apply(undefined, arr.slice(1));
    };
  }
  function fnInvoker(o) {
    return function(ev) {
      o.fn(ev);
    };
  }
  function updateEventListeners(oldVnode, vnode) {
    var name,
        cur,
        old,
        elm = vnode.elm,
        oldOn = oldVnode.data.on || {},
        on = vnode.data.on;
    if (!on)
      return;
    for (name in on) {
      cur = on[name];
      old = oldOn[name];
      if (old === undefined) {
        if (is.array(cur)) {
          elm.addEventListener(name, arrInvoker(cur));
        } else {
          cur = {fn: cur};
          on[name] = cur;
          elm.addEventListener(name, fnInvoker(cur));
        }
      } else if (is.array(old)) {
        old.length = cur.length;
        for (var i = 0; i < old.length; ++i)
          old[i] = cur[i];
        on[name] = old;
      } else {
        old.fn = cur;
        on[name] = old;
      }
    }
  }
  module.exports = {
    create: updateEventListeners,
    update: updateEventListeners
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:snabbdom@0.2.6/modules/style", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var raf = requestAnimationFrame || setTimeout;
  var nextFrame = function(fn) {
    raf(function() {
      raf(fn);
    });
  };
  function setNextFrame(obj, prop, val) {
    nextFrame(function() {
      obj[prop] = val;
    });
  }
  function updateStyle(oldVnode, vnode) {
    var cur,
        name,
        elm = vnode.elm,
        oldStyle = oldVnode.data.style || {},
        style = vnode.data.style || {},
        oldHasDel = 'delayed' in oldStyle;
    for (name in style) {
      cur = style[name];
      if (name === 'delayed') {
        for (name in style.delayed) {
          cur = style.delayed[name];
          if (!oldHasDel || cur !== oldStyle.delayed[name]) {
            setNextFrame(elm.style, name, cur);
          }
        }
      } else if (name !== 'remove' && cur !== oldStyle[name]) {
        elm.style[name] = cur;
      }
    }
  }
  function applyDestroyStyle(vnode) {
    var style,
        name,
        elm = vnode.elm,
        s = vnode.data.style;
    if (!s || !(style = s.destroy))
      return;
    for (name in style) {
      elm.style[name] = style[name];
    }
  }
  function applyRemoveStyle(vnode, rm) {
    var s = vnode.data.style;
    if (!s || !s.remove) {
      rm();
      return;
    }
    var name,
        elm = vnode.elm,
        idx,
        i = 0,
        maxDur = 0,
        compStyle,
        style = s.remove,
        amount = 0,
        applied = [];
    for (name in style) {
      applied.push(name);
      elm.style[name] = style[name];
    }
    compStyle = getComputedStyle(elm);
    var props = compStyle['transition-property'].split(', ');
    for (; i < props.length; ++i) {
      if (applied.indexOf(props[i]) !== -1)
        amount++;
    }
    elm.addEventListener('transitionend', function(ev) {
      if (ev.target === elm)
        --amount;
      if (amount === 0)
        rm();
    });
  }
  module.exports = {
    create: updateStyle,
    update: updateStyle,
    destroy: applyDestroyStyle,
    remove: applyRemoveStyle
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:snabbdom@0.2.6/snabbdom", ["npm:snabbdom@0.2.6/vnode", "npm:snabbdom@0.2.6/is"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var VNode = require("npm:snabbdom@0.2.6/vnode");
  var is = require("npm:snabbdom@0.2.6/is");
  function isUndef(s) {
    return s === undefined;
  }
  function isDef(s) {
    return s !== undefined;
  }
  function emptyNodeAt(elm) {
    return VNode(elm.tagName, {}, [], undefined, elm);
  }
  var emptyNode = VNode('', {}, [], undefined, undefined);
  var insertedVnodeQueue;
  function sameVnode(vnode1, vnode2) {
    return vnode1.key === vnode2.key && vnode1.sel === vnode2.sel;
  }
  function createKeyToOldIdx(children, beginIdx, endIdx) {
    var i,
        map = {},
        key;
    for (i = beginIdx; i <= endIdx; ++i) {
      key = children[i].key;
      if (isDef(key))
        map[key] = i;
    }
    return map;
  }
  function createRmCb(childElm, listeners) {
    return function() {
      if (--listeners === 0)
        childElm.parentElement.removeChild(childElm);
    };
  }
  var hooks = ['create', 'update', 'remove', 'destroy', 'pre', 'post'];
  function init(modules) {
    var i,
        j,
        cbs = {};
    for (i = 0; i < hooks.length; ++i) {
      cbs[hooks[i]] = [];
      for (j = 0; j < modules.length; ++j) {
        if (modules[j][hooks[i]] !== undefined)
          cbs[hooks[i]].push(modules[j][hooks[i]]);
      }
    }
    function createElm(vnode) {
      var i,
          data = vnode.data;
      if (isDef(data)) {
        if (isDef(i = data.hook) && isDef(i = i.init))
          i(vnode);
        if (isDef(i = data.vnode))
          vnode = i;
      }
      var elm,
          children = vnode.children,
          sel = vnode.sel;
      if (isDef(sel)) {
        var hashIdx = sel.indexOf('#');
        var dotIdx = sel.indexOf('.', hashIdx);
        var hash = hashIdx > 0 ? hashIdx : sel.length;
        var dot = dotIdx > 0 ? dotIdx : sel.length;
        var tag = hashIdx !== -1 || dotIdx !== -1 ? sel.slice(0, Math.min(hash, dot)) : sel;
        elm = vnode.elm = isDef(data) && isDef(i = data.ns) ? document.createElementNS(i, tag) : document.createElement(tag);
        if (hash < dot)
          elm.id = sel.slice(hash + 1, dot);
        if (dotIdx > 0)
          elm.className = sel.slice(dot + 1).replace(/\./g, ' ');
        if (is.array(children)) {
          for (i = 0; i < children.length; ++i) {
            elm.appendChild(createElm(children[i]));
          }
        } else if (is.primitive(vnode.text)) {
          elm.appendChild(document.createTextNode(vnode.text));
        }
        for (i = 0; i < cbs.create.length; ++i)
          cbs.create[i](emptyNode, vnode);
        i = vnode.data.hook;
        if (isDef(i)) {
          if (i.create)
            i.create(emptyNode, vnode);
          if (i.insert)
            insertedVnodeQueue.push(vnode);
        }
      } else {
        elm = vnode.elm = document.createTextNode(vnode.text);
      }
      return vnode.elm;
    }
    function addVnodes(parentElm, before, vnodes, startIdx, endIdx) {
      for (; startIdx <= endIdx; ++startIdx) {
        parentElm.insertBefore(createElm(vnodes[startIdx]), before);
      }
    }
    function invokeDestroyHook(vnode) {
      var i = vnode.data,
          j;
      if (isDef(i)) {
        if (isDef(i = i.hook) && isDef(i = i.destroy))
          i(vnode);
        for (i = 0; i < cbs.destroy.length; ++i)
          cbs.destroy[i](vnode);
        if (isDef(i = vnode.children)) {
          for (j = 0; j < vnode.children.length; ++j) {
            invokeDestroyHook(vnode.children[j]);
          }
        }
      }
    }
    function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
      for (; startIdx <= endIdx; ++startIdx) {
        var i,
            listeners,
            rm,
            ch = vnodes[startIdx];
        if (isDef(ch)) {
          if (isDef(ch.sel)) {
            invokeDestroyHook(ch);
            listeners = cbs.remove.length + 1;
            rm = createRmCb(ch.elm, listeners);
            for (i = 0; i < cbs.remove.length; ++i)
              cbs.remove[i](ch, rm);
            if (isDef(i = ch.data) && isDef(i = i.hook) && isDef(i = i.remove)) {
              i(ch, rm);
            } else {
              rm();
            }
          } else {
            parentElm.removeChild(ch.elm);
          }
        }
      }
    }
    function updateChildren(parentElm, oldCh, newCh) {
      var oldStartIdx = 0,
          newStartIdx = 0;
      var oldEndIdx = oldCh.length - 1;
      var oldStartVnode = oldCh[0];
      var oldEndVnode = oldCh[oldEndIdx];
      var newEndIdx = newCh.length - 1;
      var newStartVnode = newCh[0];
      var newEndVnode = newCh[newEndIdx];
      var oldKeyToIdx,
          idxInOld,
          elmToMove,
          before;
      while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
        if (isUndef(oldStartVnode)) {
          oldStartVnode = oldCh[++oldStartIdx];
        } else if (isUndef(oldEndVnode)) {
          oldEndVnode = oldCh[--oldEndIdx];
        } else if (sameVnode(oldStartVnode, newStartVnode)) {
          patchVnode(oldStartVnode, newStartVnode);
          oldStartVnode = oldCh[++oldStartIdx];
          newStartVnode = newCh[++newStartIdx];
        } else if (sameVnode(oldEndVnode, newEndVnode)) {
          patchVnode(oldEndVnode, newEndVnode);
          oldEndVnode = oldCh[--oldEndIdx];
          newEndVnode = newCh[--newEndIdx];
        } else if (sameVnode(oldStartVnode, newEndVnode)) {
          patchVnode(oldStartVnode, newEndVnode);
          parentElm.insertBefore(oldStartVnode.elm, oldEndVnode.elm.nextSibling);
          oldStartVnode = oldCh[++oldStartIdx];
          newEndVnode = newCh[--newEndIdx];
        } else if (sameVnode(oldEndVnode, newStartVnode)) {
          patchVnode(oldEndVnode, newStartVnode);
          parentElm.insertBefore(oldEndVnode.elm, oldStartVnode.elm);
          oldEndVnode = oldCh[--oldEndIdx];
          newStartVnode = newCh[++newStartIdx];
        } else {
          if (isUndef(oldKeyToIdx))
            oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
          idxInOld = oldKeyToIdx[newStartVnode.key];
          if (isUndef(idxInOld)) {
            parentElm.insertBefore(createElm(newStartVnode), oldStartVnode.elm);
            newStartVnode = newCh[++newStartIdx];
          } else {
            elmToMove = oldCh[idxInOld];
            patchVnode(elmToMove, newStartVnode);
            oldCh[idxInOld] = undefined;
            parentElm.insertBefore(elmToMove.elm, oldStartVnode.elm);
            newStartVnode = newCh[++newStartIdx];
          }
        }
      }
      if (oldStartIdx > oldEndIdx) {
        before = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm;
        addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx);
      } else if (newStartIdx > newEndIdx) {
        removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
      }
    }
    function patchVnode(oldVnode, vnode) {
      var i,
          hook;
      if (isDef(i = vnode.data) && isDef(hook = i.hook) && isDef(i = hook.prepatch)) {
        i(oldVnode, vnode);
      }
      if (isDef(i = oldVnode.data) && isDef(i = i.vnode))
        oldVnode = i;
      if (isDef(i = vnode.data) && isDef(i = i.vnode))
        vnode = i;
      var elm = vnode.elm = oldVnode.elm,
          oldCh = oldVnode.children,
          ch = vnode.children;
      if (oldVnode === vnode)
        return;
      if (isDef(vnode.data)) {
        for (i = 0; i < cbs.update.length; ++i)
          cbs.update[i](oldVnode, vnode);
        i = vnode.data.hook;
        if (isDef(i) && isDef(i = i.update))
          i(oldVnode, vnode);
      }
      if (isUndef(vnode.text)) {
        if (isDef(oldCh) && isDef(ch)) {
          if (oldCh !== ch)
            updateChildren(elm, oldCh, ch);
        } else if (isDef(ch)) {
          addVnodes(elm, null, ch, 0, ch.length - 1);
        } else if (isDef(oldCh)) {
          removeVnodes(elm, oldCh, 0, oldCh.length - 1);
        }
      } else if (oldVnode.text !== vnode.text) {
        elm.textContent = vnode.text;
      }
      if (isDef(hook) && isDef(i = hook.postpatch)) {
        i(oldVnode, vnode);
      }
      return vnode;
    }
    return function(oldVnode, vnode) {
      var i;
      insertedVnodeQueue = [];
      for (i = 0; i < cbs.pre.length; ++i)
        cbs.pre[i]();
      if (oldVnode instanceof Element) {
        if (oldVnode.parentElement !== null) {
          createElm(vnode);
          oldVnode.parentElement.replaceChild(vnode.elm, oldVnode);
        } else {
          oldVnode = emptyNodeAt(oldVnode);
          patchVnode(oldVnode, vnode);
        }
      } else {
        patchVnode(oldVnode, vnode);
      }
      for (i = 0; i < insertedVnodeQueue.length; ++i) {
        insertedVnodeQueue[i].data.hook.insert(insertedVnodeQueue[i]);
      }
      insertedVnodeQueue = undefined;
      for (i = 0; i < cbs.post.length; ++i)
        cbs.post[i]();
      return vnode;
    };
  }
  module.exports = {init: init};
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:flyd@0.1.14/lib/index", ["npm:ramda@0.14.0/src/curryN"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var curryN = require("npm:ramda@0.14.0/src/curryN");
  'use strict';
  function isFunction(obj) {
    return !!(obj && obj.constructor && obj.call && obj.apply);
  }
  var toUpdate = [];
  var inStream;
  function map(f, s) {
    return stream([s], function(self) {
      self(f(s.val));
    });
  }
  function on(f, s) {
    stream([s], function() {
      f(s.val);
    });
  }
  function boundMap(f) {
    return map(f, this);
  }
  var scan = curryN(3, function(f, acc, s) {
    var ns = stream([s], function() {
      return (acc = f(acc, s()));
    });
    if (!ns.hasVal)
      ns(acc);
    return ns;
  });
  var merge = curryN(2, function(s1, s2) {
    var s = immediate(stream([s1, s2], function(n, changed) {
      return changed[0] ? changed[0]() : s1.hasVal ? s1() : s2();
    }));
    endsOn(stream([s1.end, s2.end], function(self, changed) {
      return true;
    }), s);
    return s;
  });
  function ap(s2) {
    var s1 = this;
    return stream([s1, s2], function() {
      return s1()(s2());
    });
  }
  function initialDepsNotMet(stream) {
    stream.depsMet = stream.deps.every(function(s) {
      return s.hasVal;
    });
    return !stream.depsMet;
  }
  function updateStream(s) {
    if ((s.depsMet !== true && initialDepsNotMet(s)) || (s.end !== undefined && s.end.val === true))
      return;
    if (inStream !== undefined) {
      toUpdate.push(s);
      return;
    }
    inStream = s;
    var returnVal = s.fn(s, s.depsChanged);
    if (returnVal !== undefined) {
      s(returnVal);
    }
    inStream = undefined;
    if (s.depsChanged !== undefined)
      s.depsChanged = [];
    s.shouldUpdate = false;
    if (flushing === false)
      flushUpdate();
  }
  var order = [];
  var orderNextIdx = -1;
  function findDeps(s) {
    var i,
        listeners = s.listeners;
    if (s.queued === false) {
      s.queued = true;
      for (i = 0; i < listeners.length; ++i) {
        findDeps(listeners[i]);
      }
      order[++orderNextIdx] = s;
    }
  }
  function updateDeps(s) {
    var i,
        o,
        list,
        listeners = s.listeners;
    for (i = 0; i < listeners.length; ++i) {
      list = listeners[i];
      if (list.end === s) {
        endStream(list);
      } else {
        if (list.depsChanged !== undefined)
          list.depsChanged.push(s);
        list.shouldUpdate = true;
        findDeps(list);
      }
    }
    for (; orderNextIdx >= 0; --orderNextIdx) {
      o = order[orderNextIdx];
      if (o.shouldUpdate === true)
        updateStream(o);
      o.queued = false;
    }
  }
  var flushing = false;
  function flushUpdate() {
    flushing = true;
    while (toUpdate.length > 0) {
      var s = toUpdate.shift();
      if (s.vals.length > 0)
        s.val = s.vals.shift();
      updateDeps(s);
    }
    flushing = false;
  }
  function isStream(stream) {
    return isFunction(stream) && 'hasVal' in stream;
  }
  function streamToString() {
    return 'stream(' + this.val + ')';
  }
  function updateStreamValue(s, n) {
    if (n !== undefined && n !== null && isFunction(n.then)) {
      n.then(s);
      return;
    }
    s.val = n;
    s.hasVal = true;
    if (inStream === undefined) {
      flushing = true;
      updateDeps(s);
      if (toUpdate.length > 0)
        flushUpdate();
      else
        flushing = false;
    } else if (inStream === s) {
      markListeners(s, s.listeners);
    } else {
      s.vals.push(n);
      toUpdate.push(s);
    }
  }
  function markListeners(s, lists) {
    var i,
        list;
    for (i = 0; i < lists.length; ++i) {
      list = lists[i];
      if (list.end !== s) {
        if (list.depsChanged !== undefined) {
          list.depsChanged.push(s);
        }
        list.shouldUpdate = true;
      } else {
        endStream(list);
      }
    }
  }
  function createStream() {
    function s(n) {
      var i,
          list;
      if (arguments.length === 0) {
        return s.val;
      } else {
        updateStreamValue(s, n);
        return s;
      }
    }
    s.hasVal = false;
    s.val = undefined;
    s.vals = [];
    s.listeners = [];
    s.queued = false;
    s.end = undefined;
    s.map = boundMap;
    s.ap = ap;
    s.of = stream;
    s.toString = streamToString;
    return s;
  }
  function addListeners(deps, s) {
    for (var i = 0; i < deps.length; ++i) {
      deps[i].listeners.push(s);
    }
  }
  function createDependentStream(deps, fn) {
    var i,
        s = createStream();
    s.fn = fn;
    s.deps = deps;
    s.depsMet = false;
    s.depsChanged = fn.length > 1 ? [] : undefined;
    s.shouldUpdate = false;
    addListeners(deps, s);
    return s;
  }
  function immediate(s) {
    if (s.depsMet === false) {
      s.depsMet = true;
      updateStream(s);
    }
    return s;
  }
  function removeListener(s, listeners) {
    var idx = listeners.indexOf(s);
    listeners[idx] = listeners[listeners.length - 1];
    listeners.length--;
  }
  function detachDeps(s) {
    for (var i = 0; i < s.deps.length; ++i) {
      removeListener(s, s.deps[i].listeners);
    }
    s.deps.length = 0;
  }
  function endStream(s) {
    if (s.deps !== undefined)
      detachDeps(s);
    if (s.end !== undefined)
      detachDeps(s.end);
  }
  function endsOn(endS, s) {
    detachDeps(s.end);
    endS.listeners.push(s.end);
    s.end.deps.push(endS);
    return s;
  }
  function trueFn() {
    return true;
  }
  function stream(arg, fn) {
    var i,
        s,
        deps,
        depEndStreams;
    var endStream = createDependentStream([], trueFn);
    if (arguments.length > 1) {
      deps = [];
      depEndStreams = [];
      for (i = 0; i < arg.length; ++i) {
        if (arg[i] !== undefined) {
          deps.push(arg[i]);
          if (arg[i].end !== undefined)
            depEndStreams.push(arg[i].end);
        }
      }
      s = createDependentStream(deps, fn);
      s.end = endStream;
      endStream.listeners.push(s);
      addListeners(depEndStreams, endStream);
      endStream.deps = depEndStreams;
      updateStream(s);
    } else {
      s = createStream();
      s.end = endStream;
      endStream.listeners.push(s);
      if (arguments.length === 1)
        s(arg);
    }
    return s;
  }
  var transduce = curryN(2, function(xform, source) {
    xform = xform(new StreamTransformer());
    return stream([source], function(self) {
      var res = xform['@@transducer/step'](undefined, source());
      if (res && res['@@transducer/reduced'] === true) {
        self.end(true);
        return res['@@transducer/value'];
      } else {
        return res;
      }
    });
  });
  function StreamTransformer() {}
  StreamTransformer.prototype['@@transducer/init'] = function() {};
  StreamTransformer.prototype['@@transducer/result'] = function() {};
  StreamTransformer.prototype['@@transducer/step'] = function(s, v) {
    return v;
  };
  module.exports = {
    stream: stream,
    isStream: isStream,
    transduce: transduce,
    merge: merge,
    scan: scan,
    endsOn: endsOn,
    map: curryN(2, map),
    on: curryN(2, on),
    curryN: curryN,
    immediate: immediate
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:flyd-forwardto@0.0.2", ["npm:flyd-forwardto@0.0.2/forwardto"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("npm:flyd-forwardto@0.0.2/forwardto");
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:union-type@0.1.6", ["npm:union-type@0.1.6/union-type"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("npm:union-type@0.1.6/union-type");
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/compose", ["npm:ramda@0.17.1/src/pipe", "npm:ramda@0.17.1/src/reverse"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var pipe = require("npm:ramda@0.17.1/src/pipe");
  var reverse = require("npm:ramda@0.17.1/src/reverse");
  module.exports = function compose() {
    if (arguments.length === 0) {
      throw new Error('compose requires at least one argument');
    }
    return pipe.apply(this, reverse(arguments));
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/curry", ["npm:ramda@0.17.1/src/internal/_curry1", "npm:ramda@0.17.1/src/curryN"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry1 = require("npm:ramda@0.17.1/src/internal/_curry1");
  var curryN = require("npm:ramda@0.17.1/src/curryN");
  module.exports = _curry1(function curry(fn) {
    return curryN(fn.length, fn);
  });
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/map", ["npm:ramda@0.17.1/src/internal/_curry2", "npm:ramda@0.17.1/src/internal/_dispatchable", "npm:ramda@0.17.1/src/internal/_map", "npm:ramda@0.17.1/src/internal/_xmap"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("npm:ramda@0.17.1/src/internal/_curry2");
  var _dispatchable = require("npm:ramda@0.17.1/src/internal/_dispatchable");
  var _map = require("npm:ramda@0.17.1/src/internal/_map");
  var _xmap = require("npm:ramda@0.17.1/src/internal/_xmap");
  module.exports = _curry2(_dispatchable('map', _xmap, _map));
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/chain", ["npm:ramda@0.17.1/src/internal/_curry2", "npm:ramda@0.17.1/src/internal/_dispatchable", "npm:ramda@0.17.1/src/internal/_xchain", "npm:ramda@0.17.1/src/map", "npm:ramda@0.17.1/src/unnest"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("npm:ramda@0.17.1/src/internal/_curry2");
  var _dispatchable = require("npm:ramda@0.17.1/src/internal/_dispatchable");
  var _xchain = require("npm:ramda@0.17.1/src/internal/_xchain");
  var map = require("npm:ramda@0.17.1/src/map");
  var unnest = require("npm:ramda@0.17.1/src/unnest");
  module.exports = _curry2(_dispatchable('chain', _xchain, function chain(fn, list) {
    return unnest(map(fn, list));
  }));
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/invoker", ["npm:ramda@0.17.1/src/internal/_curry2", "npm:ramda@0.17.1/src/internal/_slice", "npm:ramda@0.17.1/src/curryN", "npm:ramda@0.17.1/src/is", "npm:ramda@0.17.1/src/toString"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("npm:ramda@0.17.1/src/internal/_curry2");
  var _slice = require("npm:ramda@0.17.1/src/internal/_slice");
  var curryN = require("npm:ramda@0.17.1/src/curryN");
  var is = require("npm:ramda@0.17.1/src/is");
  var toString = require("npm:ramda@0.17.1/src/toString");
  module.exports = _curry2(function invoker(arity, method) {
    return curryN(arity + 1, function() {
      var target = arguments[arity];
      if (target != null && is(Function, target[method])) {
        return target[method].apply(target, _slice(arguments, 0, arity));
      }
      throw new TypeError(toString(target) + ' does not have a method named "' + method + '"');
    });
  });
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/identity", ["npm:ramda@0.17.1/src/internal/_curry1", "npm:ramda@0.17.1/src/internal/_identity"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry1 = require("npm:ramda@0.17.1/src/internal/_curry1");
  var _identity = require("npm:ramda@0.17.1/src/internal/_identity");
  module.exports = _curry1(_identity);
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/ifElse", ["npm:ramda@0.17.1/src/internal/_curry3", "npm:ramda@0.17.1/src/curryN", "github:jspm/nodelibs-process@0.1.1"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  (function(process) {
    var _curry3 = require("npm:ramda@0.17.1/src/internal/_curry3");
    var curryN = require("npm:ramda@0.17.1/src/curryN");
    module.exports = _curry3(function ifElse(condition, onTrue, onFalse) {
      return curryN(Math.max(condition.length, onTrue.length, onFalse.length), function _ifElse() {
        return condition.apply(this, arguments) ? onTrue.apply(this, arguments) : onFalse.apply(this, arguments);
      });
    });
  })(require("github:jspm/nodelibs-process@0.1.1"));
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/props", ["npm:ramda@0.17.1/src/internal/_curry2"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("npm:ramda@0.17.1/src/internal/_curry2");
  module.exports = _curry2(function props(ps, obj) {
    var len = ps.length;
    var out = [];
    var idx = 0;
    while (idx < len) {
      out[idx] = obj[ps[idx]];
      idx += 1;
    }
    return out;
  });
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/path", ["npm:ramda@0.17.1/src/internal/_curry2"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("npm:ramda@0.17.1/src/internal/_curry2");
  module.exports = _curry2(function path(paths, obj) {
    if (obj == null) {
      return;
    } else {
      var val = obj;
      for (var idx = 0,
          len = paths.length; idx < len && val != null; idx += 1) {
        val = val[paths[idx]];
      }
      return val;
    }
  });
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/prop", ["npm:ramda@0.17.1/src/internal/_curry2"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("npm:ramda@0.17.1/src/internal/_curry2");
  module.exports = _curry2(function prop(p, obj) {
    return obj[p];
  });
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/assoc", ["npm:ramda@0.17.1/src/internal/_curry3"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry3 = require("npm:ramda@0.17.1/src/internal/_curry3");
  module.exports = _curry3(function assoc(prop, val, obj) {
    var result = {};
    for (var p in obj) {
      result[p] = obj[p];
    }
    result[prop] = val;
    return result;
  });
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/equals", ["npm:ramda@0.17.1/src/internal/_curry2", "npm:ramda@0.17.1/src/internal/_equals", "npm:ramda@0.17.1/src/internal/_hasMethod"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("npm:ramda@0.17.1/src/internal/_curry2");
  var _equals = require("npm:ramda@0.17.1/src/internal/_equals");
  var _hasMethod = require("npm:ramda@0.17.1/src/internal/_hasMethod");
  module.exports = _curry2(function equals(a, b) {
    return _hasMethod('equals', a) ? a.equals(b) : _hasMethod('equals', b) ? b.equals(a) : _equals(a, b, [], []);
  });
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/prepend", ["npm:ramda@0.17.1/src/internal/_concat", "npm:ramda@0.17.1/src/internal/_curry2"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _concat = require("npm:ramda@0.17.1/src/internal/_concat");
  var _curry2 = require("npm:ramda@0.17.1/src/internal/_curry2");
  module.exports = _curry2(function prepend(el, list) {
    return _concat([el], list);
  });
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/insert", ["npm:ramda@0.17.1/src/internal/_curry3", "npm:ramda@0.17.1/src/internal/_slice"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry3 = require("npm:ramda@0.17.1/src/internal/_curry3");
  var _slice = require("npm:ramda@0.17.1/src/internal/_slice");
  module.exports = _curry3(function insert(idx, elt, list) {
    idx = idx < list.length && idx >= 0 ? idx : list.length;
    var result = _slice(list);
    result.splice(idx, 0, elt);
    return result;
  });
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/join", ["npm:ramda@0.17.1/src/invoker"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var invoker = require("npm:ramda@0.17.1/src/invoker");
  module.exports = invoker(1, 'join');
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda-fantasy@0.4.0/src/Future", ["npm:ramda@0.17.1"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var R = require("npm:ramda@0.17.1");
  function Future(f) {
    if (!(this instanceof Future)) {
      return new Future(f);
    }
    this._fork = f;
  }
  Future.prototype.fork = function(reject, resolve) {
    try {
      this._fork(reject, resolve);
    } catch (e) {
      reject(e);
    }
  };
  Future.prototype.map = function(f) {
    return this.chain(function(a) {
      return Future.of(f(a));
    });
  };
  Future.prototype.ap = function(m) {
    var self = this;
    return new Future(function(rej, res) {
      var applyFn,
          val;
      var doReject = R.once(rej);
      function resolveIfDone() {
        if (applyFn != null && val != null) {
          return res(applyFn(val));
        }
      }
      self.fork(doReject, function(fn) {
        applyFn = fn;
        resolveIfDone();
      });
      m.fork(doReject, function(v) {
        val = v;
        resolveIfDone();
      });
    });
  };
  Future.of = function(x) {
    return new Future(function(_, resolve) {
      return resolve(x);
    });
  };
  Future.prototype.of = Future.of;
  Future.prototype.chain = function(f) {
    return new Future(function(reject, resolve) {
      return this.fork(function(a) {
        return reject(a);
      }, function(b) {
        return f(b).fork(reject, resolve);
      });
    }.bind(this));
  };
  Future.prototype.chainReject = function(f) {
    return new Future(function(reject, resolve) {
      return this.fork(function(a) {
        return f(a).fork(reject, resolve);
      }, function(b) {
        return resolve(b);
      });
    }.bind(this));
  };
  Future.prototype.bimap = function(errFn, successFn) {
    var self = this;
    return new Future(function(reject, resolve) {
      self.fork(function(err) {
        reject(errFn(err));
      }, function(val) {
        resolve(successFn(val));
      });
    });
  };
  Future.reject = function(val) {
    return new Future(function(reject) {
      reject(val);
    });
  };
  Future.prototype.toString = function() {
    return 'Future(' + R.toString(this._fork) + ')';
  };
  Future.memoize = function(f) {
    var status = 'IDLE';
    var listeners = [];
    var cachedValue;
    var handleCompletion = R.curry(function(newStatus, cb, val) {
      status = newStatus;
      cachedValue = val;
      cb(val);
      R.forEach(function(listener) {
        listener[status](cachedValue);
      }, listeners);
    });
    function addListeners(reject, resolve) {
      listeners.push({
        REJECTED: reject,
        RESOLVED: resolve
      });
    }
    function doResolve(reject, resolve) {
      status = 'PENDING';
      return f.fork(handleCompletion('REJECTED', reject), handleCompletion('RESOLVED', resolve));
    }
    return new Future(function(reject, resolve) {
      switch (status) {
        case 'IDLE':
          doResolve(reject, resolve);
          break;
        case 'PENDING':
          addListeners(reject, resolve);
          break;
        case 'REJECTED':
          reject(cachedValue);
          break;
        case 'RESOLVED':
          resolve(cachedValue);
          break;
      }
    });
  };
  module.exports = Future;
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/allPass", ["npm:ramda@0.17.1/src/internal/_curry1", "npm:ramda@0.17.1/src/internal/_predicateWrap", "npm:ramda@0.17.1/src/all"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry1 = require("npm:ramda@0.17.1/src/internal/_curry1");
  var _predicateWrap = require("npm:ramda@0.17.1/src/internal/_predicateWrap");
  var all = require("npm:ramda@0.17.1/src/all");
  module.exports = _curry1(_predicateWrap(all));
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda-fantasy@0.4.0/src/Maybe", ["npm:ramda@0.17.1", "npm:ramda-fantasy@0.4.0/src/internal/util"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var R = require("npm:ramda@0.17.1");
  var util = require("npm:ramda-fantasy@0.4.0/src/internal/util");
  function Maybe(x) {
    return x == null ? _nothing : Maybe.Just(x);
  }
  function _Just(x) {
    this.value = x;
  }
  util.extend(_Just, Maybe);
  function _Nothing() {}
  util.extend(_Nothing, Maybe);
  var _nothing = new _Nothing();
  Maybe.Nothing = function() {
    return _nothing;
  };
  Maybe.Just = function(x) {
    return new _Just(x);
  };
  Maybe.of = Maybe.Just;
  Maybe.prototype.of = Maybe.Just;
  Maybe.isJust = function(x) {
    return x instanceof _Just;
  };
  Maybe.isNothing = function(x) {
    return x === _nothing;
  };
  Maybe.maybe = R.curry(function(nothingVal, justFn, m) {
    return m.reduce(function(_, x) {
      return justFn(x);
    }, nothingVal);
  });
  _Just.prototype.map = function(f) {
    return this.of(f(this.value));
  };
  _Nothing.prototype.map = util.returnThis;
  _Just.prototype.ap = function(m) {
    return m.map(this.value);
  };
  _Nothing.prototype.ap = util.returnThis;
  _Just.prototype.chain = util.baseMap;
  _Nothing.prototype.chain = util.returnThis;
  _Just.prototype.datatype = _Just;
  _Nothing.prototype.datatype = _Nothing;
  _Just.prototype.equals = util.getEquals(_Just);
  _Nothing.prototype.equals = function(that) {
    return that === _nothing;
  };
  Maybe.prototype.isNothing = function() {
    return this === _nothing;
  };
  Maybe.prototype.isJust = function() {
    return this instanceof _Just;
  };
  _Just.prototype.getOrElse = function() {
    return this.value;
  };
  _Nothing.prototype.getOrElse = function(a) {
    return a;
  };
  _Just.prototype.reduce = function(f, x) {
    return f(x, this.value);
  };
  _Nothing.prototype.reduce = function(f, x) {
    return x;
  };
  _Just.prototype.toString = function() {
    return 'Maybe.Just(' + R.toString(this.value) + ')';
  };
  _Nothing.prototype.toString = function() {
    return 'Maybe.Nothing()';
  };
  module.exports = Maybe;
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:babel-runtime@5.8.20/core-js/is-iterable", ["npm:core-js@1.1.3/library/fn/is-iterable"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = {
    "default": require("npm:core-js@1.1.3/library/fn/is-iterable"),
    __esModule: true
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:snabbdom@0.2.6/h", ["npm:snabbdom@0.2.6/vnode", "npm:snabbdom@0.2.6/is"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var VNode = require("npm:snabbdom@0.2.6/vnode");
  var is = require("npm:snabbdom@0.2.6/is");
  module.exports = function h(sel, b, c) {
    var data = {},
        children,
        text,
        i;
    if (arguments.length === 3) {
      data = b;
      if (is.array(c)) {
        children = c;
      } else if (is.primitive(c)) {
        text = c;
      }
    } else if (arguments.length === 2) {
      if (is.array(b)) {
        children = b;
      } else if (is.primitive(b)) {
        text = b;
      } else {
        data = b;
      }
    }
    if (is.array(children)) {
      for (i = 0; i < children.length; ++i) {
        if (is.primitive(children[i]))
          children[i] = VNode(undefined, undefined, undefined, children[i]);
      }
    }
    return VNode(sel, data, children, text, undefined);
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/internal/_slice", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function _slice(args, from, to) {
    switch (arguments.length) {
      case 1:
        return _slice(args, 0, args.length);
      case 2:
        return _slice(args, from, args.length);
      default:
        var list = [];
        var idx = 0;
        var len = Math.max(0, Math.min(args.length, to) - from);
        while (idx < len) {
          list[idx] = args[from + idx];
          idx += 1;
        }
        return list;
    }
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:babel-runtime@5.8.20/core-js/get-iterator", ["npm:core-js@1.1.3/library/fn/get-iterator"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = {
    "default": require("npm:core-js@1.1.3/library/fn/get-iterator"),
    __esModule: true
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/internal/_curry1", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function _curry1(fn) {
    return function f1(a) {
      if (arguments.length === 0) {
        return f1;
      } else if (a != null && a['@@functional/placeholder'] === true) {
        return f1;
      } else {
        return fn.apply(this, arguments);
      }
    };
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:snabbdom@0.2.6/is", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = {
    array: Array.isArray,
    primitive: function(s) {
      return typeof s === 'string' || typeof s === 'number';
    }
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:snabbdom@0.2.6/vnode", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function(sel, data, children, text, elm) {
    var key = data === undefined ? undefined : data.key;
    return {
      sel: sel,
      data: data,
      children: children,
      text: text,
      elm: elm,
      key: key
    };
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.14.0/src/curryN", ["npm:ramda@0.14.0/src/__", "npm:ramda@0.14.0/src/internal/_curry2", "npm:ramda@0.14.0/src/internal/_slice", "npm:ramda@0.14.0/src/arity"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var __ = require("npm:ramda@0.14.0/src/__");
  var _curry2 = require("npm:ramda@0.14.0/src/internal/_curry2");
  var _slice = require("npm:ramda@0.14.0/src/internal/_slice");
  var arity = require("npm:ramda@0.14.0/src/arity");
  module.exports = _curry2(function curryN(length, fn) {
    return arity(length, function() {
      var n = arguments.length;
      var shortfall = length - n;
      var idx = n;
      while (--idx >= 0) {
        if (arguments[idx] === __) {
          shortfall += 1;
        }
      }
      if (shortfall <= 0) {
        return fn.apply(this, arguments);
      } else {
        var initialArgs = _slice(arguments);
        return curryN(shortfall, function() {
          var currentArgs = _slice(arguments);
          var combinedArgs = [];
          var idx = -1;
          while (++idx < n) {
            var val = initialArgs[idx];
            combinedArgs[idx] = (val === __ ? currentArgs.shift() : val);
          }
          return fn.apply(this, combinedArgs.concat(currentArgs));
        });
      }
    });
  });
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:flyd-forwardto@0.0.2/forwardto", ["npm:flyd@0.1.14"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var flyd = require("npm:flyd@0.1.14");
  module.exports = flyd.curryN(2, function(targ, fn) {
    var s = flyd.stream();
    flyd.map(function(v) {
      targ(fn(v));
    }, s);
    return s;
  });
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:union-type@0.1.6/union-type", ["npm:ramda@0.15.1/src/curryN"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var curryN = require("npm:ramda@0.15.1/src/curryN");
  function isString(s) {
    return typeof s === 'string';
  }
  function isNumber(n) {
    return typeof n === 'number';
  }
  function isObject(value) {
    var type = typeof value;
    return !!value && (type == 'object' || type == 'function');
  }
  function isFunction(f) {
    return typeof f === 'function';
  }
  var isArray = Array.isArray || function(a) {
    return 'length' in a;
  };
  var mapConstrToFn = curryN(2, function(group, constr) {
    return constr === String ? isString : constr === Number ? isNumber : constr === Object ? isObject : constr === Array ? isArray : constr === Function ? isFunction : constr === undefined ? group : constr;
  });
  function Constructor(group, name, validators) {
    validators = validators.map(mapConstrToFn(group));
    var constructor = curryN(validators.length, function() {
      var val = [],
          v,
          validator;
      for (var i = 0; i < arguments.length; ++i) {
        v = arguments[i];
        validator = validators[i];
        if ((typeof validator === 'function' && validator(v)) || (v !== undefined && v !== null && v.of === validator)) {
          val[i] = arguments[i];
        } else {
          throw new TypeError('wrong value ' + v + ' passed to location ' + i + ' in ' + name);
        }
      }
      val.of = group;
      val.name = name;
      return val;
    });
    return constructor;
  }
  function rawCase(type, cases, action, arg) {
    if (type !== action.of)
      throw new TypeError('wrong type passed to case');
    var name = action.name in cases ? action.name : '_' in cases ? '_' : undefined;
    if (name === undefined) {
      throw new Error('unhandled value passed to case');
    } else {
      return cases[name].apply(undefined, arg !== undefined ? action.concat([arg]) : action);
    }
  }
  var typeCase = curryN(3, rawCase);
  var caseOn = curryN(4, rawCase);
  function Type(desc) {
    var obj = {};
    for (var key in desc) {
      obj[key] = Constructor(obj, key, desc[key]);
    }
    obj.case = typeCase(obj);
    obj.caseOn = caseOn(obj);
    return obj;
  }
  module.exports = Type;
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/merge", ["npm:ramda@0.17.1/src/internal/_curry2", "npm:ramda@0.17.1/src/keys"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("npm:ramda@0.17.1/src/internal/_curry2");
  var keys = require("npm:ramda@0.17.1/src/keys");
  module.exports = _curry2(function merge(a, b) {
    var result = {};
    var ks = keys(a);
    var idx = 0;
    while (idx < ks.length) {
      result[ks[idx]] = a[ks[idx]];
      idx += 1;
    }
    ks = keys(b);
    idx = 0;
    while (idx < ks.length) {
      result[ks[idx]] = b[ks[idx]];
      idx += 1;
    }
    return result;
  });
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/toString", ["npm:ramda@0.17.1/src/internal/_curry1", "npm:ramda@0.17.1/src/internal/_toString"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry1 = require("npm:ramda@0.17.1/src/internal/_curry1");
  var _toString = require("npm:ramda@0.17.1/src/internal/_toString");
  module.exports = _curry1(function toString(val) {
    return _toString(val, []);
  });
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/always", ["npm:ramda@0.17.1/src/internal/_curry1"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry1 = require("npm:ramda@0.17.1/src/internal/_curry1");
  module.exports = _curry1(function always(val) {
    return function() {
      return val;
    };
  });
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/T", ["npm:ramda@0.17.1/src/always"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var always = require("npm:ramda@0.17.1/src/always");
  module.exports = always(true);
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/F", ["npm:ramda@0.17.1/src/always"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var always = require("npm:ramda@0.17.1/src/always");
  module.exports = always(false);
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/lensProp", ["npm:ramda@0.17.1/src/internal/_curry1", "npm:ramda@0.17.1/src/assoc", "npm:ramda@0.17.1/src/lens", "npm:ramda@0.17.1/src/prop"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry1 = require("npm:ramda@0.17.1/src/internal/_curry1");
  var assoc = require("npm:ramda@0.17.1/src/assoc");
  var lens = require("npm:ramda@0.17.1/src/lens");
  var prop = require("npm:ramda@0.17.1/src/prop");
  module.exports = _curry1(function lensProp(k) {
    return lens(prop(k), assoc(k));
  });
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/view", ["npm:ramda@0.17.1/src/internal/_curry2"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("npm:ramda@0.17.1/src/internal/_curry2");
  module.exports = (function() {
    var Const = function(x) {
      return {
        value: x,
        map: function() {
          return this;
        }
      };
    };
    return _curry2(function view(lens, x) {
      return lens(Const)(x).value;
    });
  }());
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/pipe", ["npm:ramda@0.17.1/src/internal/_pipe", "npm:ramda@0.17.1/src/curryN", "npm:ramda@0.17.1/src/reduce", "npm:ramda@0.17.1/src/tail"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _pipe = require("npm:ramda@0.17.1/src/internal/_pipe");
  var curryN = require("npm:ramda@0.17.1/src/curryN");
  var reduce = require("npm:ramda@0.17.1/src/reduce");
  var tail = require("npm:ramda@0.17.1/src/tail");
  module.exports = function pipe() {
    if (arguments.length === 0) {
      throw new Error('pipe requires at least one argument');
    }
    return curryN(arguments[0].length, reduce(_pipe, arguments[0], tail(arguments)));
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/reverse", ["npm:ramda@0.17.1/src/internal/_curry1", "npm:ramda@0.17.1/src/internal/_slice"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry1 = require("npm:ramda@0.17.1/src/internal/_curry1");
  var _slice = require("npm:ramda@0.17.1/src/internal/_slice");
  module.exports = _curry1(function reverse(list) {
    return _slice(list).reverse();
  });
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/curryN", ["npm:ramda@0.17.1/src/internal/_arity", "npm:ramda@0.17.1/src/internal/_curry1", "npm:ramda@0.17.1/src/internal/_curry2", "npm:ramda@0.17.1/src/internal/_curryN"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _arity = require("npm:ramda@0.17.1/src/internal/_arity");
  var _curry1 = require("npm:ramda@0.17.1/src/internal/_curry1");
  var _curry2 = require("npm:ramda@0.17.1/src/internal/_curry2");
  var _curryN = require("npm:ramda@0.17.1/src/internal/_curryN");
  module.exports = _curry2(function curryN(length, fn) {
    if (length === 1) {
      return _curry1(fn);
    }
    return _arity(length, _curryN(length, [], fn));
  });
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/internal/_curry2", ["npm:ramda@0.17.1/src/internal/_curry1"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry1 = require("npm:ramda@0.17.1/src/internal/_curry1");
  module.exports = function _curry2(fn) {
    return function f2(a, b) {
      var n = arguments.length;
      if (n === 0) {
        return f2;
      } else if (n === 1 && a != null && a['@@functional/placeholder'] === true) {
        return f2;
      } else if (n === 1) {
        return _curry1(function(b) {
          return fn(a, b);
        });
      } else if (n === 2 && a != null && a['@@functional/placeholder'] === true && b != null && b['@@functional/placeholder'] === true) {
        return f2;
      } else if (n === 2 && a != null && a['@@functional/placeholder'] === true) {
        return _curry1(function(a) {
          return fn(a, b);
        });
      } else if (n === 2 && b != null && b['@@functional/placeholder'] === true) {
        return _curry1(function(b) {
          return fn(a, b);
        });
      } else {
        return fn(a, b);
      }
    };
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/internal/_dispatchable", ["npm:ramda@0.17.1/src/internal/_isArray", "npm:ramda@0.17.1/src/internal/_isTransformer", "npm:ramda@0.17.1/src/internal/_slice"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _isArray = require("npm:ramda@0.17.1/src/internal/_isArray");
  var _isTransformer = require("npm:ramda@0.17.1/src/internal/_isTransformer");
  var _slice = require("npm:ramda@0.17.1/src/internal/_slice");
  module.exports = function _dispatchable(methodname, xf, fn) {
    return function() {
      var length = arguments.length;
      if (length === 0) {
        return fn();
      }
      var obj = arguments[length - 1];
      if (!_isArray(obj)) {
        var args = _slice(arguments, 0, length - 1);
        if (typeof obj[methodname] === 'function') {
          return obj[methodname].apply(obj, args);
        }
        if (_isTransformer(obj)) {
          var transducer = xf.apply(null, args);
          return transducer(obj);
        }
      }
      return fn.apply(this, arguments);
    };
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/internal/_map", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function _map(fn, list) {
    var idx = 0,
        len = list.length,
        result = Array(len);
    while (idx < len) {
      result[idx] = fn(list[idx]);
      idx += 1;
    }
    return result;
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/internal/_xmap", ["npm:ramda@0.17.1/src/internal/_curry2", "npm:ramda@0.17.1/src/internal/_xfBase"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("npm:ramda@0.17.1/src/internal/_curry2");
  var _xfBase = require("npm:ramda@0.17.1/src/internal/_xfBase");
  module.exports = (function() {
    function XMap(f, xf) {
      this.xf = xf;
      this.f = f;
    }
    XMap.prototype['@@transducer/init'] = _xfBase.init;
    XMap.prototype['@@transducer/result'] = _xfBase.result;
    XMap.prototype['@@transducer/step'] = function(result, input) {
      return this.xf['@@transducer/step'](result, this.f(input));
    };
    return _curry2(function _xmap(f, xf) {
      return new XMap(f, xf);
    });
  })();
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/unnest", ["npm:ramda@0.17.1/src/internal/_curry1", "npm:ramda@0.17.1/src/internal/_makeFlat"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry1 = require("npm:ramda@0.17.1/src/internal/_curry1");
  var _makeFlat = require("npm:ramda@0.17.1/src/internal/_makeFlat");
  module.exports = _curry1(_makeFlat(false));
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/internal/_xchain", ["npm:ramda@0.17.1/src/internal/_curry2", "npm:ramda@0.17.1/src/internal/_flatCat", "npm:ramda@0.17.1/src/map"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("npm:ramda@0.17.1/src/internal/_curry2");
  var _flatCat = require("npm:ramda@0.17.1/src/internal/_flatCat");
  var map = require("npm:ramda@0.17.1/src/map");
  module.exports = _curry2(function _xchain(f, xf) {
    return map(f, _flatCat(xf));
  });
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/is", ["npm:ramda@0.17.1/src/internal/_curry2"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("npm:ramda@0.17.1/src/internal/_curry2");
  module.exports = _curry2(function is(Ctor, val) {
    return val != null && val.constructor === Ctor || val instanceof Ctor;
  });
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/internal/_identity", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function _identity(x) {
    return x;
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("github:jspm/nodelibs-process@0.1.1", ["github:jspm/nodelibs-process@0.1.1/index"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("github:jspm/nodelibs-process@0.1.1/index");
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/internal/_curry3", ["npm:ramda@0.17.1/src/internal/_curry1", "npm:ramda@0.17.1/src/internal/_curry2"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry1 = require("npm:ramda@0.17.1/src/internal/_curry1");
  var _curry2 = require("npm:ramda@0.17.1/src/internal/_curry2");
  module.exports = function _curry3(fn) {
    return function f3(a, b, c) {
      var n = arguments.length;
      if (n === 0) {
        return f3;
      } else if (n === 1 && a != null && a['@@functional/placeholder'] === true) {
        return f3;
      } else if (n === 1) {
        return _curry2(function(b, c) {
          return fn(a, b, c);
        });
      } else if (n === 2 && a != null && a['@@functional/placeholder'] === true && b != null && b['@@functional/placeholder'] === true) {
        return f3;
      } else if (n === 2 && a != null && a['@@functional/placeholder'] === true) {
        return _curry2(function(a, c) {
          return fn(a, b, c);
        });
      } else if (n === 2 && b != null && b['@@functional/placeholder'] === true) {
        return _curry2(function(b, c) {
          return fn(a, b, c);
        });
      } else if (n === 2) {
        return _curry1(function(c) {
          return fn(a, b, c);
        });
      } else if (n === 3 && a != null && a['@@functional/placeholder'] === true && b != null && b['@@functional/placeholder'] === true && c != null && c['@@functional/placeholder'] === true) {
        return f3;
      } else if (n === 3 && a != null && a['@@functional/placeholder'] === true && b != null && b['@@functional/placeholder'] === true) {
        return _curry2(function(a, b) {
          return fn(a, b, c);
        });
      } else if (n === 3 && a != null && a['@@functional/placeholder'] === true && c != null && c['@@functional/placeholder'] === true) {
        return _curry2(function(a, c) {
          return fn(a, b, c);
        });
      } else if (n === 3 && b != null && b['@@functional/placeholder'] === true && c != null && c['@@functional/placeholder'] === true) {
        return _curry2(function(b, c) {
          return fn(a, b, c);
        });
      } else if (n === 3 && a != null && a['@@functional/placeholder'] === true) {
        return _curry1(function(a) {
          return fn(a, b, c);
        });
      } else if (n === 3 && b != null && b['@@functional/placeholder'] === true) {
        return _curry1(function(b) {
          return fn(a, b, c);
        });
      } else if (n === 3 && c != null && c['@@functional/placeholder'] === true) {
        return _curry1(function(c) {
          return fn(a, b, c);
        });
      } else {
        return fn(a, b, c);
      }
    };
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/internal/_equals", ["npm:ramda@0.17.1/src/internal/_has", "npm:ramda@0.17.1/src/identical", "npm:ramda@0.17.1/src/keys", "npm:ramda@0.17.1/src/type"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _has = require("npm:ramda@0.17.1/src/internal/_has");
  var identical = require("npm:ramda@0.17.1/src/identical");
  var keys = require("npm:ramda@0.17.1/src/keys");
  var type = require("npm:ramda@0.17.1/src/type");
  module.exports = function _equals(a, b, stackA, stackB) {
    var typeA = type(a);
    if (typeA !== type(b)) {
      return false;
    }
    if (typeA === 'Boolean' || typeA === 'Number' || typeA === 'String') {
      return typeof a === 'object' ? typeof b === 'object' && identical(a.valueOf(), b.valueOf()) : identical(a, b);
    }
    if (identical(a, b)) {
      return true;
    }
    if (typeA === 'RegExp') {
      return (a.source === b.source) && (a.global === b.global) && (a.ignoreCase === b.ignoreCase) && (a.multiline === b.multiline) && (a.sticky === b.sticky) && (a.unicode === b.unicode);
    }
    if (Object(a) === a) {
      if (typeA === 'Date' && a.getTime() !== b.getTime()) {
        return false;
      }
      var keysA = keys(a);
      if (keysA.length !== keys(b).length) {
        return false;
      }
      var idx = stackA.length - 1;
      while (idx >= 0) {
        if (stackA[idx] === a) {
          return stackB[idx] === b;
        }
        idx -= 1;
      }
      stackA[stackA.length] = a;
      stackB[stackB.length] = b;
      idx = keysA.length - 1;
      while (idx >= 0) {
        var key = keysA[idx];
        if (!_has(key, b) || !_equals(b[key], a[key], stackA, stackB)) {
          return false;
        }
        idx -= 1;
      }
      stackA.pop();
      stackB.pop();
      return true;
    }
    return false;
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/internal/_hasMethod", ["npm:ramda@0.17.1/src/internal/_isArray"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _isArray = require("npm:ramda@0.17.1/src/internal/_isArray");
  module.exports = function _hasMethod(methodName, obj) {
    return obj != null && !_isArray(obj) && typeof obj[methodName] === 'function';
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/internal/_concat", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function _concat(set1, set2) {
    set1 = set1 || [];
    set2 = set2 || [];
    var idx;
    var len1 = set1.length;
    var len2 = set2.length;
    var result = [];
    idx = 0;
    while (idx < len1) {
      result[result.length] = set1[idx];
      idx += 1;
    }
    idx = 0;
    while (idx < len2) {
      result[result.length] = set2[idx];
      idx += 1;
    }
    return result;
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1", ["npm:ramda@0.17.1/dist/ramda"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("npm:ramda@0.17.1/dist/ramda");
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/all", ["npm:ramda@0.17.1/src/internal/_curry2", "npm:ramda@0.17.1/src/internal/_dispatchable", "npm:ramda@0.17.1/src/internal/_xall"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("npm:ramda@0.17.1/src/internal/_curry2");
  var _dispatchable = require("npm:ramda@0.17.1/src/internal/_dispatchable");
  var _xall = require("npm:ramda@0.17.1/src/internal/_xall");
  module.exports = _curry2(_dispatchable('all', _xall, function all(fn, list) {
    var idx = 0;
    while (idx < list.length) {
      if (!fn(list[idx])) {
        return false;
      }
      idx += 1;
    }
    return true;
  }));
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/internal/_predicateWrap", ["npm:ramda@0.17.1/src/internal/_arity", "npm:ramda@0.17.1/src/internal/_slice", "npm:ramda@0.17.1/src/pluck"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _arity = require("npm:ramda@0.17.1/src/internal/_arity");
  var _slice = require("npm:ramda@0.17.1/src/internal/_slice");
  var pluck = require("npm:ramda@0.17.1/src/pluck");
  module.exports = function _predicateWrap(predPicker) {
    return function(preds) {
      var predIterator = function() {
        var args = arguments;
        return predPicker(function(predicate) {
          return predicate.apply(null, args);
        }, preds);
      };
      return arguments.length > 1 ? predIterator.apply(null, _slice(arguments, 1)) : _arity(Math.max.apply(Math, pluck('length', preds)), predIterator);
    };
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda-fantasy@0.4.0/src/internal/util", ["npm:ramda@0.17.1"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _equals = require("npm:ramda@0.17.1").equals;
  module.exports = {
    baseMap: function(f) {
      return f(this.value);
    },
    getEquals: function(constructor) {
      return function equals(that) {
        return that instanceof constructor && _equals(this.value, that.value);
      };
    },
    extend: function(Child, Parent) {
      function Ctor() {
        this.constructor = Child;
      }
      Ctor.prototype = Parent.prototype;
      Child.prototype = new Ctor();
      Child.super_ = Parent.prototype;
    },
    identity: function(x) {
      return x;
    },
    notImplemented: function(str) {
      return function() {
        throw new Error(str + ' is not implemented');
      };
    },
    notCallable: function(fn) {
      return function() {
        throw new Error(fn + ' cannot be called directly');
      };
    },
    returnThis: function() {
      return this;
    }
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/fn/is-iterable", ["npm:core-js@1.1.3/library/modules/web.dom.iterable", "npm:core-js@1.1.3/library/modules/es6.string.iterator", "npm:core-js@1.1.3/library/modules/core.is-iterable"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  require("npm:core-js@1.1.3/library/modules/web.dom.iterable");
  require("npm:core-js@1.1.3/library/modules/es6.string.iterator");
  module.exports = require("npm:core-js@1.1.3/library/modules/core.is-iterable");
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/fn/get-iterator", ["npm:core-js@1.1.3/library/modules/web.dom.iterable", "npm:core-js@1.1.3/library/modules/es6.string.iterator", "npm:core-js@1.1.3/library/modules/core.get-iterator"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  require("npm:core-js@1.1.3/library/modules/web.dom.iterable");
  require("npm:core-js@1.1.3/library/modules/es6.string.iterator");
  module.exports = require("npm:core-js@1.1.3/library/modules/core.get-iterator");
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.14.0/src/__", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = {ramda: 'placeholder'};
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.14.0/src/internal/_curry2", ["npm:ramda@0.14.0/src/__", "npm:ramda@0.14.0/src/internal/_curry1"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var __ = require("npm:ramda@0.14.0/src/__");
  var _curry1 = require("npm:ramda@0.14.0/src/internal/_curry1");
  module.exports = function _curry2(fn) {
    return function f2(a, b) {
      var n = arguments.length;
      if (n === 0) {
        return f2;
      } else if (n === 1 && a === __) {
        return f2;
      } else if (n === 1) {
        return _curry1(function(b) {
          return fn(a, b);
        });
      } else if (n === 2 && a === __ && b === __) {
        return f2;
      } else if (n === 2 && a === __) {
        return _curry1(function(a) {
          return fn(a, b);
        });
      } else if (n === 2 && b === __) {
        return _curry1(function(b) {
          return fn(a, b);
        });
      } else {
        return fn(a, b);
      }
    };
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.14.0/src/internal/_slice", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function _slice(args, from, to) {
    switch (arguments.length) {
      case 1:
        return _slice(args, 0, args.length);
      case 2:
        return _slice(args, from, args.length);
      default:
        var list = [];
        var idx = -1;
        var len = Math.max(0, Math.min(args.length, to) - from);
        while (++idx < len) {
          list[idx] = args[from + idx];
        }
        return list;
    }
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.14.0/src/arity", ["npm:ramda@0.14.0/src/internal/_curry2"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("npm:ramda@0.14.0/src/internal/_curry2");
  module.exports = _curry2(function(n, fn) {
    switch (n) {
      case 0:
        return function() {
          return fn.apply(this, arguments);
        };
      case 1:
        return function(a0) {
          void a0;
          return fn.apply(this, arguments);
        };
      case 2:
        return function(a0, a1) {
          void a1;
          return fn.apply(this, arguments);
        };
      case 3:
        return function(a0, a1, a2) {
          void a2;
          return fn.apply(this, arguments);
        };
      case 4:
        return function(a0, a1, a2, a3) {
          void a3;
          return fn.apply(this, arguments);
        };
      case 5:
        return function(a0, a1, a2, a3, a4) {
          void a4;
          return fn.apply(this, arguments);
        };
      case 6:
        return function(a0, a1, a2, a3, a4, a5) {
          void a5;
          return fn.apply(this, arguments);
        };
      case 7:
        return function(a0, a1, a2, a3, a4, a5, a6) {
          void a6;
          return fn.apply(this, arguments);
        };
      case 8:
        return function(a0, a1, a2, a3, a4, a5, a6, a7) {
          void a7;
          return fn.apply(this, arguments);
        };
      case 9:
        return function(a0, a1, a2, a3, a4, a5, a6, a7, a8) {
          void a8;
          return fn.apply(this, arguments);
        };
      case 10:
        return function(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          void a9;
          return fn.apply(this, arguments);
        };
      default:
        throw new Error('First argument to arity must be a non-negative integer no greater than ten');
    }
  });
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/keys", ["npm:ramda@0.17.1/src/internal/_curry1", "npm:ramda@0.17.1/src/internal/_has"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry1 = require("npm:ramda@0.17.1/src/internal/_curry1");
  var _has = require("npm:ramda@0.17.1/src/internal/_has");
  module.exports = (function() {
    var hasEnumBug = !({toString: null}).propertyIsEnumerable('toString');
    var nonEnumerableProps = ['constructor', 'valueOf', 'isPrototypeOf', 'toString', 'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];
    var contains = function contains(list, item) {
      var idx = 0;
      while (idx < list.length) {
        if (list[idx] === item) {
          return true;
        }
        idx += 1;
      }
      return false;
    };
    return typeof Object.keys === 'function' ? _curry1(function keys(obj) {
      return Object(obj) !== obj ? [] : Object.keys(obj);
    }) : _curry1(function keys(obj) {
      if (Object(obj) !== obj) {
        return [];
      }
      var prop,
          ks = [],
          nIdx;
      for (prop in obj) {
        if (_has(prop, obj)) {
          ks[ks.length] = prop;
        }
      }
      if (hasEnumBug) {
        nIdx = nonEnumerableProps.length - 1;
        while (nIdx >= 0) {
          prop = nonEnumerableProps[nIdx];
          if (_has(prop, obj) && !contains(ks, prop)) {
            ks[ks.length] = prop;
          }
          nIdx -= 1;
        }
      }
      return ks;
    });
  }());
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.15.1/src/curryN", ["npm:ramda@0.15.1/src/internal/_curry2", "npm:ramda@0.15.1/src/internal/_curryN", "npm:ramda@0.15.1/src/arity"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("npm:ramda@0.15.1/src/internal/_curry2");
  var _curryN = require("npm:ramda@0.15.1/src/internal/_curryN");
  var arity = require("npm:ramda@0.15.1/src/arity");
  module.exports = _curry2(function curryN(length, fn) {
    return arity(length, _curryN(length, [], fn));
  });
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/lens", ["npm:ramda@0.17.1/src/internal/_curry2", "npm:ramda@0.17.1/src/map"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("npm:ramda@0.17.1/src/internal/_curry2");
  var map = require("npm:ramda@0.17.1/src/map");
  module.exports = _curry2(function lens(getter, setter) {
    return function(f) {
      return function(s) {
        return map(function(v) {
          return setter(v, s);
        }, f(getter(s)));
      };
    };
  });
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/internal/_toString", ["npm:ramda@0.17.1/src/internal/_contains", "npm:ramda@0.17.1/src/internal/_map", "npm:ramda@0.17.1/src/internal/_quote", "npm:ramda@0.17.1/src/internal/_toISOString", "npm:ramda@0.17.1/src/keys", "npm:ramda@0.17.1/src/reject", "npm:ramda@0.17.1/src/test"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _contains = require("npm:ramda@0.17.1/src/internal/_contains");
  var _map = require("npm:ramda@0.17.1/src/internal/_map");
  var _quote = require("npm:ramda@0.17.1/src/internal/_quote");
  var _toISOString = require("npm:ramda@0.17.1/src/internal/_toISOString");
  var keys = require("npm:ramda@0.17.1/src/keys");
  var reject = require("npm:ramda@0.17.1/src/reject");
  var test = require("npm:ramda@0.17.1/src/test");
  module.exports = function _toString(x, seen) {
    var recur = function recur(y) {
      var xs = seen.concat([x]);
      return _contains(y, xs) ? '<Circular>' : _toString(y, xs);
    };
    var mapPairs = function(obj, keys) {
      return _map(function(k) {
        return _quote(k) + ': ' + recur(obj[k]);
      }, keys.slice().sort());
    };
    switch (Object.prototype.toString.call(x)) {
      case '[object Arguments]':
        return '(function() { return arguments; }(' + _map(recur, x).join(', ') + '))';
      case '[object Array]':
        return '[' + _map(recur, x).concat(mapPairs(x, reject(test(/^\d+$/), keys(x)))).join(', ') + ']';
      case '[object Boolean]':
        return typeof x === 'object' ? 'new Boolean(' + recur(x.valueOf()) + ')' : x.toString();
      case '[object Date]':
        return 'new Date(' + _quote(_toISOString(x)) + ')';
      case '[object Null]':
        return 'null';
      case '[object Number]':
        return typeof x === 'object' ? 'new Number(' + recur(x.valueOf()) + ')' : 1 / x === -Infinity ? '-0' : x.toString(10);
      case '[object String]':
        return typeof x === 'object' ? 'new String(' + recur(x.valueOf()) + ')' : _quote(x);
      case '[object Undefined]':
        return 'undefined';
      default:
        return (typeof x.constructor === 'function' && x.constructor.name !== 'Object' && typeof x.toString === 'function' && x.toString() !== '[object Object]') ? x.toString() : '{' + mapPairs(x, keys(x)).join(', ') + '}';
    }
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/reduce", ["npm:ramda@0.17.1/src/internal/_curry3", "npm:ramda@0.17.1/src/internal/_reduce"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry3 = require("npm:ramda@0.17.1/src/internal/_curry3");
  var _reduce = require("npm:ramda@0.17.1/src/internal/_reduce");
  module.exports = _curry3(_reduce);
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/internal/_pipe", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function _pipe(f, g) {
    return function() {
      return g.call(this, f.apply(this, arguments));
    };
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/internal/_curryN", ["npm:ramda@0.17.1/src/internal/_arity"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _arity = require("npm:ramda@0.17.1/src/internal/_arity");
  module.exports = function _curryN(length, received, fn) {
    return function() {
      var combined = [];
      var argsIdx = 0;
      var left = length;
      var combinedIdx = 0;
      while (combinedIdx < received.length || argsIdx < arguments.length) {
        var result;
        if (combinedIdx < received.length && (received[combinedIdx] == null || received[combinedIdx]['@@functional/placeholder'] !== true || argsIdx >= arguments.length)) {
          result = received[combinedIdx];
        } else {
          result = arguments[argsIdx];
          argsIdx += 1;
        }
        combined[combinedIdx] = result;
        if (result == null || result['@@functional/placeholder'] !== true) {
          left -= 1;
        }
        combinedIdx += 1;
      }
      return left <= 0 ? fn.apply(this, combined) : _arity(left, _curryN(length, combined, fn));
    };
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/tail", ["npm:ramda@0.17.1/src/internal/_checkForMethod", "npm:ramda@0.17.1/src/slice"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _checkForMethod = require("npm:ramda@0.17.1/src/internal/_checkForMethod");
  var slice = require("npm:ramda@0.17.1/src/slice");
  module.exports = _checkForMethod('tail', slice(1, Infinity));
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/internal/_isArray", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = Array.isArray || function _isArray(val) {
    return (val != null && val.length >= 0 && Object.prototype.toString.call(val) === '[object Array]');
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/internal/_isTransformer", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function _isTransformer(obj) {
    return typeof obj['@@transducer/step'] === 'function';
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/internal/_arity", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function _arity(n, fn) {
    switch (n) {
      case 0:
        return function() {
          return fn.apply(this, arguments);
        };
      case 1:
        return function(a0) {
          return fn.apply(this, arguments);
        };
      case 2:
        return function(a0, a1) {
          return fn.apply(this, arguments);
        };
      case 3:
        return function(a0, a1, a2) {
          return fn.apply(this, arguments);
        };
      case 4:
        return function(a0, a1, a2, a3) {
          return fn.apply(this, arguments);
        };
      case 5:
        return function(a0, a1, a2, a3, a4) {
          return fn.apply(this, arguments);
        };
      case 6:
        return function(a0, a1, a2, a3, a4, a5) {
          return fn.apply(this, arguments);
        };
      case 7:
        return function(a0, a1, a2, a3, a4, a5, a6) {
          return fn.apply(this, arguments);
        };
      case 8:
        return function(a0, a1, a2, a3, a4, a5, a6, a7) {
          return fn.apply(this, arguments);
        };
      case 9:
        return function(a0, a1, a2, a3, a4, a5, a6, a7, a8) {
          return fn.apply(this, arguments);
        };
      case 10:
        return function(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          return fn.apply(this, arguments);
        };
      default:
        throw new Error('First argument to _arity must be a non-negative integer no greater than ten');
    }
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/internal/_xfBase", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = {
    init: function() {
      return this.xf['@@transducer/init']();
    },
    result: function(result) {
      return this.xf['@@transducer/result'](result);
    }
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/internal/_flatCat", ["npm:ramda@0.17.1/src/internal/_forceReduced", "npm:ramda@0.17.1/src/internal/_reduce", "npm:ramda@0.17.1/src/internal/_xfBase", "npm:ramda@0.17.1/src/isArrayLike"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _forceReduced = require("npm:ramda@0.17.1/src/internal/_forceReduced");
  var _reduce = require("npm:ramda@0.17.1/src/internal/_reduce");
  var _xfBase = require("npm:ramda@0.17.1/src/internal/_xfBase");
  var isArrayLike = require("npm:ramda@0.17.1/src/isArrayLike");
  module.exports = (function() {
    var preservingReduced = function(xf) {
      return {
        '@@transducer/init': _xfBase.init,
        '@@transducer/result': function(result) {
          return xf['@@transducer/result'](result);
        },
        '@@transducer/step': function(result, input) {
          var ret = xf['@@transducer/step'](result, input);
          return ret['@@transducer/reduced'] ? _forceReduced(ret) : ret;
        }
      };
    };
    return function _xcat(xf) {
      var rxf = preservingReduced(xf);
      return {
        '@@transducer/init': _xfBase.init,
        '@@transducer/result': function(result) {
          return rxf['@@transducer/result'](result);
        },
        '@@transducer/step': function(result, input) {
          return !isArrayLike(input) ? _reduce(rxf, result, [input]) : _reduce(rxf, result, input);
        }
      };
    };
  }());
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/identical", ["npm:ramda@0.17.1/src/internal/_curry2"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("npm:ramda@0.17.1/src/internal/_curry2");
  module.exports = _curry2(function identical(a, b) {
    if (a === b) {
      return a !== 0 || 1 / a === 1 / b;
    } else {
      return a !== a && b !== b;
    }
  });
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/internal/_makeFlat", ["npm:ramda@0.17.1/src/isArrayLike"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var isArrayLike = require("npm:ramda@0.17.1/src/isArrayLike");
  module.exports = function _makeFlat(recursive) {
    return function flatt(list) {
      var value,
          result = [],
          idx = 0,
          j,
          ilen = list.length,
          jlen;
      while (idx < ilen) {
        if (isArrayLike(list[idx])) {
          value = recursive ? flatt(list[idx]) : list[idx];
          j = 0;
          jlen = value.length;
          while (j < jlen) {
            result[result.length] = value[j];
            j += 1;
          }
        } else {
          result[result.length] = list[idx];
        }
        idx += 1;
      }
      return result;
    };
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/internal/_has", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function _has(prop, obj) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("github:jspm/nodelibs-process@0.1.1/index", ["npm:process@0.10.1"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = System._nodeRequire ? process : require("npm:process@0.10.1");
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/internal/_xall", ["npm:ramda@0.17.1/src/internal/_curry2", "npm:ramda@0.17.1/src/internal/_reduced", "npm:ramda@0.17.1/src/internal/_xfBase"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("npm:ramda@0.17.1/src/internal/_curry2");
  var _reduced = require("npm:ramda@0.17.1/src/internal/_reduced");
  var _xfBase = require("npm:ramda@0.17.1/src/internal/_xfBase");
  module.exports = (function() {
    function XAll(f, xf) {
      this.xf = xf;
      this.f = f;
      this.all = true;
    }
    XAll.prototype['@@transducer/init'] = _xfBase.init;
    XAll.prototype['@@transducer/result'] = function(result) {
      if (this.all) {
        result = this.xf['@@transducer/step'](result, true);
      }
      return this.xf['@@transducer/result'](result);
    };
    XAll.prototype['@@transducer/step'] = function(result, input) {
      if (!this.f(input)) {
        this.all = false;
        result = _reduced(this.xf['@@transducer/step'](result, false));
      }
      return result;
    };
    return _curry2(function _xall(f, xf) {
      return new XAll(f, xf);
    });
  })();
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/type", ["npm:ramda@0.17.1/src/internal/_curry1"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry1 = require("npm:ramda@0.17.1/src/internal/_curry1");
  module.exports = _curry1(function type(val) {
    return val === null ? 'Null' : val === undefined ? 'Undefined' : Object.prototype.toString.call(val).slice(8, -1);
  });
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/pluck", ["npm:ramda@0.17.1/src/internal/_curry2", "npm:ramda@0.17.1/src/map", "npm:ramda@0.17.1/src/prop"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("npm:ramda@0.17.1/src/internal/_curry2");
  var map = require("npm:ramda@0.17.1/src/map");
  var prop = require("npm:ramda@0.17.1/src/prop");
  module.exports = _curry2(function pluck(p, list) {
    return map(prop(p), list);
  });
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/dist/ramda", ["github:jspm/nodelibs-process@0.1.1"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  "format cjs";
  (function(process) {
    ;
    (function() {
      'use strict';
      var __ = {'@@functional/placeholder': true};
      var _arity = function _arity(n, fn) {
        switch (n) {
          case 0:
            return function() {
              return fn.apply(this, arguments);
            };
          case 1:
            return function(a0) {
              return fn.apply(this, arguments);
            };
          case 2:
            return function(a0, a1) {
              return fn.apply(this, arguments);
            };
          case 3:
            return function(a0, a1, a2) {
              return fn.apply(this, arguments);
            };
          case 4:
            return function(a0, a1, a2, a3) {
              return fn.apply(this, arguments);
            };
          case 5:
            return function(a0, a1, a2, a3, a4) {
              return fn.apply(this, arguments);
            };
          case 6:
            return function(a0, a1, a2, a3, a4, a5) {
              return fn.apply(this, arguments);
            };
          case 7:
            return function(a0, a1, a2, a3, a4, a5, a6) {
              return fn.apply(this, arguments);
            };
          case 8:
            return function(a0, a1, a2, a3, a4, a5, a6, a7) {
              return fn.apply(this, arguments);
            };
          case 9:
            return function(a0, a1, a2, a3, a4, a5, a6, a7, a8) {
              return fn.apply(this, arguments);
            };
          case 10:
            return function(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
              return fn.apply(this, arguments);
            };
          default:
            throw new Error('First argument to _arity must be a non-negative integer no greater than ten');
        }
      };
      var _cloneRegExp = function _cloneRegExp(pattern) {
        return new RegExp(pattern.source, (pattern.global ? 'g' : '') + (pattern.ignoreCase ? 'i' : '') + (pattern.multiline ? 'm' : '') + (pattern.sticky ? 'y' : '') + (pattern.unicode ? 'u' : ''));
      };
      var _complement = function _complement(f) {
        return function() {
          return !f.apply(this, arguments);
        };
      };
      var _concat = function _concat(set1, set2) {
        set1 = set1 || [];
        set2 = set2 || [];
        var idx;
        var len1 = set1.length;
        var len2 = set2.length;
        var result = [];
        idx = 0;
        while (idx < len1) {
          result[result.length] = set1[idx];
          idx += 1;
        }
        idx = 0;
        while (idx < len2) {
          result[result.length] = set2[idx];
          idx += 1;
        }
        return result;
      };
      var _containsWith = function _containsWith(pred, x, list) {
        var idx = 0,
            len = list.length;
        while (idx < len) {
          if (pred(x, list[idx])) {
            return true;
          }
          idx += 1;
        }
        return false;
      };
      var _curry1 = function _curry1(fn) {
        return function f1(a) {
          if (arguments.length === 0) {
            return f1;
          } else if (a != null && a['@@functional/placeholder'] === true) {
            return f1;
          } else {
            return fn.apply(this, arguments);
          }
        };
      };
      var _curry2 = function _curry2(fn) {
        return function f2(a, b) {
          var n = arguments.length;
          if (n === 0) {
            return f2;
          } else if (n === 1 && a != null && a['@@functional/placeholder'] === true) {
            return f2;
          } else if (n === 1) {
            return _curry1(function(b) {
              return fn(a, b);
            });
          } else if (n === 2 && a != null && a['@@functional/placeholder'] === true && b != null && b['@@functional/placeholder'] === true) {
            return f2;
          } else if (n === 2 && a != null && a['@@functional/placeholder'] === true) {
            return _curry1(function(a) {
              return fn(a, b);
            });
          } else if (n === 2 && b != null && b['@@functional/placeholder'] === true) {
            return _curry1(function(b) {
              return fn(a, b);
            });
          } else {
            return fn(a, b);
          }
        };
      };
      var _curry3 = function _curry3(fn) {
        return function f3(a, b, c) {
          var n = arguments.length;
          if (n === 0) {
            return f3;
          } else if (n === 1 && a != null && a['@@functional/placeholder'] === true) {
            return f3;
          } else if (n === 1) {
            return _curry2(function(b, c) {
              return fn(a, b, c);
            });
          } else if (n === 2 && a != null && a['@@functional/placeholder'] === true && b != null && b['@@functional/placeholder'] === true) {
            return f3;
          } else if (n === 2 && a != null && a['@@functional/placeholder'] === true) {
            return _curry2(function(a, c) {
              return fn(a, b, c);
            });
          } else if (n === 2 && b != null && b['@@functional/placeholder'] === true) {
            return _curry2(function(b, c) {
              return fn(a, b, c);
            });
          } else if (n === 2) {
            return _curry1(function(c) {
              return fn(a, b, c);
            });
          } else if (n === 3 && a != null && a['@@functional/placeholder'] === true && b != null && b['@@functional/placeholder'] === true && c != null && c['@@functional/placeholder'] === true) {
            return f3;
          } else if (n === 3 && a != null && a['@@functional/placeholder'] === true && b != null && b['@@functional/placeholder'] === true) {
            return _curry2(function(a, b) {
              return fn(a, b, c);
            });
          } else if (n === 3 && a != null && a['@@functional/placeholder'] === true && c != null && c['@@functional/placeholder'] === true) {
            return _curry2(function(a, c) {
              return fn(a, b, c);
            });
          } else if (n === 3 && b != null && b['@@functional/placeholder'] === true && c != null && c['@@functional/placeholder'] === true) {
            return _curry2(function(b, c) {
              return fn(a, b, c);
            });
          } else if (n === 3 && a != null && a['@@functional/placeholder'] === true) {
            return _curry1(function(a) {
              return fn(a, b, c);
            });
          } else if (n === 3 && b != null && b['@@functional/placeholder'] === true) {
            return _curry1(function(b) {
              return fn(a, b, c);
            });
          } else if (n === 3 && c != null && c['@@functional/placeholder'] === true) {
            return _curry1(function(c) {
              return fn(a, b, c);
            });
          } else {
            return fn(a, b, c);
          }
        };
      };
      var _curryN = function _curryN(length, received, fn) {
        return function() {
          var combined = [];
          var argsIdx = 0;
          var left = length;
          var combinedIdx = 0;
          while (combinedIdx < received.length || argsIdx < arguments.length) {
            var result;
            if (combinedIdx < received.length && (received[combinedIdx] == null || received[combinedIdx]['@@functional/placeholder'] !== true || argsIdx >= arguments.length)) {
              result = received[combinedIdx];
            } else {
              result = arguments[argsIdx];
              argsIdx += 1;
            }
            combined[combinedIdx] = result;
            if (result == null || result['@@functional/placeholder'] !== true) {
              left -= 1;
            }
            combinedIdx += 1;
          }
          return left <= 0 ? fn.apply(this, combined) : _arity(left, _curryN(length, combined, fn));
        };
      };
      var _filter = function _filter(fn, list) {
        var idx = 0,
            len = list.length,
            result = [];
        while (idx < len) {
          if (fn(list[idx])) {
            result[result.length] = list[idx];
          }
          idx += 1;
        }
        return result;
      };
      var _forceReduced = function _forceReduced(x) {
        return {
          '@@transducer/value': x,
          '@@transducer/reduced': true
        };
      };
      var _functionsWith = function _functionsWith(fn) {
        return function(obj) {
          return _filter(function(key) {
            return typeof obj[key] === 'function';
          }, fn(obj));
        };
      };
      var _has = function _has(prop, obj) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
      };
      var _identity = function _identity(x) {
        return x;
      };
      var _isArray = Array.isArray || function _isArray(val) {
        return val != null && val.length >= 0 && Object.prototype.toString.call(val) === '[object Array]';
      };
      var _isInteger = Number.isInteger || function _isInteger(n) {
        return n << 0 === n;
      };
      var _isNumber = function _isNumber(x) {
        return Object.prototype.toString.call(x) === '[object Number]';
      };
      var _isString = function _isString(x) {
        return Object.prototype.toString.call(x) === '[object String]';
      };
      var _isTransformer = function _isTransformer(obj) {
        return typeof obj['@@transducer/step'] === 'function';
      };
      var _map = function _map(fn, list) {
        var idx = 0,
            len = list.length,
            result = Array(len);
        while (idx < len) {
          result[idx] = fn(list[idx]);
          idx += 1;
        }
        return result;
      };
      var _pipe = function _pipe(f, g) {
        return function() {
          return g.call(this, f.apply(this, arguments));
        };
      };
      var _pipeP = function _pipeP(f, g) {
        return function() {
          var ctx = this;
          return f.apply(ctx, arguments).then(function(x) {
            return g.call(ctx, x);
          });
        };
      };
      var _quote = function _quote(s) {
        return '"' + s.replace(/"/g, '\\"') + '"';
      };
      var _reduced = function _reduced(x) {
        return x && x['@@transducer/reduced'] ? x : {
          '@@transducer/value': x,
          '@@transducer/reduced': true
        };
      };
      var _slice = function _slice(args, from, to) {
        switch (arguments.length) {
          case 1:
            return _slice(args, 0, args.length);
          case 2:
            return _slice(args, from, args.length);
          default:
            var list = [];
            var idx = 0;
            var len = Math.max(0, Math.min(args.length, to) - from);
            while (idx < len) {
              list[idx] = args[from + idx];
              idx += 1;
            }
            return list;
        }
      };
      var _toISOString = function() {
        var pad = function pad(n) {
          return (n < 10 ? '0' : '') + n;
        };
        return typeof Date.prototype.toISOString === 'function' ? function _toISOString(d) {
          return d.toISOString();
        } : function _toISOString(d) {
          return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + '.' + (d.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) + 'Z';
        };
      }();
      var _xdropRepeatsWith = function() {
        function XDropRepeatsWith(pred, xf) {
          this.xf = xf;
          this.pred = pred;
          this.lastValue = undefined;
          this.seenFirstValue = false;
        }
        XDropRepeatsWith.prototype['@@transducer/init'] = function() {
          return this.xf['@@transducer/init']();
        };
        XDropRepeatsWith.prototype['@@transducer/result'] = function(result) {
          return this.xf['@@transducer/result'](result);
        };
        XDropRepeatsWith.prototype['@@transducer/step'] = function(result, input) {
          var sameAsLast = false;
          if (!this.seenFirstValue) {
            this.seenFirstValue = true;
          } else if (this.pred(this.lastValue, input)) {
            sameAsLast = true;
          }
          this.lastValue = input;
          return sameAsLast ? result : this.xf['@@transducer/step'](result, input);
        };
        return _curry2(function _xdropRepeatsWith(pred, xf) {
          return new XDropRepeatsWith(pred, xf);
        });
      }();
      var _xfBase = {
        init: function() {
          return this.xf['@@transducer/init']();
        },
        result: function(result) {
          return this.xf['@@transducer/result'](result);
        }
      };
      var _xfilter = function() {
        function XFilter(f, xf) {
          this.xf = xf;
          this.f = f;
        }
        XFilter.prototype['@@transducer/init'] = _xfBase.init;
        XFilter.prototype['@@transducer/result'] = _xfBase.result;
        XFilter.prototype['@@transducer/step'] = function(result, input) {
          return this.f(input) ? this.xf['@@transducer/step'](result, input) : result;
        };
        return _curry2(function _xfilter(f, xf) {
          return new XFilter(f, xf);
        });
      }();
      var _xfind = function() {
        function XFind(f, xf) {
          this.xf = xf;
          this.f = f;
          this.found = false;
        }
        XFind.prototype['@@transducer/init'] = _xfBase.init;
        XFind.prototype['@@transducer/result'] = function(result) {
          if (!this.found) {
            result = this.xf['@@transducer/step'](result, void 0);
          }
          return this.xf['@@transducer/result'](result);
        };
        XFind.prototype['@@transducer/step'] = function(result, input) {
          if (this.f(input)) {
            this.found = true;
            result = _reduced(this.xf['@@transducer/step'](result, input));
          }
          return result;
        };
        return _curry2(function _xfind(f, xf) {
          return new XFind(f, xf);
        });
      }();
      var _xfindIndex = function() {
        function XFindIndex(f, xf) {
          this.xf = xf;
          this.f = f;
          this.idx = -1;
          this.found = false;
        }
        XFindIndex.prototype['@@transducer/init'] = _xfBase.init;
        XFindIndex.prototype['@@transducer/result'] = function(result) {
          if (!this.found) {
            result = this.xf['@@transducer/step'](result, -1);
          }
          return this.xf['@@transducer/result'](result);
        };
        XFindIndex.prototype['@@transducer/step'] = function(result, input) {
          this.idx += 1;
          if (this.f(input)) {
            this.found = true;
            result = _reduced(this.xf['@@transducer/step'](result, this.idx));
          }
          return result;
        };
        return _curry2(function _xfindIndex(f, xf) {
          return new XFindIndex(f, xf);
        });
      }();
      var _xfindLast = function() {
        function XFindLast(f, xf) {
          this.xf = xf;
          this.f = f;
        }
        XFindLast.prototype['@@transducer/init'] = _xfBase.init;
        XFindLast.prototype['@@transducer/result'] = function(result) {
          return this.xf['@@transducer/result'](this.xf['@@transducer/step'](result, this.last));
        };
        XFindLast.prototype['@@transducer/step'] = function(result, input) {
          if (this.f(input)) {
            this.last = input;
          }
          return result;
        };
        return _curry2(function _xfindLast(f, xf) {
          return new XFindLast(f, xf);
        });
      }();
      var _xfindLastIndex = function() {
        function XFindLastIndex(f, xf) {
          this.xf = xf;
          this.f = f;
          this.idx = -1;
          this.lastIdx = -1;
        }
        XFindLastIndex.prototype['@@transducer/init'] = _xfBase.init;
        XFindLastIndex.prototype['@@transducer/result'] = function(result) {
          return this.xf['@@transducer/result'](this.xf['@@transducer/step'](result, this.lastIdx));
        };
        XFindLastIndex.prototype['@@transducer/step'] = function(result, input) {
          this.idx += 1;
          if (this.f(input)) {
            this.lastIdx = this.idx;
          }
          return result;
        };
        return _curry2(function _xfindLastIndex(f, xf) {
          return new XFindLastIndex(f, xf);
        });
      }();
      var _xmap = function() {
        function XMap(f, xf) {
          this.xf = xf;
          this.f = f;
        }
        XMap.prototype['@@transducer/init'] = _xfBase.init;
        XMap.prototype['@@transducer/result'] = _xfBase.result;
        XMap.prototype['@@transducer/step'] = function(result, input) {
          return this.xf['@@transducer/step'](result, this.f(input));
        };
        return _curry2(function _xmap(f, xf) {
          return new XMap(f, xf);
        });
      }();
      var _xtake = function() {
        function XTake(n, xf) {
          this.xf = xf;
          this.n = n;
        }
        XTake.prototype['@@transducer/init'] = _xfBase.init;
        XTake.prototype['@@transducer/result'] = _xfBase.result;
        XTake.prototype['@@transducer/step'] = function(result, input) {
          if (this.n === 0) {
            return _reduced(result);
          } else {
            this.n -= 1;
            return this.xf['@@transducer/step'](result, input);
          }
        };
        return _curry2(function _xtake(n, xf) {
          return new XTake(n, xf);
        });
      }();
      var _xtakeWhile = function() {
        function XTakeWhile(f, xf) {
          this.xf = xf;
          this.f = f;
        }
        XTakeWhile.prototype['@@transducer/init'] = _xfBase.init;
        XTakeWhile.prototype['@@transducer/result'] = _xfBase.result;
        XTakeWhile.prototype['@@transducer/step'] = function(result, input) {
          return this.f(input) ? this.xf['@@transducer/step'](result, input) : _reduced(result);
        };
        return _curry2(function _xtakeWhile(f, xf) {
          return new XTakeWhile(f, xf);
        });
      }();
      var _xwrap = function() {
        function XWrap(fn) {
          this.f = fn;
        }
        XWrap.prototype['@@transducer/init'] = function() {
          throw new Error('init not implemented on XWrap');
        };
        XWrap.prototype['@@transducer/result'] = function(acc) {
          return acc;
        };
        XWrap.prototype['@@transducer/step'] = function(acc, x) {
          return this.f(acc, x);
        };
        return function _xwrap(fn) {
          return new XWrap(fn);
        };
      }();
      var add = _curry2(function add(a, b) {
        return a + b;
      });
      var adjust = _curry3(function adjust(fn, idx, list) {
        if (idx >= list.length || idx < -list.length) {
          return list;
        }
        var start = idx < 0 ? list.length : 0;
        var _idx = start + idx;
        var _list = _concat(list);
        _list[_idx] = fn(list[_idx]);
        return _list;
      });
      var always = _curry1(function always(val) {
        return function() {
          return val;
        };
      });
      var aperture = _curry2(function aperture(n, list) {
        var idx = 0;
        var limit = list.length - (n - 1);
        var acc = new Array(limit >= 0 ? limit : 0);
        while (idx < limit) {
          acc[idx] = _slice(list, idx, idx + n);
          idx += 1;
        }
        return acc;
      });
      var append = _curry2(function append(el, list) {
        return _concat(list, [el]);
      });
      var apply = _curry2(function apply(fn, args) {
        return fn.apply(this, args);
      });
      var assoc = _curry3(function assoc(prop, val, obj) {
        var result = {};
        for (var p in obj) {
          result[p] = obj[p];
        }
        result[prop] = val;
        return result;
      });
      var assocPath = _curry3(function assocPath(path, val, obj) {
        switch (path.length) {
          case 0:
            return obj;
          case 1:
            return assoc(path[0], val, obj);
          default:
            return assoc(path[0], assocPath(_slice(path, 1), val, Object(obj[path[0]])), obj);
        }
      });
      var bind = _curry2(function bind(fn, thisObj) {
        return _arity(fn.length, function() {
          return fn.apply(thisObj, arguments);
        });
      });
      var both = _curry2(function both(f, g) {
        return function _both() {
          return f.apply(this, arguments) && g.apply(this, arguments);
        };
      });
      var comparator = _curry1(function comparator(pred) {
        return function(a, b) {
          return pred(a, b) ? -1 : pred(b, a) ? 1 : 0;
        };
      });
      var complement = _curry1(_complement);
      var cond = _curry1(function cond(pairs) {
        return function() {
          var idx = 0;
          while (idx < pairs.length) {
            if (pairs[idx][0].apply(this, arguments)) {
              return pairs[idx][1].apply(this, arguments);
            }
            idx += 1;
          }
        };
      });
      var containsWith = _curry3(_containsWith);
      var countBy = _curry2(function countBy(fn, list) {
        var counts = {};
        var len = list.length;
        var idx = 0;
        while (idx < len) {
          var key = fn(list[idx]);
          counts[key] = (_has(key, counts) ? counts[key] : 0) + 1;
          idx += 1;
        }
        return counts;
      });
      var createMapEntry = _curry2(function createMapEntry(key, val) {
        var obj = {};
        obj[key] = val;
        return obj;
      });
      var curryN = _curry2(function curryN(length, fn) {
        if (length === 1) {
          return _curry1(fn);
        }
        return _arity(length, _curryN(length, [], fn));
      });
      var dec = add(-1);
      var defaultTo = _curry2(function defaultTo(d, v) {
        return v == null ? d : v;
      });
      var differenceWith = _curry3(function differenceWith(pred, first, second) {
        var out = [];
        var idx = 0;
        var firstLen = first.length;
        var containsPred = containsWith(pred);
        while (idx < firstLen) {
          if (!containsPred(first[idx], second) && !containsPred(first[idx], out)) {
            out[out.length] = first[idx];
          }
          idx += 1;
        }
        return out;
      });
      var dissoc = _curry2(function dissoc(prop, obj) {
        var result = {};
        for (var p in obj) {
          if (p !== prop) {
            result[p] = obj[p];
          }
        }
        return result;
      });
      var dissocPath = _curry2(function dissocPath(path, obj) {
        switch (path.length) {
          case 0:
            return obj;
          case 1:
            return dissoc(path[0], obj);
          default:
            var head = path[0];
            var tail = _slice(path, 1);
            return obj[head] == null ? obj : assoc(head, dissocPath(tail, obj[head]), obj);
        }
      });
      var divide = _curry2(function divide(a, b) {
        return a / b;
      });
      var dropLastWhile = _curry2(function dropLastWhile(pred, list) {
        var idx = list.length - 1;
        while (idx >= 0 && pred(list[idx])) {
          idx -= 1;
        }
        return _slice(list, 0, idx + 1);
      });
      var either = _curry2(function either(f, g) {
        return function _either() {
          return f.apply(this, arguments) || g.apply(this, arguments);
        };
      });
      var empty = _curry1(function empty(x) {
        if (x != null && typeof x.empty === 'function') {
          return x.empty();
        } else if (x != null && typeof x.constructor != null && typeof x.constructor.empty === 'function') {
          return x.constructor.empty();
        } else {
          switch (Object.prototype.toString.call(x)) {
            case '[object Array]':
              return [];
            case '[object Object]':
              return {};
            case '[object String]':
              return '';
          }
        }
      });
      var evolve = _curry2(function evolve(transformations, object) {
        var transformation,
            key,
            type,
            result = {};
        for (key in object) {
          transformation = transformations[key];
          type = typeof transformation;
          result[key] = type === 'function' ? transformation(object[key]) : type === 'object' ? evolve(transformations[key], object[key]) : object[key];
        }
        return result;
      });
      var fromPairs = _curry1(function fromPairs(pairs) {
        var idx = 0,
            len = pairs.length,
            out = {};
        while (idx < len) {
          if (_isArray(pairs[idx]) && pairs[idx].length) {
            out[pairs[idx][0]] = pairs[idx][1];
          }
          idx += 1;
        }
        return out;
      });
      var gt = _curry2(function gt(a, b) {
        return a > b;
      });
      var gte = _curry2(function gte(a, b) {
        return a >= b;
      });
      var has = _curry2(_has);
      var hasIn = _curry2(function hasIn(prop, obj) {
        return prop in obj;
      });
      var identical = _curry2(function identical(a, b) {
        if (a === b) {
          return a !== 0 || 1 / a === 1 / b;
        } else {
          return a !== a && b !== b;
        }
      });
      var identity = _curry1(_identity);
      var ifElse = _curry3(function ifElse(condition, onTrue, onFalse) {
        return curryN(Math.max(condition.length, onTrue.length, onFalse.length), function _ifElse() {
          return condition.apply(this, arguments) ? onTrue.apply(this, arguments) : onFalse.apply(this, arguments);
        });
      });
      var inc = add(1);
      var insert = _curry3(function insert(idx, elt, list) {
        idx = idx < list.length && idx >= 0 ? idx : list.length;
        var result = _slice(list);
        result.splice(idx, 0, elt);
        return result;
      });
      var insertAll = _curry3(function insertAll(idx, elts, list) {
        idx = idx < list.length && idx >= 0 ? idx : list.length;
        return _concat(_concat(_slice(list, 0, idx), elts), _slice(list, idx));
      });
      var is = _curry2(function is(Ctor, val) {
        return val != null && val.constructor === Ctor || val instanceof Ctor;
      });
      var isArrayLike = _curry1(function isArrayLike(x) {
        if (_isArray(x)) {
          return true;
        }
        if (!x) {
          return false;
        }
        if (typeof x !== 'object') {
          return false;
        }
        if (x instanceof String) {
          return false;
        }
        if (x.nodeType === 1) {
          return !!x.length;
        }
        if (x.length === 0) {
          return true;
        }
        if (x.length > 0) {
          return x.hasOwnProperty(0) && x.hasOwnProperty(x.length - 1);
        }
        return false;
      });
      var isEmpty = _curry1(function isEmpty(list) {
        return Object(list).length === 0;
      });
      var isNil = _curry1(function isNil(x) {
        return x == null;
      });
      var keys = function() {
        var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
        var nonEnumerableProps = ['constructor', 'valueOf', 'isPrototypeOf', 'toString', 'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];
        var contains = function contains(list, item) {
          var idx = 0;
          while (idx < list.length) {
            if (list[idx] === item) {
              return true;
            }
            idx += 1;
          }
          return false;
        };
        return typeof Object.keys === 'function' ? _curry1(function keys(obj) {
          return Object(obj) !== obj ? [] : Object.keys(obj);
        }) : _curry1(function keys(obj) {
          if (Object(obj) !== obj) {
            return [];
          }
          var prop,
              ks = [],
              nIdx;
          for (prop in obj) {
            if (_has(prop, obj)) {
              ks[ks.length] = prop;
            }
          }
          if (hasEnumBug) {
            nIdx = nonEnumerableProps.length - 1;
            while (nIdx >= 0) {
              prop = nonEnumerableProps[nIdx];
              if (_has(prop, obj) && !contains(ks, prop)) {
                ks[ks.length] = prop;
              }
              nIdx -= 1;
            }
          }
          return ks;
        });
      }();
      var keysIn = _curry1(function keysIn(obj) {
        var prop,
            ks = [];
        for (prop in obj) {
          ks[ks.length] = prop;
        }
        return ks;
      });
      var length = _curry1(function length(list) {
        return list != null && is(Number, list.length) ? list.length : NaN;
      });
      var lt = _curry2(function lt(a, b) {
        return a < b;
      });
      var lte = _curry2(function lte(a, b) {
        return a <= b;
      });
      var mapAccum = _curry3(function mapAccum(fn, acc, list) {
        var idx = 0,
            len = list.length,
            result = [],
            tuple = [acc];
        while (idx < len) {
          tuple = fn(tuple[0], list[idx]);
          result[idx] = tuple[1];
          idx += 1;
        }
        return [tuple[0], result];
      });
      var mapAccumRight = _curry3(function mapAccumRight(fn, acc, list) {
        var idx = list.length - 1,
            result = [],
            tuple = [acc];
        while (idx >= 0) {
          tuple = fn(tuple[0], list[idx]);
          result[idx] = tuple[1];
          idx -= 1;
        }
        return [tuple[0], result];
      });
      var match = _curry2(function match(rx, str) {
        return str.match(rx) || [];
      });
      var mathMod = _curry2(function mathMod(m, p) {
        if (!_isInteger(m)) {
          return NaN;
        }
        if (!_isInteger(p) || p < 1) {
          return NaN;
        }
        return (m % p + p) % p;
      });
      var max = _curry2(function max(a, b) {
        return b > a ? b : a;
      });
      var maxBy = _curry3(function maxBy(f, a, b) {
        return f(b) > f(a) ? b : a;
      });
      var merge = _curry2(function merge(a, b) {
        var result = {};
        var ks = keys(a);
        var idx = 0;
        while (idx < ks.length) {
          result[ks[idx]] = a[ks[idx]];
          idx += 1;
        }
        ks = keys(b);
        idx = 0;
        while (idx < ks.length) {
          result[ks[idx]] = b[ks[idx]];
          idx += 1;
        }
        return result;
      });
      var min = _curry2(function min(a, b) {
        return b < a ? b : a;
      });
      var minBy = _curry3(function minBy(f, a, b) {
        return f(b) < f(a) ? b : a;
      });
      var modulo = _curry2(function modulo(a, b) {
        return a % b;
      });
      var multiply = _curry2(function multiply(a, b) {
        return a * b;
      });
      var nAry = _curry2(function nAry(n, fn) {
        switch (n) {
          case 0:
            return function() {
              return fn.call(this);
            };
          case 1:
            return function(a0) {
              return fn.call(this, a0);
            };
          case 2:
            return function(a0, a1) {
              return fn.call(this, a0, a1);
            };
          case 3:
            return function(a0, a1, a2) {
              return fn.call(this, a0, a1, a2);
            };
          case 4:
            return function(a0, a1, a2, a3) {
              return fn.call(this, a0, a1, a2, a3);
            };
          case 5:
            return function(a0, a1, a2, a3, a4) {
              return fn.call(this, a0, a1, a2, a3, a4);
            };
          case 6:
            return function(a0, a1, a2, a3, a4, a5) {
              return fn.call(this, a0, a1, a2, a3, a4, a5);
            };
          case 7:
            return function(a0, a1, a2, a3, a4, a5, a6) {
              return fn.call(this, a0, a1, a2, a3, a4, a5, a6);
            };
          case 8:
            return function(a0, a1, a2, a3, a4, a5, a6, a7) {
              return fn.call(this, a0, a1, a2, a3, a4, a5, a6, a7);
            };
          case 9:
            return function(a0, a1, a2, a3, a4, a5, a6, a7, a8) {
              return fn.call(this, a0, a1, a2, a3, a4, a5, a6, a7, a8);
            };
          case 10:
            return function(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
              return fn.call(this, a0, a1, a2, a3, a4, a5, a6, a7, a8, a9);
            };
          default:
            throw new Error('First argument to nAry must be a non-negative integer no greater than ten');
        }
      });
      var negate = _curry1(function negate(n) {
        return -n;
      });
      var not = _curry1(function not(a) {
        return !a;
      });
      var nth = _curry2(function nth(offset, list) {
        var idx = offset < 0 ? list.length + offset : offset;
        return _isString(list) ? list.charAt(idx) : list[idx];
      });
      var nthArg = _curry1(function nthArg(n) {
        return function() {
          return nth(n, arguments);
        };
      });
      var nthChar = _curry2(function nthChar(n, str) {
        return str.charAt(n < 0 ? str.length + n : n);
      });
      var nthCharCode = _curry2(function nthCharCode(n, str) {
        return str.charCodeAt(n < 0 ? str.length + n : n);
      });
      var of = _curry1(function of(x) {
        return [x];
      });
      var once = _curry1(function once(fn) {
        var called = false,
            result;
        return function() {
          if (called) {
            return result;
          }
          called = true;
          result = fn.apply(this, arguments);
          return result;
        };
      });
      var over = function() {
        var Identity = function(x) {
          return {
            value: x,
            map: function(f) {
              return Identity(f(x));
            }
          };
        };
        return _curry3(function over(lens, f, x) {
          return lens(function(y) {
            return Identity(f(y));
          })(x).value;
        });
      }();
      var path = _curry2(function path(paths, obj) {
        if (obj == null) {
          return;
        } else {
          var val = obj;
          for (var idx = 0,
              len = paths.length; idx < len && val != null; idx += 1) {
            val = val[paths[idx]];
          }
          return val;
        }
      });
      var pick = _curry2(function pick(names, obj) {
        var result = {};
        var idx = 0;
        while (idx < names.length) {
          if (names[idx] in obj) {
            result[names[idx]] = obj[names[idx]];
          }
          idx += 1;
        }
        return result;
      });
      var pickAll = _curry2(function pickAll(names, obj) {
        var result = {};
        var idx = 0;
        var len = names.length;
        while (idx < len) {
          var name = names[idx];
          result[name] = obj[name];
          idx += 1;
        }
        return result;
      });
      var pickBy = _curry2(function pickBy(test, obj) {
        var result = {};
        for (var prop in obj) {
          if (test(obj[prop], prop, obj)) {
            result[prop] = obj[prop];
          }
        }
        return result;
      });
      var prepend = _curry2(function prepend(el, list) {
        return _concat([el], list);
      });
      var prop = _curry2(function prop(p, obj) {
        return obj[p];
      });
      var propOr = _curry3(function propOr(val, p, obj) {
        return obj != null && _has(p, obj) ? obj[p] : val;
      });
      var propSatisfies = _curry3(function propSatisfies(pred, name, obj) {
        return pred(obj[name]);
      });
      var props = _curry2(function props(ps, obj) {
        var len = ps.length;
        var out = [];
        var idx = 0;
        while (idx < len) {
          out[idx] = obj[ps[idx]];
          idx += 1;
        }
        return out;
      });
      var range = _curry2(function range(from, to) {
        if (!(_isNumber(from) && _isNumber(to))) {
          throw new TypeError('Both arguments to range must be numbers');
        }
        var result = [];
        var n = from;
        while (n < to) {
          result.push(n);
          n += 1;
        }
        return result;
      });
      var reduceRight = _curry3(function reduceRight(fn, acc, list) {
        var idx = list.length - 1;
        while (idx >= 0) {
          acc = fn(acc, list[idx]);
          idx -= 1;
        }
        return acc;
      });
      var reduced = _curry1(_reduced);
      var remove = _curry3(function remove(start, count, list) {
        return _concat(_slice(list, 0, Math.min(start, list.length)), _slice(list, Math.min(list.length, start + count)));
      });
      var replace = _curry3(function replace(regex, replacement, str) {
        return str.replace(regex, replacement);
      });
      var reverse = _curry1(function reverse(list) {
        return _slice(list).reverse();
      });
      var scan = _curry3(function scan(fn, acc, list) {
        var idx = 0,
            len = list.length,
            result = [acc];
        while (idx < len) {
          acc = fn(acc, list[idx]);
          result[idx + 1] = acc;
          idx += 1;
        }
        return result;
      });
      var set = _curry3(function set(lens, v, x) {
        return over(lens, always(v), x);
      });
      var sort = _curry2(function sort(comparator, list) {
        return _slice(list).sort(comparator);
      });
      var sortBy = _curry2(function sortBy(fn, list) {
        return _slice(list).sort(function(a, b) {
          var aa = fn(a);
          var bb = fn(b);
          return aa < bb ? -1 : aa > bb ? 1 : 0;
        });
      });
      var subtract = _curry2(function subtract(a, b) {
        return a - b;
      });
      var takeLastWhile = _curry2(function takeLastWhile(fn, list) {
        var idx = list.length - 1;
        while (idx >= 0 && fn(list[idx])) {
          idx -= 1;
        }
        return _slice(list, idx + 1, Infinity);
      });
      var tap = _curry2(function tap(fn, x) {
        fn(x);
        return x;
      });
      var test = _curry2(function test(pattern, str) {
        return _cloneRegExp(pattern).test(str);
      });
      var times = _curry2(function times(fn, n) {
        var len = Number(n);
        var list = new Array(len);
        var idx = 0;
        while (idx < len) {
          list[idx] = fn(idx);
          idx += 1;
        }
        return list;
      });
      var toPairs = _curry1(function toPairs(obj) {
        var pairs = [];
        for (var prop in obj) {
          if (_has(prop, obj)) {
            pairs[pairs.length] = [prop, obj[prop]];
          }
        }
        return pairs;
      });
      var toPairsIn = _curry1(function toPairsIn(obj) {
        var pairs = [];
        for (var prop in obj) {
          pairs[pairs.length] = [prop, obj[prop]];
        }
        return pairs;
      });
      var trim = function() {
        var ws = '\t\n\x0B\f\r \xA0\u1680\u180E\u2000\u2001\u2002\u2003' + '\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028' + '\u2029\uFEFF';
        var zeroWidth = '\u200B';
        var hasProtoTrim = typeof String.prototype.trim === 'function';
        if (!hasProtoTrim || (ws.trim() || !zeroWidth.trim())) {
          return _curry1(function trim(str) {
            var beginRx = new RegExp('^[' + ws + '][' + ws + ']*');
            var endRx = new RegExp('[' + ws + '][' + ws + ']*$');
            return str.replace(beginRx, '').replace(endRx, '');
          });
        } else {
          return _curry1(function trim(str) {
            return str.trim();
          });
        }
      }();
      var type = _curry1(function type(val) {
        return val === null ? 'Null' : val === undefined ? 'Undefined' : Object.prototype.toString.call(val).slice(8, -1);
      });
      var unapply = _curry1(function unapply(fn) {
        return function() {
          return fn(_slice(arguments));
        };
      });
      var unary = _curry1(function unary(fn) {
        return nAry(1, fn);
      });
      var uncurryN = _curry2(function uncurryN(depth, fn) {
        return curryN(depth, function() {
          var currentDepth = 1;
          var value = fn;
          var idx = 0;
          var endIdx;
          while (currentDepth <= depth && typeof value === 'function') {
            endIdx = currentDepth === depth ? arguments.length : idx + value.length;
            value = value.apply(this, _slice(arguments, idx, endIdx));
            currentDepth += 1;
            idx = endIdx;
          }
          return value;
        });
      });
      var unfold = _curry2(function unfold(fn, seed) {
        var pair = fn(seed);
        var result = [];
        while (pair && pair.length) {
          result[result.length] = pair[0];
          pair = fn(pair[1]);
        }
        return result;
      });
      var uniqWith = _curry2(function uniqWith(pred, list) {
        var idx = 0,
            len = list.length;
        var result = [],
            item;
        while (idx < len) {
          item = list[idx];
          if (!_containsWith(pred, item, result)) {
            result[result.length] = item;
          }
          idx += 1;
        }
        return result;
      });
      var update = _curry3(function update(idx, x, list) {
        return adjust(always(x), idx, list);
      });
      var values = _curry1(function values(obj) {
        var props = keys(obj);
        var len = props.length;
        var vals = [];
        var idx = 0;
        while (idx < len) {
          vals[idx] = obj[props[idx]];
          idx += 1;
        }
        return vals;
      });
      var valuesIn = _curry1(function valuesIn(obj) {
        var prop,
            vs = [];
        for (prop in obj) {
          vs[vs.length] = obj[prop];
        }
        return vs;
      });
      var view = function() {
        var Const = function(x) {
          return {
            value: x,
            map: function() {
              return this;
            }
          };
        };
        return _curry2(function view(lens, x) {
          return lens(Const)(x).value;
        });
      }();
      var where = _curry2(function where(spec, testObj) {
        for (var prop in spec) {
          if (_has(prop, spec) && !spec[prop](testObj[prop])) {
            return false;
          }
        }
        return true;
      });
      var wrap = _curry2(function wrap(fn, wrapper) {
        return curryN(fn.length, function() {
          return wrapper.apply(this, _concat([fn], arguments));
        });
      });
      var xprod = _curry2(function xprod(a, b) {
        var idx = 0;
        var ilen = a.length;
        var j;
        var jlen = b.length;
        var result = [];
        while (idx < ilen) {
          j = 0;
          while (j < jlen) {
            result[result.length] = [a[idx], b[j]];
            j += 1;
          }
          idx += 1;
        }
        return result;
      });
      var zip = _curry2(function zip(a, b) {
        var rv = [];
        var idx = 0;
        var len = Math.min(a.length, b.length);
        while (idx < len) {
          rv[idx] = [a[idx], b[idx]];
          idx += 1;
        }
        return rv;
      });
      var zipObj = _curry2(function zipObj(keys, values) {
        var idx = 0,
            len = keys.length,
            out = {};
        while (idx < len) {
          out[keys[idx]] = values[idx];
          idx += 1;
        }
        return out;
      });
      var zipWith = _curry3(function zipWith(fn, a, b) {
        var rv = [],
            idx = 0,
            len = Math.min(a.length, b.length);
        while (idx < len) {
          rv[idx] = fn(a[idx], b[idx]);
          idx += 1;
        }
        return rv;
      });
      var F = always(false);
      var T = always(true);
      var _checkForMethod = function _checkForMethod(methodname, fn) {
        return function() {
          var length = arguments.length;
          if (length === 0) {
            return fn();
          }
          var obj = arguments[length - 1];
          return _isArray(obj) || typeof obj[methodname] !== 'function' ? fn.apply(this, arguments) : obj[methodname].apply(obj, _slice(arguments, 0, length - 1));
        };
      };
      var _clone = function _clone(value, refFrom, refTo) {
        var copy = function copy(copiedValue) {
          var len = refFrom.length;
          var idx = 0;
          while (idx < len) {
            if (value === refFrom[idx]) {
              return refTo[idx];
            }
            idx += 1;
          }
          refFrom[idx + 1] = value;
          refTo[idx + 1] = copiedValue;
          for (var key in value) {
            copiedValue[key] = _clone(value[key], refFrom, refTo);
          }
          return copiedValue;
        };
        switch (type(value)) {
          case 'Object':
            return copy({});
          case 'Array':
            return copy([]);
          case 'Date':
            return new Date(value);
          case 'RegExp':
            return _cloneRegExp(value);
          default:
            return value;
        }
      };
      var _createPartialApplicator = function _createPartialApplicator(concat) {
        return function(fn) {
          var args = _slice(arguments, 1);
          return _arity(Math.max(0, fn.length - args.length), function() {
            return fn.apply(this, concat(args, arguments));
          });
        };
      };
      var _dispatchable = function _dispatchable(methodname, xf, fn) {
        return function() {
          var length = arguments.length;
          if (length === 0) {
            return fn();
          }
          var obj = arguments[length - 1];
          if (!_isArray(obj)) {
            var args = _slice(arguments, 0, length - 1);
            if (typeof obj[methodname] === 'function') {
              return obj[methodname].apply(obj, args);
            }
            if (_isTransformer(obj)) {
              var transducer = xf.apply(null, args);
              return transducer(obj);
            }
          }
          return fn.apply(this, arguments);
        };
      };
      var _equals = function _equals(a, b, stackA, stackB) {
        var typeA = type(a);
        if (typeA !== type(b)) {
          return false;
        }
        if (typeA === 'Boolean' || typeA === 'Number' || typeA === 'String') {
          return typeof a === 'object' ? typeof b === 'object' && identical(a.valueOf(), b.valueOf()) : identical(a, b);
        }
        if (identical(a, b)) {
          return true;
        }
        if (typeA === 'RegExp') {
          return a.source === b.source && a.global === b.global && a.ignoreCase === b.ignoreCase && a.multiline === b.multiline && a.sticky === b.sticky && a.unicode === b.unicode;
        }
        if (Object(a) === a) {
          if (typeA === 'Date' && a.getTime() !== b.getTime()) {
            return false;
          }
          var keysA = keys(a);
          if (keysA.length !== keys(b).length) {
            return false;
          }
          var idx = stackA.length - 1;
          while (idx >= 0) {
            if (stackA[idx] === a) {
              return stackB[idx] === b;
            }
            idx -= 1;
          }
          stackA[stackA.length] = a;
          stackB[stackB.length] = b;
          idx = keysA.length - 1;
          while (idx >= 0) {
            var key = keysA[idx];
            if (!_has(key, b) || !_equals(b[key], a[key], stackA, stackB)) {
              return false;
            }
            idx -= 1;
          }
          stackA.pop();
          stackB.pop();
          return true;
        }
        return false;
      };
      var _hasMethod = function _hasMethod(methodName, obj) {
        return obj != null && !_isArray(obj) && typeof obj[methodName] === 'function';
      };
      var _makeFlat = function _makeFlat(recursive) {
        return function flatt(list) {
          var value,
              result = [],
              idx = 0,
              j,
              ilen = list.length,
              jlen;
          while (idx < ilen) {
            if (isArrayLike(list[idx])) {
              value = recursive ? flatt(list[idx]) : list[idx];
              j = 0;
              jlen = value.length;
              while (j < jlen) {
                result[result.length] = value[j];
                j += 1;
              }
            } else {
              result[result.length] = list[idx];
            }
            idx += 1;
          }
          return result;
        };
      };
      var _reduce = function() {
        function _arrayReduce(xf, acc, list) {
          var idx = 0,
              len = list.length;
          while (idx < len) {
            acc = xf['@@transducer/step'](acc, list[idx]);
            if (acc && acc['@@transducer/reduced']) {
              acc = acc['@@transducer/value'];
              break;
            }
            idx += 1;
          }
          return xf['@@transducer/result'](acc);
        }
        function _iterableReduce(xf, acc, iter) {
          var step = iter.next();
          while (!step.done) {
            acc = xf['@@transducer/step'](acc, step.value);
            if (acc && acc['@@transducer/reduced']) {
              acc = acc['@@transducer/value'];
              break;
            }
            step = iter.next();
          }
          return xf['@@transducer/result'](acc);
        }
        function _methodReduce(xf, acc, obj) {
          return xf['@@transducer/result'](obj.reduce(bind(xf['@@transducer/step'], xf), acc));
        }
        var symIterator = typeof Symbol !== 'undefined' ? Symbol.iterator : '@@iterator';
        return function _reduce(fn, acc, list) {
          if (typeof fn === 'function') {
            fn = _xwrap(fn);
          }
          if (isArrayLike(list)) {
            return _arrayReduce(fn, acc, list);
          }
          if (typeof list.reduce === 'function') {
            return _methodReduce(fn, acc, list);
          }
          if (list[symIterator] != null) {
            return _iterableReduce(fn, acc, list[symIterator]());
          }
          if (typeof list.next === 'function') {
            return _iterableReduce(fn, acc, list);
          }
          throw new TypeError('reduce: list must be array or iterable');
        };
      }();
      var _stepCat = function() {
        var _stepCatArray = {
          '@@transducer/init': Array,
          '@@transducer/step': function(xs, x) {
            return _concat(xs, [x]);
          },
          '@@transducer/result': _identity
        };
        var _stepCatString = {
          '@@transducer/init': String,
          '@@transducer/step': function(a, b) {
            return a + b;
          },
          '@@transducer/result': _identity
        };
        var _stepCatObject = {
          '@@transducer/init': Object,
          '@@transducer/step': function(result, input) {
            return merge(result, isArrayLike(input) ? createMapEntry(input[0], input[1]) : input);
          },
          '@@transducer/result': _identity
        };
        return function _stepCat(obj) {
          if (_isTransformer(obj)) {
            return obj;
          }
          if (isArrayLike(obj)) {
            return _stepCatArray;
          }
          if (typeof obj === 'string') {
            return _stepCatString;
          }
          if (typeof obj === 'object') {
            return _stepCatObject;
          }
          throw new Error('Cannot create transformer for ' + obj);
        };
      }();
      var _xall = function() {
        function XAll(f, xf) {
          this.xf = xf;
          this.f = f;
          this.all = true;
        }
        XAll.prototype['@@transducer/init'] = _xfBase.init;
        XAll.prototype['@@transducer/result'] = function(result) {
          if (this.all) {
            result = this.xf['@@transducer/step'](result, true);
          }
          return this.xf['@@transducer/result'](result);
        };
        XAll.prototype['@@transducer/step'] = function(result, input) {
          if (!this.f(input)) {
            this.all = false;
            result = _reduced(this.xf['@@transducer/step'](result, false));
          }
          return result;
        };
        return _curry2(function _xall(f, xf) {
          return new XAll(f, xf);
        });
      }();
      var _xany = function() {
        function XAny(f, xf) {
          this.xf = xf;
          this.f = f;
          this.any = false;
        }
        XAny.prototype['@@transducer/init'] = _xfBase.init;
        XAny.prototype['@@transducer/result'] = function(result) {
          if (!this.any) {
            result = this.xf['@@transducer/step'](result, false);
          }
          return this.xf['@@transducer/result'](result);
        };
        XAny.prototype['@@transducer/step'] = function(result, input) {
          if (this.f(input)) {
            this.any = true;
            result = _reduced(this.xf['@@transducer/step'](result, true));
          }
          return result;
        };
        return _curry2(function _xany(f, xf) {
          return new XAny(f, xf);
        });
      }();
      var _xdrop = function() {
        function XDrop(n, xf) {
          this.xf = xf;
          this.n = n;
        }
        XDrop.prototype['@@transducer/init'] = _xfBase.init;
        XDrop.prototype['@@transducer/result'] = _xfBase.result;
        XDrop.prototype['@@transducer/step'] = function(result, input) {
          if (this.n > 0) {
            this.n -= 1;
            return result;
          }
          return this.xf['@@transducer/step'](result, input);
        };
        return _curry2(function _xdrop(n, xf) {
          return new XDrop(n, xf);
        });
      }();
      var _xdropWhile = function() {
        function XDropWhile(f, xf) {
          this.xf = xf;
          this.f = f;
        }
        XDropWhile.prototype['@@transducer/init'] = _xfBase.init;
        XDropWhile.prototype['@@transducer/result'] = _xfBase.result;
        XDropWhile.prototype['@@transducer/step'] = function(result, input) {
          if (this.f) {
            if (this.f(input)) {
              return result;
            }
            this.f = null;
          }
          return this.xf['@@transducer/step'](result, input);
        };
        return _curry2(function _xdropWhile(f, xf) {
          return new XDropWhile(f, xf);
        });
      }();
      var _xgroupBy = function() {
        function XGroupBy(f, xf) {
          this.xf = xf;
          this.f = f;
          this.inputs = {};
        }
        XGroupBy.prototype['@@transducer/init'] = _xfBase.init;
        XGroupBy.prototype['@@transducer/result'] = function(result) {
          var key;
          for (key in this.inputs) {
            if (_has(key, this.inputs)) {
              result = this.xf['@@transducer/step'](result, this.inputs[key]);
              if (result['@@transducer/reduced']) {
                result = result['@@transducer/value'];
                break;
              }
            }
          }
          return this.xf['@@transducer/result'](result);
        };
        XGroupBy.prototype['@@transducer/step'] = function(result, input) {
          var key = this.f(input);
          this.inputs[key] = this.inputs[key] || [key, []];
          this.inputs[key][1] = append(input, this.inputs[key][1]);
          return result;
        };
        return _curry2(function _xgroupBy(f, xf) {
          return new XGroupBy(f, xf);
        });
      }();
      var addIndex = _curry1(function addIndex(fn) {
        return curryN(fn.length, function() {
          var idx = 0;
          var origFn = arguments[0];
          var list = arguments[arguments.length - 1];
          var args = _slice(arguments);
          args[0] = function() {
            var result = origFn.apply(this, _concat(arguments, [idx, list]));
            idx += 1;
            return result;
          };
          return fn.apply(this, args);
        });
      });
      var all = _curry2(_dispatchable('all', _xall, function all(fn, list) {
        var idx = 0;
        while (idx < list.length) {
          if (!fn(list[idx])) {
            return false;
          }
          idx += 1;
        }
        return true;
      }));
      var and = _curry2(function and(a, b) {
        return _hasMethod('and', a) ? a.and(b) : a && b;
      });
      var any = _curry2(_dispatchable('any', _xany, function any(fn, list) {
        var idx = 0;
        while (idx < list.length) {
          if (fn(list[idx])) {
            return true;
          }
          idx += 1;
        }
        return false;
      }));
      var binary = _curry1(function binary(fn) {
        return nAry(2, fn);
      });
      var clone = _curry1(function clone(value) {
        return _clone(value, [], []);
      });
      var concat = _curry2(function concat(set1, set2) {
        if (_isArray(set2)) {
          return _concat(set1, set2);
        } else if (_hasMethod('concat', set1)) {
          return set1.concat(set2);
        } else {
          throw new TypeError('can\'t concat ' + typeof set1);
        }
      });
      var curry = _curry1(function curry(fn) {
        return curryN(fn.length, fn);
      });
      var dropWhile = _curry2(_dispatchable('dropWhile', _xdropWhile, function dropWhile(pred, list) {
        var idx = 0,
            len = list.length;
        while (idx < len && pred(list[idx])) {
          idx += 1;
        }
        return _slice(list, idx);
      }));
      var equals = _curry2(function equals(a, b) {
        return _hasMethod('equals', a) ? a.equals(b) : _hasMethod('equals', b) ? b.equals(a) : _equals(a, b, [], []);
      });
      var filter = _curry2(_dispatchable('filter', _xfilter, _filter));
      var find = _curry2(_dispatchable('find', _xfind, function find(fn, list) {
        var idx = 0;
        var len = list.length;
        while (idx < len) {
          if (fn(list[idx])) {
            return list[idx];
          }
          idx += 1;
        }
      }));
      var findIndex = _curry2(_dispatchable('findIndex', _xfindIndex, function findIndex(fn, list) {
        var idx = 0;
        var len = list.length;
        while (idx < len) {
          if (fn(list[idx])) {
            return idx;
          }
          idx += 1;
        }
        return -1;
      }));
      var findLast = _curry2(_dispatchable('findLast', _xfindLast, function findLast(fn, list) {
        var idx = list.length - 1;
        while (idx >= 0) {
          if (fn(list[idx])) {
            return list[idx];
          }
          idx -= 1;
        }
      }));
      var findLastIndex = _curry2(_dispatchable('findLastIndex', _xfindLastIndex, function findLastIndex(fn, list) {
        var idx = list.length - 1;
        while (idx >= 0) {
          if (fn(list[idx])) {
            return idx;
          }
          idx -= 1;
        }
        return -1;
      }));
      var flatten = _curry1(_makeFlat(true));
      var flip = _curry1(function flip(fn) {
        return curry(function(a, b) {
          var args = _slice(arguments);
          args[0] = b;
          args[1] = a;
          return fn.apply(this, args);
        });
      });
      var forEach = _curry2(_checkForMethod('forEach', function forEach(fn, list) {
        var len = list.length;
        var idx = 0;
        while (idx < len) {
          fn(list[idx]);
          idx += 1;
        }
        return list;
      }));
      var functions = _curry1(_functionsWith(keys));
      var functionsIn = _curry1(_functionsWith(keysIn));
      var groupBy = _curry2(_dispatchable('groupBy', _xgroupBy, function groupBy(fn, list) {
        return _reduce(function(acc, elt) {
          var key = fn(elt);
          acc[key] = append(elt, acc[key] || (acc[key] = []));
          return acc;
        }, {}, list);
      }));
      var head = nth(0);
      var intersectionWith = _curry3(function intersectionWith(pred, list1, list2) {
        var results = [],
            idx = 0;
        while (idx < list1.length) {
          if (_containsWith(pred, list1[idx], list2)) {
            results[results.length] = list1[idx];
          }
          idx += 1;
        }
        return uniqWith(pred, results);
      });
      var intersperse = _curry2(_checkForMethod('intersperse', function intersperse(separator, list) {
        var out = [];
        var idx = 0;
        var length = list.length;
        while (idx < length) {
          if (idx === length - 1) {
            out.push(list[idx]);
          } else {
            out.push(list[idx], separator);
          }
          idx += 1;
        }
        return out;
      }));
      var into = _curry3(function into(acc, xf, list) {
        return _isTransformer(acc) ? _reduce(xf(acc), acc['@@transducer/init'](), list) : _reduce(xf(_stepCat(acc)), acc, list);
      });
      var invert = _curry1(function invert(obj) {
        var props = keys(obj);
        var len = props.length;
        var idx = 0;
        var out = {};
        while (idx < len) {
          var key = props[idx];
          var val = obj[key];
          var list = _has(val, out) ? out[val] : out[val] = [];
          list[list.length] = key;
          idx += 1;
        }
        return out;
      });
      var invertObj = _curry1(function invertObj(obj) {
        var props = keys(obj);
        var len = props.length;
        var idx = 0;
        var out = {};
        while (idx < len) {
          var key = props[idx];
          out[obj[key]] = key;
          idx += 1;
        }
        return out;
      });
      var last = nth(-1);
      var lastIndexOf = _curry2(function lastIndexOf(target, xs) {
        if (_hasMethod('lastIndexOf', xs)) {
          return xs.lastIndexOf(target);
        } else {
          var idx = xs.length - 1;
          while (idx >= 0) {
            if (equals(xs[idx], target)) {
              return idx;
            }
            idx -= 1;
          }
          return -1;
        }
      });
      var map = _curry2(_dispatchable('map', _xmap, _map));
      var mapObj = _curry2(function mapObj(fn, obj) {
        return _reduce(function(acc, key) {
          acc[key] = fn(obj[key]);
          return acc;
        }, {}, keys(obj));
      });
      var mapObjIndexed = _curry2(function mapObjIndexed(fn, obj) {
        return _reduce(function(acc, key) {
          acc[key] = fn(obj[key], key, obj);
          return acc;
        }, {}, keys(obj));
      });
      var none = _curry2(_complement(_dispatchable('any', _xany, any)));
      var or = _curry2(function or(a, b) {
        return _hasMethod('or', a) ? a.or(b) : a || b;
      });
      var partial = curry(_createPartialApplicator(_concat));
      var partialRight = curry(_createPartialApplicator(flip(_concat)));
      var partition = _curry2(function partition(pred, list) {
        return _reduce(function(acc, elt) {
          var xs = acc[pred(elt) ? 0 : 1];
          xs[xs.length] = elt;
          return acc;
        }, [[], []], list);
      });
      var pathEq = _curry3(function pathEq(_path, val, obj) {
        return equals(path(_path, obj), val);
      });
      var pluck = _curry2(function pluck(p, list) {
        return map(prop(p), list);
      });
      var propEq = _curry3(function propEq(name, val, obj) {
        return propSatisfies(equals(val), name, obj);
      });
      var propIs = _curry3(function propIs(type, name, obj) {
        return propSatisfies(is(type), name, obj);
      });
      var reduce = _curry3(_reduce);
      var reject = _curry2(function reject(fn, list) {
        return filter(_complement(fn), list);
      });
      var repeat = _curry2(function repeat(value, n) {
        return times(always(value), n);
      });
      var slice = _curry3(_checkForMethod('slice', function slice(fromIndex, toIndex, list) {
        return Array.prototype.slice.call(list, fromIndex, toIndex);
      }));
      var splitEvery = _curry2(function splitEvery(n, list) {
        if (n <= 0) {
          throw new Error('First argument to splitEvery must be a positive integer');
        }
        var result = [];
        var idx = 0;
        while (idx < list.length) {
          result.push(slice(idx, idx += n, list));
        }
        return result;
      });
      var sum = reduce(add, 0);
      var tail = _checkForMethod('tail', slice(1, Infinity));
      var take = _curry2(_dispatchable('take', _xtake, function take(n, xs) {
        return slice(0, n < 0 ? Infinity : n, xs);
      }));
      var takeWhile = _curry2(_dispatchable('takeWhile', _xtakeWhile, function takeWhile(fn, list) {
        var idx = 0,
            len = list.length;
        while (idx < len && fn(list[idx])) {
          idx += 1;
        }
        return _slice(list, 0, idx);
      }));
      var transduce = curryN(4, function transduce(xf, fn, acc, list) {
        return _reduce(xf(typeof fn === 'function' ? _xwrap(fn) : fn), acc, list);
      });
      var unionWith = _curry3(function unionWith(pred, list1, list2) {
        return uniqWith(pred, _concat(list1, list2));
      });
      var uniq = uniqWith(equals);
      var unnest = _curry1(_makeFlat(false));
      var useWith = curry(function useWith(fn) {
        var transformers = _slice(arguments, 1);
        var tlen = transformers.length;
        return curry(_arity(tlen, function() {
          var args = [],
              idx = 0;
          while (idx < tlen) {
            args[idx] = transformers[idx](arguments[idx]);
            idx += 1;
          }
          return fn.apply(this, args.concat(_slice(arguments, tlen)));
        }));
      });
      var whereEq = _curry2(function whereEq(spec, testObj) {
        return where(mapObj(equals, spec), testObj);
      });
      var _flatCat = function() {
        var preservingReduced = function(xf) {
          return {
            '@@transducer/init': _xfBase.init,
            '@@transducer/result': function(result) {
              return xf['@@transducer/result'](result);
            },
            '@@transducer/step': function(result, input) {
              var ret = xf['@@transducer/step'](result, input);
              return ret['@@transducer/reduced'] ? _forceReduced(ret) : ret;
            }
          };
        };
        return function _xcat(xf) {
          var rxf = preservingReduced(xf);
          return {
            '@@transducer/init': _xfBase.init,
            '@@transducer/result': function(result) {
              return rxf['@@transducer/result'](result);
            },
            '@@transducer/step': function(result, input) {
              return !isArrayLike(input) ? _reduce(rxf, result, [input]) : _reduce(rxf, result, input);
            }
          };
        };
      }();
      var _indexOf = function _indexOf(list, item, from) {
        var idx = from;
        while (idx < list.length) {
          if (equals(list[idx], item)) {
            return idx;
          }
          idx += 1;
        }
        return -1;
      };
      var _predicateWrap = function _predicateWrap(predPicker) {
        return function(preds) {
          var predIterator = function() {
            var args = arguments;
            return predPicker(function(predicate) {
              return predicate.apply(null, args);
            }, preds);
          };
          return arguments.length > 1 ? predIterator.apply(null, _slice(arguments, 1)) : _arity(Math.max.apply(Math, pluck('length', preds)), predIterator);
        };
      };
      var _xchain = _curry2(function _xchain(f, xf) {
        return map(f, _flatCat(xf));
      });
      var allPass = _curry1(_predicateWrap(all));
      var anyPass = _curry1(_predicateWrap(any));
      var ap = _curry2(function ap(fns, vs) {
        return _hasMethod('ap', fns) ? fns.ap(vs) : _reduce(function(acc, fn) {
          return _concat(acc, map(fn, vs));
        }, [], fns);
      });
      var call = curry(function call(fn) {
        return fn.apply(this, _slice(arguments, 1));
      });
      var chain = _curry2(_dispatchable('chain', _xchain, function chain(fn, list) {
        return unnest(map(fn, list));
      }));
      var commuteMap = _curry3(function commuteMap(fn, of, list) {
        function consF(acc, ftor) {
          return ap(map(append, fn(ftor)), acc);
        }
        return _reduce(consF, of([]), list);
      });
      var constructN = _curry2(function constructN(n, Fn) {
        if (n > 10) {
          throw new Error('Constructor with greater than ten arguments');
        }
        if (n === 0) {
          return function() {
            return new Fn();
          };
        }
        return curry(nAry(n, function($0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
          switch (arguments.length) {
            case 1:
              return new Fn($0);
            case 2:
              return new Fn($0, $1);
            case 3:
              return new Fn($0, $1, $2);
            case 4:
              return new Fn($0, $1, $2, $3);
            case 5:
              return new Fn($0, $1, $2, $3, $4);
            case 6:
              return new Fn($0, $1, $2, $3, $4, $5);
            case 7:
              return new Fn($0, $1, $2, $3, $4, $5, $6);
            case 8:
              return new Fn($0, $1, $2, $3, $4, $5, $6, $7);
            case 9:
              return new Fn($0, $1, $2, $3, $4, $5, $6, $7, $8);
            case 10:
              return new Fn($0, $1, $2, $3, $4, $5, $6, $7, $8, $9);
          }
        }));
      });
      var converge = curryN(3, function converge(after) {
        var fns = _slice(arguments, 1);
        return curryN(Math.max.apply(Math, pluck('length', fns)), function() {
          var args = arguments;
          var context = this;
          return after.apply(context, _map(function(fn) {
            return fn.apply(context, args);
          }, fns));
        });
      });
      var drop = _curry2(_dispatchable('drop', _xdrop, function drop(n, xs) {
        return slice(Math.max(0, n), Infinity, xs);
      }));
      var dropLast = _curry2(function dropLast(n, xs) {
        return take(n < xs.length ? xs.length - n : 0, xs);
      });
      var dropRepeatsWith = _curry2(_dispatchable('dropRepeatsWith', _xdropRepeatsWith, function dropRepeatsWith(pred, list) {
        var result = [];
        var idx = 1;
        var len = list.length;
        if (len !== 0) {
          result[0] = list[0];
          while (idx < len) {
            if (!pred(last(result), list[idx])) {
              result[result.length] = list[idx];
            }
            idx += 1;
          }
        }
        return result;
      }));
      var eqProps = _curry3(function eqProps(prop, obj1, obj2) {
        return equals(obj1[prop], obj2[prop]);
      });
      var indexOf = _curry2(function indexOf(target, xs) {
        return _hasMethod('indexOf', xs) ? xs.indexOf(target) : _indexOf(xs, target, 0);
      });
      var init = slice(0, -1);
      var isSet = _curry1(function isSet(list) {
        var len = list.length;
        var idx = 0;
        while (idx < len) {
          if (_indexOf(list, list[idx], idx + 1) >= 0) {
            return false;
          }
          idx += 1;
        }
        return true;
      });
      var lens = _curry2(function lens(getter, setter) {
        return function(f) {
          return function(s) {
            return map(function(v) {
              return setter(v, s);
            }, f(getter(s)));
          };
        };
      });
      var lensIndex = _curry1(function lensIndex(n) {
        return lens(nth(n), update(n));
      });
      var lensProp = _curry1(function lensProp(k) {
        return lens(prop(k), assoc(k));
      });
      var liftN = _curry2(function liftN(arity, fn) {
        var lifted = curryN(arity, fn);
        return curryN(arity, function() {
          return _reduce(ap, map(lifted, arguments[0]), _slice(arguments, 1));
        });
      });
      var mean = _curry1(function mean(list) {
        return sum(list) / list.length;
      });
      var median = _curry1(function median(list) {
        var len = list.length;
        if (len === 0) {
          return NaN;
        }
        var width = 2 - len % 2;
        var idx = (len - width) / 2;
        return mean(_slice(list).sort(function(a, b) {
          return a < b ? -1 : a > b ? 1 : 0;
        }).slice(idx, idx + width));
      });
      var mergeAll = _curry1(function mergeAll(list) {
        return reduce(merge, {}, list);
      });
      var pipe = function pipe() {
        if (arguments.length === 0) {
          throw new Error('pipe requires at least one argument');
        }
        return curryN(arguments[0].length, reduce(_pipe, arguments[0], tail(arguments)));
      };
      var pipeP = function pipeP() {
        if (arguments.length === 0) {
          throw new Error('pipeP requires at least one argument');
        }
        return curryN(arguments[0].length, reduce(_pipeP, arguments[0], tail(arguments)));
      };
      var product = reduce(multiply, 1);
      var project = useWith(_map, pickAll, identity);
      var takeLast = _curry2(function takeLast(n, xs) {
        return drop(n >= 0 ? xs.length - n : 0, xs);
      });
      var _contains = function _contains(a, list) {
        return _indexOf(list, a, 0) >= 0;
      };
      var _toString = function _toString(x, seen) {
        var recur = function recur(y) {
          var xs = seen.concat([x]);
          return _contains(y, xs) ? '<Circular>' : _toString(y, xs);
        };
        var mapPairs = function(obj, keys) {
          return _map(function(k) {
            return _quote(k) + ': ' + recur(obj[k]);
          }, keys.slice().sort());
        };
        switch (Object.prototype.toString.call(x)) {
          case '[object Arguments]':
            return '(function() { return arguments; }(' + _map(recur, x).join(', ') + '))';
          case '[object Array]':
            return '[' + _map(recur, x).concat(mapPairs(x, reject(test(/^\d+$/), keys(x)))).join(', ') + ']';
          case '[object Boolean]':
            return typeof x === 'object' ? 'new Boolean(' + recur(x.valueOf()) + ')' : x.toString();
          case '[object Date]':
            return 'new Date(' + _quote(_toISOString(x)) + ')';
          case '[object Null]':
            return 'null';
          case '[object Number]':
            return typeof x === 'object' ? 'new Number(' + recur(x.valueOf()) + ')' : 1 / x === -Infinity ? '-0' : x.toString(10);
          case '[object String]':
            return typeof x === 'object' ? 'new String(' + recur(x.valueOf()) + ')' : _quote(x);
          case '[object Undefined]':
            return 'undefined';
          default:
            return typeof x.constructor === 'function' && x.constructor.name !== 'Object' && typeof x.toString === 'function' && x.toString() !== '[object Object]' ? x.toString() : '{' + mapPairs(x, keys(x)).join(', ') + '}';
        }
      };
      var commute = commuteMap(identity);
      var compose = function compose() {
        if (arguments.length === 0) {
          throw new Error('compose requires at least one argument');
        }
        return pipe.apply(this, reverse(arguments));
      };
      var composeK = function composeK() {
        return arguments.length === 0 ? identity : compose.apply(this, map(chain, arguments));
      };
      var composeP = function composeP() {
        if (arguments.length === 0) {
          throw new Error('composeP requires at least one argument');
        }
        return pipeP.apply(this, reverse(arguments));
      };
      var construct = _curry1(function construct(Fn) {
        return constructN(Fn.length, Fn);
      });
      var contains = _curry2(_contains);
      var difference = _curry2(function difference(first, second) {
        var out = [];
        var idx = 0;
        var firstLen = first.length;
        while (idx < firstLen) {
          if (!_contains(first[idx], second) && !_contains(first[idx], out)) {
            out[out.length] = first[idx];
          }
          idx += 1;
        }
        return out;
      });
      var dropRepeats = _curry1(_dispatchable('dropRepeats', _xdropRepeatsWith(equals), dropRepeatsWith(equals)));
      var intersection = _curry2(function intersection(list1, list2) {
        return uniq(_filter(flip(_contains)(list1), list2));
      });
      var lift = _curry1(function lift(fn) {
        return liftN(fn.length, fn);
      });
      var omit = _curry2(function omit(names, obj) {
        var result = {};
        for (var prop in obj) {
          if (!_contains(prop, names)) {
            result[prop] = obj[prop];
          }
        }
        return result;
      });
      var pipeK = function pipeK() {
        return composeK.apply(this, reverse(arguments));
      };
      var toString = _curry1(function toString(val) {
        return _toString(val, []);
      });
      var union = _curry2(compose(uniq, _concat));
      var uniqBy = _curry2(function uniqBy(fn, list) {
        var idx = 0,
            applied = [],
            result = [],
            appliedItem,
            item;
        while (idx < list.length) {
          item = list[idx];
          appliedItem = fn(item);
          if (!_contains(appliedItem, applied)) {
            result.push(item);
            applied.push(appliedItem);
          }
          idx += 1;
        }
        return result;
      });
      var invoker = _curry2(function invoker(arity, method) {
        return curryN(arity + 1, function() {
          var target = arguments[arity];
          if (target != null && is(Function, target[method])) {
            return target[method].apply(target, _slice(arguments, 0, arity));
          }
          throw new TypeError(toString(target) + ' does not have a method named "' + method + '"');
        });
      });
      var join = invoker(1, 'join');
      var memoize = _curry1(function memoize(fn) {
        var cache = {};
        return function() {
          var key = toString(arguments);
          if (!_has(key, cache)) {
            cache[key] = fn.apply(this, arguments);
          }
          return cache[key];
        };
      });
      var split = invoker(1, 'split');
      var toLower = invoker(0, 'toLowerCase');
      var toUpper = invoker(0, 'toUpperCase');
      var R = {
        F: F,
        T: T,
        __: __,
        add: add,
        addIndex: addIndex,
        adjust: adjust,
        all: all,
        allPass: allPass,
        always: always,
        and: and,
        any: any,
        anyPass: anyPass,
        ap: ap,
        aperture: aperture,
        append: append,
        apply: apply,
        assoc: assoc,
        assocPath: assocPath,
        binary: binary,
        bind: bind,
        both: both,
        call: call,
        chain: chain,
        clone: clone,
        commute: commute,
        commuteMap: commuteMap,
        comparator: comparator,
        complement: complement,
        compose: compose,
        composeK: composeK,
        composeP: composeP,
        concat: concat,
        cond: cond,
        construct: construct,
        constructN: constructN,
        contains: contains,
        containsWith: containsWith,
        converge: converge,
        countBy: countBy,
        createMapEntry: createMapEntry,
        curry: curry,
        curryN: curryN,
        dec: dec,
        defaultTo: defaultTo,
        difference: difference,
        differenceWith: differenceWith,
        dissoc: dissoc,
        dissocPath: dissocPath,
        divide: divide,
        drop: drop,
        dropLast: dropLast,
        dropLastWhile: dropLastWhile,
        dropRepeats: dropRepeats,
        dropRepeatsWith: dropRepeatsWith,
        dropWhile: dropWhile,
        either: either,
        empty: empty,
        eqProps: eqProps,
        equals: equals,
        evolve: evolve,
        filter: filter,
        find: find,
        findIndex: findIndex,
        findLast: findLast,
        findLastIndex: findLastIndex,
        flatten: flatten,
        flip: flip,
        forEach: forEach,
        fromPairs: fromPairs,
        functions: functions,
        functionsIn: functionsIn,
        groupBy: groupBy,
        gt: gt,
        gte: gte,
        has: has,
        hasIn: hasIn,
        head: head,
        identical: identical,
        identity: identity,
        ifElse: ifElse,
        inc: inc,
        indexOf: indexOf,
        init: init,
        insert: insert,
        insertAll: insertAll,
        intersection: intersection,
        intersectionWith: intersectionWith,
        intersperse: intersperse,
        into: into,
        invert: invert,
        invertObj: invertObj,
        invoker: invoker,
        is: is,
        isArrayLike: isArrayLike,
        isEmpty: isEmpty,
        isNil: isNil,
        isSet: isSet,
        join: join,
        keys: keys,
        keysIn: keysIn,
        last: last,
        lastIndexOf: lastIndexOf,
        length: length,
        lens: lens,
        lensIndex: lensIndex,
        lensProp: lensProp,
        lift: lift,
        liftN: liftN,
        lt: lt,
        lte: lte,
        map: map,
        mapAccum: mapAccum,
        mapAccumRight: mapAccumRight,
        mapObj: mapObj,
        mapObjIndexed: mapObjIndexed,
        match: match,
        mathMod: mathMod,
        max: max,
        maxBy: maxBy,
        mean: mean,
        median: median,
        memoize: memoize,
        merge: merge,
        mergeAll: mergeAll,
        min: min,
        minBy: minBy,
        modulo: modulo,
        multiply: multiply,
        nAry: nAry,
        negate: negate,
        none: none,
        not: not,
        nth: nth,
        nthArg: nthArg,
        nthChar: nthChar,
        nthCharCode: nthCharCode,
        of: of,
        omit: omit,
        once: once,
        or: or,
        over: over,
        partial: partial,
        partialRight: partialRight,
        partition: partition,
        path: path,
        pathEq: pathEq,
        pick: pick,
        pickAll: pickAll,
        pickBy: pickBy,
        pipe: pipe,
        pipeK: pipeK,
        pipeP: pipeP,
        pluck: pluck,
        prepend: prepend,
        product: product,
        project: project,
        prop: prop,
        propEq: propEq,
        propIs: propIs,
        propOr: propOr,
        propSatisfies: propSatisfies,
        props: props,
        range: range,
        reduce: reduce,
        reduceRight: reduceRight,
        reduced: reduced,
        reject: reject,
        remove: remove,
        repeat: repeat,
        replace: replace,
        reverse: reverse,
        scan: scan,
        set: set,
        slice: slice,
        sort: sort,
        sortBy: sortBy,
        split: split,
        splitEvery: splitEvery,
        subtract: subtract,
        sum: sum,
        tail: tail,
        take: take,
        takeLast: takeLast,
        takeLastWhile: takeLastWhile,
        takeWhile: takeWhile,
        tap: tap,
        test: test,
        times: times,
        toLower: toLower,
        toPairs: toPairs,
        toPairsIn: toPairsIn,
        toString: toString,
        toUpper: toUpper,
        transduce: transduce,
        trim: trim,
        type: type,
        unapply: unapply,
        unary: unary,
        uncurryN: uncurryN,
        unfold: unfold,
        union: union,
        unionWith: unionWith,
        uniq: uniq,
        uniqBy: uniqBy,
        uniqWith: uniqWith,
        unnest: unnest,
        update: update,
        useWith: useWith,
        values: values,
        valuesIn: valuesIn,
        view: view,
        where: where,
        whereEq: whereEq,
        wrap: wrap,
        xprod: xprod,
        zip: zip,
        zipObj: zipObj,
        zipWith: zipWith
      };
      if (typeof exports === 'object') {
        module.exports = R;
      } else if (typeof define === 'function' && define.amd) {
        define(function() {
          return R;
        });
      } else {
        this.R = R;
      }
    }.call(this));
  })(require("github:jspm/nodelibs-process@0.1.1"));
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/modules/web.dom.iterable", ["npm:core-js@1.1.3/library/modules/es6.array.iterator", "npm:core-js@1.1.3/library/modules/$.iterators"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  require("npm:core-js@1.1.3/library/modules/es6.array.iterator");
  var Iterators = require("npm:core-js@1.1.3/library/modules/$.iterators");
  Iterators.NodeList = Iterators.HTMLCollection = Iterators.Array;
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/modules/es6.string.iterator", ["npm:core-js@1.1.3/library/modules/$.string-at", "npm:core-js@1.1.3/library/modules/$.iter-define"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var $at = require("npm:core-js@1.1.3/library/modules/$.string-at")(true);
  require("npm:core-js@1.1.3/library/modules/$.iter-define")(String, 'String', function(iterated) {
    this._t = String(iterated);
    this._i = 0;
  }, function() {
    var O = this._t,
        index = this._i,
        point;
    if (index >= O.length)
      return {
        value: undefined,
        done: true
      };
    point = $at(O, index);
    this._i += point.length;
    return {
      value: point,
      done: false
    };
  });
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/modules/core.is-iterable", ["npm:core-js@1.1.3/library/modules/$.classof", "npm:core-js@1.1.3/library/modules/$.wks", "npm:core-js@1.1.3/library/modules/$.iterators", "npm:core-js@1.1.3/library/modules/$.core"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var classof = require("npm:core-js@1.1.3/library/modules/$.classof"),
      ITERATOR = require("npm:core-js@1.1.3/library/modules/$.wks")('iterator'),
      Iterators = require("npm:core-js@1.1.3/library/modules/$.iterators");
  module.exports = require("npm:core-js@1.1.3/library/modules/$.core").isIterable = function(it) {
    var O = Object(it);
    return ITERATOR in O || '@@iterator' in O || Iterators.hasOwnProperty(classof(O));
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/modules/core.get-iterator", ["npm:core-js@1.1.3/library/modules/$.an-object", "npm:core-js@1.1.3/library/modules/core.get-iterator-method", "npm:core-js@1.1.3/library/modules/$.core"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var anObject = require("npm:core-js@1.1.3/library/modules/$.an-object"),
      get = require("npm:core-js@1.1.3/library/modules/core.get-iterator-method");
  module.exports = require("npm:core-js@1.1.3/library/modules/$.core").getIterator = function(it) {
    var iterFn = get(it);
    if (typeof iterFn != 'function')
      throw TypeError(it + ' is not iterable!');
    return anObject(iterFn.call(it));
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.14.0/src/internal/_curry1", ["npm:ramda@0.14.0/src/__"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var __ = require("npm:ramda@0.14.0/src/__");
  module.exports = function _curry1(fn) {
    return function f1(a) {
      if (arguments.length === 0) {
        return f1;
      } else if (a === __) {
        return f1;
      } else {
        return fn(a);
      }
    };
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.15.1/src/internal/_curry2", ["npm:ramda@0.15.1/src/internal/_curry1"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry1 = require("npm:ramda@0.15.1/src/internal/_curry1");
  module.exports = function _curry2(fn) {
    return function f2(a, b) {
      var n = arguments.length;
      if (n === 0) {
        return f2;
      } else if (n === 1 && a != null && a['@@functional/placeholder'] === true) {
        return f2;
      } else if (n === 1) {
        return _curry1(function(b) {
          return fn(a, b);
        });
      } else if (n === 2 && a != null && a['@@functional/placeholder'] === true && b != null && b['@@functional/placeholder'] === true) {
        return f2;
      } else if (n === 2 && a != null && a['@@functional/placeholder'] === true) {
        return _curry1(function(a) {
          return fn(a, b);
        });
      } else if (n === 2 && b != null && b['@@functional/placeholder'] === true) {
        return _curry1(function(b) {
          return fn(a, b);
        });
      } else {
        return fn(a, b);
      }
    };
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.15.1/src/internal/_curryN", ["npm:ramda@0.15.1/src/arity"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var arity = require("npm:ramda@0.15.1/src/arity");
  module.exports = function _curryN(length, received, fn) {
    return function() {
      var combined = [];
      var argsIdx = 0;
      var left = length;
      var combinedIdx = 0;
      while (combinedIdx < received.length || argsIdx < arguments.length) {
        var result;
        if (combinedIdx < received.length && (received[combinedIdx] == null || received[combinedIdx]['@@functional/placeholder'] !== true || argsIdx >= arguments.length)) {
          result = received[combinedIdx];
        } else {
          result = arguments[argsIdx];
          argsIdx += 1;
        }
        combined[combinedIdx] = result;
        if (result == null || result['@@functional/placeholder'] !== true) {
          left -= 1;
        }
        combinedIdx += 1;
      }
      return left <= 0 ? fn.apply(this, combined) : arity(left, _curryN(length, combined, fn));
    };
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/internal/_contains", ["npm:ramda@0.17.1/src/internal/_indexOf"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _indexOf = require("npm:ramda@0.17.1/src/internal/_indexOf");
  module.exports = function _contains(a, list) {
    return _indexOf(list, a, 0) >= 0;
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.15.1/src/arity", ["npm:ramda@0.15.1/src/internal/_curry2"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("npm:ramda@0.15.1/src/internal/_curry2");
  module.exports = _curry2(function(n, fn) {
    switch (n) {
      case 0:
        return function() {
          return fn.apply(this, arguments);
        };
      case 1:
        return function(a0) {
          return fn.apply(this, arguments);
        };
      case 2:
        return function(a0, a1) {
          return fn.apply(this, arguments);
        };
      case 3:
        return function(a0, a1, a2) {
          return fn.apply(this, arguments);
        };
      case 4:
        return function(a0, a1, a2, a3) {
          return fn.apply(this, arguments);
        };
      case 5:
        return function(a0, a1, a2, a3, a4) {
          return fn.apply(this, arguments);
        };
      case 6:
        return function(a0, a1, a2, a3, a4, a5) {
          return fn.apply(this, arguments);
        };
      case 7:
        return function(a0, a1, a2, a3, a4, a5, a6) {
          return fn.apply(this, arguments);
        };
      case 8:
        return function(a0, a1, a2, a3, a4, a5, a6, a7) {
          return fn.apply(this, arguments);
        };
      case 9:
        return function(a0, a1, a2, a3, a4, a5, a6, a7, a8) {
          return fn.apply(this, arguments);
        };
      case 10:
        return function(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          return fn.apply(this, arguments);
        };
      default:
        throw new Error('First argument to arity must be a non-negative integer no greater than ten');
    }
  });
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/internal/_quote", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function _quote(s) {
    return '"' + s.replace(/"/g, '\\"') + '"';
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/internal/_toISOString", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = (function() {
    var pad = function pad(n) {
      return (n < 10 ? '0' : '') + n;
    };
    return typeof Date.prototype.toISOString === 'function' ? function _toISOString(d) {
      return d.toISOString();
    } : function _toISOString(d) {
      return (d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + '.' + (d.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) + 'Z');
    };
  }());
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/test", ["npm:ramda@0.17.1/src/internal/_cloneRegExp", "npm:ramda@0.17.1/src/internal/_curry2"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _cloneRegExp = require("npm:ramda@0.17.1/src/internal/_cloneRegExp");
  var _curry2 = require("npm:ramda@0.17.1/src/internal/_curry2");
  module.exports = _curry2(function test(pattern, str) {
    return _cloneRegExp(pattern).test(str);
  });
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/reject", ["npm:ramda@0.17.1/src/internal/_complement", "npm:ramda@0.17.1/src/internal/_curry2", "npm:ramda@0.17.1/src/filter"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _complement = require("npm:ramda@0.17.1/src/internal/_complement");
  var _curry2 = require("npm:ramda@0.17.1/src/internal/_curry2");
  var filter = require("npm:ramda@0.17.1/src/filter");
  module.exports = _curry2(function reject(fn, list) {
    return filter(_complement(fn), list);
  });
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/internal/_checkForMethod", ["npm:ramda@0.17.1/src/internal/_isArray", "npm:ramda@0.17.1/src/internal/_slice"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _isArray = require("npm:ramda@0.17.1/src/internal/_isArray");
  var _slice = require("npm:ramda@0.17.1/src/internal/_slice");
  module.exports = function _checkForMethod(methodname, fn) {
    return function() {
      var length = arguments.length;
      if (length === 0) {
        return fn();
      }
      var obj = arguments[length - 1];
      return (_isArray(obj) || typeof obj[methodname] !== 'function') ? fn.apply(this, arguments) : obj[methodname].apply(obj, _slice(arguments, 0, length - 1));
    };
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/internal/_reduce", ["npm:ramda@0.17.1/src/internal/_xwrap", "npm:ramda@0.17.1/src/bind", "npm:ramda@0.17.1/src/isArrayLike"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _xwrap = require("npm:ramda@0.17.1/src/internal/_xwrap");
  var bind = require("npm:ramda@0.17.1/src/bind");
  var isArrayLike = require("npm:ramda@0.17.1/src/isArrayLike");
  module.exports = (function() {
    function _arrayReduce(xf, acc, list) {
      var idx = 0,
          len = list.length;
      while (idx < len) {
        acc = xf['@@transducer/step'](acc, list[idx]);
        if (acc && acc['@@transducer/reduced']) {
          acc = acc['@@transducer/value'];
          break;
        }
        idx += 1;
      }
      return xf['@@transducer/result'](acc);
    }
    function _iterableReduce(xf, acc, iter) {
      var step = iter.next();
      while (!step.done) {
        acc = xf['@@transducer/step'](acc, step.value);
        if (acc && acc['@@transducer/reduced']) {
          acc = acc['@@transducer/value'];
          break;
        }
        step = iter.next();
      }
      return xf['@@transducer/result'](acc);
    }
    function _methodReduce(xf, acc, obj) {
      return xf['@@transducer/result'](obj.reduce(bind(xf['@@transducer/step'], xf), acc));
    }
    var symIterator = (typeof Symbol !== 'undefined') ? Symbol.iterator : '@@iterator';
    return function _reduce(fn, acc, list) {
      if (typeof fn === 'function') {
        fn = _xwrap(fn);
      }
      if (isArrayLike(list)) {
        return _arrayReduce(fn, acc, list);
      }
      if (typeof list.reduce === 'function') {
        return _methodReduce(fn, acc, list);
      }
      if (list[symIterator] != null) {
        return _iterableReduce(fn, acc, list[symIterator]());
      }
      if (typeof list.next === 'function') {
        return _iterableReduce(fn, acc, list);
      }
      throw new TypeError('reduce: list must be array or iterable');
    };
  })();
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/isArrayLike", ["npm:ramda@0.17.1/src/internal/_curry1", "npm:ramda@0.17.1/src/internal/_isArray"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry1 = require("npm:ramda@0.17.1/src/internal/_curry1");
  var _isArray = require("npm:ramda@0.17.1/src/internal/_isArray");
  module.exports = _curry1(function isArrayLike(x) {
    if (_isArray(x)) {
      return true;
    }
    if (!x) {
      return false;
    }
    if (typeof x !== 'object') {
      return false;
    }
    if (x instanceof String) {
      return false;
    }
    if (x.nodeType === 1) {
      return !!x.length;
    }
    if (x.length === 0) {
      return true;
    }
    if (x.length > 0) {
      return x.hasOwnProperty(0) && x.hasOwnProperty(x.length - 1);
    }
    return false;
  });
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/slice", ["npm:ramda@0.17.1/src/internal/_checkForMethod", "npm:ramda@0.17.1/src/internal/_curry3"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _checkForMethod = require("npm:ramda@0.17.1/src/internal/_checkForMethod");
  var _curry3 = require("npm:ramda@0.17.1/src/internal/_curry3");
  module.exports = _curry3(_checkForMethod('slice', function slice(fromIndex, toIndex, list) {
    return Array.prototype.slice.call(list, fromIndex, toIndex);
  }));
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/internal/_reduced", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function _reduced(x) {
    return x && x['@@transducer/reduced'] ? x : {
      '@@transducer/value': x,
      '@@transducer/reduced': true
    };
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/internal/_forceReduced", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function _forceReduced(x) {
    return {
      '@@transducer/value': x,
      '@@transducer/reduced': true
    };
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:process@0.10.1", ["npm:process@0.10.1/browser"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("npm:process@0.10.1/browser");
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/modules/es6.array.iterator", ["npm:core-js@1.1.3/library/modules/$.unscope", "npm:core-js@1.1.3/library/modules/$.iter-step", "npm:core-js@1.1.3/library/modules/$.iterators", "npm:core-js@1.1.3/library/modules/$.to-iobject", "npm:core-js@1.1.3/library/modules/$.iter-define"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var setUnscope = require("npm:core-js@1.1.3/library/modules/$.unscope"),
      step = require("npm:core-js@1.1.3/library/modules/$.iter-step"),
      Iterators = require("npm:core-js@1.1.3/library/modules/$.iterators"),
      toIObject = require("npm:core-js@1.1.3/library/modules/$.to-iobject");
  require("npm:core-js@1.1.3/library/modules/$.iter-define")(Array, 'Array', function(iterated, kind) {
    this._t = toIObject(iterated);
    this._i = 0;
    this._k = kind;
  }, function() {
    var O = this._t,
        kind = this._k,
        index = this._i++;
    if (!O || index >= O.length) {
      this._t = undefined;
      return step(1);
    }
    if (kind == 'keys')
      return step(0, index);
    if (kind == 'values')
      return step(0, O[index]);
    return step(0, [index, O[index]]);
  }, 'values');
  Iterators.Arguments = Iterators.Array;
  setUnscope('keys');
  setUnscope('values');
  setUnscope('entries');
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/modules/$.iterators", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = {};
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/modules/$.string-at", ["npm:core-js@1.1.3/library/modules/$.to-integer", "npm:core-js@1.1.3/library/modules/$.defined"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var toInteger = require("npm:core-js@1.1.3/library/modules/$.to-integer"),
      defined = require("npm:core-js@1.1.3/library/modules/$.defined");
  module.exports = function(TO_STRING) {
    return function(that, pos) {
      var s = String(defined(that)),
          i = toInteger(pos),
          l = s.length,
          a,
          b;
      if (i < 0 || i >= l)
        return TO_STRING ? '' : undefined;
      a = s.charCodeAt(i);
      return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff ? TO_STRING ? s.charAt(i) : a : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
    };
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/modules/$.iter-define", ["npm:core-js@1.1.3/library/modules/$.library", "npm:core-js@1.1.3/library/modules/$.def", "npm:core-js@1.1.3/library/modules/$.redef", "npm:core-js@1.1.3/library/modules/$.hide", "npm:core-js@1.1.3/library/modules/$.has", "npm:core-js@1.1.3/library/modules/$.wks", "npm:core-js@1.1.3/library/modules/$.iterators", "npm:core-js@1.1.3/library/modules/$.iter-create", "npm:core-js@1.1.3/library/modules/$", "npm:core-js@1.1.3/library/modules/$.tag", "npm:core-js@1.1.3/library/modules/$.iter-buggy"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var LIBRARY = require("npm:core-js@1.1.3/library/modules/$.library"),
      $def = require("npm:core-js@1.1.3/library/modules/$.def"),
      $redef = require("npm:core-js@1.1.3/library/modules/$.redef"),
      hide = require("npm:core-js@1.1.3/library/modules/$.hide"),
      has = require("npm:core-js@1.1.3/library/modules/$.has"),
      SYMBOL_ITERATOR = require("npm:core-js@1.1.3/library/modules/$.wks")('iterator'),
      Iterators = require("npm:core-js@1.1.3/library/modules/$.iterators"),
      FF_ITERATOR = '@@iterator',
      KEYS = 'keys',
      VALUES = 'values';
  var returnThis = function() {
    return this;
  };
  module.exports = function(Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCE) {
    require("npm:core-js@1.1.3/library/modules/$.iter-create")(Constructor, NAME, next);
    var createMethod = function(kind) {
      switch (kind) {
        case KEYS:
          return function keys() {
            return new Constructor(this, kind);
          };
        case VALUES:
          return function values() {
            return new Constructor(this, kind);
          };
      }
      return function entries() {
        return new Constructor(this, kind);
      };
    };
    var TAG = NAME + ' Iterator',
        proto = Base.prototype,
        _native = proto[SYMBOL_ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT],
        _default = _native || createMethod(DEFAULT),
        methods,
        key;
    if (_native) {
      var IteratorPrototype = require("npm:core-js@1.1.3/library/modules/$").getProto(_default.call(new Base));
      require("npm:core-js@1.1.3/library/modules/$.tag")(IteratorPrototype, TAG, true);
      if (!LIBRARY && has(proto, FF_ITERATOR))
        hide(IteratorPrototype, SYMBOL_ITERATOR, returnThis);
    }
    if (!LIBRARY || FORCE)
      hide(proto, SYMBOL_ITERATOR, _default);
    Iterators[NAME] = _default;
    Iterators[TAG] = returnThis;
    if (DEFAULT) {
      methods = {
        keys: IS_SET ? _default : createMethod(KEYS),
        values: DEFAULT == VALUES ? _default : createMethod(VALUES),
        entries: DEFAULT != VALUES ? _default : createMethod('entries')
      };
      if (FORCE)
        for (key in methods) {
          if (!(key in proto))
            $redef(proto, key, methods[key]);
        }
      else
        $def($def.P + $def.F * require("npm:core-js@1.1.3/library/modules/$.iter-buggy"), NAME, methods);
    }
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/modules/$.classof", ["npm:core-js@1.1.3/library/modules/$.cof", "npm:core-js@1.1.3/library/modules/$.wks"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var cof = require("npm:core-js@1.1.3/library/modules/$.cof"),
      TAG = require("npm:core-js@1.1.3/library/modules/$.wks")('toStringTag'),
      ARG = cof(function() {
        return arguments;
      }()) == 'Arguments';
  module.exports = function(it) {
    var O,
        T,
        B;
    return it === undefined ? 'Undefined' : it === null ? 'Null' : typeof(T = (O = Object(it))[TAG]) == 'string' ? T : ARG ? cof(O) : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/modules/$.core", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var core = module.exports = {};
  if (typeof __e == 'number')
    __e = core;
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/modules/$.wks", ["npm:core-js@1.1.3/library/modules/$.shared", "npm:core-js@1.1.3/library/modules/$.global", "npm:core-js@1.1.3/library/modules/$.uid"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var store = require("npm:core-js@1.1.3/library/modules/$.shared")('wks'),
      Symbol = require("npm:core-js@1.1.3/library/modules/$.global").Symbol;
  module.exports = function(name) {
    return store[name] || (store[name] = Symbol && Symbol[name] || (Symbol || require("npm:core-js@1.1.3/library/modules/$.uid"))('Symbol.' + name));
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/modules/$.an-object", ["npm:core-js@1.1.3/library/modules/$.is-object"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var isObject = require("npm:core-js@1.1.3/library/modules/$.is-object");
  module.exports = function(it) {
    if (!isObject(it))
      throw TypeError(it + ' is not an object!');
    return it;
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/modules/core.get-iterator-method", ["npm:core-js@1.1.3/library/modules/$.classof", "npm:core-js@1.1.3/library/modules/$.wks", "npm:core-js@1.1.3/library/modules/$.iterators", "npm:core-js@1.1.3/library/modules/$.core"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var classof = require("npm:core-js@1.1.3/library/modules/$.classof"),
      ITERATOR = require("npm:core-js@1.1.3/library/modules/$.wks")('iterator'),
      Iterators = require("npm:core-js@1.1.3/library/modules/$.iterators");
  module.exports = require("npm:core-js@1.1.3/library/modules/$.core").getIteratorMethod = function(it) {
    if (it != undefined)
      return it[ITERATOR] || it['@@iterator'] || Iterators[classof(it)];
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.15.1/src/internal/_curry1", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function _curry1(fn) {
    return function f1(a) {
      if (arguments.length === 0) {
        return f1;
      } else if (a != null && a['@@functional/placeholder'] === true) {
        return f1;
      } else {
        return fn(a);
      }
    };
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/internal/_cloneRegExp", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function _cloneRegExp(pattern) {
    return new RegExp(pattern.source, (pattern.global ? 'g' : '') + (pattern.ignoreCase ? 'i' : '') + (pattern.multiline ? 'm' : '') + (pattern.sticky ? 'y' : '') + (pattern.unicode ? 'u' : ''));
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/internal/_indexOf", ["npm:ramda@0.17.1/src/equals"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var equals = require("npm:ramda@0.17.1/src/equals");
  module.exports = function _indexOf(list, item, from) {
    var idx = from;
    while (idx < list.length) {
      if (equals(list[idx], item)) {
        return idx;
      }
      idx += 1;
    }
    return -1;
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/filter", ["npm:ramda@0.17.1/src/internal/_curry2", "npm:ramda@0.17.1/src/internal/_dispatchable", "npm:ramda@0.17.1/src/internal/_filter", "npm:ramda@0.17.1/src/internal/_xfilter"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("npm:ramda@0.17.1/src/internal/_curry2");
  var _dispatchable = require("npm:ramda@0.17.1/src/internal/_dispatchable");
  var _filter = require("npm:ramda@0.17.1/src/internal/_filter");
  var _xfilter = require("npm:ramda@0.17.1/src/internal/_xfilter");
  module.exports = _curry2(_dispatchable('filter', _xfilter, _filter));
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/internal/_complement", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function _complement(f) {
    return function() {
      return !f.apply(this, arguments);
    };
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/bind", ["npm:ramda@0.17.1/src/internal/_arity", "npm:ramda@0.17.1/src/internal/_curry2"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _arity = require("npm:ramda@0.17.1/src/internal/_arity");
  var _curry2 = require("npm:ramda@0.17.1/src/internal/_curry2");
  module.exports = _curry2(function bind(fn, thisObj) {
    return _arity(fn.length, function() {
      return fn.apply(thisObj, arguments);
    });
  });
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:process@0.10.1/browser", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var process = module.exports = {};
  var queue = [];
  var draining = false;
  function drainQueue() {
    if (draining) {
      return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while (len) {
      currentQueue = queue;
      queue = [];
      var i = -1;
      while (++i < len) {
        currentQueue[i]();
      }
      len = queue.length;
    }
    draining = false;
  }
  process.nextTick = function(fun) {
    queue.push(fun);
    if (!draining) {
      setTimeout(drainQueue, 0);
    }
  };
  process.title = 'browser';
  process.browser = true;
  process.env = {};
  process.argv = [];
  process.version = '';
  process.versions = {};
  function noop() {}
  process.on = noop;
  process.addListener = noop;
  process.once = noop;
  process.off = noop;
  process.removeListener = noop;
  process.removeAllListeners = noop;
  process.emit = noop;
  process.binding = function(name) {
    throw new Error('process.binding is not supported');
  };
  process.cwd = function() {
    return '/';
  };
  process.chdir = function(dir) {
    throw new Error('process.chdir is not supported');
  };
  process.umask = function() {
    return 0;
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/internal/_xwrap", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = (function() {
    function XWrap(fn) {
      this.f = fn;
    }
    XWrap.prototype['@@transducer/init'] = function() {
      throw new Error('init not implemented on XWrap');
    };
    XWrap.prototype['@@transducer/result'] = function(acc) {
      return acc;
    };
    XWrap.prototype['@@transducer/step'] = function(acc, x) {
      return this.f(acc, x);
    };
    return function _xwrap(fn) {
      return new XWrap(fn);
    };
  }());
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/modules/$.unscope", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function() {};
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/modules/$.iter-step", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function(done, value) {
    return {
      value: value,
      done: !!done
    };
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/modules/$.to-iobject", ["npm:core-js@1.1.3/library/modules/$.iobject", "npm:core-js@1.1.3/library/modules/$.defined"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var IObject = require("npm:core-js@1.1.3/library/modules/$.iobject"),
      defined = require("npm:core-js@1.1.3/library/modules/$.defined");
  module.exports = function(it) {
    return IObject(defined(it));
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/modules/$.to-integer", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var ceil = Math.ceil,
      floor = Math.floor;
  module.exports = function(it) {
    return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/modules/$.library", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = true;
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/modules/$.defined", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function(it) {
    if (it == undefined)
      throw TypeError("Can't call method on  " + it);
    return it;
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/modules/$.def", ["npm:core-js@1.1.3/library/modules/$.global", "npm:core-js@1.1.3/library/modules/$.core"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var global = require("npm:core-js@1.1.3/library/modules/$.global"),
      core = require("npm:core-js@1.1.3/library/modules/$.core"),
      PROTOTYPE = 'prototype';
  var ctx = function(fn, that) {
    return function() {
      return fn.apply(that, arguments);
    };
  };
  var $def = function(type, name, source) {
    var key,
        own,
        out,
        exp,
        isGlobal = type & $def.G,
        isProto = type & $def.P,
        target = isGlobal ? global : type & $def.S ? global[name] : (global[name] || {})[PROTOTYPE],
        exports = isGlobal ? core : core[name] || (core[name] = {});
    if (isGlobal)
      source = name;
    for (key in source) {
      own = !(type & $def.F) && target && key in target;
      if (own && key in exports)
        continue;
      out = own ? target[key] : source[key];
      if (isGlobal && typeof target[key] != 'function')
        exp = source[key];
      else if (type & $def.B && own)
        exp = ctx(out, global);
      else if (type & $def.W && target[key] == out)
        !function(C) {
          exp = function(param) {
            return this instanceof C ? new C(param) : C(param);
          };
          exp[PROTOTYPE] = C[PROTOTYPE];
        }(out);
      else
        exp = isProto && typeof out == 'function' ? ctx(Function.call, out) : out;
      exports[key] = exp;
      if (isProto)
        (exports[PROTOTYPE] || (exports[PROTOTYPE] = {}))[key] = out;
    }
  };
  $def.F = 1;
  $def.G = 2;
  $def.S = 4;
  $def.P = 8;
  $def.B = 16;
  $def.W = 32;
  module.exports = $def;
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/modules/$.redef", ["npm:core-js@1.1.3/library/modules/$.hide"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("npm:core-js@1.1.3/library/modules/$.hide");
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/modules/$.iter-create", ["npm:core-js@1.1.3/library/modules/$", "npm:core-js@1.1.3/library/modules/$.hide", "npm:core-js@1.1.3/library/modules/$.wks", "npm:core-js@1.1.3/library/modules/$.property-desc", "npm:core-js@1.1.3/library/modules/$.tag"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var $ = require("npm:core-js@1.1.3/library/modules/$"),
      IteratorPrototype = {};
  require("npm:core-js@1.1.3/library/modules/$.hide")(IteratorPrototype, require("npm:core-js@1.1.3/library/modules/$.wks")('iterator'), function() {
    return this;
  });
  module.exports = function(Constructor, NAME, next) {
    Constructor.prototype = $.create(IteratorPrototype, {next: require("npm:core-js@1.1.3/library/modules/$.property-desc")(1, next)});
    require("npm:core-js@1.1.3/library/modules/$.tag")(Constructor, NAME + ' Iterator');
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/modules/$.hide", ["npm:core-js@1.1.3/library/modules/$", "npm:core-js@1.1.3/library/modules/$.property-desc", "npm:core-js@1.1.3/library/modules/$.support-desc"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var $ = require("npm:core-js@1.1.3/library/modules/$"),
      createDesc = require("npm:core-js@1.1.3/library/modules/$.property-desc");
  module.exports = require("npm:core-js@1.1.3/library/modules/$.support-desc") ? function(object, key, value) {
    return $.setDesc(object, key, createDesc(1, value));
  } : function(object, key, value) {
    object[key] = value;
    return object;
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/modules/$.has", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var hasOwnProperty = {}.hasOwnProperty;
  module.exports = function(it, key) {
    return hasOwnProperty.call(it, key);
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/modules/$.tag", ["npm:core-js@1.1.3/library/modules/$.has", "npm:core-js@1.1.3/library/modules/$.hide", "npm:core-js@1.1.3/library/modules/$.wks"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var has = require("npm:core-js@1.1.3/library/modules/$.has"),
      hide = require("npm:core-js@1.1.3/library/modules/$.hide"),
      TAG = require("npm:core-js@1.1.3/library/modules/$.wks")('toStringTag');
  module.exports = function(it, tag, stat) {
    if (it && !has(it = stat ? it : it.prototype, TAG))
      hide(it, TAG, tag);
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/modules/$.iter-buggy", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = 'keys' in [] && !('next' in [].keys());
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/modules/$", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var $Object = Object;
  module.exports = {
    create: $Object.create,
    getProto: $Object.getPrototypeOf,
    isEnum: {}.propertyIsEnumerable,
    getDesc: $Object.getOwnPropertyDescriptor,
    setDesc: $Object.defineProperty,
    setDescs: $Object.defineProperties,
    getKeys: $Object.keys,
    getNames: $Object.getOwnPropertyNames,
    getSymbols: $Object.getOwnPropertySymbols,
    each: [].forEach
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/modules/$.cof", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var toString = {}.toString;
  module.exports = function(it) {
    return toString.call(it).slice(8, -1);
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/modules/$.shared", ["npm:core-js@1.1.3/library/modules/$.global"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var global = require("npm:core-js@1.1.3/library/modules/$.global"),
      SHARED = '__core-js_shared__',
      store = global[SHARED] || (global[SHARED] = {});
  module.exports = function(key) {
    return store[key] || (store[key] = {});
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/modules/$.global", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var UNDEFINED = 'undefined';
  var global = module.exports = typeof window != UNDEFINED && window.Math == Math ? window : typeof self != UNDEFINED && self.Math == Math ? self : Function('return this')();
  if (typeof __g == 'number')
    __g = global;
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/modules/$.uid", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var id = 0,
      px = Math.random();
  module.exports = function(key) {
    return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/modules/$.is-object", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function(it) {
    return it !== null && (typeof it == 'object' || typeof it == 'function');
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/internal/_filter", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function _filter(fn, list) {
    var idx = 0,
        len = list.length,
        result = [];
    while (idx < len) {
      if (fn(list[idx])) {
        result[result.length] = list[idx];
      }
      idx += 1;
    }
    return result;
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/modules/$.iobject", ["npm:core-js@1.1.3/library/modules/$.cof"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var cof = require("npm:core-js@1.1.3/library/modules/$.cof");
  module.exports = 0 in Object('z') ? Object : function(it) {
    return cof(it) == 'String' ? it.split('') : Object(it);
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:ramda@0.17.1/src/internal/_xfilter", ["npm:ramda@0.17.1/src/internal/_curry2", "npm:ramda@0.17.1/src/internal/_xfBase"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("npm:ramda@0.17.1/src/internal/_curry2");
  var _xfBase = require("npm:ramda@0.17.1/src/internal/_xfBase");
  module.exports = (function() {
    function XFilter(f, xf) {
      this.xf = xf;
      this.f = f;
    }
    XFilter.prototype['@@transducer/init'] = _xfBase.init;
    XFilter.prototype['@@transducer/result'] = _xfBase.result;
    XFilter.prototype['@@transducer/step'] = function(result, input) {
      return this.f(input) ? this.xf['@@transducer/step'](result, input) : result;
    };
    return _curry2(function _xfilter(f, xf) {
      return new XFilter(f, xf);
    });
  })();
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/modules/$.property-desc", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function(bitmap, value) {
    return {
      enumerable: !(bitmap & 1),
      configurable: !(bitmap & 2),
      writable: !(bitmap & 4),
      value: value
    };
  };
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/modules/$.support-desc", ["npm:core-js@1.1.3/library/modules/$.fails"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = !require("npm:core-js@1.1.3/library/modules/$.fails")(function() {
    return Object.defineProperty({}, 'a', {get: function() {
        return 7;
      }}).a != 7;
  });
  global.define = __define;
  return module.exports;
});

System.registerDynamic("npm:core-js@1.1.3/library/modules/$.fails", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function(exec) {
    try {
      return !!exec();
    } catch (e) {
      return true;
    }
  };
  global.define = __define;
  return module.exports;
});

System.register('js/main.js', ['npm:babel-runtime@5.8.20/helpers/sliced-to-array', 'npm:ramda@0.17.1/src/flip', 'npm:flyd@0.1.14', 'npm:snabbdom@0.2.6', 'npm:snabbdom@0.2.6/modules/class', 'npm:snabbdom@0.2.6/modules/props', 'npm:snabbdom@0.2.6/modules/attributes', 'npm:snabbdom@0.2.6/modules/eventlisteners', 'npm:snabbdom@0.2.6/modules/style', 'js/app.js'], function (_export) {
  var _slicedToArray, flip, flyd, snabbdom, cl, pr, at, ev, st, app, patch, throwOr, update, action$, state$, vnode$;

  return {
    setters: [function (_npmBabelRuntime5820HelpersSlicedToArray) {
      _slicedToArray = _npmBabelRuntime5820HelpersSlicedToArray['default'];
    }, function (_npmRamda0171SrcFlip) {
      flip = _npmRamda0171SrcFlip['default'];
    }, function (_npmFlyd0114) {
      flyd = _npmFlyd0114['default'];
    }, function (_npmSnabbdom026) {
      snabbdom = _npmSnabbdom026['default'];
    }, function (_npmSnabbdom026ModulesClass) {
      cl = _npmSnabbdom026ModulesClass['default'];
    }, function (_npmSnabbdom026ModulesProps) {
      pr = _npmSnabbdom026ModulesProps['default'];
    }, function (_npmSnabbdom026ModulesAttributes) {
      at = _npmSnabbdom026ModulesAttributes['default'];
    }, function (_npmSnabbdom026ModulesEventlisteners) {
      ev = _npmSnabbdom026ModulesEventlisteners['default'];
    }, function (_npmSnabbdom026ModulesStyle) {
      st = _npmSnabbdom026ModulesStyle['default'];
    }, function (_jsAppJs) {
      app = _jsAppJs['default'];
    }],
    execute: function () {
      /* globals: window, document */

      'use strict';

      patch = snabbdom.init([cl, pr, at, ev, st]);

      throwOr = function throwOr(fn) {
        return function (x) {
          if (x instanceof Error) throw x;
          return fn(x);
        };
      };

      update = function update(action, state) {
        var _app$update = app.update(action, state);

        var _app$update2 = _slicedToArray(_app$update, 2);

        var state1 = _app$update2[0];
        var tasks = _app$update2[1];

        tasks.map(function (t) {
          return t.fork(throwOr(action$), action$);
        });
        return state1;
      };

      action$ = flyd.stream();
      state$ = flyd.scan(flip(update), app.init(), action$);
      vnode$ = flyd.map(app.view({ action$: action$ }), state$);

      flyd.on(console.log.bind(console), state$);

      // Begin rendering when the DOM is ready
      window.addEventListener('DOMContentLoaded', function () {
        var el = document.getElementById('container');
        flyd.scan(patch, el, vnode$);
      });
    }
  };
});
System.register('js/app.js', ['npm:babel-runtime@5.8.20/helpers/sliced-to-array', 'npm:ramda@0.17.1/src/curry', 'npm:ramda@0.17.1/src/compose', 'npm:ramda@0.17.1/src/map', 'npm:ramda@0.17.1/src/chain', 'npm:ramda@0.17.1/src/identity', 'npm:ramda@0.17.1/src/invoker', 'npm:ramda@0.17.1/src/ifElse', 'npm:ramda@0.17.1/src/path', 'npm:ramda@0.17.1/src/props', 'npm:ramda@0.17.1/src/prop', 'npm:ramda@0.17.1/src/assoc', 'npm:ramda@0.17.1/src/equals', 'npm:ramda@0.17.1/src/prepend', 'npm:ramda@0.17.1/src/insert', 'npm:ramda@0.17.1/src/join', 'npm:ramda@0.17.1/src/allPass', 'npm:union-type@0.1.6', 'npm:ramda-fantasy@0.4.0/src/Future', 'npm:ramda-fantasy@0.4.0/src/Maybe', 'npm:flyd-forwardto@0.0.2', 'npm:snabbdom@0.2.6/h', 'js/autocomplete.js', 'js/menu.js'], function (_export) {
  var _slicedToArray, curry, compose, map, chain, identity, invoker, ifElse, path, props, prop, assoc, equals, prepend, insert, join, allPass, Type, Future, Maybe, forwardTo, h, autocomplete, menu, rejectFut, promToFut, getJSON, getUrl, respIsOK, targetValue, nullEmpty, noFx, searchItem, searchItemValue, searchMenu, search, query, getZipsAndPlaces, parseResult, fetchFail, fetchZips, toParams, parseInput, init, Action, update, view, header, countryMenu;

  return {
    setters: [function (_npmBabelRuntime5820HelpersSlicedToArray) {
      _slicedToArray = _npmBabelRuntime5820HelpersSlicedToArray['default'];
    }, function (_npmRamda0171SrcCurry) {
      curry = _npmRamda0171SrcCurry['default'];
    }, function (_npmRamda0171SrcCompose) {
      compose = _npmRamda0171SrcCompose['default'];
    }, function (_npmRamda0171SrcMap) {
      map = _npmRamda0171SrcMap['default'];
    }, function (_npmRamda0171SrcChain) {
      chain = _npmRamda0171SrcChain['default'];
    }, function (_npmRamda0171SrcIdentity) {
      identity = _npmRamda0171SrcIdentity['default'];
    }, function (_npmRamda0171SrcInvoker) {
      invoker = _npmRamda0171SrcInvoker['default'];
    }, function (_npmRamda0171SrcIfElse) {
      ifElse = _npmRamda0171SrcIfElse['default'];
    }, function (_npmRamda0171SrcPath) {
      path = _npmRamda0171SrcPath['default'];
    }, function (_npmRamda0171SrcProps) {
      props = _npmRamda0171SrcProps['default'];
    }, function (_npmRamda0171SrcProp) {
      prop = _npmRamda0171SrcProp['default'];
    }, function (_npmRamda0171SrcAssoc) {
      assoc = _npmRamda0171SrcAssoc['default'];
    }, function (_npmRamda0171SrcEquals) {
      equals = _npmRamda0171SrcEquals['default'];
    }, function (_npmRamda0171SrcPrepend) {
      prepend = _npmRamda0171SrcPrepend['default'];
    }, function (_npmRamda0171SrcInsert) {
      insert = _npmRamda0171SrcInsert['default'];
    }, function (_npmRamda0171SrcJoin) {
      join = _npmRamda0171SrcJoin['default'];
    }, function (_npmRamda0171SrcAllPass) {
      allPass = _npmRamda0171SrcAllPass['default'];
    }, function (_npmUnionType016) {
      Type = _npmUnionType016['default'];
    }, function (_npmRamdaFantasy040SrcFuture) {
      Future = _npmRamdaFantasy040SrcFuture['default'];
    }, function (_npmRamdaFantasy040SrcMaybe) {
      Maybe = _npmRamdaFantasy040SrcMaybe['default'];
    }, function (_npmFlydForwardto002) {
      forwardTo = _npmFlydForwardto002['default'];
    }, function (_npmSnabbdom026H) {
      h = _npmSnabbdom026H['default'];
    }, function (_jsAutocompleteJs) {
      autocomplete = _jsAutocompleteJs['default'];
    }, function (_jsMenuJs) {
      menu = _jsMenuJs['default'];
    }],
    execute: function () {
      /* globals window, document */

      // utils

      'use strict';

      rejectFut = function rejectFut(val) {
        return Future(function (rej, res) {
          return rej(val);
        });
      };

      promToFut = function promToFut(prom) {
        return Future(function (rej, res) {
          return prom.then(res, rej);
        });
      };

      getJSON = compose(promToFut, invoker(0, 'json'));

      getUrl = function getUrl(url) {
        return promToFut(window.fetch(new window.Request(url, { method: 'GET' })));
      };

      respIsOK = function respIsOK(r) {
        return !!r.ok;
      };

      targetValue = path(['target', 'value']);

      nullEmpty = function nullEmpty(x) {
        return x.length === 0 ? null : x;
      };

      noFx = function noFx(s) {
        return [s, []];
      };

      ////////////////////////////////////////////////////////////////////////////////
      // app constants

      searchItem = { // mini-component
        init: identity,
        view: function view(_ref) {
          var _ref2 = _slicedToArray(_ref, 3);

          var place = _ref2[0];
          var state = _ref2[1];
          var post = _ref2[2];

          return h('div', [h('span.place', place + ', ' + state), h('span.post', post)]);
        }
      };

      searchItemValue = function searchItemValue(_ref3) {
        var _ref32 = _slicedToArray(_ref3, 3);

        var place = _ref32[0];
        var state = _ref32[1];
        var post = _ref32[2];
        return place + ', ' + state + ' ' + post;
      };

      searchMenu = menu(searchItem, searchItemValue);
      search = autocomplete(searchMenu);

      ////////////////////////////////////////////////////////////////////////////////
      // autocomplete query

      // Object -> String -> Future (String, Array (Array String))

      query = function query(model) {
        return compose(chain(ifElse(respIsOK, parseResult, fetchFail)), chain(fetchZips), toParams(model));
      };

      getZipsAndPlaces = function getZipsAndPlaces(data) {
        var placeAndZips = map(props(['place name', 'post code']), data.places);
        return map(insert(1, data['state abbreviation']), placeAndZips);
      };

      // Response -> Future ((), Array (Array String))
      parseResult = compose(map(getZipsAndPlaces), getJSON);

      // Response -> Future (String, ())

      fetchFail = function fetchFail(resp) {
        return rejectFut("Not found");
      };

      // Array String -> Future ((), Response)

      fetchZips = function fetchZips(_ref4) {
        var _ref42 = _slicedToArray(_ref4, 3);

        var country = _ref42[0];
        var state = _ref42[1];
        var place = _ref42[2];

        return getUrl('http://api.zippopotam.us/' + country + '/' + state + '/' + place);
      };

      // Object -> String -> Future (String, Array String)

      toParams = function toParams(model) {
        return function (str, _) {
          return new Future(function (rej, res) {
            var stateAndPlace = parseInput(str);
            var country = model.country;
            if (stateAndPlace.length !== 2) {
              rej("Enter place name and state or province, separated by a comma");return;
            }
            if (Maybe.isNothing(country)) {
              rej("Select a country");return;
            }
            map(function (c) {
              return res(prepend(c, stateAndPlace));
            }, country);
          });
        };
      };

      parseInput = function parseInput(str) {
        var raw = map(function (part) {
          return part.trim();
        }, str.split(','));
        if (raw.some(function (part) {
          return part.length === 0;
        })) return [];
        return raw.reverse();
      };

      ///////////////////////////////////////////////////////////////////////////////
      // model

      init = function init() {
        return {
          message: Maybe.Nothing(),
          country: Maybe.Nothing(),
          search: search.init()
        };
      };

      // update

      Action = Type({
        SetCountry: [String],
        Search: [search.Action]
      });
      update = Action.caseOn({

        SetCountry: function SetCountry(str, model) {
          return noFx(assoc('country', Maybe(nullEmpty(str)), model));
        },

        Search: function Search(action, model) {
          var _search$update = search.update(action, model.search);

          var _search$update2 = _slicedToArray(_search$update, 2);

          var s = _search$update2[0];
          var tasks = _search$update2[1];

          return [assoc('search', s, model), map(function (t) {
            return t.bimap(Action.Search, Action.Search);
          }, tasks)];
        }
      });

      // view

      view = curry(function (_ref5, model) {
        var action$ = _ref5.action$;
        return h('div#app', [h('h1', 'Zip codes autocomplete example'), h('h2', header(model)), h('div.country', [h('label', { attrs: { 'for': 'country' } }, 'Country'), countryMenu(action$, ['', 'DE', 'ES', 'FR', 'US'])]), search.view({ action$: forwardTo(action$, Action.Search),
          query: query(model)
        }, model.search)]);
      });

      header = function header(model) {
        return model.country.isNothing() ? "Select a country" : model.search.isEditing ? "" : "Enter a place and state or province, separated by a comma";
      };

      countryMenu = function countryMenu(action$, codes) {
        return h('select', {
          on: {
            change: compose(action$, Action.SetCountry, targetValue)
          }
        }, map(function (code) {
          return h('option', code);
        }, codes));
      };

      _export('default', { init: init, update: update, Action: Action, view: view, search: search, searchMenu: searchMenu, query: query });
    }
  };
});
System.register('js/menu.js', ['npm:ramda@0.17.1/src/curry', 'npm:ramda@0.17.1/src/assoc', 'npm:ramda@0.17.1/src/merge', 'npm:ramda@0.17.1/src/map', 'npm:ramda@0.17.1/src/toString', 'npm:union-type@0.1.6', 'npm:snabbdom@0.2.6/h'], function (_export) {
  'use strict';

  var curry, assoc, merge, map, toString, Type, h, identity;

  _export('default', menu);

  function menu(itemComponent, valueAccessor) {

    // model

    // TODO: use a Maybe for selected/selectedValue

    var init = function init() {
      var items = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

      return {
        selected: null,
        selectedValue: null,
        items: map(itemComponent.init, items)
      };
    };

    var nextIndex = function nextIndex(model) {
      var i = model.selected,
          n = model.items.length;
      return i === null ? n === 0 ? null : 0 : (i + 1) % n;
    };

    var prevIndex = function prevIndex(model) {
      var i = model.selected,
          n = model.items.length;
      return i === null ? n === 0 ? null : n - 1 : (n + (i - 1)) % n;
    };

    // update

    var Action = Type({
      Select: [Number],
      SelectNext: [],
      SelectPrev: [],
      Refresh: [Array],
      Clear: [String]
    });

    var update = Action.caseOn({

      Select: function Select(i, model) {
        var it = model.items[i];
        var v = it === undefined ? null : valueAccessor(it);
        return assoc('selectedValue', v, assoc('selected', i, model));
      },

      SelectNext: function SelectNext(model) {
        var i = nextIndex(model);
        if (i === null) return model;
        return update(Action.Select(i, model), model);
      },

      SelectPrev: function SelectPrev(model) {
        var i = prevIndex(model);
        if (i === null) return model;
        return update(Action.Select(i, model), model);
      },

      Refresh: init,

      Clear: function Clear(_, model) {
        return init([]);
      }

    });

    // view

    var initStyle = function initStyle() {
      return { li: {}, ul: {} };
    };
    var fixedStyle = {
      ul: {
        'list-style': 'none',
        'padding': '0',
        'margin-top': '0',
        'margin-bottom': '0'
      },
      li: {
        'cursor': 'pointer'
      }
    };

    var view = curry(function (_ref, model) {
      var _ref$style = _ref.style;
      var style = _ref$style === undefined ? initStyle() : _ref$style;
      var action$ = _ref.action$;

      style.ul = merge(style.ul || {}, fixedStyle.ul);
      style.li = merge(style.li || {}, fixedStyle.li);

      var li = function li(item, i) {
        var itemview = itemComponent.view(item);
        return h('li', { 'class': { selected: model.selected === i },
          style: style.li,
          on: { click: [action$, Action.Select(i)] }
        }, typeof itemview == 'string' ? itemview : [itemview]);
      };

      return h('ul', { style: style.ul }, model.items.map(li));
    });

    return { init: init, update: update, Action: Action, view: view };
  }

  return {
    setters: [function (_npmRamda0171SrcCurry) {
      curry = _npmRamda0171SrcCurry['default'];
    }, function (_npmRamda0171SrcAssoc) {
      assoc = _npmRamda0171SrcAssoc['default'];
    }, function (_npmRamda0171SrcMerge) {
      merge = _npmRamda0171SrcMerge['default'];
    }, function (_npmRamda0171SrcMap) {
      map = _npmRamda0171SrcMap['default'];
    }, function (_npmRamda0171SrcToString) {
      toString = _npmRamda0171SrcToString['default'];
    }, function (_npmUnionType016) {
      Type = _npmUnionType016['default'];
    }, function (_npmSnabbdom026H) {
      h = _npmSnabbdom026H['default'];
    }],
    execute: function () {
      identity = function identity(x) {
        return x;
      };
    }
  };
});
System.register('js/autocomplete.js', ['npm:ramda@0.17.1/src/curry', 'npm:ramda@0.17.1/src/compose', 'npm:ramda@0.17.1/src/map', 'npm:ramda@0.17.1/src/always', 'npm:ramda@0.17.1/src/T', 'npm:ramda@0.17.1/src/F', 'npm:ramda@0.17.1/src/assoc', 'npm:ramda@0.17.1/src/merge', 'npm:ramda@0.17.1/src/lensProp', 'npm:ramda@0.17.1/src/view', 'npm:union-type@0.1.6', 'npm:ramda-fantasy@0.4.0/src/Future', 'npm:flyd-forwardto@0.0.2', 'npm:snabbdom@0.2.6/h'], function (_export) {
  'use strict';

  var curry, compose, map, always, T, F, assoc, merge, lensProp, get, Type, Future, forwardTo, h, noop, throwOr, positionUnder, repositionUnder, style, caseKey;

  _export('default', autocomplete);

  function autocomplete(menu) {

    // model

    var init = function init() {
      var value = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

      return {
        menu: menu.init(),
        isEditing: false,
        value: value
      };
    };

    var selectedOrInputValue = function selectedOrInputValue(model) {
      return model.menu.selectedValue === null ? model.value : model.menu.selectedValue;
    };

    // update

    var noFx = function noFx(s) {
      return [s, []];
    };

    var Action = Type({
      Input: [Function, String],
      UpdateMenu: [menu.Action],
      ShowMenu: [],
      HideMenu: []
    });

    var refreshMenu = compose(Action.UpdateMenu, menu.Action.Refresh);
    var clearMenu = compose(Action.UpdateMenu, menu.Action.Clear);

    var update = Action.caseOn({

      Input: function Input(query, str, model) {
        var tasks = [query(str, model).bimap(throwOr(clearMenu), refreshMenu)];
        return [assoc('isEditing', true, assoc('value', str, model)), tasks];
      },

      UpdateMenu: function UpdateMenu(action, model) {
        return noFx(assoc('menu', menu.update(action, model.menu), model));
      },

      ShowMenu: compose(noFx, assoc('isEditing', true)),

      HideMenu: compose(noFx, assoc('isEditing', false))

    });

    // view

    var valueLens = compose(lensProp('target'), lensProp('value'));

    var view = curry(function (_ref, model) {
      var query = _ref.query;
      var action$ = _ref.action$;

      var menuAction$ = forwardTo(action$, Action.UpdateMenu);
      var menuView = menu.view({ action$: menuAction$ });

      var handleEsc = compose(action$, always(Action.HideMenu()));
      var handleEnter = handleEsc;
      var handleDown = compose(menuAction$, always(menu.Action.SelectNext()));
      var handleUp = compose(menuAction$, always(menu.Action.SelectPrev()));

      var showMenu = model.isEditing && model.menu.items.length > 0;

      var input = h('input', {
        on: {
          input: compose(action$, Action.Input(query), get(valueLens)),
          keydown: !model.isEditing ? noop : caseKey([[['Esc', 'Escape', 0x1B], handleEsc], [['Enter', 0x0A, 0x0D], handleEnter], [['Down', 'DownArrow', 0x28], handleDown], [['Up', 'UpArrow', 0x26], handleUp]]),
          blur: [action$, Action.HideMenu()]
        },
        props: { type: 'text',
          value: selectedOrInputValue(model)
        }
      });

      var menudiv = h('div.menu', {
        style: style.menu,
        hook: { insert: positionUnder('input'),
          postpatch: repositionUnder('input')
        }
      }, [menuView(model.menu)]);

      return h('div.autocomplete', showMenu ? [input, menudiv] : [input]);
    });

    return { init: init, update: update, Action: Action, view: view };
  }

  return {
    setters: [function (_npmRamda0171SrcCurry) {
      curry = _npmRamda0171SrcCurry['default'];
    }, function (_npmRamda0171SrcCompose) {
      compose = _npmRamda0171SrcCompose['default'];
    }, function (_npmRamda0171SrcMap) {
      map = _npmRamda0171SrcMap['default'];
    }, function (_npmRamda0171SrcAlways) {
      always = _npmRamda0171SrcAlways['default'];
    }, function (_npmRamda0171SrcT) {
      T = _npmRamda0171SrcT['default'];
    }, function (_npmRamda0171SrcF) {
      F = _npmRamda0171SrcF['default'];
    }, function (_npmRamda0171SrcAssoc) {
      assoc = _npmRamda0171SrcAssoc['default'];
    }, function (_npmRamda0171SrcMerge) {
      merge = _npmRamda0171SrcMerge['default'];
    }, function (_npmRamda0171SrcLensProp) {
      lensProp = _npmRamda0171SrcLensProp['default'];
    }, function (_npmRamda0171SrcView) {
      get = _npmRamda0171SrcView['default'];
    }, function (_npmUnionType016) {
      Type = _npmUnionType016['default'];
    }, function (_npmRamdaFantasy040SrcFuture) {
      Future = _npmRamdaFantasy040SrcFuture['default'];
    }, function (_npmFlydForwardto002) {
      forwardTo = _npmFlydForwardto002['default'];
    }, function (_npmSnabbdom026H) {
      h = _npmSnabbdom026H['default'];
    }],
    execute: function () {
      noop = function noop() {};

      throwOr = function throwOr(fn) {
        return function (x) {
          if (x instanceof Error) throw x;
          return fn(x);
        };
      };

      positionUnder = curry(function (selector, vnode) {
        var elm = vnode.elm,
            targetElm = elm.parentNode.querySelector(selector);
        if (!(elm && targetElm)) return;
        var rect = targetElm.getBoundingClientRect();
        elm.style.top = "" + (rect.top + rect.height + 1) + "px";
        elm.style.left = "" + rect.left + "px";
        return;
      });
      repositionUnder = curry(function (selector, oldVNode, vnode) {
        return positionUnder(selector, vnode);
      });
      style = {
        menu: {
          position: 'absolute',
          'z-index': '100',
          opacity: '1',
          transition: 'opacity 0.2s',
          remove: { opacity: '0' }
        }
      };

      // move to helpers?
      caseKey = curry(function (handlers, e) {
        var k = e.key || e.keyCode;
        var mapHandlers = handlers.reduce(function (o, handler) {
          for (var i = 0; i < handler[0].length; ++i) {
            o[handler[0][i]] = handler[1];
          }return o;
        }, {});
        return hasOwnProperty.call(mapHandlers, k) ? mapHandlers[k](e) : noop();
      });
    }
  };
});
//# sourceMappingURL=build.js.map