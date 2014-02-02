(function (root, factory) {
  root.Bokeh = factory();
}(this, function () {
  //almond, and your modules will be inlined here


/**
 * @license almond 0.2.9 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                name = baseParts.concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("vendor/almond/almond", function(){});

//     Underscore.js 1.5.2
//     http://underscorejs.org
//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.5.2';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, length = obj.length; i < length; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      var keys = _.keys(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results.push(iterator.call(context, value, index, list));
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    return _.filter(obj, function(value, index, list) {
      return !iterator.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs, first) {
    if (_.isEmpty(attrs)) return first ? void 0 : [];
    return _[first ? 'find' : 'filter'](obj, function(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) return false;
      }
      return true;
    });
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.where(obj, attrs, true);
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed > result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity, value: Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array, using the modern version of the 
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sample **n** random values from an array.
  // If **n** is not specified, returns a single random element from the array.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (arguments.length < 2 || guard) {
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, value, context) {
      var result = {};
      var iterator = value == null ? _.identity : lookupIterator(value);
      each(obj, function(value, index) {
        var key = iterator.call(context, value, index, obj);
        behavior(result, key, value);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, key, value) {
    (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, key, value) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, key) {
    _.has(result, key) ? result[key]++ : result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = iterator == null ? _.identity : lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    return (n == null) || guard ? array[0] : slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) {
      return array[array.length - 1];
    } else {
      return slice.call(array, Math.max(array.length - n, 0));
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    each(input, function(value) {
      if (_.isArray(value) || _.isArguments(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var length = _.max(_.pluck(arguments, "length").concat(0));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, '' + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(length);

    while(idx < length) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context.
  _.partial = function(func) {
    var args = slice.call(arguments, 1);
    return function() {
      return func.apply(this, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) throw new Error("bindAll must be passed function names");
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function() {
      previous = options.leading === false ? 0 : new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;
    return function() {
      context = this;
      args = arguments;
      timestamp = new Date();
      var later = function() {
        var last = (new Date()) - timestamp;
        if (last < wait) {
          timeout = setTimeout(later, wait - last);
        } else {
          timeout = null;
          if (!immediate) result = func.apply(context, args);
        }
      };
      var callNow = immediate && !timeout;
      if (!timeout) {
        timeout = setTimeout(later, wait);
      }
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = new Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = new Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                             _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(Math.max(0, n));
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

  // AMD define happens at the end for compatibility with AMD loaders
  // that don't enforce next-turn semantics on modules.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [],function() {
      return _;
    });
  }

}).call(this);

(function() {
  define('common/custom',["underscore"], function(_) {
    var monkey_patch;
    monkey_patch = function() {
      return _.uniqueId = function(prefix) {
        var hexDigits, i, s, uuid, _i;
        s = [];
        hexDigits = "0123456789ABCDEF";
        for (i = _i = 0; _i <= 31; i = ++_i) {
          s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        s[12] = "4";
        s[16] = hexDigits.substr((s[16] & 0x3) | 0x8, 1);
        uuid = s.join("");
        if (prefix) {
          return prefix + "-" + uuid;
        } else {
          return uuid;
        }
      };
    };
    _.isNullOrUndefined = function(x) {
      return _.isNull(x) || _.isUndefined(x);
    };
    _.setdefault = function(obj, key, value) {
      if (_.has(obj, key)) {
        return obj[key];
      } else {
        obj[key] = value;
        return value;
      }
    };
    return {
      "monkey_patch": monkey_patch
    };
  });

}).call(this);

/*
//@ sourceMappingURL=custom.js.map
*/;
/*!
 * jQuery JavaScript Library v2.0.3
 * http://jquery.com/
 *
 * Includes Sizzle.js
 * http://sizzlejs.com/
 *
 * Copyright 2005, 2013 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2013-07-03T13:30Z
 */
(function( window, undefined ) {

// Can't do this because several apps including ASP.NET trace
// the stack via arguments.caller.callee and Firefox dies if
// you try to trace through "use strict" call chains. (#13335)
// Support: Firefox 18+
//
var
	// A central reference to the root jQuery(document)
	rootjQuery,

	// The deferred used on DOM ready
	readyList,

	// Support: IE9
	// For `typeof xmlNode.method` instead of `xmlNode.method !== undefined`
	core_strundefined = typeof undefined,

	// Use the correct document accordingly with window argument (sandbox)
	location = window.location,
	document = window.document,
	docElem = document.documentElement,

	// Map over jQuery in case of overwrite
	_jQuery = window.jQuery,

	// Map over the $ in case of overwrite
	_$ = window.$,

	// [[Class]] -> type pairs
	class2type = {},

	// List of deleted data cache ids, so we can reuse them
	core_deletedIds = [],

	core_version = "2.0.3",

	// Save a reference to some core methods
	core_concat = core_deletedIds.concat,
	core_push = core_deletedIds.push,
	core_slice = core_deletedIds.slice,
	core_indexOf = core_deletedIds.indexOf,
	core_toString = class2type.toString,
	core_hasOwn = class2type.hasOwnProperty,
	core_trim = core_version.trim,

	// Define a local copy of jQuery
	jQuery = function( selector, context ) {
		// The jQuery object is actually just the init constructor 'enhanced'
		return new jQuery.fn.init( selector, context, rootjQuery );
	},

	// Used for matching numbers
	core_pnum = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,

	// Used for splitting on whitespace
	core_rnotwhite = /\S+/g,

	// A simple way to check for HTML strings
	// Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
	// Strict HTML recognition (#11290: must start with <)
	rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,

	// Match a standalone tag
	rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,

	// Matches dashed string for camelizing
	rmsPrefix = /^-ms-/,
	rdashAlpha = /-([\da-z])/gi,

	// Used by jQuery.camelCase as callback to replace()
	fcamelCase = function( all, letter ) {
		return letter.toUpperCase();
	},

	// The ready event handler and self cleanup method
	completed = function() {
		document.removeEventListener( "DOMContentLoaded", completed, false );
		window.removeEventListener( "load", completed, false );
		jQuery.ready();
	};

jQuery.fn = jQuery.prototype = {
	// The current version of jQuery being used
	jquery: core_version,

	constructor: jQuery,
	init: function( selector, context, rootjQuery ) {
		var match, elem;

		// HANDLE: $(""), $(null), $(undefined), $(false)
		if ( !selector ) {
			return this;
		}

		// Handle HTML strings
		if ( typeof selector === "string" ) {
			if ( selector.charAt(0) === "<" && selector.charAt( selector.length - 1 ) === ">" && selector.length >= 3 ) {
				// Assume that strings that start and end with <> are HTML and skip the regex check
				match = [ null, selector, null ];

			} else {
				match = rquickExpr.exec( selector );
			}

			// Match html or make sure no context is specified for #id
			if ( match && (match[1] || !context) ) {

				// HANDLE: $(html) -> $(array)
				if ( match[1] ) {
					context = context instanceof jQuery ? context[0] : context;

					// scripts is true for back-compat
					jQuery.merge( this, jQuery.parseHTML(
						match[1],
						context && context.nodeType ? context.ownerDocument || context : document,
						true
					) );

					// HANDLE: $(html, props)
					if ( rsingleTag.test( match[1] ) && jQuery.isPlainObject( context ) ) {
						for ( match in context ) {
							// Properties of context are called as methods if possible
							if ( jQuery.isFunction( this[ match ] ) ) {
								this[ match ]( context[ match ] );

							// ...and otherwise set as attributes
							} else {
								this.attr( match, context[ match ] );
							}
						}
					}

					return this;

				// HANDLE: $(#id)
				} else {
					elem = document.getElementById( match[2] );

					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document #6963
					if ( elem && elem.parentNode ) {
						// Inject the element directly into the jQuery object
						this.length = 1;
						this[0] = elem;
					}

					this.context = document;
					this.selector = selector;
					return this;
				}

			// HANDLE: $(expr, $(...))
			} else if ( !context || context.jquery ) {
				return ( context || rootjQuery ).find( selector );

			// HANDLE: $(expr, context)
			// (which is just equivalent to: $(context).find(expr)
			} else {
				return this.constructor( context ).find( selector );
			}

		// HANDLE: $(DOMElement)
		} else if ( selector.nodeType ) {
			this.context = this[0] = selector;
			this.length = 1;
			return this;

		// HANDLE: $(function)
		// Shortcut for document ready
		} else if ( jQuery.isFunction( selector ) ) {
			return rootjQuery.ready( selector );
		}

		if ( selector.selector !== undefined ) {
			this.selector = selector.selector;
			this.context = selector.context;
		}

		return jQuery.makeArray( selector, this );
	},

	// Start with an empty selector
	selector: "",

	// The default length of a jQuery object is 0
	length: 0,

	toArray: function() {
		return core_slice.call( this );
	},

	// Get the Nth element in the matched element set OR
	// Get the whole matched element set as a clean array
	get: function( num ) {
		return num == null ?

			// Return a 'clean' array
			this.toArray() :

			// Return just the object
			( num < 0 ? this[ this.length + num ] : this[ num ] );
	},

	// Take an array of elements and push it onto the stack
	// (returning the new matched element set)
	pushStack: function( elems ) {

		// Build a new jQuery matched element set
		var ret = jQuery.merge( this.constructor(), elems );

		// Add the old object onto the stack (as a reference)
		ret.prevObject = this;
		ret.context = this.context;

		// Return the newly-formed element set
		return ret;
	},

	// Execute a callback for every element in the matched set.
	// (You can seed the arguments with an array of args, but this is
	// only used internally.)
	each: function( callback, args ) {
		return jQuery.each( this, callback, args );
	},

	ready: function( fn ) {
		// Add the callback
		jQuery.ready.promise().done( fn );

		return this;
	},

	slice: function() {
		return this.pushStack( core_slice.apply( this, arguments ) );
	},

	first: function() {
		return this.eq( 0 );
	},

	last: function() {
		return this.eq( -1 );
	},

	eq: function( i ) {
		var len = this.length,
			j = +i + ( i < 0 ? len : 0 );
		return this.pushStack( j >= 0 && j < len ? [ this[j] ] : [] );
	},

	map: function( callback ) {
		return this.pushStack( jQuery.map(this, function( elem, i ) {
			return callback.call( elem, i, elem );
		}));
	},

	end: function() {
		return this.prevObject || this.constructor(null);
	},

	// For internal use only.
	// Behaves like an Array's method, not like a jQuery method.
	push: core_push,
	sort: [].sort,
	splice: [].splice
};

// Give the init function the jQuery prototype for later instantiation
jQuery.fn.init.prototype = jQuery.fn;

jQuery.extend = jQuery.fn.extend = function() {
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[0] || {},
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
		target = {};
	}

	// extend jQuery itself if only one argument is passed
	if ( length === i ) {
		target = this;
		--i;
	}

	for ( ; i < length; i++ ) {
		// Only deal with non-null/undefined values
		if ( (options = arguments[ i ]) != null ) {
			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if ( deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)) ) ) {
					if ( copyIsArray ) {
						copyIsArray = false;
						clone = src && jQuery.isArray(src) ? src : [];

					} else {
						clone = src && jQuery.isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[ name ] = jQuery.extend( deep, clone, copy );

				// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};

jQuery.extend({
	// Unique for each copy of jQuery on the page
	expando: "jQuery" + ( core_version + Math.random() ).replace( /\D/g, "" ),

	noConflict: function( deep ) {
		if ( window.$ === jQuery ) {
			window.$ = _$;
		}

		if ( deep && window.jQuery === jQuery ) {
			window.jQuery = _jQuery;
		}

		return jQuery;
	},

	// Is the DOM ready to be used? Set to true once it occurs.
	isReady: false,

	// A counter to track how many items to wait for before
	// the ready event fires. See #6781
	readyWait: 1,

	// Hold (or release) the ready event
	holdReady: function( hold ) {
		if ( hold ) {
			jQuery.readyWait++;
		} else {
			jQuery.ready( true );
		}
	},

	// Handle when the DOM is ready
	ready: function( wait ) {

		// Abort if there are pending holds or we're already ready
		if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {
			return;
		}

		// Remember that the DOM is ready
		jQuery.isReady = true;

		// If a normal DOM Ready event fired, decrement, and wait if need be
		if ( wait !== true && --jQuery.readyWait > 0 ) {
			return;
		}

		// If there are functions bound, to execute
		readyList.resolveWith( document, [ jQuery ] );

		// Trigger any bound ready events
		if ( jQuery.fn.trigger ) {
			jQuery( document ).trigger("ready").off("ready");
		}
	},

	// See test/unit/core.js for details concerning isFunction.
	// Since version 1.3, DOM methods and functions like alert
	// aren't supported. They return false on IE (#2968).
	isFunction: function( obj ) {
		return jQuery.type(obj) === "function";
	},

	isArray: Array.isArray,

	isWindow: function( obj ) {
		return obj != null && obj === obj.window;
	},

	isNumeric: function( obj ) {
		return !isNaN( parseFloat(obj) ) && isFinite( obj );
	},

	type: function( obj ) {
		if ( obj == null ) {
			return String( obj );
		}
		// Support: Safari <= 5.1 (functionish RegExp)
		return typeof obj === "object" || typeof obj === "function" ?
			class2type[ core_toString.call(obj) ] || "object" :
			typeof obj;
	},

	isPlainObject: function( obj ) {
		// Not plain objects:
		// - Any object or value whose internal [[Class]] property is not "[object Object]"
		// - DOM nodes
		// - window
		if ( jQuery.type( obj ) !== "object" || obj.nodeType || jQuery.isWindow( obj ) ) {
			return false;
		}

		// Support: Firefox <20
		// The try/catch suppresses exceptions thrown when attempting to access
		// the "constructor" property of certain host objects, ie. |window.location|
		// https://bugzilla.mozilla.org/show_bug.cgi?id=814622
		try {
			if ( obj.constructor &&
					!core_hasOwn.call( obj.constructor.prototype, "isPrototypeOf" ) ) {
				return false;
			}
		} catch ( e ) {
			return false;
		}

		// If the function hasn't returned already, we're confident that
		// |obj| is a plain object, created by {} or constructed with new Object
		return true;
	},

	isEmptyObject: function( obj ) {
		var name;
		for ( name in obj ) {
			return false;
		}
		return true;
	},

	error: function( msg ) {
		throw new Error( msg );
	},

	// data: string of html
	// context (optional): If specified, the fragment will be created in this context, defaults to document
	// keepScripts (optional): If true, will include scripts passed in the html string
	parseHTML: function( data, context, keepScripts ) {
		if ( !data || typeof data !== "string" ) {
			return null;
		}
		if ( typeof context === "boolean" ) {
			keepScripts = context;
			context = false;
		}
		context = context || document;

		var parsed = rsingleTag.exec( data ),
			scripts = !keepScripts && [];

		// Single tag
		if ( parsed ) {
			return [ context.createElement( parsed[1] ) ];
		}

		parsed = jQuery.buildFragment( [ data ], context, scripts );

		if ( scripts ) {
			jQuery( scripts ).remove();
		}

		return jQuery.merge( [], parsed.childNodes );
	},

	parseJSON: JSON.parse,

	// Cross-browser xml parsing
	parseXML: function( data ) {
		var xml, tmp;
		if ( !data || typeof data !== "string" ) {
			return null;
		}

		// Support: IE9
		try {
			tmp = new DOMParser();
			xml = tmp.parseFromString( data , "text/xml" );
		} catch ( e ) {
			xml = undefined;
		}

		if ( !xml || xml.getElementsByTagName( "parsererror" ).length ) {
			jQuery.error( "Invalid XML: " + data );
		}
		return xml;
	},

	noop: function() {},

	// Evaluates a script in a global context
	globalEval: function( code ) {
		var script,
				indirect = eval;

		code = jQuery.trim( code );

		if ( code ) {
			// If the code includes a valid, prologue position
			// strict mode pragma, execute code by injecting a
			// script tag into the document.
			if ( code.indexOf("use strict") === 1 ) {
				script = document.createElement("script");
				script.text = code;
				document.head.appendChild( script ).parentNode.removeChild( script );
			} else {
			// Otherwise, avoid the DOM node creation, insertion
			// and removal by using an indirect global eval
				indirect( code );
			}
		}
	},

	// Convert dashed to camelCase; used by the css and data modules
	// Microsoft forgot to hump their vendor prefix (#9572)
	camelCase: function( string ) {
		return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
	},

	nodeName: function( elem, name ) {
		return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
	},

	// args is for internal usage only
	each: function( obj, callback, args ) {
		var value,
			i = 0,
			length = obj.length,
			isArray = isArraylike( obj );

		if ( args ) {
			if ( isArray ) {
				for ( ; i < length; i++ ) {
					value = callback.apply( obj[ i ], args );

					if ( value === false ) {
						break;
					}
				}
			} else {
				for ( i in obj ) {
					value = callback.apply( obj[ i ], args );

					if ( value === false ) {
						break;
					}
				}
			}

		// A special, fast, case for the most common use of each
		} else {
			if ( isArray ) {
				for ( ; i < length; i++ ) {
					value = callback.call( obj[ i ], i, obj[ i ] );

					if ( value === false ) {
						break;
					}
				}
			} else {
				for ( i in obj ) {
					value = callback.call( obj[ i ], i, obj[ i ] );

					if ( value === false ) {
						break;
					}
				}
			}
		}

		return obj;
	},

	trim: function( text ) {
		return text == null ? "" : core_trim.call( text );
	},

	// results is for internal usage only
	makeArray: function( arr, results ) {
		var ret = results || [];

		if ( arr != null ) {
			if ( isArraylike( Object(arr) ) ) {
				jQuery.merge( ret,
					typeof arr === "string" ?
					[ arr ] : arr
				);
			} else {
				core_push.call( ret, arr );
			}
		}

		return ret;
	},

	inArray: function( elem, arr, i ) {
		return arr == null ? -1 : core_indexOf.call( arr, elem, i );
	},

	merge: function( first, second ) {
		var l = second.length,
			i = first.length,
			j = 0;

		if ( typeof l === "number" ) {
			for ( ; j < l; j++ ) {
				first[ i++ ] = second[ j ];
			}
		} else {
			while ( second[j] !== undefined ) {
				first[ i++ ] = second[ j++ ];
			}
		}

		first.length = i;

		return first;
	},

	grep: function( elems, callback, inv ) {
		var retVal,
			ret = [],
			i = 0,
			length = elems.length;
		inv = !!inv;

		// Go through the array, only saving the items
		// that pass the validator function
		for ( ; i < length; i++ ) {
			retVal = !!callback( elems[ i ], i );
			if ( inv !== retVal ) {
				ret.push( elems[ i ] );
			}
		}

		return ret;
	},

	// arg is for internal usage only
	map: function( elems, callback, arg ) {
		var value,
			i = 0,
			length = elems.length,
			isArray = isArraylike( elems ),
			ret = [];

		// Go through the array, translating each of the items to their
		if ( isArray ) {
			for ( ; i < length; i++ ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret[ ret.length ] = value;
				}
			}

		// Go through every key on the object,
		} else {
			for ( i in elems ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret[ ret.length ] = value;
				}
			}
		}

		// Flatten any nested arrays
		return core_concat.apply( [], ret );
	},

	// A global GUID counter for objects
	guid: 1,

	// Bind a function to a context, optionally partially applying any
	// arguments.
	proxy: function( fn, context ) {
		var tmp, args, proxy;

		if ( typeof context === "string" ) {
			tmp = fn[ context ];
			context = fn;
			fn = tmp;
		}

		// Quick check to determine if target is callable, in the spec
		// this throws a TypeError, but we will just return undefined.
		if ( !jQuery.isFunction( fn ) ) {
			return undefined;
		}

		// Simulated bind
		args = core_slice.call( arguments, 2 );
		proxy = function() {
			return fn.apply( context || this, args.concat( core_slice.call( arguments ) ) );
		};

		// Set the guid of unique handler to the same of original handler, so it can be removed
		proxy.guid = fn.guid = fn.guid || jQuery.guid++;

		return proxy;
	},

	// Multifunctional method to get and set values of a collection
	// The value/s can optionally be executed if it's a function
	access: function( elems, fn, key, value, chainable, emptyGet, raw ) {
		var i = 0,
			length = elems.length,
			bulk = key == null;

		// Sets many values
		if ( jQuery.type( key ) === "object" ) {
			chainable = true;
			for ( i in key ) {
				jQuery.access( elems, fn, i, key[i], true, emptyGet, raw );
			}

		// Sets one value
		} else if ( value !== undefined ) {
			chainable = true;

			if ( !jQuery.isFunction( value ) ) {
				raw = true;
			}

			if ( bulk ) {
				// Bulk operations run against the entire set
				if ( raw ) {
					fn.call( elems, value );
					fn = null;

				// ...except when executing function values
				} else {
					bulk = fn;
					fn = function( elem, key, value ) {
						return bulk.call( jQuery( elem ), value );
					};
				}
			}

			if ( fn ) {
				for ( ; i < length; i++ ) {
					fn( elems[i], key, raw ? value : value.call( elems[i], i, fn( elems[i], key ) ) );
				}
			}
		}

		return chainable ?
			elems :

			// Gets
			bulk ?
				fn.call( elems ) :
				length ? fn( elems[0], key ) : emptyGet;
	},

	now: Date.now,

	// A method for quickly swapping in/out CSS properties to get correct calculations.
	// Note: this method belongs to the css module but it's needed here for the support module.
	// If support gets modularized, this method should be moved back to the css module.
	swap: function( elem, options, callback, args ) {
		var ret, name,
			old = {};

		// Remember the old values, and insert the new ones
		for ( name in options ) {
			old[ name ] = elem.style[ name ];
			elem.style[ name ] = options[ name ];
		}

		ret = callback.apply( elem, args || [] );

		// Revert the old values
		for ( name in options ) {
			elem.style[ name ] = old[ name ];
		}

		return ret;
	}
});

jQuery.ready.promise = function( obj ) {
	if ( !readyList ) {

		readyList = jQuery.Deferred();

		// Catch cases where $(document).ready() is called after the browser event has already occurred.
		// we once tried to use readyState "interactive" here, but it caused issues like the one
		// discovered by ChrisS here: http://bugs.jquery.com/ticket/12282#comment:15
		if ( document.readyState === "complete" ) {
			// Handle it asynchronously to allow scripts the opportunity to delay ready
			setTimeout( jQuery.ready );

		} else {

			// Use the handy event callback
			document.addEventListener( "DOMContentLoaded", completed, false );

			// A fallback to window.onload, that will always work
			window.addEventListener( "load", completed, false );
		}
	}
	return readyList.promise( obj );
};

// Populate the class2type map
jQuery.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
	class2type[ "[object " + name + "]" ] = name.toLowerCase();
});

function isArraylike( obj ) {
	var length = obj.length,
		type = jQuery.type( obj );

	if ( jQuery.isWindow( obj ) ) {
		return false;
	}

	if ( obj.nodeType === 1 && length ) {
		return true;
	}

	return type === "array" || type !== "function" &&
		( length === 0 ||
		typeof length === "number" && length > 0 && ( length - 1 ) in obj );
}

// All jQuery objects should point back to these
rootjQuery = jQuery(document);
/*!
 * Sizzle CSS Selector Engine v1.9.4-pre
 * http://sizzlejs.com/
 *
 * Copyright 2013 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2013-06-03
 */
(function( window, undefined ) {

var i,
	support,
	cachedruns,
	Expr,
	getText,
	isXML,
	compile,
	outermostContext,
	sortInput,

	// Local document vars
	setDocument,
	document,
	docElem,
	documentIsHTML,
	rbuggyQSA,
	rbuggyMatches,
	matches,
	contains,

	// Instance-specific data
	expando = "sizzle" + -(new Date()),
	preferredDoc = window.document,
	dirruns = 0,
	done = 0,
	classCache = createCache(),
	tokenCache = createCache(),
	compilerCache = createCache(),
	hasDuplicate = false,
	sortOrder = function( a, b ) {
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}
		return 0;
	},

	// General-purpose constants
	strundefined = typeof undefined,
	MAX_NEGATIVE = 1 << 31,

	// Instance methods
	hasOwn = ({}).hasOwnProperty,
	arr = [],
	pop = arr.pop,
	push_native = arr.push,
	push = arr.push,
	slice = arr.slice,
	// Use a stripped-down indexOf if we can't use a native one
	indexOf = arr.indexOf || function( elem ) {
		var i = 0,
			len = this.length;
		for ( ; i < len; i++ ) {
			if ( this[i] === elem ) {
				return i;
			}
		}
		return -1;
	},

	booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",

	// Regular expressions

	// Whitespace characters http://www.w3.org/TR/css3-selectors/#whitespace
	whitespace = "[\\x20\\t\\r\\n\\f]",
	// http://www.w3.org/TR/css3-syntax/#characters
	characterEncoding = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",

	// Loosely modeled on CSS identifier characters
	// An unquoted value should be a CSS identifier http://www.w3.org/TR/css3-selectors/#attribute-selectors
	// Proper syntax: http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
	identifier = characterEncoding.replace( "w", "w#" ),

	// Acceptable operators http://www.w3.org/TR/selectors/#attribute-selectors
	attributes = "\\[" + whitespace + "*(" + characterEncoding + ")" + whitespace +
		"*(?:([*^$|!~]?=)" + whitespace + "*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|(" + identifier + ")|)|)" + whitespace + "*\\]",

	// Prefer arguments quoted,
	//   then not containing pseudos/brackets,
	//   then attribute selectors/non-parenthetical expressions,
	//   then anything else
	// These preferences are here to reduce the number of selectors
	//   needing tokenize in the PSEUDO preFilter
	pseudos = ":(" + characterEncoding + ")(?:\\(((['\"])((?:\\\\.|[^\\\\])*?)\\3|((?:\\\\.|[^\\\\()[\\]]|" + attributes.replace( 3, 8 ) + ")*)|.*)\\)|)",

	// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
	rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

	rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
	rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*" ),

	rsibling = new RegExp( whitespace + "*[+~]" ),
	rattributeQuotes = new RegExp( "=" + whitespace + "*([^\\]'\"]*)" + whitespace + "*\\]", "g" ),

	rpseudo = new RegExp( pseudos ),
	ridentifier = new RegExp( "^" + identifier + "$" ),

	matchExpr = {
		"ID": new RegExp( "^#(" + characterEncoding + ")" ),
		"CLASS": new RegExp( "^\\.(" + characterEncoding + ")" ),
		"TAG": new RegExp( "^(" + characterEncoding.replace( "w", "w*" ) + ")" ),
		"ATTR": new RegExp( "^" + attributes ),
		"PSEUDO": new RegExp( "^" + pseudos ),
		"CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
			"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
			"*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
		"bool": new RegExp( "^(?:" + booleans + ")$", "i" ),
		// For use in libraries implementing .is()
		// We use this for POS matching in `select`
		"needsContext": new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
			whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
	},

	rnative = /^[^{]+\{\s*\[native \w/,

	// Easily-parseable/retrievable ID or TAG or CLASS selectors
	rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

	rinputs = /^(?:input|select|textarea|button)$/i,
	rheader = /^h\d$/i,

	rescape = /'|\\/g,

	// CSS escapes http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
	runescape = new RegExp( "\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig" ),
	funescape = function( _, escaped, escapedWhitespace ) {
		var high = "0x" + escaped - 0x10000;
		// NaN means non-codepoint
		// Support: Firefox
		// Workaround erroneous numeric interpretation of +"0x"
		return high !== high || escapedWhitespace ?
			escaped :
			// BMP codepoint
			high < 0 ?
				String.fromCharCode( high + 0x10000 ) :
				// Supplemental Plane codepoint (surrogate pair)
				String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
	};

// Optimize for push.apply( _, NodeList )
try {
	push.apply(
		(arr = slice.call( preferredDoc.childNodes )),
		preferredDoc.childNodes
	);
	// Support: Android<4.0
	// Detect silently failing push.apply
	arr[ preferredDoc.childNodes.length ].nodeType;
} catch ( e ) {
	push = { apply: arr.length ?

		// Leverage slice if possible
		function( target, els ) {
			push_native.apply( target, slice.call(els) );
		} :

		// Support: IE<9
		// Otherwise append directly
		function( target, els ) {
			var j = target.length,
				i = 0;
			// Can't trust NodeList.length
			while ( (target[j++] = els[i++]) ) {}
			target.length = j - 1;
		}
	};
}

function Sizzle( selector, context, results, seed ) {
	var match, elem, m, nodeType,
		// QSA vars
		i, groups, old, nid, newContext, newSelector;

	if ( ( context ? context.ownerDocument || context : preferredDoc ) !== document ) {
		setDocument( context );
	}

	context = context || document;
	results = results || [];

	if ( !selector || typeof selector !== "string" ) {
		return results;
	}

	if ( (nodeType = context.nodeType) !== 1 && nodeType !== 9 ) {
		return [];
	}

	if ( documentIsHTML && !seed ) {

		// Shortcuts
		if ( (match = rquickExpr.exec( selector )) ) {
			// Speed-up: Sizzle("#ID")
			if ( (m = match[1]) ) {
				if ( nodeType === 9 ) {
					elem = context.getElementById( m );
					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document #6963
					if ( elem && elem.parentNode ) {
						// Handle the case where IE, Opera, and Webkit return items
						// by name instead of ID
						if ( elem.id === m ) {
							results.push( elem );
							return results;
						}
					} else {
						return results;
					}
				} else {
					// Context is not a document
					if ( context.ownerDocument && (elem = context.ownerDocument.getElementById( m )) &&
						contains( context, elem ) && elem.id === m ) {
						results.push( elem );
						return results;
					}
				}

			// Speed-up: Sizzle("TAG")
			} else if ( match[2] ) {
				push.apply( results, context.getElementsByTagName( selector ) );
				return results;

			// Speed-up: Sizzle(".CLASS")
			} else if ( (m = match[3]) && support.getElementsByClassName && context.getElementsByClassName ) {
				push.apply( results, context.getElementsByClassName( m ) );
				return results;
			}
		}

		// QSA path
		if ( support.qsa && (!rbuggyQSA || !rbuggyQSA.test( selector )) ) {
			nid = old = expando;
			newContext = context;
			newSelector = nodeType === 9 && selector;

			// qSA works strangely on Element-rooted queries
			// We can work around this by specifying an extra ID on the root
			// and working up from there (Thanks to Andrew Dupont for the technique)
			// IE 8 doesn't work on object elements
			if ( nodeType === 1 && context.nodeName.toLowerCase() !== "object" ) {
				groups = tokenize( selector );

				if ( (old = context.getAttribute("id")) ) {
					nid = old.replace( rescape, "\\$&" );
				} else {
					context.setAttribute( "id", nid );
				}
				nid = "[id='" + nid + "'] ";

				i = groups.length;
				while ( i-- ) {
					groups[i] = nid + toSelector( groups[i] );
				}
				newContext = rsibling.test( selector ) && context.parentNode || context;
				newSelector = groups.join(",");
			}

			if ( newSelector ) {
				try {
					push.apply( results,
						newContext.querySelectorAll( newSelector )
					);
					return results;
				} catch(qsaError) {
				} finally {
					if ( !old ) {
						context.removeAttribute("id");
					}
				}
			}
		}
	}

	// All others
	return select( selector.replace( rtrim, "$1" ), context, results, seed );
}

/**
 * Create key-value caches of limited size
 * @returns {Function(string, Object)} Returns the Object data after storing it on itself with
 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
 *	deleting the oldest entry
 */
function createCache() {
	var keys = [];

	function cache( key, value ) {
		// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
		if ( keys.push( key += " " ) > Expr.cacheLength ) {
			// Only keep the most recent entries
			delete cache[ keys.shift() ];
		}
		return (cache[ key ] = value);
	}
	return cache;
}

/**
 * Mark a function for special use by Sizzle
 * @param {Function} fn The function to mark
 */
function markFunction( fn ) {
	fn[ expando ] = true;
	return fn;
}

/**
 * Support testing using an element
 * @param {Function} fn Passed the created div and expects a boolean result
 */
function assert( fn ) {
	var div = document.createElement("div");

	try {
		return !!fn( div );
	} catch (e) {
		return false;
	} finally {
		// Remove from its parent by default
		if ( div.parentNode ) {
			div.parentNode.removeChild( div );
		}
		// release memory in IE
		div = null;
	}
}

/**
 * Adds the same handler for all of the specified attrs
 * @param {String} attrs Pipe-separated list of attributes
 * @param {Function} handler The method that will be applied
 */
function addHandle( attrs, handler ) {
	var arr = attrs.split("|"),
		i = attrs.length;

	while ( i-- ) {
		Expr.attrHandle[ arr[i] ] = handler;
	}
}

/**
 * Checks document order of two siblings
 * @param {Element} a
 * @param {Element} b
 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
 */
function siblingCheck( a, b ) {
	var cur = b && a,
		diff = cur && a.nodeType === 1 && b.nodeType === 1 &&
			( ~b.sourceIndex || MAX_NEGATIVE ) -
			( ~a.sourceIndex || MAX_NEGATIVE );

	// Use IE sourceIndex if available on both nodes
	if ( diff ) {
		return diff;
	}

	// Check if b follows a
	if ( cur ) {
		while ( (cur = cur.nextSibling) ) {
			if ( cur === b ) {
				return -1;
			}
		}
	}

	return a ? 1 : -1;
}

/**
 * Returns a function to use in pseudos for input types
 * @param {String} type
 */
function createInputPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return name === "input" && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for buttons
 * @param {String} type
 */
function createButtonPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return (name === "input" || name === "button") && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for positionals
 * @param {Function} fn
 */
function createPositionalPseudo( fn ) {
	return markFunction(function( argument ) {
		argument = +argument;
		return markFunction(function( seed, matches ) {
			var j,
				matchIndexes = fn( [], seed.length, argument ),
				i = matchIndexes.length;

			// Match elements found at the specified indexes
			while ( i-- ) {
				if ( seed[ (j = matchIndexes[i]) ] ) {
					seed[j] = !(matches[j] = seed[j]);
				}
			}
		});
	});
}

/**
 * Detect xml
 * @param {Element|Object} elem An element or a document
 */
isXML = Sizzle.isXML = function( elem ) {
	// documentElement is verified for cases where it doesn't yet exist
	// (such as loading iframes in IE - #4833)
	var documentElement = elem && (elem.ownerDocument || elem).documentElement;
	return documentElement ? documentElement.nodeName !== "HTML" : false;
};

// Expose support vars for convenience
support = Sizzle.support = {};

/**
 * Sets document-related variables once based on the current document
 * @param {Element|Object} [doc] An element or document object to use to set the document
 * @returns {Object} Returns the current document
 */
setDocument = Sizzle.setDocument = function( node ) {
	var doc = node ? node.ownerDocument || node : preferredDoc,
		parent = doc.defaultView;

	// If no document and documentElement is available, return
	if ( doc === document || doc.nodeType !== 9 || !doc.documentElement ) {
		return document;
	}

	// Set our document
	document = doc;
	docElem = doc.documentElement;

	// Support tests
	documentIsHTML = !isXML( doc );

	// Support: IE>8
	// If iframe document is assigned to "document" variable and if iframe has been reloaded,
	// IE will throw "permission denied" error when accessing "document" variable, see jQuery #13936
	// IE6-8 do not support the defaultView property so parent will be undefined
	if ( parent && parent.attachEvent && parent !== parent.top ) {
		parent.attachEvent( "onbeforeunload", function() {
			setDocument();
		});
	}

	/* Attributes
	---------------------------------------------------------------------- */

	// Support: IE<8
	// Verify that getAttribute really returns attributes and not properties (excepting IE8 booleans)
	support.attributes = assert(function( div ) {
		div.className = "i";
		return !div.getAttribute("className");
	});

	/* getElement(s)By*
	---------------------------------------------------------------------- */

	// Check if getElementsByTagName("*") returns only elements
	support.getElementsByTagName = assert(function( div ) {
		div.appendChild( doc.createComment("") );
		return !div.getElementsByTagName("*").length;
	});

	// Check if getElementsByClassName can be trusted
	support.getElementsByClassName = assert(function( div ) {
		div.innerHTML = "<div class='a'></div><div class='a i'></div>";

		// Support: Safari<4
		// Catch class over-caching
		div.firstChild.className = "i";
		// Support: Opera<10
		// Catch gEBCN failure to find non-leading classes
		return div.getElementsByClassName("i").length === 2;
	});

	// Support: IE<10
	// Check if getElementById returns elements by name
	// The broken getElementById methods don't pick up programatically-set names,
	// so use a roundabout getElementsByName test
	support.getById = assert(function( div ) {
		docElem.appendChild( div ).id = expando;
		return !doc.getElementsByName || !doc.getElementsByName( expando ).length;
	});

	// ID find and filter
	if ( support.getById ) {
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== strundefined && documentIsHTML ) {
				var m = context.getElementById( id );
				// Check parentNode to catch when Blackberry 4.6 returns
				// nodes that are no longer in the document #6963
				return m && m.parentNode ? [m] : [];
			}
		};
		Expr.filter["ID"] = function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				return elem.getAttribute("id") === attrId;
			};
		};
	} else {
		// Support: IE6/7
		// getElementById is not reliable as a find shortcut
		delete Expr.find["ID"];

		Expr.filter["ID"] =  function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				var node = typeof elem.getAttributeNode !== strundefined && elem.getAttributeNode("id");
				return node && node.value === attrId;
			};
		};
	}

	// Tag
	Expr.find["TAG"] = support.getElementsByTagName ?
		function( tag, context ) {
			if ( typeof context.getElementsByTagName !== strundefined ) {
				return context.getElementsByTagName( tag );
			}
		} :
		function( tag, context ) {
			var elem,
				tmp = [],
				i = 0,
				results = context.getElementsByTagName( tag );

			// Filter out possible comments
			if ( tag === "*" ) {
				while ( (elem = results[i++]) ) {
					if ( elem.nodeType === 1 ) {
						tmp.push( elem );
					}
				}

				return tmp;
			}
			return results;
		};

	// Class
	Expr.find["CLASS"] = support.getElementsByClassName && function( className, context ) {
		if ( typeof context.getElementsByClassName !== strundefined && documentIsHTML ) {
			return context.getElementsByClassName( className );
		}
	};

	/* QSA/matchesSelector
	---------------------------------------------------------------------- */

	// QSA and matchesSelector support

	// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
	rbuggyMatches = [];

	// qSa(:focus) reports false when true (Chrome 21)
	// We allow this because of a bug in IE8/9 that throws an error
	// whenever `document.activeElement` is accessed on an iframe
	// So, we allow :focus to pass through QSA all the time to avoid the IE error
	// See http://bugs.jquery.com/ticket/13378
	rbuggyQSA = [];

	if ( (support.qsa = rnative.test( doc.querySelectorAll )) ) {
		// Build QSA regex
		// Regex strategy adopted from Diego Perini
		assert(function( div ) {
			// Select is set to empty string on purpose
			// This is to test IE's treatment of not explicitly
			// setting a boolean content attribute,
			// since its presence should be enough
			// http://bugs.jquery.com/ticket/12359
			div.innerHTML = "<select><option selected=''></option></select>";

			// Support: IE8
			// Boolean attributes and "value" are not treated correctly
			if ( !div.querySelectorAll("[selected]").length ) {
				rbuggyQSA.push( "\\[" + whitespace + "*(?:value|" + booleans + ")" );
			}

			// Webkit/Opera - :checked should return selected option elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			// IE8 throws error here and will not see later tests
			if ( !div.querySelectorAll(":checked").length ) {
				rbuggyQSA.push(":checked");
			}
		});

		assert(function( div ) {

			// Support: Opera 10-12/IE8
			// ^= $= *= and empty values
			// Should not select anything
			// Support: Windows 8 Native Apps
			// The type attribute is restricted during .innerHTML assignment
			var input = doc.createElement("input");
			input.setAttribute( "type", "hidden" );
			div.appendChild( input ).setAttribute( "t", "" );

			if ( div.querySelectorAll("[t^='']").length ) {
				rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:''|\"\")" );
			}

			// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
			// IE8 throws error here and will not see later tests
			if ( !div.querySelectorAll(":enabled").length ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Opera 10-11 does not throw on post-comma invalid pseudos
			div.querySelectorAll("*,:x");
			rbuggyQSA.push(",.*:");
		});
	}

	if ( (support.matchesSelector = rnative.test( (matches = docElem.webkitMatchesSelector ||
		docElem.mozMatchesSelector ||
		docElem.oMatchesSelector ||
		docElem.msMatchesSelector) )) ) {

		assert(function( div ) {
			// Check to see if it's possible to do matchesSelector
			// on a disconnected node (IE 9)
			support.disconnectedMatch = matches.call( div, "div" );

			// This should fail with an exception
			// Gecko does not error, returns false instead
			matches.call( div, "[s!='']:x" );
			rbuggyMatches.push( "!=", pseudos );
		});
	}

	rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join("|") );
	rbuggyMatches = rbuggyMatches.length && new RegExp( rbuggyMatches.join("|") );

	/* Contains
	---------------------------------------------------------------------- */

	// Element contains another
	// Purposefully does not implement inclusive descendent
	// As in, an element does not contain itself
	contains = rnative.test( docElem.contains ) || docElem.compareDocumentPosition ?
		function( a, b ) {
			var adown = a.nodeType === 9 ? a.documentElement : a,
				bup = b && b.parentNode;
			return a === bup || !!( bup && bup.nodeType === 1 && (
				adown.contains ?
					adown.contains( bup ) :
					a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
			));
		} :
		function( a, b ) {
			if ( b ) {
				while ( (b = b.parentNode) ) {
					if ( b === a ) {
						return true;
					}
				}
			}
			return false;
		};

	/* Sorting
	---------------------------------------------------------------------- */

	// Document order sorting
	sortOrder = docElem.compareDocumentPosition ?
	function( a, b ) {

		// Flag for duplicate removal
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		var compare = b.compareDocumentPosition && a.compareDocumentPosition && a.compareDocumentPosition( b );

		if ( compare ) {
			// Disconnected nodes
			if ( compare & 1 ||
				(!support.sortDetached && b.compareDocumentPosition( a ) === compare) ) {

				// Choose the first element that is related to our preferred document
				if ( a === doc || contains(preferredDoc, a) ) {
					return -1;
				}
				if ( b === doc || contains(preferredDoc, b) ) {
					return 1;
				}

				// Maintain original order
				return sortInput ?
					( indexOf.call( sortInput, a ) - indexOf.call( sortInput, b ) ) :
					0;
			}

			return compare & 4 ? -1 : 1;
		}

		// Not directly comparable, sort on existence of method
		return a.compareDocumentPosition ? -1 : 1;
	} :
	function( a, b ) {
		var cur,
			i = 0,
			aup = a.parentNode,
			bup = b.parentNode,
			ap = [ a ],
			bp = [ b ];

		// Exit early if the nodes are identical
		if ( a === b ) {
			hasDuplicate = true;
			return 0;

		// Parentless nodes are either documents or disconnected
		} else if ( !aup || !bup ) {
			return a === doc ? -1 :
				b === doc ? 1 :
				aup ? -1 :
				bup ? 1 :
				sortInput ?
				( indexOf.call( sortInput, a ) - indexOf.call( sortInput, b ) ) :
				0;

		// If the nodes are siblings, we can do a quick check
		} else if ( aup === bup ) {
			return siblingCheck( a, b );
		}

		// Otherwise we need full lists of their ancestors for comparison
		cur = a;
		while ( (cur = cur.parentNode) ) {
			ap.unshift( cur );
		}
		cur = b;
		while ( (cur = cur.parentNode) ) {
			bp.unshift( cur );
		}

		// Walk down the tree looking for a discrepancy
		while ( ap[i] === bp[i] ) {
			i++;
		}

		return i ?
			// Do a sibling check if the nodes have a common ancestor
			siblingCheck( ap[i], bp[i] ) :

			// Otherwise nodes in our document sort first
			ap[i] === preferredDoc ? -1 :
			bp[i] === preferredDoc ? 1 :
			0;
	};

	return doc;
};

Sizzle.matches = function( expr, elements ) {
	return Sizzle( expr, null, null, elements );
};

Sizzle.matchesSelector = function( elem, expr ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	// Make sure that attribute selectors are quoted
	expr = expr.replace( rattributeQuotes, "='$1']" );

	if ( support.matchesSelector && documentIsHTML &&
		( !rbuggyMatches || !rbuggyMatches.test( expr ) ) &&
		( !rbuggyQSA     || !rbuggyQSA.test( expr ) ) ) {

		try {
			var ret = matches.call( elem, expr );

			// IE 9's matchesSelector returns false on disconnected nodes
			if ( ret || support.disconnectedMatch ||
					// As well, disconnected nodes are said to be in a document
					// fragment in IE 9
					elem.document && elem.document.nodeType !== 11 ) {
				return ret;
			}
		} catch(e) {}
	}

	return Sizzle( expr, document, null, [elem] ).length > 0;
};

Sizzle.contains = function( context, elem ) {
	// Set document vars if needed
	if ( ( context.ownerDocument || context ) !== document ) {
		setDocument( context );
	}
	return contains( context, elem );
};

Sizzle.attr = function( elem, name ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	var fn = Expr.attrHandle[ name.toLowerCase() ],
		// Don't get fooled by Object.prototype properties (jQuery #13807)
		val = fn && hasOwn.call( Expr.attrHandle, name.toLowerCase() ) ?
			fn( elem, name, !documentIsHTML ) :
			undefined;

	return val === undefined ?
		support.attributes || !documentIsHTML ?
			elem.getAttribute( name ) :
			(val = elem.getAttributeNode(name)) && val.specified ?
				val.value :
				null :
		val;
};

Sizzle.error = function( msg ) {
	throw new Error( "Syntax error, unrecognized expression: " + msg );
};

/**
 * Document sorting and removing duplicates
 * @param {ArrayLike} results
 */
Sizzle.uniqueSort = function( results ) {
	var elem,
		duplicates = [],
		j = 0,
		i = 0;

	// Unless we *know* we can detect duplicates, assume their presence
	hasDuplicate = !support.detectDuplicates;
	sortInput = !support.sortStable && results.slice( 0 );
	results.sort( sortOrder );

	if ( hasDuplicate ) {
		while ( (elem = results[i++]) ) {
			if ( elem === results[ i ] ) {
				j = duplicates.push( i );
			}
		}
		while ( j-- ) {
			results.splice( duplicates[ j ], 1 );
		}
	}

	return results;
};

/**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
getText = Sizzle.getText = function( elem ) {
	var node,
		ret = "",
		i = 0,
		nodeType = elem.nodeType;

	if ( !nodeType ) {
		// If no nodeType, this is expected to be an array
		for ( ; (node = elem[i]); i++ ) {
			// Do not traverse comment nodes
			ret += getText( node );
		}
	} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
		// Use textContent for elements
		// innerText usage removed for consistency of new lines (see #11153)
		if ( typeof elem.textContent === "string" ) {
			return elem.textContent;
		} else {
			// Traverse its children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				ret += getText( elem );
			}
		}
	} else if ( nodeType === 3 || nodeType === 4 ) {
		return elem.nodeValue;
	}
	// Do not include comment or processing instruction nodes

	return ret;
};

Expr = Sizzle.selectors = {

	// Can be adjusted by the user
	cacheLength: 50,

	createPseudo: markFunction,

	match: matchExpr,

	attrHandle: {},

	find: {},

	relative: {
		">": { dir: "parentNode", first: true },
		" ": { dir: "parentNode" },
		"+": { dir: "previousSibling", first: true },
		"~": { dir: "previousSibling" }
	},

	preFilter: {
		"ATTR": function( match ) {
			match[1] = match[1].replace( runescape, funescape );

			// Move the given value to match[3] whether quoted or unquoted
			match[3] = ( match[4] || match[5] || "" ).replace( runescape, funescape );

			if ( match[2] === "~=" ) {
				match[3] = " " + match[3] + " ";
			}

			return match.slice( 0, 4 );
		},

		"CHILD": function( match ) {
			/* matches from matchExpr["CHILD"]
				1 type (only|nth|...)
				2 what (child|of-type)
				3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
				4 xn-component of xn+y argument ([+-]?\d*n|)
				5 sign of xn-component
				6 x of xn-component
				7 sign of y-component
				8 y of y-component
			*/
			match[1] = match[1].toLowerCase();

			if ( match[1].slice( 0, 3 ) === "nth" ) {
				// nth-* requires argument
				if ( !match[3] ) {
					Sizzle.error( match[0] );
				}

				// numeric x and y parameters for Expr.filter.CHILD
				// remember that false/true cast respectively to 0/1
				match[4] = +( match[4] ? match[5] + (match[6] || 1) : 2 * ( match[3] === "even" || match[3] === "odd" ) );
				match[5] = +( ( match[7] + match[8] ) || match[3] === "odd" );

			// other types prohibit arguments
			} else if ( match[3] ) {
				Sizzle.error( match[0] );
			}

			return match;
		},

		"PSEUDO": function( match ) {
			var excess,
				unquoted = !match[5] && match[2];

			if ( matchExpr["CHILD"].test( match[0] ) ) {
				return null;
			}

			// Accept quoted arguments as-is
			if ( match[3] && match[4] !== undefined ) {
				match[2] = match[4];

			// Strip excess characters from unquoted arguments
			} else if ( unquoted && rpseudo.test( unquoted ) &&
				// Get excess from tokenize (recursively)
				(excess = tokenize( unquoted, true )) &&
				// advance to the next closing parenthesis
				(excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {

				// excess is a negative index
				match[0] = match[0].slice( 0, excess );
				match[2] = unquoted.slice( 0, excess );
			}

			// Return only captures needed by the pseudo filter method (type and argument)
			return match.slice( 0, 3 );
		}
	},

	filter: {

		"TAG": function( nodeNameSelector ) {
			var nodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
			return nodeNameSelector === "*" ?
				function() { return true; } :
				function( elem ) {
					return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
				};
		},

		"CLASS": function( className ) {
			var pattern = classCache[ className + " " ];

			return pattern ||
				(pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )) &&
				classCache( className, function( elem ) {
					return pattern.test( typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== strundefined && elem.getAttribute("class") || "" );
				});
		},

		"ATTR": function( name, operator, check ) {
			return function( elem ) {
				var result = Sizzle.attr( elem, name );

				if ( result == null ) {
					return operator === "!=";
				}
				if ( !operator ) {
					return true;
				}

				result += "";

				return operator === "=" ? result === check :
					operator === "!=" ? result !== check :
					operator === "^=" ? check && result.indexOf( check ) === 0 :
					operator === "*=" ? check && result.indexOf( check ) > -1 :
					operator === "$=" ? check && result.slice( -check.length ) === check :
					operator === "~=" ? ( " " + result + " " ).indexOf( check ) > -1 :
					operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
					false;
			};
		},

		"CHILD": function( type, what, argument, first, last ) {
			var simple = type.slice( 0, 3 ) !== "nth",
				forward = type.slice( -4 ) !== "last",
				ofType = what === "of-type";

			return first === 1 && last === 0 ?

				// Shortcut for :nth-*(n)
				function( elem ) {
					return !!elem.parentNode;
				} :

				function( elem, context, xml ) {
					var cache, outerCache, node, diff, nodeIndex, start,
						dir = simple !== forward ? "nextSibling" : "previousSibling",
						parent = elem.parentNode,
						name = ofType && elem.nodeName.toLowerCase(),
						useCache = !xml && !ofType;

					if ( parent ) {

						// :(first|last|only)-(child|of-type)
						if ( simple ) {
							while ( dir ) {
								node = elem;
								while ( (node = node[ dir ]) ) {
									if ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) {
										return false;
									}
								}
								// Reverse direction for :only-* (if we haven't yet done so)
								start = dir = type === "only" && !start && "nextSibling";
							}
							return true;
						}

						start = [ forward ? parent.firstChild : parent.lastChild ];

						// non-xml :nth-child(...) stores cache data on `parent`
						if ( forward && useCache ) {
							// Seek `elem` from a previously-cached index
							outerCache = parent[ expando ] || (parent[ expando ] = {});
							cache = outerCache[ type ] || [];
							nodeIndex = cache[0] === dirruns && cache[1];
							diff = cache[0] === dirruns && cache[2];
							node = nodeIndex && parent.childNodes[ nodeIndex ];

							while ( (node = ++nodeIndex && node && node[ dir ] ||

								// Fallback to seeking `elem` from the start
								(diff = nodeIndex = 0) || start.pop()) ) {

								// When found, cache indexes on `parent` and break
								if ( node.nodeType === 1 && ++diff && node === elem ) {
									outerCache[ type ] = [ dirruns, nodeIndex, diff ];
									break;
								}
							}

						// Use previously-cached element index if available
						} else if ( useCache && (cache = (elem[ expando ] || (elem[ expando ] = {}))[ type ]) && cache[0] === dirruns ) {
							diff = cache[1];

						// xml :nth-child(...) or :nth-last-child(...) or :nth(-last)?-of-type(...)
						} else {
							// Use the same loop as above to seek `elem` from the start
							while ( (node = ++nodeIndex && node && node[ dir ] ||
								(diff = nodeIndex = 0) || start.pop()) ) {

								if ( ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) && ++diff ) {
									// Cache the index of each encountered element
									if ( useCache ) {
										(node[ expando ] || (node[ expando ] = {}))[ type ] = [ dirruns, diff ];
									}

									if ( node === elem ) {
										break;
									}
								}
							}
						}

						// Incorporate the offset, then check against cycle size
						diff -= last;
						return diff === first || ( diff % first === 0 && diff / first >= 0 );
					}
				};
		},

		"PSEUDO": function( pseudo, argument ) {
			// pseudo-class names are case-insensitive
			// http://www.w3.org/TR/selectors/#pseudo-classes
			// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
			// Remember that setFilters inherits from pseudos
			var args,
				fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
					Sizzle.error( "unsupported pseudo: " + pseudo );

			// The user may use createPseudo to indicate that
			// arguments are needed to create the filter function
			// just as Sizzle does
			if ( fn[ expando ] ) {
				return fn( argument );
			}

			// But maintain support for old signatures
			if ( fn.length > 1 ) {
				args = [ pseudo, pseudo, "", argument ];
				return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
					markFunction(function( seed, matches ) {
						var idx,
							matched = fn( seed, argument ),
							i = matched.length;
						while ( i-- ) {
							idx = indexOf.call( seed, matched[i] );
							seed[ idx ] = !( matches[ idx ] = matched[i] );
						}
					}) :
					function( elem ) {
						return fn( elem, 0, args );
					};
			}

			return fn;
		}
	},

	pseudos: {
		// Potentially complex pseudos
		"not": markFunction(function( selector ) {
			// Trim the selector passed to compile
			// to avoid treating leading and trailing
			// spaces as combinators
			var input = [],
				results = [],
				matcher = compile( selector.replace( rtrim, "$1" ) );

			return matcher[ expando ] ?
				markFunction(function( seed, matches, context, xml ) {
					var elem,
						unmatched = matcher( seed, null, xml, [] ),
						i = seed.length;

					// Match elements unmatched by `matcher`
					while ( i-- ) {
						if ( (elem = unmatched[i]) ) {
							seed[i] = !(matches[i] = elem);
						}
					}
				}) :
				function( elem, context, xml ) {
					input[0] = elem;
					matcher( input, null, xml, results );
					return !results.pop();
				};
		}),

		"has": markFunction(function( selector ) {
			return function( elem ) {
				return Sizzle( selector, elem ).length > 0;
			};
		}),

		"contains": markFunction(function( text ) {
			return function( elem ) {
				return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
			};
		}),

		// "Whether an element is represented by a :lang() selector
		// is based solely on the element's language value
		// being equal to the identifier C,
		// or beginning with the identifier C immediately followed by "-".
		// The matching of C against the element's language value is performed case-insensitively.
		// The identifier C does not have to be a valid language name."
		// http://www.w3.org/TR/selectors/#lang-pseudo
		"lang": markFunction( function( lang ) {
			// lang value must be a valid identifier
			if ( !ridentifier.test(lang || "") ) {
				Sizzle.error( "unsupported lang: " + lang );
			}
			lang = lang.replace( runescape, funescape ).toLowerCase();
			return function( elem ) {
				var elemLang;
				do {
					if ( (elemLang = documentIsHTML ?
						elem.lang :
						elem.getAttribute("xml:lang") || elem.getAttribute("lang")) ) {

						elemLang = elemLang.toLowerCase();
						return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
					}
				} while ( (elem = elem.parentNode) && elem.nodeType === 1 );
				return false;
			};
		}),

		// Miscellaneous
		"target": function( elem ) {
			var hash = window.location && window.location.hash;
			return hash && hash.slice( 1 ) === elem.id;
		},

		"root": function( elem ) {
			return elem === docElem;
		},

		"focus": function( elem ) {
			return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
		},

		// Boolean properties
		"enabled": function( elem ) {
			return elem.disabled === false;
		},

		"disabled": function( elem ) {
			return elem.disabled === true;
		},

		"checked": function( elem ) {
			// In CSS3, :checked should return both checked and selected elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			var nodeName = elem.nodeName.toLowerCase();
			return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
		},

		"selected": function( elem ) {
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			if ( elem.parentNode ) {
				elem.parentNode.selectedIndex;
			}

			return elem.selected === true;
		},

		// Contents
		"empty": function( elem ) {
			// http://www.w3.org/TR/selectors/#empty-pseudo
			// :empty is only affected by element nodes and content nodes(including text(3), cdata(4)),
			//   not comment, processing instructions, or others
			// Thanks to Diego Perini for the nodeName shortcut
			//   Greater than "@" means alpha characters (specifically not starting with "#" or "?")
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				if ( elem.nodeName > "@" || elem.nodeType === 3 || elem.nodeType === 4 ) {
					return false;
				}
			}
			return true;
		},

		"parent": function( elem ) {
			return !Expr.pseudos["empty"]( elem );
		},

		// Element/input types
		"header": function( elem ) {
			return rheader.test( elem.nodeName );
		},

		"input": function( elem ) {
			return rinputs.test( elem.nodeName );
		},

		"button": function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === "button" || name === "button";
		},

		"text": function( elem ) {
			var attr;
			// IE6 and 7 will map elem.type to 'text' for new HTML5 types (search, etc)
			// use getAttribute instead to test this case
			return elem.nodeName.toLowerCase() === "input" &&
				elem.type === "text" &&
				( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === elem.type );
		},

		// Position-in-collection
		"first": createPositionalPseudo(function() {
			return [ 0 ];
		}),

		"last": createPositionalPseudo(function( matchIndexes, length ) {
			return [ length - 1 ];
		}),

		"eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
			return [ argument < 0 ? argument + length : argument ];
		}),

		"even": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 0;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"odd": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 1;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; --i >= 0; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; ++i < length; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		})
	}
};

Expr.pseudos["nth"] = Expr.pseudos["eq"];

// Add button/input type pseudos
for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
	Expr.pseudos[ i ] = createInputPseudo( i );
}
for ( i in { submit: true, reset: true } ) {
	Expr.pseudos[ i ] = createButtonPseudo( i );
}

// Easy API for creating new setFilters
function setFilters() {}
setFilters.prototype = Expr.filters = Expr.pseudos;
Expr.setFilters = new setFilters();

function tokenize( selector, parseOnly ) {
	var matched, match, tokens, type,
		soFar, groups, preFilters,
		cached = tokenCache[ selector + " " ];

	if ( cached ) {
		return parseOnly ? 0 : cached.slice( 0 );
	}

	soFar = selector;
	groups = [];
	preFilters = Expr.preFilter;

	while ( soFar ) {

		// Comma and first run
		if ( !matched || (match = rcomma.exec( soFar )) ) {
			if ( match ) {
				// Don't consume trailing commas as valid
				soFar = soFar.slice( match[0].length ) || soFar;
			}
			groups.push( tokens = [] );
		}

		matched = false;

		// Combinators
		if ( (match = rcombinators.exec( soFar )) ) {
			matched = match.shift();
			tokens.push({
				value: matched,
				// Cast descendant combinators to space
				type: match[0].replace( rtrim, " " )
			});
			soFar = soFar.slice( matched.length );
		}

		// Filters
		for ( type in Expr.filter ) {
			if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
				(match = preFilters[ type ]( match ))) ) {
				matched = match.shift();
				tokens.push({
					value: matched,
					type: type,
					matches: match
				});
				soFar = soFar.slice( matched.length );
			}
		}

		if ( !matched ) {
			break;
		}
	}

	// Return the length of the invalid excess
	// if we're just parsing
	// Otherwise, throw an error or return tokens
	return parseOnly ?
		soFar.length :
		soFar ?
			Sizzle.error( selector ) :
			// Cache the tokens
			tokenCache( selector, groups ).slice( 0 );
}

function toSelector( tokens ) {
	var i = 0,
		len = tokens.length,
		selector = "";
	for ( ; i < len; i++ ) {
		selector += tokens[i].value;
	}
	return selector;
}

function addCombinator( matcher, combinator, base ) {
	var dir = combinator.dir,
		checkNonElements = base && dir === "parentNode",
		doneName = done++;

	return combinator.first ?
		// Check against closest ancestor/preceding element
		function( elem, context, xml ) {
			while ( (elem = elem[ dir ]) ) {
				if ( elem.nodeType === 1 || checkNonElements ) {
					return matcher( elem, context, xml );
				}
			}
		} :

		// Check against all ancestor/preceding elements
		function( elem, context, xml ) {
			var data, cache, outerCache,
				dirkey = dirruns + " " + doneName;

			// We can't set arbitrary data on XML nodes, so they don't benefit from dir caching
			if ( xml ) {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						if ( matcher( elem, context, xml ) ) {
							return true;
						}
					}
				}
			} else {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						outerCache = elem[ expando ] || (elem[ expando ] = {});
						if ( (cache = outerCache[ dir ]) && cache[0] === dirkey ) {
							if ( (data = cache[1]) === true || data === cachedruns ) {
								return data === true;
							}
						} else {
							cache = outerCache[ dir ] = [ dirkey ];
							cache[1] = matcher( elem, context, xml ) || cachedruns;
							if ( cache[1] === true ) {
								return true;
							}
						}
					}
				}
			}
		};
}

function elementMatcher( matchers ) {
	return matchers.length > 1 ?
		function( elem, context, xml ) {
			var i = matchers.length;
			while ( i-- ) {
				if ( !matchers[i]( elem, context, xml ) ) {
					return false;
				}
			}
			return true;
		} :
		matchers[0];
}

function condense( unmatched, map, filter, context, xml ) {
	var elem,
		newUnmatched = [],
		i = 0,
		len = unmatched.length,
		mapped = map != null;

	for ( ; i < len; i++ ) {
		if ( (elem = unmatched[i]) ) {
			if ( !filter || filter( elem, context, xml ) ) {
				newUnmatched.push( elem );
				if ( mapped ) {
					map.push( i );
				}
			}
		}
	}

	return newUnmatched;
}

function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
	if ( postFilter && !postFilter[ expando ] ) {
		postFilter = setMatcher( postFilter );
	}
	if ( postFinder && !postFinder[ expando ] ) {
		postFinder = setMatcher( postFinder, postSelector );
	}
	return markFunction(function( seed, results, context, xml ) {
		var temp, i, elem,
			preMap = [],
			postMap = [],
			preexisting = results.length,

			// Get initial elements from seed or context
			elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [] ),

			// Prefilter to get matcher input, preserving a map for seed-results synchronization
			matcherIn = preFilter && ( seed || !selector ) ?
				condense( elems, preMap, preFilter, context, xml ) :
				elems,

			matcherOut = matcher ?
				// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
				postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

					// ...intermediate processing is necessary
					[] :

					// ...otherwise use results directly
					results :
				matcherIn;

		// Find primary matches
		if ( matcher ) {
			matcher( matcherIn, matcherOut, context, xml );
		}

		// Apply postFilter
		if ( postFilter ) {
			temp = condense( matcherOut, postMap );
			postFilter( temp, [], context, xml );

			// Un-match failing elements by moving them back to matcherIn
			i = temp.length;
			while ( i-- ) {
				if ( (elem = temp[i]) ) {
					matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
				}
			}
		}

		if ( seed ) {
			if ( postFinder || preFilter ) {
				if ( postFinder ) {
					// Get the final matcherOut by condensing this intermediate into postFinder contexts
					temp = [];
					i = matcherOut.length;
					while ( i-- ) {
						if ( (elem = matcherOut[i]) ) {
							// Restore matcherIn since elem is not yet a final match
							temp.push( (matcherIn[i] = elem) );
						}
					}
					postFinder( null, (matcherOut = []), temp, xml );
				}

				// Move matched elements from seed to results to keep them synchronized
				i = matcherOut.length;
				while ( i-- ) {
					if ( (elem = matcherOut[i]) &&
						(temp = postFinder ? indexOf.call( seed, elem ) : preMap[i]) > -1 ) {

						seed[temp] = !(results[temp] = elem);
					}
				}
			}

		// Add elements to results, through postFinder if defined
		} else {
			matcherOut = condense(
				matcherOut === results ?
					matcherOut.splice( preexisting, matcherOut.length ) :
					matcherOut
			);
			if ( postFinder ) {
				postFinder( null, results, matcherOut, xml );
			} else {
				push.apply( results, matcherOut );
			}
		}
	});
}

function matcherFromTokens( tokens ) {
	var checkContext, matcher, j,
		len = tokens.length,
		leadingRelative = Expr.relative[ tokens[0].type ],
		implicitRelative = leadingRelative || Expr.relative[" "],
		i = leadingRelative ? 1 : 0,

		// The foundational matcher ensures that elements are reachable from top-level context(s)
		matchContext = addCombinator( function( elem ) {
			return elem === checkContext;
		}, implicitRelative, true ),
		matchAnyContext = addCombinator( function( elem ) {
			return indexOf.call( checkContext, elem ) > -1;
		}, implicitRelative, true ),
		matchers = [ function( elem, context, xml ) {
			return ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
				(checkContext = context).nodeType ?
					matchContext( elem, context, xml ) :
					matchAnyContext( elem, context, xml ) );
		} ];

	for ( ; i < len; i++ ) {
		if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
			matchers = [ addCombinator(elementMatcher( matchers ), matcher) ];
		} else {
			matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );

			// Return special upon seeing a positional matcher
			if ( matcher[ expando ] ) {
				// Find the next relative operator (if any) for proper handling
				j = ++i;
				for ( ; j < len; j++ ) {
					if ( Expr.relative[ tokens[j].type ] ) {
						break;
					}
				}
				return setMatcher(
					i > 1 && elementMatcher( matchers ),
					i > 1 && toSelector(
						// If the preceding token was a descendant combinator, insert an implicit any-element `*`
						tokens.slice( 0, i - 1 ).concat({ value: tokens[ i - 2 ].type === " " ? "*" : "" })
					).replace( rtrim, "$1" ),
					matcher,
					i < j && matcherFromTokens( tokens.slice( i, j ) ),
					j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
					j < len && toSelector( tokens )
				);
			}
			matchers.push( matcher );
		}
	}

	return elementMatcher( matchers );
}

function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
	// A counter to specify which element is currently being matched
	var matcherCachedRuns = 0,
		bySet = setMatchers.length > 0,
		byElement = elementMatchers.length > 0,
		superMatcher = function( seed, context, xml, results, expandContext ) {
			var elem, j, matcher,
				setMatched = [],
				matchedCount = 0,
				i = "0",
				unmatched = seed && [],
				outermost = expandContext != null,
				contextBackup = outermostContext,
				// We must always have either seed elements or context
				elems = seed || byElement && Expr.find["TAG"]( "*", expandContext && context.parentNode || context ),
				// Use integer dirruns iff this is the outermost matcher
				dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1);

			if ( outermost ) {
				outermostContext = context !== document && context;
				cachedruns = matcherCachedRuns;
			}

			// Add elements passing elementMatchers directly to results
			// Keep `i` a string if there are no elements so `matchedCount` will be "00" below
			for ( ; (elem = elems[i]) != null; i++ ) {
				if ( byElement && elem ) {
					j = 0;
					while ( (matcher = elementMatchers[j++]) ) {
						if ( matcher( elem, context, xml ) ) {
							results.push( elem );
							break;
						}
					}
					if ( outermost ) {
						dirruns = dirrunsUnique;
						cachedruns = ++matcherCachedRuns;
					}
				}

				// Track unmatched elements for set filters
				if ( bySet ) {
					// They will have gone through all possible matchers
					if ( (elem = !matcher && elem) ) {
						matchedCount--;
					}

					// Lengthen the array for every element, matched or not
					if ( seed ) {
						unmatched.push( elem );
					}
				}
			}

			// Apply set filters to unmatched elements
			matchedCount += i;
			if ( bySet && i !== matchedCount ) {
				j = 0;
				while ( (matcher = setMatchers[j++]) ) {
					matcher( unmatched, setMatched, context, xml );
				}

				if ( seed ) {
					// Reintegrate element matches to eliminate the need for sorting
					if ( matchedCount > 0 ) {
						while ( i-- ) {
							if ( !(unmatched[i] || setMatched[i]) ) {
								setMatched[i] = pop.call( results );
							}
						}
					}

					// Discard index placeholder values to get only actual matches
					setMatched = condense( setMatched );
				}

				// Add matches to results
				push.apply( results, setMatched );

				// Seedless set matches succeeding multiple successful matchers stipulate sorting
				if ( outermost && !seed && setMatched.length > 0 &&
					( matchedCount + setMatchers.length ) > 1 ) {

					Sizzle.uniqueSort( results );
				}
			}

			// Override manipulation of globals by nested matchers
			if ( outermost ) {
				dirruns = dirrunsUnique;
				outermostContext = contextBackup;
			}

			return unmatched;
		};

	return bySet ?
		markFunction( superMatcher ) :
		superMatcher;
}

compile = Sizzle.compile = function( selector, group /* Internal Use Only */ ) {
	var i,
		setMatchers = [],
		elementMatchers = [],
		cached = compilerCache[ selector + " " ];

	if ( !cached ) {
		// Generate a function of recursive functions that can be used to check each element
		if ( !group ) {
			group = tokenize( selector );
		}
		i = group.length;
		while ( i-- ) {
			cached = matcherFromTokens( group[i] );
			if ( cached[ expando ] ) {
				setMatchers.push( cached );
			} else {
				elementMatchers.push( cached );
			}
		}

		// Cache the compiled function
		cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );
	}
	return cached;
};

function multipleContexts( selector, contexts, results ) {
	var i = 0,
		len = contexts.length;
	for ( ; i < len; i++ ) {
		Sizzle( selector, contexts[i], results );
	}
	return results;
}

function select( selector, context, results, seed ) {
	var i, tokens, token, type, find,
		match = tokenize( selector );

	if ( !seed ) {
		// Try to minimize operations if there is only one group
		if ( match.length === 1 ) {

			// Take a shortcut and set the context if the root selector is an ID
			tokens = match[0] = match[0].slice( 0 );
			if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
					support.getById && context.nodeType === 9 && documentIsHTML &&
					Expr.relative[ tokens[1].type ] ) {

				context = ( Expr.find["ID"]( token.matches[0].replace(runescape, funescape), context ) || [] )[0];
				if ( !context ) {
					return results;
				}
				selector = selector.slice( tokens.shift().value.length );
			}

			// Fetch a seed set for right-to-left matching
			i = matchExpr["needsContext"].test( selector ) ? 0 : tokens.length;
			while ( i-- ) {
				token = tokens[i];

				// Abort if we hit a combinator
				if ( Expr.relative[ (type = token.type) ] ) {
					break;
				}
				if ( (find = Expr.find[ type ]) ) {
					// Search, expanding context for leading sibling combinators
					if ( (seed = find(
						token.matches[0].replace( runescape, funescape ),
						rsibling.test( tokens[0].type ) && context.parentNode || context
					)) ) {

						// If seed is empty or no tokens remain, we can return early
						tokens.splice( i, 1 );
						selector = seed.length && toSelector( tokens );
						if ( !selector ) {
							push.apply( results, seed );
							return results;
						}

						break;
					}
				}
			}
		}
	}

	// Compile and execute a filtering function
	// Provide `match` to avoid retokenization if we modified the selector above
	compile( selector, match )(
		seed,
		context,
		!documentIsHTML,
		results,
		rsibling.test( selector )
	);
	return results;
}

// One-time assignments

// Sort stability
support.sortStable = expando.split("").sort( sortOrder ).join("") === expando;

// Support: Chrome<14
// Always assume duplicates if they aren't passed to the comparison function
support.detectDuplicates = hasDuplicate;

// Initialize against the default document
setDocument();

// Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
// Detached nodes confoundingly follow *each other*
support.sortDetached = assert(function( div1 ) {
	// Should return 1, but returns 4 (following)
	return div1.compareDocumentPosition( document.createElement("div") ) & 1;
});

// Support: IE<8
// Prevent attribute/property "interpolation"
// http://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
if ( !assert(function( div ) {
	div.innerHTML = "<a href='#'></a>";
	return div.firstChild.getAttribute("href") === "#" ;
}) ) {
	addHandle( "type|href|height|width", function( elem, name, isXML ) {
		if ( !isXML ) {
			return elem.getAttribute( name, name.toLowerCase() === "type" ? 1 : 2 );
		}
	});
}

// Support: IE<9
// Use defaultValue in place of getAttribute("value")
if ( !support.attributes || !assert(function( div ) {
	div.innerHTML = "<input/>";
	div.firstChild.setAttribute( "value", "" );
	return div.firstChild.getAttribute( "value" ) === "";
}) ) {
	addHandle( "value", function( elem, name, isXML ) {
		if ( !isXML && elem.nodeName.toLowerCase() === "input" ) {
			return elem.defaultValue;
		}
	});
}

// Support: IE<9
// Use getAttributeNode to fetch booleans when getAttribute lies
if ( !assert(function( div ) {
	return div.getAttribute("disabled") == null;
}) ) {
	addHandle( booleans, function( elem, name, isXML ) {
		var val;
		if ( !isXML ) {
			return (val = elem.getAttributeNode( name )) && val.specified ?
				val.value :
				elem[ name ] === true ? name.toLowerCase() : null;
		}
	});
}

jQuery.find = Sizzle;
jQuery.expr = Sizzle.selectors;
jQuery.expr[":"] = jQuery.expr.pseudos;
jQuery.unique = Sizzle.uniqueSort;
jQuery.text = Sizzle.getText;
jQuery.isXMLDoc = Sizzle.isXML;
jQuery.contains = Sizzle.contains;


})( window );
// String to Object options format cache
var optionsCache = {};

// Convert String-formatted options into Object-formatted ones and store in cache
function createOptions( options ) {
	var object = optionsCache[ options ] = {};
	jQuery.each( options.match( core_rnotwhite ) || [], function( _, flag ) {
		object[ flag ] = true;
	});
	return object;
}

/*
 * Create a callback list using the following parameters:
 *
 *	options: an optional list of space-separated options that will change how
 *			the callback list behaves or a more traditional option object
 *
 * By default a callback list will act like an event callback list and can be
 * "fired" multiple times.
 *
 * Possible options:
 *
 *	once:			will ensure the callback list can only be fired once (like a Deferred)
 *
 *	memory:			will keep track of previous values and will call any callback added
 *					after the list has been fired right away with the latest "memorized"
 *					values (like a Deferred)
 *
 *	unique:			will ensure a callback can only be added once (no duplicate in the list)
 *
 *	stopOnFalse:	interrupt callings when a callback returns false
 *
 */
jQuery.Callbacks = function( options ) {

	// Convert options from String-formatted to Object-formatted if needed
	// (we check in cache first)
	options = typeof options === "string" ?
		( optionsCache[ options ] || createOptions( options ) ) :
		jQuery.extend( {}, options );

	var // Last fire value (for non-forgettable lists)
		memory,
		// Flag to know if list was already fired
		fired,
		// Flag to know if list is currently firing
		firing,
		// First callback to fire (used internally by add and fireWith)
		firingStart,
		// End of the loop when firing
		firingLength,
		// Index of currently firing callback (modified by remove if needed)
		firingIndex,
		// Actual callback list
		list = [],
		// Stack of fire calls for repeatable lists
		stack = !options.once && [],
		// Fire callbacks
		fire = function( data ) {
			memory = options.memory && data;
			fired = true;
			firingIndex = firingStart || 0;
			firingStart = 0;
			firingLength = list.length;
			firing = true;
			for ( ; list && firingIndex < firingLength; firingIndex++ ) {
				if ( list[ firingIndex ].apply( data[ 0 ], data[ 1 ] ) === false && options.stopOnFalse ) {
					memory = false; // To prevent further calls using add
					break;
				}
			}
			firing = false;
			if ( list ) {
				if ( stack ) {
					if ( stack.length ) {
						fire( stack.shift() );
					}
				} else if ( memory ) {
					list = [];
				} else {
					self.disable();
				}
			}
		},
		// Actual Callbacks object
		self = {
			// Add a callback or a collection of callbacks to the list
			add: function() {
				if ( list ) {
					// First, we save the current length
					var start = list.length;
					(function add( args ) {
						jQuery.each( args, function( _, arg ) {
							var type = jQuery.type( arg );
							if ( type === "function" ) {
								if ( !options.unique || !self.has( arg ) ) {
									list.push( arg );
								}
							} else if ( arg && arg.length && type !== "string" ) {
								// Inspect recursively
								add( arg );
							}
						});
					})( arguments );
					// Do we need to add the callbacks to the
					// current firing batch?
					if ( firing ) {
						firingLength = list.length;
					// With memory, if we're not firing then
					// we should call right away
					} else if ( memory ) {
						firingStart = start;
						fire( memory );
					}
				}
				return this;
			},
			// Remove a callback from the list
			remove: function() {
				if ( list ) {
					jQuery.each( arguments, function( _, arg ) {
						var index;
						while( ( index = jQuery.inArray( arg, list, index ) ) > -1 ) {
							list.splice( index, 1 );
							// Handle firing indexes
							if ( firing ) {
								if ( index <= firingLength ) {
									firingLength--;
								}
								if ( index <= firingIndex ) {
									firingIndex--;
								}
							}
						}
					});
				}
				return this;
			},
			// Check if a given callback is in the list.
			// If no argument is given, return whether or not list has callbacks attached.
			has: function( fn ) {
				return fn ? jQuery.inArray( fn, list ) > -1 : !!( list && list.length );
			},
			// Remove all callbacks from the list
			empty: function() {
				list = [];
				firingLength = 0;
				return this;
			},
			// Have the list do nothing anymore
			disable: function() {
				list = stack = memory = undefined;
				return this;
			},
			// Is it disabled?
			disabled: function() {
				return !list;
			},
			// Lock the list in its current state
			lock: function() {
				stack = undefined;
				if ( !memory ) {
					self.disable();
				}
				return this;
			},
			// Is it locked?
			locked: function() {
				return !stack;
			},
			// Call all callbacks with the given context and arguments
			fireWith: function( context, args ) {
				if ( list && ( !fired || stack ) ) {
					args = args || [];
					args = [ context, args.slice ? args.slice() : args ];
					if ( firing ) {
						stack.push( args );
					} else {
						fire( args );
					}
				}
				return this;
			},
			// Call all the callbacks with the given arguments
			fire: function() {
				self.fireWith( this, arguments );
				return this;
			},
			// To know if the callbacks have already been called at least once
			fired: function() {
				return !!fired;
			}
		};

	return self;
};
jQuery.extend({

	Deferred: function( func ) {
		var tuples = [
				// action, add listener, listener list, final state
				[ "resolve", "done", jQuery.Callbacks("once memory"), "resolved" ],
				[ "reject", "fail", jQuery.Callbacks("once memory"), "rejected" ],
				[ "notify", "progress", jQuery.Callbacks("memory") ]
			],
			state = "pending",
			promise = {
				state: function() {
					return state;
				},
				always: function() {
					deferred.done( arguments ).fail( arguments );
					return this;
				},
				then: function( /* fnDone, fnFail, fnProgress */ ) {
					var fns = arguments;
					return jQuery.Deferred(function( newDefer ) {
						jQuery.each( tuples, function( i, tuple ) {
							var action = tuple[ 0 ],
								fn = jQuery.isFunction( fns[ i ] ) && fns[ i ];
							// deferred[ done | fail | progress ] for forwarding actions to newDefer
							deferred[ tuple[1] ](function() {
								var returned = fn && fn.apply( this, arguments );
								if ( returned && jQuery.isFunction( returned.promise ) ) {
									returned.promise()
										.done( newDefer.resolve )
										.fail( newDefer.reject )
										.progress( newDefer.notify );
								} else {
									newDefer[ action + "With" ]( this === promise ? newDefer.promise() : this, fn ? [ returned ] : arguments );
								}
							});
						});
						fns = null;
					}).promise();
				},
				// Get a promise for this deferred
				// If obj is provided, the promise aspect is added to the object
				promise: function( obj ) {
					return obj != null ? jQuery.extend( obj, promise ) : promise;
				}
			},
			deferred = {};

		// Keep pipe for back-compat
		promise.pipe = promise.then;

		// Add list-specific methods
		jQuery.each( tuples, function( i, tuple ) {
			var list = tuple[ 2 ],
				stateString = tuple[ 3 ];

			// promise[ done | fail | progress ] = list.add
			promise[ tuple[1] ] = list.add;

			// Handle state
			if ( stateString ) {
				list.add(function() {
					// state = [ resolved | rejected ]
					state = stateString;

				// [ reject_list | resolve_list ].disable; progress_list.lock
				}, tuples[ i ^ 1 ][ 2 ].disable, tuples[ 2 ][ 2 ].lock );
			}

			// deferred[ resolve | reject | notify ]
			deferred[ tuple[0] ] = function() {
				deferred[ tuple[0] + "With" ]( this === deferred ? promise : this, arguments );
				return this;
			};
			deferred[ tuple[0] + "With" ] = list.fireWith;
		});

		// Make the deferred a promise
		promise.promise( deferred );

		// Call given func if any
		if ( func ) {
			func.call( deferred, deferred );
		}

		// All done!
		return deferred;
	},

	// Deferred helper
	when: function( subordinate /* , ..., subordinateN */ ) {
		var i = 0,
			resolveValues = core_slice.call( arguments ),
			length = resolveValues.length,

			// the count of uncompleted subordinates
			remaining = length !== 1 || ( subordinate && jQuery.isFunction( subordinate.promise ) ) ? length : 0,

			// the master Deferred. If resolveValues consist of only a single Deferred, just use that.
			deferred = remaining === 1 ? subordinate : jQuery.Deferred(),

			// Update function for both resolve and progress values
			updateFunc = function( i, contexts, values ) {
				return function( value ) {
					contexts[ i ] = this;
					values[ i ] = arguments.length > 1 ? core_slice.call( arguments ) : value;
					if( values === progressValues ) {
						deferred.notifyWith( contexts, values );
					} else if ( !( --remaining ) ) {
						deferred.resolveWith( contexts, values );
					}
				};
			},

			progressValues, progressContexts, resolveContexts;

		// add listeners to Deferred subordinates; treat others as resolved
		if ( length > 1 ) {
			progressValues = new Array( length );
			progressContexts = new Array( length );
			resolveContexts = new Array( length );
			for ( ; i < length; i++ ) {
				if ( resolveValues[ i ] && jQuery.isFunction( resolveValues[ i ].promise ) ) {
					resolveValues[ i ].promise()
						.done( updateFunc( i, resolveContexts, resolveValues ) )
						.fail( deferred.reject )
						.progress( updateFunc( i, progressContexts, progressValues ) );
				} else {
					--remaining;
				}
			}
		}

		// if we're not waiting on anything, resolve the master
		if ( !remaining ) {
			deferred.resolveWith( resolveContexts, resolveValues );
		}

		return deferred.promise();
	}
});
jQuery.support = (function( support ) {
	var input = document.createElement("input"),
		fragment = document.createDocumentFragment(),
		div = document.createElement("div"),
		select = document.createElement("select"),
		opt = select.appendChild( document.createElement("option") );

	// Finish early in limited environments
	if ( !input.type ) {
		return support;
	}

	input.type = "checkbox";

	// Support: Safari 5.1, iOS 5.1, Android 4.x, Android 2.3
	// Check the default checkbox/radio value ("" on old WebKit; "on" elsewhere)
	support.checkOn = input.value !== "";

	// Must access the parent to make an option select properly
	// Support: IE9, IE10
	support.optSelected = opt.selected;

	// Will be defined later
	support.reliableMarginRight = true;
	support.boxSizingReliable = true;
	support.pixelPosition = false;

	// Make sure checked status is properly cloned
	// Support: IE9, IE10
	input.checked = true;
	support.noCloneChecked = input.cloneNode( true ).checked;

	// Make sure that the options inside disabled selects aren't marked as disabled
	// (WebKit marks them as disabled)
	select.disabled = true;
	support.optDisabled = !opt.disabled;

	// Check if an input maintains its value after becoming a radio
	// Support: IE9, IE10
	input = document.createElement("input");
	input.value = "t";
	input.type = "radio";
	support.radioValue = input.value === "t";

	// #11217 - WebKit loses check when the name is after the checked attribute
	input.setAttribute( "checked", "t" );
	input.setAttribute( "name", "t" );

	fragment.appendChild( input );

	// Support: Safari 5.1, Android 4.x, Android 2.3
	// old WebKit doesn't clone checked state correctly in fragments
	support.checkClone = fragment.cloneNode( true ).cloneNode( true ).lastChild.checked;

	// Support: Firefox, Chrome, Safari
	// Beware of CSP restrictions (https://developer.mozilla.org/en/Security/CSP)
	support.focusinBubbles = "onfocusin" in window;

	div.style.backgroundClip = "content-box";
	div.cloneNode( true ).style.backgroundClip = "";
	support.clearCloneStyle = div.style.backgroundClip === "content-box";

	// Run tests that need a body at doc ready
	jQuery(function() {
		var container, marginDiv,
			// Support: Firefox, Android 2.3 (Prefixed box-sizing versions).
			divReset = "padding:0;margin:0;border:0;display:block;-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box",
			body = document.getElementsByTagName("body")[ 0 ];

		if ( !body ) {
			// Return for frameset docs that don't have a body
			return;
		}

		container = document.createElement("div");
		container.style.cssText = "border:0;width:0;height:0;position:absolute;top:0;left:-9999px;margin-top:1px";

		// Check box-sizing and margin behavior.
		body.appendChild( container ).appendChild( div );
		div.innerHTML = "";
		// Support: Firefox, Android 2.3 (Prefixed box-sizing versions).
		div.style.cssText = "-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%";

		// Workaround failing boxSizing test due to offsetWidth returning wrong value
		// with some non-1 values of body zoom, ticket #13543
		jQuery.swap( body, body.style.zoom != null ? { zoom: 1 } : {}, function() {
			support.boxSizing = div.offsetWidth === 4;
		});

		// Use window.getComputedStyle because jsdom on node.js will break without it.
		if ( window.getComputedStyle ) {
			support.pixelPosition = ( window.getComputedStyle( div, null ) || {} ).top !== "1%";
			support.boxSizingReliable = ( window.getComputedStyle( div, null ) || { width: "4px" } ).width === "4px";

			// Support: Android 2.3
			// Check if div with explicit width and no margin-right incorrectly
			// gets computed margin-right based on width of container. (#3333)
			// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
			marginDiv = div.appendChild( document.createElement("div") );
			marginDiv.style.cssText = div.style.cssText = divReset;
			marginDiv.style.marginRight = marginDiv.style.width = "0";
			div.style.width = "1px";

			support.reliableMarginRight =
				!parseFloat( ( window.getComputedStyle( marginDiv, null ) || {} ).marginRight );
		}

		body.removeChild( container );
	});

	return support;
})( {} );

/*
	Implementation Summary

	1. Enforce API surface and semantic compatibility with 1.9.x branch
	2. Improve the module's maintainability by reducing the storage
		paths to a single mechanism.
	3. Use the same single mechanism to support "private" and "user" data.
	4. _Never_ expose "private" data to user code (TODO: Drop _data, _removeData)
	5. Avoid exposing implementation details on user objects (eg. expando properties)
	6. Provide a clear path for implementation upgrade to WeakMap in 2014
*/
var data_user, data_priv,
	rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/,
	rmultiDash = /([A-Z])/g;

function Data() {
	// Support: Android < 4,
	// Old WebKit does not have Object.preventExtensions/freeze method,
	// return new empty object instead with no [[set]] accessor
	Object.defineProperty( this.cache = {}, 0, {
		get: function() {
			return {};
		}
	});

	this.expando = jQuery.expando + Math.random();
}

Data.uid = 1;

Data.accepts = function( owner ) {
	// Accepts only:
	//  - Node
	//    - Node.ELEMENT_NODE
	//    - Node.DOCUMENT_NODE
	//  - Object
	//    - Any
	return owner.nodeType ?
		owner.nodeType === 1 || owner.nodeType === 9 : true;
};

Data.prototype = {
	key: function( owner ) {
		// We can accept data for non-element nodes in modern browsers,
		// but we should not, see #8335.
		// Always return the key for a frozen object.
		if ( !Data.accepts( owner ) ) {
			return 0;
		}

		var descriptor = {},
			// Check if the owner object already has a cache key
			unlock = owner[ this.expando ];

		// If not, create one
		if ( !unlock ) {
			unlock = Data.uid++;

			// Secure it in a non-enumerable, non-writable property
			try {
				descriptor[ this.expando ] = { value: unlock };
				Object.defineProperties( owner, descriptor );

			// Support: Android < 4
			// Fallback to a less secure definition
			} catch ( e ) {
				descriptor[ this.expando ] = unlock;
				jQuery.extend( owner, descriptor );
			}
		}

		// Ensure the cache object
		if ( !this.cache[ unlock ] ) {
			this.cache[ unlock ] = {};
		}

		return unlock;
	},
	set: function( owner, data, value ) {
		var prop,
			// There may be an unlock assigned to this node,
			// if there is no entry for this "owner", create one inline
			// and set the unlock as though an owner entry had always existed
			unlock = this.key( owner ),
			cache = this.cache[ unlock ];

		// Handle: [ owner, key, value ] args
		if ( typeof data === "string" ) {
			cache[ data ] = value;

		// Handle: [ owner, { properties } ] args
		} else {
			// Fresh assignments by object are shallow copied
			if ( jQuery.isEmptyObject( cache ) ) {
				jQuery.extend( this.cache[ unlock ], data );
			// Otherwise, copy the properties one-by-one to the cache object
			} else {
				for ( prop in data ) {
					cache[ prop ] = data[ prop ];
				}
			}
		}
		return cache;
	},
	get: function( owner, key ) {
		// Either a valid cache is found, or will be created.
		// New caches will be created and the unlock returned,
		// allowing direct access to the newly created
		// empty data object. A valid owner object must be provided.
		var cache = this.cache[ this.key( owner ) ];

		return key === undefined ?
			cache : cache[ key ];
	},
	access: function( owner, key, value ) {
		var stored;
		// In cases where either:
		//
		//   1. No key was specified
		//   2. A string key was specified, but no value provided
		//
		// Take the "read" path and allow the get method to determine
		// which value to return, respectively either:
		//
		//   1. The entire cache object
		//   2. The data stored at the key
		//
		if ( key === undefined ||
				((key && typeof key === "string") && value === undefined) ) {

			stored = this.get( owner, key );

			return stored !== undefined ?
				stored : this.get( owner, jQuery.camelCase(key) );
		}

		// [*]When the key is not a string, or both a key and value
		// are specified, set or extend (existing objects) with either:
		//
		//   1. An object of properties
		//   2. A key and value
		//
		this.set( owner, key, value );

		// Since the "set" path can have two possible entry points
		// return the expected data based on which path was taken[*]
		return value !== undefined ? value : key;
	},
	remove: function( owner, key ) {
		var i, name, camel,
			unlock = this.key( owner ),
			cache = this.cache[ unlock ];

		if ( key === undefined ) {
			this.cache[ unlock ] = {};

		} else {
			// Support array or space separated string of keys
			if ( jQuery.isArray( key ) ) {
				// If "name" is an array of keys...
				// When data is initially created, via ("key", "val") signature,
				// keys will be converted to camelCase.
				// Since there is no way to tell _how_ a key was added, remove
				// both plain key and camelCase key. #12786
				// This will only penalize the array argument path.
				name = key.concat( key.map( jQuery.camelCase ) );
			} else {
				camel = jQuery.camelCase( key );
				// Try the string as a key before any manipulation
				if ( key in cache ) {
					name = [ key, camel ];
				} else {
					// If a key with the spaces exists, use it.
					// Otherwise, create an array by matching non-whitespace
					name = camel;
					name = name in cache ?
						[ name ] : ( name.match( core_rnotwhite ) || [] );
				}
			}

			i = name.length;
			while ( i-- ) {
				delete cache[ name[ i ] ];
			}
		}
	},
	hasData: function( owner ) {
		return !jQuery.isEmptyObject(
			this.cache[ owner[ this.expando ] ] || {}
		);
	},
	discard: function( owner ) {
		if ( owner[ this.expando ] ) {
			delete this.cache[ owner[ this.expando ] ];
		}
	}
};

// These may be used throughout the jQuery core codebase
data_user = new Data();
data_priv = new Data();


jQuery.extend({
	acceptData: Data.accepts,

	hasData: function( elem ) {
		return data_user.hasData( elem ) || data_priv.hasData( elem );
	},

	data: function( elem, name, data ) {
		return data_user.access( elem, name, data );
	},

	removeData: function( elem, name ) {
		data_user.remove( elem, name );
	},

	// TODO: Now that all calls to _data and _removeData have been replaced
	// with direct calls to data_priv methods, these can be deprecated.
	_data: function( elem, name, data ) {
		return data_priv.access( elem, name, data );
	},

	_removeData: function( elem, name ) {
		data_priv.remove( elem, name );
	}
});

jQuery.fn.extend({
	data: function( key, value ) {
		var attrs, name,
			elem = this[ 0 ],
			i = 0,
			data = null;

		// Gets all values
		if ( key === undefined ) {
			if ( this.length ) {
				data = data_user.get( elem );

				if ( elem.nodeType === 1 && !data_priv.get( elem, "hasDataAttrs" ) ) {
					attrs = elem.attributes;
					for ( ; i < attrs.length; i++ ) {
						name = attrs[ i ].name;

						if ( name.indexOf( "data-" ) === 0 ) {
							name = jQuery.camelCase( name.slice(5) );
							dataAttr( elem, name, data[ name ] );
						}
					}
					data_priv.set( elem, "hasDataAttrs", true );
				}
			}

			return data;
		}

		// Sets multiple values
		if ( typeof key === "object" ) {
			return this.each(function() {
				data_user.set( this, key );
			});
		}

		return jQuery.access( this, function( value ) {
			var data,
				camelKey = jQuery.camelCase( key );

			// The calling jQuery object (element matches) is not empty
			// (and therefore has an element appears at this[ 0 ]) and the
			// `value` parameter was not undefined. An empty jQuery object
			// will result in `undefined` for elem = this[ 0 ] which will
			// throw an exception if an attempt to read a data cache is made.
			if ( elem && value === undefined ) {
				// Attempt to get data from the cache
				// with the key as-is
				data = data_user.get( elem, key );
				if ( data !== undefined ) {
					return data;
				}

				// Attempt to get data from the cache
				// with the key camelized
				data = data_user.get( elem, camelKey );
				if ( data !== undefined ) {
					return data;
				}

				// Attempt to "discover" the data in
				// HTML5 custom data-* attrs
				data = dataAttr( elem, camelKey, undefined );
				if ( data !== undefined ) {
					return data;
				}

				// We tried really hard, but the data doesn't exist.
				return;
			}

			// Set the data...
			this.each(function() {
				// First, attempt to store a copy or reference of any
				// data that might've been store with a camelCased key.
				var data = data_user.get( this, camelKey );

				// For HTML5 data-* attribute interop, we have to
				// store property names with dashes in a camelCase form.
				// This might not apply to all properties...*
				data_user.set( this, camelKey, value );

				// *... In the case of properties that might _actually_
				// have dashes, we need to also store a copy of that
				// unchanged property.
				if ( key.indexOf("-") !== -1 && data !== undefined ) {
					data_user.set( this, key, value );
				}
			});
		}, null, value, arguments.length > 1, null, true );
	},

	removeData: function( key ) {
		return this.each(function() {
			data_user.remove( this, key );
		});
	}
});

function dataAttr( elem, key, data ) {
	var name;

	// If nothing was found internally, try to fetch any
	// data from the HTML5 data-* attribute
	if ( data === undefined && elem.nodeType === 1 ) {
		name = "data-" + key.replace( rmultiDash, "-$1" ).toLowerCase();
		data = elem.getAttribute( name );

		if ( typeof data === "string" ) {
			try {
				data = data === "true" ? true :
					data === "false" ? false :
					data === "null" ? null :
					// Only convert to a number if it doesn't change the string
					+data + "" === data ? +data :
					rbrace.test( data ) ? JSON.parse( data ) :
					data;
			} catch( e ) {}

			// Make sure we set the data so it isn't changed later
			data_user.set( elem, key, data );
		} else {
			data = undefined;
		}
	}
	return data;
}
jQuery.extend({
	queue: function( elem, type, data ) {
		var queue;

		if ( elem ) {
			type = ( type || "fx" ) + "queue";
			queue = data_priv.get( elem, type );

			// Speed up dequeue by getting out quickly if this is just a lookup
			if ( data ) {
				if ( !queue || jQuery.isArray( data ) ) {
					queue = data_priv.access( elem, type, jQuery.makeArray(data) );
				} else {
					queue.push( data );
				}
			}
			return queue || [];
		}
	},

	dequeue: function( elem, type ) {
		type = type || "fx";

		var queue = jQuery.queue( elem, type ),
			startLength = queue.length,
			fn = queue.shift(),
			hooks = jQuery._queueHooks( elem, type ),
			next = function() {
				jQuery.dequeue( elem, type );
			};

		// If the fx queue is dequeued, always remove the progress sentinel
		if ( fn === "inprogress" ) {
			fn = queue.shift();
			startLength--;
		}

		if ( fn ) {

			// Add a progress sentinel to prevent the fx queue from being
			// automatically dequeued
			if ( type === "fx" ) {
				queue.unshift( "inprogress" );
			}

			// clear up the last queue stop function
			delete hooks.stop;
			fn.call( elem, next, hooks );
		}

		if ( !startLength && hooks ) {
			hooks.empty.fire();
		}
	},

	// not intended for public consumption - generates a queueHooks object, or returns the current one
	_queueHooks: function( elem, type ) {
		var key = type + "queueHooks";
		return data_priv.get( elem, key ) || data_priv.access( elem, key, {
			empty: jQuery.Callbacks("once memory").add(function() {
				data_priv.remove( elem, [ type + "queue", key ] );
			})
		});
	}
});

jQuery.fn.extend({
	queue: function( type, data ) {
		var setter = 2;

		if ( typeof type !== "string" ) {
			data = type;
			type = "fx";
			setter--;
		}

		if ( arguments.length < setter ) {
			return jQuery.queue( this[0], type );
		}

		return data === undefined ?
			this :
			this.each(function() {
				var queue = jQuery.queue( this, type, data );

				// ensure a hooks for this queue
				jQuery._queueHooks( this, type );

				if ( type === "fx" && queue[0] !== "inprogress" ) {
					jQuery.dequeue( this, type );
				}
			});
	},
	dequeue: function( type ) {
		return this.each(function() {
			jQuery.dequeue( this, type );
		});
	},
	// Based off of the plugin by Clint Helfers, with permission.
	// http://blindsignals.com/index.php/2009/07/jquery-delay/
	delay: function( time, type ) {
		time = jQuery.fx ? jQuery.fx.speeds[ time ] || time : time;
		type = type || "fx";

		return this.queue( type, function( next, hooks ) {
			var timeout = setTimeout( next, time );
			hooks.stop = function() {
				clearTimeout( timeout );
			};
		});
	},
	clearQueue: function( type ) {
		return this.queue( type || "fx", [] );
	},
	// Get a promise resolved when queues of a certain type
	// are emptied (fx is the type by default)
	promise: function( type, obj ) {
		var tmp,
			count = 1,
			defer = jQuery.Deferred(),
			elements = this,
			i = this.length,
			resolve = function() {
				if ( !( --count ) ) {
					defer.resolveWith( elements, [ elements ] );
				}
			};

		if ( typeof type !== "string" ) {
			obj = type;
			type = undefined;
		}
		type = type || "fx";

		while( i-- ) {
			tmp = data_priv.get( elements[ i ], type + "queueHooks" );
			if ( tmp && tmp.empty ) {
				count++;
				tmp.empty.add( resolve );
			}
		}
		resolve();
		return defer.promise( obj );
	}
});
var nodeHook, boolHook,
	rclass = /[\t\r\n\f]/g,
	rreturn = /\r/g,
	rfocusable = /^(?:input|select|textarea|button)$/i;

jQuery.fn.extend({
	attr: function( name, value ) {
		return jQuery.access( this, jQuery.attr, name, value, arguments.length > 1 );
	},

	removeAttr: function( name ) {
		return this.each(function() {
			jQuery.removeAttr( this, name );
		});
	},

	prop: function( name, value ) {
		return jQuery.access( this, jQuery.prop, name, value, arguments.length > 1 );
	},

	removeProp: function( name ) {
		return this.each(function() {
			delete this[ jQuery.propFix[ name ] || name ];
		});
	},

	addClass: function( value ) {
		var classes, elem, cur, clazz, j,
			i = 0,
			len = this.length,
			proceed = typeof value === "string" && value;

		if ( jQuery.isFunction( value ) ) {
			return this.each(function( j ) {
				jQuery( this ).addClass( value.call( this, j, this.className ) );
			});
		}

		if ( proceed ) {
			// The disjunction here is for better compressibility (see removeClass)
			classes = ( value || "" ).match( core_rnotwhite ) || [];

			for ( ; i < len; i++ ) {
				elem = this[ i ];
				cur = elem.nodeType === 1 && ( elem.className ?
					( " " + elem.className + " " ).replace( rclass, " " ) :
					" "
				);

				if ( cur ) {
					j = 0;
					while ( (clazz = classes[j++]) ) {
						if ( cur.indexOf( " " + clazz + " " ) < 0 ) {
							cur += clazz + " ";
						}
					}
					elem.className = jQuery.trim( cur );

				}
			}
		}

		return this;
	},

	removeClass: function( value ) {
		var classes, elem, cur, clazz, j,
			i = 0,
			len = this.length,
			proceed = arguments.length === 0 || typeof value === "string" && value;

		if ( jQuery.isFunction( value ) ) {
			return this.each(function( j ) {
				jQuery( this ).removeClass( value.call( this, j, this.className ) );
			});
		}
		if ( proceed ) {
			classes = ( value || "" ).match( core_rnotwhite ) || [];

			for ( ; i < len; i++ ) {
				elem = this[ i ];
				// This expression is here for better compressibility (see addClass)
				cur = elem.nodeType === 1 && ( elem.className ?
					( " " + elem.className + " " ).replace( rclass, " " ) :
					""
				);

				if ( cur ) {
					j = 0;
					while ( (clazz = classes[j++]) ) {
						// Remove *all* instances
						while ( cur.indexOf( " " + clazz + " " ) >= 0 ) {
							cur = cur.replace( " " + clazz + " ", " " );
						}
					}
					elem.className = value ? jQuery.trim( cur ) : "";
				}
			}
		}

		return this;
	},

	toggleClass: function( value, stateVal ) {
		var type = typeof value;

		if ( typeof stateVal === "boolean" && type === "string" ) {
			return stateVal ? this.addClass( value ) : this.removeClass( value );
		}

		if ( jQuery.isFunction( value ) ) {
			return this.each(function( i ) {
				jQuery( this ).toggleClass( value.call(this, i, this.className, stateVal), stateVal );
			});
		}

		return this.each(function() {
			if ( type === "string" ) {
				// toggle individual class names
				var className,
					i = 0,
					self = jQuery( this ),
					classNames = value.match( core_rnotwhite ) || [];

				while ( (className = classNames[ i++ ]) ) {
					// check each className given, space separated list
					if ( self.hasClass( className ) ) {
						self.removeClass( className );
					} else {
						self.addClass( className );
					}
				}

			// Toggle whole class name
			} else if ( type === core_strundefined || type === "boolean" ) {
				if ( this.className ) {
					// store className if set
					data_priv.set( this, "__className__", this.className );
				}

				// If the element has a class name or if we're passed "false",
				// then remove the whole classname (if there was one, the above saved it).
				// Otherwise bring back whatever was previously saved (if anything),
				// falling back to the empty string if nothing was stored.
				this.className = this.className || value === false ? "" : data_priv.get( this, "__className__" ) || "";
			}
		});
	},

	hasClass: function( selector ) {
		var className = " " + selector + " ",
			i = 0,
			l = this.length;
		for ( ; i < l; i++ ) {
			if ( this[i].nodeType === 1 && (" " + this[i].className + " ").replace(rclass, " ").indexOf( className ) >= 0 ) {
				return true;
			}
		}

		return false;
	},

	val: function( value ) {
		var hooks, ret, isFunction,
			elem = this[0];

		if ( !arguments.length ) {
			if ( elem ) {
				hooks = jQuery.valHooks[ elem.type ] || jQuery.valHooks[ elem.nodeName.toLowerCase() ];

				if ( hooks && "get" in hooks && (ret = hooks.get( elem, "value" )) !== undefined ) {
					return ret;
				}

				ret = elem.value;

				return typeof ret === "string" ?
					// handle most common string cases
					ret.replace(rreturn, "") :
					// handle cases where value is null/undef or number
					ret == null ? "" : ret;
			}

			return;
		}

		isFunction = jQuery.isFunction( value );

		return this.each(function( i ) {
			var val;

			if ( this.nodeType !== 1 ) {
				return;
			}

			if ( isFunction ) {
				val = value.call( this, i, jQuery( this ).val() );
			} else {
				val = value;
			}

			// Treat null/undefined as ""; convert numbers to string
			if ( val == null ) {
				val = "";
			} else if ( typeof val === "number" ) {
				val += "";
			} else if ( jQuery.isArray( val ) ) {
				val = jQuery.map(val, function ( value ) {
					return value == null ? "" : value + "";
				});
			}

			hooks = jQuery.valHooks[ this.type ] || jQuery.valHooks[ this.nodeName.toLowerCase() ];

			// If set returns undefined, fall back to normal setting
			if ( !hooks || !("set" in hooks) || hooks.set( this, val, "value" ) === undefined ) {
				this.value = val;
			}
		});
	}
});

jQuery.extend({
	valHooks: {
		option: {
			get: function( elem ) {
				// attributes.value is undefined in Blackberry 4.7 but
				// uses .value. See #6932
				var val = elem.attributes.value;
				return !val || val.specified ? elem.value : elem.text;
			}
		},
		select: {
			get: function( elem ) {
				var value, option,
					options = elem.options,
					index = elem.selectedIndex,
					one = elem.type === "select-one" || index < 0,
					values = one ? null : [],
					max = one ? index + 1 : options.length,
					i = index < 0 ?
						max :
						one ? index : 0;

				// Loop through all the selected options
				for ( ; i < max; i++ ) {
					option = options[ i ];

					// IE6-9 doesn't update selected after form reset (#2551)
					if ( ( option.selected || i === index ) &&
							// Don't return options that are disabled or in a disabled optgroup
							( jQuery.support.optDisabled ? !option.disabled : option.getAttribute("disabled") === null ) &&
							( !option.parentNode.disabled || !jQuery.nodeName( option.parentNode, "optgroup" ) ) ) {

						// Get the specific value for the option
						value = jQuery( option ).val();

						// We don't need an array for one selects
						if ( one ) {
							return value;
						}

						// Multi-Selects return an array
						values.push( value );
					}
				}

				return values;
			},

			set: function( elem, value ) {
				var optionSet, option,
					options = elem.options,
					values = jQuery.makeArray( value ),
					i = options.length;

				while ( i-- ) {
					option = options[ i ];
					if ( (option.selected = jQuery.inArray( jQuery(option).val(), values ) >= 0) ) {
						optionSet = true;
					}
				}

				// force browsers to behave consistently when non-matching value is set
				if ( !optionSet ) {
					elem.selectedIndex = -1;
				}
				return values;
			}
		}
	},

	attr: function( elem, name, value ) {
		var hooks, ret,
			nType = elem.nodeType;

		// don't get/set attributes on text, comment and attribute nodes
		if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		// Fallback to prop when attributes are not supported
		if ( typeof elem.getAttribute === core_strundefined ) {
			return jQuery.prop( elem, name, value );
		}

		// All attributes are lowercase
		// Grab necessary hook if one is defined
		if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {
			name = name.toLowerCase();
			hooks = jQuery.attrHooks[ name ] ||
				( jQuery.expr.match.bool.test( name ) ? boolHook : nodeHook );
		}

		if ( value !== undefined ) {

			if ( value === null ) {
				jQuery.removeAttr( elem, name );

			} else if ( hooks && "set" in hooks && (ret = hooks.set( elem, value, name )) !== undefined ) {
				return ret;

			} else {
				elem.setAttribute( name, value + "" );
				return value;
			}

		} else if ( hooks && "get" in hooks && (ret = hooks.get( elem, name )) !== null ) {
			return ret;

		} else {
			ret = jQuery.find.attr( elem, name );

			// Non-existent attributes return null, we normalize to undefined
			return ret == null ?
				undefined :
				ret;
		}
	},

	removeAttr: function( elem, value ) {
		var name, propName,
			i = 0,
			attrNames = value && value.match( core_rnotwhite );

		if ( attrNames && elem.nodeType === 1 ) {
			while ( (name = attrNames[i++]) ) {
				propName = jQuery.propFix[ name ] || name;

				// Boolean attributes get special treatment (#10870)
				if ( jQuery.expr.match.bool.test( name ) ) {
					// Set corresponding property to false
					elem[ propName ] = false;
				}

				elem.removeAttribute( name );
			}
		}
	},

	attrHooks: {
		type: {
			set: function( elem, value ) {
				if ( !jQuery.support.radioValue && value === "radio" && jQuery.nodeName(elem, "input") ) {
					// Setting the type on a radio button after the value resets the value in IE6-9
					// Reset value to default in case type is set after value during creation
					var val = elem.value;
					elem.setAttribute( "type", value );
					if ( val ) {
						elem.value = val;
					}
					return value;
				}
			}
		}
	},

	propFix: {
		"for": "htmlFor",
		"class": "className"
	},

	prop: function( elem, name, value ) {
		var ret, hooks, notxml,
			nType = elem.nodeType;

		// don't get/set properties on text, comment and attribute nodes
		if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		notxml = nType !== 1 || !jQuery.isXMLDoc( elem );

		if ( notxml ) {
			// Fix name and attach hooks
			name = jQuery.propFix[ name ] || name;
			hooks = jQuery.propHooks[ name ];
		}

		if ( value !== undefined ) {
			return hooks && "set" in hooks && (ret = hooks.set( elem, value, name )) !== undefined ?
				ret :
				( elem[ name ] = value );

		} else {
			return hooks && "get" in hooks && (ret = hooks.get( elem, name )) !== null ?
				ret :
				elem[ name ];
		}
	},

	propHooks: {
		tabIndex: {
			get: function( elem ) {
				return elem.hasAttribute( "tabindex" ) || rfocusable.test( elem.nodeName ) || elem.href ?
					elem.tabIndex :
					-1;
			}
		}
	}
});

// Hooks for boolean attributes
boolHook = {
	set: function( elem, value, name ) {
		if ( value === false ) {
			// Remove boolean attributes when set to false
			jQuery.removeAttr( elem, name );
		} else {
			elem.setAttribute( name, name );
		}
		return name;
	}
};
jQuery.each( jQuery.expr.match.bool.source.match( /\w+/g ), function( i, name ) {
	var getter = jQuery.expr.attrHandle[ name ] || jQuery.find.attr;

	jQuery.expr.attrHandle[ name ] = function( elem, name, isXML ) {
		var fn = jQuery.expr.attrHandle[ name ],
			ret = isXML ?
				undefined :
				/* jshint eqeqeq: false */
				// Temporarily disable this handler to check existence
				(jQuery.expr.attrHandle[ name ] = undefined) !=
					getter( elem, name, isXML ) ?

					name.toLowerCase() :
					null;

		// Restore handler
		jQuery.expr.attrHandle[ name ] = fn;

		return ret;
	};
});

// Support: IE9+
// Selectedness for an option in an optgroup can be inaccurate
if ( !jQuery.support.optSelected ) {
	jQuery.propHooks.selected = {
		get: function( elem ) {
			var parent = elem.parentNode;
			if ( parent && parent.parentNode ) {
				parent.parentNode.selectedIndex;
			}
			return null;
		}
	};
}

jQuery.each([
	"tabIndex",
	"readOnly",
	"maxLength",
	"cellSpacing",
	"cellPadding",
	"rowSpan",
	"colSpan",
	"useMap",
	"frameBorder",
	"contentEditable"
], function() {
	jQuery.propFix[ this.toLowerCase() ] = this;
});

// Radios and checkboxes getter/setter
jQuery.each([ "radio", "checkbox" ], function() {
	jQuery.valHooks[ this ] = {
		set: function( elem, value ) {
			if ( jQuery.isArray( value ) ) {
				return ( elem.checked = jQuery.inArray( jQuery(elem).val(), value ) >= 0 );
			}
		}
	};
	if ( !jQuery.support.checkOn ) {
		jQuery.valHooks[ this ].get = function( elem ) {
			// Support: Webkit
			// "" is returned instead of "on" if a value isn't specified
			return elem.getAttribute("value") === null ? "on" : elem.value;
		};
	}
});
var rkeyEvent = /^key/,
	rmouseEvent = /^(?:mouse|contextmenu)|click/,
	rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
	rtypenamespace = /^([^.]*)(?:\.(.+)|)$/;

function returnTrue() {
	return true;
}

function returnFalse() {
	return false;
}

function safeActiveElement() {
	try {
		return document.activeElement;
	} catch ( err ) { }
}

/*
 * Helper functions for managing events -- not part of the public interface.
 * Props to Dean Edwards' addEvent library for many of the ideas.
 */
jQuery.event = {

	global: {},

	add: function( elem, types, handler, data, selector ) {

		var handleObjIn, eventHandle, tmp,
			events, t, handleObj,
			special, handlers, type, namespaces, origType,
			elemData = data_priv.get( elem );

		// Don't attach events to noData or text/comment nodes (but allow plain objects)
		if ( !elemData ) {
			return;
		}

		// Caller can pass in an object of custom data in lieu of the handler
		if ( handler.handler ) {
			handleObjIn = handler;
			handler = handleObjIn.handler;
			selector = handleObjIn.selector;
		}

		// Make sure that the handler has a unique ID, used to find/remove it later
		if ( !handler.guid ) {
			handler.guid = jQuery.guid++;
		}

		// Init the element's event structure and main handler, if this is the first
		if ( !(events = elemData.events) ) {
			events = elemData.events = {};
		}
		if ( !(eventHandle = elemData.handle) ) {
			eventHandle = elemData.handle = function( e ) {
				// Discard the second event of a jQuery.event.trigger() and
				// when an event is called after a page has unloaded
				return typeof jQuery !== core_strundefined && (!e || jQuery.event.triggered !== e.type) ?
					jQuery.event.dispatch.apply( eventHandle.elem, arguments ) :
					undefined;
			};
			// Add elem as a property of the handle fn to prevent a memory leak with IE non-native events
			eventHandle.elem = elem;
		}

		// Handle multiple events separated by a space
		types = ( types || "" ).match( core_rnotwhite ) || [""];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[t] ) || [];
			type = origType = tmp[1];
			namespaces = ( tmp[2] || "" ).split( "." ).sort();

			// There *must* be a type, no attaching namespace-only handlers
			if ( !type ) {
				continue;
			}

			// If event changes its type, use the special event handlers for the changed type
			special = jQuery.event.special[ type ] || {};

			// If selector defined, determine special event api type, otherwise given type
			type = ( selector ? special.delegateType : special.bindType ) || type;

			// Update special based on newly reset type
			special = jQuery.event.special[ type ] || {};

			// handleObj is passed to all event handlers
			handleObj = jQuery.extend({
				type: type,
				origType: origType,
				data: data,
				handler: handler,
				guid: handler.guid,
				selector: selector,
				needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
				namespace: namespaces.join(".")
			}, handleObjIn );

			// Init the event handler queue if we're the first
			if ( !(handlers = events[ type ]) ) {
				handlers = events[ type ] = [];
				handlers.delegateCount = 0;

				// Only use addEventListener if the special events handler returns false
				if ( !special.setup || special.setup.call( elem, data, namespaces, eventHandle ) === false ) {
					if ( elem.addEventListener ) {
						elem.addEventListener( type, eventHandle, false );
					}
				}
			}

			if ( special.add ) {
				special.add.call( elem, handleObj );

				if ( !handleObj.handler.guid ) {
					handleObj.handler.guid = handler.guid;
				}
			}

			// Add to the element's handler list, delegates in front
			if ( selector ) {
				handlers.splice( handlers.delegateCount++, 0, handleObj );
			} else {
				handlers.push( handleObj );
			}

			// Keep track of which events have ever been used, for event optimization
			jQuery.event.global[ type ] = true;
		}

		// Nullify elem to prevent memory leaks in IE
		elem = null;
	},

	// Detach an event or set of events from an element
	remove: function( elem, types, handler, selector, mappedTypes ) {

		var j, origCount, tmp,
			events, t, handleObj,
			special, handlers, type, namespaces, origType,
			elemData = data_priv.hasData( elem ) && data_priv.get( elem );

		if ( !elemData || !(events = elemData.events) ) {
			return;
		}

		// Once for each type.namespace in types; type may be omitted
		types = ( types || "" ).match( core_rnotwhite ) || [""];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[t] ) || [];
			type = origType = tmp[1];
			namespaces = ( tmp[2] || "" ).split( "." ).sort();

			// Unbind all events (on this namespace, if provided) for the element
			if ( !type ) {
				for ( type in events ) {
					jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
				}
				continue;
			}

			special = jQuery.event.special[ type ] || {};
			type = ( selector ? special.delegateType : special.bindType ) || type;
			handlers = events[ type ] || [];
			tmp = tmp[2] && new RegExp( "(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" );

			// Remove matching events
			origCount = j = handlers.length;
			while ( j-- ) {
				handleObj = handlers[ j ];

				if ( ( mappedTypes || origType === handleObj.origType ) &&
					( !handler || handler.guid === handleObj.guid ) &&
					( !tmp || tmp.test( handleObj.namespace ) ) &&
					( !selector || selector === handleObj.selector || selector === "**" && handleObj.selector ) ) {
					handlers.splice( j, 1 );

					if ( handleObj.selector ) {
						handlers.delegateCount--;
					}
					if ( special.remove ) {
						special.remove.call( elem, handleObj );
					}
				}
			}

			// Remove generic event handler if we removed something and no more handlers exist
			// (avoids potential for endless recursion during removal of special event handlers)
			if ( origCount && !handlers.length ) {
				if ( !special.teardown || special.teardown.call( elem, namespaces, elemData.handle ) === false ) {
					jQuery.removeEvent( elem, type, elemData.handle );
				}

				delete events[ type ];
			}
		}

		// Remove the expando if it's no longer used
		if ( jQuery.isEmptyObject( events ) ) {
			delete elemData.handle;
			data_priv.remove( elem, "events" );
		}
	},

	trigger: function( event, data, elem, onlyHandlers ) {

		var i, cur, tmp, bubbleType, ontype, handle, special,
			eventPath = [ elem || document ],
			type = core_hasOwn.call( event, "type" ) ? event.type : event,
			namespaces = core_hasOwn.call( event, "namespace" ) ? event.namespace.split(".") : [];

		cur = tmp = elem = elem || document;

		// Don't do events on text and comment nodes
		if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
			return;
		}

		// focus/blur morphs to focusin/out; ensure we're not firing them right now
		if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
			return;
		}

		if ( type.indexOf(".") >= 0 ) {
			// Namespaced trigger; create a regexp to match event type in handle()
			namespaces = type.split(".");
			type = namespaces.shift();
			namespaces.sort();
		}
		ontype = type.indexOf(":") < 0 && "on" + type;

		// Caller can pass in a jQuery.Event object, Object, or just an event type string
		event = event[ jQuery.expando ] ?
			event :
			new jQuery.Event( type, typeof event === "object" && event );

		// Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)
		event.isTrigger = onlyHandlers ? 2 : 3;
		event.namespace = namespaces.join(".");
		event.namespace_re = event.namespace ?
			new RegExp( "(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" ) :
			null;

		// Clean up the event in case it is being reused
		event.result = undefined;
		if ( !event.target ) {
			event.target = elem;
		}

		// Clone any incoming data and prepend the event, creating the handler arg list
		data = data == null ?
			[ event ] :
			jQuery.makeArray( data, [ event ] );

		// Allow special events to draw outside the lines
		special = jQuery.event.special[ type ] || {};
		if ( !onlyHandlers && special.trigger && special.trigger.apply( elem, data ) === false ) {
			return;
		}

		// Determine event propagation path in advance, per W3C events spec (#9951)
		// Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
		if ( !onlyHandlers && !special.noBubble && !jQuery.isWindow( elem ) ) {

			bubbleType = special.delegateType || type;
			if ( !rfocusMorph.test( bubbleType + type ) ) {
				cur = cur.parentNode;
			}
			for ( ; cur; cur = cur.parentNode ) {
				eventPath.push( cur );
				tmp = cur;
			}

			// Only add window if we got to document (e.g., not plain obj or detached DOM)
			if ( tmp === (elem.ownerDocument || document) ) {
				eventPath.push( tmp.defaultView || tmp.parentWindow || window );
			}
		}

		// Fire handlers on the event path
		i = 0;
		while ( (cur = eventPath[i++]) && !event.isPropagationStopped() ) {

			event.type = i > 1 ?
				bubbleType :
				special.bindType || type;

			// jQuery handler
			handle = ( data_priv.get( cur, "events" ) || {} )[ event.type ] && data_priv.get( cur, "handle" );
			if ( handle ) {
				handle.apply( cur, data );
			}

			// Native handler
			handle = ontype && cur[ ontype ];
			if ( handle && jQuery.acceptData( cur ) && handle.apply && handle.apply( cur, data ) === false ) {
				event.preventDefault();
			}
		}
		event.type = type;

		// If nobody prevented the default action, do it now
		if ( !onlyHandlers && !event.isDefaultPrevented() ) {

			if ( (!special._default || special._default.apply( eventPath.pop(), data ) === false) &&
				jQuery.acceptData( elem ) ) {

				// Call a native DOM method on the target with the same name name as the event.
				// Don't do default actions on window, that's where global variables be (#6170)
				if ( ontype && jQuery.isFunction( elem[ type ] ) && !jQuery.isWindow( elem ) ) {

					// Don't re-trigger an onFOO event when we call its FOO() method
					tmp = elem[ ontype ];

					if ( tmp ) {
						elem[ ontype ] = null;
					}

					// Prevent re-triggering of the same event, since we already bubbled it above
					jQuery.event.triggered = type;
					elem[ type ]();
					jQuery.event.triggered = undefined;

					if ( tmp ) {
						elem[ ontype ] = tmp;
					}
				}
			}
		}

		return event.result;
	},

	dispatch: function( event ) {

		// Make a writable jQuery.Event from the native event object
		event = jQuery.event.fix( event );

		var i, j, ret, matched, handleObj,
			handlerQueue = [],
			args = core_slice.call( arguments ),
			handlers = ( data_priv.get( this, "events" ) || {} )[ event.type ] || [],
			special = jQuery.event.special[ event.type ] || {};

		// Use the fix-ed jQuery.Event rather than the (read-only) native event
		args[0] = event;
		event.delegateTarget = this;

		// Call the preDispatch hook for the mapped type, and let it bail if desired
		if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
			return;
		}

		// Determine handlers
		handlerQueue = jQuery.event.handlers.call( this, event, handlers );

		// Run delegates first; they may want to stop propagation beneath us
		i = 0;
		while ( (matched = handlerQueue[ i++ ]) && !event.isPropagationStopped() ) {
			event.currentTarget = matched.elem;

			j = 0;
			while ( (handleObj = matched.handlers[ j++ ]) && !event.isImmediatePropagationStopped() ) {

				// Triggered event must either 1) have no namespace, or
				// 2) have namespace(s) a subset or equal to those in the bound event (both can have no namespace).
				if ( !event.namespace_re || event.namespace_re.test( handleObj.namespace ) ) {

					event.handleObj = handleObj;
					event.data = handleObj.data;

					ret = ( (jQuery.event.special[ handleObj.origType ] || {}).handle || handleObj.handler )
							.apply( matched.elem, args );

					if ( ret !== undefined ) {
						if ( (event.result = ret) === false ) {
							event.preventDefault();
							event.stopPropagation();
						}
					}
				}
			}
		}

		// Call the postDispatch hook for the mapped type
		if ( special.postDispatch ) {
			special.postDispatch.call( this, event );
		}

		return event.result;
	},

	handlers: function( event, handlers ) {
		var i, matches, sel, handleObj,
			handlerQueue = [],
			delegateCount = handlers.delegateCount,
			cur = event.target;

		// Find delegate handlers
		// Black-hole SVG <use> instance trees (#13180)
		// Avoid non-left-click bubbling in Firefox (#3861)
		if ( delegateCount && cur.nodeType && (!event.button || event.type !== "click") ) {

			for ( ; cur !== this; cur = cur.parentNode || this ) {

				// Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
				if ( cur.disabled !== true || event.type !== "click" ) {
					matches = [];
					for ( i = 0; i < delegateCount; i++ ) {
						handleObj = handlers[ i ];

						// Don't conflict with Object.prototype properties (#13203)
						sel = handleObj.selector + " ";

						if ( matches[ sel ] === undefined ) {
							matches[ sel ] = handleObj.needsContext ?
								jQuery( sel, this ).index( cur ) >= 0 :
								jQuery.find( sel, this, null, [ cur ] ).length;
						}
						if ( matches[ sel ] ) {
							matches.push( handleObj );
						}
					}
					if ( matches.length ) {
						handlerQueue.push({ elem: cur, handlers: matches });
					}
				}
			}
		}

		// Add the remaining (directly-bound) handlers
		if ( delegateCount < handlers.length ) {
			handlerQueue.push({ elem: this, handlers: handlers.slice( delegateCount ) });
		}

		return handlerQueue;
	},

	// Includes some event props shared by KeyEvent and MouseEvent
	props: "altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),

	fixHooks: {},

	keyHooks: {
		props: "char charCode key keyCode".split(" "),
		filter: function( event, original ) {

			// Add which for key events
			if ( event.which == null ) {
				event.which = original.charCode != null ? original.charCode : original.keyCode;
			}

			return event;
		}
	},

	mouseHooks: {
		props: "button buttons clientX clientY offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
		filter: function( event, original ) {
			var eventDoc, doc, body,
				button = original.button;

			// Calculate pageX/Y if missing and clientX/Y available
			if ( event.pageX == null && original.clientX != null ) {
				eventDoc = event.target.ownerDocument || document;
				doc = eventDoc.documentElement;
				body = eventDoc.body;

				event.pageX = original.clientX + ( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) - ( doc && doc.clientLeft || body && body.clientLeft || 0 );
				event.pageY = original.clientY + ( doc && doc.scrollTop  || body && body.scrollTop  || 0 ) - ( doc && doc.clientTop  || body && body.clientTop  || 0 );
			}

			// Add which for click: 1 === left; 2 === middle; 3 === right
			// Note: button is not normalized, so don't use it
			if ( !event.which && button !== undefined ) {
				event.which = ( button & 1 ? 1 : ( button & 2 ? 3 : ( button & 4 ? 2 : 0 ) ) );
			}

			return event;
		}
	},

	fix: function( event ) {
		if ( event[ jQuery.expando ] ) {
			return event;
		}

		// Create a writable copy of the event object and normalize some properties
		var i, prop, copy,
			type = event.type,
			originalEvent = event,
			fixHook = this.fixHooks[ type ];

		if ( !fixHook ) {
			this.fixHooks[ type ] = fixHook =
				rmouseEvent.test( type ) ? this.mouseHooks :
				rkeyEvent.test( type ) ? this.keyHooks :
				{};
		}
		copy = fixHook.props ? this.props.concat( fixHook.props ) : this.props;

		event = new jQuery.Event( originalEvent );

		i = copy.length;
		while ( i-- ) {
			prop = copy[ i ];
			event[ prop ] = originalEvent[ prop ];
		}

		// Support: Cordova 2.5 (WebKit) (#13255)
		// All events should have a target; Cordova deviceready doesn't
		if ( !event.target ) {
			event.target = document;
		}

		// Support: Safari 6.0+, Chrome < 28
		// Target should not be a text node (#504, #13143)
		if ( event.target.nodeType === 3 ) {
			event.target = event.target.parentNode;
		}

		return fixHook.filter? fixHook.filter( event, originalEvent ) : event;
	},

	special: {
		load: {
			// Prevent triggered image.load events from bubbling to window.load
			noBubble: true
		},
		focus: {
			// Fire native event if possible so blur/focus sequence is correct
			trigger: function() {
				if ( this !== safeActiveElement() && this.focus ) {
					this.focus();
					return false;
				}
			},
			delegateType: "focusin"
		},
		blur: {
			trigger: function() {
				if ( this === safeActiveElement() && this.blur ) {
					this.blur();
					return false;
				}
			},
			delegateType: "focusout"
		},
		click: {
			// For checkbox, fire native event so checked state will be right
			trigger: function() {
				if ( this.type === "checkbox" && this.click && jQuery.nodeName( this, "input" ) ) {
					this.click();
					return false;
				}
			},

			// For cross-browser consistency, don't fire native .click() on links
			_default: function( event ) {
				return jQuery.nodeName( event.target, "a" );
			}
		},

		beforeunload: {
			postDispatch: function( event ) {

				// Support: Firefox 20+
				// Firefox doesn't alert if the returnValue field is not set.
				if ( event.result !== undefined ) {
					event.originalEvent.returnValue = event.result;
				}
			}
		}
	},

	simulate: function( type, elem, event, bubble ) {
		// Piggyback on a donor event to simulate a different one.
		// Fake originalEvent to avoid donor's stopPropagation, but if the
		// simulated event prevents default then we do the same on the donor.
		var e = jQuery.extend(
			new jQuery.Event(),
			event,
			{
				type: type,
				isSimulated: true,
				originalEvent: {}
			}
		);
		if ( bubble ) {
			jQuery.event.trigger( e, null, elem );
		} else {
			jQuery.event.dispatch.call( elem, e );
		}
		if ( e.isDefaultPrevented() ) {
			event.preventDefault();
		}
	}
};

jQuery.removeEvent = function( elem, type, handle ) {
	if ( elem.removeEventListener ) {
		elem.removeEventListener( type, handle, false );
	}
};

jQuery.Event = function( src, props ) {
	// Allow instantiation without the 'new' keyword
	if ( !(this instanceof jQuery.Event) ) {
		return new jQuery.Event( src, props );
	}

	// Event object
	if ( src && src.type ) {
		this.originalEvent = src;
		this.type = src.type;

		// Events bubbling up the document may have been marked as prevented
		// by a handler lower down the tree; reflect the correct value.
		this.isDefaultPrevented = ( src.defaultPrevented ||
			src.getPreventDefault && src.getPreventDefault() ) ? returnTrue : returnFalse;

	// Event type
	} else {
		this.type = src;
	}

	// Put explicitly provided properties onto the event object
	if ( props ) {
		jQuery.extend( this, props );
	}

	// Create a timestamp if incoming event doesn't have one
	this.timeStamp = src && src.timeStamp || jQuery.now();

	// Mark it as fixed
	this[ jQuery.expando ] = true;
};

// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
jQuery.Event.prototype = {
	isDefaultPrevented: returnFalse,
	isPropagationStopped: returnFalse,
	isImmediatePropagationStopped: returnFalse,

	preventDefault: function() {
		var e = this.originalEvent;

		this.isDefaultPrevented = returnTrue;

		if ( e && e.preventDefault ) {
			e.preventDefault();
		}
	},
	stopPropagation: function() {
		var e = this.originalEvent;

		this.isPropagationStopped = returnTrue;

		if ( e && e.stopPropagation ) {
			e.stopPropagation();
		}
	},
	stopImmediatePropagation: function() {
		this.isImmediatePropagationStopped = returnTrue;
		this.stopPropagation();
	}
};

// Create mouseenter/leave events using mouseover/out and event-time checks
// Support: Chrome 15+
jQuery.each({
	mouseenter: "mouseover",
	mouseleave: "mouseout"
}, function( orig, fix ) {
	jQuery.event.special[ orig ] = {
		delegateType: fix,
		bindType: fix,

		handle: function( event ) {
			var ret,
				target = this,
				related = event.relatedTarget,
				handleObj = event.handleObj;

			// For mousenter/leave call the handler if related is outside the target.
			// NB: No relatedTarget if the mouse left/entered the browser window
			if ( !related || (related !== target && !jQuery.contains( target, related )) ) {
				event.type = handleObj.origType;
				ret = handleObj.handler.apply( this, arguments );
				event.type = fix;
			}
			return ret;
		}
	};
});

// Create "bubbling" focus and blur events
// Support: Firefox, Chrome, Safari
if ( !jQuery.support.focusinBubbles ) {
	jQuery.each({ focus: "focusin", blur: "focusout" }, function( orig, fix ) {

		// Attach a single capturing handler while someone wants focusin/focusout
		var attaches = 0,
			handler = function( event ) {
				jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ), true );
			};

		jQuery.event.special[ fix ] = {
			setup: function() {
				if ( attaches++ === 0 ) {
					document.addEventListener( orig, handler, true );
				}
			},
			teardown: function() {
				if ( --attaches === 0 ) {
					document.removeEventListener( orig, handler, true );
				}
			}
		};
	});
}

jQuery.fn.extend({

	on: function( types, selector, data, fn, /*INTERNAL*/ one ) {
		var origFn, type;

		// Types can be a map of types/handlers
		if ( typeof types === "object" ) {
			// ( types-Object, selector, data )
			if ( typeof selector !== "string" ) {
				// ( types-Object, data )
				data = data || selector;
				selector = undefined;
			}
			for ( type in types ) {
				this.on( type, selector, data, types[ type ], one );
			}
			return this;
		}

		if ( data == null && fn == null ) {
			// ( types, fn )
			fn = selector;
			data = selector = undefined;
		} else if ( fn == null ) {
			if ( typeof selector === "string" ) {
				// ( types, selector, fn )
				fn = data;
				data = undefined;
			} else {
				// ( types, data, fn )
				fn = data;
				data = selector;
				selector = undefined;
			}
		}
		if ( fn === false ) {
			fn = returnFalse;
		} else if ( !fn ) {
			return this;
		}

		if ( one === 1 ) {
			origFn = fn;
			fn = function( event ) {
				// Can use an empty set, since event contains the info
				jQuery().off( event );
				return origFn.apply( this, arguments );
			};
			// Use same guid so caller can remove using origFn
			fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
		}
		return this.each( function() {
			jQuery.event.add( this, types, fn, data, selector );
		});
	},
	one: function( types, selector, data, fn ) {
		return this.on( types, selector, data, fn, 1 );
	},
	off: function( types, selector, fn ) {
		var handleObj, type;
		if ( types && types.preventDefault && types.handleObj ) {
			// ( event )  dispatched jQuery.Event
			handleObj = types.handleObj;
			jQuery( types.delegateTarget ).off(
				handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType,
				handleObj.selector,
				handleObj.handler
			);
			return this;
		}
		if ( typeof types === "object" ) {
			// ( types-object [, selector] )
			for ( type in types ) {
				this.off( type, selector, types[ type ] );
			}
			return this;
		}
		if ( selector === false || typeof selector === "function" ) {
			// ( types [, fn] )
			fn = selector;
			selector = undefined;
		}
		if ( fn === false ) {
			fn = returnFalse;
		}
		return this.each(function() {
			jQuery.event.remove( this, types, fn, selector );
		});
	},

	trigger: function( type, data ) {
		return this.each(function() {
			jQuery.event.trigger( type, data, this );
		});
	},
	triggerHandler: function( type, data ) {
		var elem = this[0];
		if ( elem ) {
			return jQuery.event.trigger( type, data, elem, true );
		}
	}
});
var isSimple = /^.[^:#\[\.,]*$/,
	rparentsprev = /^(?:parents|prev(?:Until|All))/,
	rneedsContext = jQuery.expr.match.needsContext,
	// methods guaranteed to produce a unique set when starting from a unique set
	guaranteedUnique = {
		children: true,
		contents: true,
		next: true,
		prev: true
	};

jQuery.fn.extend({
	find: function( selector ) {
		var i,
			ret = [],
			self = this,
			len = self.length;

		if ( typeof selector !== "string" ) {
			return this.pushStack( jQuery( selector ).filter(function() {
				for ( i = 0; i < len; i++ ) {
					if ( jQuery.contains( self[ i ], this ) ) {
						return true;
					}
				}
			}) );
		}

		for ( i = 0; i < len; i++ ) {
			jQuery.find( selector, self[ i ], ret );
		}

		// Needed because $( selector, context ) becomes $( context ).find( selector )
		ret = this.pushStack( len > 1 ? jQuery.unique( ret ) : ret );
		ret.selector = this.selector ? this.selector + " " + selector : selector;
		return ret;
	},

	has: function( target ) {
		var targets = jQuery( target, this ),
			l = targets.length;

		return this.filter(function() {
			var i = 0;
			for ( ; i < l; i++ ) {
				if ( jQuery.contains( this, targets[i] ) ) {
					return true;
				}
			}
		});
	},

	not: function( selector ) {
		return this.pushStack( winnow(this, selector || [], true) );
	},

	filter: function( selector ) {
		return this.pushStack( winnow(this, selector || [], false) );
	},

	is: function( selector ) {
		return !!winnow(
			this,

			// If this is a positional/relative selector, check membership in the returned set
			// so $("p:first").is("p:last") won't return true for a doc with two "p".
			typeof selector === "string" && rneedsContext.test( selector ) ?
				jQuery( selector ) :
				selector || [],
			false
		).length;
	},

	closest: function( selectors, context ) {
		var cur,
			i = 0,
			l = this.length,
			matched = [],
			pos = ( rneedsContext.test( selectors ) || typeof selectors !== "string" ) ?
				jQuery( selectors, context || this.context ) :
				0;

		for ( ; i < l; i++ ) {
			for ( cur = this[i]; cur && cur !== context; cur = cur.parentNode ) {
				// Always skip document fragments
				if ( cur.nodeType < 11 && (pos ?
					pos.index(cur) > -1 :

					// Don't pass non-elements to Sizzle
					cur.nodeType === 1 &&
						jQuery.find.matchesSelector(cur, selectors)) ) {

					cur = matched.push( cur );
					break;
				}
			}
		}

		return this.pushStack( matched.length > 1 ? jQuery.unique( matched ) : matched );
	},

	// Determine the position of an element within
	// the matched set of elements
	index: function( elem ) {

		// No argument, return index in parent
		if ( !elem ) {
			return ( this[ 0 ] && this[ 0 ].parentNode ) ? this.first().prevAll().length : -1;
		}

		// index in selector
		if ( typeof elem === "string" ) {
			return core_indexOf.call( jQuery( elem ), this[ 0 ] );
		}

		// Locate the position of the desired element
		return core_indexOf.call( this,

			// If it receives a jQuery object, the first element is used
			elem.jquery ? elem[ 0 ] : elem
		);
	},

	add: function( selector, context ) {
		var set = typeof selector === "string" ?
				jQuery( selector, context ) :
				jQuery.makeArray( selector && selector.nodeType ? [ selector ] : selector ),
			all = jQuery.merge( this.get(), set );

		return this.pushStack( jQuery.unique(all) );
	},

	addBack: function( selector ) {
		return this.add( selector == null ?
			this.prevObject : this.prevObject.filter(selector)
		);
	}
});

function sibling( cur, dir ) {
	while ( (cur = cur[dir]) && cur.nodeType !== 1 ) {}

	return cur;
}

jQuery.each({
	parent: function( elem ) {
		var parent = elem.parentNode;
		return parent && parent.nodeType !== 11 ? parent : null;
	},
	parents: function( elem ) {
		return jQuery.dir( elem, "parentNode" );
	},
	parentsUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "parentNode", until );
	},
	next: function( elem ) {
		return sibling( elem, "nextSibling" );
	},
	prev: function( elem ) {
		return sibling( elem, "previousSibling" );
	},
	nextAll: function( elem ) {
		return jQuery.dir( elem, "nextSibling" );
	},
	prevAll: function( elem ) {
		return jQuery.dir( elem, "previousSibling" );
	},
	nextUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "nextSibling", until );
	},
	prevUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "previousSibling", until );
	},
	siblings: function( elem ) {
		return jQuery.sibling( ( elem.parentNode || {} ).firstChild, elem );
	},
	children: function( elem ) {
		return jQuery.sibling( elem.firstChild );
	},
	contents: function( elem ) {
		return elem.contentDocument || jQuery.merge( [], elem.childNodes );
	}
}, function( name, fn ) {
	jQuery.fn[ name ] = function( until, selector ) {
		var matched = jQuery.map( this, fn, until );

		if ( name.slice( -5 ) !== "Until" ) {
			selector = until;
		}

		if ( selector && typeof selector === "string" ) {
			matched = jQuery.filter( selector, matched );
		}

		if ( this.length > 1 ) {
			// Remove duplicates
			if ( !guaranteedUnique[ name ] ) {
				jQuery.unique( matched );
			}

			// Reverse order for parents* and prev-derivatives
			if ( rparentsprev.test( name ) ) {
				matched.reverse();
			}
		}

		return this.pushStack( matched );
	};
});

jQuery.extend({
	filter: function( expr, elems, not ) {
		var elem = elems[ 0 ];

		if ( not ) {
			expr = ":not(" + expr + ")";
		}

		return elems.length === 1 && elem.nodeType === 1 ?
			jQuery.find.matchesSelector( elem, expr ) ? [ elem ] : [] :
			jQuery.find.matches( expr, jQuery.grep( elems, function( elem ) {
				return elem.nodeType === 1;
			}));
	},

	dir: function( elem, dir, until ) {
		var matched = [],
			truncate = until !== undefined;

		while ( (elem = elem[ dir ]) && elem.nodeType !== 9 ) {
			if ( elem.nodeType === 1 ) {
				if ( truncate && jQuery( elem ).is( until ) ) {
					break;
				}
				matched.push( elem );
			}
		}
		return matched;
	},

	sibling: function( n, elem ) {
		var matched = [];

		for ( ; n; n = n.nextSibling ) {
			if ( n.nodeType === 1 && n !== elem ) {
				matched.push( n );
			}
		}

		return matched;
	}
});

// Implement the identical functionality for filter and not
function winnow( elements, qualifier, not ) {
	if ( jQuery.isFunction( qualifier ) ) {
		return jQuery.grep( elements, function( elem, i ) {
			/* jshint -W018 */
			return !!qualifier.call( elem, i, elem ) !== not;
		});

	}

	if ( qualifier.nodeType ) {
		return jQuery.grep( elements, function( elem ) {
			return ( elem === qualifier ) !== not;
		});

	}

	if ( typeof qualifier === "string" ) {
		if ( isSimple.test( qualifier ) ) {
			return jQuery.filter( qualifier, elements, not );
		}

		qualifier = jQuery.filter( qualifier, elements );
	}

	return jQuery.grep( elements, function( elem ) {
		return ( core_indexOf.call( qualifier, elem ) >= 0 ) !== not;
	});
}
var rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
	rtagName = /<([\w:]+)/,
	rhtml = /<|&#?\w+;/,
	rnoInnerhtml = /<(?:script|style|link)/i,
	manipulation_rcheckableType = /^(?:checkbox|radio)$/i,
	// checked="checked" or checked
	rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
	rscriptType = /^$|\/(?:java|ecma)script/i,
	rscriptTypeMasked = /^true\/(.*)/,
	rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,

	// We have to close these tags to support XHTML (#13200)
	wrapMap = {

		// Support: IE 9
		option: [ 1, "<select multiple='multiple'>", "</select>" ],

		thead: [ 1, "<table>", "</table>" ],
		col: [ 2, "<table><colgroup>", "</colgroup></table>" ],
		tr: [ 2, "<table><tbody>", "</tbody></table>" ],
		td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],

		_default: [ 0, "", "" ]
	};

// Support: IE 9
wrapMap.optgroup = wrapMap.option;

wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
wrapMap.th = wrapMap.td;

jQuery.fn.extend({
	text: function( value ) {
		return jQuery.access( this, function( value ) {
			return value === undefined ?
				jQuery.text( this ) :
				this.empty().append( ( this[ 0 ] && this[ 0 ].ownerDocument || document ).createTextNode( value ) );
		}, null, value, arguments.length );
	},

	append: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				var target = manipulationTarget( this, elem );
				target.appendChild( elem );
			}
		});
	},

	prepend: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				var target = manipulationTarget( this, elem );
				target.insertBefore( elem, target.firstChild );
			}
		});
	},

	before: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this );
			}
		});
	},

	after: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this.nextSibling );
			}
		});
	},

	// keepData is for internal use only--do not document
	remove: function( selector, keepData ) {
		var elem,
			elems = selector ? jQuery.filter( selector, this ) : this,
			i = 0;

		for ( ; (elem = elems[i]) != null; i++ ) {
			if ( !keepData && elem.nodeType === 1 ) {
				jQuery.cleanData( getAll( elem ) );
			}

			if ( elem.parentNode ) {
				if ( keepData && jQuery.contains( elem.ownerDocument, elem ) ) {
					setGlobalEval( getAll( elem, "script" ) );
				}
				elem.parentNode.removeChild( elem );
			}
		}

		return this;
	},

	empty: function() {
		var elem,
			i = 0;

		for ( ; (elem = this[i]) != null; i++ ) {
			if ( elem.nodeType === 1 ) {

				// Prevent memory leaks
				jQuery.cleanData( getAll( elem, false ) );

				// Remove any remaining nodes
				elem.textContent = "";
			}
		}

		return this;
	},

	clone: function( dataAndEvents, deepDataAndEvents ) {
		dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
		deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;

		return this.map( function () {
			return jQuery.clone( this, dataAndEvents, deepDataAndEvents );
		});
	},

	html: function( value ) {
		return jQuery.access( this, function( value ) {
			var elem = this[ 0 ] || {},
				i = 0,
				l = this.length;

			if ( value === undefined && elem.nodeType === 1 ) {
				return elem.innerHTML;
			}

			// See if we can take a shortcut and just use innerHTML
			if ( typeof value === "string" && !rnoInnerhtml.test( value ) &&
				!wrapMap[ ( rtagName.exec( value ) || [ "", "" ] )[ 1 ].toLowerCase() ] ) {

				value = value.replace( rxhtmlTag, "<$1></$2>" );

				try {
					for ( ; i < l; i++ ) {
						elem = this[ i ] || {};

						// Remove element nodes and prevent memory leaks
						if ( elem.nodeType === 1 ) {
							jQuery.cleanData( getAll( elem, false ) );
							elem.innerHTML = value;
						}
					}

					elem = 0;

				// If using innerHTML throws an exception, use the fallback method
				} catch( e ) {}
			}

			if ( elem ) {
				this.empty().append( value );
			}
		}, null, value, arguments.length );
	},

	replaceWith: function() {
		var
			// Snapshot the DOM in case .domManip sweeps something relevant into its fragment
			args = jQuery.map( this, function( elem ) {
				return [ elem.nextSibling, elem.parentNode ];
			}),
			i = 0;

		// Make the changes, replacing each context element with the new content
		this.domManip( arguments, function( elem ) {
			var next = args[ i++ ],
				parent = args[ i++ ];

			if ( parent ) {
				// Don't use the snapshot next if it has moved (#13810)
				if ( next && next.parentNode !== parent ) {
					next = this.nextSibling;
				}
				jQuery( this ).remove();
				parent.insertBefore( elem, next );
			}
		// Allow new content to include elements from the context set
		}, true );

		// Force removal if there was no new content (e.g., from empty arguments)
		return i ? this : this.remove();
	},

	detach: function( selector ) {
		return this.remove( selector, true );
	},

	domManip: function( args, callback, allowIntersection ) {

		// Flatten any nested arrays
		args = core_concat.apply( [], args );

		var fragment, first, scripts, hasScripts, node, doc,
			i = 0,
			l = this.length,
			set = this,
			iNoClone = l - 1,
			value = args[ 0 ],
			isFunction = jQuery.isFunction( value );

		// We can't cloneNode fragments that contain checked, in WebKit
		if ( isFunction || !( l <= 1 || typeof value !== "string" || jQuery.support.checkClone || !rchecked.test( value ) ) ) {
			return this.each(function( index ) {
				var self = set.eq( index );
				if ( isFunction ) {
					args[ 0 ] = value.call( this, index, self.html() );
				}
				self.domManip( args, callback, allowIntersection );
			});
		}

		if ( l ) {
			fragment = jQuery.buildFragment( args, this[ 0 ].ownerDocument, false, !allowIntersection && this );
			first = fragment.firstChild;

			if ( fragment.childNodes.length === 1 ) {
				fragment = first;
			}

			if ( first ) {
				scripts = jQuery.map( getAll( fragment, "script" ), disableScript );
				hasScripts = scripts.length;

				// Use the original fragment for the last item instead of the first because it can end up
				// being emptied incorrectly in certain situations (#8070).
				for ( ; i < l; i++ ) {
					node = fragment;

					if ( i !== iNoClone ) {
						node = jQuery.clone( node, true, true );

						// Keep references to cloned scripts for later restoration
						if ( hasScripts ) {
							// Support: QtWebKit
							// jQuery.merge because core_push.apply(_, arraylike) throws
							jQuery.merge( scripts, getAll( node, "script" ) );
						}
					}

					callback.call( this[ i ], node, i );
				}

				if ( hasScripts ) {
					doc = scripts[ scripts.length - 1 ].ownerDocument;

					// Reenable scripts
					jQuery.map( scripts, restoreScript );

					// Evaluate executable scripts on first document insertion
					for ( i = 0; i < hasScripts; i++ ) {
						node = scripts[ i ];
						if ( rscriptType.test( node.type || "" ) &&
							!data_priv.access( node, "globalEval" ) && jQuery.contains( doc, node ) ) {

							if ( node.src ) {
								// Hope ajax is available...
								jQuery._evalUrl( node.src );
							} else {
								jQuery.globalEval( node.textContent.replace( rcleanScript, "" ) );
							}
						}
					}
				}
			}
		}

		return this;
	}
});

jQuery.each({
	appendTo: "append",
	prependTo: "prepend",
	insertBefore: "before",
	insertAfter: "after",
	replaceAll: "replaceWith"
}, function( name, original ) {
	jQuery.fn[ name ] = function( selector ) {
		var elems,
			ret = [],
			insert = jQuery( selector ),
			last = insert.length - 1,
			i = 0;

		for ( ; i <= last; i++ ) {
			elems = i === last ? this : this.clone( true );
			jQuery( insert[ i ] )[ original ]( elems );

			// Support: QtWebKit
			// .get() because core_push.apply(_, arraylike) throws
			core_push.apply( ret, elems.get() );
		}

		return this.pushStack( ret );
	};
});

jQuery.extend({
	clone: function( elem, dataAndEvents, deepDataAndEvents ) {
		var i, l, srcElements, destElements,
			clone = elem.cloneNode( true ),
			inPage = jQuery.contains( elem.ownerDocument, elem );

		// Support: IE >= 9
		// Fix Cloning issues
		if ( !jQuery.support.noCloneChecked && ( elem.nodeType === 1 || elem.nodeType === 11 ) && !jQuery.isXMLDoc( elem ) ) {

			// We eschew Sizzle here for performance reasons: http://jsperf.com/getall-vs-sizzle/2
			destElements = getAll( clone );
			srcElements = getAll( elem );

			for ( i = 0, l = srcElements.length; i < l; i++ ) {
				fixInput( srcElements[ i ], destElements[ i ] );
			}
		}

		// Copy the events from the original to the clone
		if ( dataAndEvents ) {
			if ( deepDataAndEvents ) {
				srcElements = srcElements || getAll( elem );
				destElements = destElements || getAll( clone );

				for ( i = 0, l = srcElements.length; i < l; i++ ) {
					cloneCopyEvent( srcElements[ i ], destElements[ i ] );
				}
			} else {
				cloneCopyEvent( elem, clone );
			}
		}

		// Preserve script evaluation history
		destElements = getAll( clone, "script" );
		if ( destElements.length > 0 ) {
			setGlobalEval( destElements, !inPage && getAll( elem, "script" ) );
		}

		// Return the cloned set
		return clone;
	},

	buildFragment: function( elems, context, scripts, selection ) {
		var elem, tmp, tag, wrap, contains, j,
			i = 0,
			l = elems.length,
			fragment = context.createDocumentFragment(),
			nodes = [];

		for ( ; i < l; i++ ) {
			elem = elems[ i ];

			if ( elem || elem === 0 ) {

				// Add nodes directly
				if ( jQuery.type( elem ) === "object" ) {
					// Support: QtWebKit
					// jQuery.merge because core_push.apply(_, arraylike) throws
					jQuery.merge( nodes, elem.nodeType ? [ elem ] : elem );

				// Convert non-html into a text node
				} else if ( !rhtml.test( elem ) ) {
					nodes.push( context.createTextNode( elem ) );

				// Convert html into DOM nodes
				} else {
					tmp = tmp || fragment.appendChild( context.createElement("div") );

					// Deserialize a standard representation
					tag = ( rtagName.exec( elem ) || ["", ""] )[ 1 ].toLowerCase();
					wrap = wrapMap[ tag ] || wrapMap._default;
					tmp.innerHTML = wrap[ 1 ] + elem.replace( rxhtmlTag, "<$1></$2>" ) + wrap[ 2 ];

					// Descend through wrappers to the right content
					j = wrap[ 0 ];
					while ( j-- ) {
						tmp = tmp.lastChild;
					}

					// Support: QtWebKit
					// jQuery.merge because core_push.apply(_, arraylike) throws
					jQuery.merge( nodes, tmp.childNodes );

					// Remember the top-level container
					tmp = fragment.firstChild;

					// Fixes #12346
					// Support: Webkit, IE
					tmp.textContent = "";
				}
			}
		}

		// Remove wrapper from fragment
		fragment.textContent = "";

		i = 0;
		while ( (elem = nodes[ i++ ]) ) {

			// #4087 - If origin and destination elements are the same, and this is
			// that element, do not do anything
			if ( selection && jQuery.inArray( elem, selection ) !== -1 ) {
				continue;
			}

			contains = jQuery.contains( elem.ownerDocument, elem );

			// Append to fragment
			tmp = getAll( fragment.appendChild( elem ), "script" );

			// Preserve script evaluation history
			if ( contains ) {
				setGlobalEval( tmp );
			}

			// Capture executables
			if ( scripts ) {
				j = 0;
				while ( (elem = tmp[ j++ ]) ) {
					if ( rscriptType.test( elem.type || "" ) ) {
						scripts.push( elem );
					}
				}
			}
		}

		return fragment;
	},

	cleanData: function( elems ) {
		var data, elem, events, type, key, j,
			special = jQuery.event.special,
			i = 0;

		for ( ; (elem = elems[ i ]) !== undefined; i++ ) {
			if ( Data.accepts( elem ) ) {
				key = elem[ data_priv.expando ];

				if ( key && (data = data_priv.cache[ key ]) ) {
					events = Object.keys( data.events || {} );
					if ( events.length ) {
						for ( j = 0; (type = events[j]) !== undefined; j++ ) {
							if ( special[ type ] ) {
								jQuery.event.remove( elem, type );

							// This is a shortcut to avoid jQuery.event.remove's overhead
							} else {
								jQuery.removeEvent( elem, type, data.handle );
							}
						}
					}
					if ( data_priv.cache[ key ] ) {
						// Discard any remaining `private` data
						delete data_priv.cache[ key ];
					}
				}
			}
			// Discard any remaining `user` data
			delete data_user.cache[ elem[ data_user.expando ] ];
		}
	},

	_evalUrl: function( url ) {
		return jQuery.ajax({
			url: url,
			type: "GET",
			dataType: "script",
			async: false,
			global: false,
			"throws": true
		});
	}
});

// Support: 1.x compatibility
// Manipulating tables requires a tbody
function manipulationTarget( elem, content ) {
	return jQuery.nodeName( elem, "table" ) &&
		jQuery.nodeName( content.nodeType === 1 ? content : content.firstChild, "tr" ) ?

		elem.getElementsByTagName("tbody")[0] ||
			elem.appendChild( elem.ownerDocument.createElement("tbody") ) :
		elem;
}

// Replace/restore the type attribute of script elements for safe DOM manipulation
function disableScript( elem ) {
	elem.type = (elem.getAttribute("type") !== null) + "/" + elem.type;
	return elem;
}
function restoreScript( elem ) {
	var match = rscriptTypeMasked.exec( elem.type );

	if ( match ) {
		elem.type = match[ 1 ];
	} else {
		elem.removeAttribute("type");
	}

	return elem;
}

// Mark scripts as having already been evaluated
function setGlobalEval( elems, refElements ) {
	var l = elems.length,
		i = 0;

	for ( ; i < l; i++ ) {
		data_priv.set(
			elems[ i ], "globalEval", !refElements || data_priv.get( refElements[ i ], "globalEval" )
		);
	}
}

function cloneCopyEvent( src, dest ) {
	var i, l, type, pdataOld, pdataCur, udataOld, udataCur, events;

	if ( dest.nodeType !== 1 ) {
		return;
	}

	// 1. Copy private data: events, handlers, etc.
	if ( data_priv.hasData( src ) ) {
		pdataOld = data_priv.access( src );
		pdataCur = data_priv.set( dest, pdataOld );
		events = pdataOld.events;

		if ( events ) {
			delete pdataCur.handle;
			pdataCur.events = {};

			for ( type in events ) {
				for ( i = 0, l = events[ type ].length; i < l; i++ ) {
					jQuery.event.add( dest, type, events[ type ][ i ] );
				}
			}
		}
	}

	// 2. Copy user data
	if ( data_user.hasData( src ) ) {
		udataOld = data_user.access( src );
		udataCur = jQuery.extend( {}, udataOld );

		data_user.set( dest, udataCur );
	}
}


function getAll( context, tag ) {
	var ret = context.getElementsByTagName ? context.getElementsByTagName( tag || "*" ) :
			context.querySelectorAll ? context.querySelectorAll( tag || "*" ) :
			[];

	return tag === undefined || tag && jQuery.nodeName( context, tag ) ?
		jQuery.merge( [ context ], ret ) :
		ret;
}

// Support: IE >= 9
function fixInput( src, dest ) {
	var nodeName = dest.nodeName.toLowerCase();

	// Fails to persist the checked state of a cloned checkbox or radio button.
	if ( nodeName === "input" && manipulation_rcheckableType.test( src.type ) ) {
		dest.checked = src.checked;

	// Fails to return the selected option to the default selected state when cloning options
	} else if ( nodeName === "input" || nodeName === "textarea" ) {
		dest.defaultValue = src.defaultValue;
	}
}
jQuery.fn.extend({
	wrapAll: function( html ) {
		var wrap;

		if ( jQuery.isFunction( html ) ) {
			return this.each(function( i ) {
				jQuery( this ).wrapAll( html.call(this, i) );
			});
		}

		if ( this[ 0 ] ) {

			// The elements to wrap the target around
			wrap = jQuery( html, this[ 0 ].ownerDocument ).eq( 0 ).clone( true );

			if ( this[ 0 ].parentNode ) {
				wrap.insertBefore( this[ 0 ] );
			}

			wrap.map(function() {
				var elem = this;

				while ( elem.firstElementChild ) {
					elem = elem.firstElementChild;
				}

				return elem;
			}).append( this );
		}

		return this;
	},

	wrapInner: function( html ) {
		if ( jQuery.isFunction( html ) ) {
			return this.each(function( i ) {
				jQuery( this ).wrapInner( html.call(this, i) );
			});
		}

		return this.each(function() {
			var self = jQuery( this ),
				contents = self.contents();

			if ( contents.length ) {
				contents.wrapAll( html );

			} else {
				self.append( html );
			}
		});
	},

	wrap: function( html ) {
		var isFunction = jQuery.isFunction( html );

		return this.each(function( i ) {
			jQuery( this ).wrapAll( isFunction ? html.call(this, i) : html );
		});
	},

	unwrap: function() {
		return this.parent().each(function() {
			if ( !jQuery.nodeName( this, "body" ) ) {
				jQuery( this ).replaceWith( this.childNodes );
			}
		}).end();
	}
});
var curCSS, iframe,
	// swappable if display is none or starts with table except "table", "table-cell", or "table-caption"
	// see here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
	rdisplayswap = /^(none|table(?!-c[ea]).+)/,
	rmargin = /^margin/,
	rnumsplit = new RegExp( "^(" + core_pnum + ")(.*)$", "i" ),
	rnumnonpx = new RegExp( "^(" + core_pnum + ")(?!px)[a-z%]+$", "i" ),
	rrelNum = new RegExp( "^([+-])=(" + core_pnum + ")", "i" ),
	elemdisplay = { BODY: "block" },

	cssShow = { position: "absolute", visibility: "hidden", display: "block" },
	cssNormalTransform = {
		letterSpacing: 0,
		fontWeight: 400
	},

	cssExpand = [ "Top", "Right", "Bottom", "Left" ],
	cssPrefixes = [ "Webkit", "O", "Moz", "ms" ];

// return a css property mapped to a potentially vendor prefixed property
function vendorPropName( style, name ) {

	// shortcut for names that are not vendor prefixed
	if ( name in style ) {
		return name;
	}

	// check for vendor prefixed names
	var capName = name.charAt(0).toUpperCase() + name.slice(1),
		origName = name,
		i = cssPrefixes.length;

	while ( i-- ) {
		name = cssPrefixes[ i ] + capName;
		if ( name in style ) {
			return name;
		}
	}

	return origName;
}

function isHidden( elem, el ) {
	// isHidden might be called from jQuery#filter function;
	// in that case, element will be second argument
	elem = el || elem;
	return jQuery.css( elem, "display" ) === "none" || !jQuery.contains( elem.ownerDocument, elem );
}

// NOTE: we've included the "window" in window.getComputedStyle
// because jsdom on node.js will break without it.
function getStyles( elem ) {
	return window.getComputedStyle( elem, null );
}

function showHide( elements, show ) {
	var display, elem, hidden,
		values = [],
		index = 0,
		length = elements.length;

	for ( ; index < length; index++ ) {
		elem = elements[ index ];
		if ( !elem.style ) {
			continue;
		}

		values[ index ] = data_priv.get( elem, "olddisplay" );
		display = elem.style.display;
		if ( show ) {
			// Reset the inline display of this element to learn if it is
			// being hidden by cascaded rules or not
			if ( !values[ index ] && display === "none" ) {
				elem.style.display = "";
			}

			// Set elements which have been overridden with display: none
			// in a stylesheet to whatever the default browser style is
			// for such an element
			if ( elem.style.display === "" && isHidden( elem ) ) {
				values[ index ] = data_priv.access( elem, "olddisplay", css_defaultDisplay(elem.nodeName) );
			}
		} else {

			if ( !values[ index ] ) {
				hidden = isHidden( elem );

				if ( display && display !== "none" || !hidden ) {
					data_priv.set( elem, "olddisplay", hidden ? display : jQuery.css(elem, "display") );
				}
			}
		}
	}

	// Set the display of most of the elements in a second loop
	// to avoid the constant reflow
	for ( index = 0; index < length; index++ ) {
		elem = elements[ index ];
		if ( !elem.style ) {
			continue;
		}
		if ( !show || elem.style.display === "none" || elem.style.display === "" ) {
			elem.style.display = show ? values[ index ] || "" : "none";
		}
	}

	return elements;
}

jQuery.fn.extend({
	css: function( name, value ) {
		return jQuery.access( this, function( elem, name, value ) {
			var styles, len,
				map = {},
				i = 0;

			if ( jQuery.isArray( name ) ) {
				styles = getStyles( elem );
				len = name.length;

				for ( ; i < len; i++ ) {
					map[ name[ i ] ] = jQuery.css( elem, name[ i ], false, styles );
				}

				return map;
			}

			return value !== undefined ?
				jQuery.style( elem, name, value ) :
				jQuery.css( elem, name );
		}, name, value, arguments.length > 1 );
	},
	show: function() {
		return showHide( this, true );
	},
	hide: function() {
		return showHide( this );
	},
	toggle: function( state ) {
		if ( typeof state === "boolean" ) {
			return state ? this.show() : this.hide();
		}

		return this.each(function() {
			if ( isHidden( this ) ) {
				jQuery( this ).show();
			} else {
				jQuery( this ).hide();
			}
		});
	}
});

jQuery.extend({
	// Add in style property hooks for overriding the default
	// behavior of getting and setting a style property
	cssHooks: {
		opacity: {
			get: function( elem, computed ) {
				if ( computed ) {
					// We should always get a number back from opacity
					var ret = curCSS( elem, "opacity" );
					return ret === "" ? "1" : ret;
				}
			}
		}
	},

	// Don't automatically add "px" to these possibly-unitless properties
	cssNumber: {
		"columnCount": true,
		"fillOpacity": true,
		"fontWeight": true,
		"lineHeight": true,
		"opacity": true,
		"order": true,
		"orphans": true,
		"widows": true,
		"zIndex": true,
		"zoom": true
	},

	// Add in properties whose names you wish to fix before
	// setting or getting the value
	cssProps: {
		// normalize float css property
		"float": "cssFloat"
	},

	// Get and set the style property on a DOM Node
	style: function( elem, name, value, extra ) {
		// Don't set styles on text and comment nodes
		if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
			return;
		}

		// Make sure that we're working with the right name
		var ret, type, hooks,
			origName = jQuery.camelCase( name ),
			style = elem.style;

		name = jQuery.cssProps[ origName ] || ( jQuery.cssProps[ origName ] = vendorPropName( style, origName ) );

		// gets hook for the prefixed version
		// followed by the unprefixed version
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// Check if we're setting a value
		if ( value !== undefined ) {
			type = typeof value;

			// convert relative number strings (+= or -=) to relative numbers. #7345
			if ( type === "string" && (ret = rrelNum.exec( value )) ) {
				value = ( ret[1] + 1 ) * ret[2] + parseFloat( jQuery.css( elem, name ) );
				// Fixes bug #9237
				type = "number";
			}

			// Make sure that NaN and null values aren't set. See: #7116
			if ( value == null || type === "number" && isNaN( value ) ) {
				return;
			}

			// If a number was passed in, add 'px' to the (except for certain CSS properties)
			if ( type === "number" && !jQuery.cssNumber[ origName ] ) {
				value += "px";
			}

			// Fixes #8908, it can be done more correctly by specifying setters in cssHooks,
			// but it would mean to define eight (for every problematic property) identical functions
			if ( !jQuery.support.clearCloneStyle && value === "" && name.indexOf("background") === 0 ) {
				style[ name ] = "inherit";
			}

			// If a hook was provided, use that value, otherwise just set the specified value
			if ( !hooks || !("set" in hooks) || (value = hooks.set( elem, value, extra )) !== undefined ) {
				style[ name ] = value;
			}

		} else {
			// If a hook was provided get the non-computed value from there
			if ( hooks && "get" in hooks && (ret = hooks.get( elem, false, extra )) !== undefined ) {
				return ret;
			}

			// Otherwise just get the value from the style object
			return style[ name ];
		}
	},

	css: function( elem, name, extra, styles ) {
		var val, num, hooks,
			origName = jQuery.camelCase( name );

		// Make sure that we're working with the right name
		name = jQuery.cssProps[ origName ] || ( jQuery.cssProps[ origName ] = vendorPropName( elem.style, origName ) );

		// gets hook for the prefixed version
		// followed by the unprefixed version
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// If a hook was provided get the computed value from there
		if ( hooks && "get" in hooks ) {
			val = hooks.get( elem, true, extra );
		}

		// Otherwise, if a way to get the computed value exists, use that
		if ( val === undefined ) {
			val = curCSS( elem, name, styles );
		}

		//convert "normal" to computed value
		if ( val === "normal" && name in cssNormalTransform ) {
			val = cssNormalTransform[ name ];
		}

		// Return, converting to number if forced or a qualifier was provided and val looks numeric
		if ( extra === "" || extra ) {
			num = parseFloat( val );
			return extra === true || jQuery.isNumeric( num ) ? num || 0 : val;
		}
		return val;
	}
});

curCSS = function( elem, name, _computed ) {
	var width, minWidth, maxWidth,
		computed = _computed || getStyles( elem ),

		// Support: IE9
		// getPropertyValue is only needed for .css('filter') in IE9, see #12537
		ret = computed ? computed.getPropertyValue( name ) || computed[ name ] : undefined,
		style = elem.style;

	if ( computed ) {

		if ( ret === "" && !jQuery.contains( elem.ownerDocument, elem ) ) {
			ret = jQuery.style( elem, name );
		}

		// Support: Safari 5.1
		// A tribute to the "awesome hack by Dean Edwards"
		// Safari 5.1.7 (at least) returns percentage for a larger set of values, but width seems to be reliably pixels
		// this is against the CSSOM draft spec: http://dev.w3.org/csswg/cssom/#resolved-values
		if ( rnumnonpx.test( ret ) && rmargin.test( name ) ) {

			// Remember the original values
			width = style.width;
			minWidth = style.minWidth;
			maxWidth = style.maxWidth;

			// Put in the new values to get a computed value out
			style.minWidth = style.maxWidth = style.width = ret;
			ret = computed.width;

			// Revert the changed values
			style.width = width;
			style.minWidth = minWidth;
			style.maxWidth = maxWidth;
		}
	}

	return ret;
};


function setPositiveNumber( elem, value, subtract ) {
	var matches = rnumsplit.exec( value );
	return matches ?
		// Guard against undefined "subtract", e.g., when used as in cssHooks
		Math.max( 0, matches[ 1 ] - ( subtract || 0 ) ) + ( matches[ 2 ] || "px" ) :
		value;
}

function augmentWidthOrHeight( elem, name, extra, isBorderBox, styles ) {
	var i = extra === ( isBorderBox ? "border" : "content" ) ?
		// If we already have the right measurement, avoid augmentation
		4 :
		// Otherwise initialize for horizontal or vertical properties
		name === "width" ? 1 : 0,

		val = 0;

	for ( ; i < 4; i += 2 ) {
		// both box models exclude margin, so add it if we want it
		if ( extra === "margin" ) {
			val += jQuery.css( elem, extra + cssExpand[ i ], true, styles );
		}

		if ( isBorderBox ) {
			// border-box includes padding, so remove it if we want content
			if ( extra === "content" ) {
				val -= jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );
			}

			// at this point, extra isn't border nor margin, so remove border
			if ( extra !== "margin" ) {
				val -= jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}
		} else {
			// at this point, extra isn't content, so add padding
			val += jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );

			// at this point, extra isn't content nor padding, so add border
			if ( extra !== "padding" ) {
				val += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}
		}
	}

	return val;
}

function getWidthOrHeight( elem, name, extra ) {

	// Start with offset property, which is equivalent to the border-box value
	var valueIsBorderBox = true,
		val = name === "width" ? elem.offsetWidth : elem.offsetHeight,
		styles = getStyles( elem ),
		isBorderBox = jQuery.support.boxSizing && jQuery.css( elem, "boxSizing", false, styles ) === "border-box";

	// some non-html elements return undefined for offsetWidth, so check for null/undefined
	// svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
	// MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668
	if ( val <= 0 || val == null ) {
		// Fall back to computed then uncomputed css if necessary
		val = curCSS( elem, name, styles );
		if ( val < 0 || val == null ) {
			val = elem.style[ name ];
		}

		// Computed unit is not pixels. Stop here and return.
		if ( rnumnonpx.test(val) ) {
			return val;
		}

		// we need the check for style in case a browser which returns unreliable values
		// for getComputedStyle silently falls back to the reliable elem.style
		valueIsBorderBox = isBorderBox && ( jQuery.support.boxSizingReliable || val === elem.style[ name ] );

		// Normalize "", auto, and prepare for extra
		val = parseFloat( val ) || 0;
	}

	// use the active box-sizing model to add/subtract irrelevant styles
	return ( val +
		augmentWidthOrHeight(
			elem,
			name,
			extra || ( isBorderBox ? "border" : "content" ),
			valueIsBorderBox,
			styles
		)
	) + "px";
}

// Try to determine the default display value of an element
function css_defaultDisplay( nodeName ) {
	var doc = document,
		display = elemdisplay[ nodeName ];

	if ( !display ) {
		display = actualDisplay( nodeName, doc );

		// If the simple way fails, read from inside an iframe
		if ( display === "none" || !display ) {
			// Use the already-created iframe if possible
			iframe = ( iframe ||
				jQuery("<iframe frameborder='0' width='0' height='0'/>")
				.css( "cssText", "display:block !important" )
			).appendTo( doc.documentElement );

			// Always write a new HTML skeleton so Webkit and Firefox don't choke on reuse
			doc = ( iframe[0].contentWindow || iframe[0].contentDocument ).document;
			doc.write("<!doctype html><html><body>");
			doc.close();

			display = actualDisplay( nodeName, doc );
			iframe.detach();
		}

		// Store the correct default display
		elemdisplay[ nodeName ] = display;
	}

	return display;
}

// Called ONLY from within css_defaultDisplay
function actualDisplay( name, doc ) {
	var elem = jQuery( doc.createElement( name ) ).appendTo( doc.body ),
		display = jQuery.css( elem[0], "display" );
	elem.remove();
	return display;
}

jQuery.each([ "height", "width" ], function( i, name ) {
	jQuery.cssHooks[ name ] = {
		get: function( elem, computed, extra ) {
			if ( computed ) {
				// certain elements can have dimension info if we invisibly show them
				// however, it must have a current display style that would benefit from this
				return elem.offsetWidth === 0 && rdisplayswap.test( jQuery.css( elem, "display" ) ) ?
					jQuery.swap( elem, cssShow, function() {
						return getWidthOrHeight( elem, name, extra );
					}) :
					getWidthOrHeight( elem, name, extra );
			}
		},

		set: function( elem, value, extra ) {
			var styles = extra && getStyles( elem );
			return setPositiveNumber( elem, value, extra ?
				augmentWidthOrHeight(
					elem,
					name,
					extra,
					jQuery.support.boxSizing && jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
					styles
				) : 0
			);
		}
	};
});

// These hooks cannot be added until DOM ready because the support test
// for it is not run until after DOM ready
jQuery(function() {
	// Support: Android 2.3
	if ( !jQuery.support.reliableMarginRight ) {
		jQuery.cssHooks.marginRight = {
			get: function( elem, computed ) {
				if ( computed ) {
					// Support: Android 2.3
					// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
					// Work around by temporarily setting element display to inline-block
					return jQuery.swap( elem, { "display": "inline-block" },
						curCSS, [ elem, "marginRight" ] );
				}
			}
		};
	}

	// Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
	// getComputedStyle returns percent when specified for top/left/bottom/right
	// rather than make the css module depend on the offset module, we just check for it here
	if ( !jQuery.support.pixelPosition && jQuery.fn.position ) {
		jQuery.each( [ "top", "left" ], function( i, prop ) {
			jQuery.cssHooks[ prop ] = {
				get: function( elem, computed ) {
					if ( computed ) {
						computed = curCSS( elem, prop );
						// if curCSS returns percentage, fallback to offset
						return rnumnonpx.test( computed ) ?
							jQuery( elem ).position()[ prop ] + "px" :
							computed;
					}
				}
			};
		});
	}

});

if ( jQuery.expr && jQuery.expr.filters ) {
	jQuery.expr.filters.hidden = function( elem ) {
		// Support: Opera <= 12.12
		// Opera reports offsetWidths and offsetHeights less than zero on some elements
		return elem.offsetWidth <= 0 && elem.offsetHeight <= 0;
	};

	jQuery.expr.filters.visible = function( elem ) {
		return !jQuery.expr.filters.hidden( elem );
	};
}

// These hooks are used by animate to expand properties
jQuery.each({
	margin: "",
	padding: "",
	border: "Width"
}, function( prefix, suffix ) {
	jQuery.cssHooks[ prefix + suffix ] = {
		expand: function( value ) {
			var i = 0,
				expanded = {},

				// assumes a single number if not a string
				parts = typeof value === "string" ? value.split(" ") : [ value ];

			for ( ; i < 4; i++ ) {
				expanded[ prefix + cssExpand[ i ] + suffix ] =
					parts[ i ] || parts[ i - 2 ] || parts[ 0 ];
			}

			return expanded;
		}
	};

	if ( !rmargin.test( prefix ) ) {
		jQuery.cssHooks[ prefix + suffix ].set = setPositiveNumber;
	}
});
var r20 = /%20/g,
	rbracket = /\[\]$/,
	rCRLF = /\r?\n/g,
	rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
	rsubmittable = /^(?:input|select|textarea|keygen)/i;

jQuery.fn.extend({
	serialize: function() {
		return jQuery.param( this.serializeArray() );
	},
	serializeArray: function() {
		return this.map(function(){
			// Can add propHook for "elements" to filter or add form elements
			var elements = jQuery.prop( this, "elements" );
			return elements ? jQuery.makeArray( elements ) : this;
		})
		.filter(function(){
			var type = this.type;
			// Use .is(":disabled") so that fieldset[disabled] works
			return this.name && !jQuery( this ).is( ":disabled" ) &&
				rsubmittable.test( this.nodeName ) && !rsubmitterTypes.test( type ) &&
				( this.checked || !manipulation_rcheckableType.test( type ) );
		})
		.map(function( i, elem ){
			var val = jQuery( this ).val();

			return val == null ?
				null :
				jQuery.isArray( val ) ?
					jQuery.map( val, function( val ){
						return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
					}) :
					{ name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
		}).get();
	}
});

//Serialize an array of form elements or a set of
//key/values into a query string
jQuery.param = function( a, traditional ) {
	var prefix,
		s = [],
		add = function( key, value ) {
			// If value is a function, invoke it and return its value
			value = jQuery.isFunction( value ) ? value() : ( value == null ? "" : value );
			s[ s.length ] = encodeURIComponent( key ) + "=" + encodeURIComponent( value );
		};

	// Set traditional to true for jQuery <= 1.3.2 behavior.
	if ( traditional === undefined ) {
		traditional = jQuery.ajaxSettings && jQuery.ajaxSettings.traditional;
	}

	// If an array was passed in, assume that it is an array of form elements.
	if ( jQuery.isArray( a ) || ( a.jquery && !jQuery.isPlainObject( a ) ) ) {
		// Serialize the form elements
		jQuery.each( a, function() {
			add( this.name, this.value );
		});

	} else {
		// If traditional, encode the "old" way (the way 1.3.2 or older
		// did it), otherwise encode params recursively.
		for ( prefix in a ) {
			buildParams( prefix, a[ prefix ], traditional, add );
		}
	}

	// Return the resulting serialization
	return s.join( "&" ).replace( r20, "+" );
};

function buildParams( prefix, obj, traditional, add ) {
	var name;

	if ( jQuery.isArray( obj ) ) {
		// Serialize array item.
		jQuery.each( obj, function( i, v ) {
			if ( traditional || rbracket.test( prefix ) ) {
				// Treat each array item as a scalar.
				add( prefix, v );

			} else {
				// Item is non-scalar (array or object), encode its numeric index.
				buildParams( prefix + "[" + ( typeof v === "object" ? i : "" ) + "]", v, traditional, add );
			}
		});

	} else if ( !traditional && jQuery.type( obj ) === "object" ) {
		// Serialize object item.
		for ( name in obj ) {
			buildParams( prefix + "[" + name + "]", obj[ name ], traditional, add );
		}

	} else {
		// Serialize scalar item.
		add( prefix, obj );
	}
}
jQuery.each( ("blur focus focusin focusout load resize scroll unload click dblclick " +
	"mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
	"change select submit keydown keypress keyup error contextmenu").split(" "), function( i, name ) {

	// Handle event binding
	jQuery.fn[ name ] = function( data, fn ) {
		return arguments.length > 0 ?
			this.on( name, null, data, fn ) :
			this.trigger( name );
	};
});

jQuery.fn.extend({
	hover: function( fnOver, fnOut ) {
		return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
	},

	bind: function( types, data, fn ) {
		return this.on( types, null, data, fn );
	},
	unbind: function( types, fn ) {
		return this.off( types, null, fn );
	},

	delegate: function( selector, types, data, fn ) {
		return this.on( types, selector, data, fn );
	},
	undelegate: function( selector, types, fn ) {
		// ( namespace ) or ( selector, types [, fn] )
		return arguments.length === 1 ? this.off( selector, "**" ) : this.off( types, selector || "**", fn );
	}
});
var
	// Document location
	ajaxLocParts,
	ajaxLocation,

	ajax_nonce = jQuery.now(),

	ajax_rquery = /\?/,
	rhash = /#.*$/,
	rts = /([?&])_=[^&]*/,
	rheaders = /^(.*?):[ \t]*([^\r\n]*)$/mg,
	// #7653, #8125, #8152: local protocol detection
	rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
	rnoContent = /^(?:GET|HEAD)$/,
	rprotocol = /^\/\//,
	rurl = /^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,

	// Keep a copy of the old load method
	_load = jQuery.fn.load,

	/* Prefilters
	 * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
	 * 2) These are called:
	 *    - BEFORE asking for a transport
	 *    - AFTER param serialization (s.data is a string if s.processData is true)
	 * 3) key is the dataType
	 * 4) the catchall symbol "*" can be used
	 * 5) execution will start with transport dataType and THEN continue down to "*" if needed
	 */
	prefilters = {},

	/* Transports bindings
	 * 1) key is the dataType
	 * 2) the catchall symbol "*" can be used
	 * 3) selection will start with transport dataType and THEN go to "*" if needed
	 */
	transports = {},

	// Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
	allTypes = "*/".concat("*");

// #8138, IE may throw an exception when accessing
// a field from window.location if document.domain has been set
try {
	ajaxLocation = location.href;
} catch( e ) {
	// Use the href attribute of an A element
	// since IE will modify it given document.location
	ajaxLocation = document.createElement( "a" );
	ajaxLocation.href = "";
	ajaxLocation = ajaxLocation.href;
}

// Segment location into parts
ajaxLocParts = rurl.exec( ajaxLocation.toLowerCase() ) || [];

// Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
function addToPrefiltersOrTransports( structure ) {

	// dataTypeExpression is optional and defaults to "*"
	return function( dataTypeExpression, func ) {

		if ( typeof dataTypeExpression !== "string" ) {
			func = dataTypeExpression;
			dataTypeExpression = "*";
		}

		var dataType,
			i = 0,
			dataTypes = dataTypeExpression.toLowerCase().match( core_rnotwhite ) || [];

		if ( jQuery.isFunction( func ) ) {
			// For each dataType in the dataTypeExpression
			while ( (dataType = dataTypes[i++]) ) {
				// Prepend if requested
				if ( dataType[0] === "+" ) {
					dataType = dataType.slice( 1 ) || "*";
					(structure[ dataType ] = structure[ dataType ] || []).unshift( func );

				// Otherwise append
				} else {
					(structure[ dataType ] = structure[ dataType ] || []).push( func );
				}
			}
		}
	};
}

// Base inspection function for prefilters and transports
function inspectPrefiltersOrTransports( structure, options, originalOptions, jqXHR ) {

	var inspected = {},
		seekingTransport = ( structure === transports );

	function inspect( dataType ) {
		var selected;
		inspected[ dataType ] = true;
		jQuery.each( structure[ dataType ] || [], function( _, prefilterOrFactory ) {
			var dataTypeOrTransport = prefilterOrFactory( options, originalOptions, jqXHR );
			if( typeof dataTypeOrTransport === "string" && !seekingTransport && !inspected[ dataTypeOrTransport ] ) {
				options.dataTypes.unshift( dataTypeOrTransport );
				inspect( dataTypeOrTransport );
				return false;
			} else if ( seekingTransport ) {
				return !( selected = dataTypeOrTransport );
			}
		});
		return selected;
	}

	return inspect( options.dataTypes[ 0 ] ) || !inspected[ "*" ] && inspect( "*" );
}

// A special extend for ajax options
// that takes "flat" options (not to be deep extended)
// Fixes #9887
function ajaxExtend( target, src ) {
	var key, deep,
		flatOptions = jQuery.ajaxSettings.flatOptions || {};

	for ( key in src ) {
		if ( src[ key ] !== undefined ) {
			( flatOptions[ key ] ? target : ( deep || (deep = {}) ) )[ key ] = src[ key ];
		}
	}
	if ( deep ) {
		jQuery.extend( true, target, deep );
	}

	return target;
}

jQuery.fn.load = function( url, params, callback ) {
	if ( typeof url !== "string" && _load ) {
		return _load.apply( this, arguments );
	}

	var selector, type, response,
		self = this,
		off = url.indexOf(" ");

	if ( off >= 0 ) {
		selector = url.slice( off );
		url = url.slice( 0, off );
	}

	// If it's a function
	if ( jQuery.isFunction( params ) ) {

		// We assume that it's the callback
		callback = params;
		params = undefined;

	// Otherwise, build a param string
	} else if ( params && typeof params === "object" ) {
		type = "POST";
	}

	// If we have elements to modify, make the request
	if ( self.length > 0 ) {
		jQuery.ajax({
			url: url,

			// if "type" variable is undefined, then "GET" method will be used
			type: type,
			dataType: "html",
			data: params
		}).done(function( responseText ) {

			// Save response for use in complete callback
			response = arguments;

			self.html( selector ?

				// If a selector was specified, locate the right elements in a dummy div
				// Exclude scripts to avoid IE 'Permission Denied' errors
				jQuery("<div>").append( jQuery.parseHTML( responseText ) ).find( selector ) :

				// Otherwise use the full result
				responseText );

		}).complete( callback && function( jqXHR, status ) {
			self.each( callback, response || [ jqXHR.responseText, status, jqXHR ] );
		});
	}

	return this;
};

// Attach a bunch of functions for handling common AJAX events
jQuery.each( [ "ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend" ], function( i, type ){
	jQuery.fn[ type ] = function( fn ){
		return this.on( type, fn );
	};
});

jQuery.extend({

	// Counter for holding the number of active queries
	active: 0,

	// Last-Modified header cache for next request
	lastModified: {},
	etag: {},

	ajaxSettings: {
		url: ajaxLocation,
		type: "GET",
		isLocal: rlocalProtocol.test( ajaxLocParts[ 1 ] ),
		global: true,
		processData: true,
		async: true,
		contentType: "application/x-www-form-urlencoded; charset=UTF-8",
		/*
		timeout: 0,
		data: null,
		dataType: null,
		username: null,
		password: null,
		cache: null,
		throws: false,
		traditional: false,
		headers: {},
		*/

		accepts: {
			"*": allTypes,
			text: "text/plain",
			html: "text/html",
			xml: "application/xml, text/xml",
			json: "application/json, text/javascript"
		},

		contents: {
			xml: /xml/,
			html: /html/,
			json: /json/
		},

		responseFields: {
			xml: "responseXML",
			text: "responseText",
			json: "responseJSON"
		},

		// Data converters
		// Keys separate source (or catchall "*") and destination types with a single space
		converters: {

			// Convert anything to text
			"* text": String,

			// Text to html (true = no transformation)
			"text html": true,

			// Evaluate text as a json expression
			"text json": jQuery.parseJSON,

			// Parse text as xml
			"text xml": jQuery.parseXML
		},

		// For options that shouldn't be deep extended:
		// you can add your own custom options here if
		// and when you create one that shouldn't be
		// deep extended (see ajaxExtend)
		flatOptions: {
			url: true,
			context: true
		}
	},

	// Creates a full fledged settings object into target
	// with both ajaxSettings and settings fields.
	// If target is omitted, writes into ajaxSettings.
	ajaxSetup: function( target, settings ) {
		return settings ?

			// Building a settings object
			ajaxExtend( ajaxExtend( target, jQuery.ajaxSettings ), settings ) :

			// Extending ajaxSettings
			ajaxExtend( jQuery.ajaxSettings, target );
	},

	ajaxPrefilter: addToPrefiltersOrTransports( prefilters ),
	ajaxTransport: addToPrefiltersOrTransports( transports ),

	// Main method
	ajax: function( url, options ) {

		// If url is an object, simulate pre-1.5 signature
		if ( typeof url === "object" ) {
			options = url;
			url = undefined;
		}

		// Force options to be an object
		options = options || {};

		var transport,
			// URL without anti-cache param
			cacheURL,
			// Response headers
			responseHeadersString,
			responseHeaders,
			// timeout handle
			timeoutTimer,
			// Cross-domain detection vars
			parts,
			// To know if global events are to be dispatched
			fireGlobals,
			// Loop variable
			i,
			// Create the final options object
			s = jQuery.ajaxSetup( {}, options ),
			// Callbacks context
			callbackContext = s.context || s,
			// Context for global events is callbackContext if it is a DOM node or jQuery collection
			globalEventContext = s.context && ( callbackContext.nodeType || callbackContext.jquery ) ?
				jQuery( callbackContext ) :
				jQuery.event,
			// Deferreds
			deferred = jQuery.Deferred(),
			completeDeferred = jQuery.Callbacks("once memory"),
			// Status-dependent callbacks
			statusCode = s.statusCode || {},
			// Headers (they are sent all at once)
			requestHeaders = {},
			requestHeadersNames = {},
			// The jqXHR state
			state = 0,
			// Default abort message
			strAbort = "canceled",
			// Fake xhr
			jqXHR = {
				readyState: 0,

				// Builds headers hashtable if needed
				getResponseHeader: function( key ) {
					var match;
					if ( state === 2 ) {
						if ( !responseHeaders ) {
							responseHeaders = {};
							while ( (match = rheaders.exec( responseHeadersString )) ) {
								responseHeaders[ match[1].toLowerCase() ] = match[ 2 ];
							}
						}
						match = responseHeaders[ key.toLowerCase() ];
					}
					return match == null ? null : match;
				},

				// Raw string
				getAllResponseHeaders: function() {
					return state === 2 ? responseHeadersString : null;
				},

				// Caches the header
				setRequestHeader: function( name, value ) {
					var lname = name.toLowerCase();
					if ( !state ) {
						name = requestHeadersNames[ lname ] = requestHeadersNames[ lname ] || name;
						requestHeaders[ name ] = value;
					}
					return this;
				},

				// Overrides response content-type header
				overrideMimeType: function( type ) {
					if ( !state ) {
						s.mimeType = type;
					}
					return this;
				},

				// Status-dependent callbacks
				statusCode: function( map ) {
					var code;
					if ( map ) {
						if ( state < 2 ) {
							for ( code in map ) {
								// Lazy-add the new callback in a way that preserves old ones
								statusCode[ code ] = [ statusCode[ code ], map[ code ] ];
							}
						} else {
							// Execute the appropriate callbacks
							jqXHR.always( map[ jqXHR.status ] );
						}
					}
					return this;
				},

				// Cancel the request
				abort: function( statusText ) {
					var finalText = statusText || strAbort;
					if ( transport ) {
						transport.abort( finalText );
					}
					done( 0, finalText );
					return this;
				}
			};

		// Attach deferreds
		deferred.promise( jqXHR ).complete = completeDeferred.add;
		jqXHR.success = jqXHR.done;
		jqXHR.error = jqXHR.fail;

		// Remove hash character (#7531: and string promotion)
		// Add protocol if not provided (prefilters might expect it)
		// Handle falsy url in the settings object (#10093: consistency with old signature)
		// We also use the url parameter if available
		s.url = ( ( url || s.url || ajaxLocation ) + "" ).replace( rhash, "" )
			.replace( rprotocol, ajaxLocParts[ 1 ] + "//" );

		// Alias method option to type as per ticket #12004
		s.type = options.method || options.type || s.method || s.type;

		// Extract dataTypes list
		s.dataTypes = jQuery.trim( s.dataType || "*" ).toLowerCase().match( core_rnotwhite ) || [""];

		// A cross-domain request is in order when we have a protocol:host:port mismatch
		if ( s.crossDomain == null ) {
			parts = rurl.exec( s.url.toLowerCase() );
			s.crossDomain = !!( parts &&
				( parts[ 1 ] !== ajaxLocParts[ 1 ] || parts[ 2 ] !== ajaxLocParts[ 2 ] ||
					( parts[ 3 ] || ( parts[ 1 ] === "http:" ? "80" : "443" ) ) !==
						( ajaxLocParts[ 3 ] || ( ajaxLocParts[ 1 ] === "http:" ? "80" : "443" ) ) )
			);
		}

		// Convert data if not already a string
		if ( s.data && s.processData && typeof s.data !== "string" ) {
			s.data = jQuery.param( s.data, s.traditional );
		}

		// Apply prefilters
		inspectPrefiltersOrTransports( prefilters, s, options, jqXHR );

		// If request was aborted inside a prefilter, stop there
		if ( state === 2 ) {
			return jqXHR;
		}

		// We can fire global events as of now if asked to
		fireGlobals = s.global;

		// Watch for a new set of requests
		if ( fireGlobals && jQuery.active++ === 0 ) {
			jQuery.event.trigger("ajaxStart");
		}

		// Uppercase the type
		s.type = s.type.toUpperCase();

		// Determine if request has content
		s.hasContent = !rnoContent.test( s.type );

		// Save the URL in case we're toying with the If-Modified-Since
		// and/or If-None-Match header later on
		cacheURL = s.url;

		// More options handling for requests with no content
		if ( !s.hasContent ) {

			// If data is available, append data to url
			if ( s.data ) {
				cacheURL = ( s.url += ( ajax_rquery.test( cacheURL ) ? "&" : "?" ) + s.data );
				// #9682: remove data so that it's not used in an eventual retry
				delete s.data;
			}

			// Add anti-cache in url if needed
			if ( s.cache === false ) {
				s.url = rts.test( cacheURL ) ?

					// If there is already a '_' parameter, set its value
					cacheURL.replace( rts, "$1_=" + ajax_nonce++ ) :

					// Otherwise add one to the end
					cacheURL + ( ajax_rquery.test( cacheURL ) ? "&" : "?" ) + "_=" + ajax_nonce++;
			}
		}

		// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
		if ( s.ifModified ) {
			if ( jQuery.lastModified[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-Modified-Since", jQuery.lastModified[ cacheURL ] );
			}
			if ( jQuery.etag[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-None-Match", jQuery.etag[ cacheURL ] );
			}
		}

		// Set the correct header, if data is being sent
		if ( s.data && s.hasContent && s.contentType !== false || options.contentType ) {
			jqXHR.setRequestHeader( "Content-Type", s.contentType );
		}

		// Set the Accepts header for the server, depending on the dataType
		jqXHR.setRequestHeader(
			"Accept",
			s.dataTypes[ 0 ] && s.accepts[ s.dataTypes[0] ] ?
				s.accepts[ s.dataTypes[0] ] + ( s.dataTypes[ 0 ] !== "*" ? ", " + allTypes + "; q=0.01" : "" ) :
				s.accepts[ "*" ]
		);

		// Check for headers option
		for ( i in s.headers ) {
			jqXHR.setRequestHeader( i, s.headers[ i ] );
		}

		// Allow custom headers/mimetypes and early abort
		if ( s.beforeSend && ( s.beforeSend.call( callbackContext, jqXHR, s ) === false || state === 2 ) ) {
			// Abort if not done already and return
			return jqXHR.abort();
		}

		// aborting is no longer a cancellation
		strAbort = "abort";

		// Install callbacks on deferreds
		for ( i in { success: 1, error: 1, complete: 1 } ) {
			jqXHR[ i ]( s[ i ] );
		}

		// Get transport
		transport = inspectPrefiltersOrTransports( transports, s, options, jqXHR );

		// If no transport, we auto-abort
		if ( !transport ) {
			done( -1, "No Transport" );
		} else {
			jqXHR.readyState = 1;

			// Send global event
			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxSend", [ jqXHR, s ] );
			}
			// Timeout
			if ( s.async && s.timeout > 0 ) {
				timeoutTimer = setTimeout(function() {
					jqXHR.abort("timeout");
				}, s.timeout );
			}

			try {
				state = 1;
				transport.send( requestHeaders, done );
			} catch ( e ) {
				// Propagate exception as error if not done
				if ( state < 2 ) {
					done( -1, e );
				// Simply rethrow otherwise
				} else {
					throw e;
				}
			}
		}

		// Callback for when everything is done
		function done( status, nativeStatusText, responses, headers ) {
			var isSuccess, success, error, response, modified,
				statusText = nativeStatusText;

			// Called once
			if ( state === 2 ) {
				return;
			}

			// State is "done" now
			state = 2;

			// Clear timeout if it exists
			if ( timeoutTimer ) {
				clearTimeout( timeoutTimer );
			}

			// Dereference transport for early garbage collection
			// (no matter how long the jqXHR object will be used)
			transport = undefined;

			// Cache response headers
			responseHeadersString = headers || "";

			// Set readyState
			jqXHR.readyState = status > 0 ? 4 : 0;

			// Determine if successful
			isSuccess = status >= 200 && status < 300 || status === 304;

			// Get response data
			if ( responses ) {
				response = ajaxHandleResponses( s, jqXHR, responses );
			}

			// Convert no matter what (that way responseXXX fields are always set)
			response = ajaxConvert( s, response, jqXHR, isSuccess );

			// If successful, handle type chaining
			if ( isSuccess ) {

				// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
				if ( s.ifModified ) {
					modified = jqXHR.getResponseHeader("Last-Modified");
					if ( modified ) {
						jQuery.lastModified[ cacheURL ] = modified;
					}
					modified = jqXHR.getResponseHeader("etag");
					if ( modified ) {
						jQuery.etag[ cacheURL ] = modified;
					}
				}

				// if no content
				if ( status === 204 || s.type === "HEAD" ) {
					statusText = "nocontent";

				// if not modified
				} else if ( status === 304 ) {
					statusText = "notmodified";

				// If we have data, let's convert it
				} else {
					statusText = response.state;
					success = response.data;
					error = response.error;
					isSuccess = !error;
				}
			} else {
				// We extract error from statusText
				// then normalize statusText and status for non-aborts
				error = statusText;
				if ( status || !statusText ) {
					statusText = "error";
					if ( status < 0 ) {
						status = 0;
					}
				}
			}

			// Set data for the fake xhr object
			jqXHR.status = status;
			jqXHR.statusText = ( nativeStatusText || statusText ) + "";

			// Success/Error
			if ( isSuccess ) {
				deferred.resolveWith( callbackContext, [ success, statusText, jqXHR ] );
			} else {
				deferred.rejectWith( callbackContext, [ jqXHR, statusText, error ] );
			}

			// Status-dependent callbacks
			jqXHR.statusCode( statusCode );
			statusCode = undefined;

			if ( fireGlobals ) {
				globalEventContext.trigger( isSuccess ? "ajaxSuccess" : "ajaxError",
					[ jqXHR, s, isSuccess ? success : error ] );
			}

			// Complete
			completeDeferred.fireWith( callbackContext, [ jqXHR, statusText ] );

			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxComplete", [ jqXHR, s ] );
				// Handle the global AJAX counter
				if ( !( --jQuery.active ) ) {
					jQuery.event.trigger("ajaxStop");
				}
			}
		}

		return jqXHR;
	},

	getJSON: function( url, data, callback ) {
		return jQuery.get( url, data, callback, "json" );
	},

	getScript: function( url, callback ) {
		return jQuery.get( url, undefined, callback, "script" );
	}
});

jQuery.each( [ "get", "post" ], function( i, method ) {
	jQuery[ method ] = function( url, data, callback, type ) {
		// shift arguments if data argument was omitted
		if ( jQuery.isFunction( data ) ) {
			type = type || callback;
			callback = data;
			data = undefined;
		}

		return jQuery.ajax({
			url: url,
			type: method,
			dataType: type,
			data: data,
			success: callback
		});
	};
});

/* Handles responses to an ajax request:
 * - finds the right dataType (mediates between content-type and expected dataType)
 * - returns the corresponding response
 */
function ajaxHandleResponses( s, jqXHR, responses ) {

	var ct, type, finalDataType, firstDataType,
		contents = s.contents,
		dataTypes = s.dataTypes;

	// Remove auto dataType and get content-type in the process
	while( dataTypes[ 0 ] === "*" ) {
		dataTypes.shift();
		if ( ct === undefined ) {
			ct = s.mimeType || jqXHR.getResponseHeader("Content-Type");
		}
	}

	// Check if we're dealing with a known content-type
	if ( ct ) {
		for ( type in contents ) {
			if ( contents[ type ] && contents[ type ].test( ct ) ) {
				dataTypes.unshift( type );
				break;
			}
		}
	}

	// Check to see if we have a response for the expected dataType
	if ( dataTypes[ 0 ] in responses ) {
		finalDataType = dataTypes[ 0 ];
	} else {
		// Try convertible dataTypes
		for ( type in responses ) {
			if ( !dataTypes[ 0 ] || s.converters[ type + " " + dataTypes[0] ] ) {
				finalDataType = type;
				break;
			}
			if ( !firstDataType ) {
				firstDataType = type;
			}
		}
		// Or just use first one
		finalDataType = finalDataType || firstDataType;
	}

	// If we found a dataType
	// We add the dataType to the list if needed
	// and return the corresponding response
	if ( finalDataType ) {
		if ( finalDataType !== dataTypes[ 0 ] ) {
			dataTypes.unshift( finalDataType );
		}
		return responses[ finalDataType ];
	}
}

/* Chain conversions given the request and the original response
 * Also sets the responseXXX fields on the jqXHR instance
 */
function ajaxConvert( s, response, jqXHR, isSuccess ) {
	var conv2, current, conv, tmp, prev,
		converters = {},
		// Work with a copy of dataTypes in case we need to modify it for conversion
		dataTypes = s.dataTypes.slice();

	// Create converters map with lowercased keys
	if ( dataTypes[ 1 ] ) {
		for ( conv in s.converters ) {
			converters[ conv.toLowerCase() ] = s.converters[ conv ];
		}
	}

	current = dataTypes.shift();

	// Convert to each sequential dataType
	while ( current ) {

		if ( s.responseFields[ current ] ) {
			jqXHR[ s.responseFields[ current ] ] = response;
		}

		// Apply the dataFilter if provided
		if ( !prev && isSuccess && s.dataFilter ) {
			response = s.dataFilter( response, s.dataType );
		}

		prev = current;
		current = dataTypes.shift();

		if ( current ) {

		// There's only work to do if current dataType is non-auto
			if ( current === "*" ) {

				current = prev;

			// Convert response if prev dataType is non-auto and differs from current
			} else if ( prev !== "*" && prev !== current ) {

				// Seek a direct converter
				conv = converters[ prev + " " + current ] || converters[ "* " + current ];

				// If none found, seek a pair
				if ( !conv ) {
					for ( conv2 in converters ) {

						// If conv2 outputs current
						tmp = conv2.split( " " );
						if ( tmp[ 1 ] === current ) {

							// If prev can be converted to accepted input
							conv = converters[ prev + " " + tmp[ 0 ] ] ||
								converters[ "* " + tmp[ 0 ] ];
							if ( conv ) {
								// Condense equivalence converters
								if ( conv === true ) {
									conv = converters[ conv2 ];

								// Otherwise, insert the intermediate dataType
								} else if ( converters[ conv2 ] !== true ) {
									current = tmp[ 0 ];
									dataTypes.unshift( tmp[ 1 ] );
								}
								break;
							}
						}
					}
				}

				// Apply converter (if not an equivalence)
				if ( conv !== true ) {

					// Unless errors are allowed to bubble, catch and return them
					if ( conv && s[ "throws" ] ) {
						response = conv( response );
					} else {
						try {
							response = conv( response );
						} catch ( e ) {
							return { state: "parsererror", error: conv ? e : "No conversion from " + prev + " to " + current };
						}
					}
				}
			}
		}
	}

	return { state: "success", data: response };
}
// Install script dataType
jQuery.ajaxSetup({
	accepts: {
		script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
	},
	contents: {
		script: /(?:java|ecma)script/
	},
	converters: {
		"text script": function( text ) {
			jQuery.globalEval( text );
			return text;
		}
	}
});

// Handle cache's special case and crossDomain
jQuery.ajaxPrefilter( "script", function( s ) {
	if ( s.cache === undefined ) {
		s.cache = false;
	}
	if ( s.crossDomain ) {
		s.type = "GET";
	}
});

// Bind script tag hack transport
jQuery.ajaxTransport( "script", function( s ) {
	// This transport only deals with cross domain requests
	if ( s.crossDomain ) {
		var script, callback;
		return {
			send: function( _, complete ) {
				script = jQuery("<script>").prop({
					async: true,
					charset: s.scriptCharset,
					src: s.url
				}).on(
					"load error",
					callback = function( evt ) {
						script.remove();
						callback = null;
						if ( evt ) {
							complete( evt.type === "error" ? 404 : 200, evt.type );
						}
					}
				);
				document.head.appendChild( script[ 0 ] );
			},
			abort: function() {
				if ( callback ) {
					callback();
				}
			}
		};
	}
});
var oldCallbacks = [],
	rjsonp = /(=)\?(?=&|$)|\?\?/;

// Default jsonp settings
jQuery.ajaxSetup({
	jsonp: "callback",
	jsonpCallback: function() {
		var callback = oldCallbacks.pop() || ( jQuery.expando + "_" + ( ajax_nonce++ ) );
		this[ callback ] = true;
		return callback;
	}
});

// Detect, normalize options and install callbacks for jsonp requests
jQuery.ajaxPrefilter( "json jsonp", function( s, originalSettings, jqXHR ) {

	var callbackName, overwritten, responseContainer,
		jsonProp = s.jsonp !== false && ( rjsonp.test( s.url ) ?
			"url" :
			typeof s.data === "string" && !( s.contentType || "" ).indexOf("application/x-www-form-urlencoded") && rjsonp.test( s.data ) && "data"
		);

	// Handle iff the expected data type is "jsonp" or we have a parameter to set
	if ( jsonProp || s.dataTypes[ 0 ] === "jsonp" ) {

		// Get callback name, remembering preexisting value associated with it
		callbackName = s.jsonpCallback = jQuery.isFunction( s.jsonpCallback ) ?
			s.jsonpCallback() :
			s.jsonpCallback;

		// Insert callback into url or form data
		if ( jsonProp ) {
			s[ jsonProp ] = s[ jsonProp ].replace( rjsonp, "$1" + callbackName );
		} else if ( s.jsonp !== false ) {
			s.url += ( ajax_rquery.test( s.url ) ? "&" : "?" ) + s.jsonp + "=" + callbackName;
		}

		// Use data converter to retrieve json after script execution
		s.converters["script json"] = function() {
			if ( !responseContainer ) {
				jQuery.error( callbackName + " was not called" );
			}
			return responseContainer[ 0 ];
		};

		// force json dataType
		s.dataTypes[ 0 ] = "json";

		// Install callback
		overwritten = window[ callbackName ];
		window[ callbackName ] = function() {
			responseContainer = arguments;
		};

		// Clean-up function (fires after converters)
		jqXHR.always(function() {
			// Restore preexisting value
			window[ callbackName ] = overwritten;

			// Save back as free
			if ( s[ callbackName ] ) {
				// make sure that re-using the options doesn't screw things around
				s.jsonpCallback = originalSettings.jsonpCallback;

				// save the callback name for future use
				oldCallbacks.push( callbackName );
			}

			// Call if it was a function and we have a response
			if ( responseContainer && jQuery.isFunction( overwritten ) ) {
				overwritten( responseContainer[ 0 ] );
			}

			responseContainer = overwritten = undefined;
		});

		// Delegate to script
		return "script";
	}
});
jQuery.ajaxSettings.xhr = function() {
	try {
		return new XMLHttpRequest();
	} catch( e ) {}
};

var xhrSupported = jQuery.ajaxSettings.xhr(),
	xhrSuccessStatus = {
		// file protocol always yields status code 0, assume 200
		0: 200,
		// Support: IE9
		// #1450: sometimes IE returns 1223 when it should be 204
		1223: 204
	},
	// Support: IE9
	// We need to keep track of outbound xhr and abort them manually
	// because IE is not smart enough to do it all by itself
	xhrId = 0,
	xhrCallbacks = {};

if ( window.ActiveXObject ) {
	jQuery( window ).on( "unload", function() {
		for( var key in xhrCallbacks ) {
			xhrCallbacks[ key ]();
		}
		xhrCallbacks = undefined;
	});
}

jQuery.support.cors = !!xhrSupported && ( "withCredentials" in xhrSupported );
jQuery.support.ajax = xhrSupported = !!xhrSupported;

jQuery.ajaxTransport(function( options ) {
	var callback;
	// Cross domain only allowed if supported through XMLHttpRequest
	if ( jQuery.support.cors || xhrSupported && !options.crossDomain ) {
		return {
			send: function( headers, complete ) {
				var i, id,
					xhr = options.xhr();
				xhr.open( options.type, options.url, options.async, options.username, options.password );
				// Apply custom fields if provided
				if ( options.xhrFields ) {
					for ( i in options.xhrFields ) {
						xhr[ i ] = options.xhrFields[ i ];
					}
				}
				// Override mime type if needed
				if ( options.mimeType && xhr.overrideMimeType ) {
					xhr.overrideMimeType( options.mimeType );
				}
				// X-Requested-With header
				// For cross-domain requests, seeing as conditions for a preflight are
				// akin to a jigsaw puzzle, we simply never set it to be sure.
				// (it can always be set on a per-request basis or even using ajaxSetup)
				// For same-domain requests, won't change header if already provided.
				if ( !options.crossDomain && !headers["X-Requested-With"] ) {
					headers["X-Requested-With"] = "XMLHttpRequest";
				}
				// Set headers
				for ( i in headers ) {
					xhr.setRequestHeader( i, headers[ i ] );
				}
				// Callback
				callback = function( type ) {
					return function() {
						if ( callback ) {
							delete xhrCallbacks[ id ];
							callback = xhr.onload = xhr.onerror = null;
							if ( type === "abort" ) {
								xhr.abort();
							} else if ( type === "error" ) {
								complete(
									// file protocol always yields status 0, assume 404
									xhr.status || 404,
									xhr.statusText
								);
							} else {
								complete(
									xhrSuccessStatus[ xhr.status ] || xhr.status,
									xhr.statusText,
									// Support: IE9
									// #11426: When requesting binary data, IE9 will throw an exception
									// on any attempt to access responseText
									typeof xhr.responseText === "string" ? {
										text: xhr.responseText
									} : undefined,
									xhr.getAllResponseHeaders()
								);
							}
						}
					};
				};
				// Listen to events
				xhr.onload = callback();
				xhr.onerror = callback("error");
				// Create the abort callback
				callback = xhrCallbacks[( id = xhrId++ )] = callback("abort");
				// Do send the request
				// This may raise an exception which is actually
				// handled in jQuery.ajax (so no try/catch here)
				xhr.send( options.hasContent && options.data || null );
			},
			abort: function() {
				if ( callback ) {
					callback();
				}
			}
		};
	}
});
var fxNow, timerId,
	rfxtypes = /^(?:toggle|show|hide)$/,
	rfxnum = new RegExp( "^(?:([+-])=|)(" + core_pnum + ")([a-z%]*)$", "i" ),
	rrun = /queueHooks$/,
	animationPrefilters = [ defaultPrefilter ],
	tweeners = {
		"*": [function( prop, value ) {
			var tween = this.createTween( prop, value ),
				target = tween.cur(),
				parts = rfxnum.exec( value ),
				unit = parts && parts[ 3 ] || ( jQuery.cssNumber[ prop ] ? "" : "px" ),

				// Starting value computation is required for potential unit mismatches
				start = ( jQuery.cssNumber[ prop ] || unit !== "px" && +target ) &&
					rfxnum.exec( jQuery.css( tween.elem, prop ) ),
				scale = 1,
				maxIterations = 20;

			if ( start && start[ 3 ] !== unit ) {
				// Trust units reported by jQuery.css
				unit = unit || start[ 3 ];

				// Make sure we update the tween properties later on
				parts = parts || [];

				// Iteratively approximate from a nonzero starting point
				start = +target || 1;

				do {
					// If previous iteration zeroed out, double until we get *something*
					// Use a string for doubling factor so we don't accidentally see scale as unchanged below
					scale = scale || ".5";

					// Adjust and apply
					start = start / scale;
					jQuery.style( tween.elem, prop, start + unit );

				// Update scale, tolerating zero or NaN from tween.cur()
				// And breaking the loop if scale is unchanged or perfect, or if we've just had enough
				} while ( scale !== (scale = tween.cur() / target) && scale !== 1 && --maxIterations );
			}

			// Update tween properties
			if ( parts ) {
				start = tween.start = +start || +target || 0;
				tween.unit = unit;
				// If a +=/-= token was provided, we're doing a relative animation
				tween.end = parts[ 1 ] ?
					start + ( parts[ 1 ] + 1 ) * parts[ 2 ] :
					+parts[ 2 ];
			}

			return tween;
		}]
	};

// Animations created synchronously will run synchronously
function createFxNow() {
	setTimeout(function() {
		fxNow = undefined;
	});
	return ( fxNow = jQuery.now() );
}

function createTween( value, prop, animation ) {
	var tween,
		collection = ( tweeners[ prop ] || [] ).concat( tweeners[ "*" ] ),
		index = 0,
		length = collection.length;
	for ( ; index < length; index++ ) {
		if ( (tween = collection[ index ].call( animation, prop, value )) ) {

			// we're done with this property
			return tween;
		}
	}
}

function Animation( elem, properties, options ) {
	var result,
		stopped,
		index = 0,
		length = animationPrefilters.length,
		deferred = jQuery.Deferred().always( function() {
			// don't match elem in the :animated selector
			delete tick.elem;
		}),
		tick = function() {
			if ( stopped ) {
				return false;
			}
			var currentTime = fxNow || createFxNow(),
				remaining = Math.max( 0, animation.startTime + animation.duration - currentTime ),
				// archaic crash bug won't allow us to use 1 - ( 0.5 || 0 ) (#12497)
				temp = remaining / animation.duration || 0,
				percent = 1 - temp,
				index = 0,
				length = animation.tweens.length;

			for ( ; index < length ; index++ ) {
				animation.tweens[ index ].run( percent );
			}

			deferred.notifyWith( elem, [ animation, percent, remaining ]);

			if ( percent < 1 && length ) {
				return remaining;
			} else {
				deferred.resolveWith( elem, [ animation ] );
				return false;
			}
		},
		animation = deferred.promise({
			elem: elem,
			props: jQuery.extend( {}, properties ),
			opts: jQuery.extend( true, { specialEasing: {} }, options ),
			originalProperties: properties,
			originalOptions: options,
			startTime: fxNow || createFxNow(),
			duration: options.duration,
			tweens: [],
			createTween: function( prop, end ) {
				var tween = jQuery.Tween( elem, animation.opts, prop, end,
						animation.opts.specialEasing[ prop ] || animation.opts.easing );
				animation.tweens.push( tween );
				return tween;
			},
			stop: function( gotoEnd ) {
				var index = 0,
					// if we are going to the end, we want to run all the tweens
					// otherwise we skip this part
					length = gotoEnd ? animation.tweens.length : 0;
				if ( stopped ) {
					return this;
				}
				stopped = true;
				for ( ; index < length ; index++ ) {
					animation.tweens[ index ].run( 1 );
				}

				// resolve when we played the last frame
				// otherwise, reject
				if ( gotoEnd ) {
					deferred.resolveWith( elem, [ animation, gotoEnd ] );
				} else {
					deferred.rejectWith( elem, [ animation, gotoEnd ] );
				}
				return this;
			}
		}),
		props = animation.props;

	propFilter( props, animation.opts.specialEasing );

	for ( ; index < length ; index++ ) {
		result = animationPrefilters[ index ].call( animation, elem, props, animation.opts );
		if ( result ) {
			return result;
		}
	}

	jQuery.map( props, createTween, animation );

	if ( jQuery.isFunction( animation.opts.start ) ) {
		animation.opts.start.call( elem, animation );
	}

	jQuery.fx.timer(
		jQuery.extend( tick, {
			elem: elem,
			anim: animation,
			queue: animation.opts.queue
		})
	);

	// attach callbacks from options
	return animation.progress( animation.opts.progress )
		.done( animation.opts.done, animation.opts.complete )
		.fail( animation.opts.fail )
		.always( animation.opts.always );
}

function propFilter( props, specialEasing ) {
	var index, name, easing, value, hooks;

	// camelCase, specialEasing and expand cssHook pass
	for ( index in props ) {
		name = jQuery.camelCase( index );
		easing = specialEasing[ name ];
		value = props[ index ];
		if ( jQuery.isArray( value ) ) {
			easing = value[ 1 ];
			value = props[ index ] = value[ 0 ];
		}

		if ( index !== name ) {
			props[ name ] = value;
			delete props[ index ];
		}

		hooks = jQuery.cssHooks[ name ];
		if ( hooks && "expand" in hooks ) {
			value = hooks.expand( value );
			delete props[ name ];

			// not quite $.extend, this wont overwrite keys already present.
			// also - reusing 'index' from above because we have the correct "name"
			for ( index in value ) {
				if ( !( index in props ) ) {
					props[ index ] = value[ index ];
					specialEasing[ index ] = easing;
				}
			}
		} else {
			specialEasing[ name ] = easing;
		}
	}
}

jQuery.Animation = jQuery.extend( Animation, {

	tweener: function( props, callback ) {
		if ( jQuery.isFunction( props ) ) {
			callback = props;
			props = [ "*" ];
		} else {
			props = props.split(" ");
		}

		var prop,
			index = 0,
			length = props.length;

		for ( ; index < length ; index++ ) {
			prop = props[ index ];
			tweeners[ prop ] = tweeners[ prop ] || [];
			tweeners[ prop ].unshift( callback );
		}
	},

	prefilter: function( callback, prepend ) {
		if ( prepend ) {
			animationPrefilters.unshift( callback );
		} else {
			animationPrefilters.push( callback );
		}
	}
});

function defaultPrefilter( elem, props, opts ) {
	/* jshint validthis: true */
	var prop, value, toggle, tween, hooks, oldfire,
		anim = this,
		orig = {},
		style = elem.style,
		hidden = elem.nodeType && isHidden( elem ),
		dataShow = data_priv.get( elem, "fxshow" );

	// handle queue: false promises
	if ( !opts.queue ) {
		hooks = jQuery._queueHooks( elem, "fx" );
		if ( hooks.unqueued == null ) {
			hooks.unqueued = 0;
			oldfire = hooks.empty.fire;
			hooks.empty.fire = function() {
				if ( !hooks.unqueued ) {
					oldfire();
				}
			};
		}
		hooks.unqueued++;

		anim.always(function() {
			// doing this makes sure that the complete handler will be called
			// before this completes
			anim.always(function() {
				hooks.unqueued--;
				if ( !jQuery.queue( elem, "fx" ).length ) {
					hooks.empty.fire();
				}
			});
		});
	}

	// height/width overflow pass
	if ( elem.nodeType === 1 && ( "height" in props || "width" in props ) ) {
		// Make sure that nothing sneaks out
		// Record all 3 overflow attributes because IE9-10 do not
		// change the overflow attribute when overflowX and
		// overflowY are set to the same value
		opts.overflow = [ style.overflow, style.overflowX, style.overflowY ];

		// Set display property to inline-block for height/width
		// animations on inline elements that are having width/height animated
		if ( jQuery.css( elem, "display" ) === "inline" &&
				jQuery.css( elem, "float" ) === "none" ) {

			style.display = "inline-block";
		}
	}

	if ( opts.overflow ) {
		style.overflow = "hidden";
		anim.always(function() {
			style.overflow = opts.overflow[ 0 ];
			style.overflowX = opts.overflow[ 1 ];
			style.overflowY = opts.overflow[ 2 ];
		});
	}


	// show/hide pass
	for ( prop in props ) {
		value = props[ prop ];
		if ( rfxtypes.exec( value ) ) {
			delete props[ prop ];
			toggle = toggle || value === "toggle";
			if ( value === ( hidden ? "hide" : "show" ) ) {

				// If there is dataShow left over from a stopped hide or show and we are going to proceed with show, we should pretend to be hidden
				if ( value === "show" && dataShow && dataShow[ prop ] !== undefined ) {
					hidden = true;
				} else {
					continue;
				}
			}
			orig[ prop ] = dataShow && dataShow[ prop ] || jQuery.style( elem, prop );
		}
	}

	if ( !jQuery.isEmptyObject( orig ) ) {
		if ( dataShow ) {
			if ( "hidden" in dataShow ) {
				hidden = dataShow.hidden;
			}
		} else {
			dataShow = data_priv.access( elem, "fxshow", {} );
		}

		// store state if its toggle - enables .stop().toggle() to "reverse"
		if ( toggle ) {
			dataShow.hidden = !hidden;
		}
		if ( hidden ) {
			jQuery( elem ).show();
		} else {
			anim.done(function() {
				jQuery( elem ).hide();
			});
		}
		anim.done(function() {
			var prop;

			data_priv.remove( elem, "fxshow" );
			for ( prop in orig ) {
				jQuery.style( elem, prop, orig[ prop ] );
			}
		});
		for ( prop in orig ) {
			tween = createTween( hidden ? dataShow[ prop ] : 0, prop, anim );

			if ( !( prop in dataShow ) ) {
				dataShow[ prop ] = tween.start;
				if ( hidden ) {
					tween.end = tween.start;
					tween.start = prop === "width" || prop === "height" ? 1 : 0;
				}
			}
		}
	}
}

function Tween( elem, options, prop, end, easing ) {
	return new Tween.prototype.init( elem, options, prop, end, easing );
}
jQuery.Tween = Tween;

Tween.prototype = {
	constructor: Tween,
	init: function( elem, options, prop, end, easing, unit ) {
		this.elem = elem;
		this.prop = prop;
		this.easing = easing || "swing";
		this.options = options;
		this.start = this.now = this.cur();
		this.end = end;
		this.unit = unit || ( jQuery.cssNumber[ prop ] ? "" : "px" );
	},
	cur: function() {
		var hooks = Tween.propHooks[ this.prop ];

		return hooks && hooks.get ?
			hooks.get( this ) :
			Tween.propHooks._default.get( this );
	},
	run: function( percent ) {
		var eased,
			hooks = Tween.propHooks[ this.prop ];

		if ( this.options.duration ) {
			this.pos = eased = jQuery.easing[ this.easing ](
				percent, this.options.duration * percent, 0, 1, this.options.duration
			);
		} else {
			this.pos = eased = percent;
		}
		this.now = ( this.end - this.start ) * eased + this.start;

		if ( this.options.step ) {
			this.options.step.call( this.elem, this.now, this );
		}

		if ( hooks && hooks.set ) {
			hooks.set( this );
		} else {
			Tween.propHooks._default.set( this );
		}
		return this;
	}
};

Tween.prototype.init.prototype = Tween.prototype;

Tween.propHooks = {
	_default: {
		get: function( tween ) {
			var result;

			if ( tween.elem[ tween.prop ] != null &&
				(!tween.elem.style || tween.elem.style[ tween.prop ] == null) ) {
				return tween.elem[ tween.prop ];
			}

			// passing an empty string as a 3rd parameter to .css will automatically
			// attempt a parseFloat and fallback to a string if the parse fails
			// so, simple values such as "10px" are parsed to Float.
			// complex values such as "rotate(1rad)" are returned as is.
			result = jQuery.css( tween.elem, tween.prop, "" );
			// Empty strings, null, undefined and "auto" are converted to 0.
			return !result || result === "auto" ? 0 : result;
		},
		set: function( tween ) {
			// use step hook for back compat - use cssHook if its there - use .style if its
			// available and use plain properties where available
			if ( jQuery.fx.step[ tween.prop ] ) {
				jQuery.fx.step[ tween.prop ]( tween );
			} else if ( tween.elem.style && ( tween.elem.style[ jQuery.cssProps[ tween.prop ] ] != null || jQuery.cssHooks[ tween.prop ] ) ) {
				jQuery.style( tween.elem, tween.prop, tween.now + tween.unit );
			} else {
				tween.elem[ tween.prop ] = tween.now;
			}
		}
	}
};

// Support: IE9
// Panic based approach to setting things on disconnected nodes

Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
	set: function( tween ) {
		if ( tween.elem.nodeType && tween.elem.parentNode ) {
			tween.elem[ tween.prop ] = tween.now;
		}
	}
};

jQuery.each([ "toggle", "show", "hide" ], function( i, name ) {
	var cssFn = jQuery.fn[ name ];
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return speed == null || typeof speed === "boolean" ?
			cssFn.apply( this, arguments ) :
			this.animate( genFx( name, true ), speed, easing, callback );
	};
});

jQuery.fn.extend({
	fadeTo: function( speed, to, easing, callback ) {

		// show any hidden elements after setting opacity to 0
		return this.filter( isHidden ).css( "opacity", 0 ).show()

			// animate to the value specified
			.end().animate({ opacity: to }, speed, easing, callback );
	},
	animate: function( prop, speed, easing, callback ) {
		var empty = jQuery.isEmptyObject( prop ),
			optall = jQuery.speed( speed, easing, callback ),
			doAnimation = function() {
				// Operate on a copy of prop so per-property easing won't be lost
				var anim = Animation( this, jQuery.extend( {}, prop ), optall );

				// Empty animations, or finishing resolves immediately
				if ( empty || data_priv.get( this, "finish" ) ) {
					anim.stop( true );
				}
			};
			doAnimation.finish = doAnimation;

		return empty || optall.queue === false ?
			this.each( doAnimation ) :
			this.queue( optall.queue, doAnimation );
	},
	stop: function( type, clearQueue, gotoEnd ) {
		var stopQueue = function( hooks ) {
			var stop = hooks.stop;
			delete hooks.stop;
			stop( gotoEnd );
		};

		if ( typeof type !== "string" ) {
			gotoEnd = clearQueue;
			clearQueue = type;
			type = undefined;
		}
		if ( clearQueue && type !== false ) {
			this.queue( type || "fx", [] );
		}

		return this.each(function() {
			var dequeue = true,
				index = type != null && type + "queueHooks",
				timers = jQuery.timers,
				data = data_priv.get( this );

			if ( index ) {
				if ( data[ index ] && data[ index ].stop ) {
					stopQueue( data[ index ] );
				}
			} else {
				for ( index in data ) {
					if ( data[ index ] && data[ index ].stop && rrun.test( index ) ) {
						stopQueue( data[ index ] );
					}
				}
			}

			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this && (type == null || timers[ index ].queue === type) ) {
					timers[ index ].anim.stop( gotoEnd );
					dequeue = false;
					timers.splice( index, 1 );
				}
			}

			// start the next in the queue if the last step wasn't forced
			// timers currently will call their complete callbacks, which will dequeue
			// but only if they were gotoEnd
			if ( dequeue || !gotoEnd ) {
				jQuery.dequeue( this, type );
			}
		});
	},
	finish: function( type ) {
		if ( type !== false ) {
			type = type || "fx";
		}
		return this.each(function() {
			var index,
				data = data_priv.get( this ),
				queue = data[ type + "queue" ],
				hooks = data[ type + "queueHooks" ],
				timers = jQuery.timers,
				length = queue ? queue.length : 0;

			// enable finishing flag on private data
			data.finish = true;

			// empty the queue first
			jQuery.queue( this, type, [] );

			if ( hooks && hooks.stop ) {
				hooks.stop.call( this, true );
			}

			// look for any active animations, and finish them
			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this && timers[ index ].queue === type ) {
					timers[ index ].anim.stop( true );
					timers.splice( index, 1 );
				}
			}

			// look for any animations in the old queue and finish them
			for ( index = 0; index < length; index++ ) {
				if ( queue[ index ] && queue[ index ].finish ) {
					queue[ index ].finish.call( this );
				}
			}

			// turn off finishing flag
			delete data.finish;
		});
	}
});

// Generate parameters to create a standard animation
function genFx( type, includeWidth ) {
	var which,
		attrs = { height: type },
		i = 0;

	// if we include width, step value is 1 to do all cssExpand values,
	// if we don't include width, step value is 2 to skip over Left and Right
	includeWidth = includeWidth? 1 : 0;
	for( ; i < 4 ; i += 2 - includeWidth ) {
		which = cssExpand[ i ];
		attrs[ "margin" + which ] = attrs[ "padding" + which ] = type;
	}

	if ( includeWidth ) {
		attrs.opacity = attrs.width = type;
	}

	return attrs;
}

// Generate shortcuts for custom animations
jQuery.each({
	slideDown: genFx("show"),
	slideUp: genFx("hide"),
	slideToggle: genFx("toggle"),
	fadeIn: { opacity: "show" },
	fadeOut: { opacity: "hide" },
	fadeToggle: { opacity: "toggle" }
}, function( name, props ) {
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return this.animate( props, speed, easing, callback );
	};
});

jQuery.speed = function( speed, easing, fn ) {
	var opt = speed && typeof speed === "object" ? jQuery.extend( {}, speed ) : {
		complete: fn || !fn && easing ||
			jQuery.isFunction( speed ) && speed,
		duration: speed,
		easing: fn && easing || easing && !jQuery.isFunction( easing ) && easing
	};

	opt.duration = jQuery.fx.off ? 0 : typeof opt.duration === "number" ? opt.duration :
		opt.duration in jQuery.fx.speeds ? jQuery.fx.speeds[ opt.duration ] : jQuery.fx.speeds._default;

	// normalize opt.queue - true/undefined/null -> "fx"
	if ( opt.queue == null || opt.queue === true ) {
		opt.queue = "fx";
	}

	// Queueing
	opt.old = opt.complete;

	opt.complete = function() {
		if ( jQuery.isFunction( opt.old ) ) {
			opt.old.call( this );
		}

		if ( opt.queue ) {
			jQuery.dequeue( this, opt.queue );
		}
	};

	return opt;
};

jQuery.easing = {
	linear: function( p ) {
		return p;
	},
	swing: function( p ) {
		return 0.5 - Math.cos( p*Math.PI ) / 2;
	}
};

jQuery.timers = [];
jQuery.fx = Tween.prototype.init;
jQuery.fx.tick = function() {
	var timer,
		timers = jQuery.timers,
		i = 0;

	fxNow = jQuery.now();

	for ( ; i < timers.length; i++ ) {
		timer = timers[ i ];
		// Checks the timer has not already been removed
		if ( !timer() && timers[ i ] === timer ) {
			timers.splice( i--, 1 );
		}
	}

	if ( !timers.length ) {
		jQuery.fx.stop();
	}
	fxNow = undefined;
};

jQuery.fx.timer = function( timer ) {
	if ( timer() && jQuery.timers.push( timer ) ) {
		jQuery.fx.start();
	}
};

jQuery.fx.interval = 13;

jQuery.fx.start = function() {
	if ( !timerId ) {
		timerId = setInterval( jQuery.fx.tick, jQuery.fx.interval );
	}
};

jQuery.fx.stop = function() {
	clearInterval( timerId );
	timerId = null;
};

jQuery.fx.speeds = {
	slow: 600,
	fast: 200,
	// Default speed
	_default: 400
};

// Back Compat <1.8 extension point
jQuery.fx.step = {};

if ( jQuery.expr && jQuery.expr.filters ) {
	jQuery.expr.filters.animated = function( elem ) {
		return jQuery.grep(jQuery.timers, function( fn ) {
			return elem === fn.elem;
		}).length;
	};
}
jQuery.fn.offset = function( options ) {
	if ( arguments.length ) {
		return options === undefined ?
			this :
			this.each(function( i ) {
				jQuery.offset.setOffset( this, options, i );
			});
	}

	var docElem, win,
		elem = this[ 0 ],
		box = { top: 0, left: 0 },
		doc = elem && elem.ownerDocument;

	if ( !doc ) {
		return;
	}

	docElem = doc.documentElement;

	// Make sure it's not a disconnected DOM node
	if ( !jQuery.contains( docElem, elem ) ) {
		return box;
	}

	// If we don't have gBCR, just use 0,0 rather than error
	// BlackBerry 5, iOS 3 (original iPhone)
	if ( typeof elem.getBoundingClientRect !== core_strundefined ) {
		box = elem.getBoundingClientRect();
	}
	win = getWindow( doc );
	return {
		top: box.top + win.pageYOffset - docElem.clientTop,
		left: box.left + win.pageXOffset - docElem.clientLeft
	};
};

jQuery.offset = {

	setOffset: function( elem, options, i ) {
		var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition,
			position = jQuery.css( elem, "position" ),
			curElem = jQuery( elem ),
			props = {};

		// Set position first, in-case top/left are set even on static elem
		if ( position === "static" ) {
			elem.style.position = "relative";
		}

		curOffset = curElem.offset();
		curCSSTop = jQuery.css( elem, "top" );
		curCSSLeft = jQuery.css( elem, "left" );
		calculatePosition = ( position === "absolute" || position === "fixed" ) && ( curCSSTop + curCSSLeft ).indexOf("auto") > -1;

		// Need to be able to calculate position if either top or left is auto and position is either absolute or fixed
		if ( calculatePosition ) {
			curPosition = curElem.position();
			curTop = curPosition.top;
			curLeft = curPosition.left;

		} else {
			curTop = parseFloat( curCSSTop ) || 0;
			curLeft = parseFloat( curCSSLeft ) || 0;
		}

		if ( jQuery.isFunction( options ) ) {
			options = options.call( elem, i, curOffset );
		}

		if ( options.top != null ) {
			props.top = ( options.top - curOffset.top ) + curTop;
		}
		if ( options.left != null ) {
			props.left = ( options.left - curOffset.left ) + curLeft;
		}

		if ( "using" in options ) {
			options.using.call( elem, props );

		} else {
			curElem.css( props );
		}
	}
};


jQuery.fn.extend({

	position: function() {
		if ( !this[ 0 ] ) {
			return;
		}

		var offsetParent, offset,
			elem = this[ 0 ],
			parentOffset = { top: 0, left: 0 };

		// Fixed elements are offset from window (parentOffset = {top:0, left: 0}, because it is it's only offset parent
		if ( jQuery.css( elem, "position" ) === "fixed" ) {
			// We assume that getBoundingClientRect is available when computed position is fixed
			offset = elem.getBoundingClientRect();

		} else {
			// Get *real* offsetParent
			offsetParent = this.offsetParent();

			// Get correct offsets
			offset = this.offset();
			if ( !jQuery.nodeName( offsetParent[ 0 ], "html" ) ) {
				parentOffset = offsetParent.offset();
			}

			// Add offsetParent borders
			parentOffset.top += jQuery.css( offsetParent[ 0 ], "borderTopWidth", true );
			parentOffset.left += jQuery.css( offsetParent[ 0 ], "borderLeftWidth", true );
		}

		// Subtract parent offsets and element margins
		return {
			top: offset.top - parentOffset.top - jQuery.css( elem, "marginTop", true ),
			left: offset.left - parentOffset.left - jQuery.css( elem, "marginLeft", true )
		};
	},

	offsetParent: function() {
		return this.map(function() {
			var offsetParent = this.offsetParent || docElem;

			while ( offsetParent && ( !jQuery.nodeName( offsetParent, "html" ) && jQuery.css( offsetParent, "position") === "static" ) ) {
				offsetParent = offsetParent.offsetParent;
			}

			return offsetParent || docElem;
		});
	}
});


// Create scrollLeft and scrollTop methods
jQuery.each( {scrollLeft: "pageXOffset", scrollTop: "pageYOffset"}, function( method, prop ) {
	var top = "pageYOffset" === prop;

	jQuery.fn[ method ] = function( val ) {
		return jQuery.access( this, function( elem, method, val ) {
			var win = getWindow( elem );

			if ( val === undefined ) {
				return win ? win[ prop ] : elem[ method ];
			}

			if ( win ) {
				win.scrollTo(
					!top ? val : window.pageXOffset,
					top ? val : window.pageYOffset
				);

			} else {
				elem[ method ] = val;
			}
		}, method, val, arguments.length, null );
	};
});

function getWindow( elem ) {
	return jQuery.isWindow( elem ) ? elem : elem.nodeType === 9 && elem.defaultView;
}
// Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
jQuery.each( { Height: "height", Width: "width" }, function( name, type ) {
	jQuery.each( { padding: "inner" + name, content: type, "": "outer" + name }, function( defaultExtra, funcName ) {
		// margin is only for outerHeight, outerWidth
		jQuery.fn[ funcName ] = function( margin, value ) {
			var chainable = arguments.length && ( defaultExtra || typeof margin !== "boolean" ),
				extra = defaultExtra || ( margin === true || value === true ? "margin" : "border" );

			return jQuery.access( this, function( elem, type, value ) {
				var doc;

				if ( jQuery.isWindow( elem ) ) {
					// As of 5/8/2012 this will yield incorrect results for Mobile Safari, but there
					// isn't a whole lot we can do. See pull request at this URL for discussion:
					// https://github.com/jquery/jquery/pull/764
					return elem.document.documentElement[ "client" + name ];
				}

				// Get document width or height
				if ( elem.nodeType === 9 ) {
					doc = elem.documentElement;

					// Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height],
					// whichever is greatest
					return Math.max(
						elem.body[ "scroll" + name ], doc[ "scroll" + name ],
						elem.body[ "offset" + name ], doc[ "offset" + name ],
						doc[ "client" + name ]
					);
				}

				return value === undefined ?
					// Get width or height on the element, requesting but not forcing parseFloat
					jQuery.css( elem, type, extra ) :

					// Set width or height on the element
					jQuery.style( elem, type, value, extra );
			}, type, chainable ? margin : undefined, chainable, null );
		};
	});
});
// Limit scope pollution from any deprecated API
// (function() {

// The number of elements contained in the matched element set
jQuery.fn.size = function() {
	return this.length;
};

jQuery.fn.andSelf = jQuery.fn.addBack;

// })();
if ( typeof module === "object" && module && typeof module.exports === "object" ) {
	// Expose jQuery as module.exports in loaders that implement the Node
	// module pattern (including browserify). Do not create the global, since
	// the user will be storing it themselves locally, and globals are frowned
	// upon in the Node module world.
	module.exports = jQuery;
} else {
	// Register as a named AMD module, since jQuery can be concatenated with other
	// files that may use define, but not via a proper concatenation script that
	// understands anonymous AMD modules. A named AMD is safest and most robust
	// way to register. Lowercase jquery is used because AMD module names are
	// derived from file names, and jQuery is normally delivered in a lowercase
	// file name. Do this after creating the global so that if an AMD module wants
	// to call noConflict to hide this version of jQuery, it will work.
	if ( typeof define === "function" && define.amd ) {
		define( "jquery", [], function () { return jQuery; } );
	}
}

// If there is a window object, that at least has a document property,
// define jQuery and $ identifiers
if ( typeof window === "object" && typeof window.document === "object" ) {
	window.jQuery = window.$ = jQuery;
}

})( window );

//     Backbone.js 1.1.0

//     (c) 2010-2011 Jeremy Ashkenas, DocumentCloud Inc.
//     (c) 2011-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org

(function(root, factory) {
  // Set up Backbone appropriately for the environment.
  if (typeof exports !== 'undefined') {
    // Node/CommonJS, no need for jQuery in that case.
    factory(root, exports, require('underscore'));
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define('backbone',['underscore', 'jquery', 'exports'], function(_, $, exports) {
      // Export global even in AMD case in case this script is loaded with
      // others that may still expect a global Backbone.
      root.Backbone = factory(root, exports, _, $);
    });
  } else {
    // Browser globals
    root.Backbone = factory(root, {}, root._, (root.jQuery || root.Zepto || root.ender || root.$));
  }
}(this, function(root, Backbone, _, $) {

  // Initial Setup
  // -------------

  // Save the previous value of the `Backbone` variable, so that it can be
  // restored later on, if `noConflict` is used.
  var previousBackbone = root.Backbone;

  // Create local references to array methods we'll want to use later.
  var array = [];
  var push = array.push;
  var slice = array.slice;
  var splice = array.splice;

  // Current version of the library. Keep in sync with `package.json`.
  Backbone.VERSION = '1.1.0';

  // For Backbone's purposes, jQuery, Zepto, or Ender owns the `$` variable.
  Backbone.$ = $;

  // Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
  // to its previous owner. Returns a reference to this Backbone object.
  Backbone.noConflict = function() {
    root.Backbone = previousBackbone;
    return this;
  };

  // Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
  // will fake `"PATCH"`, `"PUT"` and `"DELETE"` requests via the `_method` parameter and
  // set a `X-Http-Method-Override` header.
  Backbone.emulateHTTP = false;

  // Turn on `emulateJSON` to support legacy servers that can't deal with direct
  // `application/json` requests ... will encode the body as
  // `application/x-www-form-urlencoded` instead and will send the model in a
  // form param named `model`.
  Backbone.emulateJSON = false;

  // Backbone.Events
  // ---------------

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  var Events = Backbone.Events = {

    // Bind an event to a `callback` function. Passing `"all"` will bind
    // the callback to all events fired.
    on: function(name, callback, context) {
      if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
      this._events || (this._events = {});
      var events = this._events[name] || (this._events[name] = []);
      events.push({callback: callback, context: context, ctx: context || this});
      return this;
    },

    // Bind an event to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once: function(name, callback, context) {
      if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
      var self = this;
      var once = _.once(function() {
        self.off(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
      return this.on(name, once, context);
    },

    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `name` is null, removes all bound
    // callbacks for all events.
    off: function(name, callback, context) {
      var retain, ev, events, names, i, l, j, k;
      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
      if (!name && !callback && !context) {
        this._events = {};
        return this;
      }
      names = name ? [name] : _.keys(this._events);
      for (i = 0, l = names.length; i < l; i++) {
        name = names[i];
        if (events = this._events[name]) {
          this._events[name] = retain = [];
          if (callback || context) {
            for (j = 0, k = events.length; j < k; j++) {
              ev = events[j];
              if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
                  (context && context !== ev.context)) {
                retain.push(ev);
              }
            }
          }
          if (!retain.length) delete this._events[name];
        }
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(name) {
      if (!this._events) return this;
      var args = slice.call(arguments, 1);
      if (!eventsApi(this, 'trigger', name, args)) return this;
      var events = this._events[name];
      var allEvents = this._events.all;
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, arguments);
      return this;
    },

    // Tell this object to stop listening to either specific events ... or
    // to every object it's currently listening to.
    stopListening: function(obj, name, callback) {
      var listeningTo = this._listeningTo;
      if (!listeningTo) return this;
      var remove = !name && !callback;
      if (!callback && typeof name === 'object') callback = this;
      if (obj) (listeningTo = {})[obj._listenId] = obj;
      for (var id in listeningTo) {
        obj = listeningTo[id];
        obj.off(name, callback, this);
        if (remove || _.isEmpty(obj._events)) delete this._listeningTo[id];
      }
      return this;
    }

  };

  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;

  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{change: action}`
  // in terms of the existing API.
  var eventsApi = function(obj, action, name, rest) {
    if (!name) return true;

    // Handle event maps.
    if (typeof name === 'object') {
      for (var key in name) {
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
      return false;
    }

    // Handle space separated event names.
    if (eventSplitter.test(name)) {
      var names = name.split(eventSplitter);
      for (var i = 0, l = names.length; i < l; i++) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
      return false;
    }

    return true;
  };

  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy (most internal
  // Backbone events have 3 arguments).
  var triggerEvents = function(events, args) {
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
    }
  };

  var listenMethods = {listenTo: 'on', listenToOnce: 'once'};

  // Inversion-of-control versions of `on` and `once`. Tell *this* object to
  // listen to an event in another object ... keeping track of what it's
  // listening to.
  _.each(listenMethods, function(implementation, method) {
    Events[method] = function(obj, name, callback) {
      var listeningTo = this._listeningTo || (this._listeningTo = {});
      var id = obj._listenId || (obj._listenId = _.uniqueId('l'));
      listeningTo[id] = obj;
      if (!callback && typeof name === 'object') callback = this;
      obj[implementation](name, callback, this);
      return this;
    };
  });

  // Aliases for backwards compatibility.
  Events.bind   = Events.on;
  Events.unbind = Events.off;

  // Allow the `Backbone` object to serve as a global event bus, for folks who
  // want global "pubsub" in a convenient place.
  _.extend(Backbone, Events);

  // Backbone.Model
  // --------------

  // Backbone **Models** are the basic data object in the framework --
  // frequently representing a row in a table in a database on your server.
  // A discrete chunk of data and a bunch of useful, related methods for
  // performing computations and transformations on that data.

  // Create a new model with the specified attributes. A client id (`cid`)
  // is automatically generated and assigned for you.
  var Model = Backbone.Model = function(attributes, options) {
    var attrs = attributes || {};
    options || (options = {});
    this.cid = _.uniqueId('c');
    this.attributes = {};
    if (options.collection) this.collection = options.collection;
    if (options.parse) attrs = this.parse(attrs, options) || {};
    attrs = _.defaults({}, attrs, _.result(this, 'defaults'));
    this.set(attrs, options);
    this.changed = {};
    this.initialize.apply(this, arguments);
  };

  // Attach all inheritable methods to the Model prototype.
  _.extend(Model.prototype, Events, {

    // A hash of attributes whose current and previous value differ.
    changed: null,

    // The value returned during the last failed validation.
    validationError: null,

    // The default name for the JSON `id` attribute is `"id"`. MongoDB and
    // CouchDB users may want to set this to `"_id"`.
    idAttribute: 'id',

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Return a copy of the model's `attributes` object.
    toJSON: function(options) {
      return _.clone(this.attributes);
    },

    // Proxy `Backbone.sync` by default -- but override this if you need
    // custom syncing semantics for *this* particular model.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Get the value of an attribute.
    get: function(attr) {
      return this.attributes[attr];
    },

    // Get the HTML-escaped value of an attribute.
    escape: function(attr) {
      return _.escape(this.get(attr));
    },

    // Returns `true` if the attribute contains a value that is not null
    // or undefined.
    has: function(attr) {
      return this.get(attr) != null;
    },

    // Set a hash of model attributes on the object, firing `"change"`. This is
    // the core primitive operation of a model, updating the data and notifying
    // anyone who needs to know about the change in state. The heart of the beast.
    set: function(key, val, options) {
      var attr, attrs, unset, changes, silent, changing, prev, current;
      if (key == null) return this;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options || (options = {});

      // Run validation.
      if (!this._validate(attrs, options)) return false;

      // Extract attributes and options.
      unset           = options.unset;
      silent          = options.silent;
      changes         = [];
      changing        = this._changing;
      this._changing  = true;

      if (!changing) {
        this._previousAttributes = _.clone(this.attributes);
        this.changed = {};
      }
      current = this.attributes, prev = this._previousAttributes;

      // Check for changes of `id`.
      if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];

      // For each `set` attribute, update or delete the current value.
      for (attr in attrs) {
        val = attrs[attr];
        if (!_.isEqual(current[attr], val)) changes.push(attr);
        if (!_.isEqual(prev[attr], val)) {
          this.changed[attr] = val;
        } else {
          delete this.changed[attr];
        }
        unset ? delete current[attr] : current[attr] = val;
      }

      // Trigger all relevant attribute changes.
      if (!silent) {
        if (changes.length) this._pending = true;
        for (var i = 0, l = changes.length; i < l; i++) {
          this.trigger('change:' + changes[i], this, current[changes[i]], options);
        }
      }

      // You might be wondering why there's a `while` loop here. Changes can
      // be recursively nested within `"change"` events.
      if (changing) return this;
      if (!silent) {
        while (this._pending) {
          this._pending = false;
          this.trigger('change', this, options);
        }
      }
      this._pending = false;
      this._changing = false;
      return this;
    },

    // Remove an attribute from the model, firing `"change"`. `unset` is a noop
    // if the attribute doesn't exist.
    unset: function(attr, options) {
      return this.set(attr, void 0, _.extend({}, options, {unset: true}));
    },

    // Clear all attributes on the model, firing `"change"`.
    clear: function(options) {
      var attrs = {};
      for (var key in this.attributes) attrs[key] = void 0;
      return this.set(attrs, _.extend({}, options, {unset: true}));
    },

    // Determine if the model has changed since the last `"change"` event.
    // If you specify an attribute name, determine if that attribute has changed.
    hasChanged: function(attr) {
      if (attr == null) return !_.isEmpty(this.changed);
      return _.has(this.changed, attr);
    },

    // Return an object containing all the attributes that have changed, or
    // false if there are no changed attributes. Useful for determining what
    // parts of a view need to be updated and/or what attributes need to be
    // persisted to the server. Unset attributes will be set to undefined.
    // You can also pass an attributes object to diff against the model,
    // determining if there *would be* a change.
    changedAttributes: function(diff) {
      if (!diff) return this.hasChanged() ? _.clone(this.changed) : false;
      var val, changed = false;
      var old = this._changing ? this._previousAttributes : this.attributes;
      for (var attr in diff) {
        if (_.isEqual(old[attr], (val = diff[attr]))) continue;
        (changed || (changed = {}))[attr] = val;
      }
      return changed;
    },

    // Get the previous value of an attribute, recorded at the time the last
    // `"change"` event was fired.
    previous: function(attr) {
      if (attr == null || !this._previousAttributes) return null;
      return this._previousAttributes[attr];
    },

    // Get all of the attributes of the model at the time of the previous
    // `"change"` event.
    previousAttributes: function() {
      return _.clone(this._previousAttributes);
    },

    // Fetch the model from the server. If the server's representation of the
    // model differs from its current attributes, they will be overridden,
    // triggering a `"change"` event.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var model = this;
      var success = options.success;
      options.success = function(resp) {
        if (!model.set(model.parse(resp, options), options)) return false;
        if (success) success(model, resp, options);
        model.trigger('sync', model, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    },

    // Set a hash of model attributes, and sync the model to the server.
    // If the server returns an attributes hash that differs, the model's
    // state will be `set` again.
    save: function(key, val, options) {
      var attrs, method, xhr, attributes = this.attributes;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (key == null || typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options = _.extend({validate: true}, options);

      // If we're not waiting and attributes exist, save acts as
      // `set(attr).save(null, opts)` with validation. Otherwise, check if
      // the model will be valid when the attributes, if any, are set.
      if (attrs && !options.wait) {
        if (!this.set(attrs, options)) return false;
      } else {
        if (!this._validate(attrs, options)) return false;
      }

      // Set temporary attributes if `{wait: true}`.
      if (attrs && options.wait) {
        this.attributes = _.extend({}, attributes, attrs);
      }

      // After a successful server-side save, the client is (optionally)
      // updated with the server-side state.
      if (options.parse === void 0) options.parse = true;
      var model = this;
      var success = options.success;
      options.success = function(resp) {
        // Ensure attributes are restored during synchronous saves.
        model.attributes = attributes;
        var serverAttrs = model.parse(resp, options);
        if (options.wait) serverAttrs = _.extend(attrs || {}, serverAttrs);
        if (_.isObject(serverAttrs) && !model.set(serverAttrs, options)) {
          return false;
        }
        if (success) success(model, resp, options);
        model.trigger('sync', model, resp, options);
      };
      wrapError(this, options);

      method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');
      if (method === 'patch') options.attrs = attrs;
      xhr = this.sync(method, this, options);

      // Restore attributes.
      if (attrs && options.wait) this.attributes = attributes;

      return xhr;
    },

    // Destroy this model on the server if it was already persisted.
    // Optimistically removes the model from its collection, if it has one.
    // If `wait: true` is passed, waits for the server to respond before removal.
    destroy: function(options) {
      options = options ? _.clone(options) : {};
      var model = this;
      var success = options.success;

      var destroy = function() {
        model.trigger('destroy', model, model.collection, options);
      };

      options.success = function(resp) {
        if (options.wait || model.isNew()) destroy();
        if (success) success(model, resp, options);
        if (!model.isNew()) model.trigger('sync', model, resp, options);
      };

      if (this.isNew()) {
        options.success();
        return false;
      }
      wrapError(this, options);

      var xhr = this.sync('delete', this, options);
      if (!options.wait) destroy();
      return xhr;
    },

    // Default URL for the model's representation on the server -- if you're
    // using Backbone's restful methods, override this to change the endpoint
    // that will be called.
    url: function() {
      var base = _.result(this, 'urlRoot') || _.result(this.collection, 'url') || urlError();
      if (this.isNew()) return base;
      return base + (base.charAt(base.length - 1) === '/' ? '' : '/') + encodeURIComponent(this.id);
    },

    // **parse** converts a response into the hash of attributes to be `set` on
    // the model. The default implementation is just to pass the response along.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new model with identical attributes to this one.
    clone: function() {
      return new this.constructor(this.attributes);
    },

    // A model is new if it has never been saved to the server, and lacks an id.
    isNew: function() {
      return this.id == null;
    },

    // Check if the model is currently in a valid state.
    isValid: function(options) {
      return this._validate({}, _.extend(options || {}, { validate: true }));
    },

    // Run validation against the next complete set of model attributes,
    // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
    _validate: function(attrs, options) {
      if (!options.validate || !this.validate) return true;
      attrs = _.extend({}, this.attributes, attrs);
      var error = this.validationError = this.validate(attrs, options) || null;
      if (!error) return true;
      this.trigger('invalid', this, error, _.extend(options, {validationError: error}));
      return false;
    }

  });

  // Underscore methods that we want to implement on the Model.
  var modelMethods = ['keys', 'values', 'pairs', 'invert', 'pick', 'omit'];

  // Mix in each Underscore method as a proxy to `Model#attributes`.
  _.each(modelMethods, function(method) {
    Model.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.attributes);
      return _[method].apply(_, args);
    };
  });

  // Backbone.Collection
  // -------------------

  // If models tend to represent a single row of data, a Backbone Collection is
  // more analagous to a table full of data ... or a small slice or page of that
  // table, or a collection of rows that belong together for a particular reason
  // -- all of the messages in this particular folder, all of the documents
  // belonging to this particular author, and so on. Collections maintain
  // indexes of their models, both in order, and for lookup by `id`.

  // Create a new **Collection**, perhaps to contain a specific type of `model`.
  // If a `comparator` is specified, the Collection will maintain
  // its models in sort order, as they're added and removed.
  var Collection = Backbone.Collection = function(models, options) {
    options || (options = {});
    if (options.model) this.model = options.model;
    if (options.comparator !== void 0) this.comparator = options.comparator;
    this._reset();
    this.initialize.apply(this, arguments);
    if (models) this.reset(models, _.extend({silent: true}, options));
  };

  // Default options for `Collection#set`.
  var setOptions = {add: true, remove: true, merge: true};
  var addOptions = {add: true, remove: false};

  // Define the Collection's inheritable methods.
  _.extend(Collection.prototype, Events, {

    // The default model for a collection is just a **Backbone.Model**.
    // This should be overridden in most cases.
    model: Model,

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // The JSON representation of a Collection is an array of the
    // models' attributes.
    toJSON: function(options) {
      return this.map(function(model){ return model.toJSON(options); });
    },

    // Proxy `Backbone.sync` by default.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Add a model, or list of models to the set.
    add: function(models, options) {
      return this.set(models, _.extend({merge: false}, options, addOptions));
    },

    // Remove a model, or a list of models from the set.
    remove: function(models, options) {
      var singular = !_.isArray(models);
      models = singular ? [models] : _.clone(models);
      options || (options = {});
      var i, l, index, model;
      for (i = 0, l = models.length; i < l; i++) {
        model = models[i] = this.get(models[i]);
        if (!model) continue;
        delete this._byId[model.id];
        delete this._byId[model.cid];
        index = this.indexOf(model);
        this.models.splice(index, 1);
        this.length--;
        if (!options.silent) {
          options.index = index;
          model.trigger('remove', model, this, options);
        }
        this._removeReference(model);
      }
      return singular ? models[0] : models;
    },

    // Update a collection by `set`-ing a new list of models, adding new ones,
    // removing models that are no longer present, and merging models that
    // already exist in the collection, as necessary. Similar to **Model#set**,
    // the core operation for updating the data contained by the collection.
    set: function(models, options) {
      options = _.defaults({}, options, setOptions);
      if (options.parse) models = this.parse(models, options);
      var singular = !_.isArray(models);
      models = singular ? (models ? [models] : []) : _.clone(models);
      var i, l, id, model, attrs, existing, sort;
      var at = options.at;
      var targetModel = this.model;
      var sortable = this.comparator && (at == null) && options.sort !== false;
      var sortAttr = _.isString(this.comparator) ? this.comparator : null;
      var toAdd = [], toRemove = [], modelMap = {};
      var add = options.add, merge = options.merge, remove = options.remove;
      var order = !sortable && add && remove ? [] : false;

      // Turn bare objects into model references, and prevent invalid models
      // from being added.
      for (i = 0, l = models.length; i < l; i++) {
        attrs = models[i];
        if (attrs instanceof Model) {
          id = model = attrs;
        } else {
          id = attrs[targetModel.prototype.idAttribute];
        }

        // If a duplicate is found, prevent it from being added and
        // optionally merge it into the existing model.
        if (existing = this.get(id)) {
          if (remove) modelMap[existing.cid] = true;
          if (merge) {
            attrs = attrs === model ? model.attributes : attrs;
            if (options.parse) attrs = existing.parse(attrs, options);
            existing.set(attrs, options);
            if (sortable && !sort && existing.hasChanged(sortAttr)) sort = true;
          }
          models[i] = existing;

        // If this is a new, valid model, push it to the `toAdd` list.
        } else if (add) {
          model = models[i] = this._prepareModel(attrs, options);
          if (!model) continue;
          toAdd.push(model);

          // Listen to added models' events, and index models for lookup by
          // `id` and by `cid`.
          model.on('all', this._onModelEvent, this);
          this._byId[model.cid] = model;
          if (model.id != null) this._byId[model.id] = model;
        }
        if (order) order.push(existing || model);
      }

      // Remove nonexistent models if appropriate.
      if (remove) {
        for (i = 0, l = this.length; i < l; ++i) {
          if (!modelMap[(model = this.models[i]).cid]) toRemove.push(model);
        }
        if (toRemove.length) this.remove(toRemove, options);
      }

      // See if sorting is needed, update `length` and splice in new models.
      if (toAdd.length || (order && order.length)) {
        if (sortable) sort = true;
        this.length += toAdd.length;
        if (at != null) {
          for (i = 0, l = toAdd.length; i < l; i++) {
            this.models.splice(at + i, 0, toAdd[i]);
          }
        } else {
          if (order) this.models.length = 0;
          var orderedModels = order || toAdd;
          for (i = 0, l = orderedModels.length; i < l; i++) {
            this.models.push(orderedModels[i]);
          }
        }
      }

      // Silently sort the collection if appropriate.
      if (sort) this.sort({silent: true});

      // Unless silenced, it's time to fire all appropriate add/sort events.
      if (!options.silent) {
        for (i = 0, l = toAdd.length; i < l; i++) {
          (model = toAdd[i]).trigger('add', model, this, options);
        }
        if (sort || (order && order.length)) this.trigger('sort', this, options);
      }
      
      // Return the added (or merged) model (or models).
      return singular ? models[0] : models;
    },

    // When you have more items than you want to add or remove individually,
    // you can reset the entire set with a new list of models, without firing
    // any granular `add` or `remove` events. Fires `reset` when finished.
    // Useful for bulk operations and optimizations.
    reset: function(models, options) {
      options || (options = {});
      for (var i = 0, l = this.models.length; i < l; i++) {
        this._removeReference(this.models[i]);
      }
      options.previousModels = this.models;
      this._reset();
      models = this.add(models, _.extend({silent: true}, options));
      if (!options.silent) this.trigger('reset', this, options);
      return models;
    },

    // Add a model to the end of the collection.
    push: function(model, options) {
      return this.add(model, _.extend({at: this.length}, options));
    },

    // Remove a model from the end of the collection.
    pop: function(options) {
      var model = this.at(this.length - 1);
      this.remove(model, options);
      return model;
    },

    // Add a model to the beginning of the collection.
    unshift: function(model, options) {
      return this.add(model, _.extend({at: 0}, options));
    },

    // Remove a model from the beginning of the collection.
    shift: function(options) {
      var model = this.at(0);
      this.remove(model, options);
      return model;
    },

    // Slice out a sub-array of models from the collection.
    slice: function() {
      return slice.apply(this.models, arguments);
    },

    // Get a model from the set by id.
    get: function(obj) {
      if (obj == null) return void 0;
      return this._byId[obj.id] || this._byId[obj.cid] || this._byId[obj];
    },

    // Get the model at the given index.
    at: function(index) {
      return this.models[index];
    },

    // Return models with matching attributes. Useful for simple cases of
    // `filter`.
    where: function(attrs, first) {
      if (_.isEmpty(attrs)) return first ? void 0 : [];
      return this[first ? 'find' : 'filter'](function(model) {
        for (var key in attrs) {
          if (attrs[key] !== model.get(key)) return false;
        }
        return true;
      });
    },

    // Return the first model with matching attributes. Useful for simple cases
    // of `find`.
    findWhere: function(attrs) {
      return this.where(attrs, true);
    },

    // Force the collection to re-sort itself. You don't need to call this under
    // normal circumstances, as the set will maintain sort order as each item
    // is added.
    sort: function(options) {
      if (!this.comparator) throw new Error('Cannot sort a set without a comparator');
      options || (options = {});

      // Run sort based on type of `comparator`.
      if (_.isString(this.comparator) || this.comparator.length === 1) {
        this.models = this.sortBy(this.comparator, this);
      } else {
        this.models.sort(_.bind(this.comparator, this));
      }

      if (!options.silent) this.trigger('sort', this, options);
      return this;
    },

    // Pluck an attribute from each model in the collection.
    pluck: function(attr) {
      return _.invoke(this.models, 'get', attr);
    },

    // Fetch the default set of models for this collection, resetting the
    // collection when they arrive. If `reset: true` is passed, the response
    // data will be passed through the `reset` method instead of `set`.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var success = options.success;
      var collection = this;
      options.success = function(resp) {
        var method = options.reset ? 'reset' : 'set';
        collection[method](resp, options);
        if (success) success(collection, resp, options);
        collection.trigger('sync', collection, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    },

    // Create a new instance of a model in this collection. Add the model to the
    // collection immediately, unless `wait: true` is passed, in which case we
    // wait for the server to agree.
    create: function(model, options) {
      options = options ? _.clone(options) : {};
      if (!(model = this._prepareModel(model, options))) return false;
      if (!options.wait) this.add(model, options);
      var collection = this;
      var success = options.success;
      options.success = function(model, resp, options) {
        if (options.wait) collection.add(model, options);
        if (success) success(model, resp, options);
      };
      model.save(null, options);
      return model;
    },

    // **parse** converts a response into a list of models to be added to the
    // collection. The default implementation is just to pass it through.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new collection with an identical list of models as this one.
    clone: function() {
      return new this.constructor(this.models);
    },

    // Private method to reset all internal state. Called when the collection
    // is first initialized or reset.
    _reset: function() {
      this.length = 0;
      this.models = [];
      this._byId  = {};
    },

    // Prepare a hash of attributes (or other model) to be added to this
    // collection.
    _prepareModel: function(attrs, options) {
      if (attrs instanceof Model) {
        if (!attrs.collection) attrs.collection = this;
        return attrs;
      }
      options = options ? _.clone(options) : {};
      options.collection = this;
      var model = new this.model(attrs, options);
      if (!model.validationError) return model;
      this.trigger('invalid', this, model.validationError, options);
      return false;
    },

    // Internal method to sever a model's ties to a collection.
    _removeReference: function(model) {
      if (this === model.collection) delete model.collection;
      model.off('all', this._onModelEvent, this);
    },

    // Internal method called every time a model in the set fires an event.
    // Sets need to update their indexes when models change ids. All other
    // events simply proxy through. "add" and "remove" events that originate
    // in other collections are ignored.
    _onModelEvent: function(event, model, collection, options) {
      if ((event === 'add' || event === 'remove') && collection !== this) return;
      if (event === 'destroy') this.remove(model, options);
      if (model && event === 'change:' + model.idAttribute) {
        delete this._byId[model.previous(model.idAttribute)];
        if (model.id != null) this._byId[model.id] = model;
      }
      this.trigger.apply(this, arguments);
    }

  });

  // Underscore methods that we want to implement on the Collection.
  // 90% of the core usefulness of Backbone Collections is actually implemented
  // right here:
  var methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
    'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
    'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
    'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
    'tail', 'drop', 'last', 'without', 'difference', 'indexOf', 'shuffle',
    'lastIndexOf', 'isEmpty', 'chain'];

  // Mix in each Underscore method as a proxy to `Collection#models`.
  _.each(methods, function(method) {
    Collection.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.models);
      return _[method].apply(_, args);
    };
  });

  // Underscore methods that take a property name as an argument.
  var attributeMethods = ['groupBy', 'countBy', 'sortBy'];

  // Use attributes instead of properties.
  _.each(attributeMethods, function(method) {
    Collection.prototype[method] = function(value, context) {
      var iterator = _.isFunction(value) ? value : function(model) {
        return model.get(value);
      };
      return _[method](this.models, iterator, context);
    };
  });

  // Backbone.View
  // -------------

  // Backbone Views are almost more convention than they are actual code. A View
  // is simply a JavaScript object that represents a logical chunk of UI in the
  // DOM. This might be a single item, an entire list, a sidebar or panel, or
  // even the surrounding frame which wraps your whole app. Defining a chunk of
  // UI as a **View** allows you to define your DOM events declaratively, without
  // having to worry about render order ... and makes it easy for the view to
  // react to specific changes in the state of your models.

  // Creating a Backbone.View creates its initial element outside of the DOM,
  // if an existing element is not provided...
  var View = Backbone.View = function(options) {
    this.cid = _.uniqueId('view');
    options || (options = {});
    _.extend(this, _.pick(options, viewOptions));
    this._ensureElement();
    this.initialize.apply(this, arguments);
    this.delegateEvents();
  };

  // Cached regex to split keys for `delegate`.
  var delegateEventSplitter = /^(\S+)\s*(.*)$/;

  // List of view options to be merged as properties.
  var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

  // Set up all inheritable **Backbone.View** properties and methods.
  _.extend(View.prototype, Events, {

    // The default `tagName` of a View's element is `"div"`.
    tagName: 'div',

    // jQuery delegate for element lookup, scoped to DOM elements within the
    // current view. This should be preferred to global lookups where possible.
    $: function(selector) {
      return this.$el.find(selector);
    },

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // **render** is the core function that your view should override, in order
    // to populate its element (`this.el`), with the appropriate HTML. The
    // convention is for **render** to always return `this`.
    render: function() {
      return this;
    },

    // Remove this view by taking the element out of the DOM, and removing any
    // applicable Backbone.Events listeners.
    remove: function() {
      this.$el.remove();
      this.stopListening();
      return this;
    },

    // Change the view's element (`this.el` property), including event
    // re-delegation.
    setElement: function(element, delegate) {
      if (this.$el) this.undelegateEvents();
      this.$el = element instanceof Backbone.$ ? element : Backbone.$(element);
      this.el = this.$el[0];
      if (delegate !== false) this.delegateEvents();
      return this;
    },

    // Set callbacks, where `this.events` is a hash of
    //
    // *{"event selector": "callback"}*
    //
    //     {
    //       'mousedown .title':  'edit',
    //       'click .button':     'save',
    //       'click .open':       function(e) { ... }
    //     }
    //
    // pairs. Callbacks will be bound to the view, with `this` set properly.
    // Uses event delegation for efficiency.
    // Omitting the selector binds the event to `this.el`.
    // This only works for delegate-able events: not `focus`, `blur`, and
    // not `change`, `submit`, and `reset` in Internet Explorer.
    delegateEvents: function(events) {
      if (!(events || (events = _.result(this, 'events')))) return this;
      this.undelegateEvents();
      for (var key in events) {
        var method = events[key];
        if (!_.isFunction(method)) method = this[events[key]];
        if (!method) continue;

        var match = key.match(delegateEventSplitter);
        var eventName = match[1], selector = match[2];
        method = _.bind(method, this);
        eventName += '.delegateEvents' + this.cid;
        if (selector === '') {
          this.$el.on(eventName, method);
        } else {
          this.$el.on(eventName, selector, method);
        }
      }
      return this;
    },

    // Clears all callbacks previously bound to the view with `delegateEvents`.
    // You usually don't need to use this, but may wish to if you have multiple
    // Backbone views attached to the same DOM element.
    undelegateEvents: function() {
      this.$el.off('.delegateEvents' + this.cid);
      return this;
    },

    // Ensure that the View has a DOM element to render into.
    // If `this.el` is a string, pass it through `$()`, take the first
    // matching element, and re-assign it to `el`. Otherwise, create
    // an element from the `id`, `className` and `tagName` properties.
    _ensureElement: function() {
      if (!this.el) {
        var attrs = _.extend({}, _.result(this, 'attributes'));
        if (this.id) attrs.id = _.result(this, 'id');
        if (this.className) attrs['class'] = _.result(this, 'className');
        var $el = Backbone.$('<' + _.result(this, 'tagName') + '>').attr(attrs);
        this.setElement($el, false);
      } else {
        this.setElement(_.result(this, 'el'), false);
      }
    }

  });

  // Backbone.sync
  // -------------

  // Override this function to change the manner in which Backbone persists
  // models to the server. You will be passed the type of request, and the
  // model in question. By default, makes a RESTful Ajax request
  // to the model's `url()`. Some possible customizations could be:
  //
  // * Use `setTimeout` to batch rapid-fire updates into a single request.
  // * Send up the models as XML instead of JSON.
  // * Persist models via WebSockets instead of Ajax.
  //
  // Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
  // as `POST`, with a `_method` parameter containing the true HTTP method,
  // as well as all requests with the body as `application/x-www-form-urlencoded`
  // instead of `application/json` with the model in a param named `model`.
  // Useful when interfacing with server-side languages like **PHP** that make
  // it difficult to read the body of `PUT` requests.
  Backbone.sync = function(method, model, options) {
    var type = methodMap[method];

    // Default options, unless specified.
    _.defaults(options || (options = {}), {
      emulateHTTP: Backbone.emulateHTTP,
      emulateJSON: Backbone.emulateJSON
    });

    // Default JSON-request options.
    var params = {type: type, dataType: 'json'};

    // Ensure that we have a URL.
    if (!options.url) {
      params.url = _.result(model, 'url') || urlError();
    }

    // Ensure that we have the appropriate request data.
    if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {
      params.contentType = 'application/json';
      params.data = JSON.stringify(options.attrs || model.toJSON(options));
    }

    // For older servers, emulate JSON by encoding the request into an HTML-form.
    if (options.emulateJSON) {
      params.contentType = 'application/x-www-form-urlencoded';
      params.data = params.data ? {model: params.data} : {};
    }

    // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
    // And an `X-HTTP-Method-Override` header.
    if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
      params.type = 'POST';
      if (options.emulateJSON) params.data._method = type;
      var beforeSend = options.beforeSend;
      options.beforeSend = function(xhr) {
        xhr.setRequestHeader('X-HTTP-Method-Override', type);
        if (beforeSend) return beforeSend.apply(this, arguments);
      };
    }

    // Don't process data on a non-GET request.
    if (params.type !== 'GET' && !options.emulateJSON) {
      params.processData = false;
    }

    // If we're sending a `PATCH` request, and we're in an old Internet Explorer
    // that still has ActiveX enabled by default, override jQuery to use that
    // for XHR instead. Remove this line when jQuery supports `PATCH` on IE8.
    if (params.type === 'PATCH' && noXhrPatch) {
      params.xhr = function() {
        return new ActiveXObject("Microsoft.XMLHTTP");
      };
    }

    // Make the request, allowing the user to override any Ajax options.
    var xhr = options.xhr = Backbone.ajax(_.extend(params, options));
    model.trigger('request', model, xhr, options);
    return xhr;
  };

  var noXhrPatch = typeof window !== 'undefined' && !!window.ActiveXObject && !(window.XMLHttpRequest && (new XMLHttpRequest).dispatchEvent);

  // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
  var methodMap = {
    'create': 'POST',
    'update': 'PUT',
    'patch':  'PATCH',
    'delete': 'DELETE',
    'read':   'GET'
  };

  // Set the default implementation of `Backbone.ajax` to proxy through to `$`.
  // Override this if you'd like to use a different library.
  Backbone.ajax = function() {
    return Backbone.$.ajax.apply(Backbone.$, arguments);
  };

  // Backbone.Router
  // ---------------

  // Routers map faux-URLs to actions, and fire events when routes are
  // matched. Creating a new one sets its `routes` hash, if not set statically.
  var Router = Backbone.Router = function(options) {
    options || (options = {});
    if (options.routes) this.routes = options.routes;
    this._bindRoutes();
    this.initialize.apply(this, arguments);
  };

  // Cached regular expressions for matching named param parts and splatted
  // parts of route strings.
  var optionalParam = /\((.*?)\)/g;
  var namedParam    = /(\(\?)?:\w+/g;
  var splatParam    = /\*\w+/g;
  var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

  // Set up all inheritable **Backbone.Router** properties and methods.
  _.extend(Router.prototype, Events, {

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Manually bind a single named route to a callback. For example:
    //
    //     this.route('search/:query/p:num', 'search', function(query, num) {
    //       ...
    //     });
    //
    route: function(route, name, callback) {
      if (!_.isRegExp(route)) route = this._routeToRegExp(route);
      if (_.isFunction(name)) {
        callback = name;
        name = '';
      }
      if (!callback) callback = this[name];
      var router = this;
      Backbone.history.route(route, function(fragment) {
        var args = router._extractParameters(route, fragment);
        callback && callback.apply(router, args);
        router.trigger.apply(router, ['route:' + name].concat(args));
        router.trigger('route', name, args);
        Backbone.history.trigger('route', router, name, args);
      });
      return this;
    },

    // Simple proxy to `Backbone.history` to save a fragment into the history.
    navigate: function(fragment, options) {
      Backbone.history.navigate(fragment, options);
      return this;
    },

    // Bind all defined routes to `Backbone.history`. We have to reverse the
    // order of the routes here to support behavior where the most general
    // routes can be defined at the bottom of the route map.
    _bindRoutes: function() {
      if (!this.routes) return;
      this.routes = _.result(this, 'routes');
      var route, routes = _.keys(this.routes);
      while ((route = routes.pop()) != null) {
        this.route(route, this.routes[route]);
      }
    },

    // Convert a route string into a regular expression, suitable for matching
    // against the current location hash.
    _routeToRegExp: function(route) {
      route = route.replace(escapeRegExp, '\\$&')
                   .replace(optionalParam, '(?:$1)?')
                   .replace(namedParam, function(match, optional) {
                     return optional ? match : '([^\/]+)';
                   })
                   .replace(splatParam, '(.*?)');
      return new RegExp('^' + route + '$');
    },

    // Given a route, and a URL fragment that it matches, return the array of
    // extracted decoded parameters. Empty or unmatched parameters will be
    // treated as `null` to normalize cross-browser behavior.
    _extractParameters: function(route, fragment) {
      var params = route.exec(fragment).slice(1);
      return _.map(params, function(param) {
        return param ? decodeURIComponent(param) : null;
      });
    }

  });

  // Backbone.History
  // ----------------

  // Handles cross-browser history management, based on either
  // [pushState](http://diveintohtml5.info/history.html) and real URLs, or
  // [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
  // and URL fragments. If the browser supports neither (old IE, natch),
  // falls back to polling.
  var History = Backbone.History = function() {
    this.handlers = [];
    _.bindAll(this, 'checkUrl');

    // Ensure that `History` can be used outside of the browser.
    if (typeof window !== 'undefined') {
      this.location = window.location;
      this.history = window.history;
    }
  };

  // Cached regex for stripping a leading hash/slash and trailing space.
  var routeStripper = /^[#\/]|\s+$/g;

  // Cached regex for stripping leading and trailing slashes.
  var rootStripper = /^\/+|\/+$/g;

  // Cached regex for detecting MSIE.
  var isExplorer = /msie [\w.]+/;

  // Cached regex for removing a trailing slash.
  var trailingSlash = /\/$/;

  // Cached regex for stripping urls of hash and query.
  var pathStripper = /[?#].*$/;

  // Has the history handling already been started?
  History.started = false;

  // Set up all inheritable **Backbone.History** properties and methods.
  _.extend(History.prototype, Events, {

    // The default interval to poll for hash changes, if necessary, is
    // twenty times a second.
    interval: 50,

    // Gets the true hash value. Cannot use location.hash directly due to bug
    // in Firefox where location.hash will always be decoded.
    getHash: function(window) {
      var match = (window || this).location.href.match(/#(.*)$/);
      return match ? match[1] : '';
    },

    // Get the cross-browser normalized URL fragment, either from the URL,
    // the hash, or the override.
    getFragment: function(fragment, forcePushState) {
      if (fragment == null) {
        if (this._hasPushState || !this._wantsHashChange || forcePushState) {
          fragment = this.location.pathname;
          var root = this.root.replace(trailingSlash, '');
          if (!fragment.indexOf(root)) fragment = fragment.slice(root.length);
        } else {
          fragment = this.getHash();
        }
      }
      return fragment.replace(routeStripper, '');
    },

    // Start the hash change handling, returning `true` if the current URL matches
    // an existing route, and `false` otherwise.
    start: function(options) {
      if (History.started) throw new Error("Backbone.history has already been started");
      History.started = true;

      // Figure out the initial configuration. Do we need an iframe?
      // Is pushState desired ... is it available?
      this.options          = _.extend({root: '/'}, this.options, options);
      this.root             = this.options.root;
      this._wantsHashChange = this.options.hashChange !== false;
      this._wantsPushState  = !!this.options.pushState;
      this._hasPushState    = !!(this.options.pushState && this.history && this.history.pushState);
      var fragment          = this.getFragment();
      var docMode           = document.documentMode;
      var oldIE             = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));

      // Normalize root to always include a leading and trailing slash.
      this.root = ('/' + this.root + '/').replace(rootStripper, '/');

      if (oldIE && this._wantsHashChange) {
        this.iframe = Backbone.$('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo('body')[0].contentWindow;
        this.navigate(fragment);
      }

      // Depending on whether we're using pushState or hashes, and whether
      // 'onhashchange' is supported, determine how we check the URL state.
      if (this._hasPushState) {
        Backbone.$(window).on('popstate', this.checkUrl);
      } else if (this._wantsHashChange && ('onhashchange' in window) && !oldIE) {
        Backbone.$(window).on('hashchange', this.checkUrl);
      } else if (this._wantsHashChange) {
        this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
      }

      // Determine if we need to change the base url, for a pushState link
      // opened by a non-pushState browser.
      this.fragment = fragment;
      var loc = this.location;
      var atRoot = loc.pathname.replace(/[^\/]$/, '$&/') === this.root;

      // Transition from hashChange to pushState or vice versa if both are
      // requested.
      if (this._wantsHashChange && this._wantsPushState) {

        // If we've started off with a route from a `pushState`-enabled
        // browser, but we're currently in a browser that doesn't support it...
        if (!this._hasPushState && !atRoot) {
          this.fragment = this.getFragment(null, true);
          this.location.replace(this.root + this.location.search + '#' + this.fragment);
          // Return immediately as browser will do redirect to new url
          return true;

        // Or if we've started out with a hash-based route, but we're currently
        // in a browser where it could be `pushState`-based instead...
        } else if (this._hasPushState && atRoot && loc.hash) {
          this.fragment = this.getHash().replace(routeStripper, '');
          this.history.replaceState({}, document.title, this.root + this.fragment + loc.search);
        }

      }

      if (!this.options.silent) return this.loadUrl();
    },

    // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
    // but possibly useful for unit testing Routers.
    stop: function() {
      Backbone.$(window).off('popstate', this.checkUrl).off('hashchange', this.checkUrl);
      clearInterval(this._checkUrlInterval);
      History.started = false;
    },

    // Add a route to be tested when the fragment changes. Routes added later
    // may override previous routes.
    route: function(route, callback) {
      this.handlers.unshift({route: route, callback: callback});
    },

    // Checks the current URL to see if it has changed, and if it has,
    // calls `loadUrl`, normalizing across the hidden iframe.
    checkUrl: function(e) {
      var current = this.getFragment();
      if (current === this.fragment && this.iframe) {
        current = this.getFragment(this.getHash(this.iframe));
      }
      if (current === this.fragment) return false;
      if (this.iframe) this.navigate(current);
      this.loadUrl();
    },

    // Attempt to load the current URL fragment. If a route succeeds with a
    // match, returns `true`. If no defined routes matches the fragment,
    // returns `false`.
    loadUrl: function(fragment) {
      fragment = this.fragment = this.getFragment(fragment);
      return _.any(this.handlers, function(handler) {
        if (handler.route.test(fragment)) {
          handler.callback(fragment);
          return true;
        }
      });
    },

    // Save a fragment into the hash history, or replace the URL state if the
    // 'replace' option is passed. You are responsible for properly URL-encoding
    // the fragment in advance.
    //
    // The options object can contain `trigger: true` if you wish to have the
    // route callback be fired (not usually desirable), or `replace: true`, if
    // you wish to modify the current URL without adding an entry to the history.
    navigate: function(fragment, options) {
      if (!History.started) return false;
      if (!options || options === true) options = {trigger: !!options};

      var url = this.root + (fragment = this.getFragment(fragment || ''));

      // Strip the fragment of the query and hash for matching.
      fragment = fragment.replace(pathStripper, '');

      if (this.fragment === fragment) return;
      this.fragment = fragment;

      // Don't include a trailing slash on the root.
      if (fragment === '' && url !== '/') url = url.slice(0, -1);

      // If pushState is available, we use it to set the fragment as a real URL.
      if (this._hasPushState) {
        this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

      // If hash changes haven't been explicitly disabled, update the hash
      // fragment to store history.
      } else if (this._wantsHashChange) {
        this._updateHash(this.location, fragment, options.replace);
        if (this.iframe && (fragment !== this.getFragment(this.getHash(this.iframe)))) {
          // Opening and closing the iframe tricks IE7 and earlier to push a
          // history entry on hash-tag change.  When replace is true, we don't
          // want this.
          if(!options.replace) this.iframe.document.open().close();
          this._updateHash(this.iframe.location, fragment, options.replace);
        }

      // If you've told us that you explicitly don't want fallback hashchange-
      // based history, then `navigate` becomes a page refresh.
      } else {
        return this.location.assign(url);
      }
      if (options.trigger) return this.loadUrl(fragment);
    },

    // Update the hash location, either replacing the current entry, or adding
    // a new one to the browser history.
    _updateHash: function(location, fragment, replace) {
      if (replace) {
        var href = location.href.replace(/(javascript:|#).*$/, '');
        location.replace(href + '#' + fragment);
      } else {
        // Some browsers require that `hash` contains a leading #.
        location.hash = '#' + fragment;
      }
    }

  });

  // Create the default Backbone.history.
  Backbone.history = new History;

  // Helpers
  // -------

  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  var extend = function(protoProps, staticProps) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
  };

  // Set up inheritance for the model, collection, router, view and history.
  Model.extend = Collection.extend = Router.extend = View.extend = History.extend = extend;

  // Throw an error when a URL is needed, and none is supplied.
  var urlError = function() {
    throw new Error('A "url" property or function must be specified');
  };

  // Wrap an optional error callback with a fallback error event.
  var wrapError = function(model, options) {
    var error = options.error;
    options.error = function(resp) {
      if (error) error(model, resp, options);
      model.trigger('error', model, resp, options);
    };
  };

  return Backbone;
}));

(function() {
  define('common/build_views',["underscore"], function(_) {
    var build_views;
    return build_views = function(view_storage, view_models, options, view_types) {
      var created_views, error, i_model, key, model, newmodels, to_remove, view_specific_option, _i, _j, _len, _len1;
      if (view_types == null) {
        view_types = [];
      }
      
      created_views = [];
      try {
        newmodels = _.filter(view_models, function(x) {
          return !_.has(view_storage, x.id);
        });
      } catch (_error) {
        error = _error;
        debugger;
        console.log(error);
        throw error;
      }
      for (i_model = _i = 0, _len = newmodels.length; _i < _len; i_model = ++_i) {
        model = newmodels[i_model];
        view_specific_option = _.extend({}, options, {
          'model': model
        });
        try {
          if (i_model < view_types.length) {
            view_storage[model.id] = new view_types[i_model](view_specific_option);
          } else {
            view_storage[model.id] = new model.default_view(view_specific_option);
          }
        } catch (_error) {
          error = _error;
          console.log("error on model of", model, error);
          throw error;
        }
        created_views.push(view_storage[model.id]);
      }
      to_remove = _.difference(_.keys(view_storage), _.pluck(view_models, 'id'));
      for (_j = 0, _len1 = to_remove.length; _j < _len1; _j++) {
        key = to_remove[_j];
        view_storage[key].remove();
        delete view_storage[key];
      }
      return created_views;
    };
  });

}).call(this);

/*
//@ sourceMappingURL=build_views.js.map
*/;
(function() {
  define('common/safebind',["underscore"], function(_) {
    var safebind;
    return safebind = function(binder, target, event, callback) {
      var error,
        _this = this;
      if (!_.has(binder, 'eventers')) {
        binder['eventers'] = {};
      }
      try {
        binder['eventers'][target.id] = target;
      } catch (_error) {
        error = _error;
      }
      if (target != null) {
        target.on(event, callback, binder);
        target.on('destroy remove', function() {
          return delete binder['eventers'][target];
        }, binder);
      } else {
        debugger;
        console.log("error with binder", binder, event);
      }
      return null;
    };
  });

}).call(this);

/*
//@ sourceMappingURL=safebind.js.map
*/;
(function() {
  define('common/load_models',["require", "./base"], function(require, base) {
    var load_models;
    return load_models = function(modelspecs) {
      var Collections, attrs, coll, coll_attrs, model, newspecs, oldspecs, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m;
      newspecs = [];
      oldspecs = [];
      Collections = require("./base").Collections;
      for (_i = 0, _len = modelspecs.length; _i < _len; _i++) {
        model = modelspecs[_i];
        coll = Collections(model['type']);
        attrs = model['attributes'];
        if (coll && coll.get(attrs['id'])) {
          oldspecs.push([coll, attrs]);
        } else {
          newspecs.push([coll, attrs]);
        }
      }
      for (_j = 0, _len1 = newspecs.length; _j < _len1; _j++) {
        coll_attrs = newspecs[_j];
        coll = coll_attrs[0], attrs = coll_attrs[1];
        if (coll) {
          coll.add(attrs, {
            'silent': true
          });
        }
      }
      for (_k = 0, _len2 = newspecs.length; _k < _len2; _k++) {
        coll_attrs = newspecs[_k];
        coll = coll_attrs[0], attrs = coll_attrs[1];
        if (coll) {
          coll.get(attrs['id']).dinitialize(attrs);
        }
      }
      for (_l = 0, _len3 = newspecs.length; _l < _len3; _l++) {
        coll_attrs = newspecs[_l];
        coll = coll_attrs[0], attrs = coll_attrs[1];
        if (coll) {
          model = coll.get(attrs.id);
          model.trigger('add', model, coll, {});
        }
      }
      for (_m = 0, _len4 = oldspecs.length; _m < _len4; _m++) {
        coll_attrs = oldspecs[_m];
        coll = coll_attrs[0], attrs = coll_attrs[1];
        if (coll) {
          coll.get(attrs['id']).set(attrs);
        }
      }
      return null;
    };
  });

}).call(this);

/*
//@ sourceMappingURL=load_models.js.map
*/;
(function() {
  define('common/bulk_save',["underscore", "jquery", "require", "./base", "./load_models"], function(_, $, require, base, load_models) {
    var bulk_save;
    return bulk_save = function(models) {
      var Config, doc, jsondata, m, url, xhr;
      Config = require("./base").Config;
      doc = models[0].get('doc');
      jsondata = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = models.length; _i < _len; _i++) {
          m = models[_i];
          _results.push({
            type: m.type,
            attributes: _.clone(m.attributes)
          });
        }
        return _results;
      })();
      jsondata = JSON.stringify(jsondata);
      url = Config.prefix + "/bokeh/bb/" + doc + "/bulkupsert";
      xhr = $.ajax({
        type: 'POST',
        url: url,
        contentType: "application/json",
        data: jsondata,
        header: {
          client: "javascript"
        }
      });
      xhr.done(function(data) {
        return load_models(data.modelspecs);
      });
      return xhr;
    };
  });

}).call(this);

/*
//@ sourceMappingURL=bulk_save.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('common/continuum_view',["underscore", "backbone"], function(_, Backbone) {
    var ContinuumView, _ref;
    ContinuumView = (function(_super) {
      __extends(ContinuumView, _super);

      function ContinuumView() {
        _ref = ContinuumView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      ContinuumView.prototype.initialize = function(options) {
        if (!_.has(options, 'id')) {
          return this.id = _.uniqueId('ContinuumView');
        }
      };

      ContinuumView.prototype.bind_bokeh_events = function() {
        return 'pass';
      };

      ContinuumView.prototype.delegateEvents = function(events) {
        return ContinuumView.__super__.delegateEvents.call(this, events);
      };

      ContinuumView.prototype.remove = function() {
        var target, val, _ref1;
        if (_.has(this, 'eventers')) {
          _ref1 = this.eventers;
          for (target in _ref1) {
            if (!__hasProp.call(_ref1, target)) continue;
            val = _ref1[target];
            val.off(null, null, this);
          }
        }
        this.trigger('remove');
        return ContinuumView.__super__.remove.call(this);
      };

      ContinuumView.prototype.mget = function() {
        return this.model.get.apply(this.model, arguments);
      };

      ContinuumView.prototype.mset = function() {
        return this.model.set.apply(this.model, arguments);
      };

      ContinuumView.prototype.mget_obj = function(fld) {
        return this.model.get_obj(fld);
      };

      ContinuumView.prototype.render_end = function() {
        return "pass";
      };

      return ContinuumView;

    })(Backbone.View);
    return {
      "View": ContinuumView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=continuum_view.js.map
*/;
(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('common/has_properties',["underscore", "backbone", "require", "./base", "./safebind"], function(_, Backbone, require, base, safebind) {
    var HasProperties, _ref;
    return HasProperties = (function(_super) {
      __extends(HasProperties, _super);

      function HasProperties() {
        this.rpc = __bind(this.rpc, this);
        this.get_obj = __bind(this.get_obj, this);
        this.resolve_ref = __bind(this.resolve_ref, this);
        this.convert_to_ref = __bind(this.convert_to_ref, this);
        _ref = HasProperties.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      HasProperties.prototype.destroy = function(options) {
        var target, val, _ref1, _results;
        HasProperties.__super__.destroy.call(this, options);
        if (_.has(this, 'eventers')) {
          _ref1 = this.eventers;
          _results = [];
          for (target in _ref1) {
            if (!__hasProp.call(_ref1, target)) continue;
            val = _ref1[target];
            _results.push(val.off(null, null, this));
          }
          return _results;
        }
      };

      HasProperties.prototype.isNew = function() {
        return false;
      };

      HasProperties.prototype.initialize = function(attrs, options) {
        var _this = this;
        if (!attrs) {
          attrs = {};
        }
        if (!options) {
          options = {};
        }
        HasProperties.__super__.initialize.call(this, attrs, options);
        this._base = false;
        this.properties = {};
        this.property_cache = {};
        if (!_.has(attrs, this.idAttribute)) {
          this.id = _.uniqueId(this.type);
          this.attributes[this.idAttribute] = this.id;
        }
        return _.defer(function() {
          if (!_this.inited) {
            return _this.dinitialize(attrs, options);
          }
        });
      };

      HasProperties.prototype.dinitialize = function(attrs, options) {
        return this.inited = true;
      };

      HasProperties.prototype.set_obj = function(key, value, options) {
        var attrs, val;
        if (_.isObject(key) || key === null) {
          attrs = key;
          options = value;
        } else {
          attrs = {};
          attrs[key] = value;
        }
        for (key in attrs) {
          if (!__hasProp.call(attrs, key)) continue;
          val = attrs[key];
          attrs[key] = this.convert_to_ref(val);
        }
        return this.set(attrs, options);
      };

      HasProperties.prototype.set = function(key, value, options) {
        var attrs, toremove, val, _i, _len;
        if (_.isObject(key) || key === null) {
          attrs = key;
          options = value;
        } else {
          attrs = {};
          attrs[key] = value;
        }
        toremove = [];
        for (key in attrs) {
          if (!__hasProp.call(attrs, key)) continue;
          val = attrs[key];
          if (_.has(this, 'properties') && _.has(this.properties, key) && this.properties[key]['setter']) {
            this.properties[key]['setter'].call(this, val);
            toremove.push(key);
          }
        }
        for (_i = 0, _len = toremove.length; _i < _len; _i++) {
          key = toremove[_i];
          delete attrs[key];
        }
        if (!_.isEmpty(attrs)) {
          return HasProperties.__super__.set.call(this, attrs, options);
        }
      };

      HasProperties.prototype.convert_to_ref = function(value) {
        if (_.isArray(value)) {
          return _.map(value, this.convert_to_ref);
        } else {
          if (value instanceof HasProperties) {
            return value.ref();
          }
        }
      };

      HasProperties.prototype.add_dependencies = function(prop_name, object, fields) {
        var fld, prop_spec, _i, _len, _results;
        if (!_.isArray(fields)) {
          fields = [fields];
        }
        prop_spec = this.properties[prop_name];
        prop_spec.dependencies = prop_spec.dependencies.concat({
          obj: object,
          fields: fields
        });
        _results = [];
        for (_i = 0, _len = fields.length; _i < _len; _i++) {
          fld = fields[_i];
          _results.push(safebind(this, object, "change:" + fld, prop_spec['callbacks']['changedep']));
        }
        return _results;
      };

      HasProperties.prototype.register_setter = function(prop_name, setter) {
        var prop_spec;
        prop_spec = this.properties[prop_name];
        return prop_spec.setter = setter;
      };

      HasProperties.prototype.register_property = function(prop_name, getter, use_cache) {
        var changedep, prop_spec, propchange,
          _this = this;
        if (_.isUndefined(use_cache)) {
          use_cache = true;
        }
        if (_.has(this.properties, prop_name)) {
          this.remove_property(prop_name);
        }
        changedep = function() {
          return _this.trigger('changedep:' + prop_name);
        };
        propchange = function() {
          var firechange, new_val, old_val;
          firechange = true;
          if (prop_spec['use_cache']) {
            old_val = _this.get_cache(prop_name);
            _this.clear_cache(prop_name);
            new_val = _this.get(prop_name);
            firechange = new_val !== old_val;
          }
          if (firechange) {
            _this.trigger('change:' + prop_name, _this, _this.get(prop_name));
            return _this.trigger('change', _this);
          }
        };
        prop_spec = {
          'getter': getter,
          'dependencies': [],
          'use_cache': use_cache,
          'setter': null,
          'callbacks': {
            changedep: changedep,
            propchange: propchange
          }
        };
        this.properties[prop_name] = prop_spec;
        safebind(this, this, "changedep:" + prop_name, prop_spec['callbacks']['propchange']);
        return prop_spec;
      };

      HasProperties.prototype.remove_property = function(prop_name) {
        var dep, dependencies, fld, obj, prop_spec, _i, _j, _len, _len1, _ref1;
        prop_spec = this.properties[prop_name];
        dependencies = prop_spec.dependencies;
        for (_i = 0, _len = dependencies.length; _i < _len; _i++) {
          dep = dependencies[_i];
          obj = dep.obj;
          _ref1 = dep['fields'];
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            fld = _ref1[_j];
            obj.off('change:' + fld, prop_spec['callbacks']['changedep'], this);
          }
        }
        this.off("changedep:" + dep);
        delete this.properties[prop_name];
        if (prop_spec.use_cache) {
          return this.clear_cache(prop_name);
        }
      };

      HasProperties.prototype.has_cache = function(prop_name) {
        return _.has(this.property_cache, prop_name);
      };

      HasProperties.prototype.add_cache = function(prop_name, val) {
        return this.property_cache[prop_name] = val;
      };

      HasProperties.prototype.clear_cache = function(prop_name, val) {
        return delete this.property_cache[prop_name];
      };

      HasProperties.prototype.get_cache = function(prop_name) {
        return this.property_cache[prop_name];
      };

      HasProperties.prototype.get = function(prop_name) {
        var computed, getter, prop_spec;
        if (_.has(this.properties, prop_name)) {
          prop_spec = this.properties[prop_name];
          if (prop_spec.use_cache && this.has_cache(prop_name)) {
            return this.property_cache[prop_name];
          } else {
            getter = prop_spec.getter;
            computed = getter.apply(this);
            if (this.properties[prop_name].use_cache) {
              this.add_cache(prop_name, computed);
            }
            return computed;
          }
        } else {
          return HasProperties.__super__.get.call(this, prop_name);
        }
      };

      HasProperties.prototype.ref = function() {
        return {
          'type': this.type,
          'id': this.id
        };
      };

      HasProperties.prototype.resolve_ref = function(ref) {
        if (_.isArray(ref)) {
          return _.map(ref, this.resolve_ref);
        }
        if (!ref) {
          console.log('ERROR, null reference');
        }
        if (ref['type'] === this.type && ref['id'] === this.id) {
          return this;
        } else {
          return this.base().Collections(ref['type']).get(ref['id']);
        }
      };

      HasProperties.prototype.get_obj = function(ref_name) {
        var ref;
        ref = this.get(ref_name);
        if (ref) {
          return this.resolve_ref(ref);
        }
      };

      HasProperties.prototype.base = function() {
        if (!this._base) {
          this._base = require('./base');
        }
        return this._base;
      };

      HasProperties.prototype.url = function() {
        var url;
        url = this.base().Config.prefix + "/bokeh/bb/" + this.get('doc') + "/" + this.type + "/";
        if (this.isNew()) {
          return url;
        }
        return url + this.get('id') + "/";
      };

      HasProperties.prototype.sync = function(method, model, options) {
        return options.success(model, null, {});
      };

      HasProperties.prototype.defaults = function() {
        return {};
      };

      HasProperties.prototype.rpc = function(funcname, args, kwargs) {
        var data, docid, id, prefix, resp, type, url;
        prefix = base.Config.prefix;
        docid = this.get('doc');
        id = this.get('id');
        type = this.type;
        url = "" + prefix + "/bokeh/bb/rpc/" + docid + "/" + type + "/" + id + "/" + funcname + "/";
        data = {
          args: args,
          kwargs: kwargs
        };
        resp = $.ajax({
          type: 'POST',
          url: url,
          data: JSON.stringify(data),
          contentType: 'application/json',
          xhrFields: {
            withCredentials: true
          }
        });
        return resp;
      };

      return HasProperties;

    })(Backbone.Model);
  });

}).call(this);

/*
//@ sourceMappingURL=has_properties.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('common/has_parent',["underscore", "./has_properties"], function(_, HasProperties) {
    var HasParent, _ref;
    HasParent = (function(_super) {
      __extends(HasParent, _super);

      function HasParent() {
        _ref = HasParent.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      HasParent.prototype.get_fallback = function(attr) {
        if (this.get_obj('parent') && _.indexOf(this.get_obj('parent').parent_properties, attr) >= 0 && !_.isUndefined(this.get_obj('parent').get(attr))) {
          return this.get_obj('parent').get(attr);
        } else {
          if (_.isFunction(this.display_defaults)) {
            return this.display_defaults()[attr];
          }
          return this.display_defaults[attr];
        }
      };

      HasParent.prototype.get = function(attr) {
        var normalval;
        normalval = HasParent.__super__.get.call(this, attr);
        if (!_.isUndefined(normalval)) {
          return normalval;
        } else if (!(attr === 'parent')) {
          return this.get_fallback(attr);
        }
      };

      HasParent.prototype.display_defaults = {};

      return HasParent;

    })(HasProperties);
    return HasParent;
  });

}).call(this);

/*
//@ sourceMappingURL=has_parent.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('range/range1d',["underscore", "backbone", "common/has_properties"], function(_, Backbone, HasProperties) {
    var Range1d, Range1ds, _ref, _ref1;
    Range1d = (function(_super) {
      __extends(Range1d, _super);

      function Range1d() {
        _ref = Range1d.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      Range1d.prototype.type = 'Range1d';

      Range1d.prototype.initialize = function(attrs, options) {
        Range1d.__super__.initialize.call(this, attrs, options);
        this.register_property('min', function() {
          return Math.min(this.get('start'), this.get('end'));
        }, true);
        this.add_dependencies('min', this, ['start', 'end']);
        this.register_property('max', function() {
          return Math.max(this.get('start'), this.get('end'));
        }, true);
        return this.add_dependencies('max', this, ['start', 'end']);
      };

      Range1d.prototype.defaults = function() {
        return {
          start: 0,
          end: 1
        };
      };

      return Range1d;

    })(HasProperties);
    Range1ds = (function(_super) {
      __extends(Range1ds, _super);

      function Range1ds() {
        _ref1 = Range1ds.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Range1ds.prototype.model = Range1d;

      return Range1ds;

    })(Backbone.Collection);
    return {
      "Model": Range1d,
      "Collection": new Range1ds()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=range1d.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('common/view_state',["./has_properties", "range/range1d"], function(HasProperties, Range1d) {
    var ViewState, _ref;
    return ViewState = (function(_super) {
      __extends(ViewState, _super);

      function ViewState() {
        _ref = ViewState.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      ViewState.prototype.initialize = function(attrs, options) {
        var _inner_range_horizontal, _inner_range_vertical;
        ViewState.__super__.initialize.call(this, attrs, options);
        this.register_property('border_top', function() {
          return Math.max(this.get('min_border_top'), this.get('requested_border_top'));
        }, false);
        this.add_dependencies('border_top', this, ['min_border_top', 'requested_border_top']);
        this.register_property('border_bottom', function() {
          return Math.max(this.get('min_border_bottom'), this.get('requested_border_bottom'));
        }, false);
        this.add_dependencies('border_bottom', this, ['min_border_bottom', 'requested_border_bottom']);
        this.register_property('border_left', function() {
          return Math.max(this.get('min_border_left'), this.get('requested_border_left'));
        }, false);
        this.add_dependencies('border_left', this, ['min_border_left', 'requested_border_left']);
        this.register_property('border_right', function() {
          return Math.max(this.get('min_border_right'), this.get('requested_border_right'));
        }, false);
        this.add_dependencies('border_right', this, ['min_border_right', 'requested_border_right']);
        this.register_property('canvas_aspect', function() {
          return this.get('canvas_height') / this.get('canvas_width');
        }, true);
        this.add_dependencies('canvas_aspect', this, ['canvas_height', 'canvas_width']);
        this.register_property('outer_aspect', function() {
          return this.get('outer_height') / this.get('outer_width');
        }, true);
        this.add_dependencies('outer_aspect', this, ['outer_height', 'outer_width']);
        this.register_property('inner_width', function() {
          return this.get('outer_width') - this.get('border_left') - this.get('border_right');
        }, true);
        this.add_dependencies('inner_width', this, ['outer_width', 'border_left', 'border_right']);
        this.register_property('inner_height', function() {
          return this.get('outer_height') - this.get('border_top') - this.get('border_bottom');
        }, true);
        this.add_dependencies('inner_height', this, ['outer_height', 'border_top', 'border_bottom']);
        this.register_property('inner_aspect', function() {
          return this.get('inner_height') / this.get('inner_width');
        }, true);
        this.add_dependencies('inner_aspect', this, ['inner_height', 'inner_width']);
        _inner_range_horizontal = new Range1d.Model({
          start: this.get('border_left'),
          end: this.get('border_left') + this.get('inner_width')
        });
        this.register_property('inner_range_horizontal', function() {
          _inner_range_horizontal.set('start', this.get('border_left'));
          _inner_range_horizontal.set('end', this.get('border_left') + this.get('inner_width'));
          return _inner_range_horizontal;
        }, true);
        this.add_dependencies('inner_range_horizontal', this, ['border_left', 'inner_width']);
        _inner_range_vertical = new Range1d.Model({
          start: this.get('border_bottom'),
          end: this.get('border_bottom') + this.get('inner_height')
        });
        this.register_property('inner_range_vertical', function() {
          _inner_range_vertical.set('start', this.get('border_bottom'));
          _inner_range_vertical.set('end', this.get('border_bottom') + this.get('inner_height'));
          return _inner_range_vertical;
        }, true);
        return this.add_dependencies('inner_range_vertical', this, ['border_bottom', 'inner_height']);
      };

      ViewState.prototype.vx_to_sx = function(x) {
        return x;
      };

      ViewState.prototype.vy_to_sy = function(y) {
        return this.get('canvas_height') - y;
      };

      ViewState.prototype.v_vx_to_sx = function(xx) {
        var idx, x, _i, _len;
        for (idx = _i = 0, _len = xx.length; _i < _len; idx = ++_i) {
          x = xx[idx];
          xx[idx] = x;
        }
        return xx;
      };

      ViewState.prototype.v_vy_to_sy = function(yy) {
        var canvas_height, idx, y, _i, _len;
        canvas_height = this.get('canvas_height');
        for (idx = _i = 0, _len = yy.length; _i < _len; idx = ++_i) {
          y = yy[idx];
          yy[idx] = canvas_height - y;
        }
        return yy;
      };

      ViewState.prototype.sx_to_vx = function(x) {
        return x;
      };

      ViewState.prototype.sy_to_vy = function(y) {
        return this.get('canvas_height') - y;
      };

      ViewState.prototype.v_sx_to_vx = function(xx) {
        var idx, x, _i, _len;
        for (idx = _i = 0, _len = xx.length; _i < _len; idx = ++_i) {
          x = xx[idx];
          xx[idx] = x;
        }
        return xx;
      };

      ViewState.prototype.v_sy_to_vy = function(yy) {
        var canvas_height, idx, y, _i, _len;
        canvas_height = this.get('canvas_height');
        for (idx = _i = 0, _len = yy.length; _i < _len; idx = ++_i) {
          y = yy[idx];
          yy[idx] = canvas_height - y;
        }
        return yy;
      };

      return ViewState;

    })(HasProperties);
  });

}).call(this);

/*
//@ sourceMappingURL=view_state.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('mapper/1d/linear_mapper',["common/has_properties"], function(HasProperties) {
    var LinearMapper, _ref;
    return LinearMapper = (function(_super) {
      __extends(LinearMapper, _super);

      function LinearMapper() {
        _ref = LinearMapper.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      LinearMapper.prototype.initialize = function(attrs, options) {
        LinearMapper.__super__.initialize.call(this, attrs, options);
        this.register_property('mapper_state', this._mapper_state, true);
        this.add_dependencies('mapper_state', this, ['source_range', 'target_range']);
        this.add_dependencies('mapper_state', this.get('source_range'), ['start', 'end']);
        return this.add_dependencies('mapper_state', this.get('target_range'), ['start', 'end']);
      };

      LinearMapper.prototype.map_to_target = function(x) {
        var offset, scale, _ref1;
        _ref1 = this.get('mapper_state'), scale = _ref1[0], offset = _ref1[1];
        return scale * x + offset;
      };

      LinearMapper.prototype.v_map_to_target = function(xs) {
        var idx, offset, result, scale, x, _i, _len, _ref1;
        _ref1 = this.get('mapper_state'), scale = _ref1[0], offset = _ref1[1];
        result = new Float64Array(xs.length);
        for (idx = _i = 0, _len = xs.length; _i < _len; idx = ++_i) {
          x = xs[idx];
          result[idx] = scale * x + offset;
        }
        return result;
      };

      LinearMapper.prototype.map_from_target = function(xprime) {
        var offset, scale, _ref1;
        _ref1 = this.get('mapper_state'), scale = _ref1[0], offset = _ref1[1];
        return (xprime - offset) / scale;
      };

      LinearMapper.prototype.v_map_from_target = function(xprimes) {
        var idx, offset, result, scale, xprime, _i, _len, _ref1;
        _ref1 = this.get('mapper_state'), scale = _ref1[0], offset = _ref1[1];
        result = new Float64Array(xprimes.length);
        for (idx = _i = 0, _len = xprimes.length; _i < _len; idx = ++_i) {
          xprime = xprimes[idx];
          result[idx] = (xprime - offset) / scale;
        }
        return result;
      };

      LinearMapper.prototype._mapper_state = function() {
        var offset, scale, source_end, source_start, target_end, target_start;
        source_start = this.get('source_range').get('start');
        source_end = this.get('source_range').get('end');
        target_start = this.get('target_range').get('start');
        target_end = this.get('target_range').get('end');
        scale = (target_end - target_start) / (source_end - source_start);
        offset = -(scale * source_start) + target_start;
        return [scale, offset];
      };

      return LinearMapper;

    })(HasProperties);
  });

}).call(this);

/*
//@ sourceMappingURL=linear_mapper.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('mapper/2d/grid_mapper',["common/has_properties"], function(HasProperties) {
    var GridMapper, _ref;
    return GridMapper = (function(_super) {
      __extends(GridMapper, _super);

      function GridMapper() {
        _ref = GridMapper.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      GridMapper.prototype.map_to_target = function(x, y) {
        var xprime, yprime;
        xprime = this.get('domain_mapper').map_to_target(x);
        yprime = this.get('codomain_mapper').map_to_target(y);
        return [xprime, yprime];
      };

      GridMapper.prototype.v_map_to_target = function(xs, ys) {
        var xprimes, yprimes;
        xprimes = this.get('domain_mapper').v_map_to_target(xs);
        yprimes = this.get('codomain_mapper').v_map_to_target(ys);
        return [xprimes, yprimes];
      };

      GridMapper.prototype.map_from_target = function(xprime, yprime) {
        var x, y;
        x = this.get('domain_mapper').map_from_target(xprime);
        y = this.get('codomain_mapper').map_from_target(yprime);
        return [x, y];
      };

      GridMapper.prototype.v_map_from_target = function(xprimes, yprimes) {
        var xs, ys;
        xs = this.get('domain_mapper').v_map_from_target(xprimes);
        ys = this.get('codomain_mapper').v_map_from_target(yprimes);
        return [xs, ys];
      };

      return GridMapper;

    })(HasProperties);
  });

}).call(this);

/*
//@ sourceMappingURL=grid_mapper.js.map
*/;
(function() {
  define('common/svg_colors',[], function() {
    var svg_colors;
    return svg_colors = {
      indianred: "#CD5C5C",
      lightcoral: "#F08080",
      salmon: "#FA8072",
      darksalmon: "#E9967A",
      lightsalmon: "#FFA07A",
      crimson: "#DC143C",
      red: "#FF0000",
      firebrick: "#B22222",
      darkred: "#8B0000",
      pink: "#FFC0CB",
      lightpink: "#FFB6C1",
      hotpink: "#FF69B4",
      deeppink: "#FF1493",
      mediumvioletred: "#C71585",
      palevioletred: "#DB7093",
      lightsalmon: "#FFA07A",
      coral: "#FF7F50",
      tomato: "#FF6347",
      orangered: "#FF4500",
      darkorange: "#FF8C00",
      orange: "#FFA500",
      gold: "#FFD700",
      yellow: "#FFFF00",
      lightyellow: "#FFFFE0",
      lemonchiffon: "#FFFACD",
      lightgoldenrodyellow: "#FAFAD2",
      papayawhip: "#FFEFD5",
      moccasin: "#FFE4B5",
      peachpuff: "#FFDAB9",
      palegoldenrod: "#EEE8AA",
      khaki: "#F0E68C",
      darkkhaki: "#BDB76B",
      lavender: "#E6E6FA",
      thistle: "#D8BFD8",
      plum: "#DDA0DD",
      violet: "#EE82EE",
      orchid: "#DA70D6",
      fuchsia: "#FF00FF",
      magenta: "#FF00FF",
      mediumorchid: "#BA55D3",
      mediumpurple: "#9370DB",
      blueviolet: "#8A2BE2",
      darkviolet: "#9400D3",
      darkorchid: "#9932CC",
      darkmagenta: "#8B008B",
      purple: "#800080",
      indigo: "#4B0082",
      slateblue: "#6A5ACD",
      darkslateblue: "#483D8B",
      mediumslateblue: "#7B68EE",
      greenyellow: "#ADFF2F",
      chartreuse: "#7FFF00",
      lawngreen: "#7CFC00",
      lime: "#00FF00",
      limegreen: "#32CD32",
      palegreen: "#98FB98",
      lightgreen: "#90EE90",
      mediumspringgreen: "#00FA9A",
      springgreen: "#00FF7F",
      mediumseagreen: "#3CB371",
      seagreen: "#2E8B57",
      forestgreen: "#228B22",
      green: "#008000",
      darkgreen: "#006400",
      yellowgreen: "#9ACD32",
      olivedrab: "#6B8E23",
      olive: "#808000",
      darkolivegreen: "#556B2F",
      mediumaquamarine: "#66CDAA",
      darkseagreen: "#8FBC8F",
      lightseagreen: "#20B2AA",
      darkcyan: "#008B8B",
      teal: "#008080",
      aqua: "#00FFFF",
      cyan: "#00FFFF",
      lightcyan: "#E0FFFF",
      paleturquoise: "#AFEEEE",
      aquamarine: "#7FFFD4",
      turquoise: "#40E0D0",
      mediumturquoise: "#48D1CC",
      darkturquoise: "#00CED1",
      cadetblue: "#5F9EA0",
      steelblue: "#4682B4",
      lightsteelblue: "#B0C4DE",
      powderblue: "#B0E0E6",
      lightblue: "#ADD8E6",
      skyblue: "#87CEEB",
      lightskyblue: "#87CEFA",
      deepskyblue: "#00BFFF",
      dodgerblue: "#1E90FF",
      cornflowerblue: "#6495ED",
      mediumslateblue: "#7B68EE",
      royalblue: "#4169E1",
      blue: "#0000FF",
      mediumblue: "#0000CD",
      darkblue: "#00008B",
      navy: "#000080",
      midnightblue: "#191970",
      cornsilk: "#FFF8DC",
      blanchedalmond: "#FFEBCD",
      bisque: "#FFE4C4",
      navajowhite: "#FFDEAD",
      wheat: "#F5DEB3",
      burlywood: "#DEB887",
      tan: "#D2B48C",
      rosybrown: "#BC8F8F",
      sandybrown: "#F4A460",
      goldenrod: "#DAA520",
      darkgoldenrod: "#B8860B",
      peru: "#CD853F",
      chocolate: "#D2691E",
      saddlebrown: "#8B4513",
      sienna: "#A0522D",
      brown: "#A52A2A",
      maroon: "#800000",
      white: "#FFFFFF",
      snow: "#FFFAFA",
      honeydew: "#F0FFF0",
      mintcream: "#F5FFFA",
      azure: "#F0FFFF",
      aliceblue: "#F0F8FF",
      ghostwhite: "#F8F8FF",
      whitesmoke: "#F5F5F5",
      seashell: "#FFF5EE",
      beige: "#F5F5DC",
      oldlace: "#FDF5E6",
      floralwhite: "#FFFAF0",
      ivory: "#FFFFF0",
      antiquewhite: "#FAEBD7",
      linen: "#FAF0E6",
      lavenderblush: "#FFF0F5",
      mistyrose: "#FFE4E1",
      gainsboro: "#DCDCDC",
      lightgrey: "#D3D3D3",
      silver: "#C0C0C0",
      darkgray: "#A9A9A9",
      darkgrey: "#A9A9A9",
      gray: "#808080",
      grey: "#808080",
      dimgray: "#696969",
      dimgrey: "#696969",
      lightslategray: "#778899",
      lightslategrey: "#778899",
      slategray: "#708090",
      darkslategray: "#2F4F4F",
      darkslategrey: "#2F4F4F",
      black: "#000000"
    };
  });

}).call(this);

/*
//@ sourceMappingURL=svg_colors.js.map
*/;
(function() {
  var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/properties',["underscore", "common/svg_colors"], function(_, svg_colors) {
    var fill_properties, glyph_properties, line_properties, properties, text_properties;
    properties = (function() {
      function properties() {}

      properties.prototype.source_v_select = function(attrname, datasource) {
        var default_value, glyph_props, i, prop, retval, _i, _ref;
        glyph_props = this;
        if (!(attrname in glyph_props)) {
          console.log("requested vector selection of unknown property '" + attrname + "' on objects");
          return (function() {
            var _i, _len, _ref, _results;
            _ref = datasource.get_length();
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              i = _ref[_i];
              _results.push(null);
            }
            return _results;
          })();
        }
        prop = glyph_props[attrname];
        if ((prop.field != null) && (prop.field in datasource.get('data'))) {
          return datasource.getcolumn(prop.field);
        } else {
          if (glyph_props[attrname].value != null) {
            default_value = glyph_props[attrname].value;
          } else if (attrname in datasource.get('data')) {
            return datasource.getcolumn(attrname);
          } else if (glyph_props[attrname]["default"] != null) {
            default_value = glyph_props[attrname]["default"];
          }
          retval = [];
          for (i = _i = 0, _ref = datasource.get_length(); 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
            retval.push(default_value);
          }
          return retval;
        }
      };

      properties.prototype.string = function(styleprovider, glyphspec, attrname) {
        var default_value, glyph_value;
        this[attrname] = {};
        default_value = styleprovider.mget(attrname);
        if (default_value == null) {

        } else if (_.isString(default_value)) {
          this[attrname]["default"] = default_value;
        } else {
          console.log(("string property '" + attrname + "' given invalid default value: ") + default_value);
        }
        if ((glyphspec == null) || !(attrname in glyphspec)) {
          return;
        }
        glyph_value = glyphspec[attrname];
        if (_.isString(glyph_value)) {
          return this[attrname].value = glyph_value;
        } else if (_.isObject(glyph_value)) {
          return this[attrname] = _.extend(this[attrname], glyph_value);
        } else {
          return console.log(("string property '" + attrname + "' given invalid glyph value: ") + glyph_value);
        }
      };

      properties.prototype.number = function(styleprovider, glyphspec, attrname) {
        var default_value, glyph_value, units_value, _ref;
        this[attrname] = {};
        default_value = styleprovider.mget(attrname);
        if (default_value == null) {

        } else if (_.isNumber(default_value)) {
          this[attrname]["default"] = default_value;
        } else {
          console.log(("number property '" + attrname + "' given invalid default value: ") + default_value);
        }
        units_value = (_ref = styleprovider.mget(attrname + '_units')) != null ? _ref : 'data';
        if ((glyphspec != null) && (attrname + '_units' in glyphspec)) {
          units_value = glyphspec[attrname + '_units'];
        }
        this[attrname].units = units_value;
        if ((glyphspec == null) || !(attrname in glyphspec)) {
          return;
        }
        glyph_value = glyphspec[attrname];
        if (_.isString(glyph_value)) {
          return this[attrname].field = glyph_value;
        } else if (_.isNumber(glyph_value)) {
          return this[attrname].value = glyph_value;
        } else if (_.isObject(glyph_value)) {
          return this[attrname] = _.extend(this[attrname], glyph_value);
        } else {
          return console.log(("number property '" + attrname + "' given invalid glyph value: ") + glyph_value);
        }
      };

      properties.prototype.color = function(styleprovider, glyphspec, attrname) {
        var default_value, glyph_value;
        this[attrname] = {};
        default_value = styleprovider.mget(attrname);
        if (_.isUndefined(default_value)) {
          this[attrname]["default"] = null;
        } else if (_.isString(default_value) && ((svg_colors[default_value] != null) || default_value.substring(0, 1) === "#") || _.isNull(default_value)) {
          this[attrname]["default"] = default_value;
        } else {
          console.log(("color property '" + attrname + "' given invalid default value: ") + default_value);
        }
        if ((glyphspec == null) || !(attrname in glyphspec)) {
          return;
        }
        glyph_value = glyphspec[attrname];
        if (_.isNull(glyph_value)) {
          return this[attrname].value = null;
        } else if (_.isString(glyph_value)) {
          if ((svg_colors[glyph_value] != null) || glyph_value.substring(0, 1) === "#") {
            return this[attrname].value = glyph_value;
          } else {
            return this[attrname].field = glyph_value;
          }
        } else if (_.isObject(glyph_value)) {
          return this[attrname] = _.extend(this[attrname], glyph_value);
        } else {
          return console.log(("color property '" + attrname + "' given invalid glyph value: ") + glyph_value);
        }
      };

      properties.prototype.array = function(styleprovider, glyphspec, attrname) {
        var default_value, glyph_value, units_value, _ref;
        this[attrname] = {};
        default_value = styleprovider.mget(attrname);
        if (default_value == null) {

        } else if (_.isArray(default_value)) {
          this[attrname]["default"] = default_value;
        } else {
          console.log(("array property '" + attrname + "' given invalid default value: ") + default_value);
        }
        units_value = (_ref = styleprovider.mget(attrname + "_units")) != null ? _ref : 'data';
        if ((glyphspec != null) && (attrname + '_units' in glyphspec)) {
          units_value = glyphspec[attrname + '_units'];
        }
        this[attrname].units = units_value;
        if ((glyphspec == null) || !(attrname in glyphspec)) {
          return;
        }
        glyph_value = glyphspec[attrname];
        if (_.isString(glyph_value)) {
          return this[attrname].field = glyph_value;
        } else if (_.isArray(glyph_value)) {
          return this[attrname].value = glyph_value;
        } else if (_.isObject(glyph_value)) {
          return this[attrname] = _.extend(this[attrname], glyph_value);
        } else {
          return console.log(("array property '" + attrname + "' given invalid glyph value: ") + glyph_value);
        }
      };

      properties.prototype["enum"] = function(styleprovider, glyphspec, attrname, vals) {
        var default_value, glyph_value, levels;
        this[attrname] = {};
        levels = vals.split(" ");
        default_value = styleprovider.mget(attrname);
        if (_.isNull(default_value)) {

        } else if (_.isString(default_value) && __indexOf.call(levels, default_value) >= 0) {
          this[attrname] = {
            "default": default_value
          };
        } else {
          console.log(("enum property '" + attrname + "' given invalid default value: ") + default_value);
          console.log("    acceptable values:" + levels);
        }
        if ((glyphspec == null) || !(attrname in glyphspec)) {
          return;
        }
        glyph_value = glyphspec[attrname];
        if (_.isString(glyph_value)) {
          if (__indexOf.call(levels, glyph_value) >= 0) {
            return this[attrname].value = glyph_value;
          } else {
            return this[attrname].field = glyph_value;
          }
        } else if (_.isObject(glyph_value)) {
          return this[attrname] = _.extend(this[attrname], glyph_value);
        } else {
          console.log(("enum property '" + attrname + "' given invalid glyph value: ") + glyph_value);
          return console.log("    acceptable values:" + levels);
        }
      };

      properties.prototype.setattr = function(styleprovider, glyphspec, attrname, attrtype) {
        var values, _ref;
        values = null;
        if (attrtype.indexOf(":") > -1) {
          _ref = attrtype.split(":"), attrtype = _ref[0], values = _ref[1];
        }
        if (attrtype === "string") {
          return this.string(styleprovider, glyphspec, attrname);
        } else if (attrtype === "number") {
          return this.number(styleprovider, glyphspec, attrname);
        } else if (attrtype === "color") {
          return this.color(styleprovider, glyphspec, attrname);
        } else if (attrtype === "array") {
          return this.array(styleprovider, glyphspec, attrname);
        } else if (attrtype === "enum" && values) {
          return this["enum"](styleprovider, glyphspec, attrname, values);
        } else {
          return console.log(("Unknown type '" + attrtype + "' for glyph property: ") + attrname);
        }
      };

      properties.prototype.select = function(attrname, obj) {
        if (!(attrname in this)) {
          console.log(("requested selection of unknown property '" + attrname + "' on object: ") + obj);
          return;
        }
        if ((this[attrname].field != null) && (this[attrname].field in obj)) {
          return obj[this[attrname].field];
        }
        if (this[attrname].value != null) {
          return this[attrname].value;
        }
        if (obj[attrname] != null) {
          return obj[attrname];
        }
        if (this[attrname]["default"] != null) {
          return this[attrname]["default"];
        } else {
          return console.log("selection for attribute '" + attrname + "' failed on object: " + obj);
        }
      };

      properties.prototype.v_select = function(attrname, objs) {
        var i, obj, result, _i, _ref;
        if (!(attrname in this)) {
          console.log("requested vector selection of unknown property '" + attrname + "' on objects");
          return;
        }
        if (this[attrname].typed != null) {
          result = new Float64Array(objs.length);
        } else {
          result = new Array(objs.length);
        }
        for (i = _i = 0, _ref = objs.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          obj = objs[i];
          if ((this[attrname].field != null) && (this[attrname].field in obj)) {
            result[i] = obj[this[attrname].field];
          } else if (this[attrname].value != null) {
            result[i] = this[attrname].value;
          } else if (obj[attrname] != null) {
            result[i] = obj[attrname];
          } else if (this[attrname]["default"] != null) {
            result[i] = this[attrname]["default"];
          } else {
            console.log("vector selection for attribute '" + attrname + "' failed on object: " + obj);
            return;
          }
        }
        return result;
      };

      return properties;

    })();
    line_properties = (function(_super) {
      __extends(line_properties, _super);

      function line_properties(styleprovider, glyphspec, prefix) {
        if (prefix == null) {
          prefix = "";
        }
        this.line_color_name = "" + prefix + "line_color";
        this.line_width_name = "" + prefix + "line_width";
        this.line_alpha_name = "" + prefix + "line_alpha";
        this.line_join_name = "" + prefix + "line_join";
        this.line_cap_name = "" + prefix + "line_cap";
        this.line_dash_name = "" + prefix + "line_dash";
        this.line_dash_offset_name = "" + prefix + "line_dash_offset";
        this.color(styleprovider, glyphspec, this.line_color_name);
        this.number(styleprovider, glyphspec, this.line_width_name);
        this.number(styleprovider, glyphspec, this.line_alpha_name);
        this["enum"](styleprovider, glyphspec, this.line_join_name, "miter round bevel");
        this["enum"](styleprovider, glyphspec, this.line_cap_name, "butt round square");
        this.array(styleprovider, glyphspec, this.line_dash_name);
        this.number(styleprovider, glyphspec, this.line_dash_offset_name);
        this.do_stroke = true;
        if (!_.isUndefined(this[this.line_color_name].value)) {
          if (_.isNull(this[this.line_color_name].value)) {
            this.do_stroke = false;
          }
        } else if (_.isNull(this[this.line_color_name]["default"])) {
          this.do_stroke = false;
        }
      }

      line_properties.prototype.set = function(ctx, obj) {
        ctx.strokeStyle = this.select(this.line_color_name, obj);
        ctx.globalAlpha = this.select(this.line_alpha_name, obj);
        ctx.lineWidth = this.select(this.line_width_name, obj);
        ctx.lineJoin = this.select(this.line_join_name, obj);
        ctx.lineCap = this.select(this.line_cap_name, obj);
        ctx.setLineDash(this.select(this.line_dash_name, obj));
        return ctx.setLineDashOffset(this.select(this.line_dash_offset_name, obj));
      };

      line_properties.prototype.set_prop_cache = function(datasource) {
        this.cache = {};
        this.cache.strokeStyle = this.source_v_select(this.line_color_name, datasource);
        this.cache.globalAlpha = this.source_v_select(this.line_alpha_name, datasource);
        this.cache.lineWidth = this.source_v_select(this.line_width_name, datasource);
        this.cache.lineJoin = this.source_v_select(this.line_join_name, datasource);
        this.cache.lineCap = this.source_v_select(this.line_cap_name, datasource);
        this.cache.setLineDash = this.source_v_select(this.line_dash_name, datasource);
        return this.cache.setLineDashOffset = this.source_v_select(this.line_dash_offset_name, datasource);
      };

      line_properties.prototype.clear_prop_cache = function() {
        return this.cache = {};
      };

      line_properties.prototype.set_vectorize = function(ctx, i) {
        var did_change;
        did_change = false;
        if (ctx.strokeStyle !== this.cache.strokeStyle[i]) {
          ctx.strokeStyle = this.cache.strokeStyle[i];
          did_change = true;
        }
        if (ctx.globalAlpha !== this.cache.globalAlpha[i]) {
          ctx.globalAlpha = this.cache.globalAlpha[i];
          did_change = true;
        }
        if (ctx.lineWidth !== this.cache.lineWidth[i]) {
          ctx.lineWidth = this.cache.lineWidth[i];
          did_change = true;
        }
        if (ctx.lineJoin !== this.cache.lineJoin[i]) {
          ctx.lineJoin = this.cache.lineJoin[i];
          did_change = true;
        }
        if (ctx.lineCap !== this.cache.lineCap[i]) {
          ctx.lineCap = this.cache.lineCap[i];
          did_change = true;
        }
        if (ctx.getLineDash() !== this.cache.setLineDash[i]) {
          ctx.setLineDash(this.cache.setLineDash[i]);
          did_change = true;
        }
        if (ctx.getLineDashOffset() !== this.cache.setLineDashOffset[i]) {
          ctx.setLineDashOffset(this.cache.setLineDashOffset[i]);
          did_change = true;
        }
        return did_change;
      };

      return line_properties;

    })(properties);
    fill_properties = (function(_super) {
      __extends(fill_properties, _super);

      function fill_properties(styleprovider, glyphspec, prefix) {
        if (prefix == null) {
          prefix = "";
        }
        this.fill_color_name = "" + prefix + "fill_color";
        this.fill_alpha_name = "" + prefix + "fill_alpha";
        this.color(styleprovider, glyphspec, this.fill_color_name);
        this.number(styleprovider, glyphspec, this.fill_alpha_name);
        this.do_fill = true;
        if (!_.isUndefined(this[this.fill_color_name].value)) {
          if (_.isNull(this[this.fill_color_name].value)) {
            this.do_fill = false;
          }
        } else if (_.isNull(this[this.fill_color_name]["default"])) {
          this.do_fill = false;
        }
      }

      fill_properties.prototype.set = function(ctx, obj) {
        ctx.fillStyle = this.select(this.fill_color_name, obj);
        return ctx.globalAlpha = this.select(this.fill_alpha_name, obj);
      };

      fill_properties.prototype.set_prop_cache = function(datasource) {
        this.cache = {};
        this.cache.fillStyle = this.source_v_select(this.fill_color_name, datasource);
        return this.cache.globalAlpha = this.source_v_select(this.fill_alpha_name, datasource);
      };

      fill_properties.prototype.set_vectorize = function(ctx, i) {
        var did_change;
        did_change = false;
        if (ctx.fillStyle !== this.cache.fillStyle[i]) {
          ctx.fillStyle = this.cache.fillStyle[i];
          did_change = true;
        }
        if (ctx.globalAlpha !== this.cache.globalAlpha[i]) {
          ctx.globalAlpha = this.cache.globalAlpha[i];
          did_change = true;
        }
        return did_change;
      };

      return fill_properties;

    })(properties);
    text_properties = (function(_super) {
      __extends(text_properties, _super);

      function text_properties(styleprovider, glyphspec, prefix) {
        if (prefix == null) {
          prefix = "";
        }
        this.text_font_name = "" + prefix + "text_font";
        this.text_font_size_name = "" + prefix + "text_font_size";
        this.text_font_style_name = "" + prefix + "text_font_style";
        this.text_color_name = "" + prefix + "text_color";
        this.text_alpha_name = "" + prefix + "text_alpha";
        this.text_align_name = "" + prefix + "text_align";
        this.text_baseline_name = "" + prefix + "text_baseline";
        this.string(styleprovider, glyphspec, this.text_font_name);
        this.string(styleprovider, glyphspec, this.text_font_size_name);
        this["enum"](styleprovider, glyphspec, this.text_font_style_name, "normal italic bold");
        this.color(styleprovider, glyphspec, this.text_color_name);
        this.number(styleprovider, glyphspec, this.text_alpha_name);
        this["enum"](styleprovider, glyphspec, this.text_align_name, "left right center");
        this["enum"](styleprovider, glyphspec, this.text_baseline_name, "top middle bottom alphabetic hanging");
      }

      text_properties.prototype.font = function(obj, font_size) {
        var font, font_style;
        if (font_size == null) {
          font_size = this.select(this.text_font_size_name, obj);
        }
        font = this.select(this.text_font_name, obj);
        font_style = this.select(this.text_font_style_name, obj);
        font = font_style + " " + font_size + " " + font;
        return font;
      };

      text_properties.prototype.set = function(ctx, obj) {
        ctx.font = this.font(obj);
        ctx.fillStyle = this.select(this.text_color_name, obj);
        ctx.globalAlpha = this.select(this.text_alpha_name, obj);
        ctx.textAlign = this.select(this.text_align_name, obj);
        return ctx.textBaseline = this.select(this.text_baseline_name, obj);
      };

      text_properties.prototype.set_prop_cache = function(datasource) {
        var font, font_size, font_style, i;
        this.cache = {};
        font_size = this.source_v_select(this.text_font_size_name, datasource);
        font = this.source_v_select(this.text_font_name, datasource);
        font_style = this.source_v_select(this.text_font_style_name, datasource);
        this.cache.font = (function() {
          var _i, _ref, _results;
          _results = [];
          for (i = _i = 0, _ref = font.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
            _results.push("" + font_style[i] + " " + font_size[i] + " " + font[i]);
          }
          return _results;
        })();
        this.cache.fillStyle = this.source_v_select(this.text_color_name, datasource);
        this.cache.globalAlpha = this.source_v_select(this.text_alpha_name, datasource);
        this.cache.textAlign = this.source_v_select(this.text_align_name, datasource);
        return this.cache.textBaseline = this.source_v_select(this.text_baseline_name, datasource);
      };

      text_properties.prototype.clear_prop_cache = function() {
        return this.cache = {};
      };

      text_properties.prototype.set_vectorize = function(ctx, i) {
        var did_change;
        did_change = false;
        if (ctx.font !== this.cache.font[i]) {
          ctx.font = this.cache.font[i];
          did_change = true;
        }
        if (ctx.fillStyle !== this.cache.fillStyle[i]) {
          ctx.fillStyle = this.cache.fillStyle[i];
          did_change = true;
        }
        if (ctx.globalAlpha !== this.cache.globalAlpha[i]) {
          ctx.globalAlpha = this.cache.globalAlpha[i];
          did_change = true;
        }
        if (ctx.textAlign !== this.cache.textAlign[i]) {
          ctx.textAlign = this.cache.textAlign[i];
          did_change = true;
        }
        if (ctx.textBaseline !== this.cache.textBaseline[i]) {
          ctx.textBaseline = this.cache.textBaseline[i];
          did_change = true;
        }
        return did_change;
      };

      return text_properties;

    })(properties);
    glyph_properties = (function(_super) {
      __extends(glyph_properties, _super);

      function glyph_properties(styleprovider, glyphspec, attrnames, properties) {
        var attrname, attrtype, key, _i, _len, _ref;
        for (_i = 0, _len = attrnames.length; _i < _len; _i++) {
          attrname = attrnames[_i];
          attrtype = "number";
          if (attrname.indexOf(":") > -1) {
            _ref = attrname.split(":"), attrname = _ref[0], attrtype = _ref[1];
          }
          this.setattr(styleprovider, glyphspec, attrname, attrtype);
        }
        for (key in properties) {
          this[key] = properties[key];
        }
        this.fast_path = false;
        if ('fast_path' in glyphspec) {
          this.fast_path = glyphspec.fast_path;
        }
      }

      return glyph_properties;

    })(properties);
    return {
      "glyph_properties": glyph_properties,
      "fill_properties": fill_properties,
      "line_properties": line_properties,
      "text_properties": text_properties
    };
  });

}).call(this);

/*
//@ sourceMappingURL=properties.js.map
*/;
(function() {
  define('tool/active_tool_manager',[], function() {
    var ActiveToolManager;
    return ActiveToolManager = (function() {
      " This makes sure that only one tool is active at a time ";
      function ActiveToolManager(event_sink) {
        this.event_sink = event_sink;
        this.event_sink.active = null;
      }

      ActiveToolManager.prototype.bind_bokeh_events = function() {
        var _this = this;
        this.event_sink.on("clear_active_tool", function() {
          _this.event_sink.trigger("" + _this.event_sink.active + ":deactivated");
          return _this.event_sink.active = null;
        });
        this.event_sink.on("active_tool", function(toolName) {
          if (toolName !== _this.event_sink.active) {
            _this.event_sink.trigger("" + toolName + ":activated");
            _this.event_sink.trigger("" + _this.event_sink.active + ":deactivated");
            return _this.event_sink.active = toolName;
          }
        });
        return this.event_sink.on("try_active_tool", function(toolName) {
          if (_this.event_sink.active == null) {
            _this.event_sink.trigger("" + toolName + ":activated");
            _this.event_sink.trigger("" + _this.event_sink.active + ":deactivated");
            return _this.event_sink.active = toolName;
          }
        });
      };

      return ActiveToolManager;

    })();
  });

}).call(this);

/*
//@ sourceMappingURL=active_tool_manager.js.map
*/;
(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('common/plot',["underscore", "backbone", "require", "./build_views", "./safebind", "./bulk_save", "./continuum_view", "./has_parent", "./view_state", "mapper/1d/linear_mapper", "mapper/2d/grid_mapper", "renderer/properties", "tool/active_tool_manager"], function(_, Backbone, require, build_views, safebind, bulk_save, ContinuumView, HasParent, ViewState, LinearMapper, GridMapper, Properties, ActiveToolManager) {
    var LEVELS, Plot, PlotView, Plots, delay_animation, line_properties, text_properties, throttle_animation, _ref, _ref1, _ref2;
    line_properties = Properties.line_properties;
    text_properties = Properties.text_properties;
    LEVELS = ['image', 'underlay', 'glyph', 'overlay', 'annotation', 'tool'];
    delay_animation = function(f) {
      return f();
    };
    delay_animation = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || delay_animation;
    throttle_animation = function(func, wait) {
      var args, context, later, pending, previous, result, timeout, _ref;
      _ref = [null, null, null, null], context = _ref[0], args = _ref[1], timeout = _ref[2], result = _ref[3];
      previous = 0;
      pending = false;
      later = function() {
        previous = new Date;
        timeout = null;
        pending = false;
        return result = func.apply(context, args);
      };
      return function() {
        var now, remaining;
        now = new Date;
        remaining = wait - (now - previous);
        context = this;
        args = arguments;
        if (remaining <= 0 && !pending) {
          clearTimeout(timeout);
          pending = true;
          delay_animation(later);
        } else if (!timeout) {
          timeout = setTimeout((function() {
            return delay_animation(later);
          }), remaining);
        }
        return result;
      };
    };
    PlotView = (function(_super) {
      __extends(PlotView, _super);

      function PlotView() {
        this._mousemove = __bind(this._mousemove, this);
        this._mousedown = __bind(this._mousedown, this);
        _ref = PlotView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      PlotView.prototype.className = "bokeh plotview";

      PlotView.prototype.events = {
        "mousemove .bokeh_canvas_wrapper": "_mousemove",
        "mousedown .bokeh_canvas_wrapper": "_mousedown"
      };

      PlotView.prototype.view_options = function() {
        return _.extend({
          plot_model: this.model,
          plot_view: this
        }, this.options);
      };

      PlotView.prototype._mousedown = function(e) {
        var f, _i, _len, _ref1, _results;
        _ref1 = this.mousedownCallbacks;
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          f = _ref1[_i];
          _results.push(f(e, e.layerX, e.layerY));
        }
        return _results;
      };

      PlotView.prototype._mousemove = function(e) {
        var f, _i, _len, _ref1, _results;
        _ref1 = this.moveCallbacks;
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          f = _ref1[_i];
          _results.push(f(e, e.layerX, e.layerY));
        }
        return _results;
      };

      PlotView.prototype.pause = function() {
        return this.is_paused = true;
      };

      PlotView.prototype.unpause = function(render_canvas) {
        if (render_canvas == null) {
          render_canvas = false;
        }
        this.is_paused = false;
        if (render_canvas) {
          return this.request_render_canvas(true);
        } else {
          return this.request_render();
        }
      };

      PlotView.prototype.request_render = function() {
        if (!this.is_paused) {
          this.throttled_render();
        }
      };

      PlotView.prototype.request_render_canvas = function(full_render) {
        if (!this.is_paused) {
          this.throttled_render_canvas(full_render);
        }
      };

      PlotView.prototype.initialize = function(options) {
        var level, _i, _len, _ref1, _ref10, _ref11, _ref12, _ref13, _ref14, _ref15, _ref16, _ref17, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
        PlotView.__super__.initialize.call(this, _.defaults(options, this.default_options));
        this.throttled_render = throttle_animation(this.render, 15);
        this.throttled_render_canvas = throttle_animation(this.render_canvas, 15);
        this.outline_props = new line_properties(this, {}, 'outline_');
        this.title_props = new text_properties(this, {}, 'title_');
        this.view_state = new ViewState({
          canvas_width: (_ref1 = options.canvas_width) != null ? _ref1 : this.mget('canvas_width'),
          canvas_height: (_ref2 = options.canvas_height) != null ? _ref2 : this.mget('canvas_height'),
          x_offset: (_ref3 = options.x_offset) != null ? _ref3 : this.mget('x_offset'),
          y_offset: (_ref4 = options.y_offset) != null ? _ref4 : this.mget('y_offset'),
          outer_width: (_ref5 = options.outer_width) != null ? _ref5 : this.mget('outer_width'),
          outer_height: (_ref6 = options.outer_height) != null ? _ref6 : this.mget('outer_height'),
          min_border_top: (_ref7 = (_ref8 = options.min_border_top) != null ? _ref8 : this.mget('min_border_top')) != null ? _ref7 : this.mget('min_border'),
          min_border_bottom: (_ref9 = (_ref10 = options.min_border_bottom) != null ? _ref10 : this.mget('min_border_bottom')) != null ? _ref9 : this.mget('min_border'),
          min_border_left: (_ref11 = (_ref12 = options.min_border_left) != null ? _ref12 : this.mget('min_border_left')) != null ? _ref11 : this.mget('min_border'),
          min_border_right: (_ref13 = (_ref14 = options.min_border_right) != null ? _ref14 : this.mget('min_border_right')) != null ? _ref13 : this.mget('min_border'),
          requested_border_top: 0,
          requested_border_bottom: 0,
          requested_border_left: 0,
          requested_border_right: 0
        });
        this.hidpi = (_ref15 = options.hidpi) != null ? _ref15 : this.mget('hidpi');
        this.x_range = (_ref16 = options.x_range) != null ? _ref16 : this.mget_obj('x_range');
        this.y_range = (_ref17 = options.y_range) != null ? _ref17 : this.mget_obj('y_range');
        this.xmapper = new LinearMapper({
          source_range: this.x_range,
          target_range: this.view_state.get('inner_range_horizontal')
        });
        this.ymapper = new LinearMapper({
          source_range: this.y_range,
          target_range: this.view_state.get('inner_range_vertical')
        });
        this.mapper = new GridMapper({
          domain_mapper: this.xmapper,
          codomain_mapper: this.ymapper
        });
        this.requested_padding = {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0
        };
        this.old_mapper_state = {
          x: null,
          y: null
        };
        this.am_rendering = false;
        this.renderers = {};
        this.tools = {};
        this.eventSink = _.extend({}, Backbone.Events);
        this.moveCallbacks = [];
        this.mousedownCallbacks = [];
        this.keydownCallbacks = [];
        this.render_init();
        this.render_canvas(false);
        this.atm = new ActiveToolManager(this.eventSink);
        this.levels = {};
        for (_i = 0, _len = LEVELS.length; _i < _len; _i++) {
          level = LEVELS[_i];
          this.levels[level] = {};
        }
        this.build_levels();
        this.request_render();
        this.atm.bind_bokeh_events();
        this.bind_bokeh_events();
        return this;
      };

      PlotView.prototype.map_to_screen = function(x, x_units, y, y_units, units) {
        var sx, sy, _ref1;
        if (x_units === 'screen') {
          if (_.isArray(x)) {
            sx = x.slice(0);
          } else {
            sx = new Float64Array(x.length);
            sx.set(x);
          }
          if (_.isArray(y)) {
            sy = y.slice(0);
          } else {
            sy = new Float64Array(y.length);
            sy.set(y);
          }
        } else {
          _ref1 = this.mapper.v_map_to_target(x, y), sx = _ref1[0], sy = _ref1[1];
        }
        sx = this.view_state.v_vx_to_sx(sx);
        sy = this.view_state.v_vy_to_sy(sy);
        return [sx, sy];
      };

      PlotView.prototype.map_from_screen = function(sx, sy, units) {
        var dx, dy, x, y, _ref1;
        if (_.isArray(sx)) {
          dx = sx.slice(0);
        } else {
          dx = new Float64Array(sx.length);
          dx.set(x);
        }
        if (_.isArray(sy)) {
          dy = sy.slice(0);
        } else {
          dy = new Float64Array(sy.length);
          dy.set(y);
        }
        sx = this.view_state.v_sx_to_vx(dx);
        sy = this.view_state.v_sy_to_vy(dy);
        if (units === 'screen') {
          x = sx;
          y = sy;
        } else {
          _ref1 = this.mapper.v_map_from_target(sx, sy), x = _ref1[0], y = _ref1[1];
        }
        return [x, y];
      };

      PlotView.prototype.update_range = function(range_info) {
        this.pause();
        this.x_range.set(range_info.xr);
        this.y_range.set(range_info.yr);
        return this.unpause();
      };

      PlotView.prototype.build_tools = function() {
        return build_views(this.tools, this.mget_obj('tools'), this.view_options());
      };

      PlotView.prototype.build_views = function() {
        return build_views(this.renderers, this.mget_obj('renderers'), this.view_options());
      };

      PlotView.prototype.build_levels = function() {
        var id_, level, old_renderers, renderers_to_remove, t, tools, v, views, _i, _j, _k, _len, _len1, _len2;
        old_renderers = _.keys(this.renderers);
        views = this.build_views();
        renderers_to_remove = _.difference(old_renderers, _.pluck(this.mget_obj('renderers'), 'id'));
        console.log('renderers_to_remove', renderers_to_remove);
        for (_i = 0, _len = renderers_to_remove.length; _i < _len; _i++) {
          id_ = renderers_to_remove[_i];
          delete this.levels.glyph[id_];
        }
        tools = this.build_tools();
        for (_j = 0, _len1 = views.length; _j < _len1; _j++) {
          v = views[_j];
          level = v.mget('level');
          this.levels[level][v.model.id] = v;
          v.bind_bokeh_events();
        }
        for (_k = 0, _len2 = tools.length; _k < _len2; _k++) {
          t = tools[_k];
          level = t.mget('level');
          this.levels[level][t.model.id] = t;
          t.bind_bokeh_events();
        }
        return this;
      };

      PlotView.prototype.bind_bokeh_events = function() {
        var _this = this;
        safebind(this, this.view_state, 'change', function() {
          _this.request_render_canvas();
          return _this.request_render();
        });
        safebind(this, this.x_range, 'change', this.request_render);
        safebind(this, this.y_range, 'change', this.request_render);
        safebind(this, this.model, 'change:renderers', this.build_levels);
        safebind(this, this.model, 'change:tool', this.build_levels);
        safebind(this, this.model, 'change', this.request_render);
        return safebind(this, this.model, 'destroy', function() {
          return _this.remove();
        });
      };

      PlotView.prototype.render_init = function() {
        this.$el.append($("<div class='button_bar btn-group pull-top'/>\n<div class='plotarea'>\n<div class='bokeh_canvas_wrapper'>\n  <canvas class='bokeh_canvas'></canvas>\n</div>\n</div>"));
        this.button_bar = this.$el.find('.button_bar');
        this.canvas_wrapper = this.$el.find('.bokeh_canvas_wrapper');
        return this.canvas = this.$el.find('canvas.bokeh_canvas');
      };

      PlotView.prototype.render_canvas = function(full_render) {
        var backingStoreRatio, devicePixelRatio, oh, ow, ratio;
        if (full_render == null) {
          full_render = true;
        }
        this.ctx = this.canvas[0].getContext('2d');
        if (this.hidpi) {
          devicePixelRatio = window.devicePixelRatio || 1;
          backingStoreRatio = this.ctx.webkitBackingStorePixelRatio || this.ctx.mozBackingStorePixelRatio || this.ctx.msBackingStorePixelRatio || this.ctx.oBackingStorePixelRatio || this.ctx.backingStorePixelRatio || 1;
          ratio = devicePixelRatio / backingStoreRatio;
        } else {
          ratio = 1;
        }
        ow = this.view_state.get('outer_width');
        oh = this.view_state.get('outer_height');
        this.canvas.width = ow * ratio;
        this.canvas.height = oh * ratio;
        this.button_bar.attr('style', "width:" + ow + "px;");
        this.canvas_wrapper.attr('style', "width:" + ow + "px; height:" + oh + "px");
        this.canvas.attr('style', "width:" + ow + "px;");
        this.canvas.attr('style', "height:" + oh + "px;");
        this.canvas.attr('width', ow * ratio).attr('height', oh * ratio);
        this.$el.attr("width", ow).attr('height', oh);
        this.ctx.scale(ratio, ratio);
        this.ctx.translate(0.5, 0.5);
        if (full_render) {
          return this.render();
        }
      };

      PlotView.prototype.save_png = function() {
        var data_uri;
        this.render();
        data_uri = this.canvas[0].toDataURL();
        this.model.set('png', this.canvas[0].toDataURL());
        return bulk_save([this.model]);
      };

      PlotView.prototype.render = function(force) {
        var have_new_mapper_state, hpadding, k, level, pr, renderers, sx, sy, sym, th, title, v, xms, yms, _i, _j, _len, _len1, _ref1, _ref2, _ref3;
        PlotView.__super__.render.call(this);
        this.requested_padding = {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0
        };
        _ref1 = ['image', 'underlay', 'glyph', 'overlay', 'annotation', 'tool'];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          level = _ref1[_i];
          renderers = this.levels[level];
          for (k in renderers) {
            v = renderers[k];
            if (v.padding_request != null) {
              pr = v.padding_request();
              for (k in pr) {
                v = pr[k];
                this.requested_padding[k] += v;
              }
            }
          }
        }
        title = this.mget('title');
        if (title) {
          this.title_props.set(this.ctx, {});
          th = this.ctx.measureText(this.mget('title')).ascent;
          this.requested_padding['top'] += th + this.mget('title_standoff');
        }
        sym = this.mget('border_symmetry');
        if (sym.indexOf('h') >= 0 || sym.indexOf('H') >= 0) {
          hpadding = Math.max(this.requested_padding['left'], this.requested_padding['right']);
          this.requested_padding['left'] = hpadding;
          this.requested_padding['right'] = hpadding;
        }
        if (sym.indexOf('v') >= 0 || sym.indexOf('V') >= 0) {
          hpadding = Math.max(this.requested_padding['top'], this.requested_padding['bottom']);
          this.requested_padding['top'] = hpadding;
          this.requested_padding['bottom'] = hpadding;
        }
        this.is_paused = true;
        _ref2 = this.requested_padding;
        for (k in _ref2) {
          v = _ref2[k];
          this.view_state.set("requested_border_" + k, v);
        }
        this.is_paused = false;
        this.ctx.fillStyle = this.mget('border_fill');
        this.ctx.fillRect(0, 0, this.view_state.get('canvas_width'), this.view_state.get('canvas_height'));
        this.ctx.fillStyle = this.mget('background_fill');
        this.ctx.fillRect(this.view_state.get('border_left'), this.view_state.get('border_top'), this.view_state.get('inner_width'), this.view_state.get('inner_height'));
        if (this.outline_props.do_stroke) {
          this.outline_props.set(this.ctx, {});
          this.ctx.strokeRect(this.view_state.get('border_left'), this.view_state.get('border_top'), this.view_state.get('inner_width'), this.view_state.get('inner_height'));
        }
        have_new_mapper_state = false;
        xms = this.xmapper.get('mapper_state')[0];
        yms = this.ymapper.get('mapper_state')[0];
        if (Math.abs(this.old_mapper_state.x - xms) > 1e-8 || Math.abs(this.old_mapper_state.y - yms) > 1e-8) {
          this.old_mapper_state.x = xms;
          this.old_mapper_state.y = yms;
          have_new_mapper_state = true;
        }
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(this.view_state.get('border_left'), this.view_state.get('border_top'), this.view_state.get('inner_width'), this.view_state.get('inner_height'));
        this.ctx.clip();
        this.ctx.beginPath();
        _ref3 = ['image', 'underlay', 'glyph'];
        for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
          level = _ref3[_j];
          renderers = this.levels[level];
          for (k in renderers) {
            v = renderers[k];
            v.render(have_new_mapper_state);
          }
        }
        this.ctx.restore();
        this.render_overlays(have_new_mapper_state);
        if (title) {
          sx = this.view_state.get('outer_width') / 2;
          sy = th;
          this.title_props.set(this.ctx, {});
          return this.ctx.fillText(title, sx, sy);
        }
      };

      PlotView.prototype.render_overlays = function(have_new_mapper_state) {
        var k, level, renderers, v, _i, _len, _ref1, _results;
        _ref1 = ['overlay', 'annotation', 'tool'];
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          level = _ref1[_i];
          renderers = this.levels[level];
          _results.push((function() {
            var _results1;
            _results1 = [];
            for (k in renderers) {
              v = renderers[k];
              _results1.push(v.render(have_new_mapper_state));
            }
            return _results1;
          })());
        }
        return _results;
      };

      return PlotView;

    })(ContinuumView.View);
    Plot = (function(_super) {
      __extends(Plot, _super);

      function Plot() {
        _ref1 = Plot.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Plot.prototype.type = 'Plot';

      Plot.prototype.default_view = PlotView;

      Plot.prototype.add_renderers = function(new_renderers) {
        var renderers;
        renderers = this.get('renderers');
        renderers = renderers.concat(new_renderers);
        return this.set('renderers', renderers);
      };

      Plot.prototype.parent_properties = ['background_fill', 'border_fill', 'canvas_width', 'canvas_height', 'outer_width', 'outer_height', 'min_border', 'min_border_top', 'min_border_bottom', 'min_border_left', 'min_border_right'];

      Plot.prototype.defaults = function() {
        return {
          data_sources: {},
          renderers: [],
          tools: [],
          title: 'Plot'
        };
      };

      Plot.prototype.display_defaults = function() {
        return {
          hidpi: true,
          background_fill: "#fff",
          border_fill: "#fff",
          border_symmetry: "h",
          min_border: 40,
          x_offset: 0,
          y_offset: 0,
          canvas_width: 300,
          canvas_height: 300,
          outer_width: 300,
          outer_height: 300,
          title_standoff: 8,
          title_text_font: "helvetica",
          title_text_font_size: "20pt",
          title_text_font_style: "normal",
          title_text_color: "#444444",
          title_text_alpha: 1.0,
          title_text_align: "center",
          title_text_baseline: "alphabetic",
          outline_line_color: '#aaaaaa',
          outline_line_width: 1,
          outline_line_alpha: 1.0,
          outline_line_join: 'miter',
          outline_line_cap: 'butt',
          outline_line_dash: [],
          outline_line_dash_offset: 0
        };
      };

      return Plot;

    })(HasParent);
    Plots = (function(_super) {
      __extends(Plots, _super);

      function Plots() {
        _ref2 = Plots.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Plots.prototype.model = Plot;

      return Plots;

    })(Backbone.Collection);
    return {
      "Model": Plot,
      "Collection": new Plots(),
      "View": PlotView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=plot.js.map
*/;
(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('common/gmap_plot',["underscore", "jquery", "backbone", "./build_views", "./safebind", "./bulk_save", "./continuum_view", "./has_parent", "./view_state", "mapper/1d/linear_mapper", "mapper/2d/grid_mapper", "renderer/properties", "tool/active_tool_manager"], function(_, $, Backbone, build_views, safebind, bulk_save, ContinuumView, HasParent, ViewState, LinearMapper, GridMapper, Properties, ActiveToolManager) {
    var GMapPlot, GMapPlotView, GMapPlots, LEVELS, _ref, _ref1, _ref2;
    LEVELS = ['image', 'underlay', 'glyph', 'overlay', 'annotation', 'tool'];
    GMapPlotView = (function(_super) {
      __extends(GMapPlotView, _super);

      function GMapPlotView() {
        this.bounds_change = __bind(this.bounds_change, this);
        this._mousemove = __bind(this._mousemove, this);
        this._mousedown = __bind(this._mousedown, this);
        _ref = GMapPlotView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      GMapPlotView.prototype.events = {
        "mousemove .bokeh_canvas_wrapper": "_mousemove",
        "mousedown .bokeh_canvas_wrapper": "_mousedown"
      };

      GMapPlotView.prototype.className = "bokeh";

      GMapPlotView.prototype.view_options = function() {
        return _.extend({
          plot_model: this.model,
          plot_view: this
        }, this.options);
      };

      GMapPlotView.prototype._mousedown = function(e) {
        var f, _i, _len, _ref1, _results;
        _ref1 = this.mousedownCallbacks;
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          f = _ref1[_i];
          _results.push(f(e, e.layerX, e.layerY));
        }
        return _results;
      };

      GMapPlotView.prototype._mousemove = function(e) {
        var f, _i, _len, _ref1, _results;
        _ref1 = this.moveCallbacks;
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          f = _ref1[_i];
          _results.push(f(e, e.layerX, e.layerY));
        }
        return _results;
      };

      GMapPlotView.prototype.pause = function() {
        return this.is_paused = true;
      };

      GMapPlotView.prototype.unpause = function(render_canvas) {
        if (render_canvas == null) {
          render_canvas = false;
        }
        this.is_paused = false;
        if (render_canvas) {
          return this.request_render_canvas(true);
        } else {
          return this.request_render();
        }
      };

      GMapPlotView.prototype.request_render = function() {
        if (!this.is_paused) {
          this.throttled_render();
        }
      };

      GMapPlotView.prototype.request_render_canvas = function(full_render) {
        if (!this.is_paused) {
          this.throttled_render_canvas(full_render);
        }
      };

      GMapPlotView.prototype.initialize = function(options) {
        var level, tool, _i, _j, _len, _len1, _ref1, _ref10, _ref11, _ref12, _ref13, _ref14, _ref15, _ref16, _ref17, _ref18, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
        GMapPlotView.__super__.initialize.call(this, _.defaults(options, this.default_options));
        this.throttled_render = _.throttle(this.render, 100);
        this.throttled_render_canvas = _.throttle(this.render_canvas, 100);
        this.outline_props = new Properties.line_properties(this, {}, 'title_');
        this.title_props = new Properties.text_properties(this, {}, 'title_');
        this.view_state = new ViewState({
          canvas_width: (_ref1 = options.canvas_width) != null ? _ref1 : this.mget('canvas_width'),
          canvas_height: (_ref2 = options.canvas_height) != null ? _ref2 : this.mget('canvas_height'),
          x_offset: (_ref3 = options.x_offset) != null ? _ref3 : this.mget('x_offset'),
          y_offset: (_ref4 = options.y_offset) != null ? _ref4 : this.mget('y_offset'),
          outer_width: (_ref5 = options.outer_width) != null ? _ref5 : this.mget('outer_width'),
          outer_height: (_ref6 = options.outer_height) != null ? _ref6 : this.mget('outer_height'),
          min_border_top: (_ref7 = (_ref8 = options.min_border_top) != null ? _ref8 : this.mget('min_border_top')) != null ? _ref7 : this.mget('min_border'),
          min_border_bottom: (_ref9 = (_ref10 = options.min_border_bottom) != null ? _ref10 : this.mget('min_border_bottom')) != null ? _ref9 : this.mget('min_border'),
          min_border_left: (_ref11 = (_ref12 = options.min_border_left) != null ? _ref12 : this.mget('min_border_left')) != null ? _ref11 : this.mget('min_border'),
          min_border_right: (_ref13 = (_ref14 = options.min_border_right) != null ? _ref14 : this.mget('min_border_right')) != null ? _ref13 : this.mget('min_border'),
          requested_border_top: 0,
          requested_border_bottom: 0,
          requested_border_left: 0,
          requested_border_right: 0
        });
        this.hidpi = (_ref15 = options.hidpi) != null ? _ref15 : this.mget('hidpi');
        this.x_range = (_ref16 = options.x_range) != null ? _ref16 : this.mget_obj('x_range');
        this.y_range = (_ref17 = options.y_range) != null ? _ref17 : this.mget_obj('y_range');
        this.xmapper = new LinearMapper({
          source_range: this.x_range,
          target_range: this.view_state.get('inner_range_horizontal')
        });
        this.ymapper = new LinearMapper({
          source_range: this.y_range,
          target_range: this.view_state.get('inner_range_vertical')
        });
        this.mapper = new GridMapper({
          domain_mapper: this.xmapper,
          codomain_mapper: this.ymapper
        });
        _ref18 = this.mget_obj('tools');
        for (_i = 0, _len = _ref18.length; _i < _len; _i++) {
          tool = _ref18[_i];
          if (tool.type === "PanTool" || tool.type === "WheelZoomTool") {
            tool.set_obj('dataranges', [this.x_range, this.y_range]);
            tool.set('dimensions', ['width', 'height']);
          }
        }
        this.requested_padding = {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0
        };
        this.old_mapper_state = {
          x: null,
          y: null
        };
        this.am_rendering = false;
        this.renderers = {};
        this.tools = {};
        this.zoom_count = null;
        this.eventSink = _.extend({}, Backbone.Events);
        this.moveCallbacks = [];
        this.mousedownCallbacks = [];
        this.keydownCallbacks = [];
        this.render_init();
        this.render_canvas(false);
        this.atm = new ActiveToolManager(this.eventSink);
        this.levels = {};
        for (_j = 0, _len1 = LEVELS.length; _j < _len1; _j++) {
          level = LEVELS[_j];
          this.levels[level] = {};
        }
        this.build_levels();
        this.request_render();
        this.atm.bind_bokeh_events();
        this.bind_bokeh_events();
        return this;
      };

      GMapPlotView.prototype.map_to_screen = function(x, x_units, y, y_units, units) {
        var sx, sy, _ref1;
        if (x_units === 'screen') {
          sx = x.slice(0);
          sy = y.slice(0);
        } else {
          _ref1 = this.mapper.v_map_to_target(x, y), sx = _ref1[0], sy = _ref1[1];
        }
        sx = this.view_state.v_vx_to_sx(sx);
        sy = this.view_state.v_vy_to_sy(sy);
        return [sx, sy];
      };

      GMapPlotView.prototype.map_from_screen = function(sx, sy, units) {
        var x, y, _ref1;
        sx = this.view_state.v_sx_to_vx(sx.slice(0));
        sy = this.view_state.v_sy_to_vy(sy.slice(0));
        if (units === 'screen') {
          x = sx;
          y = sy;
        } else {
          _ref1 = this.mapper.v_map_from_target(sx, sy), x = _ref1[0], y = _ref1[1];
        }
        return [x, y];
      };

      GMapPlotView.prototype.update_range = function(range_info) {
        var center, ne_lat, ne_lng, sw_lat, sw_lng;
        this.pause();
        if (range_info.sdx != null) {
          this.map.panBy(range_info.sdx, range_info.sdy);
        } else {
          sw_lng = Math.min(range_info.xr.start, range_info.xr.end);
          ne_lng = Math.max(range_info.xr.start, range_info.xr.end);
          sw_lat = Math.min(range_info.yr.start, range_info.yr.end);
          ne_lat = Math.max(range_info.yr.start, range_info.yr.end);
          center = new google.maps.LatLng((ne_lat + sw_lat) / 2, (ne_lng + sw_lng) / 2);
          if (range_info.factor > 0) {
            this.zoom_count += 1;
            if (this.zoom_count === 10) {
              this.map.setZoom(this.map.getZoom() + 1);
              this.zoom_count = 0;
            }
          } else {
            this.zoom_count -= 1;
            if (this.zoom_count === -10) {
              this.map.setCenter(center);
              this.map.setZoom(this.map.getZoom() - 1);
              this.map.setCenter(center);
              this.zoom_count = 0;
            }
          }
        }
        return this.unpause();
      };

      GMapPlotView.prototype.build_tools = function() {
        return build_views(this.tools, this.mget_obj('tools'), this.view_options());
      };

      GMapPlotView.prototype.build_views = function() {
        return build_views(this.renderers, this.mget_obj('renderers'), this.view_options());
      };

      GMapPlotView.prototype.build_levels = function() {
        var level, t, tools, v, views, _i, _j, _len, _len1;
        views = this.build_views();
        tools = this.build_tools();
        for (_i = 0, _len = views.length; _i < _len; _i++) {
          v = views[_i];
          level = v.mget('level');
          this.levels[level][v.model.id] = v;
          v.bind_bokeh_events();
        }
        for (_j = 0, _len1 = tools.length; _j < _len1; _j++) {
          t = tools[_j];
          level = t.mget('level');
          this.levels[level][t.model.id] = t;
          t.bind_bokeh_events();
        }
        return this;
      };

      GMapPlotView.prototype.bind_bokeh_events = function() {
        var _this = this;
        safebind(this, this.view_state, 'change', function() {
          _this.request_render_canvas();
          return _this.request_render();
        });
        safebind(this, this.x_range, 'change', this.request_render);
        safebind(this, this.y_range, 'change', this.request_render);
        safebind(this, this.model, 'change:renderers', this.build_levels);
        safebind(this, this.model, 'change:tool', this.build_levels);
        safebind(this, this.model, 'change', this.request_render);
        return safebind(this, this.model, 'destroy', function() {
          return _this.remove();
        });
      };

      GMapPlotView.prototype.render_init = function() {
        this.$el.append($("<div class='button_bar btn-group'/>\n<div class='plotarea'>\n<div class='bokeh_canvas_wrapper'>\n  <div class=\"bokeh_gmap\"></div>\n  <canvas class='bokeh_canvas'></canvas>\n</div>\n</div>"));
        this.button_bar = this.$el.find('.button_bar');
        this.canvas_wrapper = this.$el.find('.bokeh_canvas_wrapper');
        this.canvas = this.$el.find('canvas.bokeh_canvas');
        return this.gmap_div = this.$el.find('.bokeh_gmap');
      };

      GMapPlotView.prototype.render_canvas = function(full_render) {
        var backingStoreRatio, build_map, devicePixelRatio, ih, iw, left, oh, ow, ratio, top,
          _this = this;
        if (full_render == null) {
          full_render = true;
        }
        this.ctx = this.canvas[0].getContext('2d');
        if (this.hidpi) {
          devicePixelRatio = window.devicePixelRatio || 1;
          backingStoreRatio = this.ctx.webkitBackingStorePixelRatio || this.ctx.mozBackingStorePixelRatio || this.ctx.msBackingStorePixelRatio || this.ctx.oBackingStorePixelRatio || this.ctx.backingStorePixelRatio || 1;
          ratio = devicePixelRatio / backingStoreRatio;
        } else {
          ratio = 1;
        }
        oh = this.view_state.get('outer_height');
        ow = this.view_state.get('outer_width');
        this.canvas.width = ow * ratio;
        this.canvas.height = oh * ratio;
        this.button_bar.attr('style', "width:" + ow + "px;");
        this.canvas_wrapper.attr('style', "width:" + ow + "px; height:" + oh + "px");
        this.canvas.attr('style', "width:" + ow + "px;");
        this.canvas.attr('style', "height:" + oh + "px;");
        this.canvas.attr('width', ow * ratio).attr('height', oh * ratio);
        this.$el.attr("width", ow).attr('height', oh);
        this.ctx.scale(ratio, ratio);
        this.ctx.translate(0.5, 0.5);
        iw = this.view_state.get('inner_width');
        ih = this.view_state.get('inner_height');
        top = this.view_state.get('border_top');
        left = this.view_state.get('border_left');
        console.log(this.gmap_div);
        this.gmap_div.attr("style", "top: " + top + "px; left: " + left + "px; position: absolute");
        this.gmap_div.attr('style', "width:" + iw + "px;");
        this.gmap_div.attr('style', "height:" + ih + "px;");
        this.gmap_div.width("" + iw + "px").height("" + ih + "px");
        build_map = function() {
          var map_options, mo;
          mo = _this.mget('map_options');
          map_options = {
            center: new google.maps.LatLng(mo.lat, mo.lng),
            zoom: mo.zoom,
            disableDefaultUI: true,
            mapTypeId: google.maps.MapTypeId.SATELLITE
          };
          console.log("FOO", _this);
          console.log("FOO", _this.gmap_div);
          console.log("FOO", _this.gmap_div[0]);
          _this.map = new google.maps.Map(_this.gmap_div[0], map_options);
          return google.maps.event.addListener(_this.map, 'bounds_changed', _this.bounds_change);
        };
        _.defer(build_map);
        if (full_render) {
          return this.render();
        }
      };

      GMapPlotView.prototype.bounds_change = function() {
        var bds, ne, sw;
        bds = this.map.getBounds();
        ne = bds.getNorthEast();
        sw = bds.getSouthWest();
        this.x_range.set({
          start: sw.lng(),
          end: ne.lng(),
          silent: true
        });
        return this.y_range.set({
          start: sw.lat(),
          end: ne.lat()
        });
      };

      GMapPlotView.prototype.save_png = function() {
        var data_uri;
        this.render();
        data_uri = this.canvas[0].toDataURL();
        this.model.set('png', this.canvas[0].toDataURL());
        return bulk_save([this.model]);
      };

      GMapPlotView.prototype.render = function(force) {
        var have_new_mapper_state, hpadding, ih, iw, k, left, level, oh, ow, pr, renderers, sx, sy, sym, th, title, top, v, xms, yms, _i, _j, _k, _len, _len1, _len2, _ref1, _ref2, _ref3, _ref4;
        this.requested_padding = {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0
        };
        _ref1 = ['image', 'underlay', 'glyph', 'overlay', 'annotation', 'tool'];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          level = _ref1[_i];
          renderers = this.levels[level];
          for (k in renderers) {
            v = renderers[k];
            if (v.padding_request != null) {
              pr = v.padding_request();
              for (k in pr) {
                v = pr[k];
                this.requested_padding[k] += v;
              }
            }
          }
        }
        title = this.mget('title');
        if (title) {
          this.title_props.set(this.ctx, {});
          th = this.ctx.measureText(this.mget('title')).ascent;
          this.requested_padding['top'] += th + this.mget('title_standoff');
        }
        sym = this.mget('border_symmetry');
        if (sym.indexOf('h') >= 0 || sym.indexOf('H') >= 0) {
          hpadding = Math.max(this.requested_padding['left'], this.requested_padding['right']);
          this.requested_padding['left'] = hpadding;
          this.requested_padding['right'] = hpadding;
        }
        if (sym.indexOf('v') >= 0 || sym.indexOf('V') >= 0) {
          hpadding = Math.max(this.requested_padding['top'], this.requested_padding['bottom']);
          this.requested_padding['top'] = hpadding;
          this.requested_padding['bottom'] = hpadding;
        }
        this.is_paused = true;
        _ref2 = this.requested_padding;
        for (k in _ref2) {
          v = _ref2[k];
          this.view_state.set("requested_border_" + k, v);
        }
        this.is_paused = false;
        oh = this.view_state.get('outer_height');
        ow = this.view_state.get('outer_width');
        iw = this.view_state.get('inner_width');
        ih = this.view_state.get('inner_height');
        top = this.view_state.get('border_top');
        left = this.view_state.get('border_left');
        this.gmap_div.attr("style", "top: " + top + "px; left: " + left + "px;");
        this.gmap_div.width("" + iw + "px").height("" + ih + "px");
        this.ctx.clearRect(0, 0, ow, oh);
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(0, oh);
        this.ctx.lineTo(ow, oh);
        this.ctx.lineTo(ow, 0);
        this.ctx.lineTo(0, 0);
        this.ctx.moveTo(left, top);
        this.ctx.lineTo(left + iw, top);
        this.ctx.lineTo(left + iw, top + ih);
        this.ctx.lineTo(left, top + ih);
        this.ctx.lineTo(left, top);
        this.ctx.closePath();
        this.ctx.fillStyle = this.mget('border_fill');
        this.ctx.fill();
        if (this.outline_props.do_stroke) {
          this.outline_props.set(this.ctx, {});
          this.ctx.strokeRect(this.view_state.get('border_left'), this.view_state.get('border_top'), this.view_state.get('inner_width'), this.view_state.get('inner_height'));
        }
        have_new_mapper_state = false;
        xms = this.xmapper.get('mapper_state')[0];
        yms = this.xmapper.get('mapper_state')[0];
        if (Math.abs(this.old_mapper_state.x - xms) > 1e-8 || Math.abs(this.old_mapper_state.y - yms) > 1e-8) {
          this.old_mapper_state.x = xms;
          this.old_mapper_state.y = yms;
          have_new_mapper_state = true;
        }
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(this.view_state.get('border_left'), this.view_state.get('border_top'), this.view_state.get('inner_width'), this.view_state.get('inner_height'));
        this.ctx.clip();
        this.ctx.beginPath();
        _ref3 = ['image', 'underlay', 'glyph'];
        for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
          level = _ref3[_j];
          renderers = this.levels[level];
          for (k in renderers) {
            v = renderers[k];
            v.render(have_new_mapper_state);
          }
        }
        this.ctx.restore();
        _ref4 = ['overlay', 'annotation', 'tool'];
        for (_k = 0, _len2 = _ref4.length; _k < _len2; _k++) {
          level = _ref4[_k];
          renderers = this.levels[level];
          for (k in renderers) {
            v = renderers[k];
            v.render(have_new_mapper_state);
          }
        }
        if (title) {
          sx = this.view_state.get('outer_width') / 2;
          sy = th;
          this.title_props.set(this.ctx, {});
          return this.ctx.fillText(title, sx, sy);
        }
      };

      return GMapPlotView;

    })(ContinuumView.View);
    GMapPlot = (function(_super) {
      __extends(GMapPlot, _super);

      function GMapPlot() {
        _ref1 = GMapPlot.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      GMapPlot.prototype.type = 'GMapPlot';

      GMapPlot.prototype.default_view = GMapPlotView;

      GMapPlot.prototype.add_renderers = function(new_renderers) {
        var renderers;
        renderers = this.get('renderers');
        renderers = renderers.concat(new_renderers);
        return this.set('renderers', renderers);
      };

      GMapPlot.prototype.parent_properties = ['border_fill', 'canvas_width', 'canvas_height', 'outer_width', 'outer_height', 'min_border', 'min_border_top', 'min_border_bottom', 'min_border_left', 'min_border_right'];

      GMapPlot.prototype.defaults = function() {
        return {
          data_sources: {},
          renderers: [],
          tools: [],
          title: 'GMapPlot'
        };
      };

      GMapPlot.prototype.display_defaults = function() {
        return {
          hidpi: true,
          border_fill: "#eee",
          border_symmetry: 'h',
          min_border: 40,
          x_offset: 0,
          y_offset: 0,
          canvas_width: 300,
          canvas_height: 300,
          outer_width: 300,
          outer_height: 300,
          title_standoff: 8,
          title_text_font: "helvetica",
          title_text_font_size: "20pt",
          title_text_font_style: "normal",
          title_text_color: "#444444",
          title_text_alpha: 1.0,
          title_text_align: "center",
          title_text_baseline: "alphabetic",
          outline_line_color: '#aaaaaa',
          outline_line_width: 1,
          outline_line_alpha: 1.0,
          outline_line_join: 'miter',
          outline_line_cap: 'butt',
          outline_line_dash: [],
          outline_line_dash_offset: 0
        };
      };

      return GMapPlot;

    })(HasParent);
    GMapPlots = (function(_super) {
      __extends(GMapPlots, _super);

      function GMapPlots() {
        _ref2 = GMapPlots.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      GMapPlots.prototype.model = GMapPlot;

      return GMapPlots;

    })(Backbone.Collection);
    return {
      "Model": GMapPlot,
      "Collection": new GMapPlots(),
      "View": GMapPlotView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=gmap_plot.js.map
*/;
(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('common/grid_view_state',["underscore", "./safebind", "./view_state"], function(_, safebind, ViewState) {
    var GridViewState, _ref;
    GridViewState = (function(_super) {
      __extends(GridViewState, _super);

      function GridViewState() {
        this.layout_widths = __bind(this.layout_widths, this);
        this.layout_heights = __bind(this.layout_heights, this);
        this.setup_layout_properties = __bind(this.setup_layout_properties, this);
        _ref = GridViewState.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      GridViewState.prototype.setup_layout_properties = function() {
        var row, viewstate, _i, _len, _ref1, _results;
        this.register_property('layout_heights', this.layout_heights, true);
        this.register_property('layout_widths', this.layout_widths, true);
        _ref1 = this.get('childviewstates');
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          row = _ref1[_i];
          _results.push((function() {
            var _j, _len1, _results1;
            _results1 = [];
            for (_j = 0, _len1 = row.length; _j < _len1; _j++) {
              viewstate = row[_j];
              this.add_dependencies('layout_heights', viewstate, 'outer_height');
              _results1.push(this.add_dependencies('layout_widths', viewstate, 'outer_width'));
            }
            return _results1;
          }).call(this));
        }
        return _results;
      };

      GridViewState.prototype.initialize = function(attrs, options) {
        GridViewState.__super__.initialize.call(this, attrs, options);
        this.setup_layout_properties();
        safebind(this, this, 'change:childviewstates', this.setup_layout_properties);
        this.register_property('height', function() {
          return _.reduce(this.get('layout_heights'), (function(x, y) {
            return x + y;
          }), 0);
        }, true);
        this.add_dependencies('height', this, 'layout_heights');
        this.register_property('width', function() {
          return _.reduce(this.get('layout_widths'), (function(x, y) {
            return x + y;
          }), 0);
        }, true);
        return this.add_dependencies('width', this, 'layout_widths');
      };

      GridViewState.prototype.position_child_x = function(offset, childsize) {
        return offset;
      };

      GridViewState.prototype.position_child_y = function(offset, childsize) {
        return this.get('height') - offset - childsize;
      };

      GridViewState.prototype.maxdim = function(dim, row) {
        if (row.length === 0) {
          return 0;
        } else {
          return _.max(_.map(row, (function(x) {
            return x.get(dim);
          })));
        }
      };

      GridViewState.prototype.layout_heights = function() {
        var row, row_heights;
        row_heights = (function() {
          var _i, _len, _ref1, _results;
          _ref1 = this.get('childviewstates');
          _results = [];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            row = _ref1[_i];
            _results.push(this.maxdim('outer_height', row));
          }
          return _results;
        }).call(this);
        return row_heights;
      };

      GridViewState.prototype.layout_widths = function() {
        var col, col_widths, columns, n, num_cols, row;
        num_cols = this.get('childviewstates')[0].length;
        columns = (function() {
          var _i, _len, _ref1, _results;
          _ref1 = _.range(num_cols);
          _results = [];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            n = _ref1[_i];
            _results.push((function() {
              var _j, _len1, _ref2, _results1;
              _ref2 = this.get('childviewstates');
              _results1 = [];
              for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
                row = _ref2[_j];
                _results1.push(row[n]);
              }
              return _results1;
            }).call(this));
          }
          return _results;
        }).call(this);
        col_widths = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = columns.length; _i < _len; _i++) {
            col = columns[_i];
            _results.push(this.maxdim('outer_width', col));
          }
          return _results;
        }).call(this);
        return col_widths;
      };

      GridViewState.prototype.defaults = function() {
        return {
          childviewstates: [[]],
          border_space: 0
        };
      };

      return GridViewState;

    })(ViewState);
    return GridViewState;
  });

}).call(this);

/*
//@ sourceMappingURL=grid_view_state.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('common/grid_plot',["underscore", "backbone", "./build_views", "./safebind", "./continuum_view", "./has_parent", "./grid_view_state", "mapper/1d/linear_mapper", "mapper/2d/grid_mapper", "renderer/properties", "tool/active_tool_manager"], function(_, Backbone, build_views, safebind, ContinuumView, HasParent, GridViewState, LinearMapper, GridMapper, Properties, ActiveToolManager) {
    var GridPlot, GridPlotView, GridPlots, _ref, _ref1, _ref2;
    GridPlotView = (function(_super) {
      __extends(GridPlotView, _super);

      function GridPlotView() {
        _ref = GridPlotView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      GridPlotView.prototype.tagName = 'div';

      GridPlotView.prototype.className = "bokeh grid_plot";

      GridPlotView.prototype.default_options = {
        scale: 1.0
      };

      GridPlotView.prototype.set_child_view_states = function() {
        var row, viewstaterow, viewstates, x, _i, _len, _ref1;
        viewstates = [];
        _ref1 = this.mget('children');
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          row = _ref1[_i];
          viewstaterow = (function() {
            var _j, _len1, _results;
            _results = [];
            for (_j = 0, _len1 = row.length; _j < _len1; _j++) {
              x = row[_j];
              _results.push(this.childviews[x.id].view_state);
            }
            return _results;
          }).call(this);
          viewstates.push(viewstaterow);
        }
        return this.viewstate.set('childviewstates', viewstates);
      };

      GridPlotView.prototype.initialize = function(options) {
        GridPlotView.__super__.initialize.call(this, _.defaults(options, this.default_options));
        this.viewstate = new GridViewState();
        this.toolbar_height = 0;
        this.childviews = {};
        this.build_children();
        this.bind_bokeh_events();
        this.render();
        return this;
      };

      GridPlotView.prototype.bind_bokeh_events = function() {
        var _this = this;
        safebind(this, this.model, 'change:children', this.build_children);
        safebind(this, this.model, 'change', this.render);
        safebind(this, this.viewstate, 'change', this.render);
        return safebind(this, this.model, 'destroy', function() {
          return _this.remove();
        });
      };

      GridPlotView.prototype.b_events = {
        "change:children model": "build_children",
        "change model": "render",
        "change viewstate": "render",
        "destroy model": "remove"
      };

      GridPlotView.prototype.build_children = function() {
        var childmodels, plot, row, _i, _j, _len, _len1, _ref1;
        childmodels = [];
        _ref1 = this.mget_obj('children');
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          row = _ref1[_i];
          for (_j = 0, _len1 = row.length; _j < _len1; _j++) {
            plot = row[_j];
            childmodels.push(plot);
          }
        }
        build_views(this.childviews, childmodels, {});
        return this.set_child_view_states();
      };

      GridPlotView.prototype.makeButton = function(eventSink, constructor, toolbar_div, button_name) {
        var all_tools, button, button_activated, specific_tools, tool_active;
        all_tools = _.flatten(_.map(_.pluck(this.childviews, 'tools'), _.values));
        specific_tools = _.where(all_tools, {
          constructor: constructor
        });
        button = $("<button class='btn btn-small'>" + button_name + "</button>");
        toolbar_div.append(button);
        tool_active = false;
        button_activated = false;
        button.click(function() {
          if (button_activated) {
            return eventSink.trigger('clear_active_tool');
          } else {
            return eventSink.trigger('active_tool', button_name);
          }
        });
        eventSink.on("" + button_name + ":deactivated", function() {
          button.removeClass('active');
          button_activated = false;
          return _.each(specific_tools, function(t) {
            var t_name;
            t_name = t.evgen.toolName;
            return t.evgen.eventSink.trigger("" + t_name + ":deactivated");
          });
        });
        return eventSink.on("" + button_name + ":activated", function() {
          button.addClass('active');
          button_activated = true;
          return _.each(specific_tools, function(t) {
            var t_name;
            t_name = t.evgen.toolName;
            return t.evgen.eventSink.trigger("" + t_name + ":activated");
          });
        });
      };

      GridPlotView.prototype.addGridToolbar = function() {
        var all_tool_classes, all_tools, tool_name_dict,
          _this = this;
        this.button_bar = $("<div class='grid_button_bar'/>");
        this.button_bar.attr('style', "position:absolute; left:10px; top:0px; ");
        this.toolEventSink = _.extend({}, Backbone.Events);
        this.atm = new ActiveToolManager(this.toolEventSink);
        this.atm.bind_bokeh_events();
        this.$el.append(this.button_bar);
        all_tools = _.flatten(_.map(_.pluck(this.childviews, 'tools'), _.values));
        all_tool_classes = _.uniq(_.pluck(all_tools, 'constructor'));
        if (all_tool_classes.length > 0) {
          this.toolbar_height = 35;
        }
        tool_name_dict = {};
        _.each(all_tool_classes, function(klass) {
          var btext;
          btext = _.where(all_tools, {
            constructor: klass
          })[0].evgen_options.buttonText;
          return tool_name_dict[btext] = klass;
        });
        _.map(tool_name_dict, function(klass, button_text) {
          return _this.makeButton(_this.toolEventSink, klass, _this.button_bar, button_text);
        });
        return _.map(all_tools, function(t) {
          return t.evgen.hide_button();
        });
      };

      GridPlotView.prototype.render = function() {
        var add, cidx, col_widths, height, last_plot, plot_divs, plot_wrapper, plotspec, ridx, row, row_heights, total_height, view, width, x_coords, xpos, y_coords, ypos, _i, _j, _k, _len, _len1, _len2, _ref1, _ref2;
        GridPlotView.__super__.render.call(this);
        _ref1 = _.values(this.childviews);
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          view = _ref1[_i];
          view.$el.detach();
        }
        this.$el.html('');
        this.addGridToolbar();
        row_heights = this.viewstate.get('layout_heights');
        col_widths = this.viewstate.get('layout_widths');
        y_coords = [0];
        _.reduceRight(row_heights.slice(1), function(x, y) {
          var val;
          val = x + y;
          y_coords.push(val);
          return val;
        }, 0);
        y_coords.reverse();
        x_coords = [0];
        _.reduce(col_widths.slice(0), function(x, y) {
          var val;
          val = x + y;
          x_coords.push(val);
          return val;
        }, 0);
        plot_divs = [];
        last_plot = null;
        _ref2 = this.mget('children');
        for (ridx = _j = 0, _len1 = _ref2.length; _j < _len1; ridx = ++_j) {
          row = _ref2[ridx];
          for (cidx = _k = 0, _len2 = row.length; _k < _len2; cidx = ++_k) {
            plotspec = row[cidx];
            view = this.childviews[plotspec.id];
            ypos = this.viewstate.position_child_y(y_coords[ridx], view.view_state.get('outer_height') - this.toolbar_height);
            xpos = this.viewstate.position_child_x(x_coords[cidx], view.view_state.get('outer_width'));
            plot_wrapper = $("<div class='gp_plotwrapper'></div>");
            plot_wrapper.attr('style', "position: absolute; left:" + xpos + "px; top:" + ypos + "px");
            plot_wrapper.append(view.$el);
            this.$el.append(plot_wrapper);
          }
        }
        add = function(a, b) {
          return a + b;
        };
        total_height = _.reduce(row_heights, add, 0);
        height = total_height + this.toolbar_height;
        width = this.viewstate.get('outerwidth');
        this.$el.attr('style', "position:relative; height:" + height + "px;width:" + width + "px");
        return this.render_end();
      };

      return GridPlotView;

    })(ContinuumView.View);
    GridPlot = (function(_super) {
      __extends(GridPlot, _super);

      function GridPlot() {
        _ref1 = GridPlot.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      GridPlot.prototype.type = 'GridPlot';

      GridPlot.prototype.default_view = GridPlotView;

      GridPlot.prototype.defaults = function() {
        return {
          children: [[]],
          border_space: 0
        };
      };

      return GridPlot;

    })(HasParent);
    GridPlots = (function(_super) {
      __extends(GridPlots, _super);

      function GridPlots() {
        _ref2 = GridPlots.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      GridPlots.prototype.model = GridPlot;

      return GridPlots;

    })(Backbone.Collection);
    return {
      "Model": GridPlot,
      "Collection": new GridPlots(),
      "View": GridPlotView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=grid_plot.js.map
*/;
(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('common/plot_context',["underscore", "backbone", "./build_views", "./safebind", "./has_parent", "./continuum_view"], function(_, Backbone, build_views, safebind, HasParent, ContinuumView) {
    var PlotContext, PlotContextView, PlotContexts, _ref, _ref1, _ref2;
    PlotContextView = (function(_super) {
      __extends(PlotContextView, _super);

      function PlotContextView() {
        this.removeplot = __bind(this.removeplot, this);
        this.closeall = __bind(this.closeall, this);
        _ref = PlotContextView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      PlotContextView.prototype.initialize = function(options) {
        this.views = {};
        this.views_rendered = [false];
        this.child_models = [];
        PlotContextView.__super__.initialize.call(this, options);
        return this.render();
      };

      PlotContextView.prototype.delegateEvents = function() {
        safebind(this, this.model, 'destroy', this.remove);
        safebind(this, this.model, 'change', this.render);
        return PlotContextView.__super__.delegateEvents.call(this);
      };

      PlotContextView.prototype.build_children = function() {
        var created_views;
        created_views = build_views(this.views, this.mget_obj('children'), {});
        window.pc_created_views = created_views;
        window.pc_views = this.views;
        return null;
      };

      PlotContextView.prototype.events = {
        'click .plotclose': 'removeplot',
        'click .closeall': 'closeall'
      };

      PlotContextView.prototype.size_textarea = function(textarea) {
        var scrollHeight;
        scrollHeight = $(textarea).height(0).prop('scrollHeight');
        return $(textarea).height(scrollHeight);
      };

      PlotContextView.prototype.closeall = function(e) {
        this.mset('children', []);
        return this.model.save();
      };

      PlotContextView.prototype.removeplot = function(e) {
        var newchildren, plotnum, s_pc, view, x;
        plotnum = parseInt($(e.currentTarget).parent().attr('data-plot_num'));
        s_pc = this.model.resolve_ref(this.mget('children')[plotnum]);
        view = this.views[s_pc.get('id')];
        view.remove();
        newchildren = (function() {
          var _i, _len, _ref1, _results;
          _ref1 = this.mget('children');
          _results = [];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            x = _ref1[_i];
            if (x.id !== view.model.id) {
              _results.push(x);
            }
          }
          return _results;
        }).call(this);
        this.mset('children', newchildren);
        this.model.save();
        return false;
      };

      PlotContextView.prototype.render = function() {
        var index, key, modelref, node, numplots, tab_names, to_render, val, view, _i, _len, _ref1, _ref2,
          _this = this;
        PlotContextView.__super__.render.call(this);
        this.build_children();
        _ref1 = this.views;
        for (key in _ref1) {
          if (!__hasProp.call(_ref1, key)) continue;
          val = _ref1[key];
          val.$el.detach();
        }
        this.$el.html('');
        numplots = _.keys(this.views).length;
        this.$el.append("<div>You have " + numplots + " plots</div>");
        this.$el.append("<div><a class='closeall' href='#'>Close All Plots</a></div>");
        this.$el.append("<br/>");
        to_render = [];
        tab_names = {};
        _ref2 = this.mget('children');
        for (index = _i = 0, _len = _ref2.length; _i < _len; index = ++_i) {
          modelref = _ref2[index];
          view = this.views[modelref.id];
          node = $("<div class='jsp' data-plot_num='" + index + "'></div>");
          this.$el.append(node);
          node.append($("<a class='plotclose'>[close]</a>"));
          node.append(view.el);
        }
        _.defer(function() {
          var textarea, _j, _len1, _ref3, _results;
          _ref3 = _this.$el.find('.plottitle');
          _results = [];
          for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
            textarea = _ref3[_j];
            _results.push(_this.size_textarea($(textarea)));
          }
          return _results;
        });
        return null;
      };

      return PlotContextView;

    })(ContinuumView.View);
    PlotContext = (function(_super) {
      __extends(PlotContext, _super);

      function PlotContext() {
        _ref1 = PlotContext.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      PlotContext.prototype.type = 'PlotContext';

      PlotContext.prototype.default_view = PlotContextView;

      PlotContext.prototype.url = function() {
        return PlotContext.__super__.url.call(this);
      };

      PlotContext.prototype.defaults = function() {
        return {
          children: [],
          render_loop: true
        };
      };

      return PlotContext;

    })(HasParent);
    PlotContexts = (function(_super) {
      __extends(PlotContexts, _super);

      function PlotContexts() {
        _ref2 = PlotContexts.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      PlotContexts.prototype.model = PlotContext;

      return PlotContexts;

    })(Backbone.Collection);
    return {
      "Model": PlotContext,
      "Collection": new PlotContexts(),
      "View": PlotContextView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=plot_context.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('range/data_range1d',["underscore", "backbone", "range/range1d"], function(_, Backbone, Range1d) {
    var DataRange1d, DataRange1ds, _ref, _ref1;
    DataRange1d = (function(_super) {
      __extends(DataRange1d, _super);

      function DataRange1d() {
        _ref = DataRange1d.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      DataRange1d.prototype.type = 'DataRange1d';

      DataRange1d.prototype._get_minmax = function() {
        var center, colname, columns, max, min, source, sourceobj, span, _i, _j, _len, _len1, _ref1, _ref2, _ref3, _ref4;
        columns = [];
        _ref1 = this.get('sources');
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          source = _ref1[_i];
          sourceobj = this.resolve_ref(source['ref']);
          _ref2 = source['columns'];
          for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
            colname = _ref2[_j];
            columns.push(sourceobj.getcolumn(colname));
          }
        }
        columns = _.flatten(columns);
        columns = _.filter(columns, function(x) {
          return typeof x !== "string";
        });
        columns = _.reject(columns, function(x) {
          return isNaN(x);
        });
        _ref3 = [_.min(columns), _.max(columns)], min = _ref3[0], max = _ref3[1];
        if (max !== min) {
          span = (max - min) * (1 + this.get('rangepadding'));
        } else {
          if (max !== 0) {
            span = Math.abs(max) * (1 + this.get('rangepadding'));
          } else {
            span = 2;
          }
        }
        center = (max + min) / 2.0;
        _ref4 = [center - span / 2.0, center + span / 2.0], min = _ref4[0], max = _ref4[1];
        return [min, max];
      };

      DataRange1d.prototype._get_start = function() {
        if (!_.isNullOrUndefined(this.get('_start'))) {
          return this.get('_start');
        } else {
          return this.get('minmax')[0];
        }
      };

      DataRange1d.prototype._set_start = function(start) {
        return this.set('_start', start);
      };

      DataRange1d.prototype._get_end = function() {
        if (!_.isNullOrUndefined(this.get('_end'))) {
          return this.get('_end');
        } else {
          return this.get('minmax')[1];
        }
      };

      DataRange1d.prototype._set_end = function(end) {
        return this.set('_end', end);
      };

      DataRange1d.prototype.dinitialize = function(attrs, options) {
        var source, _i, _len, _ref1;
        this.register_property('minmax', this._get_minmax, true);
        this.add_dependencies('minmax', this, ['sources'], ['rangepadding']);
        _ref1 = this.get('sources');
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          source = _ref1[_i];
          source = this.resolve_ref(source.ref);
          this.add_dependencies('minmax', source, 'data');
        }
        this.register_property('start', this._get_start, true);
        this.register_setter('start', this._set_start);
        this.add_dependencies('start', this, ['minmax', '_start']);
        this.register_property('end', this._get_end, true);
        this.register_setter('end', this._set_end);
        this.add_dependencies('end', this, ['minmax', '_end']);
        return DataRange1d.__super__.dinitialize.call(this, attrs, options);
      };

      DataRange1d.prototype.defaults = function() {
        return {
          sources: [],
          rangepadding: 0.1
        };
      };

      return DataRange1d;

    })(Range1d.Model);
    DataRange1ds = (function(_super) {
      __extends(DataRange1ds, _super);

      function DataRange1ds() {
        _ref1 = DataRange1ds.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      DataRange1ds.prototype.model = DataRange1d;

      return DataRange1ds;

    })(Backbone.Collection);
    return {
      "Model": DataRange1d,
      "Collection": new DataRange1ds()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=data_range1d.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('range/factor_range',["backbone", "common/has_properties"], function(Backbone, HasProperties) {
    var FactorRange, FactorRanges, _ref, _ref1;
    FactorRange = (function(_super) {
      __extends(FactorRange, _super);

      function FactorRange() {
        _ref = FactorRange.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      FactorRange.prototype.type = 'FactorRange';

      FactorRange.prototype.defaults = function() {
        return {
          values: []
        };
      };

      return FactorRange;

    })(HasProperties);
    FactorRanges = (function(_super) {
      __extends(FactorRanges, _super);

      function FactorRanges() {
        _ref1 = FactorRanges.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      FactorRanges.prototype.model = FactorRange;

      return FactorRanges;

    })(Backbone.Collection);
    return {
      "Model": FactorRange,
      "Collection": new FactorRanges()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=factor_range.js.map
*/;
(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('range/data_factor_range',["underscore", "backbone", "range/factor_range"], function(_, Backbone, FactorRange) {
    var DataFactorRange, DataFactorRanges, _ref, _ref1;
    DataFactorRange = (function(_super) {
      __extends(DataFactorRange, _super);

      function DataFactorRange() {
        this._get_values = __bind(this._get_values, this);
        _ref = DataFactorRange.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      DataFactorRange.prototype.type = 'DataFactorRange';

      DataFactorRange.prototype._get_values = function() {
        var columns, temp, uniques, val, x, _i, _len;
        columns = (function() {
          var _i, _len, _ref1, _results;
          _ref1 = this.get('columns');
          _results = [];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            x = _ref1[_i];
            _results.push(this.get_obj('data_source').getcolumn(x));
          }
          return _results;
        }).call(this);
        columns = _.reduce(columns, (function(x, y) {
          return x.concat(y);
        }), []);
        temp = {};
        for (_i = 0, _len = columns.length; _i < _len; _i++) {
          val = columns[_i];
          temp[val] = true;
        }
        uniques = _.keys(temp);
        uniques = _.sortBy(uniques, (function(x) {
          return x;
        }));
        return uniques;
      };

      DataFactorRange.prototype.dinitialize = function(attrs, options) {
        DataFactorRange.__super__.dinitialize.call(this, attrs, options);
        this.register_property;
        this.register_property('values', this._get_values, true);
        this.add_dependencies('values', this, ['data_source', 'columns']);
        return this.add_dependencies('values', this.get_obj('data_source'), ['data_source', 'columns']);
      };

      DataFactorRange.prototype.defaults = function() {
        return {
          values: [],
          columns: [],
          data_source: null
        };
      };

      return DataFactorRange;

    })(FactorRange.Model);
    DataFactorRanges = (function(_super) {
      __extends(DataFactorRanges, _super);

      function DataFactorRanges() {
        _ref1 = DataFactorRanges.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      DataFactorRanges.prototype.model = DataFactorRange;

      return DataFactorRanges;

    })(Backbone.Collection);
    return {
      "Model": DataFactorRange,
      "Collection": new DataFactorRanges
    };
  });

}).call(this);

/*
//@ sourceMappingURL=data_factor_range.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('common/plot_widget',["./continuum_view", "./safebind"], function(ContinuumView, safebind) {
    var PlotWidget, _ref;
    return PlotWidget = (function(_super) {
      __extends(PlotWidget, _super);

      function PlotWidget() {
        _ref = PlotWidget.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      PlotWidget.prototype.tagName = 'div';

      PlotWidget.prototype.initialize = function(options) {
        this.plot_model = options.plot_model;
        this.plot_view = options.plot_view;
        this._fixup_line_dash(this.plot_view.ctx);
        this._fixup_line_dash_offset(this.plot_view.ctx);
        this._fixup_image_smoothing(this.plot_view.ctx);
        this._fixup_measure_text(this.plot_view.ctx);
        return PlotWidget.__super__.initialize.call(this, options);
      };

      PlotWidget.prototype._fixup_line_dash = function(ctx) {
        if (!ctx.setLineDash) {
          ctx.setLineDash = function(dash) {
            ctx.mozDash = dash;
            return ctx.webkitLineDash = dash;
          };
        }
        if (!ctx.getLineDash) {
          return ctx.getLineDash = function() {
            return ctx.mozDash;
          };
        }
      };

      PlotWidget.prototype._fixup_line_dash_offset = function(ctx) {
        ctx.setLineDashOffset = function(dash_offset) {
          ctx.lineDashOffset = dash_offset;
          ctx.mozDashOffset = dash_offset;
          return ctx.webkitLineDashOffset = dash_offset;
        };
        return ctx.getLineDashOffset = function() {
          return ctx.mozDashOffset;
        };
      };

      PlotWidget.prototype._fixup_image_smoothing = function(ctx) {
        ctx.setImageSmoothingEnabled = function(value) {
          ctx.imageSmoothingEnabled = value;
          ctx.mozImageSmoothingEnabled = value;
          ctx.oImageSmoothingEnabled = value;
          return ctx.webkitImageSmoothingEnabled = value;
        };
        return ctx.getImageSmoothingEnabled = function() {
          var _ref1;
          return (_ref1 = ctx.imageSmoothingEnabled) != null ? _ref1 : true;
        };
      };

      PlotWidget.prototype._fixup_measure_text = function(ctx) {
        if (ctx.measureText && (ctx.html5MeasureText == null)) {
          ctx.html5MeasureText = ctx.measureText;
          return ctx.measureText = function(text) {
            var textMetrics;
            textMetrics = ctx.html5MeasureText(text);
            textMetrics.ascent = ctx.html5MeasureText("m").width * 1.6;
            return textMetrics;
          };
        }
      };

      PlotWidget.prototype.bind_bokeh_events = function() {};

      PlotWidget.prototype.request_render = function() {
        return this.plot_view.request_render();
      };

      return PlotWidget;

    })(ContinuumView.View);
  });

}).call(this);

/*
//@ sourceMappingURL=plot_widget.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  define('renderer/glyph/glyph',["underscore", "common/has_parent", "common/plot_widget", "renderer/properties"], function(_, HasParent, PlotWidget, Properties) {
    var Glyph, GlyphView, _ref, _ref1;
    GlyphView = (function(_super) {
      __extends(GlyphView, _super);

      function GlyphView() {
        _ref = GlyphView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      GlyphView.prototype.initialize = function(options) {
        var spec;
        GlyphView.__super__.initialize.call(this, options);
        this.need_set_data = true;
        this.glyph_props = this.init_glyph(this.mget('glyphspec'));
        this.have_selection_props = false;
        if (this.mget('selection_glyphspec')) {
          spec = _.extend({}, this.mget('glyphspec'), this.mget('selection_glyphspec'));
          this.selection_glyphprops = this.init_glyph(spec);
          this.have_selection_props = true;
        } else {
          this.selection_glyphprops = this.glyph_props;
        }
        if (this.mget('nonselection_glyphspec')) {
          spec = _.extend({}, this.mget('glyphspec'), this.mget('nonselection_glyphspec'));
          this.nonselection_glyphprops = this.init_glyph(spec);
          return this.have_selection_props = true;
        } else {
          return this.nonselection_glyphprops = this.glyph_props;
        }
      };

      GlyphView.prototype.init_glyph = function(glyphspec) {
        var glyph_props, props;
        props = {};
        if (__indexOf.call(this._properties, 'line') >= 0) {
          props['line_properties'] = new Properties.line_properties(this, glyphspec);
        }
        if (__indexOf.call(this._properties, 'fill') >= 0) {
          props['fill_properties'] = new Properties.fill_properties(this, glyphspec);
        }
        if (__indexOf.call(this._properties, 'text') >= 0) {
          props['text_properties'] = new Properties.text_properties(this, glyphspec);
        }
        glyph_props = new Properties.glyph_properties(this, glyphspec, this._fields, props);
        return glyph_props;
      };

      GlyphView.prototype.set_data = function(request_render) {
        var dir, field, i, junk, len, source, values, x, _i, _j, _k, _len, _ref1, _ref2, _ref3, _results;
        if (request_render == null) {
          request_render = true;
        }
        source = this.mget_obj('data_source');
        _ref1 = this._fields;
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          field = _ref1[_i];
          if (field.indexOf(":") > -1) {
            _ref2 = field.split(":"), field = _ref2[0], junk = _ref2[1];
          }
          this[field] = this.glyph_props.source_v_select(field, source);
          if (field === "direction") {
            values = new Uint8Array(this.direction.length);
            for (i = _j = 0, _ref3 = this.direction.length; 0 <= _ref3 ? _j < _ref3 : _j > _ref3; i = 0 <= _ref3 ? ++_j : --_j) {
              dir = this.direction[i];
              if (dir === 'clock') {
                values[i] = false;
              } else if (dir === 'anticlock') {
                values[i] = true;
              } else {
                values = NaN;
              }
            }
            this.direction = values;
          }
          if (field.indexOf("angle") > -1) {
            this[field] = (function() {
              var _k, _len1, _ref4, _results;
              _ref4 = this[field];
              _results = [];
              for (_k = 0, _len1 = _ref4.length; _k < _len1; _k++) {
                x = _ref4[_k];
                _results.push(-x);
              }
              return _results;
            }).call(this);
          }
        }
        if (this._set_data != null) {
          this._set_data();
        }
        len = this[field].length;
        this.all_indices = (function() {
          _results = [];
          for (var _k = 0; 0 <= len ? _k < len : _k > len; 0 <= len ? _k++ : _k--){ _results.push(_k); }
          return _results;
        }).apply(this);
        this.have_new_data = true;
        if (request_render) {
          return this.request_render();
        }
      };

      GlyphView.prototype.render = function(have_new_mapper_state) {
        var ctx, do_render, i, idx, indices, nonselected, selected, selected_mask, _i, _j, _len, _len1,
          _this = this;
        if (have_new_mapper_state == null) {
          have_new_mapper_state = true;
        }
        if (this.need_set_data) {
          this.set_data(false);
          this.need_set_data = false;
        }
        this._map_data();
        if (this._mask_data != null) {
          indices = this._mask_data();
        } else {
          indices = this.all_indices;
        }
        ctx = this.plot_view.ctx;
        ctx.save();
        do_render = function(ctx, indices, glyph_props) {
          var source;
          source = _this.mget_obj('data_source');
          if (_this.have_new_data) {
            if ((glyph_props.fill_properties != null) && glyph_props.fill_properties.do_fill) {
              glyph_props.fill_properties.set_prop_cache(source);
            }
            if ((glyph_props.line_properties != null) && glyph_props.line_properties.do_stroke) {
              glyph_props.line_properties.set_prop_cache(source);
            }
            if (glyph_props.text_properties != null) {
              glyph_props.text_properties.set_prop_cache(source);
            }
          }
          return _this._render(ctx, indices, glyph_props);
        };
        selected = this.mget_obj('data_source').get('selected');
        if (selected && selected.length && this.have_selection_props) {
          selected_mask = (function() {
            var _i, _len, _ref1, _results;
            _ref1 = this.all_indices;
            _results = [];
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              i = _ref1[_i];
              _results.push(false);
            }
            return _results;
          }).call(this);
          for (_i = 0, _len = selected.length; _i < _len; _i++) {
            idx = selected[_i];
            selected_mask[idx] = true;
          }
          selected = new Array();
          nonselected = new Array();
          for (_j = 0, _len1 = indices.length; _j < _len1; _j++) {
            i = indices[_j];
            if (selected_mask[i]) {
              selected.push(i);
            } else {
              nonselected.push(i);
            }
          }
          do_render(ctx, selected, this.selection_glyphprops);
          do_render(ctx, nonselected, this.nonselection_glyphprops);
        } else {
          do_render(ctx, indices, this.glyph_props);
        }
        this.have_new_data = false;
        return ctx.restore();
      };

      GlyphView.prototype.xrange = function() {
        return this.plot_view.x_range;
      };

      GlyphView.prototype.yrange = function() {
        return this.plot_view.y_range;
      };

      GlyphView.prototype.bind_bokeh_events = function() {
        this.listenTo(this.model, 'change', this.request_render);
        return this.listenTo(this.mget_obj('data_source'), 'change', this.set_data);
      };

      GlyphView.prototype.distance = function(data, pt, span, position) {
        var d, halfspan, i, mapper, pt0, pt1, pt_units, ptc, span_units, spt0, spt1;
        pt_units = this.glyph_props[pt].units;
        span_units = this.glyph_props[span].units;
        if (pt === 'x') {
          mapper = this.plot_view.xmapper;
        } else if (pt === 'y') {
          mapper = this.plot_view.ymapper;
        }
        span = this.glyph_props.v_select(span, data);
        if (span_units === 'screen') {
          return span;
        }
        if (position === 'center') {
          halfspan = (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = span.length; _i < _len; _i++) {
              d = span[_i];
              _results.push(d / 2);
            }
            return _results;
          })();
          ptc = this.glyph_props.v_select(pt, data);
          if (pt_units === 'screen') {
            ptc = mapper.v_map_from_target(ptc);
          }
          pt0 = (function() {
            var _i, _ref1, _results;
            _results = [];
            for (i = _i = 0, _ref1 = ptc.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
              _results.push(ptc[i] - halfspan[i]);
            }
            return _results;
          })();
          pt1 = (function() {
            var _i, _ref1, _results;
            _results = [];
            for (i = _i = 0, _ref1 = ptc.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
              _results.push(ptc[i] + halfspan[i]);
            }
            return _results;
          })();
        } else {
          pt0 = this.glyph_props.v_select(pt, data);
          if (pt_units === 'screen') {
            pt0 = mapper.v_map_from_target(pt0);
          }
          pt1 = (function() {
            var _i, _ref1, _results;
            _results = [];
            for (i = _i = 0, _ref1 = pt0.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
              _results.push(pt0[i] + span[i]);
            }
            return _results;
          })();
        }
        spt0 = mapper.v_map_to_target(pt0);
        spt1 = mapper.v_map_to_target(pt1);
        return (function() {
          var _i, _ref1, _results;
          _results = [];
          for (i = _i = 0, _ref1 = spt0.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
            _results.push(Math.abs(spt1[i] - spt0[i]));
          }
          return _results;
        })();
      };

      GlyphView.prototype.distance_vector = function(pt, span_prop_name, position) {
        " returns an array ";
        var d, halfspan, i, local_select, mapper, pt0, pt1, pt_units, ptc, source, span, span_units, spt0, spt1,
          _this = this;
        pt_units = this.glyph_props[pt].units;
        span_units = this.glyph_props[span_prop_name].units;
        if (pt === 'x') {
          mapper = this.plot_view.xmapper;
        } else if (pt === 'y') {
          mapper = this.plot_view.ymapper;
        }
        source = this.mget_obj('data_source');
        local_select = function(prop_name) {
          if (source.type === 'ColumnDataSource') {
            return _this.glyph_props.source_v_select(prop_name, source);
          } else {
            return _this.glyph_props.v_select(prop_name, _this.data2);
          }
        };
        span = local_select(span_prop_name);
        if (span_units === 'screen') {
          return span;
        }
        if (position === 'center') {
          halfspan = (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = span.length; _i < _len; _i++) {
              d = span[_i];
              _results.push(d / 2);
            }
            return _results;
          })();
          ptc = local_select(pt);
          if (pt_units === 'screen') {
            ptc = mapper.v_map_from_target(ptc);
          }
          pt0 = (function() {
            var _i, _ref1, _results;
            _results = [];
            for (i = _i = 0, _ref1 = ptc.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
              _results.push(ptc[i] - halfspan[i]);
            }
            return _results;
          })();
          pt1 = (function() {
            var _i, _ref1, _results;
            _results = [];
            for (i = _i = 0, _ref1 = ptc.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
              _results.push(ptc[i] + halfspan[i]);
            }
            return _results;
          })();
        } else {
          pt0 = local_select(pt);
          if (pt_units === 'screen') {
            pt0 = mapper.v_map_from_target(pt0);
          }
          pt1 = (function() {
            var _i, _ref1, _results;
            _results = [];
            for (i = _i = 0, _ref1 = pt0.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
              _results.push(pt0[i] + span[i]);
            }
            return _results;
          })();
        }
        spt0 = mapper.v_map_to_target(pt0);
        spt1 = mapper.v_map_to_target(pt1);
        return (function() {
          var _i, _ref1, _results;
          _results = [];
          for (i = _i = 0, _ref1 = spt0.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
            _results.push(Math.abs(spt1[i] - spt0[i]));
          }
          return _results;
        })();
      };

      GlyphView.prototype.get_reference_point = function() {
        var reference_point;
        reference_point = this.mget('reference_point');
        if (_.isNumber(reference_point)) {
          return this.data[reference_point];
        } else {
          return reference_point;
        }
      };

      GlyphView.prototype.draw_legend = function(ctx, x0, x1, y0, y1) {
        return null;
      };

      GlyphView.prototype._generic_line_legend = function(ctx, x0, x1, y0, y1) {
        var line_props, reference_point, _ref1;
        reference_point = (_ref1 = this.get_reference_point()) != null ? _ref1 : 0;
        line_props = this.glyph_props.line_properties;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x0, (y0 + y1) / 2);
        ctx.lineTo(x1, (y0 + y1) / 2);
        if (line_props.do_stroke) {
          line_props.set_vectorize(ctx, reference_point);
          ctx.stroke();
        }
        return ctx.restore();
      };

      GlyphView.prototype._generic_area_legend = function(ctx, x0, x1, y0, y1) {
        var dh, dw, h, indices, reference_point, sx0, sx1, sy0, sy1, w, _ref1;
        reference_point = (_ref1 = this.get_reference_point()) != null ? _ref1 : 0;
        indices = [reference_point];
        w = Math.abs(x1 - x0);
        dw = w * 0.1;
        h = Math.abs(y1 - y0);
        dh = h * 0.1;
        sx0 = x0 + dw;
        sx1 = x1 - dw;
        sy0 = y0 + dh;
        sy1 = y1 - dh;
        if (this.glyph_props.fill_properties.do_fill) {
          this.glyph_props.fill_properties.set_vectorize(ctx, reference_point);
          ctx.fillRect(sx0, sy0, sx1 - sx0, sy1 - sy0);
        }
        if (this.glyph_props.line_properties.do_stroke) {
          ctx.beginPath();
          ctx.rect(sx0, sy0, sx1 - sx0, sy1 - sy0);
          this.glyph_props.line_properties.set_vectorize(ctx, reference_point);
          return ctx.stroke();
        }
      };

      GlyphView.prototype.hit_test = function(geometry) {
        if (geometry.type === "point") {
          if (this._hit_point != null) {
            return this._hit_point(geometry);
          }
          return console.log("'point' selection not available on renderer");
        } else if (geometry.type === "rect") {
          if (this._hit_rect != null) {
            return this._hit_rect(geometry);
          }
          return console.log("'rect' seletion not avaliable on renderer");
        } else {
          console.log("unrecognized selection geometry type '" + geometry.type + "'");
          return [];
        }
      };

      return GlyphView;

    })(PlotWidget);
    Glyph = (function(_super) {
      __extends(Glyph, _super);

      function Glyph() {
        _ref1 = Glyph.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Glyph.prototype.defaults = function() {
        return {
          data_source: null
        };
      };

      Glyph.prototype.display_defaults = function() {
        return {
          level: 'glyph',
          radius_units: 'screen',
          length_units: 'screen',
          angle_units: 'deg',
          start_angle_units: 'deg',
          end_angle_units: 'deg'
        };
      };

      return Glyph;

    })(HasParent);
    return {
      "Model": Glyph,
      "View": GlyphView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=glyph.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/glyph/annular_wedge',["underscore", "renderer/properties", "./glyph"], function(_, Properties, Glyph) {
    var AnnularWedge, AnnularWedgeView, _ref, _ref1;
    AnnularWedgeView = (function(_super) {
      __extends(AnnularWedgeView, _super);

      function AnnularWedgeView() {
        _ref = AnnularWedgeView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      AnnularWedgeView.prototype._fields = ['x', 'y', 'inner_radius', 'outer_radius', 'start_angle', 'end_angle', 'direction:string'];

      AnnularWedgeView.prototype._properties = ['line', 'fill'];

      AnnularWedgeView.prototype._map_data = function() {
        var i, _i, _ref1, _ref2, _results;
        _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
        this.inner_radius = this.distance_vector('x', 'inner_radius', 'edge');
        this.outer_radius = this.distance_vector('x', 'outer_radius', 'edge');
        this.angle = new Float32Array(this.start_angle.length);
        _results = [];
        for (i = _i = 0, _ref2 = this.start_angle.length; 0 <= _ref2 ? _i < _ref2 : _i > _ref2; i = 0 <= _ref2 ? ++_i : --_i) {
          _results.push(this.angle[i] = this.end_angle[i] - this.start_angle[i]);
        }
        return _results;
      };

      AnnularWedgeView.prototype._render = function(ctx, indices, glyph_props, sx, sy, inner_radius, outer_radius) {
        var i, _i, _len, _results;
        if (sx == null) {
          sx = this.sx;
        }
        if (sy == null) {
          sy = this.sy;
        }
        if (inner_radius == null) {
          inner_radius = this.inner_radius;
        }
        if (outer_radius == null) {
          outer_radius = this.outer_radius;
        }
        _results = [];
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          if (isNaN(sx[i] + sy[i] + inner_radius[i] + outer_radius[i] + this.start_angle[i] + this.angle[i])) {
            continue;
          }
          ctx.translate(sx[i], sy[i]);
          ctx.rotate(this.start_angle[i]);
          ctx.moveTo(outer_radius[i], 0);
          ctx.beginPath();
          ctx.arc(0, 0, outer_radius[i], 0, this.angle[i], this.direction[i]);
          ctx.rotate(this.angle[i]);
          ctx.lineTo(inner_radius[i], 0);
          ctx.arc(0, 0, inner_radius[i], 0, -this.angle[i], !this.direction[i]);
          ctx.closePath();
          ctx.rotate(-this.angle[i] - this.start_angle[i]);
          ctx.translate(-sx[i], -sy[i]);
          if (glyph_props.fill_properties.do_fill) {
            glyph_props.fill_properties.set_vectorize(ctx, i);
            ctx.fill();
          }
          if (glyph_props.line_properties.do_stroke) {
            glyph_props.line_properties.set_vectorize(ctx, i);
            _results.push(ctx.stroke());
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      AnnularWedgeView.prototype.draw_legend = function(ctx, x0, x1, y0, y1) {
        var indices, inner_radius, outer_radius, r, reference_point, sx, sy, _ref1;
        reference_point = (_ref1 = this.get_reference_point()) != null ? _ref1 : 0;
        indices = [reference_point];
        sx = {};
        sx[reference_point] = (x0 + x1) / 2;
        sy = {};
        sy[reference_point] = (y0 + y1) / 2;
        r = Math.min(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 0.5;
        inner_radius = {};
        inner_radius[reference_point] = r * 0.25;
        outer_radius = {};
        outer_radius[reference_point] = r * 0.8;
        return this._render(ctx, indices, this.glyph_props, sx, sy, inner_radius, outer_radius);
      };

      return AnnularWedgeView;

    })(Glyph.View);
    AnnularWedge = (function(_super) {
      __extends(AnnularWedge, _super);

      function AnnularWedge() {
        _ref1 = AnnularWedge.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      AnnularWedge.prototype.default_view = AnnularWedgeView;

      AnnularWedge.prototype.type = 'Glyph';

      AnnularWedge.prototype.display_defaults = function() {
        return _.extend(AnnularWedge.__super__.display_defaults.call(this), {
          direction: 'anticlock',
          fill_color: 'gray',
          fill_alpha: 1.0,
          line_color: 'red',
          line_width: 1,
          line_alpha: 1.0,
          line_join: 'miter',
          line_cap: 'butt',
          line_dash: [],
          line_dash_offset: 0
        });
      };

      return AnnularWedge;

    })(Glyph.Model);
    return {
      "Model": AnnularWedge,
      "View": AnnularWedgeView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=annular_wedge.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/glyph/annulus',["underscore", "renderer/properties", "./glyph"], function(_, Properties, Glyph) {
    var Annulus, AnnulusView, _ref, _ref1;
    AnnulusView = (function(_super) {
      __extends(AnnulusView, _super);

      function AnnulusView() {
        _ref = AnnulusView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      AnnulusView.prototype._fields = ['x', 'y', 'inner_radius', 'outer_radius'];

      AnnulusView.prototype._properties = ['line', 'fill'];

      AnnulusView.prototype._map_data = function() {
        var _ref1;
        _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
        this.inner_radius = this.distance_vector('x', 'inner_radius', 'edge');
        return this.outer_radius = this.distance_vector('x', 'outer_radius', 'edge');
      };

      AnnulusView.prototype._render = function(ctx, indices, glyph_props, sx, sy, inner_radius, outer_radius) {
        var i, _i, _len, _results;
        if (sx == null) {
          sx = this.sx;
        }
        if (sy == null) {
          sy = this.sy;
        }
        if (inner_radius == null) {
          inner_radius = this.inner_radius;
        }
        if (outer_radius == null) {
          outer_radius = this.outer_radius;
        }
        _results = [];
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          if (isNaN(sx[i] + sy[i] + inner_radius[i] + outer_radius[i])) {
            continue;
          }
          ctx.beginPath();
          ctx.arc(sx[i], sy[i], inner_radius[i], 0, 2 * Math.PI * 2, false);
          ctx.moveTo(sx[i] + outer_radius[i], sy[i]);
          ctx.arc(sx[i], sy[i], outer_radius[i], 0, 2 * Math.PI * 2, true);
          if (glyph_props.fill_properties.do_fill) {
            glyph_props.fill_properties.set_vectorize(ctx, i);
            ctx.fill();
          }
          if (glyph_props.line_properties.do_stroke) {
            glyph_props.line_properties.set_vectorize(ctx, i);
            _results.push(ctx.stroke());
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      AnnulusView.prototype.draw_legend = function(ctx, x0, x1, y0, y1) {
        var indices, inner_radius, outer_radius, r, reference_point, sx, sy, _ref1;
        reference_point = (_ref1 = this.get_reference_point()) != null ? _ref1 : 0;
        indices = [reference_point];
        sx = {};
        sx[reference_point] = (x0 + x1) / 2;
        sy = {};
        sy[reference_point] = (y0 + y1) / 2;
        r = Math.min(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 0.5;
        inner_radius = {};
        inner_radius[reference_point] = r * 0.4;
        outer_radius = {};
        outer_radius[reference_point] = r * 0.8;
        return this._render(ctx, indices, this.glyph_props, sx, sy, inner_radius, outer_radius);
      };

      return AnnulusView;

    })(Glyph.View);
    Annulus = (function(_super) {
      __extends(Annulus, _super);

      function Annulus() {
        _ref1 = Annulus.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Annulus.prototype.default_view = AnnulusView;

      Annulus.prototype.type = 'Glyph';

      Annulus.prototype.display_defaults = function() {
        return _.extend(Annulus.__super__.display_defaults.call(this), {
          fill_color: 'gray',
          fill_alpha: 1.0,
          line_color: 'red',
          line_width: 1,
          line_alpha: 1.0,
          line_join: 'miter',
          line_cap: 'butt',
          line_dash: [],
          line_dash_offset: 0
        });
      };

      return Annulus;

    })(Glyph.Model);
    return {
      "Model": Annulus,
      "View": AnnulusView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=annulus.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/glyph/arc',["underscore", "renderer/properties", "./glyph"], function(_, Properties, Glyph) {
    var Arc, ArcView, _ref, _ref1;
    ArcView = (function(_super) {
      __extends(ArcView, _super);

      function ArcView() {
        _ref = ArcView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      ArcView.prototype._fields = ['x', 'y', 'radius', 'start_angle', 'end_angle', 'direction:string'];

      ArcView.prototype._properties = ['line'];

      ArcView.prototype._map_data = function() {
        var _ref1;
        _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
        return this.radius = this.distance_vector('x', 'radius', 'edge');
      };

      ArcView.prototype._render = function(ctx, indices, glyph_props, sx, sy, radius) {
        var i, _i, _len, _results;
        if (sx == null) {
          sx = this.sx;
        }
        if (sy == null) {
          sy = this.sy;
        }
        if (radius == null) {
          radius = this.radius;
        }
        if (glyph_props.line_properties.do_stroke) {
          _results = [];
          for (_i = 0, _len = indices.length; _i < _len; _i++) {
            i = indices[_i];
            if (isNaN(sx[i] + sy[i] + radius[i] + this.start_angle[i] + this.end_angle[i] + this.direction[i])) {
              continue;
            }
            ctx.beginPath();
            ctx.arc(sx[i], sy[i], radius[i], -this.start_angle[i], -this.end_angle[i], this.direction[i]);
            glyph_props.line_properties.set_vectorize(ctx, i);
            _results.push(ctx.stroke());
          }
          return _results;
        }
      };

      ArcView.prototype.draw_legend = function(ctx, x0, x1, y0, y1) {
        var indices, radius, reference_point, sx, sy, _ref1;
        reference_point = (_ref1 = this.get_reference_point()) != null ? _ref1 : 0;
        indices = [reference_point];
        sx = {};
        sx[reference_point] = (x0 + x1) / 2;
        sy = {};
        sy[reference_point] = (y0 + y1) / 2;
        radius = {};
        radius[reference_point] = Math.min(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 0.4;
        return this._render(ctx, indices, this.glyph_props, sx, sy, radius);
      };

      return ArcView;

    })(Glyph.View);
    Arc = (function(_super) {
      __extends(Arc, _super);

      function Arc() {
        _ref1 = Arc.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Arc.prototype.default_view = ArcView;

      Arc.prototype.type = 'Glyph';

      Arc.prototype.display_defaults = function() {
        return _.extend(Arc.__super__.display_defaults.call(this), {
          direction: 'anticlock',
          line_color: 'red',
          line_width: 1,
          line_alpha: 1.0,
          line_join: 'miter',
          line_cap: 'butt',
          line_dash: [],
          line_dash_offset: 0
        });
      };

      return Arc;

    })(Glyph.Model);
    return {
      "Model": Arc,
      "View": ArcView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=arc.js.map
*/;
/*
 (c) 2013, Vladimir Agafonkin
 RBush, a JavaScript library for high-performance 2D spatial indexing of points and rectangles.
 https://github.com/mourner/rbush
*/

(function () { 

function rbush(maxEntries, format) {

    // jshint newcap: false, validthis: true
    if (!(this instanceof rbush)) { return new rbush(maxEntries, format); }

    // max entries in a node is 9 by default; min node fill is 40% for best performance
    this._maxEntries = Math.max(4, maxEntries || 9);
    this._minEntries = Math.max(2, Math.ceil(this._maxEntries * 0.4));

    if (format) {
        this._initFormat(format);
    }

    this.clear();
}

rbush.prototype = {

    all: function () {
        return this._all(this.data, []);
    },

    search: function (bbox) {

        var node = this.data,
            result = [];

        if (!this._intersects(bbox, node.bbox)) { return result; }

        var nodesToSearch = [],
            i, len, child, childBBox;

        while (node) {
            for (i = 0, len = node.children.length; i < len; i++) {
                child = node.children[i];
                childBBox = node.leaf ? this.toBBox(child) : child.bbox;

                if (this._intersects(bbox, childBBox)) {

                    if (node.leaf) {
                        result.push(child);

                    } else if (this._contains(bbox, childBBox)) {
                        this._all(child, result);

                    } else {
                        nodesToSearch.push(child);
                    }
                }
            }

            node = nodesToSearch.pop();
        }

        return result;
    },

    load: function (data) {
        if (!(data && data.length)) { return this; }

        if (data.length < this._minEntries) {
            for (var i = 0, len = data.length; i < len; i++) {
                this.insert(data[i]);
            }
            return this;
        }

        // recursively build the tree with the given data from stratch using OMT algorithm
        var node = this._build(data.slice(), 0);

        if (!this.data.children.length) {
            // save as is if tree is empty
            this.data = node;

        } else if (this.data.height === node.height) {
            // split root if trees have the same height
            this._splitRoot(this.data, node);

        } else {
            if (this.data.height < node.height) {
                // swap trees if inserted one is bigger
                var tmpNode = this.data;
                this.data = node;
                node = tmpNode;
            }

            // insert the small tree into the large tree at appropriate level
            this._insert(node, this.data.height - node.height - 1, true);
        }

        return this;
    },

    insert: function (item) {
        if (item) {
            this._insert(item, this.data.height - 1);
        }
        return this;
    },

    clear: function () {
        this.data = {
            children: [],
            leaf: true,
            bbox: this._empty(),
            height: 1
        };
        return this;
    },

    remove: function (item) {
        if (!item) { return this; }

        var node = this.data,
            bbox = this.toBBox(item),
            path = [],
            indexes = [],
            i, parent, index, goingUp;

        // depth-first iterative tree traversal
        while (node || path.length) {

            if (!node) { // go up
                node = path.pop();
                parent = path[path.length - 1];
                i = indexes.pop();
                goingUp = true;
            }

            if (node.leaf) { // check current node
                index = node.children.indexOf(item);

                if (index !== -1) {
                    // item found, remove the item and condense tree upwards
                    node.children.splice(index, 1);
                    path.push(node);
                    this._condense(path);
                    return this;
                }
            }

            if (!goingUp && !node.leaf && this._contains(node.bbox, bbox)) { // go down
                path.push(node);
                indexes.push(i);
                i = 0;
                parent = node;
                node = node.children[0];

            } else if (parent) { // go right
                i++;
                node = parent.children[i];
                goingUp = false;

            } else { // nothing found
                node = null;
            }
        }

        return this;
    },

    toBBox: function (item) { return item; },

    compareMinX: function (a, b) { return a[0] - b[0]; },
    compareMinY: function (a, b) { return a[1] - b[1]; },

    toJSON: function () { return this.data; },

    fromJSON: function (data) {
        this.data = data;
        return this;
    },

    _all: function (node, result) {
        var nodesToSearch = [];
        while (node) {
            if (node.leaf) {
                result.push.apply(result, node.children);
            } else {
                nodesToSearch.push.apply(nodesToSearch, node.children);
            }
            node = nodesToSearch.pop();
        }
        return result;
    },

    _build: function (items, level, height) {

        var N = items.length,
            M = this._maxEntries,
            node;

        if (N <= M) {
            node = {
                children: items,
                leaf: true,
                height: 1
            };
            this._calcBBox(node);
            return node;
        }

        if (!level) {
            // target height of the bulk-loaded tree
            height = Math.ceil(Math.log(N) / Math.log(M));

            // target number of root entries to maximize storage utilization
            M = Math.ceil(N / Math.pow(M, height - 1));

            items.sort(this.compareMinX);
        }

        // TODO eliminate recursion?

        node = {
            children: [],
            height: height
        };

        var N1 = Math.ceil(N / M) * Math.ceil(Math.sqrt(M)),
            N2 = Math.ceil(N / M),
            compare = level % 2 === 1 ? this.compareMinX : this.compareMinY,
            i, j, slice, sliceLen, childNode;

        // split the items into M mostly square tiles
        for (i = 0; i < N; i += N1) {
            slice = items.slice(i, i + N1).sort(compare);

            for (j = 0, sliceLen = slice.length; j < sliceLen; j += N2) {
                // pack each entry recursively
                childNode = this._build(slice.slice(j, j + N2), level + 1, height - 1);
                node.children.push(childNode);
            }
        }

        this._calcBBox(node);

        return node;
    },

    _chooseSubtree: function (bbox, node, level, path) {

        var i, len, child, targetNode, area, enlargement, minArea, minEnlargement;

        while (true) {
            path.push(node);

            if (node.leaf || path.length - 1 === level) { break; }

            minArea = minEnlargement = Infinity;

            for (i = 0, len = node.children.length; i < len; i++) {
                child = node.children[i];
                area = this._area(child.bbox);
                enlargement = this._enlargedArea(bbox, child.bbox) - area;

                // choose entry with the least area enlargement
                if (enlargement < minEnlargement) {
                    minEnlargement = enlargement;
                    minArea = area < minArea ? area : minArea;
                    targetNode = child;

                } else if (enlargement === minEnlargement) {
                    // otherwise choose one with the smallest area
                    if (area < minArea) {
                        minArea = area;
                        targetNode = child;
                    }
                }
            }

            node = targetNode;
        }

        return node;
    },

    _insert: function (item, level, isNode) {

        var bbox = isNode ? item.bbox : this.toBBox(item),
            insertPath = [];

        // find the best node for accommodating the item, saving all nodes along the path too
        var node = this._chooseSubtree(bbox, this.data, level, insertPath);

        // put the item into the node
        node.children.push(item);
        this._extend(node.bbox, bbox);

        // split on node overflow; propagate upwards if necessary
        while (level >= 0) {
            if (insertPath[level].children.length > this._maxEntries) {
                this._split(insertPath, level);
                level--;
            } else {
              break;
            }
        }

        // adjust bboxes along the insertion path
        this._adjustParentBBoxes(bbox, insertPath, level);
    },

    // split overflowed node into two
    _split: function (insertPath, level) {

        var node = insertPath[level],
            M = node.children.length,
            m = this._minEntries;

        this._chooseSplitAxis(node, m, M);

        var newNode = {
            children: node.children.splice(this._chooseSplitIndex(node, m, M)),
            height: node.height
        };

        if (node.leaf) {
            newNode.leaf = true;
        }

        this._calcBBox(node);
        this._calcBBox(newNode);

        if (level) {
            insertPath[level - 1].children.push(newNode);
        } else {
            this._splitRoot(node, newNode);
        }
    },

    _splitRoot: function (node, newNode) {
        // split root node
        this.data = {};
        this.data.children = [node, newNode];
        this.data.height = node.height + 1;
        this._calcBBox(this.data);
    },

    _chooseSplitIndex: function (node, m, M) {

        var i, bbox1, bbox2, overlap, area, minOverlap, minArea, index;

        minOverlap = minArea = Infinity;

        for (i = m; i <= M - m; i++) {
            bbox1 = this._distBBox(node, 0, i);
            bbox2 = this._distBBox(node, i, M);

            overlap = this._intersectionArea(bbox1, bbox2);
            area = this._area(bbox1) + this._area(bbox2);

            // choose distribution with minimum overlap
            if (overlap < minOverlap) {
                minOverlap = overlap;
                index = i;

                minArea = area < minArea ? area : minArea;

            } else if (overlap === minOverlap) {
                // otherwise choose distribution with minimum area
                if (area < minArea) {
                    minArea = area;
                    index = i;
                }
            }
        }

        return index;
    },

    // sorts node children by the best axis for split
    _chooseSplitAxis: function (node, m, M) {

        var compareMinX = node.leaf ? this.compareMinX : this._compareNodeMinX,
            compareMinY = node.leaf ? this.compareMinY : this._compareNodeMinY,
            xMargin = this._allDistMargin(node, m, M, compareMinX),
            yMargin = this._allDistMargin(node, m, M, compareMinY);

        // if total distributions margin value is minimal for x, sort by minX,
        // otherwise it's already sorted by minY

        if (xMargin < yMargin) {
            node.children.sort(compareMinX);
        }
    },

    // total margin of all possible split distributions where each node is at least m full
    _allDistMargin: function (node, m, M, compare) {

        node.children.sort(compare);

        var leftBBox = this._distBBox(node, 0, m),
            rightBBox = this._distBBox(node, M - m, M),
            margin = this._margin(leftBBox) + this._margin(rightBBox),
            i, child;

        for (i = m; i < M - m; i++) {
            child = node.children[i];
            this._extend(leftBBox, node.leaf ? this.toBBox(child) : child.bbox);
            margin += this._margin(leftBBox);
        }

        for (i = M - m - 1; i >= m; i--) {
            child = node.children[i];
            this._extend(rightBBox, node.leaf ? this.toBBox(child) : child.bbox);
            margin += this._margin(rightBBox);
        }

        return margin;
    },

    // min bounding rectangle of node children from k to p-1
    _distBBox: function (node, k, p) {
        var bbox = this._empty();

        for (var i = k, child; i < p; i++) {
            child = node.children[i];
            this._extend(bbox, node.leaf ? this.toBBox(child) : child.bbox);
        }

        return bbox;
    },

    // calculate node's bbox from bboxes of its children
    _calcBBox: function (node) {
        node.bbox = this._distBBox(node, 0, node.children.length);
    },

    _adjustParentBBoxes: function (bbox, path, level) {
        // adjust bboxes along the given tree path
        for (var i = level; i >= 0; i--) {
            this._extend(path[i].bbox, bbox);
        }
    },

    _condense: function (path) {
        // go through the path, removing empty nodes and updating bboxes
        for (var i = path.length - 1, siblings; i >= 0; i--) {
            if (path[i].children.length === 0) {
                if (i > 0) {
                    siblings = path[i - 1].children;
                    siblings.splice(siblings.indexOf(path[i]), 1);
                } else {
                    this.clear();
                }
            } else {
                this._calcBBox(path[i]);
            }
        }
    },

    _contains: function(a, b) {
        return a[0] <= b[0] &&
               a[1] <= b[1] &&
               b[2] <= a[2] &&
               b[3] <= a[3];
    },

    _intersects: function (a, b) {
        return b[0] <= a[2] &&
               b[1] <= a[3] &&
               b[2] >= a[0] &&
               b[3] >= a[1];
    },

    _extend: function (a, b) {
        a[0] = Math.min(a[0], b[0]);
        a[1] = Math.min(a[1], b[1]);
        a[2] = Math.max(a[2], b[2]);
        a[3] = Math.max(a[3], b[3]);
        return a;
    },

    _area:   function (a) { return (a[2] - a[0]) * (a[3] - a[1]); },
    _margin: function (a) { return (a[2] - a[0]) + (a[3] - a[1]); },

    _enlargedArea: function (a, b) {
        return (Math.max(b[2], a[2]) - Math.min(b[0], a[0])) *
               (Math.max(b[3], a[3]) - Math.min(b[1], a[1]));
    },

    _intersectionArea: function (a, b) {
        var minX = Math.max(a[0], b[0]),
            minY = Math.max(a[1], b[1]),
            maxX = Math.min(a[2], b[2]),
            maxY = Math.min(a[3], b[3]);

        return Math.max(0, maxX - minX) *
               Math.max(0, maxY - minY);
    },

    _empty: function () { return [Infinity, Infinity, -Infinity, -Infinity]; },

    _compareNodeMinX: function (a, b) { return a.bbox[0] - b.bbox[0]; },
    _compareNodeMinY: function (a, b) { return a.bbox[1] - b.bbox[1]; },

    _initFormat: function (format) {
        // data format (minX, minY, maxX, maxY accessors)

        // uses eval-type function compilation instead of just accepting a toBBox function
        // because the algorithms are very sensitive to sorting functions performance,
        // so they should be dead simple and without inner calls

        // jshint evil: true

        var compareArr = ['return a', ' - b', ';'];

        this.compareMinX = new Function('a', 'b', compareArr.join(format[0]));
        this.compareMinY = new Function('a', 'b', compareArr.join(format[1]));

        this.toBBox = new Function('a', 'return [a' + format.join(', a') + '];');
    }
};

if (typeof define === 'function' && define.amd) {
    define('rbush',[],function() {
        return rbush;
    });
} else if (typeof module !== 'undefined') {
    module.exports = rbush;
} else if (typeof self !== 'undefined') {
    self.rbush = rbush;
} else {
    window.rbush = rbush;
}

})();

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/glyph/marker',["underscore", "rbush", "renderer/properties", "./glyph"], function(_, rbush, Properties, Glyph) {
    var Marker, MarkerView, _ref, _ref1;
    MarkerView = (function(_super) {
      __extends(MarkerView, _super);

      function MarkerView() {
        _ref = MarkerView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      MarkerView.prototype._fields = ['x', 'y', 'size'];

      MarkerView.prototype.draw_legend = function(ctx, x0, x1, y0, y1) {
        var indices, reference_point, size, sx, sy, _ref1;
        reference_point = (_ref1 = this.get_reference_point()) != null ? _ref1 : 0;
        indices = [reference_point];
        sx = {};
        sx[reference_point] = (x0 + x1) / 2;
        sy = {};
        sy[reference_point] = (y0 + y1) / 2;
        size = {};
        size[reference_point] = Math.min(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 0.8;
        return this._render(ctx, indices, this.glyph_props, sx, sy, size);
      };

      MarkerView.prototype._set_data = function() {
        var i;
        this.max_size = _.max(this.size);
        this.index = rbush();
        return this.index.load((function() {
          var _i, _ref1, _results;
          _results = [];
          for (i = _i = 0, _ref1 = this.x.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
            _results.push([
              this.x[i], this.y[i], this.x[i], this.y[i], {
                'i': i
              }
            ]);
          }
          return _results;
        }).call(this));
      };

      MarkerView.prototype._map_data = function() {
        var _ref1;
        return _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1], _ref1;
      };

      MarkerView.prototype._mask_data = function() {
        var hr, vr, vx0, vx1, vy0, vy1, x, x0, x1, y0, y1, _ref1, _ref2;
        hr = this.plot_view.view_state.get('inner_range_horizontal');
        vx0 = hr.get('start') - this.max_size;
        vx1 = hr.get('end') + this.max_size;
        _ref1 = this.plot_view.xmapper.v_map_from_target([vx0, vx1]), x0 = _ref1[0], x1 = _ref1[1];
        vr = this.plot_view.view_state.get('inner_range_vertical');
        vy0 = vr.get('start') - this.max_size;
        vy1 = vr.get('end') + this.max_size;
        _ref2 = this.plot_view.ymapper.v_map_from_target([vy0, vy1]), y0 = _ref2[0], y1 = _ref2[1];
        return (function() {
          var _i, _len, _ref3, _results;
          _ref3 = this.index.search([x0, y0, x1, y1]);
          _results = [];
          for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
            x = _ref3[_i];
            _results.push(x[4].i);
          }
          return _results;
        }).call(this);
      };

      MarkerView.prototype._hit_point = function(geometry) {
        var candidates, hits, i, s2, sx, sx0, sx1, sy, sy0, sy1, x, x0, x1, y0, y1, _i, _ref1, _ref2, _ref3, _ref4;
        _ref1 = [geometry.sx, geometry.sy], sx = _ref1[0], sy = _ref1[1];
        sx0 = sx - this.max_size;
        sx1 = sx - this.max_size;
        _ref2 = this.plot_view.xmapper.v_map_from_target([sx0, sx1]), x0 = _ref2[0], x1 = _ref2[1];
        sy0 = sy - this.max_size;
        sy1 = sy - this.max_size;
        _ref3 = this.plot_view.ymapper.v_map_from_target([sy0, sy1]), y0 = _ref3[0], y1 = _ref3[1];
        candidates = (function() {
          var _i, _len, _ref4, _results;
          _ref4 = this.index.search([x0, y0, x1, y1]);
          _results = [];
          for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
            x = _ref4[_i];
            _results.push(x[4].i);
          }
          return _results;
        }).call(this);
        hits = [];
        for (i = _i = 0, _ref4 = candidates.length; 0 <= _ref4 ? _i < _ref4 : _i > _ref4; i = 0 <= _ref4 ? ++_i : --_i) {
          s2 = this.size[i] / 2;
          if (Math.abs(this.sx[i] - sx) <= s2 && Math.abs(this.sy[i] - sy) <= s2) {
            hits.push(i);
          }
        }
        return hits;
      };

      MarkerView.prototype._hit_rect = function(geometry) {
        var x, x0, x1, y0, y1, _ref1, _ref2;
        _ref1 = this.plot_view.xmapper.v_map_from_target([geometry.vx0, geometry.vx1]), x0 = _ref1[0], x1 = _ref1[1];
        _ref2 = this.plot_view.ymapper.v_map_from_target([geometry.vy0, geometry.vy1]), y0 = _ref2[0], y1 = _ref2[1];
        return (function() {
          var _i, _len, _ref3, _results;
          _ref3 = this.index.search([x0, y0, x1, y1]);
          _results = [];
          for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
            x = _ref3[_i];
            _results.push(x[4].i);
          }
          return _results;
        }).call(this);
      };

      return MarkerView;

    })(Glyph.View);
    Marker = (function(_super) {
      __extends(Marker, _super);

      function Marker() {
        _ref1 = Marker.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      return Marker;

    })(Glyph.Model);
    return {
      "Model": Marker,
      "View": MarkerView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=marker.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/glyph/asterisk',["underscore", "renderer/properties", "./marker"], function(_, Properties, Marker) {
    var Asterisk, AsteriskView, _ref, _ref1;
    AsteriskView = (function(_super) {
      __extends(AsteriskView, _super);

      function AsteriskView() {
        _ref = AsteriskView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      AsteriskView.prototype._properties = ['line'];

      AsteriskView.prototype._render = function(ctx, indices, glyph_props, sx, sy, size) {
        var i, r, r2, _i, _len, _results;
        if (sx == null) {
          sx = this.sx;
        }
        if (sy == null) {
          sy = this.sy;
        }
        if (size == null) {
          size = this.size;
        }
        _results = [];
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          if (isNaN(sx[i] + sy[i] + size[i])) {
            continue;
          }
          r = size[i] / 2;
          r2 = r * 0.65;
          ctx.beginPath();
          ctx.moveTo(sx[i], sy[i] + r);
          ctx.lineTo(sx[i], sy[i] - r);
          ctx.moveTo(sx[i] - r, sy[i]);
          ctx.lineTo(sx[i] + r, sy[i]);
          ctx.moveTo(sx[i] - r2, sy[i] + r2);
          ctx.lineTo(sx[i] + r2, sy[i] - r2);
          ctx.moveTo(sx[i] - r2, sy[i] - r2);
          ctx.lineTo(sx[i] + r2, sy[i] + r2);
          if (glyph_props.line_properties.do_stroke) {
            glyph_props.line_properties.set_vectorize(ctx, i);
            _results.push(ctx.stroke());
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      return AsteriskView;

    })(Marker.View);
    Asterisk = (function(_super) {
      __extends(Asterisk, _super);

      function Asterisk() {
        _ref1 = Asterisk.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Asterisk.prototype.default_view = AsteriskView;

      Asterisk.prototype.type = 'Glyph';

      Asterisk.prototype.display_defaults = function() {
        return _.extend(Asterisk.__super__.display_defaults.call(this), {
          line_color: 'red',
          line_width: 1,
          line_alpha: 1.0,
          line_join: 'miter',
          line_cap: 'butt',
          line_dash: [],
          line_dash_offset: 0
        });
      };

      return Asterisk;

    })(Marker.Model);
    return {
      "Model": Asterisk,
      "View": AsteriskView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=asterisk.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/glyph/bezier',["underscore", "renderer/properties", "./glyph"], function(_, Properties, Glyph) {
    var Bezier, BezierView, _ref, _ref1;
    BezierView = (function(_super) {
      __extends(BezierView, _super);

      function BezierView() {
        _ref = BezierView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      BezierView.prototype._fields = ['x0', 'y0', 'x1', 'y1', 'cx0', 'cy0', 'cx1', 'cy1'];

      BezierView.prototype._properties = ['line'];

      BezierView.prototype._map_data = function() {
        var _ref1, _ref2, _ref3, _ref4;
        _ref1 = this.plot_view.map_to_screen(this.x0, this.glyph_props.x0.units, this.y0, this.glyph_props.y0.units), this.sx0 = _ref1[0], this.sy0 = _ref1[1];
        _ref2 = this.plot_view.map_to_screen(this.x1, this.glyph_props.x1.units, this.y1, this.glyph_props.y1.units), this.sx1 = _ref2[0], this.sy1 = _ref2[1];
        _ref3 = this.plot_view.map_to_screen(this.cx0, this.glyph_props.cx0.units, this.cy0, this.glyph_props.cy0.units), this.scx0 = _ref3[0], this.scy0 = _ref3[1];
        return _ref4 = this.plot_view.map_to_screen(this.cx1, this.glyph_props.cx1.units, this.cy1, this.glyph_props.cy1.units), this.scx1 = _ref4[0], this.scy1 = _ref4[1], _ref4;
      };

      BezierView.prototype._render = function(ctx, indices, glyph_props) {
        var i, _i, _len, _results;
        if (glyph_props.line_properties.do_stroke) {
          _results = [];
          for (_i = 0, _len = indices.length; _i < _len; _i++) {
            i = indices[_i];
            if (isNaN(this.sx0[i] + this.sy0[i] + this.sx1[i] + this.sy1[i] + this.scx0[i] + this.scy0[i] + this.scx1[i] + this.scy1[i])) {
              continue;
            }
            ctx.beginPath();
            ctx.moveTo(this.sx0[i], this.sy0[i]);
            ctx.bezierCurveTo(this.scx0[i], this.scy0[i], this.scx1[i], this.scy1[i], this.sx1[i], this.sy1[i]);
            glyph_props.line_properties.set_vectorize(ctx, i);
            _results.push(ctx.stroke());
          }
          return _results;
        }
      };

      BezierView.prototype.draw_legend = function(ctx, x0, x1, y0, y1) {
        return this._generic_line_legend(ctx, x0, x1, y0, y1);
      };

      return BezierView;

    })(Glyph.View);
    Bezier = (function(_super) {
      __extends(Bezier, _super);

      function Bezier() {
        _ref1 = Bezier.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Bezier.prototype.default_view = BezierView;

      Bezier.prototype.type = 'Glyph';

      Bezier.prototype.display_defaults = function() {
        return _.extend(Bezier.__super__.display_defaults.call(this), {
          line_color: 'red',
          line_width: 1,
          line_alpha: 1.0,
          line_join: 'miter',
          line_cap: 'butt',
          line_dash: [],
          line_dash_offset: 0
        });
      };

      return Bezier;

    })(Glyph.Model);
    return {
      "Model": Bezier,
      "View": BezierView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=bezier.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/glyph/circle',["underscore", "rbush", "renderer/properties", "./glyph"], function(_, rbush, Properties, Glyph) {
    var Circle, CircleView, _ref, _ref1;
    CircleView = (function(_super) {
      __extends(CircleView, _super);

      function CircleView() {
        _ref = CircleView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      CircleView.prototype._properties = ['line', 'fill'];

      CircleView.prototype.initialize = function(options) {
        var spec;
        spec = this.mget('glyphspec');
        if (spec.radius != null) {
          this._fields = ['x', 'y', 'radius'];
        } else if (spec.size != null) {
          this._fields = ['x', 'y', 'size'];
        }
        return CircleView.__super__.initialize.call(this, options);
      };

      CircleView.prototype._set_data = function() {
        var i;
        if (this.size) {
          this.max_radius = _.max(this.size) / 2;
        } else {
          this.max_radius = _.max(this.radius);
        }
        this.index = rbush();
        return this.index.load((function() {
          var _i, _ref1, _results;
          _results = [];
          for (i = _i = 0, _ref1 = this.x.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
            _results.push([
              this.x[i], this.y[i], this.x[i], this.y[i], {
                'i': i
              }
            ]);
          }
          return _results;
        }).call(this));
      };

      CircleView.prototype._map_data = function() {
        var s, _ref1;
        _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
        if (this.size) {
          this.radius = (function() {
            var _i, _len, _ref2, _results;
            _ref2 = this.distance_vector('x', 'size', 'edge');
            _results = [];
            for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
              s = _ref2[_i];
              _results.push(s / 2);
            }
            return _results;
          }).call(this);
          return this.radius_units = this.size_units;
        } else {
          return this.radius = this.distance_vector('x', 'radius', 'edge');
        }
      };

      CircleView.prototype._mask_data = function() {
        var hr, sx0, sx1, sy0, sy1, vr, x, x0, x1, y0, y1, _ref1, _ref2, _ref3, _ref4;
        hr = this.plot_view.view_state.get('inner_range_horizontal');
        vr = this.plot_view.view_state.get('inner_range_vertical');
        if (this.radius_units === "screen") {
          sx0 = hr.get('start') - this.max_radius;
          sx1 = hr.get('end') - this.max_radius;
          _ref1 = this.plot_view.xmapper.v_map_from_target([sx0, sx1]), x0 = _ref1[0], x1 = _ref1[1];
          sy0 = vr.get('start') - this.max_radius;
          sy1 = vr.get('end') - this.max_radius;
          _ref2 = this.plot_view.ymapper.v_map_from_target([sy0, sy1]), y0 = _ref2[0], y1 = _ref2[1];
        } else {
          sx0 = hr.get('start');
          sx1 = hr.get('end');
          _ref3 = this.plot_view.xmapper.v_map_from_target([sx0, sx1]), x0 = _ref3[0], x1 = _ref3[1];
          x0 -= this.max_radius;
          x1 += this.max_radius;
          sy0 = vr.get('start');
          sy1 = vr.get('end');
          _ref4 = this.plot_view.ymapper.v_map_from_target([sy0, sy1]), y0 = _ref4[0], y1 = _ref4[1];
          y0 -= this.max_radius;
          y1 += this.max_radius;
        }
        return this.mask = (function() {
          var _i, _len, _ref5, _results;
          _ref5 = this.index.search([x0, y0, x1, y1]);
          _results = [];
          for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
            x = _ref5[_i];
            _results.push(x[4].i);
          }
          return _results;
        }).call(this);
      };

      CircleView.prototype._render = function(ctx, indices, glyph_props, sx, sy, radius) {
        var i, _i, _len, _results;
        if (sx == null) {
          sx = this.sx;
        }
        if (sy == null) {
          sy = this.sy;
        }
        if (radius == null) {
          radius = this.radius;
        }
        _results = [];
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          if (isNaN(sx[i] + sy[i] + radius[i])) {
            continue;
          }
          ctx.beginPath();
          ctx.arc(sx[i], sy[i], radius[i], 0, 2 * Math.PI, false);
          if (glyph_props.fill_properties.do_fill) {
            glyph_props.fill_properties.set_vectorize(ctx, i);
            ctx.fill();
          }
          if (glyph_props.line_properties.do_stroke) {
            glyph_props.line_properties.set_vectorize(ctx, i);
            _results.push(ctx.stroke());
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      CircleView.prototype._hit_point = function(geometry) {
        var candidates, hits, i, r2, sx, sx0, sx1, sy, sy0, sy1, x, x0, x1, y, y0, y1, _i, _j, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6;
        _ref1 = [geometry.sx, geometry.sy], sx = _ref1[0], sy = _ref1[1];
        _ref2 = this.plot_view.xmapper.v_map_from_target([sx, sy]), x = _ref2[0], y = _ref2[1];
        if (this.radius_units === "screen") {
          sx0 = sx - this.max_radius;
          sx1 = sx - this.max_radius;
          _ref3 = this.plot_view.xmapper.v_map_from_target([sx0, sx1]), x0 = _ref3[0], x1 = _ref3[1];
          sy0 = sy - this.max_radius;
          sy1 = sy - this.max_radius;
          _ref4 = this.plot_view.ymapper.v_map_from_target([sy0, sy1]), y0 = _ref4[0], y1 = _ref4[1];
        } else {
          x0 = x - this.max_radius;
          x1 = x + this.max_radius;
          y0 = y - this.max_radius;
          y1 = y + this.max_radius;
        }
        candidates = (function() {
          var _i, _len, _ref5, _results;
          _ref5 = this.index.search([x0, y0, x1, y1]);
          _results = [];
          for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
            x = _ref5[_i];
            _results.push(x[4].i);
          }
          return _results;
        }).call(this);
        hits = [];
        if (this.radius_units === "screen") {
          for (i = _i = 0, _ref5 = candidates.length; 0 <= _ref5 ? _i < _ref5 : _i > _ref5; i = 0 <= _ref5 ? ++_i : --_i) {
            r2 = this.radius[i] ^ 2;
            if ((this.sx[i] - sx) ^ 2 + (this.sy[i] - sy) ^ 2 <= r2) {
              hits.push(i);
            }
          }
        } else {
          for (i = _j = 0, _ref6 = candidates.length; 0 <= _ref6 ? _j < _ref6 : _j > _ref6; i = 0 <= _ref6 ? ++_j : --_j) {
            r2 = this.radius[i] ^ 2;
            if ((this.x[i] - x) ^ 2 + (this.y[i] - y) ^ 2 <= r2) {
              hits.push(i);
            }
          }
        }
        return hits;
      };

      CircleView.prototype._hit_rect = function(geometry) {
        var x, x0, x1, y0, y1, _ref1, _ref2;
        _ref1 = this.plot_view.xmapper.v_map_from_target([geometry.vx0, geometry.vx1]), x0 = _ref1[0], x1 = _ref1[1];
        _ref2 = this.plot_view.ymapper.v_map_from_target([geometry.vy0, geometry.vy1]), y0 = _ref2[0], y1 = _ref2[1];
        return (function() {
          var _i, _len, _ref3, _results;
          _ref3 = this.index.search([x0, y0, x1, y1]);
          _results = [];
          for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
            x = _ref3[_i];
            _results.push(x[4].i);
          }
          return _results;
        }).call(this);
      };

      CircleView.prototype.draw_legend = function(ctx, x0, x1, y0, y1) {
        var indices, radius, reference_point, sx, sy, _ref1;
        reference_point = (_ref1 = this.get_reference_point()) != null ? _ref1 : 0;
        indices = [reference_point];
        sx = {};
        sx[reference_point] = (x0 + x1) / 2;
        sy = {};
        sy[reference_point] = (y0 + y1) / 2;
        radius = {};
        radius[reference_point] = Math.min(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 0.4;
        return this._render(ctx, indices, this.glyph_props, sx, sy, radius);
      };

      return CircleView;

    })(Glyph.View);
    Circle = (function(_super) {
      __extends(Circle, _super);

      function Circle() {
        _ref1 = Circle.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Circle.prototype.default_view = CircleView;

      Circle.prototype.type = 'Glyph';

      Circle.prototype.display_defaults = function() {
        return _.extend(Circle.__super__.display_defaults.call(this), {
          radius_units: 'data',
          size_units: 'screen',
          fill_color: 'gray',
          fill_alpha: 1.0,
          line_color: 'red',
          line_width: 1,
          line_alpha: 1.0,
          line_join: 'miter',
          line_cap: 'butt',
          line_dash: [],
          line_dash_offset: 0
        });
      };

      return Circle;

    })(Glyph.Model);
    return {
      "Model": Circle,
      "View": CircleView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=circle.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/glyph/circle_x',["underscore", "renderer/properties", "./marker"], function(_, Properties, Marker) {
    var CircleX, CircleXView, _ref, _ref1;
    CircleXView = (function(_super) {
      __extends(CircleXView, _super);

      function CircleXView() {
        _ref = CircleXView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      CircleXView.prototype._properties = ['line', 'fill'];

      CircleXView.prototype._render = function(ctx, indices, glyph_props, sx, sy, size) {
        var i, r, _i, _len, _results;
        if (sx == null) {
          sx = this.sx;
        }
        if (sy == null) {
          sy = this.sy;
        }
        if (size == null) {
          size = this.size;
        }
        _results = [];
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          if (isNaN(sx[i] + sy[i] + size[i])) {
            continue;
          }
          ctx.beginPath();
          r = size[i] / 2;
          ctx.arc(sx[i], sy[i], r, 0, 2 * Math.PI, false);
          if (glyph_props.fill_properties.do_fill) {
            glyph_props.fill_properties.set_vectorize(ctx, i);
            ctx.fill();
          }
          if (glyph_props.line_properties.do_stroke) {
            glyph_props.line_properties.set_vectorize(ctx, i);
            ctx.moveTo(sx[i] - r, sy[i] + r);
            ctx.lineTo(sx[i] + r, sy[i] - r);
            ctx.moveTo(sx[i] - r, sy[i] - r);
            ctx.lineTo(sx[i] + r, sy[i] + r);
            _results.push(ctx.stroke());
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      return CircleXView;

    })(Marker.View);
    CircleX = (function(_super) {
      __extends(CircleX, _super);

      function CircleX() {
        _ref1 = CircleX.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      CircleX.prototype.default_view = CircleXView;

      CircleX.prototype.type = 'Glyph';

      CircleX.prototype.display_defaults = function() {
        return _.extend(CircleX.__super__.display_defaults.call(this), {
          fill_color: 'gray',
          fill_alpha: 1.0,
          line_color: 'red',
          line_width: 1,
          line_alpha: 1.0,
          line_join: 'miter',
          line_cap: 'butt',
          line_dash: [],
          line_dash_offset: 0
        });
      };

      return CircleX;

    })(Marker.Model);
    return {
      "Model": CircleX,
      "View": CircleXView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=circle_x.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/glyph/circle_cross',["underscore", "renderer/properties", "./marker"], function(_, Properties, Marker) {
    var CircleCross, CircleCrossView, _ref, _ref1;
    CircleCrossView = (function(_super) {
      __extends(CircleCrossView, _super);

      function CircleCrossView() {
        _ref = CircleCrossView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      CircleCrossView.prototype._properties = ['line', 'fill'];

      CircleCrossView.prototype._render = function(ctx, indices, glyph_props, sx, sy, size) {
        var i, r, _i, _len, _results;
        if (sx == null) {
          sx = this.sx;
        }
        if (sy == null) {
          sy = this.sy;
        }
        if (size == null) {
          size = this.size;
        }
        _results = [];
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          if (isNaN(sx[i] + sy[i] + size[i])) {
            continue;
          }
          ctx.beginPath();
          r = size[i] / 2;
          ctx.arc(sx[i], sy[i], r, 0, 2 * Math.PI, false);
          if (glyph_props.fill_properties.do_fill) {
            glyph_props.fill_properties.set_vectorize(ctx, i);
            ctx.fill();
          }
          if (glyph_props.line_properties.do_stroke) {
            glyph_props.line_properties.set_vectorize(ctx, i);
            ctx.moveTo(sx[i], sy[i] + r);
            ctx.lineTo(sx[i], sy[i] - r);
            ctx.moveTo(sx[i] - r, sy[i]);
            ctx.lineTo(sx[i] + r, sy[i]);
            _results.push(ctx.stroke());
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      return CircleCrossView;

    })(Marker.View);
    CircleCross = (function(_super) {
      __extends(CircleCross, _super);

      function CircleCross() {
        _ref1 = CircleCross.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      CircleCross.prototype.default_view = CircleCrossView;

      CircleCross.prototype.type = 'Glyph';

      CircleCross.prototype.display_defaults = function() {
        return _.extend(CircleCross.__super__.display_defaults.call(this), {
          fill_color: 'gray',
          fill_alpha: 1.0,
          line_color: 'red',
          line_width: 1,
          line_alpha: 1.0,
          line_join: 'miter',
          line_cap: 'butt',
          line_dash: [],
          line_dash_offset: 0
        });
      };

      return CircleCross;

    })(Marker.Model);
    return {
      "Model": CircleCross,
      "View": CircleCrossView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=circle_cross.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/glyph/diamond',["underscore", "renderer/properties", "./marker"], function(_, Properties, Marker) {
    var Diamond, DiamondView, _ref, _ref1;
    DiamondView = (function(_super) {
      __extends(DiamondView, _super);

      function DiamondView() {
        _ref = DiamondView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      DiamondView.prototype._properties = ['line', 'fill'];

      DiamondView.prototype._render = function(ctx, indices, glyph_props, sx, sy, size) {
        var i, r, _i, _len, _results;
        if (sx == null) {
          sx = this.sx;
        }
        if (sy == null) {
          sy = this.sy;
        }
        if (size == null) {
          size = this.size;
        }
        _results = [];
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          if (isNaN(sx[i] + sy[i] + size[i])) {
            continue;
          }
          r = size[i] / 2;
          ctx.beginPath();
          ctx.moveTo(sx[i], sy[i] + r);
          ctx.lineTo(sx[i] + r, sy[i]);
          ctx.lineTo(sx[i], sy[i] - r);
          ctx.lineTo(sx[i] - r, sy[i]);
          ctx.closePath();
          if (glyph_props.fill_properties.do_fill) {
            glyph_props.fill_properties.set_vectorize(ctx, i);
            ctx.fill();
          }
          if (glyph_props.line_properties.do_stroke) {
            glyph_props.line_properties.set_vectorize(ctx, i);
            _results.push(ctx.stroke());
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      return DiamondView;

    })(Marker.View);
    Diamond = (function(_super) {
      __extends(Diamond, _super);

      function Diamond() {
        _ref1 = Diamond.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Diamond.prototype.default_view = DiamondView;

      Diamond.prototype.type = 'Glyph';

      Diamond.prototype.display_defaults = function() {
        return _.extend(Diamond.__super__.display_defaults.call(this), {
          fill_color: 'gray',
          fill_alpha: 1.0,
          line_color: 'red',
          line_width: 1,
          line_alpha: 1.0,
          line_join: 'miter',
          line_cap: 'butt',
          line_dash: [],
          line_dash_offset: 0
        });
      };

      return Diamond;

    })(Marker.Model);
    return {
      "Model": Diamond,
      "View": DiamondView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=diamond.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/glyph/diamond_cross',["underscore", "renderer/properties", "./marker"], function(_, Properties, Marker) {
    var DiamondCross, DiamondCrossView, _ref, _ref1;
    DiamondCrossView = (function(_super) {
      __extends(DiamondCrossView, _super);

      function DiamondCrossView() {
        _ref = DiamondCrossView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      DiamondCrossView.prototype._properties = ['line', 'fill'];

      DiamondCrossView.prototype._render = function(ctx, indices, glyph_props, sx, sy, size) {
        var i, r, _i, _len, _results;
        if (sx == null) {
          sx = this.sx;
        }
        if (sy == null) {
          sy = this.sy;
        }
        if (size == null) {
          size = this.size;
        }
        _results = [];
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          if (isNaN(sx[i] + sy[i] + size[i])) {
            continue;
          }
          r = size[i] / 2;
          ctx.beginPath();
          ctx.moveTo(sx[i], sy[i] + r);
          ctx.lineTo(sx[i] + r, sy[i]);
          ctx.lineTo(sx[i], sy[i] - r);
          ctx.lineTo(sx[i] - r, sy[i]);
          ctx.closePath();
          if (glyph_props.fill_properties.do_fill) {
            glyph_props.fill_properties.set_vectorize(ctx, i);
            ctx.fill();
          }
          if (glyph_props.line_properties.do_stroke) {
            glyph_props.line_properties.set_vectorize(ctx, i);
            ctx.moveTo(sx[i], sy[i] + r);
            ctx.lineTo(sx[i], sy[i] - r);
            ctx.moveTo(sx[i] - r, sy[i]);
            ctx.lineTo(sx[i] + r, sy[i]);
            _results.push(ctx.stroke());
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      return DiamondCrossView;

    })(Marker.View);
    DiamondCross = (function(_super) {
      __extends(DiamondCross, _super);

      function DiamondCross() {
        _ref1 = DiamondCross.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      DiamondCross.prototype.default_view = DiamondCrossView;

      DiamondCross.prototype.type = 'Glyph';

      DiamondCross.prototype.display_defaults = function() {
        return _.extend(DiamondCross.__super__.display_defaults.call(this), {
          fill_color: 'gray',
          fill_alpha: 1.0,
          line_color: 'red',
          line_width: 1,
          line_alpha: 1.0,
          line_join: 'miter',
          line_cap: 'butt',
          line_dash: [],
          line_dash_offset: 0
        });
      };

      return DiamondCross;

    })(Marker.Model);
    return {
      "Model": DiamondCross,
      "View": DiamondCrossView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=diamond_cross.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('mapper/color/linear_color_mapper',["common/has_properties"], function(HasProperties) {
    var LinearColorMapper, _ref;
    return LinearColorMapper = (function(_super) {
      __extends(LinearColorMapper, _super);

      function LinearColorMapper() {
        _ref = LinearColorMapper.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      LinearColorMapper.prototype.initialize = function(attrs, options) {
        LinearColorMapper.__super__.initialize.call(this, attrs, options);
        this.low = options.low;
        this.high = options.high;
        this.palette = this._build_palette(options.palette);
        return this.little_endian = this._is_little_endian();
      };

      LinearColorMapper.prototype.v_map_screen = function(data) {
        var N, buf, color, d, high, i, low, max, min, offset, scale, value, _i, _j, _k, _ref1, _ref2, _ref3;
        buf = new ArrayBuffer(data.length * 4);
        color = new Uint32Array(buf);
        max = -Infinity;
        min = Infinity;
        value = 0;
        for (i = _i = 0, _ref1 = data.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          value = data[i];
          if (value > max) {
            max = value;
          }
          if (value < min) {
            min = value;
          }
        }
        if (this.low != null) {
          low = this.low;
        } else {
          low = min;
        }
        if (this.high != null) {
          high = this.high;
        } else {
          high = max;
        }
        N = this.palette.length - 1;
        scale = N / (high - low);
        offset = -scale * low;
        if (this.little_endian) {
          for (i = _j = 0, _ref2 = data.length; 0 <= _ref2 ? _j < _ref2 : _j > _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
            d = data[i];
            if (d > high) {
              d = high;
            }
            if (d < low) {
              d = low;
            }
            value = this.palette[Math.floor(d * scale + offset)];
            color[i] = (0xff << 24) | ((value & 0xff0000) >> 16) | (value & 0xff00) | ((value & 0xff) << 16);
          }
        } else {
          for (i = _k = 0, _ref3 = data.length; 0 <= _ref3 ? _k < _ref3 : _k > _ref3; i = 0 <= _ref3 ? ++_k : --_k) {
            d = data[i];
            if (d > high) {
              d = high;
            }
            if (d < low) {
              d = low;
            }
            value = this.palette[Math.floor(d * scale + offset)];
            color[i] = (value << 8) | 0xff;
          }
        }
        return buf;
      };

      LinearColorMapper.prototype._is_little_endian = function() {
        var buf, buf32, buf8, little_endian;
        buf = new ArrayBuffer(4);
        buf8 = new Uint8ClampedArray(buf);
        buf32 = new Uint32Array(buf);
        buf32[1] = 0x0a0b0c0d;
        little_endian = true;
        if (buf8[4] === 0x0a && buf8[5] === 0x0b && buf8[6] === 0x0c && buf8[7] === 0x0d) {
          little_endian = false;
        }
        return little_endian;
      };

      LinearColorMapper.prototype._build_palette = function(palette) {
        var i, new_palette, _i, _ref1;
        new_palette = new Uint32Array(palette.length + 1);
        for (i = _i = 0, _ref1 = palette.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          new_palette[i] = palette[i];
        }
        new_palette[new_palette.length - 1] = palette[palette.length - 1];
        return new_palette;
      };

      return LinearColorMapper;

    })(HasProperties);
  });

}).call(this);

/*
//@ sourceMappingURL=linear_color_mapper.js.map
*/;
(function() {
  define('palettes/colorbrewer',[], function() {
    var colorbrewer;
    return colorbrewer = {
      YlGn: {
        3: [0xf7fcb9, 0xaddd8e, 0x31a354],
        4: [0xffffcc, 0xc2e699, 0x78c679, 0x238443],
        5: [0xffffcc, 0xc2e699, 0x78c679, 0x31a354, 0x006837],
        6: [0xffffcc, 0xd9f0a3, 0xaddd8e, 0x78c679, 0x31a354, 0x006837],
        7: [0xffffcc, 0xd9f0a3, 0xaddd8e, 0x78c679, 0x41ab5d, 0x238443, 0x005a32],
        8: [0xffffe5, 0xf7fcb9, 0xd9f0a3, 0xaddd8e, 0x78c679, 0x41ab5d, 0x238443, 0x005a32],
        9: [0xffffe5, 0xf7fcb9, 0xd9f0a3, 0xaddd8e, 0x78c679, 0x41ab5d, 0x238443, 0x006837, 0x004529]
      },
      YlGnBu: {
        3: [0xedf8b1, 0x7fcdbb, 0x2c7fb8],
        4: [0xffffcc, 0xa1dab4, 0x41b6c4, 0x225ea8],
        5: [0xffffcc, 0xa1dab4, 0x41b6c4, 0x2c7fb8, 0x253494],
        6: [0xffffcc, 0xc7e9b4, 0x7fcdbb, 0x41b6c4, 0x2c7fb8, 0x253494],
        7: [0xffffcc, 0xc7e9b4, 0x7fcdbb, 0x41b6c4, 0x1d91c0, 0x225ea8, 0x0c2c84],
        8: [0xffffd9, 0xedf8b1, 0xc7e9b4, 0x7fcdbb, 0x41b6c4, 0x1d91c0, 0x225ea8, 0x0c2c84],
        9: [0xffffd9, 0xedf8b1, 0xc7e9b4, 0x7fcdbb, 0x41b6c4, 0x1d91c0, 0x225ea8, 0x253494, 0x081d58]
      },
      GnBu: {
        3: [0xe0f3db, 0xa8ddb5, 0x43a2ca],
        4: [0xf0f9e8, 0xbae4bc, 0x7bccc4, 0x2b8cbe],
        5: [0xf0f9e8, 0xbae4bc, 0x7bccc4, 0x43a2ca, 0x0868ac],
        6: [0xf0f9e8, 0xccebc5, 0xa8ddb5, 0x7bccc4, 0x43a2ca, 0x0868ac],
        7: [0xf0f9e8, 0xccebc5, 0xa8ddb5, 0x7bccc4, 0x4eb3d3, 0x2b8cbe, 0x08589e],
        8: [0xf7fcf0, 0xe0f3db, 0xccebc5, 0xa8ddb5, 0x7bccc4, 0x4eb3d3, 0x2b8cbe, 0x08589e],
        9: [0xf7fcf0, 0xe0f3db, 0xccebc5, 0xa8ddb5, 0x7bccc4, 0x4eb3d3, 0x2b8cbe, 0x0868ac, 0x084081]
      },
      BuGn: {
        3: [0xe5f5f9, 0x99d8c9, 0x2ca25f],
        4: [0xedf8fb, 0xb2e2e2, 0x66c2a4, 0x238b45],
        5: [0xedf8fb, 0xb2e2e2, 0x66c2a4, 0x2ca25f, 0x006d2c],
        6: [0xedf8fb, 0xccece6, 0x99d8c9, 0x66c2a4, 0x2ca25f, 0x006d2c],
        7: [0xedf8fb, 0xccece6, 0x99d8c9, 0x66c2a4, 0x41ae76, 0x238b45, 0x005824],
        8: [0xf7fcfd, 0xe5f5f9, 0xccece6, 0x99d8c9, 0x66c2a4, 0x41ae76, 0x238b45, 0x005824],
        9: [0xf7fcfd, 0xe5f5f9, 0xccece6, 0x99d8c9, 0x66c2a4, 0x41ae76, 0x238b45, 0x006d2c, 0x00441b]
      },
      PuBuGn: {
        3: [0xece2f0, 0xa6bddb, 0x1c9099],
        4: [0xf6eff7, 0xbdc9e1, 0x67a9cf, 0x02818a],
        5: [0xf6eff7, 0xbdc9e1, 0x67a9cf, 0x1c9099, 0x016c59],
        6: [0xf6eff7, 0xd0d1e6, 0xa6bddb, 0x67a9cf, 0x1c9099, 0x016c59],
        7: [0xf6eff7, 0xd0d1e6, 0xa6bddb, 0x67a9cf, 0x3690c0, 0x02818a, 0x016450],
        8: [0xfff7fb, 0xece2f0, 0xd0d1e6, 0xa6bddb, 0x67a9cf, 0x3690c0, 0x02818a, 0x016450],
        9: [0xfff7fb, 0xece2f0, 0xd0d1e6, 0xa6bddb, 0x67a9cf, 0x3690c0, 0x02818a, 0x016c59, 0x014636]
      },
      PuBu: {
        3: [0xece7f2, 0xa6bddb, 0x2b8cbe],
        4: [0xf1eef6, 0xbdc9e1, 0x74a9cf, 0x0570b0],
        5: [0xf1eef6, 0xbdc9e1, 0x74a9cf, 0x2b8cbe, 0x045a8d],
        6: [0xf1eef6, 0xd0d1e6, 0xa6bddb, 0x74a9cf, 0x2b8cbe, 0x045a8d],
        7: [0xf1eef6, 0xd0d1e6, 0xa6bddb, 0x74a9cf, 0x3690c0, 0x0570b0, 0x034e7b],
        8: [0xfff7fb, 0xece7f2, 0xd0d1e6, 0xa6bddb, 0x74a9cf, 0x3690c0, 0x0570b0, 0x034e7b],
        9: [0xfff7fb, 0xece7f2, 0xd0d1e6, 0xa6bddb, 0x74a9cf, 0x3690c0, 0x0570b0, 0x045a8d, 0x023858]
      },
      BuPu: {
        3: [0xe0ecf4, 0x9ebcda, 0x8856a7],
        4: [0xedf8fb, 0xb3cde3, 0x8c96c6, 0x88419d],
        5: [0xedf8fb, 0xb3cde3, 0x8c96c6, 0x8856a7, 0x810f7c],
        6: [0xedf8fb, 0xbfd3e6, 0x9ebcda, 0x8c96c6, 0x8856a7, 0x810f7c],
        7: [0xedf8fb, 0xbfd3e6, 0x9ebcda, 0x8c96c6, 0x8c6bb1, 0x88419d, 0x6e016b],
        8: [0xf7fcfd, 0xe0ecf4, 0xbfd3e6, 0x9ebcda, 0x8c96c6, 0x8c6bb1, 0x88419d, 0x6e016b],
        9: [0xf7fcfd, 0xe0ecf4, 0xbfd3e6, 0x9ebcda, 0x8c96c6, 0x8c6bb1, 0x88419d, 0x810f7c, 0x4d004b]
      },
      RdPu: {
        3: [0xfde0dd, 0xfa9fb5, 0xc51b8a],
        4: [0xfeebe2, 0xfbb4b9, 0xf768a1, 0xae017e],
        5: [0xfeebe2, 0xfbb4b9, 0xf768a1, 0xc51b8a, 0x7a0177],
        6: [0xfeebe2, 0xfcc5c0, 0xfa9fb5, 0xf768a1, 0xc51b8a, 0x7a0177],
        7: [0xfeebe2, 0xfcc5c0, 0xfa9fb5, 0xf768a1, 0xdd3497, 0xae017e, 0x7a0177],
        8: [0xfff7f3, 0xfde0dd, 0xfcc5c0, 0xfa9fb5, 0xf768a1, 0xdd3497, 0xae017e, 0x7a0177],
        9: [0xfff7f3, 0xfde0dd, 0xfcc5c0, 0xfa9fb5, 0xf768a1, 0xdd3497, 0xae017e, 0x7a0177, 0x49006a]
      },
      PuRd: {
        3: [0xe7e1ef, 0xc994c7, 0xdd1c77],
        4: [0xf1eef6, 0xd7b5d8, 0xdf65b0, 0xce1256],
        5: [0xf1eef6, 0xd7b5d8, 0xdf65b0, 0xdd1c77, 0x980043],
        6: [0xf1eef6, 0xd4b9da, 0xc994c7, 0xdf65b0, 0xdd1c77, 0x980043],
        7: [0xf1eef6, 0xd4b9da, 0xc994c7, 0xdf65b0, 0xe7298a, 0xce1256, 0x91003f],
        8: [0xf7f4f9, 0xe7e1ef, 0xd4b9da, 0xc994c7, 0xdf65b0, 0xe7298a, 0xce1256, 0x91003f],
        9: [0xf7f4f9, 0xe7e1ef, 0xd4b9da, 0xc994c7, 0xdf65b0, 0xe7298a, 0xce1256, 0x980043, 0x67001f]
      },
      OrRd: {
        3: [0xfee8c8, 0xfdbb84, 0xe34a33],
        4: [0xfef0d9, 0xfdcc8a, 0xfc8d59, 0xd7301f],
        5: [0xfef0d9, 0xfdcc8a, 0xfc8d59, 0xe34a33, 0xb30000],
        6: [0xfef0d9, 0xfdd49e, 0xfdbb84, 0xfc8d59, 0xe34a33, 0xb30000],
        7: [0xfef0d9, 0xfdd49e, 0xfdbb84, 0xfc8d59, 0xef6548, 0xd7301f, 0x990000],
        8: [0xfff7ec, 0xfee8c8, 0xfdd49e, 0xfdbb84, 0xfc8d59, 0xef6548, 0xd7301f, 0x990000],
        9: [0xfff7ec, 0xfee8c8, 0xfdd49e, 0xfdbb84, 0xfc8d59, 0xef6548, 0xd7301f, 0xb30000, 0x7f0000]
      },
      YlOrRd: {
        3: [0xffeda0, 0xfeb24c, 0xf03b20],
        4: [0xffffb2, 0xfecc5c, 0xfd8d3c, 0xe31a1c],
        5: [0xffffb2, 0xfecc5c, 0xfd8d3c, 0xf03b20, 0xbd0026],
        6: [0xffffb2, 0xfed976, 0xfeb24c, 0xfd8d3c, 0xf03b20, 0xbd0026],
        7: [0xffffb2, 0xfed976, 0xfeb24c, 0xfd8d3c, 0xfc4e2a, 0xe31a1c, 0xb10026],
        8: [0xffffcc, 0xffeda0, 0xfed976, 0xfeb24c, 0xfd8d3c, 0xfc4e2a, 0xe31a1c, 0xb10026],
        9: [0xffffcc, 0xffeda0, 0xfed976, 0xfeb24c, 0xfd8d3c, 0xfc4e2a, 0xe31a1c, 0xbd0026, 0x800026]
      },
      YlOrBr: {
        3: [0xfff7bc, 0xfec44f, 0xd95f0e],
        4: [0xffffd4, 0xfed98e, 0xfe9929, 0xcc4c02],
        5: [0xffffd4, 0xfed98e, 0xfe9929, 0xd95f0e, 0x993404],
        6: [0xffffd4, 0xfee391, 0xfec44f, 0xfe9929, 0xd95f0e, 0x993404],
        7: [0xffffd4, 0xfee391, 0xfec44f, 0xfe9929, 0xec7014, 0xcc4c02, 0x8c2d04],
        8: [0xffffe5, 0xfff7bc, 0xfee391, 0xfec44f, 0xfe9929, 0xec7014, 0xcc4c02, 0x8c2d04],
        9: [0xffffe5, 0xfff7bc, 0xfee391, 0xfec44f, 0xfe9929, 0xec7014, 0xcc4c02, 0x993404, 0x662506]
      },
      Purples: {
        3: [0xefedf5, 0xbcbddc, 0x756bb1],
        4: [0xf2f0f7, 0xcbc9e2, 0x9e9ac8, 0x6a51a3],
        5: [0xf2f0f7, 0xcbc9e2, 0x9e9ac8, 0x756bb1, 0x54278f],
        6: [0xf2f0f7, 0xdadaeb, 0xbcbddc, 0x9e9ac8, 0x756bb1, 0x54278f],
        7: [0xf2f0f7, 0xdadaeb, 0xbcbddc, 0x9e9ac8, 0x807dba, 0x6a51a3, 0x4a1486],
        8: [0xfcfbfd, 0xefedf5, 0xdadaeb, 0xbcbddc, 0x9e9ac8, 0x807dba, 0x6a51a3, 0x4a1486],
        9: [0xfcfbfd, 0xefedf5, 0xdadaeb, 0xbcbddc, 0x9e9ac8, 0x807dba, 0x6a51a3, 0x54278f, 0x3f007d]
      },
      Blues: {
        3: [0xdeebf7, 0x9ecae1, 0x3182bd],
        4: [0xeff3ff, 0xbdd7e7, 0x6baed6, 0x2171b5],
        5: [0xeff3ff, 0xbdd7e7, 0x6baed6, 0x3182bd, 0x08519c],
        6: [0xeff3ff, 0xc6dbef, 0x9ecae1, 0x6baed6, 0x3182bd, 0x08519c],
        7: [0xeff3ff, 0xc6dbef, 0x9ecae1, 0x6baed6, 0x4292c6, 0x2171b5, 0x084594],
        8: [0xf7fbff, 0xdeebf7, 0xc6dbef, 0x9ecae1, 0x6baed6, 0x4292c6, 0x2171b5, 0x084594],
        9: [0xf7fbff, 0xdeebf7, 0xc6dbef, 0x9ecae1, 0x6baed6, 0x4292c6, 0x2171b5, 0x08519c, 0x08306b]
      },
      Greens: {
        3: [0xe5f5e0, 0xa1d99b, 0x31a354],
        4: [0xedf8e9, 0xbae4b3, 0x74c476, 0x238b45],
        5: [0xedf8e9, 0xbae4b3, 0x74c476, 0x31a354, 0x006d2c],
        6: [0xedf8e9, 0xc7e9c0, 0xa1d99b, 0x74c476, 0x31a354, 0x006d2c],
        7: [0xedf8e9, 0xc7e9c0, 0xa1d99b, 0x74c476, 0x41ab5d, 0x238b45, 0x005a32],
        8: [0xf7fcf5, 0xe5f5e0, 0xc7e9c0, 0xa1d99b, 0x74c476, 0x41ab5d, 0x238b45, 0x005a32],
        9: [0xf7fcf5, 0xe5f5e0, 0xc7e9c0, 0xa1d99b, 0x74c476, 0x41ab5d, 0x238b45, 0x006d2c, 0x00441b]
      },
      Oranges: {
        3: [0xfee6ce, 0xfdae6b, 0xe6550d],
        4: [0xfeedde, 0xfdbe85, 0xfd8d3c, 0xd94701],
        5: [0xfeedde, 0xfdbe85, 0xfd8d3c, 0xe6550d, 0xa63603],
        6: [0xfeedde, 0xfdd0a2, 0xfdae6b, 0xfd8d3c, 0xe6550d, 0xa63603],
        7: [0xfeedde, 0xfdd0a2, 0xfdae6b, 0xfd8d3c, 0xf16913, 0xd94801, 0x8c2d04],
        8: [0xfff5eb, 0xfee6ce, 0xfdd0a2, 0xfdae6b, 0xfd8d3c, 0xf16913, 0xd94801, 0x8c2d04],
        9: [0xfff5eb, 0xfee6ce, 0xfdd0a2, 0xfdae6b, 0xfd8d3c, 0xf16913, 0xd94801, 0xa63603, 0x7f2704]
      },
      Reds: {
        3: [0xfee0d2, 0xfc9272, 0xde2d26],
        4: [0xfee5d9, 0xfcae91, 0xfb6a4a, 0xcb181d],
        5: [0xfee5d9, 0xfcae91, 0xfb6a4a, 0xde2d26, 0xa50f15],
        6: [0xfee5d9, 0xfcbba1, 0xfc9272, 0xfb6a4a, 0xde2d26, 0xa50f15],
        7: [0xfee5d9, 0xfcbba1, 0xfc9272, 0xfb6a4a, 0xef3b2c, 0xcb181d, 0x99000d],
        8: [0xfff5f0, 0xfee0d2, 0xfcbba1, 0xfc9272, 0xfb6a4a, 0xef3b2c, 0xcb181d, 0x99000d],
        9: [0xfff5f0, 0xfee0d2, 0xfcbba1, 0xfc9272, 0xfb6a4a, 0xef3b2c, 0xcb181d, 0xa50f15, 0x67000d]
      },
      Greys: {
        3: [0xf0f0f0, 0xbdbdbd, 0x636363],
        4: [0xf7f7f7, 0xcccccc, 0x969696, 0x525252],
        5: [0xf7f7f7, 0xcccccc, 0x969696, 0x636363, 0x252525],
        6: [0xf7f7f7, 0xd9d9d9, 0xbdbdbd, 0x969696, 0x636363, 0x252525],
        7: [0xf7f7f7, 0xd9d9d9, 0xbdbdbd, 0x969696, 0x737373, 0x525252, 0x252525],
        8: [0xffffff, 0xf0f0f0, 0xd9d9d9, 0xbdbdbd, 0x969696, 0x737373, 0x525252, 0x252525],
        9: [0xffffff, 0xf0f0f0, 0xd9d9d9, 0xbdbdbd, 0x969696, 0x737373, 0x525252, 0x252525, 0x000000]
      },
      PuOr: {
        3: [0xf1a340, 0xf7f7f7, 0x998ec3],
        4: [0xe66101, 0xfdb863, 0xb2abd2, 0x5e3c99],
        5: [0xe66101, 0xfdb863, 0xf7f7f7, 0xb2abd2, 0x5e3c99],
        6: [0xb35806, 0xf1a340, 0xfee0b6, 0xd8daeb, 0x998ec3, 0x542788],
        7: [0xb35806, 0xf1a340, 0xfee0b6, 0xf7f7f7, 0xd8daeb, 0x998ec3, 0x542788],
        8: [0xb35806, 0xe08214, 0xfdb863, 0xfee0b6, 0xd8daeb, 0xb2abd2, 0x8073ac, 0x542788],
        9: [0xb35806, 0xe08214, 0xfdb863, 0xfee0b6, 0xf7f7f7, 0xd8daeb, 0xb2abd2, 0x8073ac, 0x542788],
        10: [0x7f3b08, 0xb35806, 0xe08214, 0xfdb863, 0xfee0b6, 0xd8daeb, 0xb2abd2, 0x8073ac, 0x542788, 0x2d004b],
        11: [0x7f3b08, 0xb35806, 0xe08214, 0xfdb863, 0xfee0b6, 0xf7f7f7, 0xd8daeb, 0xb2abd2, 0x8073ac, 0x542788, 0x2d004b]
      },
      BrBG: {
        3: [0xd8b365, 0xf5f5f5, 0x5ab4ac],
        4: [0xa6611a, 0xdfc27d, 0x80cdc1, 0x018571],
        5: [0xa6611a, 0xdfc27d, 0xf5f5f5, 0x80cdc1, 0x018571],
        6: [0x8c510a, 0xd8b365, 0xf6e8c3, 0xc7eae5, 0x5ab4ac, 0x01665e],
        7: [0x8c510a, 0xd8b365, 0xf6e8c3, 0xf5f5f5, 0xc7eae5, 0x5ab4ac, 0x01665e],
        8: [0x8c510a, 0xbf812d, 0xdfc27d, 0xf6e8c3, 0xc7eae5, 0x80cdc1, 0x35978f, 0x01665e],
        9: [0x8c510a, 0xbf812d, 0xdfc27d, 0xf6e8c3, 0xf5f5f5, 0xc7eae5, 0x80cdc1, 0x35978f, 0x01665e],
        10: [0x543005, 0x8c510a, 0xbf812d, 0xdfc27d, 0xf6e8c3, 0xc7eae5, 0x80cdc1, 0x35978f, 0x01665e, 0x003c30],
        11: [0x543005, 0x8c510a, 0xbf812d, 0xdfc27d, 0xf6e8c3, 0xf5f5f5, 0xc7eae5, 0x80cdc1, 0x35978f, 0x01665e, 0x003c30]
      },
      PRGn: {
        3: [0xaf8dc3, 0xf7f7f7, 0x7fbf7b],
        4: [0x7b3294, 0xc2a5cf, 0xa6dba0, 0x008837],
        5: [0x7b3294, 0xc2a5cf, 0xf7f7f7, 0xa6dba0, 0x008837],
        6: [0x762a83, 0xaf8dc3, 0xe7d4e8, 0xd9f0d3, 0x7fbf7b, 0x1b7837],
        7: [0x762a83, 0xaf8dc3, 0xe7d4e8, 0xf7f7f7, 0xd9f0d3, 0x7fbf7b, 0x1b7837],
        8: [0x762a83, 0x9970ab, 0xc2a5cf, 0xe7d4e8, 0xd9f0d3, 0xa6dba0, 0x5aae61, 0x1b7837],
        9: [0x762a83, 0x9970ab, 0xc2a5cf, 0xe7d4e8, 0xf7f7f7, 0xd9f0d3, 0xa6dba0, 0x5aae61, 0x1b7837],
        10: [0x40004b, 0x762a83, 0x9970ab, 0xc2a5cf, 0xe7d4e8, 0xd9f0d3, 0xa6dba0, 0x5aae61, 0x1b7837, 0x00441b],
        11: [0x40004b, 0x762a83, 0x9970ab, 0xc2a5cf, 0xe7d4e8, 0xf7f7f7, 0xd9f0d3, 0xa6dba0, 0x5aae61, 0x1b7837, 0x00441b]
      },
      PiYG: {
        3: [0xe9a3c9, 0xf7f7f7, 0xa1d76a],
        4: [0xd01c8b, 0xf1b6da, 0xb8e186, 0x4dac26],
        5: [0xd01c8b, 0xf1b6da, 0xf7f7f7, 0xb8e186, 0x4dac26],
        6: [0xc51b7d, 0xe9a3c9, 0xfde0ef, 0xe6f5d0, 0xa1d76a, 0x4d9221],
        7: [0xc51b7d, 0xe9a3c9, 0xfde0ef, 0xf7f7f7, 0xe6f5d0, 0xa1d76a, 0x4d9221],
        8: [0xc51b7d, 0xde77ae, 0xf1b6da, 0xfde0ef, 0xe6f5d0, 0xb8e186, 0x7fbc41, 0x4d9221],
        9: [0xc51b7d, 0xde77ae, 0xf1b6da, 0xfde0ef, 0xf7f7f7, 0xe6f5d0, 0xb8e186, 0x7fbc41, 0x4d9221],
        10: [0x8e0152, 0xc51b7d, 0xde77ae, 0xf1b6da, 0xfde0ef, 0xe6f5d0, 0xb8e186, 0x7fbc41, 0x4d9221, 0x276419],
        11: [0x8e0152, 0xc51b7d, 0xde77ae, 0xf1b6da, 0xfde0ef, 0xf7f7f7, 0xe6f5d0, 0xb8e186, 0x7fbc41, 0x4d9221, 0x276419]
      },
      RdBu: {
        3: [0xef8a62, 0xf7f7f7, 0x67a9cf],
        4: [0xca0020, 0xf4a582, 0x92c5de, 0x0571b0],
        5: [0xca0020, 0xf4a582, 0xf7f7f7, 0x92c5de, 0x0571b0],
        6: [0xb2182b, 0xef8a62, 0xfddbc7, 0xd1e5f0, 0x67a9cf, 0x2166ac],
        7: [0xb2182b, 0xef8a62, 0xfddbc7, 0xf7f7f7, 0xd1e5f0, 0x67a9cf, 0x2166ac],
        8: [0xb2182b, 0xd6604d, 0xf4a582, 0xfddbc7, 0xd1e5f0, 0x92c5de, 0x4393c3, 0x2166ac],
        9: [0xb2182b, 0xd6604d, 0xf4a582, 0xfddbc7, 0xf7f7f7, 0xd1e5f0, 0x92c5de, 0x4393c3, 0x2166ac],
        10: [0x67001f, 0xb2182b, 0xd6604d, 0xf4a582, 0xfddbc7, 0xd1e5f0, 0x92c5de, 0x4393c3, 0x2166ac, 0x053061],
        11: [0x67001f, 0xb2182b, 0xd6604d, 0xf4a582, 0xfddbc7, 0xf7f7f7, 0xd1e5f0, 0x92c5de, 0x4393c3, 0x2166ac, 0x053061]
      },
      RdGy: {
        3: [0xef8a62, 0xffffff, 0x999999],
        4: [0xca0020, 0xf4a582, 0xbababa, 0x404040],
        5: [0xca0020, 0xf4a582, 0xffffff, 0xbababa, 0x404040],
        6: [0xb2182b, 0xef8a62, 0xfddbc7, 0xe0e0e0, 0x999999, 0x4d4d4d],
        7: [0xb2182b, 0xef8a62, 0xfddbc7, 0xffffff, 0xe0e0e0, 0x999999, 0x4d4d4d],
        8: [0xb2182b, 0xd6604d, 0xf4a582, 0xfddbc7, 0xe0e0e0, 0xbababa, 0x878787, 0x4d4d4d],
        9: [0xb2182b, 0xd6604d, 0xf4a582, 0xfddbc7, 0xffffff, 0xe0e0e0, 0xbababa, 0x878787, 0x4d4d4d],
        10: [0x67001f, 0xb2182b, 0xd6604d, 0xf4a582, 0xfddbc7, 0xe0e0e0, 0xbababa, 0x878787, 0x4d4d4d, 0x1a1a1a],
        11: [0x67001f, 0xb2182b, 0xd6604d, 0xf4a582, 0xfddbc7, 0xffffff, 0xe0e0e0, 0xbababa, 0x878787, 0x4d4d4d, 0x1a1a1a]
      },
      RdYlBu: {
        3: [0xfc8d59, 0xffffbf, 0x91bfdb],
        4: [0xd7191c, 0xfdae61, 0xabd9e9, 0x2c7bb6],
        5: [0xd7191c, 0xfdae61, 0xffffbf, 0xabd9e9, 0x2c7bb6],
        6: [0xd73027, 0xfc8d59, 0xfee090, 0xe0f3f8, 0x91bfdb, 0x4575b4],
        7: [0xd73027, 0xfc8d59, 0xfee090, 0xffffbf, 0xe0f3f8, 0x91bfdb, 0x4575b4],
        8: [0xd73027, 0xf46d43, 0xfdae61, 0xfee090, 0xe0f3f8, 0xabd9e9, 0x74add1, 0x4575b4],
        9: [0xd73027, 0xf46d43, 0xfdae61, 0xfee090, 0xffffbf, 0xe0f3f8, 0xabd9e9, 0x74add1, 0x4575b4],
        10: [0xa50026, 0xd73027, 0xf46d43, 0xfdae61, 0xfee090, 0xe0f3f8, 0xabd9e9, 0x74add1, 0x4575b4, 0x313695],
        11: [0xa50026, 0xd73027, 0xf46d43, 0xfdae61, 0xfee090, 0xffffbf, 0xe0f3f8, 0xabd9e9, 0x74add1, 0x4575b4, 0x313695]
      },
      Spectral: {
        3: [0xfc8d59, 0xffffbf, 0x99d594],
        4: [0xd7191c, 0xfdae61, 0xabdda4, 0x2b83ba],
        5: [0xd7191c, 0xfdae61, 0xffffbf, 0xabdda4, 0x2b83ba],
        6: [0xd53e4f, 0xfc8d59, 0xfee08b, 0xe6f598, 0x99d594, 0x3288bd],
        7: [0xd53e4f, 0xfc8d59, 0xfee08b, 0xffffbf, 0xe6f598, 0x99d594, 0x3288bd],
        8: [0xd53e4f, 0xf46d43, 0xfdae61, 0xfee08b, 0xe6f598, 0xabdda4, 0x66c2a5, 0x3288bd],
        9: [0xd53e4f, 0xf46d43, 0xfdae61, 0xfee08b, 0xffffbf, 0xe6f598, 0xabdda4, 0x66c2a5, 0x3288bd],
        10: [0x9e0142, 0xd53e4f, 0xf46d43, 0xfdae61, 0xfee08b, 0xe6f598, 0xabdda4, 0x66c2a5, 0x3288bd, 0x5e4fa2],
        11: [0x9e0142, 0xd53e4f, 0xf46d43, 0xfdae61, 0xfee08b, 0xffffbf, 0xe6f598, 0xabdda4, 0x66c2a5, 0x3288bd, 0x5e4fa2]
      },
      RdYlGn: {
        3: [0xfc8d59, 0xffffbf, 0x91cf60],
        4: [0xd7191c, 0xfdae61, 0xa6d96a, 0x1a9641],
        5: [0xd7191c, 0xfdae61, 0xffffbf, 0xa6d96a, 0x1a9641],
        6: [0xd73027, 0xfc8d59, 0xfee08b, 0xd9ef8b, 0x91cf60, 0x1a9850],
        7: [0xd73027, 0xfc8d59, 0xfee08b, 0xffffbf, 0xd9ef8b, 0x91cf60, 0x1a9850],
        8: [0xd73027, 0xf46d43, 0xfdae61, 0xfee08b, 0xd9ef8b, 0xa6d96a, 0x66bd63, 0x1a9850],
        9: [0xd73027, 0xf46d43, 0xfdae61, 0xfee08b, 0xffffbf, 0xd9ef8b, 0xa6d96a, 0x66bd63, 0x1a9850],
        10: [0xa50026, 0xd73027, 0xf46d43, 0xfdae61, 0xfee08b, 0xd9ef8b, 0xa6d96a, 0x66bd63, 0x1a9850, 0x006837],
        11: [0xa50026, 0xd73027, 0xf46d43, 0xfdae61, 0xfee08b, 0xffffbf, 0xd9ef8b, 0xa6d96a, 0x66bd63, 0x1a9850, 0x006837]
      }
    };
  });

}).call(this);

/*
//@ sourceMappingURL=colorbrewer.js.map
*/;
(function() {
  define('palettes/palettes',["./colorbrewer"], function(colorbrewer) {
    var all_palettes, items, name, num, pal;
    all_palettes = {};
    for (name in colorbrewer) {
      items = colorbrewer[name];
      for (num in items) {
        pal = items[num];
        all_palettes["" + name + "-" + num] = pal.reverse();
      }
    }
    return {
      "all_palettes": all_palettes
    };
  });

}).call(this);

/*
//@ sourceMappingURL=palettes.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/glyph/image',["underscore", "renderer/properties", "mapper/color/linear_color_mapper", "palettes/palettes", "./glyph"], function(_, Properties, LinearColorMapper, Palettes, Glyph) {
    var ImageGlyph, ImageView, all_palettes, _ref, _ref1;
    all_palettes = Palettes.all_palettes;
    ImageView = (function(_super) {
      __extends(ImageView, _super);

      function ImageView() {
        _ref = ImageView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      ImageView.prototype._fields = ['image:array', 'x', 'y', 'dw', 'dh', 'palette:string'];

      ImageView.prototype._properties = [];

      ImageView.prototype._set_data = function(data) {
        var buf, buf8, canvas, cmap, ctx, i, image_data, img, _i, _j, _ref1, _ref2, _results;
        this.data = data;
        for (i = _i = 0, _ref1 = this.y.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          this.y[i] += this.dh[i];
        }
        if ((this.image_data == null) || this.image_data.length !== this.image.length) {
          this.image_data = new Array(this.image.length);
        }
        if ((this.width == null) || this.width.length !== this.image.length) {
          this.width = new Array(this.image.length);
        }
        if ((this.height == null) || this.height.length !== this.image.length) {
          this.height = new Array(this.image.length);
        }
        _results = [];
        for (i = _j = 0, _ref2 = this.image.length; 0 <= _ref2 ? _j < _ref2 : _j > _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
          this.height[i] = this.image[i].length;
          this.width[i] = this.image[i][0].length;
          canvas = document.createElement('canvas');
          canvas.width = this.width[i];
          canvas.height = this.height[i];
          ctx = canvas.getContext('2d');
          image_data = ctx.getImageData(0, 0, this.width[i], this.height[i]);
          cmap = new LinearColorMapper({}, {
            palette: all_palettes[this.palette[i]]
          });
          img = _.flatten(this.image[i]);
          buf = cmap.v_map_screen(img);
          buf8 = new Uint8ClampedArray(buf);
          image_data.data.set(buf8);
          ctx.putImageData(image_data, 0, 0);
          _results.push(this.image_data[i] = canvas);
        }
        return _results;
      };

      ImageView.prototype._map_data = function() {
        var _ref1;
        _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
        this.sw = this.distance_vector('x', 'dw', 'edge');
        return this.sh = this.distance_vector('y', 'dh', 'edge');
      };

      ImageView.prototype._render = function(ctx, indices, glyph_props) {
        var i, old_smoothing, y_offset, _i, _len;
        old_smoothing = ctx.getImageSmoothingEnabled();
        ctx.setImageSmoothingEnabled(false);
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          if (isNaN(this.sx[i] + this.sy[i] + this.sw[i] + this.sh[i])) {
            continue;
          }
          y_offset = this.sy[i] + this.sh[i] / 2;
          ctx.translate(0, y_offset);
          ctx.scale(1, -1);
          ctx.translate(0, -y_offset);
          ctx.drawImage(this.image_data[i], this.sx[i] | 0, this.sy[i] | 0, this.sw[i], this.sh[i]);
          ctx.translate(0, y_offset);
          ctx.scale(1, -1);
          ctx.translate(0, -y_offset);
        }
        ctx.setImageSmoothingEnabled(old_smoothing);
        return ctx.restore();
      };

      return ImageView;

    })(Glyph.View);
    ImageGlyph = (function(_super) {
      __extends(ImageGlyph, _super);

      function ImageGlyph() {
        _ref1 = ImageGlyph.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      ImageGlyph.prototype.default_view = ImageView;

      ImageGlyph.prototype.type = 'Glyph';

      ImageGlyph.prototype.display_defaults = function() {
        return _.extend(ImageGlyph.__super__.display_defaults.call(this), {
          level: 'underlay'
        });
      };

      return ImageGlyph;

    })(Glyph.Model);
    return {
      "Model": ImageGlyph,
      "View": ImageView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=image.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/glyph/image_rgba',["underscore", "renderer/properties", "./glyph"], function(_, Properties, Glyph) {
    var ImageRGBAGlyph, ImageRGBAView, glyph_properties, _ref, _ref1;
    glyph_properties = Properties.glyph_properties;
    ImageRGBAView = (function(_super) {
      __extends(ImageRGBAView, _super);

      function ImageRGBAView() {
        _ref = ImageRGBAView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      ImageRGBAView.prototype._fields = ['image:array', 'x', 'y', 'dw', 'dh'];

      ImageRGBAView.prototype._properties = [];

      ImageRGBAView.prototype._set_data = function() {
        var buf, buf8, canvas, color, ctx, flat, i, image_data, j, _i, _j, _k, _ref1, _ref2, _ref3, _results;
        for (i = _i = 0, _ref1 = this.y.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          this.y[i] += this.dh[i];
        }
        if ((this.image_data == null) || this.image_data.length !== this.image.length) {
          this.image_data = new Array(this.image.length);
        }
        if ((this.width == null) || this.width.length !== this.image.length) {
          this.width = new Array(this.image.length);
        }
        if ((this.height == null) || this.height.length !== this.image.length) {
          this.height = new Array(this.image.length);
        }
        _results = [];
        for (i = _j = 0, _ref2 = this.image.length; 0 <= _ref2 ? _j < _ref2 : _j > _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
          this.height[i] = this.image[i].length;
          this.width[i] = this.image[i][0].length;
          canvas = document.createElement('canvas');
          canvas.width = this.width[i];
          canvas.height = this.height[i];
          ctx = canvas.getContext('2d');
          image_data = ctx.getImageData(0, 0, this.width[i], this.height[i]);
          flat = _.flatten(this.image[i]);
          buf = new ArrayBuffer(flat.length * 4);
          color = new Uint32Array(buf);
          for (j = _k = 0, _ref3 = flat.length; 0 <= _ref3 ? _k < _ref3 : _k > _ref3; j = 0 <= _ref3 ? ++_k : --_k) {
            color[j] = flat[j];
          }
          buf8 = new Uint8ClampedArray(buf);
          image_data.data.set(buf8);
          ctx.putImageData(image_data, 0, 0);
          _results.push(this.image_data[i] = canvas);
        }
        return _results;
      };

      ImageRGBAView.prototype._map_data = function() {
        var _ref1;
        _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
        this.sw = this.distance_vector('x', 'dw', 'edge');
        return this.sh = this.distance_vector('y', 'dh', 'edge');
      };

      ImageRGBAView.prototype._render = function(ctx, indices, glyph_props) {
        var i, old_smoothing, y_offset, _i, _len;
        old_smoothing = ctx.getImageSmoothingEnabled();
        ctx.setImageSmoothingEnabled(false);
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          if (isNaN(this.sx[i] + this.sy[i] + this.sw[i] + this.sh[i])) {
            continue;
          }
          y_offset = this.sy[i] + this.sh[i] / 2;
          ctx.translate(0, y_offset);
          ctx.scale(1, -1);
          ctx.translate(0, -y_offset);
          ctx.drawImage(this.image_data[i], this.sx[i] | 0, this.sy[i] | 0, this.sw[i], this.sh[i]);
          ctx.translate(0, y_offset);
          ctx.scale(1, -1);
          ctx.translate(0, -y_offset);
        }
        ctx.setImageSmoothingEnabled(old_smoothing);
        return ctx.restore();
      };

      return ImageRGBAView;

    })(Glyph.View);
    ImageRGBAGlyph = (function(_super) {
      __extends(ImageRGBAGlyph, _super);

      function ImageRGBAGlyph() {
        _ref1 = ImageRGBAGlyph.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      ImageRGBAGlyph.prototype.default_view = ImageRGBAView;

      ImageRGBAGlyph.prototype.type = 'Glyph';

      ImageRGBAGlyph.prototype.display_defaults = function() {
        return _.extend(ImageRGBAGlyph.__super__.display_defaults.call(this), {
          level: 'underlay'
        });
      };

      return ImageRGBAGlyph;

    })(Glyph.Model);
    return {
      "Model": ImageRGBAGlyph,
      "View": ImageRGBAView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=image_rgba.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/glyph/image_uri',["underscore", "renderer/properties", "./glyph"], function(_, Properties, Glyph) {
    var ImageURIGlyph, ImageURIView, glyph_properties, _ref, _ref1;
    glyph_properties = Properties.glyph_properties;
    ImageURIView = (function(_super) {
      __extends(ImageURIView, _super);

      function ImageURIView() {
        _ref = ImageURIView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      ImageURIView.prototype._fields = ['url:string', 'x', 'y', 'angle'];

      ImageURIView.prototype._properties = [];

      ImageURIView.prototype._set_data = function(data) {
        var img;
        this.data = data;
        this.image = (function() {
          var _i, _len, _ref1, _results;
          _ref1 = this.url;
          _results = [];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            img = _ref1[_i];
            _results.push(null);
          }
          return _results;
        }).call(this);
        this.need_load = (function() {
          var _i, _len, _ref1, _results;
          _ref1 = this.url;
          _results = [];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            img = _ref1[_i];
            _results.push(true);
          }
          return _results;
        }).call(this);
        return this.loaded = (function() {
          var _i, _len, _ref1, _results;
          _ref1 = this.url;
          _results = [];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            img = _ref1[_i];
            _results.push(false);
          }
          return _results;
        }).call(this);
      };

      ImageURIView.prototype._map_data = function() {
        var _ref1;
        return _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1], _ref1;
      };

      ImageURIView.prototype._render = function(ctx, indices, glyph_props) {
        var i, img, _i, _len,
          _this = this;
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          if (isNaN(this.sx[i] + this.sy[i] + this.angle[i])) {
            continue;
          }
          if (this.need_load[i]) {
            img = new Image();
            img.onload = (function(img, i) {
              return function() {
                _this.loaded[i] = true;
                _this.image[i] = img;
                ctx.save();
                ctx.beginPath();
                ctx.rect(vs.get('border_left') + 1, vs.get('border_top') + 1, vs.get('inner_width') - 2, vs.get('inner_height') - 2);
                ctx.clip();
                _this._render_image(ctx, vs, i, img);
                return ctx.restore();
              };
            })(img, i);
            img.src = this.url[i];
            this.need_load[i] = false;
          } else if (this.loaded[i]) {
            this._render_image(ctx, vs, i, this.image[i]);
          }
        }
        return ctx.restore();
      };

      ImageURIView.prototype._render_image = function(ctx, vs, i, img) {
        if (this.angle[i]) {
          ctx.translate(this.sx[i], this.sy[i]);
          ctx.rotate(this.angle[i]);
          ctx.drawImage(img, 0, 0);
          ctx.rotate(-this.angle[i]);
          return ctx.translate(-this.sx[i], -this.sy[i]);
        } else {
          return ctx.drawImage(img, this.sx[i], this.sy[i]);
        }
      };

      return ImageURIView;

    })(Glyph.View);
    ImageURIGlyph = (function(_super) {
      __extends(ImageURIGlyph, _super);

      function ImageURIGlyph() {
        _ref1 = ImageURIGlyph.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      ImageURIGlyph.prototype.default_view = ImageURIView;

      ImageURIGlyph.prototype.type = 'Glyph';

      ImageURIGlyph.prototype.display_defaults = function() {
        return _.extend(ImageURIGlyph.__super__.display_defaults.call(this), {
          level: 'underlay'
        });
      };

      return ImageURIGlyph;

    })(Glyph.Model);
    return {
      "Model": ImageURIGlyph,
      "View": ImageURIView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=image_uri.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/glyph/inverted_triangle',["underscore", "renderer/properties", "./marker"], function(_, Properties, Marker) {
    var InvertedTriangle, InvertedTriangleView, _ref, _ref1;
    InvertedTriangleView = (function(_super) {
      __extends(InvertedTriangleView, _super);

      function InvertedTriangleView() {
        _ref = InvertedTriangleView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      InvertedTriangleView.prototype._fields = ['x', 'y', 'size'];

      InvertedTriangleView.prototype._properties = ['line', 'fill'];

      InvertedTriangleView.prototype._render = function(ctx, indices, glyph_props, sx, sy, size) {
        var a, h, i, r, _i, _len, _results;
        if (sx == null) {
          sx = this.sx;
        }
        if (sy == null) {
          sy = this.sy;
        }
        if (size == null) {
          size = this.size;
        }
        _results = [];
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          if (isNaN(sx[i] + sy[i] + size[i])) {
            continue;
          }
          a = size[i] * Math.sqrt(3) / 6;
          r = size[i] / 2;
          h = size[i] * Math.sqrt(3) / 2;
          ctx.beginPath();
          ctx.moveTo(sx[i] - r, sy[i] - a);
          ctx.lineTo(sx[i] + r, sy[i] - a);
          ctx.lineTo(sx[i], sy[i] - a + h);
          ctx.closePath();
          if (glyph_props.fill_properties.do_fill) {
            glyph_props.fill_properties.set_vectorize(ctx, i);
            ctx.fill();
          }
          if (glyph_props.line_properties.do_stroke) {
            glyph_props.line_properties.set_vectorize(ctx, i);
            _results.push(ctx.stroke());
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      return InvertedTriangleView;

    })(Marker.View);
    InvertedTriangle = (function(_super) {
      __extends(InvertedTriangle, _super);

      function InvertedTriangle() {
        _ref1 = InvertedTriangle.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      InvertedTriangle.prototype.default_view = InvertedTriangleView;

      InvertedTriangle.prototype.type = 'Glyph';

      InvertedTriangle.prototype.display_defaults = function() {
        return _.extend(InvertedTriangle.__super__.display_defaults.call(this), {
          fill_color: 'gray',
          fill_alpha: 1.0,
          line_color: 'red',
          line_width: 1,
          line_alpha: 1.0,
          line_join: 'miter',
          line_cap: 'butt',
          line_dash: [],
          line_dash_offset: 0
        });
      };

      return InvertedTriangle;

    })(Marker.Model);
    return {
      "Model": InvertedTriangle,
      "View": InvertedTriangleView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=inverted_triangle.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/glyph/line',["underscore", "renderer/properties", "./glyph"], function(_, Properties, Glyph) {
    var Line, LineView, _ref, _ref1;
    LineView = (function(_super) {
      __extends(LineView, _super);

      function LineView() {
        _ref = LineView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      LineView.prototype._fields = ['x', 'y'];

      LineView.prototype._properties = ['line'];

      LineView.prototype._map_data = function() {
        var _ref1;
        return _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1], _ref1;
      };

      LineView.prototype._render = function(ctx, indices, glyph_props) {
        var drawing, i, _i, _len;
        drawing = false;
        glyph_props.line_properties.set_vectorize(ctx, 0);
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          if (isNaN(this.sx[i] + this.sy[i]) && drawing) {
            ctx.stroke();
            ctx.beginPath();
            drawing = false;
            continue;
          }
          if (drawing) {
            ctx.lineTo(this.sx[i], this.sy[i]);
          } else {
            ctx.beginPath();
            ctx.moveTo(this.sx[i], this.sy[i]);
            drawing = true;
          }
        }
        if (drawing) {
          return ctx.stroke();
        }
      };

      LineView.prototype.draw_legend = function(ctx, x0, x1, y0, y1) {
        return this._generic_line_legend(ctx, x0, x1, y0, y1);
      };

      return LineView;

    })(Glyph.View);
    Line = (function(_super) {
      __extends(Line, _super);

      function Line() {
        _ref1 = Line.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Line.prototype.default_view = LineView;

      Line.prototype.type = 'Glyph';

      Line.prototype.display_defaults = function() {
        return _.extend(Line.__super__.display_defaults.call(this), {
          line_color: 'red',
          line_width: 1,
          line_alpha: 1.0,
          line_join: 'miter',
          line_cap: 'butt',
          line_dash: [],
          line_dash_offset: 0
        });
      };

      return Line;

    })(Glyph.Model);
    return {
      "Model": Line,
      "View": LineView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=line.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/glyph/multi_line',["underscore", "renderer/properties", "./glyph"], function(_, Properties, Glyph) {
    var MultiLine, MultiLineView, _ref, _ref1;
    MultiLineView = (function(_super) {
      __extends(MultiLineView, _super);

      function MultiLineView() {
        _ref = MultiLineView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      MultiLineView.prototype._fields = ['xs', 'ys'];

      MultiLineView.prototype._properties = ['line'];

      MultiLineView.prototype._map_data = function() {
        return null;
      };

      MultiLineView.prototype._render = function(ctx, indices, glyph_props) {
        var i, j, sx, sy, x, y, _i, _j, _len, _ref1, _ref2, _results;
        _results = [];
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          x = this.xs[i];
          y = this.ys[i];
          _ref1 = this.plot_view.map_to_screen(x, this.glyph_props.xs.units, y, this.glyph_props.ys.units), sx = _ref1[0], sy = _ref1[1];
          glyph_props.line_properties.set_vectorize(ctx, i);
          for (j = _j = 0, _ref2 = sx.length; 0 <= _ref2 ? _j < _ref2 : _j > _ref2; j = 0 <= _ref2 ? ++_j : --_j) {
            if (j === 0) {
              ctx.beginPath();
              ctx.moveTo(sx[j], sy[j]);
              continue;
            } else if (isNaN(sx[j]) || isNaN(sy[j])) {
              ctx.stroke();
              ctx.beginPath();
              continue;
            } else {
              ctx.lineTo(sx[j], sy[j]);
            }
          }
          _results.push(ctx.stroke());
        }
        return _results;
      };

      MultiLineView.prototype.draw_legend = function(ctx, x0, x1, y0, y1) {
        return this._generic_line_legend(ctx, x0, x1, y0, y1);
      };

      return MultiLineView;

    })(Glyph.View);
    MultiLine = (function(_super) {
      __extends(MultiLine, _super);

      function MultiLine() {
        _ref1 = MultiLine.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      MultiLine.prototype.default_view = MultiLineView;

      MultiLine.prototype.type = 'Glyph';

      MultiLine.prototype.display_defaults = function() {
        return _.extend(MultiLine.__super__.display_defaults.call(this), {
          line_color: 'red',
          line_width: 1,
          line_alpha: 1.0,
          line_join: 'miter',
          line_cap: 'butt',
          line_dash: [],
          line_dash_offset: 0
        });
      };

      return MultiLine;

    })(Glyph.Model);
    return {
      "Model": MultiLine,
      "View": MultiLineView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=multi_line.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/glyph/oval',["underscore", "renderer/properties", "./glyph"], function(_, Properties, Glyph) {
    var Oval, OvalView, _ref, _ref1;
    OvalView = (function(_super) {
      __extends(OvalView, _super);

      function OvalView() {
        _ref = OvalView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      OvalView.prototype._fields = ['x', 'y', 'width', 'height', 'angle'];

      OvalView.prototype._properties = ['line', 'fill'];

      OvalView.prototype._map_data = function() {
        var _ref1;
        _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
        this.sw = this.distance_vector('x', 'width', 'center');
        return this.sh = this.distance_vector('y', 'height', 'center');
      };

      OvalView.prototype._render = function(ctx, indices, glyph_props, sx, sy, sw, sh) {
        var i, _i, _len, _results;
        if (sx == null) {
          sx = this.sx;
        }
        if (sy == null) {
          sy = this.sy;
        }
        if (sw == null) {
          sw = this.sw;
        }
        if (sh == null) {
          sh = this.sh;
        }
        _results = [];
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          if (isNaN(sx[i] + sy[i] + sw[i] + sh[i] + this.angle[i])) {
            continue;
          }
          ctx.translate(sx[i], sy[i]);
          ctx.rotate(this.angle[i]);
          ctx.beginPath();
          ctx.moveTo(0, -sh[i] / 2);
          ctx.bezierCurveTo(sw[i] / 2, -sh[i] / 2, sw[i] / 2, sh[i] / 2, 0, sh[i] / 2);
          ctx.bezierCurveTo(-sw[i] / 2, sh[i] / 2, -sw[i] / 2, -sh[i] / 2, 0, -sh[i] / 2);
          ctx.closePath();
          if (glyph_props.fill_properties.do_fill) {
            glyph_props.fill_properties.set_vectorize(ctx, i);
            ctx.fill();
          }
          if (glyph_props.line_properties.do_stroke) {
            glyph_props.line_properties.set_vectorize(ctx, i);
            ctx.stroke();
          }
          ctx.rotate(-this.angle[i]);
          _results.push(ctx.translate(-sx[i], -sy[i]));
        }
        return _results;
      };

      OvalView.prototype.draw_legend = function(ctx, x0, x1, y0, y1) {
        var d, indices, reference_point, scale, sh, sw, sx, sy, _ref1;
        reference_point = (_ref1 = this.get_reference_point()) != null ? _ref1 : 0;
        indices = [reference_point];
        sx = {};
        sx[reference_point] = (x0 + x1) / 2;
        sy = {};
        sy[reference_point] = (y0 + y1) / 2;
        scale = this.sw[reference_point] / this.sh[reference_point];
        d = Math.min(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 0.8;
        sw = {};
        sh = {};
        if (scale > 1) {
          sw[reference_point] = d;
          sh[reference_point] = d / scale;
        } else {
          sw[reference_point] = d * scale;
          sh[reference_point] = d;
        }
        return this._render(ctx, indices, this.glyph_props, sx, sy, sw, sh);
      };

      return OvalView;

    })(Glyph.View);
    Oval = (function(_super) {
      __extends(Oval, _super);

      function Oval() {
        _ref1 = Oval.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Oval.prototype.default_view = OvalView;

      Oval.prototype.type = 'Glyph';

      Oval.prototype.display_defaults = function() {
        return _.extend(Oval.__super__.display_defaults.call(this), {
          fill_color: 'gray',
          fill_alpha: 1.0,
          line_color: 'red',
          line_width: 1,
          line_alpha: 1.0,
          line_join: 'miter',
          line_cap: 'butt',
          line_dash: [],
          line_dash_offset: 0,
          angle: 0.0
        });
      };

      return Oval;

    })(Glyph.Model);
    return {
      "Model": Oval,
      "View": OvalView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=oval.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/glyph/patch',["underscore", "renderer/properties", "./glyph"], function(_, Properties, Glyph) {
    var Patch, PatchView, _ref, _ref1;
    PatchView = (function(_super) {
      __extends(PatchView, _super);

      function PatchView() {
        _ref = PatchView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      PatchView.prototype._fields = ['x', 'y'];

      PatchView.prototype._properties = ['line', 'fill'];

      PatchView.prototype._map_data = function() {
        var _ref1;
        return _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1], _ref1;
      };

      PatchView.prototype._render = function(ctx, indices, glyph_props) {
        var i, _i, _j, _len, _len1;
        if (glyph_props.fill_properties.do_fill) {
          glyph_props.fill_properties.set(ctx, glyph_props);
          for (_i = 0, _len = indices.length; _i < _len; _i++) {
            i = indices[_i];
            if (i === 0) {
              ctx.beginPath();
              ctx.moveTo(this.sx[i], this.sy[i]);
              continue;
            } else if (isNaN(this.sx[i] + this.sy[i])) {
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              continue;
            } else {
              ctx.lineTo(this.sx[i], this.sy[i]);
            }
          }
          ctx.closePath();
          ctx.fill();
        }
        if (glyph_props.line_properties.do_stroke) {
          glyph_props.line_properties.set(ctx, glyph_props);
          for (_j = 0, _len1 = indices.length; _j < _len1; _j++) {
            i = indices[_j];
            if (i === 0) {
              ctx.beginPath();
              ctx.moveTo(this.sx[i], this.sy[i]);
              continue;
            } else if (isNaN(this.sx[i] + this.sy[i])) {
              ctx.closePath();
              ctx.stroke();
              ctx.beginPath();
              continue;
            } else {
              ctx.lineTo(this.sx[i], this.sy[i]);
            }
          }
          ctx.closePath();
          ctx.stroke();
        }
        return ctx.restore();
      };

      PatchView.prototype.draw_legend = function(ctx, x0, x1, y0, y1) {
        return this._generic_area_legend(ctx, x0, x1, y0, y1);
      };

      return PatchView;

    })(Glyph.View);
    Patch = (function(_super) {
      __extends(Patch, _super);

      function Patch() {
        _ref1 = Patch.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Patch.prototype.default_view = PatchView;

      Patch.prototype.type = 'Glyph';

      Patch.prototype.display_defaults = function() {
        return _.extend(Patch.__super__.display_defaults.call(this), {
          fill_color: 'gray',
          fill_alpha: 1.0,
          line_color: 'red',
          line_width: 1,
          line_alpha: 1.0,
          line_join: 'miter',
          line_cap: 'butt',
          line_dash: [],
          line_dash_offset: 0
        });
      };

      return Patch;

    })(Glyph.Model);
    return {
      "Model": Patch,
      "View": PatchView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=patch.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/glyph/patches',["underscore", "renderer/properties", "./glyph"], function(_, Properties, Glyph) {
    var Patches, PatchesView, _ref, _ref1;
    PatchesView = (function(_super) {
      __extends(PatchesView, _super);

      function PatchesView() {
        _ref = PatchesView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      PatchesView.prototype._fields = ['xs', 'ys'];

      PatchesView.prototype._properties = ['line', 'fill'];

      PatchesView.prototype._map_data = function() {
        return null;
      };

      PatchesView.prototype._render = function(ctx, indices, glyph_props) {
        var i, j, sx, sy, _i, _j, _k, _len, _ref1, _ref2, _ref3;
        ctx = this.plot_view.ctx;
        ctx.save();
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          _ref1 = this.plot_view.map_to_screen(this.xs[i], glyph_props.xs.units, this.ys[i], glyph_props.ys.units), sx = _ref1[0], sy = _ref1[1];
          if (glyph_props.fill_properties.do_fill) {
            glyph_props.fill_properties.set_vectorize(ctx, i);
            for (j = _j = 0, _ref2 = sx.length; 0 <= _ref2 ? _j < _ref2 : _j > _ref2; j = 0 <= _ref2 ? ++_j : --_j) {
              if (j === 0) {
                ctx.beginPath();
                ctx.moveTo(sx[j], sy[j]);
                continue;
              } else if (isNaN(sx[j] + sy[j])) {
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                continue;
              } else {
                ctx.lineTo(sx[j], sy[j]);
              }
            }
            ctx.closePath();
            ctx.fill();
          }
          if (glyph_props.line_properties.do_stroke) {
            glyph_props.line_properties.set_vectorize(ctx, i);
            for (j = _k = 0, _ref3 = sx.length; 0 <= _ref3 ? _k < _ref3 : _k > _ref3; j = 0 <= _ref3 ? ++_k : --_k) {
              if (j === 0) {
                ctx.beginPath();
                ctx.moveTo(sx[j], sy[j]);
                continue;
              } else if (isNaN(sx[j] + sy[j])) {
                ctx.closePath();
                ctx.stroke();
                ctx.beginPath();
                continue;
              } else {
                ctx.lineTo(sx[j], sy[j]);
              }
            }
            ctx.closePath();
            ctx.stroke();
          }
        }
        return ctx.restore();
      };

      PatchesView.prototype.draw_legend = function(ctx, x0, x1, y0, y1) {
        return this._generic_area_legend(ctx, x0, x1, y0, y1);
      };

      return PatchesView;

    })(Glyph.View);
    Patches = (function(_super) {
      __extends(Patches, _super);

      function Patches() {
        _ref1 = Patches.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Patches.prototype.default_view = PatchesView;

      Patches.prototype.type = 'Glyph';

      Patches.prototype.display_defaults = function() {
        return _.extend(Patches.__super__.display_defaults.call(this), {
          fill_color: 'gray',
          fill_alpha: 1.0,
          line_color: 'red',
          line_width: 1,
          line_alpha: 1.0,
          line_join: 'miter',
          line_cap: 'butt',
          line_dash: [],
          line_dash_offset: 0
        });
      };

      return Patches;

    })(Glyph.Model);
    return {
      "Model": Patches,
      "View": PatchesView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=patches.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/glyph/cross',["underscore", "renderer/properties", "./marker"], function(_, Properties, Marker) {
    var Cross, CrossView, _ref, _ref1;
    CrossView = (function(_super) {
      __extends(CrossView, _super);

      function CrossView() {
        _ref = CrossView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      CrossView.prototype._properties = ['line'];

      CrossView.prototype._render = function(ctx, indices, glyph_props, sx, sy, size) {
        var i, r, _i, _len, _results;
        if (sx == null) {
          sx = this.sx;
        }
        if (sy == null) {
          sy = this.sy;
        }
        if (size == null) {
          size = this.size;
        }
        _results = [];
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          if (isNaN(sx[i] + sy[i] + size[i])) {
            continue;
          }
          r = size[i] / 2;
          ctx.beginPath();
          ctx.moveTo(sx[i], sy[i] + r);
          ctx.lineTo(sx[i], sy[i] - r);
          ctx.moveTo(sx[i] - r, sy[i]);
          ctx.lineTo(sx[i] + r, sy[i]);
          if (glyph_props.line_properties.do_stroke) {
            glyph_props.line_properties.set_vectorize(ctx, i);
            _results.push(ctx.stroke());
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      return CrossView;

    })(Marker.View);
    Cross = (function(_super) {
      __extends(Cross, _super);

      function Cross() {
        _ref1 = Cross.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Cross.prototype.default_view = CrossView;

      Cross.prototype.type = 'Glyph';

      Cross.prototype.display_defaults = function() {
        return _.extend(Cross.__super__.display_defaults.call(this), {
          line_color: 'red',
          line_width: 1,
          line_alpha: 1.0,
          line_join: 'miter',
          line_cap: 'butt',
          line_dash: [],
          line_dash_offset: 0
        });
      };

      return Cross;

    })(Marker.Model);
    return {
      "Model": Cross,
      "View": CrossView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=cross.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/glyph/quad',["underscore", "rbush", "renderer/properties", "./glyph"], function(_, rbush, Properties, Glyph) {
    var Quad, QuadView, _ref, _ref1;
    QuadView = (function(_super) {
      __extends(QuadView, _super);

      function QuadView() {
        _ref = QuadView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      QuadView.prototype._fields = ['right', 'left', 'bottom', 'top'];

      QuadView.prototype._properties = ['line', 'fill'];

      QuadView.prototype._set_data = function() {
        var i;
        this.index = rbush();
        return this.index.load((function() {
          var _i, _ref1, _results;
          _results = [];
          for (i = _i = 0, _ref1 = this.left.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
            _results.push([
              this.left[i], this.bottom[i], this.right[i], this.top[i], {
                'i': i
              }
            ]);
          }
          return _results;
        }).call(this));
      };

      QuadView.prototype._map_data = function() {
        var _ref1, _ref2;
        _ref1 = this.plot_view.map_to_screen(this.left, this.glyph_props.left.units, this.top, this.glyph_props.top.units), this.sx0 = _ref1[0], this.sy0 = _ref1[1];
        return _ref2 = this.plot_view.map_to_screen(this.right, this.glyph_props.right.units, this.bottom, this.glyph_props.bottom.units), this.sx1 = _ref2[0], this.sy1 = _ref2[1], _ref2;
      };

      QuadView.prototype._mask_data = function() {
        var oh, ow, vr, x, x0, x1, y0, y1, _ref1, _ref2;
        ow = this.plot_view.view_state.get('outer_width');
        oh = this.plot_view.view_state.get('outer_height');
        _ref1 = this.plot_view.xmapper.v_map_from_target([0, ow]), x0 = _ref1[0], x1 = _ref1[1];
        vr = this.plot_view.view_state.get('inner_range_vertical');
        _ref2 = this.plot_view.ymapper.v_map_from_target([0, ow]), y0 = _ref2[0], y1 = _ref2[1];
        return (function() {
          var _i, _len, _ref3, _results;
          _ref3 = this.index.search([x0, y0, x1, y1]);
          _results = [];
          for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
            x = _ref3[_i];
            _results.push(x[4].i);
          }
          return _results;
        }).call(this);
      };

      QuadView.prototype._render = function(ctx, indices, glyph_props, sx0, sx1, sy0, sy1) {
        var i, _i, _len, _results;
        if (sx0 == null) {
          sx0 = this.sx0;
        }
        if (sx1 == null) {
          sx1 = this.sx1;
        }
        if (sy0 == null) {
          sy0 = this.sy0;
        }
        if (sy1 == null) {
          sy1 = this.sy1;
        }
        _results = [];
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          if (isNaN(sx0[i] + sy0[i] + sx1[i] + sy1[i])) {
            continue;
          }
          if (glyph_props.fill_properties.do_fill) {
            glyph_props.fill_properties.set_vectorize(ctx, i);
            ctx.fillRect(sx0[i], sy0[i], sx1[i] - sx0[i], sy1[i] - sy0[i]);
          }
          if (glyph_props.line_properties.do_stroke) {
            ctx.beginPath();
            ctx.rect(sx0[i], sy0[i], sx1[i] - sx0[i], sy1[i] - sy0[i]);
            glyph_props.line_properties.set_vectorize(ctx, i);
            _results.push(ctx.stroke());
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      QuadView.prototype.draw_legend = function(ctx, x0, x1, y0, y1) {
        return this._generic_area_legend(ctx, x0, x1, y0, y1);
      };

      return QuadView;

    })(Glyph.View);
    Quad = (function(_super) {
      __extends(Quad, _super);

      function Quad() {
        _ref1 = Quad.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Quad.prototype.default_view = QuadView;

      Quad.prototype.type = 'Glyph';

      Quad.prototype.display_defaults = function() {
        return _.extend(Quad.__super__.display_defaults.call(this), {
          fill_color: 'gray',
          fill_alpha: 1.0,
          line_color: 'red',
          line_width: 1,
          line_alpha: 1.0,
          line_join: 'miter',
          line_cap: 'butt',
          line_dash: [],
          line_dash_offset: 0
        });
      };

      return Quad;

    })(Glyph.Model);
    return {
      "Model": Quad,
      "View": QuadView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=quad.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/glyph/quadratic',["underscore", "renderer/properties", "./glyph"], function(_, Properties, Glyph) {
    var Quadratic, QuadraticView, _ref, _ref1;
    QuadraticView = (function(_super) {
      __extends(QuadraticView, _super);

      function QuadraticView() {
        _ref = QuadraticView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      QuadraticView.prototype._fields = ['x0', 'y0', 'x1', 'y1', 'cx', 'cy'];

      QuadraticView.prototype._properties = ['line'];

      QuadraticView.prototype._map_data = function() {
        var _ref1, _ref2, _ref3;
        _ref1 = this.plot_view.map_to_screen(this.x0, this.glyph_props.x0.units, this.y0, this.glyph_props.y0.units), this.sx0 = _ref1[0], this.sy0 = _ref1[1];
        _ref2 = this.plot_view.map_to_screen(this.x1, this.glyph_props.x1.units, this.y1, this.glyph_props.y1.units), this.sx1 = _ref2[0], this.sy1 = _ref2[1];
        return _ref3 = this.plot_view.map_to_screen(this.cx, this.glyph_props.cx.units, this.cy, this.glyph_props.cy.units), this.scx = _ref3[0], this.scy = _ref3[1], _ref3;
      };

      QuadraticView.prototype._render = function(ctx, indices, glyph_props) {
        var i, _i, _len, _results;
        if (glyph_props.line_properties.do_stroke) {
          _results = [];
          for (_i = 0, _len = indices.length; _i < _len; _i++) {
            i = indices[_i];
            if (isNaN(this.sx0[i] + this.sy0[i] + this.sx1[i] + this.sy1[i] + this.scx[i] + this.scy[i])) {
              continue;
            }
            ctx.beginPath();
            ctx.moveTo(this.sx0[i], this.sy0[i]);
            ctx.quadraticCurveTo(this.scx[i], this.scy[i], this.sx1[i], this.sy1[i]);
            glyph_props.line_properties.set_vectorize(ctx, i);
            _results.push(ctx.stroke());
          }
          return _results;
        }
      };

      QuadraticView.prototype.draw_legend = function(ctx, x0, x1, y0, y1) {
        return this._generic_line_legend(ctx, x0, x1, y0, y1);
      };

      return QuadraticView;

    })(Glyph.View);
    Quadratic = (function(_super) {
      __extends(Quadratic, _super);

      function Quadratic() {
        _ref1 = Quadratic.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Quadratic.prototype.default_view = QuadraticView;

      Quadratic.prototype.type = 'Glyph';

      Quadratic.prototype.display_defaults = function() {
        return _.extend(Quadratic.__super__.display_defaults.call(this), {
          line_color: 'red',
          line_width: 1,
          line_alpha: 1.0,
          line_join: 'miter',
          line_cap: 'butt',
          line_dash: [],
          line_dash_offset: 0
        });
      };

      return Quadratic;

    })(Glyph.Model);
    return {
      "Model": Quadratic,
      "View": QuadraticView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=quadratic.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/glyph/ray',["underscore", "renderer/properties", "./glyph"], function(_, Properties, Glyph) {
    var Ray, RayView, _ref, _ref1;
    RayView = (function(_super) {
      __extends(RayView, _super);

      function RayView() {
        _ref = RayView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      RayView.prototype._fields = ['x', 'y', 'angle', 'length'];

      RayView.prototype._properties = ['line'];

      RayView.prototype._map_data = function() {
        var height, i, inf_len, width, _i, _ref1, _ref2, _results;
        _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
        width = this.plot_view.view_state.get('width');
        height = this.plot_view.view_state.get('height');
        inf_len = 2 * (width + height);
        _results = [];
        for (i = _i = 0, _ref2 = this.length.length; 0 <= _ref2 ? _i < _ref2 : _i > _ref2; i = 0 <= _ref2 ? ++_i : --_i) {
          if (this.length[i] === 0) {
            _results.push(this.length[i] = inf_len);
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      RayView.prototype._render = function(ctx, indices, glyph_props) {
        var i, _i, _len, _results;
        if (glyph_props.line_properties.do_stroke) {
          _results = [];
          for (_i = 0, _len = indices.length; _i < _len; _i++) {
            i = indices[_i];
            if (isNaN(this.sx[i] + this.sy[i] + this.angle[i] + this.length[i])) {
              continue;
            }
            ctx.translate(this.sx[i], this.sy[i]);
            ctx.rotate(this.angle[i]);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(this.length[i], 0);
            glyph_props.line_properties.set_vectorize(ctx, i);
            ctx.stroke();
            ctx.rotate(-this.angle[i]);
            _results.push(ctx.translate(-this.sx[i], -this.sy[i]));
          }
          return _results;
        }
      };

      RayView.prototype.draw_legend = function(ctx, x0, x1, y0, y1) {
        return this._generic_line_legend(ctx, x0, x1, y0, y1);
      };

      return RayView;

    })(Glyph.View);
    Ray = (function(_super) {
      __extends(Ray, _super);

      function Ray() {
        _ref1 = Ray.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Ray.prototype.default_view = RayView;

      Ray.prototype.type = 'Glyph';

      Ray.prototype.display_defaults = function() {
        return _.extend(Ray.__super__.display_defaults.call(this), {
          line_color: 'red',
          line_width: 1,
          line_alpha: 1.0,
          line_join: 'miter',
          line_cap: 'butt',
          line_dash: [],
          line_dash_offset: 0
        });
      };

      return Ray;

    })(Glyph.Model);
    return {
      "Model": Ray,
      "View": RayView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=ray.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/glyph/rect',["underscore", "renderer/properties", "./glyph"], function(_, Properties, Glyph) {
    var Rect, RectView, _ref, _ref1;
    RectView = (function(_super) {
      __extends(RectView, _super);

      function RectView() {
        _ref = RectView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      RectView.prototype._fields = ['x', 'y', 'width', 'height', 'angle'];

      RectView.prototype._properties = ['line', 'fill'];

      RectView.prototype._map_data = function() {
        var i, sxi, syi, _i, _ref1, _ref2, _results;
        _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), sxi = _ref1[0], syi = _ref1[1];
        this.sw = this.distance_vector('x', 'width', 'center');
        this.sh = this.distance_vector('y', 'height', 'center');
        this.sx = new Array(sxi.length);
        this.sy = new Array(sxi.length);
        _results = [];
        for (i = _i = 0, _ref2 = sxi.length; 0 <= _ref2 ? _i < _ref2 : _i > _ref2; i = 0 <= _ref2 ? ++_i : --_i) {
          if (Math.abs(sxi[i] - this.sw[i]) < 2) {
            this.sx[i] = Math.round(sxi[i]);
          } else {
            this.sx[i] = sxi[i];
          }
          if (Math.abs(syi[i] - this.sh[i]) < 2) {
            _results.push(this.sy[i] = Math.round(syi[i]));
          } else {
            _results.push(this.sy[i] = syi[i]);
          }
        }
        return _results;
      };

      RectView.prototype._render = function(ctx, indices, glyph_props, sx, sy, sw, sh) {
        var i, _i, _j, _len, _len1;
        if (sx == null) {
          sx = this.sx;
        }
        if (sy == null) {
          sy = this.sy;
        }
        if (sw == null) {
          sw = this.sw;
        }
        if (sh == null) {
          sh = this.sh;
        }
        if (glyph_props.fill_properties.do_fill) {
          for (_i = 0, _len = indices.length; _i < _len; _i++) {
            i = indices[_i];
            if (isNaN(sx[i] + sy[i] + sw[i] + sh[i] + this.angle[i])) {
              continue;
            }
            glyph_props.fill_properties.set_vectorize(ctx, i);
            if (this.angle[i]) {
              ctx.translate(sx[i], sy[i]);
              ctx.rotate(this.angle[i]);
              ctx.fillRect(-sw[i] / 2, -sh[i] / 2, sw[i], sh[i]);
              ctx.rotate(-this.angle[i]);
              ctx.translate(-sx[i], -sy[i]);
            } else {
              ctx.fillRect(sx[i] - sw[i] / 2, sy[i] - sh[i] / 2, sw[i], sh[i]);
              ctx.rect(sx[i] - sw[i] / 2, sy[i] - sh[i] / 2, sw[i], sh[i]);
            }
          }
        }
        if (glyph_props.line_properties.do_stroke) {
          ctx.beginPath();
          for (_j = 0, _len1 = indices.length; _j < _len1; _j++) {
            i = indices[_j];
            if (isNaN(sx[i] + sy[i] + sw[i] + sh[i] + this.angle[i])) {
              continue;
            }
            if (this.angle[i]) {
              ctx.translate(sx[i], sy[i]);
              ctx.rotate(this.angle[i]);
              ctx.rect(-sw[i] / 2, -sh[i] / 2, sw[i], sh[i]);
              ctx.rotate(-this.angle[i]);
              ctx.translate(-sx[i], -sy[i]);
            } else {
              ctx.rect(sx[i] - sw[i] / 2, sy[i] - sh[i] / 2, sw[i], sh[i]);
            }
            glyph_props.line_properties.set_vectorize(ctx, i);
            ctx.stroke();
            ctx.beginPath();
          }
          return ctx.stroke();
        }
      };

      RectView.prototype.draw_legend = function(ctx, x0, x1, y0, y1) {
        var d, indices, reference_point, scale, sh, sw, sx, sy, _ref1;
        reference_point = (_ref1 = this.get_reference_point()) != null ? _ref1 : 0;
        indices = [reference_point];
        sx = {};
        sx[reference_point] = (x0 + x1) / 2;
        sy = {};
        sy[reference_point] = (y0 + y1) / 2;
        scale = this.sw[reference_point] / this.sh[reference_point];
        d = Math.min(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 0.8;
        sw = {};
        sh = {};
        if (scale > 1) {
          sw[reference_point] = d;
          sh[reference_point] = d / scale;
        } else {
          sw[reference_point] = d * scale;
          sh[reference_point] = d;
        }
        return this._render(ctx, indices, this.glyph_props, sx, sy, sw, sh);
      };

      return RectView;

    })(Glyph.View);
    Rect = (function(_super) {
      __extends(Rect, _super);

      function Rect() {
        _ref1 = Rect.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Rect.prototype.default_view = RectView;

      Rect.prototype.type = 'Glyph';

      Rect.prototype.display_defaults = function() {
        return _.extend(Rect.__super__.display_defaults.call(this), {
          fill_color: 'gray',
          fill_alpha: 1.0,
          line_color: 'red',
          line_width: 1,
          line_alpha: 1.0,
          line_join: 'miter',
          line_cap: 'butt',
          line_dash: [],
          line_dash_offset: 0,
          angle: 0.0
        });
      };

      return Rect;

    })(Glyph.Model);
    return {
      "Model": Rect,
      "View": RectView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=rect.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/glyph/square',["underscore", "renderer/properties", "./marker"], function(_, Properties, Marker) {
    var Square, SquareView, _ref, _ref1;
    SquareView = (function(_super) {
      __extends(SquareView, _super);

      function SquareView() {
        _ref = SquareView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      SquareView.prototype._properties = ['line', 'fill'];

      SquareView.prototype._map_data = function() {
        var _ref1;
        _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
        return this.size = this.distance_vector('x', 'size', 'center');
      };

      SquareView.prototype._render = function(ctx, indices, glyph_props, sx, sy, size) {
        var i, _i, _len, _results;
        if (sx == null) {
          sx = this.sx;
        }
        if (sy == null) {
          sy = this.sy;
        }
        if (size == null) {
          size = this.size;
        }
        _results = [];
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          if (isNaN(sx[i] + sy[i] + size[i])) {
            continue;
          }
          ctx.translate(sx[i], sy[i]);
          ctx.beginPath();
          ctx.rect(-size[i] / 2, -size[i] / 2, size[i], size[i]);
          if (glyph_props.fill_properties.do_fill) {
            glyph_props.fill_properties.set_vectorize(ctx, i);
            ctx.fill();
          }
          if (glyph_props.line_properties.do_stroke) {
            glyph_props.line_properties.set_vectorize(ctx, i);
            ctx.stroke();
          }
          _results.push(ctx.translate(-sx[i], -sy[i]));
        }
        return _results;
      };

      return SquareView;

    })(Marker.View);
    Square = (function(_super) {
      __extends(Square, _super);

      function Square() {
        _ref1 = Square.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Square.prototype.default_view = SquareView;

      Square.prototype.type = 'Glyph';

      Square.prototype.display_defaults = function() {
        return _.extend(Square.__super__.display_defaults.call(this), {
          size_units: 'screen',
          fill_color: 'gray',
          fill_alpha: 1.0,
          line_color: 'red',
          line_width: 1,
          line_alpha: 1.0,
          line_join: 'miter',
          line_cap: 'butt',
          line_dash: [],
          line_dash_offset: 0
        });
      };

      return Square;

    })(Marker.Model);
    return {
      "Model": Square,
      "View": SquareView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=square.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/glyph/square_x',["underscore", "renderer/properties", "./marker"], function(_, Properties, Marker) {
    var SquareX, SquareXView, _ref, _ref1;
    SquareXView = (function(_super) {
      __extends(SquareXView, _super);

      function SquareXView() {
        _ref = SquareXView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      SquareXView.prototype._properties = ['line', 'fill'];

      SquareXView.prototype._map_data = function() {
        var _ref1;
        _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
        return this.size = this.distance_vector('x', 'size', 'center');
      };

      SquareXView.prototype._render = function(ctx, indices, glyph_props, sx, sy, size) {
        var i, r, _i, _len, _results;
        if (sx == null) {
          sx = this.sx;
        }
        if (sy == null) {
          sy = this.sy;
        }
        if (size == null) {
          size = this.size;
        }
        _results = [];
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          if (isNaN(sx[i] + sy[i] + size[i])) {
            continue;
          }
          ctx.translate(sx[i], sy[i]);
          ctx.beginPath();
          ctx.rect(-size[i] / 2, -size[i] / 2, size[i], size[i]);
          if (glyph_props.fill_properties.do_fill) {
            glyph_props.fill_properties.set_vectorize(ctx, i);
            ctx.fill();
          }
          if (glyph_props.line_properties.do_stroke) {
            glyph_props.line_properties.set_vectorize(ctx, i);
            ctx.stroke();
            r = size[i] / 2;
            ctx.moveTo(-r, +r);
            ctx.lineTo(+r, -r);
            ctx.moveTo(-r, -r);
            ctx.lineTo(+r, +r);
            ctx.stroke();
          }
          _results.push(ctx.translate(-sx[i], -sy[i]));
        }
        return _results;
      };

      return SquareXView;

    })(Marker.View);
    SquareX = (function(_super) {
      __extends(SquareX, _super);

      function SquareX() {
        _ref1 = SquareX.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      SquareX.prototype.default_view = SquareXView;

      SquareX.prototype.type = 'Glyph';

      SquareX.prototype.display_defaults = function() {
        return _.extend(SquareX.__super__.display_defaults.call(this), {
          size_units: 'screen',
          fill_color: 'gray',
          fill_alpha: 1.0,
          line_color: 'red',
          line_width: 1,
          line_alpha: 1.0,
          line_join: 'miter',
          line_cap: 'butt',
          line_dash: [],
          line_dash_offset: 0
        });
      };

      return SquareX;

    })(Marker.Model);
    return {
      "Model": SquareX,
      "View": SquareXView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=square_x.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/glyph/square_cross',["underscore", "renderer/properties", "./marker"], function(_, Properties, Marker) {
    var SquareCross, SquareCrossView, _ref, _ref1;
    SquareCrossView = (function(_super) {
      __extends(SquareCrossView, _super);

      function SquareCrossView() {
        _ref = SquareCrossView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      SquareCrossView.prototype._properties = ['line', 'fill'];

      SquareCrossView.prototype._map_data = function() {
        var _ref1;
        _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
        return this.size = this.distance_vector('x', 'size', 'center');
      };

      SquareCrossView.prototype._render = function(ctx, indices, glyph_props, sx, sy, size) {
        var i, r, _i, _len, _results;
        if (sx == null) {
          sx = this.sx;
        }
        if (sy == null) {
          sy = this.sy;
        }
        if (size == null) {
          size = this.size;
        }
        _results = [];
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          if (isNaN(sx[i] + sy[i] + size[i])) {
            continue;
          }
          ctx.translate(sx[i], sy[i]);
          ctx.beginPath();
          ctx.rect(-size[i] / 2, -size[i] / 2, size[i], size[i]);
          if (glyph_props.fill_properties.do_fill) {
            glyph_props.fill_properties.set_vectorize(ctx, i);
            ctx.fill();
          }
          if (glyph_props.line_properties.do_stroke) {
            glyph_props.line_properties.set_vectorize(ctx, i);
            r = size[i] / 2;
            ctx.moveTo(0, +r);
            ctx.lineTo(0, -r);
            ctx.moveTo(-r, 0);
            ctx.lineTo(+r, 0);
            ctx.stroke();
          }
          _results.push(ctx.translate(-sx[i], -sy[i]));
        }
        return _results;
      };

      return SquareCrossView;

    })(Marker.View);
    SquareCross = (function(_super) {
      __extends(SquareCross, _super);

      function SquareCross() {
        _ref1 = SquareCross.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      SquareCross.prototype.default_view = SquareCrossView;

      SquareCross.prototype.type = 'Glyph';

      SquareCross.prototype.display_defaults = function() {
        return _.extend(SquareCross.__super__.display_defaults.call(this), {
          size_units: 'screen',
          fill_color: 'gray',
          fill_alpha: 1.0,
          line_color: 'red',
          line_width: 1,
          line_alpha: 1.0,
          line_join: 'miter',
          line_cap: 'butt',
          line_dash: [],
          line_dash_offset: 0
        });
      };

      return SquareCross;

    })(Marker.Model);
    return {
      "Model": SquareCross,
      "View": SquareCrossView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=square_cross.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/glyph/segment',["underscore", "renderer/properties", "./glyph"], function(_, Properties, Glyph) {
    var Segment, SegmentView, _ref, _ref1;
    SegmentView = (function(_super) {
      __extends(SegmentView, _super);

      function SegmentView() {
        _ref = SegmentView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      SegmentView.prototype._fields = ['x0', 'y0', 'x1', 'y1'];

      SegmentView.prototype._properties = ['line'];

      SegmentView.prototype._map_data = function() {
        var _ref1, _ref2;
        _ref1 = this.plot_view.map_to_screen(this.x0, this.glyph_props.x0.units, this.y0, this.glyph_props.y0.units), this.sx0 = _ref1[0], this.sy0 = _ref1[1];
        return _ref2 = this.plot_view.map_to_screen(this.x1, this.glyph_props.x1.units, this.y1, this.glyph_props.y1.units), this.sx1 = _ref2[0], this.sy1 = _ref2[1], _ref2;
      };

      SegmentView.prototype._render = function(ctx, indices, glyph_props) {
        var i, _i, _len, _results;
        if (glyph_props.line_properties.do_stroke) {
          _results = [];
          for (_i = 0, _len = indices.length; _i < _len; _i++) {
            i = indices[_i];
            if (isNaN(this.sx0[i] + this.sy0[i] + this.sx1[i] + this.sy1[i])) {
              continue;
            }
            ctx.beginPath();
            ctx.moveTo(this.sx0[i], this.sy0[i]);
            ctx.lineTo(this.sx1[i], this.sy1[i]);
            glyph_props.line_properties.set_vectorize(ctx, i);
            _results.push(ctx.stroke());
          }
          return _results;
        }
      };

      SegmentView.prototype.draw_legend = function(ctx, x0, x1, y0, y1) {
        return this._generic_line_legend(ctx, x0, x1, y0, y1);
      };

      return SegmentView;

    })(Glyph.View);
    Segment = (function(_super) {
      __extends(Segment, _super);

      function Segment() {
        _ref1 = Segment.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Segment.prototype.default_view = SegmentView;

      Segment.prototype.type = 'Glyph';

      Segment.prototype.display_defaults = function() {
        return _.extend(Segment.__super__.display_defaults.call(this), {
          line_color: 'red',
          line_width: 1,
          line_alpha: 1.0,
          line_join: 'miter',
          line_cap: 'butt',
          line_dash: [],
          line_dash_offset: 0
        });
      };

      return Segment;

    })(Glyph.Model);
    return {
      "Model": Segment,
      "View": SegmentView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=segment.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/glyph/text',["underscore", "renderer/properties", "./glyph"], function(_, Properties, Glyph) {
    var Text, TextView, _ref, _ref1;
    TextView = (function(_super) {
      __extends(TextView, _super);

      function TextView() {
        _ref = TextView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      TextView.prototype._fields = ['x', 'y', 'angle', 'text:string'];

      TextView.prototype._properties = ['text'];

      TextView.prototype._map_data = function() {
        var _ref1;
        return _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1], _ref1;
      };

      TextView.prototype._render = function(ctx, indices, glyph_props) {
        var i, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          if (isNaN(this.sx[i] + this.sy[i] + this.angle[i])) {
            continue;
          }
          ctx.translate(this.sx[i], this.sy[i]);
          ctx.rotate(this.angle[i]);
          glyph_props.text_properties.set_vectorize(ctx, i);
          ctx.fillText(this.text[i], 0, 0);
          ctx.rotate(-this.angle[i]);
          _results.push(ctx.translate(-this.sx[i], -this.sy[i]));
        }
        return _results;
      };

      TextView.prototype.draw_legend = function(ctx, x1, x2, y1, y2) {
        var glyph_props, glyph_settings, reference_point, text_props;
        glyph_props = this.glyph_props;
        text_props = glyph_props.text_properties;
        ctx.save();
        reference_point = this.get_reference_point();
        if (reference_point != null) {
          glyph_settings = reference_point;
        } else {
          glyph_settings = glyph_props;
        }
        text_props.set(ctx, glyph_settings);
        ctx.font = text_props.font(12);
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText("txt", x2, (y1 + y2) / 2);
        return ctx.restore();
      };

      return TextView;

    })(Glyph.View);
    Text = (function(_super) {
      __extends(Text, _super);

      function Text() {
        _ref1 = Text.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Text.prototype.default_view = TextView;

      Text.prototype.type = 'Glyph';

      Text.prototype.display_defaults = function() {
        return _.extend(Text.__super__.display_defaults.call(this), {
          text_font: "helvetica",
          text_font_size: "12pt",
          text_font_style: "normal",
          text_color: "#444444",
          text_alpha: 1.0,
          text_align: "left",
          text_baseline: "bottom"
        });
      };

      return Text;

    })(Glyph.Model);
    return {
      "Model": Text,
      "View": TextView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=text.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/glyph/triangle',["underscore", "renderer/properties", "./marker"], function(_, Properties, Marker) {
    var Triangle, TriangleView, _ref, _ref1;
    TriangleView = (function(_super) {
      __extends(TriangleView, _super);

      function TriangleView() {
        _ref = TriangleView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      TriangleView.prototype._properties = ['line', 'fill'];

      TriangleView.prototype._render = function(ctx, indices, glyph_props, sx, sy, size) {
        var a, h, i, r, _i, _len, _results;
        if (sx == null) {
          sx = this.sx;
        }
        if (sy == null) {
          sy = this.sy;
        }
        if (size == null) {
          size = this.size;
        }
        _results = [];
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          if (isNaN(sx[i] + sy[i] + size[i])) {
            continue;
          }
          a = size[i] * Math.sqrt(3) / 6;
          r = size[i] / 2;
          h = size[i] * Math.sqrt(3) / 2;
          ctx.beginPath();
          ctx.moveTo(sx[i] - r, sy[i] + a);
          ctx.lineTo(sx[i] + r, sy[i] + a);
          ctx.lineTo(sx[i], sy[i] + a - h);
          ctx.closePath();
          if (glyph_props.fill_properties.do_fill) {
            glyph_props.fill_properties.set_vectorize(ctx, i);
            ctx.fill();
          }
          if (glyph_props.line_properties.do_stroke) {
            glyph_props.line_properties.set_vectorize(ctx, i);
            _results.push(ctx.stroke());
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      return TriangleView;

    })(Marker.View);
    Triangle = (function(_super) {
      __extends(Triangle, _super);

      function Triangle() {
        _ref1 = Triangle.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Triangle.prototype.default_view = TriangleView;

      Triangle.prototype.type = 'Glyph';

      Triangle.prototype.display_defaults = function() {
        return _.extend(Triangle.__super__.display_defaults.call(this), {
          fill_color: 'gray',
          fill_alpha: 1.0,
          line_color: 'red',
          line_width: 1,
          line_alpha: 1.0,
          line_join: 'miter',
          line_cap: 'butt',
          line_dash: [],
          line_dash_offset: 0
        });
      };

      return Triangle;

    })(Marker.Model);
    return {
      "Model": Triangle,
      "View": TriangleView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=triangle.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/glyph/wedge',["underscore", "renderer/properties", "./glyph"], function(_, Properties, Glyph) {
    var Wedge, WedgeView, _ref, _ref1;
    WedgeView = (function(_super) {
      __extends(WedgeView, _super);

      function WedgeView() {
        _ref = WedgeView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      WedgeView.prototype._fields = ['x', 'y', 'radius', 'start_angle', 'end_angle', 'direction:string'];

      WedgeView.prototype._properties = ['line', 'fill'];

      WedgeView.prototype._map_data = function() {
        var _ref1;
        _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
        return this.radius = this.distance_vector('x', 'radius', 'edge');
      };

      WedgeView.prototype._render = function(ctx, indices, glyph_props, sx, sy, radius) {
        var i, _i, _len, _results;
        if (sx == null) {
          sx = this.sx;
        }
        if (sy == null) {
          sy = this.sy;
        }
        if (radius == null) {
          radius = this.radius;
        }
        _results = [];
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          if (isNaN(sx[i] + sy[i] + radius[i] + this.start_angle[i] + this.end_angle[i] + this.direction[i])) {
            continue;
          }
          ctx.beginPath();
          ctx.arc(sx[i], sy[i], radius[i], this.start_angle[i], this.end_angle[i], this.direction[i]);
          ctx.lineTo(sx[i], sy[i]);
          ctx.closePath();
          if (glyph_props.fill_properties.do_fill) {
            glyph_props.fill_properties.set_vectorize(ctx, i);
            ctx.fill();
          }
          if (glyph_props.line_properties.do_stroke) {
            glyph_props.line_properties.set_vectorize(ctx, i);
            _results.push(ctx.stroke());
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      WedgeView.prototype.draw_legend = function(ctx, x0, x1, y0, y1) {
        var indices, radius, reference_point, sx, sy, _ref1;
        reference_point = (_ref1 = this.get_reference_point()) != null ? _ref1 : 0;
        indices = [reference_point];
        sx = {};
        sx[reference_point] = (x0 + x1) / 2;
        sy = {};
        sy[reference_point] = (y0 + y1) / 2;
        radius = {};
        radius[reference_point] = Math.min(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 0.4;
        return this._render(ctx, indices, this.glyph_props, sx, sy, radius);
      };

      return WedgeView;

    })(Glyph.View);
    Wedge = (function(_super) {
      __extends(Wedge, _super);

      function Wedge() {
        _ref1 = Wedge.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Wedge.prototype.default_view = WedgeView;

      Wedge.prototype.type = 'Glyph';

      Wedge.prototype.display_defaults = function() {
        return _.extend(Wedge.__super__.display_defaults.call(this), {
          direction: 'anticlock',
          fill_color: 'gray',
          fill_alpha: 1.0,
          line_color: 'red',
          line_width: 1,
          line_alpha: 1.0,
          line_join: 'miter',
          line_cap: 'butt',
          line_dash: [],
          line_dash_offset: 0
        });
      };

      return Wedge;

    })(Glyph.Model);
    return {
      "Model": Wedge,
      "View": WedgeView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=wedge.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/glyph/x',["underscore", "renderer/properties", "./marker"], function(_, Properties, Marker) {
    var X, XView, _ref, _ref1;
    XView = (function(_super) {
      __extends(XView, _super);

      function XView() {
        _ref = XView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      XView.prototype._properties = ['line'];

      XView.prototype._render = function(ctx, indices, glyph_props, sx, sy, size) {
        var i, r, _i, _len, _results;
        if (sx == null) {
          sx = this.sx;
        }
        if (sy == null) {
          sy = this.sy;
        }
        if (size == null) {
          size = this.size;
        }
        _results = [];
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          if (isNaN(sx[i] + sy[i] + size[i])) {
            continue;
          }
          r = size[i] / 2;
          ctx.beginPath();
          ctx.moveTo(sx[i] - r, sy[i] + r);
          ctx.lineTo(sx[i] + r, sy[i] - r);
          ctx.moveTo(sx[i] - r, sy[i] - r);
          ctx.lineTo(sx[i] + r, sy[i] + r);
          if (glyph_props.line_properties.do_stroke) {
            glyph_props.line_properties.set_vectorize(ctx, i);
            _results.push(ctx.stroke());
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      return XView;

    })(Marker.View);
    X = (function(_super) {
      __extends(X, _super);

      function X() {
        _ref1 = X.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      X.prototype.default_view = XView;

      X.prototype.type = 'Glyph';

      X.prototype.display_defaults = function() {
        return _.extend(X.__super__.display_defaults.call(this), {
          line_color: 'red',
          line_width: 1,
          line_alpha: 1.0,
          line_join: 'miter',
          line_cap: 'butt',
          line_dash: [],
          line_dash_offset: 0
        });
      };

      return X;

    })(Marker.Model);
    return {
      "Model": X,
      "View": XView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=x.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/glyph/glyph_factory',['require','exports','module','underscore','common/has_parent','common/plot_widget','./annular_wedge','./annulus','./arc','./asterisk','./bezier','./circle','./circle_x','./circle_cross','./diamond','./diamond_cross','./image','./image_rgba','./image_uri','./inverted_triangle','./line','./multi_line','./oval','./patch','./patches','./cross','./quad','./quadratic','./ray','./rect','./square','./square_x','./square_cross','./segment','./text','./triangle','./wedge','./x'],function(require, exports, module) {
    var Glyph, HasParent, PlotWidget, annular_wedge, annulus, arc, asterisk, bezier, circle, circle_cross, circle_x, cross, diamond, diamond_cross, glyphs, image, image_rgba, image_uri, inverted_triangle, line, multi_line, oval, patch, patches, quad, quadratic, ray, rect, segment, square, square_cross, square_x, text, triangle, wedge, x, _, _ref;
    _ = require("underscore");
    HasParent = require("common/has_parent");
    PlotWidget = require("common/plot_widget");
    annular_wedge = require("./annular_wedge");
    annulus = require("./annulus");
    arc = require("./arc");
    asterisk = require("./asterisk");
    bezier = require("./bezier");
    circle = require("./circle");
    circle_x = require("./circle_x");
    circle_cross = require("./circle_cross");
    diamond = require("./diamond");
    diamond_cross = require("./diamond_cross");
    image = require("./image");
    image_rgba = require("./image_rgba");
    image_uri = require("./image_uri");
    inverted_triangle = require("./inverted_triangle");
    line = require("./line");
    multi_line = require("./multi_line");
    oval = require("./oval");
    patch = require("./patch");
    patches = require("./patches");
    cross = require("./cross");
    quad = require("./quad");
    quadratic = require("./quadratic");
    ray = require("./ray");
    rect = require("./rect");
    square = require("./square");
    square_x = require("./square_x");
    square_cross = require("./square_cross");
    segment = require("./segment");
    text = require("./text");
    triangle = require("./triangle");
    wedge = require("./wedge");
    x = require("./x");
    glyphs = {
      "annular_wedge": annular_wedge.Model,
      "annulus": annulus.Model,
      "arc": arc.Model,
      "asterisk": asterisk.Model,
      "bezier": bezier.Model,
      "circle": circle.Model,
      "circle_x": circle_x.Model,
      "circle_cross": circle_cross.Model,
      "diamond": diamond.Model,
      "diamond_cross": diamond_cross.Model,
      "image": image.Model,
      "image_rgba": image_rgba.Model,
      "image_uri": image_uri.Model,
      "inverted_triangle": inverted_triangle.Model,
      "line": line.Model,
      "multi_line": multi_line.Model,
      "oval": oval.Model,
      "patch": patch.Model,
      "patches": patches.Model,
      "cross": cross.Model,
      "quad": quad.Model,
      "quadratic": quadratic.Model,
      "ray": ray.Model,
      "square": square.Model,
      "square_x": square_x.Model,
      "square_cross": square_cross.Model,
      "rect": rect.Model,
      "segment": segment.Model,
      "text": text.Model,
      "triangle": triangle.Model,
      "wedge": wedge.Model,
      "x": x.Model
    };
    Glyph = (function(_super) {
      __extends(Glyph, _super);

      function Glyph() {
        _ref = Glyph.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      Glyph.prototype.model = function(attrs, options) {
        var model, type, _ref1;
        if (((_ref1 = attrs.glyphspec) != null ? _ref1.type : void 0) == null) {
          console.log("missing glyph type");
          return;
        }
        type = attrs.glyphspec.type;
        if (!(type in glyphs)) {
          console.log("unknown glyph type '" + type + "'");
          return;
        }
        model = glyphs[type];
        return new model(attrs, options);
      };

      return Glyph;

    })(Backbone.Collection);
    return {
      "Collection": new Glyph()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=glyph_factory.js.map
*/;
!function (definition) {
  if (typeof module == "object" && module.exports) module.exports = definition();
  else if (typeof define == "function") define('timezone',definition);
  else this.tz = definition();
} (function () {
/*
  function die () {
    console.log.apply(console, __slice.call(arguments, 0));
    return process.exit(1);
  }

  function say () { return console.log.apply(console, __slice.call(arguments, 0)) }
*/
  function actualize (entry, rule, year) {
    var actualized, date = rule.day[1];

    do {
      actualized = new Date(Date.UTC(year, rule.month, Math.abs(date++)));
    } while (rule.day[0] < 7 && actualized.getUTCDay() != rule.day[0])

    actualized = {
      clock: rule.clock,
      sort: actualized.getTime(),
      rule: rule,
      save: rule.save * 6e4,
      offset: entry.offset
    };

    actualized[actualized.clock] = actualized.sort + rule.time * 6e4;

    if (actualized.posix) {
      actualized.wallclock = actualized[actualized.clock] + (entry.offset + rule.saved);
    } else {
      actualized.posix = actualized[actualized.clock] - (entry.offset + rule.saved);
    }

    return actualized;
  }

  function find (request, clock, time) {
    var i, I, entry, found, zone = request[request.zone], actualized = [], abbrev, rules
      , j, year = new Date(time).getUTCFullYear(), off = 1;
    for (i = 1, I = zone.length; i < I; i++) if (zone[i][clock] <= time) break;
    entry = zone[i];
    if (entry.rules) {
      rules = request[entry.rules];
      for (j = year + 1; j >= year - off; --j)
        for (i = 0, I = rules.length; i < I; i++)
          if (rules[i].from <= j && j <= rules[i].to) actualized.push(actualize(entry, rules[i], j));
          else if (rules[i].to < j && off == 1) off = j - rules[i].to;
      actualized.sort(function (a, b) { return a.sort - b.sort });
      for (i = 0, I = actualized.length; i < I; i++) {
        if (time >= actualized[i][clock] && actualized[i][actualized[i].clock] > entry[actualized[i].clock]) found = actualized[i];
      }
    }
    if (found) {
      if (abbrev = /^(.*)\/(.*)$/.exec(entry.format)) {
        found.abbrev = abbrev[found.save ? 2 : 1];
      } else {
        found.abbrev = entry.format.replace(/%s/, found.rule.letter);
      }
    }
    return found || entry;
  }

  function convertToWallclock (request, posix) {
    if (request.zone == "UTC") return posix;
    request.entry = find(request, "posix", posix);
    return posix + request.entry.offset + request.entry.save;
  }

  function convertToPOSIX (request, wallclock) {
    if (request.zone == "UTC") return wallclock;

    var entry, diff;
    request.entry = entry = find(request, "wallclock", wallclock);
    diff = wallclock - entry.wallclock;

    return 0 < diff && diff < entry.save ? null : wallclock - entry.offset - entry.save;
  }

  function adjust (request, posix, match) {
    var increment = +(match[1] + 1) // conversion necessary for week day addition
      , offset = match[2] * increment
      , index = UNITS.indexOf(match[3].toLowerCase())
      , date
      ;
    if (index > 9) {
      posix += offset * TIME[index - 10];
    } else {
      date = new Date(convertToWallclock(request, posix));
      if (index < 7) {
        while (offset) {
          date.setUTCDate(date.getUTCDate() + increment);
          if (date.getUTCDay() == index) offset -= increment;
        }
      } else if (index == 7) {
        date.setUTCFullYear(date.getUTCFullYear() + offset);
      } else if (index == 8) {
        date.setUTCMonth(date.getUTCMonth() + offset);
      } else {
        date.setUTCDate(date.getUTCDate() + offset);
      }
      if ((posix = convertToPOSIX(request, date.getTime())) == null) {
        posix = convertToPOSIX(request, date.getTime() + 864e5 * increment) - 864e5 * increment;
      }
    }
    return posix;
  }

  function convert (vargs) {
    if (!vargs.length) return "0.0.23";

    var request = Object.create(this)
      , adjustments = []
      , i, I, $, argument, date
      ;

    for (i = 0; i < vargs.length; i++) { // leave the for loop alone, it works.
      argument = vargs[i];
      // https://twitter.com/bigeasy/status/215112186572439552
      if (Array.isArray(argument)) {
        if (!i && !isNaN(argument[1])) {
          date = argument;
        } else {
          argument.splice.apply(vargs, [ i--, 1 ].concat(argument));
        }
      } else if (isNaN(argument)) {
        $ = typeof argument;
        if ($ == "string") {
          if (~argument.indexOf("%")) {
            request.format = argument;
          } else if (!i && argument == "*") {
            date = argument;
          } else if (!i && ($ = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?(Z|(([+-])(\d{2}(:\d{2}){0,2})))?)?$/.exec(argument))) {
            date = [];
            date.push.apply(date, $.slice(1, 8));
            if ($[9]) {
              date.push($[10] + 1);
              date.push.apply(date, $[11].split(/:/));
            } else if ($[8]) {
              date.push(1);
            }
          } else if (/^\w{2,3}_\w{2}$/.test(argument)) {
            request.locale = argument;
          } else if ($ = UNIT_RE.exec(argument)) {
            adjustments.push($);
          } else {
            request.zone = argument;
          }
        } else if ($ == "function") {
          if ($ = argument.call(request)) return $;
        } else if (/^\w{2,3}_\w{2}$/.test(argument.name)) {
          request[argument.name] = argument;
        } else if (argument.zones) {
          for ($ in argument.zones) request[$] = argument.zones[$];
          for ($ in argument.rules) request[$] = argument.rules[$];
        }
      } else if (!i) {
        date = argument;
      }
    }

    if (!request[request.locale]) delete request.locale;
    if (!request[request.zone]) delete request.zone;

    if (date != null) {
      if (date == "*") {
        date = request.clock();
      } else if (Array.isArray(date)) {
        I = !date[7];
        for (i = 0; i < 11; i++) date[i] = +(date[i] || 0); // conversion necessary for decrement
        --date[1]; // Grr..
        date = Date.UTC.apply(Date.UTC, date.slice(0, 8)) +
          -date[7] * (date[8] * 36e5 + date[9] * 6e4 + date[10] * 1e3);
      } else {
        date = Math.floor(date);
      }
      if (!isNaN(date)) {
        if (I) date = convertToPOSIX(request, date);

        if (date == null) return date;

        for (i = 0, I = adjustments.length; i < I; i++) {
          date = adjust(request, date, adjustments[i]);
        }

        if (!request.format) return date;

        $ = new Date(convertToWallclock(request, date));
        return request.format.replace(/%([-0_^]?)(:{0,3})(\d*)(.)/g,
        function (value, flag, colons, padding, specifier) {
          var f, fill = "0", pad;
          if (f = request[specifier]) {
            value = String(f.call(request, $, date, flag, colons.length));
            if ((flag || f.style) == "_") fill = " ";
            pad = flag == "-" ? 0 : f.pad || 0;
            while (value.length < pad) value = fill + value;
            pad = flag == "-" ? 0 : padding || f.pad;
            while (value.length < pad) value = fill + value;
            if (specifier == "N" && pad < value.length) value = value.slice(0, pad);
            if (flag == "^") value = value.toUpperCase();
          }
          return value;
        });
      }
    }

    return function () { return request.convert(arguments) };
  }

  var context =
    { clock: function () { return +(new Date()) }
    , zone: "UTC"
    , entry: { abbrev: "UTC", offset: 0, save: 0 }
    , UTC: 1
    , z: function(date, posix, flag, delimiters) {
        var offset = this.entry.offset + this.entry.save
          , seconds = Math.abs(offset / 1000), parts = [], part = 3600, i, z;
        for (i = 0; i < 3; i++) {
          parts.push(("0" + Math.floor(seconds / part)).slice(-2));
          seconds %= part;
          part /= 60;
        }
        if (flag == "^" && !offset) return "Z";
        if (flag == "^") delimiters = 3;
        if (delimiters == 3) {
          z = parts.join(":");
          z = z.replace(/:00$/, "");
          if (flag != "^") z = z.replace(/:00$/, "");
        } else if (delimiters) {
          z = parts.slice(0, delimiters + 1).join(":");
          if (flag == "^") z = z.replace(/:00$/, "");
        } else {
          z = parts.slice(0, 2).join("");
        }
        z = (offset < 0 ? "-" : "+") + z;
        z = z.replace(/([-+])(0)/, { "_": " $1", "-": "$1" }[flag] || "$1$2");
        return z;
      }
    , "%": function(date) { return "%" }
    , n: function (date) { return "\n" }
    , t: function (date) { return "\t" }
    , U: function (date) { return weekOfYear(date, 0) }
    , W: function (date) { return weekOfYear(date, 1) }
    , V: function (date) { return isoWeek(date)[0] }
    , G: function (date) { return isoWeek(date)[1] }
    , g: function (date) { return isoWeek(date)[1] % 100 }
    , j: function (date) { return Math.floor((date.getTime() - Date.UTC(date.getUTCFullYear(), 0)) / 864e5) + 1 }
    , s: function (date) { return Math.floor(date.getTime() / 1000) }
    , C: function (date) { return Math.floor(date.getUTCFullYear() / 100) }
    , N: function (date) { return date.getTime() % 1000 * 1000000 }
    , m: function (date) { return date.getUTCMonth() + 1 }
    , Y: function (date) { return date.getUTCFullYear() }
    , y: function (date) { return date.getUTCFullYear() % 100 }
    , H: function (date) { return date.getUTCHours() }
    , M: function (date) { return date.getUTCMinutes() }
    , S: function (date) { return date.getUTCSeconds() }
    , e: function (date) { return date.getUTCDate() }
    , d: function (date) { return date.getUTCDate() }
    , u: function (date) { return date.getUTCDay() || 7 }
    , w: function (date) { return date.getUTCDay() }
    , l: function (date) { return date.getUTCHours() % 12 || 12 }
    , I: function (date) { return date.getUTCHours() % 12 || 12 }
    , k: function (date) { return date.getUTCHours() }
    , Z: function (date) { return this.entry.abbrev }
    , a: function (date) { return this[this.locale].day.abbrev[date.getUTCDay()] }
    , A: function (date) { return this[this.locale].day.full[date.getUTCDay()] }
    , h: function (date) { return this[this.locale].month.abbrev[date.getUTCMonth()] }
    , b: function (date) { return this[this.locale].month.abbrev[date.getUTCMonth()] }
    , B: function (date) { return this[this.locale].month.full[date.getUTCMonth()] }
    , P: function (date) { return this[this.locale].meridiem[Math.floor(date.getUTCHours() / 12)].toLowerCase() }
    , p: function (date) { return this[this.locale].meridiem[Math.floor(date.getUTCHours() / 12)] }
    , R: function (date, posix) { return this.convert([ posix, "%H:%M" ]) }
    , T: function (date, posix) { return this.convert([ posix, "%H:%M:%S" ]) }
    , D: function (date, posix) { return this.convert([ posix, "%m/%d/%y" ]) }
    , F: function (date, posix) { return this.convert([ posix, "%Y-%m-%d" ]) }
    , x: function (date, posix) { return this.convert([ posix, this[this.locale].date ]) }
    , r: function (date, posix) { return this.convert([ posix, this[this.locale].time12 || '%I:%M:%S' ]) }
    , X: function (date, posix) { return this.convert([ posix, this[this.locale].time24 ]) }
    , c: function (date, posix) { return this.convert([ posix, this[this.locale].dateTime ]) }
    , convert: convert
    , locale: "en_US"
    , en_US: {
        date: "%m/%d/%Y",
        time24: "%I:%M:%S %p",
        time12: "%I:%M:%S %p",
        dateTime: "%a %d %b %Y %I:%M:%S %p %Z",
        meridiem: [ "AM", "PM" ],
        month: {
          abbrev: "Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec".split("|"),
          full: "January|February|March|April|May|June|July|August|September|October|November|December".split("|")
        },
        day: {
          abbrev: "Sun|Mon|Tue|Wed|Thu|Fri|Sat".split("|"),
          full: "Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday".split("|")
        }
      }
    };
  var UNITS = "Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|year|month|day|hour|minute|second|millisecond"
    , UNIT_RE = new RegExp("^\\s*([+-])(\\d+)\\s+(" + UNITS + ")s?\\s*$", "i")
    , TIME = [ 36e5, 6e4, 1e3, 1 ]
    ;
  UNITS = UNITS.toLowerCase().split("|");

  "delmHMSUWVgCIky".replace(/./g, function (e) { context[e].pad = 2 });

  context.N.pad = 9;
  context.j.pad = 3;

  context.k.style = "_";
  context.l.style = "_";
  context.e.style = "_";

  function weekOfYear (date, startOfWeek) {
    var diff, nyd, weekStart;
    nyd = new Date(Date.UTC(date.getUTCFullYear(), 0));
    diff = Math.floor((date.getTime() - nyd.getTime()) / 864e5);
    if (nyd.getUTCDay() == startOfWeek) {
      weekStart = 0;
    } else {
      weekStart = 7 - nyd.getUTCDay() + startOfWeek;
      if (weekStart == 8) {
        weekStart = 1;
      }
    }
    return diff >= weekStart ? Math.floor((diff - weekStart) / 7) + 1 : 0;
  }

  function isoWeek (date) {
    var nyd, nyy, week;
    nyy = date.getUTCFullYear();
    nyd = new Date(Date.UTC(nyy, 0)).getUTCDay();
    week = weekOfYear(date, 1) + (nyd > 1 && nyd <= 4 ? 1 : 0);
    if (!week) {
      nyy = date.getUTCFullYear() - 1;
      nyd = new Date(Date.UTC(nyy, 0)).getUTCDay();
      week = nyd == 4 || (nyd == 3 && new Date(nyy, 1, 29).getDate() == 29) ? 53 : 52;
      return [week, date.getUTCFullYear() - 1];
    } else if (week == 53 && !(nyd == 4 || (nyd == 3 && new Date(nyy, 1, 29).getDate() == 29))) {
      return [1, date.getUTCFullYear() + 1];
    } else {
      return [week, date.getUTCFullYear()];
    }
  }

  return function () { return context.convert(arguments) };
});

/*! sprintf.js | Copyright (c) 2007-2013 Alexandru Marasteanu <hello at alexei dot ro> | 3 clause BSD license */

(function(ctx) {
	var sprintf = function() {
		if (!sprintf.cache.hasOwnProperty(arguments[0])) {
			sprintf.cache[arguments[0]] = sprintf.parse(arguments[0]);
		}
		return sprintf.format.call(null, sprintf.cache[arguments[0]], arguments);
	};

	sprintf.format = function(parse_tree, argv) {
		var cursor = 1, tree_length = parse_tree.length, node_type = '', arg, output = [], i, k, match, pad, pad_character, pad_length;
		for (i = 0; i < tree_length; i++) {
			node_type = get_type(parse_tree[i]);
			if (node_type === 'string') {
				output.push(parse_tree[i]);
			}
			else if (node_type === 'array') {
				match = parse_tree[i]; // convenience purposes only
				if (match[2]) { // keyword argument
					arg = argv[cursor];
					for (k = 0; k < match[2].length; k++) {
						if (!arg.hasOwnProperty(match[2][k])) {
							throw(sprintf('[sprintf] property "%s" does not exist', match[2][k]));
						}
						arg = arg[match[2][k]];
					}
				}
				else if (match[1]) { // positional argument (explicit)
					arg = argv[match[1]];
				}
				else { // positional argument (implicit)
					arg = argv[cursor++];
				}

				if (/[^s]/.test(match[8]) && (get_type(arg) != 'number')) {
					throw(sprintf('[sprintf] expecting number but found %s', get_type(arg)));
				}
				switch (match[8]) {
					case 'b': arg = arg.toString(2); break;
					case 'c': arg = String.fromCharCode(arg); break;
					case 'd': arg = parseInt(arg, 10); break;
					case 'e': arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential(); break;
					case 'f': arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg); break;
					case 'o': arg = arg.toString(8); break;
					case 's': arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg); break;
					case 'u': arg = arg >>> 0; break;
					case 'x': arg = arg.toString(16); break;
					case 'X': arg = arg.toString(16).toUpperCase(); break;
				}
				arg = (/[def]/.test(match[8]) && match[3] && arg >= 0 ? '+'+ arg : arg);
				pad_character = match[4] ? match[4] == '0' ? '0' : match[4].charAt(1) : ' ';
				pad_length = match[6] - String(arg).length;
				pad = match[6] ? str_repeat(pad_character, pad_length) : '';
				output.push(match[5] ? arg + pad : pad + arg);
			}
		}
		return output.join('');
	};

	sprintf.cache = {};

	sprintf.parse = function(fmt) {
		var _fmt = fmt, match = [], parse_tree = [], arg_names = 0;
		while (_fmt) {
			if ((match = /^[^\x25]+/.exec(_fmt)) !== null) {
				parse_tree.push(match[0]);
			}
			else if ((match = /^\x25{2}/.exec(_fmt)) !== null) {
				parse_tree.push('%');
			}
			else if ((match = /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(_fmt)) !== null) {
				if (match[2]) {
					arg_names |= 1;
					var field_list = [], replacement_field = match[2], field_match = [];
					if ((field_match = /^([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
						field_list.push(field_match[1]);
						while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
							if ((field_match = /^\.([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
								field_list.push(field_match[1]);
							}
							else if ((field_match = /^\[(\d+)\]/.exec(replacement_field)) !== null) {
								field_list.push(field_match[1]);
							}
							else {
								throw('[sprintf] huh?');
							}
						}
					}
					else {
						throw('[sprintf] huh?');
					}
					match[2] = field_list;
				}
				else {
					arg_names |= 2;
				}
				if (arg_names === 3) {
					throw('[sprintf] mixing positional and named placeholders is not (yet) supported');
				}
				parse_tree.push(match);
			}
			else {
				throw('[sprintf] huh?');
			}
			_fmt = _fmt.substring(match[0].length);
		}
		return parse_tree;
	};

	var vsprintf = function(fmt, argv, _argv) {
		_argv = argv.slice(0);
		_argv.splice(0, 0, fmt);
		return sprintf.apply(null, _argv);
	};

	/**
	 * helpers
	 */
	function get_type(variable) {
		return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase();
	}

	function str_repeat(input, multiplier) {
		for (var output = []; multiplier > 0; output[--multiplier] = input) {/* do nothing */}
		return output.join('');
	}

	/**
	 * export to either browser or node.js
	 */
	ctx.sprintf = sprintf;
	ctx.vsprintf = vsprintf;
})(typeof exports != "undefined" ? exports : window);

define("sprintf", (function (global) {
    return function () {
        var ret, fn;
        return ret || global.sprintf;
    };
}(this)));

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('common/ticking',["underscore", "timezone", "sprintf"], function(_, tz, sprintf) {
    var AbstractScale, AdaptiveScale, BasicScale, BasicTickFormatter, CompositeScale, DEFAULT_DESIRED_N_TICKS, DatetimeFormatter, DatetimeScale, DaysScale, MonthsScale, ONE_DAY, ONE_HOUR, ONE_MILLI, ONE_MINUTE, ONE_MONTH, ONE_SECOND, ONE_YEAR, SingleIntervalScale, arange, argmin, clamp, copy_date, date_range_by_month, date_range_by_year, indices, last_month_no_later_than, last_year_no_later_than, log, repr, _array, _four_digit_year, _ms_dot_us, _strftime, _two_digit_year, _us;
    arange = function(start, end, step) {
      var i, ret_arr;
      if (end == null) {
        end = false;
      }
      if (step == null) {
        step = false;
      }
      if (!end) {
        end = start;
        start = 0;
      }
      if (start > end) {
        if (step === false) {
          step = -1;
        } else if (step > 0) {
          "the loop will never terminate";
          1 / 0;
        }
      } else if (step < 0) {
        "the loop will never terminate";
        1 / 0;
      }
      if (!step) {
        step = 1;
      }
      ret_arr = [];
      i = start;
      if (start < end) {
        while (i < end) {
          ret_arr.push(i);
          i += step;
        }
      } else {
        while (i > end) {
          ret_arr.push(i);
          i += step;
        }
      }
      return ret_arr;
    };
    repr = function(obj) {
      var elem, elems_str, key, obj_as_string, props_str;
      if (obj === null) {
        return "null";
      } else if (obj.constructor === Array) {
        elems_str = ((function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = obj.length; _i < _len; _i++) {
            elem = obj[_i];
            _results.push(repr(elem));
          }
          return _results;
        })()).join(", ");
        return "[" + elems_str + "]";
      } else if (obj.constructor === Object) {
        props_str = ((function() {
          var _results;
          _results = [];
          for (key in obj) {
            _results.push("" + key + ": " + (repr(obj[key])));
          }
          return _results;
        })()).join(", ");
        return "{" + props_str + "}";
      } else if (obj.constructor === String) {
        return "\"" + obj + "\"";
      } else if (obj.constructor === Function) {
        return "<Function: " + obj.name + ">";
      } else {
        obj_as_string = obj.toString();
        if (obj_as_string === "[object Object]") {
          return "<" + obj.constructor.name + ">";
        } else {
          return obj_as_string;
        }
      }
    };
    indices = function(arr) {
      return _.range(arr.length);
    };
    argmin = function(arr) {
      var ret;
      ret = _.min(indices(arr), (function(i) {
        return arr[i];
      }));
      return ret;
    };
    clamp = function(x, min_val, max_val) {
      return Math.max(min_val, Math.min(max_val, x));
    };
    log = function(x, base) {
      if (base == null) {
        base = Math.E;
      }
      return Math.log(x) / Math.log(base);
    };
    copy_date = function(date) {
      return new Date(date.getTime());
    };
    last_month_no_later_than = function(date) {
      date = copy_date(date);
      date.setUTCDate(1);
      date.setUTCHours(0);
      date.setUTCMinutes(0);
      date.setUTCSeconds(0);
      date.setUTCMilliseconds(0);
      return date;
    };
    last_year_no_later_than = function(date) {
      date = last_month_no_later_than(date);
      date.setUTCMonth(0);
      return date;
    };
    date_range_by_year = function(start_time, end_time) {
      var date, dates, end_date, start_date;
      start_date = last_year_no_later_than(new Date(start_time));
      end_date = last_year_no_later_than(new Date(end_time));
      end_date.setUTCFullYear(end_date.getUTCFullYear() + 1);
      dates = [];
      date = start_date;
      while (true) {
        dates.push(copy_date(date));
        date.setUTCFullYear(date.getUTCFullYear() + 1);
        if (date > end_date) {
          break;
        }
      }
      return dates;
    };
    date_range_by_month = function(start_time, end_time) {
      var date, dates, end_date, prev_end_date, start_date;
      start_date = last_month_no_later_than(new Date(start_time));
      end_date = last_month_no_later_than(new Date(end_time));
      prev_end_date = copy_date(end_date);
      end_date.setUTCMonth(end_date.getUTCMonth() + 1);
      dates = [];
      date = start_date;
      while (true) {
        dates.push(copy_date(date));
        date.setUTCMonth(date.getUTCMonth() + 1);
        if (date > end_date) {
          break;
        }
      }
      return dates;
    };
    DEFAULT_DESIRED_N_TICKS = 6;
    AbstractScale = (function() {
      function AbstractScale(toString_properties) {
        this.toString_properties = toString_properties != null ? toString_properties : [];
      }

      AbstractScale.prototype.get_ticks = function(data_low, data_high, desired_n_ticks) {
        if (desired_n_ticks == null) {
          desired_n_ticks = DEFAULT_DESIRED_N_TICKS;
        }
        return this.get_ticks_no_defaults(data_low, data_high, desired_n_ticks);
      };

      AbstractScale.prototype.get_ticks_no_defaults = function(data_low, data_high, desired_n_ticks) {
        var end_factor, factor, factors, interval, start_factor, ticks;
        interval = this.get_interval(data_low, data_high, desired_n_ticks);
        start_factor = Math.floor(data_low / interval);
        end_factor = Math.ceil(data_high / interval);
        factors = arange(start_factor, end_factor + 1);
        ticks = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = factors.length; _i < _len; _i++) {
            factor = factors[_i];
            _results.push(factor * interval);
          }
          return _results;
        })();
        return ticks;
      };

      AbstractScale.prototype.get_interval = void 0;

      AbstractScale.prototype.get_min_interval = function() {
        return this.min_interval;
      };

      AbstractScale.prototype.get_max_interval = function() {
        return this.max_interval;
      };

      AbstractScale.prototype.min_interval = void 0;

      AbstractScale.prototype.max_interval = void 0;

      AbstractScale.prototype.toString = function() {
        var class_name, key, params_str, props;
        class_name = this.constructor.name;
        props = this.toString_properties;
        params_str = ((function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = props.length; _i < _len; _i++) {
            key = props[_i];
            _results.push("" + key + "=" + (repr(this[key])));
          }
          return _results;
        }).call(this)).join(", ");
        return "" + class_name + "(" + params_str + ")";
      };

      AbstractScale.prototype.get_ideal_interval = function(data_low, data_high, desired_n_ticks) {
        var data_range;
        data_range = data_high - data_low;
        return data_range / desired_n_ticks;
      };

      return AbstractScale;

    })();
    SingleIntervalScale = (function(_super) {
      __extends(SingleIntervalScale, _super);

      function SingleIntervalScale(interval) {
        this.interval = interval;
        SingleIntervalScale.__super__.constructor.call(this, ['interval']);
        this.min_interval = this.interval;
        this.max_interval = this.interval;
      }

      SingleIntervalScale.prototype.get_interval = function(data_low, data_high, n_desired_ticks) {
        return this.interval;
      };

      return SingleIntervalScale;

    })(AbstractScale);
    CompositeScale = (function(_super) {
      __extends(CompositeScale, _super);

      function CompositeScale(scales) {
        this.scales = scales;
        CompositeScale.__super__.constructor.call(this);
        this.min_intervals = _.invoke(this.scales, 'get_min_interval');
        this.max_intervals = _.invoke(this.scales, 'get_max_interval');
        this.min_interval = _.first(this.min_intervals);
        this.max_interval = _.last(this.max_intervals);
      }

      CompositeScale.prototype.get_best_scale = function(data_low, data_high, desired_n_ticks) {
        var best_scale, best_scale_ndx, data_range, errors, ideal_interval, intervals, scale_ndxs;
        data_range = data_high - data_low;
        ideal_interval = this.get_ideal_interval(data_low, data_high, desired_n_ticks);
        scale_ndxs = [_.sortedIndex(this.min_intervals, ideal_interval) - 1, _.sortedIndex(this.max_intervals, ideal_interval)];
        intervals = [this.min_intervals[scale_ndxs[0]], this.max_intervals[scale_ndxs[1]]];
        errors = intervals.map(function(interval) {
          return Math.abs(desired_n_ticks - (data_range / interval));
        });
        best_scale_ndx = scale_ndxs[argmin(errors)];
        best_scale = this.scales[best_scale_ndx];
        return best_scale;
      };

      CompositeScale.prototype.get_interval = function(data_low, data_high, desired_n_ticks) {
        var best_scale;
        best_scale = this.get_best_scale(data_low, data_high, desired_n_ticks);
        return best_scale.get_interval(data_low, data_high, desired_n_ticks);
      };

      CompositeScale.prototype.get_ticks_no_defaults = function(data_low, data_high, desired_n_ticks) {
        var best_scale;
        best_scale = this.get_best_scale(data_low, data_high, desired_n_ticks);
        return best_scale.get_ticks_no_defaults(data_low, data_high, desired_n_ticks);
      };

      return CompositeScale;

    })(AbstractScale);
    AdaptiveScale = (function(_super) {
      __extends(AdaptiveScale, _super);

      function AdaptiveScale(mantissas, base, min_interval, max_interval) {
        var prefix_mantissa, suffix_mantissa;
        this.mantissas = mantissas;
        this.base = base != null ? base : 10.0;
        this.min_interval = min_interval != null ? min_interval : 0.0;
        this.max_interval = max_interval != null ? max_interval : Infinity;
        AdaptiveScale.__super__.constructor.call(this, ['mantissas', 'base', 'min_magnitude', 'max_magnitude']);
        prefix_mantissa = _.last(this.mantissas) / this.base;
        suffix_mantissa = _.first(this.mantissas) * this.base;
        this.extended_mantissas = _.flatten([prefix_mantissa, this.mantissas, suffix_mantissa]);
        this.base_factor = this.min_interval === 0.0 ? 1.0 : this.min_interval;
      }

      AdaptiveScale.prototype.get_interval = function(data_low, data_high, desired_n_ticks) {
        var best_mantissa, candidate_mantissas, data_range, errors, ideal_interval, ideal_magnitude, ideal_mantissa, interval, interval_exponent;
        data_range = data_high - data_low;
        ideal_interval = this.get_ideal_interval(data_low, data_high, desired_n_ticks);
        interval_exponent = Math.floor(log(ideal_interval / this.base_factor, this.base));
        ideal_magnitude = Math.pow(this.base, interval_exponent) * this.base_factor;
        ideal_mantissa = ideal_interval / ideal_magnitude;
        candidate_mantissas = this.extended_mantissas;
        errors = candidate_mantissas.map(function(mantissa) {
          return Math.abs(desired_n_ticks - (data_range / (mantissa * ideal_magnitude)));
        });
        best_mantissa = candidate_mantissas[argmin(errors)];
        interval = best_mantissa * ideal_magnitude;
        return clamp(interval, this.min_interval, this.max_interval);
      };

      return AdaptiveScale;

    })(AbstractScale);
    MonthsScale = (function(_super) {
      __extends(MonthsScale, _super);

      function MonthsScale(months) {
        this.months = months;
        this.typical_interval = this.months.length > 1 ? (this.months[1] - this.months[0]) * ONE_MONTH : 12 * ONE_MONTH;
        MonthsScale.__super__.constructor.call(this, this.typical_interval);
        this.toString_properties = ['months'];
      }

      MonthsScale.prototype.get_ticks_no_defaults = function(data_low, data_high, desired_n_ticks) {
        var all_ticks, date, month_dates, months, months_of_year, ticks_in_range, year_dates;
        year_dates = date_range_by_year(data_low, data_high);
        months = this.months;
        months_of_year = function(year_date) {
          return months.map(function(month) {
            var month_date;
            month_date = copy_date(year_date);
            month_date.setUTCMonth(month);
            return month_date;
          });
        };
        month_dates = _.flatten((function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = year_dates.length; _i < _len; _i++) {
            date = year_dates[_i];
            _results.push(months_of_year(date));
          }
          return _results;
        })());
        all_ticks = _.invoke(month_dates, 'getTime');
        ticks_in_range = _.filter(all_ticks, (function(tick) {
          return (data_low <= tick && tick <= data_high);
        }));
        return ticks_in_range;
      };

      return MonthsScale;

    })(SingleIntervalScale);
    DaysScale = (function(_super) {
      __extends(DaysScale, _super);

      function DaysScale(days) {
        this.days = days;
        this.typical_interval = this.days.length > 1 ? (this.days[1] - this.days[0]) * ONE_DAY : 31 * ONE_DAY;
        DaysScale.__super__.constructor.call(this, this.typical_interval);
        this.toString_properties = ['days'];
      }

      DaysScale.prototype.get_ticks_no_defaults = function(data_low, data_high, desired_n_ticks) {
        var all_ticks, date, day_dates, days, days_of_month, month_dates, ticks_in_range, typical_interval;
        month_dates = date_range_by_month(data_low, data_high);
        days = this.days;
        typical_interval = this.typical_interval;
        days_of_month = function(month_date) {
          var dates, day, day_date, future_date, _i, _len;
          dates = [];
          for (_i = 0, _len = days.length; _i < _len; _i++) {
            day = days[_i];
            day_date = copy_date(month_date);
            day_date.setUTCDate(day);
            future_date = new Date(day_date.getTime() + (typical_interval / 2));
            if (future_date.getUTCMonth() === month_date.getUTCMonth()) {
              dates.push(day_date);
            }
          }
          return dates;
        };
        day_dates = _.flatten((function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = month_dates.length; _i < _len; _i++) {
            date = month_dates[_i];
            _results.push(days_of_month(date));
          }
          return _results;
        })());
        all_ticks = _.invoke(day_dates, 'getTime');
        ticks_in_range = _.filter(all_ticks, (function(tick) {
          return (data_low <= tick && tick <= data_high);
        }));
        return ticks_in_range;
      };

      return DaysScale;

    })(SingleIntervalScale);
    ONE_MILLI = 1.0;
    ONE_SECOND = 1000.0;
    ONE_MINUTE = 60.0 * ONE_SECOND;
    ONE_HOUR = 60 * ONE_MINUTE;
    ONE_DAY = 24 * ONE_HOUR;
    ONE_MONTH = 30 * ONE_DAY;
    ONE_YEAR = 365 * ONE_DAY;
    BasicScale = (function(_super) {
      __extends(BasicScale, _super);

      function BasicScale() {
        BasicScale.__super__.constructor.call(this, [1, 2, 5]);
      }

      return BasicScale;

    })(AdaptiveScale);
    DatetimeScale = (function(_super) {
      __extends(DatetimeScale, _super);

      function DatetimeScale() {
        DatetimeScale.__super__.constructor.call(this, [new AdaptiveScale([1, 2, 5], 10, 0, 500 * ONE_MILLI), new AdaptiveScale([1, 2, 5, 10, 15, 20, 30], 60, ONE_SECOND, 30 * ONE_MINUTE), new AdaptiveScale([1, 2, 4, 6, 8, 12], 24.0, ONE_HOUR, 12 * ONE_HOUR), new DaysScale(arange(1, 32)), new DaysScale(arange(1, 31, 3)), new DaysScale([1, 8, 15, 22]), new DaysScale([1, 15]), new MonthsScale(arange(0, 12)), new MonthsScale(arange(0, 12, 2)), new MonthsScale(arange(0, 12, 4)), new MonthsScale(arange(0, 12, 6)), new AdaptiveScale([1, 2, 5], 10, ONE_YEAR, Infinity)]);
      }

      return DatetimeScale;

    })(CompositeScale);
    BasicTickFormatter = (function() {
      function BasicTickFormatter(precision, use_scientific, power_limit_high, power_limit_low) {
        this.precision = precision != null ? precision : 'auto';
        this.use_scientific = use_scientific != null ? use_scientific : true;
        this.power_limit_high = power_limit_high != null ? power_limit_high : 5;
        this.power_limit_low = power_limit_low != null ? power_limit_low : -3;
        this.scientific_limit_low = Math.pow(10.0, power_limit_low);
        this.scientific_limit_high = Math.pow(10.0, power_limit_high);
        this.last_precision = 3;
      }

      BasicTickFormatter.prototype.format = function(ticks) {
        var i, is_ok, labels, need_sci, tick, tick_abs, x, zero_eps, _i, _j, _k, _l, _len, _m, _n, _ref, _ref1, _ref2, _ref3, _ref4;
        if (ticks.length === 0) {
          return [];
        }
        zero_eps = 0;
        if (ticks.length >= 2) {
          zero_eps = Math.abs(ticks[1] - ticks[0]) / 10000;
        }
        need_sci = false;
        if (this.use_scientific) {
          for (_i = 0, _len = ticks.length; _i < _len; _i++) {
            tick = ticks[_i];
            tick_abs = Math.abs(tick);
            if (tick_abs > zero_eps && (tick_abs >= this.scientific_limit_high || tick_abs <= this.scientific_limit_low)) {
              need_sci = true;
              break;
            }
          }
        }
        if (_.isNumber(this.precision)) {
          labels = new Array(ticks.length);
          if (need_sci) {
            for (i = _j = 0, _ref = ticks.length; 0 <= _ref ? _j < _ref : _j > _ref; i = 0 <= _ref ? ++_j : --_j) {
              labels[i] = ticks[i].toExponential(this.precision);
            }
          } else {
            for (i = _k = 0, _ref1 = ticks.length; 0 <= _ref1 ? _k < _ref1 : _k > _ref1; i = 0 <= _ref1 ? ++_k : --_k) {
              labels[i] = ticks[i].toPrecision(this.precision).replace(/(\.[0-9]*?)0+$/, "$1").replace(/\.$/, "");
            }
          }
          return labels;
        } else if (this.precision === 'auto') {
          labels = new Array(ticks.length);
          for (x = _l = _ref2 = this.last_precision; _ref2 <= 15 ? _l <= 15 : _l >= 15; x = _ref2 <= 15 ? ++_l : --_l) {
            is_ok = true;
            if (need_sci) {
              for (i = _m = 0, _ref3 = ticks.length; 0 <= _ref3 ? _m < _ref3 : _m > _ref3; i = 0 <= _ref3 ? ++_m : --_m) {
                labels[i] = ticks[i].toExponential(x);
                if (i > 0) {
                  if (labels[i] === labels[i - 1]) {
                    is_ok = false;
                    break;
                  }
                }
              }
              if (is_ok) {
                break;
              }
            } else {
              for (i = _n = 0, _ref4 = ticks.length; 0 <= _ref4 ? _n < _ref4 : _n > _ref4; i = 0 <= _ref4 ? ++_n : --_n) {
                labels[i] = ticks[i].toPrecision(x).replace(/(\.[0-9]*?)0+$/, "$1").replace(/\.$/, "");
                if (i > 0) {
                  if (labels[i] === labels[i - 1]) {
                    is_ok = false;
                    break;
                  }
                }
              }
              if (is_ok) {
                break;
              }
            }
            if (is_ok) {
              this.last_precision = x;
              return labels;
            }
          }
        }
        return labels;
      };

      return BasicTickFormatter;

    })();
    _us = function(t) {
      return sprintf("%3dus", Math.floor((t % 1) * 1000));
    };
    _ms_dot_us = function(t) {
      var ms, us;
      ms = Math.floor(((t / 1000) % 1) * 1000);
      us = Math.floor((t % 1) * 1000);
      return sprintf("%3d.%3dms", ms, us);
    };
    _two_digit_year = function(t) {
      var dt, year;
      dt = new Date(t);
      year = dt.getFullYear();
      if (dt.getMonth() >= 7) {
        year += 1;
      }
      return sprintf("'%02d", year % 100);
    };
    _four_digit_year = function(t) {
      var dt, year;
      dt = new Date(t);
      year = dt.getFullYear();
      if (dt.getMonth() >= 7) {
        year += 1;
      }
      return sprintf("%d", year);
    };
    _array = function(t) {
      return tz(t, "%Y %m %d %H %M %S").split(/\s+/).map(function(e) {
        return parseInt(e, 10);
      });
    };
    _strftime = function(t, format) {
      if (_.isFunction(format)) {
        return format(t);
      } else {
        return tz(t, format);
      }
    };
    DatetimeFormatter = (function() {
      DatetimeFormatter.prototype.format_order = ['microseconds', 'milliseconds', 'seconds', 'minsec', 'minutes', 'hourmin', 'hours', 'days', 'months', 'years'];

      DatetimeFormatter.prototype.strip_leading_zeros = true;

      function DatetimeFormatter() {
        var fmt, fmt_name, fmt_strings, size, sizes, tmptime, _i, _len;
        this._formats = {
          'microseconds': [_us, _ms_dot_us],
          'milliseconds': ['%3Nms', '%S.%3Ns'],
          'seconds': ['%Ss'],
          'minsec': [':%M:%S'],
          'minutes': [':%M', '%Mm'],
          'hourmin': ['%H:%M'],
          'hours': ['%Hh', '%H:%M'],
          'days': ['%m/%d', '%a%d'],
          'months': ['%m/%Y', '%b%y'],
          'years': ['%Y', _two_digit_year, _four_digit_year]
        };
        this.formats = {};
        for (fmt_name in this._formats) {
          fmt_strings = this._formats[fmt_name];
          sizes = [];
          tmptime = tz(new Date());
          for (_i = 0, _len = fmt_strings.length; _i < _len; _i++) {
            fmt = fmt_strings[_i];
            size = (_strftime(tmptime, fmt)).length;
            sizes.push(size);
          }
          this.formats[fmt_name] = [sizes, fmt_strings];
        }
        return;
      }

      DatetimeFormatter.prototype._get_resolution_str = function(resolution_secs, span_secs) {
        var adjusted_resolution_secs, str;
        adjusted_resolution_secs = resolution_secs * 1.1;
        if (adjusted_resolution_secs < 1e-3) {
          str = "microseconds";
        } else if (adjusted_resolution_secs < 1.0) {
          str = "milliseconds";
        } else if (adjusted_resolution_secs < 60) {
          if (span_secs >= 60) {
            str = "minsec";
          } else {
            str = "seconds";
          }
        } else if (adjusted_resolution_secs < 3600) {
          if (span_secs >= 3600) {
            str = "hourmin";
          } else {
            str = "minutes";
          }
        } else if (adjusted_resolution_secs < 24 * 3600) {
          str = "hours";
        } else if (adjusted_resolution_secs < 31 * 24 * 3600) {
          str = "days";
        } else if (adjusted_resolution_secs < 365 * 24 * 3600) {
          str = "months";
        } else {
          str = "years";
        }
        return str;
      };

      DatetimeFormatter.prototype.format = function(ticks, num_labels, char_width, fill_ratio, ticker) {
        var dt, error, fmt, format, formats, good_formats, hybrid_handled, i, labels, next_format, next_ndx, r, resol, resol_ndx, s, span, ss, t, time_tuple_ndx_for_resol, tm, widths, _i, _j, _k, _len, _len1, _ref, _ref1, _ref2;
        if (num_labels == null) {
          num_labels = null;
        }
        if (char_width == null) {
          char_width = null;
        }
        if (fill_ratio == null) {
          fill_ratio = 0.3;
        }
        if (ticker == null) {
          ticker = null;
        }
        if (ticks.length === 0) {
          return [];
        }
        span = Math.abs(ticks[ticks.length - 1] - ticks[0]) / 1000.0;
        if (ticker) {
          r = ticker.resolution;
        } else {
          r = span / (ticks.length - 1);
        }
        resol = this._get_resolution_str(r, span);
        _ref = this.formats[resol], widths = _ref[0], formats = _ref[1];
        format = formats[0];
        if (char_width) {
          good_formats = [];
          for (i = _i = 0, _ref1 = widths.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
            if (widths[i] * ticks.length < fill_ratio * char_width) {
              good_formats.push(this.formats[i]);
            }
          }
          if (good_formats.length > 0) {
            format = good_formats[ticks.length - 1];
          }
        }
        labels = [];
        resol_ndx = this.format_order.indexOf(resol);
        time_tuple_ndx_for_resol = {};
        _ref2 = this.format_order;
        for (_j = 0, _len = _ref2.length; _j < _len; _j++) {
          fmt = _ref2[_j];
          time_tuple_ndx_for_resol[fmt] = 0;
        }
        time_tuple_ndx_for_resol["seconds"] = 5;
        time_tuple_ndx_for_resol["minsec"] = 4;
        time_tuple_ndx_for_resol["minutes"] = 4;
        time_tuple_ndx_for_resol["hourmin"] = 3;
        time_tuple_ndx_for_resol["hours"] = 3;
        for (_k = 0, _len1 = ticks.length; _k < _len1; _k++) {
          t = ticks[_k];
          try {
            dt = Date(t);
            tm = _array(t);
            s = _strftime(t, format);
          } catch (_error) {
            error = _error;
            console.log(error);
            console.log("Unable to convert tick for timestamp " + t);
            labels.push("ERR");
            continue;
          }
          hybrid_handled = false;
          next_ndx = resol_ndx;
          while (tm[time_tuple_ndx_for_resol[this.format_order[next_ndx]]] === 0) {
            next_ndx += 1;
            if (next_ndx === this.format_order.length) {
              break;
            }
            if ((resol === "minsec" || resol === "hourmin") && !hybrid_handled) {
              if ((resol === "minsec" && tm[4] === 0 && tm[5] !== 0) || (resol === "hourmin" && tm[3] === 0 && tm[4] !== 0)) {
                next_format = this.formats[this.format_order[resol_ndx - 1]][1][0];
                s = _strftime(t, next_format);
                break;
              } else {
                hybrid_handled = true;
              }
            }
            next_format = this.formats[this.format_order[next_ndx]][1][0];
            s = _strftime(t, next_format);
          }
          if (this.strip_leading_zeros) {
            ss = s.replace(/^0+/g, "");
            if (ss !== s && (ss === '' || !isFinite(ss[0]))) {
              ss = '0' + ss;
            }
            labels.push(ss);
          } else {
            labels.push(s);
          }
        }
        return labels;
      };

      return DatetimeFormatter;

    })();
    return {
      "BasicScale": BasicScale,
      "DatetimeScale": DatetimeScale,
      "BasicTickFormatter": BasicTickFormatter,
      "DatetimeFormatter": DatetimeFormatter
    };
  });

}).call(this);

/*
//@ sourceMappingURL=ticking.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/guide/linear_axis',["underscore", "backbone", "common/safebind", "common/has_parent", "common/ticking", "common/plot_widget", "renderer/properties"], function(_, Backbone, safebind, HasParent, ticking, PlotWidget, Properties) {
    var LinearAxes, LinearAxis, LinearAxisView, glyph_properties, line_properties, signum, text_properties, _align_lookup, _angle_lookup, _baseline_lookup, _ref, _ref1, _ref2;
    glyph_properties = Properties.glyph_properties;
    line_properties = Properties.line_properties;
    text_properties = Properties.text_properties;
    signum = function(x) {
      var _ref;
      return (_ref = x != null ? x : x < 0) != null ? _ref : -{
        1: {
          1: 0
        }
      };
    };
    _angle_lookup = {
      top: {
        parallel: 0,
        normal: -Math.PI / 2,
        horizontal: 0,
        vertical: -Math.PI / 2
      },
      bottom: {
        parallel: 0,
        normal: Math.PI / 2,
        horizontal: 0,
        vertical: Math.PI / 2
      },
      left: {
        parallel: -Math.PI / 2,
        normal: 0,
        horizontal: 0,
        vertical: -Math.PI / 2
      },
      right: {
        parallel: Math.PI / 2,
        normal: 0,
        horizontal: 0,
        vertical: Math.PI / 2
      }
    };
    _baseline_lookup = {
      top: {
        parallel: 'alphabetic',
        normal: 'middle',
        horizontal: 'alphabetic',
        vertical: 'middle'
      },
      bottom: {
        parallel: 'hanging',
        normal: 'middle',
        horizontal: 'hanging',
        vertical: 'middle'
      },
      left: {
        parallel: 'alphabetic',
        normal: 'middle',
        horizontal: 'middle',
        vertical: 'alphabetic'
      },
      right: {
        parallel: 'alphabetic',
        normal: 'middle',
        horizontal: 'middle',
        vertical: 'alphabetic'
      }
    };
    _align_lookup = {
      top: {
        parallel: 'center',
        normal: 'left',
        horizontal: 'center',
        vertical: 'left'
      },
      bottom: {
        parallel: 'center',
        normal: 'left',
        horizontal: 'center',
        vertical: 'right'
      },
      left: {
        parallel: 'center',
        normal: 'right',
        horizontal: 'right',
        vertical: 'center'
      },
      right: {
        parallel: 'center',
        normal: 'left',
        horizontal: 'left',
        vertical: 'center'
      }
    };
    LinearAxisView = (function(_super) {
      __extends(LinearAxisView, _super);

      function LinearAxisView() {
        _ref = LinearAxisView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      LinearAxisView.prototype.initialize = function(attrs, options) {
        LinearAxisView.__super__.initialize.call(this, attrs, options);
        this.rule_props = new line_properties(this, null, 'axis_');
        this.major_tick_props = new line_properties(this, null, 'major_tick_');
        this.major_label_props = new text_properties(this, null, 'major_label_');
        this.axis_label_props = new text_properties(this, null, 'axis_label_');
        return this.formatter = new ticking.BasicTickFormatter();
      };

      LinearAxisView.prototype.render = function() {
        var ctx;
        ctx = this.plot_view.ctx;
        ctx.save();
        this._draw_rule(ctx);
        this._draw_major_ticks(ctx);
        this._draw_major_labels(ctx);
        this._draw_axis_label(ctx);
        return ctx.restore();
      };

      LinearAxisView.prototype.bind_bokeh_events = function() {
        return safebind(this, this.model, 'change', this.request_render);
      };

      LinearAxisView.prototype.padding_request = function() {
        return this._padding_request();
      };

      LinearAxisView.prototype._draw_rule = function(ctx) {
        var coords, i, sx, sy, x, y, _i, _ref1, _ref2, _ref3;
        if (!this.rule_props.do_stroke) {
          return;
        }
        _ref1 = coords = this.mget('rule_coords'), x = _ref1[0], y = _ref1[1];
        _ref2 = this.plot_view.map_to_screen(x, "data", y, "data"), sx = _ref2[0], sy = _ref2[1];
        this.rule_props.set(ctx, this);
        ctx.beginPath();
        ctx.moveTo(Math.round(sx[0]), Math.round(sy[0]));
        for (i = _i = 1, _ref3 = sx.length; 1 <= _ref3 ? _i < _ref3 : _i > _ref3; i = 1 <= _ref3 ? ++_i : --_i) {
          ctx.lineTo(Math.round(sx[i]), Math.round(sy[i]));
        }
        ctx.stroke();
      };

      LinearAxisView.prototype._draw_major_ticks = function(ctx) {
        var coords, i, nx, ny, sx, sy, tin, tout, x, y, _i, _ref1, _ref2, _ref3, _ref4;
        if (!this.major_tick_props.do_stroke) {
          return;
        }
        _ref1 = coords = this.mget('major_coords'), x = _ref1[0], y = _ref1[1];
        _ref2 = this.plot_view.map_to_screen(x, "data", y, "data"), sx = _ref2[0], sy = _ref2[1];
        _ref3 = this.mget('normals'), nx = _ref3[0], ny = _ref3[1];
        tin = this.mget('major_tick_in');
        tout = this.mget('major_tick_out');
        this.major_tick_props.set(ctx, this);
        for (i = _i = 0, _ref4 = sx.length; 0 <= _ref4 ? _i < _ref4 : _i > _ref4; i = 0 <= _ref4 ? ++_i : --_i) {
          ctx.beginPath();
          ctx.moveTo(Math.round(sx[i] + nx * tout), Math.round(sy[i] + ny * tout));
          ctx.lineTo(Math.round(sx[i] - nx * tin), Math.round(sy[i] - ny * tin));
          ctx.stroke();
        }
      };

      LinearAxisView.prototype._draw_major_labels = function(ctx) {
        var angle, coords, dim, i, labels, nx, ny, orient, side, standoff, sx, sy, x, y, _i, _ref1, _ref2, _ref3, _ref4;
        _ref1 = coords = this.mget('major_coords'), x = _ref1[0], y = _ref1[1];
        _ref2 = this.plot_view.map_to_screen(x, "data", y, "data"), sx = _ref2[0], sy = _ref2[1];
        _ref3 = this.mget('normals'), nx = _ref3[0], ny = _ref3[1];
        dim = this.mget('dimension');
        side = this.mget('side');
        orient = this.mget('major_label_orientation');
        if (_.isString(orient)) {
          angle = _angle_lookup[side][orient];
        } else {
          angle = -orient;
        }
        standoff = this._tick_extent() + this.mget('major_label_standoff');
        labels = this.formatter.format(coords[dim]);
        this.major_label_props.set(ctx, this);
        this._apply_location_heuristics(ctx, side, orient);
        for (i = _i = 0, _ref4 = sx.length; 0 <= _ref4 ? _i < _ref4 : _i > _ref4; i = 0 <= _ref4 ? ++_i : --_i) {
          if (angle) {
            ctx.translate(sx[i] + nx * standoff, sy[i] + ny * standoff);
            ctx.rotate(angle);
            ctx.fillText(labels[i], 0, 0);
            ctx.rotate(-angle);
            ctx.translate(-sx[i] - nx * standoff, -sy[i] - ny * standoff);
          } else {
            ctx.fillText(labels[i], Math.round(sx[i] + nx * standoff), Math.round(sy[i] + ny * standoff));
          }
        }
      };

      LinearAxisView.prototype._draw_axis_label = function(ctx) {
        var angle, label, nx, ny, orient, side, standoff, sx, sy, x, y, _ref1, _ref2, _ref3;
        label = this.mget('axis_label');
        if (label == null) {
          return;
        }
        _ref1 = this.mget('rule_coords'), x = _ref1[0], y = _ref1[1];
        _ref2 = this.plot_view.map_to_screen(x, "data", y, "data"), sx = _ref2[0], sy = _ref2[1];
        _ref3 = this.mget('normals'), nx = _ref3[0], ny = _ref3[1];
        side = this.mget('side');
        orient = 'parallel';
        angle = _angle_lookup[side][orient];
        standoff = this._tick_extent() + this._tick_label_extent() + this.mget('axis_label_standoff');
        sx = (sx[0] + sx[sx.length - 1]) / 2;
        sy = (sy[0] + sy[sy.length - 1]) / 2;
        this.axis_label_props.set(ctx, this);
        this._apply_location_heuristics(ctx, side, orient);
        if (angle) {
          ctx.translate(sx + nx * standoff, sy + ny * standoff);
          ctx.rotate(angle);
          ctx.fillText(label, 0, 0);
          ctx.rotate(-angle);
          ctx.translate(-sx - nx * standoff, -sy - ny * standoff);
        } else {
          ctx.fillText(label, sx + nx * standoff, sy + ny * standoff);
        }
      };

      LinearAxisView.prototype._apply_location_heuristics = function(ctx, side, orient) {
        var align, baseline;
        if (_.isString(orient)) {
          baseline = _baseline_lookup[side][orient];
          align = _align_lookup[side][orient];
        } else if (orient === 0) {
          baseline = _baseline_lookup[side][orient];
          align = _align_lookup[side][orient];
        } else if (orient < 0) {
          baseline = 'middle';
          if (side === 'top') {
            align = 'right';
          } else if (side === 'bottom') {
            align = 'left';
          } else if (side === 'left') {
            align = 'right';
          } else if (side === 'right') {
            align = 'left';
          }
        } else if (orient > 0) {
          baseline = 'middle';
          if (side === 'top') {
            align = 'left';
          } else if (side === 'bottom') {
            align = 'right';
          } else if (side === 'left') {
            align = 'right';
          } else if (side === 'right') {
            align = 'left';
          }
        }
        ctx.textBaseline = baseline;
        return ctx.textAlign = align;
      };

      LinearAxisView.prototype._tick_extent = function() {
        return this.mget('major_tick_out');
      };

      LinearAxisView.prototype._tick_label_extent = function() {
        var angle, c, coords, dim, extent, factor, h, i, labels, orient, s, side, val, w, _i, _j, _ref1, _ref2;
        extent = 0;
        dim = this.mget('dimension');
        coords = this.mget('major_coords');
        side = this.mget('side');
        orient = this.mget('major_label_orientation');
        labels = this.formatter.format(coords[dim]);
        this.major_label_props.set(this.plot_view.ctx, this);
        if (_.isString(orient)) {
          factor = 1;
          angle = _angle_lookup[side][orient];
        } else {
          factor = 2;
          angle = -orient;
        }
        angle = Math.abs(angle);
        c = Math.cos(angle);
        s = Math.sin(angle);
        if (side === "top" || side === "bottom") {
          for (i = _i = 0, _ref1 = labels.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
            if (labels[i] == null) {
              continue;
            }
            w = this.plot_view.ctx.measureText(labels[i]).width * 1.1;
            h = this.plot_view.ctx.measureText(labels[i]).ascent * 0.9;
            val = w * s + (h / factor) * c;
            if (val > extent) {
              extent = val;
            }
          }
        } else {
          for (i = _j = 0, _ref2 = labels.length; 0 <= _ref2 ? _j < _ref2 : _j > _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
            if (labels[i] == null) {
              continue;
            }
            w = this.plot_view.ctx.measureText(labels[i]).width * 1.1;
            h = this.plot_view.ctx.measureText(labels[i]).ascent * 0.9;
            val = w * c + (h / factor) * s;
            if (val > extent) {
              extent = val;
            }
          }
        }
        if (extent > 0) {
          extent += this.mget('major_label_standoff');
        }
        return extent;
      };

      LinearAxisView.prototype._axis_label_extent = function() {
        var angle, c, extent, h, orient, s, side, w;
        extent = 0;
        side = this.mget('side');
        orient = 'parallel';
        this.major_label_props.set(this.plot_view.ctx, this);
        angle = Math.abs(_angle_lookup[side][orient]);
        c = Math.cos(angle);
        s = Math.sin(angle);
        if (this.mget('axis_label')) {
          extent += this.mget('axis_label_standoff');
          this.axis_label_props.set(this.plot_view.ctx, this);
          w = this.plot_view.ctx.measureText(this.mget('axis_label')).width * 1.1;
          h = this.plot_view.ctx.measureText(this.mget('axis_label')).ascent * 0.9;
          if (side === "top" || side === "bottom") {
            extent += w * s + h * c;
          } else {
            extent += w * c + h * s;
          }
        }
        return extent;
      };

      LinearAxisView.prototype._padding_request = function() {
        var loc, padding, req, side, _ref1;
        req = {};
        side = this.mget('side');
        loc = (_ref1 = this.mget('location')) != null ? _ref1 : 'min';
        if (!_.isString(loc)) {
          return req;
        }
        padding = 0;
        padding += this._tick_extent();
        padding += this._tick_label_extent();
        padding += this._axis_label_extent();
        req[side] = padding;
        return req;
      };

      return LinearAxisView;

    })(PlotWidget);
    LinearAxis = (function(_super) {
      __extends(LinearAxis, _super);

      function LinearAxis() {
        _ref1 = LinearAxis.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      LinearAxis.prototype.default_view = LinearAxisView;

      LinearAxis.prototype.type = 'LinearAxis';

      LinearAxis.prototype.initialize = function(attrs, options) {
        LinearAxis.__super__.initialize.call(this, attrs, options);
        this.register_property('computed_bounds', this._bounds, false);
        this.add_dependencies('computed_bounds', this, ['bounds']);
        this.register_property('rule_coords', this._rule_coords, false);
        this.add_dependencies('rule_coords', this, ['computed_bounds', 'dimension', 'location']);
        this.register_property('major_coords', this._major_coords, false);
        this.add_dependencies('major_coords', this, ['computed_bounds', 'dimension', 'location']);
        this.register_property('normals', this._normals, false);
        this.add_dependencies('normals', this, ['computed_bounds', 'dimension', 'location']);
        this.register_property('side', this._side, false);
        this.add_dependencies('side', this, ['normals']);
        this.register_property('padding_request', this._padding_request, false);
        return this.scale = new ticking.BasicScale();
      };

      LinearAxis.prototype.dinitialize = function(attrs, options) {
        return this.add_dependencies('computed_bounds', this.get_obj('plot'), ['x_range', 'y_range']);
      };

      LinearAxis.prototype._bounds = function() {
        var end, i, j, range_bounds, ranges, start, user_bounds, _ref2;
        i = this.get('dimension');
        j = (i + 1) % 2;
        ranges = [this.get_obj('plot').get_obj('x_range'), this.get_obj('plot').get_obj('y_range')];
        user_bounds = (_ref2 = this.get('bounds')) != null ? _ref2 : 'auto';
        range_bounds = [ranges[i].get('min'), ranges[i].get('max')];
        if (_.isArray(user_bounds)) {
          if (Math.abs(user_bounds[0] - user_bounds[1]) > Math.abs(range_bounds[0] - range_bounds[1])) {
            start = Math.max(Math.min(user_bounds[0], user_bounds[1]), range_bounds[0]);
            end = Math.min(Math.max(user_bounds[0], user_bounds[1]), range_bounds[1]);
          } else {
            start = Math.min(user_bounds[0], user_bounds[1]);
            end = Math.max(user_bounds[0], user_bounds[1]);
          }
        } else {
          start = range_bounds[0], end = range_bounds[1];
        }
        return [start, end];
      };

      LinearAxis.prototype._rule_coords = function() {
        var coords, cross_range, end, i, j, loc, range, range_max, range_min, ranges, start, xs, ys, _ref2, _ref3, _ref4;
        i = this.get('dimension');
        j = (i + 1) % 2;
        ranges = [this.get_obj('plot').get_obj('x_range'), this.get_obj('plot').get_obj('y_range')];
        range = ranges[i];
        cross_range = ranges[j];
        _ref2 = this.get('computed_bounds'), start = _ref2[0], end = _ref2[1];
        xs = new Float64Array(2);
        ys = new Float64Array(2);
        coords = [xs, ys];
        loc = (_ref3 = this.get('location')) != null ? _ref3 : 'min';
        if (_.isString(loc)) {
          if (loc === 'left' || loc === 'bottom') {
            loc = 'start';
          } else if (loc === 'right' || loc === 'top') {
            loc = 'end';
          }
          loc = cross_range.get(loc);
        }
        _ref4 = [range.get('min'), range.get('max')], range_min = _ref4[0], range_max = _ref4[1];
        coords[i][0] = Math.max(start, range_min);
        coords[i][1] = Math.min(end, range_max);
        coords[j][0] = loc;
        coords[j][1] = loc;
        if (coords[i][0] > coords[i][1]) {
          coords[i][0] = coords[i][1] = NaN;
        }
        return coords;
      };

      LinearAxis.prototype._major_coords = function() {
        var coords, cross_range, end, i, ii, j, loc, range, range_max, range_min, ranges, start, ticks, xs, ys, _i, _ref2, _ref3, _ref4, _ref5;
        i = this.get('dimension');
        j = (i + 1) % 2;
        ranges = [this.get_obj('plot').get_obj('x_range'), this.get_obj('plot').get_obj('y_range')];
        range = ranges[i];
        cross_range = ranges[j];
        _ref2 = this.get('computed_bounds'), start = _ref2[0], end = _ref2[1];
        ticks = this.scale.get_ticks(start, end);
        loc = (_ref3 = this.get('location')) != null ? _ref3 : 'min';
        if (_.isString(loc)) {
          if (loc === 'left' || loc === 'bottom') {
            loc = 'start';
          } else if (loc === 'right' || loc === 'top') {
            loc = 'end';
          }
          loc = cross_range.get(loc);
        }
        xs = [];
        ys = [];
        coords = [xs, ys];
        _ref4 = [range.get('min'), range.get('max')], range_min = _ref4[0], range_max = _ref4[1];
        for (ii = _i = 0, _ref5 = ticks.length; 0 <= _ref5 ? _i < _ref5 : _i > _ref5; ii = 0 <= _ref5 ? ++_i : --_i) {
          if (ticks[ii] < range_min || ticks[ii] > range_max) {
            continue;
          }
          coords[i].push(ticks[ii]);
          coords[j].push(loc);
        }
        return coords;
      };

      LinearAxis.prototype._normals = function() {
        var cend, cross_range, cstart, end, i, j, loc, normals, range, ranges, start, _ref2, _ref3;
        i = this.get('dimension');
        j = (i + 1) % 2;
        ranges = [this.get_obj('plot').get_obj('x_range'), this.get_obj('plot').get_obj('y_range')];
        range = ranges[i];
        cross_range = ranges[j];
        _ref2 = this.get('computed_bounds'), start = _ref2[0], end = _ref2[1];
        loc = (_ref3 = this.get('location')) != null ? _ref3 : 'min';
        cstart = cross_range.get('start');
        cend = cross_range.get('end');
        normals = [0, 0];
        if (_.isString(loc)) {
          normals[j] = (end - start) < 0 ? -1 : 1;
          if (i === 0) {
            if ((loc === 'max' && (cstart < cend)) || (loc === 'min' && (cstart > cend)) || loc === 'right' || loc === 'top') {
              normals[j] *= -1;
            }
          } else if (i === 1) {
            if ((loc === 'min' && (cstart < cend)) || (loc === 'max' && (cstart > cend)) || loc === 'left' || loc === 'bottom') {
              normals[j] *= -1;
            }
          }
        } else {
          if (i === 0) {
            if (Math.abs(loc - cstart) <= Math.abs(loc - cend)) {
              normals[j] = 1;
            } else {
              normals[j] = -1;
            }
          } else {
            if (Math.abs(loc - cstart) <= Math.abs(loc - cend)) {
              normals[j] = -1;
            } else {
              normals[j] = 1;
            }
          }
        }
        return normals;
      };

      LinearAxis.prototype._side = function() {
        var n, side;
        n = this.get('normals');
        if (n[1] === -1) {
          side = 'top';
        } else if (n[1] === 1) {
          side = 'bottom';
        } else if (n[0] === -1) {
          side = 'left';
        } else if (n[0] === 1) {
          side = 'right';
        }
        return side;
      };

      LinearAxis.prototype.display_defaults = function() {
        return {
          level: 'overlay',
          axis_line_color: 'black',
          axis_line_width: 1,
          axis_line_alpha: 1.0,
          axis_line_join: 'miter',
          axis_line_cap: 'butt',
          axis_line_dash: [],
          axis_line_dash_offset: 0,
          major_tick_in: 2,
          major_tick_out: 6,
          major_tick_line_color: 'black',
          major_tick_line_width: 1,
          major_tick_line_alpha: 1.0,
          major_tick_line_join: 'miter',
          major_tick_line_cap: 'butt',
          major_tick_line_dash: [],
          major_tick_line_dash_offset: 0,
          major_label_standoff: 5,
          major_label_orientation: "horizontal",
          major_label_text_font: "helvetica",
          major_label_text_font_size: "10pt",
          major_label_text_font_style: "normal",
          major_label_text_color: "#444444",
          major_label_text_alpha: 1.0,
          major_label_text_align: "center",
          major_label_text_baseline: "alphabetic",
          axis_label: "",
          axis_label_standoff: 5,
          axis_label_text_font: "helvetica",
          axis_label_text_font_size: "16pt",
          axis_label_text_font_style: "normal",
          axis_label_text_color: "#444444",
          axis_label_text_alpha: 1.0,
          axis_label_text_align: "center",
          axis_label_text_baseline: "alphabetic"
        };
      };

      return LinearAxis;

    })(HasParent);
    LinearAxes = (function(_super) {
      __extends(LinearAxes, _super);

      function LinearAxes() {
        _ref2 = LinearAxes.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      LinearAxes.prototype.model = LinearAxis;

      return LinearAxes;

    })(Backbone.Collection);
    return {
      "Model": LinearAxis,
      "Collection": new LinearAxes(),
      "View": LinearAxisView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=linear_axis.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/guide/datetime_axis',["backbone", "./linear_axis", "common/ticking"], function(Backbone, LinearAxis, ticking) {
    var DatetimeAxes, DatetimeAxis, DatetimeAxisView, _ref, _ref1, _ref2;
    DatetimeAxisView = (function(_super) {
      __extends(DatetimeAxisView, _super);

      function DatetimeAxisView() {
        _ref = DatetimeAxisView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      DatetimeAxisView.prototype.initialize = function(attrs, options) {
        DatetimeAxisView.__super__.initialize.call(this, attrs, options);
        return this.formatter = new ticking.DatetimeFormatter();
      };

      return DatetimeAxisView;

    })(LinearAxis.View);
    DatetimeAxis = (function(_super) {
      __extends(DatetimeAxis, _super);

      function DatetimeAxis() {
        _ref1 = DatetimeAxis.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      DatetimeAxis.prototype.default_view = DatetimeAxisView;

      DatetimeAxis.prototype.type = 'DatetimeAxis';

      DatetimeAxis.prototype.initialize = function(attrs, options) {
        DatetimeAxis.__super__.initialize.call(this, attrs, options);
        return this.scale = new ticking.DatetimeScale();
      };

      return DatetimeAxis;

    })(LinearAxis.Model);
    DatetimeAxes = (function(_super) {
      __extends(DatetimeAxes, _super);

      function DatetimeAxes() {
        _ref2 = DatetimeAxes.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      DatetimeAxes.prototype.model = DatetimeAxis;

      DatetimeAxes.prototype.type = 'DatetimeAxis';

      return DatetimeAxes;

    })(Backbone.Collection);
    return {
      "Model": DatetimeAxis,
      "Collection": new DatetimeAxes(),
      "View": DatetimeAxisView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=datetime_axis.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/guide/grid',["underscore", "common/safebind", "common/has_parent", "common/ticking", "renderer/properties", "common/plot_widget"], function(_, safebind, HasParent, ticking, Properties, PlotWidget) {
    var Grid, GridView, Grids, line_properties, _ref, _ref1, _ref2;
    line_properties = Properties.line_properties;
    GridView = (function(_super) {
      __extends(GridView, _super);

      function GridView() {
        _ref = GridView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      GridView.prototype.initialize = function(attrs, options) {
        GridView.__super__.initialize.call(this, attrs, options);
        return this.grid_props = new line_properties(this, null, 'grid_');
      };

      GridView.prototype.render = function() {
        var ctx;
        ctx = this.plot_view.ctx;
        ctx.save();
        this._draw_grids(ctx);
        return ctx.restore();
      };

      GridView.prototype.bind_bokeh_events = function() {
        return safebind(this, this.model, 'change', this.request_render);
      };

      GridView.prototype._draw_grids = function(ctx) {
        var i, sx, sy, xs, ys, _i, _j, _ref1, _ref2, _ref3, _ref4;
        if (!this.grid_props.do_stroke) {
          return;
        }
        _ref1 = this.mget('grid_coords'), xs = _ref1[0], ys = _ref1[1];
        this.grid_props.set(ctx, this);
        for (i = _i = 0, _ref2 = xs.length; 0 <= _ref2 ? _i < _ref2 : _i > _ref2; i = 0 <= _ref2 ? ++_i : --_i) {
          _ref3 = this.plot_view.map_to_screen(xs[i], "data", ys[i], "data"), sx = _ref3[0], sy = _ref3[1];
          ctx.beginPath();
          ctx.moveTo(Math.round(sx[0]), Math.round(sy[0]));
          for (i = _j = 1, _ref4 = sx.length; 1 <= _ref4 ? _j < _ref4 : _j > _ref4; i = 1 <= _ref4 ? ++_j : --_j) {
            ctx.lineTo(Math.round(sx[i]), Math.round(sy[i]));
          }
          ctx.stroke();
        }
      };

      return GridView;

    })(PlotWidget);
    Grid = (function(_super) {
      __extends(Grid, _super);

      function Grid() {
        _ref1 = Grid.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Grid.prototype.default_view = GridView;

      Grid.prototype.type = 'Grid';

      Grid.prototype.initialize = function(attrs, options) {
        Grid.__super__.initialize.call(this, attrs, options);
        this.register_property('computed_bounds', this._bounds, false);
        this.add_dependencies('computed_bounds', this, ['bounds']);
        this.register_property('scale', this._scale, true);
        this.add_dependencies('scale', this, ['is_datetime']);
        this.register_property('grid_coords', this._grid_coords, false);
        return this.add_dependencies('grid_coords', this, ['computed_bounds', 'dimension', 'scale']);
      };

      Grid.prototype._scale = function() {
        if (this.get('is_datetime')) {
          return new ticking.DatetimeScale();
        } else {
          return new ticking.BasicScale();
        }
      };

      Grid.prototype._bounds = function() {
        var end, i, j, range_bounds, ranges, start, user_bounds, _ref2;
        i = this.get('dimension');
        j = (i + 1) % 2;
        ranges = [this.get_obj('plot').get_obj('x_range'), this.get_obj('plot').get_obj('y_range')];
        user_bounds = (_ref2 = this.get('bounds')) != null ? _ref2 : 'auto';
        range_bounds = [ranges[i].get('min'), ranges[i].get('max')];
        if (_.isArray(user_bounds)) {
          start = Math.min(user_bounds[0], user_bounds[1]);
          end = Math.max(user_bounds[0], user_bounds[1]);
          if (start < range_bounds[0]) {
            start = range_bounds[0];
          } else if (start > range_bounds[1]) {
            start = null;
          }
          if (end > range_bounds[1]) {
            end = range_bounds[1];
          } else if (end < range_bounds[0]) {
            end = null;
          }
        } else {
          start = range_bounds[0], end = range_bounds[1];
        }
        return [start, end];
      };

      Grid.prototype._grid_coords = function() {
        var N, cmax, cmin, coords, cross_range, dim_i, dim_j, end, i, ii, j, loc, max, min, n, range, ranges, start, ticks, tmp, _i, _j, _ref2, _ref3;
        i = this.get('dimension');
        j = (i + 1) % 2;
        ranges = [this.get_obj('plot').get_obj('x_range'), this.get_obj('plot').get_obj('y_range')];
        range = ranges[i];
        cross_range = ranges[j];
        _ref2 = this.get('computed_bounds'), start = _ref2[0], end = _ref2[1];
        tmp = Math.min(start, end);
        end = Math.max(start, end);
        start = tmp;
        ticks = this.get('scale').get_ticks(start, end);
        min = range.get('min');
        max = range.get('max');
        cmin = cross_range.get('min');
        cmax = cross_range.get('max');
        coords = [[], []];
        for (ii = _i = 0, _ref3 = ticks.length; 0 <= _ref3 ? _i < _ref3 : _i > _ref3; ii = 0 <= _ref3 ? ++_i : --_i) {
          if (ticks[ii] === min || ticks[ii] === max) {
            continue;
          }
          dim_i = [];
          dim_j = [];
          N = 2;
          for (n = _j = 0; 0 <= N ? _j < N : _j > N; n = 0 <= N ? ++_j : --_j) {
            loc = cmin + (cmax - cmin) / (N - 1) * n;
            dim_i.push(ticks[ii]);
            dim_j.push(loc);
          }
          coords[i].push(dim_i);
          coords[j].push(dim_j);
        }
        return coords;
      };

      Grid.prototype.display_defaults = function() {
        return {
          level: 'underlay',
          grid_line_color: '#cccccc',
          grid_line_width: 1,
          grid_line_alpha: 1.0,
          grid_line_join: 'miter',
          grid_line_cap: 'butt',
          grid_line_dash: [],
          grid_line_dash_offset: 0
        };
      };

      return Grid;

    })(HasParent);
    Grids = (function(_super) {
      __extends(Grids, _super);

      function Grids() {
        _ref2 = Grids.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Grids.prototype.model = Grid;

      return Grids;

    })(Backbone.Collection);
    return {
      "Model": Grid,
      "Collection": new Grids(),
      "View": GridView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=grid.js.map
*/;
(function() {
  define('common/textutils',[], function() {
    var cache, getTextHeight;
    cache = {};
    getTextHeight = function(font) {
      var block, body, div, result, text;
      if (cache[font] != null) {
        return cache[font];
      }
      text = $('<span>Hg</span>').css({
        font: font
      });
      block = $('<div style="display: inline-block; width: 1px; height: 0px;"></div>');
      div = $('<div></div>');
      div.append(text, block);
      body = $('body');
      body.append(div);
      try {
        result = {};
        block.css({
          verticalAlign: 'baseline'
        });
        result.ascent = block.offset().top - text.offset().top;
        block.css({
          verticalAlign: 'bottom'
        });
        result.height = block.offset().top - text.offset().top;
        result.descent = result.height - result.ascent;
      } finally {
        div.remove();
      }
      cache[font] = result;
      return result;
    };
    return {
      "getTextHeight": getTextHeight
    };
  });

}).call(this);

/*
//@ sourceMappingURL=textutils.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/annotation/legend',["underscore", "common/has_parent", "common/plot_widget", "common/textutils", "renderer/properties"], function(_, HasParent, PlotWidget, textutils, Properties) {
    var Legend, LegendView, Legends, glyph_properties, line_properties, text_properties, _ref, _ref1, _ref2;
    glyph_properties = Properties.glyph_properties;
    line_properties = Properties.line_properties;
    text_properties = Properties.text_properties;
    LegendView = (function(_super) {
      __extends(LegendView, _super);

      function LegendView() {
        _ref = LegendView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      LegendView.prototype.initialize = function(options) {
        LegendView.__super__.initialize.call(this, options);
        this.label_props = new text_properties(this, this.model, 'label_');
        this.border_props = new line_properties(this, this.model, 'border_');
        if (this.mget('legend_names')) {
          this.legend_names = this.mget('legend_names');
        } else {
          this.legends = this.mget('legends');
          this.legend_names = _.keys(this.mget('legends'));
        }
        return this.calc_dims();
      };

      LegendView.prototype.delegateEvents = function(events) {
        LegendView.__super__.delegateEvents.call(this, events);
        return this.listenTo(this.plot_view.view_state, 'change', this.calc_dims);
      };

      LegendView.prototype.calc_dims = function(options) {
        var ctx, h_range, label_height, label_width, legend_padding, legend_spacing, orientation, text_width, text_widths, v_range, x, y, _ref1;
        label_height = this.mget('label_height');
        this.glyph_height = this.mget('glyph_height');
        label_width = this.mget('label_width');
        this.glyph_width = this.mget('glyph_width');
        legend_spacing = this.mget('legend_spacing');
        this.label_height = _.max([textutils.getTextHeight(this.label_props.font(this)), label_height, this.glyph_height]);
        this.legend_height = this.label_height;
        this.legend_height = this.legend_names.length * this.legend_height + (1 + this.legend_names.length) * legend_spacing;
        ctx = this.plot_view.ctx;
        ctx.save();
        this.label_props.set(ctx, this);
        text_widths = _.map(this.legend_names, function(txt) {
          return ctx.measureText(txt).width;
        });
        ctx.restore();
        text_width = _.max(text_widths);
        this.label_width = _.max([text_width, label_width]);
        this.legend_width = this.label_width + this.glyph_width + 3 * legend_spacing;
        orientation = this.mget('orientation');
        legend_padding = this.mget('legend_padding');
        h_range = this.plot_view.view_state.get('inner_range_horizontal');
        v_range = this.plot_view.view_state.get('inner_range_vertical');
        if (orientation === "top_right") {
          x = h_range.get('end') - legend_padding - this.legend_width;
          y = v_range.get('end') - legend_padding;
        } else if (orientation === "top_left") {
          x = h_range.get('start') + legend_padding;
          y = v_range.get('end') - legend_padding;
        } else if (orientation === "bottom_left") {
          x = h_range.get('start') + legend_padding;
          y = v_range.get('start') + legend_padding + this.legend_height;
        } else if (orientation === "bottom_right") {
          x = h_range.get('end') - legend_padding - this.legend_width;
          y = v_range.get('start') + legend_padding + this.legend_height;
        } else if (orientation === "absolute") {
          _ref1 = this.absolute_coords, x = _ref1[0], y = _ref1[1];
        }
        x = this.plot_view.view_state.vx_to_sx(x);
        y = this.plot_view.view_state.vy_to_sy(y);
        return this.box_coords = [x, y];
      };

      LegendView.prototype.render = function() {
        var ctx, idx, legend_name, legend_spacing, renderer, view, x, x1, x2, y, y1, y2, yoffset, yspacing, _i, _j, _len, _len1, _ref1, _ref2;
        ctx = this.plot_view.ctx;
        ctx.save();
        ctx.fillStyle = this.plot_model.get('background_fill');
        this.border_props.set(ctx, this);
        ctx.beginPath();
        ctx.rect(this.box_coords[0], this.box_coords[1], this.legend_width, this.legend_height);
        ctx.fill();
        ctx.stroke();
        legend_spacing = this.mget('legend_spacing');
        _ref1 = this.legend_names;
        for (idx = _i = 0, _len = _ref1.length; _i < _len; idx = ++_i) {
          legend_name = _ref1[idx];
          yoffset = idx * this.label_height;
          yspacing = (1 + idx) * legend_spacing;
          y = this.box_coords[1] + this.label_height / 2.0 + yoffset + yspacing;
          x = this.box_coords[0] + legend_spacing;
          x1 = this.box_coords[0] + 2 * legend_spacing + this.label_width;
          x2 = x1 + this.glyph_width;
          y1 = this.box_coords[1] + yoffset + yspacing;
          y2 = y1 + this.glyph_height;
          this.label_props.set(ctx, this);
          ctx.fillText(legend_name, x, y);
          _ref2 = this.model.resolve_ref(this.legends[legend_name]);
          for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
            renderer = _ref2[_j];
            view = this.plot_view.renderers[renderer.id];
            view.draw_legend(ctx, x1, x2, y1, y2);
          }
        }
        return ctx.restore();
      };

      return LegendView;

    })(PlotWidget);
    Legend = (function(_super) {
      __extends(Legend, _super);

      function Legend() {
        _ref1 = Legend.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Legend.prototype.default_view = LegendView;

      Legend.prototype.type = 'Legend';

      Legend.prototype.display_defaults = function() {
        return {
          level: 'overlay',
          border_line_color: 'black',
          border_line_width: 1,
          border_line_alpha: 1.0,
          border_line_join: 'miter',
          border_line_cap: 'butt',
          border_line_dash: [],
          border_line_dash_offset: 0,
          label_standoff: 15,
          label_text_font: "helvetica",
          label_text_font_size: "10pt",
          label_text_font_style: "normal",
          label_text_color: "#444444",
          label_text_alpha: 1.0,
          label_text_align: "left",
          label_text_baseline: "middle",
          glyph_height: 20,
          glyph_width: 20,
          label_height: 20,
          label_width: 50,
          legend_padding: 10,
          legend_spacing: 3,
          orientation: "top_right",
          datapoint: null
        };
      };

      return Legend;

    })(HasParent);
    Legends = (function(_super) {
      __extends(Legends, _super);

      function Legends() {
        _ref2 = Legends.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Legends.prototype.model = Legend;

      return Legends;

    })(Backbone.Collection);
    return {
      "Model": Legend,
      "Collection": new Legends(),
      "View": LegendView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=legend.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('renderer/overlay/box_selection',["underscore", "common/has_parent", "common/plot_widget"], function(_, HasParent, PlotWidget) {
    var BoxSelection, BoxSelectionView, BoxSelections, _ref, _ref1, _ref2;
    BoxSelectionView = (function(_super) {
      __extends(BoxSelectionView, _super);

      function BoxSelectionView() {
        _ref = BoxSelectionView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      BoxSelectionView.prototype.initialize = function(options) {
        this.selecting = false;
        this.xrange = [null, null];
        this.yrange = [null, null];
        BoxSelectionView.__super__.initialize.call(this, options);
        return this.plot_view.$el.find('.bokeh_canvas_wrapper').append(this.$el);
      };

      BoxSelectionView.prototype.boxselect = function(xrange, yrange) {
        this.xrange = xrange;
        this.yrange = yrange;
        return this.request_render();
      };

      BoxSelectionView.prototype.startselect = function() {
        this.selecting = true;
        this.xrange = [null, null];
        this.yrange = [null, null];
        return this.request_render();
      };

      BoxSelectionView.prototype.stopselect = function() {
        this.selecting = false;
        this.xrange = [null, null];
        this.yrange = [null, null];
        return this.request_render();
      };

      BoxSelectionView.prototype.bind_bokeh_events = function(options) {
        this.toolview = this.plot_view.tools[this.mget('tool').id];
        this.listenTo(this.toolview, 'boxselect', this.boxselect);
        this.listenTo(this.toolview, 'startselect', this.startselect);
        return this.listenTo(this.toolview, 'stopselect', this.stopselect);
      };

      BoxSelectionView.prototype.render = function() {
        var height, style_string, width, xpos, xrange, ypos, yrange;
        if (!this.selecting) {
          this.$el.removeClass('shading');
          return;
        }
        xrange = this.xrange;
        yrange = this.yrange;
        if (_.any(_.map(xrange, _.isNullOrUndefined)) || _.any(_.map(yrange, _.isNullOrUndefined))) {
          this.$el.removeClass('shading');
          return;
        }
        style_string = "";
        if (xrange) {
          xpos = this.plot_view.view_state.vx_to_sx(Math.min(xrange[0], xrange[1]));
          width = Math.abs(xrange[1] - xrange[0]);
        } else {
          xpos = 0;
          width = this.plot_view.view_state.get('width');
        }
        style_string += "; left:" + xpos + "px; width:" + width + "px; ";
        if (yrange) {
          ypos = this.plot_view.view_state.vy_to_sy(Math.max(yrange[0], yrange[1]));
          height = Math.abs(yrange[1] - yrange[0]);
        } else {
          ypos = 0;
          height = this.plot_view.view_state.get('height');
        }
        this.$el.addClass('shading');
        style_string += "top:" + ypos + "px; height:" + height + "px";
        return this.$el.attr('style', style_string);
      };

      return BoxSelectionView;

    })(PlotWidget);
    BoxSelection = (function(_super) {
      __extends(BoxSelection, _super);

      function BoxSelection() {
        _ref1 = BoxSelection.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      BoxSelection.prototype.default_view = BoxSelectionView;

      BoxSelection.prototype.type = "BoxSelection";

      BoxSelection.prototype.defaults = function() {
        return {
          tool: null,
          level: 'overlay'
        };
      };

      return BoxSelection;

    })(HasParent);
    BoxSelections = (function(_super) {
      __extends(BoxSelections, _super);

      function BoxSelections() {
        _ref2 = BoxSelections.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      BoxSelections.prototype.model = BoxSelection;

      return BoxSelections;

    })(Backbone.Collection);
    return {
      "Model": BoxSelection,
      "Collection": new BoxSelections(),
      "View": BoxSelectionView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=box_selection.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('source/object_array_data_source',["underscore", "backbone", "common/has_properties", "range/range1d", "range/factor_range"], function(_, Backbone, HasProperties, Range1d, FactorRange) {
    var ObjectArrayDataSource, ObjectArrayDataSources, _ref, _ref1;
    ObjectArrayDataSource = (function(_super) {
      __extends(ObjectArrayDataSource, _super);

      function ObjectArrayDataSource() {
        _ref = ObjectArrayDataSource.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      ObjectArrayDataSource.prototype.type = 'ObjectArrayDataSource';

      ObjectArrayDataSource.prototype.initialize = function(attrs, options) {
        ObjectArrayDataSource.__super__.initialize.call(this, attrs, options);
        this.cont_ranges = {};
        return this.discrete_ranges = {};
      };

      ObjectArrayDataSource.prototype.getcolumn = function(colname) {
        var x;
        return (function() {
          var _i, _len, _ref1, _results;
          _ref1 = this.get('data');
          _results = [];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            x = _ref1[_i];
            _results.push(x[colname]);
          }
          return _results;
        }).call(this);
      };

      ObjectArrayDataSource.prototype.compute_cont_range = function(field) {
        var data;
        data = this.getcolumn(field);
        return [_.max(data), _.min(data)];
      };

      ObjectArrayDataSource.prototype.compute_discrete_factor = function(field) {
        var temp, uniques, val, _i, _len, _ref1;
        temp = {};
        _ref1 = this.getcolumn(field);
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          val = _ref1[_i];
          temp[val] = true;
        }
        uniques = _.keys(temp);
        return uniques = _.sortBy(uniques, (function(x) {
          return x;
        }));
      };

      ObjectArrayDataSource.prototype.get_cont_range = function(field, padding) {
        var center, max, min, span, _ref1, _ref2,
          _this = this;
        if (_.isUndefined(padding)) {
          padding = 1.0;
        }
        if (!_.exists(this.cont_ranges, field)) {
          _ref1 = this.compute_cont_range(field), min = _ref1[0], max = _ref1[1];
          span = (max - min) * (1 + padding);
          center = (max + min) / 2.0;
          _ref2 = [center - span / 2.0, center + span / 2.0], min = _ref2[0], max = _ref2[1];
          this.cont_ranges[field] = Range1d.Collection.create({
            start: min,
            end: max
          });
          this.on('change:data', function() {
            var _ref3;
            _ref3 = _this.compute_cont_range(field), max = _ref3[0], min = _ref3[1];
            _this.cont_ranges[field].set('start', min);
            return _this.cont_ranges[field].set('end', max);
          });
        }
        return this.cont_ranges[field];
      };

      ObjectArrayDataSource.prototype.get_discrete_range = function(field) {
        var factors,
          _this = this;
        if (!_.exists(this.discrete_ranges, field)) {
          factors = this.compute_discrete_factor(field);
          this.discrete_ranges[field] = FactorRange.Collection.create({
            values: factors
          });
          this.on('change:data', function() {
            factors = _this.compute_discrete_factor(field);
            return _this.discrete_ranges[field] = FactorRange.Collection.set('values', factors);
          });
        }
        return this.discrete_ranges[field];
      };

      ObjectArrayDataSource.prototype.select = function(fields, func) {
        var args, idx, selected, val, x, _i, _len, _ref1;
        selected = [];
        _ref1 = this.get('data');
        for (idx = _i = 0, _len = _ref1.length; _i < _len; idx = ++_i) {
          val = _ref1[idx];
          args = (function() {
            var _j, _len1, _results;
            _results = [];
            for (_j = 0, _len1 = fields.length; _j < _len1; _j++) {
              x = fields[_j];
              _results.push(val[x]);
            }
            return _results;
          })();
          if (func.apply(func, args)) {
            selected.push(idx);
          }
        }
        selected.sort();
        return selected;
      };

      ObjectArrayDataSource.prototype.defaults = function() {
        return {
          data: [{}],
          name: 'data',
          selected: [],
          selecting: false
        };
      };

      return ObjectArrayDataSource;

    })(HasProperties);
    ObjectArrayDataSources = (function(_super) {
      __extends(ObjectArrayDataSources, _super);

      function ObjectArrayDataSources() {
        _ref1 = ObjectArrayDataSources.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      ObjectArrayDataSources.prototype.model = ObjectArrayDataSource;

      return ObjectArrayDataSources;

    })(Backbone.Collection);
    return {
      "Model": ObjectArrayDataSource,
      "Collection": new ObjectArrayDataSources()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=object_array_data_source.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('source/column_data_source',["underscore", "backbone", "./object_array_data_source"], function(_, Backbone, ObjectArrayDataSource) {
    var ColumnDataSource, ColumnDataSources, _ref, _ref1;
    ColumnDataSource = (function(_super) {
      __extends(ColumnDataSource, _super);

      function ColumnDataSource() {
        _ref = ColumnDataSource.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      ColumnDataSource.prototype.type = 'ColumnDataSource';

      ColumnDataSource.prototype.initialize = function(attrs, options) {
        ColumnDataSource.__super__.initialize.call(this, attrs, options);
        this.cont_ranges = {};
        return this.discrete_ranges = {};
      };

      ColumnDataSource.prototype.getcolumn = function(colname) {
        return this.get('data')[colname];
      };

      ColumnDataSource.prototype.getcolumn_with_default = function(colname, default_value) {
        " returns the column, with any undefineds replaced with default";
        return this.get('data')[colname];
      };

      ColumnDataSource.prototype.get_length = function() {
        var data;
        data = this.get('data');
        return data[_.keys(data)[0]].length;
      };

      ColumnDataSource.prototype.datapoints = function() {
        var data, field, fields, i, point, points, _i, _j, _len, _ref1;
        data = this.get('data');
        fields = _.keys(data);
        points = [];
        for (i = _i = 0, _ref1 = data[fields[0]].length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          point = {};
          for (_j = 0, _len = fields.length; _j < _len; _j++) {
            field = fields[_j];
            point[field] = data[field][i];
          }
          points.push(point);
        }
        return points;
      };

      ColumnDataSource.prototype.defaults = function() {
        return ColumnDataSource.__super__.defaults.call(this);
      };

      return ColumnDataSource;

    })(ObjectArrayDataSource.Model);
    ColumnDataSources = (function(_super) {
      __extends(ColumnDataSources, _super);

      function ColumnDataSources() {
        _ref1 = ColumnDataSources.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      ColumnDataSources.prototype.model = ColumnDataSource;

      return ColumnDataSources;

    })(Backbone.Collection);
    return {
      "Model": ColumnDataSource,
      "Collection": new ColumnDataSources()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=column_data_source.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('tool/tool',["underscore", "common/plot_widget", "common/has_parent"], function(_, PlotWidget, HasParent) {
    var Tool, ToolView, _ref, _ref1;
    ToolView = (function(_super) {
      __extends(ToolView, _super);

      function ToolView() {
        _ref = ToolView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      ToolView.prototype.initialize = function(options) {
        return ToolView.__super__.initialize.call(this, options);
      };

      ToolView.prototype.bind_bokeh_events = function() {
        var eventSink, evgen, evgen_options, evgen_options2,
          _this = this;
        eventSink = this.plot_view.eventSink;
        evgen_options = {
          eventBasename: this.cid
        };
        evgen_options2 = _.extend(evgen_options, this.evgen_options);
        evgen = new this.eventGeneratorClass(evgen_options2);
        evgen.bind_bokeh_events(this.plot_view, eventSink);
        _.each(this.tool_events, function(handler_f, event_name) {
          var full_event_name, wrap;
          full_event_name = "" + _this.cid + ":" + event_name;
          wrap = function(e) {
            return _this[handler_f](e);
          };
          return eventSink.on(full_event_name, wrap);
        });
        this.evgen = evgen;
        return {
          render: function() {}
        };
      };

      return ToolView;

    })(PlotWidget);
    Tool = (function(_super) {
      __extends(Tool, _super);

      function Tool() {
        _ref1 = Tool.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Tool.prototype.display_defaults = function() {
        return {
          level: 'tool'
        };
      };

      return Tool;

    })(HasParent);
    return {
      "Model": Tool,
      "View": ToolView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=tool.js.map
*/;
(function() {
  define('tool/event_generators',[], function() {
    var ButtonEventGenerator, OnePointWheelEventGenerator, TwoPointEventGenerator, set_bokehXY;
    set_bokehXY = function(event) {
      var left, offset, top;
      offset = $(event.currentTarget).offset();
      left = offset != null ? offset.left : 0;
      top = offset != null ? offset.top : 0;
      event.bokehX = event.pageX - left;
      return event.bokehY = event.pageY - top;
    };
    TwoPointEventGenerator = (function() {
      function TwoPointEventGenerator(options) {
        this.restrict_to_innercanvas = options.restrict_to_innercanvas;
        this.options = options;
        this.toolName = this.options.eventBasename;
        this.dragging = false;
        this.basepoint_set = false;
        this.button_activated = false;
        this.tool_active = false;
      }

      TwoPointEventGenerator.prototype.bind_bokeh_events = function(plotview, eventSink) {
        var toolName,
          _this = this;
        toolName = this.toolName;
        this.plotview = plotview;
        this.eventSink = eventSink;
        this.plotview.moveCallbacks.push(function(e, x, y) {
          if (!_this.dragging) {
            return;
          }
          if (!_this.tool_active) {
            return;
          }
          set_bokehXY(e);
          if (!_this.basepoint_set) {
            _this.dragging = true;
            _this.basepoint_set = true;
            return eventSink.trigger("" + toolName + ":SetBasepoint", e);
          } else {
            eventSink.trigger("" + toolName + ":UpdatingMouseMove", e);
            e.preventDefault();
            return e.stopPropagation();
          }
        });
        this.plotview.moveCallbacks.push(function(e, x, y) {
          var inner_range_horizontal, inner_range_vertical, xend, xstart, yend, ystart;
          if (_this.dragging) {
            set_bokehXY(e);
            inner_range_horizontal = _this.plotview.view_state.get('inner_range_horizontal');
            inner_range_vertical = _this.plotview.view_state.get('inner_range_vertical');
            x = _this.plotview.view_state.sx_to_vx(e.bokehX);
            y = _this.plotview.view_state.sy_to_vy(e.bokehY);
            if (_this.restrict_to_innercanvas) {
              xstart = inner_range_horizontal.get('start');
              xend = inner_range_horizontal.get('end');
              ystart = inner_range_vertical.get('start');
              yend = inner_range_vertical.get('end');
            } else {
              xstart = 0;
              xend = _this.plotview.view_state.get('outer_width');
              ystart = 0;
              yend = _this.plotview.view_state.get('outer_height');
            }
            if (x < xstart || x > xend) {
              _this._stop_drag(e);
              return false;
            }
            if (y < ystart || y > yend) {
              _this._stop_drag(e);
              return false;
            }
          }
        });
        $(document).bind('keydown', function(e) {
          if (e.keyCode === 27) {
            return eventSink.trigger("clear_active_tool");
          }
        });
        $(document).bind('keyup', function(e) {
          if (!e[_this.options.keyName]) {
            return _this._stop_drag(e);
          }
        });
        this.plotview.canvas_wrapper.bind('mousedown', function(e) {
          if (_this.button_activated || e[_this.options.keyName]) {
            _this._start_drag();
            return false;
          }
        });
        this.plotview.canvas_wrapper.bind('mouseup', function(e) {
          if (_this.button_activated) {
            _this._stop_drag(e);
            return false;
          }
        });
        this.plotview.canvas_wrapper.bind('mouseleave', function(e) {
          if (_this.button_activated) {
            _this._stop_drag(e);
            return false;
          }
        });
        this.$tool_button = $("<button class='btn btn-small'> " + this.options.buttonText + " </button>");
        this.plotview;
        this.plotview.$el.find('.button_bar').append(this.$tool_button);
        this.$tool_button.click(function() {
          if (_this.button_activated) {
            return eventSink.trigger("clear_active_tool");
          } else {
            return eventSink.trigger("active_tool", toolName);
          }
        });
        eventSink.on("" + toolName + ":deactivated", function() {
          _this.tool_active = false;
          _this.button_activated = false;
          return _this.$tool_button.removeClass('active');
        });
        eventSink.on("" + toolName + ":activated", function() {
          _this.tool_active = true;
          _this.$tool_button.addClass('active');
          return _this.button_activated = true;
        });
        return eventSink;
      };

      TwoPointEventGenerator.prototype.hide_button = function() {
        return this.$tool_button.hide();
      };

      TwoPointEventGenerator.prototype._start_drag = function() {
        this.eventSink.trigger("active_tool", this.toolName);
        if (!this.dragging) {
          this.dragging = true;
          if (!this.button_activated) {
            this.$tool_button.addClass('active');
          }
          if (this.options.cursor != null) {
            return this.plotview.canvas_wrapper.css('cursor', this.options.cursor);
          }
        }
      };

      TwoPointEventGenerator.prototype._stop_drag = function(e) {
        this.basepoint_set = false;
        if (this.dragging) {
          this.dragging = false;
          if (!this.button_activated) {
            this.$tool_button.removeClass('active');
          }
          if (this.options.cursor != null) {
            this.plotview.canvas_wrapper.css('cursor', '');
          }
          set_bokehXY(e);
          return this.eventSink.trigger("" + this.options.eventBasename + ":DragEnd", e);
        }
      };

      return TwoPointEventGenerator;

    })();
    OnePointWheelEventGenerator = (function() {
      function OnePointWheelEventGenerator(options) {
        this.options = options;
        this.toolName = this.options.eventBasename;
        this.dragging = false;
        this.basepoint_set = false;
        this.button_activated = false;
        this.tool_active = false;
      }

      OnePointWheelEventGenerator.prototype.bind_bokeh_events = function(plotview, eventSink) {
        var no_scroll, restore_scroll, toolName,
          _this = this;
        toolName = this.toolName;
        this.plotview = plotview;
        this.eventSink = eventSink;
        this.plotview.canvas_wrapper.bind("mousewheel", function(e, delta, dX, dY) {
          if (!_this.tool_active) {
            return;
          }
          set_bokehXY(e);
          e.delta = delta;
          eventSink.trigger("" + toolName + ":zoom", e);
          e.preventDefault();
          return e.stopPropagation();
        });
        $(document).bind('keydown', function(e) {
          if (e.keyCode === 27) {
            return eventSink.trigger("clear_active_tool");
          }
        });
        this.plotview.$el.bind("mousein", function(e) {
          return eventSink.trigger("clear_active_tool");
        });
        this.plotview.$el.bind("mouseover", function(e) {
          return _this.mouseover_count += 1;
        });
        this.$tool_button = $("<button class='btn btn-small'> " + this.options.buttonText + " </button>");
        this.plotview.$el.find('.button_bar').append(this.$tool_button);
        this.$tool_button.click(function() {
          if (_this.button_activated) {
            return eventSink.trigger("clear_active_tool");
          } else {
            eventSink.trigger("active_tool", toolName);
            return _this.button_activated = true;
          }
        });
        no_scroll = function(el) {
          el.setAttribute("old_overflow", el.style.overflow);
          el.style.overflow = "hidden";
          if (el === document.body) {

          } else {
            return no_scroll(el.parentNode);
          }
        };
        restore_scroll = function(el) {
          el.style.overflow = el.getAttribute("old_overflow");
          if (el === document.body) {

          } else {
            return restore_scroll(el.parentNode);
          }
        };
        eventSink.on("" + toolName + ":deactivated", function() {
          _this.tool_active = false;
          _this.button_activated = false;
          _this.$tool_button.removeClass('active');
          return document.body.style.overflow = _this.old_overflow;
        });
        eventSink.on("" + toolName + ":activated", function() {
          _this.tool_active = true;
          return _this.$tool_button.addClass('active');
        });
        return eventSink;
      };

      OnePointWheelEventGenerator.prototype.hide_button = function() {
        return this.$tool_button.hide();
      };

      return OnePointWheelEventGenerator;

    })();
    ButtonEventGenerator = (function() {
      function ButtonEventGenerator(options) {
        this.options = options;
        this.toolName = this.options.eventBasename;
        this.button_activated = false;
        this.tool_active = false;
      }

      ButtonEventGenerator.prototype.bind_bokeh_events = function(plotview, eventSink) {
        var no_scroll, restore_scroll, toolName,
          _this = this;
        toolName = this.toolName;
        this.plotview = plotview;
        this.eventSink = eventSink;
        $(document).bind('keydown', function(e) {
          if (e.keyCode === 27) {
            return eventSink.trigger("clear_active_tool");
          }
        });
        this.plotview.$el.bind("mouseover", function(e) {
          return _this.mouseover_count += 1;
        });
        this.$tool_button = $("<button class='btn btn-small'> " + this.options.buttonText + " </button>");
        this.plotview.$el.find('.button_bar').append(this.$tool_button);
        this.$tool_button.click(function() {
          if (_this.button_activated) {
            return eventSink.trigger("clear_active_tool");
          } else {
            eventSink.trigger("active_tool", toolName);
            return _this.button_activated = true;
          }
        });
        no_scroll = function(el) {
          el.setAttribute("old_overflow", el.style.overflow);
          el.style.overflow = "hidden";
          if (el === document.body) {

          } else {
            return no_scroll(el.parentNode);
          }
        };
        restore_scroll = function(el) {
          el.style.overflow = el.getAttribute("old_overflow");
          if (el === document.body) {

          } else {
            return restore_scroll(el.parentNode);
          }
        };
        eventSink.on("" + toolName + ":deactivated", function() {
          _this.tool_active = false;
          _this.button_activated = false;
          _this.$tool_button.removeClass('active');
          return document.body.style.overflow = _this.old_overflow;
        });
        eventSink.on("" + toolName + ":activated", function() {
          _this.tool_active = true;
          return _this.$tool_button.addClass('active');
        });
        return eventSink;
      };

      ButtonEventGenerator.prototype.hide_button = function() {
        return this.$tool_button.hide();
      };

      return ButtonEventGenerator;

    })();
    return {
      "TwoPointEventGenerator": TwoPointEventGenerator,
      "OnePointWheelEventGenerator": OnePointWheelEventGenerator,
      "ButtonEventGenerator": ButtonEventGenerator
    };
  });

}).call(this);

/*
//@ sourceMappingURL=event_generators.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('tool/pan_tool',["underscore", "backbone", "./tool", "./event_generators"], function(_, Backbone, Tool, EventGenerators) {
    var PanTool, PanToolView, PanTools, TwoPointEventGenerator, _ref, _ref1, _ref2;
    TwoPointEventGenerator = EventGenerators.TwoPointEventGenerator;
    window.render_count = 0;
    PanToolView = (function(_super) {
      __extends(PanToolView, _super);

      function PanToolView() {
        _ref = PanToolView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      PanToolView.prototype.initialize = function(options) {
        return PanToolView.__super__.initialize.call(this, options);
      };

      PanToolView.prototype.bind_bokeh_events = function() {
        return PanToolView.__super__.bind_bokeh_events.call(this);
      };

      PanToolView.prototype.eventGeneratorClass = TwoPointEventGenerator;

      PanToolView.prototype.toolType = "PanTool";

      PanToolView.prototype.evgen_options = {
        keyName: "shiftKey",
        buttonText: "Pan",
        cursor: "move",
        restrict_to_innercanvas: true
      };

      PanToolView.prototype.tool_events = {
        UpdatingMouseMove: "_drag",
        SetBasepoint: "_set_base_point"
      };

      PanToolView.prototype.mouse_coords = function(e, x, y) {
        var x_, y_, _ref1;
        _ref1 = [this.plot_view.view_state.sx_to_vx(x), this.plot_view.view_state.sy_to_vy(y)], x_ = _ref1[0], y_ = _ref1[1];
        return [x_, y_];
      };

      PanToolView.prototype._set_base_point = function(e) {
        var _ref1;
        _ref1 = this.mouse_coords(e, e.bokehX, e.bokehY), this.x = _ref1[0], this.y = _ref1[1];
        return null;
      };

      PanToolView.prototype._drag = function(e) {
        var pan_info, sx_high, sx_low, sy_high, sy_low, x, xdiff, xend, xr, xstart, y, ydiff, yend, yr, ystart, _ref1, _ref2;
        _ref1 = this.mouse_coords(e, e.bokehX, e.bokehY), x = _ref1[0], y = _ref1[1];
        xdiff = x - this.x;
        ydiff = y - this.y;
        _ref2 = [x, y], this.x = _ref2[0], this.y = _ref2[1];
        xr = this.plot_view.view_state.get('inner_range_horizontal');
        sx_low = xr.get('start') - xdiff;
        sx_high = xr.get('end') - xdiff;
        yr = this.plot_view.view_state.get('inner_range_vertical');
        sy_low = yr.get('start') - ydiff;
        sy_high = yr.get('end') - ydiff;
        xstart = this.plot_view.xmapper.map_from_target(sx_low);
        xend = this.plot_view.xmapper.map_from_target(sx_high);
        ystart = this.plot_view.ymapper.map_from_target(sy_low);
        yend = this.plot_view.ymapper.map_from_target(sy_high);
        pan_info = {
          xr: {
            start: xstart,
            end: xend
          },
          yr: {
            start: ystart,
            end: yend
          },
          sdx: -xdiff,
          sdy: ydiff
        };
        this.plot_view.update_range(pan_info);
        return null;
      };

      return PanToolView;

    })(Tool.View);
    PanTool = (function(_super) {
      __extends(PanTool, _super);

      function PanTool() {
        _ref1 = PanTool.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      PanTool.prototype.default_view = PanToolView;

      PanTool.prototype.type = "PanTool";

      PanTool.prototype.defaults = function() {
        return {
          dimensions: [],
          dataranges: []
        };
      };

      PanTool.prototype.display_defaults = function() {
        return PanTool.__super__.display_defaults.call(this);
      };

      return PanTool;

    })(Tool.Model);
    PanTools = (function(_super) {
      __extends(PanTools, _super);

      function PanTools() {
        _ref2 = PanTools.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      PanTools.prototype.model = PanTool;

      return PanTools;

    })(Backbone.Collection);
    return {
      "Model": PanTool,
      "Collection": new PanTools(),
      "View": PanToolView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=pan_tool.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('tool/wheel_zoom_tool',["underscore", "backbone", "./tool", "./event_generators"], function(_, Backbone, Tool, EventGenerators) {
    var OnePointWheelEventGenerator, WheelZoomTool, WheelZoomToolView, WheelZoomTools, _ref, _ref1, _ref2;
    OnePointWheelEventGenerator = EventGenerators.OnePointWheelEventGenerator;
    WheelZoomToolView = (function(_super) {
      __extends(WheelZoomToolView, _super);

      function WheelZoomToolView() {
        _ref = WheelZoomToolView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      WheelZoomToolView.prototype.initialize = function(options) {
        return WheelZoomToolView.__super__.initialize.call(this, options);
      };

      WheelZoomToolView.prototype.eventGeneratorClass = OnePointWheelEventGenerator;

      WheelZoomToolView.prototype.evgen_options = {
        buttonText: "WheelZoom"
      };

      WheelZoomToolView.prototype.tool_events = {
        zoom: "_zoom"
      };

      WheelZoomToolView.prototype.mouse_coords = function(e, x, y) {
        var x_, y_, _ref1;
        _ref1 = [this.plot_view.view_state.sx_to_vx(x), this.plot_view.view_state.sy_to_vy(y)], x_ = _ref1[0], y_ = _ref1[1];
        return [x_, y_];
      };

      WheelZoomToolView.prototype._zoom = function(e) {
        var delta, factor, screenX, screenY, speed, sx_high, sx_low, sy_high, sy_low, x, xend, xr, xstart, y, yend, yr, ystart, zoom_info, _ref1, _ref2, _ref3;
        delta = e.originalEvent.wheelDelta;
        screenX = e.bokehX;
        screenY = e.bokehY;
        _ref1 = this.mouse_coords(e, screenX, screenY), x = _ref1[0], y = _ref1[1];
        speed = this.mget('speed');
        factor = speed * delta;
        if (factor > 0.9) {
          factor = 0.9;
        } else if (factor < -0.9) {
          factor = -0.9;
        }
        xr = this.plot_view.view_state.get('inner_range_horizontal');
        sx_low = xr.get('start');
        sx_high = xr.get('end');
        yr = this.plot_view.view_state.get('inner_range_vertical');
        sy_low = yr.get('start');
        sy_high = yr.get('end');
        _ref2 = this.plot_view.xmapper.v_map_from_target([sx_low - (sx_low - x) * factor, sx_high - (sx_high - x) * factor]), xstart = _ref2[0], xend = _ref2[1];
        _ref3 = this.plot_view.ymapper.v_map_from_target([sy_low - (sy_low - y) * factor, sy_high - (sy_high - y) * factor]), ystart = _ref3[0], yend = _ref3[1];
        zoom_info = {
          xr: {
            start: xstart,
            end: xend
          },
          yr: {
            start: ystart,
            end: yend
          },
          factor: factor
        };
        this.plot_view.update_range(zoom_info);
        return null;
      };

      return WheelZoomToolView;

    })(Tool.View);
    WheelZoomTool = (function(_super) {
      __extends(WheelZoomTool, _super);

      function WheelZoomTool() {
        _ref1 = WheelZoomTool.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      WheelZoomTool.prototype.default_view = WheelZoomToolView;

      WheelZoomTool.prototype.type = "WheelZoomTool";

      WheelZoomTool.prototype.defaults = function() {
        return {
          dimensions: [],
          dataranges: [],
          speed: 1 / 600
        };
      };

      return WheelZoomTool;

    })(Tool.Model);
    WheelZoomTools = (function(_super) {
      __extends(WheelZoomTools, _super);

      function WheelZoomTools() {
        _ref2 = WheelZoomTools.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      WheelZoomTools.prototype.model = WheelZoomTool;

      WheelZoomTools.prototype.display_defaults = function() {
        return WheelZoomTools.__super__.display_defaults.call(this);
      };

      return WheelZoomTools;

    })(Backbone.Collection);
    return {
      "Model": WheelZoomTool,
      "Collection": new WheelZoomTools(),
      "View": WheelZoomToolView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=wheel_zoom_tool.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('tool/resize_tool',["underscore", "backbone", "./tool", "./event_generators"], function(_, Backbone, Tool, EventGenerators) {
    var ResizeTool, ResizeToolView, ResizeTools, TwoPointEventGenerator, _ref, _ref1, _ref2;
    TwoPointEventGenerator = EventGenerators.TwoPointEventGenerator;
    ResizeToolView = (function(_super) {
      __extends(ResizeToolView, _super);

      function ResizeToolView() {
        _ref = ResizeToolView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      ResizeToolView.prototype.initialize = function(options) {
        ResizeToolView.__super__.initialize.call(this, options);
        return this.active = false;
      };

      ResizeToolView.prototype.bind_events = function(plotview) {
        return ResizeToolView.__super__.bind_events.call(this, plotview);
      };

      ResizeToolView.prototype.eventGeneratorClass = TwoPointEventGenerator;

      ResizeToolView.prototype.toolType = "ResizeTool";

      ResizeToolView.prototype.evgen_options = {
        keyName: "",
        buttonText: "Resize",
        cursor: "move"
      };

      ResizeToolView.prototype.tool_events = {
        activated: "_activate",
        deactivated: "_deactivate",
        UpdatingMouseMove: "_drag",
        SetBasepoint: "_set_base_point"
      };

      ResizeToolView.prototype.render = function() {
        var ch, ctx, cw, line_width;
        if (!this.active) {
          return;
        }
        ctx = this.plot_view.ctx;
        cw = this.plot_view.view_state.get('canvas_width');
        ch = this.plot_view.view_state.get('canvas_height');
        line_width = 8;
        ctx.save();
        ctx.strokeStyle = 'grey';
        ctx.globalAlpha = 0.7;
        ctx.lineWidth = line_width;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.rect(line_width, line_width, cw - line_width * 2, ch - line_width * 2);
        ctx.moveTo(line_width, line_width);
        ctx.lineTo(cw - line_width, ch - line_width);
        ctx.moveTo(line_width, ch - line_width);
        ctx.lineTo(cw - line_width, line_width);
        ctx.stroke();
        return ctx.restore();
      };

      ResizeToolView.prototype.mouse_coords = function(e, x, y) {
        return [x, y];
      };

      ResizeToolView.prototype._activate = function(e) {
        var bbar, ch, cw;
        if (this.active) {
          return;
        }
        this.active = true;
        this.popup = $('<div class="resize_popup pull-right"\nstyle="border-radius: 10px; background-color: lightgrey; padding:3px 8px; font-size: 14px;\nposition:absolute; right:20px; top: 20px; "></div>');
        bbar = this.plot_view.$el.find('.bokeh_canvas_wrapper');
        this.popup.appendTo(bbar);
        ch = this.plot_view.view_state.get('outer_height');
        cw = this.plot_view.view_state.get('outer_width');
        this.popup.text("width: " + cw + " height: " + ch);
        this.request_render();
        this.plot_view.request_render();
        return null;
      };

      ResizeToolView.prototype._deactivate = function(e) {
        this.active = false;
        this.popup.remove();
        this.request_render();
        this.plot_view.request_render();
        return null;
      };

      ResizeToolView.prototype._set_base_point = function(e) {
        var _ref1;
        _ref1 = this.mouse_coords(e, e.bokehX, e.bokehY), this.x = _ref1[0], this.y = _ref1[1];
        return null;
      };

      ResizeToolView.prototype._drag = function(e) {
        var ch, cw, x, xdiff, y, ydiff, _ref1, _ref2;
        this.plot_view.pause();
        _ref1 = this.mouse_coords(e, e.bokehX, e.bokehY), x = _ref1[0], y = _ref1[1];
        xdiff = x - this.x;
        ydiff = y - this.y;
        _ref2 = [x, y], this.x = _ref2[0], this.y = _ref2[1];
        ch = this.plot_view.view_state.get('outer_height');
        cw = this.plot_view.view_state.get('outer_width');
        this.popup.text("width: " + cw + " height: " + ch);
        this.plot_view.view_state.set('outer_height', ch + ydiff, {
          'silent': true
        });
        this.plot_view.view_state.set('outer_width', cw + xdiff, {
          'silent': true
        });
        this.plot_view.view_state.set('canvas_height', ch + ydiff, {
          'silent': true
        });
        this.plot_view.view_state.set('canvas_width', cw + xdiff, {
          'silent': true
        });
        this.plot_view.view_state.trigger('change:outer_height', ch + ydiff);
        this.plot_view.view_state.trigger('change:outer_width', cw + xdiff);
        this.plot_view.view_state.trigger('change:canvas_height', ch + ydiff);
        this.plot_view.view_state.trigger('change:canvas_width', cw + xdiff);
        this.plot_view.view_state.trigger('change', this.plot_view.view_state);
        this.plot_view.unpause(true);
        return null;
      };

      return ResizeToolView;

    })(Tool.View);
    ResizeTool = (function(_super) {
      __extends(ResizeTool, _super);

      function ResizeTool() {
        _ref1 = ResizeTool.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      ResizeTool.prototype.default_view = ResizeToolView;

      ResizeTool.prototype.type = "ResizeTool";

      ResizeTool.prototype.display_defaults = function() {
        return ResizeTool.__super__.display_defaults.call(this);
      };

      return ResizeTool;

    })(Tool.Model);
    ResizeTools = (function(_super) {
      __extends(ResizeTools, _super);

      function ResizeTools() {
        _ref2 = ResizeTools.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      ResizeTools.prototype.model = ResizeTool;

      return ResizeTools;

    })(Backbone.Collection);
    return {
      "Model": ResizeTool,
      "Collection": new ResizeTools(),
      "View": ResizeToolView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=resize_tool.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('tool/crosshair_tool',["underscore", "backbone", "./tool", "./event_generators", "sprintf"], function(_, Backbone, Tool, EventGenerators, sprintf) {
    var CrosshairTool, CrosshairToolView, CrosshairTools, TwoPointEventGenerator, _ref, _ref1, _ref2;
    TwoPointEventGenerator = EventGenerators.TwoPointEventGenerator;
    CrosshairToolView = (function(_super) {
      __extends(CrosshairToolView, _super);

      function CrosshairToolView() {
        _ref = CrosshairToolView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      CrosshairToolView.prototype.initialize = function(options) {
        CrosshairToolView.__super__.initialize.call(this, options);
        return this.active = false;
      };

      CrosshairToolView.prototype.bind_events = function(plotview) {
        return CrosshairToolView.__super__.bind_events.call(this, plotview);
      };

      CrosshairToolView.prototype.eventGeneratorClass = TwoPointEventGenerator;

      CrosshairToolView.prototype.toolType = "CrosshairTool";

      CrosshairToolView.prototype.evgen_options = {
        keyName: "",
        buttonText: "Crosshair",
        cursor: "crosshair"
      };

      CrosshairToolView.prototype.tool_events = {
        activated: "_activate",
        deactivated: "_deactivate",
        UpdatingMouseMove: "_drag",
        SetBasepoint: "_set_base_point"
      };

      CrosshairToolView.prototype.render = function() {
        var ch, ctx, cw, line_width;
        if (!this.active) {
          return;
        }
        ctx = this.plot_view.ctx;
        cw = this.plot_view.view_state.get('canvas_width');
        ch = this.plot_view.view_state.get('canvas_height');
        line_width = 1;
        ctx.save();
        ctx.strokeStyle = 'red';
        ctx.globalAlpha = 0.7;
        ctx.lineWidth = line_width;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(0, this.y);
        ctx.lineTo(cw, this.y);
        console.log(this.x, this.y);
        ctx.moveTo(this.x, 0);
        ctx.lineTo(this.x, ch);
        ctx.stroke();
        return ctx.restore();
      };

      CrosshairToolView.prototype.mouse_coords = function(e, x, y) {
        return [x, y];
      };

      CrosshairToolView.prototype._activate = function(e) {
        var bbar, ch, cw;
        if (this.active) {
          return;
        }
        this.active = true;
        this.popup = $('<div class="resize_popup pull-right"\nstyle="border-radius: 10px; background-color: lightgrey; padding:3px 8px; font-size: 14px;\nposition:absolute; right:20px; top: 20px; "></div>');
        bbar = this.plot_view.$el.find('.bokeh_canvas_wrapper');
        this.popup.appendTo(bbar);
        ch = this.plot_view.view_state.get('outer_height');
        cw = this.plot_view.view_state.get('outer_width');
        this.popup.text("x: 0 y:0");
        this.plot_view.$el.css("cursor", "crosshair");
        return null;
      };

      CrosshairToolView.prototype._deactivate = function(e) {
        this.active = false;
        this.plot_view.$el.css("cursor", "default");
        this.popup.remove();
        this.request_render();
        this.plot_view.request_render();
        return null;
      };

      CrosshairToolView.prototype._set_base_point = function(e) {
        var _ref1;
        _ref1 = this.mouse_coords(e, e.bokehX, e.bokehY), this.x = _ref1[0], this.y = _ref1[1];
        return null;
      };

      CrosshairToolView.prototype._drag = function(e) {
        var data_x, data_y, _ref1;
        this.plot_view.pause();
        _ref1 = this.mouse_coords(e, e.bokehX, e.bokehY), this.x = _ref1[0], this.y = _ref1[1];
        data_x = sprintf("%.4f", this.plot_view.xmapper.map_from_target(x));
        data_y = sprintf("%.4f", this.plot_view.ymapper.map_from_target(y));
        this.popup.text("x: " + data_x + " y: " + data_y);
        this.request_render();
        this.plot_view.request_render();
        this.plot_view.unpause(true);
        return null;
      };

      return CrosshairToolView;

    })(Tool.View);
    CrosshairTool = (function(_super) {
      __extends(CrosshairTool, _super);

      function CrosshairTool() {
        _ref1 = CrosshairTool.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      CrosshairTool.prototype.default_view = CrosshairToolView;

      CrosshairTool.prototype.type = "CrosshairTool";

      CrosshairTool.prototype.display_defaults = function() {
        return CrosshairTool.__super__.display_defaults.call(this);
      };

      return CrosshairTool;

    })(Tool.Model);
    CrosshairTools = (function(_super) {
      __extends(CrosshairTools, _super);

      function CrosshairTools() {
        _ref2 = CrosshairTools.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      CrosshairTools.prototype.model = CrosshairTool;

      return CrosshairTools;

    })(Backbone.Collection);
    return {
      "Model": CrosshairTool,
      "Collection": new CrosshairTools(),
      "View": CrosshairToolView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=crosshair_tool.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('tool/box_select_tool',["underscore", "backbone", "./tool", "./event_generators"], function(_, Backbone, Tool, EventGenerators) {
    var BoxSelectTool, BoxSelectToolView, BoxSelectTools, TwoPointEventGenerator, _ref, _ref1, _ref2;
    TwoPointEventGenerator = EventGenerators.TwoPointEventGenerator;
    BoxSelectToolView = (function(_super) {
      __extends(BoxSelectToolView, _super);

      function BoxSelectToolView() {
        _ref = BoxSelectToolView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      BoxSelectToolView.prototype.initialize = function(options) {
        BoxSelectToolView.__super__.initialize.call(this, options);
        return this.select_every_mousemove = this.mget('select_every_mousemove');
      };

      BoxSelectToolView.prototype.bind_bokeh_events = function() {
        var renderer, rendererview, _i, _len, _ref1, _results;
        BoxSelectToolView.__super__.bind_bokeh_events.call(this);
        _ref1 = this.mget_obj('renderers');
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          renderer = _ref1[_i];
          rendererview = this.plot_view.renderers[renderer.id];
          this.listenTo(rendererview.xrange(), 'change', this.select_callback);
          this.listenTo(rendererview.yrange(), 'change', this.select_callback);
          _results.push(this.listenTo(renderer, 'change', this.select_callback));
        }
        return _results;
      };

      BoxSelectToolView.prototype.eventGeneratorClass = TwoPointEventGenerator;

      BoxSelectToolView.prototype.toolType = "BoxSelectTool";

      BoxSelectToolView.prototype.evgen_options = {
        keyName: "ctrlKey",
        buttonText: "Select",
        cursor: "crosshair",
        restrict_to_innercanvas: true
      };

      BoxSelectToolView.prototype.tool_events = {
        SetBasepoint: "_start_selecting",
        UpdatingMouseMove: "_selecting",
        deactivated: "_stop_selecting",
        DragEnd: "_dragend"
      };

      BoxSelectToolView.prototype.pause = function() {
        return null;
      };

      BoxSelectToolView.prototype.view_coords = function(sx, sy) {
        var vx, vy, _ref1;
        _ref1 = [this.plot_view.view_state.sx_to_vx(sx), this.plot_view.view_state.sy_to_vy(sy)], vx = _ref1[0], vy = _ref1[1];
        return [vx, vy];
      };

      BoxSelectToolView.prototype._stop_selecting = function() {
        this.trigger('stopselect');
        this.basepoint_set = false;
        return this.plot_view.unpause();
      };

      BoxSelectToolView.prototype._start_selecting = function(e) {
        var vx, vy, _ref1;
        this.plot_view.pause();
        this.trigger('startselect');
        _ref1 = this.view_coords(e.bokehX, e.bokehY), vx = _ref1[0], vy = _ref1[1];
        this.mset({
          'start_vx': vx,
          'start_vy': vy,
          'current_vx': null,
          'current_vy': null
        });
        return this.basepoint_set = true;
      };

      BoxSelectToolView.prototype._get_selection_range = function() {
        var xrange, yrange;
        if (this.mget('select_x')) {
          xrange = [this.mget('start_vx'), this.mget('current_vx')];
          xrange = [_.min(xrange), _.max(xrange)];
        } else {
          xrange = null;
        }
        if (this.mget('select_y')) {
          yrange = [this.mget('start_vy'), this.mget('current_vy')];
          yrange = [_.min(yrange), _.max(yrange)];
        } else {
          yrange = null;
        }
        return [xrange, yrange];
      };

      BoxSelectToolView.prototype._selecting = function(e, x_, y_) {
        var vx, vy, _ref1, _ref2;
        _ref1 = this.view_coords(e.bokehX, e.bokehY), vx = _ref1[0], vy = _ref1[1];
        this.mset({
          'current_vx': vx,
          'current_vy': vy
        });
        _ref2 = this._get_selection_range(), this.xrange = _ref2[0], this.yrange = _ref2[1];
        this.trigger('boxselect', this.xrange, this.yrange);
        if (this.select_every_mousemove) {
          this._select_data();
        }
        this.plot_view.render_overlays(true);
        return null;
      };

      BoxSelectToolView.prototype._dragend = function() {
        return this._select_data();
      };

      BoxSelectToolView.prototype._select_data = function() {
        var datasource, datasource_id, datasource_selections, datasources, ds, geometry, k, renderer, selected, v, _i, _j, _len, _len1, _ref1, _ref2;
        if (!this.basepoint_set) {
          return;
        }
        geometry = {
          type: 'rect',
          vx0: this.xrange[0],
          vx1: this.xrange[1],
          vy0: this.yrange[0],
          vy1: this.yrange[1]
        };
        datasources = {};
        datasource_selections = {};
        _ref1 = this.mget_obj('renderers');
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          renderer = _ref1[_i];
          datasource = renderer.get_obj('data_source');
          datasources[datasource.id] = datasource;
        }
        _ref2 = this.mget_obj('renderers');
        for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
          renderer = _ref2[_j];
          datasource_id = renderer.get_obj('data_source').id;
          _.setdefault(datasource_selections, datasource_id, []);
          selected = this.plot_view.renderers[renderer.id].hit_test(geometry);
          datasource_selections[datasource_id].push(selected);
        }
        for (k in datasource_selections) {
          if (!__hasProp.call(datasource_selections, k)) continue;
          v = datasource_selections[k];
          selected = _.intersection.apply(_, v);
          ds = datasources[k];
          ds.save({
            selected: selected
          }, {
            patch: true
          });
          this.plot_view.unpause();
        }
        return null;
      };

      return BoxSelectToolView;

    })(Tool.View);
    BoxSelectTool = (function(_super) {
      __extends(BoxSelectTool, _super);

      function BoxSelectTool() {
        _ref1 = BoxSelectTool.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      BoxSelectTool.prototype.default_view = BoxSelectToolView;

      BoxSelectTool.prototype.type = "BoxSelectTool";

      BoxSelectTool.prototype.defaults = function() {
        return _.extend(BoxSelectTool.__super__.defaults.call(this), {
          renderers: [],
          select_x: true,
          select_y: true,
          select_every_mousemove: false,
          data_source_options: {}
        });
      };

      BoxSelectTool.prototype.display_defaults = function() {
        return BoxSelectTool.__super__.display_defaults.call(this);
      };

      return BoxSelectTool;

    })(Tool.Model);
    BoxSelectTools = (function(_super) {
      __extends(BoxSelectTools, _super);

      function BoxSelectTools() {
        _ref2 = BoxSelectTools.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      BoxSelectTools.prototype.model = BoxSelectTool;

      return BoxSelectTools;

    })(Backbone.Collection);
    return {
      "Model": BoxSelectTool,
      "Collection": new BoxSelectTools(),
      "View": BoxSelectToolView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=box_select_tool.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('tool/data_range_box_select_tool',["underscore", "backbone", "./box_select_tool"], function(_, Backbone, BoxSelectTool) {
    var DataRangeBoxSelectTool, DataRangeBoxSelectToolView, DataRangeBoxSelectTools, _ref, _ref1, _ref2;
    DataRangeBoxSelectToolView = (function(_super) {
      __extends(DataRangeBoxSelectToolView, _super);

      function DataRangeBoxSelectToolView() {
        _ref = DataRangeBoxSelectToolView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      DataRangeBoxSelectToolView.prototype.bind_bokeh_events = function() {
        return tool.ToolView.prototype.bind_bokeh_events.call(this);
      };

      DataRangeBoxSelectToolView.prototype._select_data = function() {
        var xend, xstart, yend, ystart, _ref1, _ref2;
        _ref1 = this.plot_view.mapper.map_from_target(this.xrange[0], this.yrange[0]), xstart = _ref1[0], ystart = _ref1[1];
        _ref2 = this.plot_view.mapper.map_from_target(this.xrange[1], this.yrange[1]), xend = _ref2[0], yend = _ref2[1];
        this.mset('xselect', [xstart, xend]);
        this.mset('yselect', [ystart, yend]);
        return this.model.save();
      };

      return DataRangeBoxSelectToolView;

    })(BoxSelectTool.View);
    DataRangeBoxSelectTool = (function(_super) {
      __extends(DataRangeBoxSelectTool, _super);

      function DataRangeBoxSelectTool() {
        _ref1 = DataRangeBoxSelectTool.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      DataRangeBoxSelectTool.prototype.default_view = DataRangeBoxSelectToolView;

      DataRangeBoxSelectTool.prototype.type = "DataRangeBoxSelectTool";

      return DataRangeBoxSelectTool;

    })(BoxSelectTool.Model);
    DataRangeBoxSelectTools = (function(_super) {
      __extends(DataRangeBoxSelectTools, _super);

      function DataRangeBoxSelectTools() {
        _ref2 = DataRangeBoxSelectTools.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      DataRangeBoxSelectTools.prototype.model = DataRangeBoxSelectToolView;

      DataRangeBoxSelectTools.prototype.display_defaults = function() {
        return DataRangeBoxSelectTools.__super__.display_defaults.call(this);
      };

      return DataRangeBoxSelectTools;

    })(Backbone.Collection);
    return {
      "Model": DataRangeBoxSelectTool,
      "Collection": new DataRangeBoxSelectTools(),
      "View": DataRangeBoxSelectToolView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=data_range_box_select_tool.js.map
*/;
/* ===================================================
 * bootstrap-transition.js v2.0.4
 * http://twitter.github.com/bootstrap/javascript.html#transitions
 * ===================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */


!function ($) {

  $(function () {

     // jshint ;_;


    /* CSS TRANSITION SUPPORT (http://www.modernizr.com/)
     * ======================================================= */

    $.support.transition = (function () {

      var transitionEnd = (function () {

        var el = document.createElement('bootstrap')
          , transEndEventNames = {
               'WebkitTransition' : 'webkitTransitionEnd'
            ,  'MozTransition'    : 'transitionend'
            ,  'OTransition'      : 'oTransitionEnd'
            ,  'msTransition'     : 'MSTransitionEnd'
            ,  'transition'       : 'transitionend'
            }
          , name

        for (name in transEndEventNames){
          if (el.style[name] !== undefined) {
            return transEndEventNames[name]
          }
        }

      }())

      return transitionEnd && {
        end: transitionEnd
      }

    })()

  })

}(window.jQuery);
/* =========================================================
 * bootstrap-modal.js v2.0.4
 * http://twitter.github.com/bootstrap/javascript.html#modals
 * =========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================= */


!function ($) {

   // jshint ;_;


 /* MODAL CLASS DEFINITION
  * ====================== */

  var Modal = function (content, options) {
    this.options = options
    this.$element = $(content)
      .delegate('[data-dismiss="modal"]', 'click.dismiss.modal', $.proxy(this.hide, this))
  }

  Modal.prototype = {

      constructor: Modal

    , toggle: function () {
        return this[!this.isShown ? 'show' : 'hide']()
      }

    , show: function () {
        var that = this
          , e = $.Event('show')

        this.$element.trigger(e)

        if (this.isShown || e.isDefaultPrevented()) return

        $('body').addClass('modal-open')

        this.isShown = true

        escape.call(this)
        backdrop.call(this, function () {
          var transition = $.support.transition && that.$element.hasClass('fade')

          if (!that.$element.parent().length) {
            that.$element.appendTo(document.body) //don't move modals dom position
          }

          that.$element
            .show()

          if (transition) {
            that.$element[0].offsetWidth // force reflow
          }

          that.$element.addClass('in')

          transition ?
            that.$element.one($.support.transition.end, function () { that.$element.trigger('shown') }) :
            that.$element.trigger('shown')

        })
      }

    , hide: function (e) {
        e && e.preventDefault()

        var that = this

        e = $.Event('hide')

        this.$element.trigger(e)

        if (!this.isShown || e.isDefaultPrevented()) return

        this.isShown = false

        $('body').removeClass('modal-open')

        escape.call(this)

        this.$element.removeClass('in')

        $.support.transition && this.$element.hasClass('fade') ?
          hideWithTransition.call(this) :
          hideModal.call(this)
      }

  }


 /* MODAL PRIVATE METHODS
  * ===================== */

  function hideWithTransition() {
    var that = this
      , timeout = setTimeout(function () {
          that.$element.off($.support.transition.end)
          hideModal.call(that)
        }, 500)

    this.$element.one($.support.transition.end, function () {
      clearTimeout(timeout)
      hideModal.call(that)
    })
  }

  function hideModal(that) {
    this.$element
      .hide()
      .trigger('hidden')

    backdrop.call(this)
  }

  function backdrop(callback) {
    var that = this
      , animate = this.$element.hasClass('fade') ? 'fade' : ''

    if (this.isShown && this.options.backdrop) {
      var doAnimate = $.support.transition && animate

      this.$backdrop = $('<div class="modal-backdrop ' + animate + '" />')
        .appendTo(document.body)

      if (this.options.backdrop != 'static') {
        this.$backdrop.click($.proxy(this.hide, this))
      }

      if (doAnimate) this.$backdrop[0].offsetWidth // force reflow

      this.$backdrop.addClass('in')

      doAnimate ?
        this.$backdrop.one($.support.transition.end, callback) :
        callback()

    } else if (!this.isShown && this.$backdrop) {
      this.$backdrop.removeClass('in')

      $.support.transition && this.$element.hasClass('fade')?
        this.$backdrop.one($.support.transition.end, $.proxy(removeBackdrop, this)) :
        removeBackdrop.call(this)

    } else if (callback) {
      callback()
    }
  }

  function removeBackdrop() {
    this.$backdrop.remove()
    this.$backdrop = null
  }

  function escape() {
    var that = this
    if (this.isShown && this.options.keyboard) {
      $(document).on('keyup.dismiss.modal', function ( e ) {
        e.which == 27 && that.hide()
      })
    } else if (!this.isShown) {
      $(document).off('keyup.dismiss.modal')
    }
  }


 /* MODAL PLUGIN DEFINITION
  * ======================= */

  $.fn.modal = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('modal')
        , options = $.extend({}, $.fn.modal.defaults, $this.data(), typeof option == 'object' && option)
      if (!data) $this.data('modal', (data = new Modal(this, options)))
      if (typeof option == 'string') data[option]()
      else if (options.show) data.show()
    })
  }

  $.fn.modal.defaults = {
      backdrop: true
    , keyboard: true
    , show: true
  }

  $.fn.modal.Constructor = Modal


 /* MODAL DATA-API
  * ============== */

  $(function () {
    $('body').on('click.modal.data-api', '[data-toggle="modal"]', function ( e ) {
      var $this = $(this), href
        , $target = $($this.attr('data-target') || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')) //strip for ie7
        , option = $target.data('modal') ? 'toggle' : $.extend({}, $target.data(), $this.data())

      e.preventDefault()
      $target.modal(option)
    })
  })

}(window.jQuery);
/* ============================================================
 * bootstrap-dropdown.js v2.0.4
 * http://twitter.github.com/bootstrap/javascript.html#dropdowns
 * ============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */


!function ($) {

   // jshint ;_;


 /* DROPDOWN CLASS DEFINITION
  * ========================= */

  var toggle = '[data-toggle="dropdown"]'
    , Dropdown = function (element) {
        var $el = $(element).on('click.dropdown.data-api', this.toggle)
        $('html').on('click.dropdown.data-api', function () {
          $el.parent().removeClass('open')
        })
      }

  Dropdown.prototype = {

    constructor: Dropdown

  , toggle: function (e) {
      var $this = $(this)
        , $parent
        , selector
        , isActive

      if ($this.is('.disabled, :disabled')) return

      selector = $this.attr('data-target')

      if (!selector) {
        selector = $this.attr('href')
        selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
      }

      $parent = $(selector)
      $parent.length || ($parent = $this.parent())

      isActive = $parent.hasClass('open')

      clearMenus()

      if (!isActive) $parent.toggleClass('open')

      return false
    }

  }

  function clearMenus() {
    $(toggle).parent().removeClass('open')
  }


  /* DROPDOWN PLUGIN DEFINITION
   * ========================== */

  $.fn.dropdown = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('dropdown')
      if (!data) $this.data('dropdown', (data = new Dropdown(this)))
      if (typeof option == 'string') data[option].call($this)
    })
  }

  $.fn.dropdown.Constructor = Dropdown


  /* APPLY TO STANDARD DROPDOWN ELEMENTS
   * =================================== */

  $(function () {
    $('html').on('click.dropdown.data-api', clearMenus)
    $('body')
      .on('click.dropdown', '.dropdown form', function (e) { e.stopPropagation() })
      .on('click.dropdown.data-api', toggle, Dropdown.prototype.toggle)
  })

}(window.jQuery);
/* =============================================================
 * bootstrap-scrollspy.js v2.0.4
 * http://twitter.github.com/bootstrap/javascript.html#scrollspy
 * =============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================== */


!function ($) {

   // jshint ;_;


  /* SCROLLSPY CLASS DEFINITION
   * ========================== */

  function ScrollSpy( element, options) {
    var process = $.proxy(this.process, this)
      , $element = $(element).is('body') ? $(window) : $(element)
      , href
    this.options = $.extend({}, $.fn.scrollspy.defaults, options)
    this.$scrollElement = $element.on('scroll.scroll.data-api', process)
    this.selector = (this.options.target
      || ((href = $(element).attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')) //strip for ie7
      || '') + ' .nav li > a'
    this.$body = $('body')
    this.refresh()
    this.process()
  }

  ScrollSpy.prototype = {

      constructor: ScrollSpy

    , refresh: function () {
        var self = this
          , $targets

        this.offsets = $([])
        this.targets = $([])

        $targets = this.$body
          .find(this.selector)
          .map(function () {
            var $el = $(this)
              , href = $el.data('target') || $el.attr('href')
              , $href = /^#\w/.test(href) && $(href)
            return ( $href
              && href.length
              && [[ $href.position().top, href ]] ) || null
          })
          .sort(function (a, b) { return a[0] - b[0] })
          .each(function () {
            self.offsets.push(this[0])
            self.targets.push(this[1])
          })
      }

    , process: function () {
        var scrollTop = this.$scrollElement.scrollTop() + this.options.offset
          , scrollHeight = this.$scrollElement[0].scrollHeight || this.$body[0].scrollHeight
          , maxScroll = scrollHeight - this.$scrollElement.height()
          , offsets = this.offsets
          , targets = this.targets
          , activeTarget = this.activeTarget
          , i

        if (scrollTop >= maxScroll) {
          return activeTarget != (i = targets.last()[0])
            && this.activate ( i )
        }

        for (i = offsets.length; i--;) {
          activeTarget != targets[i]
            && scrollTop >= offsets[i]
            && (!offsets[i + 1] || scrollTop <= offsets[i + 1])
            && this.activate( targets[i] )
        }
      }

    , activate: function (target) {
        var active
          , selector

        this.activeTarget = target

        $(this.selector)
          .parent('.active')
          .removeClass('active')

        selector = this.selector
          + '[data-target="' + target + '"],'
          + this.selector + '[href="' + target + '"]'

        active = $(selector)
          .parent('li')
          .addClass('active')

        if (active.parent('.dropdown-menu'))  {
          active = active.closest('li.dropdown').addClass('active')
        }

        active.trigger('activate')
      }

  }


 /* SCROLLSPY PLUGIN DEFINITION
  * =========================== */

  $.fn.scrollspy = function ( option ) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('scrollspy')
        , options = typeof option == 'object' && option
      if (!data) $this.data('scrollspy', (data = new ScrollSpy(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.scrollspy.Constructor = ScrollSpy

  $.fn.scrollspy.defaults = {
    offset: 10
  }


 /* SCROLLSPY DATA-API
  * ================== */

  $(function () {
    $('[data-spy="scroll"]').each(function () {
      var $spy = $(this)
      $spy.scrollspy($spy.data())
    })
  })

}(window.jQuery);
/* ========================================================
 * bootstrap-tab.js v2.0.4
 * http://twitter.github.com/bootstrap/javascript.html#tabs
 * ========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ======================================================== */


!function ($) {

   // jshint ;_;


 /* TAB CLASS DEFINITION
  * ==================== */

  var Tab = function ( element ) {
    this.element = $(element)
  }

  Tab.prototype = {

    constructor: Tab

  , show: function () {
      var $this = this.element
      , $ul = $this.closest('ul:not(.dropdown-menu)')
        , selector = $this.attr('data-target')
        , previous
        , $target
        , e

      if (!selector) {
        selector = $this.attr('href')
        selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
      }

      if ( $this.parent('li').hasClass('active') ) return

      previous = $ul.find('.active a').last()[0]

      e = $.Event('show', {
        relatedTarget: previous
      })

      $this.trigger(e)

      if (e.isDefaultPrevented()) return

      $target = $(selector)

      this.activate($this.parent('li'), $ul)
      this.activate($target, $target.parent(), function () {
        $this.trigger({
          type: 'shown'
        , relatedTarget: previous
        })
      })
    }

  , activate: function ( element, container, callback) {
      var $active = container.find('> .active')
        , transition = callback
            && $.support.transition
            && $active.hasClass('fade')

      function next() {
        $active
          .removeClass('active')
          .find('> .dropdown-menu > .active')
          .removeClass('active')

        element.addClass('active')

        if (transition) {
          element[0].offsetWidth // reflow for transition
          element.addClass('in')
        } else {
          element.removeClass('fade')
        }

        if ( element.parent('.dropdown-menu') ) {
          element.closest('li.dropdown').addClass('active')
        }

        callback && callback()
      }

      transition ?
        $active.one($.support.transition.end, next) :
        next()

      $active.removeClass('in')
    }
  }


 /* TAB PLUGIN DEFINITION
  * ===================== */

  $.fn.tab = function ( option ) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('tab')
      if (!data) $this.data('tab', (data = new Tab(this)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.tab.Constructor = Tab


 /* TAB DATA-API
  * ============ */

  $(function () {
    $('body').on('click.tab.data-api', '[data-toggle="tab"], [data-toggle="pill"]', function (e) {
      e.preventDefault()
      $(this).tab('show')
    })
  })

}(window.jQuery);
/* ===========================================================
 * bootstrap-tooltip.js v2.0.4
 * http://twitter.github.com/bootstrap/javascript.html#tooltips
 * Inspired by the original jQuery.tipsy by Jason Frame
 * ===========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */


!function ($) {

   // jshint ;_;


 /* TOOLTIP PUBLIC CLASS DEFINITION
  * =============================== */

  var Tooltip = function (element, options) {
    this.init('tooltip', element, options)
  }

  Tooltip.prototype = {

    constructor: Tooltip

  , init: function (type, element, options) {
      var eventIn
        , eventOut

      this.type = type
      this.$element = $(element)
      this.options = this.getOptions(options)
      this.enabled = true

      if (this.options.trigger != 'manual') {
        eventIn  = this.options.trigger == 'hover' ? 'mouseenter' : 'focus'
        eventOut = this.options.trigger == 'hover' ? 'mouseleave' : 'blur'
        this.$element.on(eventIn, this.options.selector, $.proxy(this.enter, this))
        this.$element.on(eventOut, this.options.selector, $.proxy(this.leave, this))
      }

      this.options.selector ?
        (this._options = $.extend({}, this.options, { trigger: 'manual', selector: '' })) :
        this.fixTitle()
    }

  , getOptions: function (options) {
      options = $.extend({}, $.fn[this.type].defaults, options, this.$element.data())

      if (options.delay && typeof options.delay == 'number') {
        options.delay = {
          show: options.delay
        , hide: options.delay
        }
      }

      return options
    }

  , enter: function (e) {
      var self = $(e.currentTarget)[this.type](this._options).data(this.type)

      if (!self.options.delay || !self.options.delay.show) return self.show()

      clearTimeout(this.timeout)
      self.hoverState = 'in'
      this.timeout = setTimeout(function() {
        if (self.hoverState == 'in') self.show()
      }, self.options.delay.show)
    }

  , leave: function (e) {
      var self = $(e.currentTarget)[this.type](this._options).data(this.type)

      if (this.timeout) clearTimeout(this.timeout)
      if (!self.options.delay || !self.options.delay.hide) return self.hide()

      self.hoverState = 'out'
      this.timeout = setTimeout(function() {
        if (self.hoverState == 'out') self.hide()
      }, self.options.delay.hide)
    }

  , show: function () {
      var $tip
        , inside
        , pos
        , actualWidth
        , actualHeight
        , placement
        , tp

      if (this.hasContent() && this.enabled) {
        $tip = this.tip()
        this.setContent()

        if (this.options.animation) {
          $tip.addClass('fade')
        }

        placement = typeof this.options.placement == 'function' ?
          this.options.placement.call(this, $tip[0], this.$element[0]) :
          this.options.placement

        inside = /in/.test(placement)

        $tip
          .remove()
          .css({ top: 0, left: 0, display: 'block' })
          .appendTo(inside ? this.$element : document.body)

        pos = this.getPosition(inside)

        actualWidth = $tip[0].offsetWidth
        actualHeight = $tip[0].offsetHeight

        switch (inside ? placement.split(' ')[1] : placement) {
          case 'bottom':
            tp = {top: pos.top + pos.height, left: pos.left + pos.width / 2 - actualWidth / 2}
            break
          case 'top':
            tp = {top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2}
            break
          case 'left':
            tp = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth}
            break
          case 'right':
            tp = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width}
            break
        }

        $tip
          .css(tp)
          .addClass(placement)
          .addClass('in')
      }
    }

  , isHTML: function(text) {
      // html string detection logic adapted from jQuery
      return typeof text != 'string'
        || ( text.charAt(0) === "<"
          && text.charAt( text.length - 1 ) === ">"
          && text.length >= 3
        ) || /^(?:[^<]*<[\w\W]+>[^>]*$)/.exec(text)
    }

  , setContent: function () {
      var $tip = this.tip()
        , title = this.getTitle()

      $tip.find('.tooltip-inner')[this.isHTML(title) ? 'html' : 'text'](title)
      $tip.removeClass('fade in top bottom left right')
    }

  , hide: function () {
      var that = this
        , $tip = this.tip()

      $tip.removeClass('in')

      function removeWithAnimation() {
        var timeout = setTimeout(function () {
          $tip.off($.support.transition.end).remove()
        }, 500)

        $tip.one($.support.transition.end, function () {
          clearTimeout(timeout)
          $tip.remove()
        })
      }

      $.support.transition && this.$tip.hasClass('fade') ?
        removeWithAnimation() :
        $tip.remove()
    }

  , fixTitle: function () {
      var $e = this.$element
      if ($e.attr('title') || typeof($e.attr('data-original-title')) != 'string') {
        $e.attr('data-original-title', $e.attr('title') || '').removeAttr('title')
      }
    }

  , hasContent: function () {
      return this.getTitle()
    }

  , getPosition: function (inside) {
      return $.extend({}, (inside ? {top: 0, left: 0} : this.$element.offset()), {
        width: this.$element[0].offsetWidth
      , height: this.$element[0].offsetHeight
      })
    }

  , getTitle: function () {
      var title
        , $e = this.$element
        , o = this.options

      title = $e.attr('data-original-title')
        || (typeof o.title == 'function' ? o.title.call($e[0]) :  o.title)

      return title
    }

  , tip: function () {
      return this.$tip = this.$tip || $(this.options.template)
    }

  , validate: function () {
      if (!this.$element[0].parentNode) {
        this.hide()
        this.$element = null
        this.options = null
      }
    }

  , enable: function () {
      this.enabled = true
    }

  , disable: function () {
      this.enabled = false
    }

  , toggleEnabled: function () {
      this.enabled = !this.enabled
    }

  , toggle: function () {
      this[this.tip().hasClass('in') ? 'hide' : 'show']()
    }

  }


 /* TOOLTIP PLUGIN DEFINITION
  * ========================= */

  $.fn.tooltip = function ( option ) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('tooltip')
        , options = typeof option == 'object' && option
      if (!data) $this.data('tooltip', (data = new Tooltip(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.tooltip.Constructor = Tooltip

  $.fn.tooltip.defaults = {
    animation: true
  , placement: 'top'
  , selector: false
  , template: '<div class="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>'
  , trigger: 'hover'
  , title: ''
  , delay: 0
  }

}(window.jQuery);

/* ===========================================================
 * bootstrap-popover.js v2.0.4
 * http://twitter.github.com/bootstrap/javascript.html#popovers
 * ===========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =========================================================== */


!function ($) {

   // jshint ;_;


 /* POPOVER PUBLIC CLASS DEFINITION
  * =============================== */

  var Popover = function ( element, options ) {
    this.init('popover', element, options)
  }


  /* NOTE: POPOVER EXTENDS BOOTSTRAP-TOOLTIP.js
     ========================================== */

  Popover.prototype = $.extend({}, $.fn.tooltip.Constructor.prototype, {

    constructor: Popover

  , setContent: function () {
      var $tip = this.tip()
        , title = this.getTitle()
        , content = this.getContent()

      $tip.find('.popover-title')[this.isHTML(title) ? 'html' : 'text'](title)
      $tip.find('.popover-content > *')[this.isHTML(content) ? 'html' : 'text'](content)

      $tip.removeClass('fade top bottom left right in')
    }

  , hasContent: function () {
      return this.getTitle() || this.getContent()
    }

  , getContent: function () {
      var content
        , $e = this.$element
        , o = this.options

      content = $e.attr('data-content')
        || (typeof o.content == 'function' ? o.content.call($e[0]) :  o.content)

      return content
    }

  , tip: function () {
      if (!this.$tip) {
        this.$tip = $(this.options.template)
      }
      return this.$tip
    }

  })


 /* POPOVER PLUGIN DEFINITION
  * ======================= */

  $.fn.popover = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('popover')
        , options = typeof option == 'object' && option
      if (!data) $this.data('popover', (data = new Popover(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.popover.Constructor = Popover

  $.fn.popover.defaults = $.extend({} , $.fn.tooltip.defaults, {
    placement: 'right'
  , content: ''
  , template: '<div class="popover"><div class="arrow"></div><div class="popover-inner"><h3 class="popover-title"></h3><div class="popover-content"><p></p></div></div></div>'
  })

}(window.jQuery);
/* ==========================================================
 * bootstrap-alert.js v2.0.4
 * http://twitter.github.com/bootstrap/javascript.html#alerts
 * ==========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */


!function ($) {

   // jshint ;_;


 /* ALERT CLASS DEFINITION
  * ====================== */

  var dismiss = '[data-dismiss="alert"]'
    , Alert = function (el) {
        $(el).on('click', dismiss, this.close)
      }

  Alert.prototype.close = function (e) {
    var $this = $(this)
      , selector = $this.attr('data-target')
      , $parent

    if (!selector) {
      selector = $this.attr('href')
      selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
    }

    $parent = $(selector)

    e && e.preventDefault()

    $parent.length || ($parent = $this.hasClass('alert') ? $this : $this.parent())

    $parent.trigger(e = $.Event('close'))

    if (e.isDefaultPrevented()) return

    $parent.removeClass('in')

    function removeElement() {
      $parent
        .trigger('closed')
        .remove()
    }

    $.support.transition && $parent.hasClass('fade') ?
      $parent.on($.support.transition.end, removeElement) :
      removeElement()
  }


 /* ALERT PLUGIN DEFINITION
  * ======================= */

  $.fn.alert = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('alert')
      if (!data) $this.data('alert', (data = new Alert(this)))
      if (typeof option == 'string') data[option].call($this)
    })
  }

  $.fn.alert.Constructor = Alert


 /* ALERT DATA-API
  * ============== */

  $(function () {
    $('body').on('click.alert.data-api', dismiss, Alert.prototype.close)
  })

}(window.jQuery);
/* ============================================================
 * bootstrap-button.js v2.0.4
 * http://twitter.github.com/bootstrap/javascript.html#buttons
 * ============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */


!function ($) {

   // jshint ;_;


 /* BUTTON PUBLIC CLASS DEFINITION
  * ============================== */

  var Button = function (element, options) {
    this.$element = $(element)
    this.options = $.extend({}, $.fn.button.defaults, options)
  }

  Button.prototype.setState = function (state) {
    var d = 'disabled'
      , $el = this.$element
      , data = $el.data()
      , val = $el.is('input') ? 'val' : 'html'

    state = state + 'Text'
    data.resetText || $el.data('resetText', $el[val]())

    $el[val](data[state] || this.options[state])

    // push to event loop to allow forms to submit
    setTimeout(function () {
      state == 'loadingText' ?
        $el.addClass(d).attr(d, d) :
        $el.removeClass(d).removeAttr(d)
    }, 0)
  }

  Button.prototype.toggle = function () {
    var $parent = this.$element.parent('[data-toggle="buttons-radio"]')

    $parent && $parent
      .find('.active')
      .removeClass('active')

    this.$element.toggleClass('active')
  }


 /* BUTTON PLUGIN DEFINITION
  * ======================== */

  $.fn.button = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('button')
        , options = typeof option == 'object' && option
      if (!data) $this.data('button', (data = new Button(this, options)))
      if (option == 'toggle') data.toggle()
      else if (option) data.setState(option)
    })
  }

  $.fn.button.defaults = {
    loadingText: 'loading...'
  }

  $.fn.button.Constructor = Button


 /* BUTTON DATA-API
  * =============== */

  $(function () {
    $('body').on('click.button.data-api', '[data-toggle^=button]', function ( e ) {
      var $btn = $(e.target)
      if (!$btn.hasClass('btn')) $btn = $btn.closest('.btn')
      $btn.button('toggle')
    })
  })

}(window.jQuery);
/* =============================================================
 * bootstrap-collapse.js v2.0.4
 * http://twitter.github.com/bootstrap/javascript.html#collapse
 * =============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */


!function ($) {

   // jshint ;_;


 /* COLLAPSE PUBLIC CLASS DEFINITION
  * ================================ */

  var Collapse = function (element, options) {
    this.$element = $(element)
    this.options = $.extend({}, $.fn.collapse.defaults, options)

    if (this.options.parent) {
      this.$parent = $(this.options.parent)
    }

    this.options.toggle && this.toggle()
  }

  Collapse.prototype = {

    constructor: Collapse

  , dimension: function () {
      var hasWidth = this.$element.hasClass('width')
      return hasWidth ? 'width' : 'height'
    }

  , show: function () {
      var dimension
        , scroll
        , actives
        , hasData

      if (this.transitioning) return

      dimension = this.dimension()
      scroll = $.camelCase(['scroll', dimension].join('-'))
      actives = this.$parent && this.$parent.find('> .accordion-group > .in')

      if (actives && actives.length) {
        hasData = actives.data('collapse')
        if (hasData && hasData.transitioning) return
        actives.collapse('hide')
        hasData || actives.data('collapse', null)
      }

      this.$element[dimension](0)
      this.transition('addClass', $.Event('show'), 'shown')
      this.$element[dimension](this.$element[0][scroll])
    }

  , hide: function () {
      var dimension
      if (this.transitioning) return
      dimension = this.dimension()
      this.reset(this.$element[dimension]())
      this.transition('removeClass', $.Event('hide'), 'hidden')
      this.$element[dimension](0)
    }

  , reset: function (size) {
      var dimension = this.dimension()

      this.$element
        .removeClass('collapse')
        [dimension](size || 'auto')
        [0].offsetWidth

      this.$element[size !== null ? 'addClass' : 'removeClass']('collapse')

      return this
    }

  , transition: function (method, startEvent, completeEvent) {
      var that = this
        , complete = function () {
            if (startEvent.type == 'show') that.reset()
            that.transitioning = 0
            that.$element.trigger(completeEvent)
          }

      this.$element.trigger(startEvent)

      if (startEvent.isDefaultPrevented()) return

      this.transitioning = 1

      this.$element[method]('in')

      $.support.transition && this.$element.hasClass('collapse') ?
        this.$element.one($.support.transition.end, complete) :
        complete()
    }

  , toggle: function () {
      this[this.$element.hasClass('in') ? 'hide' : 'show']()
    }

  }


 /* COLLAPSIBLE PLUGIN DEFINITION
  * ============================== */

  $.fn.collapse = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('collapse')
        , options = typeof option == 'object' && option
      if (!data) $this.data('collapse', (data = new Collapse(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.collapse.defaults = {
    toggle: true
  }

  $.fn.collapse.Constructor = Collapse


 /* COLLAPSIBLE DATA-API
  * ==================== */

  $(function () {
    $('body').on('click.collapse.data-api', '[data-toggle=collapse]', function ( e ) {
      var $this = $(this), href
        , target = $this.attr('data-target')
          || e.preventDefault()
          || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '') //strip for ie7
        , option = $(target).data('collapse') ? 'toggle' : $this.data()
      $(target).collapse(option)
    })
  })

}(window.jQuery);
/* ==========================================================
 * bootstrap-carousel.js v2.0.4
 * http://twitter.github.com/bootstrap/javascript.html#carousel
 * ==========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */


!function ($) {

   // jshint ;_;


 /* CAROUSEL CLASS DEFINITION
  * ========================= */

  var Carousel = function (element, options) {
    this.$element = $(element)
    this.options = options
    this.options.slide && this.slide(this.options.slide)
    this.options.pause == 'hover' && this.$element
      .on('mouseenter', $.proxy(this.pause, this))
      .on('mouseleave', $.proxy(this.cycle, this))
  }

  Carousel.prototype = {

    cycle: function (e) {
      if (!e) this.paused = false
      this.options.interval
        && !this.paused
        && (this.interval = setInterval($.proxy(this.next, this), this.options.interval))
      return this
    }

  , to: function (pos) {
      var $active = this.$element.find('.active')
        , children = $active.parent().children()
        , activePos = children.index($active)
        , that = this

      if (pos > (children.length - 1) || pos < 0) return

      if (this.sliding) {
        return this.$element.one('slid', function () {
          that.to(pos)
        })
      }

      if (activePos == pos) {
        return this.pause().cycle()
      }

      return this.slide(pos > activePos ? 'next' : 'prev', $(children[pos]))
    }

  , pause: function (e) {
      if (!e) this.paused = true
      clearInterval(this.interval)
      this.interval = null
      return this
    }

  , next: function () {
      if (this.sliding) return
      return this.slide('next')
    }

  , prev: function () {
      if (this.sliding) return
      return this.slide('prev')
    }

  , slide: function (type, next) {
      var $active = this.$element.find('.active')
        , $next = next || $active[type]()
        , isCycling = this.interval
        , direction = type == 'next' ? 'left' : 'right'
        , fallback  = type == 'next' ? 'first' : 'last'
        , that = this
        , e = $.Event('slide')

      this.sliding = true

      isCycling && this.pause()

      $next = $next.length ? $next : this.$element.find('.item')[fallback]()

      if ($next.hasClass('active')) return

      if ($.support.transition && this.$element.hasClass('slide')) {
        this.$element.trigger(e)
        if (e.isDefaultPrevented()) return
        $next.addClass(type)
        $next[0].offsetWidth // force reflow
        $active.addClass(direction)
        $next.addClass(direction)
        this.$element.one($.support.transition.end, function () {
          $next.removeClass([type, direction].join(' ')).addClass('active')
          $active.removeClass(['active', direction].join(' '))
          that.sliding = false
          setTimeout(function () { that.$element.trigger('slid') }, 0)
        })
      } else {
        this.$element.trigger(e)
        if (e.isDefaultPrevented()) return
        $active.removeClass('active')
        $next.addClass('active')
        this.sliding = false
        this.$element.trigger('slid')
      }

      isCycling && this.cycle()

      return this
    }

  }


 /* CAROUSEL PLUGIN DEFINITION
  * ========================== */

  $.fn.carousel = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('carousel')
        , options = $.extend({}, $.fn.carousel.defaults, typeof option == 'object' && option)
      if (!data) $this.data('carousel', (data = new Carousel(this, options)))
      if (typeof option == 'number') data.to(option)
      else if (typeof option == 'string' || (option = options.slide)) data[option]()
      else if (options.interval) data.cycle()
    })
  }

  $.fn.carousel.defaults = {
    interval: 5000
  , pause: 'hover'
  }

  $.fn.carousel.Constructor = Carousel


 /* CAROUSEL DATA-API
  * ================= */

  $(function () {
    $('body').on('click.carousel.data-api', '[data-slide]', function ( e ) {
      var $this = $(this), href
        , $target = $($this.attr('data-target') || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')) //strip for ie7
        , options = !$target.data('modal') && $.extend({}, $target.data(), $this.data())
      $target.carousel(options)
      e.preventDefault()
    })
  })

}(window.jQuery);
/* =============================================================
 * bootstrap-typeahead.js v2.0.4
 * http://twitter.github.com/bootstrap/javascript.html#typeahead
 * =============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */


!function($){

   // jshint ;_;


 /* TYPEAHEAD PUBLIC CLASS DEFINITION
  * ================================= */

  var Typeahead = function (element, options) {
    this.$element = $(element)
    this.options = $.extend({}, $.fn.typeahead.defaults, options)
    this.matcher = this.options.matcher || this.matcher
    this.sorter = this.options.sorter || this.sorter
    this.highlighter = this.options.highlighter || this.highlighter
    this.updater = this.options.updater || this.updater
    this.$menu = $(this.options.menu).appendTo('body')
    this.source = this.options.source
    this.shown = false
    this.listen()
  }

  Typeahead.prototype = {

    constructor: Typeahead

  , select: function () {
      var val = this.$menu.find('.active').attr('data-value')
      this.$element
        .val(this.updater(val))
        .change()
      return this.hide()
    }

  , updater: function (item) {
      return item
    }

  , show: function () {
      var pos = $.extend({}, this.$element.offset(), {
        height: this.$element[0].offsetHeight
      })

      this.$menu.css({
        top: pos.top + pos.height
      , left: pos.left
      })

      this.$menu.show()
      this.shown = true
      return this
    }

  , hide: function () {
      this.$menu.hide()
      this.shown = false
      return this
    }

  , lookup: function (event) {
      var that = this
        , items
        , q

      this.query = this.$element.val()

      if (!this.query) {
        return this.shown ? this.hide() : this
      }

      items = $.grep(this.source, function (item) {
        return that.matcher(item)
      })

      items = this.sorter(items)

      if (!items.length) {
        return this.shown ? this.hide() : this
      }

      return this.render(items.slice(0, this.options.items)).show()
    }

  , matcher: function (item) {
      return ~item.toLowerCase().indexOf(this.query.toLowerCase())
    }

  , sorter: function (items) {
      var beginswith = []
        , caseSensitive = []
        , caseInsensitive = []
        , item

      while (item = items.shift()) {
        if (!item.toLowerCase().indexOf(this.query.toLowerCase())) beginswith.push(item)
        else if (~item.indexOf(this.query)) caseSensitive.push(item)
        else caseInsensitive.push(item)
      }

      return beginswith.concat(caseSensitive, caseInsensitive)
    }

  , highlighter: function (item) {
      var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&')
      return item.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
        return '<strong>' + match + '</strong>'
      })
    }

  , render: function (items) {
      var that = this

      items = $(items).map(function (i, item) {
        i = $(that.options.item).attr('data-value', item)
        i.find('a').html(that.highlighter(item))
        return i[0]
      })

      items.first().addClass('active')
      this.$menu.html(items)
      return this
    }

  , next: function (event) {
      var active = this.$menu.find('.active').removeClass('active')
        , next = active.next()

      if (!next.length) {
        next = $(this.$menu.find('li')[0])
      }

      next.addClass('active')
    }

  , prev: function (event) {
      var active = this.$menu.find('.active').removeClass('active')
        , prev = active.prev()

      if (!prev.length) {
        prev = this.$menu.find('li').last()
      }

      prev.addClass('active')
    }

  , listen: function () {
      this.$element
        .on('blur',     $.proxy(this.blur, this))
        .on('keypress', $.proxy(this.keypress, this))
        .on('keyup',    $.proxy(this.keyup, this))

      if ($.browser.webkit || $.browser.msie) {
        this.$element.on('keydown', $.proxy(this.keypress, this))
      }

      this.$menu
        .on('click', $.proxy(this.click, this))
        .on('mouseenter', 'li', $.proxy(this.mouseenter, this))
    }

  , keyup: function (e) {
      switch(e.keyCode) {
        case 40: // down arrow
        case 38: // up arrow
          break

        case 9: // tab
        case 13: // enter
          if (!this.shown) return
          this.select()
          break

        case 27: // escape
          if (!this.shown) return
          this.hide()
          break

        default:
          this.lookup()
      }

      e.stopPropagation()
      e.preventDefault()
  }

  , keypress: function (e) {
      if (!this.shown) return

      switch(e.keyCode) {
        case 9: // tab
        case 13: // enter
        case 27: // escape
          e.preventDefault()
          break

        case 38: // up arrow
          if (e.type != 'keydown') break
          e.preventDefault()
          this.prev()
          break

        case 40: // down arrow
          if (e.type != 'keydown') break
          e.preventDefault()
          this.next()
          break
      }

      e.stopPropagation()
    }

  , blur: function (e) {
      var that = this
      setTimeout(function () { that.hide() }, 150)
    }

  , click: function (e) {
      e.stopPropagation()
      e.preventDefault()
      this.select()
    }

  , mouseenter: function (e) {
      this.$menu.find('.active').removeClass('active')
      $(e.currentTarget).addClass('active')
    }

  }


  /* TYPEAHEAD PLUGIN DEFINITION
   * =========================== */

  $.fn.typeahead = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('typeahead')
        , options = typeof option == 'object' && option
      if (!data) $this.data('typeahead', (data = new Typeahead(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.typeahead.defaults = {
    source: []
  , items: 8
  , menu: '<ul class="typeahead dropdown-menu"></ul>'
  , item: '<li><a href="#"></a></li>'
  }

  $.fn.typeahead.Constructor = Typeahead


 /* TYPEAHEAD DATA-API
  * ================== */

  $(function () {
    $('body').on('focus.typeahead.data-api', '[data-provide="typeahead"]', function (e) {
      var $this = $(this)
      if ($this.data('typeahead')) return
      e.preventDefault()
      $this.typeahead($this.data())
    })
  })

}(window.jQuery);

define("bootstrap", function(){});

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('tool/preview_save_tool',["underscore", "jquery", "backbone", "common/bulk_save", "./tool", "./event_generators", "bootstrap"], function(_, $, Backbone, bulk_save, Tool, EventGenerators) {
    var ButtonEventGenerator, PreviewSaveTool, PreviewSaveToolView, PreviewSaveTools, _ref, _ref1, _ref2;
    ButtonEventGenerator = EventGenerators.ButtonEventGenerator;
    PreviewSaveToolView = (function(_super) {
      __extends(PreviewSaveToolView, _super);

      function PreviewSaveToolView() {
        _ref = PreviewSaveToolView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      PreviewSaveToolView.prototype.initialize = function(options) {
        return PreviewSaveToolView.__super__.initialize.call(this, options);
      };

      PreviewSaveToolView.prototype.eventGeneratorClass = ButtonEventGenerator;

      PreviewSaveToolView.prototype.evgen_options = {
        buttonText: "Preview/Save"
      };

      PreviewSaveToolView.prototype.toolType = "PreviewSaveTool";

      PreviewSaveToolView.prototype.tool_events = {
        activated: "_activated",
        deactivated: "_close_modal"
      };

      PreviewSaveToolView.prototype._activated = function(e) {
        var data_uri, modal,
          _this = this;
        data_uri = this.plot_view.canvas[0].toDataURL();
        this.plot_model.set('png', this.plot_view.canvas[0].toDataURL());
        modal = "<div id='previewModal' class='bokeh'>\n  <div class=\"modal\" role=\"dialog\" aria-labelledby=\"previewLabel\" aria-hidden=\"true\">\n    <div class=\"modal-header\">\n      <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">×</button>\n      <h3 id=\"dataConfirmLabel\">Image Preview (right click to save)</h3></div><div class=\"modal-body\">\n    <div class=\"modal-body\">\n      <img src=\"" + data_uri + "\" style=\"max-height: 300px; max-width: 400px\">\n    </div>\n    </div><div class=\"modal-footer\">\n      <button class=\"btn\" data-dismiss=\"modal\" aria-hidden=\"true\">Close</button>\n    </div>\n  </div>\n</div>";
        $('body').append(modal);
        $('#previewModal .modal').on('hidden', function() {
          return _this.plot_view.eventSink.trigger("clear_active_tool");
        });
        return $('#previewModal > .modal').modal({
          show: true
        });
      };

      PreviewSaveToolView.prototype._close_modal = function() {
        $('#previewModal').remove();
        return $('#previewModal > .modal').remove();
      };

      return PreviewSaveToolView;

    })(Tool.View);
    PreviewSaveTool = (function(_super) {
      __extends(PreviewSaveTool, _super);

      function PreviewSaveTool() {
        _ref1 = PreviewSaveTool.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      PreviewSaveTool.prototype.default_view = PreviewSaveToolView;

      PreviewSaveTool.prototype.type = "PreviewSaveTool";

      PreviewSaveTool.prototype.display_defaults = function() {
        return PreviewSaveTool.__super__.display_defaults.call(this);
      };

      return PreviewSaveTool;

    })(Tool.Model);
    PreviewSaveTools = (function(_super) {
      __extends(PreviewSaveTools, _super);

      function PreviewSaveTools() {
        _ref2 = PreviewSaveTools.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      PreviewSaveTools.prototype.model = PreviewSaveTool;

      return PreviewSaveTools;

    })(Backbone.Collection);
    return {
      "Model": PreviewSaveTool,
      "Collection": new PreviewSaveTools(),
      "View": PreviewSaveToolView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=preview_save_tool.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('tool/embed_tool',["underscore", "backbone", "./tool", "./event_generators"], function(_, Backbone, Tool, EventGenerators) {
    var ButtonEventGenerator, EmbedTool, EmbedToolView, EmbedTools, escapeHTML, _ref, _ref1, _ref2;
    ButtonEventGenerator = EventGenerators.ButtonEventGenerator;
    escapeHTML = function(unsafe_str) {
      return unsafe_str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/\'/g, '&#39;');
    };
    EmbedToolView = (function(_super) {
      __extends(EmbedToolView, _super);

      function EmbedToolView() {
        _ref = EmbedToolView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      EmbedToolView.prototype.initialize = function(options) {
        return EmbedToolView.__super__.initialize.call(this, options);
      };

      EmbedToolView.prototype.eventGeneratorClass = ButtonEventGenerator;

      EmbedToolView.prototype.evgen_options = {
        buttonText: "Embed Html"
      };

      EmbedToolView.prototype.toolType = "EmbedTool";

      EmbedToolView.prototype.tool_events = {
        activated: "_activated",
        deactivated: "_close_modal"
      };

      EmbedToolView.prototype._activated = function(e) {
        var baseurl, doc_apikey, doc_id, modal, model_id, script_inject_escaped,
          _this = this;
        console.log("EmbedToolView._activated");
        window.tool_view = this;
        model_id = this.plot_model.get('id');
        doc_id = this.plot_model.get('doc');
        doc_apikey = this.plot_model.get('docapikey');
        baseurl = this.plot_model.get('baseurl');
        script_inject_escaped = escapeHTML(this.plot_model.get('script_inject_snippet'));
        modal = "<div id=\"embedModal\" class=\"bokeh\">\n  <div  class=\"modal\" role=\"dialog\" aria-labelledby=\"embedLabel\" aria-hidden=\"true\">\n    <div class=\"modal-header\">\n      <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">×</button>\n      <h3 id=\"dataConfirmLabel\"> HTML Embed code</h3></div><div class=\"modal-body\">\n      <div class=\"modal-body\">\n        " + script_inject_escaped + "\n      </div>\n    </div>\n    <div class=\"modal-footer\">\n      <button class=\"btn\" data-dismiss=\"modal\" aria-hidden=\"true\">Close</button>\n    </div>\n  </div>\n</div>";
        $('body').append(modal);
        $('#embedModal > .modal').on('hidden', function() {
          return _this.plot_view.eventSink.trigger("clear_active_tool");
        });
        return $('#embedModal > .modal').modal({
          show: true
        });
      };

      EmbedToolView.prototype._close_modal = function() {
        $('#embedModal').remove();
        return $('#embedModal > .modal').remove();
      };

      return EmbedToolView;

    })(Tool.View);
    EmbedTool = (function(_super) {
      __extends(EmbedTool, _super);

      function EmbedTool() {
        _ref1 = EmbedTool.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      EmbedTool.prototype.default_view = EmbedToolView;

      EmbedTool.prototype.type = "EmbedTool";

      return EmbedTool;

    })(Tool.Model);
    EmbedTools = (function(_super) {
      __extends(EmbedTools, _super);

      function EmbedTools() {
        _ref2 = EmbedTools.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      EmbedTools.prototype.model = EmbedTool;

      EmbedTools.prototype.display_defaults = function() {
        return EmbedTools.__super__.display_defaults.call(this);
      };

      return EmbedTools;

    })(Backbone.Collection);
    return {
      "Model": EmbedTool,
      "Collection": new EmbedTools(),
      "View": EmbedToolView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=embed_tool.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('widget/data_slider',["common/plot_widget", "common/has_parent"], function(PlotWidget, HasParent) {
    var DataSlider, DataSliderView, DataSliders, _ref, _ref1, _ref2;
    DataSliderView = (function(_super) {
      __extends(DataSliderView, _super);

      function DataSliderView() {
        _ref = DataSliderView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      DataSliderView.prototype.attributes = {
        "class": "dataslider pull-left"
      };

      DataSliderView.prototype.initialize = function(options) {
        DataSliderView.__super__.initialize.call(this, options);
        this.render_init();
        return this.select = _.throttle(this._select, 50);
      };

      DataSliderView.prototype.delegateEvents = function(events) {
        DataSliderView.__super__.delegateEvents.call(this, events);
        return "pass";
      };

      DataSliderView.prototype.label = function(min, max) {
        this.$(".minlabel").text(min);
        return this.$(".maxlabel").text(max);
      };

      DataSliderView.prototype.render_init = function() {
        var column, max, min, _ref1,
          _this = this;
        this.$el.html("");
        this.$el.append("<div class='maxlabel'></div>");
        this.$el.append("<div class='slider'></div>");
        this.$el.append("<div class='minlabel'></div>");
        this.plot_view.$(".plotarea").append(this.$el);
        column = this.mget_obj('data_source').getcolumn(this.mget('field'));
        _ref1 = [_.min(column), _.max(column)], min = _ref1[0], max = _ref1[1];
        this.$el.find(".slider").slider({
          orientation: "vertical",
          animate: "fast",
          step: (max - min) / 50.0,
          min: min,
          max: max,
          values: [min, max],
          slide: function(event, ui) {
            _this.set_selection_range(event, ui);
            return _this.select(event, ui);
          }
        });
        this.label(min, max);
        return this.$el.find(".slider").height(this.plot_view.view_state.get('inner_height'));
      };

      DataSliderView.prototype.set_selection_range = function(event, ui) {
        var data_source, field, max, min;
        min = _.min(ui.values);
        max = _.max(ui.values);
        this.label(min, max);
        data_source = this.mget_obj('data_source');
        field = this.mget('field');
        if (data_source.range_selections == null) {
          data_source.range_selections = {};
        }
        return data_source.range_selections[field] = [min, max];
      };

      DataSliderView.prototype._select = function() {
        var colname, columns, data_source, i, max, min, numrows, select, selected, val, value, _i, _ref1, _ref2;
        data_source = this.mget_obj('data_source');
        columns = {};
        numrows = 0;
        _ref1 = data_source.range_selections;
        for (colname in _ref1) {
          if (!__hasProp.call(_ref1, colname)) continue;
          value = _ref1[colname];
          columns[colname] = data_source.getcolumn(colname);
          numrows = columns[colname].length;
        }
        selected = [];
        for (i = _i = 0; 0 <= numrows ? _i < numrows : _i > numrows; i = 0 <= numrows ? ++_i : --_i) {
          select = true;
          _ref2 = data_source.range_selections;
          for (colname in _ref2) {
            if (!__hasProp.call(_ref2, colname)) continue;
            value = _ref2[colname];
            min = value[0], max = value[1];
            val = columns[colname][i];
            if (val < min || val > max) {
              select = false;
              break;
            }
          }
          if (select) {
            selected.push(i);
          }
        }
        return data_source.save({
          selected: selected
        }, {
          patch: true
        });
      };

      return DataSliderView;

    })(PlotWidget);
    DataSlider = (function(_super) {
      __extends(DataSlider, _super);

      function DataSlider() {
        _ref1 = DataSlider.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      DataSlider.prototype.type = "DataSlider";

      DataSlider.prototype.default_view = DataSliderView;

      DataSlider.prototype.defaults = function() {
        return {
          data_source: null,
          field: null
        };
      };

      DataSlider.prototype.display_defaults = function() {
        return {
          level: 'tool'
        };
      };

      return DataSlider;

    })(HasParent);
    DataSliders = (function(_super) {
      __extends(DataSliders, _super);

      function DataSliders() {
        _ref2 = DataSliders.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      DataSliders.prototype.model = DataSlider;

      return DataSliders;

    })(Backbone.Collection);
    return {
      "Model": DataSlider,
      "Collection": new DataSliders()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=data_slider.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('widget/pandas/ipython_remote_data',["backbone", "common/has_properties"], function(Backbone, HasProperties) {
    var IPythonRemoteData, IPythonRemoteDatas, _ref, _ref1;
    IPythonRemoteData = (function(_super) {
      __extends(IPythonRemoteData, _super);

      function IPythonRemoteData() {
        _ref = IPythonRemoteData.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      IPythonRemoteData.prototype.type = 'IPythonRemoteData';

      IPythonRemoteData.prototype.defaults = {
        computed_columns: []
      };

      return IPythonRemoteData;

    })(HasProperties);
    IPythonRemoteDatas = (function(_super) {
      __extends(IPythonRemoteDatas, _super);

      function IPythonRemoteDatas() {
        _ref1 = IPythonRemoteDatas.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      IPythonRemoteDatas.prototype.model = IPythonRemoteData;

      return IPythonRemoteDatas;

    })(Backbone.Collection);
    return {
      "Model": IPythonRemoteData,
      "Collection": new IPythonRemoteDatas()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=ipython_remote_data.js.map
*/;
define('widget/pandas/pandas_pivot_template',[],function(){
  var template = function(__obj) {
  var _safe = function(value) {
    if (typeof value === 'undefined' && value == null)
      value = '';
    var result = new String(value);
    result.ecoSafe = true;
    return result;
  };
  return (function() {
    var __out = [], __self = this, _print = function(value) {
      if (typeof value !== 'undefined' && value != null)
        __out.push(value.ecoSafe ? value : __self.escape(value));
    }, _capture = function(callback) {
      var out = __out, result;
      __out = [];
      callback.call(this);
      result = __out.join('');
      __out = out;
      return _safe(result);
    };
    (function() {
      var column, computed_column, idx, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3;
    
      _print(_safe('<form class="form-inline tablecontrolform">\n<label>Transform </label>:  <select class="tablecontrolstate">\n    <option value="groupby" selected="selected">Group By</option>\n    <option value="filtering">Filtering</option>\n    <option value="computed">Computed Columns</option>\n  </select>\n  <br/>\n  '));
    
      if (this.tablecontrolstate === 'groupby') {
        _print(_safe('\n  <label>GroupBy </label>\n  <input type="text" class="pandasgroup" value="'));
        _print(this.group);
        _print(_safe('"/>\n  <label>Aggregation</label>\n  <select class="pandasagg">\n    <option value="sum">sum</option>\n    <option value="mean">mean</option>\n    <option value="std">std</option>\n    <option value="max">max</option>\n    <option value="min">min</option>\n  </select>\n  '));
      }
    
      _print(_safe('\n  '));
    
      if (this.tablecontrolstate === 'filtering') {
        _print(_safe('\n  <label class="checkbox" >\n    '));
        if (this.filterselected) {
          _print(_safe('\n    <input type="checkbox" class="filterselected" checked="checked"/>\n    '));
        } else {
          _print(_safe('\n    <input type="checkbox" class="filterselected"/>\n    '));
        }
        _print(_safe('\n    Filter Selection\n  </label>\n  <input type="button" class="clearselected btn btn-mini" value="Clear Selection"/>\n  <label>\n    Search\n  </label>\n  <input type="text" class="search input-large"/>\n  '));
      }
    
      _print(_safe('\n  \n  '));
    
      if (this.tablecontrolstate === 'computed') {
        _print(_safe('\n  <table class="table">\n    <thead>\n      <th>\n        Name\n      </th>\n      <th>\n        Value\n      </th>\n      <th>\n      </th>\n    </thead>\n    '));
        _ref = this.computed_columns;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          computed_column = _ref[_i];
          _print(_safe('\n    <tr>\n      <td>\n        '));
          _print(computed_column.name);
          _print(_safe('\n      </td>\n      <td>\n        '));
          _print(computed_column.code);
          _print(_safe('\n      </td>\n      <td>\n        <a class="column_del" \n           name="'));
          _print(computed_column.name);
          _print(_safe('" href="#">[delete]</a>\n      </td>\n    </tr>\n    '));
        }
        _print(_safe('\n    <tr>\n      <td>\n        <input type="text" class="computedname input-mini"/>\n      </td>\n      <td>\n        <input type="text" class="computedtxtbox input-medium"/>\n      </td>\n      <td>\n      </td>\n    </tr>\n  </table>\n  '));
      }
    
      _print(_safe('\n  \n</form>\n\n<table class="bokehdatatable table table-bordered"\n'));
    
      if (this.width) {
        _print(_safe('\n       style="max-height:'));
        _print(this.height);
        _print(_safe('px;max-width:'));
        _print(this.width);
        _print(_safe('px"\n'));
      } else {
        _print(_safe('\n       style="max-height:'));
        _print(this.height);
        _print(_safe('px"\n'));
      }
    
      _print(_safe('\n       >\n  <thead>\n    '));
    
      if (this.counts) {
        _print(_safe('\n    <th>counts</th>\n    '));
      }
    
      _print(_safe('\n    <th>index</th>\n    '));
    
      _ref1 = this.columns;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        column = _ref1[_j];
        _print(_safe('\n    '));
        if (!this.skip[column]) {
          _print(_safe('\n    <th><a class="pandascolumn">'));
          _print(column);
          _print(_safe('</a>\n      \n      '));
          if (this.sort_ascendings[column] === true) {
            _print(_safe('\n      <i class="icon-caret-up"></i>\n      '));
          } else if (this.sort_ascendings[column] === false) {
            _print(_safe('\n      <i class="icon-caret-down"></i>\n      '));
          }
          _print(_safe('\n      \n      '));
        }
        _print(_safe('\n    </th>\n    '));
      }
    
      _print(_safe('\n  </thead>\n  '));
    
      _ref2 = _.range(this.length);
      for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
        idx = _ref2[_k];
        _print(_safe('\n  <tr class="pandasrow" rownum="'));
        _print(idx);
        _print(_safe('">\n    '));
        if (this.selected && this.selected[idx]) {
          _print(_safe('\n      <td style="background-color:'));
          _print(this.colors[idx]);
          _print(_safe('"> \n        '));
          _print(this.selected[idx]);
          _print(_safe('/'));
          _print(this.counts[idx]);
          _print(_safe('\n      </td>      \n    '));
        } else {
          _print(_safe('\n      <td> '));
          _print(this.counts[idx]);
          _print(_safe(' </td>\n    '));
        }
        _print(_safe('\n    <td> '));
        _print(this.index[idx]);
        _print(_safe(' </td>\n    '));
        _ref3 = this.columns;
        for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
          column = _ref3[_l];
          _print(_safe('\n      '));
          if (!this.skip[column]) {
            _print(_safe('    \n      <td> '));
            _print(this.data[column][idx]);
            _print(_safe(' </td>\n      '));
          }
          _print(_safe('\n    '));
        }
        _print(_safe('\n  </tr>\n  '));
      }
    
      _print(_safe('\n</table>\n<form>\n  <center>\n    <div class="btn-group pagination">\n      <button class="btn btn-mini">First</button>\n      <button class="btn btn-mini">Previous</button>\n      <button class="btn btn-mini">Next</button>\n      <button class="btn btn-mini">Last</button>  \n    </div>\n    <div class="paginatedisplay">\n      Show <input type="text" class="pandassize" value="'));
    
      _print(this.length);
    
      _print(_safe('"> records\n      From <input type="text" class="pandasoffset" value="'));
    
      _print(this.offset);
    
      _print(_safe('">\n      to '));
    
      _print(this.length + this.offset);
    
      _print(_safe(' - \n      Total : '));
    
      _print(this.totallength);
    
      _print(_safe('\n    </div>\n  </center>\n</form>\n'));
    
    }).call(this);
    
    return __out.join('');
  }).call((function() {
    var obj = {
      escape: function(value) {
        return ('' + value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      },
      safe: _safe
    }, key;
    for (key in __obj) obj[key] = __obj[key];
    return obj;
  })());
};
  return template;
});

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('widget/pandas/pandas_pivot_table',["underscore", "backbone", "common/has_parent", "common/continuum_view", "./pandas_pivot_template"], function(_, Backbone, HasParent, ContinuumView, pandaspivot) {
    var ENTER, PandasPivotTable, PandasPivotTables, PandasPivotView, _ref, _ref1, _ref2;
    ENTER = 13;
    PandasPivotView = (function(_super) {
      __extends(PandasPivotView, _super);

      function PandasPivotView() {
        this.colors = __bind(this.colors, this);
        this.pandasend = __bind(this.pandasend, this);
        this.pandasnext = __bind(this.pandasnext, this);
        this.pandasback = __bind(this.pandasback, this);
        this.pandasbeginning = __bind(this.pandasbeginning, this);
        this.toggle_more_controls = __bind(this.toggle_more_controls, this);
        this.sort = __bind(this.sort, this);
        this.rowclick = __bind(this.rowclick, this);
        this.toggle_filterselected = __bind(this.toggle_filterselected, this);
        this.clearselected = __bind(this.clearselected, this);
        this.computedtxtbox = __bind(this.computedtxtbox, this);
        this.column_del = __bind(this.column_del, this);
        this.search = __bind(this.search, this);
        _ref = PandasPivotView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      PandasPivotView.prototype.template = pandaspivot;

      PandasPivotView.prototype.initialize = function(options) {
        PandasPivotView.__super__.initialize.call(this, options);
        this.listenTo(this.model, 'destroy', this.remove);
        this.listenTo(this.model, 'change', this.render);
        return this.render();
      };

      PandasPivotView.prototype.events = {
        "keyup .pandasgroup": 'pandasgroup',
        "keyup .pandasoffset": 'pandasoffset',
        "keyup .pandassize": 'pandassize',
        "change .pandasagg": 'pandasagg',
        "change .tablecontrolstate": 'tablecontrolstate',
        "click .pandasbeginning": 'pandasbeginning',
        "click .pandasback": 'pandasback',
        "click .pandasnext": 'pandasnext',
        "click .pandasend": 'pandasend',
        "click .controlsmore": 'toggle_more_controls',
        "click .pandascolumn": 'sort',
        "click .pandasrow": 'rowclick',
        "click .filterselected": 'toggle_filterselected',
        "click .clearselected": 'clearselected',
        "keyup .computedtxtbox": 'computedtxtbox',
        "click .column_del": "column_del",
        "keyup .search": 'search'
      };

      PandasPivotView.prototype.search = function(e) {
        var code, source;
        if (e.keyCode === ENTER) {
          code = $(e.currentTarget).val();
          source = this.model.get_obj('source');
          source.rpc('search', [code]);
          return e.preventDefault();
        }
      };

      PandasPivotView.prototype.column_del = function(e) {
        var computed_columns, name, old, source;
        source = this.model.get_obj('source');
        old = source.get('computed_columns');
        name = $(e.currentTarget).attr('name');
        computed_columns = _.filter(old, function(x) {
          return x.name !== name;
        });
        return source.rpc('set_computed_columns', [computed_columns]);
      };

      PandasPivotView.prototype.computedtxtbox = function(e) {
        var code, name, old, source;
        if (e.keyCode === ENTER) {
          name = this.$('.computedname').val();
          code = this.$('.computedtxtbox').val();
          source = this.model.get_obj('source');
          old = source.get('computed_columns');
          old.push({
            name: name,
            code: code
          });
          source.rpc('set_computed_columns', [old]);
          return e.preventDefault();
        }
      };

      PandasPivotView.prototype.clearselected = function(e) {
        return this.model.rpc('setselect', [[]]);
      };

      PandasPivotView.prototype.toggle_filterselected = function(e) {
        var checked;
        checked = this.$('.filterselected').is(":checked");
        this.mset('filterselected', checked);
        return this.model.save();
      };

      PandasPivotView.prototype.rowclick = function(e) {
        var count, counts, idx, index, ratio, ratios, resp, rownum, select, selected;
        counts = this.counts();
        selected = this.selected();
        ratios = (function() {
          var _i, _len, _ref1, _ref2, _results;
          _ref1 = _.zip(selected, counts);
          _results = [];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            _ref2 = _ref1[_i], select = _ref2[0], count = _ref2[1];
            _results.push(select / count);
          }
          return _results;
        })();
        selected = (function() {
          var _i, _len, _results;
          _results = [];
          for (idx = _i = 0, _len = ratios.length; _i < _len; idx = ++_i) {
            ratio = ratios[idx];
            if (ratio > 0.5) {
              _results.push(idx);
            }
          }
          return _results;
        })();
        rownum = Number($(e.currentTarget).attr('rownum'));
        index = selected.indexOf(rownum);
        if (index === -1) {
          resp = this.model.rpc('select', [[rownum]]);
        } else {
          resp = this.model.rpc('deselect', [[rownum]]);
        }
        return null;
      };

      PandasPivotView.prototype.sort = function(e) {
        var colname;
        colname = $(e.currentTarget).text();
        return this.model.toggle_column_sort(colname);
      };

      PandasPivotView.prototype.toggle_more_controls = function() {
        if (this.controls_hide) {
          this.controls_hide = false;
        } else {
          this.controls_hide = true;
        }
        return this.render();
      };

      PandasPivotView.prototype.pandasbeginning = function() {
        return this.model.go_beginning();
      };

      PandasPivotView.prototype.pandasback = function() {
        return this.model.go_back();
      };

      PandasPivotView.prototype.pandasnext = function() {
        return this.model.go_forward();
      };

      PandasPivotView.prototype.pandasend = function() {
        return this.model.go_end();
      };

      PandasPivotView.prototype.pandasoffset = function(e) {
        var offset;
        if (e.keyCode === ENTER) {
          offset = this.$el.find('.pandasoffset').val();
          offset = Number(offset);
          if (_.isNaN(offset)) {
            offset = this.model.defaults.offset;
          }
          this.model.save('offset', offset, {
            wait: true
          });
          return e.preventDefault();
        }
      };

      PandasPivotView.prototype.pandassize = function(e) {
        var size, sizetxt;
        if (e.keyCode === ENTER) {
          sizetxt = this.$el.find('.pandassize').val();
          size = Number(sizetxt);
          if (_.isNaN(size) || sizetxt === "") {
            size = this.model.defaults.length;
          }
          if (size + this.mget('offset') > this.mget('maxlength')) {
            size = this.mget('maxlength') - this.mget('offset');
          }
          this.model.save('length', size, {
            wait: true
          });
          return e.preventDefault();
        }
      };

      PandasPivotView.prototype.tablecontrolstate = function() {
        return this.mset('tablecontrolstate', this.$('.tablecontrolstate').val());
      };

      PandasPivotView.prototype.pandasagg = function() {
        return this.model.save('agg', this.$el.find('.pandasagg').val(), {
          'wait': true
        });
      };

      PandasPivotView.prototype.fromcsv = function(str) {
        if (!str) {
          return [];
        }
        return _.map(str.split(","), function(x) {
          return x.trim();
        });
      };

      PandasPivotView.prototype.pandasgroup = function(e) {
        if (e.keyCode === ENTER) {
          this.model.set({
            group: this.fromcsv(this.$el.find(".pandasgroup").val()),
            offset: 0
          });
          this.model.save();
          e.preventDefault();
          return false;
        }
      };

      PandasPivotView.prototype.counts = function() {
        return this.mget('tabledata').data._counts;
      };

      PandasPivotView.prototype.selected = function() {
        return this.mget('tabledata').data._selected;
      };

      PandasPivotView.prototype.colors = function() {
        var counts, selected;
        counts = this.counts();
        selected = this.selected();
        if (counts && selected) {
          return _.map(_.zip(counts, selected), function(temp) {
            var alpha, count;
            count = temp[0], selected = temp[1];
            alpha = 0.3 * selected / count;
            return "rgba(0,0,255," + alpha + ")";
          });
        } else {
          return null;
        }
      };

      PandasPivotView.prototype.render = function() {
        var colors, group, html, obj, sort, sort_ascendings, source, template_data, _i, _len, _ref1;
        group = this.mget('group');
        if (_.isArray(group)) {
          group = group.join(",");
        }
        sort = this.mget('sort');
        if (_.isArray(sort)) {
          sort = sort.join(",");
        }
        colors = this.colors();
        sort_ascendings = {};
        _ref1 = this.mget('sort');
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          obj = _ref1[_i];
          sort_ascendings[obj['column']] = obj['ascending'];
        }
        source = this.mget_obj('source');
        template_data = {
          skip: {
            _counts: true,
            _selected: true,
            index: true
          },
          tablecontrolstate: this.mget('tablecontrolstate'),
          computed_columns: this.mget_obj('source').get('computed_columns'),
          columns: this.mget('tabledata').column_names,
          data: this.mget('tabledata').data,
          group: group,
          sort_ascendings: sort_ascendings,
          height: this.mget('height'),
          width: this.mget('width'),
          offset: this.mget('offset'),
          length: this.model.length(),
          filterselected: this.mget('filterselected'),
          totallength: this.mget('totallength'),
          counts: this.mget('tabledata').data._counts,
          selected: this.mget('tabledata').data._selected,
          controls_hide: this.controls_hide,
          colors: colors,
          index: this.mget('tabledata').data.index
        };
        this.$el.empty();
        html = this.template(template_data);
        this.$el.html(html);
        this.$(".pandasagg").find("option[value=\"" + (this.mget('agg')) + "\"]").attr('selected', 'selected');
        this.$(".tablecontrolstate").find("option[value=\"" + (this.mget('tablecontrolstate')) + "\"]").attr('selected', 'selected');
        return this.$el.addClass("bokehtable");
      };

      return PandasPivotView;

    })(ContinuumView.View);
    PandasPivotTable = (function(_super) {
      __extends(PandasPivotTable, _super);

      function PandasPivotTable() {
        this.toggle_column_sort = __bind(this.toggle_column_sort, this);
        this.dinitialize = __bind(this.dinitialize, this);
        _ref1 = PandasPivotTable.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      PandasPivotTable.prototype.type = 'PandasPivotTable';

      PandasPivotTable.prototype.initialize = function(attrs, options) {
        var _this = this;
        PandasPivotTable.__super__.initialize.call(this, attrs, options);
        return this.throttled_fetch = _.throttle((function() {
          return _this.fetch();
        }), 500);
      };

      PandasPivotTable.prototype.dinitialize = function(attrs, options) {
        return PandasPivotTable.__super__.dinitialize.call(this, attrs, options);
      };

      PandasPivotTable.prototype.fetch = function(options) {
        return PandasPivotTable.__super__.fetch.call(this, options);
      };

      PandasPivotTable.prototype.length = function() {
        return _.values(this.get('tabledata').data)[0].length;
      };

      PandasPivotTable.prototype.toggle_column_sort = function(colname) {
        var sort, sorting;
        sorting = this.get('sort');
        this.unset('sort', {
          'silent': true
        });
        sort = _.filter(sorting, function(x) {
          return x['column'] === colname;
        });
        if (sort.length > 0) {
          sort = sort[0];
        } else {
          sorting = _.clone(sorting);
          sorting.push({
            column: colname,
            ascending: true
          });
          this.save('sort', sorting, {
            'wait': true
          });
          return;
        }
        if (sort['ascending']) {
          sort['ascending'] = false;
          this.save('sort', sorting, {
            'wait': true
          });
        } else {
          sorting = _.filter(sorting, function(x) {
            return x['column'] !== colname;
          });
          this.save('sort', sorting, {
            'wait': true
          });
        }
      };

      PandasPivotTable.prototype.go_beginning = function() {
        this.set('offset', 0);
        return this.save();
      };

      PandasPivotTable.prototype.go_back = function() {
        var offset;
        offset = this.get('offset');
        offset = offset - this.length();
        if (offset < 0) {
          offset = 0;
        }
        this.set('offset', offset);
        return this.save();
      };

      PandasPivotTable.prototype.go_forward = function() {
        var maxoffset, offset;
        offset = this.get('offset');
        offset = offset + this.length();
        maxoffset = this.get('maxlength') - this.length();
        if (offset > maxoffset) {
          offset = maxoffset;
        }
        this.set('offset', offset);
        return this.save();
      };

      PandasPivotTable.prototype.go_end = function() {
        var maxoffset;
        maxoffset = this.get('maxlength') - this.length();
        this.set('offset', maxoffset);
        return this.save();
      };

      PandasPivotTable.prototype.default_view = PandasPivotView;

      PandasPivotTable.prototype.defaults = function() {
        return {
          sort: [],
          group: [],
          agg: 'sum',
          offset: 0,
          length: 100,
          maxlength: 1000,
          tabledata: null,
          columns_names: [],
          width: null,
          tablecontrolstate: 'groupby'
        };
      };

      return PandasPivotTable;

    })(HasParent);
    PandasPivotTables = (function(_super) {
      __extends(PandasPivotTables, _super);

      function PandasPivotTables() {
        _ref2 = PandasPivotTables.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      PandasPivotTables.prototype.model = PandasPivotTable;

      return PandasPivotTables;

    })(Backbone.Collection);
    return {
      "Model": PandasPivotTable,
      "Collection": new PandasPivotTables(),
      "View": PandasPivotView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=pandas_pivot_table.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('widget/pandas/pandas_plot_source',["backbone", "source/column_data_source"], function(Backbone, ColumnDataSource) {
    var PandasPlotSource, PandasPlotSources, _ref, _ref1;
    PandasPlotSource = (function(_super) {
      __extends(PandasPlotSource, _super);

      function PandasPlotSource() {
        _ref = PandasPlotSource.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      PandasPlotSource.prototype.type = 'PandasPlotSource';

      return PandasPlotSource;

    })(ColumnDataSource.Model);
    PandasPlotSources = (function(_super) {
      __extends(PandasPlotSources, _super);

      function PandasPlotSources() {
        _ref1 = PandasPlotSources.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      PandasPlotSources.prototype.model = PandasPlotSource;

      return PandasPlotSources;

    })(Backbone.Collection);
    return {
      "Model": PandasPlotSource,
      "Collection": new PandasPlotSources()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=pandas_plot_source.js.map
*/;
(function() {
  define('common/base',["underscore", "require", "common/custom", "common/plot", "common/gmap_plot", "common/grid_plot", "common/plot_context", "range/range1d", "range/data_range1d", "range/factor_range", "range/data_factor_range", "renderer/glyph/glyph_factory", "renderer/guide/linear_axis", "renderer/guide/datetime_axis", "renderer/guide/grid", "renderer/annotation/legend", "renderer/overlay/box_selection", "source/object_array_data_source", "source/column_data_source", "tool/pan_tool", "tool/wheel_zoom_tool", "tool/resize_tool", "tool/crosshair_tool", "tool/box_select_tool", "tool/data_range_box_select_tool", "tool/preview_save_tool", "tool/embed_tool", "widget/data_slider", "widget/pandas/ipython_remote_data", "widget/pandas/pandas_pivot_table", "widget/pandas/pandas_plot_source"], function(_, require) {
    var Collections, Config, locations, mod_cache;
    require("common/custom").monkey_patch();
    Config = {
      prefix: ''
    };
    locations = {
      Plot: 'common/plot',
      GMapPlot: 'common/gmap_plot',
      GridPlot: 'common/grid_plot',
      CDXPlotContext: 'common/plot_context',
      PlotContext: 'common/plot_context',
      PlotList: 'common/plot_context',
      Range1d: 'range/range1d',
      DataRange1d: 'range/data_range1d',
      FactorRange: 'range/factor_range',
      DataFactorRange: 'range/data_factor_range',
      Glyph: 'renderer/glyph/glyph_factory',
      LinearAxis: 'renderer/guide/linear_axis',
      DatetimeAxis: 'renderer/guide/datetime_axis',
      Grid: 'renderer/guide/grid',
      Legend: 'renderer/annotation/legend',
      BoxSelection: 'renderer/overlay/box_selection',
      ObjectArrayDataSource: 'source/object_array_data_source',
      ColumnDataSource: 'source/column_data_source',
      PanTool: 'tool/pan_tool',
      WheelZoomTool: 'tool/wheel_zoom_tool',
      ResizeTool: 'tool/resize_tool',
      CrosshairTool: 'tool/crosshair_tool',
      BoxSelectTool: 'tool/box_select_tool',
      DataRangeBoxSelectTool: 'tool/data_range_box_select_tool',
      PreviewSaveTool: 'tool/preview_save_tool',
      EmbedTool: 'tool/embed_tool',
      DataSlider: 'widget/data_slider',
      IPythonRemoteData: 'widget/pandas/ipython_remote_data',
      PandasPivotTable: 'widget/pandas/pandas_pivot_table',
      PandasPlotSource: 'widget/pandas/pandas_plot_source'
    };
    mod_cache = {};
    Collections = function(typename) {
      var modulename;
      if (!locations[typename]) {
        throw "./base: Unknown Collection " + typename;
      }
      modulename = locations[typename];
      if (mod_cache[modulename] == null) {
        console.log("calling require", modulename);
        mod_cache[modulename] = require(modulename);
      }
      return mod_cache[modulename].Collection;
    };
    return {
      "mod_cache": mod_cache,
      "locations": locations,
      "Collections": Collections,
      "Config": Config
    };
  });

}).call(this);

/*
//@ sourceMappingURL=base.js.map
*/;
(function() {
  define('common/plotting',["underscore", "jquery", "./plot", "range/data_range1d", "range/range1d", "renderer/annotation/legend", "renderer/glyph/glyph_factory", "renderer/guide/linear_axis", "renderer/guide/grid", "renderer/overlay/box_selection", "source/column_data_source", "tool/box_select_tool", "tool/pan_tool", "tool/preview_save_tool", "tool/resize_tool", "tool/wheel_zoom_tool", "renderer/guide/datetime_axis"], function(_, $, Plot, DataRange1d, Range1d, Legend, GlyphFactory, LinearAxis, Grid, BoxSelection, ColumnDataSource, BoxSelectTool, PanTool, PreviewSaveTool, ResizeTool, WheelZoomTool, DatetimeAxis) {
    var add_axes, add_grids, add_legend, add_tools, create_glyphs, create_range, create_sources, make_plot, show;
    create_sources = function(data) {
      var d, sources, _i, _len;
      if (!_.isArray(data)) {
        data = [data];
      }
      sources = [];
      for (_i = 0, _len = data.length; _i < _len; _i++) {
        d = data[_i];
        if (d instanceof ColumnDataSource.Model) {
          sources.push(d);
        } else {
          sources.push(ColumnDataSource.Collection.create({
            data: d
          }));
        }
      }
      return sources;
    };
    create_range = function(range, sources, columns) {
      var s;
      if (range === 'auto') {
        return DataRange1d.Collection.create({
          sources: (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = sources.length; _i < _len; _i++) {
              s = sources[_i];
              _results.push({
                ref: s.ref(),
                columns: columns
              });
            }
            return _results;
          })()
        });
      } else if (range instanceof Range1d.Model) {
        return range;
      } else {
        return Range1d.Collection.create({
          start: range[0],
          end: range[1]
        });
      }
    };
    create_glyphs = function(plot, glyphspecs, sources, nonselection_glyphspecs) {
      var glyph, glyphs, non_spec, source, spec, val, x, _i, _len, _ref;
      glyphs = [];
      if (!_.isArray(glyphspecs)) {
        glyphspecs = [glyphspecs];
      }
      if (sources.length === 1) {
        sources = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = glyphspecs.length; _i < _len; _i++) {
            x = glyphspecs[_i];
            _results.push(sources[0]);
          }
          return _results;
        })();
      }
      if (nonselection_glyphspecs == null) {
        nonselection_glyphspecs = {
          fill_alpha: 0.1,
          line_alpha: 0.1
        };
      }
      if (!_.isArray(nonselection_glyphspecs)) {
        nonselection_glyphspecs = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = glyphspecs.length; _i < _len; _i++) {
            x = glyphspecs[_i];
            _results.push(nonselection_glyphspecs);
          }
          return _results;
        })();
      }
      _ref = _.zip(glyphspecs, nonselection_glyphspecs, sources);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        val = _ref[_i];
        spec = val[0], non_spec = val[1], source = val[2];
        glyph = GlyphFactory.Collection.create({
          parent: plot.ref(),
          data_source: source.ref(),
          glyphspec: spec,
          nonselection_glyphspec: non_spec
        });
        glyphs.push(glyph);
      }
      return glyphs;
    };
    add_axes = function(plot, xaxes, yaxes) {
      var a, axes, axis, loc, _i, _j, _k, _len, _len1, _len2, _ref;
      axes = [];
      if (xaxes) {
        if (xaxes === true) {
          xaxes = ['min', 'max'];
        }
        if (!_.isArray(xaxes)) {
          xaxes = [xaxes];
        }
        if (xaxes[0] === "datetime") {
          _ref = ['min', 'max'];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            loc = _ref[_i];
            axis = DatetimeAxis.Collection.create({
              dimension: 0,
              axis_label: 'x',
              location: loc,
              parent: plot.ref(),
              plot: plot.ref()
            });
            axes.push(axis);
          }
        } else {
          for (_j = 0, _len1 = xaxes.length; _j < _len1; _j++) {
            loc = xaxes[_j];
            axis = LinearAxis.Collection.create({
              dimension: 0,
              axis_label: 'x',
              location: loc,
              parent: plot.ref(),
              plot: plot.ref()
            });
            axes.push(axis);
          }
        }
      }
      if (yaxes) {
        if (yaxes === true) {
          yaxes = ['min', 'max'];
        }
        if (!_.isArray(yaxes)) {
          yaxes = [yaxes];
        }
        for (_k = 0, _len2 = yaxes.length; _k < _len2; _k++) {
          loc = yaxes[_k];
          axis = LinearAxis.Collection.create({
            dimension: 1,
            axis_label: 'y',
            location: loc,
            parent: plot.ref(),
            plot: plot.ref()
          });
          axes.push(axis);
        }
      }
      return plot.add_renderers((function() {
        var _l, _len3, _results;
        _results = [];
        for (_l = 0, _len3 = axes.length; _l < _len3; _l++) {
          a = axes[_l];
          _results.push(a.ref());
        }
        return _results;
      })());
    };
    add_grids = function(plot, xgrid, ygrid, xaxis_is_datetime) {
      var g, grid, grids;
      if (xaxis_is_datetime == null) {
        xaxis_is_datetime = False;
      }
      grids = [];
      if (xgrid) {
        grid = Grid.Collection.create({
          dimension: 0,
          parent: plot.ref(),
          plot: plot.ref(),
          is_datetime: xaxis_is_datetime
        });
        grids.push(grid);
      }
      if (ygrid) {
        grid = Grid.Collection.create({
          dimension: 1,
          parent: plot.ref(),
          plot: plot.ref(),
          is_datetime: false
        });
        grids.push(grid);
        return plot.add_renderers((function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = grids.length; _i < _len; _i++) {
            g = grids[_i];
            _results.push(g.ref());
          }
          return _results;
        })());
      }
    };
    add_tools = function(plot, tools, glyphs, xdr, ydr) {
      var added_tools, g, pan_tool, preview_tool, resize_tool, select_overlay, select_tool, wheel_zoom_tool;
      if (tools === false) {
        return;
      }
      if (tools === true) {
        tools = "pan,wheel_zoom,select,resize,preview";
      }
      added_tools = [];
      if (tools.indexOf("pan") > -1) {
        pan_tool = PanTool.Collection.create({
          dataranges: [xdr.ref(), ydr.ref()],
          dimensions: ['width', 'height']
        });
        added_tools.push(pan_tool);
      }
      if (tools.indexOf("wheel_zoom") > -1) {
        wheel_zoom_tool = WheelZoomTool.Collection.create({
          dataranges: [xdr.ref(), ydr.ref()],
          dimensions: ['width', 'height']
        });
        added_tools.push(wheel_zoom_tool);
      }
      if (tools.indexOf("select") > -1) {
        select_tool = BoxSelectTool.Collection.create({
          renderers: (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = glyphs.length; _i < _len; _i++) {
              g = glyphs[_i];
              _results.push(g.ref());
            }
            return _results;
          })()
        });
        select_overlay = BoxSelection.Collection.create({
          tool: select_tool.ref()
        });
        added_tools.push(select_tool);
        plot.add_renderers([select_overlay.ref()]);
      }
      if (tools.indexOf("resize") > -1) {
        resize_tool = ResizeTool.Collection.create();
        added_tools.push(resize_tool);
      }
      if (tools.indexOf("preview") > -1) {
        preview_tool = PreviewSaveTool.Collection.create();
        added_tools.push(preview_tool);
      }
      return plot.set_obj('tools', added_tools);
    };
    add_legend = function(plot, legend, glyphs) {
      var g, idx, legend_renderer, legends, _i, _len;
      if (legend) {
        legends = {};
        for (idx = _i = 0, _len = glyphs.length; _i < _len; idx = ++_i) {
          g = glyphs[idx];
          legends[legend + String(idx)] = [g.ref()];
        }
        legend_renderer = Legend.Collection.create({
          parent: plot.ref(),
          plot: plot.ref(),
          orientation: "top_right",
          legends: legends
        });
        return plot.add_renderers([legend_renderer.ref()]);
      }
    };
    make_plot = function(glyphspecs, data, _arg) {
      var dims, g, glyphs, legend, nonselected, plot, sources, title, tools, xaxes, xdr, xgrid, xrange, yaxes, ydr, ygrid, yrange;
      nonselected = _arg.nonselected, title = _arg.title, dims = _arg.dims, xrange = _arg.xrange, yrange = _arg.yrange, xaxes = _arg.xaxes, yaxes = _arg.yaxes, xgrid = _arg.xgrid, ygrid = _arg.ygrid, xdr = _arg.xdr, ydr = _arg.ydr, tools = _arg.tools, legend = _arg.legend;
      if (nonselected == null) {
        nonselected = null;
      }
      if (title == null) {
        title = "";
      }
      if (dims == null) {
        dims = [400, 400];
      }
      if (xrange == null) {
        xrange = 'auto';
      }
      if (yrange == null) {
        yrange = 'auto';
      }
      if (xaxes == null) {
        xaxes = true;
      }
      if (yaxes == null) {
        yaxes = true;
      }
      if (xgrid == null) {
        xgrid = true;
      }
      if (ygrid == null) {
        ygrid = true;
      }
      if (tools == null) {
        tools = true;
      }
      if (legend == null) {
        legend = false;
      }
      sources = create_sources(data);
      xdr = create_range(xrange, sources, ['x']);
      ydr = create_range(yrange, sources, ['y']);
      plot = Plot.Collection.create({
        x_range: xdr.ref(),
        y_range: ydr.ref(),
        canvas_width: dims[0],
        canvas_height: dims[1],
        outer_width: dims[0],
        outer_height: dims[1],
        title: title
      });
      glyphs = create_glyphs(plot, glyphspecs, sources, nonselected);
      plot.add_renderers((function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = glyphs.length; _i < _len; _i++) {
          g = glyphs[_i];
          _results.push(g.ref());
        }
        return _results;
      })());
      add_axes(plot, xaxes, yaxes);
      add_grids(plot, xgrid, ygrid, xaxes === 'datetime');
      add_tools(plot, tools, glyphs, xdr, ydr);
      add_legend(plot, legend, glyphs);
      return plot;
    };
    show = function(plot, target_div) {
      var div, myrender;
      if (target_div == null) {
        target_div = false;
      }
      div = $('<div class="plotdiv"></div>');
      if (target_div) {
        target_div = $(target_div);
      } else {
        target_div = $('body');
      }
      target_div.append(div);
      myrender = function() {
        var view;
        view = new plot.default_view({
          model: plot
        });
        window.pview = view;
        div.append(view.$el);
        return console.log("added plot: " + plot.get('title'));
      };
      return _.defer(myrender);
    };
    return {
      "make_plot": make_plot,
      "create_glyphs": create_glyphs,
      "show": show
    };
  });

}).call(this);

/*
//@ sourceMappingURL=plotting.js.map
*/;
(function() {
  define('common/affine',[], function() {
    var Affine;
    return Affine = (function() {
      function Affine(a, b, c, d, tx, ty) {
        this.a = a != null ? a : 1;
        this.b = b != null ? b : 0;
        this.c = c != null ? c : 0;
        this.d = d != null ? d : 1;
        this.tx = tx != null ? tx : 0;
        this.ty = ty != null ? ty : 0;
      }

      Affine.prototype.apply = function(x, y) {
        return [this.a * x + this.b * y + this.tx, this.c * x + this.d * y + this.ty];
      };

      Affine.prototype.v_apply = function(xs, ys) {
        var i, xres, yres, _i, _ref;
        xres = new Float32Array(xs.length);
        yres = new Float32Array(ys.length);
        for (i = _i = 0, _ref = xs.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          xres[i] = this.a * xs[i] + this.b * ys[i] + this.tx;
          yres[i] = this.c * xs[i] + this.d * ys[i] + this.ty;
        }
        return [xres, yres];
      };

      Affine.prototype.is_identity = function() {
        return this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1 && this.tx === 0 && this.ty === 0;
      };

      Affine.prototype.translate = function(tx, ty) {
        this.tx = this.a * tx + this.b * ty;
        return this.ty = this.c * tx + this.d * ty;
      };

      Affine.prototype.scale = function(sx, sy) {
        this.a *= sx;
        this.b *= sy;
        this.c *= sx;
        return this.d *= sy;
      };

      Affine.prototype.rotate = function(alpha) {
        var C, S, a, b, c, d;
        C = Math.cos(alpha);
        S = Math.sin(alpha);
        a = C * this.a + S * this.b;
        b = C * this.b - S * this.a;
        c = C * this.c + S * this.d;
        d = C * this.d - S * this.c;
        this.a = a;
        this.b = b;
        this.c = c;
        return this.d = d;
      };

      Affine.prototype.shear = function(kx, ky) {
        var a, b, c, d;
        a = this.a + kx * this.c;
        b = this.b + kx * this.d;
        c = this.c + ky * this.a;
        d = this.d + ky * this.b;
        this.a = a;
        this.b = b;
        this.c = c;
        return this.d = d;
      };

      Affine.prototype.reflect_x = function(x0) {
        this.tx = 2 * this.a * x0 + this.tx;
        this.ty = 2 * this.c * x0 + this.ty;
        this.a = -this.a;
        return this.c = -this.c;
      };

      Affine.prototype.reflect_y = function(y0) {
        this.tx = 2 * this.b * y0 + this.tx;
        this.ty = 2 * this.d * y0 + this.ty;
        this.b = -this.b;
        return this.d = -this.d;
      };

      Affine.prototype.reflect_xy = function(x0, y0) {
        this.tx = 2 * (this.a * x0 + this.b * y0) + this.tx;
        this.ty = 2 * (this.c * x0 + this.d * y0) + this.ty;
        this.a = -this.a;
        this.b = -this.b;
        this.c = -this.c;
        return this.d = -this.d;
      };

      Affine.prototype.compose_right = function(m) {
        var a, b, c, d, tx, ty;
        a = this.a * m.a + this.b * m.c;
        b = this.a * m.b + this.b * m.d;
        c = this.c * m.a + this.d * m.c;
        d = this.c * m.b + this.d * m.d;
        tx = this.a * m.tx + this.b * m.ty + this.tx;
        ty = this.c * m.tx + this.d * m.ty + this.ty;
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.tx = tx;
        return this.ty = ty;
      };

      Affine.prototype.compose_left = function(m) {
        var a, b, c, d, tx, ty;
        a = m.a * this.a + m.b * this.c;
        b = m.a * this.b + m.b * this.d;
        c = m.c * this.a + m.d * this.c;
        d = m.c * this.b + m.d * this.d;
        tx = m.a * this.tx + m.b * this.ty + m.tx;
        ty = m.c * this.tx + m.d * this.ty + m.ty;
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.tx = tx;
        return this.ty = ty;
      };

      return Affine;

    })();
  });

}).call(this);

/*
//@ sourceMappingURL=affine.js.map
*/;
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('common/png_view',["./continuum_view"], function(ContinuumView) {
    var PNGView, _ref;
    return PNGView = (function(_super) {
      __extends(PNGView, _super);

      function PNGView() {
        _ref = PNGView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      PNGView.prototype.initialize = function(options) {
        PNGView.__super__.initialize.call(this, options);
        this.thumb_x = options.thumb_x || 40;
        this.thumb_y = options.thumb_y || 40;
        this.render();
        return this;
      };

      PNGView.prototype.render = function() {
        var png;
        this.$el.html('');
        png = this.model.get('png');
        this.$el.append($("<p> " + (this.model.get('title')) + " </p>"));
        return this.$el.append($("<img modeltype='" + this.model.type + "' modelid='" + (this.model.get('id')) + "' class='pngview' width='" + this.thumb_x + "'  height='" + this.thumb_y + "'  src='" + png + "'/>"));
      };

      return PNGView;

    })(ContinuumView.View);
  });

}).call(this);

/*
//@ sourceMappingURL=png_view.js.map
*/;
(function() {
  define('common/random',[], function() {
    var Random;
    return Random = (function() {
      function Random(seed) {
        this.seed = seed;
        this.multiplier = 1664525;
        this.modulo = 4294967296;
        this.offset = 1013904223;
        if (!((this.seed != null) && (0 <= seed && seed < this.modulo))) {
          this.seed = (new Date().valueOf() * new Date().getMilliseconds()) % this.modulo;
        }
      }

      Random.prototype.seed = function(seed) {
        return this.seed = seed;
      };

      Random.prototype.randn = function() {
        return this.seed = (this.multiplier * this.seed + this.offset) % this.modulo;
      };

      Random.prototype.randf = function() {
        return this.randn() / this.modulo;
      };

      Random.prototype.rand = function(n) {
        return Math.floor(this.randf() * n);
      };

      Random.prototype.rand2 = function(min, max) {
        return min + this.rand(max - min);
      };

      return Random;

    })();
  });

}).call(this);

/*
//@ sourceMappingURL=random.js.map
*/;
(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  define('common/socket',["backbone", "underscore", "common/base", "common/load_models"], function(Backbone, _, base, load_models) {
    var Config, WebSocketWrapper, result, submodels;
    Config = base.Config;
    WebSocketWrapper = (function() {
      _.extend(WebSocketWrapper.prototype, Backbone.Events);

      function WebSocketWrapper(ws_conn_string) {
        this.onmessage = __bind(this.onmessage, this);
        var _this = this;
        this.auth = {};
        this.ws_conn_string = ws_conn_string;
        this._connected = $.Deferred();
        this.connected = this._connected.promise();
        if (window.MozWebSocket) {
          this.s = new MozWebSocket(ws_conn_string);
        } else {
          this.s = new WebSocket(ws_conn_string);
        }
        this.s.onopen = function() {
          return _this._connected.resolve();
        };
        this.s.onmessage = this.onmessage;
      }

      WebSocketWrapper.prototype.onmessage = function(msg) {
        var data, index, topic;
        data = msg.data;
        index = data.indexOf(":");
        index = data.indexOf(":", index + 1);
        topic = data.substring(0, index);
        data = data.substring(index + 1);
        this.trigger("msg:" + topic, data);
        return null;
      };

      WebSocketWrapper.prototype.send = function(msg) {
        var _this = this;
        return $.when(this.connected).done(function() {
          return _this.s.send(msg);
        });
      };

      WebSocketWrapper.prototype.subscribe = function(topic, auth) {
        var msg;
        this.auth[topic] = auth;
        msg = JSON.stringify({
          msgtype: 'subscribe',
          topic: topic,
          auth: auth
        });
        return this.send(msg);
      };

      return WebSocketWrapper;

    })();
    submodels = function(wswrapper, topic, apikey) {
      wswrapper.subscribe(topic, apikey);
      return wswrapper.on("msg:" + topic, function(msg) {
        var clientid, model, msgobj, ref, _i, _len, _ref;
        msgobj = JSON.parse(msg);
        if (msgobj['msgtype'] === 'modelpush') {
          load_models(msgobj['modelspecs']);
        } else if (msgobj['msgtype'] === 'modeldel') {
          _ref = msgobj['modelspecs'];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            ref = _ref[_i];
            model = resolve_ref(ref['type'], ref['id']);
            if (model) {
              model.destroy({
                'local': true
              });
            }
          }
        } else if (msgobj['msgtype'] === 'status' && msgobj['status'][0] === 'subscribesuccess') {
          clientid = msgobj['status'][2];
          Config.clientid = clientid;
          $.ajaxSetup({
            'headers': {
              'Continuum-Clientid': clientid
            }
          });
        } else {
          console.log(msgobj);
        }
        return null;
      });
    };
    result = {
      WebSocketWrapper: WebSocketWrapper,
      submodels: submodels
    };
    return result;
  });

}).call(this);

/*
//@ sourceMappingURL=socket.js.map
*/;
(function() {
  define('server/serverutils',["common/base", "server/serverutils", "common/socket", "common/load_models"], function(base, serverutils, socket, load_models) {
    var Deferreds, Promises, WebSocketWrapper, exports, submodels, utility;
    Deferreds = {};
    Promises = {};
    exports = {};
    WebSocketWrapper = socket.WebSocketWrapper;
    submodels = socket.submodels;
    Deferreds._doc_loaded = $.Deferred();
    Deferreds._doc_requested = $.Deferred();
    Promises.doc_loaded = Deferreds._doc_loaded.promise();
    Promises.doc_requested = Deferreds._doc_requested.promise();
    Promises.doc_promises = {};
    exports.wswrapper = null;
    exports.plotcontext = null;
    exports.plotcontextview = null;
    exports.Promises = Promises;
    utility = {
      load_user: function() {
        var response;
        response = $.get('/bokeh/userinfo/', {});
        return response;
      },
      load_doc_once: function(docid) {
        var doc_prom;
        if (_.has(Promises.doc_promises, docid)) {
          console.log("already found " + docid + " in promises");
          return Promises.doc_promises[docid];
        } else {
          console.log("" + docid + " not in promises, loading it");
          doc_prom = utility.load_doc(docid);
          Promises.doc_promises[docid] = doc_prom;
          return doc_prom;
        }
      },
      load_doc_by_title: function(title) {
        var Config, response;
        Config = require("common/base").Config;
        response = $.get(Config.prefix + "/bokeh/doc", {
          title: title
        }).done(function(data) {
          var all_models, apikey, docid;
          all_models = data['all_models'];
          load_models(all_models);
          apikey = data['apikey'];
          docid = data['docid'];
          return submodels(exports.wswrapper, "bokehplot:" + docid, apikey);
        });
        return response;
      },
      load_doc_static: function(docid, data) {
        " loads data without making a websocket connection ";
        var promise;
        load_data(data['all_models']);
        promise = jQuery.Deferred();
        promise.resolve();
        return promise;
      },
      load_doc: function(docid) {
        var Config, response, wswrapper;
        wswrapper = utility.make_websocket();
        Config = require("common/base").Config;
        response = $.get(Config.prefix + ("/bokeh/bokehinfo/" + docid + "/"), {}).done(function(data) {
          var all_models, apikey;
          all_models = data['all_models'];
          load_models(all_models);
          apikey = data['apikey'];
          return submodels(exports.wswrapper, "bokehplot:" + docid, apikey);
        });
        return response;
      },
      make_websocket: function() {
        var Config, wswrapper;
        Config = require("common/base").Config;
        wswrapper = new WebSocketWrapper(Config.ws_conn_string);
        exports.wswrapper = wswrapper;
        return wswrapper;
      },
      render_plots: function(plot_context_ref, viewclass, viewoptions) {
        var Collections, options, plotcontext, plotcontextview;
        if (viewclass == null) {
          viewclass = null;
        }
        if (viewoptions == null) {
          viewoptions = {};
        }
        Collections = require("common/base").Collections;
        plotcontext = Collections(plot_context_ref.type).get(plot_context_ref.id);
        if (!viewclass) {
          viewclass = plotcontext.default_view;
        }
        options = _.extend(viewoptions, {
          model: plotcontext
        });
        plotcontextview = new viewclass(options);
        plotcontext = plotcontext;
        plotcontextview = plotcontextview;
        plotcontextview.render();
        exports.plotcontext = plotcontext;
        return exports.plotcontextview = plotcontextview;
      },
      bokeh_connection: function(host, docid, protocol) {
        if (_.isUndefined(protocol)) {
          protocol = "https";
        }
        if (Promises.doc_requested.state() === "pending") {
          Deferreds._doc_requested.resolve();
          return $.get("" + protocol + "://" + host + "/bokeh/publicbokehinfo/" + docid, {}, function(data) {
            console.log('instatiate_doc_single, docid', docid);
            data = JSON.parse(data);
            load_models(data['all_models']);
            return Deferreds._doc_loaded.resolve(data);
          });
        }
      }
    };
    exports.utility = utility;
    return exports;
  });

}).call(this);

/*
//@ sourceMappingURL=serverutils.js.map
*/;
(function() {
  var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  define('server/embed_core',["common/base", "common/load_models", "server/serverutils"], function(base, load_models, serverutils) {
    var addDirectPlot, addDirectPlotWrap, addPlot, addPlotWrap, exports, find_injections, foundEls, injectCss, parse_el, search_and_plot, serverLoad, unsatisfied_els, utility;
    utility = serverutils.utility;
    addPlotWrap = function(settings, dd) {
      return addPlot(settings.bokeh_modelid, settings.bokeh_modeltype, settings.element, dd);
    };
    addPlot = function(modelid, modeltype, element, data) {
      var data_plot_id, model, view;
      data_plot_id = _.keys(data)[0];
      if (!data_plot_id === modelid) {
        return;
      }
      console.log("addPlot");
      console.log(modelid, modeltype, element);
      load_models(data[data_plot_id]);
      model = base.Collections(modeltype).get(modelid);
      view = new model.default_view({
        model: model
      });
      view.render();
      return _.delay(function() {
        return $(element).replaceWith(view.$el);
      });
    };
    addDirectPlotWrap = function(settings) {
      console.log("addDirectPlotWrap");
      return addDirectPlot(settings.bokeh_docid, settings.bokeh_ws_conn_string, settings.bokeh_docapikey, settings.bokeh_root_url, settings.bokeh_modelid, settings.bokeh_modeltype, settings.element);
    };
    serverLoad = function(docid, ws_conn_string, docapikey, root_url) {
      var BokehConfig, headers;
      console.log("serverLoad");
      headers = {
        'BOKEH-API-KEY': docapikey
      };
      $.ajaxSetup({
        'headers': headers
      });
      BokehConfig = base.Config;
      BokehConfig.prefix = root_url;
      BokehConfig.ws_conn_string = ws_conn_string;
      return utility.load_doc_once(docid);
    };
    addDirectPlot = function(docid, ws_conn_string, docapikey, root_url, modelid, modeltype, element) {
      return serverLoad(docid, ws_conn_string, docapikey, root_url).done(function() {
        var model, plot_collection, view;
        console.log("addPlot");
        console.log(modelid, modeltype, element);
        plot_collection = base.Collections(modeltype);
        model = plot_collection.get(modelid);
        view = new model.default_view({
          model: model
        });
        return _.delay(function() {
          return $(element).replaceWith(view.$el);
        });
      });
    };
    injectCss = function(static_root_url) {
      var css_urls, load_css;
      css_urls = ["" + static_root_url + "css/bokeh.css", "" + static_root_url + "css/continuum.css", "" + static_root_url + "js/vendor/bootstrap/bootstrap-bokeh-2.0.4.css"];
      load_css = function(url) {
        var link;
        link = document.createElement('link');
        link.href = url;
        link.rel = "stylesheet";
        link.type = "text/css";
        return document.body.appendChild(link);
      };
      return _.map(css_urls, load_css);
    };
    foundEls = [];
    parse_el = function(el) {
      "this takes a bokeh embed script element and returns the relvant\nattributes through to a dictionary, ";
      var attr, attrs, bokehCount, bokehRe, info, _i, _len;
      attrs = el.attributes;
      bokehRe = /bokeh.*/;
      info = {};
      bokehCount = 0;
      for (_i = 0, _len = attrs.length; _i < _len; _i++) {
        attr = attrs[_i];
        if (attr.name.match(bokehRe)) {
          info[attr.name] = attr.value;
          bokehCount++;
        }
      }
      if (bokehCount > 0) {
        return info;
      } else {
        return false;
      }
    };
    unsatisfied_els = {};
    find_injections = function() {
      var container, d, el, els, info, is_new_el, matches, new_settings, re, _i, _len;
      els = document.getElementsByTagName('script');
      re = /.*embed.js.*/;
      new_settings = [];
      for (_i = 0, _len = els.length; _i < _len; _i++) {
        el = els[_i];
        is_new_el = __indexOf.call(foundEls, el) < 0;
        matches = el.src.match(re);
        if (is_new_el && matches) {
          foundEls.push(el);
          info = parse_el(el);
          d = document.createElement('div');
          container = document.createElement('div');
          container.className = "bokeh-container";
          el.parentNode.insertBefore(container, el);
          info['element'] = container;
          new_settings.push(info);
        }
      }
      return new_settings;
    };
    search_and_plot = function(dd) {
      var new_plot_dicts, plot_from_dict;
      plot_from_dict = function(info_dict, key) {
        var dd_id;
        if (info_dict.bokeh_plottype === 'embeddata') {
          dd_id = _.keys(dd)[0];
          if (key === dd_id) {
            addPlotWrap(info_dict, dd);
            return delete unsatisfied_els[key];
          }
        } else {
          addDirectPlotWrap(info_dict);
          return delete unsatisfied_els[key];
        }
      };
      new_plot_dicts = find_injections();
      _.each(new_plot_dicts, function(plotdict) {
        return unsatisfied_els[plotdict['bokeh_modelid']] = plotdict;
      });
      return _.map(unsatisfied_els, plot_from_dict);
    };
    exports = {
      search_and_plot: search_and_plot,
      injectCss: injectCss
    };
    return exports;
  });

}).call(this);

/*
//@ sourceMappingURL=embed_core.js.map
*/;
define('server/usercontext/userdocstemplate',[],function(){
  var template = function(__obj) {
  var _safe = function(value) {
    if (typeof value === 'undefined' && value == null)
      value = '';
    var result = new String(value);
    result.ecoSafe = true;
    return result;
  };
  return (function() {
    var __out = [], __self = this, _print = function(value) {
      if (typeof value !== 'undefined' && value != null)
        __out.push(value.ecoSafe ? value : __self.escape(value));
    }, _capture = function(callback) {
      var out = __out, result;
      __out = [];
      callback.call(this);
      result = __out.join('');
      __out = out;
      return _safe(result);
    };
    (function() {
      _print(_safe('<div class="accordion">\n</div>\n'));
    
    }).call(this);
    
    return __out.join('');
  }).call((function() {
    var obj = {
      escape: function(value) {
        return ('' + value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      },
      safe: _safe
    }, key;
    for (key in __obj) obj[key] = __obj[key];
    return obj;
  })());
};
  return template;
});

define('server/usercontext/documentationtemplate',[],function(){
  var template = function(__obj) {
  var _safe = function(value) {
    if (typeof value === 'undefined' && value == null)
      value = '';
    var result = new String(value);
    result.ecoSafe = true;
    return result;
  };
  return (function() {
    var __out = [], __self = this, _print = function(value) {
      if (typeof value !== 'undefined' && value != null)
        __out.push(value.ecoSafe ? value : __self.escape(value));
    }, _capture = function(callback) {
      var out = __out, result;
      __out = [];
      callback.call(this);
      result = __out.join('');
      __out = out;
      return _safe(result);
    };
    (function() {
      _print(_safe('<p>\n  <b>\n    You have no Plots.  Follow the intsructions\n    below to create some\n  </b>\n</p>\n'));
    
    }).call(this);
    
    return __out.join('');
  }).call((function() {
    var obj = {
      escape: function(value) {
        return ('' + value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      },
      safe: _safe
    }, key;
    for (key in __obj) obj[key] = __obj[key];
    return obj;
  })());
};
  return template;
});

define('server/usercontext/wrappertemplate',[],function(){
  var template = function(__obj) {
  var _safe = function(value) {
    if (typeof value === 'undefined' && value == null)
      value = '';
    var result = new String(value);
    result.ecoSafe = true;
    return result;
  };
  return (function() {
    var __out = [], __self = this, _print = function(value) {
      if (typeof value !== 'undefined' && value != null)
        __out.push(value.ecoSafe ? value : __self.escape(value));
    }, _capture = function(callback) {
      var out = __out, result;
      __out = [];
      callback.call(this);
      result = __out.join('');
      __out = out;
      return _safe(result);
    };
    (function() {
      _print(_safe('<div class="accordion-heading bokehdocheading">\n  <a class="accordion-toggle bokehdoclabel" data-toggle="collapse" \n     href="#'));
    
      _print(this.bodyid);
    
      _print(_safe('">\n    Document: '));
    
      _print(this.model.get('title'));
    
      _print(_safe('\n    <i class="bokehdelete icon-trash"></i>\n  </a>\n</div>\n<div id="'));
    
      _print(this.bodyid);
    
      _print(_safe('" class="accordion-body collapse">\n  <div class="accordion-inner plots">\n  </div>\n</div>\n\n\n'));
    
    }).call(this);
    
    return __out.join('');
  }).call((function() {
    var obj = {
      escape: function(value) {
        return ('' + value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      },
      safe: _safe
    }, key;
    for (key in __obj) obj[key] = __obj[key];
    return obj;
  })());
};
  return template;
});

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('server/usercontext/usercontext',["common/base", "../serverutils", "common/continuum_view", "./userdocstemplate", "./documentationtemplate", "./wrappertemplate", "common/has_parent", "common/build_views", "common/load_models"], function(base, serverutils, continuum_view, userdocstemplate, documentationtemplate, wrappertemplate, HasParent, build_views, load_models) {
    var ContinuumView, Doc, DocView, UserDocs, UserDocsView, exports, utility, _ref, _ref1, _ref2, _ref3;
    exports = {};
    ContinuumView = continuum_view.View;
    utility = serverutils.utility;
    DocView = (function(_super) {
      __extends(DocView, _super);

      function DocView() {
        _ref = DocView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      DocView.prototype.template = wrappertemplate;

      DocView.prototype.attributes = {
        "class": 'accordion-group'
      };

      DocView.prototype.events = {
        "click .bokehdoclabel": "loaddoc",
        "click .bokehdelete": "deldoc"
      };

      DocView.prototype.deldoc = function(e) {
        console.log('foo');
        e.preventDefault();
        this.model.destroy();
        return false;
      };

      DocView.prototype.loaddoc = function() {
        return this.model.load();
      };

      DocView.prototype.initialize = function(options) {
        DocView.__super__.initialize.call(this, options);
        return this.render_init();
      };

      DocView.prototype.delegateEvents = function(events) {
        DocView.__super__.delegateEvents.call(this, events);
        return this.listenTo(this.model, 'loaded', this.render);
      };

      DocView.prototype.render_init = function() {
        var html;
        html = this.template({
          model: this.model,
          bodyid: _.uniqueId()
        });
        return this.$el.html(html);
      };

      DocView.prototype.render = function() {
        var plot_context;
        plot_context = this.model.get_obj('plot_context');
        this.plot_context_view = new plot_context.default_view({
          model: plot_context
        });
        this.$el.find('.plots').append(this.plot_context_view.el);
        return true;
      };

      return DocView;

    })(ContinuumView);
    UserDocsView = (function(_super) {
      __extends(UserDocsView, _super);

      function UserDocsView() {
        _ref1 = UserDocsView.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      UserDocsView.prototype.initialize = function(options) {
        this.docs = options.docs;
        this.collection = options.collection;
        this.views = {};
        UserDocsView.__super__.initialize.call(this, options);
        return this.render();
      };

      UserDocsView.prototype.attributes = {
        "class": 'usercontext'
      };

      UserDocsView.prototype.events = {
        'click .bokehrefresh': function() {
          return this.collection.fetch({
            update: true
          });
        }
      };

      UserDocsView.prototype.delegateEvents = function(events) {
        var _this = this;
        UserDocsView.__super__.delegateEvents.call(this, events);
        this.listenTo(this.collection, 'add', this.render);
        this.listenTo(this.collection, 'remove', this.render);
        this.listenTo(this.collection, 'add', function(model, collection, options) {
          return _this.listenTo(model, 'loaded', function() {
            return _this.listenTo(model.get_obj('plot_context'), 'change', function() {
              return _this.trigger('show');
            });
          });
        });
        return this.listenTo(this.collection, 'remove', function(model, collection, options) {
          return _this.stopListening(model);
        });
      };

      UserDocsView.prototype.render_docs = function() {
        this.$el.html(documentationtemplate());
        return this.$el.append(this.docs);
      };

      UserDocsView.prototype.render = function() {
        var html, model, models, _i, _len;
        if (this.collection.models.length === 0 && this.docs) {
          return this.render_docs();
        }
        html = userdocstemplate();
        _.map(_.values(this.views), function(view) {
          return view.$el.detach();
        });
        models = this.collection.models.slice().reverse();
        build_views(this.views, models, {});
        this.$el.html(html);
        for (_i = 0, _len = models.length; _i < _len; _i++) {
          model = models[_i];
          this.$el.find(".accordion").append(this.views[model.id].el);
        }
        return this;
      };

      return UserDocsView;

    })(ContinuumView);
    Doc = (function(_super) {
      __extends(Doc, _super);

      function Doc() {
        _ref2 = Doc.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Doc.prototype.default_view = DocView;

      Doc.prototype.idAttribute = 'docid';

      Doc.prototype.defaults = {
        docid: null,
        title: null,
        plot_context: null,
        apikey: null
      };

      Doc.prototype.sync = function() {};

      Doc.prototype.destroy = function(options) {
        Doc.__super__.destroy.call(this, options);
        return $.ajax({
          url: "/bokeh/doc/" + (this.get('docid')) + "/",
          type: 'delete'
        });
      };

      Doc.prototype.load = function(use_title) {
        var docid, resp, title,
          _this = this;
        if (this.loaded) {
          return;
        }
        if (use_title) {
          title = this.get('title');
          resp = utility.load_doc_by_title(title);
        } else {
          docid = this.get('docid');
          resp = utility.load_doc(docid);
        }
        return resp.done(function(data) {
          _this.set('docid', data.docid);
          _this.set('apikey', data['apikey']);
          _this.set('plot_context', data['plot_context_ref']);
          _this.trigger('loaded');
          return _this.loaded = true;
        });
      };

      return Doc;

    })(HasParent);
    UserDocs = (function(_super) {
      __extends(UserDocs, _super);

      function UserDocs() {
        _ref3 = UserDocs.__super__.constructor.apply(this, arguments);
        return _ref3;
      }

      UserDocs.prototype.model = Doc;

      UserDocs.prototype.subscribe = function(wswrapper, username) {
        wswrapper.subscribe("bokehuser:" + username, null);
        return this.listenTo(wswrapper, "msg:bokehuser:" + username, function(msg) {
          msg = JSON.parse(msg);
          if (msg['msgtype'] === 'docchange') {
            return this.fetch({
              update: true
            });
          }
        });
      };

      UserDocs.prototype.fetch = function(options) {
        var resp, response,
          _this = this;
        if (_.isUndefined(options)) {
          options = {};
        }
        resp = response = $.get('/bokeh/userinfo/', {});
        resp.done(function(data) {
          var docs;
          docs = data['docs'];
          if (options.update) {
            return _this.update(docs, options);
          } else {
            return _this.reset(docs, options);
          }
        });
        return resp;
      };

      return UserDocs;

    })(Backbone.Collection);
    exports.UserDocs = UserDocs;
    exports.UserDocsView = UserDocsView;
    exports.Doc = Doc;
    exports.DocView = DocView;
    return exports;
  });

}).call(this);

/*
//@ sourceMappingURL=usercontext.js.map
*/;
(function() {
  define('server/serverrun',["common/base", "./serverutils", "./usercontext/usercontext", "common/has_properties"], function(base, serverutils, usercontext, HasProperties) {
    var Config, Promises, load, _render, _render_all, _render_one;
    Config = base.Config;
    Promises = serverutils.Promises;
    Config.ws_conn_string = "ws://" + window.location.host + "/bokeh/sub";
    load = function(title) {
      HasProperties.prototype.sync = Backbone.sync;
      return $(function() {
        var userdocs, wswrapper;
        wswrapper = serverutils.utility.make_websocket();
        userdocs = new usercontext.UserDocs();
        userdocs.subscribe(wswrapper, 'defaultuser');
        window.userdocs = userdocs;
        load = userdocs.fetch();
        return load.done(function() {
          if (title != null) {
            return _render_one(userdocs, title);
          } else {
            return _render_all(userdocs);
          }
        });
      });
    };
    _render_all = function(userdocs) {
      var userdocsview;
      userdocsview = new usercontext.UserDocsView({
        collection: userdocs
      });
      return _render(userdocsview.el);
    };
    _render_one = function(userdocs, title) {
      var doc, msg;
      doc = userdocs.find(function(doc) {
        return doc.get('title') === title;
      });
      if (doc != null) {
        doc.on('loaded', function() {
          var plot_context, plot_context_view;
          plot_context = doc.get_obj('plot_context');
          plot_context_view = new plot_context.default_view({
            model: plot_context
          });
          return _render(plot_context_view.el);
        });
        return doc.load();
      } else {
        msg = "Document '" + title + "' wasn't found on this server.";
        _render(msg);
        return console.error(msg);
      }
    };
    _render = function(html) {
      return $('#PlotPane').append(html);
    };
    return {
      load: load
    };
  });

}).call(this);

/*
//@ sourceMappingURL=serverrun.js.map
*/;
(function() {
  define('main',['require','exports','module','common/base','common/base','common/gmap_plot','common/grid_plot','common/has_parent','common/has_properties','common/plot','common/plotting','common/affine','common/build_views','common/bulk_save','common/continuum_view','common/grid_view_state','common/load_models','common/plot_context','common/plot_widget','common/png_view','common/random','common/safebind','common/svg_colors','common/ticking','common/view_state','mapper/1d/linear_mapper','mapper/2d/grid_mapper','mapper/color/linear_color_mapper','palettes/palettes','renderer/annotation/legend','renderer/glyph/glyph','renderer/glyph/glyph_factory','renderer/guide/datetime_axis','renderer/guide/grid','renderer/guide/linear_axis','renderer/overlay/box_selection','renderer/properties','server/embed_core','server/serverrun','server/serverutils','source/column_data_source','source/object_array_data_source','tool/box_select_tool','tool/data_range_box_select_tool','tool/embed_tool','tool/pan_tool','tool/preview_save_tool','tool/resize_tool','tool/crosshair_tool','tool/wheel_zoom_tool','widget/data_slider','server/serverrun'],function(require, exports, module) {
    var Bokeh, glyph_factory;
    if (!window.Float64Array) {
      console.warn("Float64Array is not supported. Using generic Array instead.");
      window.Float64Array = Array;
    }
    Bokeh = {};
    Bokeh.version = '0.3.0';
    Bokeh.Collections = require("common/base").Collections;
    Bokeh.Config = require("common/base").Collections;
    Bokeh.GMapPlot = require("common/gmap_plot");
    Bokeh.GridPlot = require("common/grid_plot");
    Bokeh.HasParent = require("common/has_parent");
    Bokeh.HasProperties = require("common/has_properties");
    Bokeh.Plot = require("common/plot");
    Bokeh.Plotting = require("common/plotting");
    Bokeh.Affine = require("common/affine");
    Bokeh.build_views = require("common/build_views");
    Bokeh.bulk_save = require("common/bulk_save");
    Bokeh.ContinuumView = require("common/continuum_view");
    Bokeh.GridViewState = require("common/grid_view_state");
    Bokeh.load_models = require("common/load_models");
    Bokeh.PlotContext = require("common/plot_context");
    Bokeh.PlotWidget = require("common/plot_widget");
    Bokeh.PNGView = require("common/png_view");
    Bokeh.Random = require("common/random");
    Bokeh.safebind = require("common/safebind");
    Bokeh.SVGColors = require("common/svg_colors");
    Bokeh.ticking = require("common/ticking");
    Bokeh.ViewState = require("common/view_state");
    Bokeh.LinearMapper = require("mapper/1d/linear_mapper");
    Bokeh.GridMapper = require("mapper/2d/grid_mapper");
    Bokeh.LinearColorMapper = require("mapper/color/linear_color_mapper");
    Bokeh.Palettes = require("palettes/palettes");
    Bokeh.Legend = require("renderer/annotation/legend");
    Bokeh.Glyph = require("renderer/glyph/glyph");
    glyph_factory = require("renderer/glyph/glyph_factory");
    Bokeh.AnnularWedge = glyph_factory.annular_wedge;
    Bokeh.Annulus = glyph_factory.annulus;
    Bokeh.Arc = glyph_factory.arc;
    Bokeh.Asterisk = glyph_factory.asterisk;
    Bokeh.Bezier = glyph_factory.bezier;
    Bokeh.Circle = glyph_factory.circle;
    Bokeh.CircleCross = glyph_factory.circle_cross;
    Bokeh.CircleX = glyph_factory.circle_x;
    Bokeh.Cross = glyph_factory.cross;
    Bokeh.Diamond = glyph_factory.diamond;
    Bokeh.DiamondCross = glyph_factory.diamond_cross;
    Bokeh.Image = glyph_factory.image;
    Bokeh.ImageRGBA = glyph_factory.image_rgba;
    Bokeh.ImageURI = glyph_factory.image_uri;
    Bokeh.InvertedTriangle = glyph_factory.inverted_triangle;
    Bokeh.Line = glyph_factory.line;
    Bokeh.MultiLine = glyph_factory.multi_line;
    Bokeh.Oval = glyph_factory.oval;
    Bokeh.Patch = glyph_factory.patch;
    Bokeh.Patches = glyph_factory.patches;
    Bokeh.Quad = glyph_factory.quad;
    Bokeh.Quadratic = glyph_factory.quadratic;
    Bokeh.Ray = glyph_factory.ray;
    Bokeh.Rect = glyph_factory.rect;
    Bokeh.Segment = glyph_factory.segment;
    Bokeh.Square = glyph_factory.square;
    Bokeh.SquareCross = glyph_factory.square_cross;
    Bokeh.SquareX = glyph_factory.square_x;
    Bokeh.Text = glyph_factory.text;
    Bokeh.Triangle = glyph_factory.triangle;
    Bokeh.Wedge = glyph_factory.wedge;
    Bokeh.X = glyph_factory.x;
    Bokeh.DatetimeAxis = require("renderer/guide/datetime_axis");
    Bokeh.Grid = require("renderer/guide/grid");
    Bokeh.LinearAxis = require("renderer/guide/linear_axis");
    Bokeh.BoxSelection = require("renderer/overlay/box_selection");
    Bokeh.Properties = require("renderer/properties");
    Bokeh.embed_core = require("server/embed_core");
    Bokeh.serverrun = require("server/serverrun");
    Bokeh.serverutils = require("server/serverutils");
    Bokeh.ColumnDataSource = require("source/column_data_source");
    Bokeh.ObjectArrayDataSource = require("source/object_array_data_source");
    Bokeh.BoxSelectTool = require("tool/box_select_tool");
    Bokeh.DataRangeBoxSelectTool = require("tool/data_range_box_select_tool");
    Bokeh.EmbedTool = require("tool/embed_tool");
    Bokeh.PanTool = require("tool/pan_tool");
    Bokeh.PreviewSaveTool = require("tool/preview_save_tool");
    Bokeh.ResizeTool = require("tool/resize_tool");
    Bokeh.CrosshairTool = require("tool/crosshair_tool");
    Bokeh.WheelZoomTool = require("tool/wheel_zoom_tool");
    Bokeh.DataSlider = require("widget/data_slider");
    Bokeh.server_page = require("server/serverrun").load;
    exports.Bokeh = Bokeh;
    return Bokeh;
  });

}).call(this);

/*
//@ sourceMappingURL=main.js.map
*/;
  //The modules for your project will be inlined above
  //this snippet. Ask almond to synchronously require the
  //module value for 'main' here and return it as the
  //value to use for the public API for the built file.
  return require('main');
}));

// Make sure that we don't clobber any existing definition of $ (most
// likely a previous version of jQuery.
var _oldJQ = $;
jQuery.noConflict();
if(typeof($)=="undefined"){
  // if there was no previous definition of $, put our definition into window.$.
  $=_oldJQ;
}
