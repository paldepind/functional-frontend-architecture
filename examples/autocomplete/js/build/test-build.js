"format global";
(function(global) {

  var defined = {};

  // indexOf polyfill for IE8
  var indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++)
      if (this[i] === item)
        return i;
    return -1;
  }

  var getOwnPropertyDescriptor = true;
  try {
    Object.getOwnPropertyDescriptor({ a: 0 }, 'a');
  }
  catch(e) {
    getOwnPropertyDescriptor = false;
  }

  var defineProperty;
  (function () {
    try {
      if (!!Object.defineProperty({}, 'a', {}))
        defineProperty = Object.defineProperty;
    }
    catch (e) {
      defineProperty = function(obj, prop, opt) {
        try {
          obj[prop] = opt.value || opt.get.call(obj);
        }
        catch(e) {}
      }
    }
  })();

  function register(name, deps, declare) {
    if (arguments.length === 4)
      return registerDynamic.apply(this, arguments);
    doRegister(name, {
      declarative: true,
      deps: deps,
      declare: declare
    });
  }

  function registerDynamic(name, deps, executingRequire, execute) {
    doRegister(name, {
      declarative: false,
      deps: deps,
      executingRequire: executingRequire,
      execute: execute
    });
  }

  function doRegister(name, entry) {
    entry.name = name;

    // we never overwrite an existing define
    if (!(name in defined))
      defined[name] = entry;

    // we have to normalize dependencies
    // (assume dependencies are normalized for now)
    // entry.normalizedDeps = entry.deps.map(normalize);
    entry.normalizedDeps = entry.deps;
  }


  function buildGroups(entry, groups) {
    groups[entry.groupIndex] = groups[entry.groupIndex] || [];

    if (indexOf.call(groups[entry.groupIndex], entry) != -1)
      return;

    groups[entry.groupIndex].push(entry);

    for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
      var depName = entry.normalizedDeps[i];
      var depEntry = defined[depName];

      // not in the registry means already linked / ES6
      if (!depEntry || depEntry.evaluated)
        continue;

      // now we know the entry is in our unlinked linkage group
      var depGroupIndex = entry.groupIndex + (depEntry.declarative != entry.declarative);

      // the group index of an entry is always the maximum
      if (depEntry.groupIndex === undefined || depEntry.groupIndex < depGroupIndex) {

        // if already in a group, remove from the old group
        if (depEntry.groupIndex !== undefined) {
          groups[depEntry.groupIndex].splice(indexOf.call(groups[depEntry.groupIndex], depEntry), 1);

          // if the old group is empty, then we have a mixed depndency cycle
          if (groups[depEntry.groupIndex].length == 0)
            throw new TypeError("Mixed dependency cycle detected");
        }

        depEntry.groupIndex = depGroupIndex;
      }

      buildGroups(depEntry, groups);
    }
  }

  function link(name) {
    var startEntry = defined[name];

    startEntry.groupIndex = 0;

    var groups = [];

    buildGroups(startEntry, groups);

    var curGroupDeclarative = !!startEntry.declarative == groups.length % 2;
    for (var i = groups.length - 1; i >= 0; i--) {
      var group = groups[i];
      for (var j = 0; j < group.length; j++) {
        var entry = group[j];

        // link each group
        if (curGroupDeclarative)
          linkDeclarativeModule(entry);
        else
          linkDynamicModule(entry);
      }
      curGroupDeclarative = !curGroupDeclarative; 
    }
  }

  // module binding records
  var moduleRecords = {};
  function getOrCreateModuleRecord(name) {
    return moduleRecords[name] || (moduleRecords[name] = {
      name: name,
      dependencies: [],
      exports: {}, // start from an empty module and extend
      importers: []
    })
  }

  function linkDeclarativeModule(entry) {
    // only link if already not already started linking (stops at circular)
    if (entry.module)
      return;

    var module = entry.module = getOrCreateModuleRecord(entry.name);
    var exports = entry.module.exports;

    var declaration = entry.declare.call(global, function(name, value) {
      module.locked = true;
      exports[name] = value;

      for (var i = 0, l = module.importers.length; i < l; i++) {
        var importerModule = module.importers[i];
        if (!importerModule.locked) {
          for (var j = 0; j < importerModule.dependencies.length; ++j) {
            if (importerModule.dependencies[j] === module) {
              importerModule.setters[j](exports);
            }
          }
        }
      }

      module.locked = false;
      return value;
    });

    module.setters = declaration.setters;
    module.execute = declaration.execute;

    // now link all the module dependencies
    for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
      var depName = entry.normalizedDeps[i];
      var depEntry = defined[depName];
      var depModule = moduleRecords[depName];

      // work out how to set depExports based on scenarios...
      var depExports;

      if (depModule) {
        depExports = depModule.exports;
      }
      else if (depEntry && !depEntry.declarative) {
        depExports = depEntry.esModule;
      }
      // in the module registry
      else if (!depEntry) {
        depExports = load(depName);
      }
      // we have an entry -> link
      else {
        linkDeclarativeModule(depEntry);
        depModule = depEntry.module;
        depExports = depModule.exports;
      }

      // only declarative modules have dynamic bindings
      if (depModule && depModule.importers) {
        depModule.importers.push(module);
        module.dependencies.push(depModule);
      }
      else
        module.dependencies.push(null);

      // run the setter for this dependency
      if (module.setters[i])
        module.setters[i](depExports);
    }
  }

  // An analog to loader.get covering execution of all three layers (real declarative, simulated declarative, simulated dynamic)
  function getModule(name) {
    var exports;
    var entry = defined[name];

    if (!entry) {
      exports = load(name);
      if (!exports)
        throw new Error("Unable to load dependency " + name + ".");
    }

    else {
      if (entry.declarative)
        ensureEvaluated(name, []);

      else if (!entry.evaluated)
        linkDynamicModule(entry);

      exports = entry.module.exports;
    }

    if ((!entry || entry.declarative) && exports && exports.__useDefault)
      return exports['default'];

    return exports;
  }

  function linkDynamicModule(entry) {
    if (entry.module)
      return;

    var exports = {};

    var module = entry.module = { exports: exports, id: entry.name };

    // AMD requires execute the tree first
    if (!entry.executingRequire) {
      for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
        var depName = entry.normalizedDeps[i];
        var depEntry = defined[depName];
        if (depEntry)
          linkDynamicModule(depEntry);
      }
    }

    // now execute
    entry.evaluated = true;
    var output = entry.execute.call(global, function(name) {
      for (var i = 0, l = entry.deps.length; i < l; i++) {
        if (entry.deps[i] != name)
          continue;
        return getModule(entry.normalizedDeps[i]);
      }
      throw new TypeError('Module ' + name + ' not declared as a dependency.');
    }, exports, module);

    if (output)
      module.exports = output;

    // create the esModule object, which allows ES6 named imports of dynamics
    exports = module.exports;
 
    if (exports && exports.__esModule) {
      entry.esModule = exports;
    }
    else {
      entry.esModule = {};
      
      // don't trigger getters/setters in environments that support them
      if (typeof exports == 'object' || typeof exports == 'function') {
        if (getOwnPropertyDescriptor) {
          var d;
          for (var p in exports)
            if (d = Object.getOwnPropertyDescriptor(exports, p))
              defineProperty(entry.esModule, p, d);
        }
        else {
          var hasOwnProperty = exports && exports.hasOwnProperty;
          for (var p in exports) {
            if (!hasOwnProperty || exports.hasOwnProperty(p))
              entry.esModule[p] = exports[p];
          }
         }
       }
      entry.esModule['default'] = exports;
      defineProperty(entry.esModule, '__useDefault', {
        value: true
      });
    }
  }

  /*
   * Given a module, and the list of modules for this current branch,
   *  ensure that each of the dependencies of this module is evaluated
   *  (unless one is a circular dependency already in the list of seen
   *  modules, in which case we execute it)
   *
   * Then we evaluate the module itself depth-first left to right 
   * execution to match ES6 modules
   */
  function ensureEvaluated(moduleName, seen) {
    var entry = defined[moduleName];

    // if already seen, that means it's an already-evaluated non circular dependency
    if (!entry || entry.evaluated || !entry.declarative)
      return;

    // this only applies to declarative modules which late-execute

    seen.push(moduleName);

    for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
      var depName = entry.normalizedDeps[i];
      if (indexOf.call(seen, depName) == -1) {
        if (!defined[depName])
          load(depName);
        else
          ensureEvaluated(depName, seen);
      }
    }

    if (entry.evaluated)
      return;

    entry.evaluated = true;
    entry.module.execute.call(global);
  }

  // magical execution function
  var modules = {};
  function load(name) {
    if (modules[name])
      return modules[name];

    var entry = defined[name];

    // first we check if this module has already been defined in the registry
    if (!entry)
      throw "Module " + name + " not present.";

    // recursively ensure that the module and all its 
    // dependencies are linked (with dependency group handling)
    link(name);

    // now handle dependency execution in correct order
    ensureEvaluated(name, []);

    // remove from the registry
    defined[name] = undefined;

    // exported modules get __esModule defined for interop
    if (entry.declarative)
      defineProperty(entry.module.exports, '__esModule', { value: true });

    // return the defined module object
    return modules[name] = entry.declarative ? entry.module.exports : entry.esModule;
  };

  return function(mains, depNames, declare) {
    return function(formatDetect) {
      formatDetect(function(deps) {
        var System = {
          _nodeRequire: typeof require != 'undefined' && require.resolve && typeof process != 'undefined' && require,
          register: register,
          registerDynamic: registerDynamic,
          get: load, 
          set: function(name, module) {
            modules[name] = module; 
          },
          newModule: function(module) {
            return module;
          }
        };
        System.set('@empty', {});

        // register external dependencies
        for (var i = 0; i < depNames.length; i++) (function(depName, dep) {
          if (dep && dep.__esModule)
            System.register(depName, [], function(_export) {
              return {
                setters: [],
                execute: function() {
                  for (var p in dep)
                    if (p != '__esModule' && !(typeof p == 'object' && p + '' == 'Module'))
                      _export(p, dep[p]);
                }
              };
            });
          else
            System.registerDynamic(depName, [], false, function() {
              return dep;
            });
        })(depNames[i], arguments[i]);

        // register modules in this bundle
        declare(System);

        // load mains
        var firstLoad = load(mains[0]);
        if (mains.length > 1)
          for (var i = 1; i < mains.length; i++)
            load(mains[i]);

        if (firstLoad.__useDefault)
          return firstLoad['default'];
        else
          return firstLoad;
      });
    };
  };

})(typeof self != 'undefined' ? self : global)
/* (['mainModule'], ['external-dep'], function($__System) {
  System.register(...);
})
(function(factory) {
  if (typeof define && define.amd)
    define(['external-dep'], factory);
  // etc UMD / module pattern
})*/

(['0'], [], function($__System) {

$__System.registerDynamic("0", ["1", "2", "3", "4"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  require("1").install();
  require("2");
  require("3");
  require("4");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("1", ["5"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("5");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("5", ["6", "7", "8", "9", "a"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  (function(Buffer, process) {
    var SourceMapConsumer = require("6").SourceMapConsumer;
    var path = require("7");
    var fs = require("8");
    var alreadyInstalled = false;
    var emptyCacheBetweenOperations = false;
    var fileContentsCache = {};
    var sourceMapCache = {};
    var reSourceMap = /^data:application\/json[^,]+base64,/;
    function isInBrowser() {
      return ((typeof window !== 'undefined') && (typeof XMLHttpRequest === 'function'));
    }
    function hasGlobalProcessEventEmitter() {
      return ((typeof process === 'object') && (process !== null) && (typeof process.on === 'function'));
    }
    function retrieveFile(path) {
      path = path.trim();
      if (path in fileContentsCache) {
        return fileContentsCache[path];
      }
      try {
        if (isInBrowser()) {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', path, false);
          xhr.send(null);
          var contents = null;
          if (xhr.readyState === 4 && xhr.status === 200) {
            contents = xhr.responseText;
          }
        } else {
          var contents = fs.readFileSync(path, 'utf8');
        }
      } catch (e) {
        var contents = null;
      }
      return fileContentsCache[path] = contents;
    }
    function supportRelativeURL(file, url) {
      if (!file)
        return url;
      var dir = path.dirname(file);
      var match = /^\w+:\/\/[^\/]*/.exec(dir);
      var protocol = match ? match[0] : '';
      return protocol + path.resolve(dir.slice(protocol.length), url);
    }
    function retrieveSourceMapURL(source) {
      var fileData;
      if (isInBrowser()) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', source, false);
        xhr.send(null);
        fileData = xhr.readyState === 4 ? xhr.responseText : null;
        var sourceMapHeader = xhr.getResponseHeader("SourceMap") || xhr.getResponseHeader("X-SourceMap");
        if (sourceMapHeader) {
          return sourceMapHeader;
        }
      }
      fileData = retrieveFile(source);
      var re = /\/\/[#@]\s*sourceMappingURL=([^'"]+)\s*$/mg;
      var lastMatch,
          match;
      while (match = re.exec(fileData))
        lastMatch = match;
      if (!lastMatch)
        return null;
      return lastMatch[1];
    }
    ;
    function retrieveSourceMap(source) {
      var sourceMappingURL = retrieveSourceMapURL(source);
      if (!sourceMappingURL)
        return null;
      var sourceMapData;
      if (reSourceMap.test(sourceMappingURL)) {
        var rawData = sourceMappingURL.slice(sourceMappingURL.indexOf(',') + 1);
        sourceMapData = new Buffer(rawData, "base64").toString();
        sourceMappingURL = null;
      } else {
        sourceMappingURL = supportRelativeURL(source, sourceMappingURL);
        sourceMapData = retrieveFile(sourceMappingURL);
      }
      if (!sourceMapData) {
        return null;
      }
      return {
        url: sourceMappingURL,
        map: sourceMapData
      };
    }
    function mapSourcePosition(position) {
      var sourceMap = sourceMapCache[position.source];
      if (!sourceMap) {
        var urlAndMap = retrieveSourceMap(position.source);
        if (urlAndMap) {
          sourceMap = sourceMapCache[position.source] = {
            url: urlAndMap.url,
            map: new SourceMapConsumer(urlAndMap.map)
          };
          if (sourceMap.map.sourcesContent) {
            sourceMap.map.sources.forEach(function(source, i) {
              var contents = sourceMap.map.sourcesContent[i];
              if (contents) {
                var url = supportRelativeURL(sourceMap.url, source);
                fileContentsCache[url] = contents;
              }
            });
          }
        } else {
          sourceMap = sourceMapCache[position.source] = {
            url: null,
            map: null
          };
        }
      }
      if (sourceMap && sourceMap.map) {
        var originalPosition = sourceMap.map.originalPositionFor(position);
        if (originalPosition.source !== null) {
          originalPosition.source = supportRelativeURL(sourceMap.url, originalPosition.source);
          return originalPosition;
        }
      }
      return position;
    }
    function mapEvalOrigin(origin) {
      var match = /^eval at ([^(]+) \((.+):(\d+):(\d+)\)$/.exec(origin);
      if (match) {
        var position = mapSourcePosition({
          source: match[2],
          line: match[3],
          column: match[4] - 1
        });
        return 'eval at ' + match[1] + ' (' + position.source + ':' + position.line + ':' + (position.column + 1) + ')';
      }
      match = /^eval at ([^(]+) \((.+)\)$/.exec(origin);
      if (match) {
        return 'eval at ' + match[1] + ' (' + mapEvalOrigin(match[2]) + ')';
      }
      return origin;
    }
    function CallSiteToString() {
      var fileName;
      var fileLocation = "";
      if (this.isNative()) {
        fileLocation = "native";
      } else {
        fileName = this.getScriptNameOrSourceURL();
        if (!fileName && this.isEval()) {
          fileLocation = this.getEvalOrigin();
          fileLocation += ", ";
        }
        if (fileName) {
          fileLocation += fileName;
        } else {
          fileLocation += "<anonymous>";
        }
        var lineNumber = this.getLineNumber();
        if (lineNumber != null) {
          fileLocation += ":" + lineNumber;
          var columnNumber = this.getColumnNumber();
          if (columnNumber) {
            fileLocation += ":" + columnNumber;
          }
        }
      }
      var line = "";
      var functionName = this.getFunctionName();
      var addSuffix = true;
      var isConstructor = this.isConstructor();
      var isMethodCall = !(this.isToplevel() || isConstructor);
      if (isMethodCall) {
        var typeName = this.getTypeName();
        var methodName = this.getMethodName();
        if (functionName) {
          if (typeName && functionName.indexOf(typeName) != 0) {
            line += typeName + ".";
          }
          line += functionName;
          if (methodName && functionName.indexOf("." + methodName) != functionName.length - methodName.length - 1) {
            line += " [as " + methodName + "]";
          }
        } else {
          line += typeName + "." + (methodName || "<anonymous>");
        }
      } else if (isConstructor) {
        line += "new " + (functionName || "<anonymous>");
      } else if (functionName) {
        line += functionName;
      } else {
        line += fileLocation;
        addSuffix = false;
      }
      if (addSuffix) {
        line += " (" + fileLocation + ")";
      }
      return line;
    }
    function cloneCallSite(frame) {
      var object = {};
      Object.getOwnPropertyNames(Object.getPrototypeOf(frame)).forEach(function(name) {
        object[name] = /^(?:is|get)/.test(name) ? function() {
          return frame[name].call(frame);
        } : frame[name];
      });
      object.toString = CallSiteToString;
      return object;
    }
    function wrapCallSite(frame) {
      var source = frame.getFileName() || frame.getScriptNameOrSourceURL();
      if (source) {
        var line = frame.getLineNumber();
        var column = frame.getColumnNumber() - 1;
        if (line === 1 && !isInBrowser() && !frame.isEval()) {
          column -= 62;
        }
        var position = mapSourcePosition({
          source: source,
          line: line,
          column: column
        });
        frame = cloneCallSite(frame);
        frame.getFileName = function() {
          return position.source;
        };
        frame.getLineNumber = function() {
          return position.line;
        };
        frame.getColumnNumber = function() {
          return position.column + 1;
        };
        frame.getScriptNameOrSourceURL = function() {
          return position.source;
        };
        return frame;
      }
      var origin = frame.isEval() && frame.getEvalOrigin();
      if (origin) {
        origin = mapEvalOrigin(origin);
        frame = cloneCallSite(frame);
        frame.getEvalOrigin = function() {
          return origin;
        };
        return frame;
      }
      return frame;
    }
    function prepareStackTrace(error, stack) {
      if (emptyCacheBetweenOperations) {
        fileContentsCache = {};
        sourceMapCache = {};
      }
      return error + stack.map(function(frame) {
        return '\n    at ' + wrapCallSite(frame);
      }).join('');
    }
    function getErrorSource(error) {
      var match = /\n    at [^(]+ \((.*):(\d+):(\d+)\)/.exec(error.stack);
      if (match) {
        var source = match[1];
        var line = +match[2];
        var column = +match[3];
        var contents = fileContentsCache[source];
        if (!contents && fs.existsSync(source)) {
          contents = fs.readFileSync(source, 'utf8');
        }
        if (contents) {
          var code = contents.split(/(?:\r\n|\r|\n)/)[line - 1];
          if (code) {
            return source + ':' + line + '\n' + code + '\n' + new Array(column).join(' ') + '^';
          }
        }
      }
      return null;
    }
    function printErrorAndExit(error) {
      var source = getErrorSource(error);
      if (source) {
        console.error();
        console.error(source);
      }
      console.error(error.stack);
      process.exit(1);
    }
    function shimEmitUncaughtException() {
      var origEmit = process.emit;
      process.emit = function(type) {
        if (type === 'uncaughtException') {
          var hasStack = (arguments[1] && arguments[1].stack);
          var hasListeners = (this.listeners(type).length > 0);
          if (hasStack && !hasListeners) {
            return printErrorAndExit(arguments[1]);
          }
        }
        return origEmit.apply(this, arguments);
      };
    }
    exports.wrapCallSite = wrapCallSite;
    exports.getErrorSource = getErrorSource;
    exports.mapSourcePosition = mapSourcePosition;
    exports.retrieveSourceMap = retrieveSourceMap;
    exports.install = function(options) {
      if (!alreadyInstalled) {
        alreadyInstalled = true;
        Error.prepareStackTrace = prepareStackTrace;
        options = options || {};
        var installHandler = 'handleUncaughtExceptions' in options ? options.handleUncaughtExceptions : true;
        emptyCacheBetweenOperations = 'emptyCacheBetweenOperations' in options ? options.emptyCacheBetweenOperations : false;
        if (options.retrieveFile)
          retrieveFile = options.retrieveFile;
        if (options.retrieveSourceMap)
          retrieveSourceMap = options.retrieveSourceMap;
        if (installHandler && hasGlobalProcessEventEmitter()) {
          shimEmitUncaughtException();
        }
      }
    };
  })(require("9").Buffer, require("a"));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("6", ["b"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("b");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("7", ["c"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("c");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("8", ["d"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("d");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("9", ["e"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("e");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("a", ["f"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("f");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("b", ["1f", "20", "21"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  exports.SourceMapGenerator = require("1f").SourceMapGenerator;
  exports.SourceMapConsumer = require("20").SourceMapConsumer;
  exports.SourceNode = require("21").SourceNode;
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("c", ["22"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = $__System._nodeRequire ? $__System._nodeRequire('path') : require("22");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("d", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  if ($__System._nodeRequire) {
    module.exports = $__System._nodeRequire('fs');
  } else {
    exports.readFileSync = function(address) {
      var output;
      var xhr = new XMLHttpRequest();
      xhr.open('GET', address, false);
      xhr.onreadystatechange = function(e) {
        if (xhr.readyState == 4) {
          var status = xhr.status;
          if ((status > 399 && status < 600) || status == 400) {
            throw 'File read error on ' + address;
          } else
            output = xhr.responseText;
        }
      };
      xhr.send(null);
      return output;
    };
  }
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("e", ["23"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = $__System._nodeRequire ? $__System._nodeRequire('buffer') : require("23");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("f", ["24"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = $__System._nodeRequire ? process : require("24");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("10", ["25"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("25");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("15", ["2c"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("2c");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("12", ["3d"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("3d");
  module.exports = _curry2(function prop(p, obj) {
    return obj[p];
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("14", ["3e", "3f"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var R = require("3e");
  var util = require("3f");
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

$__System.registerDynamic("13", ["3d", "40", "41", "42"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("3d");
  var _dispatchable = require("40");
  var _map = require("41");
  var _xmap = require("42");
  module.exports = _curry2(_dispatchable('map', _xmap, _map));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("18", ["3e"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var R = require("3e");
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

$__System.registerDynamic("17", ["43", "44"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var _getIterator = require("43")["default"];
  var _isIterable = require("44")["default"];
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

$__System.registerDynamic("19", ["45", "46"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var pipe = require("45");
  var reverse = require("46");
  module.exports = function compose() {
    if (arguments.length === 0) {
      throw new Error('compose requires at least one argument');
    }
    return pipe.apply(this, reverse(arguments));
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("1c", ["47", "48"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry3 = require("47");
  var _reduce = require("48");
  module.exports = _curry3(_reduce);
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("1b", ["3d", "49", "4a"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("3d");
  var _equals = require("49");
  var _hasMethod = require("4a");
  module.exports = _curry2(function equals(a, b) {
    return _hasMethod('equals', a) ? a.equals(b) : _hasMethod('equals', b) ? b.equals(a) : _equals(a, b, [], []);
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("1d", ["4b", "3d"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _concat = require("4b");
  var _curry2 = require("3d");
  module.exports = _curry2(function prepend(el, list) {
    return _concat([el], list);
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("1e", ["4b", "3d"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _concat = require("4b");
  var _curry2 = require("3d");
  module.exports = _curry2(function append(el, list) {
    return _concat(list, [el]);
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("20", ["4c", "4d", "4e", "4f", "50"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  "format cjs";
  if (typeof define !== 'function') {
    var define = require("4c")(module, require);
  }
  define(function(require, exports, module) {
    var util = require("4d");
    var binarySearch = require("4e");
    var ArraySet = require("4f").ArraySet;
    var base64VLQ = require("50");
    function SourceMapConsumer(aSourceMap) {
      var sourceMap = aSourceMap;
      if (typeof aSourceMap === 'string') {
        sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
      }
      var version = util.getArg(sourceMap, 'version');
      var sources = util.getArg(sourceMap, 'sources');
      var names = util.getArg(sourceMap, 'names', []);
      var sourceRoot = util.getArg(sourceMap, 'sourceRoot', null);
      var sourcesContent = util.getArg(sourceMap, 'sourcesContent', null);
      var mappings = util.getArg(sourceMap, 'mappings');
      var file = util.getArg(sourceMap, 'file', null);
      if (version != this._version) {
        throw new Error('Unsupported version: ' + version);
      }
      this._names = ArraySet.fromArray(names, true);
      this._sources = ArraySet.fromArray(sources, true);
      this.sourceRoot = sourceRoot;
      this.sourcesContent = sourcesContent;
      this._mappings = mappings;
      this.file = file;
    }
    SourceMapConsumer.fromSourceMap = function SourceMapConsumer_fromSourceMap(aSourceMap) {
      var smc = Object.create(SourceMapConsumer.prototype);
      smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), true);
      smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), true);
      smc.sourceRoot = aSourceMap._sourceRoot;
      smc.sourcesContent = aSourceMap._generateSourcesContent(smc._sources.toArray(), smc.sourceRoot);
      smc.file = aSourceMap._file;
      smc.__generatedMappings = aSourceMap._mappings.slice().sort(util.compareByGeneratedPositions);
      smc.__originalMappings = aSourceMap._mappings.slice().sort(util.compareByOriginalPositions);
      return smc;
    };
    SourceMapConsumer.prototype._version = 3;
    Object.defineProperty(SourceMapConsumer.prototype, 'sources', {get: function() {
        return this._sources.toArray().map(function(s) {
          return this.sourceRoot ? util.join(this.sourceRoot, s) : s;
        }, this);
      }});
    SourceMapConsumer.prototype.__generatedMappings = null;
    Object.defineProperty(SourceMapConsumer.prototype, '_generatedMappings', {get: function() {
        if (!this.__generatedMappings) {
          this.__generatedMappings = [];
          this.__originalMappings = [];
          this._parseMappings(this._mappings, this.sourceRoot);
        }
        return this.__generatedMappings;
      }});
    SourceMapConsumer.prototype.__originalMappings = null;
    Object.defineProperty(SourceMapConsumer.prototype, '_originalMappings', {get: function() {
        if (!this.__originalMappings) {
          this.__generatedMappings = [];
          this.__originalMappings = [];
          this._parseMappings(this._mappings, this.sourceRoot);
        }
        return this.__originalMappings;
      }});
    SourceMapConsumer.prototype._parseMappings = function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
      var generatedLine = 1;
      var previousGeneratedColumn = 0;
      var previousOriginalLine = 0;
      var previousOriginalColumn = 0;
      var previousSource = 0;
      var previousName = 0;
      var mappingSeparator = /^[,;]/;
      var str = aStr;
      var mapping;
      var temp;
      while (str.length > 0) {
        if (str.charAt(0) === ';') {
          generatedLine++;
          str = str.slice(1);
          previousGeneratedColumn = 0;
        } else if (str.charAt(0) === ',') {
          str = str.slice(1);
        } else {
          mapping = {};
          mapping.generatedLine = generatedLine;
          temp = base64VLQ.decode(str);
          mapping.generatedColumn = previousGeneratedColumn + temp.value;
          previousGeneratedColumn = mapping.generatedColumn;
          str = temp.rest;
          if (str.length > 0 && !mappingSeparator.test(str.charAt(0))) {
            temp = base64VLQ.decode(str);
            mapping.source = this._sources.at(previousSource + temp.value);
            previousSource += temp.value;
            str = temp.rest;
            if (str.length === 0 || mappingSeparator.test(str.charAt(0))) {
              throw new Error('Found a source, but no line and column');
            }
            temp = base64VLQ.decode(str);
            mapping.originalLine = previousOriginalLine + temp.value;
            previousOriginalLine = mapping.originalLine;
            mapping.originalLine += 1;
            str = temp.rest;
            if (str.length === 0 || mappingSeparator.test(str.charAt(0))) {
              throw new Error('Found a source and line, but no column');
            }
            temp = base64VLQ.decode(str);
            mapping.originalColumn = previousOriginalColumn + temp.value;
            previousOriginalColumn = mapping.originalColumn;
            str = temp.rest;
            if (str.length > 0 && !mappingSeparator.test(str.charAt(0))) {
              temp = base64VLQ.decode(str);
              mapping.name = this._names.at(previousName + temp.value);
              previousName += temp.value;
              str = temp.rest;
            }
          }
          this.__generatedMappings.push(mapping);
          if (typeof mapping.originalLine === 'number') {
            this.__originalMappings.push(mapping);
          }
        }
      }
      this.__generatedMappings.sort(util.compareByGeneratedPositions);
      this.__originalMappings.sort(util.compareByOriginalPositions);
    };
    SourceMapConsumer.prototype._findMapping = function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName, aColumnName, aComparator) {
      if (aNeedle[aLineName] <= 0) {
        throw new TypeError('Line must be greater than or equal to 1, got ' + aNeedle[aLineName]);
      }
      if (aNeedle[aColumnName] < 0) {
        throw new TypeError('Column must be greater than or equal to 0, got ' + aNeedle[aColumnName]);
      }
      return binarySearch.search(aNeedle, aMappings, aComparator);
    };
    SourceMapConsumer.prototype.originalPositionFor = function SourceMapConsumer_originalPositionFor(aArgs) {
      var needle = {
        generatedLine: util.getArg(aArgs, 'line'),
        generatedColumn: util.getArg(aArgs, 'column')
      };
      var mapping = this._findMapping(needle, this._generatedMappings, "generatedLine", "generatedColumn", util.compareByGeneratedPositions);
      if (mapping) {
        var source = util.getArg(mapping, 'source', null);
        if (source && this.sourceRoot) {
          source = util.join(this.sourceRoot, source);
        }
        return {
          source: source,
          line: util.getArg(mapping, 'originalLine', null),
          column: util.getArg(mapping, 'originalColumn', null),
          name: util.getArg(mapping, 'name', null)
        };
      }
      return {
        source: null,
        line: null,
        column: null,
        name: null
      };
    };
    SourceMapConsumer.prototype.sourceContentFor = function SourceMapConsumer_sourceContentFor(aSource) {
      if (!this.sourcesContent) {
        return null;
      }
      if (this.sourceRoot) {
        aSource = util.relative(this.sourceRoot, aSource);
      }
      if (this._sources.has(aSource)) {
        return this.sourcesContent[this._sources.indexOf(aSource)];
      }
      var url;
      if (this.sourceRoot && (url = util.urlParse(this.sourceRoot))) {
        var fileUriAbsPath = aSource.replace(/^file:\/\//, "");
        if (url.scheme == "file" && this._sources.has(fileUriAbsPath)) {
          return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)];
        }
        if ((!url.path || url.path == "/") && this._sources.has("/" + aSource)) {
          return this.sourcesContent[this._sources.indexOf("/" + aSource)];
        }
      }
      throw new Error('"' + aSource + '" is not in the SourceMap.');
    };
    SourceMapConsumer.prototype.generatedPositionFor = function SourceMapConsumer_generatedPositionFor(aArgs) {
      var needle = {
        source: util.getArg(aArgs, 'source'),
        originalLine: util.getArg(aArgs, 'line'),
        originalColumn: util.getArg(aArgs, 'column')
      };
      if (this.sourceRoot) {
        needle.source = util.relative(this.sourceRoot, needle.source);
      }
      var mapping = this._findMapping(needle, this._originalMappings, "originalLine", "originalColumn", util.compareByOriginalPositions);
      if (mapping) {
        return {
          line: util.getArg(mapping, 'generatedLine', null),
          column: util.getArg(mapping, 'generatedColumn', null)
        };
      }
      return {
        line: null,
        column: null
      };
    };
    SourceMapConsumer.GENERATED_ORDER = 1;
    SourceMapConsumer.ORIGINAL_ORDER = 2;
    SourceMapConsumer.prototype.eachMapping = function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
      var context = aContext || null;
      var order = aOrder || SourceMapConsumer.GENERATED_ORDER;
      var mappings;
      switch (order) {
        case SourceMapConsumer.GENERATED_ORDER:
          mappings = this._generatedMappings;
          break;
        case SourceMapConsumer.ORIGINAL_ORDER:
          mappings = this._originalMappings;
          break;
        default:
          throw new Error("Unknown order of iteration.");
      }
      var sourceRoot = this.sourceRoot;
      mappings.map(function(mapping) {
        var source = mapping.source;
        if (source && sourceRoot) {
          source = util.join(sourceRoot, source);
        }
        return {
          source: source,
          generatedLine: mapping.generatedLine,
          generatedColumn: mapping.generatedColumn,
          originalLine: mapping.originalLine,
          originalColumn: mapping.originalColumn,
          name: mapping.name
        };
      }).forEach(aCallback, context);
    };
    exports.SourceMapConsumer = SourceMapConsumer;
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("1f", ["4c", "50", "4d", "4f"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  "format cjs";
  if (typeof define !== 'function') {
    var define = require("4c")(module, require);
  }
  define(function(require, exports, module) {
    var base64VLQ = require("50");
    var util = require("4d");
    var ArraySet = require("4f").ArraySet;
    function SourceMapGenerator(aArgs) {
      this._file = util.getArg(aArgs, 'file');
      this._sourceRoot = util.getArg(aArgs, 'sourceRoot', null);
      this._sources = new ArraySet();
      this._names = new ArraySet();
      this._mappings = [];
      this._sourcesContents = null;
    }
    SourceMapGenerator.prototype._version = 3;
    SourceMapGenerator.fromSourceMap = function SourceMapGenerator_fromSourceMap(aSourceMapConsumer) {
      var sourceRoot = aSourceMapConsumer.sourceRoot;
      var generator = new SourceMapGenerator({
        file: aSourceMapConsumer.file,
        sourceRoot: sourceRoot
      });
      aSourceMapConsumer.eachMapping(function(mapping) {
        var newMapping = {generated: {
            line: mapping.generatedLine,
            column: mapping.generatedColumn
          }};
        if (mapping.source) {
          newMapping.source = mapping.source;
          if (sourceRoot) {
            newMapping.source = util.relative(sourceRoot, newMapping.source);
          }
          newMapping.original = {
            line: mapping.originalLine,
            column: mapping.originalColumn
          };
          if (mapping.name) {
            newMapping.name = mapping.name;
          }
        }
        generator.addMapping(newMapping);
      });
      aSourceMapConsumer.sources.forEach(function(sourceFile) {
        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
        if (content) {
          generator.setSourceContent(sourceFile, content);
        }
      });
      return generator;
    };
    SourceMapGenerator.prototype.addMapping = function SourceMapGenerator_addMapping(aArgs) {
      var generated = util.getArg(aArgs, 'generated');
      var original = util.getArg(aArgs, 'original', null);
      var source = util.getArg(aArgs, 'source', null);
      var name = util.getArg(aArgs, 'name', null);
      this._validateMapping(generated, original, source, name);
      if (source && !this._sources.has(source)) {
        this._sources.add(source);
      }
      if (name && !this._names.has(name)) {
        this._names.add(name);
      }
      this._mappings.push({
        generatedLine: generated.line,
        generatedColumn: generated.column,
        originalLine: original != null && original.line,
        originalColumn: original != null && original.column,
        source: source,
        name: name
      });
    };
    SourceMapGenerator.prototype.setSourceContent = function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
      var source = aSourceFile;
      if (this._sourceRoot) {
        source = util.relative(this._sourceRoot, source);
      }
      if (aSourceContent !== null) {
        if (!this._sourcesContents) {
          this._sourcesContents = {};
        }
        this._sourcesContents[util.toSetString(source)] = aSourceContent;
      } else {
        delete this._sourcesContents[util.toSetString(source)];
        if (Object.keys(this._sourcesContents).length === 0) {
          this._sourcesContents = null;
        }
      }
    };
    SourceMapGenerator.prototype.applySourceMap = function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile) {
      if (!aSourceFile) {
        aSourceFile = aSourceMapConsumer.file;
      }
      var sourceRoot = this._sourceRoot;
      if (sourceRoot) {
        aSourceFile = util.relative(sourceRoot, aSourceFile);
      }
      var newSources = new ArraySet();
      var newNames = new ArraySet();
      this._mappings.forEach(function(mapping) {
        if (mapping.source === aSourceFile && mapping.originalLine) {
          var original = aSourceMapConsumer.originalPositionFor({
            line: mapping.originalLine,
            column: mapping.originalColumn
          });
          if (original.source !== null) {
            if (sourceRoot) {
              mapping.source = util.relative(sourceRoot, original.source);
            } else {
              mapping.source = original.source;
            }
            mapping.originalLine = original.line;
            mapping.originalColumn = original.column;
            if (original.name !== null && mapping.name !== null) {
              mapping.name = original.name;
            }
          }
        }
        var source = mapping.source;
        if (source && !newSources.has(source)) {
          newSources.add(source);
        }
        var name = mapping.name;
        if (name && !newNames.has(name)) {
          newNames.add(name);
        }
      }, this);
      this._sources = newSources;
      this._names = newNames;
      aSourceMapConsumer.sources.forEach(function(sourceFile) {
        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
        if (content) {
          if (sourceRoot) {
            sourceFile = util.relative(sourceRoot, sourceFile);
          }
          this.setSourceContent(sourceFile, content);
        }
      }, this);
    };
    SourceMapGenerator.prototype._validateMapping = function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource, aName) {
      if (aGenerated && 'line' in aGenerated && 'column' in aGenerated && aGenerated.line > 0 && aGenerated.column >= 0 && !aOriginal && !aSource && !aName) {
        return;
      } else if (aGenerated && 'line' in aGenerated && 'column' in aGenerated && aOriginal && 'line' in aOriginal && 'column' in aOriginal && aGenerated.line > 0 && aGenerated.column >= 0 && aOriginal.line > 0 && aOriginal.column >= 0 && aSource) {
        return;
      } else {
        throw new Error('Invalid mapping: ' + JSON.stringify({
          generated: aGenerated,
          source: aSource,
          original: aOriginal,
          name: aName
        }));
      }
    };
    SourceMapGenerator.prototype._serializeMappings = function SourceMapGenerator_serializeMappings() {
      var previousGeneratedColumn = 0;
      var previousGeneratedLine = 1;
      var previousOriginalColumn = 0;
      var previousOriginalLine = 0;
      var previousName = 0;
      var previousSource = 0;
      var result = '';
      var mapping;
      this._mappings.sort(util.compareByGeneratedPositions);
      for (var i = 0,
          len = this._mappings.length; i < len; i++) {
        mapping = this._mappings[i];
        if (mapping.generatedLine !== previousGeneratedLine) {
          previousGeneratedColumn = 0;
          while (mapping.generatedLine !== previousGeneratedLine) {
            result += ';';
            previousGeneratedLine++;
          }
        } else {
          if (i > 0) {
            if (!util.compareByGeneratedPositions(mapping, this._mappings[i - 1])) {
              continue;
            }
            result += ',';
          }
        }
        result += base64VLQ.encode(mapping.generatedColumn - previousGeneratedColumn);
        previousGeneratedColumn = mapping.generatedColumn;
        if (mapping.source) {
          result += base64VLQ.encode(this._sources.indexOf(mapping.source) - previousSource);
          previousSource = this._sources.indexOf(mapping.source);
          result += base64VLQ.encode(mapping.originalLine - 1 - previousOriginalLine);
          previousOriginalLine = mapping.originalLine - 1;
          result += base64VLQ.encode(mapping.originalColumn - previousOriginalColumn);
          previousOriginalColumn = mapping.originalColumn;
          if (mapping.name) {
            result += base64VLQ.encode(this._names.indexOf(mapping.name) - previousName);
            previousName = this._names.indexOf(mapping.name);
          }
        }
      }
      return result;
    };
    SourceMapGenerator.prototype._generateSourcesContent = function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
      return aSources.map(function(source) {
        if (!this._sourcesContents) {
          return null;
        }
        if (aSourceRoot) {
          source = util.relative(aSourceRoot, source);
        }
        var key = util.toSetString(source);
        return Object.prototype.hasOwnProperty.call(this._sourcesContents, key) ? this._sourcesContents[key] : null;
      }, this);
    };
    SourceMapGenerator.prototype.toJSON = function SourceMapGenerator_toJSON() {
      var map = {
        version: this._version,
        file: this._file,
        sources: this._sources.toArray(),
        names: this._names.toArray(),
        mappings: this._serializeMappings()
      };
      if (this._sourceRoot) {
        map.sourceRoot = this._sourceRoot;
      }
      if (this._sourcesContents) {
        map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
      }
      return map;
    };
    SourceMapGenerator.prototype.toString = function SourceMapGenerator_toString() {
      return JSON.stringify(this);
    };
    exports.SourceMapGenerator = SourceMapGenerator;
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("21", ["4c", "1f", "4d", "a"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  "format cjs";
  (function(process) {
    if (typeof define !== 'function') {
      var define = require("4c")(module, require);
    }
    define(function(require, exports, module) {
      var SourceMapGenerator = require("1f").SourceMapGenerator;
      var util = require("4d");
      function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
        this.children = [];
        this.sourceContents = {};
        this.line = aLine === undefined ? null : aLine;
        this.column = aColumn === undefined ? null : aColumn;
        this.source = aSource === undefined ? null : aSource;
        this.name = aName === undefined ? null : aName;
        if (aChunks != null)
          this.add(aChunks);
      }
      SourceNode.fromStringWithSourceMap = function SourceNode_fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer) {
        var node = new SourceNode();
        var remainingLines = aGeneratedCode.split('\n');
        var lastGeneratedLine = 1,
            lastGeneratedColumn = 0;
        var lastMapping = null;
        aSourceMapConsumer.eachMapping(function(mapping) {
          if (lastMapping === null) {
            while (lastGeneratedLine < mapping.generatedLine) {
              node.add(remainingLines.shift() + "\n");
              lastGeneratedLine++;
            }
            if (lastGeneratedColumn < mapping.generatedColumn) {
              var nextLine = remainingLines[0];
              node.add(nextLine.substr(0, mapping.generatedColumn));
              remainingLines[0] = nextLine.substr(mapping.generatedColumn);
              lastGeneratedColumn = mapping.generatedColumn;
            }
          } else {
            if (lastGeneratedLine < mapping.generatedLine) {
              var code = "";
              do {
                code += remainingLines.shift() + "\n";
                lastGeneratedLine++;
                lastGeneratedColumn = 0;
              } while (lastGeneratedLine < mapping.generatedLine);
              if (lastGeneratedColumn < mapping.generatedColumn) {
                var nextLine = remainingLines[0];
                code += nextLine.substr(0, mapping.generatedColumn);
                remainingLines[0] = nextLine.substr(mapping.generatedColumn);
                lastGeneratedColumn = mapping.generatedColumn;
              }
              addMappingWithCode(lastMapping, code);
            } else {
              var nextLine = remainingLines[0];
              var code = nextLine.substr(0, mapping.generatedColumn - lastGeneratedColumn);
              remainingLines[0] = nextLine.substr(mapping.generatedColumn - lastGeneratedColumn);
              lastGeneratedColumn = mapping.generatedColumn;
              addMappingWithCode(lastMapping, code);
            }
          }
          lastMapping = mapping;
        }, this);
        addMappingWithCode(lastMapping, remainingLines.join("\n"));
        aSourceMapConsumer.sources.forEach(function(sourceFile) {
          var content = aSourceMapConsumer.sourceContentFor(sourceFile);
          if (content) {
            node.setSourceContent(sourceFile, content);
          }
        });
        return node;
        function addMappingWithCode(mapping, code) {
          if (mapping === null || mapping.source === undefined) {
            node.add(code);
          } else {
            node.add(new SourceNode(mapping.originalLine, mapping.originalColumn, mapping.source, code, mapping.name));
          }
        }
      };
      SourceNode.prototype.add = function SourceNode_add(aChunk) {
        if (Array.isArray(aChunk)) {
          aChunk.forEach(function(chunk) {
            this.add(chunk);
          }, this);
        } else if (aChunk instanceof SourceNode || typeof aChunk === "string") {
          if (aChunk) {
            this.children.push(aChunk);
          }
        } else {
          throw new TypeError("Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk);
        }
        return this;
      };
      SourceNode.prototype.prepend = function SourceNode_prepend(aChunk) {
        if (Array.isArray(aChunk)) {
          for (var i = aChunk.length - 1; i >= 0; i--) {
            this.prepend(aChunk[i]);
          }
        } else if (aChunk instanceof SourceNode || typeof aChunk === "string") {
          this.children.unshift(aChunk);
        } else {
          throw new TypeError("Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk);
        }
        return this;
      };
      SourceNode.prototype.walk = function SourceNode_walk(aFn) {
        var chunk;
        for (var i = 0,
            len = this.children.length; i < len; i++) {
          chunk = this.children[i];
          if (chunk instanceof SourceNode) {
            chunk.walk(aFn);
          } else {
            if (chunk !== '') {
              aFn(chunk, {
                source: this.source,
                line: this.line,
                column: this.column,
                name: this.name
              });
            }
          }
        }
      };
      SourceNode.prototype.join = function SourceNode_join(aSep) {
        var newChildren;
        var i;
        var len = this.children.length;
        if (len > 0) {
          newChildren = [];
          for (i = 0; i < len - 1; i++) {
            newChildren.push(this.children[i]);
            newChildren.push(aSep);
          }
          newChildren.push(this.children[i]);
          this.children = newChildren;
        }
        return this;
      };
      SourceNode.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
        var lastChild = this.children[this.children.length - 1];
        if (lastChild instanceof SourceNode) {
          lastChild.replaceRight(aPattern, aReplacement);
        } else if (typeof lastChild === 'string') {
          this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
        } else {
          this.children.push(''.replace(aPattern, aReplacement));
        }
        return this;
      };
      SourceNode.prototype.setSourceContent = function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
        this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
      };
      SourceNode.prototype.walkSourceContents = function SourceNode_walkSourceContents(aFn) {
        for (var i = 0,
            len = this.children.length; i < len; i++) {
          if (this.children[i] instanceof SourceNode) {
            this.children[i].walkSourceContents(aFn);
          }
        }
        var sources = Object.keys(this.sourceContents);
        for (var i = 0,
            len = sources.length; i < len; i++) {
          aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
        }
      };
      SourceNode.prototype.toString = function SourceNode_toString() {
        var str = "";
        this.walk(function(chunk) {
          str += chunk;
        });
        return str;
      };
      SourceNode.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
        var generated = {
          code: "",
          line: 1,
          column: 0
        };
        var map = new SourceMapGenerator(aArgs);
        var sourceMappingActive = false;
        var lastOriginalSource = null;
        var lastOriginalLine = null;
        var lastOriginalColumn = null;
        var lastOriginalName = null;
        this.walk(function(chunk, original) {
          generated.code += chunk;
          if (original.source !== null && original.line !== null && original.column !== null) {
            if (lastOriginalSource !== original.source || lastOriginalLine !== original.line || lastOriginalColumn !== original.column || lastOriginalName !== original.name) {
              map.addMapping({
                source: original.source,
                original: {
                  line: original.line,
                  column: original.column
                },
                generated: {
                  line: generated.line,
                  column: generated.column
                },
                name: original.name
              });
            }
            lastOriginalSource = original.source;
            lastOriginalLine = original.line;
            lastOriginalColumn = original.column;
            lastOriginalName = original.name;
            sourceMappingActive = true;
          } else if (sourceMappingActive) {
            map.addMapping({generated: {
                line: generated.line,
                column: generated.column
              }});
            lastOriginalSource = null;
            sourceMappingActive = false;
          }
          chunk.split('').forEach(function(ch) {
            if (ch === '\n') {
              generated.line++;
              generated.column = 0;
            } else {
              generated.column++;
            }
          });
        });
        this.walkSourceContents(function(sourceFile, sourceContent) {
          map.setSourceContent(sourceFile, sourceContent);
        });
        return {
          code: generated.code,
          map: map
        };
      };
      exports.SourceNode = SourceNode;
    });
  })(require("a"));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("22", ["51"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("51");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("24", ["52"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("52");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("25", ["53", "55", "56", "57", "54", "a"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  (function(process) {
    var defined = require("53");
    var createDefaultStream = require("55");
    var Test = require("56");
    var createResult = require("57");
    var through = require("54");
    var canEmitExit = typeof process !== 'undefined' && process && typeof process.on === 'function' && process.browser !== true;
    ;
    var canExit = typeof process !== 'undefined' && process && typeof process.exit === 'function';
    ;
    var nextTick = typeof setImmediate !== 'undefined' ? setImmediate : process.nextTick;
    ;
    exports = module.exports = (function() {
      var harness;
      var lazyLoad = function() {
        return getHarness().apply(this, arguments);
      };
      lazyLoad.only = function() {
        return getHarness().only.apply(this, arguments);
      };
      lazyLoad.createStream = function(opts) {
        if (!opts)
          opts = {};
        if (!harness) {
          var output = through();
          getHarness({
            stream: output,
            objectMode: opts.objectMode
          });
          return output;
        }
        return harness.createStream(opts);
      };
      lazyLoad.getHarness = getHarness;
      return lazyLoad;
      function getHarness(opts) {
        if (!opts)
          opts = {};
        opts.autoclose = !canEmitExit;
        if (!harness)
          harness = createExitHarness(opts);
        return harness;
      }
    })();
    function createExitHarness(conf) {
      if (!conf)
        conf = {};
      var harness = createHarness({autoclose: defined(conf.autoclose, false)});
      var stream = harness.createStream({objectMode: conf.objectMode});
      var es = stream.pipe(conf.stream || createDefaultStream());
      if (canEmitExit) {
        es.on('error', function(err) {
          harness._exitCode = 1;
        });
      }
      var ended = false;
      stream.on('end', function() {
        ended = true;
      });
      if (conf.exit === false)
        return harness;
      if (!canEmitExit || !canExit)
        return harness;
      var inErrorState = false;
      process.on('exit', function(code) {
        if (code !== 0) {
          return;
        }
        if (!ended) {
          var only = harness._results._only;
          for (var i = 0; i < harness._tests.length; i++) {
            var t = harness._tests[i];
            if (only && t.name !== only)
              continue;
            t._exit();
          }
        }
        harness.close();
        process.exit(code || harness._exitCode);
      });
      return harness;
    }
    exports.createHarness = createHarness;
    exports.Test = Test;
    exports.test = exports;
    exports.test.skip = Test.skip;
    var exitInterval;
    function createHarness(conf_) {
      if (!conf_)
        conf_ = {};
      var results = createResult();
      if (conf_.autoclose !== false) {
        results.once('done', function() {
          results.close();
        });
      }
      var test = function(name, conf, cb) {
        var t = new Test(name, conf, cb);
        test._tests.push(t);
        (function inspectCode(st) {
          st.on('test', function sub(st_) {
            inspectCode(st_);
          });
          st.on('result', function(r) {
            if (!r.ok && typeof r !== 'string')
              test._exitCode = 1;
          });
        })(t);
        results.push(t);
        return t;
      };
      test._results = results;
      test._tests = [];
      test.createStream = function(opts) {
        return results.createStream(opts);
      };
      var only = false;
      test.only = function(name) {
        if (only)
          throw new Error('there can only be one only test');
        results.only(name);
        only = true;
        return test.apply(null, arguments);
      };
      test._exitCode = 0;
      test.close = function() {
        results.close();
      };
      return test;
    }
  })(require("a"));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("23", ["58"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("58");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("27", ["59", "5a"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry1 = require("59");
  var curryN = require("5a");
  module.exports = _curry1(function curry(fn) {
    return curryN(fn.length, fn);
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("26", ["5b"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("5b");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("29", ["3d", "5c"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("3d");
  var keys = require("5c");
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

$__System.registerDynamic("28", ["47"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry3 = require("47");
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

$__System.registerDynamic("2b", ["5d", "5e"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var VNode = require("5d");
  var is = require("5e");
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

$__System.registerDynamic("2a", ["59", "5f"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry1 = require("59");
  var _toString = require("5f");
  module.exports = _curry1(function toString(val) {
    return _toString(val, []);
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("2d", ["60"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("60");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("2c", ["61"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var curryN = require("61");
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

$__System.registerDynamic("2e", ["3d", "40", "62", "13", "63"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("3d");
  var _dispatchable = require("40");
  var _xchain = require("62");
  var map = require("13");
  var unnest = require("63");
  module.exports = _curry2(_dispatchable('chain', _xchain, function chain(fn, list) {
    return unnest(map(fn, list));
  }));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("30", ["59", "64"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry1 = require("59");
  var nAry = require("64");
  module.exports = _curry1(function unary(fn) {
    return nAry(1, fn);
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("2f", ["59", "65"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry1 = require("59");
  var _identity = require("65");
  module.exports = _curry1(_identity);
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("32", ["47", "5a", "a"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  (function(process) {
    var _curry3 = require("47");
    var curryN = require("5a");
    module.exports = _curry3(function ifElse(condition, onTrue, onFalse) {
      return curryN(Math.max(condition.length, onTrue.length, onFalse.length), function _ifElse() {
        return condition.apply(this, arguments) ? onTrue.apply(this, arguments) : onFalse.apply(this, arguments);
      });
    });
  })(require("a"));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("31", ["3d", "66", "5a", "67", "2a"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("3d");
  var _slice = require("66");
  var curryN = require("5a");
  var is = require("67");
  var toString = require("2a");
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

$__System.registerDynamic("34", ["3d"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("3d");
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

$__System.registerDynamic("33", ["3d"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("3d");
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

$__System.registerDynamic("35", ["47", "66"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry3 = require("47");
  var _slice = require("66");
  module.exports = _curry3(function insert(idx, elt, list) {
    idx = idx < list.length && idx >= 0 ? idx : list.length;
    var result = _slice(list);
    result.splice(idx, 0, elt);
    return result;
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("36", ["31"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var invoker = require("31");
  module.exports = invoker(1, 'join');
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("37", ["59", "68", "69"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry1 = require("59");
  var _predicateWrap = require("68");
  var all = require("69");
  module.exports = _curry1(_predicateWrap(all));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("39", ["38"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var always = require("38");
  module.exports = always(true);
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("38", ["59"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry1 = require("59");
  module.exports = _curry1(function always(val) {
    return function() {
      return val;
    };
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("3b", ["59", "28", "6a", "12"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry1 = require("59");
  var assoc = require("28");
  var lens = require("6a");
  var prop = require("12");
  module.exports = _curry1(function lensProp(k) {
    return lens(prop(k), assoc(k));
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("3a", ["38"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var always = require("38");
  module.exports = always(false);
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("3c", ["3d"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("3d");
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

$__System.registerDynamic("3e", ["6b"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("6b");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("3d", ["59"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry1 = require("59");
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

$__System.registerDynamic("40", ["6c", "6d", "66"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _isArray = require("6c");
  var _isTransformer = require("6d");
  var _slice = require("66");
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

$__System.registerDynamic("3f", ["3e"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _equals = require("3e").equals;
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

$__System.registerDynamic("42", ["3d", "6e"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("3d");
  var _xfBase = require("6e");
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

$__System.registerDynamic("41", [], true, function(require, exports, module) {
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

$__System.registerDynamic("44", ["6f"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = {
    "default": require("6f"),
    __esModule: true
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("43", ["70"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = {
    "default": require("70"),
    __esModule: true
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("45", ["71", "5a", "1c", "72"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _pipe = require("71");
  var curryN = require("5a");
  var reduce = require("1c");
  var tail = require("72");
  module.exports = function pipe() {
    if (arguments.length === 0) {
      throw new Error('pipe requires at least one argument');
    }
    return curryN(arguments[0].length, reduce(_pipe, arguments[0], tail(arguments)));
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("47", ["59", "3d"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry1 = require("59");
  var _curry2 = require("3d");
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

$__System.registerDynamic("46", ["59", "66"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry1 = require("59");
  var _slice = require("66");
  module.exports = _curry1(function reverse(list) {
    return _slice(list).reverse();
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("49", ["73", "74", "5c", "75"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _has = require("73");
  var identical = require("74");
  var keys = require("5c");
  var type = require("75");
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

$__System.registerDynamic("48", ["76", "77", "78"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _xwrap = require("76");
  var bind = require("77");
  var isArrayLike = require("78");
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

$__System.registerDynamic("4a", ["6c"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _isArray = require("6c");
  module.exports = function _hasMethod(methodName, obj) {
    return obj != null && !_isArray(obj) && typeof obj[methodName] === 'function';
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("4b", [], true, function(require, exports, module) {
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

$__System.registerDynamic("4c", ["79"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("79");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("4d", ["4c"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  "format cjs";
  if (typeof define !== 'function') {
    var define = require("4c")(module, require);
  }
  define(function(require, exports, module) {
    function getArg(aArgs, aName, aDefaultValue) {
      if (aName in aArgs) {
        return aArgs[aName];
      } else if (arguments.length === 3) {
        return aDefaultValue;
      } else {
        throw new Error('"' + aName + '" is a required argument.');
      }
    }
    exports.getArg = getArg;
    var urlRegexp = /([\w+\-.]+):\/\/((\w+:\w+)@)?([\w.]+)?(:(\d+))?(\S+)?/;
    var dataUrlRegexp = /^data:.+\,.+/;
    function urlParse(aUrl) {
      var match = aUrl.match(urlRegexp);
      if (!match) {
        return null;
      }
      return {
        scheme: match[1],
        auth: match[3],
        host: match[4],
        port: match[6],
        path: match[7]
      };
    }
    exports.urlParse = urlParse;
    function urlGenerate(aParsedUrl) {
      var url = aParsedUrl.scheme + "://";
      if (aParsedUrl.auth) {
        url += aParsedUrl.auth + "@";
      }
      if (aParsedUrl.host) {
        url += aParsedUrl.host;
      }
      if (aParsedUrl.port) {
        url += ":" + aParsedUrl.port;
      }
      if (aParsedUrl.path) {
        url += aParsedUrl.path;
      }
      return url;
    }
    exports.urlGenerate = urlGenerate;
    function join(aRoot, aPath) {
      var url;
      if (aPath.match(urlRegexp) || aPath.match(dataUrlRegexp)) {
        return aPath;
      }
      if (aPath.charAt(0) === '/' && (url = urlParse(aRoot))) {
        url.path = aPath;
        return urlGenerate(url);
      }
      return aRoot.replace(/\/$/, '') + '/' + aPath;
    }
    exports.join = join;
    function toSetString(aStr) {
      return '$' + aStr;
    }
    exports.toSetString = toSetString;
    function fromSetString(aStr) {
      return aStr.substr(1);
    }
    exports.fromSetString = fromSetString;
    function relative(aRoot, aPath) {
      aRoot = aRoot.replace(/\/$/, '');
      var url = urlParse(aRoot);
      if (aPath.charAt(0) == "/" && url && url.path == "/") {
        return aPath.slice(1);
      }
      return aPath.indexOf(aRoot + '/') === 0 ? aPath.substr(aRoot.length + 1) : aPath;
    }
    exports.relative = relative;
    function strcmp(aStr1, aStr2) {
      var s1 = aStr1 || "";
      var s2 = aStr2 || "";
      return (s1 > s2) - (s1 < s2);
    }
    function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
      var cmp;
      cmp = strcmp(mappingA.source, mappingB.source);
      if (cmp) {
        return cmp;
      }
      cmp = mappingA.originalLine - mappingB.originalLine;
      if (cmp) {
        return cmp;
      }
      cmp = mappingA.originalColumn - mappingB.originalColumn;
      if (cmp || onlyCompareOriginal) {
        return cmp;
      }
      cmp = strcmp(mappingA.name, mappingB.name);
      if (cmp) {
        return cmp;
      }
      cmp = mappingA.generatedLine - mappingB.generatedLine;
      if (cmp) {
        return cmp;
      }
      return mappingA.generatedColumn - mappingB.generatedColumn;
    }
    ;
    exports.compareByOriginalPositions = compareByOriginalPositions;
    function compareByGeneratedPositions(mappingA, mappingB, onlyCompareGenerated) {
      var cmp;
      cmp = mappingA.generatedLine - mappingB.generatedLine;
      if (cmp) {
        return cmp;
      }
      cmp = mappingA.generatedColumn - mappingB.generatedColumn;
      if (cmp || onlyCompareGenerated) {
        return cmp;
      }
      cmp = strcmp(mappingA.source, mappingB.source);
      if (cmp) {
        return cmp;
      }
      cmp = mappingA.originalLine - mappingB.originalLine;
      if (cmp) {
        return cmp;
      }
      cmp = mappingA.originalColumn - mappingB.originalColumn;
      if (cmp) {
        return cmp;
      }
      return strcmp(mappingA.name, mappingB.name);
    }
    ;
    exports.compareByGeneratedPositions = compareByGeneratedPositions;
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("4f", ["4c", "4d"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  "format cjs";
  if (typeof define !== 'function') {
    var define = require("4c")(module, require);
  }
  define(function(require, exports, module) {
    var util = require("4d");
    function ArraySet() {
      this._array = [];
      this._set = {};
    }
    ArraySet.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
      var set = new ArraySet();
      for (var i = 0,
          len = aArray.length; i < len; i++) {
        set.add(aArray[i], aAllowDuplicates);
      }
      return set;
    };
    ArraySet.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
      var isDuplicate = this.has(aStr);
      var idx = this._array.length;
      if (!isDuplicate || aAllowDuplicates) {
        this._array.push(aStr);
      }
      if (!isDuplicate) {
        this._set[util.toSetString(aStr)] = idx;
      }
    };
    ArraySet.prototype.has = function ArraySet_has(aStr) {
      return Object.prototype.hasOwnProperty.call(this._set, util.toSetString(aStr));
    };
    ArraySet.prototype.indexOf = function ArraySet_indexOf(aStr) {
      if (this.has(aStr)) {
        return this._set[util.toSetString(aStr)];
      }
      throw new Error('"' + aStr + '" is not in the set.');
    };
    ArraySet.prototype.at = function ArraySet_at(aIdx) {
      if (aIdx >= 0 && aIdx < this._array.length) {
        return this._array[aIdx];
      }
      throw new Error('No element indexed by ' + aIdx);
    };
    ArraySet.prototype.toArray = function ArraySet_toArray() {
      return this._array.slice();
    };
    exports.ArraySet = ArraySet;
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("4e", ["4c"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  "format cjs";
  if (typeof define !== 'function') {
    var define = require("4c")(module, require);
  }
  define(function(require, exports, module) {
    function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare) {
      var mid = Math.floor((aHigh - aLow) / 2) + aLow;
      var cmp = aCompare(aNeedle, aHaystack[mid], true);
      if (cmp === 0) {
        return aHaystack[mid];
      } else if (cmp > 0) {
        if (aHigh - mid > 1) {
          return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare);
        }
        return aHaystack[mid];
      } else {
        if (mid - aLow > 1) {
          return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare);
        }
        return aLow < 0 ? null : aHaystack[aLow];
      }
    }
    exports.search = function search(aNeedle, aHaystack, aCompare) {
      return aHaystack.length > 0 ? recursiveSearch(-1, aHaystack.length, aNeedle, aHaystack, aCompare) : null;
    };
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("50", ["4c", "7a"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  "format cjs";
  if (typeof define !== 'function') {
    var define = require("4c")(module, require);
  }
  define(function(require, exports, module) {
    var base64 = require("7a");
    var VLQ_BASE_SHIFT = 5;
    var VLQ_BASE = 1 << VLQ_BASE_SHIFT;
    var VLQ_BASE_MASK = VLQ_BASE - 1;
    var VLQ_CONTINUATION_BIT = VLQ_BASE;
    function toVLQSigned(aValue) {
      return aValue < 0 ? ((-aValue) << 1) + 1 : (aValue << 1) + 0;
    }
    function fromVLQSigned(aValue) {
      var isNegative = (aValue & 1) === 1;
      var shifted = aValue >> 1;
      return isNegative ? -shifted : shifted;
    }
    exports.encode = function base64VLQ_encode(aValue) {
      var encoded = "";
      var digit;
      var vlq = toVLQSigned(aValue);
      do {
        digit = vlq & VLQ_BASE_MASK;
        vlq >>>= VLQ_BASE_SHIFT;
        if (vlq > 0) {
          digit |= VLQ_CONTINUATION_BIT;
        }
        encoded += base64.encode(digit);
      } while (vlq > 0);
      return encoded;
    };
    exports.decode = function base64VLQ_decode(aStr) {
      var i = 0;
      var strLen = aStr.length;
      var result = 0;
      var shift = 0;
      var continuation,
          digit;
      do {
        if (i >= strLen) {
          throw new Error("Expected more digits in base 64 VLQ value.");
        }
        digit = base64.decode(aStr.charAt(i++));
        continuation = !!(digit & VLQ_CONTINUATION_BIT);
        digit &= VLQ_BASE_MASK;
        result = result + (digit << shift);
        shift += VLQ_BASE_SHIFT;
      } while (continuation);
      return {
        value: fromVLQSigned(result),
        rest: aStr.slice(i)
      };
    };
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("51", ["a"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  (function(process) {
    function normalizeArray(parts, allowAboveRoot) {
      var up = 0;
      for (var i = parts.length - 1; i >= 0; i--) {
        var last = parts[i];
        if (last === '.') {
          parts.splice(i, 1);
        } else if (last === '..') {
          parts.splice(i, 1);
          up++;
        } else if (up) {
          parts.splice(i, 1);
          up--;
        }
      }
      if (allowAboveRoot) {
        for (; up--; up) {
          parts.unshift('..');
        }
      }
      return parts;
    }
    var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
    var splitPath = function(filename) {
      return splitPathRe.exec(filename).slice(1);
    };
    exports.resolve = function() {
      var resolvedPath = '',
          resolvedAbsolute = false;
      for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
        var path = (i >= 0) ? arguments[i] : process.cwd();
        if (typeof path !== 'string') {
          throw new TypeError('Arguments to path.resolve must be strings');
        } else if (!path) {
          continue;
        }
        resolvedPath = path + '/' + resolvedPath;
        resolvedAbsolute = path.charAt(0) === '/';
      }
      resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
        return !!p;
      }), !resolvedAbsolute).join('/');
      return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
    };
    exports.normalize = function(path) {
      var isAbsolute = exports.isAbsolute(path),
          trailingSlash = substr(path, -1) === '/';
      path = normalizeArray(filter(path.split('/'), function(p) {
        return !!p;
      }), !isAbsolute).join('/');
      if (!path && !isAbsolute) {
        path = '.';
      }
      if (path && trailingSlash) {
        path += '/';
      }
      return (isAbsolute ? '/' : '') + path;
    };
    exports.isAbsolute = function(path) {
      return path.charAt(0) === '/';
    };
    exports.join = function() {
      var paths = Array.prototype.slice.call(arguments, 0);
      return exports.normalize(filter(paths, function(p, index) {
        if (typeof p !== 'string') {
          throw new TypeError('Arguments to path.join must be strings');
        }
        return p;
      }).join('/'));
    };
    exports.relative = function(from, to) {
      from = exports.resolve(from).substr(1);
      to = exports.resolve(to).substr(1);
      function trim(arr) {
        var start = 0;
        for (; start < arr.length; start++) {
          if (arr[start] !== '')
            break;
        }
        var end = arr.length - 1;
        for (; end >= 0; end--) {
          if (arr[end] !== '')
            break;
        }
        if (start > end)
          return [];
        return arr.slice(start, end - start + 1);
      }
      var fromParts = trim(from.split('/'));
      var toParts = trim(to.split('/'));
      var length = Math.min(fromParts.length, toParts.length);
      var samePartsLength = length;
      for (var i = 0; i < length; i++) {
        if (fromParts[i] !== toParts[i]) {
          samePartsLength = i;
          break;
        }
      }
      var outputParts = [];
      for (var i = samePartsLength; i < fromParts.length; i++) {
        outputParts.push('..');
      }
      outputParts = outputParts.concat(toParts.slice(samePartsLength));
      return outputParts.join('/');
    };
    exports.sep = '/';
    exports.delimiter = ':';
    exports.dirname = function(path) {
      var result = splitPath(path),
          root = result[0],
          dir = result[1];
      if (!root && !dir) {
        return '.';
      }
      if (dir) {
        dir = dir.substr(0, dir.length - 1);
      }
      return root + dir;
    };
    exports.basename = function(path, ext) {
      var f = splitPath(path)[2];
      if (ext && f.substr(-1 * ext.length) === ext) {
        f = f.substr(0, f.length - ext.length);
      }
      return f;
    };
    exports.extname = function(path) {
      return splitPath(path)[3];
    };
    function filter(xs, f) {
      if (xs.filter)
        return xs.filter(f);
      var res = [];
      for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs))
          res.push(xs[i]);
      }
      return res;
    }
    var substr = 'ab'.substr(-1) === 'b' ? function(str, start, len) {
      return str.substr(start, len);
    } : function(str, start, len) {
      if (start < 0)
        start = str.length + start;
      return str.substr(start, len);
    };
    ;
  })(require("a"));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("52", [], true, function(require, exports, module) {
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

$__System.registerDynamic("54", ["7b"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("7b");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("53", ["7c"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("7c");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("56", ["7d", "53", "7", "7e", "7f", "80", "a"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var __filename = module.id,
      __dirname = module.id.split('/').splice(0, module.id.split('/').length - 1).join('/');
  (function(process) {
    var deepEqual = require("7d");
    var defined = require("53");
    var path = require("7");
    var inherits = require("7e");
    var EventEmitter = require("7f").EventEmitter;
    var has = require("80");
    module.exports = Test;
    var nextTick = typeof setImmediate !== 'undefined' ? setImmediate : process.nextTick;
    ;
    inherits(Test, EventEmitter);
    var getTestArgs = function(name_, opts_, cb_) {
      var name = '(anonymous)';
      var opts = {};
      var cb;
      for (var i = 0; i < arguments.length; i++) {
        var arg = arguments[i];
        var t = typeof arg;
        if (t === 'string') {
          name = arg;
        } else if (t === 'object') {
          opts = arg || opts;
        } else if (t === 'function') {
          cb = arg;
        }
      }
      return {
        name: name,
        opts: opts,
        cb: cb
      };
    };
    function Test(name_, opts_, cb_) {
      if (!(this instanceof Test)) {
        return new Test(name_, opts_, cb_);
      }
      var args = getTestArgs(name_, opts_, cb_);
      this.readable = true;
      this.name = args.name || '(anonymous)';
      this.assertCount = 0;
      this.pendingCount = 0;
      this._skip = args.opts.skip || false;
      this._plan = undefined;
      this._cb = args.cb;
      this._progeny = [];
      this._ok = true;
      if (args.opts.timeout !== undefined) {
        this.timeoutAfter(args.opts.timeout);
      }
      for (var prop in this) {
        this[prop] = (function bind(self, val) {
          if (typeof val === 'function') {
            return function bound() {
              return val.apply(self, arguments);
            };
          } else
            return val;
        })(this, this[prop]);
      }
    }
    Test.prototype.run = function() {
      if (!this._cb || this._skip) {
        return this._end();
      }
      this.emit('prerun');
      this._cb(this);
      this.emit('run');
    };
    Test.prototype.test = function(name, opts, cb) {
      var self = this;
      var t = new Test(name, opts, cb);
      this._progeny.push(t);
      this.pendingCount++;
      this.emit('test', t);
      t.on('prerun', function() {
        self.assertCount++;
      });
      if (!self._pendingAsserts()) {
        nextTick(function() {
          self._end();
        });
      }
      nextTick(function() {
        if (!self._plan && self.pendingCount == self._progeny.length) {
          self._end();
        }
      });
    };
    Test.prototype.comment = function(msg) {
      this.emit('result', msg.trim().replace(/^#\s*/, ''));
    };
    Test.prototype.plan = function(n) {
      this._plan = n;
      this.emit('plan', n);
    };
    Test.prototype.timeoutAfter = function(ms) {
      if (!ms)
        throw new Error('timeoutAfter requires a timespan');
      var self = this;
      var timeout = setTimeout(function() {
        self.fail('test timed out after ' + ms + 'ms');
        self.end();
      }, ms);
      this.once('end', function() {
        clearTimeout(timeout);
      });
    };
    Test.prototype.end = function(err) {
      var self = this;
      if (arguments.length >= 1 && !!err) {
        this.ifError(err);
      }
      if (this.calledEnd) {
        this.fail('.end() called twice');
      }
      this.calledEnd = true;
      this._end();
    };
    Test.prototype._end = function(err) {
      var self = this;
      if (this._progeny.length) {
        var t = this._progeny.shift();
        t.on('end', function() {
          self._end();
        });
        t.run();
        return;
      }
      if (!this.ended)
        this.emit('end');
      var pendingAsserts = this._pendingAsserts();
      if (!this._planError && this._plan !== undefined && pendingAsserts) {
        this._planError = true;
        this.fail('plan != count', {
          expected: this._plan,
          actual: this.assertCount
        });
      }
      this.ended = true;
    };
    Test.prototype._exit = function() {
      if (this._plan !== undefined && !this._planError && this.assertCount !== this._plan) {
        this._planError = true;
        this.fail('plan != count', {
          expected: this._plan,
          actual: this.assertCount,
          exiting: true
        });
      } else if (!this.ended) {
        this.fail('test exited without ending', {exiting: true});
      }
    };
    Test.prototype._pendingAsserts = function() {
      if (this._plan === undefined) {
        return 1;
      } else {
        return this._plan - (this._progeny.length + this.assertCount);
      }
    };
    Test.prototype._assert = function assert(ok, opts) {
      var self = this;
      var extra = opts.extra || {};
      var res = {
        id: self.assertCount++,
        ok: Boolean(ok),
        skip: defined(extra.skip, opts.skip),
        name: defined(extra.message, opts.message, '(unnamed assert)'),
        operator: defined(extra.operator, opts.operator)
      };
      if (has(opts, 'actual') || has(extra, 'actual')) {
        res.actual = defined(extra.actual, opts.actual);
      }
      if (has(opts, 'expected') || has(extra, 'expected')) {
        res.expected = defined(extra.expected, opts.expected);
      }
      this._ok = Boolean(this._ok && ok);
      if (!ok) {
        res.error = defined(extra.error, opts.error, new Error(res.name));
      }
      if (!ok) {
        var e = new Error('exception');
        var err = (e.stack || '').split('\n');
        var dir = path.dirname(__dirname) + '/';
        for (var i = 0; i < err.length; i++) {
          var m = /^[^\s]*\s*\bat\s+(.+)/.exec(err[i]);
          if (!m) {
            continue;
          }
          var s = m[1].split(/\s+/);
          var filem = /(\/[^:\s]+:(\d+)(?::(\d+))?)/.exec(s[1]);
          if (!filem) {
            filem = /(\/[^:\s]+:(\d+)(?::(\d+))?)/.exec(s[2]);
            if (!filem) {
              filem = /(\/[^:\s]+:(\d+)(?::(\d+))?)/.exec(s[3]);
              if (!filem) {
                continue;
              }
            }
          }
          if (filem[1].slice(0, dir.length) === dir) {
            continue;
          }
          res.functionName = s[0];
          res.file = filem[1];
          res.line = Number(filem[2]);
          if (filem[3])
            res.column = filem[3];
          res.at = m[1];
          break;
        }
      }
      self.emit('result', res);
      var pendingAsserts = self._pendingAsserts();
      if (!pendingAsserts) {
        if (extra.exiting) {
          self._end();
        } else {
          nextTick(function() {
            self._end();
          });
        }
      }
      if (!self._planError && pendingAsserts < 0) {
        self._planError = true;
        self.fail('plan != count', {
          expected: self._plan,
          actual: self._plan - pendingAsserts
        });
      }
    };
    Test.prototype.fail = function(msg, extra) {
      this._assert(false, {
        message: msg,
        operator: 'fail',
        extra: extra
      });
    };
    Test.prototype.pass = function(msg, extra) {
      this._assert(true, {
        message: msg,
        operator: 'pass',
        extra: extra
      });
    };
    Test.prototype.skip = function(msg, extra) {
      this._assert(true, {
        message: msg,
        operator: 'skip',
        skip: true,
        extra: extra
      });
    };
    Test.prototype.ok = Test.prototype['true'] = Test.prototype.assert = function(value, msg, extra) {
      this._assert(value, {
        message: msg,
        operator: 'ok',
        expected: true,
        actual: value,
        extra: extra
      });
    };
    Test.prototype.notOk = Test.prototype['false'] = Test.prototype.notok = function(value, msg, extra) {
      this._assert(!value, {
        message: msg,
        operator: 'notOk',
        expected: false,
        actual: value,
        extra: extra
      });
    };
    Test.prototype.error = Test.prototype.ifError = Test.prototype.ifErr = Test.prototype.iferror = function(err, msg, extra) {
      this._assert(!err, {
        message: defined(msg, String(err)),
        operator: 'error',
        actual: err,
        extra: extra
      });
    };
    Test.prototype.equal = Test.prototype.equals = Test.prototype.isEqual = Test.prototype.is = Test.prototype.strictEqual = Test.prototype.strictEquals = function(a, b, msg, extra) {
      this._assert(a === b, {
        message: defined(msg, 'should be equal'),
        operator: 'equal',
        actual: a,
        expected: b,
        extra: extra
      });
    };
    Test.prototype.notEqual = Test.prototype.notEquals = Test.prototype.notStrictEqual = Test.prototype.notStrictEquals = Test.prototype.isNotEqual = Test.prototype.isNot = Test.prototype.not = Test.prototype.doesNotEqual = Test.prototype.isInequal = function(a, b, msg, extra) {
      this._assert(a !== b, {
        message: defined(msg, 'should not be equal'),
        operator: 'notEqual',
        actual: a,
        notExpected: b,
        extra: extra
      });
    };
    Test.prototype.deepEqual = Test.prototype.deepEquals = Test.prototype.isEquivalent = Test.prototype.same = function(a, b, msg, extra) {
      this._assert(deepEqual(a, b, {strict: true}), {
        message: defined(msg, 'should be equivalent'),
        operator: 'deepEqual',
        actual: a,
        expected: b,
        extra: extra
      });
    };
    Test.prototype.deepLooseEqual = Test.prototype.looseEqual = Test.prototype.looseEquals = function(a, b, msg, extra) {
      this._assert(deepEqual(a, b), {
        message: defined(msg, 'should be equivalent'),
        operator: 'deepLooseEqual',
        actual: a,
        expected: b,
        extra: extra
      });
    };
    Test.prototype.notDeepEqual = Test.prototype.notEquivalent = Test.prototype.notDeeply = Test.prototype.notSame = Test.prototype.isNotDeepEqual = Test.prototype.isNotDeeply = Test.prototype.isNotEquivalent = Test.prototype.isInequivalent = function(a, b, msg, extra) {
      this._assert(!deepEqual(a, b, {strict: true}), {
        message: defined(msg, 'should not be equivalent'),
        operator: 'notDeepEqual',
        actual: a,
        notExpected: b,
        extra: extra
      });
    };
    Test.prototype.notDeepLooseEqual = Test.prototype.notLooseEqual = Test.prototype.notLooseEquals = function(a, b, msg, extra) {
      this._assert(!deepEqual(a, b), {
        message: defined(msg, 'should be equivalent'),
        operator: 'notDeepLooseEqual',
        actual: a,
        expected: b,
        extra: extra
      });
    };
    Test.prototype['throws'] = function(fn, expected, msg, extra) {
      if (typeof expected === 'string') {
        msg = expected;
        expected = undefined;
      }
      var caught = undefined;
      try {
        fn();
      } catch (err) {
        caught = {error: err};
        var message = err.message;
        delete err.message;
        err.message = message;
      }
      var passed = caught;
      if (expected instanceof RegExp) {
        passed = expected.test(caught && caught.error);
        expected = String(expected);
      }
      if (typeof expected === 'function' && caught) {
        passed = caught.error instanceof expected;
        caught.error = caught.error.constructor;
      }
      this._assert(passed, {
        message: defined(msg, 'should throw'),
        operator: 'throws',
        actual: caught && caught.error,
        expected: expected,
        error: !passed && caught && caught.error,
        extra: extra
      });
    };
    Test.prototype.doesNotThrow = function(fn, expected, msg, extra) {
      if (typeof expected === 'string') {
        msg = expected;
        expected = undefined;
      }
      var caught = undefined;
      try {
        fn();
      } catch (err) {
        caught = {error: err};
      }
      this._assert(!caught, {
        message: defined(msg, 'should not throw'),
        operator: 'throws',
        actual: caught && caught.error,
        expected: expected,
        error: caught && caught.error,
        extra: extra
      });
    };
    Test.skip = function(name_, _opts, _cb) {
      var args = getTestArgs.apply(null, arguments);
      args.opts.skip = true;
      return Test(args.name, args.opts, args.cb);
    };
  })(require("a"));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("55", ["54", "8", "a"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  (function(process) {
    var through = require("54");
    var fs = require("8");
    module.exports = function() {
      var line = '';
      var stream = through(write, flush);
      return stream;
      function write(buf) {
        for (var i = 0; i < buf.length; i++) {
          var c = typeof buf === 'string' ? buf.charAt(i) : String.fromCharCode(buf[i]);
          ;
          if (c === '\n')
            flush();
          else
            line += c;
        }
      }
      function flush() {
        if (fs.writeSync && /^win/.test(process.platform)) {
          try {
            fs.writeSync(1, line + '\n');
          } catch (e) {
            stream.emit('error', e);
          }
        } else {
          try {
            console.log(line);
          } catch (e) {
            stream.emit('error', e);
          }
        }
        line = '';
      }
    };
  })(require("a"));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("58", ["81", "82", "83"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var base64 = require("81");
  var ieee754 = require("82");
  var isArray = require("83");
  exports.Buffer = Buffer;
  exports.SlowBuffer = SlowBuffer;
  exports.INSPECT_MAX_BYTES = 50;
  Buffer.poolSize = 8192;
  var rootParent = {};
  Buffer.TYPED_ARRAY_SUPPORT = (function() {
    function Bar() {}
    try {
      var arr = new Uint8Array(1);
      arr.foo = function() {
        return 42;
      };
      arr.constructor = Bar;
      return arr.foo() === 42 && arr.constructor === Bar && typeof arr.subarray === 'function' && arr.subarray(1, 1).byteLength === 0;
    } catch (e) {
      return false;
    }
  })();
  function kMaxLength() {
    return Buffer.TYPED_ARRAY_SUPPORT ? 0x7fffffff : 0x3fffffff;
  }
  function Buffer(arg) {
    if (!(this instanceof Buffer)) {
      if (arguments.length > 1)
        return new Buffer(arg, arguments[1]);
      return new Buffer(arg);
    }
    this.length = 0;
    this.parent = undefined;
    if (typeof arg === 'number') {
      return fromNumber(this, arg);
    }
    if (typeof arg === 'string') {
      return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8');
    }
    return fromObject(this, arg);
  }
  function fromNumber(that, length) {
    that = allocate(that, length < 0 ? 0 : checked(length) | 0);
    if (!Buffer.TYPED_ARRAY_SUPPORT) {
      for (var i = 0; i < length; i++) {
        that[i] = 0;
      }
    }
    return that;
  }
  function fromString(that, string, encoding) {
    if (typeof encoding !== 'string' || encoding === '')
      encoding = 'utf8';
    var length = byteLength(string, encoding) | 0;
    that = allocate(that, length);
    that.write(string, encoding);
    return that;
  }
  function fromObject(that, object) {
    if (Buffer.isBuffer(object))
      return fromBuffer(that, object);
    if (isArray(object))
      return fromArray(that, object);
    if (object == null) {
      throw new TypeError('must start with number, buffer, array or string');
    }
    if (typeof ArrayBuffer !== 'undefined') {
      if (object.buffer instanceof ArrayBuffer) {
        return fromTypedArray(that, object);
      }
      if (object instanceof ArrayBuffer) {
        return fromArrayBuffer(that, object);
      }
    }
    if (object.length)
      return fromArrayLike(that, object);
    return fromJsonObject(that, object);
  }
  function fromBuffer(that, buffer) {
    var length = checked(buffer.length) | 0;
    that = allocate(that, length);
    buffer.copy(that, 0, 0, length);
    return that;
  }
  function fromArray(that, array) {
    var length = checked(array.length) | 0;
    that = allocate(that, length);
    for (var i = 0; i < length; i += 1) {
      that[i] = array[i] & 255;
    }
    return that;
  }
  function fromTypedArray(that, array) {
    var length = checked(array.length) | 0;
    that = allocate(that, length);
    for (var i = 0; i < length; i += 1) {
      that[i] = array[i] & 255;
    }
    return that;
  }
  function fromArrayBuffer(that, array) {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      array.byteLength;
      that = Buffer._augment(new Uint8Array(array));
    } else {
      that = fromTypedArray(that, new Uint8Array(array));
    }
    return that;
  }
  function fromArrayLike(that, array) {
    var length = checked(array.length) | 0;
    that = allocate(that, length);
    for (var i = 0; i < length; i += 1) {
      that[i] = array[i] & 255;
    }
    return that;
  }
  function fromJsonObject(that, object) {
    var array;
    var length = 0;
    if (object.type === 'Buffer' && isArray(object.data)) {
      array = object.data;
      length = checked(array.length) | 0;
    }
    that = allocate(that, length);
    for (var i = 0; i < length; i += 1) {
      that[i] = array[i] & 255;
    }
    return that;
  }
  function allocate(that, length) {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      that = Buffer._augment(new Uint8Array(length));
    } else {
      that.length = length;
      that._isBuffer = true;
    }
    var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1;
    if (fromPool)
      that.parent = rootParent;
    return that;
  }
  function checked(length) {
    if (length >= kMaxLength()) {
      throw new RangeError('Attempt to allocate Buffer larger than maximum ' + 'size: 0x' + kMaxLength().toString(16) + ' bytes');
    }
    return length | 0;
  }
  function SlowBuffer(subject, encoding) {
    if (!(this instanceof SlowBuffer))
      return new SlowBuffer(subject, encoding);
    var buf = new Buffer(subject, encoding);
    delete buf.parent;
    return buf;
  }
  Buffer.isBuffer = function isBuffer(b) {
    return !!(b != null && b._isBuffer);
  };
  Buffer.compare = function compare(a, b) {
    if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
      throw new TypeError('Arguments must be Buffers');
    }
    if (a === b)
      return 0;
    var x = a.length;
    var y = b.length;
    var i = 0;
    var len = Math.min(x, y);
    while (i < len) {
      if (a[i] !== b[i])
        break;
      ++i;
    }
    if (i !== len) {
      x = a[i];
      y = b[i];
    }
    if (x < y)
      return -1;
    if (y < x)
      return 1;
    return 0;
  };
  Buffer.isEncoding = function isEncoding(encoding) {
    switch (String(encoding).toLowerCase()) {
      case 'hex':
      case 'utf8':
      case 'utf-8':
      case 'ascii':
      case 'binary':
      case 'base64':
      case 'raw':
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return true;
      default:
        return false;
    }
  };
  Buffer.concat = function concat(list, length) {
    if (!isArray(list))
      throw new TypeError('list argument must be an Array of Buffers.');
    if (list.length === 0) {
      return new Buffer(0);
    }
    var i;
    if (length === undefined) {
      length = 0;
      for (i = 0; i < list.length; i++) {
        length += list[i].length;
      }
    }
    var buf = new Buffer(length);
    var pos = 0;
    for (i = 0; i < list.length; i++) {
      var item = list[i];
      item.copy(buf, pos);
      pos += item.length;
    }
    return buf;
  };
  function byteLength(string, encoding) {
    if (typeof string !== 'string')
      string = '' + string;
    var len = string.length;
    if (len === 0)
      return 0;
    var loweredCase = false;
    for (; ; ) {
      switch (encoding) {
        case 'ascii':
        case 'binary':
        case 'raw':
        case 'raws':
          return len;
        case 'utf8':
        case 'utf-8':
          return utf8ToBytes(string).length;
        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return len * 2;
        case 'hex':
          return len >>> 1;
        case 'base64':
          return base64ToBytes(string).length;
        default:
          if (loweredCase)
            return utf8ToBytes(string).length;
          encoding = ('' + encoding).toLowerCase();
          loweredCase = true;
      }
    }
  }
  Buffer.byteLength = byteLength;
  Buffer.prototype.length = undefined;
  Buffer.prototype.parent = undefined;
  function slowToString(encoding, start, end) {
    var loweredCase = false;
    start = start | 0;
    end = end === undefined || end === Infinity ? this.length : end | 0;
    if (!encoding)
      encoding = 'utf8';
    if (start < 0)
      start = 0;
    if (end > this.length)
      end = this.length;
    if (end <= start)
      return '';
    while (true) {
      switch (encoding) {
        case 'hex':
          return hexSlice(this, start, end);
        case 'utf8':
        case 'utf-8':
          return utf8Slice(this, start, end);
        case 'ascii':
          return asciiSlice(this, start, end);
        case 'binary':
          return binarySlice(this, start, end);
        case 'base64':
          return base64Slice(this, start, end);
        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return utf16leSlice(this, start, end);
        default:
          if (loweredCase)
            throw new TypeError('Unknown encoding: ' + encoding);
          encoding = (encoding + '').toLowerCase();
          loweredCase = true;
      }
    }
  }
  Buffer.prototype.toString = function toString() {
    var length = this.length | 0;
    if (length === 0)
      return '';
    if (arguments.length === 0)
      return utf8Slice(this, 0, length);
    return slowToString.apply(this, arguments);
  };
  Buffer.prototype.equals = function equals(b) {
    if (!Buffer.isBuffer(b))
      throw new TypeError('Argument must be a Buffer');
    if (this === b)
      return true;
    return Buffer.compare(this, b) === 0;
  };
  Buffer.prototype.inspect = function inspect() {
    var str = '';
    var max = exports.INSPECT_MAX_BYTES;
    if (this.length > 0) {
      str = this.toString('hex', 0, max).match(/.{2}/g).join(' ');
      if (this.length > max)
        str += ' ... ';
    }
    return '<Buffer ' + str + '>';
  };
  Buffer.prototype.compare = function compare(b) {
    if (!Buffer.isBuffer(b))
      throw new TypeError('Argument must be a Buffer');
    if (this === b)
      return 0;
    return Buffer.compare(this, b);
  };
  Buffer.prototype.indexOf = function indexOf(val, byteOffset) {
    if (byteOffset > 0x7fffffff)
      byteOffset = 0x7fffffff;
    else if (byteOffset < -0x80000000)
      byteOffset = -0x80000000;
    byteOffset >>= 0;
    if (this.length === 0)
      return -1;
    if (byteOffset >= this.length)
      return -1;
    if (byteOffset < 0)
      byteOffset = Math.max(this.length + byteOffset, 0);
    if (typeof val === 'string') {
      if (val.length === 0)
        return -1;
      return String.prototype.indexOf.call(this, val, byteOffset);
    }
    if (Buffer.isBuffer(val)) {
      return arrayIndexOf(this, val, byteOffset);
    }
    if (typeof val === 'number') {
      if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
        return Uint8Array.prototype.indexOf.call(this, val, byteOffset);
      }
      return arrayIndexOf(this, [val], byteOffset);
    }
    function arrayIndexOf(arr, val, byteOffset) {
      var foundIndex = -1;
      for (var i = 0; byteOffset + i < arr.length; i++) {
        if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
          if (foundIndex === -1)
            foundIndex = i;
          if (i - foundIndex + 1 === val.length)
            return byteOffset + foundIndex;
        } else {
          foundIndex = -1;
        }
      }
      return -1;
    }
    throw new TypeError('val must be string, number or Buffer');
  };
  Buffer.prototype.get = function get(offset) {
    console.log('.get() is deprecated. Access using array indexes instead.');
    return this.readUInt8(offset);
  };
  Buffer.prototype.set = function set(v, offset) {
    console.log('.set() is deprecated. Access using array indexes instead.');
    return this.writeUInt8(v, offset);
  };
  function hexWrite(buf, string, offset, length) {
    offset = Number(offset) || 0;
    var remaining = buf.length - offset;
    if (!length) {
      length = remaining;
    } else {
      length = Number(length);
      if (length > remaining) {
        length = remaining;
      }
    }
    var strLen = string.length;
    if (strLen % 2 !== 0)
      throw new Error('Invalid hex string');
    if (length > strLen / 2) {
      length = strLen / 2;
    }
    for (var i = 0; i < length; i++) {
      var parsed = parseInt(string.substr(i * 2, 2), 16);
      if (isNaN(parsed))
        throw new Error('Invalid hex string');
      buf[offset + i] = parsed;
    }
    return i;
  }
  function utf8Write(buf, string, offset, length) {
    return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
  }
  function asciiWrite(buf, string, offset, length) {
    return blitBuffer(asciiToBytes(string), buf, offset, length);
  }
  function binaryWrite(buf, string, offset, length) {
    return asciiWrite(buf, string, offset, length);
  }
  function base64Write(buf, string, offset, length) {
    return blitBuffer(base64ToBytes(string), buf, offset, length);
  }
  function ucs2Write(buf, string, offset, length) {
    return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
  }
  Buffer.prototype.write = function write(string, offset, length, encoding) {
    if (offset === undefined) {
      encoding = 'utf8';
      length = this.length;
      offset = 0;
    } else if (length === undefined && typeof offset === 'string') {
      encoding = offset;
      length = this.length;
      offset = 0;
    } else if (isFinite(offset)) {
      offset = offset | 0;
      if (isFinite(length)) {
        length = length | 0;
        if (encoding === undefined)
          encoding = 'utf8';
      } else {
        encoding = length;
        length = undefined;
      }
    } else {
      var swap = encoding;
      encoding = offset;
      offset = length | 0;
      length = swap;
    }
    var remaining = this.length - offset;
    if (length === undefined || length > remaining)
      length = remaining;
    if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
      throw new RangeError('attempt to write outside buffer bounds');
    }
    if (!encoding)
      encoding = 'utf8';
    var loweredCase = false;
    for (; ; ) {
      switch (encoding) {
        case 'hex':
          return hexWrite(this, string, offset, length);
        case 'utf8':
        case 'utf-8':
          return utf8Write(this, string, offset, length);
        case 'ascii':
          return asciiWrite(this, string, offset, length);
        case 'binary':
          return binaryWrite(this, string, offset, length);
        case 'base64':
          return base64Write(this, string, offset, length);
        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return ucs2Write(this, string, offset, length);
        default:
          if (loweredCase)
            throw new TypeError('Unknown encoding: ' + encoding);
          encoding = ('' + encoding).toLowerCase();
          loweredCase = true;
      }
    }
  };
  Buffer.prototype.toJSON = function toJSON() {
    return {
      type: 'Buffer',
      data: Array.prototype.slice.call(this._arr || this, 0)
    };
  };
  function base64Slice(buf, start, end) {
    if (start === 0 && end === buf.length) {
      return base64.fromByteArray(buf);
    } else {
      return base64.fromByteArray(buf.slice(start, end));
    }
  }
  function utf8Slice(buf, start, end) {
    end = Math.min(buf.length, end);
    var res = [];
    var i = start;
    while (i < end) {
      var firstByte = buf[i];
      var codePoint = null;
      var bytesPerSequence = (firstByte > 0xEF) ? 4 : (firstByte > 0xDF) ? 3 : (firstByte > 0xBF) ? 2 : 1;
      if (i + bytesPerSequence <= end) {
        var secondByte,
            thirdByte,
            fourthByte,
            tempCodePoint;
        switch (bytesPerSequence) {
          case 1:
            if (firstByte < 0x80) {
              codePoint = firstByte;
            }
            break;
          case 2:
            secondByte = buf[i + 1];
            if ((secondByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
              if (tempCodePoint > 0x7F) {
                codePoint = tempCodePoint;
              }
            }
            break;
          case 3:
            secondByte = buf[i + 1];
            thirdByte = buf[i + 2];
            if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
              if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                codePoint = tempCodePoint;
              }
            }
            break;
          case 4:
            secondByte = buf[i + 1];
            thirdByte = buf[i + 2];
            fourthByte = buf[i + 3];
            if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);
              if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                codePoint = tempCodePoint;
              }
            }
        }
      }
      if (codePoint === null) {
        codePoint = 0xFFFD;
        bytesPerSequence = 1;
      } else if (codePoint > 0xFFFF) {
        codePoint -= 0x10000;
        res.push(codePoint >>> 10 & 0x3FF | 0xD800);
        codePoint = 0xDC00 | codePoint & 0x3FF;
      }
      res.push(codePoint);
      i += bytesPerSequence;
    }
    return decodeCodePointsArray(res);
  }
  var MAX_ARGUMENTS_LENGTH = 0x1000;
  function decodeCodePointsArray(codePoints) {
    var len = codePoints.length;
    if (len <= MAX_ARGUMENTS_LENGTH) {
      return String.fromCharCode.apply(String, codePoints);
    }
    var res = '';
    var i = 0;
    while (i < len) {
      res += String.fromCharCode.apply(String, codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH));
    }
    return res;
  }
  function asciiSlice(buf, start, end) {
    var ret = '';
    end = Math.min(buf.length, end);
    for (var i = start; i < end; i++) {
      ret += String.fromCharCode(buf[i] & 0x7F);
    }
    return ret;
  }
  function binarySlice(buf, start, end) {
    var ret = '';
    end = Math.min(buf.length, end);
    for (var i = start; i < end; i++) {
      ret += String.fromCharCode(buf[i]);
    }
    return ret;
  }
  function hexSlice(buf, start, end) {
    var len = buf.length;
    if (!start || start < 0)
      start = 0;
    if (!end || end < 0 || end > len)
      end = len;
    var out = '';
    for (var i = start; i < end; i++) {
      out += toHex(buf[i]);
    }
    return out;
  }
  function utf16leSlice(buf, start, end) {
    var bytes = buf.slice(start, end);
    var res = '';
    for (var i = 0; i < bytes.length; i += 2) {
      res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
    }
    return res;
  }
  Buffer.prototype.slice = function slice(start, end) {
    var len = this.length;
    start = ~~start;
    end = end === undefined ? len : ~~end;
    if (start < 0) {
      start += len;
      if (start < 0)
        start = 0;
    } else if (start > len) {
      start = len;
    }
    if (end < 0) {
      end += len;
      if (end < 0)
        end = 0;
    } else if (end > len) {
      end = len;
    }
    if (end < start)
      end = start;
    var newBuf;
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      newBuf = Buffer._augment(this.subarray(start, end));
    } else {
      var sliceLen = end - start;
      newBuf = new Buffer(sliceLen, undefined);
      for (var i = 0; i < sliceLen; i++) {
        newBuf[i] = this[i + start];
      }
    }
    if (newBuf.length)
      newBuf.parent = this.parent || this;
    return newBuf;
  };
  function checkOffset(offset, ext, length) {
    if ((offset % 1) !== 0 || offset < 0)
      throw new RangeError('offset is not uint');
    if (offset + ext > length)
      throw new RangeError('Trying to access beyond buffer length');
  }
  Buffer.prototype.readUIntLE = function readUIntLE(offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert)
      checkOffset(offset, byteLength, this.length);
    var val = this[offset];
    var mul = 1;
    var i = 0;
    while (++i < byteLength && (mul *= 0x100)) {
      val += this[offset + i] * mul;
    }
    return val;
  };
  Buffer.prototype.readUIntBE = function readUIntBE(offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) {
      checkOffset(offset, byteLength, this.length);
    }
    var val = this[offset + --byteLength];
    var mul = 1;
    while (byteLength > 0 && (mul *= 0x100)) {
      val += this[offset + --byteLength] * mul;
    }
    return val;
  };
  Buffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
    if (!noAssert)
      checkOffset(offset, 1, this.length);
    return this[offset];
  };
  Buffer.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
    if (!noAssert)
      checkOffset(offset, 2, this.length);
    return this[offset] | (this[offset + 1] << 8);
  };
  Buffer.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
    if (!noAssert)
      checkOffset(offset, 2, this.length);
    return (this[offset] << 8) | this[offset + 1];
  };
  Buffer.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
    if (!noAssert)
      checkOffset(offset, 4, this.length);
    return ((this[offset]) | (this[offset + 1] << 8) | (this[offset + 2] << 16)) + (this[offset + 3] * 0x1000000);
  };
  Buffer.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
    if (!noAssert)
      checkOffset(offset, 4, this.length);
    return (this[offset] * 0x1000000) + ((this[offset + 1] << 16) | (this[offset + 2] << 8) | this[offset + 3]);
  };
  Buffer.prototype.readIntLE = function readIntLE(offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert)
      checkOffset(offset, byteLength, this.length);
    var val = this[offset];
    var mul = 1;
    var i = 0;
    while (++i < byteLength && (mul *= 0x100)) {
      val += this[offset + i] * mul;
    }
    mul *= 0x80;
    if (val >= mul)
      val -= Math.pow(2, 8 * byteLength);
    return val;
  };
  Buffer.prototype.readIntBE = function readIntBE(offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert)
      checkOffset(offset, byteLength, this.length);
    var i = byteLength;
    var mul = 1;
    var val = this[offset + --i];
    while (i > 0 && (mul *= 0x100)) {
      val += this[offset + --i] * mul;
    }
    mul *= 0x80;
    if (val >= mul)
      val -= Math.pow(2, 8 * byteLength);
    return val;
  };
  Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
    if (!noAssert)
      checkOffset(offset, 1, this.length);
    if (!(this[offset] & 0x80))
      return (this[offset]);
    return ((0xff - this[offset] + 1) * -1);
  };
  Buffer.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
    if (!noAssert)
      checkOffset(offset, 2, this.length);
    var val = this[offset] | (this[offset + 1] << 8);
    return (val & 0x8000) ? val | 0xFFFF0000 : val;
  };
  Buffer.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
    if (!noAssert)
      checkOffset(offset, 2, this.length);
    var val = this[offset + 1] | (this[offset] << 8);
    return (val & 0x8000) ? val | 0xFFFF0000 : val;
  };
  Buffer.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
    if (!noAssert)
      checkOffset(offset, 4, this.length);
    return (this[offset]) | (this[offset + 1] << 8) | (this[offset + 2] << 16) | (this[offset + 3] << 24);
  };
  Buffer.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
    if (!noAssert)
      checkOffset(offset, 4, this.length);
    return (this[offset] << 24) | (this[offset + 1] << 16) | (this[offset + 2] << 8) | (this[offset + 3]);
  };
  Buffer.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
    if (!noAssert)
      checkOffset(offset, 4, this.length);
    return ieee754.read(this, offset, true, 23, 4);
  };
  Buffer.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
    if (!noAssert)
      checkOffset(offset, 4, this.length);
    return ieee754.read(this, offset, false, 23, 4);
  };
  Buffer.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
    if (!noAssert)
      checkOffset(offset, 8, this.length);
    return ieee754.read(this, offset, true, 52, 8);
  };
  Buffer.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
    if (!noAssert)
      checkOffset(offset, 8, this.length);
    return ieee754.read(this, offset, false, 52, 8);
  };
  function checkInt(buf, value, offset, ext, max, min) {
    if (!Buffer.isBuffer(buf))
      throw new TypeError('buffer must be a Buffer instance');
    if (value > max || value < min)
      throw new RangeError('value is out of bounds');
    if (offset + ext > buf.length)
      throw new RangeError('index out of range');
  }
  Buffer.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert)
      checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0);
    var mul = 1;
    var i = 0;
    this[offset] = value & 0xFF;
    while (++i < byteLength && (mul *= 0x100)) {
      this[offset + i] = (value / mul) & 0xFF;
    }
    return offset + byteLength;
  };
  Buffer.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert)
      checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0);
    var i = byteLength - 1;
    var mul = 1;
    this[offset + i] = value & 0xFF;
    while (--i >= 0 && (mul *= 0x100)) {
      this[offset + i] = (value / mul) & 0xFF;
    }
    return offset + byteLength;
  };
  Buffer.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert)
      checkInt(this, value, offset, 1, 0xff, 0);
    if (!Buffer.TYPED_ARRAY_SUPPORT)
      value = Math.floor(value);
    this[offset] = value;
    return offset + 1;
  };
  function objectWriteUInt16(buf, value, offset, littleEndian) {
    if (value < 0)
      value = 0xffff + value + 1;
    for (var i = 0,
        j = Math.min(buf.length - offset, 2); i < j; i++) {
      buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>> (littleEndian ? i : 1 - i) * 8;
    }
  }
  Buffer.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert)
      checkInt(this, value, offset, 2, 0xffff, 0);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = value;
      this[offset + 1] = (value >>> 8);
    } else {
      objectWriteUInt16(this, value, offset, true);
    }
    return offset + 2;
  };
  Buffer.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert)
      checkInt(this, value, offset, 2, 0xffff, 0);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value >>> 8);
      this[offset + 1] = value;
    } else {
      objectWriteUInt16(this, value, offset, false);
    }
    return offset + 2;
  };
  function objectWriteUInt32(buf, value, offset, littleEndian) {
    if (value < 0)
      value = 0xffffffff + value + 1;
    for (var i = 0,
        j = Math.min(buf.length - offset, 4); i < j; i++) {
      buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff;
    }
  }
  Buffer.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert)
      checkInt(this, value, offset, 4, 0xffffffff, 0);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset + 3] = (value >>> 24);
      this[offset + 2] = (value >>> 16);
      this[offset + 1] = (value >>> 8);
      this[offset] = value;
    } else {
      objectWriteUInt32(this, value, offset, true);
    }
    return offset + 4;
  };
  Buffer.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert)
      checkInt(this, value, offset, 4, 0xffffffff, 0);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value >>> 24);
      this[offset + 1] = (value >>> 16);
      this[offset + 2] = (value >>> 8);
      this[offset + 3] = value;
    } else {
      objectWriteUInt32(this, value, offset, false);
    }
    return offset + 4;
  };
  Buffer.prototype.writeIntLE = function writeIntLE(value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) {
      var limit = Math.pow(2, 8 * byteLength - 1);
      checkInt(this, value, offset, byteLength, limit - 1, -limit);
    }
    var i = 0;
    var mul = 1;
    var sub = value < 0 ? 1 : 0;
    this[offset] = value & 0xFF;
    while (++i < byteLength && (mul *= 0x100)) {
      this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
    }
    return offset + byteLength;
  };
  Buffer.prototype.writeIntBE = function writeIntBE(value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) {
      var limit = Math.pow(2, 8 * byteLength - 1);
      checkInt(this, value, offset, byteLength, limit - 1, -limit);
    }
    var i = byteLength - 1;
    var mul = 1;
    var sub = value < 0 ? 1 : 0;
    this[offset + i] = value & 0xFF;
    while (--i >= 0 && (mul *= 0x100)) {
      this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
    }
    return offset + byteLength;
  };
  Buffer.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert)
      checkInt(this, value, offset, 1, 0x7f, -0x80);
    if (!Buffer.TYPED_ARRAY_SUPPORT)
      value = Math.floor(value);
    if (value < 0)
      value = 0xff + value + 1;
    this[offset] = value;
    return offset + 1;
  };
  Buffer.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert)
      checkInt(this, value, offset, 2, 0x7fff, -0x8000);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = value;
      this[offset + 1] = (value >>> 8);
    } else {
      objectWriteUInt16(this, value, offset, true);
    }
    return offset + 2;
  };
  Buffer.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert)
      checkInt(this, value, offset, 2, 0x7fff, -0x8000);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value >>> 8);
      this[offset + 1] = value;
    } else {
      objectWriteUInt16(this, value, offset, false);
    }
    return offset + 2;
  };
  Buffer.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert)
      checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = value;
      this[offset + 1] = (value >>> 8);
      this[offset + 2] = (value >>> 16);
      this[offset + 3] = (value >>> 24);
    } else {
      objectWriteUInt32(this, value, offset, true);
    }
    return offset + 4;
  };
  Buffer.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert)
      checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
    if (value < 0)
      value = 0xffffffff + value + 1;
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value >>> 24);
      this[offset + 1] = (value >>> 16);
      this[offset + 2] = (value >>> 8);
      this[offset + 3] = value;
    } else {
      objectWriteUInt32(this, value, offset, false);
    }
    return offset + 4;
  };
  function checkIEEE754(buf, value, offset, ext, max, min) {
    if (value > max || value < min)
      throw new RangeError('value is out of bounds');
    if (offset + ext > buf.length)
      throw new RangeError('index out of range');
    if (offset < 0)
      throw new RangeError('index out of range');
  }
  function writeFloat(buf, value, offset, littleEndian, noAssert) {
    if (!noAssert) {
      checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38);
    }
    ieee754.write(buf, value, offset, littleEndian, 23, 4);
    return offset + 4;
  }
  Buffer.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
    return writeFloat(this, value, offset, true, noAssert);
  };
  Buffer.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
    return writeFloat(this, value, offset, false, noAssert);
  };
  function writeDouble(buf, value, offset, littleEndian, noAssert) {
    if (!noAssert) {
      checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308);
    }
    ieee754.write(buf, value, offset, littleEndian, 52, 8);
    return offset + 8;
  }
  Buffer.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
    return writeDouble(this, value, offset, true, noAssert);
  };
  Buffer.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
    return writeDouble(this, value, offset, false, noAssert);
  };
  Buffer.prototype.copy = function copy(target, targetStart, start, end) {
    if (!start)
      start = 0;
    if (!end && end !== 0)
      end = this.length;
    if (targetStart >= target.length)
      targetStart = target.length;
    if (!targetStart)
      targetStart = 0;
    if (end > 0 && end < start)
      end = start;
    if (end === start)
      return 0;
    if (target.length === 0 || this.length === 0)
      return 0;
    if (targetStart < 0) {
      throw new RangeError('targetStart out of bounds');
    }
    if (start < 0 || start >= this.length)
      throw new RangeError('sourceStart out of bounds');
    if (end < 0)
      throw new RangeError('sourceEnd out of bounds');
    if (end > this.length)
      end = this.length;
    if (target.length - targetStart < end - start) {
      end = target.length - targetStart + start;
    }
    var len = end - start;
    var i;
    if (this === target && start < targetStart && targetStart < end) {
      for (i = len - 1; i >= 0; i--) {
        target[i + targetStart] = this[i + start];
      }
    } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
      for (i = 0; i < len; i++) {
        target[i + targetStart] = this[i + start];
      }
    } else {
      target._set(this.subarray(start, start + len), targetStart);
    }
    return len;
  };
  Buffer.prototype.fill = function fill(value, start, end) {
    if (!value)
      value = 0;
    if (!start)
      start = 0;
    if (!end)
      end = this.length;
    if (end < start)
      throw new RangeError('end < start');
    if (end === start)
      return;
    if (this.length === 0)
      return;
    if (start < 0 || start >= this.length)
      throw new RangeError('start out of bounds');
    if (end < 0 || end > this.length)
      throw new RangeError('end out of bounds');
    var i;
    if (typeof value === 'number') {
      for (i = start; i < end; i++) {
        this[i] = value;
      }
    } else {
      var bytes = utf8ToBytes(value.toString());
      var len = bytes.length;
      for (i = start; i < end; i++) {
        this[i] = bytes[i % len];
      }
    }
    return this;
  };
  Buffer.prototype.toArrayBuffer = function toArrayBuffer() {
    if (typeof Uint8Array !== 'undefined') {
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        return (new Buffer(this)).buffer;
      } else {
        var buf = new Uint8Array(this.length);
        for (var i = 0,
            len = buf.length; i < len; i += 1) {
          buf[i] = this[i];
        }
        return buf.buffer;
      }
    } else {
      throw new TypeError('Buffer.toArrayBuffer not supported in this browser');
    }
  };
  var BP = Buffer.prototype;
  Buffer._augment = function _augment(arr) {
    arr.constructor = Buffer;
    arr._isBuffer = true;
    arr._set = arr.set;
    arr.get = BP.get;
    arr.set = BP.set;
    arr.write = BP.write;
    arr.toString = BP.toString;
    arr.toLocaleString = BP.toString;
    arr.toJSON = BP.toJSON;
    arr.equals = BP.equals;
    arr.compare = BP.compare;
    arr.indexOf = BP.indexOf;
    arr.copy = BP.copy;
    arr.slice = BP.slice;
    arr.readUIntLE = BP.readUIntLE;
    arr.readUIntBE = BP.readUIntBE;
    arr.readUInt8 = BP.readUInt8;
    arr.readUInt16LE = BP.readUInt16LE;
    arr.readUInt16BE = BP.readUInt16BE;
    arr.readUInt32LE = BP.readUInt32LE;
    arr.readUInt32BE = BP.readUInt32BE;
    arr.readIntLE = BP.readIntLE;
    arr.readIntBE = BP.readIntBE;
    arr.readInt8 = BP.readInt8;
    arr.readInt16LE = BP.readInt16LE;
    arr.readInt16BE = BP.readInt16BE;
    arr.readInt32LE = BP.readInt32LE;
    arr.readInt32BE = BP.readInt32BE;
    arr.readFloatLE = BP.readFloatLE;
    arr.readFloatBE = BP.readFloatBE;
    arr.readDoubleLE = BP.readDoubleLE;
    arr.readDoubleBE = BP.readDoubleBE;
    arr.writeUInt8 = BP.writeUInt8;
    arr.writeUIntLE = BP.writeUIntLE;
    arr.writeUIntBE = BP.writeUIntBE;
    arr.writeUInt16LE = BP.writeUInt16LE;
    arr.writeUInt16BE = BP.writeUInt16BE;
    arr.writeUInt32LE = BP.writeUInt32LE;
    arr.writeUInt32BE = BP.writeUInt32BE;
    arr.writeIntLE = BP.writeIntLE;
    arr.writeIntBE = BP.writeIntBE;
    arr.writeInt8 = BP.writeInt8;
    arr.writeInt16LE = BP.writeInt16LE;
    arr.writeInt16BE = BP.writeInt16BE;
    arr.writeInt32LE = BP.writeInt32LE;
    arr.writeInt32BE = BP.writeInt32BE;
    arr.writeFloatLE = BP.writeFloatLE;
    arr.writeFloatBE = BP.writeFloatBE;
    arr.writeDoubleLE = BP.writeDoubleLE;
    arr.writeDoubleBE = BP.writeDoubleBE;
    arr.fill = BP.fill;
    arr.inspect = BP.inspect;
    arr.toArrayBuffer = BP.toArrayBuffer;
    return arr;
  };
  var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;
  function base64clean(str) {
    str = stringtrim(str).replace(INVALID_BASE64_RE, '');
    if (str.length < 2)
      return '';
    while (str.length % 4 !== 0) {
      str = str + '=';
    }
    return str;
  }
  function stringtrim(str) {
    if (str.trim)
      return str.trim();
    return str.replace(/^\s+|\s+$/g, '');
  }
  function toHex(n) {
    if (n < 16)
      return '0' + n.toString(16);
    return n.toString(16);
  }
  function utf8ToBytes(string, units) {
    units = units || Infinity;
    var codePoint;
    var length = string.length;
    var leadSurrogate = null;
    var bytes = [];
    for (var i = 0; i < length; i++) {
      codePoint = string.charCodeAt(i);
      if (codePoint > 0xD7FF && codePoint < 0xE000) {
        if (!leadSurrogate) {
          if (codePoint > 0xDBFF) {
            if ((units -= 3) > -1)
              bytes.push(0xEF, 0xBF, 0xBD);
            continue;
          } else if (i + 1 === length) {
            if ((units -= 3) > -1)
              bytes.push(0xEF, 0xBF, 0xBD);
            continue;
          }
          leadSurrogate = codePoint;
          continue;
        }
        if (codePoint < 0xDC00) {
          if ((units -= 3) > -1)
            bytes.push(0xEF, 0xBF, 0xBD);
          leadSurrogate = codePoint;
          continue;
        }
        codePoint = leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00 | 0x10000;
      } else if (leadSurrogate) {
        if ((units -= 3) > -1)
          bytes.push(0xEF, 0xBF, 0xBD);
      }
      leadSurrogate = null;
      if (codePoint < 0x80) {
        if ((units -= 1) < 0)
          break;
        bytes.push(codePoint);
      } else if (codePoint < 0x800) {
        if ((units -= 2) < 0)
          break;
        bytes.push(codePoint >> 0x6 | 0xC0, codePoint & 0x3F | 0x80);
      } else if (codePoint < 0x10000) {
        if ((units -= 3) < 0)
          break;
        bytes.push(codePoint >> 0xC | 0xE0, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
      } else if (codePoint < 0x110000) {
        if ((units -= 4) < 0)
          break;
        bytes.push(codePoint >> 0x12 | 0xF0, codePoint >> 0xC & 0x3F | 0x80, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
      } else {
        throw new Error('Invalid code point');
      }
    }
    return bytes;
  }
  function asciiToBytes(str) {
    var byteArray = [];
    for (var i = 0; i < str.length; i++) {
      byteArray.push(str.charCodeAt(i) & 0xFF);
    }
    return byteArray;
  }
  function utf16leToBytes(str, units) {
    var c,
        hi,
        lo;
    var byteArray = [];
    for (var i = 0; i < str.length; i++) {
      if ((units -= 2) < 0)
        break;
      c = str.charCodeAt(i);
      hi = c >> 8;
      lo = c % 256;
      byteArray.push(lo);
      byteArray.push(hi);
    }
    return byteArray;
  }
  function base64ToBytes(str) {
    return base64.toByteArray(base64clean(str));
  }
  function blitBuffer(src, dst, offset, length) {
    for (var i = 0; i < length; i++) {
      if ((i + offset >= dst.length) || (i >= src.length))
        break;
      dst[i + offset] = src[i];
    }
    return i;
  }
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("57", ["7f", "7e", "54", "84", "85", "86", "80", "a"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  (function(process) {
    var EventEmitter = require("7f").EventEmitter;
    var inherits = require("7e");
    var through = require("54");
    var resumer = require("84");
    var inspect = require("85");
    var bind = require("86");
    var has = require("80");
    var regexpTest = bind.call(Function.call, RegExp.prototype.test);
    var yamlIndicators = /\:|\-|\?/;
    var nextTick = typeof setImmediate !== 'undefined' ? setImmediate : process.nextTick;
    ;
    module.exports = Results;
    inherits(Results, EventEmitter);
    function Results() {
      if (!(this instanceof Results))
        return new Results;
      this.count = 0;
      this.fail = 0;
      this.pass = 0;
      this._stream = through();
      this.tests = [];
    }
    Results.prototype.createStream = function(opts) {
      if (!opts)
        opts = {};
      var self = this;
      var output,
          testId = 0;
      if (opts.objectMode) {
        output = through();
        self.on('_push', function ontest(t, extra) {
          if (!extra)
            extra = {};
          var id = testId++;
          t.once('prerun', function() {
            var row = {
              type: 'test',
              name: t.name,
              id: id
            };
            if (has(extra, 'parent')) {
              row.parent = extra.parent;
            }
            output.queue(row);
          });
          t.on('test', function(st) {
            ontest(st, {parent: id});
          });
          t.on('result', function(res) {
            res.test = id;
            res.type = 'assert';
            output.queue(res);
          });
          t.on('end', function() {
            output.queue({
              type: 'end',
              test: id
            });
          });
        });
        self.on('done', function() {
          output.queue(null);
        });
      } else {
        output = resumer();
        output.queue('TAP version 13\n');
        self._stream.pipe(output);
      }
      nextTick(function next() {
        var t;
        while (t = getNextTest(self)) {
          t.run();
          if (!t.ended)
            return t.once('end', function() {
              nextTick(next);
            });
        }
        self.emit('done');
      });
      return output;
    };
    Results.prototype.push = function(t) {
      var self = this;
      self.tests.push(t);
      self._watch(t);
      self.emit('_push', t);
    };
    Results.prototype.only = function(name) {
      if (this._only) {
        self.count++;
        self.fail++;
        write('not ok ' + self.count + ' already called .only()\n');
      }
      this._only = name;
    };
    Results.prototype._watch = function(t) {
      var self = this;
      var write = function(s) {
        self._stream.queue(s);
      };
      t.once('prerun', function() {
        write('# ' + t.name + '\n');
      });
      t.on('result', function(res) {
        if (typeof res === 'string') {
          write('# ' + res + '\n');
          return;
        }
        write(encodeResult(res, self.count + 1));
        self.count++;
        if (res.ok)
          self.pass++;
        else
          self.fail++;
      });
      t.on('test', function(st) {
        self._watch(st);
      });
    };
    Results.prototype.close = function() {
      var self = this;
      if (self.closed)
        self._stream.emit('error', new Error('ALREADY CLOSED'));
      self.closed = true;
      var write = function(s) {
        self._stream.queue(s);
      };
      write('\n1..' + self.count + '\n');
      write('# tests ' + self.count + '\n');
      write('# pass  ' + self.pass + '\n');
      if (self.fail)
        write('# fail  ' + self.fail + '\n');
      else
        write('\n# ok\n');
      self._stream.queue(null);
    };
    function encodeResult(res, count) {
      var output = '';
      output += (res.ok ? 'ok ' : 'not ok ') + count;
      output += res.name ? ' ' + res.name.toString().replace(/\s+/g, ' ') : '';
      if (res.skip)
        output += ' # SKIP';
      else if (res.todo)
        output += ' # TODO';
      output += '\n';
      if (res.ok)
        return output;
      var outer = '  ';
      var inner = outer + '  ';
      output += outer + '---\n';
      output += inner + 'operator: ' + res.operator + '\n';
      if (has(res, 'expected') || has(res, 'actual')) {
        var ex = inspect(res.expected);
        var ac = inspect(res.actual);
        if (Math.max(ex.length, ac.length) > 65 || invalidYaml(ex) || invalidYaml(ac)) {
          output += inner + 'expected: |-\n' + inner + '  ' + ex + '\n';
          output += inner + 'actual: |-\n' + inner + '  ' + ac + '\n';
        } else {
          output += inner + 'expected: ' + ex + '\n';
          output += inner + 'actual:   ' + ac + '\n';
        }
      }
      if (res.at) {
        output += inner + 'at: ' + res.at + '\n';
      }
      if (res.operator === 'error' && res.actual && res.actual.stack) {
        var lines = String(res.actual.stack).split('\n');
        output += inner + 'stack: |-\n';
        for (var i = 0; i < lines.length; i++) {
          output += inner + '  ' + lines[i] + '\n';
        }
      }
      output += outer + '...\n';
      return output;
    }
    function getNextTest(results) {
      if (!results._only) {
        return results.tests.shift();
      }
      do {
        var t = results.tests.shift();
        if (!t)
          continue;
        if (results._only === t.name) {
          return t;
        }
      } while (results.tests.length !== 0);
    }
    function invalidYaml(str) {
      return regexpTest(yamlIndicators, str);
    }
  })(require("a"));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("59", [], true, function(require, exports, module) {
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

$__System.registerDynamic("5a", ["87", "59", "3d", "88"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _arity = require("87");
  var _curry1 = require("59");
  var _curry2 = require("3d");
  var _curryN = require("88");
  module.exports = _curry2(function curryN(length, fn) {
    if (length === 1) {
      return _curry1(fn);
    }
    return _arity(length, _curryN(length, [], fn));
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("5b", ["89"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var curryN = require("89");
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

$__System.registerDynamic("5c", ["59", "73"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry1 = require("59");
  var _has = require("73");
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

$__System.registerDynamic("5e", [], true, function(require, exports, module) {
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

$__System.registerDynamic("5d", [], true, function(require, exports, module) {
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

$__System.registerDynamic("60", ["15"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var flyd = require("15");
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

$__System.registerDynamic("5f", ["8a", "41", "8b", "8c", "5c", "8d", "8e"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _contains = require("8a");
  var _map = require("41");
  var _quote = require("8b");
  var _toISOString = require("8c");
  var keys = require("5c");
  var reject = require("8d");
  var test = require("8e");
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

$__System.registerDynamic("63", ["59", "8f"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry1 = require("59");
  var _makeFlat = require("8f");
  module.exports = _curry1(_makeFlat(false));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("61", ["90", "91", "92", "93"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var __ = require("90");
  var _curry2 = require("91");
  var _slice = require("92");
  var arity = require("93");
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

$__System.registerDynamic("64", ["3d"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("3d");
  module.exports = _curry2(function nAry(n, fn) {
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
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("62", ["3d", "94", "13"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("3d");
  var _flatCat = require("94");
  var map = require("13");
  module.exports = _curry2(function _xchain(f, xf) {
    return map(f, _flatCat(xf));
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("65", [], true, function(require, exports, module) {
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

$__System.registerDynamic("67", ["3d"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("3d");
  module.exports = _curry2(function is(Ctor, val) {
    return val != null && val.constructor === Ctor || val instanceof Ctor;
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("68", ["87", "66", "95"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _arity = require("87");
  var _slice = require("66");
  var pluck = require("95");
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

$__System.registerDynamic("66", [], true, function(require, exports, module) {
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

$__System.registerDynamic("69", ["3d", "40", "96"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("3d");
  var _dispatchable = require("40");
  var _xall = require("96");
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

$__System.registerDynamic("6a", ["3d", "13"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("3d");
  var map = require("13");
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

$__System.registerDynamic("6f", ["97", "98", "99"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  require("97");
  require("98");
  module.exports = require("99");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("6d", [], true, function(require, exports, module) {
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

$__System.registerDynamic("6b", ["a"], true, function(require, exports, module) {
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
  })(require("a"));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("6c", [], true, function(require, exports, module) {
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

$__System.registerDynamic("70", ["97", "98", "9a"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  require("97");
  require("98");
  module.exports = require("9a");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("6e", [], true, function(require, exports, module) {
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

$__System.registerDynamic("71", [], true, function(require, exports, module) {
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

$__System.registerDynamic("72", ["9b", "9c"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _checkForMethod = require("9b");
  var slice = require("9c");
  module.exports = _checkForMethod('tail', slice(1, Infinity));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("75", ["59"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry1 = require("59");
  module.exports = _curry1(function type(val) {
    return val === null ? 'Null' : val === undefined ? 'Undefined' : Object.prototype.toString.call(val).slice(8, -1);
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("74", ["3d"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("3d");
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

$__System.registerDynamic("76", [], true, function(require, exports, module) {
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

$__System.registerDynamic("73", [], true, function(require, exports, module) {
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

$__System.registerDynamic("78", ["59", "6c"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry1 = require("59");
  var _isArray = require("6c");
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

$__System.registerDynamic("77", ["87", "3d"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _arity = require("87");
  var _curry2 = require("3d");
  module.exports = _curry2(function bind(fn, thisObj) {
    return _arity(fn.length, function() {
      return fn.apply(thisObj, arguments);
    });
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("79", ["7", "a"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var __filename = module.id,
      __dirname = module.id.split('/').splice(0, module.id.split('/').length - 1).join('/');
  (function(process) {
    'use strict';
    function amdefine(module, requireFn) {
      'use strict';
      var defineCache = {},
          loaderCache = {},
          alreadyCalled = false,
          path = require("7"),
          makeRequire,
          stringRequire;
      function trimDots(ary) {
        var i,
            part;
        for (i = 0; ary[i]; i += 1) {
          part = ary[i];
          if (part === '.') {
            ary.splice(i, 1);
            i -= 1;
          } else if (part === '..') {
            if (i === 1 && (ary[2] === '..' || ary[0] === '..')) {
              break;
            } else if (i > 0) {
              ary.splice(i - 1, 2);
              i -= 2;
            }
          }
        }
      }
      function normalize(name, baseName) {
        var baseParts;
        if (name && name.charAt(0) === '.') {
          if (baseName) {
            baseParts = baseName.split('/');
            baseParts = baseParts.slice(0, baseParts.length - 1);
            baseParts = baseParts.concat(name.split('/'));
            trimDots(baseParts);
            name = baseParts.join('/');
          }
        }
        return name;
      }
      function makeNormalize(relName) {
        return function(name) {
          return normalize(name, relName);
        };
      }
      function makeLoad(id) {
        function load(value) {
          loaderCache[id] = value;
        }
        load.fromText = function(id, text) {
          throw new Error('amdefine does not implement load.fromText');
        };
        return load;
      }
      makeRequire = function(systemRequire, exports, module, relId) {
        function amdRequire(deps, callback) {
          if (typeof deps === 'string') {
            return stringRequire(systemRequire, exports, module, deps, relId);
          } else {
            deps = deps.map(function(depName) {
              return stringRequire(systemRequire, exports, module, depName, relId);
            });
            if (callback) {
              process.nextTick(function() {
                callback.apply(null, deps);
              });
            }
          }
        }
        amdRequire.toUrl = function(filePath) {
          if (filePath.indexOf('.') === 0) {
            return normalize(filePath, path.dirname(module.filename));
          } else {
            return filePath;
          }
        };
        return amdRequire;
      };
      requireFn = requireFn || function req() {
        return module.require.apply(module, arguments);
      };
      function runFactory(id, deps, factory) {
        var r,
            e,
            m,
            result;
        if (id) {
          e = loaderCache[id] = {};
          m = {
            id: id,
            uri: __filename,
            exports: e
          };
          r = makeRequire(requireFn, e, m, id);
        } else {
          if (alreadyCalled) {
            throw new Error('amdefine with no module ID cannot be called more than once per file.');
          }
          alreadyCalled = true;
          e = module.exports;
          m = module;
          r = makeRequire(requireFn, e, m, module.id);
        }
        if (deps) {
          deps = deps.map(function(depName) {
            return r(depName);
          });
        }
        if (typeof factory === 'function') {
          result = factory.apply(m.exports, deps);
        } else {
          result = factory;
        }
        if (result !== undefined) {
          m.exports = result;
          if (id) {
            loaderCache[id] = m.exports;
          }
        }
      }
      stringRequire = function(systemRequire, exports, module, id, relId) {
        var index = id.indexOf('!'),
            originalId = id,
            prefix,
            plugin;
        if (index === -1) {
          id = normalize(id, relId);
          if (id === 'require') {
            return makeRequire(systemRequire, exports, module, relId);
          } else if (id === 'exports') {
            return exports;
          } else if (id === 'module') {
            return module;
          } else if (loaderCache.hasOwnProperty(id)) {
            return loaderCache[id];
          } else if (defineCache[id]) {
            runFactory.apply(null, defineCache[id]);
            return loaderCache[id];
          } else {
            if (systemRequire) {
              return systemRequire(originalId);
            } else {
              throw new Error('No module with ID: ' + id);
            }
          }
        } else {
          prefix = id.substring(0, index);
          id = id.substring(index + 1, id.length);
          plugin = stringRequire(systemRequire, exports, module, prefix, relId);
          if (plugin.normalize) {
            id = plugin.normalize(id, makeNormalize(relId));
          } else {
            id = normalize(id, relId);
          }
          if (loaderCache[id]) {
            return loaderCache[id];
          } else {
            plugin.load(id, makeRequire(systemRequire, exports, module, relId), makeLoad(id), {});
            return loaderCache[id];
          }
        }
      };
      function define(id, deps, factory) {
        if (Array.isArray(id)) {
          factory = deps;
          deps = id;
          id = undefined;
        } else if (typeof id !== 'string') {
          factory = id;
          id = deps = undefined;
        }
        if (deps && !Array.isArray(deps)) {
          factory = deps;
          deps = undefined;
        }
        if (!deps) {
          deps = ['require', 'exports', 'module'];
        }
        if (id) {
          defineCache[id] = [id, deps, factory];
        } else {
          runFactory(id, deps, factory);
        }
      }
      define.require = function(id) {
        if (loaderCache[id]) {
          return loaderCache[id];
        }
        if (defineCache[id]) {
          runFactory.apply(null, defineCache[id]);
          return loaderCache[id];
        }
      };
      define.amd = {};
      return define;
    }
    module.exports = amdefine;
  })(require("a"));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("7a", ["4c"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  "format cjs";
  if (typeof define !== 'function') {
    var define = require("4c")(module, require);
  }
  define(function(require, exports, module) {
    var charToIntMap = {};
    var intToCharMap = {};
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('').forEach(function(ch, index) {
      charToIntMap[ch] = index;
      intToCharMap[index] = ch;
    });
    exports.encode = function base64_encode(aNumber) {
      if (aNumber in intToCharMap) {
        return intToCharMap[aNumber];
      }
      throw new TypeError("Must be between 0 and 63: " + aNumber);
    };
    exports.decode = function base64_decode(aChar) {
      if (aChar in charToIntMap) {
        return charToIntMap[aChar];
      }
      throw new TypeError("Not a valid base 64 digit: " + aChar);
    };
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("7c", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function() {
    for (var i = 0; i < arguments.length; i++) {
      if (arguments[i] !== undefined)
        return arguments[i];
    }
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("7b", ["9d", "a"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  (function(process) {
    var Stream = require("9d");
    exports = module.exports = through;
    through.through = through;
    function through(write, end, opts) {
      write = write || function(data) {
        this.queue(data);
      };
      end = end || function() {
        this.queue(null);
      };
      var ended = false,
          destroyed = false,
          buffer = [],
          _ended = false;
      var stream = new Stream();
      stream.readable = stream.writable = true;
      stream.paused = false;
      stream.autoDestroy = !(opts && opts.autoDestroy === false);
      stream.write = function(data) {
        write.call(this, data);
        return !stream.paused;
      };
      function drain() {
        while (buffer.length && !stream.paused) {
          var data = buffer.shift();
          if (null === data)
            return stream.emit('end');
          else
            stream.emit('data', data);
        }
      }
      stream.queue = stream.push = function(data) {
        if (_ended)
          return stream;
        if (data === null)
          _ended = true;
        buffer.push(data);
        drain();
        return stream;
      };
      stream.on('end', function() {
        stream.readable = false;
        if (!stream.writable && stream.autoDestroy)
          process.nextTick(function() {
            stream.destroy();
          });
      });
      function _end() {
        stream.writable = false;
        end.call(stream);
        if (!stream.readable && stream.autoDestroy)
          stream.destroy();
      }
      stream.end = function(data) {
        if (ended)
          return;
        ended = true;
        if (arguments.length)
          stream.write(data);
        _end();
        return stream;
      };
      stream.destroy = function() {
        if (destroyed)
          return;
        destroyed = true;
        ended = true;
        buffer.length = 0;
        stream.writable = stream.readable = false;
        stream.emit('close');
        return stream;
      };
      stream.pause = function() {
        if (stream.paused)
          return;
        stream.paused = true;
        return stream;
      };
      stream.resume = function() {
        if (stream.paused) {
          stream.paused = false;
          stream.emit('resume');
        }
        drain();
        if (!stream.paused)
          stream.emit('drain');
        return stream;
      };
      return stream;
    }
  })(require("a"));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("7e", ["9e"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("9e");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("7d", ["9f"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("9f");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("80", ["a0"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("a0");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("7f", ["a1"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("a1");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("82", ["a2"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("a2");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("81", ["a3"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("a3");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("85", ["a4"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("a4");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("83", ["a5"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("a5");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("88", ["87"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _arity = require("87");
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

$__System.registerDynamic("84", ["a6"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("a6");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("86", ["a7"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("a7");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("89", ["a8", "a9", "aa"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("a8");
  var _curryN = require("a9");
  var arity = require("aa");
  module.exports = _curry2(function curryN(length, fn) {
    return arity(length, _curryN(length, [], fn));
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("87", [], true, function(require, exports, module) {
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

$__System.registerDynamic("8b", [], true, function(require, exports, module) {
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

$__System.registerDynamic("8a", ["ab"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _indexOf = require("ab");
  module.exports = function _contains(a, list) {
    return _indexOf(list, a, 0) >= 0;
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("8d", ["ac", "3d", "ad"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _complement = require("ac");
  var _curry2 = require("3d");
  var filter = require("ad");
  module.exports = _curry2(function reject(fn, list) {
    return filter(_complement(fn), list);
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("8c", [], true, function(require, exports, module) {
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

$__System.registerDynamic("8f", ["78"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var isArrayLike = require("78");
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

$__System.registerDynamic("8e", ["ae", "3d"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _cloneRegExp = require("ae");
  var _curry2 = require("3d");
  module.exports = _curry2(function test(pattern, str) {
    return _cloneRegExp(pattern).test(str);
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("91", ["90", "af"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var __ = require("90");
  var _curry1 = require("af");
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

$__System.registerDynamic("92", [], true, function(require, exports, module) {
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

$__System.registerDynamic("93", ["91"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("91");
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

$__System.registerDynamic("90", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = {ramda: 'placeholder'};
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("96", ["3d", "b0", "6e"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("3d");
  var _reduced = require("b0");
  var _xfBase = require("6e");
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

$__System.registerDynamic("94", ["b1", "48", "6e", "78"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _forceReduced = require("b1");
  var _reduce = require("48");
  var _xfBase = require("6e");
  var isArrayLike = require("78");
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

$__System.registerDynamic("97", ["b2", "b3"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  require("b2");
  var Iterators = require("b3");
  Iterators.NodeList = Iterators.HTMLCollection = Iterators.Array;
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("95", ["3d", "13", "12"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("3d");
  var map = require("13");
  var prop = require("12");
  module.exports = _curry2(function pluck(p, list) {
    return map(prop(p), list);
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("98", ["b4", "b5"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var $at = require("b4")(true);
  require("b5")(String, 'String', function(iterated) {
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

$__System.registerDynamic("9a", ["b6", "b7", "b8"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var anObject = require("b6"),
      get = require("b7");
  module.exports = require("b8").getIterator = function(it) {
    var iterFn = get(it);
    if (typeof iterFn != 'function')
      throw TypeError(it + ' is not iterable!');
    return anObject(iterFn.call(it));
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("99", ["b9", "ba", "b3", "b8"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var classof = require("b9"),
      ITERATOR = require("ba")('iterator'),
      Iterators = require("b3");
  module.exports = require("b8").isIterable = function(it) {
    var O = Object(it);
    return ITERATOR in O || '@@iterator' in O || Iterators.hasOwnProperty(classof(O));
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("9c", ["9b", "47"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _checkForMethod = require("9b");
  var _curry3 = require("47");
  module.exports = _curry3(_checkForMethod('slice', function slice(fromIndex, toIndex, list) {
    return Array.prototype.slice.call(list, fromIndex, toIndex);
  }));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("9b", ["6c", "66"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _isArray = require("6c");
  var _slice = require("66");
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

$__System.registerDynamic("9f", ["bb", "bc"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var pSlice = Array.prototype.slice;
  var objectKeys = require("bb");
  var isArguments = require("bc");
  var deepEqual = module.exports = function(actual, expected, opts) {
    if (!opts)
      opts = {};
    if (actual === expected) {
      return true;
    } else if (actual instanceof Date && expected instanceof Date) {
      return actual.getTime() === expected.getTime();
    } else if (!actual || !expected || typeof actual != 'object' && typeof expected != 'object') {
      return opts.strict ? actual === expected : actual == expected;
    } else {
      return objEquiv(actual, expected, opts);
    }
  };
  function isUndefinedOrNull(value) {
    return value === null || value === undefined;
  }
  function isBuffer(x) {
    if (!x || typeof x !== 'object' || typeof x.length !== 'number')
      return false;
    if (typeof x.copy !== 'function' || typeof x.slice !== 'function') {
      return false;
    }
    if (x.length > 0 && typeof x[0] !== 'number')
      return false;
    return true;
  }
  function objEquiv(a, b, opts) {
    var i,
        key;
    if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
      return false;
    if (a.prototype !== b.prototype)
      return false;
    if (isArguments(a)) {
      if (!isArguments(b)) {
        return false;
      }
      a = pSlice.call(a);
      b = pSlice.call(b);
      return deepEqual(a, b, opts);
    }
    if (isBuffer(a)) {
      if (!isBuffer(b)) {
        return false;
      }
      if (a.length !== b.length)
        return false;
      for (i = 0; i < a.length; i++) {
        if (a[i] !== b[i])
          return false;
      }
      return true;
    }
    try {
      var ka = objectKeys(a),
          kb = objectKeys(b);
    } catch (e) {
      return false;
    }
    if (ka.length != kb.length)
      return false;
    ka.sort();
    kb.sort();
    for (i = ka.length - 1; i >= 0; i--) {
      if (ka[i] != kb[i])
        return false;
    }
    for (i = ka.length - 1; i >= 0; i--) {
      key = ka[i];
      if (!deepEqual(a[key], b[key], opts))
        return false;
    }
    return typeof a === typeof b;
  }
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("9e", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  if (typeof Object.create === 'function') {
    module.exports = function inherits(ctor, superCtor) {
      ctor.super_ = superCtor;
      ctor.prototype = Object.create(superCtor.prototype, {constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }});
    };
  } else {
    module.exports = function inherits(ctor, superCtor) {
      ctor.super_ = superCtor;
      var TempCtor = function() {};
      TempCtor.prototype = superCtor.prototype;
      ctor.prototype = new TempCtor();
      ctor.prototype.constructor = ctor;
    };
  }
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("9d", ["bd"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("bd");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("a0", ["86"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var bind = require("86");
  module.exports = bind.call(Function.call, Object.prototype.hasOwnProperty);
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("a1", ["be"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = $__System._nodeRequire ? $__System._nodeRequire('events') : require("be");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("a2", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  exports.read = function(buffer, offset, isLE, mLen, nBytes) {
    var e,
        m;
    var eLen = nBytes * 8 - mLen - 1;
    var eMax = (1 << eLen) - 1;
    var eBias = eMax >> 1;
    var nBits = -7;
    var i = isLE ? (nBytes - 1) : 0;
    var d = isLE ? -1 : 1;
    var s = buffer[offset + i];
    i += d;
    e = s & ((1 << (-nBits)) - 1);
    s >>= (-nBits);
    nBits += eLen;
    for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}
    m = e & ((1 << (-nBits)) - 1);
    e >>= (-nBits);
    nBits += mLen;
    for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}
    if (e === 0) {
      e = 1 - eBias;
    } else if (e === eMax) {
      return m ? NaN : ((s ? -1 : 1) * Infinity);
    } else {
      m = m + Math.pow(2, mLen);
      e = e - eBias;
    }
    return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
  };
  exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
    var e,
        m,
        c;
    var eLen = nBytes * 8 - mLen - 1;
    var eMax = (1 << eLen) - 1;
    var eBias = eMax >> 1;
    var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0);
    var i = isLE ? 0 : (nBytes - 1);
    var d = isLE ? 1 : -1;
    var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;
    value = Math.abs(value);
    if (isNaN(value) || value === Infinity) {
      m = isNaN(value) ? 1 : 0;
      e = eMax;
    } else {
      e = Math.floor(Math.log(value) / Math.LN2);
      if (value * (c = Math.pow(2, -e)) < 1) {
        e--;
        c *= 2;
      }
      if (e + eBias >= 1) {
        value += rt / c;
      } else {
        value += rt * Math.pow(2, 1 - eBias);
      }
      if (value * c >= 2) {
        e++;
        c /= 2;
      }
      if (e + eBias >= eMax) {
        m = 0;
        e = eMax;
      } else if (e + eBias >= 1) {
        m = (value * c - 1) * Math.pow(2, mLen);
        e = e + eBias;
      } else {
        m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
        e = 0;
      }
    }
    for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}
    e = (e << mLen) | m;
    eLen += mLen;
    for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}
    buffer[offset + i - d] |= s * 128;
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("a3", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  ;
  (function(exports) {
    'use strict';
    var Arr = (typeof Uint8Array !== 'undefined') ? Uint8Array : Array;
    var PLUS = '+'.charCodeAt(0);
    var SLASH = '/'.charCodeAt(0);
    var NUMBER = '0'.charCodeAt(0);
    var LOWER = 'a'.charCodeAt(0);
    var UPPER = 'A'.charCodeAt(0);
    var PLUS_URL_SAFE = '-'.charCodeAt(0);
    var SLASH_URL_SAFE = '_'.charCodeAt(0);
    function decode(elt) {
      var code = elt.charCodeAt(0);
      if (code === PLUS || code === PLUS_URL_SAFE)
        return 62;
      if (code === SLASH || code === SLASH_URL_SAFE)
        return 63;
      if (code < NUMBER)
        return -1;
      if (code < NUMBER + 10)
        return code - NUMBER + 26 + 26;
      if (code < UPPER + 26)
        return code - UPPER;
      if (code < LOWER + 26)
        return code - LOWER + 26;
    }
    function b64ToByteArray(b64) {
      var i,
          j,
          l,
          tmp,
          placeHolders,
          arr;
      if (b64.length % 4 > 0) {
        throw new Error('Invalid string. Length must be a multiple of 4');
      }
      var len = b64.length;
      placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0;
      arr = new Arr(b64.length * 3 / 4 - placeHolders);
      l = placeHolders > 0 ? b64.length - 4 : b64.length;
      var L = 0;
      function push(v) {
        arr[L++] = v;
      }
      for (i = 0, j = 0; i < l; i += 4, j += 3) {
        tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3));
        push((tmp & 0xFF0000) >> 16);
        push((tmp & 0xFF00) >> 8);
        push(tmp & 0xFF);
      }
      if (placeHolders === 2) {
        tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4);
        push(tmp & 0xFF);
      } else if (placeHolders === 1) {
        tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2);
        push((tmp >> 8) & 0xFF);
        push(tmp & 0xFF);
      }
      return arr;
    }
    function uint8ToBase64(uint8) {
      var i,
          extraBytes = uint8.length % 3,
          output = "",
          temp,
          length;
      function encode(num) {
        return lookup.charAt(num);
      }
      function tripletToBase64(num) {
        return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F);
      }
      for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
        temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
        output += tripletToBase64(temp);
      }
      switch (extraBytes) {
        case 1:
          temp = uint8[uint8.length - 1];
          output += encode(temp >> 2);
          output += encode((temp << 4) & 0x3F);
          output += '==';
          break;
        case 2:
          temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1]);
          output += encode(temp >> 10);
          output += encode((temp >> 4) & 0x3F);
          output += encode((temp << 2) & 0x3F);
          output += '=';
          break;
      }
      return output;
    }
    exports.toByteArray = b64ToByteArray;
    exports.fromByteArray = uint8ToBase64;
  }(typeof exports === 'undefined' ? (this.base64js = {}) : exports));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("a4", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function inspect_(obj, opts, depth, seen) {
    if (!opts)
      opts = {};
    var maxDepth = opts.depth === undefined ? 5 : opts.depth;
    if (depth === undefined)
      depth = 0;
    if (depth >= maxDepth && maxDepth > 0 && obj && typeof obj === 'object') {
      return '[Object]';
    }
    if (seen === undefined)
      seen = [];
    else if (indexOf(seen, obj) >= 0) {
      return '[Circular]';
    }
    function inspect(value, from) {
      if (from) {
        seen = seen.slice();
        seen.push(from);
      }
      return inspect_(value, opts, depth + 1, seen);
    }
    if (typeof obj === 'string') {
      return inspectString(obj);
    } else if (typeof obj === 'function') {
      var name = nameOf(obj);
      return '[Function' + (name ? ': ' + name : '') + ']';
    } else if (obj === null) {
      return 'null';
    } else if (isSymbol(obj)) {
      var symString = Symbol.prototype.toString.call(obj);
      return typeof obj === 'object' ? 'Object(' + symString + ')' : symString;
    } else if (isElement(obj)) {
      var s = '<' + String(obj.nodeName).toLowerCase();
      var attrs = obj.attributes || [];
      for (var i = 0; i < attrs.length; i++) {
        s += ' ' + attrs[i].name + '="' + quote(attrs[i].value) + '"';
      }
      s += '>';
      if (obj.childNodes && obj.childNodes.length)
        s += '...';
      s += '</' + String(obj.nodeName).toLowerCase() + '>';
      return s;
    } else if (isArray(obj)) {
      if (obj.length === 0)
        return '[]';
      var xs = Array(obj.length);
      for (var i = 0; i < obj.length; i++) {
        xs[i] = has(obj, i) ? inspect(obj[i], obj) : '';
      }
      return '[ ' + xs.join(', ') + ' ]';
    } else if (isError(obj)) {
      var parts = [];
      for (var key in obj) {
        if (!has(obj, key))
          continue;
        if (/[^\w$]/.test(key)) {
          parts.push(inspect(key) + ': ' + inspect(obj[key]));
        } else {
          parts.push(key + ': ' + inspect(obj[key]));
        }
      }
      if (parts.length === 0)
        return '[' + obj + ']';
      return '{ [' + obj + '] ' + parts.join(', ') + ' }';
    } else if (typeof obj === 'object' && typeof obj.inspect === 'function') {
      return obj.inspect();
    } else if (typeof obj === 'object' && !isDate(obj) && !isRegExp(obj)) {
      var xs = [],
          keys = [];
      for (var key in obj) {
        if (has(obj, key))
          keys.push(key);
      }
      keys.sort();
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (/[^\w$]/.test(key)) {
          xs.push(inspect(key) + ': ' + inspect(obj[key], obj));
        } else
          xs.push(key + ': ' + inspect(obj[key], obj));
      }
      if (xs.length === 0)
        return '{}';
      return '{ ' + xs.join(', ') + ' }';
    } else
      return String(obj);
  };
  function quote(s) {
    return String(s).replace(/"/g, '&quot;');
  }
  function isArray(obj) {
    return toStr(obj) === '[object Array]';
  }
  function isDate(obj) {
    return toStr(obj) === '[object Date]';
  }
  function isRegExp(obj) {
    return toStr(obj) === '[object RegExp]';
  }
  function isError(obj) {
    return toStr(obj) === '[object Error]';
  }
  function isSymbol(obj) {
    return toStr(obj) === '[object Symbol]';
  }
  var hasOwn = Object.prototype.hasOwnProperty || function(key) {
    return key in this;
  };
  function has(obj, key) {
    return hasOwn.call(obj, key);
  }
  function toStr(obj) {
    return Object.prototype.toString.call(obj);
  }
  function nameOf(f) {
    if (f.name)
      return f.name;
    var m = f.toString().match(/^function\s*([\w$]+)/);
    if (m)
      return m[1];
  }
  function indexOf(xs, x) {
    if (xs.indexOf)
      return xs.indexOf(x);
    for (var i = 0,
        l = xs.length; i < l; i++) {
      if (xs[i] === x)
        return i;
    }
    return -1;
  }
  function isElement(x) {
    if (!x || typeof x !== 'object')
      return false;
    if (typeof HTMLElement !== 'undefined' && x instanceof HTMLElement) {
      return true;
    }
    return typeof x.nodeName === 'string' && typeof x.getAttribute === 'function';
    ;
  }
  function inspectString(str) {
    var s = str.replace(/(['\\])/g, '\\$1').replace(/[\x00-\x1f]/g, lowbyte);
    return "'" + s + "'";
    function lowbyte(c) {
      var n = c.charCodeAt(0);
      var x = {
        8: 'b',
        9: 't',
        10: 'n',
        12: 'f',
        13: 'r'
      }[n];
      if (x)
        return '\\' + x;
      return '\\x' + (n < 0x10 ? '0' : '') + n.toString(16);
    }
  }
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("a5", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var isArray = Array.isArray;
  var str = Object.prototype.toString;
  module.exports = isArray || function(val) {
    return !!val && '[object Array]' == str.call(val);
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("a6", ["54", "a"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  (function(process) {
    var through = require("54");
    var nextTick = typeof setImmediate !== 'undefined' ? setImmediate : process.nextTick;
    ;
    module.exports = function(write, end) {
      var tr = through(write, end);
      tr.pause();
      var resume = tr.resume;
      var pause = tr.pause;
      var paused = false;
      tr.pause = function() {
        paused = true;
        return pause.apply(this, arguments);
      };
      tr.resume = function() {
        paused = false;
        return resume.apply(this, arguments);
      };
      nextTick(function() {
        if (!paused)
          tr.resume();
      });
      return tr;
    };
  })(require("a"));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("a7", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
  var slice = Array.prototype.slice;
  var toStr = Object.prototype.toString;
  var funcType = '[object Function]';
  module.exports = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr.call(target) !== funcType) {
      throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slice.call(arguments, 1);
    var binder = function() {
      if (this instanceof bound) {
        var result = target.apply(this, args.concat(slice.call(arguments)));
        if (Object(result) === result) {
          return result;
        }
        return this;
      } else {
        return target.apply(that, args.concat(slice.call(arguments)));
      }
    };
    var boundLength = Math.max(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
      boundArgs.push('$' + i);
    }
    var bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);
    if (target.prototype) {
      var Empty = function Empty() {};
      Empty.prototype = target.prototype;
      bound.prototype = new Empty();
      Empty.prototype = null;
    }
    return bound;
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("a8", ["bf"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry1 = require("bf");
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

$__System.registerDynamic("a9", ["aa"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var arity = require("aa");
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

$__System.registerDynamic("aa", ["a8"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("a8");
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

$__System.registerDynamic("ab", ["1b"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var equals = require("1b");
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

$__System.registerDynamic("ac", [], true, function(require, exports, module) {
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

$__System.registerDynamic("ad", ["3d", "40", "c0", "c1"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("3d");
  var _dispatchable = require("40");
  var _filter = require("c0");
  var _xfilter = require("c1");
  module.exports = _curry2(_dispatchable('filter', _xfilter, _filter));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("ae", [], true, function(require, exports, module) {
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

$__System.registerDynamic("af", ["90"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var __ = require("90");
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

$__System.registerDynamic("b0", [], true, function(require, exports, module) {
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

$__System.registerDynamic("b1", [], true, function(require, exports, module) {
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

$__System.registerDynamic("b2", ["c2", "c3", "b3", "c4", "b5"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var setUnscope = require("c2"),
      step = require("c3"),
      Iterators = require("b3"),
      toIObject = require("c4");
  require("b5")(Array, 'Array', function(iterated, kind) {
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

$__System.registerDynamic("b3", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = {};
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("b5", ["c5", "c6", "c7", "c8", "c9", "ba", "b3", "ca", "cb", "cc", "cd"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var LIBRARY = require("c5"),
      $def = require("c6"),
      $redef = require("c7"),
      hide = require("c8"),
      has = require("c9"),
      SYMBOL_ITERATOR = require("ba")('iterator'),
      Iterators = require("b3"),
      FF_ITERATOR = '@@iterator',
      KEYS = 'keys',
      VALUES = 'values';
  var returnThis = function() {
    return this;
  };
  module.exports = function(Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCE) {
    require("ca")(Constructor, NAME, next);
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
      var IteratorPrototype = require("cb").getProto(_default.call(new Base));
      require("cc")(IteratorPrototype, TAG, true);
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
        $def($def.P + $def.F * require("cd"), NAME, methods);
    }
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("b4", ["ce", "cf"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var toInteger = require("ce"),
      defined = require("cf");
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

$__System.registerDynamic("b6", ["d0"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var isObject = require("d0");
  module.exports = function(it) {
    if (!isObject(it))
      throw TypeError(it + ' is not an object!');
    return it;
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("b7", ["b9", "ba", "b3", "b8"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var classof = require("b9"),
      ITERATOR = require("ba")('iterator'),
      Iterators = require("b3");
  module.exports = require("b8").getIteratorMethod = function(it) {
    if (it != undefined)
      return it[ITERATOR] || it['@@iterator'] || Iterators[classof(it)];
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("b8", [], true, function(require, exports, module) {
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

$__System.registerDynamic("ba", ["d1", "d2", "d3"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var store = require("d1")('wks'),
      Symbol = require("d2").Symbol;
  module.exports = function(name) {
    return store[name] || (store[name] = Symbol && Symbol[name] || (Symbol || require("d3"))('Symbol.' + name));
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("b9", ["d4", "ba"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var cof = require("d4"),
      TAG = require("ba")('toStringTag'),
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

$__System.registerDynamic("bb", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  exports = module.exports = typeof Object.keys === 'function' ? Object.keys : shim;
  exports.shim = shim;
  function shim(obj) {
    var keys = [];
    for (var key in obj)
      keys.push(key);
    return keys;
  }
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("bc", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var supportsArgumentsClass = (function() {
    return Object.prototype.toString.call(arguments);
  })() == '[object Arguments]';
  exports = module.exports = supportsArgumentsClass ? supported : unsupported;
  exports.supported = supported;
  function supported(object) {
    return Object.prototype.toString.call(object) == '[object Arguments]';
  }
  ;
  exports.unsupported = unsupported;
  function unsupported(object) {
    return object && typeof object == 'object' && typeof object.length == 'number' && Object.prototype.hasOwnProperty.call(object, 'callee') && !Object.prototype.propertyIsEnumerable.call(object, 'callee') || false;
  }
  ;
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("bd", ["d5"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = $__System._nodeRequire ? $__System._nodeRequire('stream') : require("d5");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("be", ["d6"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("d6");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("c0", [], true, function(require, exports, module) {
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

$__System.registerDynamic("bf", [], true, function(require, exports, module) {
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

$__System.registerDynamic("c2", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = function() {};
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("c1", ["3d", "6e"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var _curry2 = require("3d");
  var _xfBase = require("6e");
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

$__System.registerDynamic("c4", ["d7", "cf"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var IObject = require("d7"),
      defined = require("cf");
  module.exports = function(it) {
    return IObject(defined(it));
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("c3", [], true, function(require, exports, module) {
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

$__System.registerDynamic("c5", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = true;
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("c7", ["c8"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("c8");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("c6", ["d2", "b8"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var global = require("d2"),
      core = require("b8"),
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

$__System.registerDynamic("c9", [], true, function(require, exports, module) {
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

$__System.registerDynamic("c8", ["cb", "d8", "d9"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var $ = require("cb"),
      createDesc = require("d8");
  module.exports = require("d9") ? function(object, key, value) {
    return $.setDesc(object, key, createDesc(1, value));
  } : function(object, key, value) {
    object[key] = value;
    return object;
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("cb", [], true, function(require, exports, module) {
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

$__System.registerDynamic("ca", ["cb", "c8", "ba", "d8", "cc"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  'use strict';
  var $ = require("cb"),
      IteratorPrototype = {};
  require("c8")(IteratorPrototype, require("ba")('iterator'), function() {
    return this;
  });
  module.exports = function(Constructor, NAME, next) {
    Constructor.prototype = $.create(IteratorPrototype, {next: require("d8")(1, next)});
    require("cc")(Constructor, NAME + ' Iterator');
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("cd", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = 'keys' in [] && !('next' in [].keys());
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("cc", ["c9", "c8", "ba"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var has = require("c9"),
      hide = require("c8"),
      TAG = require("ba")('toStringTag');
  module.exports = function(it, tag, stat) {
    if (it && !has(it = stat ? it : it.prototype, TAG))
      hide(it, TAG, tag);
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("ce", [], true, function(require, exports, module) {
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

$__System.registerDynamic("cf", [], true, function(require, exports, module) {
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

$__System.registerDynamic("d1", ["d2"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var global = require("d2"),
      SHARED = '__core-js_shared__',
      store = global[SHARED] || (global[SHARED] = {});
  module.exports = function(key) {
    return store[key] || (store[key] = {});
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("d0", [], true, function(require, exports, module) {
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

$__System.registerDynamic("d2", [], true, function(require, exports, module) {
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

$__System.registerDynamic("d3", [], true, function(require, exports, module) {
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

$__System.registerDynamic("d4", [], true, function(require, exports, module) {
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

$__System.registerDynamic("d5", ["da"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("da");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("d7", ["d4"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var cof = require("d4");
  module.exports = 0 in Object('z') ? Object : function(it) {
    return cof(it) == 'String' ? it.split('') : Object(it);
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("d6", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  function EventEmitter() {
    this._events = this._events || {};
    this._maxListeners = this._maxListeners || undefined;
  }
  module.exports = EventEmitter;
  EventEmitter.EventEmitter = EventEmitter;
  EventEmitter.prototype._events = undefined;
  EventEmitter.prototype._maxListeners = undefined;
  EventEmitter.defaultMaxListeners = 10;
  EventEmitter.prototype.setMaxListeners = function(n) {
    if (!isNumber(n) || n < 0 || isNaN(n))
      throw TypeError('n must be a positive number');
    this._maxListeners = n;
    return this;
  };
  EventEmitter.prototype.emit = function(type) {
    var er,
        handler,
        len,
        args,
        i,
        listeners;
    if (!this._events)
      this._events = {};
    if (type === 'error') {
      if (!this._events.error || (isObject(this._events.error) && !this._events.error.length)) {
        er = arguments[1];
        if (er instanceof Error) {
          throw er;
        }
        throw TypeError('Uncaught, unspecified "error" event.');
      }
    }
    handler = this._events[type];
    if (isUndefined(handler))
      return false;
    if (isFunction(handler)) {
      switch (arguments.length) {
        case 1:
          handler.call(this);
          break;
        case 2:
          handler.call(this, arguments[1]);
          break;
        case 3:
          handler.call(this, arguments[1], arguments[2]);
          break;
        default:
          len = arguments.length;
          args = new Array(len - 1);
          for (i = 1; i < len; i++)
            args[i - 1] = arguments[i];
          handler.apply(this, args);
      }
    } else if (isObject(handler)) {
      len = arguments.length;
      args = new Array(len - 1);
      for (i = 1; i < len; i++)
        args[i - 1] = arguments[i];
      listeners = handler.slice();
      len = listeners.length;
      for (i = 0; i < len; i++)
        listeners[i].apply(this, args);
    }
    return true;
  };
  EventEmitter.prototype.addListener = function(type, listener) {
    var m;
    if (!isFunction(listener))
      throw TypeError('listener must be a function');
    if (!this._events)
      this._events = {};
    if (this._events.newListener)
      this.emit('newListener', type, isFunction(listener.listener) ? listener.listener : listener);
    if (!this._events[type])
      this._events[type] = listener;
    else if (isObject(this._events[type]))
      this._events[type].push(listener);
    else
      this._events[type] = [this._events[type], listener];
    if (isObject(this._events[type]) && !this._events[type].warned) {
      var m;
      if (!isUndefined(this._maxListeners)) {
        m = this._maxListeners;
      } else {
        m = EventEmitter.defaultMaxListeners;
      }
      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' + 'leak detected. %d listeners added. ' + 'Use emitter.setMaxListeners() to increase limit.', this._events[type].length);
        if (typeof console.trace === 'function') {
          console.trace();
        }
      }
    }
    return this;
  };
  EventEmitter.prototype.on = EventEmitter.prototype.addListener;
  EventEmitter.prototype.once = function(type, listener) {
    if (!isFunction(listener))
      throw TypeError('listener must be a function');
    var fired = false;
    function g() {
      this.removeListener(type, g);
      if (!fired) {
        fired = true;
        listener.apply(this, arguments);
      }
    }
    g.listener = listener;
    this.on(type, g);
    return this;
  };
  EventEmitter.prototype.removeListener = function(type, listener) {
    var list,
        position,
        length,
        i;
    if (!isFunction(listener))
      throw TypeError('listener must be a function');
    if (!this._events || !this._events[type])
      return this;
    list = this._events[type];
    length = list.length;
    position = -1;
    if (list === listener || (isFunction(list.listener) && list.listener === listener)) {
      delete this._events[type];
      if (this._events.removeListener)
        this.emit('removeListener', type, listener);
    } else if (isObject(list)) {
      for (i = length; i-- > 0; ) {
        if (list[i] === listener || (list[i].listener && list[i].listener === listener)) {
          position = i;
          break;
        }
      }
      if (position < 0)
        return this;
      if (list.length === 1) {
        list.length = 0;
        delete this._events[type];
      } else {
        list.splice(position, 1);
      }
      if (this._events.removeListener)
        this.emit('removeListener', type, listener);
    }
    return this;
  };
  EventEmitter.prototype.removeAllListeners = function(type) {
    var key,
        listeners;
    if (!this._events)
      return this;
    if (!this._events.removeListener) {
      if (arguments.length === 0)
        this._events = {};
      else if (this._events[type])
        delete this._events[type];
      return this;
    }
    if (arguments.length === 0) {
      for (key in this._events) {
        if (key === 'removeListener')
          continue;
        this.removeAllListeners(key);
      }
      this.removeAllListeners('removeListener');
      this._events = {};
      return this;
    }
    listeners = this._events[type];
    if (isFunction(listeners)) {
      this.removeListener(type, listeners);
    } else {
      while (listeners.length)
        this.removeListener(type, listeners[listeners.length - 1]);
    }
    delete this._events[type];
    return this;
  };
  EventEmitter.prototype.listeners = function(type) {
    var ret;
    if (!this._events || !this._events[type])
      ret = [];
    else if (isFunction(this._events[type]))
      ret = [this._events[type]];
    else
      ret = this._events[type].slice();
    return ret;
  };
  EventEmitter.listenerCount = function(emitter, type) {
    var ret;
    if (!emitter._events || !emitter._events[type])
      ret = 0;
    else if (isFunction(emitter._events[type]))
      ret = 1;
    else
      ret = emitter._events[type].length;
    return ret;
  };
  function isFunction(arg) {
    return typeof arg === 'function';
  }
  function isNumber(arg) {
    return typeof arg === 'number';
  }
  function isObject(arg) {
    return typeof arg === 'object' && arg !== null;
  }
  function isUndefined(arg) {
    return arg === void 0;
  }
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("d8", [], true, function(require, exports, module) {
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

$__System.registerDynamic("d9", ["db"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = !require("db")(function() {
    return Object.defineProperty({}, 'a', {get: function() {
        return 7;
      }}).a != 7;
  });
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("da", ["7f", "7e", "dc", "dd", "de", "df", "e0"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = Stream;
  var EE = require("7f").EventEmitter;
  var inherits = require("7e");
  inherits(Stream, EE);
  Stream.Readable = require("dc");
  Stream.Writable = require("dd");
  Stream.Duplex = require("de");
  Stream.Transform = require("df");
  Stream.PassThrough = require("e0");
  Stream.Stream = Stream;
  function Stream() {
    EE.call(this);
  }
  Stream.prototype.pipe = function(dest, options) {
    var source = this;
    function ondata(chunk) {
      if (dest.writable) {
        if (false === dest.write(chunk) && source.pause) {
          source.pause();
        }
      }
    }
    source.on('data', ondata);
    function ondrain() {
      if (source.readable && source.resume) {
        source.resume();
      }
    }
    dest.on('drain', ondrain);
    if (!dest._isStdio && (!options || options.end !== false)) {
      source.on('end', onend);
      source.on('close', onclose);
    }
    var didOnEnd = false;
    function onend() {
      if (didOnEnd)
        return;
      didOnEnd = true;
      dest.end();
    }
    function onclose() {
      if (didOnEnd)
        return;
      didOnEnd = true;
      if (typeof dest.destroy === 'function')
        dest.destroy();
    }
    function onerror(er) {
      cleanup();
      if (EE.listenerCount(this, 'error') === 0) {
        throw er;
      }
    }
    source.on('error', onerror);
    dest.on('error', onerror);
    function cleanup() {
      source.removeListener('data', ondata);
      dest.removeListener('drain', ondrain);
      source.removeListener('end', onend);
      source.removeListener('close', onclose);
      source.removeListener('error', onerror);
      dest.removeListener('error', onerror);
      source.removeListener('end', cleanup);
      source.removeListener('close', cleanup);
      dest.removeListener('close', cleanup);
    }
    source.on('end', cleanup);
    source.on('close', cleanup);
    dest.on('close', cleanup);
    dest.emit('pipe', source);
    return dest;
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("db", [], true, function(require, exports, module) {
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

$__System.registerDynamic("dc", ["e1", "da", "e2", "e3", "e4", "e5"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  exports = module.exports = require("e1");
  exports.Stream = require("da");
  exports.Readable = exports;
  exports.Writable = require("e2");
  exports.Duplex = require("e3");
  exports.Transform = require("e4");
  exports.PassThrough = require("e5");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("de", ["e3"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("e3");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("dd", ["e2"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("e2");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("df", ["e4"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("e4");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("e0", ["e5"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("e5");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("e2", ["9", "e6", "7e", "da", "e3", "e3", "9", "a"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  (function(Buffer, process) {
    module.exports = Writable;
    var Buffer = require("9").Buffer;
    Writable.WritableState = WritableState;
    var util = require("e6");
    util.inherits = require("7e");
    var Stream = require("da");
    util.inherits(Writable, Stream);
    function WriteReq(chunk, encoding, cb) {
      this.chunk = chunk;
      this.encoding = encoding;
      this.callback = cb;
    }
    function WritableState(options, stream) {
      var Duplex = require("e3");
      options = options || {};
      var hwm = options.highWaterMark;
      var defaultHwm = options.objectMode ? 16 : 16 * 1024;
      this.highWaterMark = (hwm || hwm === 0) ? hwm : defaultHwm;
      this.objectMode = !!options.objectMode;
      if (stream instanceof Duplex)
        this.objectMode = this.objectMode || !!options.writableObjectMode;
      this.highWaterMark = ~~this.highWaterMark;
      this.needDrain = false;
      this.ending = false;
      this.ended = false;
      this.finished = false;
      var noDecode = options.decodeStrings === false;
      this.decodeStrings = !noDecode;
      this.defaultEncoding = options.defaultEncoding || 'utf8';
      this.length = 0;
      this.writing = false;
      this.corked = 0;
      this.sync = true;
      this.bufferProcessing = false;
      this.onwrite = function(er) {
        onwrite(stream, er);
      };
      this.writecb = null;
      this.writelen = 0;
      this.buffer = [];
      this.pendingcb = 0;
      this.prefinished = false;
      this.errorEmitted = false;
    }
    function Writable(options) {
      var Duplex = require("e3");
      if (!(this instanceof Writable) && !(this instanceof Duplex))
        return new Writable(options);
      this._writableState = new WritableState(options, this);
      this.writable = true;
      Stream.call(this);
    }
    Writable.prototype.pipe = function() {
      this.emit('error', new Error('Cannot pipe. Not readable.'));
    };
    function writeAfterEnd(stream, state, cb) {
      var er = new Error('write after end');
      stream.emit('error', er);
      process.nextTick(function() {
        cb(er);
      });
    }
    function validChunk(stream, state, chunk, cb) {
      var valid = true;
      if (!util.isBuffer(chunk) && !util.isString(chunk) && !util.isNullOrUndefined(chunk) && !state.objectMode) {
        var er = new TypeError('Invalid non-string/buffer chunk');
        stream.emit('error', er);
        process.nextTick(function() {
          cb(er);
        });
        valid = false;
      }
      return valid;
    }
    Writable.prototype.write = function(chunk, encoding, cb) {
      var state = this._writableState;
      var ret = false;
      if (util.isFunction(encoding)) {
        cb = encoding;
        encoding = null;
      }
      if (util.isBuffer(chunk))
        encoding = 'buffer';
      else if (!encoding)
        encoding = state.defaultEncoding;
      if (!util.isFunction(cb))
        cb = function() {};
      if (state.ended)
        writeAfterEnd(this, state, cb);
      else if (validChunk(this, state, chunk, cb)) {
        state.pendingcb++;
        ret = writeOrBuffer(this, state, chunk, encoding, cb);
      }
      return ret;
    };
    Writable.prototype.cork = function() {
      var state = this._writableState;
      state.corked++;
    };
    Writable.prototype.uncork = function() {
      var state = this._writableState;
      if (state.corked) {
        state.corked--;
        if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.buffer.length)
          clearBuffer(this, state);
      }
    };
    function decodeChunk(state, chunk, encoding) {
      if (!state.objectMode && state.decodeStrings !== false && util.isString(chunk)) {
        chunk = new Buffer(chunk, encoding);
      }
      return chunk;
    }
    function writeOrBuffer(stream, state, chunk, encoding, cb) {
      chunk = decodeChunk(state, chunk, encoding);
      if (util.isBuffer(chunk))
        encoding = 'buffer';
      var len = state.objectMode ? 1 : chunk.length;
      state.length += len;
      var ret = state.length < state.highWaterMark;
      if (!ret)
        state.needDrain = true;
      if (state.writing || state.corked)
        state.buffer.push(new WriteReq(chunk, encoding, cb));
      else
        doWrite(stream, state, false, len, chunk, encoding, cb);
      return ret;
    }
    function doWrite(stream, state, writev, len, chunk, encoding, cb) {
      state.writelen = len;
      state.writecb = cb;
      state.writing = true;
      state.sync = true;
      if (writev)
        stream._writev(chunk, state.onwrite);
      else
        stream._write(chunk, encoding, state.onwrite);
      state.sync = false;
    }
    function onwriteError(stream, state, sync, er, cb) {
      if (sync)
        process.nextTick(function() {
          state.pendingcb--;
          cb(er);
        });
      else {
        state.pendingcb--;
        cb(er);
      }
      stream._writableState.errorEmitted = true;
      stream.emit('error', er);
    }
    function onwriteStateUpdate(state) {
      state.writing = false;
      state.writecb = null;
      state.length -= state.writelen;
      state.writelen = 0;
    }
    function onwrite(stream, er) {
      var state = stream._writableState;
      var sync = state.sync;
      var cb = state.writecb;
      onwriteStateUpdate(state);
      if (er)
        onwriteError(stream, state, sync, er, cb);
      else {
        var finished = needFinish(stream, state);
        if (!finished && !state.corked && !state.bufferProcessing && state.buffer.length) {
          clearBuffer(stream, state);
        }
        if (sync) {
          process.nextTick(function() {
            afterWrite(stream, state, finished, cb);
          });
        } else {
          afterWrite(stream, state, finished, cb);
        }
      }
    }
    function afterWrite(stream, state, finished, cb) {
      if (!finished)
        onwriteDrain(stream, state);
      state.pendingcb--;
      cb();
      finishMaybe(stream, state);
    }
    function onwriteDrain(stream, state) {
      if (state.length === 0 && state.needDrain) {
        state.needDrain = false;
        stream.emit('drain');
      }
    }
    function clearBuffer(stream, state) {
      state.bufferProcessing = true;
      if (stream._writev && state.buffer.length > 1) {
        var cbs = [];
        for (var c = 0; c < state.buffer.length; c++)
          cbs.push(state.buffer[c].callback);
        state.pendingcb++;
        doWrite(stream, state, true, state.length, state.buffer, '', function(err) {
          for (var i = 0; i < cbs.length; i++) {
            state.pendingcb--;
            cbs[i](err);
          }
        });
        state.buffer = [];
      } else {
        for (var c = 0; c < state.buffer.length; c++) {
          var entry = state.buffer[c];
          var chunk = entry.chunk;
          var encoding = entry.encoding;
          var cb = entry.callback;
          var len = state.objectMode ? 1 : chunk.length;
          doWrite(stream, state, false, len, chunk, encoding, cb);
          if (state.writing) {
            c++;
            break;
          }
        }
        if (c < state.buffer.length)
          state.buffer = state.buffer.slice(c);
        else
          state.buffer.length = 0;
      }
      state.bufferProcessing = false;
    }
    Writable.prototype._write = function(chunk, encoding, cb) {
      cb(new Error('not implemented'));
    };
    Writable.prototype._writev = null;
    Writable.prototype.end = function(chunk, encoding, cb) {
      var state = this._writableState;
      if (util.isFunction(chunk)) {
        cb = chunk;
        chunk = null;
        encoding = null;
      } else if (util.isFunction(encoding)) {
        cb = encoding;
        encoding = null;
      }
      if (!util.isNullOrUndefined(chunk))
        this.write(chunk, encoding);
      if (state.corked) {
        state.corked = 1;
        this.uncork();
      }
      if (!state.ending && !state.finished)
        endWritable(this, state, cb);
    };
    function needFinish(stream, state) {
      return (state.ending && state.length === 0 && !state.finished && !state.writing);
    }
    function prefinish(stream, state) {
      if (!state.prefinished) {
        state.prefinished = true;
        stream.emit('prefinish');
      }
    }
    function finishMaybe(stream, state) {
      var need = needFinish(stream, state);
      if (need) {
        if (state.pendingcb === 0) {
          prefinish(stream, state);
          state.finished = true;
          stream.emit('finish');
        } else
          prefinish(stream, state);
      }
      return need;
    }
    function endWritable(stream, state, cb) {
      state.ending = true;
      finishMaybe(stream, state);
      if (cb) {
        if (state.finished)
          process.nextTick(cb);
        else
          stream.once('finish', cb);
      }
      state.ended = true;
    }
  })(require("9").Buffer, require("a"));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("e1", ["e7", "9", "7f", "da", "e6", "7e", "@empty", "e3", "e8", "e3", "e8", "9", "a"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  (function(Buffer, process) {
    module.exports = Readable;
    var isArray = require("e7");
    var Buffer = require("9").Buffer;
    Readable.ReadableState = ReadableState;
    var EE = require("7f").EventEmitter;
    if (!EE.listenerCount)
      EE.listenerCount = function(emitter, type) {
        return emitter.listeners(type).length;
      };
    var Stream = require("da");
    var util = require("e6");
    util.inherits = require("7e");
    var StringDecoder;
    var debug = require("@empty");
    if (debug && debug.debuglog) {
      debug = debug.debuglog('stream');
    } else {
      debug = function() {};
    }
    util.inherits(Readable, Stream);
    function ReadableState(options, stream) {
      var Duplex = require("e3");
      options = options || {};
      var hwm = options.highWaterMark;
      var defaultHwm = options.objectMode ? 16 : 16 * 1024;
      this.highWaterMark = (hwm || hwm === 0) ? hwm : defaultHwm;
      this.highWaterMark = ~~this.highWaterMark;
      this.buffer = [];
      this.length = 0;
      this.pipes = null;
      this.pipesCount = 0;
      this.flowing = null;
      this.ended = false;
      this.endEmitted = false;
      this.reading = false;
      this.sync = true;
      this.needReadable = false;
      this.emittedReadable = false;
      this.readableListening = false;
      this.objectMode = !!options.objectMode;
      if (stream instanceof Duplex)
        this.objectMode = this.objectMode || !!options.readableObjectMode;
      this.defaultEncoding = options.defaultEncoding || 'utf8';
      this.ranOut = false;
      this.awaitDrain = 0;
      this.readingMore = false;
      this.decoder = null;
      this.encoding = null;
      if (options.encoding) {
        if (!StringDecoder)
          StringDecoder = require("e8").StringDecoder;
        this.decoder = new StringDecoder(options.encoding);
        this.encoding = options.encoding;
      }
    }
    function Readable(options) {
      var Duplex = require("e3");
      if (!(this instanceof Readable))
        return new Readable(options);
      this._readableState = new ReadableState(options, this);
      this.readable = true;
      Stream.call(this);
    }
    Readable.prototype.push = function(chunk, encoding) {
      var state = this._readableState;
      if (util.isString(chunk) && !state.objectMode) {
        encoding = encoding || state.defaultEncoding;
        if (encoding !== state.encoding) {
          chunk = new Buffer(chunk, encoding);
          encoding = '';
        }
      }
      return readableAddChunk(this, state, chunk, encoding, false);
    };
    Readable.prototype.unshift = function(chunk) {
      var state = this._readableState;
      return readableAddChunk(this, state, chunk, '', true);
    };
    function readableAddChunk(stream, state, chunk, encoding, addToFront) {
      var er = chunkInvalid(state, chunk);
      if (er) {
        stream.emit('error', er);
      } else if (util.isNullOrUndefined(chunk)) {
        state.reading = false;
        if (!state.ended)
          onEofChunk(stream, state);
      } else if (state.objectMode || chunk && chunk.length > 0) {
        if (state.ended && !addToFront) {
          var e = new Error('stream.push() after EOF');
          stream.emit('error', e);
        } else if (state.endEmitted && addToFront) {
          var e = new Error('stream.unshift() after end event');
          stream.emit('error', e);
        } else {
          if (state.decoder && !addToFront && !encoding)
            chunk = state.decoder.write(chunk);
          if (!addToFront)
            state.reading = false;
          if (state.flowing && state.length === 0 && !state.sync) {
            stream.emit('data', chunk);
            stream.read(0);
          } else {
            state.length += state.objectMode ? 1 : chunk.length;
            if (addToFront)
              state.buffer.unshift(chunk);
            else
              state.buffer.push(chunk);
            if (state.needReadable)
              emitReadable(stream);
          }
          maybeReadMore(stream, state);
        }
      } else if (!addToFront) {
        state.reading = false;
      }
      return needMoreData(state);
    }
    function needMoreData(state) {
      return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
    }
    Readable.prototype.setEncoding = function(enc) {
      if (!StringDecoder)
        StringDecoder = require("e8").StringDecoder;
      this._readableState.decoder = new StringDecoder(enc);
      this._readableState.encoding = enc;
      return this;
    };
    var MAX_HWM = 0x800000;
    function roundUpToNextPowerOf2(n) {
      if (n >= MAX_HWM) {
        n = MAX_HWM;
      } else {
        n--;
        for (var p = 1; p < 32; p <<= 1)
          n |= n >> p;
        n++;
      }
      return n;
    }
    function howMuchToRead(n, state) {
      if (state.length === 0 && state.ended)
        return 0;
      if (state.objectMode)
        return n === 0 ? 0 : 1;
      if (isNaN(n) || util.isNull(n)) {
        if (state.flowing && state.buffer.length)
          return state.buffer[0].length;
        else
          return state.length;
      }
      if (n <= 0)
        return 0;
      if (n > state.highWaterMark)
        state.highWaterMark = roundUpToNextPowerOf2(n);
      if (n > state.length) {
        if (!state.ended) {
          state.needReadable = true;
          return 0;
        } else
          return state.length;
      }
      return n;
    }
    Readable.prototype.read = function(n) {
      debug('read', n);
      var state = this._readableState;
      var nOrig = n;
      if (!util.isNumber(n) || n > 0)
        state.emittedReadable = false;
      if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
        debug('read: emitReadable', state.length, state.ended);
        if (state.length === 0 && state.ended)
          endReadable(this);
        else
          emitReadable(this);
        return null;
      }
      n = howMuchToRead(n, state);
      if (n === 0 && state.ended) {
        if (state.length === 0)
          endReadable(this);
        return null;
      }
      var doRead = state.needReadable;
      debug('need readable', doRead);
      if (state.length === 0 || state.length - n < state.highWaterMark) {
        doRead = true;
        debug('length less than watermark', doRead);
      }
      if (state.ended || state.reading) {
        doRead = false;
        debug('reading or ended', doRead);
      }
      if (doRead) {
        debug('do read');
        state.reading = true;
        state.sync = true;
        if (state.length === 0)
          state.needReadable = true;
        this._read(state.highWaterMark);
        state.sync = false;
      }
      if (doRead && !state.reading)
        n = howMuchToRead(nOrig, state);
      var ret;
      if (n > 0)
        ret = fromList(n, state);
      else
        ret = null;
      if (util.isNull(ret)) {
        state.needReadable = true;
        n = 0;
      }
      state.length -= n;
      if (state.length === 0 && !state.ended)
        state.needReadable = true;
      if (nOrig !== n && state.ended && state.length === 0)
        endReadable(this);
      if (!util.isNull(ret))
        this.emit('data', ret);
      return ret;
    };
    function chunkInvalid(state, chunk) {
      var er = null;
      if (!util.isBuffer(chunk) && !util.isString(chunk) && !util.isNullOrUndefined(chunk) && !state.objectMode) {
        er = new TypeError('Invalid non-string/buffer chunk');
      }
      return er;
    }
    function onEofChunk(stream, state) {
      if (state.decoder && !state.ended) {
        var chunk = state.decoder.end();
        if (chunk && chunk.length) {
          state.buffer.push(chunk);
          state.length += state.objectMode ? 1 : chunk.length;
        }
      }
      state.ended = true;
      emitReadable(stream);
    }
    function emitReadable(stream) {
      var state = stream._readableState;
      state.needReadable = false;
      if (!state.emittedReadable) {
        debug('emitReadable', state.flowing);
        state.emittedReadable = true;
        if (state.sync)
          process.nextTick(function() {
            emitReadable_(stream);
          });
        else
          emitReadable_(stream);
      }
    }
    function emitReadable_(stream) {
      debug('emit readable');
      stream.emit('readable');
      flow(stream);
    }
    function maybeReadMore(stream, state) {
      if (!state.readingMore) {
        state.readingMore = true;
        process.nextTick(function() {
          maybeReadMore_(stream, state);
        });
      }
    }
    function maybeReadMore_(stream, state) {
      var len = state.length;
      while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
        debug('maybeReadMore read 0');
        stream.read(0);
        if (len === state.length)
          break;
        else
          len = state.length;
      }
      state.readingMore = false;
    }
    Readable.prototype._read = function(n) {
      this.emit('error', new Error('not implemented'));
    };
    Readable.prototype.pipe = function(dest, pipeOpts) {
      var src = this;
      var state = this._readableState;
      switch (state.pipesCount) {
        case 0:
          state.pipes = dest;
          break;
        case 1:
          state.pipes = [state.pipes, dest];
          break;
        default:
          state.pipes.push(dest);
          break;
      }
      state.pipesCount += 1;
      debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);
      var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;
      var endFn = doEnd ? onend : cleanup;
      if (state.endEmitted)
        process.nextTick(endFn);
      else
        src.once('end', endFn);
      dest.on('unpipe', onunpipe);
      function onunpipe(readable) {
        debug('onunpipe');
        if (readable === src) {
          cleanup();
        }
      }
      function onend() {
        debug('onend');
        dest.end();
      }
      var ondrain = pipeOnDrain(src);
      dest.on('drain', ondrain);
      function cleanup() {
        debug('cleanup');
        dest.removeListener('close', onclose);
        dest.removeListener('finish', onfinish);
        dest.removeListener('drain', ondrain);
        dest.removeListener('error', onerror);
        dest.removeListener('unpipe', onunpipe);
        src.removeListener('end', onend);
        src.removeListener('end', cleanup);
        src.removeListener('data', ondata);
        if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain))
          ondrain();
      }
      src.on('data', ondata);
      function ondata(chunk) {
        debug('ondata');
        var ret = dest.write(chunk);
        if (false === ret) {
          debug('false write response, pause', src._readableState.awaitDrain);
          src._readableState.awaitDrain++;
          src.pause();
        }
      }
      function onerror(er) {
        debug('onerror', er);
        unpipe();
        dest.removeListener('error', onerror);
        if (EE.listenerCount(dest, 'error') === 0)
          dest.emit('error', er);
      }
      if (!dest._events || !dest._events.error)
        dest.on('error', onerror);
      else if (isArray(dest._events.error))
        dest._events.error.unshift(onerror);
      else
        dest._events.error = [onerror, dest._events.error];
      function onclose() {
        dest.removeListener('finish', onfinish);
        unpipe();
      }
      dest.once('close', onclose);
      function onfinish() {
        debug('onfinish');
        dest.removeListener('close', onclose);
        unpipe();
      }
      dest.once('finish', onfinish);
      function unpipe() {
        debug('unpipe');
        src.unpipe(dest);
      }
      dest.emit('pipe', src);
      if (!state.flowing) {
        debug('pipe resume');
        src.resume();
      }
      return dest;
    };
    function pipeOnDrain(src) {
      return function() {
        var state = src._readableState;
        debug('pipeOnDrain', state.awaitDrain);
        if (state.awaitDrain)
          state.awaitDrain--;
        if (state.awaitDrain === 0 && EE.listenerCount(src, 'data')) {
          state.flowing = true;
          flow(src);
        }
      };
    }
    Readable.prototype.unpipe = function(dest) {
      var state = this._readableState;
      if (state.pipesCount === 0)
        return this;
      if (state.pipesCount === 1) {
        if (dest && dest !== state.pipes)
          return this;
        if (!dest)
          dest = state.pipes;
        state.pipes = null;
        state.pipesCount = 0;
        state.flowing = false;
        if (dest)
          dest.emit('unpipe', this);
        return this;
      }
      if (!dest) {
        var dests = state.pipes;
        var len = state.pipesCount;
        state.pipes = null;
        state.pipesCount = 0;
        state.flowing = false;
        for (var i = 0; i < len; i++)
          dests[i].emit('unpipe', this);
        return this;
      }
      var i = indexOf(state.pipes, dest);
      if (i === -1)
        return this;
      state.pipes.splice(i, 1);
      state.pipesCount -= 1;
      if (state.pipesCount === 1)
        state.pipes = state.pipes[0];
      dest.emit('unpipe', this);
      return this;
    };
    Readable.prototype.on = function(ev, fn) {
      var res = Stream.prototype.on.call(this, ev, fn);
      if (ev === 'data' && false !== this._readableState.flowing) {
        this.resume();
      }
      if (ev === 'readable' && this.readable) {
        var state = this._readableState;
        if (!state.readableListening) {
          state.readableListening = true;
          state.emittedReadable = false;
          state.needReadable = true;
          if (!state.reading) {
            var self = this;
            process.nextTick(function() {
              debug('readable nexttick read 0');
              self.read(0);
            });
          } else if (state.length) {
            emitReadable(this, state);
          }
        }
      }
      return res;
    };
    Readable.prototype.addListener = Readable.prototype.on;
    Readable.prototype.resume = function() {
      var state = this._readableState;
      if (!state.flowing) {
        debug('resume');
        state.flowing = true;
        if (!state.reading) {
          debug('resume read 0');
          this.read(0);
        }
        resume(this, state);
      }
      return this;
    };
    function resume(stream, state) {
      if (!state.resumeScheduled) {
        state.resumeScheduled = true;
        process.nextTick(function() {
          resume_(stream, state);
        });
      }
    }
    function resume_(stream, state) {
      state.resumeScheduled = false;
      stream.emit('resume');
      flow(stream);
      if (state.flowing && !state.reading)
        stream.read(0);
    }
    Readable.prototype.pause = function() {
      debug('call pause flowing=%j', this._readableState.flowing);
      if (false !== this._readableState.flowing) {
        debug('pause');
        this._readableState.flowing = false;
        this.emit('pause');
      }
      return this;
    };
    function flow(stream) {
      var state = stream._readableState;
      debug('flow', state.flowing);
      if (state.flowing) {
        do {
          var chunk = stream.read();
        } while (null !== chunk && state.flowing);
      }
    }
    Readable.prototype.wrap = function(stream) {
      var state = this._readableState;
      var paused = false;
      var self = this;
      stream.on('end', function() {
        debug('wrapped end');
        if (state.decoder && !state.ended) {
          var chunk = state.decoder.end();
          if (chunk && chunk.length)
            self.push(chunk);
        }
        self.push(null);
      });
      stream.on('data', function(chunk) {
        debug('wrapped data');
        if (state.decoder)
          chunk = state.decoder.write(chunk);
        if (!chunk || !state.objectMode && !chunk.length)
          return;
        var ret = self.push(chunk);
        if (!ret) {
          paused = true;
          stream.pause();
        }
      });
      for (var i in stream) {
        if (util.isFunction(stream[i]) && util.isUndefined(this[i])) {
          this[i] = function(method) {
            return function() {
              return stream[method].apply(stream, arguments);
            };
          }(i);
        }
      }
      var events = ['error', 'close', 'destroy', 'pause', 'resume'];
      forEach(events, function(ev) {
        stream.on(ev, self.emit.bind(self, ev));
      });
      self._read = function(n) {
        debug('wrapped _read', n);
        if (paused) {
          paused = false;
          stream.resume();
        }
      };
      return self;
    };
    Readable._fromList = fromList;
    function fromList(n, state) {
      var list = state.buffer;
      var length = state.length;
      var stringMode = !!state.decoder;
      var objectMode = !!state.objectMode;
      var ret;
      if (list.length === 0)
        return null;
      if (length === 0)
        ret = null;
      else if (objectMode)
        ret = list.shift();
      else if (!n || n >= length) {
        if (stringMode)
          ret = list.join('');
        else
          ret = Buffer.concat(list, length);
        list.length = 0;
      } else {
        if (n < list[0].length) {
          var buf = list[0];
          ret = buf.slice(0, n);
          list[0] = buf.slice(n);
        } else if (n === list[0].length) {
          ret = list.shift();
        } else {
          if (stringMode)
            ret = '';
          else
            ret = new Buffer(n);
          var c = 0;
          for (var i = 0,
              l = list.length; i < l && c < n; i++) {
            var buf = list[0];
            var cpy = Math.min(n - c, buf.length);
            if (stringMode)
              ret += buf.slice(0, cpy);
            else
              buf.copy(ret, c, 0, cpy);
            if (cpy < buf.length)
              list[0] = buf.slice(cpy);
            else
              list.shift();
            c += cpy;
          }
        }
      }
      return ret;
    }
    function endReadable(stream) {
      var state = stream._readableState;
      if (state.length > 0)
        throw new Error('endReadable called on non-empty stream');
      if (!state.endEmitted) {
        state.ended = true;
        process.nextTick(function() {
          if (!state.endEmitted && state.length === 0) {
            state.endEmitted = true;
            stream.readable = false;
            stream.emit('end');
          }
        });
      }
    }
    function forEach(xs, f) {
      for (var i = 0,
          l = xs.length; i < l; i++) {
        f(xs[i], i);
      }
    }
    function indexOf(xs, x) {
      for (var i = 0,
          l = xs.length; i < l; i++) {
        if (xs[i] === x)
          return i;
      }
      return -1;
    }
  })(require("9").Buffer, require("a"));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("e4", ["e3", "e6", "7e", "a"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  (function(process) {
    module.exports = Transform;
    var Duplex = require("e3");
    var util = require("e6");
    util.inherits = require("7e");
    util.inherits(Transform, Duplex);
    function TransformState(options, stream) {
      this.afterTransform = function(er, data) {
        return afterTransform(stream, er, data);
      };
      this.needTransform = false;
      this.transforming = false;
      this.writecb = null;
      this.writechunk = null;
    }
    function afterTransform(stream, er, data) {
      var ts = stream._transformState;
      ts.transforming = false;
      var cb = ts.writecb;
      if (!cb)
        return stream.emit('error', new Error('no writecb in Transform class'));
      ts.writechunk = null;
      ts.writecb = null;
      if (!util.isNullOrUndefined(data))
        stream.push(data);
      if (cb)
        cb(er);
      var rs = stream._readableState;
      rs.reading = false;
      if (rs.needReadable || rs.length < rs.highWaterMark) {
        stream._read(rs.highWaterMark);
      }
    }
    function Transform(options) {
      if (!(this instanceof Transform))
        return new Transform(options);
      Duplex.call(this, options);
      this._transformState = new TransformState(options, this);
      var stream = this;
      this._readableState.needReadable = true;
      this._readableState.sync = false;
      this.once('prefinish', function() {
        if (util.isFunction(this._flush))
          this._flush(function(er) {
            done(stream, er);
          });
        else
          done(stream);
      });
    }
    Transform.prototype.push = function(chunk, encoding) {
      this._transformState.needTransform = false;
      return Duplex.prototype.push.call(this, chunk, encoding);
    };
    Transform.prototype._transform = function(chunk, encoding, cb) {
      throw new Error('not implemented');
    };
    Transform.prototype._write = function(chunk, encoding, cb) {
      var ts = this._transformState;
      ts.writecb = cb;
      ts.writechunk = chunk;
      ts.writeencoding = encoding;
      if (!ts.transforming) {
        var rs = this._readableState;
        if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark)
          this._read(rs.highWaterMark);
      }
    };
    Transform.prototype._read = function(n) {
      var ts = this._transformState;
      if (!util.isNull(ts.writechunk) && ts.writecb && !ts.transforming) {
        ts.transforming = true;
        this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
      } else {
        ts.needTransform = true;
      }
    };
    function done(stream, er) {
      if (er)
        return stream.emit('error', er);
      var ws = stream._writableState;
      var ts = stream._transformState;
      if (ws.length)
        throw new Error('calling transform done when ws.length != 0');
      if (ts.transforming)
        throw new Error('calling transform done when still transforming');
      return stream.push(null);
    }
  })(require("a"));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("e3", ["e6", "7e", "e1", "e2", "a"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  (function(process) {
    module.exports = Duplex;
    var objectKeys = Object.keys || function(obj) {
      var keys = [];
      for (var key in obj)
        keys.push(key);
      return keys;
    };
    var util = require("e6");
    util.inherits = require("7e");
    var Readable = require("e1");
    var Writable = require("e2");
    util.inherits(Duplex, Readable);
    forEach(objectKeys(Writable.prototype), function(method) {
      if (!Duplex.prototype[method])
        Duplex.prototype[method] = Writable.prototype[method];
    });
    function Duplex(options) {
      if (!(this instanceof Duplex))
        return new Duplex(options);
      Readable.call(this, options);
      Writable.call(this, options);
      if (options && options.readable === false)
        this.readable = false;
      if (options && options.writable === false)
        this.writable = false;
      this.allowHalfOpen = true;
      if (options && options.allowHalfOpen === false)
        this.allowHalfOpen = false;
      this.once('end', onend);
    }
    function onend() {
      if (this.allowHalfOpen || this._writableState.ended)
        return;
      process.nextTick(this.end.bind(this));
    }
    function forEach(xs, f) {
      for (var i = 0,
          l = xs.length; i < l; i++) {
        f(xs[i], i);
      }
    }
  })(require("a"));
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("e5", ["e4", "e6", "7e"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = PassThrough;
  var Transform = require("e4");
  var util = require("e6");
  util.inherits = require("7e");
  util.inherits(PassThrough, Transform);
  function PassThrough(options) {
    if (!(this instanceof PassThrough))
      return new PassThrough(options);
    Transform.call(this, options);
  }
  PassThrough.prototype._transform = function(chunk, encoding, cb) {
    cb(null, chunk);
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("e7", ["e9"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("e9");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("e6", ["ea"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("ea");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("e8", ["eb"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = require("eb");
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("e9", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  module.exports = Array.isArray || function(arr) {
    return Object.prototype.toString.call(arr) == '[object Array]';
  };
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("ea", ["9"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  (function(Buffer) {
    function isArray(ar) {
      return Array.isArray(ar);
    }
    exports.isArray = isArray;
    function isBoolean(arg) {
      return typeof arg === 'boolean';
    }
    exports.isBoolean = isBoolean;
    function isNull(arg) {
      return arg === null;
    }
    exports.isNull = isNull;
    function isNullOrUndefined(arg) {
      return arg == null;
    }
    exports.isNullOrUndefined = isNullOrUndefined;
    function isNumber(arg) {
      return typeof arg === 'number';
    }
    exports.isNumber = isNumber;
    function isString(arg) {
      return typeof arg === 'string';
    }
    exports.isString = isString;
    function isSymbol(arg) {
      return typeof arg === 'symbol';
    }
    exports.isSymbol = isSymbol;
    function isUndefined(arg) {
      return arg === void 0;
    }
    exports.isUndefined = isUndefined;
    function isRegExp(re) {
      return isObject(re) && objectToString(re) === '[object RegExp]';
    }
    exports.isRegExp = isRegExp;
    function isObject(arg) {
      return typeof arg === 'object' && arg !== null;
    }
    exports.isObject = isObject;
    function isDate(d) {
      return isObject(d) && objectToString(d) === '[object Date]';
    }
    exports.isDate = isDate;
    function isError(e) {
      return isObject(e) && (objectToString(e) === '[object Error]' || e instanceof Error);
    }
    exports.isError = isError;
    function isFunction(arg) {
      return typeof arg === 'function';
    }
    exports.isFunction = isFunction;
    function isPrimitive(arg) {
      return arg === null || typeof arg === 'boolean' || typeof arg === 'number' || typeof arg === 'string' || typeof arg === 'symbol' || typeof arg === 'undefined';
    }
    exports.isPrimitive = isPrimitive;
    function isBuffer(arg) {
      return Buffer.isBuffer(arg);
    }
    exports.isBuffer = isBuffer;
    function objectToString(o) {
      return Object.prototype.toString.call(o);
    }
  })(require("9").Buffer);
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("eb", ["9", "9"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  (function(Buffer) {
    var Buffer = require("9").Buffer;
    var isBufferEncoding = Buffer.isEncoding || function(encoding) {
      switch (encoding && encoding.toLowerCase()) {
        case 'hex':
        case 'utf8':
        case 'utf-8':
        case 'ascii':
        case 'binary':
        case 'base64':
        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
        case 'raw':
          return true;
        default:
          return false;
      }
    };
    function assertEncoding(encoding) {
      if (encoding && !isBufferEncoding(encoding)) {
        throw new Error('Unknown encoding: ' + encoding);
      }
    }
    var StringDecoder = exports.StringDecoder = function(encoding) {
      this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
      assertEncoding(encoding);
      switch (this.encoding) {
        case 'utf8':
          this.surrogateSize = 3;
          break;
        case 'ucs2':
        case 'utf16le':
          this.surrogateSize = 2;
          this.detectIncompleteChar = utf16DetectIncompleteChar;
          break;
        case 'base64':
          this.surrogateSize = 3;
          this.detectIncompleteChar = base64DetectIncompleteChar;
          break;
        default:
          this.write = passThroughWrite;
          return;
      }
      this.charBuffer = new Buffer(6);
      this.charReceived = 0;
      this.charLength = 0;
    };
    StringDecoder.prototype.write = function(buffer) {
      var charStr = '';
      while (this.charLength) {
        var available = (buffer.length >= this.charLength - this.charReceived) ? this.charLength - this.charReceived : buffer.length;
        buffer.copy(this.charBuffer, this.charReceived, 0, available);
        this.charReceived += available;
        if (this.charReceived < this.charLength) {
          return '';
        }
        buffer = buffer.slice(available, buffer.length);
        charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);
        var charCode = charStr.charCodeAt(charStr.length - 1);
        if (charCode >= 0xD800 && charCode <= 0xDBFF) {
          this.charLength += this.surrogateSize;
          charStr = '';
          continue;
        }
        this.charReceived = this.charLength = 0;
        if (buffer.length === 0) {
          return charStr;
        }
        break;
      }
      this.detectIncompleteChar(buffer);
      var end = buffer.length;
      if (this.charLength) {
        buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end);
        end -= this.charReceived;
      }
      charStr += buffer.toString(this.encoding, 0, end);
      var end = charStr.length - 1;
      var charCode = charStr.charCodeAt(end);
      if (charCode >= 0xD800 && charCode <= 0xDBFF) {
        var size = this.surrogateSize;
        this.charLength += size;
        this.charReceived += size;
        this.charBuffer.copy(this.charBuffer, size, 0, size);
        buffer.copy(this.charBuffer, 0, 0, size);
        return charStr.substring(0, end);
      }
      return charStr;
    };
    StringDecoder.prototype.detectIncompleteChar = function(buffer) {
      var i = (buffer.length >= 3) ? 3 : buffer.length;
      for (; i > 0; i--) {
        var c = buffer[buffer.length - i];
        if (i == 1 && c >> 5 == 0x06) {
          this.charLength = 2;
          break;
        }
        if (i <= 2 && c >> 4 == 0x0E) {
          this.charLength = 3;
          break;
        }
        if (i <= 3 && c >> 3 == 0x1E) {
          this.charLength = 4;
          break;
        }
      }
      this.charReceived = i;
    };
    StringDecoder.prototype.end = function(buffer) {
      var res = '';
      if (buffer && buffer.length)
        res = this.write(buffer);
      if (this.charReceived) {
        var cr = this.charReceived;
        var buf = this.charBuffer;
        var enc = this.encoding;
        res += buf.slice(0, cr).toString(enc);
      }
      return res;
    };
    function passThroughWrite(buffer) {
      return buffer.toString(this.encoding);
    }
    function utf16DetectIncompleteChar(buffer) {
      this.charReceived = buffer.length % 2;
      this.charLength = this.charReceived ? 2 : 0;
    }
    function base64DetectIncompleteChar(buffer) {
      this.charReceived = buffer.length % 3;
      this.charLength = this.charReceived ? 3 : 0;
    }
  })(require("9").Buffer);
  global.define = __define;
  return module.exports;
});

$__System.register('2', ['10', '11', '12', '13', '14'], function (_export) {
  'use strict';

  var test, menu, prop, map, Maybe, identity, confirmSelected, confirmNothingSelectedAct, confirmSelectedAct;
  return {
    setters: [function (_) {
      test = _['default'];
    }, function (_2) {
      menu = _2['default'];
    }, function (_3) {
      prop = _3['default'];
    }, function (_4) {
      map = _4['default'];
    }, function (_5) {
      Maybe = _5['default'];
    }],
    execute: function () {
      identity = function identity(x) {
        return x;
      };

      confirmSelected = function confirmSelected(assert) {
        return function (inits, exps, subj) {
          var actual = subj.init(inits);
          for (var i = 0; i < exps.length; ++i) {
            actual = subj.update(subj.Action.Select(Maybe(i)), actual);
            console.log(JSON.stringify(actual));
            map(function (act) {
              assert.equal(act, i, "selected index updated: " + i);
            }, actual.selected);
            map(function (act) {
              assert.equal(act, exps[i], "selected value updated");
            }, actual.selectedValue);
          }
        };
      };

      confirmNothingSelectedAct = function confirmNothingSelectedAct(assert) {
        return function (act, inits, subj) {
          var actual = subj.init(inits);
          actual = subj.update(act(), actual);
          console.log(JSON.stringify(actual));
          assert.ok(actual.selected.isNothing(), 'selected index is Nothing');
          assert.ok(actual.selectedValue.isNothing(), 'selected value is Nothing');
        };
      };

      confirmSelectedAct = function confirmSelectedAct(assert) {
        return function (act, inits, exps, subj) {
          var actual = subj.init(inits);
          for (var i = 0; i < exps.length; ++i) {
            actual = subj.update(act(), actual);
            console.log(JSON.stringify(actual));
            map(function (act) {
              assert.equal(act, exps[i], "selected index updated: " + exps[i]);
            }, actual.selected);
          }
        };
      };

      test('menu select action, simple menu item component', function (assert) {
        assert.plan(3 * 2);

        var subj = menu({ view: identity, init: identity }, identity);

        confirmSelected(assert)(["one", "two", "three"], ["one", "two", "three"], subj);
      });

      test('menu select action, complex menu item component', function (assert) {
        assert.plan(3 * 2);

        var subj = menu({ init: function init(v) {
            return { value: v };
          },
          view: function view(o) {
            return o.value + " little piggy";
          } }, prop('value'));

        confirmSelected(assert)(["one", "two", "three"], ["one", "two", "three"], subj);
      });

      test('menu select-next action', function (assert) {
        assert.plan(10 + 2);

        var subj = menu({ view: identity, init: identity }, identity);

        confirmSelectedAct(assert)(subj.Action.SelectNext, ["one", "two", "three", "four", "five"], [0, 1, 2, 3, 4, 0, 1, 2, 3, 4], subj);

        var emptySubj = menu({ view: identity, init: identity }, identity);

        confirmNothingSelectedAct(assert)(emptySubj.Action.SelectNext, [], emptySubj);
      });

      test('menu select-prev action', function (assert) {
        assert.plan(10 + 2);

        var subj = menu({ view: identity, init: identity }, identity);

        confirmSelectedAct(assert)(subj.Action.SelectPrev, ["one", "two", "three", "four", "five"], [4, 3, 2, 1, 0, 4, 3, 2, 1, 0], subj);

        var emptySubj = menu({ view: identity, init: identity }, identity);

        confirmNothingSelectedAct(assert)(emptySubj.Action.SelectPrev, [], emptySubj);
      });

      test('menu refresh action', function (assert) {
        assert.plan(3);

        var subj = menu({ view: identity, init: identity }, identity);

        var actual = subj.init([]);
        actual = subj.update(subj.Action.Refresh(["four", "five"]), actual);

        assert.ok(actual.selected.isNothing(), "selected is Nothing after refresh");
        assert.ok(actual.selectedValue.isNothing(), "selectedValue is Nothing after refresh");
        assert.deepEqual(actual.items, ["four", "five"], "items are changed after refresh");
      });
    }
  };
});
$__System.register('3', ['10', '11', '12', '13', '14', '15', '16', '17', '18', '19'], function (_export) {
  var test, menu, prop, map, Maybe, flyd, autocomplete, _slicedToArray, Future, compose, identity, T, throwOr, mockTaskCalls, start;

  return {
    setters: [function (_3) {
      test = _3['default'];
    }, function (_10) {
      menu = _10['default'];
    }, function (_7) {
      prop = _7['default'];
    }, function (_8) {
      map = _8['default'];
    }, function (_6) {
      Maybe = _6['default'];
    }, function (_4) {
      flyd = _4['default'];
    }, function (_11) {
      autocomplete = _11['default'];
    }, function (_2) {
      _slicedToArray = _2['default'];
    }, function (_5) {
      Future = _5['default'];
    }, function (_9) {
      compose = _9['default'];
    }],
    execute: function () {
      'use strict';

      identity = function identity(x) {
        return x;
      };

      T = function T(_) {
        return true;
      };

      throwOr = function throwOr(fn) {
        return function (x) {
          if (x instanceof Error) throw x;
          return fn(x);
        };
      };

      mockTaskCalls = function mockTaskCalls(rets) {
        var parse = arguments.length <= 1 || arguments[1] === undefined ? identity : arguments[1];
        var guard = arguments.length <= 2 || arguments[2] === undefined ? T : arguments[2];

        var i = -1;
        return function (str, model) {
          return map(parse, new Future(function (rej, res) {
            i = i + 1;
            if (i > rets.length - 1) {
              rej(new Error('Too many calls'));
            } else {
              if (guard(str, model)) {
                res(rets[i]);
              } else {
                rej(rets[i]);
              }
            }
          }));
        };
      };

      start = function start(action$, snapshots, subj, init) {

        // note this mimics the app action flow above the autocomplete component
        var refreshMenu = compose(action$, subj.Action.RefreshMenu);
        var clearMenu = compose(action$, subj.Action.ClearMenu);

        var state$ = flyd.map(function (act) {
          var _subj$update = subj.update(act, state$());

          var _subj$update2 = _slicedToArray(_subj$update, 2);

          var s1 = _subj$update2[0];
          var tasks = _subj$update2[1];

          tasks.map(function (t) {
            return t.fork(throwOr(clearMenu), refreshMenu);
          });
          return s1;
        }, action$);
        flyd.on(function (s) {
          console.log(s);
          snapshots.push(s);
        }, state$);

        state$(init);
      };

      test('autocomplete hide-menu action', function (assert) {

        var subjMenu = menu({ view: identity, init: identity }, identity);
        var subj = autocomplete(subjMenu);
        var query = mockTaskCalls([["world"]]);

        var action$ = flyd.stream();
        var snapshots = [];
        start(action$, snapshots, subj, subj.init());

        action$(subj.Action.Input(query, Maybe('hello')));
        action$(subj.Action.HideMenu());

        assert.equal(snapshots.length, 4, "four state changes (including initial)");
        assert.equal(snapshots[1].isEditing, true, " at 1: is editing");
        assert.equal(snapshots[3].isEditing, false, " at 3: is not editing");

        assert.end();
      });

      test('autocomplete input action, with guard failing', function (assert) {

        var subjMenu = menu({ view: identity, init: identity }, identity);
        var subj = autocomplete(subjMenu);
        var guard = function guard(str) {
          return str.getOrElse('').length >= 3;
        };
        var query = mockTaskCalls(["high"], identity, guard);

        var action$ = flyd.stream();
        var snapshots = [];
        start(action$, snapshots, subj, subj.init());

        action$(subj.Action.Input(query, Maybe('hi')));

        assert.equal(snapshots.length, 3, "three state changes (including initial)");
        assert.ok(snapshots[1].value.equals(Maybe('hi')), "value changed to input value");
        assert.equal(snapshots[1].menu.items.length, 0, "menu not populated");
        assert.equal(snapshots[2].menu.items.length, 0, "menu not populated after query");

        assert.end();
      });

      test('autocomplete input action, with guard passing', function (assert) {

        var subjMenu = menu({ view: identity, init: identity }, identity);
        var subj = autocomplete(subjMenu);
        var guard = function guard(str) {
          return str.getOrElse('').length >= 3;
        };
        var query = mockTaskCalls([["hum", "humor", "human"]], identity, guard);

        var action$ = flyd.stream();
        var snapshots = [];
        start(action$, snapshots, subj, subj.init());

        action$(subj.Action.Input(query, Maybe('hum')));

        assert.equal(snapshots.length, 3, "three state changes (including initial)");

        assert.ok(snapshots[1].value.equals(Maybe('hum')), " at 1: value changed to input value");
        assert.equal(snapshots[1].menu.items.length, 0, " at 1: menu not populated");

        assert.ok(snapshots[2].value.equals(Maybe('hum')), " at 2: value equals input value");
        assert.equal(snapshots[2].isEditing, true, " at 2: is editing");
        assert.deepEqual(snapshots[2].menu.items, ["hum", "humor", "human"], " at 2: menu items populated");

        assert.end();
      });

      test('autocomplete input action, multiple transitions', function (assert) {

        var calls = ['', '', ["hum", "humor", "human", "humid"], ["humor"], [], ["home"], ["home", "hominid"], ''];

        var subjMenu = menu({ view: identity, init: identity }, identity);
        var subj = autocomplete(subjMenu);
        var guard = function guard(str) {
          return str.getOrElse('').length >= 3;
        };
        var query = mockTaskCalls(calls, identity, guard);

        var action$ = flyd.stream();
        var snapshots = [];
        start(action$, snapshots, subj, subj.init());

        action$(subj.Action.Input(query, Maybe('h')));
        action$(subj.Action.Input(query, Maybe('hu')));
        action$(subj.Action.Input(query, Maybe('hum')));
        action$(subj.Action.Input(query, Maybe('humo')));
        action$(subj.Action.Input(query, Maybe('hume')));
        action$(subj.Action.Input(query, Maybe('home')));
        action$(subj.Action.Input(query, Maybe('hom')));
        action$(subj.Action.Input(query, Maybe.Nothing()));

        var exp = 1 + (2 + 2 + 2 + 2 + 2 + 2 + 2 + 2);
        assert.equal(snapshots.length, exp, "" + exp + " state changes (including initial)");

        for (var i = 0; i < calls.length; ++i) {
          var c = calls[i];
          var idx = 2 * (i + 1);
          if (c.length === 0) {
            assert.equal(snapshots[idx].menu.items.length, 0, " at " + idx + ": menu items empty");
          } else {
            assert.deepEqual(snapshots[idx].menu.items, c, " at " + idx + ": menu items populated");
          }
        }

        assert.end();
      });

      test('autocomplete input action, with parsing', function (assert) {

        var calls = [[{ value: "hum" }, { value: "humor" }, { value: "human" }]];

        var subjMenu = menu({ view: identity, init: identity }, identity);
        var subj = autocomplete(subjMenu);
        var parse = map(prop('value'));
        var query = mockTaskCalls(calls, parse, T);

        var action$ = flyd.stream();
        var snapshots = [];
        start(action$, snapshots, subj, subj.init());

        action$(subj.Action.Input(query, Maybe('hum')));

        assert.equal(snapshots.length, 3, "three state changes (including initial)");

        assert.ok(snapshots[2].value.equals(Maybe('hum')), " at 2: value equals input value");
        assert.deepEqual(snapshots[2].menu.items, parse(calls[0]), " at 2: menu items populated");

        assert.end();
      });
    }
  };
});
$__System.register('4', ['10', '14', '15', '17', '1b', '1c', '1d', '1e', '1a'], function (_export) {
  var test, Maybe, flyd, _slicedToArray, equals, reduce, prepend, append, app, throwOr, inspectAction, start;

  return {
    setters: [function (_2) {
      test = _2['default'];
    }, function (_4) {
      Maybe = _4['default'];
    }, function (_3) {
      flyd = _3['default'];
    }, function (_) {
      _slicedToArray = _['default'];
    }, function (_b) {
      equals = _b['default'];
    }, function (_c) {
      reduce = _c['default'];
    }, function (_d) {
      prepend = _d['default'];
    }, function (_e) {
      append = _e['default'];
    }, function (_a) {
      app = _a['default'];
    }],
    execute: function () {
      'use strict';

      throwOr = function throwOr(fn) {
        return function (x) {
          if (x instanceof Error) throw x;
          return fn(x);
        };
      };

      inspectAction = function inspectAction(a) {
        var parts = reduce(function (acc, p) {
          return append(Array.isArray(p) && p['name'] ? inspectAction(p) : p, acc);
        }, [], a);
        return prepend(a.name, parts);
      };

      start = function start(action$, snapshots, init) {
        var state$ = flyd.map(function (act) {
          console.log("-->" + JSON.stringify(inspectAction(act)));

          var _app$update = app.update(act, state$());

          var _app$update2 = _slicedToArray(_app$update, 2);

          var s1 = _app$update2[0];
          var tasks = _app$update2[1];

          tasks.map(function (t) {
            return t.fork(throwOr(action$), action$);
          });
          return s1;
        }, action$);
        flyd.on(function (s) {
          console.log("<--" + JSON.stringify(s));
          snapshots.push(s);
        }, state$);

        state$(init);
        return state$;
      };

      ///////////////////////////////////////////////////////////////////////////////
      test('set-country action', function (assert) {

        assert.plan(2);

        var action$ = flyd.stream();
        var snapshots = [];
        start(action$, snapshots, app.init());

        action$(app.Action.SetCountry(Maybe('DE')));

        assert.equal(snapshots.length, 2, "one state change plus initial");
        assert.ok(snapshots[1].country.equals(Maybe('DE')), "set country to Just expected");
      });

      test('search action, success', function (assert) {

        assert.plan(2);

        var action$ = flyd.stream();
        var snapshots = [];
        var state$ = start(action$, snapshots, app.init());

        action$(app.Action.SetCountry(Maybe('US')));

        var searchAction = app.search.Action.Input(app.query(state$()), Maybe('Philadelphia, PA'));
        action$(app.Action.Search(searchAction));

        setTimeout(function () {
          assert.equal(snapshots.length, 4, "three state changes plus initial");
          assert.ok(snapshots[3].search.menu.items.length > 0, "at least one search result displayed in menu");
        }, 2000);
      });

      test('search action, failure (404 not found)', function (assert) {

        assert.plan(2);

        var action$ = flyd.stream();
        var snapshots = [];
        var state$ = start(action$, snapshots, app.init());

        action$(app.Action.SetCountry(Maybe('US')));

        var searchAction = app.search.Action.Input(app.query(state$()), Maybe('Flooby, MA'));
        action$(app.Action.Search(searchAction));

        setTimeout(function () {
          assert.equal(snapshots.length, 4, "three state changes plus initial");
          assert.equal(snapshots[3].search.menu.items.length, 0, "no search results displayed in menu");
        }, 2000);
      });

      test('search action, failure (no country set)', function (assert) {

        assert.plan(2);

        var action$ = flyd.stream();
        var snapshots = [];
        var state$ = start(action$, snapshots, app.init());

        var searchAction = app.search.Action.Input(app.query(state$()), Maybe('Philadelphia, PA'));
        action$(app.Action.Search(searchAction));

        setTimeout(function () {
          assert.equal(snapshots.length, 3, "two state changes plus initial");
          assert.equal(snapshots[2].search.menu.items.length, 0, "no search results displayed in menu");
        }, 1000);
      });

      test('search action, failure (place and state not parsed)', function (assert) {

        assert.plan(2);

        var action$ = flyd.stream();
        var snapshots = [];
        var state$ = start(action$, snapshots, app.init());

        action$(app.Action.SetCountry(Maybe('US')));

        var searchAction = app.search.Action.Input(app.query(state$()), Maybe('Philadelphia PA'));
        action$(app.Action.Search(searchAction));

        setTimeout(function () {
          assert.equal(snapshots.length, 4, "three state changes plus initial");
          assert.equal(snapshots[3].search.menu.items.length, 0, "no search results displayed in menu");
        }, 1000);
      });

      test('search action, failure (place blank)', function (assert) {

        assert.plan(2);

        var action$ = flyd.stream();
        var snapshots = [];
        var state$ = start(action$, snapshots, app.init());

        action$(app.Action.SetCountry(Maybe('US')));

        var searchAction = app.search.Action.Input(app.query(state$()), Maybe(', PA'));
        action$(app.Action.Search(searchAction));

        setTimeout(function () {
          assert.equal(snapshots.length, 4, "three state changes plus initial");
          assert.equal(snapshots[3].search.menu.items.length, 0, "no search results displayed in menu");
        }, 1000);
      });
    }
  };
});
$__System.register('11', ['13', '14', '26', '27', '28', '29', '2a', '2b'], function (_export) {
  'use strict';

  var map, Maybe, Type, curry, assoc, merge, toString, h, identity, isMaybe;

  _export('default', menu);

  function menu(itemComponent, valueAccessor) {

    // model

    var init = function init() {
      var items = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
      return {
        selected: Maybe.Nothing(),
        selectedValue: Maybe.Nothing(),
        items: map(itemComponent.init, items)
      };
    };

    var nextIndex = function nextIndex(model) {
      var idx = model.selected,
          n = model.items.length;
      return idx.isNothing() ? n === 0 ? Maybe.Nothing() : Maybe.Just(0) : map(function (i) {
        return (i + 1) % n;
      }, idx);
    };

    var prevIndex = function prevIndex(model) {
      var idx = model.selected,
          n = model.items.length;
      return idx.isNothing() ? n === 0 ? Maybe.Nothing() : Maybe.Just(n - 1) : map(function (i) {
        return (n + (i - 1)) % n;
      }, idx);
    };

    // update

    var Action = Type({
      Select: [isMaybe],
      SelectNext: [],
      SelectPrev: [],
      Refresh: [Array],
      Clear: []
    });

    var update = Action.caseOn({

      Select: function Select(idx, model) {
        var val = map(function (i) {
          return valueAccessor(model.items[i]);
        }, idx);
        return assoc('selectedValue', val, assoc('selected', idx, model));
      },

      SelectNext: function SelectNext(model) {
        var idx = nextIndex(model);
        return update(Action.Select(idx, model), model);
      },

      SelectPrev: function SelectPrev(model) {
        var idx = prevIndex(model);
        return update(Action.Select(idx, model), model);
      },

      Refresh: init,

      Clear: function Clear(_) {
        return init([]);
      }

    });

    // view

    var view = curry(function (_ref, model) {
      var _ref$style = _ref.style;
      var style = _ref$style === undefined ? initStyle() : _ref$style;
      var action$ = _ref.action$;

      style.ul = merge(style.ul || {}, fixedStyle.ul);
      style.li = merge(style.li || {}, fixedStyle.li);

      return h('ul', { style: style.ul }, model.items.map(itemView(action$, style.li, model)));
    });

    var itemView = curry(function (action$, style, model, item, i) {
      var subview = itemComponent.view(item);
      return h('li', { 'class': { selected: model.selected.equals(Maybe(i)) },
        style: style,
        on: { click: [action$, Action.Select(Maybe(i))] }
      }, typeof subview == 'string' ? subview : [subview]);
    });

    // styles

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

    return { init: init, update: update, Action: Action, view: view };
  }

  return {
    setters: [function (_5) {
      map = _5['default'];
    }, function (_7) {
      Maybe = _7['default'];
    }, function (_6) {
      Type = _6['default'];
    }, function (_2) {
      curry = _2['default'];
    }, function (_3) {
      assoc = _3['default'];
    }, function (_4) {
      merge = _4['default'];
    }, function (_a) {
      toString = _a['default'];
    }, function (_b) {
      h = _b['default'];
    }],
    execute: function () {
      identity = function identity(x) {
        return x;
      };

      isMaybe = function isMaybe(val) {
        return Maybe.isNothing(val) || Maybe.isJust(val);
      };
    }
  };
});
$__System.register('1a', ['11', '12', '13', '14', '16', '17', '18', '19', '26', '27', '28', '30', '31', '32', '33', '34', '35', '36', '37', '2e', '2f', '1b', '1d', '2d', '2b'], function (_export) {
  var menu, prop, map, Maybe, autocomplete, _slicedToArray, Future, compose, Type, curry, assoc, unary, invoker, ifElse, path, props, insert, join, allPass, chain, identity, equals, prepend, forwardTo, h, isMaybe, maybeEmpty, rejectFut, errorOr, promToFut, getJSON, getUrl, respIsOK, targetValue, noFx, searchItem, searchItemValue, searchMenu, search, query, getZipsAndPlaces, parseResult, fetchFail, fetchZips, toParams, parseInput, parseStateAndPlace, validateStateAndPlace, init, initMessage, headerMessage, Action, update, view, countryMenuView;

  return {
    setters: [function (_20) {
      menu = _20['default'];
    }, function (_11) {
      prop = _11['default'];
    }, function (_5) {
      map = _5['default'];
    }, function (_18) {
      Maybe = _18['default'];
    }, function (_19) {
      autocomplete = _19['default'];
    }, function (_2) {
      _slicedToArray = _2['default'];
    }, function (_17) {
      Future = _17['default'];
    }, function (_4) {
      compose = _4['default'];
    }, function (_16) {
      Type = _16['default'];
    }, function (_3) {
      curry = _3['default'];
    }, function (_12) {
      assoc = _12['default'];
    }, function (_6) {
      unary = _6['default'];
    }, function (_7) {
      invoker = _7['default'];
    }, function (_8) {
      ifElse = _8['default'];
    }, function (_9) {
      path = _9['default'];
    }, function (_10) {
      props = _10['default'];
    }, function (_13) {
      insert = _13['default'];
    }, function (_14) {
      join = _14['default'];
    }, function (_15) {
      allPass = _15['default'];
    }, function (_e) {
      chain = _e['default'];
    }, function (_f) {
      identity = _f['default'];
    }, function (_b) {
      equals = _b['default'];
    }, function (_d) {
      prepend = _d['default'];
    }, function (_d2) {
      forwardTo = _d2['default'];
    }, function (_b2) {
      h = _b2['default'];
    }],
    execute: function () {
      /* globals window */

      // utils

      'use strict';

      isMaybe = function isMaybe(val) {
        return Maybe.isNothing(val) || Maybe.isJust(val);
      };

      maybeEmpty = function maybeEmpty(val) {
        return val.length === 0 ? Maybe.Nothing() : Maybe(val);
      };

      rejectFut = function rejectFut(val) {
        return Future(function (rej, res) {
          return rej(val);
        });
      };

      errorOr = function errorOr(fn) {
        return function (val) {
          return val instanceof Error ? val : fn(val);
        };
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
        return compose(chain(ifElse(respIsOK, parseResult, fetchFail)), chain(fetchZips), unary(toParams(model)));
      };

      getZipsAndPlaces = function getZipsAndPlaces(data) {
        var placeAndZips = map(props(['place name', 'post code']), data.places);
        return map(insert(1, data['state abbreviation']), placeAndZips);
      };

      // Response -> Future ((), Array (Array String))
      parseResult = compose(map(getZipsAndPlaces), getJSON);

      // Response -> Future (String, ())

      fetchFail = function fetchFail(resp) {
        return rejectFut("Not found, check your spelling.");
      };

      // Array String -> Future ((), Response)

      fetchZips = function fetchZips(_ref4) {
        var _ref42 = _slicedToArray(_ref4, 3);

        var country = _ref42[0];
        var state = _ref42[1];
        var place = _ref42[2];

        return getUrl('http://api.zippopotam.us/' + country + '/' + state + '/' + place);
      };

      // Object -> Maybe String -> Future (String, Array String)

      toParams = function toParams(model) {
        return function (str) {
          return new Future(function (rej, res) {
            var stateAndPlace = parseInput(str);
            var country = model.country;
            if (Maybe.isNothing(stateAndPlace)) {
              rej("Enter place name and state or province, separated by a comma");return;
            }
            if (Maybe.isNothing(country)) {
              rej("Select a country");return;
            }
            map(function (c) {
              return map(function (s) {
                return res(prepend(c, s));
              }, stateAndPlace);
            }, country);
            return;
          });
        };
      };

      parseInput = function parseInput(str) {
        return chain(validateStateAndPlace, map(parseStateAndPlace, str));
      };

      parseStateAndPlace = function parseStateAndPlace(s) {
        return s.split(',').map(invoker(0, 'trim')).reverse();
      };

      validateStateAndPlace = function validateStateAndPlace(parts) {
        return parts.length < 2 || parts.some(function (p) {
          return p.length === 0;
        }) ? Maybe.Nothing() : Maybe(parts.slice(0, 2));
      };

      ///////////////////////////////////////////////////////////////////////////////
      // model

      init = function init() {
        return {
          message: Maybe(initMessage),
          country: Maybe.Nothing(),
          search: search.init()
        };
      };

      initMessage = "Select a country, and enter a place name.";

      headerMessage = function headerMessage(model) {
        return model.message.getOrElse(initMessage);
      };

      // update

      Action = Type({
        SetCountry: [isMaybe],
        Search: [search.Action],
        SearchResultOk: [Array],
        SearchResultErr: [String]
      });
      update = Action.caseOn({

        SetCountry: function SetCountry(str, model) {
          return noFx(assoc('message', str.isNothing() ? Maybe(initMessage) : model.message, assoc('country', str, model)));
        },

        Search: function Search(action, model) {
          var _search$update = search.update(action, model.search);

          var _search$update2 = _slicedToArray(_search$update, 2);

          var s = _search$update2[0];
          var tasks = _search$update2[1];

          return [assoc('search', s, model), map(function (t) {
            return t.bimap(errorOr(Action.SearchResultErr), Action.SearchResultOk);
          }, tasks)];
        },

        SearchResultOk: function SearchResultOk(results, model) {
          var count = results.length;

          var _search$update3 = search.update(search.Action.RefreshMenu(results), model.search);

          var _search$update32 = _slicedToArray(_search$update3, 2);

          var s = _search$update32[0];
          var _ = _search$update32[1];

          return noFx(assoc('message', Maybe.Just(count + ' postal codes found.'), assoc('search', s, model)));
        },

        SearchResultErr: function SearchResultErr(message, model) {
          var _search$update4 = search.update(search.Action.ClearMenu(), model.search);

          var _search$update42 = _slicedToArray(_search$update4, 2);

          var s = _search$update42[0];
          var _ = _search$update42[1];

          return noFx(assoc('message', Maybe.Just(message), assoc('search', s, model)));
        }

      });

      // view

      view = curry(function (_ref5, model) {
        var action$ = _ref5.action$;
        return h('div#app', [h('h1', 'Postal codes autocomplete example'), h('h2', headerMessage(model)), h('div.country', [h('label', { attrs: { 'for': 'country' } }, 'Country'), countryMenuView(action$, ['', 'DE', 'ES', 'FR', 'US'])]), search.view({ action$: forwardTo(action$, Action.Search),
          query: query(model)
        }, model.search)]);
      });

      countryMenuView = function countryMenuView(action$, codes) {
        return h('select', {
          on: {
            change: compose(action$, Action.SetCountry, maybeEmpty, targetValue)
          }
        }, map(function (code) {
          return h('option', code);
        }, codes));
      };

      // note: extra exports for testing

      _export('default', { init: init, update: update, Action: Action, view: view, search: search, searchMenu: searchMenu, query: query });
    }
  };
});
$__System.register('16', ['13', '14', '18', '19', '26', '27', '28', '29', '38', '39', '3a', '3b', '3c', '2d', '2b'], function (_export) {
  'use strict';

  var map, Maybe, Future, compose, Type, curry, assoc, merge, always, T, F, lensProp, get, forwardTo, h, noop, noFx, isMaybe, maybeEmpty, throwOr, positionUnder, repositionUnder, valueLens, caseKey;

  // hooks

  _export('default', autocomplete);

  function autocomplete(menu) {

    // model

    var init = function init() {
      var value = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];
      return {
        menu: menu.init(),
        isEditing: false,
        value: Maybe(value)
      };
    };

    var showMenu = function showMenu(model) {
      return model.isEditing && model.menu.items.length > 0;
    };

    var selectedOrInputValue = function selectedOrInputValue(model) {
      return model.menu.selectedValue.getOrElse(model.value.getOrElse(''));
    };

    // update

    var Action = Type({
      Input: [Function, isMaybe],
      RefreshMenu: [Array],
      ClearMenu: [],
      UpdateMenu: [menu.Action],
      ShowMenu: [],
      HideMenu: []
    });

    var update = Action.caseOn({

      Input: function Input(query, str, model) {
        var tasks = [query(str, model)];
        return [assoc('isEditing', true, assoc('value', str, model)), tasks];
      },

      RefreshMenu: function RefreshMenu(items, model) {
        return update(Action.UpdateMenu(menu.Action.Refresh(items)), model);
      },

      ClearMenu: function ClearMenu(model) {
        return update(Action.UpdateMenu(menu.Action.Clear()), model);
      },

      UpdateMenu: function UpdateMenu(action, model) {
        return noFx(assoc('menu', menu.update(action, model.menu), model));
      },

      ShowMenu: compose(noFx, assoc('isEditing', true)),

      HideMenu: compose(noFx, assoc('isEditing', false))

    });

    // view

    var view = curry(function (_ref, model) {
      var query = _ref.query;
      var action$ = _ref.action$;

      var menuAction$ = forwardTo(action$, Action.UpdateMenu);
      var input = inputView(action$, menuAction$, query, model);
      var menudiv = menuView(menu.view({ action$: menuAction$ }), style.menu, model.menu);

      return h('div.autocomplete', showMenu(model) ? [input, menudiv] : [input]);
    });

    var inputView = function inputView(action$, menuAction$, query, model) {

      var handleEsc = compose(action$, always(Action.HideMenu()));
      var handleEnter = handleEsc;
      var handleDown = compose(menuAction$, always(menu.Action.SelectNext()));
      var handleUp = compose(menuAction$, always(menu.Action.SelectPrev()));

      return h('input', {
        on: {
          input: compose(action$, Action.Input(query), maybeEmpty, get(valueLens)),
          keydown: !model.isEditing ? noop : caseKey([[['Esc', 'Escape', 0x1B], handleEsc], [['Enter', 0x0A, 0x0D], handleEnter], [['Down', 'DownArrow', 0x28], handleDown], [['Up', 'UpArrow', 0x26], handleUp]]),
          blur: [action$, Action.HideMenu()]
        },
        props: { type: 'text',
          value: selectedOrInputValue(model)
        }
      });
    };

    var menuView = function menuView(mview, style, model) {
      return h('div.menu', {
        style: style,
        hook: { insert: positionUnder('input'),
          postpatch: repositionUnder('input')
        }
      }, [mview(model)]);
    };

    // styles

    var style = {
      menu: {
        position: 'absolute',
        'z-index': '100',
        opacity: '1',
        transition: 'opacity 0.2s',
        remove: { opacity: '0' }
      }
    };

    return { init: init, update: update, Action: Action, view: view };
  }

  return {
    setters: [function (_3) {
      map = _3['default'];
    }, function (_10) {
      Maybe = _10['default'];
    }, function (_9) {
      Future = _9['default'];
    }, function (_2) {
      compose = _2['default'];
    }, function (_8) {
      Type = _8['default'];
    }, function (_) {
      curry = _['default'];
    }, function (_6) {
      assoc = _6['default'];
    }, function (_7) {
      merge = _7['default'];
    }, function (_4) {
      always = _4['default'];
    }, function (_5) {
      T = _5['default'];
    }, function (_a) {
      F = _a['default'];
    }, function (_b) {
      lensProp = _b['default'];
    }, function (_c) {
      get = _c['default'];
    }, function (_d) {
      forwardTo = _d['default'];
    }, function (_b2) {
      h = _b2['default'];
    }],
    execute: function () {
      noop = function noop() {};

      noFx = function noFx(s) {
        return [s, []];
      };

      isMaybe = function isMaybe(val) {
        return Maybe.isNothing(val) || Maybe.isJust(val);
      };

      maybeEmpty = function maybeEmpty(val) {
        return val.length === 0 ? Maybe.Nothing() : Maybe(val);
      };

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

      // move to helpers

      valueLens = compose(lensProp('target'), lensProp('value'));
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
})
(function(factory) {
  factory();
});
//# sourceMappingURL=test-build.js.map