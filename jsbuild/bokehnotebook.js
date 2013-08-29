(function(){if (!Date.now) Date.now = function() {
  return +new Date;
};
try {
  document.createElement("div").style.setProperty("opacity", 0, "");
} catch (error) {
  var d3_style_prototype = CSSStyleDeclaration.prototype,
      d3_style_setProperty = d3_style_prototype.setProperty;
  d3_style_prototype.setProperty = function(name, value, priority) {
    d3_style_setProperty.call(this, name, value + "", priority);
  };
}
d3 = {version: "2.8.1"}; // semver
function d3_class(ctor, properties) {
  try {
    for (var key in properties) {
      Object.defineProperty(ctor.prototype, key, {
        value: properties[key],
        enumerable: false
      });
    }
  } catch (e) {
    ctor.prototype = properties;
  }
}
var d3_array = d3_arraySlice; // conversion for NodeLists

function d3_arrayCopy(pseudoarray) {
  var i = -1, n = pseudoarray.length, array = [];
  while (++i < n) array.push(pseudoarray[i]);
  return array;
}

function d3_arraySlice(pseudoarray) {
  return Array.prototype.slice.call(pseudoarray);
}

try {
  d3_array(document.documentElement.childNodes)[0].nodeType;
} catch(e) {
  d3_array = d3_arrayCopy;
}

var d3_arraySubclass = [].__proto__?

// Until ECMAScript supports array subclassing, prototype injection works well.
function(array, prototype) {
  array.__proto__ = prototype;
}:

// And if your browser doesn't support __proto__, we'll use direct extension.
function(array, prototype) {
  for (var property in prototype) array[property] = prototype[property];
};
d3.map = function(object) {
  var map = new d3_Map;
  for (var key in object) map.set(key, object[key]);
  return map;
};

function d3_Map() {}

d3_class(d3_Map, {
  has: function(key) {
    return d3_map_prefix + key in this;
  },
  get: function(key) {
    return this[d3_map_prefix + key];
  },
  set: function(key, value) {
    return this[d3_map_prefix + key] = value;
  },
  remove: function(key) {
    key = d3_map_prefix + key;
    return key in this && delete this[key];
  },
  keys: function() {
    var keys = [];
    this.forEach(function(key) { keys.push(key); });
    return keys;
  },
  values: function() {
    var values = [];
    this.forEach(function(key, value) { values.push(value); });
    return values;
  },
  entries: function() {
    var entries = [];
    this.forEach(function(key, value) { entries.push({key: key, value: value}); });
    return entries;
  },
  forEach: function(f) {
    for (var key in this) {
      if (key.charCodeAt(0) === d3_map_prefixCode) {
        f.call(this, key.substring(1), this[key]);
      }
    }
  }
});

var d3_map_prefix = "\0", // prevent collision with built-ins
    d3_map_prefixCode = d3_map_prefix.charCodeAt(0);
function d3_this() {
  return this;
}
d3.functor = function(v) {
  return typeof v === "function" ? v : function() { return v; };
};
// Copies a variable number of methods from source to target.
d3.rebind = function(target, source) {
  var i = 1, n = arguments.length, method;
  while (++i < n) target[method = arguments[i]] = d3_rebind(target, source, source[method]);
  return target;
};

// Method is assumed to be a standard D3 getter-setter:
// If passed with no arguments, gets the value.
// If passed with arguments, sets the value and returns the target.
function d3_rebind(target, source, method) {
  return function() {
    var value = method.apply(source, arguments);
    return arguments.length ? target : value;
  };
}
d3.ascending = function(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
};
d3.descending = function(a, b) {
  return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
};
d3.mean = function(array, f) {
  var n = array.length,
      a,
      m = 0,
      i = -1,
      j = 0;
  if (arguments.length === 1) {
    while (++i < n) if (d3_number(a = array[i])) m += (a - m) / ++j;
  } else {
    while (++i < n) if (d3_number(a = f.call(array, array[i], i))) m += (a - m) / ++j;
  }
  return j ? m : undefined;
};
d3.median = function(array, f) {
  if (arguments.length > 1) array = array.map(f);
  array = array.filter(d3_number);
  return array.length ? d3.quantile(array.sort(d3.ascending), .5) : undefined;
};
d3.min = function(array, f) {
  var i = -1,
      n = array.length,
      a,
      b;
  if (arguments.length === 1) {
    while (++i < n && ((a = array[i]) == null || a != a)) a = undefined;
    while (++i < n) if ((b = array[i]) != null && a > b) a = b;
  } else {
    while (++i < n && ((a = f.call(array, array[i], i)) == null || a != a)) a = undefined;
    while (++i < n) if ((b = f.call(array, array[i], i)) != null && a > b) a = b;
  }
  return a;
};
d3.max = function(array, f) {
  var i = -1,
      n = array.length,
      a,
      b;
  if (arguments.length === 1) {
    while (++i < n && ((a = array[i]) == null || a != a)) a = undefined;
    while (++i < n) if ((b = array[i]) != null && b > a) a = b;
  } else {
    while (++i < n && ((a = f.call(array, array[i], i)) == null || a != a)) a = undefined;
    while (++i < n) if ((b = f.call(array, array[i], i)) != null && b > a) a = b;
  }
  return a;
};
d3.extent = function(array, f) {
  var i = -1,
      n = array.length,
      a,
      b,
      c;
  if (arguments.length === 1) {
    while (++i < n && ((a = c = array[i]) == null || a != a)) a = c = undefined;
    while (++i < n) if ((b = array[i]) != null) {
      if (a > b) a = b;
      if (c < b) c = b;
    }
  } else {
    while (++i < n && ((a = c = f.call(array, array[i], i)) == null || a != a)) a = undefined;
    while (++i < n) if ((b = f.call(array, array[i], i)) != null) {
      if (a > b) a = b;
      if (c < b) c = b;
    }
  }
  return [a, c];
};
d3.random = {
  normal: function(mean, deviation) {
    if (arguments.length < 2) deviation = 1;
    if (arguments.length < 1) mean = 0;
    return function() {
      var x, y, r;
      do {
        x = Math.random() * 2 - 1;
        y = Math.random() * 2 - 1;
        r = x * x + y * y;
      } while (!r || r > 1);
      return mean + deviation * x * Math.sqrt(-2 * Math.log(r) / r);
    };
  }
};
function d3_number(x) {
  return x != null && !isNaN(x);
}
d3.sum = function(array, f) {
  var s = 0,
      n = array.length,
      a,
      i = -1;

  if (arguments.length === 1) {
    while (++i < n) if (!isNaN(a = +array[i])) s += a;
  } else {
    while (++i < n) if (!isNaN(a = +f.call(array, array[i], i))) s += a;
  }

  return s;
};
// R-7 per <http://en.wikipedia.org/wiki/Quantile>
d3.quantile = function(values, p) {
  var H = (values.length - 1) * p + 1,
      h = Math.floor(H),
      v = values[h - 1],
      e = H - h;
  return e ? v + e * (values[h] - v) : v;
};
d3.transpose = function(matrix) {
  return d3.zip.apply(d3, matrix);
};
d3.zip = function() {
  if (!(n = arguments.length)) return [];
  for (var i = -1, m = d3.min(arguments, d3_zipLength), zips = new Array(m); ++i < m;) {
    for (var j = -1, n, zip = zips[i] = new Array(n); ++j < n;) {
      zip[j] = arguments[j][i];
    }
  }
  return zips;
};

function d3_zipLength(d) {
  return d.length;
}
d3.bisector = function(f) {
  return {
    left: function(a, x, lo, hi) {
      if (arguments.length < 3) lo = 0;
      if (arguments.length < 4) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >> 1;
        if (f.call(a, a[mid], mid) < x) lo = mid + 1;
        else hi = mid;
      }
      return lo;
    },
    right: function(a, x, lo, hi) {
      if (arguments.length < 3) lo = 0;
      if (arguments.length < 4) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >> 1;
        if (x < f.call(a, a[mid], mid)) hi = mid;
        else lo = mid + 1;
      }
      return lo;
    }
  };
};

var d3_bisector = d3.bisector(function(d) { return d; });
d3.bisectLeft = d3_bisector.left;
d3.bisect = d3.bisectRight = d3_bisector.right;
d3.first = function(array, f) {
  var i = 0,
      n = array.length,
      a = array[0],
      b;
  if (arguments.length === 1) f = d3.ascending;
  while (++i < n) {
    if (f.call(array, a, b = array[i]) > 0) {
      a = b;
    }
  }
  return a;
};
d3.last = function(array, f) {
  var i = 0,
      n = array.length,
      a = array[0],
      b;
  if (arguments.length === 1) f = d3.ascending;
  while (++i < n) {
    if (f.call(array, a, b = array[i]) <= 0) {
      a = b;
    }
  }
  return a;
};
d3.nest = function() {
  var nest = {},
      keys = [],
      sortKeys = [],
      sortValues,
      rollup;

  function map(array, depth) {
    if (depth >= keys.length) return rollup
        ? rollup.call(nest, array) : (sortValues
        ? array.sort(sortValues)
        : array);

    var i = -1,
        n = array.length,
        key = keys[depth++],
        keyValue,
        object,
        valuesByKey = new d3_Map,
        values,
        o = {};

    while (++i < n) {
      if (values = valuesByKey.get(keyValue = key(object = array[i]))) {
        values.push(object);
      } else {
        valuesByKey.set(keyValue, [object]);
      }
    }

    valuesByKey.forEach(function(keyValue) {
      o[keyValue] = map(valuesByKey.get(keyValue), depth);
    });

    return o;
  }

  function entries(map, depth) {
    if (depth >= keys.length) return map;

    var a = [],
        sortKey = sortKeys[depth++],
        key;

    for (key in map) {
      a.push({key: key, values: entries(map[key], depth)});
    }

    if (sortKey) a.sort(function(a, b) {
      return sortKey(a.key, b.key);
    });

    return a;
  }

  nest.map = function(array) {
    return map(array, 0);
  };

  nest.entries = function(array) {
    return entries(map(array, 0), 0);
  };

  nest.key = function(d) {
    keys.push(d);
    return nest;
  };

  // Specifies the order for the most-recently specified key.
  // Note: only applies to entries. Map keys are unordered!
  nest.sortKeys = function(order) {
    sortKeys[keys.length - 1] = order;
    return nest;
  };

  // Specifies the order for leaf values.
  // Applies to both maps and entries array.
  nest.sortValues = function(order) {
    sortValues = order;
    return nest;
  };

  nest.rollup = function(f) {
    rollup = f;
    return nest;
  };

  return nest;
};
d3.keys = function(map) {
  var keys = [];
  for (var key in map) keys.push(key);
  return keys;
};
d3.values = function(map) {
  var values = [];
  for (var key in map) values.push(map[key]);
  return values;
};
d3.entries = function(map) {
  var entries = [];
  for (var key in map) entries.push({key: key, value: map[key]});
  return entries;
};
d3.permute = function(array, indexes) {
  var permutes = [],
      i = -1,
      n = indexes.length;
  while (++i < n) permutes[i] = array[indexes[i]];
  return permutes;
};
d3.merge = function(arrays) {
  return Array.prototype.concat.apply([], arrays);
};
d3.split = function(array, f) {
  var arrays = [],
      values = [],
      value,
      i = -1,
      n = array.length;
  if (arguments.length < 2) f = d3_splitter;
  while (++i < n) {
    if (f.call(values, value = array[i], i)) {
      values = [];
    } else {
      if (!values.length) arrays.push(values);
      values.push(value);
    }
  }
  return arrays;
};

function d3_splitter(d) {
  return d == null;
}
function d3_collapse(s) {
  return s.replace(/(^\s+)|(\s+$)/g, "").replace(/\s+/g, " ");
}
d3.range = function(start, stop, step) {
  if (arguments.length < 3) {
    step = 1;
    if (arguments.length < 2) {
      stop = start;
      start = 0;
    }
  }
  if ((stop - start) / step === Infinity) throw new Error("infinite range");
  var range = [],
       k = d3_range_integerScale(Math.abs(step)),
       i = -1,
       j;
  start *= k, stop *= k, step *= k;
  if (step < 0) while ((j = start + step * ++i) > stop) range.push(j / k);
  else while ((j = start + step * ++i) < stop) range.push(j / k);
  return range;
};

function d3_range_integerScale(x) {
  var k = 1;
  while (x * k % 1) k *= 10;
  return k;
}
d3.requote = function(s) {
  return s.replace(d3_requote_re, "\\$&");
};

var d3_requote_re = /[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;
d3.round = function(x, n) {
  return n
      ? Math.round(x * (n = Math.pow(10, n))) / n
      : Math.round(x);
};
d3.xhr = function(url, mime, callback) {
  var req = new XMLHttpRequest;
  if (arguments.length < 3) callback = mime, mime = null;
  else if (mime && req.overrideMimeType) req.overrideMimeType(mime);
  req.open("GET", url, true);
  if (mime) req.setRequestHeader("Accept", mime);
  req.onreadystatechange = function() {
    if (req.readyState === 4) callback(req.status < 300 ? req : null);
  };
  req.send(null);
};
d3.text = function(url, mime, callback) {
  function ready(req) {
    callback(req && req.responseText);
  }
  if (arguments.length < 3) {
    callback = mime;
    mime = null;
  }
  d3.xhr(url, mime, ready);
};
d3.json = function(url, callback) {
  d3.text(url, "application/json", function(text) {
    callback(text ? JSON.parse(text) : null);
  });
};
d3.html = function(url, callback) {
  d3.text(url, "text/html", function(text) {
    if (text != null) { // Treat empty string as valid HTML.
      var range = document.createRange();
      range.selectNode(document.body);
      text = range.createContextualFragment(text);
    }
    callback(text);
  });
};
d3.xml = function(url, mime, callback) {
  function ready(req) {
    callback(req && req.responseXML);
  }
  if (arguments.length < 3) {
    callback = mime;
    mime = null;
  }
  d3.xhr(url, mime, ready);
};
var d3_nsPrefix = {
  svg: "http://www.w3.org/2000/svg",
  xhtml: "http://www.w3.org/1999/xhtml",
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};

d3.ns = {
  prefix: d3_nsPrefix,
  qualify: function(name) {
    var i = name.indexOf(":"),
        prefix = name;
    if (i >= 0) {
      prefix = name.substring(0, i);
      name = name.substring(i + 1);
    }
    return d3_nsPrefix.hasOwnProperty(prefix)
        ? {space: d3_nsPrefix[prefix], local: name}
        : name;
  }
};
d3.dispatch = function() {
  var dispatch = new d3_dispatch,
      i = -1,
      n = arguments.length;
  while (++i < n) dispatch[arguments[i]] = d3_dispatch_event(dispatch);
  return dispatch;
};

function d3_dispatch() {}

d3_dispatch.prototype.on = function(type, listener) {
  var i = type.indexOf("."),
      name = "";

  // Extract optional namespace, e.g., "click.foo"
  if (i > 0) {
    name = type.substring(i + 1);
    type = type.substring(0, i);
  }

  return arguments.length < 2
      ? this[type].on(name)
      : this[type].on(name, listener);
};

function d3_dispatch_event(dispatch) {
  var listeners = [],
      listenerByName = new d3_Map;

  function event() {
    var z = listeners, // defensive reference
        i = -1,
        n = z.length,
        l;
    while (++i < n) if (l = z[i].on) l.apply(this, arguments);
    return dispatch;
  }

  event.on = function(name, listener) {
    var l = listenerByName.get(name),
        i;

    // return the current listener, if any
    if (arguments.length < 2) return l && l.on;

    // remove the old listener, if any (with copy-on-write)
    if (l) {
      l.on = null;
      listeners = listeners.slice(0, i = listeners.indexOf(l)).concat(listeners.slice(i + 1));
      listenerByName.remove(name);
    }

    // add the new listener, if any
    if (listener) listeners.push(listenerByName.set(name, {on: listener}));

    return dispatch;
  };

  return event;
}
// TODO align
d3.format = function(specifier) {
  var match = d3_format_re.exec(specifier),
      fill = match[1] || " ",
      sign = match[3] || "",
      zfill = match[5],
      width = +match[6],
      comma = match[7],
      precision = match[8],
      type = match[9],
      scale = 1,
      suffix = "",
      integer = false;

  if (precision) precision = +precision.substring(1);

  if (zfill) {
    fill = "0"; // TODO align = "=";
    if (comma) width -= Math.floor((width - 1) / 4);
  }

  switch (type) {
    case "n": comma = true; type = "g"; break;
    case "%": scale = 100; suffix = "%"; type = "f"; break;
    case "p": scale = 100; suffix = "%"; type = "r"; break;
    case "d": integer = true; precision = 0; break;
    case "s": scale = -1; type = "r"; break;
  }

  // If no precision is specified for r, fallback to general notation.
  if (type == "r" && !precision) type = "g";

  type = d3_format_types.get(type) || d3_format_typeDefault;

  return function(value) {

    // Return the empty string for floats formatted as ints.
    if (integer && (value % 1)) return "";

    // Convert negative to positive, and record the sign prefix.
    var negative = (value < 0) && (value = -value) ? "\u2212" : sign;

    // Apply the scale, computing it from the value's exponent for si format.
    if (scale < 0) {
      var prefix = d3.formatPrefix(value, precision);
      value *= prefix.scale;
      suffix = prefix.symbol;
    } else {
      value *= scale;
    }

    // Convert to the desired precision.
    value = type(value, precision);

    // If the fill character is 0, the sign and group is applied after the fill.
    if (zfill) {
      var length = value.length + negative.length;
      if (length < width) value = new Array(width - length + 1).join(fill) + value;
      if (comma) value = d3_format_group(value);
      value = negative + value;
    }

    // Otherwise (e.g., space-filling), the sign and group is applied before.
    else {
      if (comma) value = d3_format_group(value);
      value = negative + value;
      var length = value.length;
      if (length < width) value = new Array(width - length + 1).join(fill) + value;
    }

    return value + suffix;
  };
};

// [[fill]align][sign][#][0][width][,][.precision][type]
var d3_format_re = /(?:([^{])?([<>=^]))?([+\- ])?(#)?(0)?([0-9]+)?(,)?(\.[0-9]+)?([a-zA-Z%])?/;

var d3_format_types = d3.map({
  g: function(x, p) { return x.toPrecision(p); },
  e: function(x, p) { return x.toExponential(p); },
  f: function(x, p) { return x.toFixed(p); },
  r: function(x, p) { return d3.round(x, p = d3_format_precision(x, p)).toFixed(Math.max(0, Math.min(20, p))); }
});

function d3_format_precision(x, p) {
  return p - (x ? 1 + Math.floor(Math.log(x + Math.pow(10, 1 + Math.floor(Math.log(x) / Math.LN10) - p)) / Math.LN10) : 1);
}

function d3_format_typeDefault(x) {
  return x + "";
}

// Apply comma grouping for thousands.
function d3_format_group(value) {
  var i = value.lastIndexOf("."),
      f = i >= 0 ? value.substring(i) : (i = value.length, ""),
      t = [];
  while (i > 0) t.push(value.substring(i -= 3, i + 3));
  return t.reverse().join(",") + f;
}
var d3_formatPrefixes = ["y","z","a","f","p","n","μ","m","","k","M","G","T","P","E","Z","Y"].map(d3_formatPrefix);

d3.formatPrefix = function(value, precision) {
  var i = 0;
  if (value) {
    if (value < 0) value *= -1;
    if (precision) value = d3.round(value, d3_format_precision(value, precision));
    i = 1 + Math.floor(1e-12 + Math.log(value) / Math.LN10);
    i = Math.max(-24, Math.min(24, Math.floor((i <= 0 ? i + 1 : i - 1) / 3) * 3));
  }
  return d3_formatPrefixes[8 + i / 3];
};

function d3_formatPrefix(d, i) {
  return {
    scale: Math.pow(10, (8 - i) * 3),
    symbol: d
  };
}

/*
 * TERMS OF USE - EASING EQUATIONS
 *
 * Open source under the BSD License.
 *
 * Copyright 2001 Robert Penner
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * - Redistributions of source code must retain the above copyright notice, this
 *   list of conditions and the following disclaimer.
 *
 * - Redistributions in binary form must reproduce the above copyright notice,
 *   this list of conditions and the following disclaimer in the documentation
 *   and/or other materials provided with the distribution.
 *
 * - Neither the name of the author nor the names of contributors may be used to
 *   endorse or promote products derived from this software without specific
 *   prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

var d3_ease_quad = d3_ease_poly(2),
    d3_ease_cubic = d3_ease_poly(3),
    d3_ease_default = function() { return d3_ease_identity; };

var d3_ease = d3.map({
  linear: d3_ease_default,
  poly: d3_ease_poly,
  quad: function() { return d3_ease_quad; },
  cubic: function() { return d3_ease_cubic; },
  sin: function() { return d3_ease_sin; },
  exp: function() { return d3_ease_exp; },
  circle: function() { return d3_ease_circle; },
  elastic: d3_ease_elastic,
  back: d3_ease_back,
  bounce: function() { return d3_ease_bounce; }
});

var d3_ease_mode = d3.map({
  "in": d3_ease_identity,
  "out": d3_ease_reverse,
  "in-out": d3_ease_reflect,
  "out-in": function(f) { return d3_ease_reflect(d3_ease_reverse(f)); }
});

d3.ease = function(name) {
  var i = name.indexOf("-"),
      t = i >= 0 ? name.substring(0, i) : name,
      m = i >= 0 ? name.substring(i + 1) : "in";
  t = d3_ease.get(t) || d3_ease_default;
  m = d3_ease_mode.get(m) || d3_ease_identity;
  return d3_ease_clamp(m(t.apply(null, Array.prototype.slice.call(arguments, 1))));
};

function d3_ease_clamp(f) {
  return function(t) {
    return t <= 0 ? 0 : t >= 1 ? 1 : f(t);
  };
}

function d3_ease_reverse(f) {
  return function(t) {
    return 1 - f(1 - t);
  };
}

function d3_ease_reflect(f) {
  return function(t) {
    return .5 * (t < .5 ? f(2 * t) : (2 - f(2 - 2 * t)));
  };
}

function d3_ease_identity(t) {
  return t;
}

function d3_ease_poly(e) {
  return function(t) {
    return Math.pow(t, e);
  };
}

function d3_ease_sin(t) {
  return 1 - Math.cos(t * Math.PI / 2);
}

function d3_ease_exp(t) {
  return Math.pow(2, 10 * (t - 1));
}

function d3_ease_circle(t) {
  return 1 - Math.sqrt(1 - t * t);
}

function d3_ease_elastic(a, p) {
  var s;
  if (arguments.length < 2) p = 0.45;
  if (arguments.length < 1) { a = 1; s = p / 4; }
  else s = p / (2 * Math.PI) * Math.asin(1 / a);
  return function(t) {
    return 1 + a * Math.pow(2, 10 * -t) * Math.sin((t - s) * 2 * Math.PI / p);
  };
}

function d3_ease_back(s) {
  if (!s) s = 1.70158;
  return function(t) {
    return t * t * ((s + 1) * t - s);
  };
}

function d3_ease_bounce(t) {
  return t < 1 / 2.75 ? 7.5625 * t * t
      : t < 2 / 2.75 ? 7.5625 * (t -= 1.5 / 2.75) * t + .75
      : t < 2.5 / 2.75 ? 7.5625 * (t -= 2.25 / 2.75) * t + .9375
      : 7.5625 * (t -= 2.625 / 2.75) * t + .984375;
}
d3.event = null;

function d3_eventCancel() {
  d3.event.stopPropagation();
  d3.event.preventDefault();
}

function d3_eventSource() {
  var e = d3.event, s;
  while (s = e.sourceEvent) e = s;
  return e;
}

// Like d3.dispatch, but for custom events abstracting native UI events. These
// events have a target component (such as a brush), a target element (such as
// the svg:g element containing the brush) and the standard arguments `d` (the
// target element's data) and `i` (the selection index of the target element).
function d3_eventDispatch(target) {
  var dispatch = new d3_dispatch,
      i = 0,
      n = arguments.length;

  while (++i < n) dispatch[arguments[i]] = d3_dispatch_event(dispatch);

  // Creates a dispatch context for the specified `thiz` (typically, the target
  // DOM element that received the source event) and `argumentz` (typically, the
  // data `d` and index `i` of the target element). The returned function can be
  // used to dispatch an event to any registered listeners; the function takes a
  // single argument as input, being the event to dispatch. The event must have
  // a "type" attribute which corresponds to a type registered in the
  // constructor. This context will automatically populate the "sourceEvent" and
  // "target" attributes of the event, as well as setting the `d3.event` global
  // for the duration of the notification.
  dispatch.of = function(thiz, argumentz) {
    return function(e1) {
      try {
        var e0 =
        e1.sourceEvent = d3.event;
        e1.target = target;
        d3.event = e1;
        dispatch[e1.type].apply(thiz, argumentz);
      } finally {
        d3.event = e0;
      }
    };
  };

  return dispatch;
}
d3.interpolate = function(a, b) {
  var i = d3.interpolators.length, f;
  while (--i >= 0 && !(f = d3.interpolators[i](a, b)));
  return f;
};

d3.interpolateNumber = function(a, b) {
  b -= a;
  return function(t) { return a + b * t; };
};

d3.interpolateRound = function(a, b) {
  b -= a;
  return function(t) { return Math.round(a + b * t); };
};

d3.interpolateString = function(a, b) {
  var m, // current match
      i, // current index
      j, // current index (for coallescing)
      s0 = 0, // start index of current string prefix
      s1 = 0, // end index of current string prefix
      s = [], // string constants and placeholders
      q = [], // number interpolators
      n, // q.length
      o;

  // Reset our regular expression!
  d3_interpolate_number.lastIndex = 0;

  // Find all numbers in b.
  for (i = 0; m = d3_interpolate_number.exec(b); ++i) {
    if (m.index) s.push(b.substring(s0, s1 = m.index));
    q.push({i: s.length, x: m[0]});
    s.push(null);
    s0 = d3_interpolate_number.lastIndex;
  }
  if (s0 < b.length) s.push(b.substring(s0));

  // Find all numbers in a.
  for (i = 0, n = q.length; (m = d3_interpolate_number.exec(a)) && i < n; ++i) {
    o = q[i];
    if (o.x == m[0]) { // The numbers match, so coallesce.
      if (o.i) {
        if (s[o.i + 1] == null) { // This match is followed by another number.
          s[o.i - 1] += o.x;
          s.splice(o.i, 1);
          for (j = i + 1; j < n; ++j) q[j].i--;
        } else { // This match is followed by a string, so coallesce twice.
          s[o.i - 1] += o.x + s[o.i + 1];
          s.splice(o.i, 2);
          for (j = i + 1; j < n; ++j) q[j].i -= 2;
        }
      } else {
          if (s[o.i + 1] == null) { // This match is followed by another number.
          s[o.i] = o.x;
        } else { // This match is followed by a string, so coallesce twice.
          s[o.i] = o.x + s[o.i + 1];
          s.splice(o.i + 1, 1);
          for (j = i + 1; j < n; ++j) q[j].i--;
        }
      }
      q.splice(i, 1);
      n--;
      i--;
    } else {
      o.x = d3.interpolateNumber(parseFloat(m[0]), parseFloat(o.x));
    }
  }

  // Remove any numbers in b not found in a.
  while (i < n) {
    o = q.pop();
    if (s[o.i + 1] == null) { // This match is followed by another number.
      s[o.i] = o.x;
    } else { // This match is followed by a string, so coallesce twice.
      s[o.i] = o.x + s[o.i + 1];
      s.splice(o.i + 1, 1);
    }
    n--;
  }

  // Special optimization for only a single match.
  if (s.length === 1) {
    return s[0] == null ? q[0].x : function() { return b; };
  }

  // Otherwise, interpolate each of the numbers and rejoin the string.
  return function(t) {
    for (i = 0; i < n; ++i) s[(o = q[i]).i] = o.x(t);
    return s.join("");
  };
};

d3.interpolateTransform = function(a, b) {
  var s = [], // string constants and placeholders
      q = [], // number interpolators
      n,
      A = d3.transform(a),
      B = d3.transform(b),
      ta = A.translate,
      tb = B.translate,
      ra = A.rotate,
      rb = B.rotate,
      wa = A.skew,
      wb = B.skew,
      ka = A.scale,
      kb = B.scale;

  if (ta[0] != tb[0] || ta[1] != tb[1]) {
    s.push("translate(", null, ",", null, ")");
    q.push({i: 1, x: d3.interpolateNumber(ta[0], tb[0])}, {i: 3, x: d3.interpolateNumber(ta[1], tb[1])});
  } else if (tb[0] || tb[1]) {
    s.push("translate(" + tb + ")");
  } else {
    s.push("");
  }

  if (ra != rb) {
    q.push({i: s.push(s.pop() + "rotate(", null, ")") - 2, x: d3.interpolateNumber(ra, rb)});
  } else if (rb) {
    s.push(s.pop() + "rotate(" + rb + ")");
  }

  if (wa != wb) {
    q.push({i: s.push(s.pop() + "skewX(", null, ")") - 2, x: d3.interpolateNumber(wa, wb)});
  } else if (wb) {
    s.push(s.pop() + "skewX(" + wb + ")");
  }

  if (ka[0] != kb[0] || ka[1] != kb[1]) {
    n = s.push(s.pop() + "scale(", null, ",", null, ")");
    q.push({i: n - 4, x: d3.interpolateNumber(ka[0], kb[0])}, {i: n - 2, x: d3.interpolateNumber(ka[1], kb[1])});
  } else if (kb[0] != 1 || kb[1] != 1) {
    s.push(s.pop() + "scale(" + kb + ")");
  }

  n = q.length;
  return function(t) {
    var i = -1, o;
    while (++i < n) s[(o = q[i]).i] = o.x(t);
    return s.join("");
  };
};

d3.interpolateRgb = function(a, b) {
  a = d3.rgb(a);
  b = d3.rgb(b);
  var ar = a.r,
      ag = a.g,
      ab = a.b,
      br = b.r - ar,
      bg = b.g - ag,
      bb = b.b - ab;
  return function(t) {
    return "#"
        + d3_rgb_hex(Math.round(ar + br * t))
        + d3_rgb_hex(Math.round(ag + bg * t))
        + d3_rgb_hex(Math.round(ab + bb * t));
  };
};

// interpolates HSL space, but outputs RGB string (for compatibility)
d3.interpolateHsl = function(a, b) {
  a = d3.hsl(a);
  b = d3.hsl(b);
  var h0 = a.h,
      s0 = a.s,
      l0 = a.l,
      h1 = b.h - h0,
      s1 = b.s - s0,
      l1 = b.l - l0;
  return function(t) {
    return d3_hsl_rgb(h0 + h1 * t, s0 + s1 * t, l0 + l1 * t).toString();
  };
};

d3.interpolateArray = function(a, b) {
  var x = [],
      c = [],
      na = a.length,
      nb = b.length,
      n0 = Math.min(a.length, b.length),
      i;
  for (i = 0; i < n0; ++i) x.push(d3.interpolate(a[i], b[i]));
  for (; i < na; ++i) c[i] = a[i];
  for (; i < nb; ++i) c[i] = b[i];
  return function(t) {
    for (i = 0; i < n0; ++i) c[i] = x[i](t);
    return c;
  };
};

d3.interpolateObject = function(a, b) {
  var i = {},
      c = {},
      k;
  for (k in a) {
    if (k in b) {
      i[k] = d3_interpolateByName(k)(a[k], b[k]);
    } else {
      c[k] = a[k];
    }
  }
  for (k in b) {
    if (!(k in a)) {
      c[k] = b[k];
    }
  }
  return function(t) {
    for (k in i) c[k] = i[k](t);
    return c;
  };
}

var d3_interpolate_number = /[-+]?(?:\d*\.?\d+)(?:[eE][-+]?\d+)?/g;

function d3_interpolateByName(n) {
  return n == "transform"
      ? d3.interpolateTransform
      : d3.interpolate;
}

d3.interpolators = [
  d3.interpolateObject,
  function(a, b) { return (b instanceof Array) && d3.interpolateArray(a, b); },
  function(a, b) { return (typeof a === "string" || typeof b === "string") && d3.interpolateString(a + "", b + ""); },
  function(a, b) { return (typeof b === "string" ? d3_rgb_names.has(b) || /^(#|rgb\(|hsl\()/.test(b) : b instanceof d3_Rgb || b instanceof d3_Hsl) && d3.interpolateRgb(a, b); },
  function(a, b) { return !isNaN(a = +a) && !isNaN(b = +b) && d3.interpolateNumber(a, b); }
];
function d3_uninterpolateNumber(a, b) {
  b = b - (a = +a) ? 1 / (b - a) : 0;
  return function(x) { return (x - a) * b; };
}

function d3_uninterpolateClamp(a, b) {
  b = b - (a = +a) ? 1 / (b - a) : 0;
  return function(x) { return Math.max(0, Math.min(1, (x - a) * b)); };
}
d3.rgb = function(r, g, b) {
  return arguments.length === 1
      ? (r instanceof d3_Rgb ? d3_rgb(r.r, r.g, r.b)
      : d3_rgb_parse("" + r, d3_rgb, d3_hsl_rgb))
      : d3_rgb(~~r, ~~g, ~~b);
};

function d3_rgb(r, g, b) {
  return new d3_Rgb(r, g, b);
}

function d3_Rgb(r, g, b) {
  this.r = r;
  this.g = g;
  this.b = b;
}

d3_Rgb.prototype.brighter = function(k) {
  k = Math.pow(0.7, arguments.length ? k : 1);
  var r = this.r,
      g = this.g,
      b = this.b,
      i = 30;
  if (!r && !g && !b) return d3_rgb(i, i, i);
  if (r && r < i) r = i;
  if (g && g < i) g = i;
  if (b && b < i) b = i;
  return d3_rgb(
      Math.min(255, Math.floor(r / k)),
      Math.min(255, Math.floor(g / k)),
      Math.min(255, Math.floor(b / k)));
};

d3_Rgb.prototype.darker = function(k) {
  k = Math.pow(0.7, arguments.length ? k : 1);
  return d3_rgb(
      Math.floor(k * this.r),
      Math.floor(k * this.g),
      Math.floor(k * this.b));
};

d3_Rgb.prototype.hsl = function() {
  return d3_rgb_hsl(this.r, this.g, this.b);
};

d3_Rgb.prototype.toString = function() {
  return "#" + d3_rgb_hex(this.r) + d3_rgb_hex(this.g) + d3_rgb_hex(this.b);
};

function d3_rgb_hex(v) {
  return v < 0x10
      ? "0" + Math.max(0, v).toString(16)
      : Math.min(255, v).toString(16);
}

function d3_rgb_parse(format, rgb, hsl) {
  var r = 0, // red channel; int in [0, 255]
      g = 0, // green channel; int in [0, 255]
      b = 0, // blue channel; int in [0, 255]
      m1, // CSS color specification match
      m2, // CSS color specification type (e.g., rgb)
      name;

  /* Handle hsl, rgb. */
  m1 = /([a-z]+)\((.*)\)/i.exec(format);
  if (m1) {
    m2 = m1[2].split(",");
    switch (m1[1]) {
      case "hsl": {
        return hsl(
          parseFloat(m2[0]), // degrees
          parseFloat(m2[1]) / 100, // percentage
          parseFloat(m2[2]) / 100 // percentage
        );
      }
      case "rgb": {
        return rgb(
          d3_rgb_parseNumber(m2[0]),
          d3_rgb_parseNumber(m2[1]),
          d3_rgb_parseNumber(m2[2])
        );
      }
    }
  }

  /* Named colors. */
  if (name = d3_rgb_names.get(format)) return rgb(name.r, name.g, name.b);

  /* Hexadecimal colors: #rgb and #rrggbb. */
  if (format != null && format.charAt(0) === "#") {
    if (format.length === 4) {
      r = format.charAt(1); r += r;
      g = format.charAt(2); g += g;
      b = format.charAt(3); b += b;
    } else if (format.length === 7) {
      r = format.substring(1, 3);
      g = format.substring(3, 5);
      b = format.substring(5, 7);
    }
    r = parseInt(r, 16);
    g = parseInt(g, 16);
    b = parseInt(b, 16);
  }

  return rgb(r, g, b);
}

function d3_rgb_hsl(r, g, b) {
  var min = Math.min(r /= 255, g /= 255, b /= 255),
      max = Math.max(r, g, b),
      d = max - min,
      h,
      s,
      l = (max + min) / 2;
  if (d) {
    s = l < .5 ? d / (max + min) : d / (2 - max - min);
    if (r == max) h = (g - b) / d + (g < b ? 6 : 0);
    else if (g == max) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  } else {
    s = h = 0;
  }
  return d3_hsl(h, s, l);
}

function d3_rgb_parseNumber(c) { // either integer or percentage
  var f = parseFloat(c);
  return c.charAt(c.length - 1) === "%" ? Math.round(f * 2.55) : f;
}

var d3_rgb_names = d3.map({
  aliceblue: "#f0f8ff",
  antiquewhite: "#faebd7",
  aqua: "#00ffff",
  aquamarine: "#7fffd4",
  azure: "#f0ffff",
  beige: "#f5f5dc",
  bisque: "#ffe4c4",
  black: "#000000",
  blanchedalmond: "#ffebcd",
  blue: "#0000ff",
  blueviolet: "#8a2be2",
  brown: "#a52a2a",
  burlywood: "#deb887",
  cadetblue: "#5f9ea0",
  chartreuse: "#7fff00",
  chocolate: "#d2691e",
  coral: "#ff7f50",
  cornflowerblue: "#6495ed",
  cornsilk: "#fff8dc",
  crimson: "#dc143c",
  cyan: "#00ffff",
  darkblue: "#00008b",
  darkcyan: "#008b8b",
  darkgoldenrod: "#b8860b",
  darkgray: "#a9a9a9",
  darkgreen: "#006400",
  darkgrey: "#a9a9a9",
  darkkhaki: "#bdb76b",
  darkmagenta: "#8b008b",
  darkolivegreen: "#556b2f",
  darkorange: "#ff8c00",
  darkorchid: "#9932cc",
  darkred: "#8b0000",
  darksalmon: "#e9967a",
  darkseagreen: "#8fbc8f",
  darkslateblue: "#483d8b",
  darkslategray: "#2f4f4f",
  darkslategrey: "#2f4f4f",
  darkturquoise: "#00ced1",
  darkviolet: "#9400d3",
  deeppink: "#ff1493",
  deepskyblue: "#00bfff",
  dimgray: "#696969",
  dimgrey: "#696969",
  dodgerblue: "#1e90ff",
  firebrick: "#b22222",
  floralwhite: "#fffaf0",
  forestgreen: "#228b22",
  fuchsia: "#ff00ff",
  gainsboro: "#dcdcdc",
  ghostwhite: "#f8f8ff",
  gold: "#ffd700",
  goldenrod: "#daa520",
  gray: "#808080",
  green: "#008000",
  greenyellow: "#adff2f",
  grey: "#808080",
  honeydew: "#f0fff0",
  hotpink: "#ff69b4",
  indianred: "#cd5c5c",
  indigo: "#4b0082",
  ivory: "#fffff0",
  khaki: "#f0e68c",
  lavender: "#e6e6fa",
  lavenderblush: "#fff0f5",
  lawngreen: "#7cfc00",
  lemonchiffon: "#fffacd",
  lightblue: "#add8e6",
  lightcoral: "#f08080",
  lightcyan: "#e0ffff",
  lightgoldenrodyellow: "#fafad2",
  lightgray: "#d3d3d3",
  lightgreen: "#90ee90",
  lightgrey: "#d3d3d3",
  lightpink: "#ffb6c1",
  lightsalmon: "#ffa07a",
  lightseagreen: "#20b2aa",
  lightskyblue: "#87cefa",
  lightslategray: "#778899",
  lightslategrey: "#778899",
  lightsteelblue: "#b0c4de",
  lightyellow: "#ffffe0",
  lime: "#00ff00",
  limegreen: "#32cd32",
  linen: "#faf0e6",
  magenta: "#ff00ff",
  maroon: "#800000",
  mediumaquamarine: "#66cdaa",
  mediumblue: "#0000cd",
  mediumorchid: "#ba55d3",
  mediumpurple: "#9370db",
  mediumseagreen: "#3cb371",
  mediumslateblue: "#7b68ee",
  mediumspringgreen: "#00fa9a",
  mediumturquoise: "#48d1cc",
  mediumvioletred: "#c71585",
  midnightblue: "#191970",
  mintcream: "#f5fffa",
  mistyrose: "#ffe4e1",
  moccasin: "#ffe4b5",
  navajowhite: "#ffdead",
  navy: "#000080",
  oldlace: "#fdf5e6",
  olive: "#808000",
  olivedrab: "#6b8e23",
  orange: "#ffa500",
  orangered: "#ff4500",
  orchid: "#da70d6",
  palegoldenrod: "#eee8aa",
  palegreen: "#98fb98",
  paleturquoise: "#afeeee",
  palevioletred: "#db7093",
  papayawhip: "#ffefd5",
  peachpuff: "#ffdab9",
  peru: "#cd853f",
  pink: "#ffc0cb",
  plum: "#dda0dd",
  powderblue: "#b0e0e6",
  purple: "#800080",
  red: "#ff0000",
  rosybrown: "#bc8f8f",
  royalblue: "#4169e1",
  saddlebrown: "#8b4513",
  salmon: "#fa8072",
  sandybrown: "#f4a460",
  seagreen: "#2e8b57",
  seashell: "#fff5ee",
  sienna: "#a0522d",
  silver: "#c0c0c0",
  skyblue: "#87ceeb",
  slateblue: "#6a5acd",
  slategray: "#708090",
  slategrey: "#708090",
  snow: "#fffafa",
  springgreen: "#00ff7f",
  steelblue: "#4682b4",
  tan: "#d2b48c",
  teal: "#008080",
  thistle: "#d8bfd8",
  tomato: "#ff6347",
  turquoise: "#40e0d0",
  violet: "#ee82ee",
  wheat: "#f5deb3",
  white: "#ffffff",
  whitesmoke: "#f5f5f5",
  yellow: "#ffff00",
  yellowgreen: "#9acd32"
});

d3_rgb_names.forEach(function(key, value) {
  d3_rgb_names.set(key, d3_rgb_parse(value, d3_rgb, d3_hsl_rgb));
});
d3.hsl = function(h, s, l) {
  return arguments.length === 1
      ? (h instanceof d3_Hsl ? d3_hsl(h.h, h.s, h.l)
      : d3_rgb_parse("" + h, d3_rgb_hsl, d3_hsl))
      : d3_hsl(+h, +s, +l);
};

function d3_hsl(h, s, l) {
  return new d3_Hsl(h, s, l);
}

function d3_Hsl(h, s, l) {
  this.h = h;
  this.s = s;
  this.l = l;
}

d3_Hsl.prototype.brighter = function(k) {
  k = Math.pow(0.7, arguments.length ? k : 1);
  return d3_hsl(this.h, this.s, this.l / k);
};

d3_Hsl.prototype.darker = function(k) {
  k = Math.pow(0.7, arguments.length ? k : 1);
  return d3_hsl(this.h, this.s, k * this.l);
};

d3_Hsl.prototype.rgb = function() {
  return d3_hsl_rgb(this.h, this.s, this.l);
};

d3_Hsl.prototype.toString = function() {
  return this.rgb().toString();
};

function d3_hsl_rgb(h, s, l) {
  var m1,
      m2;

  /* Some simple corrections for h, s and l. */
  h = h % 360; if (h < 0) h += 360;
  s = s < 0 ? 0 : s > 1 ? 1 : s;
  l = l < 0 ? 0 : l > 1 ? 1 : l;

  /* From FvD 13.37, CSS Color Module Level 3 */
  m2 = l <= .5 ? l * (1 + s) : l + s - l * s;
  m1 = 2 * l - m2;

  function v(h) {
    if (h > 360) h -= 360;
    else if (h < 0) h += 360;
    if (h < 60) return m1 + (m2 - m1) * h / 60;
    if (h < 180) return m2;
    if (h < 240) return m1 + (m2 - m1) * (240 - h) / 60;
    return m1;
  }

  function vv(h) {
    return Math.round(v(h) * 255);
  }

  return d3_rgb(vv(h + 120), vv(h), vv(h - 120));
}
function d3_selection(groups) {
  d3_arraySubclass(groups, d3_selectionPrototype);
  return groups;
}

var d3_select = function(s, n) { return n.querySelector(s); },
    d3_selectAll = function(s, n) { return n.querySelectorAll(s); },
    d3_selectRoot = document.documentElement,
    d3_selectMatcher = d3_selectRoot.matchesSelector || d3_selectRoot.webkitMatchesSelector || d3_selectRoot.mozMatchesSelector || d3_selectRoot.msMatchesSelector || d3_selectRoot.oMatchesSelector,
    d3_selectMatches = function(n, s) { return d3_selectMatcher.call(n, s); };

// Prefer Sizzle, if available.
if (typeof Sizzle === "function") {
  d3_select = function(s, n) { return Sizzle(s, n)[0]; };
  d3_selectAll = function(s, n) { return Sizzle.uniqueSort(Sizzle(s, n)); };
  d3_selectMatches = Sizzle.matchesSelector;
}

var d3_selectionPrototype = [];

d3.selection = function() {
  return d3_selectionRoot;
};

d3.selection.prototype = d3_selectionPrototype;
d3_selectionPrototype.select = function(selector) {
  var subgroups = [],
      subgroup,
      subnode,
      group,
      node;

  if (typeof selector !== "function") selector = d3_selection_selector(selector);

  for (var j = -1, m = this.length; ++j < m;) {
    subgroups.push(subgroup = []);
    subgroup.parentNode = (group = this[j]).parentNode;
    for (var i = -1, n = group.length; ++i < n;) {
      if (node = group[i]) {
        subgroup.push(subnode = selector.call(node, node.__data__, i));
        if (subnode && "__data__" in node) subnode.__data__ = node.__data__;
      } else {
        subgroup.push(null);
      }
    }
  }

  return d3_selection(subgroups);
};

function d3_selection_selector(selector) {
  return function() {
    return d3_select(selector, this);
  };
}
d3_selectionPrototype.selectAll = function(selector) {
  var subgroups = [],
      subgroup,
      node;

  if (typeof selector !== "function") selector = d3_selection_selectorAll(selector);

  for (var j = -1, m = this.length; ++j < m;) {
    for (var group = this[j], i = -1, n = group.length; ++i < n;) {
      if (node = group[i]) {
        subgroups.push(subgroup = d3_array(selector.call(node, node.__data__, i)));
        subgroup.parentNode = node;
      }
    }
  }

  return d3_selection(subgroups);
};

function d3_selection_selectorAll(selector) {
  return function() {
    return d3_selectAll(selector, this);
  };
}
d3_selectionPrototype.attr = function(name, value) {
  name = d3.ns.qualify(name);

  // If no value is specified, return the first value.
  if (arguments.length < 2) {
    var node = this.node();
    return name.local
        ? node.getAttributeNS(name.space, name.local)
        : node.getAttribute(name);
  }

  function attrNull() {
    this.removeAttribute(name);
  }

  function attrNullNS() {
    this.removeAttributeNS(name.space, name.local);
  }

  function attrConstant() {
    this.setAttribute(name, value);
  }

  function attrConstantNS() {
    this.setAttributeNS(name.space, name.local, value);
  }

  function attrFunction() {
    var x = value.apply(this, arguments);
    if (x == null) this.removeAttribute(name);
    else this.setAttribute(name, x);
  }

  function attrFunctionNS() {
    var x = value.apply(this, arguments);
    if (x == null) this.removeAttributeNS(name.space, name.local);
    else this.setAttributeNS(name.space, name.local, x);
  }

  return this.each(value == null
      ? (name.local ? attrNullNS : attrNull) : (typeof value === "function"
      ? (name.local ? attrFunctionNS : attrFunction)
      : (name.local ? attrConstantNS : attrConstant)));
};
d3_selectionPrototype.classed = function(name, value) {
  var names = name.split(d3_selection_classedWhitespace),
      n = names.length,
      i = -1;
  if (arguments.length > 1) {
    while (++i < n) d3_selection_classed.call(this, names[i], value);
    return this;
  } else {
    while (++i < n) if (!d3_selection_classed.call(this, names[i])) return false;
    return true;
  }
};

var d3_selection_classedWhitespace = /\s+/g;

function d3_selection_classed(name, value) {
  var re = new RegExp("(^|\\s+)" + d3.requote(name) + "(\\s+|$)", "g");

  // If no value is specified, return the first value.
  if (arguments.length < 2) {
    var node = this.node();
    if (c = node.classList) return c.contains(name);
    var c = node.className;
    re.lastIndex = 0;
    return re.test(c.baseVal != null ? c.baseVal : c);
  }

  function classedAdd() {
    if (c = this.classList) return c.add(name);
    var c = this.className,
        cb = c.baseVal != null,
        cv = cb ? c.baseVal : c;
    re.lastIndex = 0;
    if (!re.test(cv)) {
      cv = d3_collapse(cv + " " + name);
      if (cb) c.baseVal = cv;
      else this.className = cv;
    }
  }

  function classedRemove() {
    if (c = this.classList) return c.remove(name);
    var c = this.className,
        cb = c.baseVal != null,
        cv = cb ? c.baseVal : c;
    cv = d3_collapse(cv.replace(re, " "));
    if (cb) c.baseVal = cv;
    else this.className = cv;
  }

  function classedFunction() {
    (value.apply(this, arguments)
        ? classedAdd
        : classedRemove).call(this);
  }

  return this.each(typeof value === "function"
      ? classedFunction : value
      ? classedAdd
      : classedRemove);
}
d3_selectionPrototype.style = function(name, value, priority) {
  if (arguments.length < 3) priority = "";

  // If no value is specified, return the first value.
  if (arguments.length < 2) return window
      .getComputedStyle(this.node(), null)
      .getPropertyValue(name);

  function styleNull() {
    this.style.removeProperty(name);
  }

  function styleConstant() {
    this.style.setProperty(name, value, priority);
  }

  function styleFunction() {
    var x = value.apply(this, arguments);
    if (x == null) this.style.removeProperty(name);
    else this.style.setProperty(name, x, priority);
  }

  return this.each(value == null
      ? styleNull : (typeof value === "function"
      ? styleFunction : styleConstant));
};
d3_selectionPrototype.property = function(name, value) {

  // If no value is specified, return the first value.
  if (arguments.length < 2) return this.node()[name];

  function propertyNull() {
    delete this[name];
  }

  function propertyConstant() {
    this[name] = value;
  }

  function propertyFunction() {
    var x = value.apply(this, arguments);
    if (x == null) delete this[name];
    else this[name] = x;
  }

  return this.each(value == null
      ? propertyNull : (typeof value === "function"
      ? propertyFunction : propertyConstant));
};
d3_selectionPrototype.text = function(value) {
  return arguments.length < 1
      ? this.node().textContent : this.each(typeof value === "function"
      ? function() { var v = value.apply(this, arguments); this.textContent = v == null ? "" : v; } : value == null
      ? function() { this.textContent = ""; }
      : function() { this.textContent = value; });
};
d3_selectionPrototype.html = function(value) {
  return arguments.length < 1
      ? this.node().innerHTML : this.each(typeof value === "function"
      ? function() { var v = value.apply(this, arguments); this.innerHTML = v == null ? "" : v; } : value == null
      ? function() { this.innerHTML = ""; }
      : function() { this.innerHTML = value; });
};
// TODO append(node)?
// TODO append(function)?
d3_selectionPrototype.append = function(name) {
  name = d3.ns.qualify(name);

  function append() {
    return this.appendChild(document.createElementNS(this.namespaceURI, name));
  }

  function appendNS() {
    return this.appendChild(document.createElementNS(name.space, name.local));
  }

  return this.select(name.local ? appendNS : append);
};
// TODO insert(node, function)?
// TODO insert(function, string)?
// TODO insert(function, function)?
d3_selectionPrototype.insert = function(name, before) {
  name = d3.ns.qualify(name);

  function insert() {
    return this.insertBefore(
        document.createElementNS(this.namespaceURI, name),
        d3_select(before, this));
  }

  function insertNS() {
    return this.insertBefore(
        document.createElementNS(name.space, name.local),
        d3_select(before, this));
  }

  return this.select(name.local ? insertNS : insert);
};
// TODO remove(selector)?
// TODO remove(node)?
// TODO remove(function)?
d3_selectionPrototype.remove = function() {
  return this.each(function() {
    var parent = this.parentNode;
    if (parent) parent.removeChild(this);
  });
};
d3_selectionPrototype.data = function(value, key) {
  var i = -1,
      n = this.length,
      group,
      node;

  // If no value is specified, return the first value.
  if (!arguments.length) {
    value = new Array(n = (group = this[0]).length);
    while (++i < n) {
      if (node = group[i]) {
        value[i] = node.__data__;
      }
    }
    return value;
  }

  function bind(group, groupData) {
    var i,
        n = group.length,
        m = groupData.length,
        n0 = Math.min(n, m),
        n1 = Math.max(n, m),
        updateNodes = [],
        enterNodes = [],
        exitNodes = [],
        node,
        nodeData;

    if (key) {
      var nodeByKeyValue = new d3_Map,
          keyValues = [],
          keyValue,
          j = groupData.length;

      for (i = -1; ++i < n;) {
        keyValue = key.call(node = group[i], node.__data__, i);
        if (nodeByKeyValue.has(keyValue)) {
          exitNodes[j++] = node; // duplicate key
        } else {
          nodeByKeyValue.set(keyValue, node);
        }
        keyValues.push(keyValue);
      }

      for (i = -1; ++i < m;) {
        keyValue = key.call(groupData, nodeData = groupData[i], i)
        if (nodeByKeyValue.has(keyValue)) {
          updateNodes[i] = node = nodeByKeyValue.get(keyValue);
          node.__data__ = nodeData;
          enterNodes[i] = exitNodes[i] = null;
        } else {
          enterNodes[i] = d3_selection_dataNode(nodeData);
          updateNodes[i] = exitNodes[i] = null;
        }
        nodeByKeyValue.remove(keyValue);
      }

      for (i = -1; ++i < n;) {
        if (nodeByKeyValue.has(keyValues[i])) {
          exitNodes[i] = group[i];
        }
      }
    } else {
      for (i = -1; ++i < n0;) {
        node = group[i];
        nodeData = groupData[i];
        if (node) {
          node.__data__ = nodeData;
          updateNodes[i] = node;
          enterNodes[i] = exitNodes[i] = null;
        } else {
          enterNodes[i] = d3_selection_dataNode(nodeData);
          updateNodes[i] = exitNodes[i] = null;
        }
      }
      for (; i < m; ++i) {
        enterNodes[i] = d3_selection_dataNode(groupData[i]);
        updateNodes[i] = exitNodes[i] = null;
      }
      for (; i < n1; ++i) {
        exitNodes[i] = group[i];
        enterNodes[i] = updateNodes[i] = null;
      }
    }

    enterNodes.update
        = updateNodes;

    enterNodes.parentNode
        = updateNodes.parentNode
        = exitNodes.parentNode
        = group.parentNode;

    enter.push(enterNodes);
    update.push(updateNodes);
    exit.push(exitNodes);
  }

  var enter = d3_selection_enter([]),
      update = d3_selection([]),
      exit = d3_selection([]);

  if (typeof value === "function") {
    while (++i < n) {
      bind(group = this[i], value.call(group, group.parentNode.__data__, i));
    }
  } else {
    while (++i < n) {
      bind(group = this[i], value);
    }
  }

  update.enter = function() { return enter; };
  update.exit = function() { return exit; };
  return update;
};

function d3_selection_dataNode(data) {
  return {__data__: data};
}
d3_selectionPrototype.datum =
d3_selectionPrototype.map = function(value) {
  return arguments.length < 1
      ? this.property("__data__")
      : this.property("__data__", value);
};
d3_selectionPrototype.filter = function(filter) {
  var subgroups = [],
      subgroup,
      group,
      node;

  if (typeof filter !== "function") filter = d3_selection_filter(filter);

  for (var j = 0, m = this.length; j < m; j++) {
    subgroups.push(subgroup = []);
    subgroup.parentNode = (group = this[j]).parentNode;
    for (var i = 0, n = group.length; i < n; i++) {
      if ((node = group[i]) && filter.call(node, node.__data__, i)) {
        subgroup.push(node);
      }
    }
  }

  return d3_selection(subgroups);
};

function d3_selection_filter(selector) {
  return function() {
    return d3_selectMatches(this, selector);
  };
}
d3_selectionPrototype.order = function() {
  for (var j = -1, m = this.length; ++j < m;) {
    for (var group = this[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
      if (node = group[i]) {
        if (next && next !== node.nextSibling) next.parentNode.insertBefore(node, next);
        next = node;
      }
    }
  }
  return this;
};
d3_selectionPrototype.sort = function(comparator) {
  comparator = d3_selection_sortComparator.apply(this, arguments);
  for (var j = -1, m = this.length; ++j < m;) this[j].sort(comparator);
  return this.order();
};

function d3_selection_sortComparator(comparator) {
  if (!arguments.length) comparator = d3.ascending;
  return function(a, b) {
    return comparator(a && a.__data__, b && b.__data__);
  };
}
// type can be namespaced, e.g., "click.foo"
// listener can be null for removal
d3_selectionPrototype.on = function(type, listener, capture) {
  if (arguments.length < 3) capture = false;

  // parse the type specifier
  var name = "__on" + type, i = type.indexOf(".");
  if (i > 0) type = type.substring(0, i);

  // if called with only one argument, return the current listener
  if (arguments.length < 2) return (i = this.node()[name]) && i._;

  // remove the old event listener, and add the new event listener
  return this.each(function(d, i) {
    var node = this,
        o = node[name];

    // remove the old listener, if any (using the previously-set capture)
    if (o) {
      node.removeEventListener(type, o, o.$);
      delete node[name];
    }

    // add the new listener, if any (remembering the capture flag)
    if (listener) {
      node.addEventListener(type, node[name] = l, l.$ = capture);
      l._ = listener; // stash the unwrapped listener for get
    }

    // wrapped event listener that preserves i
    function l(e) {
      var o = d3.event; // Events can be reentrant (e.g., focus).
      d3.event = e;
      try {
        listener.call(node, node.__data__, i);
      } finally {
        d3.event = o;
      }
    }
  });
};
d3_selectionPrototype.each = function(callback) {
  for (var j = -1, m = this.length; ++j < m;) {
    for (var group = this[j], i = -1, n = group.length; ++i < n;) {
      var node = group[i];
      if (node) callback.call(node, node.__data__, i, j);
    }
  }
  return this;
};
//
// Note: assigning to the arguments array simultaneously changes the value of
// the corresponding argument!
//
// TODO The `this` argument probably shouldn't be the first argument to the
// callback, anyway, since it's redundant. However, that will require a major
// version bump due to backwards compatibility, so I'm not changing it right
// away.
//
d3_selectionPrototype.call = function(callback) {
  callback.apply(this, (arguments[0] = this, arguments));
  return this;
};
d3_selectionPrototype.empty = function() {
  return !this.node();
};
d3_selectionPrototype.node = function(callback) {
  for (var j = 0, m = this.length; j < m; j++) {
    for (var group = this[j], i = 0, n = group.length; i < n; i++) {
      var node = group[i];
      if (node) return node;
    }
  }
  return null;
};
d3_selectionPrototype.transition = function() {
  var subgroups = [],
      subgroup,
      node;

  for (var j = -1, m = this.length; ++j < m;) {
    subgroups.push(subgroup = []);
    for (var group = this[j], i = -1, n = group.length; ++i < n;) {
      subgroup.push((node = group[i]) ? {node: node, delay: d3_transitionDelay, duration: d3_transitionDuration} : null);
    }
  }

  return d3_transition(subgroups, d3_transitionId || ++d3_transitionNextId, Date.now());
};
var d3_selectionRoot = d3_selection([[document]]);

d3_selectionRoot[0].parentNode = d3_selectRoot;

// TODO fast singleton implementation!
// TODO select(function)
d3.select = function(selector) {
  return typeof selector === "string"
      ? d3_selectionRoot.select(selector)
      : d3_selection([[selector]]); // assume node
};

// TODO selectAll(function)
d3.selectAll = function(selector) {
  return typeof selector === "string"
      ? d3_selectionRoot.selectAll(selector)
      : d3_selection([d3_array(selector)]); // assume node[]
};
function d3_selection_enter(selection) {
  d3_arraySubclass(selection, d3_selection_enterPrototype);
  return selection;
}

var d3_selection_enterPrototype = [];

d3.selection.enter = d3_selection_enter;
d3.selection.enter.prototype = d3_selection_enterPrototype;

d3_selection_enterPrototype.append = d3_selectionPrototype.append;
d3_selection_enterPrototype.insert = d3_selectionPrototype.insert;
d3_selection_enterPrototype.empty = d3_selectionPrototype.empty;
d3_selection_enterPrototype.node = d3_selectionPrototype.node;
d3_selection_enterPrototype.select = function(selector) {
  var subgroups = [],
      subgroup,
      subnode,
      upgroup,
      group,
      node;

  for (var j = -1, m = this.length; ++j < m;) {
    upgroup = (group = this[j]).update;
    subgroups.push(subgroup = []);
    subgroup.parentNode = group.parentNode;
    for (var i = -1, n = group.length; ++i < n;) {
      if (node = group[i]) {
        subgroup.push(upgroup[i] = subnode = selector.call(group.parentNode, node.__data__, i));
        subnode.__data__ = node.__data__;
      } else {
        subgroup.push(null);
      }
    }
  }

  return d3_selection(subgroups);
};
function d3_transition(groups, id, time) {
  d3_arraySubclass(groups, d3_transitionPrototype);

  var tweens = new d3_Map,
      event = d3.dispatch("start", "end"),
      ease = d3_transitionEase;

  groups.id = id;

  groups.time = time;

  groups.tween = function(name, tween) {
    if (arguments.length < 2) return tweens.get(name);
    if (tween == null) tweens.remove(name);
    else tweens.set(name, tween);
    return groups;
  };

  groups.ease = function(value) {
    if (!arguments.length) return ease;
    ease = typeof value === "function" ? value : d3.ease.apply(d3, arguments);
    return groups;
  };

  groups.each = function(type, listener) {
    if (arguments.length < 2) return d3_transition_each.call(groups, type);
    event.on(type, listener);
    return groups;
  };

  d3.timer(function(elapsed) {
    groups.each(function(d, i, j) {
      var tweened = [],
          node = this,
          delay = groups[j][i].delay,
          duration = groups[j][i].duration,
          lock = node.__transition__ || (node.__transition__ = {active: 0, count: 0});

      ++lock.count;

      delay <= elapsed ? start(elapsed) : d3.timer(start, delay, time);

      function start(elapsed) {
        if (lock.active > id) return stop();
        lock.active = id;

        tweens.forEach(function(key, value) {
          if (tween = value.call(node, d, i)) {
            tweened.push(tween);
          }
        });

        event.start.call(node, d, i);
        if (!tick(elapsed)) d3.timer(tick, 0, time);
        return 1;
      }

      function tick(elapsed) {
        if (lock.active !== id) return stop();

        var t = (elapsed - delay) / duration,
            e = ease(t),
            n = tweened.length;

        while (n > 0) {
          tweened[--n].call(node, e);
        }

        if (t >= 1) {
          stop();
          d3_transitionId = id;
          event.end.call(node, d, i);
          d3_transitionId = 0;
          return 1;
        }
      }

      function stop() {
        if (!--lock.count) delete node.__transition__;
        return 1;
      }
    });
    return 1;
  }, 0, time);

  return groups;
}

var d3_transitionRemove = {};

function d3_transitionNull(d, i, a) {
  return a != "" && d3_transitionRemove;
}

function d3_transitionTween(name, b) {
  var interpolate = d3_interpolateByName(name);

  function transitionFunction(d, i, a) {
    var v = b.call(this, d, i);
    return v == null
        ? a != "" && d3_transitionRemove
        : a != v && interpolate(a, v);
  }

  function transitionString(d, i, a) {
    return a != b && interpolate(a, b);
  }

  return typeof b === "function" ? transitionFunction
      : b == null ? d3_transitionNull
      : (b += "", transitionString);
}

var d3_transitionPrototype = [],
    d3_transitionNextId = 0,
    d3_transitionId = 0,
    d3_transitionDefaultDelay = 0,
    d3_transitionDefaultDuration = 250,
    d3_transitionDefaultEase = d3.ease("cubic-in-out"),
    d3_transitionDelay = d3_transitionDefaultDelay,
    d3_transitionDuration = d3_transitionDefaultDuration,
    d3_transitionEase = d3_transitionDefaultEase;

d3_transitionPrototype.call = d3_selectionPrototype.call;

d3.transition = function(selection) {
  return arguments.length
      ? (d3_transitionId ? selection.transition() : selection)
      : d3_selectionRoot.transition();
};

d3.transition.prototype = d3_transitionPrototype;
d3_transitionPrototype.select = function(selector) {
  var subgroups = [],
      subgroup,
      subnode,
      node;

  if (typeof selector !== "function") selector = d3_selection_selector(selector);

  for (var j = -1, m = this.length; ++j < m;) {
    subgroups.push(subgroup = []);
    for (var group = this[j], i = -1, n = group.length; ++i < n;) {
      if ((node = group[i]) && (subnode = selector.call(node.node, node.node.__data__, i))) {
        if ("__data__" in node.node) subnode.__data__ = node.node.__data__;
        subgroup.push({node: subnode, delay: node.delay, duration: node.duration});
      } else {
        subgroup.push(null);
      }
    }
  }

  return d3_transition(subgroups, this.id, this.time).ease(this.ease());
};
d3_transitionPrototype.selectAll = function(selector) {
  var subgroups = [],
      subgroup,
      subnodes,
      node;

  if (typeof selector !== "function") selector = d3_selection_selectorAll(selector);

  for (var j = -1, m = this.length; ++j < m;) {
    for (var group = this[j], i = -1, n = group.length; ++i < n;) {
      if (node = group[i]) {
        subnodes = selector.call(node.node, node.node.__data__, i);
        subgroups.push(subgroup = []);
        for (var k = -1, o = subnodes.length; ++k < o;) {
          subgroup.push({node: subnodes[k], delay: node.delay, duration: node.duration});
        }
      }
    }
  }

  return d3_transition(subgroups, this.id, this.time).ease(this.ease());
};
d3_transitionPrototype.attr = function(name, value) {
  return this.attrTween(name, d3_transitionTween(name, value));
};

d3_transitionPrototype.attrTween = function(nameNS, tween) {
  var name = d3.ns.qualify(nameNS);

  function attrTween(d, i) {
    var f = tween.call(this, d, i, this.getAttribute(name));
    return f === d3_transitionRemove
        ? (this.removeAttribute(name), null)
        : f && function(t) { this.setAttribute(name, f(t)); };
  }

  function attrTweenNS(d, i) {
    var f = tween.call(this, d, i, this.getAttributeNS(name.space, name.local));
    return f === d3_transitionRemove
        ? (this.removeAttributeNS(name.space, name.local), null)
        : f && function(t) { this.setAttributeNS(name.space, name.local, f(t)); };
  }

  return this.tween("attr." + nameNS, name.local ? attrTweenNS : attrTween);
};
d3_transitionPrototype.style = function(name, value, priority) {
  if (arguments.length < 3) priority = "";
  return this.styleTween(name, d3_transitionTween(name, value), priority);
};

d3_transitionPrototype.styleTween = function(name, tween, priority) {
  if (arguments.length < 3) priority = "";
  return this.tween("style." + name, function(d, i) {
    var f = tween.call(this, d, i, window.getComputedStyle(this, null).getPropertyValue(name));
    return f === d3_transitionRemove
        ? (this.style.removeProperty(name), null)
        : f && function(t) { this.style.setProperty(name, f(t), priority); };
  });
};
d3_transitionPrototype.text = function(value) {
  return this.tween("text", function(d, i) {
    this.textContent = typeof value === "function"
        ? value.call(this, d, i)
        : value;
  });
};
d3_transitionPrototype.remove = function() {
  return this.each("end.transition", function() {
    var p;
    if (!this.__transition__ && (p = this.parentNode)) p.removeChild(this);
  });
};
d3_transitionPrototype.delay = function(value) {
  var groups = this;
  return groups.each(typeof value === "function"
      ? function(d, i, j) { groups[j][i].delay = value.apply(this, arguments) | 0; }
      : (value = value | 0, function(d, i, j) { groups[j][i].delay = value; }));
};
d3_transitionPrototype.duration = function(value) {
  var groups = this;
  return groups.each(typeof value === "function"
      ? function(d, i, j) { groups[j][i].duration = Math.max(1, value.apply(this, arguments) | 0); }
      : (value = Math.max(1, value | 0), function(d, i, j) { groups[j][i].duration = value; }));
};
function d3_transition_each(callback) {
  var id = d3_transitionId,
      ease = d3_transitionEase,
      delay = d3_transitionDelay,
      duration = d3_transitionDuration;

  d3_transitionId = this.id;
  d3_transitionEase = this.ease();
  for (var j = 0, m = this.length; j < m; j++) {
    for (var group = this[j], i = 0, n = group.length; i < n; i++) {
      var node = group[i];
      if (node) {
        d3_transitionDelay = this[j][i].delay;
        d3_transitionDuration = this[j][i].duration;
        callback.call(node = node.node, node.__data__, i, j);
      }
    }
  }

  d3_transitionId = id;
  d3_transitionEase = ease;
  d3_transitionDelay = delay;
  d3_transitionDuration = duration;
  return this;
}
d3_transitionPrototype.transition = function() {
  return this.select(d3_this);
};
var d3_timer_queue = null,
    d3_timer_interval, // is an interval (or frame) active?
    d3_timer_timeout; // is a timeout active?

// The timer will continue to fire until callback returns true.
d3.timer = function(callback, delay, then) {
  var found = false,
      t0,
      t1 = d3_timer_queue;

  if (arguments.length < 3) {
    if (arguments.length < 2) delay = 0;
    else if (!isFinite(delay)) return;
    then = Date.now();
  }

  // See if the callback's already in the queue.
  while (t1) {
    if (t1.callback === callback) {
      t1.then = then;
      t1.delay = delay;
      found = true;
      break;
    }
    t0 = t1;
    t1 = t1.next;
  }

  // Otherwise, add the callback to the queue.
  if (!found) d3_timer_queue = {
    callback: callback,
    then: then,
    delay: delay,
    next: d3_timer_queue
  };

  // Start animatin'!
  if (!d3_timer_interval) {
    d3_timer_timeout = clearTimeout(d3_timer_timeout);
    d3_timer_interval = 1;
    d3_timer_frame(d3_timer_step);
  }
}

function d3_timer_step() {
  var elapsed,
      now = Date.now(),
      t1 = d3_timer_queue;

  while (t1) {
    elapsed = now - t1.then;
    if (elapsed >= t1.delay) t1.flush = t1.callback(elapsed);
    t1 = t1.next;
  }

  var delay = d3_timer_flush() - now;
  if (delay > 24) {
    if (isFinite(delay)) {
      clearTimeout(d3_timer_timeout);
      d3_timer_timeout = setTimeout(d3_timer_step, delay);
    }
    d3_timer_interval = 0;
  } else {
    d3_timer_interval = 1;
    d3_timer_frame(d3_timer_step);
  }
}

d3.timer.flush = function() {
  var elapsed,
      now = Date.now(),
      t1 = d3_timer_queue;

  while (t1) {
    elapsed = now - t1.then;
    if (!t1.delay) t1.flush = t1.callback(elapsed);
    t1 = t1.next;
  }

  d3_timer_flush();
};

// Flush after callbacks, to avoid concurrent queue modification.
function d3_timer_flush() {
  var t0 = null,
      t1 = d3_timer_queue,
      then = Infinity;
  while (t1) {
    if (t1.flush) {
      t1 = t0 ? t0.next = t1.next : d3_timer_queue = t1.next;
    } else {
      then = Math.min(then, t1.then + t1.delay);
      t1 = (t0 = t1).next;
    }
  }
  return then;
}

var d3_timer_frame = window.requestAnimationFrame
    || window.webkitRequestAnimationFrame
    || window.mozRequestAnimationFrame
    || window.oRequestAnimationFrame
    || window.msRequestAnimationFrame
    || function(callback) { setTimeout(callback, 17); };
d3.transform = function(string) {
  var g = document.createElementNS(d3.ns.prefix.svg, "g"),
      identity = {a: 1, b: 0, c: 0, d: 1, e: 0, f: 0};
  return (d3.transform = function(string) {
    g.setAttribute("transform", string);
    var t = g.transform.baseVal.consolidate();
    return new d3_transform(t ? t.matrix : identity);
  })(string);
};

// Compute x-scale and normalize the first row.
// Compute shear and make second row orthogonal to first.
// Compute y-scale and normalize the second row.
// Finally, compute the rotation.
function d3_transform(m) {
  var r0 = [m.a, m.b],
      r1 = [m.c, m.d],
      kx = d3_transformNormalize(r0),
      kz = d3_transformDot(r0, r1),
      ky = d3_transformNormalize(d3_transformCombine(r1, r0, -kz)) || 0;
  if (r0[0] * r1[1] < r1[0] * r0[1]) {
    r0[0] *= -1;
    r0[1] *= -1;
    kx *= -1;
    kz *= -1;
  }
  this.rotate = (kx ? Math.atan2(r0[1], r0[0]) : Math.atan2(-r1[0], r1[1])) * d3_transformDegrees;
  this.translate = [m.e, m.f];
  this.scale = [kx, ky];
  this.skew = ky ? Math.atan2(kz, ky) * d3_transformDegrees : 0;
};

d3_transform.prototype.toString = function() {
  return "translate(" + this.translate
      + ")rotate(" + this.rotate
      + ")skewX(" + this.skew
      + ")scale(" + this.scale
      + ")";
};

function d3_transformDot(a, b) {
  return a[0] * b[0] + a[1] * b[1];
}

function d3_transformNormalize(a) {
  var k = Math.sqrt(d3_transformDot(a, a));
  if (k) {
    a[0] /= k;
    a[1] /= k;
  }
  return k;
}

function d3_transformCombine(a, b, k) {
  a[0] += k * b[0];
  a[1] += k * b[1];
  return a;
}

var d3_transformDegrees = 180 / Math.PI;
d3.mouse = function(container) {
  return d3_mousePoint(container, d3_eventSource());
};

// https://bugs.webkit.org/show_bug.cgi?id=44083
var d3_mouse_bug44083 = /WebKit/.test(navigator.userAgent) ? -1 : 0;

function d3_mousePoint(container, e) {
  var svg = container.ownerSVGElement || container;
  if (svg.createSVGPoint) {
    var point = svg.createSVGPoint();
    if ((d3_mouse_bug44083 < 0) && (window.scrollX || window.scrollY)) {
      svg = d3.select(document.body)
        .append("svg")
          .style("position", "absolute")
          .style("top", 0)
          .style("left", 0);
      var ctm = svg[0][0].getScreenCTM();
      d3_mouse_bug44083 = !(ctm.f || ctm.e);
      svg.remove();
    }
    if (d3_mouse_bug44083) {
      point.x = e.pageX;
      point.y = e.pageY;
    } else {
      point.x = e.clientX;
      point.y = e.clientY;
    }
    point = point.matrixTransform(container.getScreenCTM().inverse());
    return [point.x, point.y];
  }
  var rect = container.getBoundingClientRect();
  return [e.clientX - rect.left - container.clientLeft, e.clientY - rect.top - container.clientTop];
};
d3.touches = function(container, touches) {
  if (arguments.length < 2) touches = d3_eventSource().touches;
  return touches ? d3_array(touches).map(function(touch) {
    var point = d3_mousePoint(container, touch);
    point.identifier = touch.identifier;
    return point;
  }) : [];
};
function d3_noop() {}
d3.scale = {};

function d3_scaleExtent(domain) {
  var start = domain[0], stop = domain[domain.length - 1];
  return start < stop ? [start, stop] : [stop, start];
}

function d3_scaleRange(scale) {
  return scale.rangeExtent ? scale.rangeExtent() : d3_scaleExtent(scale.range());
}
function d3_scale_nice(domain, nice) {
  var i0 = 0,
      i1 = domain.length - 1,
      x0 = domain[i0],
      x1 = domain[i1],
      dx;

  if (x1 < x0) {
    dx = i0; i0 = i1; i1 = dx;
    dx = x0; x0 = x1; x1 = dx;
  }

  if (dx = x1 - x0) {
    nice = nice(dx);
    domain[i0] = nice.floor(x0);
    domain[i1] = nice.ceil(x1);
  }

  return domain;
}

function d3_scale_niceDefault() {
  return Math;
}
d3.scale.linear = function() {
  return d3_scale_linear([0, 1], [0, 1], d3.interpolate, false);
};

function d3_scale_linear(domain, range, interpolate, clamp) {
  var output,
      input;

  function rescale() {
    var linear = Math.min(domain.length, range.length) > 2 ? d3_scale_polylinear : d3_scale_bilinear,
        uninterpolate = clamp ? d3_uninterpolateClamp : d3_uninterpolateNumber;
    output = linear(domain, range, uninterpolate, interpolate);
    input = linear(range, domain, uninterpolate, d3.interpolate);
    return scale;
  }

  function scale(x) {
    return output(x);
  }

  // Note: requires range is coercible to number!
  scale.invert = function(y) {
    return input(y);
  };

  scale.domain = function(x) {
    if (!arguments.length) return domain;
    domain = x.map(Number);
    return rescale();
  };

  scale.range = function(x) {
    if (!arguments.length) return range;
    range = x;
    return rescale();
  };

  scale.rangeRound = function(x) {
    return scale.range(x).interpolate(d3.interpolateRound);
  };

  scale.clamp = function(x) {
    if (!arguments.length) return clamp;
    clamp = x;
    return rescale();
  };

  scale.interpolate = function(x) {
    if (!arguments.length) return interpolate;
    interpolate = x;
    return rescale();
  };

  scale.ticks = function(m) {
    return d3_scale_linearTicks(domain, m);
  };

  scale.tickFormat = function(m) {
    return d3_scale_linearTickFormat(domain, m);
  };

  scale.nice = function() {
    d3_scale_nice(domain, d3_scale_linearNice);
    return rescale();
  };

  scale.copy = function() {
    return d3_scale_linear(domain, range, interpolate, clamp);
  };

  return rescale();
}

function d3_scale_linearRebind(scale, linear) {
  return d3.rebind(scale, linear, "range", "rangeRound", "interpolate", "clamp");
}

function d3_scale_linearNice(dx) {
  dx = Math.pow(10, Math.round(Math.log(dx) / Math.LN10) - 1);
  return {
    floor: function(x) { return Math.floor(x / dx) * dx; },
    ceil: function(x) { return Math.ceil(x / dx) * dx; }
  };
}

function d3_scale_linearTickRange(domain, m) {
  var extent = d3_scaleExtent(domain),
      span = extent[1] - extent[0],
      step = Math.pow(10, Math.floor(Math.log(span / m) / Math.LN10)),
      err = m / span * step;

  // Filter ticks to get closer to the desired count.
  if (err <= .15) step *= 10;
  else if (err <= .35) step *= 5;
  else if (err <= .75) step *= 2;

  // Round start and stop values to step interval.
  extent[0] = Math.ceil(extent[0] / step) * step;
  extent[1] = Math.floor(extent[1] / step) * step + step * .5; // inclusive
  extent[2] = step;
  return extent;
}

function d3_scale_linearTicks(domain, m) {
  return d3.range.apply(d3, d3_scale_linearTickRange(domain, m));
}

function d3_scale_linearTickFormat(domain, m) {
  return d3.format(",." + Math.max(0, -Math.floor(Math.log(d3_scale_linearTickRange(domain, m)[2]) / Math.LN10 + .01)) + "f");
}
function d3_scale_bilinear(domain, range, uninterpolate, interpolate) {
  var u = uninterpolate(domain[0], domain[1]),
      i = interpolate(range[0], range[1]);
  return function(x) {
    return i(u(x));
  };
}
function d3_scale_polylinear(domain, range, uninterpolate, interpolate) {
  var u = [],
      i = [],
      j = 0,
      k = Math.min(domain.length, range.length) - 1;

  // Handle descending domains.
  if (domain[k] < domain[0]) {
    domain = domain.slice().reverse();
    range = range.slice().reverse();
  }

  while (++j <= k) {
    u.push(uninterpolate(domain[j - 1], domain[j]));
    i.push(interpolate(range[j - 1], range[j]));
  }

  return function(x) {
    var j = d3.bisect(domain, x, 1, k) - 1;
    return i[j](u[j](x));
  };
}
d3.scale.log = function() {
  return d3_scale_log(d3.scale.linear(), d3_scale_logp);
};

function d3_scale_log(linear, log) {
  var pow = log.pow;

  function scale(x) {
    return linear(log(x));
  }

  scale.invert = function(x) {
    return pow(linear.invert(x));
  };

  scale.domain = function(x) {
    if (!arguments.length) return linear.domain().map(pow);
    log = x[0] < 0 ? d3_scale_logn : d3_scale_logp;
    pow = log.pow;
    linear.domain(x.map(log));
    return scale;
  };

  scale.nice = function() {
    linear.domain(d3_scale_nice(linear.domain(), d3_scale_niceDefault));
    return scale;
  };

  scale.ticks = function() {
    var extent = d3_scaleExtent(linear.domain()),
        ticks = [];
    if (extent.every(isFinite)) {
      var i = Math.floor(extent[0]),
          j = Math.ceil(extent[1]),
          u = pow(extent[0]),
          v = pow(extent[1]);
      if (log === d3_scale_logn) {
        ticks.push(pow(i));
        for (; i++ < j;) for (var k = 9; k > 0; k--) ticks.push(pow(i) * k);
      } else {
        for (; i < j; i++) for (var k = 1; k < 10; k++) ticks.push(pow(i) * k);
        ticks.push(pow(i));
      }
      for (i = 0; ticks[i] < u; i++) {} // strip small values
      for (j = ticks.length; ticks[j - 1] > v; j--) {} // strip big values
      ticks = ticks.slice(i, j);
    }
    return ticks;
  };

  scale.tickFormat = function(n, format) {
    if (arguments.length < 2) format = d3_scale_logFormat;
    if (arguments.length < 1) return format;
    var k = n / scale.ticks().length,
        f = log === d3_scale_logn ? (e = -1e-12, Math.floor) : (e = 1e-12, Math.ceil),
        e;
    return function(d) {
      return d / pow(f(log(d) + e)) < k ? format(d) : "";
    };
  };

  scale.copy = function() {
    return d3_scale_log(linear.copy(), log);
  };

  return d3_scale_linearRebind(scale, linear);
}

var d3_scale_logFormat = d3.format(".0e");

function d3_scale_logp(x) {
  return Math.log(x < 0 ? 0 : x) / Math.LN10;
}

function d3_scale_logn(x) {
  return -Math.log(x > 0 ? 0 : -x) / Math.LN10;
}

d3_scale_logp.pow = function(x) {
  return Math.pow(10, x);
};

d3_scale_logn.pow = function(x) {
  return -Math.pow(10, -x);
};
d3.scale.pow = function() {
  return d3_scale_pow(d3.scale.linear(), 1);
};

function d3_scale_pow(linear, exponent) {
  var powp = d3_scale_powPow(exponent),
      powb = d3_scale_powPow(1 / exponent);

  function scale(x) {
    return linear(powp(x));
  }

  scale.invert = function(x) {
    return powb(linear.invert(x));
  };

  scale.domain = function(x) {
    if (!arguments.length) return linear.domain().map(powb);
    linear.domain(x.map(powp));
    return scale;
  };

  scale.ticks = function(m) {
    return d3_scale_linearTicks(scale.domain(), m);
  };

  scale.tickFormat = function(m) {
    return d3_scale_linearTickFormat(scale.domain(), m);
  };

  scale.nice = function() {
    return scale.domain(d3_scale_nice(scale.domain(), d3_scale_linearNice));
  };

  scale.exponent = function(x) {
    if (!arguments.length) return exponent;
    var domain = scale.domain();
    powp = d3_scale_powPow(exponent = x);
    powb = d3_scale_powPow(1 / exponent);
    return scale.domain(domain);
  };

  scale.copy = function() {
    return d3_scale_pow(linear.copy(), exponent);
  };

  return d3_scale_linearRebind(scale, linear);
}

function d3_scale_powPow(e) {
  return function(x) {
    return x < 0 ? -Math.pow(-x, e) : Math.pow(x, e);
  };
}
d3.scale.sqrt = function() {
  return d3.scale.pow().exponent(.5);
};
d3.scale.ordinal = function() {
  return d3_scale_ordinal([], {t: "range", x: []});
};

function d3_scale_ordinal(domain, ranger) {
  var index,
      range,
      rangeBand;

  function scale(x) {
    return range[((index.get(x) || index.set(x, domain.push(x))) - 1) % range.length];
  }

  function steps(start, step) {
    return d3.range(domain.length).map(function(i) { return start + step * i; });
  }

  scale.domain = function(x) {
    if (!arguments.length) return domain;
    domain = [];
    index = new d3_Map;
    var i = -1, n = x.length, xi;
    while (++i < n) if (!index.has(xi = x[i])) index.set(xi, domain.push(xi));
    return scale[ranger.t](ranger.x, ranger.p);
  };

  scale.range = function(x) {
    if (!arguments.length) return range;
    range = x;
    rangeBand = 0;
    ranger = {t: "range", x: x};
    return scale;
  };

  scale.rangePoints = function(x, padding) {
    if (arguments.length < 2) padding = 0;
    var start = x[0],
        stop = x[1],
        step = (stop - start) / (domain.length - 1 + padding);
    range = steps(domain.length < 2 ? (start + stop) / 2 : start + step * padding / 2, step);
    rangeBand = 0;
    ranger = {t: "rangePoints", x: x, p: padding};
    return scale;
  };

  scale.rangeBands = function(x, padding) {
    if (arguments.length < 2) padding = 0;
    var reverse = x[1] < x[0],
        start = x[reverse - 0],
        stop = x[1 - reverse],
        step = (stop - start) / (domain.length + padding);
    range = steps(start + step * padding, step);
    if (reverse) range.reverse();
    rangeBand = step * (1 - padding);
    ranger = {t: "rangeBands", x: x, p: padding};
    return scale;
  };

  scale.rangeRoundBands = function(x, padding) {
    if (arguments.length < 2) padding = 0;
    var reverse = x[1] < x[0],
        start = x[reverse - 0],
        stop = x[1 - reverse],
        step = Math.floor((stop - start) / (domain.length + padding)),
        error = stop - start - (domain.length - padding) * step;
    range = steps(start + Math.round(error / 2), step);
    if (reverse) range.reverse();
    rangeBand = Math.round(step * (1 - padding));
    ranger = {t: "rangeRoundBands", x: x, p: padding};
    return scale;
  };

  scale.rangeBand = function() {
    return rangeBand;
  };

  scale.rangeExtent = function() {
    return d3_scaleExtent(ranger.x);
  };

  scale.copy = function() {
    return d3_scale_ordinal(domain, ranger);
  };

  return scale.domain(domain);
}
/*
 * This product includes color specifications and designs developed by Cynthia
 * Brewer (http://colorbrewer.org/). See lib/colorbrewer for more information.
 */

d3.scale.category10 = function() {
  return d3.scale.ordinal().range(d3_category10);
};

d3.scale.category20 = function() {
  return d3.scale.ordinal().range(d3_category20);
};

d3.scale.category20b = function() {
  return d3.scale.ordinal().range(d3_category20b);
};

d3.scale.category20c = function() {
  return d3.scale.ordinal().range(d3_category20c);
};

var d3_category10 = [
  "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
  "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"
];

var d3_category20 = [
  "#1f77b4", "#aec7e8",
  "#ff7f0e", "#ffbb78",
  "#2ca02c", "#98df8a",
  "#d62728", "#ff9896",
  "#9467bd", "#c5b0d5",
  "#8c564b", "#c49c94",
  "#e377c2", "#f7b6d2",
  "#7f7f7f", "#c7c7c7",
  "#bcbd22", "#dbdb8d",
  "#17becf", "#9edae5"
];

var d3_category20b = [
  "#393b79", "#5254a3", "#6b6ecf", "#9c9ede",
  "#637939", "#8ca252", "#b5cf6b", "#cedb9c",
  "#8c6d31", "#bd9e39", "#e7ba52", "#e7cb94",
  "#843c39", "#ad494a", "#d6616b", "#e7969c",
  "#7b4173", "#a55194", "#ce6dbd", "#de9ed6"
];

var d3_category20c = [
  "#3182bd", "#6baed6", "#9ecae1", "#c6dbef",
  "#e6550d", "#fd8d3c", "#fdae6b", "#fdd0a2",
  "#31a354", "#74c476", "#a1d99b", "#c7e9c0",
  "#756bb1", "#9e9ac8", "#bcbddc", "#dadaeb",
  "#636363", "#969696", "#bdbdbd", "#d9d9d9"
];
d3.scale.quantile = function() {
  return d3_scale_quantile([], []);
};

function d3_scale_quantile(domain, range) {
  var thresholds;

  function rescale() {
    var k = 0,
        n = domain.length,
        q = range.length;
    thresholds = [];
    while (++k < q) thresholds[k - 1] = d3.quantile(domain, k / q);
    return scale;
  }

  function scale(x) {
    if (isNaN(x = +x)) return NaN;
    return range[d3.bisect(thresholds, x)];
  }

  scale.domain = function(x) {
    if (!arguments.length) return domain;
    domain = x.filter(function(d) { return !isNaN(d); }).sort(d3.ascending);
    return rescale();
  };

  scale.range = function(x) {
    if (!arguments.length) return range;
    range = x;
    return rescale();
  };

  scale.quantiles = function() {
    return thresholds;
  };

  scale.copy = function() {
    return d3_scale_quantile(domain, range); // copy on write!
  };

  return rescale();
}
d3.scale.quantize = function() {
  return d3_scale_quantize(0, 1, [0, 1]);
};

function d3_scale_quantize(x0, x1, range) {
  var kx, i;

  function scale(x) {
    return range[Math.max(0, Math.min(i, Math.floor(kx * (x - x0))))];
  }

  function rescale() {
    kx = range.length / (x1 - x0);
    i = range.length - 1;
    return scale;
  }

  scale.domain = function(x) {
    if (!arguments.length) return [x0, x1];
    x0 = +x[0];
    x1 = +x[x.length - 1];
    return rescale();
  };

  scale.range = function(x) {
    if (!arguments.length) return range;
    range = x;
    return rescale();
  };

  scale.copy = function() {
    return d3_scale_quantize(x0, x1, range); // copy on write
  };

  return rescale();
}
d3.scale.identity = function() {
  return d3_scale_identity([0, 1]);
};

function d3_scale_identity(domain) {

  function identity(x) { return +x; }

  identity.invert = identity;

  identity.domain = identity.range = function(x) {
    if (!arguments.length) return domain;
    domain = x.map(identity);
    return identity;
  };

  identity.ticks = function(m) {
    return d3_scale_linearTicks(domain, m);
  };

  identity.tickFormat = function(m) {
    return d3_scale_linearTickFormat(domain, m);
  };

  identity.copy = function() {
    return d3_scale_identity(domain);
  };

  return identity;
}
d3.svg = {};
d3.svg.arc = function() {
  var innerRadius = d3_svg_arcInnerRadius,
      outerRadius = d3_svg_arcOuterRadius,
      startAngle = d3_svg_arcStartAngle,
      endAngle = d3_svg_arcEndAngle;

  function arc() {
    var r0 = innerRadius.apply(this, arguments),
        r1 = outerRadius.apply(this, arguments),
        a0 = startAngle.apply(this, arguments) + d3_svg_arcOffset,
        a1 = endAngle.apply(this, arguments) + d3_svg_arcOffset,
        da = (a1 < a0 && (da = a0, a0 = a1, a1 = da), a1 - a0),
        df = da < Math.PI ? "0" : "1",
        c0 = Math.cos(a0),
        s0 = Math.sin(a0),
        c1 = Math.cos(a1),
        s1 = Math.sin(a1);
    return da >= d3_svg_arcMax
      ? (r0
      ? "M0," + r1
      + "A" + r1 + "," + r1 + " 0 1,1 0," + (-r1)
      + "A" + r1 + "," + r1 + " 0 1,1 0," + r1
      + "M0," + r0
      + "A" + r0 + "," + r0 + " 0 1,0 0," + (-r0)
      + "A" + r0 + "," + r0 + " 0 1,0 0," + r0
      + "Z"
      : "M0," + r1
      + "A" + r1 + "," + r1 + " 0 1,1 0," + (-r1)
      + "A" + r1 + "," + r1 + " 0 1,1 0," + r1
      + "Z")
      : (r0
      ? "M" + r1 * c0 + "," + r1 * s0
      + "A" + r1 + "," + r1 + " 0 " + df + ",1 " + r1 * c1 + "," + r1 * s1
      + "L" + r0 * c1 + "," + r0 * s1
      + "A" + r0 + "," + r0 + " 0 " + df + ",0 " + r0 * c0 + "," + r0 * s0
      + "Z"
      : "M" + r1 * c0 + "," + r1 * s0
      + "A" + r1 + "," + r1 + " 0 " + df + ",1 " + r1 * c1 + "," + r1 * s1
      + "L0,0"
      + "Z");
  }

  arc.innerRadius = function(v) {
    if (!arguments.length) return innerRadius;
    innerRadius = d3.functor(v);
    return arc;
  };

  arc.outerRadius = function(v) {
    if (!arguments.length) return outerRadius;
    outerRadius = d3.functor(v);
    return arc;
  };

  arc.startAngle = function(v) {
    if (!arguments.length) return startAngle;
    startAngle = d3.functor(v);
    return arc;
  };

  arc.endAngle = function(v) {
    if (!arguments.length) return endAngle;
    endAngle = d3.functor(v);
    return arc;
  };

  arc.centroid = function() {
    var r = (innerRadius.apply(this, arguments)
        + outerRadius.apply(this, arguments)) / 2,
        a = (startAngle.apply(this, arguments)
        + endAngle.apply(this, arguments)) / 2 + d3_svg_arcOffset;
    return [Math.cos(a) * r, Math.sin(a) * r];
  };

  return arc;
};

var d3_svg_arcOffset = -Math.PI / 2,
    d3_svg_arcMax = 2 * Math.PI - 1e-6;

function d3_svg_arcInnerRadius(d) {
  return d.innerRadius;
}

function d3_svg_arcOuterRadius(d) {
  return d.outerRadius;
}

function d3_svg_arcStartAngle(d) {
  return d.startAngle;
}

function d3_svg_arcEndAngle(d) {
  return d.endAngle;
}
function d3_svg_line(projection) {
  var x = d3_svg_lineX,
      y = d3_svg_lineY,
      interpolate = d3_svg_lineInterpolatorDefault,
      interpolator = d3_svg_lineInterpolators.get(interpolate),
      tension = .7;

  function line(d) {
    return d.length < 1 ? null : "M" + interpolator(projection(d3_svg_linePoints(this, d, x, y)), tension);
  }

  line.x = function(v) {
    if (!arguments.length) return x;
    x = v;
    return line;
  };

  line.y = function(v) {
    if (!arguments.length) return y;
    y = v;
    return line;
  };

  line.interpolate = function(v) {
    if (!arguments.length) return interpolate;
    if (!d3_svg_lineInterpolators.has(v += "")) v = d3_svg_lineInterpolatorDefault;
    interpolator = d3_svg_lineInterpolators.get(interpolate = v);
    return line;
  };

  line.tension = function(v) {
    if (!arguments.length) return tension;
    tension = v;
    return line;
  };

  return line;
}

d3.svg.line = function() {
  return d3_svg_line(Object);
};

// Converts the specified array of data into an array of points
// (x-y tuples), by evaluating the specified `x` and `y` functions on each
// data point. The `this` context of the evaluated functions is the specified
// "self" object; each function is passed the current datum and index.
function d3_svg_linePoints(self, d, x, y) {
  var points = [],
      i = -1,
      n = d.length,
      fx = typeof x === "function",
      fy = typeof y === "function",
      value;
  if (fx && fy) {
    while (++i < n) points.push([
      x.call(self, value = d[i], i),
      y.call(self, value, i)
    ]);
  } else if (fx) {
    while (++i < n) points.push([x.call(self, d[i], i), y]);
  } else if (fy) {
    while (++i < n) points.push([x, y.call(self, d[i], i)]);
  } else {
    while (++i < n) points.push([x, y]);
  }
  return points;
}

// The default `x` property, which references d[0].
function d3_svg_lineX(d) {
  return d[0];
}

// The default `y` property, which references d[1].
function d3_svg_lineY(d) {
  return d[1];
}

var d3_svg_lineInterpolatorDefault = "linear";

// The various interpolators supported by the `line` class.
var d3_svg_lineInterpolators = d3.map({
  "linear": d3_svg_lineLinear,
  "step-before": d3_svg_lineStepBefore,
  "step-after": d3_svg_lineStepAfter,
  "basis": d3_svg_lineBasis,
  "basis-open": d3_svg_lineBasisOpen,
  "basis-closed": d3_svg_lineBasisClosed,
  "bundle": d3_svg_lineBundle,
  "cardinal": d3_svg_lineCardinal,
  "cardinal-open": d3_svg_lineCardinalOpen,
  "cardinal-closed": d3_svg_lineCardinalClosed,
  "monotone": d3_svg_lineMonotone
});

// Linear interpolation; generates "L" commands.
function d3_svg_lineLinear(points) {
  var i = 0,
      n = points.length,
      p = points[0],
      path = [p[0], ",", p[1]];
  while (++i < n) path.push("L", (p = points[i])[0], ",", p[1]);
  return path.join("");
}

// Step interpolation; generates "H" and "V" commands.
function d3_svg_lineStepBefore(points) {
  var i = 0,
      n = points.length,
      p = points[0],
      path = [p[0], ",", p[1]];
  while (++i < n) path.push("V", (p = points[i])[1], "H", p[0]);
  return path.join("");
}

// Step interpolation; generates "H" and "V" commands.
function d3_svg_lineStepAfter(points) {
  var i = 0,
      n = points.length,
      p = points[0],
      path = [p[0], ",", p[1]];
  while (++i < n) path.push("H", (p = points[i])[0], "V", p[1]);
  return path.join("");
}

// Open cardinal spline interpolation; generates "C" commands.
function d3_svg_lineCardinalOpen(points, tension) {
  return points.length < 4
      ? d3_svg_lineLinear(points)
      : points[1] + d3_svg_lineHermite(points.slice(1, points.length - 1),
        d3_svg_lineCardinalTangents(points, tension));
}

// Closed cardinal spline interpolation; generates "C" commands.
function d3_svg_lineCardinalClosed(points, tension) {
  return points.length < 3
      ? d3_svg_lineLinear(points)
      : points[0] + d3_svg_lineHermite((points.push(points[0]), points),
        d3_svg_lineCardinalTangents([points[points.length - 2]]
        .concat(points, [points[1]]), tension));
}

// Cardinal spline interpolation; generates "C" commands.
function d3_svg_lineCardinal(points, tension, closed) {
  return points.length < 3
      ? d3_svg_lineLinear(points)
      : points[0] + d3_svg_lineHermite(points,
        d3_svg_lineCardinalTangents(points, tension));
}

// Hermite spline construction; generates "C" commands.
function d3_svg_lineHermite(points, tangents) {
  if (tangents.length < 1
      || (points.length != tangents.length
      && points.length != tangents.length + 2)) {
    return d3_svg_lineLinear(points);
  }

  var quad = points.length != tangents.length,
      path = "",
      p0 = points[0],
      p = points[1],
      t0 = tangents[0],
      t = t0,
      pi = 1;

  if (quad) {
    path += "Q" + (p[0] - t0[0] * 2 / 3) + "," + (p[1] - t0[1] * 2 / 3)
        + "," + p[0] + "," + p[1];
    p0 = points[1];
    pi = 2;
  }

  if (tangents.length > 1) {
    t = tangents[1];
    p = points[pi];
    pi++;
    path += "C" + (p0[0] + t0[0]) + "," + (p0[1] + t0[1])
        + "," + (p[0] - t[0]) + "," + (p[1] - t[1])
        + "," + p[0] + "," + p[1];
    for (var i = 2; i < tangents.length; i++, pi++) {
      p = points[pi];
      t = tangents[i];
      path += "S" + (p[0] - t[0]) + "," + (p[1] - t[1])
          + "," + p[0] + "," + p[1];
    }
  }

  if (quad) {
    var lp = points[pi];
    path += "Q" + (p[0] + t[0] * 2 / 3) + "," + (p[1] + t[1] * 2 / 3)
        + "," + lp[0] + "," + lp[1];
  }

  return path;
}

// Generates tangents for a cardinal spline.
function d3_svg_lineCardinalTangents(points, tension) {
  var tangents = [],
      a = (1 - tension) / 2,
      p0,
      p1 = points[0],
      p2 = points[1],
      i = 1,
      n = points.length;
  while (++i < n) {
    p0 = p1;
    p1 = p2;
    p2 = points[i];
    tangents.push([a * (p2[0] - p0[0]), a * (p2[1] - p0[1])]);
  }
  return tangents;
}

// B-spline interpolation; generates "C" commands.
function d3_svg_lineBasis(points) {
  if (points.length < 3) return d3_svg_lineLinear(points);
  var i = 1,
      n = points.length,
      pi = points[0],
      x0 = pi[0],
      y0 = pi[1],
      px = [x0, x0, x0, (pi = points[1])[0]],
      py = [y0, y0, y0, pi[1]],
      path = [x0, ",", y0];
  d3_svg_lineBasisBezier(path, px, py);
  while (++i < n) {
    pi = points[i];
    px.shift(); px.push(pi[0]);
    py.shift(); py.push(pi[1]);
    d3_svg_lineBasisBezier(path, px, py);
  }
  i = -1;
  while (++i < 2) {
    px.shift(); px.push(pi[0]);
    py.shift(); py.push(pi[1]);
    d3_svg_lineBasisBezier(path, px, py);
  }
  return path.join("");
}

// Open B-spline interpolation; generates "C" commands.
function d3_svg_lineBasisOpen(points) {
  if (points.length < 4) return d3_svg_lineLinear(points);
  var path = [],
      i = -1,
      n = points.length,
      pi,
      px = [0],
      py = [0];
  while (++i < 3) {
    pi = points[i];
    px.push(pi[0]);
    py.push(pi[1]);
  }
  path.push(d3_svg_lineDot4(d3_svg_lineBasisBezier3, px)
    + "," + d3_svg_lineDot4(d3_svg_lineBasisBezier3, py));
  --i; while (++i < n) {
    pi = points[i];
    px.shift(); px.push(pi[0]);
    py.shift(); py.push(pi[1]);
    d3_svg_lineBasisBezier(path, px, py);
  }
  return path.join("");
}

// Closed B-spline interpolation; generates "C" commands.
function d3_svg_lineBasisClosed(points) {
  var path,
      i = -1,
      n = points.length,
      m = n + 4,
      pi,
      px = [],
      py = [];
  while (++i < 4) {
    pi = points[i % n];
    px.push(pi[0]);
    py.push(pi[1]);
  }
  path = [
    d3_svg_lineDot4(d3_svg_lineBasisBezier3, px), ",",
    d3_svg_lineDot4(d3_svg_lineBasisBezier3, py)
  ];
  --i; while (++i < m) {
    pi = points[i % n];
    px.shift(); px.push(pi[0]);
    py.shift(); py.push(pi[1]);
    d3_svg_lineBasisBezier(path, px, py);
  }
  return path.join("");
}

function d3_svg_lineBundle(points, tension) {
  var n = points.length - 1,
      x0 = points[0][0],
      y0 = points[0][1],
      dx = points[n][0] - x0,
      dy = points[n][1] - y0,
      i = -1,
      p,
      t;
  while (++i <= n) {
    p = points[i];
    t = i / n;
    p[0] = tension * p[0] + (1 - tension) * (x0 + t * dx);
    p[1] = tension * p[1] + (1 - tension) * (y0 + t * dy);
  }
  return d3_svg_lineBasis(points);
}

// Returns the dot product of the given four-element vectors.
function d3_svg_lineDot4(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
}

// Matrix to transform basis (b-spline) control points to bezier
// control points. Derived from FvD 11.2.8.
var d3_svg_lineBasisBezier1 = [0, 2/3, 1/3, 0],
    d3_svg_lineBasisBezier2 = [0, 1/3, 2/3, 0],
    d3_svg_lineBasisBezier3 = [0, 1/6, 2/3, 1/6];

// Pushes a "C" Bézier curve onto the specified path array, given the
// two specified four-element arrays which define the control points.
function d3_svg_lineBasisBezier(path, x, y) {
  path.push(
      "C", d3_svg_lineDot4(d3_svg_lineBasisBezier1, x),
      ",", d3_svg_lineDot4(d3_svg_lineBasisBezier1, y),
      ",", d3_svg_lineDot4(d3_svg_lineBasisBezier2, x),
      ",", d3_svg_lineDot4(d3_svg_lineBasisBezier2, y),
      ",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, x),
      ",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, y));
}

// Computes the slope from points p0 to p1.
function d3_svg_lineSlope(p0, p1) {
  return (p1[1] - p0[1]) / (p1[0] - p0[0]);
}

// Compute three-point differences for the given points.
// http://en.wikipedia.org/wiki/Cubic_Hermite_spline#Finite_difference
function d3_svg_lineFiniteDifferences(points) {
  var i = 0,
      j = points.length - 1,
      m = [],
      p0 = points[0],
      p1 = points[1],
      d = m[0] = d3_svg_lineSlope(p0, p1);
  while (++i < j) {
    m[i] = d + (d = d3_svg_lineSlope(p0 = p1, p1 = points[i + 1]));
  }
  m[i] = d;
  return m;
}

// Interpolates the given points using Fritsch-Carlson Monotone cubic Hermite
// interpolation. Returns an array of tangent vectors. For details, see
// http://en.wikipedia.org/wiki/Monotone_cubic_interpolation
function d3_svg_lineMonotoneTangents(points) {
  var tangents = [],
      d,
      a,
      b,
      s,
      m = d3_svg_lineFiniteDifferences(points),
      i = -1,
      j = points.length - 1;

  // The first two steps are done by computing finite-differences:
  // 1. Compute the slopes of the secant lines between successive points.
  // 2. Initialize the tangents at every point as the average of the secants.

  // Then, for each segment…
  while (++i < j) {
    d = d3_svg_lineSlope(points[i], points[i + 1]);

    // 3. If two successive yk = y{k + 1} are equal (i.e., d is zero), then set
    // mk = m{k + 1} = 0 as the spline connecting these points must be flat to
    // preserve monotonicity. Ignore step 4 and 5 for those k.

    if (Math.abs(d) < 1e-6) {
      m[i] = m[i + 1] = 0;
    } else {
      // 4. Let ak = mk / dk and bk = m{k + 1} / dk.
      a = m[i] / d;
      b = m[i + 1] / d;

      // 5. Prevent overshoot and ensure monotonicity by restricting the
      // magnitude of vector <ak, bk> to a circle of radius 3.
      s = a * a + b * b;
      if (s > 9) {
        s = d * 3 / Math.sqrt(s);
        m[i] = s * a;
        m[i + 1] = s * b;
      }
    }
  }

  // Compute the normalized tangent vector from the slopes. Note that if x is
  // not monotonic, it's possible that the slope will be infinite, so we protect
  // against NaN by setting the coordinate to zero.
  i = -1; while (++i <= j) {
    s = (points[Math.min(j, i + 1)][0] - points[Math.max(0, i - 1)][0])
      / (6 * (1 + m[i] * m[i]));
    tangents.push([s || 0, m[i] * s || 0]);
  }

  return tangents;
}

function d3_svg_lineMonotone(points) {
  return points.length < 3
      ? d3_svg_lineLinear(points)
      : points[0] +
        d3_svg_lineHermite(points, d3_svg_lineMonotoneTangents(points));
}
d3.svg.line.radial = function() {
  var line = d3_svg_line(d3_svg_lineRadial);
  line.radius = line.x, delete line.x;
  line.angle = line.y, delete line.y;
  return line;
};

function d3_svg_lineRadial(points) {
  var point,
      i = -1,
      n = points.length,
      r,
      a;
  while (++i < n) {
    point = points[i];
    r = point[0];
    a = point[1] + d3_svg_arcOffset;
    point[0] = r * Math.cos(a);
    point[1] = r * Math.sin(a);
  }
  return points;
}
function d3_svg_area(projection) {
  var x0 = d3_svg_lineX,
      x1 = d3_svg_lineX,
      y0 = 0,
      y1 = d3_svg_lineY,
      interpolate,
      i0,
      i1,
      tension = .7;

  function area(d) {
    if (d.length < 1) return null;
    var points0 = d3_svg_linePoints(this, d, x0, y0),
        points1 = d3_svg_linePoints(this, d, x0 === x1 ? d3_svg_areaX(points0) : x1, y0 === y1 ? d3_svg_areaY(points0) : y1);
    return "M" + i0(projection(points1), tension)
         + "L" + i1(projection(points0.reverse()), tension)
         + "Z";
  }

  area.x = function(x) {
    if (!arguments.length) return x1;
    x0 = x1 = x;
    return area;
  };

  area.x0 = function(x) {
    if (!arguments.length) return x0;
    x0 = x;
    return area;
  };

  area.x1 = function(x) {
    if (!arguments.length) return x1;
    x1 = x;
    return area;
  };

  area.y = function(y) {
    if (!arguments.length) return y1;
    y0 = y1 = y;
    return area;
  };

  area.y0 = function(y) {
    if (!arguments.length) return y0;
    y0 = y;
    return area;
  };

  area.y1 = function(y) {
    if (!arguments.length) return y1;
    y1 = y;
    return area;
  };

  area.interpolate = function(x) {
    if (!arguments.length) return interpolate;
    if (!d3_svg_lineInterpolators.has(x += "")) x = d3_svg_lineInterpolatorDefault;
    i0 = d3_svg_lineInterpolators.get(interpolate = x);
    i1 = i0.reverse || i0;
    return area;
  };

  area.tension = function(x) {
    if (!arguments.length) return tension;
    tension = x;
    return area;
  };

  return area.interpolate("linear");
}

d3_svg_lineStepBefore.reverse = d3_svg_lineStepAfter;
d3_svg_lineStepAfter.reverse = d3_svg_lineStepBefore;

d3.svg.area = function() {
  return d3_svg_area(Object);
};

function d3_svg_areaX(points) {
  return function(d, i) {
    return points[i][0];
  };
}

function d3_svg_areaY(points) {
  return function(d, i) {
    return points[i][1];
  };
}
d3.svg.area.radial = function() {
  var area = d3_svg_area(d3_svg_lineRadial);
  area.radius = area.x, delete area.x;
  area.innerRadius = area.x0, delete area.x0;
  area.outerRadius = area.x1, delete area.x1;
  area.angle = area.y, delete area.y;
  area.startAngle = area.y0, delete area.y0;
  area.endAngle = area.y1, delete area.y1;
  return area;
};
d3.svg.chord = function() {
  var source = d3_svg_chordSource,
      target = d3_svg_chordTarget,
      radius = d3_svg_chordRadius,
      startAngle = d3_svg_arcStartAngle,
      endAngle = d3_svg_arcEndAngle;

  // TODO Allow control point to be customized.

  function chord(d, i) {
    var s = subgroup(this, source, d, i),
        t = subgroup(this, target, d, i);
    return "M" + s.p0
      + arc(s.r, s.p1, s.a1 - s.a0) + (equals(s, t)
      ? curve(s.r, s.p1, s.r, s.p0)
      : curve(s.r, s.p1, t.r, t.p0)
      + arc(t.r, t.p1, t.a1 - t.a0)
      + curve(t.r, t.p1, s.r, s.p0))
      + "Z";
  }

  function subgroup(self, f, d, i) {
    var subgroup = f.call(self, d, i),
        r = radius.call(self, subgroup, i),
        a0 = startAngle.call(self, subgroup, i) + d3_svg_arcOffset,
        a1 = endAngle.call(self, subgroup, i) + d3_svg_arcOffset;
    return {
      r: r,
      a0: a0,
      a1: a1,
      p0: [r * Math.cos(a0), r * Math.sin(a0)],
      p1: [r * Math.cos(a1), r * Math.sin(a1)]
    };
  }

  function equals(a, b) {
    return a.a0 == b.a0 && a.a1 == b.a1;
  }

  function arc(r, p, a) {
    return "A" + r + "," + r + " 0 " + +(a > Math.PI) + ",1 " + p;
  }

  function curve(r0, p0, r1, p1) {
    return "Q 0,0 " + p1;
  }

  chord.radius = function(v) {
    if (!arguments.length) return radius;
    radius = d3.functor(v);
    return chord;
  };

  chord.source = function(v) {
    if (!arguments.length) return source;
    source = d3.functor(v);
    return chord;
  };

  chord.target = function(v) {
    if (!arguments.length) return target;
    target = d3.functor(v);
    return chord;
  };

  chord.startAngle = function(v) {
    if (!arguments.length) return startAngle;
    startAngle = d3.functor(v);
    return chord;
  };

  chord.endAngle = function(v) {
    if (!arguments.length) return endAngle;
    endAngle = d3.functor(v);
    return chord;
  };

  return chord;
};

function d3_svg_chordSource(d) {
  return d.source;
}

function d3_svg_chordTarget(d) {
  return d.target;
}

function d3_svg_chordRadius(d) {
  return d.radius;
}

function d3_svg_chordStartAngle(d) {
  return d.startAngle;
}

function d3_svg_chordEndAngle(d) {
  return d.endAngle;
}
d3.svg.diagonal = function() {
  var source = d3_svg_chordSource,
      target = d3_svg_chordTarget,
      projection = d3_svg_diagonalProjection;

  function diagonal(d, i) {
    var p0 = source.call(this, d, i),
        p3 = target.call(this, d, i),
        m = (p0.y + p3.y) / 2,
        p = [p0, {x: p0.x, y: m}, {x: p3.x, y: m}, p3];
    p = p.map(projection);
    return "M" + p[0] + "C" + p[1] + " " + p[2] + " " + p[3];
  }

  diagonal.source = function(x) {
    if (!arguments.length) return source;
    source = d3.functor(x);
    return diagonal;
  };

  diagonal.target = function(x) {
    if (!arguments.length) return target;
    target = d3.functor(x);
    return diagonal;
  };

  diagonal.projection = function(x) {
    if (!arguments.length) return projection;
    projection = x;
    return diagonal;
  };

  return diagonal;
};

function d3_svg_diagonalProjection(d) {
  return [d.x, d.y];
}
d3.svg.diagonal.radial = function() {
  var diagonal = d3.svg.diagonal(),
      projection = d3_svg_diagonalProjection,
      projection_ = diagonal.projection;

  diagonal.projection = function(x) {
    return arguments.length
        ? projection_(d3_svg_diagonalRadialProjection(projection = x))
        : projection;
  };

  return diagonal;
};

function d3_svg_diagonalRadialProjection(projection) {
  return function() {
    var d = projection.apply(this, arguments),
        r = d[0],
        a = d[1] + d3_svg_arcOffset;
    return [r * Math.cos(a), r * Math.sin(a)];
  };
}
d3.svg.mouse = d3.mouse;
d3.svg.touches = d3.touches;
d3.svg.symbol = function() {
  var type = d3_svg_symbolType,
      size = d3_svg_symbolSize;

  function symbol(d, i) {
    return (d3_svg_symbols.get(type.call(this, d, i))
        || d3_svg_symbolCircle)
        (size.call(this, d, i));
  }

  symbol.type = function(x) {
    if (!arguments.length) return type;
    type = d3.functor(x);
    return symbol;
  };

  // size of symbol in square pixels
  symbol.size = function(x) {
    if (!arguments.length) return size;
    size = d3.functor(x);
    return symbol;
  };

  return symbol;
};

function d3_svg_symbolSize() {
  return 64;
}

function d3_svg_symbolType() {
  return "circle";
}

function d3_svg_symbolCircle(size) {
  var r = Math.sqrt(size / Math.PI);
  return "M0," + r
      + "A" + r + "," + r + " 0 1,1 0," + (-r)
      + "A" + r + "," + r + " 0 1,1 0," + r
      + "Z";
}

// TODO cross-diagonal?
var d3_svg_symbols = d3.map({
  "circle": d3_svg_symbolCircle,
  "cross": function(size) {
    var r = Math.sqrt(size / 5) / 2;
    return "M" + -3 * r + "," + -r
        + "H" + -r
        + "V" + -3 * r
        + "H" + r
        + "V" + -r
        + "H" + 3 * r
        + "V" + r
        + "H" + r
        + "V" + 3 * r
        + "H" + -r
        + "V" + r
        + "H" + -3 * r
        + "Z";
  },
  "diamond": function(size) {
    var ry = Math.sqrt(size / (2 * d3_svg_symbolTan30)),
        rx = ry * d3_svg_symbolTan30;
    return "M0," + -ry
        + "L" + rx + ",0"
        + " 0," + ry
        + " " + -rx + ",0"
        + "Z";
  },
  "square": function(size) {
    var r = Math.sqrt(size) / 2;
    return "M" + -r + "," + -r
        + "L" + r + "," + -r
        + " " + r + "," + r
        + " " + -r + "," + r
        + "Z";
  },
  "triangle-down": function(size) {
    var rx = Math.sqrt(size / d3_svg_symbolSqrt3),
        ry = rx * d3_svg_symbolSqrt3 / 2;
    return "M0," + ry
        + "L" + rx +"," + -ry
        + " " + -rx + "," + -ry
        + "Z";
  },
  "triangle-up": function(size) {
    var rx = Math.sqrt(size / d3_svg_symbolSqrt3),
        ry = rx * d3_svg_symbolSqrt3 / 2;
    return "M0," + -ry
        + "L" + rx +"," + ry
        + " " + -rx + "," + ry
        + "Z";
  }
});

d3.svg.symbolTypes = d3_svg_symbols.keys();

var d3_svg_symbolSqrt3 = Math.sqrt(3),
    d3_svg_symbolTan30 = Math.tan(30 * Math.PI / 180);
d3.svg.axis = function() {
  var scale = d3.scale.linear(),
      orient = "bottom",
      tickMajorSize = 6,
      tickMinorSize = 6,
      tickEndSize = 6,
      tickPadding = 3,
      tickArguments_ = [10],
      tickValues = null,
      tickFormat_,
      tickSubdivide = 0;

  function axis(g) {
    g.each(function() {
      var g = d3.select(this);

      // Ticks, or domain values for ordinal scales.
      var ticks = tickValues == null ? (scale.ticks ? scale.ticks.apply(scale, tickArguments_) : scale.domain()) : tickValues,
          tickFormat = tickFormat_ == null ? (scale.tickFormat ? scale.tickFormat.apply(scale, tickArguments_) : String) : tickFormat_;

      // Minor ticks.
      var subticks = d3_svg_axisSubdivide(scale, ticks, tickSubdivide),
          subtick = g.selectAll(".minor").data(subticks, String),
          subtickEnter = subtick.enter().insert("line", "g").attr("class", "tick minor").style("opacity", 1e-6),
          subtickExit = d3.transition(subtick.exit()).style("opacity", 1e-6).remove(),
          subtickUpdate = d3.transition(subtick).style("opacity", 1);

      // Major ticks.
      var tick = g.selectAll("g").data(ticks, String),
          tickEnter = tick.enter().insert("g", "path").style("opacity", 1e-6),
          tickExit = d3.transition(tick.exit()).style("opacity", 1e-6).remove(),
          tickUpdate = d3.transition(tick).style("opacity", 1),
          tickTransform;

      // Domain.
      var range = d3_scaleRange(scale),
          path = g.selectAll(".domain").data([0]),
          pathEnter = path.enter().append("path").attr("class", "domain"),
          pathUpdate = d3.transition(path);

      // Stash a snapshot of the new scale, and retrieve the old snapshot.
      var scale1 = scale.copy(),
          scale0 = this.__chart__ || scale1;
      this.__chart__ = scale1;

      tickEnter.append("line").attr("class", "tick");
      tickEnter.append("text");
      tickUpdate.select("text").text(tickFormat);

      switch (orient) {
        case "bottom": {
          tickTransform = d3_svg_axisX;
          subtickEnter.attr("y2", tickMinorSize);
          subtickUpdate.attr("x2", 0).attr("y2", tickMinorSize);
          tickEnter.select("line").attr("y2", tickMajorSize);
          tickEnter.select("text").attr("y", Math.max(tickMajorSize, 0) + tickPadding);
          tickUpdate.select("line").attr("x2", 0).attr("y2", tickMajorSize);
          tickUpdate.select("text").attr("x", 0).attr("y", Math.max(tickMajorSize, 0) + tickPadding).attr("dy", ".71em").attr("text-anchor", "middle");
          pathUpdate.attr("d", "M" + range[0] + "," + tickEndSize + "V0H" + range[1] + "V" + tickEndSize);
          break;
        }
        case "top": {
          tickTransform = d3_svg_axisX;
          subtickEnter.attr("y2", -tickMinorSize);
          subtickUpdate.attr("x2", 0).attr("y2", -tickMinorSize);
          tickEnter.select("line").attr("y2", -tickMajorSize);
          tickEnter.select("text").attr("y", -(Math.max(tickMajorSize, 0) + tickPadding));
          tickUpdate.select("line").attr("x2", 0).attr("y2", -tickMajorSize);
          tickUpdate.select("text").attr("x", 0).attr("y", -(Math.max(tickMajorSize, 0) + tickPadding)).attr("dy", "0em").attr("text-anchor", "middle");
          pathUpdate.attr("d", "M" + range[0] + "," + -tickEndSize + "V0H" + range[1] + "V" + -tickEndSize);
          break;
        }
        case "left": {
          tickTransform = d3_svg_axisY;
          subtickEnter.attr("x2", -tickMinorSize);
          subtickUpdate.attr("x2", -tickMinorSize).attr("y2", 0);
          tickEnter.select("line").attr("x2", -tickMajorSize);
          tickEnter.select("text").attr("x", -(Math.max(tickMajorSize, 0) + tickPadding));
          tickUpdate.select("line").attr("x2", -tickMajorSize).attr("y2", 0);
          tickUpdate.select("text").attr("x", -(Math.max(tickMajorSize, 0) + tickPadding)).attr("y", 0).attr("dy", ".32em").attr("text-anchor", "end");
          pathUpdate.attr("d", "M" + -tickEndSize + "," + range[0] + "H0V" + range[1] + "H" + -tickEndSize);
          break;
        }
        case "right": {
          tickTransform = d3_svg_axisY;
          subtickEnter.attr("x2", tickMinorSize);
          subtickUpdate.attr("x2", tickMinorSize).attr("y2", 0);
          tickEnter.select("line").attr("x2", tickMajorSize);
          tickEnter.select("text").attr("x", Math.max(tickMajorSize, 0) + tickPadding);
          tickUpdate.select("line").attr("x2", tickMajorSize).attr("y2", 0);
          tickUpdate.select("text").attr("x", Math.max(tickMajorSize, 0) + tickPadding).attr("y", 0).attr("dy", ".32em").attr("text-anchor", "start");
          pathUpdate.attr("d", "M" + tickEndSize + "," + range[0] + "H0V" + range[1] + "H" + tickEndSize);
          break;
        }
      }

      // For quantitative scales:
      // - enter new ticks from the old scale
      // - exit old ticks to the new scale
      if (scale.ticks) {
        tickEnter.call(tickTransform, scale0);
        tickUpdate.call(tickTransform, scale1);
        tickExit.call(tickTransform, scale1);
        subtickEnter.call(tickTransform, scale0);
        subtickUpdate.call(tickTransform, scale1);
        subtickExit.call(tickTransform, scale1);
      }

      // For ordinal scales:
      // - any entering ticks are undefined in the old scale
      // - any exiting ticks are undefined in the new scale
      // Therefore, we only need to transition updating ticks.
      else {
        var dx = scale1.rangeBand() / 2, x = function(d) { return scale1(d) + dx; };
        tickEnter.call(tickTransform, x);
        tickUpdate.call(tickTransform, x);
      }
    });
  }

  axis.scale = function(x) {
    if (!arguments.length) return scale;
    scale = x;
    return axis;
  };

  axis.orient = function(x) {
    if (!arguments.length) return orient;
    orient = x;
    return axis;
  };

  axis.ticks = function() {
    if (!arguments.length) return tickArguments_;
    tickArguments_ = arguments;
    return axis;
  };

  axis.tickValues = function(x) {
    if (!arguments.length) return tickValues;
    tickValues = x;
    return axis;
  };

  axis.tickFormat = function(x) {
    if (!arguments.length) return tickFormat_;
    tickFormat_ = x;
    return axis;
  };

  axis.tickSize = function(x, y, z) {
    if (!arguments.length) return tickMajorSize;
    var n = arguments.length - 1;
    tickMajorSize = +x;
    tickMinorSize = n > 1 ? +y : tickMajorSize;
    tickEndSize = n > 0 ? +arguments[n] : tickMajorSize;
    return axis;
  };

  axis.tickPadding = function(x) {
    if (!arguments.length) return tickPadding;
    tickPadding = +x;
    return axis;
  };

  axis.tickSubdivide = function(x) {
    if (!arguments.length) return tickSubdivide;
    tickSubdivide = +x;
    return axis;
  };

  return axis;
};

function d3_svg_axisX(selection, x) {
  selection.attr("transform", function(d) { return "translate(" + x(d) + ",0)"; });
}

function d3_svg_axisY(selection, y) {
  selection.attr("transform", function(d) { return "translate(0," + y(d) + ")"; });
}

function d3_svg_axisSubdivide(scale, ticks, m) {
  subticks = [];
  if (m && ticks.length > 1) {
    var extent = d3_scaleExtent(scale.domain()),
        subticks,
        i = -1,
        n = ticks.length,
        d = (ticks[1] - ticks[0]) / ++m,
        j,
        v;
    while (++i < n) {
      for (j = m; --j > 0;) {
        if ((v = +ticks[i] - j * d) >= extent[0]) {
          subticks.push(v);
        }
      }
    }
    for (--i, j = 0; ++j < m && (v = +ticks[i] + j * d) < extent[1];) {
      subticks.push(v);
    }
  }
  return subticks;
}
d3.svg.brush = function() {
  var event = d3_eventDispatch(brush, "brushstart", "brush", "brushend"),
      x = null, // x-scale, optional
      y = null, // y-scale, optional
      resizes = d3_svg_brushResizes[0],
      extent = [[0, 0], [0, 0]], // [x0, y0], [x1, y1], in pixels (integers)
      extentDomain; // the extent in data space, lazily created

  function brush(g) {
    g.each(function() {
      var g = d3.select(this),
          bg = g.selectAll(".background").data([0]),
          fg = g.selectAll(".extent").data([0]),
          tz = g.selectAll(".resize").data(resizes, String),
          e;

      // Prepare the brush container for events.
      g
          .style("pointer-events", "all")
          .on("mousedown.brush", brushstart)
          .on("touchstart.brush", brushstart);

      // An invisible, mouseable area for starting a new brush.
      bg.enter().append("rect")
          .attr("class", "background")
          .style("visibility", "hidden")
          .style("cursor", "crosshair");

      // The visible brush extent; style this as you like!
      fg.enter().append("rect")
          .attr("class", "extent")
          .style("cursor", "move");

      // More invisible rects for resizing the extent.
      tz.enter().append("g")
          .attr("class", function(d) { return "resize " + d; })
          .style("cursor", function(d) { return d3_svg_brushCursor[d]; })
        .append("rect")
          .attr("x", function(d) { return /[ew]$/.test(d) ? -3 : null; })
          .attr("y", function(d) { return /^[ns]/.test(d) ? -3 : null; })
          .attr("width", 6)
          .attr("height", 6)
          .style("visibility", "hidden");

      // Show or hide the resizers.
      tz.style("display", brush.empty() ? "none" : null);

      // Remove any superfluous resizers.
      tz.exit().remove();

      // Initialize the background to fill the defined range.
      // If the range isn't defined, you can post-process.
      if (x) {
        e = d3_scaleRange(x);
        bg.attr("x", e[0]).attr("width", e[1] - e[0]);
        redrawX(g);
      }
      if (y) {
        e = d3_scaleRange(y);
        bg.attr("y", e[0]).attr("height", e[1] - e[0]);
        redrawY(g);
      }
      redraw(g);
    });
  }

  function redraw(g) {
    g.selectAll(".resize").attr("transform", function(d) {
      return "translate(" + extent[+/e$/.test(d)][0] + "," + extent[+/^s/.test(d)][1] + ")";
    });
  }

  function redrawX(g) {
    g.select(".extent").attr("x", extent[0][0]);
    g.selectAll(".extent,.n>rect,.s>rect").attr("width", extent[1][0] - extent[0][0]);
  }

  function redrawY(g) {
    g.select(".extent").attr("y", extent[0][1]);
    g.selectAll(".extent,.e>rect,.w>rect").attr("height", extent[1][1] - extent[0][1]);
  }

  function brushstart() {
    var target = this,
        eventTarget = d3.select(d3.event.target),
        event_ = event.of(target, arguments),
        g = d3.select(target),
        resizing = eventTarget.datum(),
        resizingX = !/^(n|s)$/.test(resizing) && x,
        resizingY = !/^(e|w)$/.test(resizing) && y,
        dragging = eventTarget.classed("extent"),
        center,
        origin = mouse(),
        offset;

    var w = d3.select(window)
        .on("mousemove.brush", brushmove)
        .on("mouseup.brush", brushend)
        .on("touchmove.brush", brushmove)
        .on("touchend.brush", brushend)
        .on("keydown.brush", keydown)
        .on("keyup.brush", keyup);

    // If the extent was clicked on, drag rather than brush;
    // store the point between the mouse and extent origin instead.
    if (dragging) {
      origin[0] = extent[0][0] - origin[0];
      origin[1] = extent[0][1] - origin[1];
    }

    // If a resizer was clicked on, record which side is to be resized.
    // Also, set the origin to the opposite side.
    else if (resizing) {
      var ex = +/w$/.test(resizing),
          ey = +/^n/.test(resizing);
      offset = [extent[1 - ex][0] - origin[0], extent[1 - ey][1] - origin[1]];
      origin[0] = extent[ex][0];
      origin[1] = extent[ey][1];
    }

    // If the ALT key is down when starting a brush, the center is at the mouse.
    else if (d3.event.altKey) center = origin.slice();

    // Propagate the active cursor to the body for the drag duration.
    g.style("pointer-events", "none").selectAll(".resize").style("display", null);
    d3.select("body").style("cursor", eventTarget.style("cursor"));

    // Notify listeners.
    event_({type: "brushstart"});
    brushmove();
    d3_eventCancel();

    function mouse() {
      var touches = d3.event.changedTouches;
      return touches ? d3.touches(target, touches)[0] : d3.mouse(target);
    }

    function keydown() {
      if (d3.event.keyCode == 32) {
        if (!dragging) {
          center = null;
          origin[0] -= extent[1][0];
          origin[1] -= extent[1][1];
          dragging = 2;
        }
        d3_eventCancel();
      }
    }

    function keyup() {
      if (d3.event.keyCode == 32 && dragging == 2) {
        origin[0] += extent[1][0];
        origin[1] += extent[1][1];
        dragging = 0;
        d3_eventCancel();
      }
    }

    function brushmove() {
      var point = mouse(),
          moved = false;

      // Preserve the offset for thick resizers.
      if (offset) {
        point[0] += offset[0];
        point[1] += offset[1];
      }

      if (!dragging) {

        // If needed, determine the center from the current extent.
        if (d3.event.altKey) {
          if (!center) center = [(extent[0][0] + extent[1][0]) / 2, (extent[0][1] + extent[1][1]) / 2];

          // Update the origin, for when the ALT key is released.
          origin[0] = extent[+(point[0] < center[0])][0];
          origin[1] = extent[+(point[1] < center[1])][1];
        }

        // When the ALT key is released, we clear the center.
        else center = null;
      }

      // Update the brush extent for each dimension.
      if (resizingX && move1(point, x, 0)) {
        redrawX(g);
        moved = true;
      }
      if (resizingY && move1(point, y, 1)) {
        redrawY(g);
        moved = true;
      }

      // Final redraw and notify listeners.
      if (moved) {
        redraw(g);
        event_({type: "brush", mode: dragging ? "move" : "resize"});
      }
    }

    function move1(point, scale, i) {
      var range = d3_scaleRange(scale),
          r0 = range[0],
          r1 = range[1],
          position = origin[i],
          size = extent[1][i] - extent[0][i],
          min,
          max;

      // When dragging, reduce the range by the extent size and position.
      if (dragging) {
        r0 -= position;
        r1 -= size + position;
      }

      // Clamp the point so that the extent fits within the range extent.
      min = Math.max(r0, Math.min(r1, point[i]));

      // Compute the new extent bounds.
      if (dragging) {
        max = (min += position) + size;
      } else {

        // If the ALT key is pressed, then preserve the center of the extent.
        if (center) position = Math.max(r0, Math.min(r1, 2 * center[i] - min));

        // Compute the min and max of the position and point.
        if (position < min) {
          max = min;
          min = position;
        } else {
          max = position;
        }
      }

      // Update the stored bounds.
      if (extent[0][i] !== min || extent[1][i] !== max) {
        extentDomain = null;
        extent[0][i] = min;
        extent[1][i] = max;
        return true;
      }
    }

    function brushend() {
      brushmove();

      // reset the cursor styles
      g.style("pointer-events", "all").selectAll(".resize").style("display", brush.empty() ? "none" : null);
      d3.select("body").style("cursor", null);

      w .on("mousemove.brush", null)
        .on("mouseup.brush", null)
        .on("touchmove.brush", null)
        .on("touchend.brush", null)
        .on("keydown.brush", null)
        .on("keyup.brush", null);

      event_({type: "brushend"});
      d3_eventCancel();
    }
  }

  brush.x = function(z) {
    if (!arguments.length) return x;
    x = z;
    resizes = d3_svg_brushResizes[!x << 1 | !y]; // fore!
    return brush;
  };

  brush.y = function(z) {
    if (!arguments.length) return y;
    y = z;
    resizes = d3_svg_brushResizes[!x << 1 | !y]; // fore!
    return brush;
  };

  brush.extent = function(z) {
    var x0, x1, y0, y1, t;

    // Invert the pixel extent to data-space.
    if (!arguments.length) {
      z = extentDomain || extent;
      if (x) {
        x0 = z[0][0], x1 = z[1][0];
        if (!extentDomain) {
          x0 = extent[0][0], x1 = extent[1][0];
          if (x.invert) x0 = x.invert(x0), x1 = x.invert(x1);
          if (x1 < x0) t = x0, x0 = x1, x1 = t;
        }
      }
      if (y) {
        y0 = z[0][1], y1 = z[1][1];
        if (!extentDomain) {
          y0 = extent[0][1], y1 = extent[1][1];
          if (y.invert) y0 = y.invert(y0), y1 = y.invert(y1);
          if (y1 < y0) t = y0, y0 = y1, y1 = t;
        }
      }
      return x && y ? [[x0, y0], [x1, y1]] : x ? [x0, x1] : y && [y0, y1];
    }

    // Scale the data-space extent to pixels.
    extentDomain = [[0, 0], [0, 0]];
    if (x) {
      x0 = z[0], x1 = z[1];
      if (y) x0 = x0[0], x1 = x1[0];
      extentDomain[0][0] = x0, extentDomain[1][0] = x1;
      if (x.invert) x0 = x(x0), x1 = x(x1);
      if (x1 < x0) t = x0, x0 = x1, x1 = t;
      extent[0][0] = x0 | 0, extent[1][0] = x1 | 0;
    }
    if (y) {
      y0 = z[0], y1 = z[1];
      if (x) y0 = y0[1], y1 = y1[1];
      extentDomain[0][1] = y0, extentDomain[1][1] = y1;
      if (y.invert) y0 = y(y0), y1 = y(y1);
      if (y1 < y0) t = y0, y0 = y1, y1 = t;
      extent[0][1] = y0 | 0, extent[1][1] = y1 | 0;
    }

    return brush;
  };

  brush.clear = function() {
    extentDomain = null;
    extent[0][0] =
    extent[0][1] =
    extent[1][0] =
    extent[1][1] = 0;
    return brush;
  };

  brush.empty = function() {
    return (x && extent[0][0] === extent[1][0])
        || (y && extent[0][1] === extent[1][1]);
  };

  return d3.rebind(brush, event, "on");
};

var d3_svg_brushCursor = {
  n: "ns-resize",
  e: "ew-resize",
  s: "ns-resize",
  w: "ew-resize",
  nw: "nwse-resize",
  ne: "nesw-resize",
  se: "nwse-resize",
  sw: "nesw-resize"
};

var d3_svg_brushResizes = [
  ["n", "e", "s", "w", "nw", "ne", "se", "sw"],
  ["e", "w"],
  ["n", "s"],
  []
];
d3.behavior = {};
// TODO Track touch points by identifier.

d3.behavior.drag = function() {
  var event = d3_eventDispatch(drag, "drag", "dragstart", "dragend"),
      origin = null;

  function drag() {
    this.on("mousedown.drag", mousedown)
        .on("touchstart.drag", mousedown);
  }

  function mousedown() {
    var target = this,
        event_ = event.of(target, arguments),
        eventTarget = d3.event.target,
        offset,
        origin_ = point(),
        moved = 0;

    var w = d3.select(window)
        .on("mousemove.drag", dragmove)
        .on("touchmove.drag", dragmove)
        .on("mouseup.drag", dragend, true)
        .on("touchend.drag", dragend, true);

    if (origin) {
      offset = origin.apply(target, arguments);
      offset = [offset.x - origin_[0], offset.y - origin_[1]];
    } else {
      offset = [0, 0];
    }

    event_({type: "dragstart"});

    function point() {
      var p = target.parentNode,
          t = d3.event.changedTouches;
      return t ? d3.touches(p, t)[0] : d3.mouse(p);
    }

    function dragmove() {
      if (!target.parentNode) return dragend(); // target removed from DOM

      var p = point(),
          dx = p[0] - origin_[0],
          dy = p[1] - origin_[1];

      moved |= dx | dy;
      origin_ = p;
      d3_eventCancel();

      event_({type: "drag", x: p[0] + offset[0], y: p[1] + offset[1], dx: dx, dy: dy});
    }

    function dragend() {
      event_({type: "dragend"});

      // if moved, prevent the mouseup (and possibly click) from propagating
      if (moved) {
        d3_eventCancel();
        if (d3.event.target === eventTarget) w.on("click.drag", click, true);
      }

      w .on("mousemove.drag", null)
        .on("touchmove.drag", null)
        .on("mouseup.drag", null)
        .on("touchend.drag", null);
    }

    // prevent the subsequent click from propagating (e.g., for anchors)
    function click() {
      d3_eventCancel();
      w.on("click.drag", null);
    }
  }

  drag.origin = function(x) {
    if (!arguments.length) return origin;
    origin = x;
    return drag;
  };

  return d3.rebind(drag, event, "on");
};
d3.behavior.zoom = function() {
  var translate = [0, 0],
      translate0, // translate when we started zooming (to avoid drift)
      scale = 1,
      scale0, // scale when we started touching
      scaleExtent = d3_behavior_zoomInfinity,
      event = d3_eventDispatch(zoom, "zoom"),
      x0,
      x1,
      y0,
      y1,
      touchtime; // time of last touchstart (to detect double-tap)

  function zoom() {
    this
        .on("mousedown.zoom", mousedown)
        .on("mousewheel.zoom", mousewheel)
        .on("mousemove.zoom", mousemove)
        .on("DOMMouseScroll.zoom", mousewheel)
        .on("dblclick.zoom", dblclick)
        .on("touchstart.zoom", touchstart)
        .on("touchmove.zoom", touchmove)
        .on("touchend.zoom", touchstart);
  }

  zoom.translate = function(x) {
    if (!arguments.length) return translate;
    translate = x.map(Number);
    return zoom;
  };

  zoom.scale = function(x) {
    if (!arguments.length) return scale;
    scale = +x;
    return zoom;
  };

  zoom.scaleExtent = function(x) {
    if (!arguments.length) return scaleExtent;
    scaleExtent = x == null ? d3_behavior_zoomInfinity : x.map(Number);
    return zoom;
  };

  zoom.x = function(z) {
    if (!arguments.length) return x1;
    x1 = z;
    x0 = z.copy();
    return zoom;
  };

  zoom.y = function(z) {
    if (!arguments.length) return y1;
    y1 = z;
    y0 = z.copy();
    return zoom;
  };

  function location(p) {
    return [(p[0] - translate[0]) / scale, (p[1] - translate[1]) / scale];
  }

  function point(l) {
    return [l[0] * scale + translate[0], l[1] * scale + translate[1]];
  }

  function scaleTo(s) {
    scale = Math.max(scaleExtent[0], Math.min(scaleExtent[1], s));
  }

  function translateTo(p, l) {
    l = point(l);
    translate[0] += p[0] - l[0];
    translate[1] += p[1] - l[1];
  }

  function dispatch(event) {
    if (x1) x1.domain(x0.range().map(function(x) { return (x - translate[0]) / scale; }).map(x0.invert));
    if (y1) y1.domain(y0.range().map(function(y) { return (y - translate[1]) / scale; }).map(y0.invert));
    d3.event.preventDefault();
    event({type: "zoom", scale: scale, translate: translate});
  }

  function mousedown() {
    var target = this,
        event_ = event.of(target, arguments),
        eventTarget = d3.event.target,
        moved = 0,
        w = d3.select(window).on("mousemove.zoom", mousemove).on("mouseup.zoom", mouseup),
        l = location(d3.mouse(target));

    window.focus();
    d3_eventCancel();

    function mousemove() {
      moved = 1;
      translateTo(d3.mouse(target), l);
      dispatch(event_);
    }

    function mouseup() {
      if (moved) d3_eventCancel();
      w.on("mousemove.zoom", null).on("mouseup.zoom", null);
      if (moved && d3.event.target === eventTarget) w.on("click.zoom", click);
    }

    function click() {
      d3_eventCancel();
      w.on("click.zoom", null);
    }
  }

  function mousewheel() {
    if (!translate0) translate0 = location(d3.mouse(this));
    scaleTo(Math.pow(2, d3_behavior_zoomDelta() * .002) * scale);
    translateTo(d3.mouse(this), translate0);
    dispatch(event.of(this, arguments));
  }

  function mousemove() {
    translate0 = null;
  }

  function dblclick() {
    var p = d3.mouse(this), l = location(p);
    scaleTo(d3.event.shiftKey ? scale / 2 : scale * 2);
    translateTo(p, l);
    dispatch(event.of(this, arguments));
  }

  function touchstart() {
    var touches = d3.touches(this),
        now = Date.now();

    scale0 = scale;
    translate0 = {};
    touches.forEach(function(t) { translate0[t.identifier] = location(t); });
    d3_eventCancel();

    if ((touches.length === 1) && (now - touchtime < 500)) { // dbltap
      var p = touches[0], l = location(touches[0]);
      scaleTo(scale * 2);
      translateTo(p, l);
      dispatch(event.of(this, arguments));
    }
    touchtime = now;
  }

  function touchmove() {
    var touches = d3.touches(this),
        p0 = touches[0],
        l0 = translate0[p0.identifier];
    if (p1 = touches[1]) {
      var p1, l1 = translate0[p1.identifier];
      p0 = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
      l0 = [(l0[0] + l1[0]) / 2, (l0[1] + l1[1]) / 2];
      scaleTo(d3.event.scale * scale0);
    }
    translateTo(p0, l0);
    dispatch(event.of(this, arguments));
  }

  return d3.rebind(zoom, event, "on");
};

var d3_behavior_zoomDiv, // for interpreting mousewheel events
    d3_behavior_zoomInfinity = [0, Infinity]; // default scale extent

function d3_behavior_zoomDelta() {

  // mousewheel events are totally broken!
  // https://bugs.webkit.org/show_bug.cgi?id=40441
  // not only that, but Chrome and Safari differ in re. to acceleration!
  if (!d3_behavior_zoomDiv) {
    d3_behavior_zoomDiv = d3.select("body").append("div")
        .style("visibility", "hidden")
        .style("top", 0)
        .style("height", 0)
        .style("width", 0)
        .style("overflow-y", "scroll")
      .append("div")
        .style("height", "2000px")
      .node().parentNode;
  }

  var e = d3.event, delta;
  try {
    d3_behavior_zoomDiv.scrollTop = 1000;
    d3_behavior_zoomDiv.dispatchEvent(e);
    delta = 1000 - d3_behavior_zoomDiv.scrollTop;
  } catch (error) {
    delta = e.wheelDelta || (-e.detail * 5);
  }

  return delta;
}
d3.layout = {};
// Implements hierarchical edge bundling using Holten's algorithm. For each
// input link, a path is computed that travels through the tree, up the parent
// hierarchy to the least common ancestor, and then back down to the destination
// node. Each path is simply an array of nodes.
d3.layout.bundle = function() {
  return function(links) {
    var paths = [],
        i = -1,
        n = links.length;
    while (++i < n) paths.push(d3_layout_bundlePath(links[i]));
    return paths;
  };
};

function d3_layout_bundlePath(link) {
  var start = link.source,
      end = link.target,
      lca = d3_layout_bundleLeastCommonAncestor(start, end),
      points = [start];
  while (start !== lca) {
    start = start.parent;
    points.push(start);
  }
  var k = points.length;
  while (end !== lca) {
    points.splice(k, 0, end);
    end = end.parent;
  }
  return points;
}

function d3_layout_bundleAncestors(node) {
  var ancestors = [],
      parent = node.parent;
  while (parent != null) {
    ancestors.push(node);
    node = parent;
    parent = parent.parent;
  }
  ancestors.push(node);
  return ancestors;
}

function d3_layout_bundleLeastCommonAncestor(a, b) {
  if (a === b) return a;
  var aNodes = d3_layout_bundleAncestors(a),
      bNodes = d3_layout_bundleAncestors(b),
      aNode = aNodes.pop(),
      bNode = bNodes.pop(),
      sharedNode = null;
  while (aNode === bNode) {
    sharedNode = aNode;
    aNode = aNodes.pop();
    bNode = bNodes.pop();
  }
  return sharedNode;
}
d3.layout.chord = function() {
  var chord = {},
      chords,
      groups,
      matrix,
      n,
      padding = 0,
      sortGroups,
      sortSubgroups,
      sortChords;

  function relayout() {
    var subgroups = {},
        groupSums = [],
        groupIndex = d3.range(n),
        subgroupIndex = [],
        k,
        x,
        x0,
        i,
        j;

    chords = [];
    groups = [];

    // Compute the sum.
    k = 0, i = -1; while (++i < n) {
      x = 0, j = -1; while (++j < n) {
        x += matrix[i][j];
      }
      groupSums.push(x);
      subgroupIndex.push(d3.range(n));
      k += x;
    }

    // Sort groups…
    if (sortGroups) {
      groupIndex.sort(function(a, b) {
        return sortGroups(groupSums[a], groupSums[b]);
      });
    }

    // Sort subgroups…
    if (sortSubgroups) {
      subgroupIndex.forEach(function(d, i) {
        d.sort(function(a, b) {
          return sortSubgroups(matrix[i][a], matrix[i][b]);
        });
      });
    }

    // Convert the sum to scaling factor for [0, 2pi].
    // TODO Allow start and end angle to be specified.
    // TODO Allow padding to be specified as percentage?
    k = (2 * Math.PI - padding * n) / k;

    // Compute the start and end angle for each group and subgroup.
    // Note: Opera has a bug reordering object literal properties!
    x = 0, i = -1; while (++i < n) {
      x0 = x, j = -1; while (++j < n) {
        var di = groupIndex[i],
            dj = subgroupIndex[di][j],
            v = matrix[di][dj],
            a0 = x,
            a1 = x += v * k;
        subgroups[di + "-" + dj] = {
          index: di,
          subindex: dj,
          startAngle: a0,
          endAngle: a1,
          value: v
        };
      }
      groups.push({
        index: di,
        startAngle: x0,
        endAngle: x,
        value: (x - x0) / k
      });
      x += padding;
    }

    // Generate chords for each (non-empty) subgroup-subgroup link.
    i = -1; while (++i < n) {
      j = i - 1; while (++j < n) {
        var source = subgroups[i + "-" + j],
            target = subgroups[j + "-" + i];
        if (source.value || target.value) {
          chords.push(source.value < target.value
              ? {source: target, target: source}
              : {source: source, target: target});
        }
      }
    }

    if (sortChords) resort();
  }

  function resort() {
    chords.sort(function(a, b) {
      return sortChords(
          (a.source.value + a.target.value) / 2,
          (b.source.value + b.target.value) / 2);
    });
  }

  chord.matrix = function(x) {
    if (!arguments.length) return matrix;
    n = (matrix = x) && matrix.length;
    chords = groups = null;
    return chord;
  };

  chord.padding = function(x) {
    if (!arguments.length) return padding;
    padding = x;
    chords = groups = null;
    return chord;
  };

  chord.sortGroups = function(x) {
    if (!arguments.length) return sortGroups;
    sortGroups = x;
    chords = groups = null;
    return chord;
  };

  chord.sortSubgroups = function(x) {
    if (!arguments.length) return sortSubgroups;
    sortSubgroups = x;
    chords = null;
    return chord;
  };

  chord.sortChords = function(x) {
    if (!arguments.length) return sortChords;
    sortChords = x;
    if (chords) resort();
    return chord;
  };

  chord.chords = function() {
    if (!chords) relayout();
    return chords;
  };

  chord.groups = function() {
    if (!groups) relayout();
    return groups;
  };

  return chord;
};
// A rudimentary force layout using Gauss-Seidel.
d3.layout.force = function() {
  var force = {},
      event = d3.dispatch("start", "tick", "end"),
      size = [1, 1],
      drag,
      alpha,
      friction = .9,
      linkDistance = d3_layout_forceLinkDistance,
      linkStrength = d3_layout_forceLinkStrength,
      charge = -30,
      gravity = .1,
      theta = .8,
      interval,
      nodes = [],
      links = [],
      distances,
      strengths,
      charges;

  function repulse(node) {
    return function(quad, x1, y1, x2, y2) {
      if (quad.point !== node) {
        var dx = quad.cx - node.x,
            dy = quad.cy - node.y,
            dn = 1 / Math.sqrt(dx * dx + dy * dy);

        /* Barnes-Hut criterion. */
        if ((x2 - x1) * dn < theta) {
          var k = quad.charge * dn * dn;
          node.px -= dx * k;
          node.py -= dy * k;
          return true;
        }

        if (quad.point && isFinite(dn)) {
          var k = quad.pointCharge * dn * dn;
          node.px -= dx * k;
          node.py -= dy * k;
        }
      }
      return !quad.charge;
    };
  }

  force.tick = function() {
    // simulated annealing, basically
    if ((alpha *= .99) < .005) {
      event.end({type: "end", alpha: alpha = 0});
      return true;
    }

    var n = nodes.length,
        m = links.length,
        q,
        i, // current index
        o, // current object
        s, // current source
        t, // current target
        l, // current distance
        k, // current force
        x, // x-distance
        y; // y-distance

    // gauss-seidel relaxation for links
    for (i = 0; i < m; ++i) {
      o = links[i];
      s = o.source;
      t = o.target;
      x = t.x - s.x;
      y = t.y - s.y;
      if (l = (x * x + y * y)) {
        l = alpha * strengths[i] * ((l = Math.sqrt(l)) - distances[i]) / l;
        x *= l;
        y *= l;
        t.x -= x * (k = s.weight / (t.weight + s.weight));
        t.y -= y * k;
        s.x += x * (k = 1 - k);
        s.y += y * k;
      }
    }

    // apply gravity forces
    if (k = alpha * gravity) {
      x = size[0] / 2;
      y = size[1] / 2;
      i = -1; if (k) while (++i < n) {
        o = nodes[i];
        o.x += (x - o.x) * k;
        o.y += (y - o.y) * k;
      }
    }

    // compute quadtree center of mass and apply charge forces
    if (charge) {
      d3_layout_forceAccumulate(q = d3.geom.quadtree(nodes), alpha, charges);
      i = -1; while (++i < n) {
        if (!(o = nodes[i]).fixed) {
          q.visit(repulse(o));
        }
      }
    }

    // position verlet integration
    i = -1; while (++i < n) {
      o = nodes[i];
      if (o.fixed) {
        o.x = o.px;
        o.y = o.py;
      } else {
        o.x -= (o.px - (o.px = o.x)) * friction;
        o.y -= (o.py - (o.py = o.y)) * friction;
      }
    }

    event.tick({type: "tick", alpha: alpha});
  };

  force.nodes = function(x) {
    if (!arguments.length) return nodes;
    nodes = x;
    return force;
  };

  force.links = function(x) {
    if (!arguments.length) return links;
    links = x;
    return force;
  };

  force.size = function(x) {
    if (!arguments.length) return size;
    size = x;
    return force;
  };

  force.linkDistance = function(x) {
    if (!arguments.length) return linkDistance;
    linkDistance = d3.functor(x);
    return force;
  };

  // For backwards-compatibility.
  force.distance = force.linkDistance;

  force.linkStrength = function(x) {
    if (!arguments.length) return linkStrength;
    linkStrength = d3.functor(x);
    return force;
  };

  force.friction = function(x) {
    if (!arguments.length) return friction;
    friction = x;
    return force;
  };

  force.charge = function(x) {
    if (!arguments.length) return charge;
    charge = typeof x === "function" ? x : +x;
    return force;
  };

  force.gravity = function(x) {
    if (!arguments.length) return gravity;
    gravity = x;
    return force;
  };

  force.theta = function(x) {
    if (!arguments.length) return theta;
    theta = x;
    return force;
  };

  force.alpha = function(x) {
    if (!arguments.length) return alpha;

    if (alpha) { // if we're already running
      if (x > 0) alpha = x; // we might keep it hot
      else alpha = 0; // or, next tick will dispatch "end"
    } else if (x > 0) { // otherwise, fire it up!
      event.start({type: "start", alpha: alpha = x});
      d3.timer(force.tick);
    }

    return force;
  };

  force.start = function() {
    var i,
        j,
        n = nodes.length,
        m = links.length,
        w = size[0],
        h = size[1],
        neighbors,
        o;

    for (i = 0; i < n; ++i) {
      (o = nodes[i]).index = i;
      o.weight = 0;
    }

    distances = [];
    strengths = [];
    for (i = 0; i < m; ++i) {
      o = links[i];
      if (typeof o.source == "number") o.source = nodes[o.source];
      if (typeof o.target == "number") o.target = nodes[o.target];
      distances[i] = linkDistance.call(this, o, i);
      strengths[i] = linkStrength.call(this, o, i);
      ++o.source.weight;
      ++o.target.weight;
    }

    for (i = 0; i < n; ++i) {
      o = nodes[i];
      if (isNaN(o.x)) o.x = position("x", w);
      if (isNaN(o.y)) o.y = position("y", h);
      if (isNaN(o.px)) o.px = o.x;
      if (isNaN(o.py)) o.py = o.y;
    }

    charges = [];
    if (typeof charge === "function") {
      for (i = 0; i < n; ++i) {
        charges[i] = +charge.call(this, nodes[i], i);
      }
    } else {
      for (i = 0; i < n; ++i) {
        charges[i] = charge;
      }
    }

    // initialize node position based on first neighbor
    function position(dimension, size) {
      var neighbors = neighbor(i),
          j = -1,
          m = neighbors.length,
          x;
      while (++j < m) if (!isNaN(x = neighbors[j][dimension])) return x;
      return Math.random() * size;
    }

    // initialize neighbors lazily
    function neighbor() {
      if (!neighbors) {
        neighbors = [];
        for (j = 0; j < n; ++j) {
          neighbors[j] = [];
        }
        for (j = 0; j < m; ++j) {
          var o = links[j];
          neighbors[o.source.index].push(o.target);
          neighbors[o.target.index].push(o.source);
        }
      }
      return neighbors[i];
    }

    return force.resume();
  };

  force.resume = function() {
    return force.alpha(.1);
  };

  force.stop = function() {
    return force.alpha(0);
  };

  // use `node.call(force.drag)` to make nodes draggable
  force.drag = function() {
    if (!drag) drag = d3.behavior.drag()
        .origin(Object)
        .on("dragstart", dragstart)
        .on("drag", d3_layout_forceDrag)
        .on("dragend", d3_layout_forceDragEnd);

    this.on("mouseover.force", d3_layout_forceDragOver)
        .on("mouseout.force", d3_layout_forceDragOut)
        .call(drag);
  };

  function dragstart(d) {
    d3_layout_forceDragOver(d3_layout_forceDragNode = d);
    d3_layout_forceDragForce = force;
  }

  return d3.rebind(force, event, "on");
};

var d3_layout_forceDragForce,
    d3_layout_forceDragNode;

function d3_layout_forceDragOver(d) {
  d.fixed |= 2;
}

function d3_layout_forceDragOut(d) {
  if (d !== d3_layout_forceDragNode) d.fixed &= 1;
}

function d3_layout_forceDragEnd() {
  d3_layout_forceDragNode.fixed &= 1;
  d3_layout_forceDragForce = d3_layout_forceDragNode = null;
}

function d3_layout_forceDrag() {
  d3_layout_forceDragNode.px = d3.event.x;
  d3_layout_forceDragNode.py = d3.event.y;
  d3_layout_forceDragForce.resume(); // restart annealing
}

function d3_layout_forceAccumulate(quad, alpha, charges) {
  var cx = 0,
      cy = 0;
  quad.charge = 0;
  if (!quad.leaf) {
    var nodes = quad.nodes,
        n = nodes.length,
        i = -1,
        c;
    while (++i < n) {
      c = nodes[i];
      if (c == null) continue;
      d3_layout_forceAccumulate(c, alpha, charges);
      quad.charge += c.charge;
      cx += c.charge * c.cx;
      cy += c.charge * c.cy;
    }
  }
  if (quad.point) {
    // jitter internal nodes that are coincident
    if (!quad.leaf) {
      quad.point.x += Math.random() - .5;
      quad.point.y += Math.random() - .5;
    }
    var k = alpha * charges[quad.point.index];
    quad.charge += quad.pointCharge = k;
    cx += k * quad.point.x;
    cy += k * quad.point.y;
  }
  quad.cx = cx / quad.charge;
  quad.cy = cy / quad.charge;
}

function d3_layout_forceLinkDistance(link) {
  return 20;
}

function d3_layout_forceLinkStrength(link) {
  return 1;
}
d3.layout.partition = function() {
  var hierarchy = d3.layout.hierarchy(),
      size = [1, 1]; // width, height

  function position(node, x, dx, dy) {
    var children = node.children;
    node.x = x;
    node.y = node.depth * dy;
    node.dx = dx;
    node.dy = dy;
    if (children && (n = children.length)) {
      var i = -1,
          n,
          c,
          d;
      dx = node.value ? dx / node.value : 0;
      while (++i < n) {
        position(c = children[i], x, d = c.value * dx, dy);
        x += d;
      }
    }
  }

  function depth(node) {
    var children = node.children,
        d = 0;
    if (children && (n = children.length)) {
      var i = -1,
          n;
      while (++i < n) d = Math.max(d, depth(children[i]));
    }
    return 1 + d;
  }

  function partition(d, i) {
    var nodes = hierarchy.call(this, d, i);
    position(nodes[0], 0, size[0], size[1] / depth(nodes[0]));
    return nodes;
  }

  partition.size = function(x) {
    if (!arguments.length) return size;
    size = x;
    return partition;
  };

  return d3_layout_hierarchyRebind(partition, hierarchy);
};
d3.layout.pie = function() {
  var value = Number,
      sort = d3_layout_pieSortByValue,
      startAngle = 0,
      endAngle = 2 * Math.PI;

  function pie(data, i) {

    // Compute the numeric values for each data element.
    var values = data.map(function(d, i) { return +value.call(pie, d, i); });

    // Compute the start angle.
    var a = +(typeof startAngle === "function"
        ? startAngle.apply(this, arguments)
        : startAngle);

    // Compute the angular scale factor: from value to radians.
    var k = ((typeof endAngle === "function"
        ? endAngle.apply(this, arguments)
        : endAngle) - startAngle)
        / d3.sum(values);

    // Optionally sort the data.
    var index = d3.range(data.length);
    if (sort != null) index.sort(sort === d3_layout_pieSortByValue
        ? function(i, j) { return values[j] - values[i]; }
        : function(i, j) { return sort(data[i], data[j]); });

    // Compute the arcs!
    // They are stored in the original data's order.
    var arcs = [];
    index.forEach(function(i) {
      arcs[i] = {
        data: data[i],
        value: d = values[i],
        startAngle: a,
        endAngle: a += d * k
      };
    });
    return arcs;
  }

  /**
   * Specifies the value function *x*, which returns a nonnegative numeric value
   * for each datum. The default value function is `Number`. The value function
   * is passed two arguments: the current datum and the current index.
   */
  pie.value = function(x) {
    if (!arguments.length) return value;
    value = x;
    return pie;
  };

  /**
   * Specifies a sort comparison operator *x*. The comparator is passed two data
   * elements from the data array, a and b; it returns a negative value if a is
   * less than b, a positive value if a is greater than b, and zero if a equals
   * b.
   */
  pie.sort = function(x) {
    if (!arguments.length) return sort;
    sort = x;
    return pie;
  };

  /**
   * Specifies the overall start angle of the pie chart. Defaults to 0. The
   * start angle can be specified either as a constant or as a function; in the
   * case of a function, it is evaluated once per array (as opposed to per
   * element).
   */
  pie.startAngle = function(x) {
    if (!arguments.length) return startAngle;
    startAngle = x;
    return pie;
  };

  /**
   * Specifies the overall end angle of the pie chart. Defaults to 2π. The
   * end angle can be specified either as a constant or as a function; in the
   * case of a function, it is evaluated once per array (as opposed to per
   * element).
   */
  pie.endAngle = function(x) {
    if (!arguments.length) return endAngle;
    endAngle = x;
    return pie;
  };

  return pie;
};

var d3_layout_pieSortByValue = {};
// data is two-dimensional array of x,y; we populate y0
d3.layout.stack = function() {
  var values = Object,
      order = d3_layout_stackOrderDefault,
      offset = d3_layout_stackOffsetZero,
      out = d3_layout_stackOut,
      x = d3_layout_stackX,
      y = d3_layout_stackY;

  function stack(data, index) {

    // Convert series to canonical two-dimensional representation.
    var series = data.map(function(d, i) {
      return values.call(stack, d, i);
    });

    // Convert each series to canonical [[x,y]] representation.
    var points = series.map(function(d, i) {
      return d.map(function(v, i) {
        return [x.call(stack, v, i), y.call(stack, v, i)];
      });
    });

    // Compute the order of series, and permute them.
    var orders = order.call(stack, points, index);
    series = d3.permute(series, orders);
    points = d3.permute(points, orders);

    // Compute the baseline…
    var offsets = offset.call(stack, points, index);

    // And propagate it to other series.
    var n = series.length,
        m = series[0].length,
        i,
        j,
        o;
    for (j = 0; j < m; ++j) {
      out.call(stack, series[0][j], o = offsets[j], points[0][j][1]);
      for (i = 1; i < n; ++i) {
        out.call(stack, series[i][j], o += points[i - 1][j][1], points[i][j][1]);
      }
    }

    return data;
  }

  stack.values = function(x) {
    if (!arguments.length) return values;
    values = x;
    return stack;
  };

  stack.order = function(x) {
    if (!arguments.length) return order;
    order = typeof x === "function" ? x : d3_layout_stackOrders.get(x) || d3_layout_stackOrderDefault;
    return stack;
  };

  stack.offset = function(x) {
    if (!arguments.length) return offset;
    offset = typeof x === "function" ? x : d3_layout_stackOffsets.get(x) || d3_layout_stackOffsetZero;
    return stack;
  };

  stack.x = function(z) {
    if (!arguments.length) return x;
    x = z;
    return stack;
  };

  stack.y = function(z) {
    if (!arguments.length) return y;
    y = z;
    return stack;
  };

  stack.out = function(z) {
    if (!arguments.length) return out;
    out = z;
    return stack;
  };

  return stack;
}

function d3_layout_stackX(d) {
  return d.x;
}

function d3_layout_stackY(d) {
  return d.y;
}

function d3_layout_stackOut(d, y0, y) {
  d.y0 = y0;
  d.y = y;
}

var d3_layout_stackOrders = d3.map({

  "inside-out": function(data) {
    var n = data.length,
        i,
        j,
        max = data.map(d3_layout_stackMaxIndex),
        sums = data.map(d3_layout_stackReduceSum),
        index = d3.range(n).sort(function(a, b) { return max[a] - max[b]; }),
        top = 0,
        bottom = 0,
        tops = [],
        bottoms = [];
    for (i = 0; i < n; ++i) {
      j = index[i];
      if (top < bottom) {
        top += sums[j];
        tops.push(j);
      } else {
        bottom += sums[j];
        bottoms.push(j);
      }
    }
    return bottoms.reverse().concat(tops);
  },

  "reverse": function(data) {
    return d3.range(data.length).reverse();
  },

  "default": d3_layout_stackOrderDefault

});

var d3_layout_stackOffsets = d3.map({

  "silhouette": function(data) {
    var n = data.length,
        m = data[0].length,
        sums = [],
        max = 0,
        i,
        j,
        o,
        y0 = [];
    for (j = 0; j < m; ++j) {
      for (i = 0, o = 0; i < n; i++) o += data[i][j][1];
      if (o > max) max = o;
      sums.push(o);
    }
    for (j = 0; j < m; ++j) {
      y0[j] = (max - sums[j]) / 2;
    }
    return y0;
  },

  "wiggle": function(data) {
    var n = data.length,
        x = data[0],
        m = x.length,
        max = 0,
        i,
        j,
        k,
        s1,
        s2,
        s3,
        dx,
        o,
        o0,
        y0 = [];
    y0[0] = o = o0 = 0;
    for (j = 1; j < m; ++j) {
      for (i = 0, s1 = 0; i < n; ++i) s1 += data[i][j][1];
      for (i = 0, s2 = 0, dx = x[j][0] - x[j - 1][0]; i < n; ++i) {
        for (k = 0, s3 = (data[i][j][1] - data[i][j - 1][1]) / (2 * dx); k < i; ++k) {
          s3 += (data[k][j][1] - data[k][j - 1][1]) / dx;
        }
        s2 += s3 * data[i][j][1];
      }
      y0[j] = o -= s1 ? s2 / s1 * dx : 0;
      if (o < o0) o0 = o;
    }
    for (j = 0; j < m; ++j) y0[j] -= o0;
    return y0;
  },

  "expand": function(data) {
    var n = data.length,
        m = data[0].length,
        k = 1 / n,
        i,
        j,
        o,
        y0 = [];
    for (j = 0; j < m; ++j) {
      for (i = 0, o = 0; i < n; i++) o += data[i][j][1];
      if (o) for (i = 0; i < n; i++) data[i][j][1] /= o;
      else for (i = 0; i < n; i++) data[i][j][1] = k;
    }
    for (j = 0; j < m; ++j) y0[j] = 0;
    return y0;
  },

  "zero": d3_layout_stackOffsetZero

});

function d3_layout_stackOrderDefault(data) {
  return d3.range(data.length);
}

function d3_layout_stackOffsetZero(data) {
  var j = -1,
      m = data[0].length,
      y0 = [];
  while (++j < m) y0[j] = 0;
  return y0;
}

function d3_layout_stackMaxIndex(array) {
  var i = 1,
      j = 0,
      v = array[0][1],
      k,
      n = array.length;
  for (; i < n; ++i) {
    if ((k = array[i][1]) > v) {
      j = i;
      v = k;
    }
  }
  return j;
}

function d3_layout_stackReduceSum(d) {
  return d.reduce(d3_layout_stackSum, 0);
}

function d3_layout_stackSum(p, d) {
  return p + d[1];
}
d3.layout.histogram = function() {
  var frequency = true,
      valuer = Number,
      ranger = d3_layout_histogramRange,
      binner = d3_layout_histogramBinSturges;

  function histogram(data, i) {
    var bins = [],
        values = data.map(valuer, this),
        range = ranger.call(this, values, i),
        thresholds = binner.call(this, range, values, i),
        bin,
        i = -1,
        n = values.length,
        m = thresholds.length - 1,
        k = frequency ? 1 : 1 / n,
        x;

    // Initialize the bins.
    while (++i < m) {
      bin = bins[i] = [];
      bin.dx = thresholds[i + 1] - (bin.x = thresholds[i]);
      bin.y = 0;
    }

    // Fill the bins, ignoring values outside the range.
    i = -1; while(++i < n) {
      x = values[i];
      if ((x >= range[0]) && (x <= range[1])) {
        bin = bins[d3.bisect(thresholds, x, 1, m) - 1];
        bin.y += k;
        bin.push(data[i]);
      }
    }

    return bins;
  }

  // Specifies how to extract a value from the associated data. The default
  // value function is `Number`, which is equivalent to the identity function.
  histogram.value = function(x) {
    if (!arguments.length) return valuer;
    valuer = x;
    return histogram;
  };

  // Specifies the range of the histogram. Values outside the specified range
  // will be ignored. The argument `x` may be specified either as a two-element
  // array representing the minimum and maximum value of the range, or as a
  // function that returns the range given the array of values and the current
  // index `i`. The default range is the extent (minimum and maximum) of the
  // values.
  histogram.range = function(x) {
    if (!arguments.length) return ranger;
    ranger = d3.functor(x);
    return histogram;
  };

  // Specifies how to bin values in the histogram. The argument `x` may be
  // specified as a number, in which case the range of values will be split
  // uniformly into the given number of bins. Or, `x` may be an array of
  // threshold values, defining the bins; the specified array must contain the
  // rightmost (upper) value, thus specifying n + 1 values for n bins. Or, `x`
  // may be a function which is evaluated, being passed the range, the array of
  // values, and the current index `i`, returning an array of thresholds. The
  // default bin function will divide the values into uniform bins using
  // Sturges' formula.
  histogram.bins = function(x) {
    if (!arguments.length) return binner;
    binner = typeof x === "number"
        ? function(range) { return d3_layout_histogramBinFixed(range, x); }
        : d3.functor(x);
    return histogram;
  };

  // Specifies whether the histogram's `y` value is a count (frequency) or a
  // probability (density). The default value is true.
  histogram.frequency = function(x) {
    if (!arguments.length) return frequency;
    frequency = !!x;
    return histogram;
  };

  return histogram;
};

function d3_layout_histogramBinSturges(range, values) {
  return d3_layout_histogramBinFixed(range, Math.ceil(Math.log(values.length) / Math.LN2 + 1));
}

function d3_layout_histogramBinFixed(range, n) {
  var x = -1,
      b = +range[0],
      m = (range[1] - b) / n,
      f = [];
  while (++x <= n) f[x] = m * x + b;
  return f;
}

function d3_layout_histogramRange(values) {
  return [d3.min(values), d3.max(values)];
}
d3.layout.hierarchy = function() {
  var sort = d3_layout_hierarchySort,
      children = d3_layout_hierarchyChildren,
      value = d3_layout_hierarchyValue;

  // Recursively compute the node depth and value.
  // Also converts the data representation into a standard hierarchy structure.
  function recurse(data, depth, nodes) {
    var childs = children.call(hierarchy, data, depth),
        node = d3_layout_hierarchyInline ? data : {data: data};
    node.depth = depth;
    nodes.push(node);
    if (childs && (n = childs.length)) {
      var i = -1,
          n,
          c = node.children = [],
          v = 0,
          j = depth + 1;
      while (++i < n) {
        d = recurse(childs[i], j, nodes);
        d.parent = node;
        c.push(d);
        v += d.value;
      }
      if (sort) c.sort(sort);
      if (value) node.value = v;
    } else if (value) {
      node.value = +value.call(hierarchy, data, depth) || 0;
    }
    return node;
  }

  // Recursively re-evaluates the node value.
  function revalue(node, depth) {
    var children = node.children,
        v = 0;
    if (children && (n = children.length)) {
      var i = -1,
          n,
          j = depth + 1;
      while (++i < n) v += revalue(children[i], j);
    } else if (value) {
      v = +value.call(hierarchy, d3_layout_hierarchyInline ? node : node.data, depth) || 0;
    }
    if (value) node.value = v;
    return v;
  }

  function hierarchy(d) {
    var nodes = [];
    recurse(d, 0, nodes);
    return nodes;
  }

  hierarchy.sort = function(x) {
    if (!arguments.length) return sort;
    sort = x;
    return hierarchy;
  };

  hierarchy.children = function(x) {
    if (!arguments.length) return children;
    children = x;
    return hierarchy;
  };

  hierarchy.value = function(x) {
    if (!arguments.length) return value;
    value = x;
    return hierarchy;
  };

  // Re-evaluates the `value` property for the specified hierarchy.
  hierarchy.revalue = function(root) {
    revalue(root, 0);
    return root;
  };

  return hierarchy;
};

// A method assignment helper for hierarchy subclasses.
function d3_layout_hierarchyRebind(object, hierarchy) {
  d3.rebind(object, hierarchy, "sort", "children", "value");

  // Add an alias for links, for convenience.
  object.links = d3_layout_hierarchyLinks;

  // If the new API is used, enabling inlining.
  object.nodes = function(d) {
    d3_layout_hierarchyInline = true;
    return (object.nodes = object)(d);
  };

  return object;
}

function d3_layout_hierarchyChildren(d) {
  return d.children;
}

function d3_layout_hierarchyValue(d) {
  return d.value;
}

function d3_layout_hierarchySort(a, b) {
  return b.value - a.value;
}

// Returns an array source+target objects for the specified nodes.
function d3_layout_hierarchyLinks(nodes) {
  return d3.merge(nodes.map(function(parent) {
    return (parent.children || []).map(function(child) {
      return {source: parent, target: child};
    });
  }));
}

// For backwards-compatibility, don't enable inlining by default.
var d3_layout_hierarchyInline = false;
d3.layout.pack = function() {
  var hierarchy = d3.layout.hierarchy().sort(d3_layout_packSort),
      size = [1, 1];

  function pack(d, i) {
    var nodes = hierarchy.call(this, d, i),
        root = nodes[0];

    // Recursively compute the layout.
    root.x = 0;
    root.y = 0;
    d3_layout_packTree(root);

    // Scale the layout to fit the requested size.
    var w = size[0],
        h = size[1],
        k = 1 / Math.max(2 * root.r / w, 2 * root.r / h);
    d3_layout_packTransform(root, w / 2, h / 2, k);

    return nodes;
  }

  pack.size = function(x) {
    if (!arguments.length) return size;
    size = x;
    return pack;
  };

  return d3_layout_hierarchyRebind(pack, hierarchy);
};

function d3_layout_packSort(a, b) {
  return a.value - b.value;
}

function d3_layout_packInsert(a, b) {
  var c = a._pack_next;
  a._pack_next = b;
  b._pack_prev = a;
  b._pack_next = c;
  c._pack_prev = b;
}

function d3_layout_packSplice(a, b) {
  a._pack_next = b;
  b._pack_prev = a;
}

function d3_layout_packIntersects(a, b) {
  var dx = b.x - a.x,
      dy = b.y - a.y,
      dr = a.r + b.r;
  return dr * dr - dx * dx - dy * dy > .001; // within epsilon
}

function d3_layout_packCircle(nodes) {
  var xMin = Infinity,
      xMax = -Infinity,
      yMin = Infinity,
      yMax = -Infinity,
      n = nodes.length,
      a, b, c, j, k;

  function bound(node) {
    xMin = Math.min(node.x - node.r, xMin);
    xMax = Math.max(node.x + node.r, xMax);
    yMin = Math.min(node.y - node.r, yMin);
    yMax = Math.max(node.y + node.r, yMax);
  }

  // Create node links.
  nodes.forEach(d3_layout_packLink);

  // Create first node.
  a = nodes[0];
  a.x = -a.r;
  a.y = 0;
  bound(a);

  // Create second node.
  if (n > 1) {
    b = nodes[1];
    b.x = b.r;
    b.y = 0;
    bound(b);

    // Create third node and build chain.
    if (n > 2) {
      c = nodes[2];
      d3_layout_packPlace(a, b, c);
      bound(c);
      d3_layout_packInsert(a, c);
      a._pack_prev = c;
      d3_layout_packInsert(c, b);
      b = a._pack_next;

      // Now iterate through the rest.
      for (var i = 3; i < n; i++) {
        d3_layout_packPlace(a, b, c = nodes[i]);

        // Search for the closest intersection.
        var isect = 0, s1 = 1, s2 = 1;
        for (j = b._pack_next; j !== b; j = j._pack_next, s1++) {
          if (d3_layout_packIntersects(j, c)) {
            isect = 1;
            break;
          }
        }
        if (isect == 1) {
          for (k = a._pack_prev; k !== j._pack_prev; k = k._pack_prev, s2++) {
            if (d3_layout_packIntersects(k, c)) {
              break;
            }
          }
        }

        // Update node chain.
        if (isect) {
          if (s1 < s2 || (s1 == s2 && b.r < a.r)) d3_layout_packSplice(a, b = j);
          else d3_layout_packSplice(a = k, b);
          i--;
        } else {
          d3_layout_packInsert(a, c);
          b = c;
          bound(c);
        }
      }
    }
  }

  // Re-center the circles and return the encompassing radius.
  var cx = (xMin + xMax) / 2,
      cy = (yMin + yMax) / 2,
      cr = 0;
  for (var i = 0; i < n; i++) {
    var node = nodes[i];
    node.x -= cx;
    node.y -= cy;
    cr = Math.max(cr, node.r + Math.sqrt(node.x * node.x + node.y * node.y));
  }

  // Remove node links.
  nodes.forEach(d3_layout_packUnlink);

  return cr;
}

function d3_layout_packLink(node) {
  node._pack_next = node._pack_prev = node;
}

function d3_layout_packUnlink(node) {
  delete node._pack_next;
  delete node._pack_prev;
}

function d3_layout_packTree(node) {
  var children = node.children;
  if (children && children.length) {
    children.forEach(d3_layout_packTree);
    node.r = d3_layout_packCircle(children);
  } else {
    node.r = Math.sqrt(node.value);
  }
}

function d3_layout_packTransform(node, x, y, k) {
  var children = node.children;
  node.x = (x += k * node.x);
  node.y = (y += k * node.y);
  node.r *= k;
  if (children) {
    var i = -1, n = children.length;
    while (++i < n) d3_layout_packTransform(children[i], x, y, k);
  }
}

function d3_layout_packPlace(a, b, c) {
  var db = a.r + c.r,
      dx = b.x - a.x,
      dy = b.y - a.y;
  if (db && (dx || dy)) {
    var da = b.r + c.r,
        dc = Math.sqrt(dx * dx + dy * dy),
        cos = Math.max(-1, Math.min(1, (db * db + dc * dc - da * da) / (2 * db * dc))),
        theta = Math.acos(cos),
        x = cos * (db /= dc),
        y = Math.sin(theta) * db;
    c.x = a.x + x * dx + y * dy;
    c.y = a.y + x * dy - y * dx;
  } else {
    c.x = a.x + db;
    c.y = a.y;
  }
}
// Implements a hierarchical layout using the cluster (or dendrogram)
// algorithm.
d3.layout.cluster = function() {
  var hierarchy = d3.layout.hierarchy().sort(null).value(null),
      separation = d3_layout_treeSeparation,
      size = [1, 1]; // width, height

  function cluster(d, i) {
    var nodes = hierarchy.call(this, d, i),
        root = nodes[0],
        previousNode,
        x = 0,
        kx,
        ky;

    // First walk, computing the initial x & y values.
    d3_layout_treeVisitAfter(root, function(node) {
      var children = node.children;
      if (children && children.length) {
        node.x = d3_layout_clusterX(children);
        node.y = d3_layout_clusterY(children);
      } else {
        node.x = previousNode ? x += separation(node, previousNode) : 0;
        node.y = 0;
        previousNode = node;
      }
    });

    // Compute the left-most, right-most, and depth-most nodes for extents.
    var left = d3_layout_clusterLeft(root),
        right = d3_layout_clusterRight(root),
        x0 = left.x - separation(left, right) / 2,
        x1 = right.x + separation(right, left) / 2;

    // Second walk, normalizing x & y to the desired size.
    d3_layout_treeVisitAfter(root, function(node) {
      node.x = (node.x - x0) / (x1 - x0) * size[0];
      node.y = (1 - (root.y ? node.y / root.y : 1)) * size[1];
    });

    return nodes;
  }

  cluster.separation = function(x) {
    if (!arguments.length) return separation;
    separation = x;
    return cluster;
  };

  cluster.size = function(x) {
    if (!arguments.length) return size;
    size = x;
    return cluster;
  };

  return d3_layout_hierarchyRebind(cluster, hierarchy);
};

function d3_layout_clusterY(children) {
  return 1 + d3.max(children, function(child) {
    return child.y;
  });
}

function d3_layout_clusterX(children) {
  return children.reduce(function(x, child) {
    return x + child.x;
  }, 0) / children.length;
}

function d3_layout_clusterLeft(node) {
  var children = node.children;
  return children && children.length ? d3_layout_clusterLeft(children[0]) : node;
}

function d3_layout_clusterRight(node) {
  var children = node.children, n;
  return children && (n = children.length) ? d3_layout_clusterRight(children[n - 1]) : node;
}
// Node-link tree diagram using the Reingold-Tilford "tidy" algorithm
d3.layout.tree = function() {
  var hierarchy = d3.layout.hierarchy().sort(null).value(null),
      separation = d3_layout_treeSeparation,
      size = [1, 1]; // width, height

  function tree(d, i) {
    var nodes = hierarchy.call(this, d, i),
        root = nodes[0];

    function firstWalk(node, previousSibling) {
      var children = node.children,
          layout = node._tree;
      if (children && (n = children.length)) {
        var n,
            firstChild = children[0],
            previousChild,
            ancestor = firstChild,
            child,
            i = -1;
        while (++i < n) {
          child = children[i];
          firstWalk(child, previousChild);
          ancestor = apportion(child, previousChild, ancestor);
          previousChild = child;
        }
        d3_layout_treeShift(node);
        var midpoint = .5 * (firstChild._tree.prelim + child._tree.prelim);
        if (previousSibling) {
          layout.prelim = previousSibling._tree.prelim + separation(node, previousSibling);
          layout.mod = layout.prelim - midpoint;
        } else {
          layout.prelim = midpoint;
        }
      } else {
        if (previousSibling) {
          layout.prelim = previousSibling._tree.prelim + separation(node, previousSibling);
        }
      }
    }

    function secondWalk(node, x) {
      node.x = node._tree.prelim + x;
      var children = node.children;
      if (children && (n = children.length)) {
        var i = -1,
            n;
        x += node._tree.mod;
        while (++i < n) {
          secondWalk(children[i], x);
        }
      }
    }

    function apportion(node, previousSibling, ancestor) {
      if (previousSibling) {
        var vip = node,
            vop = node,
            vim = previousSibling,
            vom = node.parent.children[0],
            sip = vip._tree.mod,
            sop = vop._tree.mod,
            sim = vim._tree.mod,
            som = vom._tree.mod,
            shift;
        while (vim = d3_layout_treeRight(vim), vip = d3_layout_treeLeft(vip), vim && vip) {
          vom = d3_layout_treeLeft(vom);
          vop = d3_layout_treeRight(vop);
          vop._tree.ancestor = node;
          shift = vim._tree.prelim + sim - vip._tree.prelim - sip + separation(vim, vip);
          if (shift > 0) {
            d3_layout_treeMove(d3_layout_treeAncestor(vim, node, ancestor), node, shift);
            sip += shift;
            sop += shift;
          }
          sim += vim._tree.mod;
          sip += vip._tree.mod;
          som += vom._tree.mod;
          sop += vop._tree.mod;
        }
        if (vim && !d3_layout_treeRight(vop)) {
          vop._tree.thread = vim;
          vop._tree.mod += sim - sop;
        }
        if (vip && !d3_layout_treeLeft(vom)) {
          vom._tree.thread = vip;
          vom._tree.mod += sip - som;
          ancestor = node;
        }
      }
      return ancestor;
    }

    // Initialize temporary layout variables.
    d3_layout_treeVisitAfter(root, function(node, previousSibling) {
      node._tree = {
        ancestor: node,
        prelim: 0,
        mod: 0,
        change: 0,
        shift: 0,
        number: previousSibling ? previousSibling._tree.number + 1 : 0
      };
    });

    // Compute the layout using Buchheim et al.'s algorithm.
    firstWalk(root);
    secondWalk(root, -root._tree.prelim);

    // Compute the left-most, right-most, and depth-most nodes for extents.
    var left = d3_layout_treeSearch(root, d3_layout_treeLeftmost),
        right = d3_layout_treeSearch(root, d3_layout_treeRightmost),
        deep = d3_layout_treeSearch(root, d3_layout_treeDeepest),
        x0 = left.x - separation(left, right) / 2,
        x1 = right.x + separation(right, left) / 2,
        y1 = deep.depth || 1;

    // Clear temporary layout variables; transform x and y.
    d3_layout_treeVisitAfter(root, function(node) {
      node.x = (node.x - x0) / (x1 - x0) * size[0];
      node.y = node.depth / y1 * size[1];
      delete node._tree;
    });

    return nodes;
  }

  tree.separation = function(x) {
    if (!arguments.length) return separation;
    separation = x;
    return tree;
  };

  tree.size = function(x) {
    if (!arguments.length) return size;
    size = x;
    return tree;
  };

  return d3_layout_hierarchyRebind(tree, hierarchy);
};

function d3_layout_treeSeparation(a, b) {
  return a.parent == b.parent ? 1 : 2;
}

// function d3_layout_treeSeparationRadial(a, b) {
//   return (a.parent == b.parent ? 1 : 2) / a.depth;
// }

function d3_layout_treeLeft(node) {
  var children = node.children;
  return children && children.length ? children[0] : node._tree.thread;
}

function d3_layout_treeRight(node) {
  var children = node.children,
      n;
  return children && (n = children.length) ? children[n - 1] : node._tree.thread;
}

function d3_layout_treeSearch(node, compare) {
  var children = node.children;
  if (children && (n = children.length)) {
    var child,
        n,
        i = -1;
    while (++i < n) {
      if (compare(child = d3_layout_treeSearch(children[i], compare), node) > 0) {
        node = child;
      }
    }
  }
  return node;
}

function d3_layout_treeRightmost(a, b) {
  return a.x - b.x;
}

function d3_layout_treeLeftmost(a, b) {
  return b.x - a.x;
}

function d3_layout_treeDeepest(a, b) {
  return a.depth - b.depth;
}

function d3_layout_treeVisitAfter(node, callback) {
  function visit(node, previousSibling) {
    var children = node.children;
    if (children && (n = children.length)) {
      var child,
          previousChild = null,
          i = -1,
          n;
      while (++i < n) {
        child = children[i];
        visit(child, previousChild);
        previousChild = child;
      }
    }
    callback(node, previousSibling);
  }
  visit(node, null);
}

function d3_layout_treeShift(node) {
  var shift = 0,
      change = 0,
      children = node.children,
      i = children.length,
      child;
  while (--i >= 0) {
    child = children[i]._tree;
    child.prelim += shift;
    child.mod += shift;
    shift += child.shift + (change += child.change);
  }
}

function d3_layout_treeMove(ancestor, node, shift) {
  ancestor = ancestor._tree;
  node = node._tree;
  var change = shift / (node.number - ancestor.number);
  ancestor.change += change;
  node.change -= change;
  node.shift += shift;
  node.prelim += shift;
  node.mod += shift;
}

function d3_layout_treeAncestor(vim, node, ancestor) {
  return vim._tree.ancestor.parent == node.parent
      ? vim._tree.ancestor
      : ancestor;
}
// Squarified Treemaps by Mark Bruls, Kees Huizing, and Jarke J. van Wijk
// Modified to support a target aspect ratio by Jeff Heer
d3.layout.treemap = function() {
  var hierarchy = d3.layout.hierarchy(),
      round = Math.round,
      size = [1, 1], // width, height
      padding = null,
      pad = d3_layout_treemapPadNull,
      sticky = false,
      stickies,
      ratio = 0.5 * (1 + Math.sqrt(5)); // golden ratio

  // Compute the area for each child based on value & scale.
  function scale(children, k) {
    var i = -1,
        n = children.length,
        child,
        area;
    while (++i < n) {
      area = (child = children[i]).value * (k < 0 ? 0 : k);
      child.area = isNaN(area) || area <= 0 ? 0 : area;
    }
  }

  // Recursively arranges the specified node's children into squarified rows.
  function squarify(node) {
    var children = node.children;
    if (children && children.length) {
      var rect = pad(node),
          row = [],
          remaining = children.slice(), // copy-on-write
          child,
          best = Infinity, // the best row score so far
          score, // the current row score
          u = Math.min(rect.dx, rect.dy), // initial orientation
          n;
      scale(remaining, rect.dx * rect.dy / node.value);
      row.area = 0;
      while ((n = remaining.length) > 0) {
        row.push(child = remaining[n - 1]);
        row.area += child.area;
        if ((score = worst(row, u)) <= best) { // continue with this orientation
          remaining.pop();
          best = score;
        } else { // abort, and try a different orientation
          row.area -= row.pop().area;
          position(row, u, rect, false);
          u = Math.min(rect.dx, rect.dy);
          row.length = row.area = 0;
          best = Infinity;
        }
      }
      if (row.length) {
        position(row, u, rect, true);
        row.length = row.area = 0;
      }
      children.forEach(squarify);
    }
  }

  // Recursively resizes the specified node's children into existing rows.
  // Preserves the existing layout!
  function stickify(node) {
    var children = node.children;
    if (children && children.length) {
      var rect = pad(node),
          remaining = children.slice(), // copy-on-write
          child,
          row = [];
      scale(remaining, rect.dx * rect.dy / node.value);
      row.area = 0;
      while (child = remaining.pop()) {
        row.push(child);
        row.area += child.area;
        if (child.z != null) {
          position(row, child.z ? rect.dx : rect.dy, rect, !remaining.length);
          row.length = row.area = 0;
        }
      }
      children.forEach(stickify);
    }
  }

  // Computes the score for the specified row, as the worst aspect ratio.
  function worst(row, u) {
    var s = row.area,
        r,
        rmax = 0,
        rmin = Infinity,
        i = -1,
        n = row.length;
    while (++i < n) {
      if (!(r = row[i].area)) continue;
      if (r < rmin) rmin = r;
      if (r > rmax) rmax = r;
    }
    s *= s;
    u *= u;
    return s
        ? Math.max((u * rmax * ratio) / s, s / (u * rmin * ratio))
        : Infinity;
  }

  // Positions the specified row of nodes. Modifies `rect`.
  function position(row, u, rect, flush) {
    var i = -1,
        n = row.length,
        x = rect.x,
        y = rect.y,
        v = u ? round(row.area / u) : 0,
        o;
    if (u == rect.dx) { // horizontal subdivision
      if (flush || v > rect.dy) v = rect.dy; // over+underflow
      while (++i < n) {
        o = row[i];
        o.x = x;
        o.y = y;
        o.dy = v;
        x += o.dx = Math.min(rect.x + rect.dx - x, v ? round(o.area / v) : 0);
      }
      o.z = true;
      o.dx += rect.x + rect.dx - x; // rounding error
      rect.y += v;
      rect.dy -= v;
    } else { // vertical subdivision
      if (flush || v > rect.dx) v = rect.dx; // over+underflow
      while (++i < n) {
        o = row[i];
        o.x = x;
        o.y = y;
        o.dx = v;
        y += o.dy = Math.min(rect.y + rect.dy - y, v ? round(o.area / v) : 0);
      }
      o.z = false;
      o.dy += rect.y + rect.dy - y; // rounding error
      rect.x += v;
      rect.dx -= v;
    }
  }

  function treemap(d) {
    var nodes = stickies || hierarchy(d),
        root = nodes[0];
    root.x = 0;
    root.y = 0;
    root.dx = size[0];
    root.dy = size[1];
    if (stickies) hierarchy.revalue(root);
    scale([root], root.dx * root.dy / root.value);
    (stickies ? stickify : squarify)(root);
    if (sticky) stickies = nodes;
    return nodes;
  }

  treemap.size = function(x) {
    if (!arguments.length) return size;
    size = x;
    return treemap;
  };

  treemap.padding = function(x) {
    if (!arguments.length) return padding;

    function padFunction(node) {
      var p = x.call(treemap, node, node.depth);
      return p == null
          ? d3_layout_treemapPadNull(node)
          : d3_layout_treemapPad(node, typeof p === "number" ? [p, p, p, p] : p);
    }

    function padConstant(node) {
      return d3_layout_treemapPad(node, x);
    }

    var type;
    pad = (padding = x) == null ? d3_layout_treemapPadNull
        : (type = typeof x) === "function" ? padFunction
        : type === "number" ? (x = [x, x, x, x], padConstant)
        : padConstant;
    return treemap;
  };

  treemap.round = function(x) {
    if (!arguments.length) return round != Number;
    round = x ? Math.round : Number;
    return treemap;
  };

  treemap.sticky = function(x) {
    if (!arguments.length) return sticky;
    sticky = x;
    stickies = null;
    return treemap;
  };

  treemap.ratio = function(x) {
    if (!arguments.length) return ratio;
    ratio = x;
    return treemap;
  };

  return d3_layout_hierarchyRebind(treemap, hierarchy);
};

function d3_layout_treemapPadNull(node) {
  return {x: node.x, y: node.y, dx: node.dx, dy: node.dy};
}

function d3_layout_treemapPad(node, padding) {
  var x = node.x + padding[3],
      y = node.y + padding[0],
      dx = node.dx - padding[1] - padding[3],
      dy = node.dy - padding[0] - padding[2];
  if (dx < 0) { x += dx / 2; dx = 0; }
  if (dy < 0) { y += dy / 2; dy = 0; }
  return {x: x, y: y, dx: dx, dy: dy};
}
d3.csv = function(url, callback) {
  d3.text(url, "text/csv", function(text) {
    callback(text && d3.csv.parse(text));
  });
};
d3.csv.parse = function(text) {
  var header;
  return d3.csv.parseRows(text, function(row, i) {
    if (i) {
      var o = {}, j = -1, m = header.length;
      while (++j < m) o[header[j]] = row[j];
      return o;
    } else {
      header = row;
      return null;
    }
  });
};

d3.csv.parseRows = function(text, f) {
  var EOL = {}, // sentinel value for end-of-line
      EOF = {}, // sentinel value for end-of-file
      rows = [], // output rows
      re = /\r\n|[,\r\n]/g, // field separator regex
      n = 0, // the current line number
      t, // the current token
      eol; // is the current token followed by EOL?

  re.lastIndex = 0; // work-around bug in FF 3.6

  /** @private Returns the next token. */
  function token() {
    if (re.lastIndex >= text.length) return EOF; // special case: end of file
    if (eol) { eol = false; return EOL; } // special case: end of line

    // special case: quotes
    var j = re.lastIndex;
    if (text.charCodeAt(j) === 34) {
      var i = j;
      while (i++ < text.length) {
        if (text.charCodeAt(i) === 34) {
          if (text.charCodeAt(i + 1) !== 34) break;
          i++;
        }
      }
      re.lastIndex = i + 2;
      var c = text.charCodeAt(i + 1);
      if (c === 13) {
        eol = true;
        if (text.charCodeAt(i + 2) === 10) re.lastIndex++;
      } else if (c === 10) {
        eol = true;
      }
      return text.substring(j + 1, i).replace(/""/g, "\"");
    }

    // common case
    var m = re.exec(text);
    if (m) {
      eol = m[0].charCodeAt(0) !== 44;
      return text.substring(j, m.index);
    }
    re.lastIndex = text.length;
    return text.substring(j);
  }

  while ((t = token()) !== EOF) {
    var a = [];
    while ((t !== EOL) && (t !== EOF)) {
      a.push(t);
      t = token();
    }
    if (f && !(a = f(a, n++))) continue;
    rows.push(a);
  }

  return rows;
};
d3.csv.format = function(rows) {
  return rows.map(d3_csv_formatRow).join("\n");
};

function d3_csv_formatRow(row) {
  return row.map(d3_csv_formatValue).join(",");
}

function d3_csv_formatValue(text) {
  return /[",\n]/.test(text)
      ? "\"" + text.replace(/\"/g, "\"\"") + "\""
      : text;
}
d3.geo = {};

var d3_geo_radians = Math.PI / 180;
// TODO clip input coordinates on opposite hemisphere
d3.geo.azimuthal = function() {
  var mode = "orthographic", // or stereographic, gnomonic, equidistant or equalarea
      origin,
      scale = 200,
      translate = [480, 250],
      x0,
      y0,
      cy0,
      sy0;

  function azimuthal(coordinates) {
    var x1 = coordinates[0] * d3_geo_radians - x0,
        y1 = coordinates[1] * d3_geo_radians,
        cx1 = Math.cos(x1),
        sx1 = Math.sin(x1),
        cy1 = Math.cos(y1),
        sy1 = Math.sin(y1),
        cc = mode !== "orthographic" ? sy0 * sy1 + cy0 * cy1 * cx1 : null,
        c,
        k = mode === "stereographic" ? 1 / (1 + cc)
          : mode === "gnomonic" ? 1 / cc
          : mode === "equidistant" ? (c = Math.acos(cc), c ? c / Math.sin(c) : 0)
          : mode === "equalarea" ? Math.sqrt(2 / (1 + cc))
          : 1,
        x = k * cy1 * sx1,
        y = k * (sy0 * cy1 * cx1 - cy0 * sy1);
    return [
      scale * x + translate[0],
      scale * y + translate[1]
    ];
  }

  azimuthal.invert = function(coordinates) {
    var x = (coordinates[0] - translate[0]) / scale,
        y = (coordinates[1] - translate[1]) / scale,
        p = Math.sqrt(x * x + y * y),
        c = mode === "stereographic" ? 2 * Math.atan(p)
          : mode === "gnomonic" ? Math.atan(p)
          : mode === "equidistant" ? p
          : mode === "equalarea" ? 2 * Math.asin(.5 * p)
          : Math.asin(p),
        sc = Math.sin(c),
        cc = Math.cos(c);
    return [
      (x0 + Math.atan2(x * sc, p * cy0 * cc + y * sy0 * sc)) / d3_geo_radians,
      Math.asin(cc * sy0 - (p ? (y * sc * cy0) / p : 0)) / d3_geo_radians
    ];
  };

  azimuthal.mode = function(x) {
    if (!arguments.length) return mode;
    mode = x + "";
    return azimuthal;
  };

  azimuthal.origin = function(x) {
    if (!arguments.length) return origin;
    origin = x;
    x0 = origin[0] * d3_geo_radians;
    y0 = origin[1] * d3_geo_radians;
    cy0 = Math.cos(y0);
    sy0 = Math.sin(y0);
    return azimuthal;
  };

  azimuthal.scale = function(x) {
    if (!arguments.length) return scale;
    scale = +x;
    return azimuthal;
  };

  azimuthal.translate = function(x) {
    if (!arguments.length) return translate;
    translate = [+x[0], +x[1]];
    return azimuthal;
  };

  return azimuthal.origin([0, 0]);
};
// Derived from Tom Carden's Albers implementation for Protovis.
// http://gist.github.com/476238
// http://mathworld.wolfram.com/AlbersEqual-AreaConicProjection.html

d3.geo.albers = function() {
  var origin = [-98, 38],
      parallels = [29.5, 45.5],
      scale = 1000,
      translate = [480, 250],
      lng0, // d3_geo_radians * origin[0]
      n,
      C,
      p0;

  function albers(coordinates) {
    var t = n * (d3_geo_radians * coordinates[0] - lng0),
        p = Math.sqrt(C - 2 * n * Math.sin(d3_geo_radians * coordinates[1])) / n;
    return [
      scale * p * Math.sin(t) + translate[0],
      scale * (p * Math.cos(t) - p0) + translate[1]
    ];
  }

  albers.invert = function(coordinates) {
    var x = (coordinates[0] - translate[0]) / scale,
        y = (coordinates[1] - translate[1]) / scale,
        p0y = p0 + y,
        t = Math.atan2(x, p0y),
        p = Math.sqrt(x * x + p0y * p0y);
    return [
      (lng0 + t / n) / d3_geo_radians,
      Math.asin((C - p * p * n * n) / (2 * n)) / d3_geo_radians
    ];
  };

  function reload() {
    var phi1 = d3_geo_radians * parallels[0],
        phi2 = d3_geo_radians * parallels[1],
        lat0 = d3_geo_radians * origin[1],
        s = Math.sin(phi1),
        c = Math.cos(phi1);
    lng0 = d3_geo_radians * origin[0];
    n = .5 * (s + Math.sin(phi2));
    C = c * c + 2 * n * s;
    p0 = Math.sqrt(C - 2 * n * Math.sin(lat0)) / n;
    return albers;
  }

  albers.origin = function(x) {
    if (!arguments.length) return origin;
    origin = [+x[0], +x[1]];
    return reload();
  };

  albers.parallels = function(x) {
    if (!arguments.length) return parallels;
    parallels = [+x[0], +x[1]];
    return reload();
  };

  albers.scale = function(x) {
    if (!arguments.length) return scale;
    scale = +x;
    return albers;
  };

  albers.translate = function(x) {
    if (!arguments.length) return translate;
    translate = [+x[0], +x[1]];
    return albers;
  };

  return reload();
};

// A composite projection for the United States, 960x500. The set of standard
// parallels for each region comes from USGS, which is published here:
// http://egsc.usgs.gov/isb/pubs/MapProjections/projections.html#albers
// TODO allow the composite projection to be rescaled?
d3.geo.albersUsa = function() {
  var lower48 = d3.geo.albers();

  var alaska = d3.geo.albers()
      .origin([-160, 60])
      .parallels([55, 65]);

  var hawaii = d3.geo.albers()
      .origin([-160, 20])
      .parallels([8, 18]);

  var puertoRico = d3.geo.albers()
      .origin([-60, 10])
      .parallels([8, 18]);

  function albersUsa(coordinates) {
    var lon = coordinates[0],
        lat = coordinates[1];
    return (lat > 50 ? alaska
        : lon < -140 ? hawaii
        : lat < 21 ? puertoRico
        : lower48)(coordinates);
  }

  albersUsa.scale = function(x) {
    if (!arguments.length) return lower48.scale();
    lower48.scale(x);
    alaska.scale(x * .6);
    hawaii.scale(x);
    puertoRico.scale(x * 1.5);
    return albersUsa.translate(lower48.translate());
  };

  albersUsa.translate = function(x) {
    if (!arguments.length) return lower48.translate();
    var dz = lower48.scale() / 1000,
        dx = x[0],
        dy = x[1];
    lower48.translate(x);
    alaska.translate([dx - 400 * dz, dy + 170 * dz]);
    hawaii.translate([dx - 190 * dz, dy + 200 * dz]);
    puertoRico.translate([dx + 580 * dz, dy + 430 * dz]);
    return albersUsa;
  };

  return albersUsa.scale(lower48.scale());
};
d3.geo.bonne = function() {
  var scale = 200,
      translate = [480, 250],
      x0, // origin longitude in radians
      y0, // origin latitude in radians
      y1, // parallel latitude in radians
      c1; // cot(y1)

  function bonne(coordinates) {
    var x = coordinates[0] * d3_geo_radians - x0,
        y = coordinates[1] * d3_geo_radians - y0;
    if (y1) {
      var p = c1 + y1 - y, E = x * Math.cos(y) / p;
      x = p * Math.sin(E);
      y = p * Math.cos(E) - c1;
    } else {
      x *= Math.cos(y);
      y *= -1;
    }
    return [
      scale * x + translate[0],
      scale * y + translate[1]
    ];
  }

  bonne.invert = function(coordinates) {
    var x = (coordinates[0] - translate[0]) / scale,
        y = (coordinates[1] - translate[1]) / scale;
    if (y1) {
      var c = c1 + y, p = Math.sqrt(x * x + c * c);
      y = c1 + y1 - p;
      x = x0 + p * Math.atan2(x, c) / Math.cos(y);
    } else {
      y *= -1;
      x /= Math.cos(y);
    }
    return [
      x / d3_geo_radians,
      y / d3_geo_radians
    ];
  };

  // 90° for Werner, 0° for Sinusoidal
  bonne.parallel = function(x) {
    if (!arguments.length) return y1 / d3_geo_radians;
    c1 = 1 / Math.tan(y1 = x * d3_geo_radians);
    return bonne;
  };

  bonne.origin = function(x) {
    if (!arguments.length) return [x0 / d3_geo_radians, y0 / d3_geo_radians];
    x0 = x[0] * d3_geo_radians;
    y0 = x[1] * d3_geo_radians;
    return bonne;
  };

  bonne.scale = function(x) {
    if (!arguments.length) return scale;
    scale = +x;
    return bonne;
  };

  bonne.translate = function(x) {
    if (!arguments.length) return translate;
    translate = [+x[0], +x[1]];
    return bonne;
  };

  return bonne.origin([0, 0]).parallel(45);
};
d3.geo.equirectangular = function() {
  var scale = 500,
      translate = [480, 250];

  function equirectangular(coordinates) {
    var x = coordinates[0] / 360,
        y = -coordinates[1] / 360;
    return [
      scale * x + translate[0],
      scale * y + translate[1]
    ];
  }

  equirectangular.invert = function(coordinates) {
    var x = (coordinates[0] - translate[0]) / scale,
        y = (coordinates[1] - translate[1]) / scale;
    return [
      360 * x,
      -360 * y
    ];
  };

  equirectangular.scale = function(x) {
    if (!arguments.length) return scale;
    scale = +x;
    return equirectangular;
  };

  equirectangular.translate = function(x) {
    if (!arguments.length) return translate;
    translate = [+x[0], +x[1]];
    return equirectangular;
  };

  return equirectangular;
};
d3.geo.mercator = function() {
  var scale = 500,
      translate = [480, 250];

  function mercator(coordinates) {
    var x = coordinates[0] / 360,
        y = -(Math.log(Math.tan(Math.PI / 4 + coordinates[1] * d3_geo_radians / 2)) / d3_geo_radians) / 360;
    return [
      scale * x + translate[0],
      scale * Math.max(-.5, Math.min(.5, y)) + translate[1]
    ];
  }

  mercator.invert = function(coordinates) {
    var x = (coordinates[0] - translate[0]) / scale,
        y = (coordinates[1] - translate[1]) / scale;
    return [
      360 * x,
      2 * Math.atan(Math.exp(-360 * y * d3_geo_radians)) / d3_geo_radians - 90
    ];
  };

  mercator.scale = function(x) {
    if (!arguments.length) return scale;
    scale = +x;
    return mercator;
  };

  mercator.translate = function(x) {
    if (!arguments.length) return translate;
    translate = [+x[0], +x[1]];
    return mercator;
  };

  return mercator;
};
function d3_geo_type(types, defaultValue) {
  return function(object) {
    return object && types.hasOwnProperty(object.type) ? types[object.type](object) : defaultValue;
  };
}
/**
 * Returns a function that, given a GeoJSON object (e.g., a feature), returns
 * the corresponding SVG path. The function can be customized by overriding the
 * projection. Point features are mapped to circles with a default radius of
 * 4.5px; the radius can be specified either as a constant or a function that
 * is evaluated per object.
 */
d3.geo.path = function() {
  var pointRadius = 4.5,
      pointCircle = d3_path_circle(pointRadius),
      projection = d3.geo.albersUsa();

  function path(d, i) {
    if (typeof pointRadius === "function") {
      pointCircle = d3_path_circle(pointRadius.apply(this, arguments));
    }
    return pathType(d) || null;
  }

  function project(coordinates) {
    return projection(coordinates).join(",");
  }

  var pathType = d3_geo_type({

    FeatureCollection: function(o) {
      var path = [],
          features = o.features,
          i = -1, // features.index
          n = features.length;
      while (++i < n) path.push(pathType(features[i].geometry));
      return path.join("");
    },

    Feature: function(o) {
      return pathType(o.geometry);
    },

    Point: function(o) {
      return "M" + project(o.coordinates) + pointCircle;
    },

    MultiPoint: function(o) {
      var path = [],
          coordinates = o.coordinates,
          i = -1, // coordinates.index
          n = coordinates.length;
      while (++i < n) path.push("M", project(coordinates[i]), pointCircle);
      return path.join("");
    },

    LineString: function(o) {
      var path = ["M"],
          coordinates = o.coordinates,
          i = -1, // coordinates.index
          n = coordinates.length;
      while (++i < n) path.push(project(coordinates[i]), "L");
      path.pop();
      return path.join("");
    },

    MultiLineString: function(o) {
      var path = [],
          coordinates = o.coordinates,
          i = -1, // coordinates.index
          n = coordinates.length,
          subcoordinates, // coordinates[i]
          j, // subcoordinates.index
          m; // subcoordinates.length
      while (++i < n) {
        subcoordinates = coordinates[i];
        j = -1;
        m = subcoordinates.length;
        path.push("M");
        while (++j < m) path.push(project(subcoordinates[j]), "L");
        path.pop();
      }
      return path.join("");
    },

    Polygon: function(o) {
      var path = [],
          coordinates = o.coordinates,
          i = -1, // coordinates.index
          n = coordinates.length,
          subcoordinates, // coordinates[i]
          j, // subcoordinates.index
          m; // subcoordinates.length
      while (++i < n) {
        subcoordinates = coordinates[i];
        j = -1;
        if ((m = subcoordinates.length - 1) > 0) {
          path.push("M");
          while (++j < m) path.push(project(subcoordinates[j]), "L");
          path[path.length - 1] = "Z";
        }
      }
      return path.join("");
    },

    MultiPolygon: function(o) {
      var path = [],
          coordinates = o.coordinates,
          i = -1, // coordinates index
          n = coordinates.length,
          subcoordinates, // coordinates[i]
          j, // subcoordinates index
          m, // subcoordinates.length
          subsubcoordinates, // subcoordinates[j]
          k, // subsubcoordinates index
          p; // subsubcoordinates.length
      while (++i < n) {
        subcoordinates = coordinates[i];
        j = -1;
        m = subcoordinates.length;
        while (++j < m) {
          subsubcoordinates = subcoordinates[j];
          k = -1;
          if ((p = subsubcoordinates.length - 1) > 0) {
            path.push("M");
            while (++k < p) path.push(project(subsubcoordinates[k]), "L");
            path[path.length - 1] = "Z";
          }
        }
      }
      return path.join("");
    },

    GeometryCollection: function(o) {
      var path = [],
          geometries = o.geometries,
          i = -1, // geometries index
          n = geometries.length;
      while (++i < n) path.push(pathType(geometries[i]));
      return path.join("");
    }

  });

  var areaType = path.area = d3_geo_type({

    FeatureCollection: function(o) {
      var area = 0,
          features = o.features,
          i = -1, // features.index
          n = features.length;
      while (++i < n) area += areaType(features[i]);
      return area;
    },

    Feature: function(o) {
      return areaType(o.geometry);
    },

    Polygon: function(o) {
      return polygonArea(o.coordinates);
    },

    MultiPolygon: function(o) {
      var sum = 0,
          coordinates = o.coordinates,
          i = -1, // coordinates index
          n = coordinates.length;
      while (++i < n) sum += polygonArea(coordinates[i]);
      return sum;
    },

    GeometryCollection: function(o) {
      var sum = 0,
          geometries = o.geometries,
          i = -1, // geometries index
          n = geometries.length;
      while (++i < n) sum += areaType(geometries[i]);
      return sum;
    }

  }, 0);

  function polygonArea(coordinates) {
    var sum = area(coordinates[0]), // exterior ring
        i = 0, // coordinates.index
        n = coordinates.length;
    while (++i < n) sum -= area(coordinates[i]); // holes
    return sum;
  }

  function polygonCentroid(coordinates) {
    var polygon = d3.geom.polygon(coordinates[0].map(projection)), // exterior ring
        area = polygon.area(),
        centroid = polygon.centroid(area < 0 ? (area *= -1, 1) : -1),
        x = centroid[0],
        y = centroid[1],
        z = area,
        i = 0, // coordinates index
        n = coordinates.length;
    while (++i < n) {
      polygon = d3.geom.polygon(coordinates[i].map(projection)); // holes
      area = polygon.area();
      centroid = polygon.centroid(area < 0 ? (area *= -1, 1) : -1);
      x -= centroid[0];
      y -= centroid[1];
      z -= area;
    }
    return [x, y, 6 * z]; // weighted centroid
  }

  var centroidType = path.centroid = d3_geo_type({

    // TODO FeatureCollection
    // TODO Point
    // TODO MultiPoint
    // TODO LineString
    // TODO MultiLineString
    // TODO GeometryCollection

    Feature: function(o) {
      return centroidType(o.geometry);
    },

    Polygon: function(o) {
      var centroid = polygonCentroid(o.coordinates);
      return [centroid[0] / centroid[2], centroid[1] / centroid[2]];
    },

    MultiPolygon: function(o) {
      var area = 0,
          coordinates = o.coordinates,
          centroid,
          x = 0,
          y = 0,
          z = 0,
          i = -1, // coordinates index
          n = coordinates.length;
      while (++i < n) {
        centroid = polygonCentroid(coordinates[i]);
        x += centroid[0];
        y += centroid[1];
        z += centroid[2];
      }
      return [x / z, y / z];
    }

  });

  function area(coordinates) {
    return Math.abs(d3.geom.polygon(coordinates.map(projection)).area());
  }

  path.projection = function(x) {
    projection = x;
    return path;
  };

  path.pointRadius = function(x) {
    if (typeof x === "function") pointRadius = x;
    else {
      pointRadius = +x;
      pointCircle = d3_path_circle(pointRadius);
    }
    return path;
  };

  return path;
};

function d3_path_circle(radius) {
  return "m0," + radius
      + "a" + radius + "," + radius + " 0 1,1 0," + (-2 * radius)
      + "a" + radius + "," + radius + " 0 1,1 0," + (+2 * radius)
      + "z";
}
/**
 * Given a GeoJSON object, returns the corresponding bounding box. The bounding
 * box is represented by a two-dimensional array: [[left, bottom], [right,
 * top]], where left is the minimum longitude, bottom is the minimum latitude,
 * right is maximum longitude, and top is the maximum latitude.
 */
d3.geo.bounds = function(feature) {
  var left = Infinity,
      bottom = Infinity,
      right = -Infinity,
      top = -Infinity;
  d3_geo_bounds(feature, function(x, y) {
    if (x < left) left = x;
    if (x > right) right = x;
    if (y < bottom) bottom = y;
    if (y > top) top = y;
  });
  return [[left, bottom], [right, top]];
};

function d3_geo_bounds(o, f) {
  if (d3_geo_boundsTypes.hasOwnProperty(o.type)) d3_geo_boundsTypes[o.type](o, f);
}

var d3_geo_boundsTypes = {
  Feature: d3_geo_boundsFeature,
  FeatureCollection: d3_geo_boundsFeatureCollection,
  GeometryCollection: d3_geo_boundsGeometryCollection,
  LineString: d3_geo_boundsLineString,
  MultiLineString: d3_geo_boundsMultiLineString,
  MultiPoint: d3_geo_boundsLineString,
  MultiPolygon: d3_geo_boundsMultiPolygon,
  Point: d3_geo_boundsPoint,
  Polygon: d3_geo_boundsPolygon
};

function d3_geo_boundsFeature(o, f) {
  d3_geo_bounds(o.geometry, f);
}

function d3_geo_boundsFeatureCollection(o, f) {
  for (var a = o.features, i = 0, n = a.length; i < n; i++) {
    d3_geo_bounds(a[i].geometry, f);
  }
}

function d3_geo_boundsGeometryCollection(o, f) {
  for (var a = o.geometries, i = 0, n = a.length; i < n; i++) {
    d3_geo_bounds(a[i], f);
  }
}

function d3_geo_boundsLineString(o, f) {
  for (var a = o.coordinates, i = 0, n = a.length; i < n; i++) {
    f.apply(null, a[i]);
  }
}

function d3_geo_boundsMultiLineString(o, f) {
  for (var a = o.coordinates, i = 0, n = a.length; i < n; i++) {
    for (var b = a[i], j = 0, m = b.length; j < m; j++) {
      f.apply(null, b[j]);
    }
  }
}

function d3_geo_boundsMultiPolygon(o, f) {
  for (var a = o.coordinates, i = 0, n = a.length; i < n; i++) {
    for (var b = a[i][0], j = 0, m = b.length; j < m; j++) {
      f.apply(null, b[j]);
    }
  }
}

function d3_geo_boundsPoint(o, f) {
  f.apply(null, o.coordinates);
}

function d3_geo_boundsPolygon(o, f) {
  for (var a = o.coordinates[0], i = 0, n = a.length; i < n; i++) {
    f.apply(null, a[i]);
  }
}
// TODO breakAtDateLine?

d3.geo.circle = function() {
  var origin = [0, 0],
      degrees = 90 - 1e-2,
      radians = degrees * d3_geo_radians,
      arc = d3.geo.greatArc().target(Object);

  function circle() {
    // TODO render a circle as a Polygon
  }

  function visible(point) {
    return arc.distance(point) < radians;
  }

  circle.clip = function(d) {
    arc.source(typeof origin === "function" ? origin.apply(this, arguments) : origin);
    return clipType(d);
  };

  var clipType = d3_geo_type({

    FeatureCollection: function(o) {
      var features = o.features.map(clipType).filter(Object);
      return features && (o = Object.create(o), o.features = features, o);
    },

    Feature: function(o) {
      var geometry = clipType(o.geometry);
      return geometry && (o = Object.create(o), o.geometry = geometry, o);
    },

    Point: function(o) {
      return visible(o.coordinates) && o;
    },

    MultiPoint: function(o) {
      var coordinates = o.coordinates.filter(visible);
      return coordinates.length && {
        type: o.type,
        coordinates: coordinates
      };
    },

    LineString: function(o) {
      var coordinates = clip(o.coordinates);
      return coordinates.length && (o = Object.create(o), o.coordinates = coordinates, o);
    },

    MultiLineString: function(o) {
      var coordinates = o.coordinates.map(clip).filter(function(d) { return d.length; });
      return coordinates.length && (o = Object.create(o), o.coordinates = coordinates, o);
    },

    Polygon: function(o) {
      var coordinates = o.coordinates.map(clip);
      return coordinates[0].length && (o = Object.create(o), o.coordinates = coordinates, o);
    },

    MultiPolygon: function(o) {
      var coordinates = o.coordinates.map(function(d) { return d.map(clip); }).filter(function(d) { return d[0].length; });
      return coordinates.length && (o = Object.create(o), o.coordinates = coordinates, o);
    },

    GeometryCollection: function(o) {
      var geometries = o.geometries.map(clipType).filter(Object);
      return geometries.length && (o = Object.create(o), o.geometries = geometries, o);
    }

  });

  function clip(coordinates) {
    var i = -1,
        n = coordinates.length,
        clipped = [],
        p0,
        p1,
        p2,
        d0,
        d1;

    while (++i < n) {
      d1 = arc.distance(p2 = coordinates[i]);
      if (d1 < radians) {
        if (p1) clipped.push(d3_geo_greatArcInterpolate(p1, p2)((d0 - radians) / (d0 - d1)));
        clipped.push(p2);
        p0 = p1 = null;
      } else {
        p1 = p2;
        if (!p0 && clipped.length) {
          clipped.push(d3_geo_greatArcInterpolate(clipped[clipped.length - 1], p1)((radians - d0) / (d1 - d0)));
          p0 = p1;
        }
      }
      d0 = d1;
    }

    if (p1 && clipped.length) {
      d1 = arc.distance(p2 = clipped[0]);
      clipped.push(d3_geo_greatArcInterpolate(p1, p2)((d0 - radians) / (d0 - d1)));
    }

    return resample(clipped);
  }

  // Resample coordinates, creating great arcs between each.
  function resample(coordinates) {
    var i = 0,
        n = coordinates.length,
        j,
        m,
        resampled = n ? [coordinates[0]] : coordinates,
        resamples,
        origin = arc.source();

    while (++i < n) {
      resamples = arc.source(coordinates[i - 1])(coordinates[i]).coordinates;
      for (j = 0, m = resamples.length; ++j < m;) resampled.push(resamples[j]);
    }

    arc.source(origin);
    return resampled;
  }

  circle.origin = function(x) {
    if (!arguments.length) return origin;
    origin = x;
    return circle;
  };

  circle.angle = function(x) {
    if (!arguments.length) return degrees;
    radians = (degrees = +x) * d3_geo_radians;
    return circle;
  };

  // Precision is specified in degrees.
  circle.precision = function(x) {
    if (!arguments.length) return arc.precision();
    arc.precision(x);
    return circle;
  };

  return circle;
}
d3.geo.greatArc = function() {
  var source = d3_geo_greatArcSource,
      target = d3_geo_greatArcTarget,
      precision = 6 * d3_geo_radians;

  function greatArc() {
    var a = typeof source === "function" ? source.apply(this, arguments) : source,
        b = typeof target === "function" ? target.apply(this, arguments) : target,
        i = d3_geo_greatArcInterpolate(a, b),
        dt = precision / i.d,
        t = 0,
        coordinates = [a];
    while ((t += dt) < 1) coordinates.push(i(t));
    coordinates.push(b);
    return {
      type: "LineString",
      coordinates: coordinates
    };
  }

  // Length returned in radians; multiply by radius for distance.
  greatArc.distance = function() {
    var a = typeof source === "function" ? source.apply(this, arguments) : source,
        b = typeof target === "function" ? target.apply(this, arguments) : target;
     return d3_geo_greatArcInterpolate(a, b).d;
  };

  greatArc.source = function(x) {
    if (!arguments.length) return source;
    source = x;
    return greatArc;
  };

  greatArc.target = function(x) {
    if (!arguments.length) return target;
    target = x;
    return greatArc;
  };

  // Precision is specified in degrees.
  greatArc.precision = function(x) {
    if (!arguments.length) return precision / d3_geo_radians;
    precision = x * d3_geo_radians;
    return greatArc;
  };

  return greatArc;
};

function d3_geo_greatArcSource(d) {
  return d.source;
}

function d3_geo_greatArcTarget(d) {
  return d.target;
}

function d3_geo_greatArcInterpolate(a, b) {
  var x0 = a[0] * d3_geo_radians, cx0 = Math.cos(x0), sx0 = Math.sin(x0),
      y0 = a[1] * d3_geo_radians, cy0 = Math.cos(y0), sy0 = Math.sin(y0),
      x1 = b[0] * d3_geo_radians, cx1 = Math.cos(x1), sx1 = Math.sin(x1),
      y1 = b[1] * d3_geo_radians, cy1 = Math.cos(y1), sy1 = Math.sin(y1),
      d = interpolate.d = Math.acos(Math.max(-1, Math.min(1, sy0 * sy1 + cy0 * cy1 * Math.cos(x1 - x0)))),
      sd = Math.sin(d);

  // From http://williams.best.vwh.net/avform.htm#Intermediate
  function interpolate(t) {
    var A = Math.sin(d - (t *= d)) / sd,
        B = Math.sin(t) / sd,
        x = A * cy0 * cx0 + B * cy1 * cx1,
        y = A * cy0 * sx0 + B * cy1 * sx1,
        z = A * sy0       + B * sy1;
    return [
      Math.atan2(y, x) / d3_geo_radians,
      Math.atan2(z, Math.sqrt(x * x + y * y)) / d3_geo_radians
    ];
  }

  return interpolate;
}
d3.geo.greatCircle = d3.geo.circle;
d3.geom = {};
/**
 * Computes a contour for a given input grid function using the <a
 * href="http://en.wikipedia.org/wiki/Marching_squares">marching
 * squares</a> algorithm. Returns the contour polygon as an array of points.
 *
 * @param grid a two-input function(x, y) that returns true for values
 * inside the contour and false for values outside the contour.
 * @param start an optional starting point [x, y] on the grid.
 * @returns polygon [[x1, y1], [x2, y2], …]
 */
d3.geom.contour = function(grid, start) {
  var s = start || d3_geom_contourStart(grid), // starting point
      c = [],    // contour polygon
      x = s[0],  // current x position
      y = s[1],  // current y position
      dx = 0,    // next x direction
      dy = 0,    // next y direction
      pdx = NaN, // previous x direction
      pdy = NaN, // previous y direction
      i = 0;

  do {
    // determine marching squares index
    i = 0;
    if (grid(x-1, y-1)) i += 1;
    if (grid(x,   y-1)) i += 2;
    if (grid(x-1, y  )) i += 4;
    if (grid(x,   y  )) i += 8;

    // determine next direction
    if (i === 6) {
      dx = pdy === -1 ? -1 : 1;
      dy = 0;
    } else if (i === 9) {
      dx = 0;
      dy = pdx === 1 ? -1 : 1;
    } else {
      dx = d3_geom_contourDx[i];
      dy = d3_geom_contourDy[i];
    }

    // update contour polygon
    if (dx != pdx && dy != pdy) {
      c.push([x, y]);
      pdx = dx;
      pdy = dy;
    }

    x += dx;
    y += dy;
  } while (s[0] != x || s[1] != y);

  return c;
};

// lookup tables for marching directions
var d3_geom_contourDx = [1, 0, 1, 1,-1, 0,-1, 1,0, 0,0,0,-1, 0,-1,NaN],
    d3_geom_contourDy = [0,-1, 0, 0, 0,-1, 0, 0,1,-1,1,1, 0,-1, 0,NaN];

function d3_geom_contourStart(grid) {
  var x = 0,
      y = 0;

  // search for a starting point; begin at origin
  // and proceed along outward-expanding diagonals
  while (true) {
    if (grid(x,y)) {
      return [x,y];
    }
    if (x === 0) {
      x = y + 1;
      y = 0;
    } else {
      x = x - 1;
      y = y + 1;
    }
  }
}
/**
 * Computes the 2D convex hull of a set of points using Graham's scanning
 * algorithm. The algorithm has been implemented as described in Cormen,
 * Leiserson, and Rivest's Introduction to Algorithms. The running time of
 * this algorithm is O(n log n), where n is the number of input points.
 *
 * @param vertices [[x1, y1], [x2, y2], …]
 * @returns polygon [[x1, y1], [x2, y2], …]
 */
d3.geom.hull = function(vertices) {
  if (vertices.length < 3) return [];

  var len = vertices.length,
      plen = len - 1,
      points = [],
      stack = [],
      i, j, h = 0, x1, y1, x2, y2, u, v, a, sp;

  // find the starting ref point: leftmost point with the minimum y coord
  for (i=1; i<len; ++i) {
    if (vertices[i][1] < vertices[h][1]) {
      h = i;
    } else if (vertices[i][1] == vertices[h][1]) {
      h = (vertices[i][0] < vertices[h][0] ? i : h);
    }
  }

  // calculate polar angles from ref point and sort
  for (i=0; i<len; ++i) {
    if (i === h) continue;
    y1 = vertices[i][1] - vertices[h][1];
    x1 = vertices[i][0] - vertices[h][0];
    points.push({angle: Math.atan2(y1, x1), index: i});
  }
  points.sort(function(a, b) { return a.angle - b.angle; });

  // toss out duplicate angles
  a = points[0].angle;
  v = points[0].index;
  u = 0;
  for (i=1; i<plen; ++i) {
    j = points[i].index;
    if (a == points[i].angle) {
      // keep angle for point most distant from the reference
      x1 = vertices[v][0] - vertices[h][0];
      y1 = vertices[v][1] - vertices[h][1];
      x2 = vertices[j][0] - vertices[h][0];
      y2 = vertices[j][1] - vertices[h][1];
      if ((x1*x1 + y1*y1) >= (x2*x2 + y2*y2)) {
        points[i].index = -1;
      } else {
        points[u].index = -1;
        a = points[i].angle;
        u = i;
        v = j;
      }
    } else {
      a = points[i].angle;
      u = i;
      v = j;
    }
  }

  // initialize the stack
  stack.push(h);
  for (i=0, j=0; i<2; ++j) {
    if (points[j].index !== -1) {
      stack.push(points[j].index);
      i++;
    }
  }
  sp = stack.length;

  // do graham's scan
  for (; j<plen; ++j) {
    if (points[j].index === -1) continue; // skip tossed out points
    while (!d3_geom_hullCCW(stack[sp-2], stack[sp-1], points[j].index, vertices)) {
      --sp;
    }
    stack[sp++] = points[j].index;
  }

  // construct the hull
  var poly = [];
  for (i=0; i<sp; ++i) {
    poly.push(vertices[stack[i]]);
  }
  return poly;
}

// are three points in counter-clockwise order?
function d3_geom_hullCCW(i1, i2, i3, v) {
  var t, a, b, c, d, e, f;
  t = v[i1]; a = t[0]; b = t[1];
  t = v[i2]; c = t[0]; d = t[1];
  t = v[i3]; e = t[0]; f = t[1];
  return ((f-b)*(c-a) - (d-b)*(e-a)) > 0;
}
// Note: requires coordinates to be counterclockwise and convex!
d3.geom.polygon = function(coordinates) {

  coordinates.area = function() {
    var i = 0,
        n = coordinates.length,
        a = coordinates[n - 1][0] * coordinates[0][1],
        b = coordinates[n - 1][1] * coordinates[0][0];
    while (++i < n) {
      a += coordinates[i - 1][0] * coordinates[i][1];
      b += coordinates[i - 1][1] * coordinates[i][0];
    }
    return (b - a) * .5;
  };

  coordinates.centroid = function(k) {
    var i = -1,
        n = coordinates.length,
        x = 0,
        y = 0,
        a,
        b = coordinates[n - 1],
        c;
    if (!arguments.length) k = -1 / (6 * coordinates.area());
    while (++i < n) {
      a = b;
      b = coordinates[i];
      c = a[0] * b[1] - b[0] * a[1];
      x += (a[0] + b[0]) * c;
      y += (a[1] + b[1]) * c;
    }
    return [x * k, y * k];
  };

  // The Sutherland-Hodgman clipping algorithm.
  coordinates.clip = function(subject) {
    var input,
        i = -1,
        n = coordinates.length,
        j,
        m,
        a = coordinates[n - 1],
        b,
        c,
        d;
    while (++i < n) {
      input = subject.slice();
      subject.length = 0;
      b = coordinates[i];
      c = input[(m = input.length) - 1];
      j = -1;
      while (++j < m) {
        d = input[j];
        if (d3_geom_polygonInside(d, a, b)) {
          if (!d3_geom_polygonInside(c, a, b)) {
            subject.push(d3_geom_polygonIntersect(c, d, a, b));
          }
          subject.push(d);
        } else if (d3_geom_polygonInside(c, a, b)) {
          subject.push(d3_geom_polygonIntersect(c, d, a, b));
        }
        c = d;
      }
      a = b;
    }
    return subject;
  };

  return coordinates;
};

function d3_geom_polygonInside(p, a, b) {
  return (b[0] - a[0]) * (p[1] - a[1]) < (b[1] - a[1]) * (p[0] - a[0]);
}

// Intersect two infinite lines cd and ab.
function d3_geom_polygonIntersect(c, d, a, b) {
  var x1 = c[0], x2 = d[0], x3 = a[0], x4 = b[0],
      y1 = c[1], y2 = d[1], y3 = a[1], y4 = b[1],
      x13 = x1 - x3,
      x21 = x2 - x1,
      x43 = x4 - x3,
      y13 = y1 - y3,
      y21 = y2 - y1,
      y43 = y4 - y3,
      ua = (x43 * y13 - y43 * x13) / (y43 * x21 - x43 * y21);
  return [x1 + ua * x21, y1 + ua * y21];
}
// Adapted from Nicolas Garcia Belmonte's JIT implementation:
// http://blog.thejit.org/2010/02/12/voronoi-tessellation/
// http://blog.thejit.org/assets/voronoijs/voronoi.js
// See lib/jit/LICENSE for details.

// Notes:
//
// This implementation does not clip the returned polygons, so if you want to
// clip them to a particular shape you will need to do that either in SVG or by
// post-processing with d3.geom.polygon's clip method.
//
// If any vertices are coincident or have NaN positions, the behavior of this
// method is undefined. Most likely invalid polygons will be returned. You
// should filter invalid points, and consolidate coincident points, before
// computing the tessellation.

/**
 * @param vertices [[x1, y1], [x2, y2], …]
 * @returns polygons [[[x1, y1], [x2, y2], …], …]
 */
d3.geom.voronoi = function(vertices) {
  var polygons = vertices.map(function() { return []; });

  d3_voronoi_tessellate(vertices, function(e) {
    var s1,
        s2,
        x1,
        x2,
        y1,
        y2;
    if (e.a === 1 && e.b >= 0) {
      s1 = e.ep.r;
      s2 = e.ep.l;
    } else {
      s1 = e.ep.l;
      s2 = e.ep.r;
    }
    if (e.a === 1) {
      y1 = s1 ? s1.y : -1e6;
      x1 = e.c - e.b * y1;
      y2 = s2 ? s2.y : 1e6;
      x2 = e.c - e.b * y2;
    } else {
      x1 = s1 ? s1.x : -1e6;
      y1 = e.c - e.a * x1;
      x2 = s2 ? s2.x : 1e6;
      y2 = e.c - e.a * x2;
    }
    var v1 = [x1, y1],
        v2 = [x2, y2];
    polygons[e.region.l.index].push(v1, v2);
    polygons[e.region.r.index].push(v1, v2);
  });

  // Reconnect the polygon segments into counterclockwise loops.
  return polygons.map(function(polygon, i) {
    var cx = vertices[i][0],
        cy = vertices[i][1];
    polygon.forEach(function(v) {
      v.angle = Math.atan2(v[0] - cx, v[1] - cy);
    });
    return polygon.sort(function(a, b) {
      return a.angle - b.angle;
    }).filter(function(d, i) {
      return !i || (d.angle - polygon[i - 1].angle > 1e-10);
    });
  });
};

var d3_voronoi_opposite = {"l": "r", "r": "l"};

function d3_voronoi_tessellate(vertices, callback) {

  var Sites = {
    list: vertices
      .map(function(v, i) {
        return {
          index: i,
          x: v[0],
          y: v[1]
        };
      })
      .sort(function(a, b) {
        return a.y < b.y ? -1
          : a.y > b.y ? 1
          : a.x < b.x ? -1
          : a.x > b.x ? 1
          : 0;
      }),
    bottomSite: null
  };

  var EdgeList = {
    list: [],
    leftEnd: null,
    rightEnd: null,

    init: function() {
      EdgeList.leftEnd = EdgeList.createHalfEdge(null, "l");
      EdgeList.rightEnd = EdgeList.createHalfEdge(null, "l");
      EdgeList.leftEnd.r = EdgeList.rightEnd;
      EdgeList.rightEnd.l = EdgeList.leftEnd;
      EdgeList.list.unshift(EdgeList.leftEnd, EdgeList.rightEnd);
    },

    createHalfEdge: function(edge, side) {
      return {
        edge: edge,
        side: side,
        vertex: null,
        "l": null,
        "r": null
      };
    },

    insert: function(lb, he) {
      he.l = lb;
      he.r = lb.r;
      lb.r.l = he;
      lb.r = he;
    },

    leftBound: function(p) {
      var he = EdgeList.leftEnd;
      do {
        he = he.r;
      } while (he != EdgeList.rightEnd && Geom.rightOf(he, p));
      he = he.l;
      return he;
    },

    del: function(he) {
      he.l.r = he.r;
      he.r.l = he.l;
      he.edge = null;
    },

    right: function(he) {
      return he.r;
    },

    left: function(he) {
      return he.l;
    },

    leftRegion: function(he) {
      return he.edge == null
          ? Sites.bottomSite
          : he.edge.region[he.side];
    },

    rightRegion: function(he) {
      return he.edge == null
          ? Sites.bottomSite
          : he.edge.region[d3_voronoi_opposite[he.side]];
    }
  };

  var Geom = {

    bisect: function(s1, s2) {
      var newEdge = {
        region: {"l": s1, "r": s2},
        ep: {"l": null, "r": null}
      };

      var dx = s2.x - s1.x,
          dy = s2.y - s1.y,
          adx = dx > 0 ? dx : -dx,
          ady = dy > 0 ? dy : -dy;

      newEdge.c = s1.x * dx + s1.y * dy
          + (dx * dx + dy * dy) * .5;

      if (adx > ady) {
        newEdge.a = 1;
        newEdge.b = dy / dx;
        newEdge.c /= dx;
      } else {
        newEdge.b = 1;
        newEdge.a = dx / dy;
        newEdge.c /= dy;
      }

      return newEdge;
    },

    intersect: function(el1, el2) {
      var e1 = el1.edge,
          e2 = el2.edge;
      if (!e1 || !e2 || (e1.region.r == e2.region.r)) {
        return null;
      }
      var d = (e1.a * e2.b) - (e1.b * e2.a);
      if (Math.abs(d) < 1e-10) {
        return null;
      }
      var xint = (e1.c * e2.b - e2.c * e1.b) / d,
          yint = (e2.c * e1.a - e1.c * e2.a) / d,
          e1r = e1.region.r,
          e2r = e2.region.r,
          el,
          e;
      if ((e1r.y < e2r.y) ||
         (e1r.y == e2r.y && e1r.x < e2r.x)) {
        el = el1;
        e = e1;
      } else {
        el = el2;
        e = e2;
      }
      var rightOfSite = (xint >= e.region.r.x);
      if ((rightOfSite && (el.side === "l")) ||
        (!rightOfSite && (el.side === "r"))) {
        return null;
      }
      return {
        x: xint,
        y: yint
      };
    },

    rightOf: function(he, p) {
      var e = he.edge,
          topsite = e.region.r,
          rightOfSite = (p.x > topsite.x);

      if (rightOfSite && (he.side === "l")) {
        return 1;
      }
      if (!rightOfSite && (he.side === "r")) {
        return 0;
      }
      if (e.a === 1) {
        var dyp = p.y - topsite.y,
            dxp = p.x - topsite.x,
            fast = 0,
            above = 0;

        if ((!rightOfSite && (e.b < 0)) ||
          (rightOfSite && (e.b >= 0))) {
          above = fast = (dyp >= e.b * dxp);
        } else {
          above = ((p.x + p.y * e.b) > e.c);
          if (e.b < 0) {
            above = !above;
          }
          if (!above) {
            fast = 1;
          }
        }
        if (!fast) {
          var dxs = topsite.x - e.region.l.x;
          above = (e.b * (dxp * dxp - dyp * dyp)) <
            (dxs * dyp * (1 + 2 * dxp / dxs + e.b * e.b));

          if (e.b < 0) {
            above = !above;
          }
        }
      } else /* e.b == 1 */ {
        var yl = e.c - e.a * p.x,
            t1 = p.y - yl,
            t2 = p.x - topsite.x,
            t3 = yl - topsite.y;

        above = (t1 * t1) > (t2 * t2 + t3 * t3);
      }
      return he.side === "l" ? above : !above;
    },

    endPoint: function(edge, side, site) {
      edge.ep[side] = site;
      if (!edge.ep[d3_voronoi_opposite[side]]) return;
      callback(edge);
    },

    distance: function(s, t) {
      var dx = s.x - t.x,
          dy = s.y - t.y;
      return Math.sqrt(dx * dx + dy * dy);
    }
  };

  var EventQueue = {
    list: [],

    insert: function(he, site, offset) {
      he.vertex = site;
      he.ystar = site.y + offset;
      for (var i=0, list=EventQueue.list, l=list.length; i<l; i++) {
        var next = list[i];
        if (he.ystar > next.ystar ||
          (he.ystar == next.ystar &&
          site.x > next.vertex.x)) {
          continue;
        } else {
          break;
        }
      }
      list.splice(i, 0, he);
    },

    del: function(he) {
      for (var i=0, ls=EventQueue.list, l=ls.length; i<l && (ls[i] != he); ++i) {}
      ls.splice(i, 1);
    },

    empty: function() { return EventQueue.list.length === 0; },

    nextEvent: function(he) {
      for (var i=0, ls=EventQueue.list, l=ls.length; i<l; ++i) {
        if (ls[i] == he) return ls[i+1];
      }
      return null;
    },

    min: function() {
      var elem = EventQueue.list[0];
      return {
        x: elem.vertex.x,
        y: elem.ystar
      };
    },

    extractMin: function() {
      return EventQueue.list.shift();
    }
  };

  EdgeList.init();
  Sites.bottomSite = Sites.list.shift();

  var newSite = Sites.list.shift(), newIntStar;
  var lbnd, rbnd, llbnd, rrbnd, bisector;
  var bot, top, temp, p, v;
  var e, pm;

  while (true) {
    if (!EventQueue.empty()) {
      newIntStar = EventQueue.min();
    }
    if (newSite && (EventQueue.empty()
      || newSite.y < newIntStar.y
      || (newSite.y == newIntStar.y
      && newSite.x < newIntStar.x))) { //new site is smallest
      lbnd = EdgeList.leftBound(newSite);
      rbnd = EdgeList.right(lbnd);
      bot = EdgeList.rightRegion(lbnd);
      e = Geom.bisect(bot, newSite);
      bisector = EdgeList.createHalfEdge(e, "l");
      EdgeList.insert(lbnd, bisector);
      p = Geom.intersect(lbnd, bisector);
      if (p) {
        EventQueue.del(lbnd);
        EventQueue.insert(lbnd, p, Geom.distance(p, newSite));
      }
      lbnd = bisector;
      bisector = EdgeList.createHalfEdge(e, "r");
      EdgeList.insert(lbnd, bisector);
      p = Geom.intersect(bisector, rbnd);
      if (p) {
        EventQueue.insert(bisector, p, Geom.distance(p, newSite));
      }
      newSite = Sites.list.shift();
    } else if (!EventQueue.empty()) { //intersection is smallest
      lbnd = EventQueue.extractMin();
      llbnd = EdgeList.left(lbnd);
      rbnd = EdgeList.right(lbnd);
      rrbnd = EdgeList.right(rbnd);
      bot = EdgeList.leftRegion(lbnd);
      top = EdgeList.rightRegion(rbnd);
      v = lbnd.vertex;
      Geom.endPoint(lbnd.edge, lbnd.side, v);
      Geom.endPoint(rbnd.edge, rbnd.side, v);
      EdgeList.del(lbnd);
      EventQueue.del(rbnd);
      EdgeList.del(rbnd);
      pm = "l";
      if (bot.y > top.y) {
        temp = bot;
        bot = top;
        top = temp;
        pm = "r";
      }
      e = Geom.bisect(bot, top);
      bisector = EdgeList.createHalfEdge(e, pm);
      EdgeList.insert(llbnd, bisector);
      Geom.endPoint(e, d3_voronoi_opposite[pm], v);
      p = Geom.intersect(llbnd, bisector);
      if (p) {
        EventQueue.del(llbnd);
        EventQueue.insert(llbnd, p, Geom.distance(p, bot));
      }
      p = Geom.intersect(bisector, rrbnd);
      if (p) {
        EventQueue.insert(bisector, p, Geom.distance(p, bot));
      }
    } else {
      break;
    }
  }//end while

  for (lbnd = EdgeList.right(EdgeList.leftEnd);
      lbnd != EdgeList.rightEnd;
      lbnd = EdgeList.right(lbnd)) {
    callback(lbnd.edge);
  }
}
/**
* @param vertices [[x1, y1], [x2, y2], …]
* @returns triangles [[[x1, y1], [x2, y2], [x3, y3]], …]
 */
d3.geom.delaunay = function(vertices) {
  var edges = vertices.map(function() { return []; }),
      triangles = [];

  // Use the Voronoi tessellation to determine Delaunay edges.
  d3_voronoi_tessellate(vertices, function(e) {
    edges[e.region.l.index].push(vertices[e.region.r.index]);
  });

  // Reconnect the edges into counterclockwise triangles.
  edges.forEach(function(edge, i) {
    var v = vertices[i],
        cx = v[0],
        cy = v[1];
    edge.forEach(function(v) {
      v.angle = Math.atan2(v[0] - cx, v[1] - cy);
    });
    edge.sort(function(a, b) {
      return a.angle - b.angle;
    });
    for (var j = 0, m = edge.length - 1; j < m; j++) {
      triangles.push([v, edge[j], edge[j + 1]]);
    }
  });

  return triangles;
};
// Constructs a new quadtree for the specified array of points. A quadtree is a
// two-dimensional recursive spatial subdivision. This implementation uses
// square partitions, dividing each square into four equally-sized squares. Each
// point exists in a unique node; if multiple points are in the same position,
// some points may be stored on internal nodes rather than leaf nodes. Quadtrees
// can be used to accelerate various spatial operations, such as the Barnes-Hut
// approximation for computing n-body forces, or collision detection.
d3.geom.quadtree = function(points, x1, y1, x2, y2) {
  var p,
      i = -1,
      n = points.length;

  // Type conversion for deprecated API.
  if (n && isNaN(points[0].x)) points = points.map(d3_geom_quadtreePoint);

  // Allow bounds to be specified explicitly.
  if (arguments.length < 5) {
    if (arguments.length === 3) {
      y2 = x2 = y1;
      y1 = x1;
    } else {
      x1 = y1 = Infinity;
      x2 = y2 = -Infinity;

      // Compute bounds.
      while (++i < n) {
        p = points[i];
        if (p.x < x1) x1 = p.x;
        if (p.y < y1) y1 = p.y;
        if (p.x > x2) x2 = p.x;
        if (p.y > y2) y2 = p.y;
      }

      // Squarify the bounds.
      var dx = x2 - x1,
          dy = y2 - y1;
      if (dx > dy) y2 = y1 + dx;
      else x2 = x1 + dy;
    }
  }

  // Recursively inserts the specified point p at the node n or one of its
  // descendants. The bounds are defined by [x1, x2] and [y1, y2].
  function insert(n, p, x1, y1, x2, y2) {
    if (isNaN(p.x) || isNaN(p.y)) return; // ignore invalid points
    if (n.leaf) {
      var v = n.point;
      if (v) {
        // If the point at this leaf node is at the same position as the new
        // point we are adding, we leave the point associated with the
        // internal node while adding the new point to a child node. This
        // avoids infinite recursion.
        if ((Math.abs(v.x - p.x) + Math.abs(v.y - p.y)) < .01) {
          insertChild(n, p, x1, y1, x2, y2);
        } else {
          n.point = null;
          insertChild(n, v, x1, y1, x2, y2);
          insertChild(n, p, x1, y1, x2, y2);
        }
      } else {
        n.point = p;
      }
    } else {
      insertChild(n, p, x1, y1, x2, y2);
    }
  }

  // Recursively inserts the specified point p into a descendant of node n. The
  // bounds are defined by [x1, x2] and [y1, y2].
  function insertChild(n, p, x1, y1, x2, y2) {
    // Compute the split point, and the quadrant in which to insert p.
    var sx = (x1 + x2) * .5,
        sy = (y1 + y2) * .5,
        right = p.x >= sx,
        bottom = p.y >= sy,
        i = (bottom << 1) + right;

    // Recursively insert into the child node.
    n.leaf = false;
    n = n.nodes[i] || (n.nodes[i] = d3_geom_quadtreeNode());

    // Update the bounds as we recurse.
    if (right) x1 = sx; else x2 = sx;
    if (bottom) y1 = sy; else y2 = sy;
    insert(n, p, x1, y1, x2, y2);
  }

  // Create the root node.
  var root = d3_geom_quadtreeNode();

  root.add = function(p) {
    insert(root, p, x1, y1, x2, y2);
  };

  root.visit = function(f) {
    d3_geom_quadtreeVisit(f, root, x1, y1, x2, y2);
  };

  // Insert all points.
  points.forEach(root.add);
  return root;
};

function d3_geom_quadtreeNode() {
  return {
    leaf: true,
    nodes: [],
    point: null
  };
}

function d3_geom_quadtreeVisit(f, node, x1, y1, x2, y2) {
  if (!f(node, x1, y1, x2, y2)) {
    var sx = (x1 + x2) * .5,
        sy = (y1 + y2) * .5,
        children = node.nodes;
    if (children[0]) d3_geom_quadtreeVisit(f, children[0], x1, y1, sx, sy);
    if (children[1]) d3_geom_quadtreeVisit(f, children[1], sx, y1, x2, sy);
    if (children[2]) d3_geom_quadtreeVisit(f, children[2], x1, sy, sx, y2);
    if (children[3]) d3_geom_quadtreeVisit(f, children[3], sx, sy, x2, y2);
  }
}

function d3_geom_quadtreePoint(p) {
  return {
    x: p[0],
    y: p[1]
  };
}
d3.time = {};

var d3_time = Date;

function d3_time_utc() {
  this._ = new Date(arguments.length > 1
      ? Date.UTC.apply(this, arguments)
      : arguments[0]);
}

d3_time_utc.prototype = {
  getDate: function() { return this._.getUTCDate(); },
  getDay: function() { return this._.getUTCDay(); },
  getFullYear: function() { return this._.getUTCFullYear(); },
  getHours: function() { return this._.getUTCHours(); },
  getMilliseconds: function() { return this._.getUTCMilliseconds(); },
  getMinutes: function() { return this._.getUTCMinutes(); },
  getMonth: function() { return this._.getUTCMonth(); },
  getSeconds: function() { return this._.getUTCSeconds(); },
  getTime: function() { return this._.getTime(); },
  getTimezoneOffset: function() { return 0; },
  valueOf: function() { return this._.valueOf(); },
  setDate: function() { d3_time_prototype.setUTCDate.apply(this._, arguments); },
  setDay: function() { d3_time_prototype.setUTCDay.apply(this._, arguments); },
  setFullYear: function() { d3_time_prototype.setUTCFullYear.apply(this._, arguments); },
  setHours: function() { d3_time_prototype.setUTCHours.apply(this._, arguments); },
  setMilliseconds: function() { d3_time_prototype.setUTCMilliseconds.apply(this._, arguments); },
  setMinutes: function() { d3_time_prototype.setUTCMinutes.apply(this._, arguments); },
  setMonth: function() { d3_time_prototype.setUTCMonth.apply(this._, arguments); },
  setSeconds: function() { d3_time_prototype.setUTCSeconds.apply(this._, arguments); },
  setTime: function() { d3_time_prototype.setTime.apply(this._, arguments); }
};

var d3_time_prototype = Date.prototype;
d3.time.format = function(template) {
  var n = template.length;

  function format(date) {
    var string = [],
        i = -1,
        j = 0,
        c,
        f;
    while (++i < n) {
      if (template.charCodeAt(i) == 37) {
        string.push(
            template.substring(j, i),
            (f = d3_time_formats[c = template.charAt(++i)])
            ? f(date) : c);
        j = i + 1;
      }
    }
    string.push(template.substring(j, i));
    return string.join("");
  }

  format.parse = function(string) {
    var d = {y: 1900, m: 0, d: 1, H: 0, M: 0, S: 0, L: 0},
        i = d3_time_parse(d, template, string, 0);
    if (i != string.length) return null;

    // The am-pm flag is 0 for AM, and 1 for PM.
    if ("p" in d) d.H = d.H % 12 + d.p * 12;

    var date = new d3_time();
    date.setFullYear(d.y, d.m, d.d);
    date.setHours(d.H, d.M, d.S, d.L);
    return date;
  };

  format.toString = function() {
    return template;
  };

  return format;
};

function d3_time_parse(date, template, string, j) {
  var c,
      p,
      i = 0,
      n = template.length,
      m = string.length;
  while (i < n) {
    if (j >= m) return -1;
    c = template.charCodeAt(i++);
    if (c == 37) {
      p = d3_time_parsers[template.charAt(i++)];
      if (!p || ((j = p(date, string, j)) < 0)) return -1;
    } else if (c != string.charCodeAt(j++)) {
      return -1;
    }
  }
  return j;
}

var d3_time_zfill2 = d3.format("02d"),
    d3_time_zfill3 = d3.format("03d"),
    d3_time_zfill4 = d3.format("04d"),
    d3_time_sfill2 = d3.format("2d");

var d3_time_formats = {
  a: function(d) { return d3_time_weekdays[d.getDay()].substring(0, 3); },
  A: function(d) { return d3_time_weekdays[d.getDay()]; },
  b: function(d) { return d3_time_months[d.getMonth()].substring(0, 3); },
  B: function(d) { return d3_time_months[d.getMonth()]; },
  c: d3.time.format("%a %b %e %H:%M:%S %Y"),
  d: function(d) { return d3_time_zfill2(d.getDate()); },
  e: function(d) { return d3_time_sfill2(d.getDate()); },
  H: function(d) { return d3_time_zfill2(d.getHours()); },
  I: function(d) { return d3_time_zfill2(d.getHours() % 12 || 12); },
  j: function(d) { return d3_time_zfill3(1 + d3.time.dayOfYear(d)); },
  L: function(d) { return d3_time_zfill3(d.getMilliseconds()); },
  m: function(d) { return d3_time_zfill2(d.getMonth() + 1); },
  M: function(d) { return d3_time_zfill2(d.getMinutes()); },
  p: function(d) { return d.getHours() >= 12 ? "PM" : "AM"; },
  S: function(d) { return d3_time_zfill2(d.getSeconds()); },
  U: function(d) { return d3_time_zfill2(d3.time.sundayOfYear(d)); },
  w: function(d) { return d.getDay(); },
  W: function(d) { return d3_time_zfill2(d3.time.mondayOfYear(d)); },
  x: d3.time.format("%m/%d/%y"),
  X: d3.time.format("%H:%M:%S"),
  y: function(d) { return d3_time_zfill2(d.getFullYear() % 100); },
  Y: function(d) { return d3_time_zfill4(d.getFullYear() % 10000); },
  Z: d3_time_zone,
  "%": function(d) { return "%"; }
};

var d3_time_parsers = {
  a: d3_time_parseWeekdayAbbrev,
  A: d3_time_parseWeekday,
  b: d3_time_parseMonthAbbrev,
  B: d3_time_parseMonth,
  c: d3_time_parseLocaleFull,
  d: d3_time_parseDay,
  e: d3_time_parseDay,
  H: d3_time_parseHour24,
  I: d3_time_parseHour24,
  // j: function(d, s, i) { /*TODO day of year [001,366] */ return i; },
  L: d3_time_parseMilliseconds,
  m: d3_time_parseMonthNumber,
  M: d3_time_parseMinutes,
  p: d3_time_parseAmPm,
  S: d3_time_parseSeconds,
  // U: function(d, s, i) { /*TODO week number (sunday) [00,53] */ return i; },
  // w: function(d, s, i) { /*TODO weekday [0,6] */ return i; },
  // W: function(d, s, i) { /*TODO week number (monday) [00,53] */ return i; },
  x: d3_time_parseLocaleDate,
  X: d3_time_parseLocaleTime,
  y: d3_time_parseYear,
  Y: d3_time_parseFullYear
  // ,
  // Z: function(d, s, i) { /*TODO time zone */ return i; },
  // "%": function(d, s, i) { /*TODO literal % */ return i; }
};

// Note: weekday is validated, but does not set the date.
function d3_time_parseWeekdayAbbrev(date, string, i) {
  return d3_time_weekdayAbbrevRe.test(string.substring(i, i += 3)) ? i : -1;
}

// Note: weekday is validated, but does not set the date.
function d3_time_parseWeekday(date, string, i) {
  d3_time_weekdayRe.lastIndex = 0;
  var n = d3_time_weekdayRe.exec(string.substring(i, i + 10));
  return n ? i += n[0].length : -1;
}

var d3_time_weekdayAbbrevRe = /^(?:sun|mon|tue|wed|thu|fri|sat)/i,
    d3_time_weekdayRe = /^(?:Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)/i;
    d3_time_weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function d3_time_parseMonthAbbrev(date, string, i) {
  var n = d3_time_monthAbbrevLookup.get(string.substring(i, i += 3).toLowerCase());
  return n == null ? -1 : (date.m = n, i);
}

var d3_time_monthAbbrevLookup = d3.map({
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11
});

function d3_time_parseMonth(date, string, i) {
  d3_time_monthRe.lastIndex = 0;
  var n = d3_time_monthRe.exec(string.substring(i, i + 12));
  return n ? (date.m = d3_time_monthLookup.get(n[0].toLowerCase()), i += n[0].length) : -1;
}

var d3_time_monthRe = /^(?:January|February|March|April|May|June|July|August|September|October|November|December)/ig;

var d3_time_monthLookup = d3.map({
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11
});

var d3_time_months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

function d3_time_parseLocaleFull(date, string, i) {
  return d3_time_parse(date, d3_time_formats.c.toString(), string, i);
}

function d3_time_parseLocaleDate(date, string, i) {
  return d3_time_parse(date, d3_time_formats.x.toString(), string, i);
}

function d3_time_parseLocaleTime(date, string, i) {
  return d3_time_parse(date, d3_time_formats.X.toString(), string, i);
}

function d3_time_parseFullYear(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.substring(i, i + 4));
  return n ? (date.y = +n[0], i += n[0].length) : -1;
}

function d3_time_parseYear(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.substring(i, i + 2));
  return n ? (date.y = d3_time_century() + +n[0], i += n[0].length) : -1;
}

function d3_time_century() {
  return ~~(new Date().getFullYear() / 1000) * 1000;
}

function d3_time_parseMonthNumber(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.substring(i, i + 2));
  return n ? (date.m = n[0] - 1, i += n[0].length) : -1;
}

function d3_time_parseDay(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.substring(i, i + 2));
  return n ? (date.d = +n[0], i += n[0].length) : -1;
}

// Note: we don't validate that the hour is in the range [0,23] or [1,12].
function d3_time_parseHour24(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.substring(i, i + 2));
  return n ? (date.H = +n[0], i += n[0].length) : -1;
}

function d3_time_parseMinutes(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.substring(i, i + 2));
  return n ? (date.M = +n[0], i += n[0].length) : -1;
}

function d3_time_parseSeconds(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.substring(i, i + 2));
  return n ? (date.S = +n[0], i += n[0].length) : -1;
}

function d3_time_parseMilliseconds(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.substring(i, i + 3));
  return n ? (date.L = +n[0], i += n[0].length) : -1;
}

// Note: we don't look at the next directive.
var d3_time_numberRe = /\s*\d+/;

function d3_time_parseAmPm(date, string, i) {
  var n = d3_time_amPmLookup.get(string.substring(i, i += 2).toLowerCase());
  return n == null ? -1 : (date.p = n, i);
}

var d3_time_amPmLookup = d3.map({
  am: 0,
  pm: 1
});

// TODO table of time zone offset names?
function d3_time_zone(d) {
  var z = d.getTimezoneOffset(),
      zs = z > 0 ? "-" : "+",
      zh = ~~(Math.abs(z) / 60),
      zm = Math.abs(z) % 60;
  return zs + d3_time_zfill2(zh) + d3_time_zfill2(zm);
}
d3.time.format.utc = function(template) {
  var local = d3.time.format(template);

  function format(date) {
    try {
      d3_time = d3_time_utc;
      var utc = new d3_time();
      utc._ = date;
      return local(utc);
    } finally {
      d3_time = Date;
    }
  }

  format.parse = function(string) {
    try {
      d3_time = d3_time_utc;
      var date = local.parse(string);
      return date && date._;
    } finally {
      d3_time = Date;
    }
  };

  format.toString = local.toString;

  return format;
};
var d3_time_formatIso = d3.time.format.utc("%Y-%m-%dT%H:%M:%S.%LZ");

d3.time.format.iso = Date.prototype.toISOString ? d3_time_formatIsoNative : d3_time_formatIso;

function d3_time_formatIsoNative(date) {
  return date.toISOString();
}

d3_time_formatIsoNative.parse = function(string) {
  return new Date(string);
};

d3_time_formatIsoNative.toString = d3_time_formatIso.toString;
function d3_time_interval(local, step, number) {

  function round(date) {
    var d0 = local(date), d1 = offset(d0, 1);
    return date - d0 < d1 - date ? d0 : d1;
  }

  function ceil(date) {
    step(date = local(new d3_time(date - 1)), 1);
    return date;
  }

  function offset(date, k) {
    step(date = new d3_time(+date), k);
    return date;
  }

  function range(t0, t1, dt) {
    var time = ceil(t0), times = [];
    if (dt > 1) {
      while (time < t1) {
        if (!(number(time) % dt)) times.push(new Date(+time));
        step(time, 1);
      }
    } else {
      while (time < t1) times.push(new Date(+time)), step(time, 1);
    }
    return times;
  }

  function range_utc(t0, t1, dt) {
    try {
      d3_time = d3_time_utc;
      var utc = new d3_time_utc();
      utc._ = t0;
      return range(utc, t1, dt);
    } finally {
      d3_time = Date;
    }
  }

  local.floor = local;
  local.round = round;
  local.ceil = ceil;
  local.offset = offset;
  local.range = range;

  var utc = local.utc = d3_time_interval_utc(local);
  utc.floor = utc;
  utc.round = d3_time_interval_utc(round);
  utc.ceil = d3_time_interval_utc(ceil);
  utc.offset = d3_time_interval_utc(offset);
  utc.range = range_utc;

  return local;
}

function d3_time_interval_utc(method) {
  return function(date, k) {
    try {
      d3_time = d3_time_utc;
      var utc = new d3_time_utc();
      utc._ = date;
      return method(utc, k)._;
    } finally {
      d3_time = Date;
    }
  };
}
d3.time.second = d3_time_interval(function(date) {
  return new d3_time(Math.floor(date / 1e3) * 1e3);
}, function(date, offset) {
  date.setTime(date.getTime() + Math.floor(offset) * 1e3); // DST breaks setSeconds
}, function(date) {
  return date.getSeconds();
});

d3.time.seconds = d3.time.second.range;
d3.time.seconds.utc = d3.time.second.utc.range;
d3.time.minute = d3_time_interval(function(date) {
  return new d3_time(Math.floor(date / 6e4) * 6e4);
}, function(date, offset) {
  date.setTime(date.getTime() + Math.floor(offset) * 6e4); // DST breaks setMinutes
}, function(date) {
  return date.getMinutes();
});

d3.time.minutes = d3.time.minute.range;
d3.time.minutes.utc = d3.time.minute.utc.range;
d3.time.hour = d3_time_interval(function(date) {
  var timezone = date.getTimezoneOffset() / 60;
  return new d3_time((Math.floor(date / 36e5 - timezone) + timezone) * 36e5);
}, function(date, offset) {
  date.setTime(date.getTime() + Math.floor(offset) * 36e5); // DST breaks setHours
}, function(date) {
  return date.getHours();
});

d3.time.hours = d3.time.hour.range;
d3.time.hours.utc = d3.time.hour.utc.range;
d3.time.day = d3_time_interval(function(date) {
  return new d3_time(date.getFullYear(), date.getMonth(), date.getDate());
}, function(date, offset) {
  date.setDate(date.getDate() + offset);
}, function(date) {
  return date.getDate() - 1;
});

d3.time.days = d3.time.day.range;
d3.time.days.utc = d3.time.day.utc.range;

d3.time.dayOfYear = function(date) {
  var year = d3.time.year(date);
  return Math.floor((date - year) / 864e5 - (date.getTimezoneOffset() - year.getTimezoneOffset()) / 1440);
};
d3_time_weekdays.forEach(function(day, i) {
  day = day.toLowerCase();
  i = 7 - i;

  var interval = d3.time[day] = d3_time_interval(function(date) {
    (date = d3.time.day(date)).setDate(date.getDate() - (date.getDay() + i) % 7);
    return date;
  }, function(date, offset) {
    date.setDate(date.getDate() + Math.floor(offset) * 7);
  }, function(date) {
    var day = d3.time.year(date).getDay();
    return Math.floor((d3.time.dayOfYear(date) + (day + i) % 7) / 7) - (day !== i);
  });

  d3.time[day + "s"] = interval.range;
  d3.time[day + "s"].utc = interval.utc.range;

  d3.time[day + "OfYear"] = function(date) {
    var day = d3.time.year(date).getDay();
    return Math.floor((d3.time.dayOfYear(date) + (day + i) % 7) / 7);
  };
});

d3.time.week = d3.time.sunday;
d3.time.weeks = d3.time.sunday.range;
d3.time.weeks.utc = d3.time.sunday.utc.range;
d3.time.weekOfYear = d3.time.sundayOfYear;
d3.time.month = d3_time_interval(function(date) {
  return new d3_time(date.getFullYear(), date.getMonth(), 1);
}, function(date, offset) {
  date.setMonth(date.getMonth() + offset);
}, function(date) {
  return date.getMonth();
});

d3.time.months = d3.time.month.range;
d3.time.months.utc = d3.time.month.utc.range;
d3.time.year = d3_time_interval(function(date) {
  return new d3_time(date.getFullYear(), 0, 1);
}, function(date, offset) {
  date.setFullYear(date.getFullYear() + offset);
}, function(date) {
  return date.getFullYear();
});

d3.time.years = d3.time.year.range;
d3.time.years.utc = d3.time.year.utc.range;
function d3_time_scale(linear, methods, format) {

  function scale(x) {
    return linear(x);
  }

  scale.invert = function(x) {
    return d3_time_scaleDate(linear.invert(x));
  };

  scale.domain = function(x) {
    if (!arguments.length) return linear.domain().map(d3_time_scaleDate);
    linear.domain(x);
    return scale;
  };

  scale.nice = function(m) {
    var extent = d3_time_scaleExtent(scale.domain());
    return scale.domain([m.floor(extent[0]), m.ceil(extent[1])]);
  };

  scale.ticks = function(m, k) {
    var extent = d3_time_scaleExtent(scale.domain());
    if (typeof m !== "function") {
      var span = extent[1] - extent[0],
          target = span / m,
          i = d3.bisect(d3_time_scaleSteps, target);
      if (i == d3_time_scaleSteps.length) return methods.year(extent, m);
      if (!i) return linear.ticks(m).map(d3_time_scaleDate);
      if (Math.log(target / d3_time_scaleSteps[i - 1]) < Math.log(d3_time_scaleSteps[i] / target)) --i;
      m = methods[i];
      k = m[1];
      m = m[0].range;
    }
    return m(extent[0], new Date(+extent[1] + 1), k); // inclusive upper bound
  };

  scale.tickFormat = function() {
    return format;
  };

  scale.copy = function() {
    return d3_time_scale(linear.copy(), methods, format);
  };

  // TOOD expose d3_scale_linear_rebind?
  return d3.rebind(scale, linear, "range", "rangeRound", "interpolate", "clamp");
}

// TODO expose d3_scaleExtent?
function d3_time_scaleExtent(domain) {
  var start = domain[0], stop = domain[domain.length - 1];
  return start < stop ? [start, stop] : [stop, start];
}

function d3_time_scaleDate(t) {
  return new Date(t);
}

function d3_time_scaleFormat(formats) {
  return function(date) {
    var i = formats.length - 1, f = formats[i];
    while (!f[1](date)) f = formats[--i];
    return f[0](date);
  };
}

function d3_time_scaleSetYear(y) {
  var d = new Date(y, 0, 1);
  d.setFullYear(y); // Y2K fail
  return d;
}

function d3_time_scaleGetYear(d) {
  var y = d.getFullYear(),
      d0 = d3_time_scaleSetYear(y),
      d1 = d3_time_scaleSetYear(y + 1);
  return y + (d - d0) / (d1 - d0);
}

var d3_time_scaleSteps = [
  1e3,    // 1-second
  5e3,    // 5-second
  15e3,   // 15-second
  3e4,    // 30-second
  6e4,    // 1-minute
  3e5,    // 5-minute
  9e5,    // 15-minute
  18e5,   // 30-minute
  36e5,   // 1-hour
  108e5,  // 3-hour
  216e5,  // 6-hour
  432e5,  // 12-hour
  864e5,  // 1-day
  1728e5, // 2-day
  6048e5, // 1-week
  2592e6, // 1-month
  7776e6, // 3-month
  31536e6 // 1-year
];

var d3_time_scaleLocalMethods = [
  [d3.time.second, 1],
  [d3.time.second, 5],
  [d3.time.second, 15],
  [d3.time.second, 30],
  [d3.time.minute, 1],
  [d3.time.minute, 5],
  [d3.time.minute, 15],
  [d3.time.minute, 30],
  [d3.time.hour, 1],
  [d3.time.hour, 3],
  [d3.time.hour, 6],
  [d3.time.hour, 12],
  [d3.time.day, 1],
  [d3.time.day, 2],
  [d3.time.week, 1],
  [d3.time.month, 1],
  [d3.time.month, 3],
  [d3.time.year, 1]
];

var d3_time_scaleLocalFormats = [
  [d3.time.format("%Y"), function(d) { return true; }],
  [d3.time.format("%B"), function(d) { return d.getMonth(); }],
  [d3.time.format("%b %d"), function(d) { return d.getDate() != 1; }],
  [d3.time.format("%a %d"), function(d) { return d.getDay() && d.getDate() != 1; }],
  [d3.time.format("%I %p"), function(d) { return d.getHours(); }],
  [d3.time.format("%I:%M"), function(d) { return d.getMinutes(); }],
  [d3.time.format(":%S"), function(d) { return d.getSeconds(); }],
  [d3.time.format(".%L"), function(d) { return d.getMilliseconds(); }]
];

var d3_time_scaleLinear = d3.scale.linear(),
    d3_time_scaleLocalFormat = d3_time_scaleFormat(d3_time_scaleLocalFormats);

d3_time_scaleLocalMethods.year = function(extent, m) {
  return d3_time_scaleLinear.domain(extent.map(d3_time_scaleGetYear)).ticks(m).map(d3_time_scaleSetYear);
};

d3.time.scale = function() {
  return d3_time_scale(d3.scale.linear(), d3_time_scaleLocalMethods, d3_time_scaleLocalFormat);
};
var d3_time_scaleUTCMethods = d3_time_scaleLocalMethods.map(function(m) {
  return [m[0].utc, m[1]];
});

var d3_time_scaleUTCFormats = [
  [d3.time.format.utc("%Y"), function(d) { return true; }],
  [d3.time.format.utc("%B"), function(d) { return d.getUTCMonth(); }],
  [d3.time.format.utc("%b %d"), function(d) { return d.getUTCDate() != 1; }],
  [d3.time.format.utc("%a %d"), function(d) { return d.getUTCDay() && d.getUTCDate() != 1; }],
  [d3.time.format.utc("%I %p"), function(d) { return d.getUTCHours(); }],
  [d3.time.format.utc("%I:%M"), function(d) { return d.getUTCMinutes(); }],
  [d3.time.format.utc(":%S"), function(d) { return d.getUTCSeconds(); }],
  [d3.time.format.utc(".%L"), function(d) { return d.getUTCMilliseconds(); }]
];

var d3_time_scaleUTCFormat = d3_time_scaleFormat(d3_time_scaleUTCFormats);

function d3_time_scaleUTCSetYear(y) {
  var d = new Date(Date.UTC(y, 0, 1));
  d.setUTCFullYear(y); // Y2K fail
  return d;
}

function d3_time_scaleUTCGetYear(d) {
  var y = d.getUTCFullYear(),
      d0 = d3_time_scaleUTCSetYear(y),
      d1 = d3_time_scaleUTCSetYear(y + 1);
  return y + (d - d0) / (d1 - d0);
}

d3_time_scaleUTCMethods.year = function(extent, m) {
  return d3_time_scaleLinear.domain(extent.map(d3_time_scaleUTCGetYear)).ticks(m).map(d3_time_scaleUTCSetYear);
};

d3.time.scale.utc = function() {
  return d3_time_scale(d3.scale.linear(), d3_time_scaleUTCMethods, d3_time_scaleUTCFormat);
};
})();

/*! Copyright (c) 2011 Brandon Aaron (http://brandonaaron.net)
* Licensed under the MIT License (LICENSE.txt).
*
* Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
* Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
* Thanks to: Seamus Leahy for adding deltaX and deltaY
*
* Version: 3.0.6
*
* Requires: 1.2.2+
*/

(function($) {

var types = ['DOMMouseScroll', 'mousewheel'];

if ($.event.fixHooks) {
    for ( var i=types.length; i; ) {
        $.event.fixHooks[ types[--i] ] = $.event.mouseHooks;
    }
}

$.event.special.mousewheel = {
    setup: function() {
        if ( this.addEventListener ) {
            for ( var i=types.length; i; ) {
                this.addEventListener( types[--i], handler, false );
            }
        } else {
            this.onmousewheel = handler;
        }
    },

    teardown: function() {
        if ( this.removeEventListener ) {
            for ( var i=types.length; i; ) {
                this.removeEventListener( types[--i], handler, false );
            }
        } else {
            this.onmousewheel = null;
        }
    }
};

$.fn.extend({
    mousewheel: function(fn) {
        return fn ? this.bind("mousewheel", fn) : this.trigger("mousewheel");
    },

    unmousewheel: function(fn) {
        return this.unbind("mousewheel", fn);
    }
});


function handler(event) {
    var orgEvent = event || window.event, args = [].slice.call( arguments, 1 ), delta = 0, returnValue = true, deltaX = 0, deltaY = 0;
    event = $.event.fix(orgEvent);
    event.type = "mousewheel";

    // Old school scrollwheel delta
    if ( orgEvent.wheelDelta ) { delta = orgEvent.wheelDelta/120; }
    if ( orgEvent.detail ) { delta = -orgEvent.detail/3; }

    // New school multidimensional scroll (touchpads) deltas
    deltaY = delta;

    // Gecko
    if ( orgEvent.axis !== undefined && orgEvent.axis === orgEvent.HORIZONTAL_AXIS ) {
        deltaY = 0;
        deltaX = -1*delta;
    }

    // Webkit
    if ( orgEvent.wheelDeltaY !== undefined ) { deltaY = orgEvent.wheelDeltaY/120; }
    if ( orgEvent.wheelDeltaX !== undefined ) { deltaX = -1*orgEvent.wheelDeltaX/120; }

    // Add event and delta to the front of the arguments
    args.unshift(event, delta, deltaX, deltaY);

    return ($.event.dispatch || $.event.handle).apply(this, args);
}

})(jQuery);

/*! jQuery UI - v1.10.3 - 2013-08-21
* http://jqueryui.com
* Includes: jquery.ui.core.js, jquery.ui.widget.js, jquery.ui.mouse.js, jquery.ui.position.js, jquery.ui.slider.js
* Copyright 2013 jQuery Foundation and other contributors Licensed MIT */

(function( $, undefined ) {

var uuid = 0,
	runiqueId = /^ui-id-\d+$/;

// $.ui might exist from components with no dependencies, e.g., $.ui.position
$.ui = $.ui || {};

$.extend( $.ui, {
	version: "1.10.3",

	keyCode: {
		BACKSPACE: 8,
		COMMA: 188,
		DELETE: 46,
		DOWN: 40,
		END: 35,
		ENTER: 13,
		ESCAPE: 27,
		HOME: 36,
		LEFT: 37,
		NUMPAD_ADD: 107,
		NUMPAD_DECIMAL: 110,
		NUMPAD_DIVIDE: 111,
		NUMPAD_ENTER: 108,
		NUMPAD_MULTIPLY: 106,
		NUMPAD_SUBTRACT: 109,
		PAGE_DOWN: 34,
		PAGE_UP: 33,
		PERIOD: 190,
		RIGHT: 39,
		SPACE: 32,
		TAB: 9,
		UP: 38
	}
});

// plugins
$.fn.extend({
	focus: (function( orig ) {
		return function( delay, fn ) {
			return typeof delay === "number" ?
				this.each(function() {
					var elem = this;
					setTimeout(function() {
						$( elem ).focus();
						if ( fn ) {
							fn.call( elem );
						}
					}, delay );
				}) :
				orig.apply( this, arguments );
		};
	})( $.fn.focus ),

	scrollParent: function() {
		var scrollParent;
		if (($.ui.ie && (/(static|relative)/).test(this.css("position"))) || (/absolute/).test(this.css("position"))) {
			scrollParent = this.parents().filter(function() {
				return (/(relative|absolute|fixed)/).test($.css(this,"position")) && (/(auto|scroll)/).test($.css(this,"overflow")+$.css(this,"overflow-y")+$.css(this,"overflow-x"));
			}).eq(0);
		} else {
			scrollParent = this.parents().filter(function() {
				return (/(auto|scroll)/).test($.css(this,"overflow")+$.css(this,"overflow-y")+$.css(this,"overflow-x"));
			}).eq(0);
		}

		return (/fixed/).test(this.css("position")) || !scrollParent.length ? $(document) : scrollParent;
	},

	zIndex: function( zIndex ) {
		if ( zIndex !== undefined ) {
			return this.css( "zIndex", zIndex );
		}

		if ( this.length ) {
			var elem = $( this[ 0 ] ), position, value;
			while ( elem.length && elem[ 0 ] !== document ) {
				// Ignore z-index if position is set to a value where z-index is ignored by the browser
				// This makes behavior of this function consistent across browsers
				// WebKit always returns auto if the element is positioned
				position = elem.css( "position" );
				if ( position === "absolute" || position === "relative" || position === "fixed" ) {
					// IE returns 0 when zIndex is not specified
					// other browsers return a string
					// we ignore the case of nested elements with an explicit value of 0
					// <div style="z-index: -10;"><div style="z-index: 0;"></div></div>
					value = parseInt( elem.css( "zIndex" ), 10 );
					if ( !isNaN( value ) && value !== 0 ) {
						return value;
					}
				}
				elem = elem.parent();
			}
		}

		return 0;
	},

	uniqueId: function() {
		return this.each(function() {
			if ( !this.id ) {
				this.id = "ui-id-" + (++uuid);
			}
		});
	},

	removeUniqueId: function() {
		return this.each(function() {
			if ( runiqueId.test( this.id ) ) {
				$( this ).removeAttr( "id" );
			}
		});
	}
});

// selectors
function focusable( element, isTabIndexNotNaN ) {
	var map, mapName, img,
		nodeName = element.nodeName.toLowerCase();
	if ( "area" === nodeName ) {
		map = element.parentNode;
		mapName = map.name;
		if ( !element.href || !mapName || map.nodeName.toLowerCase() !== "map" ) {
			return false;
		}
		img = $( "img[usemap=#" + mapName + "]" )[0];
		return !!img && visible( img );
	}
	return ( /input|select|textarea|button|object/.test( nodeName ) ?
		!element.disabled :
		"a" === nodeName ?
			element.href || isTabIndexNotNaN :
			isTabIndexNotNaN) &&
		// the element and all of its ancestors must be visible
		visible( element );
}

function visible( element ) {
	return $.expr.filters.visible( element ) &&
		!$( element ).parents().addBack().filter(function() {
			return $.css( this, "visibility" ) === "hidden";
		}).length;
}

$.extend( $.expr[ ":" ], {
	data: $.expr.createPseudo ?
		$.expr.createPseudo(function( dataName ) {
			return function( elem ) {
				return !!$.data( elem, dataName );
			};
		}) :
		// support: jQuery <1.8
		function( elem, i, match ) {
			return !!$.data( elem, match[ 3 ] );
		},

	focusable: function( element ) {
		return focusable( element, !isNaN( $.attr( element, "tabindex" ) ) );
	},

	tabbable: function( element ) {
		var tabIndex = $.attr( element, "tabindex" ),
			isTabIndexNaN = isNaN( tabIndex );
		return ( isTabIndexNaN || tabIndex >= 0 ) && focusable( element, !isTabIndexNaN );
	}
});

// support: jQuery <1.8
if ( !$( "<a>" ).outerWidth( 1 ).jquery ) {
	$.each( [ "Width", "Height" ], function( i, name ) {
		var side = name === "Width" ? [ "Left", "Right" ] : [ "Top", "Bottom" ],
			type = name.toLowerCase(),
			orig = {
				innerWidth: $.fn.innerWidth,
				innerHeight: $.fn.innerHeight,
				outerWidth: $.fn.outerWidth,
				outerHeight: $.fn.outerHeight
			};

		function reduce( elem, size, border, margin ) {
			$.each( side, function() {
				size -= parseFloat( $.css( elem, "padding" + this ) ) || 0;
				if ( border ) {
					size -= parseFloat( $.css( elem, "border" + this + "Width" ) ) || 0;
				}
				if ( margin ) {
					size -= parseFloat( $.css( elem, "margin" + this ) ) || 0;
				}
			});
			return size;
		}

		$.fn[ "inner" + name ] = function( size ) {
			if ( size === undefined ) {
				return orig[ "inner" + name ].call( this );
			}

			return this.each(function() {
				$( this ).css( type, reduce( this, size ) + "px" );
			});
		};

		$.fn[ "outer" + name] = function( size, margin ) {
			if ( typeof size !== "number" ) {
				return orig[ "outer" + name ].call( this, size );
			}

			return this.each(function() {
				$( this).css( type, reduce( this, size, true, margin ) + "px" );
			});
		};
	});
}

// support: jQuery <1.8
if ( !$.fn.addBack ) {
	$.fn.addBack = function( selector ) {
		return this.add( selector == null ?
			this.prevObject : this.prevObject.filter( selector )
		);
	};
}

// support: jQuery 1.6.1, 1.6.2 (http://bugs.jquery.com/ticket/9413)
if ( $( "<a>" ).data( "a-b", "a" ).removeData( "a-b" ).data( "a-b" ) ) {
	$.fn.removeData = (function( removeData ) {
		return function( key ) {
			if ( arguments.length ) {
				return removeData.call( this, $.camelCase( key ) );
			} else {
				return removeData.call( this );
			}
		};
	})( $.fn.removeData );
}





// deprecated
$.ui.ie = !!/msie [\w.]+/.exec( navigator.userAgent.toLowerCase() );

$.support.selectstart = "onselectstart" in document.createElement( "div" );
$.fn.extend({
	disableSelection: function() {
		return this.bind( ( $.support.selectstart ? "selectstart" : "mousedown" ) +
			".ui-disableSelection", function( event ) {
				event.preventDefault();
			});
	},

	enableSelection: function() {
		return this.unbind( ".ui-disableSelection" );
	}
});

$.extend( $.ui, {
	// $.ui.plugin is deprecated. Use $.widget() extensions instead.
	plugin: {
		add: function( module, option, set ) {
			var i,
				proto = $.ui[ module ].prototype;
			for ( i in set ) {
				proto.plugins[ i ] = proto.plugins[ i ] || [];
				proto.plugins[ i ].push( [ option, set[ i ] ] );
			}
		},
		call: function( instance, name, args ) {
			var i,
				set = instance.plugins[ name ];
			if ( !set || !instance.element[ 0 ].parentNode || instance.element[ 0 ].parentNode.nodeType === 11 ) {
				return;
			}

			for ( i = 0; i < set.length; i++ ) {
				if ( instance.options[ set[ i ][ 0 ] ] ) {
					set[ i ][ 1 ].apply( instance.element, args );
				}
			}
		}
	},

	// only used by resizable
	hasScroll: function( el, a ) {

		//If overflow is hidden, the element might have extra content, but the user wants to hide it
		if ( $( el ).css( "overflow" ) === "hidden") {
			return false;
		}

		var scroll = ( a && a === "left" ) ? "scrollLeft" : "scrollTop",
			has = false;

		if ( el[ scroll ] > 0 ) {
			return true;
		}

		// TODO: determine which cases actually cause this to happen
		// if the element doesn't have the scroll set, see if it's possible to
		// set the scroll
		el[ scroll ] = 1;
		has = ( el[ scroll ] > 0 );
		el[ scroll ] = 0;
		return has;
	}
});

})( jQuery );
(function( $, undefined ) {

var uuid = 0,
	slice = Array.prototype.slice,
	_cleanData = $.cleanData;
$.cleanData = function( elems ) {
	for ( var i = 0, elem; (elem = elems[i]) != null; i++ ) {
		try {
			$( elem ).triggerHandler( "remove" );
		// http://bugs.jquery.com/ticket/8235
		} catch( e ) {}
	}
	_cleanData( elems );
};

$.widget = function( name, base, prototype ) {
	var fullName, existingConstructor, constructor, basePrototype,
		// proxiedPrototype allows the provided prototype to remain unmodified
		// so that it can be used as a mixin for multiple widgets (#8876)
		proxiedPrototype = {},
		namespace = name.split( "." )[ 0 ];

	name = name.split( "." )[ 1 ];
	fullName = namespace + "-" + name;

	if ( !prototype ) {
		prototype = base;
		base = $.Widget;
	}

	// create selector for plugin
	$.expr[ ":" ][ fullName.toLowerCase() ] = function( elem ) {
		return !!$.data( elem, fullName );
	};

	$[ namespace ] = $[ namespace ] || {};
	existingConstructor = $[ namespace ][ name ];
	constructor = $[ namespace ][ name ] = function( options, element ) {
		// allow instantiation without "new" keyword
		if ( !this._createWidget ) {
			return new constructor( options, element );
		}

		// allow instantiation without initializing for simple inheritance
		// must use "new" keyword (the code above always passes args)
		if ( arguments.length ) {
			this._createWidget( options, element );
		}
	};
	// extend with the existing constructor to carry over any static properties
	$.extend( constructor, existingConstructor, {
		version: prototype.version,
		// copy the object used to create the prototype in case we need to
		// redefine the widget later
		_proto: $.extend( {}, prototype ),
		// track widgets that inherit from this widget in case this widget is
		// redefined after a widget inherits from it
		_childConstructors: []
	});

	basePrototype = new base();
	// we need to make the options hash a property directly on the new instance
	// otherwise we'll modify the options hash on the prototype that we're
	// inheriting from
	basePrototype.options = $.widget.extend( {}, basePrototype.options );
	$.each( prototype, function( prop, value ) {
		if ( !$.isFunction( value ) ) {
			proxiedPrototype[ prop ] = value;
			return;
		}
		proxiedPrototype[ prop ] = (function() {
			var _super = function() {
					return base.prototype[ prop ].apply( this, arguments );
				},
				_superApply = function( args ) {
					return base.prototype[ prop ].apply( this, args );
				};
			return function() {
				var __super = this._super,
					__superApply = this._superApply,
					returnValue;

				this._super = _super;
				this._superApply = _superApply;

				returnValue = value.apply( this, arguments );

				this._super = __super;
				this._superApply = __superApply;

				return returnValue;
			};
		})();
	});
	constructor.prototype = $.widget.extend( basePrototype, {
		// TODO: remove support for widgetEventPrefix
		// always use the name + a colon as the prefix, e.g., draggable:start
		// don't prefix for widgets that aren't DOM-based
		widgetEventPrefix: existingConstructor ? basePrototype.widgetEventPrefix : name
	}, proxiedPrototype, {
		constructor: constructor,
		namespace: namespace,
		widgetName: name,
		widgetFullName: fullName
	});

	// If this widget is being redefined then we need to find all widgets that
	// are inheriting from it and redefine all of them so that they inherit from
	// the new version of this widget. We're essentially trying to replace one
	// level in the prototype chain.
	if ( existingConstructor ) {
		$.each( existingConstructor._childConstructors, function( i, child ) {
			var childPrototype = child.prototype;

			// redefine the child widget using the same prototype that was
			// originally used, but inherit from the new version of the base
			$.widget( childPrototype.namespace + "." + childPrototype.widgetName, constructor, child._proto );
		});
		// remove the list of existing child constructors from the old constructor
		// so the old child constructors can be garbage collected
		delete existingConstructor._childConstructors;
	} else {
		base._childConstructors.push( constructor );
	}

	$.widget.bridge( name, constructor );
};

$.widget.extend = function( target ) {
	var input = slice.call( arguments, 1 ),
		inputIndex = 0,
		inputLength = input.length,
		key,
		value;
	for ( ; inputIndex < inputLength; inputIndex++ ) {
		for ( key in input[ inputIndex ] ) {
			value = input[ inputIndex ][ key ];
			if ( input[ inputIndex ].hasOwnProperty( key ) && value !== undefined ) {
				// Clone objects
				if ( $.isPlainObject( value ) ) {
					target[ key ] = $.isPlainObject( target[ key ] ) ?
						$.widget.extend( {}, target[ key ], value ) :
						// Don't extend strings, arrays, etc. with objects
						$.widget.extend( {}, value );
				// Copy everything else by reference
				} else {
					target[ key ] = value;
				}
			}
		}
	}
	return target;
};

$.widget.bridge = function( name, object ) {
	var fullName = object.prototype.widgetFullName || name;
	$.fn[ name ] = function( options ) {
		var isMethodCall = typeof options === "string",
			args = slice.call( arguments, 1 ),
			returnValue = this;

		// allow multiple hashes to be passed on init
		options = !isMethodCall && args.length ?
			$.widget.extend.apply( null, [ options ].concat(args) ) :
			options;

		if ( isMethodCall ) {
			this.each(function() {
				var methodValue,
					instance = $.data( this, fullName );
				if ( !instance ) {
					return $.error( "cannot call methods on " + name + " prior to initialization; " +
						"attempted to call method '" + options + "'" );
				}
				if ( !$.isFunction( instance[options] ) || options.charAt( 0 ) === "_" ) {
					return $.error( "no such method '" + options + "' for " + name + " widget instance" );
				}
				methodValue = instance[ options ].apply( instance, args );
				if ( methodValue !== instance && methodValue !== undefined ) {
					returnValue = methodValue && methodValue.jquery ?
						returnValue.pushStack( methodValue.get() ) :
						methodValue;
					return false;
				}
			});
		} else {
			this.each(function() {
				var instance = $.data( this, fullName );
				if ( instance ) {
					instance.option( options || {} )._init();
				} else {
					$.data( this, fullName, new object( options, this ) );
				}
			});
		}

		return returnValue;
	};
};

$.Widget = function( /* options, element */ ) {};
$.Widget._childConstructors = [];

$.Widget.prototype = {
	widgetName: "widget",
	widgetEventPrefix: "",
	defaultElement: "<div>",
	options: {
		disabled: false,

		// callbacks
		create: null
	},
	_createWidget: function( options, element ) {
		element = $( element || this.defaultElement || this )[ 0 ];
		this.element = $( element );
		this.uuid = uuid++;
		this.eventNamespace = "." + this.widgetName + this.uuid;
		this.options = $.widget.extend( {},
			this.options,
			this._getCreateOptions(),
			options );

		this.bindings = $();
		this.hoverable = $();
		this.focusable = $();

		if ( element !== this ) {
			$.data( element, this.widgetFullName, this );
			this._on( true, this.element, {
				remove: function( event ) {
					if ( event.target === element ) {
						this.destroy();
					}
				}
			});
			this.document = $( element.style ?
				// element within the document
				element.ownerDocument :
				// element is window or document
				element.document || element );
			this.window = $( this.document[0].defaultView || this.document[0].parentWindow );
		}

		this._create();
		this._trigger( "create", null, this._getCreateEventData() );
		this._init();
	},
	_getCreateOptions: $.noop,
	_getCreateEventData: $.noop,
	_create: $.noop,
	_init: $.noop,

	destroy: function() {
		this._destroy();
		// we can probably remove the unbind calls in 2.0
		// all event bindings should go through this._on()
		this.element
			.unbind( this.eventNamespace )
			// 1.9 BC for #7810
			// TODO remove dual storage
			.removeData( this.widgetName )
			.removeData( this.widgetFullName )
			// support: jquery <1.6.3
			// http://bugs.jquery.com/ticket/9413
			.removeData( $.camelCase( this.widgetFullName ) );
		this.widget()
			.unbind( this.eventNamespace )
			.removeAttr( "aria-disabled" )
			.removeClass(
				this.widgetFullName + "-disabled " +
				"ui-state-disabled" );

		// clean up events and states
		this.bindings.unbind( this.eventNamespace );
		this.hoverable.removeClass( "ui-state-hover" );
		this.focusable.removeClass( "ui-state-focus" );
	},
	_destroy: $.noop,

	widget: function() {
		return this.element;
	},

	option: function( key, value ) {
		var options = key,
			parts,
			curOption,
			i;

		if ( arguments.length === 0 ) {
			// don't return a reference to the internal hash
			return $.widget.extend( {}, this.options );
		}

		if ( typeof key === "string" ) {
			// handle nested keys, e.g., "foo.bar" => { foo: { bar: ___ } }
			options = {};
			parts = key.split( "." );
			key = parts.shift();
			if ( parts.length ) {
				curOption = options[ key ] = $.widget.extend( {}, this.options[ key ] );
				for ( i = 0; i < parts.length - 1; i++ ) {
					curOption[ parts[ i ] ] = curOption[ parts[ i ] ] || {};
					curOption = curOption[ parts[ i ] ];
				}
				key = parts.pop();
				if ( value === undefined ) {
					return curOption[ key ] === undefined ? null : curOption[ key ];
				}
				curOption[ key ] = value;
			} else {
				if ( value === undefined ) {
					return this.options[ key ] === undefined ? null : this.options[ key ];
				}
				options[ key ] = value;
			}
		}

		this._setOptions( options );

		return this;
	},
	_setOptions: function( options ) {
		var key;

		for ( key in options ) {
			this._setOption( key, options[ key ] );
		}

		return this;
	},
	_setOption: function( key, value ) {
		this.options[ key ] = value;

		if ( key === "disabled" ) {
			this.widget()
				.toggleClass( this.widgetFullName + "-disabled ui-state-disabled", !!value )
				.attr( "aria-disabled", value );
			this.hoverable.removeClass( "ui-state-hover" );
			this.focusable.removeClass( "ui-state-focus" );
		}

		return this;
	},

	enable: function() {
		return this._setOption( "disabled", false );
	},
	disable: function() {
		return this._setOption( "disabled", true );
	},

	_on: function( suppressDisabledCheck, element, handlers ) {
		var delegateElement,
			instance = this;

		// no suppressDisabledCheck flag, shuffle arguments
		if ( typeof suppressDisabledCheck !== "boolean" ) {
			handlers = element;
			element = suppressDisabledCheck;
			suppressDisabledCheck = false;
		}

		// no element argument, shuffle and use this.element
		if ( !handlers ) {
			handlers = element;
			element = this.element;
			delegateElement = this.widget();
		} else {
			// accept selectors, DOM elements
			element = delegateElement = $( element );
			this.bindings = this.bindings.add( element );
		}

		$.each( handlers, function( event, handler ) {
			function handlerProxy() {
				// allow widgets to customize the disabled handling
				// - disabled as an array instead of boolean
				// - disabled class as method for disabling individual parts
				if ( !suppressDisabledCheck &&
						( instance.options.disabled === true ||
							$( this ).hasClass( "ui-state-disabled" ) ) ) {
					return;
				}
				return ( typeof handler === "string" ? instance[ handler ] : handler )
					.apply( instance, arguments );
			}

			// copy the guid so direct unbinding works
			if ( typeof handler !== "string" ) {
				handlerProxy.guid = handler.guid =
					handler.guid || handlerProxy.guid || $.guid++;
			}

			var match = event.match( /^(\w+)\s*(.*)$/ ),
				eventName = match[1] + instance.eventNamespace,
				selector = match[2];
			if ( selector ) {
				delegateElement.delegate( selector, eventName, handlerProxy );
			} else {
				element.bind( eventName, handlerProxy );
			}
		});
	},

	_off: function( element, eventName ) {
		eventName = (eventName || "").split( " " ).join( this.eventNamespace + " " ) + this.eventNamespace;
		element.unbind( eventName ).undelegate( eventName );
	},

	_delay: function( handler, delay ) {
		function handlerProxy() {
			return ( typeof handler === "string" ? instance[ handler ] : handler )
				.apply( instance, arguments );
		}
		var instance = this;
		return setTimeout( handlerProxy, delay || 0 );
	},

	_hoverable: function( element ) {
		this.hoverable = this.hoverable.add( element );
		this._on( element, {
			mouseenter: function( event ) {
				$( event.currentTarget ).addClass( "ui-state-hover" );
			},
			mouseleave: function( event ) {
				$( event.currentTarget ).removeClass( "ui-state-hover" );
			}
		});
	},

	_focusable: function( element ) {
		this.focusable = this.focusable.add( element );
		this._on( element, {
			focusin: function( event ) {
				$( event.currentTarget ).addClass( "ui-state-focus" );
			},
			focusout: function( event ) {
				$( event.currentTarget ).removeClass( "ui-state-focus" );
			}
		});
	},

	_trigger: function( type, event, data ) {
		var prop, orig,
			callback = this.options[ type ];

		data = data || {};
		event = $.Event( event );
		event.type = ( type === this.widgetEventPrefix ?
			type :
			this.widgetEventPrefix + type ).toLowerCase();
		// the original event may come from any element
		// so we need to reset the target on the new event
		event.target = this.element[ 0 ];

		// copy original event properties over to the new event
		orig = event.originalEvent;
		if ( orig ) {
			for ( prop in orig ) {
				if ( !( prop in event ) ) {
					event[ prop ] = orig[ prop ];
				}
			}
		}

		this.element.trigger( event, data );
		return !( $.isFunction( callback ) &&
			callback.apply( this.element[0], [ event ].concat( data ) ) === false ||
			event.isDefaultPrevented() );
	}
};

$.each( { show: "fadeIn", hide: "fadeOut" }, function( method, defaultEffect ) {
	$.Widget.prototype[ "_" + method ] = function( element, options, callback ) {
		if ( typeof options === "string" ) {
			options = { effect: options };
		}
		var hasOptions,
			effectName = !options ?
				method :
				options === true || typeof options === "number" ?
					defaultEffect :
					options.effect || defaultEffect;
		options = options || {};
		if ( typeof options === "number" ) {
			options = { duration: options };
		}
		hasOptions = !$.isEmptyObject( options );
		options.complete = callback;
		if ( options.delay ) {
			element.delay( options.delay );
		}
		if ( hasOptions && $.effects && $.effects.effect[ effectName ] ) {
			element[ method ]( options );
		} else if ( effectName !== method && element[ effectName ] ) {
			element[ effectName ]( options.duration, options.easing, callback );
		} else {
			element.queue(function( next ) {
				$( this )[ method ]();
				if ( callback ) {
					callback.call( element[ 0 ] );
				}
				next();
			});
		}
	};
});

})( jQuery );
(function( $, undefined ) {

var mouseHandled = false;
$( document ).mouseup( function() {
	mouseHandled = false;
});

$.widget("ui.mouse", {
	version: "1.10.3",
	options: {
		cancel: "input,textarea,button,select,option",
		distance: 1,
		delay: 0
	},
	_mouseInit: function() {
		var that = this;

		this.element
			.bind("mousedown."+this.widgetName, function(event) {
				return that._mouseDown(event);
			})
			.bind("click."+this.widgetName, function(event) {
				if (true === $.data(event.target, that.widgetName + ".preventClickEvent")) {
					$.removeData(event.target, that.widgetName + ".preventClickEvent");
					event.stopImmediatePropagation();
					return false;
				}
			});

		this.started = false;
	},

	// TODO: make sure destroying one instance of mouse doesn't mess with
	// other instances of mouse
	_mouseDestroy: function() {
		this.element.unbind("."+this.widgetName);
		if ( this._mouseMoveDelegate ) {
			$(document)
				.unbind("mousemove."+this.widgetName, this._mouseMoveDelegate)
				.unbind("mouseup."+this.widgetName, this._mouseUpDelegate);
		}
	},

	_mouseDown: function(event) {
		// don't let more than one widget handle mouseStart
		if( mouseHandled ) { return; }

		// we may have missed mouseup (out of window)
		(this._mouseStarted && this._mouseUp(event));

		this._mouseDownEvent = event;

		var that = this,
			btnIsLeft = (event.which === 1),
			// event.target.nodeName works around a bug in IE 8 with
			// disabled inputs (#7620)
			elIsCancel = (typeof this.options.cancel === "string" && event.target.nodeName ? $(event.target).closest(this.options.cancel).length : false);
		if (!btnIsLeft || elIsCancel || !this._mouseCapture(event)) {
			return true;
		}

		this.mouseDelayMet = !this.options.delay;
		if (!this.mouseDelayMet) {
			this._mouseDelayTimer = setTimeout(function() {
				that.mouseDelayMet = true;
			}, this.options.delay);
		}

		if (this._mouseDistanceMet(event) && this._mouseDelayMet(event)) {
			this._mouseStarted = (this._mouseStart(event) !== false);
			if (!this._mouseStarted) {
				event.preventDefault();
				return true;
			}
		}

		// Click event may never have fired (Gecko & Opera)
		if (true === $.data(event.target, this.widgetName + ".preventClickEvent")) {
			$.removeData(event.target, this.widgetName + ".preventClickEvent");
		}

		// these delegates are required to keep context
		this._mouseMoveDelegate = function(event) {
			return that._mouseMove(event);
		};
		this._mouseUpDelegate = function(event) {
			return that._mouseUp(event);
		};
		$(document)
			.bind("mousemove."+this.widgetName, this._mouseMoveDelegate)
			.bind("mouseup."+this.widgetName, this._mouseUpDelegate);

		event.preventDefault();

		mouseHandled = true;
		return true;
	},

	_mouseMove: function(event) {
		// IE mouseup check - mouseup happened when mouse was out of window
		if ($.ui.ie && ( !document.documentMode || document.documentMode < 9 ) && !event.button) {
			return this._mouseUp(event);
		}

		if (this._mouseStarted) {
			this._mouseDrag(event);
			return event.preventDefault();
		}

		if (this._mouseDistanceMet(event) && this._mouseDelayMet(event)) {
			this._mouseStarted =
				(this._mouseStart(this._mouseDownEvent, event) !== false);
			(this._mouseStarted ? this._mouseDrag(event) : this._mouseUp(event));
		}

		return !this._mouseStarted;
	},

	_mouseUp: function(event) {
		$(document)
			.unbind("mousemove."+this.widgetName, this._mouseMoveDelegate)
			.unbind("mouseup."+this.widgetName, this._mouseUpDelegate);

		if (this._mouseStarted) {
			this._mouseStarted = false;

			if (event.target === this._mouseDownEvent.target) {
				$.data(event.target, this.widgetName + ".preventClickEvent", true);
			}

			this._mouseStop(event);
		}

		return false;
	},

	_mouseDistanceMet: function(event) {
		return (Math.max(
				Math.abs(this._mouseDownEvent.pageX - event.pageX),
				Math.abs(this._mouseDownEvent.pageY - event.pageY)
			) >= this.options.distance
		);
	},

	_mouseDelayMet: function(/* event */) {
		return this.mouseDelayMet;
	},

	// These are placeholder methods, to be overriden by extending plugin
	_mouseStart: function(/* event */) {},
	_mouseDrag: function(/* event */) {},
	_mouseStop: function(/* event */) {},
	_mouseCapture: function(/* event */) { return true; }
});

})(jQuery);
(function( $, undefined ) {

$.ui = $.ui || {};

var cachedScrollbarWidth,
	max = Math.max,
	abs = Math.abs,
	round = Math.round,
	rhorizontal = /left|center|right/,
	rvertical = /top|center|bottom/,
	roffset = /[\+\-]\d+(\.[\d]+)?%?/,
	rposition = /^\w+/,
	rpercent = /%$/,
	_position = $.fn.position;

function getOffsets( offsets, width, height ) {
	return [
		parseFloat( offsets[ 0 ] ) * ( rpercent.test( offsets[ 0 ] ) ? width / 100 : 1 ),
		parseFloat( offsets[ 1 ] ) * ( rpercent.test( offsets[ 1 ] ) ? height / 100 : 1 )
	];
}

function parseCss( element, property ) {
	return parseInt( $.css( element, property ), 10 ) || 0;
}

function getDimensions( elem ) {
	var raw = elem[0];
	if ( raw.nodeType === 9 ) {
		return {
			width: elem.width(),
			height: elem.height(),
			offset: { top: 0, left: 0 }
		};
	}
	if ( $.isWindow( raw ) ) {
		return {
			width: elem.width(),
			height: elem.height(),
			offset: { top: elem.scrollTop(), left: elem.scrollLeft() }
		};
	}
	if ( raw.preventDefault ) {
		return {
			width: 0,
			height: 0,
			offset: { top: raw.pageY, left: raw.pageX }
		};
	}
	return {
		width: elem.outerWidth(),
		height: elem.outerHeight(),
		offset: elem.offset()
	};
}

$.position = {
	scrollbarWidth: function() {
		if ( cachedScrollbarWidth !== undefined ) {
			return cachedScrollbarWidth;
		}
		var w1, w2,
			div = $( "<div style='display:block;width:50px;height:50px;overflow:hidden;'><div style='height:100px;width:auto;'></div></div>" ),
			innerDiv = div.children()[0];

		$( "body" ).append( div );
		w1 = innerDiv.offsetWidth;
		div.css( "overflow", "scroll" );

		w2 = innerDiv.offsetWidth;

		if ( w1 === w2 ) {
			w2 = div[0].clientWidth;
		}

		div.remove();

		return (cachedScrollbarWidth = w1 - w2);
	},
	getScrollInfo: function( within ) {
		var overflowX = within.isWindow ? "" : within.element.css( "overflow-x" ),
			overflowY = within.isWindow ? "" : within.element.css( "overflow-y" ),
			hasOverflowX = overflowX === "scroll" ||
				( overflowX === "auto" && within.width < within.element[0].scrollWidth ),
			hasOverflowY = overflowY === "scroll" ||
				( overflowY === "auto" && within.height < within.element[0].scrollHeight );
		return {
			width: hasOverflowY ? $.position.scrollbarWidth() : 0,
			height: hasOverflowX ? $.position.scrollbarWidth() : 0
		};
	},
	getWithinInfo: function( element ) {
		var withinElement = $( element || window ),
			isWindow = $.isWindow( withinElement[0] );
		return {
			element: withinElement,
			isWindow: isWindow,
			offset: withinElement.offset() || { left: 0, top: 0 },
			scrollLeft: withinElement.scrollLeft(),
			scrollTop: withinElement.scrollTop(),
			width: isWindow ? withinElement.width() : withinElement.outerWidth(),
			height: isWindow ? withinElement.height() : withinElement.outerHeight()
		};
	}
};

$.fn.position = function( options ) {
	if ( !options || !options.of ) {
		return _position.apply( this, arguments );
	}

	// make a copy, we don't want to modify arguments
	options = $.extend( {}, options );

	var atOffset, targetWidth, targetHeight, targetOffset, basePosition, dimensions,
		target = $( options.of ),
		within = $.position.getWithinInfo( options.within ),
		scrollInfo = $.position.getScrollInfo( within ),
		collision = ( options.collision || "flip" ).split( " " ),
		offsets = {};

	dimensions = getDimensions( target );
	if ( target[0].preventDefault ) {
		// force left top to allow flipping
		options.at = "left top";
	}
	targetWidth = dimensions.width;
	targetHeight = dimensions.height;
	targetOffset = dimensions.offset;
	// clone to reuse original targetOffset later
	basePosition = $.extend( {}, targetOffset );

	// force my and at to have valid horizontal and vertical positions
	// if a value is missing or invalid, it will be converted to center
	$.each( [ "my", "at" ], function() {
		var pos = ( options[ this ] || "" ).split( " " ),
			horizontalOffset,
			verticalOffset;

		if ( pos.length === 1) {
			pos = rhorizontal.test( pos[ 0 ] ) ?
				pos.concat( [ "center" ] ) :
				rvertical.test( pos[ 0 ] ) ?
					[ "center" ].concat( pos ) :
					[ "center", "center" ];
		}
		pos[ 0 ] = rhorizontal.test( pos[ 0 ] ) ? pos[ 0 ] : "center";
		pos[ 1 ] = rvertical.test( pos[ 1 ] ) ? pos[ 1 ] : "center";

		// calculate offsets
		horizontalOffset = roffset.exec( pos[ 0 ] );
		verticalOffset = roffset.exec( pos[ 1 ] );
		offsets[ this ] = [
			horizontalOffset ? horizontalOffset[ 0 ] : 0,
			verticalOffset ? verticalOffset[ 0 ] : 0
		];

		// reduce to just the positions without the offsets
		options[ this ] = [
			rposition.exec( pos[ 0 ] )[ 0 ],
			rposition.exec( pos[ 1 ] )[ 0 ]
		];
	});

	// normalize collision option
	if ( collision.length === 1 ) {
		collision[ 1 ] = collision[ 0 ];
	}

	if ( options.at[ 0 ] === "right" ) {
		basePosition.left += targetWidth;
	} else if ( options.at[ 0 ] === "center" ) {
		basePosition.left += targetWidth / 2;
	}

	if ( options.at[ 1 ] === "bottom" ) {
		basePosition.top += targetHeight;
	} else if ( options.at[ 1 ] === "center" ) {
		basePosition.top += targetHeight / 2;
	}

	atOffset = getOffsets( offsets.at, targetWidth, targetHeight );
	basePosition.left += atOffset[ 0 ];
	basePosition.top += atOffset[ 1 ];

	return this.each(function() {
		var collisionPosition, using,
			elem = $( this ),
			elemWidth = elem.outerWidth(),
			elemHeight = elem.outerHeight(),
			marginLeft = parseCss( this, "marginLeft" ),
			marginTop = parseCss( this, "marginTop" ),
			collisionWidth = elemWidth + marginLeft + parseCss( this, "marginRight" ) + scrollInfo.width,
			collisionHeight = elemHeight + marginTop + parseCss( this, "marginBottom" ) + scrollInfo.height,
			position = $.extend( {}, basePosition ),
			myOffset = getOffsets( offsets.my, elem.outerWidth(), elem.outerHeight() );

		if ( options.my[ 0 ] === "right" ) {
			position.left -= elemWidth;
		} else if ( options.my[ 0 ] === "center" ) {
			position.left -= elemWidth / 2;
		}

		if ( options.my[ 1 ] === "bottom" ) {
			position.top -= elemHeight;
		} else if ( options.my[ 1 ] === "center" ) {
			position.top -= elemHeight / 2;
		}

		position.left += myOffset[ 0 ];
		position.top += myOffset[ 1 ];

		// if the browser doesn't support fractions, then round for consistent results
		if ( !$.support.offsetFractions ) {
			position.left = round( position.left );
			position.top = round( position.top );
		}

		collisionPosition = {
			marginLeft: marginLeft,
			marginTop: marginTop
		};

		$.each( [ "left", "top" ], function( i, dir ) {
			if ( $.ui.position[ collision[ i ] ] ) {
				$.ui.position[ collision[ i ] ][ dir ]( position, {
					targetWidth: targetWidth,
					targetHeight: targetHeight,
					elemWidth: elemWidth,
					elemHeight: elemHeight,
					collisionPosition: collisionPosition,
					collisionWidth: collisionWidth,
					collisionHeight: collisionHeight,
					offset: [ atOffset[ 0 ] + myOffset[ 0 ], atOffset [ 1 ] + myOffset[ 1 ] ],
					my: options.my,
					at: options.at,
					within: within,
					elem : elem
				});
			}
		});

		if ( options.using ) {
			// adds feedback as second argument to using callback, if present
			using = function( props ) {
				var left = targetOffset.left - position.left,
					right = left + targetWidth - elemWidth,
					top = targetOffset.top - position.top,
					bottom = top + targetHeight - elemHeight,
					feedback = {
						target: {
							element: target,
							left: targetOffset.left,
							top: targetOffset.top,
							width: targetWidth,
							height: targetHeight
						},
						element: {
							element: elem,
							left: position.left,
							top: position.top,
							width: elemWidth,
							height: elemHeight
						},
						horizontal: right < 0 ? "left" : left > 0 ? "right" : "center",
						vertical: bottom < 0 ? "top" : top > 0 ? "bottom" : "middle"
					};
				if ( targetWidth < elemWidth && abs( left + right ) < targetWidth ) {
					feedback.horizontal = "center";
				}
				if ( targetHeight < elemHeight && abs( top + bottom ) < targetHeight ) {
					feedback.vertical = "middle";
				}
				if ( max( abs( left ), abs( right ) ) > max( abs( top ), abs( bottom ) ) ) {
					feedback.important = "horizontal";
				} else {
					feedback.important = "vertical";
				}
				options.using.call( this, props, feedback );
			};
		}

		elem.offset( $.extend( position, { using: using } ) );
	});
};

$.ui.position = {
	fit: {
		left: function( position, data ) {
			var within = data.within,
				withinOffset = within.isWindow ? within.scrollLeft : within.offset.left,
				outerWidth = within.width,
				collisionPosLeft = position.left - data.collisionPosition.marginLeft,
				overLeft = withinOffset - collisionPosLeft,
				overRight = collisionPosLeft + data.collisionWidth - outerWidth - withinOffset,
				newOverRight;

			// element is wider than within
			if ( data.collisionWidth > outerWidth ) {
				// element is initially over the left side of within
				if ( overLeft > 0 && overRight <= 0 ) {
					newOverRight = position.left + overLeft + data.collisionWidth - outerWidth - withinOffset;
					position.left += overLeft - newOverRight;
				// element is initially over right side of within
				} else if ( overRight > 0 && overLeft <= 0 ) {
					position.left = withinOffset;
				// element is initially over both left and right sides of within
				} else {
					if ( overLeft > overRight ) {
						position.left = withinOffset + outerWidth - data.collisionWidth;
					} else {
						position.left = withinOffset;
					}
				}
			// too far left -> align with left edge
			} else if ( overLeft > 0 ) {
				position.left += overLeft;
			// too far right -> align with right edge
			} else if ( overRight > 0 ) {
				position.left -= overRight;
			// adjust based on position and margin
			} else {
				position.left = max( position.left - collisionPosLeft, position.left );
			}
		},
		top: function( position, data ) {
			var within = data.within,
				withinOffset = within.isWindow ? within.scrollTop : within.offset.top,
				outerHeight = data.within.height,
				collisionPosTop = position.top - data.collisionPosition.marginTop,
				overTop = withinOffset - collisionPosTop,
				overBottom = collisionPosTop + data.collisionHeight - outerHeight - withinOffset,
				newOverBottom;

			// element is taller than within
			if ( data.collisionHeight > outerHeight ) {
				// element is initially over the top of within
				if ( overTop > 0 && overBottom <= 0 ) {
					newOverBottom = position.top + overTop + data.collisionHeight - outerHeight - withinOffset;
					position.top += overTop - newOverBottom;
				// element is initially over bottom of within
				} else if ( overBottom > 0 && overTop <= 0 ) {
					position.top = withinOffset;
				// element is initially over both top and bottom of within
				} else {
					if ( overTop > overBottom ) {
						position.top = withinOffset + outerHeight - data.collisionHeight;
					} else {
						position.top = withinOffset;
					}
				}
			// too far up -> align with top
			} else if ( overTop > 0 ) {
				position.top += overTop;
			// too far down -> align with bottom edge
			} else if ( overBottom > 0 ) {
				position.top -= overBottom;
			// adjust based on position and margin
			} else {
				position.top = max( position.top - collisionPosTop, position.top );
			}
		}
	},
	flip: {
		left: function( position, data ) {
			var within = data.within,
				withinOffset = within.offset.left + within.scrollLeft,
				outerWidth = within.width,
				offsetLeft = within.isWindow ? within.scrollLeft : within.offset.left,
				collisionPosLeft = position.left - data.collisionPosition.marginLeft,
				overLeft = collisionPosLeft - offsetLeft,
				overRight = collisionPosLeft + data.collisionWidth - outerWidth - offsetLeft,
				myOffset = data.my[ 0 ] === "left" ?
					-data.elemWidth :
					data.my[ 0 ] === "right" ?
						data.elemWidth :
						0,
				atOffset = data.at[ 0 ] === "left" ?
					data.targetWidth :
					data.at[ 0 ] === "right" ?
						-data.targetWidth :
						0,
				offset = -2 * data.offset[ 0 ],
				newOverRight,
				newOverLeft;

			if ( overLeft < 0 ) {
				newOverRight = position.left + myOffset + atOffset + offset + data.collisionWidth - outerWidth - withinOffset;
				if ( newOverRight < 0 || newOverRight < abs( overLeft ) ) {
					position.left += myOffset + atOffset + offset;
				}
			}
			else if ( overRight > 0 ) {
				newOverLeft = position.left - data.collisionPosition.marginLeft + myOffset + atOffset + offset - offsetLeft;
				if ( newOverLeft > 0 || abs( newOverLeft ) < overRight ) {
					position.left += myOffset + atOffset + offset;
				}
			}
		},
		top: function( position, data ) {
			var within = data.within,
				withinOffset = within.offset.top + within.scrollTop,
				outerHeight = within.height,
				offsetTop = within.isWindow ? within.scrollTop : within.offset.top,
				collisionPosTop = position.top - data.collisionPosition.marginTop,
				overTop = collisionPosTop - offsetTop,
				overBottom = collisionPosTop + data.collisionHeight - outerHeight - offsetTop,
				top = data.my[ 1 ] === "top",
				myOffset = top ?
					-data.elemHeight :
					data.my[ 1 ] === "bottom" ?
						data.elemHeight :
						0,
				atOffset = data.at[ 1 ] === "top" ?
					data.targetHeight :
					data.at[ 1 ] === "bottom" ?
						-data.targetHeight :
						0,
				offset = -2 * data.offset[ 1 ],
				newOverTop,
				newOverBottom;
			if ( overTop < 0 ) {
				newOverBottom = position.top + myOffset + atOffset + offset + data.collisionHeight - outerHeight - withinOffset;
				if ( ( position.top + myOffset + atOffset + offset) > overTop && ( newOverBottom < 0 || newOverBottom < abs( overTop ) ) ) {
					position.top += myOffset + atOffset + offset;
				}
			}
			else if ( overBottom > 0 ) {
				newOverTop = position.top -  data.collisionPosition.marginTop + myOffset + atOffset + offset - offsetTop;
				if ( ( position.top + myOffset + atOffset + offset) > overBottom && ( newOverTop > 0 || abs( newOverTop ) < overBottom ) ) {
					position.top += myOffset + atOffset + offset;
				}
			}
		}
	},
	flipfit: {
		left: function() {
			$.ui.position.flip.left.apply( this, arguments );
			$.ui.position.fit.left.apply( this, arguments );
		},
		top: function() {
			$.ui.position.flip.top.apply( this, arguments );
			$.ui.position.fit.top.apply( this, arguments );
		}
	}
};

// fraction support test
(function () {
	var testElement, testElementParent, testElementStyle, offsetLeft, i,
		body = document.getElementsByTagName( "body" )[ 0 ],
		div = document.createElement( "div" );

	//Create a "fake body" for testing based on method used in jQuery.support
	testElement = document.createElement( body ? "div" : "body" );
	testElementStyle = {
		visibility: "hidden",
		width: 0,
		height: 0,
		border: 0,
		margin: 0,
		background: "none"
	};
	if ( body ) {
		$.extend( testElementStyle, {
			position: "absolute",
			left: "-1000px",
			top: "-1000px"
		});
	}
	for ( i in testElementStyle ) {
		testElement.style[ i ] = testElementStyle[ i ];
	}
	testElement.appendChild( div );
	testElementParent = body || document.documentElement;
	testElementParent.insertBefore( testElement, testElementParent.firstChild );

	div.style.cssText = "position: absolute; left: 10.7432222px;";

	offsetLeft = $( div ).offset().left;
	$.support.offsetFractions = offsetLeft > 10 && offsetLeft < 11;

	testElement.innerHTML = "";
	testElementParent.removeChild( testElement );
})();

}( jQuery ) );
(function( $, undefined ) {

// number of pages in a slider
// (how many times can you page up/down to go through the whole range)
var numPages = 5;

$.widget( "ui.slider", $.ui.mouse, {
	version: "1.10.3",
	widgetEventPrefix: "slide",

	options: {
		animate: false,
		distance: 0,
		max: 100,
		min: 0,
		orientation: "horizontal",
		range: false,
		step: 1,
		value: 0,
		values: null,

		// callbacks
		change: null,
		slide: null,
		start: null,
		stop: null
	},

	_create: function() {
		this._keySliding = false;
		this._mouseSliding = false;
		this._animateOff = true;
		this._handleIndex = null;
		this._detectOrientation();
		this._mouseInit();

		this.element
			.addClass( "ui-slider" +
				" ui-slider-" + this.orientation +
				" ui-widget" +
				" ui-widget-content" +
				" ui-corner-all");

		this._refresh();
		this._setOption( "disabled", this.options.disabled );

		this._animateOff = false;
	},

	_refresh: function() {
		this._createRange();
		this._createHandles();
		this._setupEvents();
		this._refreshValue();
	},

	_createHandles: function() {
		var i, handleCount,
			options = this.options,
			existingHandles = this.element.find( ".ui-slider-handle" ).addClass( "ui-state-default ui-corner-all" ),
			handle = "<a class='ui-slider-handle ui-state-default ui-corner-all' href='#'></a>",
			handles = [];

		handleCount = ( options.values && options.values.length ) || 1;

		if ( existingHandles.length > handleCount ) {
			existingHandles.slice( handleCount ).remove();
			existingHandles = existingHandles.slice( 0, handleCount );
		}

		for ( i = existingHandles.length; i < handleCount; i++ ) {
			handles.push( handle );
		}

		this.handles = existingHandles.add( $( handles.join( "" ) ).appendTo( this.element ) );

		this.handle = this.handles.eq( 0 );

		this.handles.each(function( i ) {
			$( this ).data( "ui-slider-handle-index", i );
		});
	},

	_createRange: function() {
		var options = this.options,
			classes = "";

		if ( options.range ) {
			if ( options.range === true ) {
				if ( !options.values ) {
					options.values = [ this._valueMin(), this._valueMin() ];
				} else if ( options.values.length && options.values.length !== 2 ) {
					options.values = [ options.values[0], options.values[0] ];
				} else if ( $.isArray( options.values ) ) {
					options.values = options.values.slice(0);
				}
			}

			if ( !this.range || !this.range.length ) {
				this.range = $( "<div></div>" )
					.appendTo( this.element );

				classes = "ui-slider-range" +
				// note: this isn't the most fittingly semantic framework class for this element,
				// but worked best visually with a variety of themes
				" ui-widget-header ui-corner-all";
			} else {
				this.range.removeClass( "ui-slider-range-min ui-slider-range-max" )
					// Handle range switching from true to min/max
					.css({
						"left": "",
						"bottom": ""
					});
			}

			this.range.addClass( classes +
				( ( options.range === "min" || options.range === "max" ) ? " ui-slider-range-" + options.range : "" ) );
		} else {
			this.range = $([]);
		}
	},

	_setupEvents: function() {
		var elements = this.handles.add( this.range ).filter( "a" );
		this._off( elements );
		this._on( elements, this._handleEvents );
		this._hoverable( elements );
		this._focusable( elements );
	},

	_destroy: function() {
		this.handles.remove();
		this.range.remove();

		this.element
			.removeClass( "ui-slider" +
				" ui-slider-horizontal" +
				" ui-slider-vertical" +
				" ui-widget" +
				" ui-widget-content" +
				" ui-corner-all" );

		this._mouseDestroy();
	},

	_mouseCapture: function( event ) {
		var position, normValue, distance, closestHandle, index, allowed, offset, mouseOverHandle,
			that = this,
			o = this.options;

		if ( o.disabled ) {
			return false;
		}

		this.elementSize = {
			width: this.element.outerWidth(),
			height: this.element.outerHeight()
		};
		this.elementOffset = this.element.offset();

		position = { x: event.pageX, y: event.pageY };
		normValue = this._normValueFromMouse( position );
		distance = this._valueMax() - this._valueMin() + 1;
		this.handles.each(function( i ) {
			var thisDistance = Math.abs( normValue - that.values(i) );
			if (( distance > thisDistance ) ||
				( distance === thisDistance &&
					(i === that._lastChangedValue || that.values(i) === o.min ))) {
				distance = thisDistance;
				closestHandle = $( this );
				index = i;
			}
		});

		allowed = this._start( event, index );
		if ( allowed === false ) {
			return false;
		}
		this._mouseSliding = true;

		this._handleIndex = index;

		closestHandle
			.addClass( "ui-state-active" )
			.focus();

		offset = closestHandle.offset();
		mouseOverHandle = !$( event.target ).parents().addBack().is( ".ui-slider-handle" );
		this._clickOffset = mouseOverHandle ? { left: 0, top: 0 } : {
			left: event.pageX - offset.left - ( closestHandle.width() / 2 ),
			top: event.pageY - offset.top -
				( closestHandle.height() / 2 ) -
				( parseInt( closestHandle.css("borderTopWidth"), 10 ) || 0 ) -
				( parseInt( closestHandle.css("borderBottomWidth"), 10 ) || 0) +
				( parseInt( closestHandle.css("marginTop"), 10 ) || 0)
		};

		if ( !this.handles.hasClass( "ui-state-hover" ) ) {
			this._slide( event, index, normValue );
		}
		this._animateOff = true;
		return true;
	},

	_mouseStart: function() {
		return true;
	},

	_mouseDrag: function( event ) {
		var position = { x: event.pageX, y: event.pageY },
			normValue = this._normValueFromMouse( position );

		this._slide( event, this._handleIndex, normValue );

		return false;
	},

	_mouseStop: function( event ) {
		this.handles.removeClass( "ui-state-active" );
		this._mouseSliding = false;

		this._stop( event, this._handleIndex );
		this._change( event, this._handleIndex );

		this._handleIndex = null;
		this._clickOffset = null;
		this._animateOff = false;

		return false;
	},

	_detectOrientation: function() {
		this.orientation = ( this.options.orientation === "vertical" ) ? "vertical" : "horizontal";
	},

	_normValueFromMouse: function( position ) {
		var pixelTotal,
			pixelMouse,
			percentMouse,
			valueTotal,
			valueMouse;

		if ( this.orientation === "horizontal" ) {
			pixelTotal = this.elementSize.width;
			pixelMouse = position.x - this.elementOffset.left - ( this._clickOffset ? this._clickOffset.left : 0 );
		} else {
			pixelTotal = this.elementSize.height;
			pixelMouse = position.y - this.elementOffset.top - ( this._clickOffset ? this._clickOffset.top : 0 );
		}

		percentMouse = ( pixelMouse / pixelTotal );
		if ( percentMouse > 1 ) {
			percentMouse = 1;
		}
		if ( percentMouse < 0 ) {
			percentMouse = 0;
		}
		if ( this.orientation === "vertical" ) {
			percentMouse = 1 - percentMouse;
		}

		valueTotal = this._valueMax() - this._valueMin();
		valueMouse = this._valueMin() + percentMouse * valueTotal;

		return this._trimAlignValue( valueMouse );
	},

	_start: function( event, index ) {
		var uiHash = {
			handle: this.handles[ index ],
			value: this.value()
		};
		if ( this.options.values && this.options.values.length ) {
			uiHash.value = this.values( index );
			uiHash.values = this.values();
		}
		return this._trigger( "start", event, uiHash );
	},

	_slide: function( event, index, newVal ) {
		var otherVal,
			newValues,
			allowed;

		if ( this.options.values && this.options.values.length ) {
			otherVal = this.values( index ? 0 : 1 );

			if ( ( this.options.values.length === 2 && this.options.range === true ) &&
					( ( index === 0 && newVal > otherVal) || ( index === 1 && newVal < otherVal ) )
				) {
				newVal = otherVal;
			}

			if ( newVal !== this.values( index ) ) {
				newValues = this.values();
				newValues[ index ] = newVal;
				// A slide can be canceled by returning false from the slide callback
				allowed = this._trigger( "slide", event, {
					handle: this.handles[ index ],
					value: newVal,
					values: newValues
				} );
				otherVal = this.values( index ? 0 : 1 );
				if ( allowed !== false ) {
					this.values( index, newVal, true );
				}
			}
		} else {
			if ( newVal !== this.value() ) {
				// A slide can be canceled by returning false from the slide callback
				allowed = this._trigger( "slide", event, {
					handle: this.handles[ index ],
					value: newVal
				} );
				if ( allowed !== false ) {
					this.value( newVal );
				}
			}
		}
	},

	_stop: function( event, index ) {
		var uiHash = {
			handle: this.handles[ index ],
			value: this.value()
		};
		if ( this.options.values && this.options.values.length ) {
			uiHash.value = this.values( index );
			uiHash.values = this.values();
		}

		this._trigger( "stop", event, uiHash );
	},

	_change: function( event, index ) {
		if ( !this._keySliding && !this._mouseSliding ) {
			var uiHash = {
				handle: this.handles[ index ],
				value: this.value()
			};
			if ( this.options.values && this.options.values.length ) {
				uiHash.value = this.values( index );
				uiHash.values = this.values();
			}

			//store the last changed value index for reference when handles overlap
			this._lastChangedValue = index;

			this._trigger( "change", event, uiHash );
		}
	},

	value: function( newValue ) {
		if ( arguments.length ) {
			this.options.value = this._trimAlignValue( newValue );
			this._refreshValue();
			this._change( null, 0 );
			return;
		}

		return this._value();
	},

	values: function( index, newValue ) {
		var vals,
			newValues,
			i;

		if ( arguments.length > 1 ) {
			this.options.values[ index ] = this._trimAlignValue( newValue );
			this._refreshValue();
			this._change( null, index );
			return;
		}

		if ( arguments.length ) {
			if ( $.isArray( arguments[ 0 ] ) ) {
				vals = this.options.values;
				newValues = arguments[ 0 ];
				for ( i = 0; i < vals.length; i += 1 ) {
					vals[ i ] = this._trimAlignValue( newValues[ i ] );
					this._change( null, i );
				}
				this._refreshValue();
			} else {
				if ( this.options.values && this.options.values.length ) {
					return this._values( index );
				} else {
					return this.value();
				}
			}
		} else {
			return this._values();
		}
	},

	_setOption: function( key, value ) {
		var i,
			valsLength = 0;

		if ( key === "range" && this.options.range === true ) {
			if ( value === "min" ) {
				this.options.value = this._values( 0 );
				this.options.values = null;
			} else if ( value === "max" ) {
				this.options.value = this._values( this.options.values.length-1 );
				this.options.values = null;
			}
		}

		if ( $.isArray( this.options.values ) ) {
			valsLength = this.options.values.length;
		}

		$.Widget.prototype._setOption.apply( this, arguments );

		switch ( key ) {
			case "orientation":
				this._detectOrientation();
				this.element
					.removeClass( "ui-slider-horizontal ui-slider-vertical" )
					.addClass( "ui-slider-" + this.orientation );
				this._refreshValue();
				break;
			case "value":
				this._animateOff = true;
				this._refreshValue();
				this._change( null, 0 );
				this._animateOff = false;
				break;
			case "values":
				this._animateOff = true;
				this._refreshValue();
				for ( i = 0; i < valsLength; i += 1 ) {
					this._change( null, i );
				}
				this._animateOff = false;
				break;
			case "min":
			case "max":
				this._animateOff = true;
				this._refreshValue();
				this._animateOff = false;
				break;
			case "range":
				this._animateOff = true;
				this._refresh();
				this._animateOff = false;
				break;
		}
	},

	//internal value getter
	// _value() returns value trimmed by min and max, aligned by step
	_value: function() {
		var val = this.options.value;
		val = this._trimAlignValue( val );

		return val;
	},

	//internal values getter
	// _values() returns array of values trimmed by min and max, aligned by step
	// _values( index ) returns single value trimmed by min and max, aligned by step
	_values: function( index ) {
		var val,
			vals,
			i;

		if ( arguments.length ) {
			val = this.options.values[ index ];
			val = this._trimAlignValue( val );

			return val;
		} else if ( this.options.values && this.options.values.length ) {
			// .slice() creates a copy of the array
			// this copy gets trimmed by min and max and then returned
			vals = this.options.values.slice();
			for ( i = 0; i < vals.length; i+= 1) {
				vals[ i ] = this._trimAlignValue( vals[ i ] );
			}

			return vals;
		} else {
			return [];
		}
	},

	// returns the step-aligned value that val is closest to, between (inclusive) min and max
	_trimAlignValue: function( val ) {
		if ( val <= this._valueMin() ) {
			return this._valueMin();
		}
		if ( val >= this._valueMax() ) {
			return this._valueMax();
		}
		var step = ( this.options.step > 0 ) ? this.options.step : 1,
			valModStep = (val - this._valueMin()) % step,
			alignValue = val - valModStep;

		if ( Math.abs(valModStep) * 2 >= step ) {
			alignValue += ( valModStep > 0 ) ? step : ( -step );
		}

		// Since JavaScript has problems with large floats, round
		// the final value to 5 digits after the decimal point (see #4124)
		return parseFloat( alignValue.toFixed(5) );
	},

	_valueMin: function() {
		return this.options.min;
	},

	_valueMax: function() {
		return this.options.max;
	},

	_refreshValue: function() {
		var lastValPercent, valPercent, value, valueMin, valueMax,
			oRange = this.options.range,
			o = this.options,
			that = this,
			animate = ( !this._animateOff ) ? o.animate : false,
			_set = {};

		if ( this.options.values && this.options.values.length ) {
			this.handles.each(function( i ) {
				valPercent = ( that.values(i) - that._valueMin() ) / ( that._valueMax() - that._valueMin() ) * 100;
				_set[ that.orientation === "horizontal" ? "left" : "bottom" ] = valPercent + "%";
				$( this ).stop( 1, 1 )[ animate ? "animate" : "css" ]( _set, o.animate );
				if ( that.options.range === true ) {
					if ( that.orientation === "horizontal" ) {
						if ( i === 0 ) {
							that.range.stop( 1, 1 )[ animate ? "animate" : "css" ]( { left: valPercent + "%" }, o.animate );
						}
						if ( i === 1 ) {
							that.range[ animate ? "animate" : "css" ]( { width: ( valPercent - lastValPercent ) + "%" }, { queue: false, duration: o.animate } );
						}
					} else {
						if ( i === 0 ) {
							that.range.stop( 1, 1 )[ animate ? "animate" : "css" ]( { bottom: ( valPercent ) + "%" }, o.animate );
						}
						if ( i === 1 ) {
							that.range[ animate ? "animate" : "css" ]( { height: ( valPercent - lastValPercent ) + "%" }, { queue: false, duration: o.animate } );
						}
					}
				}
				lastValPercent = valPercent;
			});
		} else {
			value = this.value();
			valueMin = this._valueMin();
			valueMax = this._valueMax();
			valPercent = ( valueMax !== valueMin ) ?
					( value - valueMin ) / ( valueMax - valueMin ) * 100 :
					0;
			_set[ this.orientation === "horizontal" ? "left" : "bottom" ] = valPercent + "%";
			this.handle.stop( 1, 1 )[ animate ? "animate" : "css" ]( _set, o.animate );

			if ( oRange === "min" && this.orientation === "horizontal" ) {
				this.range.stop( 1, 1 )[ animate ? "animate" : "css" ]( { width: valPercent + "%" }, o.animate );
			}
			if ( oRange === "max" && this.orientation === "horizontal" ) {
				this.range[ animate ? "animate" : "css" ]( { width: ( 100 - valPercent ) + "%" }, { queue: false, duration: o.animate } );
			}
			if ( oRange === "min" && this.orientation === "vertical" ) {
				this.range.stop( 1, 1 )[ animate ? "animate" : "css" ]( { height: valPercent + "%" }, o.animate );
			}
			if ( oRange === "max" && this.orientation === "vertical" ) {
				this.range[ animate ? "animate" : "css" ]( { height: ( 100 - valPercent ) + "%" }, { queue: false, duration: o.animate } );
			}
		}
	},

	_handleEvents: {
		keydown: function( event ) {
			/*jshint maxcomplexity:25*/
			var allowed, curVal, newVal, step,
				index = $( event.target ).data( "ui-slider-handle-index" );

			switch ( event.keyCode ) {
				case $.ui.keyCode.HOME:
				case $.ui.keyCode.END:
				case $.ui.keyCode.PAGE_UP:
				case $.ui.keyCode.PAGE_DOWN:
				case $.ui.keyCode.UP:
				case $.ui.keyCode.RIGHT:
				case $.ui.keyCode.DOWN:
				case $.ui.keyCode.LEFT:
					event.preventDefault();
					if ( !this._keySliding ) {
						this._keySliding = true;
						$( event.target ).addClass( "ui-state-active" );
						allowed = this._start( event, index );
						if ( allowed === false ) {
							return;
						}
					}
					break;
			}

			step = this.options.step;
			if ( this.options.values && this.options.values.length ) {
				curVal = newVal = this.values( index );
			} else {
				curVal = newVal = this.value();
			}

			switch ( event.keyCode ) {
				case $.ui.keyCode.HOME:
					newVal = this._valueMin();
					break;
				case $.ui.keyCode.END:
					newVal = this._valueMax();
					break;
				case $.ui.keyCode.PAGE_UP:
					newVal = this._trimAlignValue( curVal + ( (this._valueMax() - this._valueMin()) / numPages ) );
					break;
				case $.ui.keyCode.PAGE_DOWN:
					newVal = this._trimAlignValue( curVal - ( (this._valueMax() - this._valueMin()) / numPages ) );
					break;
				case $.ui.keyCode.UP:
				case $.ui.keyCode.RIGHT:
					if ( curVal === this._valueMax() ) {
						return;
					}
					newVal = this._trimAlignValue( curVal + step );
					break;
				case $.ui.keyCode.DOWN:
				case $.ui.keyCode.LEFT:
					if ( curVal === this._valueMin() ) {
						return;
					}
					newVal = this._trimAlignValue( curVal - step );
					break;
			}

			this._slide( event, index, newVal );
		},
		click: function( event ) {
			event.preventDefault();
		},
		keyup: function( event ) {
			var index = $( event.target ).data( "ui-slider-handle-index" );

			if ( this._keySliding ) {
				this._keySliding = false;
				this._stop( event, index );
				this._change( event, index );
				$( event.target ).removeClass( "ui-state-active" );
			}
		}
	}

});

}(jQuery));

//     Underscore.js 1.4.4
//     http://underscorejs.org
//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var push             = ArrayProto.push,
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
  _.VERSION = '1.4.4';

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
      for (var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
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
      results[results.length] = iterator.call(context, value, index, list);
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
      if (iterator.call(context, value, index, list)) results[results.length] = value;
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
    if (_.isEmpty(attrs)) return first ? null : [];
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
  // See: https://bugs.webkit.org/show_bug.cgi?id=80797
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
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

  // Shuffle an array.
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

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        index : index,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index < right.index ? -1 : 1;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(obj, value, context, behavior) {
    var result = {};
    var iterator = lookupIterator(value || _.identity);
    each(obj, function(value, index) {
      var key = iterator.call(context, value, index, obj);
      behavior(result, key, value);
    });
    return result;
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key, value) {
      (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
    });
  };

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key) {
      if (!_.has(result, key)) result[key] = 0;
      result[key]++;
    });
  };

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

  // Safely convert anything iterable into a real, live array.
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
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
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
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
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
    each(input, function(value) {
      if (_.isArray(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Return a completely flattened version of an array.
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
    return _.uniq(concat.apply(ArrayProto, arguments));
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
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(args, "" + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, l = list.length; i < l; i++) {
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
    var i = 0, l = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, l + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < l; i++) if (array[i] === item) return i;
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

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    var args = slice.call(arguments, 2);
    return function() {
      return func.apply(context, args.concat(slice.call(arguments)));
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
    if (funcs.length === 0) funcs = _.functions(obj);
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
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, result;
    var previous = 0;
    var later = function() {
      previous = new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout) {
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
    var timeout, result;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) result = func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
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
    if (times <= 0) return func();
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
    for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var values = [];
    for (var key in obj) if (_.has(obj, key)) values.push(obj[key]);
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var pairs = [];
    for (var key in obj) if (_.has(obj, key)) pairs.push([key, obj[key]]);
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    for (var key in obj) if (_.has(obj, key)) result[obj[key]] = key;
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
          if (obj[prop] == null) obj[prop] = source[prop];
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
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
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
      // Objects with different constructors are not equivalent, but `Object`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                               _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
        return false;
      }
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
    var accum = Array(n);
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
      "'": '&#x27;',
      '/': '&#x2F;'
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

  // If the value of the named property is a function then invoke it;
  // otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return null;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
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

}).call(this);

//     Backbone.js 0.9.10

//     (c) 2010-2012 Jeremy Ashkenas, DocumentCloud Inc.
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org

(function(){

  // Initial Setup
  // -------------

  // Save a reference to the global object (`window` in the browser, `exports`
  // on the server).
  var root = this;

  // Save the previous value of the `Backbone` variable, so that it can be
  // restored later on, if `noConflict` is used.
  var previousBackbone = root.Backbone;

  // Create a local reference to array methods.
  var array = [];
  var push = array.push;
  var slice = array.slice;
  var splice = array.splice;

  // The top-level namespace. All public Backbone classes and modules will
  // be attached to this. Exported for both CommonJS and the browser.
  var Backbone;
  if (typeof exports !== 'undefined') {
    Backbone = exports;
  } else {
    Backbone = root.Backbone = {};
  }

  // Current version of the library. Keep in sync with `package.json`.
  Backbone.VERSION = '0.9.10';

  // Require Underscore, if we're on the server, and it's not already present.
  var _ = root._;
  if (!_ && (typeof require !== 'undefined')) _ = require('underscore');

  // For Backbone's purposes, jQuery, Zepto, or Ender owns the `$` variable.
  Backbone.$ = root.jQuery || root.Zepto || root.ender;

  // Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
  // to its previous owner. Returns a reference to this Backbone object.
  Backbone.noConflict = function() {
    root.Backbone = previousBackbone;
    return this;
  };

  // Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
  // will fake `"PUT"` and `"DELETE"` requests via the `_method` parameter and
  // set a `X-Http-Method-Override` header.
  Backbone.emulateHTTP = false;

  // Turn on `emulateJSON` to support legacy servers that can't deal with direct
  // `application/json` requests ... will encode the body as
  // `application/x-www-form-urlencoded` instead and will send the model in a
  // form param named `model`.
  Backbone.emulateJSON = false;

  // Backbone.Events
  // ---------------

  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;

  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{change: action}`
  // in terms of the existing API.
  var eventsApi = function(obj, action, name, rest) {
    if (!name) return true;
    if (typeof name === 'object') {
      for (var key in name) {
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
    } else if (eventSplitter.test(name)) {
      var names = name.split(eventSplitter);
      for (var i = 0, l = names.length; i < l; i++) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
    } else {
      return true;
    }
  };

  // Optimized internal dispatch function for triggering events. Tries to
  // keep the usual cases speedy (most Backbone events have 3 arguments).
  var triggerEvents = function(events, args) {
    var ev, i = -1, l = events.length;
    switch (args.length) {
    case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx);
    return;
    case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, args[0]);
    return;
    case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, args[0], args[1]);
    return;
    case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, args[0], args[1], args[2]);
    return;
    default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
    }
  };

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

    // Bind one or more space separated events, or an events map,
    // to a `callback` function. Passing `"all"` will bind the callback to
    // all events fired.
    on: function(name, callback, context) {
      if (!(eventsApi(this, 'on', name, [callback, context]) && callback)) return this;
      this._events || (this._events = {});
      var list = this._events[name] || (this._events[name] = []);
      list.push({callback: callback, context: context, ctx: context || this});
      return this;
    },

    // Bind events to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once: function(name, callback, context) {
      if (!(eventsApi(this, 'once', name, [callback, context]) && callback)) return this;
      var self = this;
      var once = _.once(function() {
        self.off(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
      this.on(name, once, context);
      return this;
    },

    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `name` is null, removes all bound
    // callbacks for all events.
    off: function(name, callback, context) {
      var list, ev, events, names, i, l, j, k;
      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
      if (!name && !callback && !context) {
        this._events = {};
        return this;
      }

      names = name ? [name] : _.keys(this._events);
      for (i = 0, l = names.length; i < l; i++) {
        name = names[i];
        if (list = this._events[name]) {
          events = [];
          if (callback || context) {
            for (j = 0, k = list.length; j < k; j++) {
              ev = list[j];
              if ((callback && callback !== ev.callback &&
                               callback !== ev.callback._callback) ||
                  (context && context !== ev.context)) {
                events.push(ev);
              }
            }
          }
          this._events[name] = events;
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

    // An inversion-of-control version of `on`. Tell *this* object to listen to
    // an event in another object ... keeping track of what it's listening to.
    listenTo: function(obj, name, callback) {
      var listeners = this._listeners || (this._listeners = {});
      var id = obj._listenerId || (obj._listenerId = _.uniqueId('l'));
      listeners[id] = obj;
      obj.on(name, typeof name === 'object' ? this : callback, this);
      return this;
    },

    // Tell this object to stop listening to either specific events ... or
    // to every object it's currently listening to.
    stopListening: function(obj, name, callback) {
      var listeners = this._listeners;
      if (!listeners) return;
      if (obj) {
        obj.off(name, typeof name === 'object' ? this : callback, this);
        if (!name && !callback) delete listeners[obj._listenerId];
      } else {
        if (typeof name === 'object') callback = this;
        for (var id in listeners) {
          listeners[id].off(name, callback, this);
        }
        this._listeners = {};
      }
      return this;
    }
  };

  // Aliases for backwards compatibility.
  Events.bind   = Events.on;
  Events.unbind = Events.off;

  // Allow the `Backbone` object to serve as a global event bus, for folks who
  // want global "pubsub" in a convenient place.
  _.extend(Backbone, Events);

  // Backbone.Model
  // --------------

  // Create a new model, with defined attributes. A client id (`cid`)
  // is automatically generated and assigned for you.
  var Model = Backbone.Model = function(attributes, options) {
    var defaults;
    var attrs = attributes || {};
    this.cid = _.uniqueId('c');
    this.attributes = {};
    if (options && options.collection) this.collection = options.collection;
    if (options && options.parse) attrs = this.parse(attrs, options) || {};
    if (defaults = _.result(this, 'defaults')) {
      attrs = _.defaults({}, attrs, defaults);
    }
    this.set(attrs, options);
    this.changed = {};
    this.initialize.apply(this, arguments);
  };

  // Attach all inheritable methods to the Model prototype.
  _.extend(Model.prototype, Events, {

    // A hash of attributes whose current and previous value differ.
    changed: null,

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

    // Proxy `Backbone.sync` by default.
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

    // ----------------------------------------------------------------------

    // Set a hash of model attributes on the object, firing `"change"` unless
    // you choose to silence it.
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

    // Remove an attribute from the model, firing `"change"` unless you choose
    // to silence it. `unset` is a noop if the attribute doesn't exist.
    unset: function(attr, options) {
      return this.set(attr, void 0, _.extend({}, options, {unset: true}));
    },

    // Clear all attributes on the model, firing `"change"` unless you choose
    // to silence it.
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

    // ---------------------------------------------------------------------

    // Fetch the model from the server. If the server's representation of the
    // model differs from its current attributes, they will be overriden,
    // triggering a `"change"` event.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var success = options.success;
      options.success = function(model, resp, options) {
        if (!model.set(model.parse(resp, options), options)) return false;
        if (success) success(model, resp, options);
      };
      return this.sync('read', this, options);
    },

    // Set a hash of model attributes, and sync the model to the server.
    // If the server returns an attributes hash that differs, the model's
    // state will be `set` again.
    save: function(key, val, options) {
      var attrs, success, method, xhr, attributes = this.attributes;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (key == null || typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      // If we're not waiting and attributes exist, save acts as `set(attr).save(null, opts)`.
      if (attrs && (!options || !options.wait) && !this.set(attrs, options)) return false;

      options = _.extend({validate: true}, options);

      // Do not persist invalid models.
      if (!this._validate(attrs, options)) return false;

      // Set temporary attributes if `{wait: true}`.
      if (attrs && options.wait) {
        this.attributes = _.extend({}, attributes, attrs);
      }

      // After a successful server-side save, the client is (optionally)
      // updated with the server-side state.
      if (options.parse === void 0) options.parse = true;
      success = options.success;
      options.success = function(model, resp, options) {
        // Ensure attributes are restored during synchronous saves.
        model.attributes = attributes;
        var serverAttrs = model.parse(resp, options);
        if (options.wait) serverAttrs = _.extend(attrs || {}, serverAttrs);
        if (_.isObject(serverAttrs) && !model.set(serverAttrs, options)) {
          return false;
        }
        if (success) success(model, resp, options);
      };

      // Finish configuring and sending the Ajax request.
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

      options.success = function(model, resp, options) {
        if (options.wait || model.isNew()) destroy();
        if (success) success(model, resp, options);
      };

      if (this.isNew()) {
        options.success(this, null, options);
        return false;
      }

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
      return !this.validate || !this.validate(this.attributes, options);
    },

    // Run validation against the next complete set of model attributes,
    // returning `true` if all is well. Otherwise, fire a general
    // `"error"` event and call the error callback, if specified.
    _validate: function(attrs, options) {
      if (!options.validate || !this.validate) return true;
      attrs = _.extend({}, this.attributes, attrs);
      var error = this.validationError = this.validate(attrs, options) || null;
      if (!error) return true;
      this.trigger('invalid', this, error, options || {});
      return false;
    }

  });

  // Backbone.Collection
  // -------------------

  // Provides a standard collection class for our sets of models, ordered
  // or unordered. If a `comparator` is specified, the Collection will maintain
  // its models in sort order, as they're added and removed.
  var Collection = Backbone.Collection = function(models, options) {
    options || (options = {});
    if (options.model) this.model = options.model;
    if (options.comparator !== void 0) this.comparator = options.comparator;
    this.models = [];
    this._reset();
    this.initialize.apply(this, arguments);
    if (models) this.reset(models, _.extend({silent: true}, options));
  };

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
      models = _.isArray(models) ? models.slice() : [models];
      options || (options = {});
      var i, l, model, attrs, existing, doSort, add, at, sort, sortAttr;
      add = [];
      at = options.at;
      sort = this.comparator && (at == null) && options.sort != false;
      sortAttr = _.isString(this.comparator) ? this.comparator : null;

      // Turn bare objects into model references, and prevent invalid models
      // from being added.
      for (i = 0, l = models.length; i < l; i++) {
        if (!(model = this._prepareModel(attrs = models[i], options))) {
          this.trigger('invalid', this, attrs, options);
          continue;
        }

        // If a duplicate is found, prevent it from being added and
        // optionally merge it into the existing model.
        if (existing = this.get(model)) {
          if (options.merge) {
            existing.set(attrs === model ? model.attributes : attrs, options);
            if (sort && !doSort && existing.hasChanged(sortAttr)) doSort = true;
          }
          continue;
        }

        // This is a new model, push it to the `add` list.
        add.push(model);

        // Listen to added models' events, and index models for lookup by
        // `id` and by `cid`.
        model.on('all', this._onModelEvent, this);
        this._byId[model.cid] = model;
        if (model.id != null) this._byId[model.id] = model;
      }

      // See if sorting is needed, update `length` and splice in new models.
      if (add.length) {
        if (sort) doSort = true;
        this.length += add.length;
        if (at != null) {
          splice.apply(this.models, [at, 0].concat(add));
        } else {
          push.apply(this.models, add);
        }
      }

      // Silently sort the collection if appropriate.
      if (doSort) this.sort({silent: true});

      if (options.silent) return this;

      // Trigger `add` events.
      for (i = 0, l = add.length; i < l; i++) {
        (model = add[i]).trigger('add', model, this, options);
      }

      // Trigger `sort` if the collection was sorted.
      if (doSort) this.trigger('sort', this, options);

      return this;
    },

    // Remove a model, or a list of models from the set.
    remove: function(models, options) {
      models = _.isArray(models) ? models.slice() : [models];
      options || (options = {});
      var i, l, index, model;
      for (i = 0, l = models.length; i < l; i++) {
        model = this.get(models[i]);
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
      return this;
    },

    // Add a model to the end of the collection.
    push: function(model, options) {
      model = this._prepareModel(model, options);
      this.add(model, _.extend({at: this.length}, options));
      return model;
    },

    // Remove a model from the end of the collection.
    pop: function(options) {
      var model = this.at(this.length - 1);
      this.remove(model, options);
      return model;
    },

    // Add a model to the beginning of the collection.
    unshift: function(model, options) {
      model = this._prepareModel(model, options);
      this.add(model, _.extend({at: 0}, options));
      return model;
    },

    // Remove a model from the beginning of the collection.
    shift: function(options) {
      var model = this.at(0);
      this.remove(model, options);
      return model;
    },

    // Slice out a sub-array of models from the collection.
    slice: function(begin, end) {
      return this.models.slice(begin, end);
    },

    // Get a model from the set by id.
    get: function(obj) {
      if (obj == null) return void 0;
      this._idAttr || (this._idAttr = this.model.prototype.idAttribute);
      return this._byId[obj.id || obj.cid || obj[this._idAttr] || obj];
    },

    // Get the model at the given index.
    at: function(index) {
      return this.models[index];
    },

    // Return models with matching attributes. Useful for simple cases of `filter`.
    where: function(attrs) {
      if (_.isEmpty(attrs)) return [];
      return this.filter(function(model) {
        for (var key in attrs) {
          if (attrs[key] !== model.get(key)) return false;
        }
        return true;
      });
    },

    // Force the collection to re-sort itself. You don't need to call this under
    // normal circumstances, as the set will maintain sort order as each item
    // is added.
    sort: function(options) {
      if (!this.comparator) {
        throw new Error('Cannot sort a set without a comparator');
      }
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

    // Smartly update a collection with a change set of models, adding,
    // removing, and merging as necessary.
    update: function(models, options) {
      options = _.extend({add: true, merge: true, remove: true}, options);
      if (options.parse) models = this.parse(models, options);
      var model, i, l, existing;
      var add = [], remove = [], modelMap = {};

      // Allow a single model (or no argument) to be passed.
      if (!_.isArray(models)) models = models ? [models] : [];

      // Proxy to `add` for this case, no need to iterate...
      if (options.add && !options.remove) return this.add(models, options);

      // Determine which models to add and merge, and which to remove.
      for (i = 0, l = models.length; i < l; i++) {
        model = models[i];
        existing = this.get(model);
        if (options.remove && existing) modelMap[existing.cid] = true;
        if ((options.add && !existing) || (options.merge && existing)) {
          add.push(model);
        }
      }
      if (options.remove) {
        for (i = 0, l = this.models.length; i < l; i++) {
          model = this.models[i];
          if (!modelMap[model.cid]) remove.push(model);
        }
      }

      // Remove models (if applicable) before we add and merge the rest.
      if (remove.length) this.remove(remove, options);
      if (add.length) this.add(add, options);
      return this;
    },

    // When you have more items than you want to add or remove individually,
    // you can reset the entire set with a new list of models, without firing
    // any `add` or `remove` events. Fires `reset` when finished.
    reset: function(models, options) {
      options || (options = {});
      if (options.parse) models = this.parse(models, options);
      for (var i = 0, l = this.models.length; i < l; i++) {
        this._removeReference(this.models[i]);
      }
      options.previousModels = this.models.slice();
      this._reset();
      if (models) this.add(models, _.extend({silent: true}, options));
      if (!options.silent) this.trigger('reset', this, options);
      return this;
    },

    // Fetch the default set of models for this collection, resetting the
    // collection when they arrive. If `update: true` is passed, the response
    // data will be passed through the `update` method instead of `reset`.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var success = options.success;
      options.success = function(collection, resp, options) {
        var method = options.update ? 'update' : 'reset';
        collection[method](resp, options);
        if (success) success(collection, resp, options);
      };
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

    // Reset all internal state. Called when the collection is reset.
    _reset: function() {
      this.length = 0;
      this.models.length = 0;
      this._byId  = {};
    },

    // Prepare a model or hash of attributes to be added to this collection.
    _prepareModel: function(attrs, options) {
      if (attrs instanceof Model) {
        if (!attrs.collection) attrs.collection = this;
        return attrs;
      }
      options || (options = {});
      options.collection = this;
      var model = new this.model(attrs, options);
      if (!model._validate(attrs, options)) return false;
      return model;
    },

    // Internal method to remove a model's ties to a collection.
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
    },

    sortedIndex: function (model, value, context) {
      value || (value = this.comparator);
      var iterator = _.isFunction(value) ? value : function(model) {
        return model.get(value);
      };
      return _.sortedIndex(this.models, model, iterator, context);
    }

  });

  // Underscore methods that we want to implement on the Collection.
  var methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
    'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
    'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
    'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
    'tail', 'drop', 'last', 'without', 'indexOf', 'shuffle', 'lastIndexOf',
    'isEmpty', 'chain'];

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
      if (!callback) callback = this[name];
      Backbone.history.route(route, _.bind(function(fragment) {
        var args = this._extractParameters(route, fragment);
        callback && callback.apply(this, args);
        this.trigger.apply(this, ['route:' + name].concat(args));
        this.trigger('route', name, args);
        Backbone.history.trigger('route', this, name, args);
      }, this));
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
                   .replace(namedParam, function(match, optional){
                     return optional ? match : '([^\/]+)';
                   })
                   .replace(splatParam, '(.*?)');
      return new RegExp('^' + route + '$');
    },

    // Given a route, and a URL fragment that it matches, return the array of
    // extracted parameters.
    _extractParameters: function(route, fragment) {
      return route.exec(fragment).slice(1);
    }

  });

  // Backbone.History
  // ----------------

  // Handles cross-browser history management, based on URL fragments. If the
  // browser does not support `onhashchange`, falls back to polling.
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
          if (!fragment.indexOf(root)) fragment = fragment.substr(root.length);
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
      this.options          = _.extend({}, {root: '/'}, this.options, options);
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

      // If we've started off with a route from a `pushState`-enabled browser,
      // but we're currently in a browser that doesn't support it...
      if (this._wantsHashChange && this._wantsPushState && !this._hasPushState && !atRoot) {
        this.fragment = this.getFragment(null, true);
        this.location.replace(this.root + this.location.search + '#' + this.fragment);
        // Return immediately as browser will do redirect to new url
        return true;

      // Or if we've started out with a hash-based route, but we're currently
      // in a browser where it could be `pushState`-based instead...
      } else if (this._wantsPushState && this._hasPushState && atRoot && loc.hash) {
        this.fragment = this.getHash().replace(routeStripper, '');
        this.history.replaceState({}, document.title, this.root + this.fragment + loc.search);
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
      this.loadUrl() || this.loadUrl(this.getHash());
    },

    // Attempt to load the current URL fragment. If a route succeeds with a
    // match, returns `true`. If no defined routes matches the fragment,
    // returns `false`.
    loadUrl: function(fragmentOverride) {
      var fragment = this.fragment = this.getFragment(fragmentOverride);
      var matched = _.any(this.handlers, function(handler) {
        if (handler.route.test(fragment)) {
          handler.callback(fragment);
          return true;
        }
      });
      return matched;
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
      if (!options || options === true) options = {trigger: options};
      fragment = this.getFragment(fragment || '');
      if (this.fragment === fragment) return;
      this.fragment = fragment;
      var url = this.root + fragment;

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
      if (options.trigger) this.loadUrl(fragment);
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

  // Backbone.View
  // -------------

  // Creating a Backbone.View creates its initial element outside of the DOM,
  // if an existing element is not provided...
  var View = Backbone.View = function(options) {
    this.cid = _.uniqueId('view');
    this._configure(options || {});
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
    // current view. This should be prefered to global lookups where possible.
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
    //       'click .button':     'save'
    //       'click .open':       function(e) { ... }
    //     }
    //
    // pairs. Callbacks will be bound to the view, with `this` set properly.
    // Uses event delegation for efficiency.
    // Omitting the selector binds the event to `this.el`.
    // This only works for delegate-able events: not `focus`, `blur`, and
    // not `change`, `submit`, and `reset` in Internet Explorer.
    delegateEvents: function(events) {
      if (!(events || (events = _.result(this, 'events')))) return;
      this.undelegateEvents();
      for (var key in events) {
        var method = events[key];
        if (!_.isFunction(method)) method = this[events[key]];
        if (!method) throw new Error('Method "' + events[key] + '" does not exist');
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
    },

    // Clears all callbacks previously bound to the view with `delegateEvents`.
    // You usually don't need to use this, but may wish to if you have multiple
    // Backbone views attached to the same DOM element.
    undelegateEvents: function() {
      this.$el.off('.delegateEvents' + this.cid);
    },

    // Performs the initial configuration of a View with a set of options.
    // Keys with special meaning *(model, collection, id, className)*, are
    // attached directly to the view.
    _configure: function(options) {
      if (this.options) options = _.extend({}, _.result(this, 'options'), options);
      _.extend(this, _.pick(options, viewOptions));
      this.options = options;
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

  // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
  var methodMap = {
    'create': 'POST',
    'update': 'PUT',
    'patch':  'PATCH',
    'delete': 'DELETE',
    'read':   'GET'
  };

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

    var success = options.success;
    options.success = function(resp) {
      if (success) success(model, resp, options);
      model.trigger('sync', model, resp, options);
    };

    var error = options.error;
    options.error = function(xhr) {
      if (error) error(model, xhr, options);
      model.trigger('error', model, xhr, options);
    };

    // Make the request, allowing the user to override any Ajax options.
    var xhr = options.xhr = Backbone.ajax(_.extend(params, options));
    model.trigger('request', model, xhr, options);
    return xhr;
  };

  // Set the default implementation of `Backbone.ajax` to proxy through to `$`.
  Backbone.ajax = function() {
    return Backbone.$.ajax.apply(Backbone.$, arguments);
  };

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

}).call(this);

// Copyright 2012 Mauricio Santos. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//
// Some documentation is borrowed from the official Java API
// as it serves the same porpose.

/**
 * @namespace Top level namespace for Buckets, a JavaScript data structure library.
 */
var buckets = {};

/**
 * Default function to compare element order.
 * @function
 * @private
 */
buckets.defaultCompare = function(a, b) {
    if (a < b) {
        return - 1;
    } else if (a === b) {
        return 0;
    } else {
        return 1;
    }
};
/**
 * Default function to test equality.
 * @function
 * @private
 */
buckets.defaultEquals = function(a, b) {
    return a === b;
};

/**
 * Default function to convert an object to a string.
 * @function
 * @private
 */
buckets.defaultToString = function(item) {
    if (item === null) {
        return 'BUCKETS_NULL';
    } else if (buckets.isUndefined(item)) {
        return 'BUCKETS_UNDEFINED';
    } else if (buckets.isString(item)) {
        return item;
    } else {
        return item.toString();
    }
};

/**
 * Checks if the given argument is a function.
 * @function
 * @private
 */
buckets.isFunction = function(func) {
    return (typeof func) === 'function';
};

/**
 * Checks if the given argument is undefined.
 * @function
 * @private
 */
buckets.isUndefined = function(obj) {
    return (typeof obj) === 'undefined';
};

/**
 * Checks if the given argument is a string.
 * @function
 * @private
 */
buckets.isString = function(obj) {
    return Object.prototype.toString.call(obj) === '[object String]';
};

/**
 * Reverses a compare function.
 * @function
 * @private
 */
buckets.reverseCompareFunction = function(compareFunction) {
    if (!buckets.isFunction(compareFunction)) {
        return function(a, b) {
            if (a < b) {
                return 1;
            } else if (a === b) {
                return 0;
            } else {
                return - 1;
            }
        };
    } else {
        return function(d, v) {
            return compareFunction(d, v) * -1;
        };
    }
};

/**
 * Returns an equal function given a compare function.
 * @function
 * @private
 */
buckets.compareToEquals = function(compareFunction) {
    return function(a, b) {
        return compareFunction(a, b) === 0;
    };
};

/**
 * @namespace Contains various functions for manipulating arrays.
 */
buckets.arrays = {};

/**
 * Returns the position of the first occurrence of the specified item
 * within the specified array.
 * @param {*} array the array in which to search the element.
 * @param {Object} item the element to search.
 * @param {function(Object,Object):boolean=} equalsFunction optional function used to 
 * check equality between 2 elements.
 * @return {number} the position of the first occurrence of the specified element
 * within the specified array, or -1 if not found.
 */
buckets.arrays.indexOf = function(array, item, equalsFunction) {
    var equals = equalsFunction || buckets.defaultEquals;
    var length = array.length;
    for (var i = 0; i < length; i++) {
        if (equals(array[i], item)) {
            return i;
        }
    }
    return - 1;
};

/**
 * Returns the position of the last occurrence of the specified element
 * within the specified array.
 * @param {*} array the array in which to search the element.
 * @param {Object} item the element to search.
 * @param {function(Object,Object):boolean=} equalsFunction optional function used to 
 * check equality between 2 elements.
 * @return {number} the position of the last occurrence of the specified element
 * within the specified array or -1 if not found.
 */
buckets.arrays.lastIndexOf = function(array, item, equalsFunction) {
    var equals = equalsFunction || buckets.defaultEquals;
    var length = array.length;
    for (var i = length - 1; i >= 0; i--) {
        if (equals(array[i], item)) {
            return i;
        }
    }
    return - 1;
};

/**
 * Returns true if the specified array contains the specified element.
 * @param {*} array the array in which to search the element.
 * @param {Object} item the element to search.
 * @param {function(Object,Object):boolean=} equalsFunction optional function to 
 * check equality between 2 elements.
 * @return {boolean} true if the specified array contains the specified element.
 */
buckets.arrays.contains = function(array, item, equalsFunction) {
    return buckets.arrays.indexOf(array, item, equalsFunction) >= 0;
};


/**
 * Removes the first ocurrence of the specified element from the specified array.
 * @param {*} array the array in which to search element.
 * @param {Object} item the element to search.
 * @param {function(Object,Object):boolean=} equalsFunction optional function to 
 * check equality between 2 elements.
 * @return {boolean} true if the array changed after this call.
 */
buckets.arrays.remove = function(array, item, equalsFunction) {
    var index = buckets.arrays.indexOf(array, item, equalsFunction);
    if (index < 0) {
        return false;
    }
    array.splice(index, 1);
    return true;
};

/**
 * Returns the number of elements in the specified array equal
 * to the specified object.
 * @param {Array} array the array in which to determine the frequency of the element.
 * @param {Object} item the element whose frequency is to be determined.
 * @param {function(Object,Object):boolean=} equalsFunction optional function used to 
 * check equality between 2 elements.
 * @return {number} the number of elements in the specified array 
 * equal to the specified object.
 */
buckets.arrays.frequency = function(array, item, equalsFunction) {
    var equals = equalsFunction || buckets.defaultEquals;
    var length = array.length;
    var freq = 0;
    for (var i = 0; i < length; i++) {
        if (equals(array[i], item)) {
            freq++;
        }
    }
    return freq;
};

/**
 * Returns true if the two specified arrays are equal to one another.
 * Two arrays are considered equal if both arrays contain the same number
 * of elements, and all corresponding pairs of elements in the two 
 * arrays are equal and are in the same order. 
 * @param {Array} array1 one array to be tested for equality.
 * @param {Array} array2 the other array to be tested for equality.
 * @param {function(Object,Object):boolean=} equalsFunction optional function used to 
 * check equality between elemements in the arrays.
 * @return {boolean} true if the two arrays are equal
 */
buckets.arrays.equals = function(array1, array2, equalsFunction) {
    var equals = equalsFunction || buckets.defaultEquals;

    if (array1.length !== array2.length) {
        return false;
    }
    var length = array1.length;
    for (var i = 0; i < length; i++) {
        if (!equals(array1[i], array2[i])) {
            return false;
        }
    }
    return true;
};

/**
 * Returns shallow a copy of the specified array.
 * @param {*} array the array to copy.
 * @return {Array} a copy of the specified array
 */
buckets.arrays.copy = function(array) {
    return array.concat();
};

/**
 * Swaps the elements at the specified positions in the specified array.
 * @param {Array} array The array in which to swap elements.
 * @param {number} i the index of one element to be swapped.
 * @param {number} j the index of the other element to be swapped.
 * @return {boolean} true if the array is defined and the indexes are valid.
 */
buckets.arrays.swap = function(array, i, j) {
    if (i < 0 || i >= array.length || j < 0 || j >= array.length) {
        return false;
    }
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
    return true;
};

/**
 * Executes the provided function once for each element present in this array 
 * starting from index 0 to length - 1.
 * @param {Array} array The array in which to iterate.
 * @param {function(Object):*} callback function to execute, it is
 * invoked with one argument: the element value, to break the iteration you can 
 * optionally return false.
 */
buckets.arrays.forEach = function(array, callback) {
   var lenght = array.length;
   for (var i=0; i < lenght; i++) {
   		if(callback(array[i])===false){
			return;
		}
   }	 
};

/**
 * Creates an empty Linked List.
 * @class A linked list is a data structure consisting of a group of nodes
 * which together represent a sequence.
 * @constructor
 */
buckets.LinkedList = function() {

    /**
     * First node in the list
     * @type {Object}
     * @private
     */
    this.firstNode = null;

    /**
     * Last node in the list
     * @type {Object}
     * @private
     */
    this.lastNode = null;

    /**
     * Number of elements in the list
     * @type {number}
     * @private
     */
    this.nElements = 0;
};


/**
 * Adds an element to this list.
 * @param {Object} item element to be added.
 * @param {number=} index optional index to add the element. If no index is specified
 * the element is added to the end of this list.
 * @return {boolean} true if the element was added or false if the index is invalid
 * or if the element is undefined.
 */
buckets.LinkedList.prototype.add = function(item, index) {

    if (buckets.isUndefined(index)) {
        index = this.nElements;
    }
    if (index < 0 || index > this.nElements || buckets.isUndefined(item)) {
        return false;
    }
    var newNode = this.createNode(item);
    if (this.nElements === 0) {
        // First node in the list.
        this.firstNode = newNode;
        this.lastNode = newNode;
    } else if (index === this.nElements) {
        // Insert at the end.
        this.lastNode.next = newNode;
        this.lastNode = newNode;
    } else if (index === 0) {
        // Change first node.
        newNode.next = this.firstNode;
        this.firstNode = newNode;
    } else {
        var prev = this.nodeAtIndex(index - 1);
        newNode.next = prev.next;
        prev.next = newNode;
    }
    this.nElements++;
    return true;
};


/**
 * Returns the first element in this list.
 * @return {*} the first element of the list or undefined if the list is
 * empty.
 */
buckets.LinkedList.prototype.first = function() {

    if (this.firstNode !== null) {
        return this.firstNode.element;
    }
    return undefined;
};

/**
 * Returns the last element in this list.
 * @return {*} the last element in the list or undefined if the list is
 * empty.
 */
buckets.LinkedList.prototype.last = function() {

    if (this.lastNode !== null) {
        return this.lastNode.element;
    }
    return undefined;
};


/**
 * Returns the element at the specified position in this list.
 * @param {number} index desired index.
 * @return {*} the element at the given index or undefined if the index is
 * out of bounds.
 */
buckets.LinkedList.prototype.elementAtIndex = function(index) {

    var node = this.nodeAtIndex(index);
    if (node === null) {
        return undefined;
    }
    return node.element;
};

/**
 * Returns the index in this list of the first occurrence of the
 * specified element, or -1 if the List does not contain this element.
 * <p>If the elements inside this list are
 * not comparable with the === operator a custom equals function should be
 * provided to perform searches, the function must receive two arguments and
 * return true if they are equal, false otherwise. Example:</p>
 *
 * <pre>
 * var petsAreEqualByName = function(pet1, pet2) {
 *  return pet1.name === pet2.name;
 * }
 * </pre>
 * @param {Object} item element to search for.
 * @param {function(Object,Object):boolean=} equalsFunction Optional
 * function used to check if two elements are equal.
 * @return {number} the index in this list of the first occurrence
 * of the specified element, or -1 if this list does not contain the
 * element.
 */
buckets.LinkedList.prototype.indexOf = function(item, equalsFunction) {

    var equalsF = equalsFunction || buckets.defaultEquals;
    if (buckets.isUndefined(item)) {
        return - 1;
    }
    var currentNode = this.firstNode;
    var index = 0;
    while (currentNode !== null) {
        if (equalsF(currentNode.element, item)) {
            return index;
        }
        index++;
        currentNode = currentNode.next;
    }
    return - 1;
};

/**
 * Returns true if this list contains the specified element.
 * <p>If the elements inside the list are
 * not comparable with the === operator a custom equals function should be
 * provided to perform searches, the function must receive two arguments and
 * return true if they are equal, false otherwise. Example:</p>
 *
 * <pre>
 * var petsAreEqualByName = function(pet1, pet2) {
 *  return pet1.name === pet2.name;
 * }
 * </pre>
 * @param {Object} item element to search for.
 * @param {function(Object,Object):boolean=} equalsFunction Optional
 * function used to check if two elements are equal.
 * @return {boolean} true if this list contains the specified element, false
 * otherwise.
 */
buckets.LinkedList.prototype.contains = function(item, equalsFunction) {
    return (this.indexOf(item, equalsFunction) >= 0);
};

/**
 * Removes the first occurrence of the specified element in this list.
 * <p>If the elements inside the list are
 * not comparable with the === operator a custom equals function should be
 * provided to perform searches, the function must receive two arguments and
 * return true if they are equal, false otherwise. Example:</p>
 *
 * <pre>
 * var petsAreEqualByName = function(pet1, pet2) {
 *  return pet1.name === pet2.name;
 * }
 * </pre>
 * @param {Object} item element to be removed from this list, if present.
 * @return {boolean} true if the list contained the specified element.
 */
buckets.LinkedList.prototype.remove = function(item, equalsFunction) {
    var equalsF = equalsFunction || buckets.defaultEquals;
    if (this.nElements < 1 || buckets.isUndefined(item)) {
        return false;
    }
    var previous = null;
    var currentNode = this.firstNode;
    while (currentNode !== null) {

        if (equalsF(currentNode.element, item)) {

            if (currentNode === this.firstNode) {
                this.firstNode = this.firstNode.next;
                if (currentNode === this.lastNode) {
                    this.lastNode = null;
                }
            } else if (currentNode === this.lastNode) {
                this.lastNode = previous;
                previous.next = currentNode.next;
                currentNode.next = null;
            } else {
                previous.next = currentNode.next;
                currentNode.next = null;
            }
            this.nElements--;
            return true;
        }
        previous = currentNode;
        currentNode = currentNode.next;
    }
    return false;
};

/**
 * Removes all of the elements from this list.
 */
buckets.LinkedList.prototype.clear = function() {
    this.firstNode = null;
    this.lastNode = null;
    this.nElements = 0;
};

/**
 * Returns true if this list is equal to the given list.
 * Two lists are equal if they have the same elements in the same order.
 * @param {buckets.LinkedList} other the other list.
 * @param {function(Object,Object):boolean=} equalsFunction optional
 * function used to check if two elements are equal. If the elements in the lists
 * are custom objects you should provide a function, otherwise the
 * the === operator is used to check equality between elements.
 * @return {boolean} true if this list is equal to the given list.
 */
buckets.LinkedList.prototype.equals = function(other, equalsFunction) {
    var eqF = equalsFunction || buckets.defaultEquals;
    if (! (other instanceof buckets.LinkedList)) {
        return false;
    }
    if (this.size() !== other.size()) {
        return false;
    }
    return this.equalsAux(this.firstNode, other.firstNode, eqF);
};

/**
 * @private
 */
buckets.LinkedList.prototype.equalsAux = function(n1, n2, eqF) {
    while (n1 !== null) {
        if (!eqF(n1.element, n2.element)) {
            return false;
        }
        n1 = n1.next;
        n2 = n2.next;
    }
    return true;
};

/**
 * Removes the element at the specified position in this list.
 * @param {number} index given index.
 * @return {*} removed element or undefined if the index is out of bounds.
 */
buckets.LinkedList.prototype.removeElementAtIndex = function(index) {

    if (index < 0 || index >= this.nElements) {
        return undefined;
    }
    var element;
    if (this.nElements === 1) {
        //First node in the list.
        element = this.firstNode.element;
        this.firstNode = null;
        this.lastNode = null;
    } else {
        var previous = this.nodeAtIndex(index - 1);
        if (previous === null) {
            element = this.firstNode.element;
            this.firstNode = this.firstNode.next;
        } else if (previous.next === this.lastNode) {
            element = this.lastNode.element;
            this.lastNode = previous;
        }
        if (previous !== null) {
            element = previous.next.element;
            previous.next = previous.next.next;
        }
    }
    this.nElements--;
    return element;
};

/**
 * Executes the provided function once for each element present in this list in order.
 * @param {function(Object):*} callback function to execute, it is
 * invoked with one argument: the element value, to break the iteration you can 
 * optionally return false.
 */
buckets.LinkedList.prototype.forEach = function(callback) {
    var currentNode = this.firstNode;
    while (currentNode !== null) {
        if (callback(currentNode.element) === false) {
            break;
        }
        currentNode = currentNode.next;
    }
};

/**
 * Reverses the order of the elements in this linked list (makes the last 
 * element first, and the first element last).
 */
buckets.LinkedList.prototype.reverse = function() {
    var previous = null;
    var current = this.firstNode;
    var temp = null;
    while (current !== null) {
        temp = current.next;
        current.next = previous;
        previous = current;
        current = temp;
    }
    temp = this.firstNode;
    this.firstNode = this.lastNode;
    this.lastNode = temp;
};


/**
 * Returns an array containing all of the elements in this list in proper
 * sequence.
 * @return {Array.<*>} an array containing all of the elements in this list,
 * in proper sequence.
 */
buckets.LinkedList.prototype.toArray = function() {
    var array = [];
    var currentNode = this.firstNode;
    while (currentNode !== null) {
        array.push(currentNode.element);
        currentNode = currentNode.next;
    }
    return array;
};
/**
 * Returns the number of elements in this list.
 * @return {number} the number of elements in this list.
 */
buckets.LinkedList.prototype.size = function() {
    return this.nElements;
};

/**
 * Returns true if this list contains no elements.
 * @return {boolean} true if this list contains no elements.
 */
buckets.LinkedList.prototype.isEmpty = function() {
    return this.nElements <= 0;
};

/**
 * @private
 */
buckets.LinkedList.prototype.nodeAtIndex = function(index) {

    if (index < 0 || index >= this.nElements) {
        return null;
    }
    if (index === (this.nElements - 1)) {
        return this.lastNode;
    }
    var node = this.firstNode;
    for (var i = 0; i < index; i++) {
        node = node.next;
    }
    return node;
};
/**
 * @private
 */
buckets.LinkedList.prototype.createNode = function(item) {
    return {
        element: item,
        next: null
    };
};


/**
 * Creates an empty dictionary. 
 * @class <p>Dictionaries map keys to values; each key can map to at most one value.
 * This implementation accepts any kind of objects as keys.</p>
 *
 * <p>If the keys are custom objects a function which converts keys to unique
 * strings must be provided. Example:</p>
 * <pre>
 * function petToString(pet) {
 *  return pet.name;
 * }
 * </pre>
 * @constructor
 * @param {function(Object):string=} toStrFunction optional function used
 * to convert keys to strings. If the keys aren't strings or if toString()
 * is not appropriate, a custom function which receives a key and returns a
 * unique string must be provided.
 */
buckets.Dictionary = function(toStrFunction) {

    /**
     * Object holding the key-value pairs.
     * @type {Object}
     * @private
     */
    this.table = {};

    /**
     * Number of elements in the list.
     * @type {number}
     * @private
     */
    this.nElements = 0;

    /**
     * Function used to convert keys to strings.
     * @type {function(Object):string}
     * @private
     */
    this.toStr = toStrFunction || buckets.defaultToString;
};

/**
 * Returns the value to which this dictionary maps the specified key.
 * Returns undefined if this dictionary contains no mapping for this key.
 * @param {Object} key key whose associated value is to be returned.
 * @return {*} the value to which this dictionary maps the specified key or
 * undefined if the map contains no mapping for this key.
 */
buckets.Dictionary.prototype.get = function(key) {

    var pair = this.table[this.toStr(key)];
    if (buckets.isUndefined(pair)) {
        return undefined;
    }
    return pair.value;
};
/**
 * Associates the specified value with the specified key in this dictionary.
 * If the dictionary previously contained a mapping for this key, the old
 * value is replaced by the specified value.
 * @param {Object} key key with which the specified value is to be
 * associated.
 * @param {Object} value value to be associated with the specified key.
 * @return {*} previous value associated with the specified key, or undefined if
 * there was no mapping for the key or if the key/value are undefined.
 */
buckets.Dictionary.prototype.set = function(key, value) {

    if (buckets.isUndefined(key) || buckets.isUndefined(value)) {
        return undefined;
    }

    var ret;
    var k = this.toStr(key);
    var previousElement = this.table[k];
    if (buckets.isUndefined(previousElement)) {
        this.nElements++;
        ret = undefined;
    } else {
        ret = previousElement.value;
    }
    this.table[k] = {
        key: key,
        value: value
    };
    return ret;
};
/**
 * Removes the mapping for this key from this dictionary if it is present.
 * @param {Object} key key whose mapping is to be removed from the
 * dictionary.
 * @return {*} previous value associated with specified key, or undefined if
 * there was no mapping for key.
 */
buckets.Dictionary.prototype.remove = function(key) {
    var k = this.toStr(key);
    var previousElement = this.table[k];
    if (!buckets.isUndefined(previousElement)) {
        delete this.table[k];
        this.nElements--;
        return previousElement.value;
    }
    return undefined;
};
/**
 * Returns an array containing all of the keys in this dictionary.
 * @return {Array} an array containing all of the keys in this dictionary.
 */
buckets.Dictionary.prototype.keys = function() {
    var array = [];
    for (var name in this.table) {
        if (this.table.hasOwnProperty(name)) {
            array.push(this.table[name].key);
        }
    }
    return array;
};
/**
 * Returns an array containing all of the values in this dictionary.
 * @return {Array} an array containing all of the values in this dictionary.
 */
buckets.Dictionary.prototype.values = function() {
    var array = [];
    for (var name in this.table) {
        if (this.table.hasOwnProperty(name)) {
            array.push(this.table[name].value);
        }
    }
    return array;
};

/**
 * Executes the provided function once for each key-value pair 
 * present in this dictionary.
 * @param {function(Object,Object):*} callback function to execute, it is
 * invoked with two arguments: key and value. To break the iteration you can 
 * optionally return false.
 */
buckets.Dictionary.prototype.forEach = function(callback) {
    for (var name in this.table) {
        if (this.table.hasOwnProperty(name)) {
            var pair = this.table[name];
            var ret = callback(pair.key, pair.value);
            if (ret === false) {
                return;
            }
        }
    }
};

/**
 * Returns true if this dictionary contains a mapping for the specified key.
 * @param {Object} key key whose presence in this dictionary is to be
 * tested.
 * @return {boolean} true if this dictionary contains a mapping for the
 * specified key.
 */
buckets.Dictionary.prototype.containsKey = function(key) {
    return ! buckets.isUndefined(this.get(key));
};
/**
 * Removes all mappings from this dictionary.
 * @this {buckets.Dictionary}
 */
buckets.Dictionary.prototype.clear = function() {

    this.table = {};
    this.nElements = 0;
};
/**
 * Returns the number of keys in this dictionary.
 * @return {number} the number of key-value mappings in this dictionary.
 */
buckets.Dictionary.prototype.size = function() {
    return this.nElements;
};

/**
 * Returns true if this dictionary contains no mappings.
 * @return {boolean} true if this dictionary contains no mappings.
 */
buckets.Dictionary.prototype.isEmpty = function() {
    return this.nElements <= 0;
};

// /**
//  * Returns true if this dictionary is equal to the given dictionary.
//  * Two dictionaries are equal if they contain the same mappings.
//  * @param {buckets.Dictionary} other the other dictionary.
//  * @param {function(Object,Object):boolean=} valuesEqualFunction optional
//  * function used to check if two values are equal.
//  * @return {boolean} true if this dictionary is equal to the given dictionary.
//  */
// buckets.Dictionary.prototype.equals = function(other,valuesEqualFunction) {
// 	var eqF = valuesEqualFunction || buckets.defaultEquals;
// 	if(!(other instanceof buckets.Dictionary)){
// 		return false;
// 	}
// 	if(this.size() !== other.size()){
// 		return false;
// 	}
// 	return this.equalsAux(this.firstNode,other.firstNode,eqF);
// };
/**
 * Creates an empty multi dictionary. 
 * @class <p>A multi dictionary is a special kind of dictionary that holds
 * multiple values against each key. Setting a value into the dictionary will 
 * add the value to an array at that key. Getting a key will return an array,
 * holding all the values set to that key.
 * This implementation accepts any kind of objects as keys.</p>
 *
 * <p>If the keys are custom objects a function which converts keys to strings must be
 * provided. Example:</p>
 *
 * <pre>
 * function petToString(pet) {
 *  return pet.name;
 * }
 * </pre>
 * <p>If the values are custom objects a function to check equality between values
 * must be provided. Example:</p>
 *
 * <pre>
 * function petsAreEqualByAge(pet1,pet2) {
 *  return pet1.age===pet2.age;
 * }
 * </pre>
 * @constructor
 * @param {function(Object):string=} toStrFunction optional function
 * to convert keys to strings. If the keys aren't strings or if toString()
 * is not appropriate, a custom function which receives a key and returns a
 * unique string must be provided.
 * @param {function(Object,Object):boolean=} valuesEqualsFunction optional
 * function to check if two values are equal.
 * 
 */
buckets.MultiDictionary = function(toStrFunction, valuesEqualsFunction) {
    // Call the parent's constructor
    this.parent = new buckets.Dictionary(toStrFunction);
    this.equalsF = valuesEqualsFunction || buckets.defaultEquals;
};

/**
 * Returns an array holding the values to which this dictionary maps
 * the specified key.
 * Returns an empty array if this dictionary contains no mappings for this key.
 * @param {Object} key key whose associated values are to be returned.
 * @return {Array} an array holding the values to which this dictionary maps
 * the specified key.
 */
buckets.MultiDictionary.prototype.get = function(key) {
    var values = this.parent.get(key);
    if (buckets.isUndefined(values)) {
        return [];
    }
    return buckets.arrays.copy(values);
};

/**
 * Adds the value to the array associated with the specified key, if 
 * it is not already present.
 * @param {Object} key key with which the specified value is to be
 * associated.
 * @param {Object} value the value to add to the array at the key
 * @return {boolean} true if the value was not already associated with that key.
 */
buckets.MultiDictionary.prototype.set = function(key, value) {

    if (buckets.isUndefined(key) || buckets.isUndefined(value)) {
        return false;
    }
    if (!this.containsKey(key)) {
        this.parent.set(key, [value]);
        return true;
    }
    var array = this.parent.get(key);
    if (buckets.arrays.contains(array, value, this.equalsF)) {
        return false;
    }
    array.push(value);
    return true;
};

/**
 * Removes the specified values from the array of values associated with the
 * specified key. If a value isn't given, all values associated with the specified 
 * key are removed.
 * @param {Object} key key whose mapping is to be removed from the
 * dictionary.
 * @param {Object=} value optional argument to specify the value to remove 
 * from the array associated with the specified key.
 * @return {*} true if the dictionary changed, false if the key doesn't exist or 
 * if the specified value isn't associated with the specified key.
 */
buckets.MultiDictionary.prototype.remove = function(key, value) {
    if (buckets.isUndefined(value)) {
        var v = this.parent.remove(key);
        if (buckets.isUndefined(v)) {
            return false;
        }
        return true;
    }
    var array = this.parent.get(key);
    if (buckets.arrays.remove(array, value, this.equalsF)) {
        if (array.length === 0) {
            this.parent.remove(key);
        }
        return true;
    }
    return false;
};

/**
 * Returns an array containing all of the keys in this dictionary.
 * @return {Array} an array containing all of the keys in this dictionary.
 */
buckets.MultiDictionary.prototype.keys = function() {
    return this.parent.keys();
};

/**
 * Returns an array containing all of the values in this dictionary.
 * @return {Array} an array containing all of the values in this dictionary.
 */
buckets.MultiDictionary.prototype.values = function() {
    var values = this.parent.values();
    var array = [];
    for (var i = 0; i < values.length; i++) {
        var v = values[i];
        for (var j = 0; j < v.length; j++) {
            array.push(v[j]);
        }
    }
    return array;
};

/**
 * Returns true if this dictionary at least one value associatted the specified key.
 * @param {Object} key key whose presence in this dictionary is to be
 * tested.
 * @return {boolean} true if this dictionary at least one value associatted 
 * the specified key.
 */
buckets.MultiDictionary.prototype.containsKey = function(key) {
    return this.parent.containsKey(key);
};

/**
 * Removes all mappings from this dictionary.
 */
buckets.MultiDictionary.prototype.clear = function() {
    return this.parent.clear();
};

/**
 * Returns the number of keys in this dictionary.
 * @return {number} the number of key-value mappings in this dictionary.
 */
buckets.MultiDictionary.prototype.size = function() {
    return this.parent.size();
};

/**
 * Returns true if this dictionary contains no mappings.
 * @return {boolean} true if this dictionary contains no mappings.
 */
buckets.MultiDictionary.prototype.isEmpty = function() {
    return this.parent.isEmpty();
};

/**
 * Creates an empty Heap.
 * @class 
 * <p>A heap is a binary tree, where the nodes maintain the heap property: 
 * each node is smaller than each of its children. 
 * This implementation uses an array to store elements.</p>
 * <p>If the inserted elements are custom objects a compare function must be provided, 
 *  at construction time, otherwise the <=, === and >= operators are 
 * used to compare elements. Example:</p>
 *
 * <pre>
 * function compare(a, b) {
 *  if (a is less than b by some ordering criterion) {
 *     return -1;
 *  } if (a is greater than b by the ordering criterion) {
 *     return 1;
 *  } 
 *  // a must be equal to b
 *  return 0;
 * }
 * </pre>
 *
 * <p>If a Max-Heap is wanted (greater elements on top) you can a provide a
 * reverse compare function to accomplish that behavior. Example:</p>
 *
 * <pre>
 * function reverseCompare(a, b) {
 *  if (a is less than b by some ordering criterion) {
 *     return 1;
 *  } if (a is greater than b by the ordering criterion) {
 *     return -1;
 *  } 
 *  // a must be equal to b
 *  return 0;
 * }
 * </pre>
 *
 * @constructor
 * @param {function(Object,Object):number=} compareFunction optional
 * function used to compare two elements. Must return a negative integer,
 * zero, or a positive integer as the first argument is less than, equal to,
 * or greater than the second.
 */
buckets.Heap = function(compareFunction) {

    /**
     * Array used to store the elements od the heap.
     * @type {Array.<Object>}
     * @private
     */
    this.data = [];

    /**
     * Function used to compare elements.
     * @type {function(Object,Object):number}
     * @private
     */
    this.compare = compareFunction || buckets.defaultCompare;
};
/**
 * Returns the index of the left child of the node at the given index.
 * @param {number} nodeIndex The index of the node to get the left child
 * for.
 * @return {number} The index of the left child.
 * @private
 */
buckets.Heap.prototype.leftChildIndex = function(nodeIndex) {
    return (2 * nodeIndex) + 1;
};
/**
 * Returns the index of the right child of the node at the given index.
 * @param {number} nodeIndex The index of the node to get the right child
 * for.
 * @return {number} The index of the right child.
 * @private
 */
buckets.Heap.prototype.rightChildIndex = function(nodeIndex) {
    return (2 * nodeIndex) + 2;
};
/**
 * Returns the index of the parent of the node at the given index.
 * @param {number} nodeIndex The index of the node to get the parent for.
 * @return {number} The index of the parent.
 * @private
 */
buckets.Heap.prototype.parentIndex = function(nodeIndex) {
    return Math.floor((nodeIndex - 1) / 2);
};
/**
 * Returns the index of the smaller child node (if it exists).
 * @param {number} leftChild left child index.
 * @param {number} rightChild right child index.
 * @return {number} the index with the minimum value or -1 if it doesn't
 * exists.
 * @private
 */
buckets.Heap.prototype.minIndex = function(leftChild, rightChild) {

    if (rightChild >= this.data.length) {
        if (leftChild >= this.data.length) {
            return - 1;
        } else {
            return leftChild;
        }
    } else {
        if (this.compare(this.data[leftChild], this.data[rightChild]) <= 0) {
            return leftChild;
        } else {
            return rightChild;
        }
    }
};
/**
 * Moves the node at the given index up to its proper place in the heap.
 * @param {number} index The index of the node to move up.
 * @private
 */
buckets.Heap.prototype.siftUp = function(index) {

    var parent = this.parentIndex(index);
    while (index > 0 && this.compare(this.data[parent], this.data[index]) > 0) {
        buckets.arrays.swap(this.data, parent, index);
        index = parent;
        parent = this.parentIndex(index);
    }
};
/**
 * Moves the node at the given index down to its proper place in the heap.
 * @param {number} nodeIndex The index of the node to move down.
 * @private
 */
buckets.Heap.prototype.siftDown = function(nodeIndex) {

    //smaller child index
    var min = this.minIndex(this.leftChildIndex(nodeIndex),
    this.rightChildIndex(nodeIndex));

    while (min >= 0 && this.compare(this.data[nodeIndex],
    this.data[min]) > 0) {
        buckets.arrays.swap(this.data, min, nodeIndex);
        nodeIndex = min;
        min = this.minIndex(this.leftChildIndex(nodeIndex),
        this.rightChildIndex(nodeIndex));
    }
};
/**
 * Retrieves but does not remove the root element of this heap.
 * @return {*} The value at the root of the heap. Returns undefined if the
 * heap is empty.
 */
buckets.Heap.prototype.peek = function() {

    if (this.data.length > 0) {
        return this.data[0];
    } else {
        return undefined;
    }
};
/**
 * Adds the given element into the heap.
 * @param {*} element the element.
 * @return true if the element was added or fals if it is undefined.
 */
buckets.Heap.prototype.add = function(element) {
    if (buckets.isUndefined(element)) {
        return undefined;
    }
    this.data.push(element);
    this.siftUp(this.data.length - 1);
    return true;
};

/**
 * Retrieves and removes the root element of this heap.
 * @return {*} The value removed from the root of the heap. Returns
 * undefined if the heap is empty.
 */
buckets.Heap.prototype.removeRoot = function() {

    if (this.data.length > 0) {
        var obj = this.data[0];
        this.data[0] = this.data[this.data.length - 1];
        this.data.splice(this.data.length - 1, 1);
        if (this.data.length > 0) {
            this.siftDown(0);
        }
        return obj;
    }
    return undefined;
};
/**
 * Returns true if this heap contains the specified element.
 * @param {Object} element element to search for.
 * @return {boolean} true if this Heap contains the specified element, false
 * otherwise.
 */
buckets.Heap.prototype.contains = function(element) {
    var equF = buckets.compareToEquals(this.compare);
    return buckets.arrays.contains(this.data, element, equF);
};
/**
 * Returns the number of elements in this heap.
 * @return {number} the number of elements in this heap.
 */
buckets.Heap.prototype.size = function() {
    return this.data.length;
};
/**
 * Checks if this heap is empty.
 * @return {boolean} true if and only if this heap contains no items; false
 * otherwise.
 */
buckets.Heap.prototype.isEmpty = function() {
    return this.data.length <= 0;
};
/**
 * Removes all of the elements from this heap.
 */
buckets.Heap.prototype.clear = function() {
    this.data.length = 0;
};

/**
 * Executes the provided function once for each element present in this heap in 
 * no particular order.
 * @param {function(Object):*} callback function to execute, it is
 * invoked with one argument: the element value, to break the iteration you can 
 * optionally return false.
 */
buckets.Heap.prototype.forEach = function(callback) {
   buckets.arrays.forEach(this.data,callback);
};

/**
 * Creates an empty Stack.
 * @class A Stack is a Last-In-First-Out (LIFO) data structure, the last
 * element added to the stack will be the first one to be removed. This
 * implementation uses a linked list as a container.
 * @constructor
 */
buckets.Stack = function() {

    /**
     * List containing the elements.
     * @type buckets.LinkedList
     * @private
     */
    this.list = new buckets.LinkedList();
};
/**
 * Pushes an item onto the top of this stack.
 * @param {Object} elem the element to be pushed onto this stack.
 * @return {boolean} true if the element was pushed or false if it is undefined.
 */
buckets.Stack.prototype.push = function(elem) {
    return this.list.add(elem, 0);
};
/**
 * Pushes an item onto the top of this stack.
 * @param {Object} elem the element to be pushed onto this stack.
 * @return {boolean} true if the element was pushed or false if it is undefined.
 */
buckets.Stack.prototype.add = function(elem) {
    return this.list.add(elem, 0);
};
/**
 * Removes the object at the top of this stack and returns that object.
 * @return {*} the object at the top of this stack or undefined if the
 * stack is empty.
 */
buckets.Stack.prototype.pop = function() {
    return this.list.removeElementAtIndex(0);
};
/**
 * Looks at the object at the top of this stack without removing it from the
 * stack.
 * @return {*} the object at the top of this stack or undefined if the
 * stack is empty.
 */
buckets.Stack.prototype.peek = function() {
    return this.list.first();
};
/**
 * Returns the number of elements in this stack.
 * @return {number} the number of elements in this stack.
 */
buckets.Stack.prototype.size = function() {
    return this.list.size();
};

/**
 * Returns true if this stack contains the specified element.
 * <p>If the elements inside this stack are
 * not comparable with the === operator, a custom equals function should be
 * provided to perform searches, the function must receive two arguments and
 * return true if they are equal, false otherwise. Example:</p>
 *
 * <pre>
 * var petsAreEqualByName = function(pet1, pet2) {
 *  return pet1.name === pet2.name;
 * }
 * </pre>
 * @param {Object} elem element to search for.
 * @param {function(Object,Object):boolean=} equalsFunction optional
 * function to check if two elements are equal.
 * @return {boolean} true if this stack contains the specified element,
 * false otherwise.
 */
buckets.Stack.prototype.contains = function(elem, equalsFunction) {
    return this.list.contains(elem, equalsFunction);
};
/**
 * Checks if this stack is empty.
 * @return {boolean} true if and only if this stack contains no items; false
 * otherwise.
 */
buckets.Stack.prototype.isEmpty = function() {
    return this.list.isEmpty();
};
/**
 * Removes all of the elements from this stack.
 */
buckets.Stack.prototype.clear = function() {
    this.list.clear();
};

/**
 * Executes the provided function once for each element present in this stack in 
 * LIFO order.
 * @param {function(Object):*} callback function to execute, it is
 * invoked with one argument: the element value, to break the iteration you can 
 * optionally return false.
 */
buckets.Stack.prototype.forEach = function(callback) {
   this.list.forEach(callback);
};

/**
 * Creates an empty queue.
 * @class A queue is a First-In-First-Out (FIFO) data structure, the first
 * element added to the queue will be the first one to be removed. This
 * implementation uses a linked list as a container.
 * @constructor
 */
buckets.Queue = function() {

    /**
     * List containing the elements.
     * @type buckets.LinkedList
     * @private
     */
    this.list = new buckets.LinkedList();
};
/**
 * Inserts the specified element into the end of this queue.
 * @param {Object} elem the element to insert.
 * @return {boolean} true if the element was inserted, or false if it is undefined.
 */
buckets.Queue.prototype.enqueue = function(elem) {
    return this.list.add(elem);
};
/**
 * Inserts the specified element into the end of this queue.
 * @param {Object} elem the element to insert.
 * @return {boolean} true if the element was inserted, or false if it is undefined.
 */
buckets.Queue.prototype.add = function(elem) {
    return this.list.add(elem);
};
/**
 * Retrieves and removes the head of this queue.
 * @return {*} the head of this queue, or undefined if this queue is empty.
 */
buckets.Queue.prototype.dequeue = function() {
    if (this.list.size() !== 0) {
        var el = this.list.first();
        this.list.removeElementAtIndex(0);
        return el;
    }
    return undefined;
};
/**
 * Retrieves, but does not remove, the head of this queue.
 * @return {*} the head of this queue, or undefined if this queue is empty.
 */
buckets.Queue.prototype.peek = function() {

    if (this.list.size() !== 0) {
        return this.list.first();
    }
    return undefined;
};

/**
 * Returns the number of elements in this queue.
 * @return {number} the number of elements in this queue.
 */
buckets.Queue.prototype.size = function() {
    return this.list.size();
};

/**
 * Returns true if this queue contains the specified element.
 * <p>If the elements inside this stack are
 * not comparable with the === operator, a custom equals function should be
 * provided to perform searches, the function must receive two arguments and
 * return true if they are equal, false otherwise. Example:</p>
 *
 * <pre>
 * var petsAreEqualByName = function(pet1, pet2) {
 *  return pet1.name === pet2.name;
 * }
 * </pre>
 * @param {Object} elem element to search for.
 * @param {function(Object,Object):boolean=} equalsFunction optional
 * function to check if two elements are equal.
 * @return {boolean} true if this queue contains the specified element,
 * false otherwise.
 */
buckets.Queue.prototype.contains = function(elem, equalsFunction) {
    return this.list.contains(elem, equalsFunction);
};

/**
 * Checks if this queue is empty.
 * @return {boolean} true if and only if this queue contains no items; false
 * otherwise.
 */
buckets.Queue.prototype.isEmpty = function() {
    return this.list.size() <= 0;
};

/**
 * Removes all of the elements from this queue.
 */
buckets.Queue.prototype.clear = function() {
    this.list.clear();
};

/**
 * Executes the provided function once for each element present in this queue in 
 * FIFO order.
 * @param {function(Object):*} callback function to execute, it is
 * invoked with one argument: the element value, to break the iteration you can 
 * optionally return false.
 */
buckets.Queue.prototype.forEach = function(callback) {
   this.list.forEach(callback);
};

/**
 * Creates an empty priority queue.
 * @class <p>In a priority queue each element is associated with a "priority",
 * elements are dequeued in highest-priority-first order (the elements with the 
 * highest priority are dequeued first). Priority Queues are implemented as heaps. 
 * If the inserted elements are custom objects a compare function must be provided, 
 * otherwise the <=, === and >= operators are used to compare object priority.</p>
 * <pre>
 * function compare(a, b) {
 *  if (a is less than b by some ordering criterion) {
 *     return -1;
 *  } if (a is greater than b by the ordering criterion) {
 *     return 1;
 *  } 
 *  // a must be equal to b
 *  return 0;
 * }
 * </pre>
 * @constructor
 * @param {function(Object,Object):number=} compareFunction optional
 * function used to compare two element priorities. Must return a negative integer,
 * zero, or a positive integer as the first argument is less than, equal to,
 * or greater than the second.
 */
buckets.PriorityQueue = function(compareFunction) {
    this.heap = new buckets.Heap(buckets.reverseCompareFunction(compareFunction));
};

/**
 * Inserts the specified element into this priority queue.
 * @param {Object} element the element to insert.
 * @return {boolean} true if the element was inserted, or false if it is undefined.
 */
buckets.PriorityQueue.prototype.enqueue = function(element) {
    return this.heap.add(element);
};

/**
 * Inserts the specified element into this priority queue.
 * @param {Object} element the element to insert.
 * @return {boolean} true if the element was inserted, or false if it is undefined.
 */
buckets.PriorityQueue.prototype.add = function(element) {
    return this.heap.add(element);
};

/**
 * Retrieves and removes the highest priority element of this queue.
 * @return {*} the the highest priority element of this queue, 
or undefined if this queue is empty.
 */
buckets.PriorityQueue.prototype.dequeue = function() {
    if (this.heap.size() !== 0) {
        var el = this.heap.peek();
        this.heap.removeRoot();
        return el;
    }
    return undefined;
};

/**
 * Retrieves, but does not remove, the highest priority element of this queue.
 * @return {*} the highest priority element of this queue, or undefined if this queue is empty.
 */
buckets.PriorityQueue.prototype.peek = function() {
    return this.heap.peek();
};

/**
 * Returns true if this priority queue contains the specified element.
 * @param {Object} element element to search for.
 * @return {boolean} true if this priority queue contains the specified element,
 * false otherwise.
 */
buckets.PriorityQueue.prototype.contains = function(element) {
    return this.heap.contains(element);
};

/**
 * Checks if this priority queue is empty.
 * @return {boolean} true if and only if this priority queue contains no items; false
 * otherwise.
 */
buckets.PriorityQueue.prototype.isEmpty = function() {
    return this.heap.isEmpty();
};

/**
 * Returns the number of elements in this priority queue.
 * @return {number} the number of elements in this priority queue.
 */
buckets.PriorityQueue.prototype.size = function() {
    return this.heap.size();
};

/**
 * Removes all of the elements from this priority queue.
 */
buckets.PriorityQueue.prototype.clear = function() {
    this.heap.clear();
};

/**
 * Executes the provided function once for each element present in this queue in 
 * no particular order.
 * @param {function(Object):*} callback function to execute, it is
 * invoked with one argument: the element value, to break the iteration you can 
 * optionally return false.
 */
buckets.PriorityQueue.prototype.forEach = function(callback) {
   buckets.heap.forEach(callback);
};


/**
 * Creates an empty set.
 * @class <p>A set is a data structure that contains no duplicate items.</p>
 * <p>If the inserted elements are custom objects a function 
 * which converts elements to strings must be provided. Example:</p>
 *
 * <pre>
 * function petToString(pet) {
 *  return pet.name;
 * }
 * </pre>
 *
 * @constructor
 * @param {function(Object):string=} toStringFunction optional function used
 * to convert elements to strings. If the elements aren't strings or if toString()
 * is not appropriate, a custom function which receives a onject and returns a
 * unique string must be provided.
 */
buckets.Set = function(toStringFunction) {
    this.dictionary = new buckets.Dictionary(toStringFunction);
};

/**
 * Returns true if this set contains the specified element.
 * @param {Object} element element to search for.
 * @return {boolean} true if this set contains the specified element,
 * false otherwise.
 */
buckets.Set.prototype.contains = function(element) {
    return this.dictionary.containsKey(element);
};

/**
 * Adds the specified element to this set if it is not already present.
 * @param {Object} element the element to insert.
 * @return {boolean} true if this set did not already contain the specified element.
 */
buckets.Set.prototype.add = function(element) {
    if (this.contains(element) || buckets.isUndefined(element)) {
        return false;
    } else {
        this.dictionary.set(element, element);
        return true;
    }
};

/**
 * Performs an intersecion between this an another set.
 * Removes all values that are not present this set and the given set.
 * @param {buckets.Set} otherSet other set.
 */
buckets.Set.prototype.intersection = function(otherSet) {
    var set = this;
    this.forEach(function(element) {
        if (!otherSet.contains(element)) {
            set.remove(element);
        }
    });
};

/**
 * Performs a union between this an another set.
 * Adds all values from the given set to this set.
 * @param {buckets.Set} otherSet other set.
 */
buckets.Set.prototype.union = function(otherSet) {
    var set = this;
    otherSet.forEach(function(element) {
        set.add(element);
    });
};

/**
 * Performs a difference between this an another set.
 * Removes from this set all the values that are present in the given set.
 * @param {buckets.Set} otherSet other set.
 */
buckets.Set.prototype.difference = function(otherSet) {
    var set = this;
    otherSet.forEach(function(element) {
        set.remove(element);
    });
};

/**
 * Checks whether the given set contains all the elements in this set.
 * @param {buckets.Set} otherSet other set.
 * @return {boolean} true if this set is a subset of the given set.
 */
buckets.Set.prototype.isSubsetOf = function(otherSet) {
    if (this.size() > otherSet.size()) {
        return false;
    }

    this.forEach(function(element) {
        if (!otherSet.contains(element)) {
            return false;
        }
    });
    return true;
};

/**
 * Removes the specified element from this set if it is present.
 * @return {boolean} true if this set contained the specified element.
 */
buckets.Set.prototype.remove = function(element) {
    if (!this.contains(element)) {
        return false;
    } else {
        this.dictionary.remove(element);
        return true;
    }
};

/**
 * Executes the provided function once for each element 
 * present in this set.
 * @param {function(Object):*} callback function to execute, it is
 * invoked with one arguments: the element. To break the iteration you can 
 * optionally return false.
 */
buckets.Set.prototype.forEach = function(callback) {
    this.dictionary.forEach(function(k, v) {
        return callback(v);
    });
};

/**
 * Returns an array containing all of the elements in this set in arbitrary order.
 * @return {Array} an array containing all of the elements in this set.
 */
buckets.Set.prototype.toArray = function() {
    return this.dictionary.values();
};

/**
 * Returns true if this set contains no elements.
 * @return {boolean} true if this set contains no elements.
 */
buckets.Set.prototype.isEmpty = function() {
    return this.dictionary.isEmpty();
};

/**
 * Returns the number of elements in this set.
 * @return {number} the number of elements in this set.
 */
buckets.Set.prototype.size = function() {
    return this.dictionary.size();
};

/**
 * Removes all of the elements from this set.
 */
buckets.Set.prototype.clear = function() {
    this.dictionary.clear();
};

/**
 * Creates an empty bag.
 * @class <p>A bag is a special kind of set in which members are 
 * allowed to appear more than once.</p>
 * <p>If the inserted elements are custom objects a function 
 * which converts elements to unique strings must be provided. Example:</p>
 *
 * <pre>
 * function petToString(pet) {
 *  return pet.name;
 * }
 * </pre>
 *
 * @constructor
 * @param {function(Object):string=} toStringFunction optional function used
 * to convert elements to strings. If the elements aren't strings or if toString()
 * is not appropriate, a custom function which receives an object and returns a
 * unique string must be provided.
 */
buckets.Bag = function(toStrFunction) {
    this.toStrF = toStrFunction || buckets.defaultToString;
    this.dictionary = new buckets.Dictionary(this.toStrF);
    this.nElements = 0;
};

/**
* Adds nCopies of the specified object to this bag.
* @param {Object} element element to add.
* @param {number=} nCopies the number of copies to add, if this argument is
* undefined 1 copy is added.
* @return {boolean} true unless element is undefined.
*/
buckets.Bag.prototype.add = function(element, nCopies) {

    if (isNaN(nCopies) || buckets.isUndefined(nCopies)) {
        nCopies = 1;
    }
    if (buckets.isUndefined(element) || nCopies <= 0) {
        return false;
    }

    if (!this.contains(element)) {
        var node = {
            value: element,
            copies: nCopies
        };
        this.dictionary.set(element, node);
    } else {
        this.dictionary.get(element).copies += nCopies;
    }
    this.nElements += nCopies;
    return true;
};

/**
* Counts the number of copies of the specified object in this bag.
* @param {Object} element the object to search for..
* @return {number} the number of copies of the object, 0 if not found
*/
buckets.Bag.prototype.count = function(element) {

    if (!this.contains(element)) {
        return 0;
    } else {
        return this.dictionary.get(element).copies;
    }
};

/**
 * Returns true if this bag contains the specified element.
 * @param {Object} element element to search for.
 * @return {boolean} true if this bag contains the specified element,
 * false otherwise.
 */
buckets.Bag.prototype.contains = function(element) {
    return this.dictionary.containsKey(element);
};

/**
* Removes nCopies of the specified object to this bag.
* If the number of copies to remove is greater than the actual number 
* of copies in the Bag, all copies are removed. 
* @param {Object} element element to remove.
* @param {number=} nCopies the number of copies to remove, if this argument is
* undefined 1 copy is removed.
* @return {boolean} true if at least 1 element was removed.
*/
buckets.Bag.prototype.remove = function(element, nCopies) {

    if (isNaN(nCopies) || buckets.isUndefined(nCopies)) {
        nCopies = 1;
    }
    if (buckets.isUndefined(element) || nCopies <= 0) {
        return false;
    }

    if (!this.contains(element)) {
        return false;
    } else {
        var node = this.dictionary.get(element);
        if (nCopies > node.copies) {
            this.nElements -= node.copies;
        } else {
            this.nElements -= nCopies;
        }
        node.copies -= nCopies;
        if (node.copies <= 0) {
            this.dictionary.remove(element);
        }
        return true;
    }
};

/**
 * Returns an array containing all of the elements in this big in arbitrary order, 
 * including multiple copies.
 * @return {Array} an array containing all of the elements in this bag.
 */
buckets.Bag.prototype.toArray = function() {
    var a = [];
    var values = this.dictionary.values();
    var vl = values.length;
    for (var i = 0; i < vl; i++) {
        var node = values[i];
        var element = node.value;
        var copies = node.copies;
        for (var j = 0; j < copies; j++) {
            a.push(element);
        }
    }
    return a;
};

/**
 * Returns a set of unique elements in this bag. 
 * @return {buckets.Set} a set of unique elements in this bag.
 */
buckets.Bag.prototype.toSet = function() {
    var set = new buckets.Set(this.toStrF);
    var elements = this.dictionary.values();
    var l = elements.length;
    for (var i = 0; i < l; i++) {
        var value = elements[i].value;
        set.add(value);
    }
    return set;
};

/**
 * Executes the provided function once for each element 
 * present in this bag, including multiple copies.
 * @param {function(Object):*} callback function to execute, it is
 * invoked with one argument: the element. To break the iteration you can 
 * optionally return false.
 */
buckets.Bag.prototype.forEach = function(callback) {
    this.dictionary.forEach(function(k, v) {
        var value = v.value;
        var copies = v.copies;
        for (var i = 0; i < copies; i++) {
            if (callback(value) === false) {
                return false;
            }
        }
        return true;
    });
};
/**
 * Returns the number of elements in this bag.
 * @return {number} the number of elements in this bag.
 */
buckets.Bag.prototype.size = function() {
    return this.nElements;
};

/**
 * Returns true if this bag contains no elements.
 * @return {boolean} true if this bag contains no elements.
 */
buckets.Bag.prototype.isEmpty = function() {
    return this.nElements === 0;
};

/**
 * Removes all of the elements from this bag.
 */
buckets.Bag.prototype.clear = function() {
    this.nElements = 0;
    this.dictionary.clear();
};



/**
 * Creates an empty binary search tree.
 * @class <p>A binary search tree is a binary tree in which each 
 * internal node stores an element such that the elements stored in the 
 * left subtree are less than it and the elements 
 * stored in the right subtree are greater.</p>
 * <p>Formally, a binary search tree is a node-based binary tree data structure which 
 * has the following properties:</p>
 * <ul>
 * <li>The left subtree of a node contains only nodes with elements less 
 * than the node's element</li>
 * <li>The right subtree of a node contains only nodes with elements greater 
 * than the node's element</li>
 * <li>Both the left and right subtrees must also be binary search trees.</li>
 * </ul>
 * <p>If the inserted elements are custom objects a compare function must 
 * be provided at construction time, otherwise the <=, === and >= operators are 
 * used to compare elements. Example:</p>
 * <pre>
 * function compare(a, b) {
 *  if (a is less than b by some ordering criterion) {
 *     return -1;
 *  } if (a is greater than b by the ordering criterion) {
 *     return 1;
 *  } 
 *  // a must be equal to b
 *  return 0;
 * }
 * </pre>
 * @constructor
 * @param {function(Object,Object):number=} compareFunction optional
 * function used to compare two elements. Must return a negative integer,
 * zero, or a positive integer as the first argument is less than, equal to,
 * or greater than the second.
 */
buckets.BSTree = function(compareFunction) {
    this.root = null;
    this.compare = compareFunction || buckets.defaultCompare;
    this.nElements = 0;
};


/**
 * Adds the specified element to this tree if it is not already present.
 * @param {Object} element the element to insert.
 * @return {boolean} true if this tree did not already contain the specified element.
 */
buckets.BSTree.prototype.add = function(element) {
    if (buckets.isUndefined(element)) {
        return false;
    }

    if (this.insertNode(this.createNode(element)) !== null) {
        this.nElements++;
        return true;
    }
    return false;
};

/**
 * Removes all of the elements from this tree.
 */
buckets.BSTree.prototype.clear = function() {
    this.root = null;
    this.nElements = 0;
};

/**
 * Returns true if this tree contains no elements.
 * @return {boolean} true if this tree contains no elements.
 */
buckets.BSTree.prototype.isEmpty = function() {
    return this.nElements === 0;
};

/**
 * Returns the number of elements in this tree.
 * @return {number} the number of elements in this tree.
 */
buckets.BSTree.prototype.size = function() {
    return this.nElements;
};

/**
 * Returns true if this tree contains the specified element.
 * @param {Object} element element to search for.
 * @return {boolean} true if this tree contains the specified element,
 * false otherwise.
 */
buckets.BSTree.prototype.contains = function(element) {
    if (buckets.isUndefined(element)) {
        return false;
    }
    return this.searchNode(this.root, element) !== null;
};

/**
 * Removes the specified element from this tree if it is present.
 * @return {boolean} true if this tree contained the specified element.
 */
buckets.BSTree.prototype.remove = function(element) {
    var node = this.searchNode(this.root, element);
    if (node === null) {
        return false;
    }
    this.removeNode(node);
    this.nElements--;
    return true;
};

/**
 * Executes the provided function once for each element present in this tree in 
 * in-order.
 * @param {function(Object):*} callback function to execute, it is invoked with one 
 * argument: the element value, to break the iteration you can optionally return false.
 */
buckets.BSTree.prototype.inorderTraversal = function(callback) {
    this.inorderTraversalAux(this.root, callback, {
        stop: false
    });
};

/**
 * Executes the provided function once for each element present in this tree in pre-order.
 * @param {function(Object):*} callback function to execute, it is invoked with one 
 * argument: the element value, to break the iteration you can optionally return false.
 */
buckets.BSTree.prototype.preorderTraversal = function(callback) {
    this.preorderTraversalAux(this.root, callback, {
        stop: false
    });
};

/**
 * Executes the provided function once for each element present in this tree in post-order.
 * @param {function(Object):*} callback function to execute, it is invoked with one 
 * argument: the element value, to break the iteration you can optionally return false.
 */
buckets.BSTree.prototype.postorderTraversal = function(callback) {
    this.postorderTraversalAux(this.root, callback, {
        stop: false
    });
};

/**
 * Executes the provided function once for each element present in this tree in 
 * level-order.
 * @param {function(Object):*} callback function to execute, it is invoked with one 
 * argument: the element value, to break the iteration you can optionally return false.
 */
buckets.BSTree.prototype.levelTraversal = function(callback) {
    this.levelTraversalAux(this.root, callback);
};

/**
 * Returns the minimum element of this tree.
 * @return {*} the minimum element of this tree or undefined if this tree is
 * is empty.
 */
buckets.BSTree.prototype.minimum = function() {
    if (this.isEmpty()) {
        return undefined;
    }
    return this.minimumAux(this.root).element;
};

/**
 * Returns the maximum element of this tree.
 * @return {*} the maximum element of this tree or undefined if this tree is
 * is empty.
 */
buckets.BSTree.prototype.maximum = function() {
    if (this.isEmpty()) {
        return undefined;
    }
    return this.maximumAux(this.root).element;
};

/**
 * Executes the provided function once for each element present in this tree in inorder.
 * Equivalent to inorderTraversal.
 * @param {function(Object):*} callback function to execute, it is
 * invoked with one argument: the element value, to break the iteration you can 
 * optionally return false.
 */
buckets.BSTree.prototype.forEach = function(callback) {
    this.inorderTraversal(callback);
};

/**
 * Returns an array containing all of the elements in this tree in in-order.
 * @return {Array} an array containing all of the elements in this tree in in-order.
 */
buckets.BSTree.prototype.toArray = function() {
    var array = [];
    this.inorderTraversal(function(element) {
        array.push(element);
    });
    return array;
};

/**
 * Returns the height of this tree.
 * @return {number} the height of this tree or -1 if is empty.
 */
buckets.BSTree.prototype.height = function() {
    return this.heightAux(this.root);
};

/**
* @private
*/
buckets.BSTree.prototype.searchNode = function(node, element) {
    var cmp = null;
    while (node !== null && cmp !== 0) {
        cmp = this.compare(element, node.element);
        if (cmp < 0) {
            node = node.leftCh;
        } else if (cmp > 0) {
            node = node.rightCh;
        }
    }
    return node;
};


/**
* @private
*/
buckets.BSTree.prototype.transplant = function(n1, n2) {
    if (n1.parent === null) {
        this.root = n2;
    } else if (n1 === n1.parent.leftCh) {
        n1.parent.leftCh = n2;
    } else {
        n1.parent.rightCh = n2;
    }
    if (n2 !== null) {
        n2.parent = n1.parent;
    }
};


/**
* @private
*/
buckets.BSTree.prototype.removeNode = function(node) {
    if (node.leftCh === null) {
        this.transplant(node, node.rightCh);
    } else if (node.rightCh === null) {
        this.transplant(node, node.leftCh);
    } else {
        var y = this.minimumAux(node.rightCh);
        if (y.parent !== node) {
            this.transplant(y, y.rightCh);
            y.rightCh = node.rightCh;
            y.rightCh.parent = y;
        }
        this.transplant(node, y);
        y.leftCh = node.leftCh;
        y.leftCh.parent = y;
    }
};
/**
* @private
*/
buckets.BSTree.prototype.inorderTraversalAux = function(node, callback, signal) {
    if (node === null || signal.stop) {
        return;
    }
    this.inorderTraversalAux(node.leftCh, callback, signal);
    if (signal.stop) {
        return;
    }
    signal.stop = callback(node.element) === false;
    if (signal.stop) {
        return;
    }
    this.inorderTraversalAux(node.rightCh, callback, signal);
};

/**
* @private
*/
buckets.BSTree.prototype.levelTraversalAux = function(node, callback) {
    var queue = new buckets.Queue();
    if (node !== null) {
        queue.enqueue(node);
    }
    while (!queue.isEmpty()) {
        node = queue.dequeue();
        if (callback(node.element) === false) {
            return;
        }
        if (node.leftCh !== null) {
            queue.enqueue(node.leftCh);
        }
        if (node.rightCh !== null) {
            queue.enqueue(node.rightCh);
        }
    }
};

/**
* @private
*/
buckets.BSTree.prototype.preorderTraversalAux = function(node, callback, signal) {
    if (node === null || signal.stop) {
        return;
    }
    signal.stop = callback(node.element) === false;
    if (signal.stop) {
        return;
    }
    this.preorderTraversalAux(node.leftCh, callback, signal);
    if (signal.stop) {
        return;
    }
    this.preorderTraversalAux(node.rightCh, callback, signal);
};
/**
* @private
*/
buckets.BSTree.prototype.postorderTraversalAux = function(node, callback, signal) {
    if (node === null || signal.stop) {
        return;
    }
    this.postorderTraversalAux(node.leftCh, callback, signal);
    if (signal.stop) {
        return;
    }
    this.postorderTraversalAux(node.rightCh, callback, signal);
    if (signal.stop) {
        return;
    }
    signal.stop = callback(node.element) === false;
};

/**
* @private
*/
buckets.BSTree.prototype.minimumAux = function(node) {
    while (node.leftCh !== null) {
        node = node.leftCh;
    }
    return node;
};

/**
* @private
*/
buckets.BSTree.prototype.maximumAux = function(node) {
    while (node.rightCh !== null) {
        node = node.rightCh;
    }
    return node;
};

/**
* @private
*/
buckets.BSTree.prototype.successorNode = function(node) {
    if (node.rightCh !== null) {
        return this.minimumAux(node.rightCh);
    }
    var successor = node.parent;
    while (successor !== null && node === successor.rightCh) {
        node = successor;
        successor = node.parent;
    }
    return successor;
};

/**
* @private
*/
buckets.BSTree.prototype.heightAux = function(node) {
    if (node === null) {
        return - 1;
    }
    return Math.max(this.heightAux(node.leftCh), this.heightAux(node.rightCh)) + 1;
};

/*
* @private
*/
buckets.BSTree.prototype.insertNode = function(node) {

    var parent = null;
    var position = this.root;
    var cmp = null;
    while (position !== null) {
        cmp = this.compare(node.element, position.element);
        if (cmp === 0) {
            return null;
        } else if (cmp < 0) {
            parent = position;
            position = position.leftCh;
        } else {
            parent = position;
            position = position.rightCh;
        }
    }
    node.parent = parent;
    if (parent === null) {
        // tree is empty
        this.root = node;
    } else if (this.compare(node.element, parent.element) < 0) {
        parent.leftCh = node;
    } else {
        parent.rightCh = node;
    }
    return node;
};

/**
* @private
*/
buckets.BSTree.prototype.createNode = function(element) {
    return {
        element: element,
        leftCh: null,
        rightCh: null,
        parent: null
    };
};
//customizations to libraries
(function () {
  "use strict";
_.uniqueId = function (prefix) {
    //from ipython project
    // http://www.ietf.org/rfc/rfc4122.txt
    var s = [];
    var hexDigits = "0123456789ABCDEF";
    for (var i = 0; i < 32; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[12] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[16] = hexDigits.substr((s[16] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01

    var uuid = s.join("");
    if (prefix){
        return prefix + "-" + uuid;
    }else{
        return uuid;
    }
};

_.isNullOrUndefined = function(x){
    return _.isNull(x) || _.isUndefined(x);
};

_.setdefault = function(obj, key, value){
    if (_.has(obj, key)){
        return obj[key]}
    else{
        obj[key] = value
        return value
    }
};
}).call(this);


(function(/*! Stitch !*/) {
  if (!this.rrequire) {
    var modules = {}, cache = {}, require = function(name, root) {
      var path = expand(root, name), indexPath = expand(path, './index'), module, fn;
      module   = cache[path] || cache[indexPath]
      if (module) {
        return module.exports;
      } else if (fn = modules[path] || modules[path = indexPath]) {
        module = {id: path, exports: {}};
        try {
          cache[path] = module;
          fn(module.exports, function(name) {
            return require(name, dirname(path));
          }, module);
          return module.exports;
        } catch (err) {
          delete cache[path];
          throw err;
        }
      } else {
        throw 'module \'' + name + '\' not found';
      }
    }, expand = function(root, name) {
      var results = [], parts, part;
      if (/^\.\.?(\/|$)/.test(name)) {
        parts = [root, name].join('/').split('/');
      } else {
        parts = name.split('/');
      }
      for (var i = 0, length = parts.length; i < length; i++) {
        part = parts[i];
        if (part == '..') {
          results.pop();
        } else if (part != '.' && part != '') {
          results.push(part);
        }
      }
      return results.join('/');
    }, dirname = function(path) {
      return path.split('/').slice(0, -1).join('/');
    };
    this.rrequire = function(name) {
      return require(name, '');
    }
    this.rrequire.define = function(bundle) {
      for (var key in bundle)
        modules[key] = bundle[key];
    };
    this.rrequire.modules = modules;
    this.rrequire.cache   = cache;
  }
  return this.rrequire.define;
}).call(this)({
  "serverrun": function(exports, require, module) {(function() {
  var Config, Promises, base, usercontext, utility, utils;

  utils = require("./serverutils");

  base = require("./base");

  Config = base.Config;

  utility = utils.utility;

  Promises = utils.Promises;

  Config.ws_conn_string = "ws://" + window.location.host + "/bokeh/sub";

  usercontext = require("usercontext/usercontext");

  $(function() {
    var load, userdocs, wswrapper;

    wswrapper = utility.make_websocket();
    userdocs = new usercontext.UserDocs();
    userdocs.subscribe(wswrapper, 'defaultuser');
    window.userdocs = userdocs;
    load = userdocs.fetch();
    return load.done(function() {
      var userdocsview;

      userdocsview = new usercontext.UserDocsView({
        collection: userdocs
      });
      return $('#PlotPane').append(userdocsview.el);
    });
  });

}).call(this);
}, "serverutils": function(exports, require, module) {(function() {
  var Collections, Config, Deferreds, HasProperties, Promises, WebSocketWrapper, base, load_models, submodels, utility;

  Deferreds = {};

  Promises = {};

  Deferreds._doc_loaded = $.Deferred();

  Deferreds._doc_requested = $.Deferred();

  Promises.doc_loaded = Deferreds._doc_loaded.promise();

  Promises.doc_requested = Deferreds._doc_requested.promise();

  Promises.doc_promises = {};

  base = require("./base");

  Collections = base.Collections;

  HasProperties = base.HasProperties;

  load_models = base.load_models;

  submodels = base.submodels;

  WebSocketWrapper = base.WebSocketWrapper;

  Config = base.Config;

  exports.wswrapper = null;

  exports.plotcontext = null;

  exports.plotcontextview = null;

  exports.Promises = Promises;

  HasProperties.prototype.sync = Backbone.sync;

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
      var response;

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
    load_doc: function(docid) {
      var response, wswrapper;

      wswrapper = utility.make_websocket();
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
      var wswrapper;

      wswrapper = new WebSocketWrapper(Config.ws_conn_string);
      exports.wswrapper = wswrapper;
      return wswrapper;
    },
    render_plots: function(plot_context_ref, viewclass, viewoptions) {
      var options, plotcontext, plotcontextview;

      if (viewclass == null) {
        viewclass = null;
      }
      if (viewoptions == null) {
        viewoptions = {};
      }
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
    },
    instantiate_doc_single_plot: function(docid, view_model_id, target_el, host) {
      var container;

      if (target_el == null) {
        target_el = "#PlotPane";
      }
      if (host == null) {
        host = "www.wakari.io";
      }
      container = require("./container");
      utility.bokeh_connection(host, docid, "https");
      return Deferreds._doc_loaded.done(function(data) {
        utility.render_plots(data.plot_context_ref, container.PlotContextView, {
          target_model_id: view_model_id
        });
        return $(target_el).empty().append(exports.plotcontextview.el);
      });
    }
  };

  exports.utility = utility;

}).call(this);
}, "usercontext/usercontext": function(exports, require, module) {(function() {
  var ContinuumView, Doc, DocView, HasParent, HasProperties, UserDocs, UserDocsView, base, build_views, documentationtemplate, load_models, userdocstemplate, utility, _ref, _ref1, _ref2, _ref3,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  base = require("../base");

  ContinuumView = require("../common/continuum_view").ContinuumView;

  HasParent = base.HasParent;

  HasProperties = base.HasProperties;

  load_models = base.load_models;

  userdocstemplate = require("./userdocstemplate");

  documentationtemplate = require("./documentationtemplate");

  utility = require("../serverutils").utility;

  build_views = base.build_views;

  DocView = (function(_super) {
    __extends(DocView, _super);

    function DocView() {
      _ref = DocView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    DocView.prototype.template = require("./wrappertemplate");

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

}).call(this);
}, "usercontext/documentationtemplate": function(exports, require, module) {module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<p>\n  <b>\n    You have no Plots.  Follow the intsructions\n    below to create some\n  </b>\n</p>\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "usercontext/wrappertemplate": function(exports, require, module) {module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<div class="accordion-heading bokehdocheading">\n  <a class="accordion-toggle bokehdoclabel" data-toggle="collapse" \n     href="#');
    
      __out.push(__sanitize(this.bodyid));
    
      __out.push('">\n    Document: ');
    
      __out.push(__sanitize(this.model.get('title')));
    
      __out.push('\n    <i class="bokehdelete icon-trash"></i>\n  </a>\n</div>\n<div id="');
    
      __out.push(__sanitize(this.bodyid));
    
      __out.push('" class="accordion-body collapse">\n  <div class="accordion-inner plots">\n  </div>\n</div>\n\n\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "usercontext/userdocstemplate": function(exports, require, module) {module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<div class="accordion">\n</div>\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "embed_core": function(exports, require, module) {(function() {
  var addDirectPlot, addDirectPlotWrap, addPlot, addPlotWrap, base, find_injections, foundEls, injectCss, parse_el, plot_from_dict, search_and_plot, serverLoad, utility,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  base = require("./base");

  utility = require("./serverutils").utility;

  addPlotWrap = function(settings) {
    return addPlot(settings.bokeh_modelid, settings.bokeh_modeltype, settings.element);
  };

  addPlot = function(modelid, modeltype, element) {
    var model, view;

    console.log("addPlot");
    console.log(modelid, modeltype, element);
    base.load_models(window.Bokeh.models);
    model = base.Collections(modeltype).get(modelid);
    view = new model.default_view({
      model: model
    });
    view.render();
    return _.delay(function() {
      return $(element).append(view.$el);
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
        return $(element).append(view.$el);
      });
    });
  };

  injectCss = function(host) {
    var css_urls, load_css, static_base;

    static_base = "http://" + host + "/bokeh/static/vendor/bokehjs/";
    css_urls = ["" + static_base + "css/bokeh.css", "" + static_base + "css/continuum.css", "" + static_base + "css/bootstrap.css"];
    load_css = function(url) {
      var link;

      link = document.createElement('link');
      link.href = url;
      link.rel = "stylesheet";
      link.type = "text/css";
      return document.body.appendChild(link);
    };
    return _.map(load_css, css_urls);
  };

  foundEls = [];

  parse_el = function(el) {
    "this takes a bokeh embed script element and returns the relvant\nattributes through to a dictionary, ";
    var attr, attrs, bokehCount, bokehRe, info, _i, _len;

    attrs = el.attributes;
    bokehRe = /bokeh.*/;
    info = {};
    bokehCount = 0;
    window.attrs = attrs;
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

  find_injections = function() {
    var container, d, el, els, info, is_new_el, matches, new_settings, re, _i, _len;

    els = document.getElementsByTagName('script');
    re = /.*embed.js.*/;
    new_settings = [];
    for (_i = 0, _len = els.length; _i < _len; _i++) {
      el = els[_i];
      is_new_el = __indexOf.call(foundEls, el) < 0;
      matches = el.src.match(re);
      console.log(el, is_new_el, matches);
      if (is_new_el && matches) {
        foundEls.push(el);
        info = parse_el(el);
        d = document.createElement('div');
        container = document.createElement('div');
        el.parentNode.insertBefore(container, el);
        info['element'] = container;
        new_settings.push(info);
      }
    }
    return new_settings;
  };

  plot_from_dict = function(info_dict) {
    if (info_dict.bokeh_plottype === 'embeddata') {
      return window.addPlotWrap(info_dict);
    } else {
      return window.addDirectPlotWrap(info_dict);
    }
  };

  search_and_plot = function() {
    var new_plot_dicts;

    new_plot_dicts = find_injections();
    console.log("find injections called");
    return _.map(new_plot_dicts, plot_from_dict);
  };

  window.addPlotWrap = addPlotWrap;

  window.addDirectPlotWrap = addDirectPlotWrap;

  exports.search_and_plot = search_and_plot;

  console.log('embed_core');

}).call(this);
}, "palettes/palettes": function(exports, require, module) {(function() {
  var all_palettes, colorbrewer, items, name, num, pal;

  colorbrewer = require('./colorbrewer').colorbrewer;

  all_palettes = {};

  for (name in colorbrewer) {
    items = colorbrewer[name];
    for (num in items) {
      pal = items[num];
      all_palettes["" + name + "-" + num] = pal.reverse();
    }
  }

  exports.all_palettes = all_palettes;

}).call(this);
}, "palettes/colorbrewer": function(exports, require, module) {(function() {
  var colorbrewer;

  colorbrewer = {
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

  exports.colorbrewer = colorbrewer;

}).call(this);
}, "overlays/boxselectionoverlay": function(exports, require, module) {(function() {
  var BoxSelectionOverlay, BoxSelectionOverlayView, BoxSelectionOverlays, HasParent, PlotWidget, base, _ref, _ref1, _ref2,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  base = require("../base");

  PlotWidget = require("../common/plot_widget").PlotWidget;

  HasParent = base.HasParent;

  BoxSelectionOverlayView = (function(_super) {
    __extends(BoxSelectionOverlayView, _super);

    function BoxSelectionOverlayView() {
      _ref = BoxSelectionOverlayView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    BoxSelectionOverlayView.prototype.initialize = function(options) {
      this.selecting = false;
      this.xrange = [null, null];
      this.yrange = [null, null];
      BoxSelectionOverlayView.__super__.initialize.call(this, options);
      return this.plot_view.$el.find('.bokeh_canvas_wrapper').append(this.$el);
    };

    BoxSelectionOverlayView.prototype.boxselect = function(xrange, yrange) {
      this.xrange = xrange;
      this.yrange = yrange;
      return this.request_render();
    };

    BoxSelectionOverlayView.prototype.startselect = function() {
      this.selecting = true;
      this.xrange = [null, null];
      this.yrange = [null, null];
      return this.request_render();
    };

    BoxSelectionOverlayView.prototype.stopselect = function() {
      this.selecting = false;
      this.xrange = [null, null];
      this.yrange = [null, null];
      return this.request_render();
    };

    BoxSelectionOverlayView.prototype.bind_bokeh_events = function(options) {
      this.toolview = this.plot_view.tools[this.mget('tool').id];
      this.listenTo(this.toolview, 'boxselect', this.boxselect);
      this.listenTo(this.toolview, 'startselect', this.startselect);
      return this.listenTo(this.toolview, 'stopselect', this.stopselect);
    };

    BoxSelectionOverlayView.prototype.render = function() {
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
      xpos = this.plot_view.view_state.sx_to_device(Math.min(xrange[0], xrange[1]));
      if (xrange) {
        width = Math.abs(xrange[1] - xrange[0]);
      } else {
        width = this.plot_view.view_state.get('width');
      }
      style_string += "; left:" + xpos + "px; width:" + width + "px; ";
      ypos = this.plot_view.view_state.sy_to_device(Math.max(yrange[0], yrange[1]));
      if (yrange) {
        height = yrange[1] - yrange[0];
      } else {
        height = this.plot_view.view_state.get('height');
      }
      this.$el.addClass('shading');
      style_string += "top:" + ypos + "px; height:" + height + "px";
      return this.$el.attr('style', style_string);
    };

    return BoxSelectionOverlayView;

  })(PlotWidget);

  BoxSelectionOverlay = (function(_super) {
    __extends(BoxSelectionOverlay, _super);

    function BoxSelectionOverlay() {
      _ref1 = BoxSelectionOverlay.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    BoxSelectionOverlay.prototype.type = 'BoxSelectionOverlay';

    BoxSelectionOverlay.prototype.default_view = BoxSelectionOverlayView;

    return BoxSelectionOverlay;

  })(HasParent);

  BoxSelectionOverlay.prototype.defaults = _.clone(BoxSelectionOverlay.prototype.defaults);

  _.extend(BoxSelectionOverlay.prototype.defaults, {
    tool: null,
    level: 'overlay'
  });

  BoxSelectionOverlays = (function(_super) {
    __extends(BoxSelectionOverlays, _super);

    function BoxSelectionOverlays() {
      _ref2 = BoxSelectionOverlays.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    BoxSelectionOverlays.prototype.model = BoxSelectionOverlay;

    return BoxSelectionOverlays;

  })(Backbone.Collection);

  exports.boxselectionoverlays = new BoxSelectionOverlays;

  exports.BoxSelectionOverlayView = BoxSelectionOverlayView;

  exports.BoxSelectionOverlay = BoxSelectionOverlay;

}).call(this);
}, "common/random": function(exports, require, module) {(function() {
  var Rand;

  Rand = (function() {
    function Rand(seed) {
      this.seed = seed;
      this.multiplier = 1664525;
      this.modulo = 4294967296;
      this.offset = 1013904223;
      if (!((this.seed != null) && (0 <= seed && seed < this.modulo))) {
        this.seed = (new Date().valueOf() * new Date().getMilliseconds()) % this.modulo;
      }
    }

    Rand.prototype.seed = function(seed) {
      return this.seed = seed;
    };

    Rand.prototype.randn = function() {
      return this.seed = (this.multiplier * this.seed + this.offset) % this.modulo;
    };

    Rand.prototype.randf = function() {
      return this.randn() / this.modulo;
    };

    Rand.prototype.rand = function(n) {
      return Math.floor(this.randf() * n);
    };

    Rand.prototype.rand2 = function(min, max) {
      return min + this.rand(max - min);
    };

    return Rand;

  })();

  exports.Rand = Rand;

}).call(this);
}, "common/datasource": function(exports, require, module) {(function() {
  var ColumnDataSource, ColumnDataSources, HasProperties, ObjectArrayDataSource, ObjectArrayDataSources, base, _ref, _ref1, _ref2, _ref3,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  base = require("../base");

  HasProperties = base.HasProperties;

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
        this.cont_ranges[field] = Collections('Range1d').create({
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
        this.discrete_ranges[field] = Collections('FactorRange').create({
          values: factors
        });
        this.on('change:data', function() {
          factors = _this.compute_discrete_factor(field);
          return _this.discrete_ranges[field] = Collections('FactorRange').set('values', factors);
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

    return ObjectArrayDataSource;

  })(HasProperties);

  ObjectArrayDataSource.prototype.defaults = _.clone(ObjectArrayDataSource.prototype.defaults);

  _.extend(ObjectArrayDataSource.prototype.defaults, {
    data: [{}],
    name: 'data',
    selected: [],
    selecting: false
  });

  ObjectArrayDataSources = (function(_super) {
    __extends(ObjectArrayDataSources, _super);

    function ObjectArrayDataSources() {
      _ref1 = ObjectArrayDataSources.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    ObjectArrayDataSources.prototype.model = ObjectArrayDataSource;

    return ObjectArrayDataSources;

  })(Backbone.Collection);

  ColumnDataSource = (function(_super) {
    __extends(ColumnDataSource, _super);

    function ColumnDataSource() {
      _ref2 = ColumnDataSource.__super__.constructor.apply(this, arguments);
      return _ref2;
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

    ColumnDataSource.prototype.datapoints = function() {
      var data, field, fields, i, point, points, _i, _j, _len, _ref3;

      data = this.get('data');
      fields = _.keys(data);
      points = [];
      for (i = _i = 0, _ref3 = data[fields[0]].length - 1; 0 <= _ref3 ? _i <= _ref3 : _i >= _ref3; i = 0 <= _ref3 ? ++_i : --_i) {
        point = {};
        for (_j = 0, _len = fields.length; _j < _len; _j++) {
          field = fields[_j];
          point[field] = data[field][i];
        }
        points.push(point);
      }
      return points;
    };

    return ColumnDataSource;

  })(ObjectArrayDataSource);

  ColumnDataSources = (function(_super) {
    __extends(ColumnDataSources, _super);

    function ColumnDataSources() {
      _ref3 = ColumnDataSources.__super__.constructor.apply(this, arguments);
      return _ref3;
    }

    ColumnDataSources.prototype.model = ColumnDataSource;

    return ColumnDataSources;

  })(Backbone.Collection);

  exports.objectarraydatasources = new ObjectArrayDataSources;

  exports.columndatasources = new ColumnDataSources;

  exports.ObjectArrayDataSource = ObjectArrayDataSource;

  exports.ColumnDataSource = ColumnDataSource;

}).call(this);
}, "common/grid_plot": function(exports, require, module) {(function() {
  var ContinuumView, GridPlot, GridPlotView, GridPlotViewState, GridPlots, HasParent, HasProperties, PlotViewState, base, build_views, safebind, _ref, _ref1, _ref2, _ref3,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  base = require("../base");

  HasParent = base.HasParent;

  HasProperties = base.HasProperties;

  safebind = base.safebind;

  build_views = base.build_views;

  ContinuumView = require('./continuum_view').ContinuumView;

  PlotViewState = require('./plot').PlotViewState;

  GridPlotView = (function(_super) {
    __extends(GridPlotView, _super);

    function GridPlotView() {
      _ref = GridPlotView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    GridPlotView.prototype.tagName = 'div';

    GridPlotView.prototype.className = "grid_plot";

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
            _results.push(this.childviews[x.id].viewstate);
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

    GridPlotView.prototype.render = function() {
      var cidx, col_widths, height, last_plot, plot_divs, plot_wrapper, plotspec, ridx, row, row_heights, view, width, x_coords, xpos, y_coords, ypos, _i, _j, _k, _len, _len1, _len2, _ref1, _ref2;

      GridPlotView.__super__.render.call(this);
      _ref1 = _.values(this.childviews);
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        view = _ref1[_i];
        view.$el.detach();
      }
      this.$el.html('');
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
          ypos = this.viewstate.position_child_y(view.viewstate.get('outerheight'), y_coords[ridx]);
          xpos = this.viewstate.position_child_x(view.viewstate.get('outerwidth'), x_coords[cidx]);
          plot_wrapper = $("<div class='gp_plotwrapper'></div>");
          plot_wrapper.attr('style', "left:" + xpos + "px; top:" + ypos + "px");
          plot_wrapper.append(view.$el);
          this.$el.append(plot_wrapper);
        }
      }
      height = this.viewstate.get('outerheight');
      width = this.viewstate.get('outerwidth');
      this.$el.attr('style', "height:" + height + "px;width:" + width + "px");
      return this.render_end();
    };

    return GridPlotView;

  })(ContinuumView);

  GridPlot = (function(_super) {
    __extends(GridPlot, _super);

    function GridPlot() {
      _ref1 = GridPlot.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    GridPlot.prototype.type = 'GridPlot';

    GridPlot.prototype.default_view = GridPlotView;

    return GridPlot;

  })(HasParent);

  GridPlot.prototype.defaults = _.clone(GridPlot.prototype.defaults);

  _.extend(GridPlot.prototype.defaults, {
    children: [[]],
    border_space: 0
  });

  GridPlots = (function(_super) {
    __extends(GridPlots, _super);

    function GridPlots() {
      _ref2 = GridPlots.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    GridPlots.prototype.model = GridPlot;

    return GridPlots;

  })(Backbone.Collection);

  GridPlotViewState = (function(_super) {
    __extends(GridPlotViewState, _super);

    function GridPlotViewState() {
      this.layout_widths = __bind(this.layout_widths, this);
      this.layout_heights = __bind(this.layout_heights, this);
      this.setup_layout_properties = __bind(this.setup_layout_properties, this);      _ref3 = GridPlotViewState.__super__.constructor.apply(this, arguments);
      return _ref3;
    }

    GridPlotViewState.prototype.setup_layout_properties = function() {
      var row, viewstate, _i, _len, _ref4, _results;

      this.register_property('layout_heights', this.layout_heights, true);
      this.register_property('layout_widths', this.layout_widths, true);
      _ref4 = this.get('childviewstates');
      _results = [];
      for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
        row = _ref4[_i];
        _results.push((function() {
          var _j, _len1, _results1;

          _results1 = [];
          for (_j = 0, _len1 = row.length; _j < _len1; _j++) {
            viewstate = row[_j];
            this.add_dependencies('layout_heights', viewstate, 'outerheight');
            _results1.push(this.add_dependencies('layout_widths', viewstate, 'outerwidth'));
          }
          return _results1;
        }).call(this));
      }
      return _results;
    };

    GridPlotViewState.prototype.initialize = function(attrs, options) {
      GridPlotViewState.__super__.initialize.call(this, attrs, options);
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

    GridPlotViewState.prototype.position_child_x = function(childsize, offset) {
      return this.xpos(offset);
    };

    GridPlotViewState.prototype.position_child_y = function(childsize, offset) {
      return this.ypos(offset) - childsize;
    };

    GridPlotViewState.prototype.maxdim = function(dim, row) {
      if (row.length === 0) {
        return 0;
      } else {
        return _.max(_.map(row, (function(x) {
          return x.get(dim);
        })));
      }
    };

    GridPlotViewState.prototype.layout_heights = function() {
      var row, row_heights;

      row_heights = (function() {
        var _i, _len, _ref4, _results;

        _ref4 = this.get('childviewstates');
        _results = [];
        for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
          row = _ref4[_i];
          _results.push(this.maxdim('outerheight', row));
        }
        return _results;
      }).call(this);
      return row_heights;
    };

    GridPlotViewState.prototype.layout_widths = function() {
      var col, col_widths, columns, n, num_cols, row;

      num_cols = this.get('childviewstates')[0].length;
      columns = (function() {
        var _i, _len, _ref4, _results;

        _ref4 = _.range(num_cols);
        _results = [];
        for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
          n = _ref4[_i];
          _results.push((function() {
            var _j, _len1, _ref5, _results1;

            _ref5 = this.get('childviewstates');
            _results1 = [];
            for (_j = 0, _len1 = _ref5.length; _j < _len1; _j++) {
              row = _ref5[_j];
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
          _results.push(this.maxdim('outerwidth', col));
        }
        return _results;
      }).call(this);
      return col_widths;
    };

    return GridPlotViewState;

  })(PlotViewState);

  GridPlotViewState.prototype.defaults = _.clone(GridPlotViewState.prototype.defaults);

  _.extend(GridPlotViewState.prototype.defaults, {
    childviewstates: [[]],
    border_space: 0
  });

  exports.GridPlot = GridPlot;

  exports.GridPlotView = GridPlotView;

  exports.GridPlotViewState = GridPlotViewState;

  exports.gridplots = new GridPlots;

}).call(this);
}, "common/gmap_plot": function(exports, require, module) {(function() {
  var ActiveToolManager, Collections, ContinuumView, GMapPlot, GMapPlotView, GMapPlots, GridMapper, HasParent, LEVELS, LinearMapper, ViewState, base, build_views, properties, safebind, text_properties, _ref, _ref1, _ref2,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  base = require('../base');

  Collections = base.Collections;

  HasParent = base.HasParent;

  safebind = base.safebind;

  build_views = base.build_views;

  properties = require('../renderers/properties');

  text_properties = properties.text_properties;

  ContinuumView = require('./continuum_view').ContinuumView;

  LinearMapper = require('../mappers/1d/linear_mapper').LinearMapper;

  GridMapper = require('../mappers/2d/grid_mapper').GridMapper;

  ViewState = require('./view_state').ViewState;

  ActiveToolManager = require("../tools/active_tool_manager").ActiveToolManager;

  LEVELS = ['image', 'underlay', 'glyph', 'overlay', 'annotation', 'tool'];

  GMapPlotView = (function(_super) {
    __extends(GMapPlotView, _super);

    function GMapPlotView() {
      this.bounds_change = __bind(this.bounds_change, this);
      this._mousemove = __bind(this._mousemove, this);
      this._mousedown = __bind(this._mousedown, this);      _ref = GMapPlotView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    GMapPlotView.prototype.events = {
      "mousemove .bokeh_canvas_wrapper": "_mousemove",
      "mousedown .bokeh_canvas_wrapper": "_mousedown"
    };

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
      var level, tool, _i, _j, _len, _len1, _ref1, _ref10, _ref11, _ref12, _ref13, _ref14, _ref15, _ref16, _ref17, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;

      GMapPlotView.__super__.initialize.call(this, _.defaults(options, this.default_options));
      this.throttled_render = _.throttle(this.render, 100);
      this.throttled_render_canvas = _.throttle(this.render_canvas, 100);
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
      this.x_range = (_ref15 = options.x_range) != null ? _ref15 : this.mget_obj('x_range');
      this.y_range = (_ref16 = options.y_range) != null ? _ref16 : this.mget_obj('y_range');
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
      _ref17 = this.mget_obj('tools');
      for (_i = 0, _len = _ref17.length; _i < _len; _i++) {
        tool = _ref17[_i];
        if (tool.type === "PanTool" || tool.type === "ZoomTool") {
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
      sx = this.view_state.v_sx_to_device(sx);
      sy = this.view_state.v_sy_to_device(sy);
      return [sx, sy];
    };

    GMapPlotView.prototype.map_from_screen = function(sx, sy, units) {
      var x, y, _ref1;

      sx = this.view_state.v_device_sx(sx.slice(0));
      sy = this.view_state.v_device_sx(sy.slice(0));
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
      var build_map, ih, iw, left, oh, ow, top,
        _this = this;

      if (full_render == null) {
        full_render = true;
      }
      oh = this.view_state.get('outer_height');
      ow = this.view_state.get('outer_width');
      iw = this.view_state.get('inner_width');
      ih = this.view_state.get('inner_height');
      top = this.view_state.get('border_top');
      left = this.view_state.get('border_left');
      this.button_bar.width("" + ow + "px");
      this.canvas_wrapper.width("" + ow + "px").height("" + oh + "px");
      this.canvas.attr('width', ow).attr('height', oh);
      this.$el.attr("width", ow).attr('height', oh);
      this.gmap_div.attr("style", "top: " + top + "px; left: " + left + "px; position: absolute");
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
        _this.map = new google.maps.Map(_this.gmap_div[0], map_options);
        return google.maps.event.addListener(_this.map, 'bounds_changed', _this.bounds_change);
      };
      _.defer(build_map);
      this.ctx = this.canvas[0].getContext('2d');
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
      return base.Collections.bulksave([this.model]);
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

  })(ContinuumView);

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

    return GMapPlot;

  })(HasParent);

  GMapPlot.prototype.defaults = _.clone(GMapPlot.prototype.defaults);

  _.extend(GMapPlot.prototype.defaults, {
    'data_sources': {},
    'renderers': [],
    'tools': [],
    'title': 'GMapPlot'
  });

  GMapPlot.prototype.display_defaults = _.clone(GMapPlot.prototype.display_defaults);

  _.extend(GMapPlot.prototype.display_defaults, {
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
    title_text_baseline: "alphabetic"
  });

  GMapPlots = (function(_super) {
    __extends(GMapPlots, _super);

    function GMapPlots() {
      _ref2 = GMapPlots.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    GMapPlots.prototype.model = GMapPlot;

    return GMapPlots;

  })(Backbone.Collection);

  exports.GMapPlot = GMapPlot;

  exports.GMapPlotView = GMapPlotView;

  exports.gmapplots = new GMapPlots;

}).call(this);
}, "common/continuum_view": function(exports, require, module) {(function() {
  var ContinuumView, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

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

  exports.ContinuumView = ContinuumView;

}).call(this);
}, "common/textutils": function(exports, require, module) {(function() {
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

  exports.getTextHeight = getTextHeight;

}).call(this);
}, "common/plot_widget": function(exports, require, module) {(function() {
  var ContinuumView, PlotWidget, base, safebind, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  base = require('../base');

  safebind = base.safebind;

  ContinuumView = require("./continuum_view").ContinuumView;

  PlotWidget = (function(_super) {
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
      return ctx.setLineDashOffset = function(dash_offset) {
        ctx.lineDashOffset = dash_offset;
        ctx.mozDashOffset = dash_offset;
        return ctx.webkitLineDashOffset = dash_offset;
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

  })(ContinuumView);

  exports.PlotWidget = PlotWidget;

}).call(this);
}, "common/affine": function(exports, require, module) {(function() {
  var Affine;

  Affine = (function() {
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
      for (i = _i = 0, _ref = xs.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
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

}).call(this);
}, "common/plot": function(exports, require, module) {(function() {
  var ActiveToolManager, Collections, ContinuumView, GridMapper, HasParent, LEVELS, LinearMapper, PNGView, Plot, PlotView, Plots, ViewState, base, build_views, properties, safebind, text_properties, _ref, _ref1, _ref2, _ref3,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  base = require('../base');

  Collections = base.Collections;

  HasParent = base.HasParent;

  safebind = base.safebind;

  build_views = base.build_views;

  properties = require('../renderers/properties');

  text_properties = properties.text_properties;

  ContinuumView = require('./continuum_view').ContinuumView;

  LinearMapper = require('../mappers/1d/linear_mapper').LinearMapper;

  GridMapper = require('../mappers/2d/grid_mapper').GridMapper;

  ViewState = require('./view_state').ViewState;

  ActiveToolManager = require("../tools/active_tool_manager").ActiveToolManager;

  LEVELS = ['image', 'underlay', 'glyph', 'overlay', 'annotation', 'tool'];

  PlotView = (function(_super) {
    __extends(PlotView, _super);

    function PlotView() {
      this._mousemove = __bind(this._mousemove, this);
      this._mousedown = __bind(this._mousedown, this);      _ref = PlotView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    PlotView.prototype.attributes = {
      "class": "plotview"
    };

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
      var level, _i, _len, _ref1, _ref10, _ref11, _ref12, _ref13, _ref14, _ref15, _ref16, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;

      PlotView.__super__.initialize.call(this, _.defaults(options, this.default_options));
      this.throttled_render = _.throttle(this.render, 15);
      this.throttled_render_canvas = _.throttle(this.render_canvas, 15);
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
      this.x_range = (_ref15 = options.x_range) != null ? _ref15 : this.mget_obj('x_range');
      this.y_range = (_ref16 = options.y_range) != null ? _ref16 : this.mget_obj('y_range');
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
        sx = x.slice(0);
        sy = y.slice(0);
      } else {
        _ref1 = this.mapper.v_map_to_target(x, y), sx = _ref1[0], sy = _ref1[1];
      }
      sx = this.view_state.v_sx_to_device(sx);
      sy = this.view_state.v_sy_to_device(sy);
      return [sx, sy];
    };

    PlotView.prototype.map_from_screen = function(sx, sy, units) {
      var x, y, _ref1;

      sx = this.view_state.v_device_to_sx(sx.slice(0));
      sy = this.view_state.v_device_to_sy(sy.slice(0));
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
      var oh, ow;

      if (full_render == null) {
        full_render = true;
      }
      oh = this.view_state.get('outer_height');
      ow = this.view_state.get('outer_width');
      this.button_bar.attr('style', "width:" + ow + "px;");
      this.canvas_wrapper.attr('style', "width:" + ow + "px; height:" + oh + "px");
      this.canvas.attr('width', ow).attr('height', oh);
      this.$el.attr("width", ow).attr('height', oh);
      this.ctx = this.canvas[0].getContext('2d');
      if (full_render) {
        return this.render();
      }
    };

    PlotView.prototype.save_png = function() {
      var data_uri;

      this.render();
      data_uri = this.canvas[0].toDataURL();
      this.model.set('png', this.canvas[0].toDataURL());
      return base.Collections.bulksave([this.model]);
    };

    PlotView.prototype.render = function(force) {
      var have_new_mapper_state, hpadding, k, level, pr, renderers, sx, sy, sym, th, title, v, xms, yms, _i, _j, _k, _len, _len1, _len2, _ref1, _ref2, _ref3, _ref4;

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

    return PlotView;

  })(ContinuumView);

  PNGView = (function(_super) {
    __extends(PNGView, _super);

    function PNGView() {
      _ref1 = PNGView.__super__.constructor.apply(this, arguments);
      return _ref1;
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
      return this.$el.append($("<img  modeltype='" + this.model.type + "' modelid='" + (this.model.get('id')) + "' class='pngview' width='" + this.thumb_x + "'  height='" + this.thumb_y + "'  src='" + png + "'/>"));
    };

    return PNGView;

  })(ContinuumView);

  Plot = (function(_super) {
    __extends(Plot, _super);

    function Plot() {
      _ref2 = Plot.__super__.constructor.apply(this, arguments);
      return _ref2;
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

    return Plot;

  })(HasParent);

  Plot.prototype.defaults = _.clone(Plot.prototype.defaults);

  _.extend(Plot.prototype.defaults, {
    'data_sources': {},
    'renderers': [],
    'tools': [],
    'title': 'Plot'
  });

  Plot.prototype.display_defaults = _.clone(Plot.prototype.display_defaults);

  _.extend(Plot.prototype.display_defaults, {
    background_fill: "#fff",
    border_fill: "#eee",
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
    title_text_baseline: "alphabetic"
  });

  Plots = (function(_super) {
    __extends(Plots, _super);

    function Plots() {
      _ref3 = Plots.__super__.constructor.apply(this, arguments);
      return _ref3;
    }

    Plots.prototype.model = Plot;

    return Plots;

  })(Backbone.Collection);

  exports.Plot = Plot;

  exports.PlotView = PlotView;

  exports.PNGView = PNGView;

  exports.plots = new Plots;

}).call(this);
}, "common/ticking": function(exports, require, module) {(function() {
  var BasicTickFormatter, arange, argsort, arr_div2, arr_div3, auto_interval, auto_ticks, float, heckbert_interval, is_base2, log10, log2, nice_10, nice_2_5_10;

  log10 = function(num) {
    "Returns the base 10 logarithm of a number.";    if (num === 0.0) {
      num += 1.0e-16;
    }
    return Math.log(num) / Math.LN10;
  };

  log2 = function(num) {
    "Returns the base 2 logarithm of a number.";    if (num === 0.0) {
      num += 1.0e-16;
    }
    return Math.log(num) / Math.LN2;
  };

  is_base2 = function(rng) {
    " Returns True if rng is a positive multiple of 2 ";
    var lg;

    if (rng <= 0) {
      return false;
    } else {
      lg = log2(rng);
      return (lg > 0.0) && (lg === Math.floor(lg));
    }
  };

  nice_2_5_10 = function(x, round) {
    var expv, f, nf;

    if (round == null) {
      round = false;
    }
    " if round is false, then use Math.ceil(range) ";
    expv = Math.floor(log10(x));
    f = x / Math.pow(10.0, expv);
    if (round) {
      if (f < 1.5) {
        nf = 1.0;
      } else if (f < 3.0) {
        nf = 2.0;
      } else if (f < 7.5) {
        nf = 5.0;
      } else {
        nf = 10.0;
      }
    } else {
      if (f <= 1.0) {
        nf = 1.0;
      } else if (f <= 2.0) {
        nf = 2.0;
      } else if (f <= 5.0) {
        nf = 5.0;
      } else {
        nf = 10.0;
      }
    }
    return nf * Math.pow(10, expv);
  };

  nice_10 = function(x, round) {
    var expv;

    if (round == null) {
      round = false;
    }
    expv = Math.floor(log10(x * 1.0001));
    return Math.pow(10.0, expv);
  };

  heckbert_interval = function(min, max, numticks, nice, loose) {
    var d, graphmax, graphmin, range;

    if (numticks == null) {
      numticks = 8;
    }
    if (nice == null) {
      nice = nice_2_5_10;
    }
    if (loose == null) {
      loose = false;
    }
    "Returns a \"nice\" range and interval for a given data range and a preferred\nnumber of ticks.  From Paul Heckbert's algorithm in Graphics Gems.";
    range = nice(max - min);
    d = nice(range / (numticks - 1), true);
    if (loose) {
      graphmin = Math.floor(min / d) * d;
      graphmax = Math.ceil(max / d) * d;
    } else {
      graphmin = Math.ceil(min / d) * d;
      graphmax = Math.floor(max / d) * d;
    }
    return [graphmin, graphmax, d];
  };

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

  auto_ticks = function(data_low, data_high, bound_low, bound_high, tick_interval, use_endpoints, zero_always_nice) {
    var auto_lower, auto_upper, delta, end, i, intervals, is_auto_high, is_auto_low, lower, rng, start, tick, ticks, upper, _i, _ref, _ref1;

    if (use_endpoints == null) {
      use_endpoints = false;
    }
    if (zero_always_nice == null) {
      zero_always_nice = true;
    }
    " Finds locations for axis tick marks.\n\nCalculates the locations for tick marks on an axis. The *bound_low*,\n*bound_high*, and *tick_interval* parameters specify how the axis end\npoints and tick interval are calculated.\n\nParameters\n----------\n\ndata_low, data_high : number\n    The minimum and maximum values of the data along this axis.\n    If any of the bound settings are 'auto' or 'fit', the axis\n    bounds are calculated automatically from these values.\nbound_low, bound_high : 'auto', 'fit', or a number.\n    The lower and upper bounds of the axis. If the value is a number,\n    that value is used for the corresponding end point. If the value is\n    'auto', then the end point is calculated automatically. If the\n    value is 'fit', then the axis bound is set to the corresponding\n    *data_low* or *data_high* value.\ntick_interval : can be 'auto' or a number\n    If the value is a positive number, it specifies the length\n    of the tick interval; a negative integer specifies the\n    number of tick intervals; 'auto' specifies that the number and\n    length of the tick intervals are automatically calculated, based\n    on the range of the axis.\nuse_endpoints : Boolean\n    If True, the lower and upper bounds of the data are used as the\n    lower and upper end points of the axis. If False, the end points\n    might not fall exactly on the bounds.\nzero_always_nice : Boolean\n    If True, ticks much closer to zero than the tick interval will be\n    coerced to have a value of zero\n\nReturns\n-------\nAn array of tick mark locations. The first and last tick entries are the\naxis end points.";
    is_auto_low = bound_low === 'auto';
    is_auto_high = bound_high === 'auto';
    if (typeof bound_low === "string") {
      lower = data_low;
    } else {
      lower = bound_low;
    }
    if (typeof bound_high === "string") {
      upper = data_high;
    } else {
      upper = bound_high;
    }
    if ((tick_interval === 'auto') || (tick_interval === 0.0)) {
      rng = Math.abs(upper - lower);
      if (rng === 0.0) {
        tick_interval = 0.5;
        lower = data_low - 0.5;
        upper = data_high + 0.5;
      } else if (is_base2(rng) && is_base2(upper) && rng > 4) {
        if (rng === 2) {
          tick_interval = 1;
        } else if (rng === 4) {
          tick_interval = 4;
        } else {
          tick_interval = rng / 4;
        }
      } else {
        tick_interval = auto_interval(lower, upper);
      }
    } else if (tick_interval < 0) {
      intervals = -tick_interval;
      tick_interval = tick_intervals(lower, upper, intervals);
      if (is_auto_low && is_auto_high) {
        is_auto_low = is_auto_high = false;
        lower = tick_interval * Math.floor(lower / tick_interval);
        while ((Math.abs(lower) >= tick_interval) && ((lower + tick_interval * (intervals - 1)) >= upper)) {
          lower -= tick_interval;
        }
        upper = lower + tick_interval * intervals;
      }
    }
    if (is_auto_low || is_auto_high) {
      delta = 0.01 * tick_interval * (data_low === data_high);
      _ref = auto_bounds(data_low - delta, data_high + delta, tick_interval), auto_lower = _ref[0], auto_upper = _ref[1];
      if (is_auto_low) {
        lower = auto_lower;
      }
      if (is_auto_high) {
        upper = auto_upper;
      }
    }
    start = Math.floor(lower / tick_interval) * tick_interval;
    end = Math.floor(upper / tick_interval) * tick_interval;
    if (start === end) {
      lower = start = start - tick_interval;
      upper = end = start - tick_interval;
    }
    if (upper > end) {
      end += tick_interval;
    }
    ticks = arange(start, end + (tick_interval / 2.0), tick_interval);
    if (zero_always_nice) {
      for (i = _i = 0, _ref1 = ticks.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        if (Math.abs(ticks[i]) < tick_interval / 1000) {
          ticks[i] = 0;
        }
      }
    }
    if ((!is_auto_low) && use_endpoints) {
      ticks[0] = lower;
    }
    if ((!is_auto_high) && use_endpoints) {
      ticks[ticks.length - 1] = upper;
    }
    return (function() {
      var _j, _len, _results;

      _results = [];
      for (_j = 0, _len = ticks.length; _j < _len; _j++) {
        tick = ticks[_j];
        if (tick >= bound_low && tick <= bound_high) {
          _results.push(tick);
        }
      }
      return _results;
    })();
  };

  arr_div2 = function(numerator, denominators) {
    var output_arr, val, _i, _len;

    output_arr = [];
    for (_i = 0, _len = denominators.length; _i < _len; _i++) {
      val = denominators[_i];
      output_arr.push(numerator / val);
    }
    return output_arr;
  };

  arr_div3 = function(numerators, denominators) {
    var i, output_arr, val, _i, _len;

    output_arr = [];
    for (i = _i = 0, _len = denominators.length; _i < _len; i = ++_i) {
      val = denominators[i];
      output_arr.push(numerators[i] / val);
    }
    return output_arr;
  };

  argsort = function(arr) {
    var i, ret_arr, sorted_arr, y, _i, _len;

    sorted_arr = _.sortBy(arr, _.identity);
    ret_arr = [];
    for (i = _i = 0, _len = sorted_arr.length; _i < _len; i = ++_i) {
      y = sorted_arr[i];
      ret_arr[i] = arr.indexOf(y);
    }
    return ret_arr;
  };

  float = function(x) {
    return x + 0.0;
  };

  auto_interval = function(data_low, data_high) {
    " Calculates the tick interval for a range.\n\nThe boundaries for the data to be plotted on the axis are::\n\n    data_bounds = (data_low,data_high)\n\nThe function chooses the number of tick marks, which can be between\n3 and 9 marks (including end points), and chooses tick intervals at\n1, 2, 2.5, 5, 10, 20, ...\n\nReturns\n-------\ninterval : float\n    tick mark interval for axis";
    var best_magics, best_mantissas, candidate_intervals, diff_arr, divisions, interval, ma, magic_index, magic_intervals, magnitude, magnitudes, mantissa_index, mantissas, mi, range, result, _i, _j, _len, _len1;

    range = float(data_high) - float(data_low);
    divisions = [8.0, 7.0, 6.0, 5.0, 4.0, 3.0];
    candidate_intervals = arr_div2(range, divisions);
    magnitudes = candidate_intervals.map(function(candidate) {
      return Math.pow(10.0, Math.floor(log10(candidate)));
    });
    mantissas = arr_div3(candidate_intervals, magnitudes);
    magic_intervals = [1.0, 2.0, 2.5, 5.0, 10.0];
    best_mantissas = [];
    best_magics = [];
    for (_i = 0, _len = magic_intervals.length; _i < _len; _i++) {
      mi = magic_intervals[_i];
      diff_arr = mantissas.map(function(x) {
        return Math.abs(mi - x);
      });
      best_magics.push(_.min(diff_arr));
    }
    for (_j = 0, _len1 = mantissas.length; _j < _len1; _j++) {
      ma = mantissas[_j];
      diff_arr = magic_intervals.map(function(x) {
        return Math.abs(ma - x);
      });
      best_mantissas.push(_.min(diff_arr));
    }
    magic_index = argsort(best_magics)[0];
    mantissa_index = argsort(best_mantissas)[0];
    interval = magic_intervals[magic_index];
    magnitude = magnitudes[mantissa_index];
    result = interval * magnitude;
    return result;
  };

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
          for (i = _j = 0, _ref = ticks.length - 1; 0 <= _ref ? _j <= _ref : _j >= _ref; i = 0 <= _ref ? ++_j : --_j) {
            labels[i] = ticks[i].toExponential(this.precision);
          }
        } else {
          for (i = _k = 0, _ref1 = ticks.length - 1; 0 <= _ref1 ? _k <= _ref1 : _k >= _ref1; i = 0 <= _ref1 ? ++_k : --_k) {
            labels[i] = ticks[i].toPrecision(this.precision).replace(/(\.[0-9]*?)0+$/, "$1").replace(/\.$/, "");
          }
        }
        return labels;
      } else if (this.precision === 'auto') {
        labels = new Array(ticks.length);
        for (x = _l = _ref2 = this.last_precision; _ref2 <= 15 ? _l <= 15 : _l >= 15; x = _ref2 <= 15 ? ++_l : --_l) {
          is_ok = true;
          if (need_sci) {
            for (i = _m = 0, _ref3 = ticks.length - 1; 0 <= _ref3 ? _m <= _ref3 : _m >= _ref3; i = 0 <= _ref3 ? ++_m : --_m) {
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
            for (i = _n = 0, _ref4 = ticks.length - 1; 0 <= _ref4 ? _n <= _ref4 : _n >= _ref4; i = 0 <= _ref4 ? ++_n : --_n) {
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

  exports.nice_2_5_10 = nice_2_5_10;

  exports.nice_10 = nice_10;

  exports.heckbert_interval = heckbert_interval;

  exports.auto_ticks = auto_ticks;

  exports.auto_interval = auto_interval;

  exports.BasicTickFormatter = BasicTickFormatter;

}).call(this);
}, "common/view_state": function(exports, require, module) {(function() {
  var Collections, HasProperties, Range1d, ViewState, base, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  base = require('../base');

  Range1d = require('../common/ranges').Range1d;

  Collections = base.Collections;

  HasProperties = base.HasProperties;

  ViewState = (function(_super) {
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
      _inner_range_horizontal = new Range1d({
        start: this.get('border_left'),
        end: this.get('border_left') + this.get('inner_width')
      });
      this.register_property('inner_range_horizontal', function() {
        _inner_range_horizontal.set('start', this.get('border_left'));
        _inner_range_horizontal.set('end', this.get('border_left') + this.get('inner_width'));
        return _inner_range_horizontal;
      }, true);
      this.add_dependencies('inner_range_horizontal', this, ['border_left', 'inner_width']);
      _inner_range_vertical = new Range1d({
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

    ViewState.prototype.sx_to_device = function(x) {
      return x + 0.5;
    };

    ViewState.prototype.sy_to_device = function(y) {
      return this.get('canvas_height') - y + 0.5;
    };

    ViewState.prototype.v_sx_to_device = function(xx) {
      var idx, x, _i, _len;

      for (idx = _i = 0, _len = xx.length; _i < _len; idx = ++_i) {
        x = xx[idx];
        xx[idx] = x + 0.5;
      }
      return xx;
    };

    ViewState.prototype.v_sy_to_device = function(yy) {
      var canvas_height, idx, y, _i, _len;

      canvas_height = this.get('canvas_height');
      for (idx = _i = 0, _len = yy.length; _i < _len; idx = ++_i) {
        y = yy[idx];
        yy[idx] = canvas_height - y + 0.5;
      }
      return yy;
    };

    ViewState.prototype.device_to_sx = function(x) {
      return x - 0.5;
    };

    ViewState.prototype.device_to_sy = function(y) {
      return this.get('canvas_height') - y - 0.5;
    };

    ViewState.prototype.v_device_to_sx = function(xx) {
      var idx, x, _i, _len;

      for (idx = _i = 0, _len = xx.length; _i < _len; idx = ++_i) {
        x = xx[idx];
        xx[idx] = x - 0.5;
      }
      return xx;
    };

    ViewState.prototype.v_device_to_sy = function(yy) {
      var canvas_height, idx, y, _i, _len;

      canvas_height = this.get('canvas_height');
      for (idx = _i = 0, _len = yy.length; _i < _len; idx = ++_i) {
        y = yy[idx];
        yy[idx] = y - canvas_height - 0.5;
      }
      return yy;
    };

    return ViewState;

  })(HasProperties);

  exports.ViewState = ViewState;

}).call(this);
}, "common/plot_context": function(exports, require, module) {(function() {
  var ContinuumView, HasParent, HasProperties, PNGContextView, PNGView, PlotContext, PlotContextView, PlotContextViewState, PlotContextViewWithMaximized, PlotContexts, PlotList, PlotLists, PlotView, base, build_views, safebind, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  base = require("../base");

  PNGView = require("./plot").PNGView;

  PlotView = require("./plot").PlotView;

  HasParent = base.HasParent;

  HasProperties = base.HasProperties;

  safebind = base.safebind;

  build_views = base.build_views;

  ContinuumView = require('./continuum_view').ContinuumView;

  PlotContextView = (function(_super) {
    __extends(PlotContextView, _super);

    function PlotContextView() {
      this.removeplot = __bind(this.removeplot, this);
      this.closeall = __bind(this.closeall, this);      _ref = PlotContextView.__super__.constructor.apply(this, arguments);
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

  })(ContinuumView);

  PNGContextView = (function(_super) {
    __extends(PNGContextView, _super);

    function PNGContextView() {
      this.pngclick = __bind(this.pngclick, this);      _ref1 = PNGContextView.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    PNGContextView.prototype.initialize = function(options) {
      this.thumb_x = options.thumb_x;
      this.thumb_y = options.thumb_y;
      this.views = {};
      this.views_rendered = [false];
      this.child_models = [];
      PNGContextView.__super__.initialize.call(this, options);
      return this.render();
    };

    PNGContextView.prototype.pngclick = function(e) {
      var modelid, modeltype;

      modeltype = $(e.currentTarget).attr('modeltype');
      modelid = $(e.currentTarget).attr('modelid');
      return this.trigger('showplot', {
        type: modeltype,
        id: modelid
      });
    };

    PNGContextView.prototype.delegateEvents = function() {
      safebind(this, this.model, 'destroy', this.remove);
      safebind(this, this.model, 'change', this.render);
      return PNGContextView.__super__.delegateEvents.call(this);
    };

    PNGContextView.prototype.build_children = function() {
      var created_views, pv, view_classes, view_model, _i, _len, _ref2;

      view_classes = [];
      _ref2 = this.mget_obj('children');
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        view_model = _ref2[_i];
        if (!view_model.get('png')) {
          console.log("no png for " + view_model.id + " making one");
          pv = new view_model.default_view({
            model: view_model
          });
          pv.save_png();
        }
        view_classes.push(PNGView);
      }
      created_views = build_views(this.views, this.mget_obj('children'), {
        thumb_x: this.thumb_x,
        thumb_y: this.thumby
      }, view_classes);
      window.pc_created_views = created_views;
      window.pc_views = this.views;
      return null;
    };

    PNGContextView.prototype.events = {
      'click .plotclose': 'removeplot',
      'click .closeall': 'closeall',
      'click .pngview': 'pngclick'
    };

    return PNGContextView;

  })(PlotContextView);

  PlotContextViewState = (function(_super) {
    __extends(PlotContextViewState, _super);

    function PlotContextViewState() {
      _ref2 = PlotContextViewState.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    PlotContextViewState.prototype.defaults = {
      maxheight: 600,
      maxwidth: 600,
      selected: 0
    };

    return PlotContextViewState;

  })(HasProperties);

  PlotContextViewWithMaximized = (function(_super) {
    __extends(PlotContextViewWithMaximized, _super);

    function PlotContextViewWithMaximized() {
      _ref3 = PlotContextViewWithMaximized.__super__.constructor.apply(this, arguments);
      return _ref3;
    }

    PlotContextViewWithMaximized.prototype.initialize = function(options) {
      var _this = this;

      this.selected = 0;
      this.viewstate = new PlotContextViewState({
        maxheight: options.maxheight,
        maxwidth: options.maxwidth
      });
      PlotContextViewWithMaximized.__super__.initialize.call(this, options);
      safebind(this, this.viewstate, 'change', this.render);
      return safebind(this, this.model, 'change:children', function() {
        var selected;

        selected = _this.viewstate.get('selected');
        if (selected > _this.model.get('children') - 1) {
          return _this.viewstate.set('selected', 0);
        }
      });
    };

    PlotContextViewWithMaximized.prototype.events = {
      'click .maximize': 'maximize',
      'click .plotclose': 'removeplot',
      'click .closeall': 'closeall',
      'keydown .plottitle': 'savetitle'
    };

    PlotContextViewWithMaximized.prototype.maximize = function(e) {
      var plotnum;

      plotnum = parseInt($(e.currentTarget).parent().attr('data-plot_num'));
      return this.viewstate.set('selected', plotnum);
    };

    PlotContextViewWithMaximized.prototype.render = function() {
      var index, key, main, model, modelref, node, tab_names, title, to_render, val, view, _i, _len, _ref4, _ref5,
        _this = this;

      PlotContextViewWithMaximized.__super__.render.call(this);
      this.build_children();
      _ref4 = this.views;
      for (key in _ref4) {
        if (!__hasProp.call(_ref4, key)) continue;
        val = _ref4[key];
        val.$el.detach();
      }
      this.$el.html('');
      main = $("<div class='plotsidebar'><div>");
      this.$el.append(main);
      this.$el.append("<div class='maxplot'>");
      main.append("<div><a class='closeall' href='#'>Close All Plots</a></div>");
      main.append("<br/>");
      to_render = [];
      tab_names = {};
      _ref5 = this.mget('children');
      for (index = _i = 0, _len = _ref5.length; _i < _len; index = ++_i) {
        modelref = _ref5[index];
        view = this.views[modelref.id];
        node = $("<div class='jsp' data-plot_num='" + index + "'></div>");
        main.append(node);
        title = view.model.get('title');
        node.append($("<textarea class='plottitle'>" + title + "</textarea>"));
        node.append($("<a class='maximize'>[max]</a>"));
        node.append($("<a class='plotclose'>[close]</a>"));
        node.append(view.el);
      }
      if (this.mget('children').length > 0) {
        modelref = this.mget('children')[this.viewstate.get('selected')];
        model = this.model.resolve_ref(modelref);
        this.maxview = new model.default_view({
          model: model
        });
        this.$el.find('.maxplot').append(this.maxview.$el);
      } else {
        this.maxview = null;
      }
      _.defer(function() {
        var height, heightratio, maxheight, maxwidth, newheight, newwidth, ratio, textarea, width, widthratio, _j, _len1, _ref6;

        _ref6 = main.find('.plottitle');
        for (_j = 0, _len1 = _ref6.length; _j < _len1; _j++) {
          textarea = _ref6[_j];
          _this.size_textarea($(textarea));
        }
        if (_this.maxview) {
          width = model.get('width');
          height = model.get('height');
          maxwidth = _this.viewstate.get('maxwidth');
          maxheight = _this.viewstate.get('maxheight');
          widthratio = maxwidth / width;
          heightratio = maxheight / height;
          ratio = _.min([widthratio, heightratio]);
          newwidth = ratio * width;
          newheight = ratio * height;
          _this.maxview.viewstate.set('height', newheight);
          return _this.maxview.viewstate.set('width', newwidth);
        }
      });
      return null;
    };

    return PlotContextViewWithMaximized;

  })(PlotContextView);

  PlotContext = (function(_super) {
    __extends(PlotContext, _super);

    function PlotContext() {
      _ref4 = PlotContext.__super__.constructor.apply(this, arguments);
      return _ref4;
    }

    PlotContext.prototype.type = 'PlotContext';

    PlotContext.prototype.default_view = PlotContextView;

    PlotContext.prototype.url = function() {
      return PlotContext.__super__.url.call(this);
    };

    PlotContext.prototype.defaults = {
      children: [],
      render_loop: true
    };

    return PlotContext;

  })(HasParent);

  PlotList = (function(_super) {
    __extends(PlotList, _super);

    function PlotList() {
      _ref5 = PlotList.__super__.constructor.apply(this, arguments);
      return _ref5;
    }

    PlotList.prototype.type = 'PlotList';

    return PlotList;

  })(PlotContext);

  PlotContexts = (function(_super) {
    __extends(PlotContexts, _super);

    function PlotContexts() {
      _ref6 = PlotContexts.__super__.constructor.apply(this, arguments);
      return _ref6;
    }

    PlotContexts.prototype.model = PlotContext;

    return PlotContexts;

  })(Backbone.Collection);

  PlotLists = (function(_super) {
    __extends(PlotLists, _super);

    function PlotLists() {
      _ref7 = PlotLists.__super__.constructor.apply(this, arguments);
      return _ref7;
    }

    PlotLists.prototype.model = PlotList;

    return PlotLists;

  })(PlotContexts);

  exports.PlotContext = PlotContext;

  exports.PlotContexts = PlotContexts;

  exports.PlotContextView = PlotContextView;

  exports.PlotContextViewState = PlotContextViewState;

  exports.PlotContextViewWithMaximized = PlotContextViewWithMaximized;

  exports.plotlists = new PlotLists();

  exports.plotcontexts = new PlotContexts();

  exports.PNGContextView = PNGContextView;

}).call(this);
}, "common/grid_view_state": function(exports, require, module) {(function() {
  var GridViewState, ViewState, base, safebind, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  base = require("../base");

  safebind = base.safebind;

  ViewState = require('./view_state').ViewState;

  GridViewState = (function(_super) {
    __extends(GridViewState, _super);

    function GridViewState() {
      this.layout_widths = __bind(this.layout_widths, this);
      this.layout_heights = __bind(this.layout_heights, this);
      this.setup_layout_properties = __bind(this.setup_layout_properties, this);      _ref = GridViewState.__super__.constructor.apply(this, arguments);
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

    GridViewState.prototype.position_child_x = function(childsize, offset) {
      return this.sx_to_device(offset);
    };

    GridViewState.prototype.position_child_y = function(childsize, offset) {
      return this.sy_to_device(offset) - childsize;
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

    return GridViewState;

  })(ViewState);

  GridViewState.prototype.defaults = _.clone(GridViewState.prototype.defaults);

  _.extend(GridViewState.prototype.defaults, {
    childviewstates: [[]],
    border_space: 0
  });

  exports.GridViewState = GridViewState;

}).call(this);
}, "common/ranges": function(exports, require, module) {(function() {
  var DataFactorRange, DataFactorRanges, DataRange1d, DataRange1ds, FactorRange, FactorRanges, HasProperties, Range1d, Range1ds, base, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  base = require("../base");

  HasProperties = base.HasProperties;

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

    return Range1d;

  })(HasProperties);

  Range1d.prototype.defaults = _.clone(Range1d.prototype.defaults);

  _.extend(Range1d.prototype.defaults, {
    start: 0,
    end: 1
  });

  Range1ds = (function(_super) {
    __extends(Range1ds, _super);

    function Range1ds() {
      _ref1 = Range1ds.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Range1ds.prototype.model = Range1d;

    return Range1ds;

  })(Backbone.Collection);

  DataRange1d = (function(_super) {
    __extends(DataRange1d, _super);

    function DataRange1d() {
      _ref2 = DataRange1d.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    DataRange1d.prototype.type = 'DataRange1d';

    DataRange1d.prototype._get_minmax = function() {
      var center, colname, columns, i, max, maxs, min, mins, source, sourceobj, span, _i, _j, _k, _len, _len1, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8;

      columns = [];
      _ref3 = this.get('sources');
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        source = _ref3[_i];
        sourceobj = this.resolve_ref(source['ref']);
        _ref4 = source['columns'];
        for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
          colname = _ref4[_j];
          columns.push(sourceobj.getcolumn(colname));
        }
      }
      columns = _.reduce(columns, (function(x, y) {
        return x.concat(y);
      }), []);
      columns = _.filter(columns, function(x) {
        return typeof x !== "string";
      });
      if (!_.isArray(columns[0])) {
        _ref5 = [_.min(columns), _.max(columns)], min = _ref5[0], max = _ref5[1];
      } else {
        maxs = Array(columns.length);
        mins = Array(columns.length);
        for (i = _k = 0, _ref6 = columns.length - 1; 0 <= _ref6 ? _k <= _ref6 : _k >= _ref6; i = 0 <= _ref6 ? ++_k : --_k) {
          maxs[i] = _.max(columns[i]);
          mins[i] = _.min(columns[i]);
        }
        _ref7 = [_.min(mins), _.max(maxs)], min = _ref7[0], max = _ref7[1];
      }
      span = (max - min) * (1 + this.get('rangepadding'));
      center = (max + min) / 2.0;
      _ref8 = [center - span / 2.0, center + span / 2.0], min = _ref8[0], max = _ref8[1];
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
      var source, _i, _len, _ref3;

      DataRange1d.__super__.dinitialize.call(this, attrs, options);
      this.register_property('minmax', this._get_minmax, true);
      this.add_dependencies('minmax', this, ['sources'], ['rangepadding']);
      _ref3 = this.get('sources');
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        source = _ref3[_i];
        source = this.resolve_ref(source.ref);
        this.add_dependencies('minmax', source, 'data');
      }
      this.register_property('start', this._get_start, true);
      this.register_setter('start', this._set_start);
      this.add_dependencies('start', this, ['minmax', '_start']);
      this.register_property('end', this._get_end, true);
      this.register_setter('end', this._set_end);
      return this.add_dependencies('end', this, ['minmax', '_end']);
    };

    return DataRange1d;

  })(Range1d);

  DataRange1d.prototype.defaults = _.clone(DataRange1d.prototype.defaults);

  _.extend(DataRange1d.prototype.defaults, {
    sources: [],
    rangepadding: 0.1
  });

  DataRange1ds = (function(_super) {
    __extends(DataRange1ds, _super);

    function DataRange1ds() {
      _ref3 = DataRange1ds.__super__.constructor.apply(this, arguments);
      return _ref3;
    }

    DataRange1ds.prototype.model = DataRange1d;

    return DataRange1ds;

  })(Backbone.Collection);

  Range1ds = (function(_super) {
    __extends(Range1ds, _super);

    function Range1ds() {
      _ref4 = Range1ds.__super__.constructor.apply(this, arguments);
      return _ref4;
    }

    Range1ds.prototype.model = Range1d;

    return Range1ds;

  })(Backbone.Collection);

  FactorRange = (function(_super) {
    __extends(FactorRange, _super);

    function FactorRange() {
      _ref5 = FactorRange.__super__.constructor.apply(this, arguments);
      return _ref5;
    }

    FactorRange.prototype.type = 'FactorRange';

    return FactorRange;

  })(HasProperties);

  FactorRange.prototype.defaults = _.clone(FactorRange.prototype.defaults);

  _.extend(FactorRange.prototype.defaults, {
    values: []
  });

  DataFactorRange = (function(_super) {
    __extends(DataFactorRange, _super);

    function DataFactorRange() {
      this._get_values = __bind(this._get_values, this);      _ref6 = DataFactorRange.__super__.constructor.apply(this, arguments);
      return _ref6;
    }

    DataFactorRange.prototype.type = 'DataFactorRange';

    DataFactorRange.prototype._get_values = function() {
      var columns, temp, uniques, val, x, _i, _len;

      columns = (function() {
        var _i, _len, _ref7, _results;

        _ref7 = this.get('columns');
        _results = [];
        for (_i = 0, _len = _ref7.length; _i < _len; _i++) {
          x = _ref7[_i];
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

    return DataFactorRange;

  })(FactorRange);

  DataFactorRange.prototype.defaults = _.clone(DataFactorRange.prototype.defaults);

  _.extend(DataFactorRange.prototype.defaults, {
    values: [],
    columns: [],
    data_source: null
  });

  DataFactorRanges = (function(_super) {
    __extends(DataFactorRanges, _super);

    function DataFactorRanges() {
      _ref7 = DataFactorRanges.__super__.constructor.apply(this, arguments);
      return _ref7;
    }

    DataFactorRanges.prototype.model = DataFactorRange;

    return DataFactorRanges;

  })(Backbone.Collection);

  FactorRanges = (function(_super) {
    __extends(FactorRanges, _super);

    function FactorRanges() {
      _ref8 = FactorRanges.__super__.constructor.apply(this, arguments);
      return _ref8;
    }

    FactorRanges.prototype.model = FactorRange;

    return FactorRanges;

  })(Backbone.Collection);

  exports.Range1d = Range1d;

  exports.range1ds = new Range1ds;

  exports.datarange1ds = new DataRange1ds;

  exports.datafactorranges = new DataFactorRanges;

}).call(this);
}, "mappers/1d/linear_mapper": function(exports, require, module) {(function() {
  var HasProperties, LinearMapper, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  HasProperties = require('../../base').HasProperties;

  LinearMapper = (function(_super) {
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
      result = new Array(xs.length);
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
      result = new Array(xprimes.length);
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

  exports.LinearMapper = LinearMapper;

}).call(this);
}, "mappers/1d/categorical_mapper": function(exports, require, module) {(function() {
  var CategoricalMapper, HasProperties, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  HasProperties = require('../../base').HasProperties;

  CategoricalMapper = (function(_super) {
    __extends(CategoricalMapper, _super);

    function CategoricalMapper() {
      _ref = CategoricalMapper.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    CategoricalMapper.prototype.initialize = function(attrs, options) {
      CategoricalMapper.__super__.initialize.call(this, attrs, options);
      this.register_property('mapper_state', this._scale, true);
      this.add_dependencies('mapper_state', this.get('source_range'), this.target_range);
      this.add_dependencies('mapper_state', this.get('source_range'), 'values');
      return this.add_dependencies('mapper_state', this.get('target_range'), ['start', 'end']);
    };

    CategoricalMapper.prototype.map_to_target = function(x) {
      var offset, scale_factor, values, _ref1;

      _ref1 = this.get('mapper_state'), scale_factor = _ref1[0], offset = _ref1[1];
      values = this.get('source_range').get('values');
      return scale * _.indexOf(values, x) + offset;
    };

    CategoricalMapper.prototype.v_map_to_target = function(xs) {
      var idx, offset, result, scale, values, x, _i, _len, _ref1;

      _ref1 = this.get('mapper_state'), scale = _ref1[0], offset = _ref1[1];
      values = this.get('source_range').get('values');
      result = new Array(xs.length);
      for (idx = _i = 0, _len = xs.length; _i < _len; idx = ++_i) {
        x = xs[idx];
        result[idx] = scale * _.indexOf(values, x) + offset;
      }
      return result;
    };

    CategoricalMapper.prototype.map_from_target = function(xprime) {
      var offset, scale, values, _ref1;

      _ref1 = this.get('mapper_state'), scale = _ref1[0], offset = _ref1[1];
      values = this.get('source_range').get('values');
      return values[Math.trunc((xprime + offset) / scale)];
    };

    CategoricalMapper.prototype.v_map_from_target = function(xprimes) {
      var idx, offset, result, scale, values, xprime, _i, _len, _ref1;

      _ref1 = this.get('mapper_state'), scale = _ref1[0], offset = _ref1[1];
      values = this.get('source_range').get('values');
      result = new Array(xprimes.length);
      for (idx = _i = 0, _len = xprimes.length; _i < _len; idx = ++_i) {
        xprime = xprimes[idx];
        result[idx] = values[Math.trunc((xprime + offset) / scale)];
      }
      return result;
    };

    CategoricalMapper.prototype.target_bin_width = function() {
      return this.get('mapper_state')[0];
    };

    CategoricalMapper.prototype._scale = function() {
      var length, offset, scale, target_end, target_start;

      target_start = this.get('target_range').get('start');
      target_end = this.get('target_range').get('end');
      length = this.get('source_range').get('values').length;
      scale = (target_end - target_start) / length;
      offset = scale / 2;
      return [scale, offset];
    };

    return CategoricalMapper;

  })(HasProperties);

  exports.CategoricalMapper = CategoricalMapper;

}).call(this);
}, "mappers/1d/log_mapper": function(exports, require, module) {(function() {
  var HasProperties, LogMapper, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  HasProperties = require('../../base').HasProperties;

  LogMapper = (function(_super) {
    __extends(LogMapper, _super);

    function LogMapper() {
      _ref = LogMapper.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    LogMapper.prototype.initialize = function(attrs, options) {
      return LogMapper.__super__.initialize.call(this, attrs, options);
    };

    LogMapper.prototype.map_to_target = function(x) {};

    LogMapper.prototype.v_map_to_target = function(xs) {
      var result;

      result = new Array(xs.length);
      return result;
    };

    LogMapper.prototype.map_from_target = function(xprime) {};

    LogMapper.prototype.v_map_from_target = function(xprimes) {
      var result;

      result = new Array(xprimes.length);
      return result;
    };

    return LogMapper;

  })(HasProperties);

  exports.LogMapper = LogMapper;

}).call(this);
}, "mappers/color/log_color_mapper": function(exports, require, module) {(function() {


}).call(this);
}, "mappers/color/linear_color_mapper": function(exports, require, module) {(function() {
  var HasProperties, LinearColorMapper, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  HasProperties = require('../../base').HasProperties;

  LinearColorMapper = (function(_super) {
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
      for (i = _i = 0, _ref1 = data.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
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
        for (i = _j = 0, _ref2 = data.length - 1; 0 <= _ref2 ? _j <= _ref2 : _j >= _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
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
        for (i = _k = 0, _ref3 = data.length - 1; 0 <= _ref3 ? _k <= _ref3 : _k >= _ref3; i = 0 <= _ref3 ? ++_k : --_k) {
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
      for (i = _i = 0, _ref1 = palette.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        new_palette[i] = palette[i];
      }
      new_palette[new_palette.length - 1] = palette[palette.length - 1];
      return new_palette;
    };

    return LinearColorMapper;

  })(HasProperties);

  exports.LinearColorMapper = LinearColorMapper;

}).call(this);
}, "mappers/color/segment_color_mapper": function(exports, require, module) {(function() {


}).call(this);
}, "mappers/2d/grid_mapper": function(exports, require, module) {(function() {
  var GridMapper, HasProperties, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  HasProperties = require('../../base').HasProperties;

  GridMapper = (function(_super) {
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

  exports.GridMapper = GridMapper;

}).call(this);
}, "mappers/2d/ternary_mapper": function(exports, require, module) {(function() {
  var HasProperties, TernaryMapper, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  HasProperties = require('../../base').HasProperties;

  TernaryMapper = (function(_super) {
    __extends(TernaryMapper, _super);

    function TernaryMapper() {
      _ref = TernaryMapper.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    TernaryMapper.prototype.initialize = function(attrs, options) {
      return TernaryMapper.__super__.initialize.call(this, attrs, options);
    };

    TernaryMapper.prototype.map_to_target = function(x, y) {};

    TernaryMapper.prototype.v_map_to_target = function(xs, ys) {};

    TernaryMapper.prototype.map_from_target = function(xprime, yprime) {};

    TernaryMapper.prototype.v_map_from_target = function(xprimes, yprimes) {};

    return TernaryMapper;

  })(HasProperties);

  exports.TerneryMapper = PolarMapper;

}).call(this);
}, "mappers/2d/polar_mapper": function(exports, require, module) {(function() {
  var HasProperties, PolarMapper, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  HasProperties = require('../../base').HasProperties;

  PolarMapper = (function(_super) {
    __extends(PolarMapper, _super);

    function PolarMapper() {
      _ref = PolarMapper.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    PolarMapper.prototype.initialize = function(attrs, options) {
      return PolarMapper.__super__.initialize.call(this, attrs, options);
    };

    PolarMapper.prototype.map_to_target = function(x, y) {};

    PolarMapper.prototype.v_map_to_target = function(xs, ys) {};

    PolarMapper.prototype.map_from_target = function(xprime, yprime) {};

    PolarMapper.prototype.v_map_from_target = function(xprimes, yprimes) {};

    return PolarMapper;

  })(HasProperties);

  exports.PolarMapper = PolarMapper;

}).call(this);
}, "mappers/2d/barycentric_mapper": function(exports, require, module) {(function() {
  var BarycentricMapper, HasProperties, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  HasProperties = require('../../base').HasProperties;

  BarycentricMapper = (function(_super) {
    __extends(BarycentricMapper, _super);

    function BarycentricMapper() {
      _ref = BarycentricMapper.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    BarycentricMapper.prototype.initialize = function(attrs, options) {
      return BarycentricMapper.__super__.initialize.call(this, attrs, options);
    };

    BarycentricMapper.prototype.map_to_target = function(x, y) {};

    BarycentricMapper.prototype.v_map_to_target = function(xs, ys) {};

    BarycentricMapper.prototype.map_from_target = function(xprime, yprime) {};

    BarycentricMapper.prototype.v_map_from_target = function(xprimes, yprimes) {};

    return BarycentricMapper;

  })(HasProperties);

  exports.BarycentricMapper = PolarMapper;

}).call(this);
}, "tools/select_tool": function(exports, require, module) {(function() {
  var DataRangeBoxSelectionTool, DataRangeBoxSelectionToolView, LinearMapper, SelectionTool, SelectionToolView, SelectionTools, TwoPointEventGenerator, base, coll, eventgenerators, safebind, tool, _ref, _ref1, _ref2, _ref3, _ref4,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  tool = require("./tool");

  eventgenerators = require("./eventgenerators");

  TwoPointEventGenerator = eventgenerators.TwoPointEventGenerator;

  LinearMapper = require("../mappers/1d/linear_mapper").LinearMapper;

  base = require("../base");

  safebind = base.safebind;

  SelectionToolView = (function(_super) {
    __extends(SelectionToolView, _super);

    function SelectionToolView() {
      _ref = SelectionToolView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    SelectionToolView.prototype.initialize = function(options) {
      var _this = this;

      SelectionToolView.__super__.initialize.call(this, options);
      this.select_callback = _.debounce((function() {
        return _this._select_data();
      }), 50);
      return this.listenTo(this.model, 'change', this.select_callback);
    };

    SelectionToolView.prototype.bind_bokeh_events = function() {
      var renderer, rendererview, _i, _len, _ref1, _results;

      SelectionToolView.__super__.bind_bokeh_events.call(this);
      _ref1 = this.mget_obj('renderers');
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        renderer = _ref1[_i];
        rendererview = this.plot_view.renderers[renderer.id];
        this.listenTo(rendererview.xrange(), 'change', this.select_callback);
        this.listenTo(rendererview.yrange(), 'change', this.select_callback);
        this.listenTo(renderer, 'change', this.select_callback);
        _results.push(this.listenTo(renderer, 'change', this.select_callback));
      }
      return _results;
    };

    SelectionToolView.prototype.eventGeneratorClass = TwoPointEventGenerator;

    SelectionToolView.prototype.evgen_options = {
      keyName: "ctrlKey",
      buttonText: "Select",
      restrict_to_innercanvas: true
    };

    SelectionToolView.prototype.tool_events = {
      SetBasepoint: "_start_selecting",
      UpdatingMouseMove: "_selecting",
      deactivated: "_stop_selecting"
    };

    SelectionToolView.prototype.mouse_coords = function(e, x, y) {
      var _ref1;

      _ref1 = [this.plot_view.view_state.device_to_sx(x), this.plot_view.view_state.device_to_sy(y)], x = _ref1[0], y = _ref1[1];
      return [x, y];
    };

    SelectionToolView.prototype._stop_selecting = function() {
      this.trigger('stopselect');
      return this.basepoint_set = false;
    };

    SelectionToolView.prototype._start_selecting = function(e) {
      var x, y, _ref1;

      this.trigger('startselect');
      _ref1 = this.mouse_coords(e, e.bokehX, e.bokehY), x = _ref1[0], y = _ref1[1];
      this.mset({
        'start_x': x,
        'start_y': y,
        'current_x': null,
        'current_y': null
      });
      return this.basepoint_set = true;
    };

    SelectionToolView.prototype._get_selection_range = function() {
      var xrange, yrange;

      xrange = [this.mget('start_x'), this.mget('current_x')];
      yrange = [this.mget('start_y'), this.mget('current_y')];
      if (this.mget('select_x')) {
        xrange = [_.min(xrange), _.max(xrange)];
      } else {
        xrange = null;
      }
      if (this.mget('select_y')) {
        yrange = [_.min(yrange), _.max(yrange)];
      } else {
        yrange = null;
      }
      return [xrange, yrange];
    };

    SelectionToolView.prototype._get_selection_range_fast = function(current_x, current_y) {
      var xrange, yrange;

      xrange = [this.mget('start_x'), current_x];
      yrange = [this.mget('start_y'), current_y];
      if (this.mget('select_x')) {
        xrange = [_.min(xrange), _.max(xrange)];
      } else {
        xrange = null;
      }
      if (this.mget('select_y')) {
        yrange = [_.min(yrange), _.max(yrange)];
      } else {
        yrange = null;
      }
      return [xrange, yrange];
    };

    SelectionToolView.prototype._selecting = function(e, x_, y_) {
      var x, y, _ref1, _ref2;

      _ref1 = this.mouse_coords(e, e.bokehX, e.bokehY), x = _ref1[0], y = _ref1[1];
      this.mset({
        'current_x': x,
        'current_y': y
      });
      _ref2 = this._get_selection_range(x, y), this.xrange = _ref2[0], this.yrange = _ref2[1];
      this.trigger('boxselect', this.xrange, this.yrange);
      return null;
    };

    SelectionToolView.prototype.box_selecting = function(e, x_, y_) {
      var x, y, _ref1, _ref2;

      _ref1 = this.mouse_coords(e, e.bokehX, e.bokehY), x = _ref1[0], y = _ref1[1];
      _ref2 = this._get_selection_range_fast(x, y), this.xrange = _ref2[0], this.yrange = _ref2[1];
      this.trigger('boxselect', this.xrange, this.yrange);
      return null;
    };

    SelectionToolView.prototype._select_data = function() {
      var datasource, datasource_id, datasource_selections, datasources, ds, k, renderer, selected, v, _i, _j, _len, _len1, _ref1, _ref2;

      if (!this.basepoint_set) {
        return;
      }
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
        selected = this.plot_view.renderers[renderer.id].select(this.xrange, this.yrange);
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
      }
      return null;
    };

    return SelectionToolView;

  })(tool.ToolView);

  SelectionTool = (function(_super) {
    __extends(SelectionTool, _super);

    function SelectionTool() {
      _ref1 = SelectionTool.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    SelectionTool.prototype.type = "SelectionTool";

    SelectionTool.prototype.default_view = SelectionToolView;

    return SelectionTool;

  })(tool.Tool);

  SelectionTool.prototype.defaults = _.clone(SelectionTool.prototype.defaults);

  _.extend(SelectionTool.prototype.defaults, {
    renderers: [],
    select_x: true,
    select_y: true,
    data_source_options: {}
  });

  SelectionTools = (function(_super) {
    __extends(SelectionTools, _super);

    function SelectionTools() {
      _ref2 = SelectionTools.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    SelectionTools.prototype.model = SelectionTool;

    return SelectionTools;

  })(Backbone.Collection);

  exports.SelectionToolView = SelectionToolView;

  exports.selectiontools = new SelectionTools;

  DataRangeBoxSelectionToolView = (function(_super) {
    __extends(DataRangeBoxSelectionToolView, _super);

    function DataRangeBoxSelectionToolView() {
      _ref3 = DataRangeBoxSelectionToolView.__super__.constructor.apply(this, arguments);
      return _ref3;
    }

    DataRangeBoxSelectionToolView.prototype.bind_bokeh_events = function() {
      return tool.ToolView.prototype.bind_bokeh_events.call(this);
    };

    DataRangeBoxSelectionToolView.prototype._select_data = function() {
      var xend, xstart, yend, ystart, _ref4, _ref5;

      _ref4 = this.plot_view.mapper.map_from_target(this.xrange[0], this.yrange[0]), xstart = _ref4[0], ystart = _ref4[1];
      _ref5 = this.plot_view.mapper.map_from_target(this.xrange[1], this.yrange[1]), xend = _ref5[0], yend = _ref5[1];
      this.mset('xselect', [xstart, xend]);
      this.mset('yselect', [ystart, yend]);
      return this.model.save();
    };

    return DataRangeBoxSelectionToolView;

  })(SelectionToolView);

  DataRangeBoxSelectionTool = (function(_super) {
    __extends(DataRangeBoxSelectionTool, _super);

    function DataRangeBoxSelectionTool() {
      _ref4 = DataRangeBoxSelectionTool.__super__.constructor.apply(this, arguments);
      return _ref4;
    }

    DataRangeBoxSelectionTool.prototype.type = "DataRangeBoxSelectionTool";

    DataRangeBoxSelectionTool.prototype.default_view = DataRangeBoxSelectionToolView;

    return DataRangeBoxSelectionTool;

  })(SelectionTool);

  DataRangeBoxSelectionTool.prototype.defaults = _.clone(DataRangeBoxSelectionTool.prototype.defaults);

  coll = Backbone.Collection.extend({
    model: DataRangeBoxSelectionTool
  });

  exports.datarangeboxselectiontools = new coll();

}).call(this);
}, "tools/embed_tool": function(exports, require, module) {(function() {
  var ButtonEventGenerator, EmbedTool, EmbedToolView, EmbedTools, HasParent, ToolView, base, safebind, toolview, _ref, _ref1, _ref2,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  toolview = require("./toolview");

  ToolView = toolview.ToolView;

  ButtonEventGenerator = require("./eventgenerators").ButtonEventGenerator;

  base = require("../base");

  safebind = base.safebind;

  HasParent = base.HasParent;

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

    EmbedToolView.prototype.tool_events = {
      activated: "_activated"
    };

    EmbedToolView.prototype._activated = function(e) {
      var baseurl, doc_apikey, doc_id, js_template, modal, model_id, script_inject_escaped,
        _this = this;

      console.log("EmbedToolView._activated");
      window.tool_view = this;
      model_id = this.plot_model.get('id');
      doc_id = this.plot_model.get('doc');
      doc_apikey = this.plot_model.get('docapikey');
      baseurl = this.plot_model.get('baseurl');
      js_template = "&lt;script src=\"http://localhost:5006/bokeh/embed.js\" bokeh_plottype=\"serverconn\"\nbokeh_docid=\"" + doc_id + "\" bokeh_ws_conn_string=\"ws://localhost:5006/bokeh/sub\"\nbokeh_docapikey=\"" + doc_apikey + "\"\n\nbokeh_root_url=\"" + baseurl + "\"\nbokeh_root_url=\"http://localhost:5006\"\nbokeh_modelid=\"" + model_id + "\" bokeh_modeltype=\"Plot\" async=\"true\"&gt;\n&lt;/script&gt;\n";
      script_inject_escaped = this.plot_model.get('script_inject_escaped');
      modal = "<div id=\"embedModal\" class=\"modal\" role=\"dialog\" aria-labelledby=\"embedLabel\" aria-hidden=\"true\">\n  <div class=\"modal-header\">\n    <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">×</button>\n    <h3 id=\"dataConfirmLabel\"> HTML Embed code</h3></div><div class=\"modal-body\">\n  <div class=\"modal-body\">\n    " + script_inject_escaped + "\n  </div>\n  </div><div class=\"modal-footer\">\n    <button class=\"btn\" data-dismiss=\"modal\" aria-hidden=\"true\">Close</button>\n  </div>\n</div>";
      $('body').append(modal);
      $('#embedModal').on('hidden', function() {
        return $('#embedModal').remove();
      });
      return $('#embedModal').modal({
        show: true
      });
    };

    return EmbedToolView;

  })(ToolView);

  EmbedTool = (function(_super) {
    __extends(EmbedTool, _super);

    function EmbedTool() {
      _ref1 = EmbedTool.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    EmbedTool.prototype.type = "EmbedTool";

    EmbedTool.prototype.default_view = EmbedToolView;

    return EmbedTool;

  })(HasParent);

  EmbedTool.prototype.defaults = _.clone(EmbedTool.prototype.defaults);

  _.extend(EmbedTool.prototype.defaults);

  EmbedTools = (function(_super) {
    __extends(EmbedTools, _super);

    function EmbedTools() {
      _ref2 = EmbedTools.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    EmbedTools.prototype.model = EmbedTool;

    return EmbedTools;

  })(Backbone.Collection);

  exports.EmbedToolView = EmbedToolView;

  exports.embedtools = new EmbedTools;

}).call(this);
}, "tools/slider": function(exports, require, module) {(function() {
  var DataSlider, DataSliderView, HasParent, PlotWidget, coll, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  PlotWidget = require('../common/plot_widget').PlotWidget;

  HasParent = require("../base").HasParent;

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

    return DataSlider;

  })(HasParent);

  DataSlider.prototype.defaults = _.clone(DataSlider.prototype.defaults);

  _.extend(DataSlider.prototype.defaults, {
    data_source: null,
    field: null
  });

  DataSlider.prototype.display_defaults = _.clone(DataSlider.prototype.display_defaults);

  _.extend(DataSlider.prototype.display_defaults, {
    level: 'tool'
  });

  PlotWidget = require('../common/plot_widget').PlotWidget;

  HasParent = require('../base').HasParent;

  coll = Backbone.Collection.extend({
    model: DataSlider
  });

  exports.datasliders = new coll();

}).call(this);
}, "tools/preview_save_tool": function(exports, require, module) {(function() {
  var ButtonEventGenerator, LinearMapper, PreviewSaveTool, PreviewSaveToolView, PreviewSaveTools, base, tool, _ref, _ref1, _ref2,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  tool = require("./tool");

  ButtonEventGenerator = require("./eventgenerators").ButtonEventGenerator;

  LinearMapper = require("../mappers/1d/linear_mapper").LinearMapper;

  base = require("../base");

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

    PreviewSaveToolView.prototype.tool_events = {
      activated: "_activated"
    };

    PreviewSaveToolView.prototype._activated = function(e) {
      var data_uri, modal,
        _this = this;

      data_uri = this.plot_view.canvas[0].toDataURL();
      this.plot_model.set('png', this.plot_view.canvas[0].toDataURL());
      base.Collections.bulksave([this.plot_model]);
      modal = "'<div id=\"previewModal\" class=\"modal\" role=\"dialog\" aria-labelledby=\"previewLabel\" aria-hidden=\"true\">\n  <div class=\"modal-header\">\n    <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">×</button>\n    <h3 id=\"dataConfirmLabel\">Image Preview (right click to save)</h3></div><div class=\"modal-body\">\n  <div class=\"modal-body\">\n    <img src=\"" + data_uri + "\" style=\"max-height: 300px; max-width: 400px\">\n  </div>\n  </div><div class=\"modal-footer\">\n    <button class=\"btn\" data-dismiss=\"modal\" aria-hidden=\"true\">Close</button>\n  </div>\n</div>')";
      $('body').append(modal);
      $('#previewModal').on('hidden', function() {
        return $('#previewModal').remove();
      });
      return $('#previewModal').modal({
        show: true
      });
    };

    return PreviewSaveToolView;

  })(tool.ToolView);

  PreviewSaveTool = (function(_super) {
    __extends(PreviewSaveTool, _super);

    function PreviewSaveTool() {
      _ref1 = PreviewSaveTool.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    PreviewSaveTool.prototype.type = "PreviewSaveTool";

    PreviewSaveTool.prototype.default_view = PreviewSaveToolView;

    return PreviewSaveTool;

  })(tool.Tool);

  PreviewSaveTool.prototype.defaults = _.clone(PreviewSaveTool.prototype.defaults);

  _.extend(PreviewSaveTool.prototype.defaults);

  PreviewSaveTools = (function(_super) {
    __extends(PreviewSaveTools, _super);

    function PreviewSaveTools() {
      _ref2 = PreviewSaveTools.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    PreviewSaveTools.prototype.model = PreviewSaveTool;

    return PreviewSaveTools;

  })(Backbone.Collection);

  exports.PreviewSaveToolView = PreviewSaveToolView;

  exports.previewsavetools = new PreviewSaveTools;

}).call(this);
}, "tools/eventgenerators": function(exports, require, module) {(function() {
  var ButtonEventGenerator, OnePointWheelEventGenerator, TwoPointEventGenerator;

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
        var offset;

        if (!_this.dragging) {
          return;
        }
        if (!_this.tool_active) {
          return;
        }
        offset = $(e.currentTarget).offset();
        e.bokehX = e.pageX - offset.left;
        e.bokehY = e.pageY - offset.top;
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
        var inner_range_horizontal, inner_range_vertical, offset, xend, xstart, yend, ystart;

        if (_this.dragging) {
          offset = $(e.currentTarget).offset();
          e.bokehX = e.pageX - offset.left;
          e.bokehY = e.pageY - offset.top;
          inner_range_horizontal = _this.plotview.view_state.get('inner_range_horizontal');
          inner_range_vertical = _this.plotview.view_state.get('inner_range_vertical');
          x = _this.plotview.view_state.device_to_sx(e.bokehX);
          y = _this.plotview.view_state.device_to_sy(e.bokehY);
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
            console.log("stopping1");
            _this._stop_drag(e);
            return false;
          }
          if (y < ystart || y > yend) {
            console.log("stopping2");
            _this._stop_drag(e);
            return false;
          }
        }
      });
      $(document).bind('keydown', function(e) {
        if (e[_this.options.keyName]) {
          _this._start_drag();
        }
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
        if (_this.button_activated) {
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
      this.plotview.$el.find('.button_bar').append(this.$tool_button);
      this.$tool_button.click(function() {
        if (_this.button_activated) {
          return eventSink.trigger("clear_active_tool");
        } else {
          eventSink.trigger("active_tool", toolName);
          return _this.button_activated = true;
        }
      });
      eventSink.on("" + toolName + ":deactivated", function() {
        _this.tool_active = false;
        _this.button_activated = false;
        return _this.$tool_button.removeClass('active');
      });
      eventSink.on("" + toolName + ":activated", function() {
        _this.tool_active = true;
        return _this.$tool_button.addClass('active');
      });
      return eventSink;
    };

    TwoPointEventGenerator.prototype._start_drag = function() {
      this.eventSink.trigger("active_tool", this.toolName);
      if (!this.dragging) {
        this.dragging = true;
        if (!this.button_activated) {
          return this.$tool_button.addClass('active');
        }
      }
    };

    TwoPointEventGenerator.prototype._stop_drag = function(e) {
      var offset;

      this.basepoint_set = false;
      if (this.dragging) {
        this.dragging = false;
        if (!this.button_activated) {
          this.$tool_button.removeClass('active');
        }
        offset = $(e.currentTarget).offset();
        e.bokehX = e.pageX;
        e.bokehY = e.pageY;
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
        var offset;

        if (!_this.tool_active) {
          return;
        }
        offset = $(e.currentTarget).offset();
        e.bokehX = e.pageX - offset.left;
        e.bokehY = e.pageY - offset.top;
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
        restore_scroll(_this.plotview.$el[0]);
        return document.body.style.overflow = _this.old_overflow;
      });
      eventSink.on("" + toolName + ":activated", function() {
        _this.tool_active = true;
        _this.$tool_button.addClass('active');
        return no_scroll(_this.plotview.$el[0]);
      });
      return eventSink;
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
        restore_scroll(_this.plotview.$el[0]);
        return document.body.style.overflow = _this.old_overflow;
      });
      eventSink.on("" + toolName + ":activated", function() {
        _this.tool_active = true;
        _this.$tool_button.addClass('active');
        return no_scroll(_this.plotview.$el[0]);
      });
      return eventSink;
    };

    return ButtonEventGenerator;

  })();

  exports.TwoPointEventGenerator = TwoPointEventGenerator;

  exports.OnePointWheelEventGenerator = OnePointWheelEventGenerator;

  exports.ButtonEventGenerator = ButtonEventGenerator;

}).call(this);
}, "tools/active_tool_manager": function(exports, require, module) {(function() {
  var ActiveToolManager;

  ActiveToolManager = (function() {
    " This makes sure that only one tool is active at a time ";    function ActiveToolManager(event_sink) {
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

  exports.ActiveToolManager = ActiveToolManager;

}).call(this);
}, "tools/zoom_tool": function(exports, require, module) {(function() {
  var LinearMapper, OnePointWheelEventGenerator, ZoomTool, ZoomToolView, ZoomTools, base, eventgenerators, safebind, tool, _ref, _ref1, _ref2,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  tool = require("./tool");

  eventgenerators = require("./eventgenerators");

  OnePointWheelEventGenerator = eventgenerators.OnePointWheelEventGenerator;

  LinearMapper = require("../mappers/1d/linear_mapper").LinearMapper;

  base = require("../base");

  safebind = base.safebind;

  ZoomToolView = (function(_super) {
    __extends(ZoomToolView, _super);

    function ZoomToolView() {
      this.build_mappers = __bind(this.build_mappers, this);      _ref = ZoomToolView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ZoomToolView.prototype.initialize = function(options) {
      ZoomToolView.__super__.initialize.call(this, options);
      safebind(this, this.model, 'change:dataranges', this.build_mappers);
      return this.build_mappers();
    };

    ZoomToolView.prototype.eventGeneratorClass = OnePointWheelEventGenerator;

    ZoomToolView.prototype.evgen_options = {
      buttonText: "Zoom"
    };

    ZoomToolView.prototype.tool_events = {
      zoom: "_zoom"
    };

    ZoomToolView.prototype.build_mappers = function() {
      var datarange, dim, mapper, temp, _i, _len, _ref1;

      this.mappers = {};
      _ref1 = _.zip(this.mget_obj('dataranges'), this.mget('dimensions'));
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        temp = _ref1[_i];
        datarange = temp[0], dim = temp[1];
        if (dim === 'width') {
          mapper = new LinearMapper({
            source_range: datarange,
            target_range: this.plot_view.view_state.get('inner_range_horizontal')
          });
        } else {
          mapper = new LinearMapper({
            source_range: datarange,
            target_range: this.plot_view.view_state.get('inner_range_vertical')
          });
        }
        this.mappers[dim] = mapper;
      }
      return this.mappers;
    };

    ZoomToolView.prototype.mouse_coords = function(e, x, y) {
      var x_, y_, _ref1;

      _ref1 = [this.plot_view.view_state.device_to_sx(x), this.plot_view.view_state.device_to_sy(y)], x_ = _ref1[0], y_ = _ref1[1];
      return [x_, y_];
    };

    ZoomToolView.prototype._zoom = function(e) {
      var delta, factor, screenX, screenY, speed, sx_high, sx_low, sy_high, sy_low, x, xend, xr, xstart, y, yend, yr, ystart, zoom_info, _ref1;

      delta = e.delta;
      screenX = e.bokehX;
      screenY = e.bokehY;
      _ref1 = this.mouse_coords(e, screenX, screenY), x = _ref1[0], y = _ref1[1];
      speed = this.mget('speed');
      factor = speed * (delta * 50);
      xr = this.plot_view.view_state.get('inner_range_horizontal');
      sx_low = xr.get('start');
      sx_high = xr.get('end');
      yr = this.plot_view.view_state.get('inner_range_vertical');
      sy_low = yr.get('start');
      sy_high = yr.get('end');
      xstart = this.plot_view.xmapper.map_from_target(sx_low - (sx_low - x) * factor);
      xend = this.plot_view.xmapper.map_from_target(sx_high - (sx_high - x) * factor);
      ystart = this.plot_view.ymapper.map_from_target(sy_low - (sy_low - y) * factor);
      yend = this.plot_view.ymapper.map_from_target(sy_high - (sy_high - y) * factor);
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

    return ZoomToolView;

  })(tool.ToolView);

  ZoomTool = (function(_super) {
    __extends(ZoomTool, _super);

    function ZoomTool() {
      _ref1 = ZoomTool.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    ZoomTool.prototype.type = "ZoomTool";

    ZoomTool.prototype.default_view = ZoomToolView;

    return ZoomTool;

  })(tool.Tool);

  ZoomTool.prototype.defaults = _.clone(ZoomTool.prototype.defaults);

  _.extend(ZoomTool.prototype.defaults, {
    dimensions: [],
    dataranges: [],
    speed: 1 / 600
  });

  ZoomTools = (function(_super) {
    __extends(ZoomTools, _super);

    function ZoomTools() {
      _ref2 = ZoomTools.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    ZoomTools.prototype.model = ZoomTool;

    return ZoomTools;

  })(Backbone.Collection);

  exports.ZoomToolView = ZoomToolView;

  exports.zoomtools = new ZoomTools;

}).call(this);
}, "tools/resize_tool": function(exports, require, module) {(function() {
  var LinearMapper, ResizeTool, ResizeToolView, ResizeTools, TwoPointEventGenerator, base, eventgenerators, tool, _ref, _ref1, _ref2,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  tool = require("./tool");

  eventgenerators = require("./eventgenerators");

  TwoPointEventGenerator = eventgenerators.TwoPointEventGenerator;

  LinearMapper = require("../mappers/1d/linear_mapper").LinearMapper;

  base = require("../base");

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

    ResizeToolView.prototype.evgen_options = {
      keyName: "",
      buttonText: "Resize"
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

      this.active = true;
      this.popup = $('<div class="resize_popup pull-right" style="border-radius: 10px; background-color: lightgrey; padding:3px 8px"></div>');
      bbar = this.plot_view.$el.find('.button_bar');
      bbar.append(this.popup);
      ch = this.plot_view.view_state.get('outer_height');
      cw = this.plot_view.view_state.get('outer_width');
      this.popup.text("width: " + cw + " height: " + ch);
      this.plot_view.request_render();
      return null;
    };

    ResizeToolView.prototype._deactivate = function(e) {
      this.active = false;
      this.popup.remove();
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

  })(tool.ToolView);

  ResizeTool = (function(_super) {
    __extends(ResizeTool, _super);

    function ResizeTool() {
      _ref1 = ResizeTool.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    ResizeTool.prototype.type = "ResizeTool";

    ResizeTool.prototype.default_view = ResizeToolView;

    return ResizeTool;

  })(tool.Tool);

  ResizeTool.prototype.defaults = _.clone(ResizeTool.prototype.defaults);

  _.extend(ResizeTool.prototype.defaults);

  ResizeTool.prototype.display_defaults = _.clone(ResizeTool.prototype.display_defaults);

  _.extend(ResizeTool.prototype.display_defaults);

  ResizeTools = (function(_super) {
    __extends(ResizeTools, _super);

    function ResizeTools() {
      _ref2 = ResizeTools.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    ResizeTools.prototype.model = ResizeTool;

    return ResizeTools;

  })(Backbone.Collection);

  exports.ResizeToolView = ResizeToolView;

  exports.resizetools = new ResizeTools;

}).call(this);
}, "tools/tool": function(exports, require, module) {(function() {
  var HasParent, PlotWidget, Tool, ToolView, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  PlotWidget = require('../common/plot_widget').PlotWidget;

  HasParent = require('../base').HasParent;

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

    return Tool;

  })(HasParent);

  Tool.prototype.display_defaults = _.clone(Tool.prototype.display_defaults);

  _.extend(Tool.prototype.display_defaults, {
    level: 'tool'
  });

  exports.Tool = Tool;

  exports.ToolView = ToolView;

}).call(this);
}, "tools/pan_tool": function(exports, require, module) {(function() {
  var LinearMapper, PanTool, PanToolView, PanTools, TwoPointEventGenerator, base, eventgenerators, safebind, tool, _ref, _ref1, _ref2,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  tool = require("./tool");

  eventgenerators = require("./eventgenerators");

  TwoPointEventGenerator = eventgenerators.TwoPointEventGenerator;

  LinearMapper = require("../mappers/1d/linear_mapper").LinearMapper;

  base = require("../base");

  safebind = base.safebind;

  PanToolView = (function(_super) {
    __extends(PanToolView, _super);

    function PanToolView() {
      this.build_mappers = __bind(this.build_mappers, this);      _ref = PanToolView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    PanToolView.prototype.initialize = function(options) {
      PanToolView.__super__.initialize.call(this, options);
      return this.build_mappers();
    };

    PanToolView.prototype.bind_bokeh_events = function() {
      PanToolView.__super__.bind_bokeh_events.call(this);
      return safebind(this, this.model, 'change:dataranges', this.build_mappers);
    };

    PanToolView.prototype.build_mappers = function() {
      var datarange, dim, mapper, temp, _i, _len, _ref1;

      this.mappers = {};
      _ref1 = _.zip(this.mget_obj('dataranges'), this.mget('dimensions'));
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        temp = _ref1[_i];
        datarange = temp[0], dim = temp[1];
        if (dim === 'width') {
          mapper = new LinearMapper({
            source_range: datarange,
            target_range: this.plot_view.view_state.get('inner_range_horizontal')
          });
        } else {
          mapper = new LinearMapper({
            source_range: datarange,
            target_range: this.plot_view.view_state.get('inner_range_vertical')
          });
        }
        this.mappers[dim] = mapper;
      }
      return this.mappers;
    };

    PanToolView.prototype.eventGeneratorClass = TwoPointEventGenerator;

    PanToolView.prototype.evgen_options = {
      keyName: "shiftKey",
      buttonText: "Pan",
      restrict_to_innercanvas: true
    };

    PanToolView.prototype.tool_events = {
      UpdatingMouseMove: "_drag",
      SetBasepoint: "_set_base_point"
    };

    PanToolView.prototype.mouse_coords = function(e, x, y) {
      var x_, y_, _ref1;

      _ref1 = [this.plot_view.view_state.device_to_sx(x), this.plot_view.view_state.device_to_sy(y)], x_ = _ref1[0], y_ = _ref1[1];
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

  })(tool.ToolView);

  PanTool = (function(_super) {
    __extends(PanTool, _super);

    function PanTool() {
      _ref1 = PanTool.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    PanTool.prototype.type = "PanTool";

    PanTool.prototype.default_view = PanToolView;

    return PanTool;

  })(tool.Tool);

  PanTool.prototype.defaults = _.clone(PanTool.prototype.defaults);

  _.extend(PanTool.prototype.defaults, {
    dimensions: [],
    dataranges: []
  });

  PanTools = (function(_super) {
    __extends(PanTools, _super);

    function PanTools() {
      _ref2 = PanTools.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    PanTools.prototype.model = PanTool;

    return PanTools;

  })(Backbone.Collection);

  exports.PanToolView = PanToolView;

  exports.pantools = new PanTools;

}).call(this);
}, "testutils": function(exports, require, module) {(function() {
  var Collections, bar_plot, base, data_table, glyph_plot, line_plot, make_glyph_plot, make_glyph_test, make_range_and_mapper, scatter_plot, zip,
    __hasProp = {}.hasOwnProperty;

  base = require("./base");

  Collections = base.Collections;

  zip = function() {
    var arr, i, length, lengthArray, _i, _results;

    lengthArray = (function() {
      var _i, _len, _results;

      _results = [];
      for (_i = 0, _len = arguments.length; _i < _len; _i++) {
        arr = arguments[_i];
        _results.push(arr.length);
      }
      return _results;
    }).apply(this, arguments);
    length = Math.min.apply(Math, lengthArray);
    _results = [];
    for (i = _i = 0; 0 <= length ? _i < length : _i > length; i = 0 <= length ? ++_i : --_i) {
      _results.push((function() {
        var _j, _len, _results1;

        _results1 = [];
        for (_j = 0, _len = arguments.length; _j < _len; _j++) {
          arr = arguments[_j];
          _results1.push(arr[i]);
        }
        return _results1;
      }).apply(this, arguments));
    }
    return _results;
  };

  scatter_plot = function(parent, data_source, xfield, yfield, color_field, mark, colormapper, local) {
    var color_mapper, options, plot_model, source_name, xaxis, xdr, yaxis, ydr;

    if (_.isUndefined(local)) {
      local = true;
    }
    options = {
      'local': local
    };
    if (_.isUndefined(mark)) {
      mark = 'circle';
    }
    if (_.isUndefined(color_field)) {
      color_field = null;
    }
    if (_.isUndefined(color_mapper) && color_field) {
      color_mapper = Collections('DiscreteColorMapper').create({
        data_range: Collections('DataFactorRange').create({
          data_source: data_source.ref(),
          columns: ['x']
        }, options)
      }, options);
    }
    source_name = data_source.get('name');
    plot_model = Collections('Plot').create({
      data_sources: {
        source_name: data_source.ref()
      },
      parent: parent
    }, options);
    xdr = Collections('DataRange1d').create({
      'sources': [
        {
          'ref': data_source.ref(),
          'columns': [xfield]
        }
      ]
    }, options);
    ydr = Collections('DataRange1d').create({
      'sources': [
        {
          'ref': data_source.ref(),
          'columns': [yfield]
        }
      ]
    }, options);
    scatter_plot = Collections("ScatterRenderer").create({
      data_source: data_source.ref(),
      xdata_range: xdr.ref(),
      ydata_range: ydr.ref(),
      xfield: xfield,
      yfield: yfield,
      color_field: color_field,
      color_mapper: color_mapper,
      mark: mark,
      parent: plot_model.ref()
    }, options);
    xaxis = Collections('LinearAxis').create({
      'orientation': 'bottom',
      'parent': plot_model.ref(),
      'data_range': xdr.ref()
    }, options);
    yaxis = Collections('LinearAxis').create({
      'orientation': 'left',
      'parent': plot_model.ref(),
      'data_range': ydr.ref()
    }, options);
    plot_model.set({
      'renderers': [scatter_plot.ref()],
      'axes': [xaxis.ref(), yaxis.ref()]
    }, options);
    return plot_model;
  };

  data_table = function(parent, data_source, xfield, yfield, color_field, mark, colormapper, local) {
    var color_mapper, options, source_name, table_model, xdr, xmapper, ydr, ymapper;

    if (_.isUndefined(local)) {
      local = true;
    }
    options = {
      'local': local
    };
    if (_.isUndefined(mark)) {
      mark = 'circle';
    }
    if (_.isUndefined(color_field)) {
      color_field = null;
    }
    if (_.isUndefined(color_mapper) && color_field) {
      color_mapper = Collections('DiscreteColorMapper').create({
        data_range: Collections('DataFactorRange').create({
          data_source: data_source.ref(),
          columns: ['x']
        }, options)
      }, options);
    }
    source_name = data_source.get('name');
    table_model = Collections('Table').create({
      data_sources: {
        source_name: data_source.ref()
      },
      parent: parent
    }, options);
    xdr = Collections('DataRange1d').create({
      'sources': [
        {
          'ref': data_source.ref(),
          'columns': [xfield]
        }
      ]
    }, options);
    ydr = Collections('DataRange1d').create({
      'sources': [
        {
          'ref': data_source.ref(),
          'columns': [yfield]
        }
      ]
    }, options);
    xmapper = Collections('LinearMapper').create({
      data_range: xdr.ref(),
      screen_range: table_model.get('xrange')
    }, options);
    ymapper = Collections('LinearMapper').create({
      data_range: ydr.ref(),
      screen_range: table_model.get('yrange')
    }, options);
    scatter_plot = Collections("TableRenderer").create({
      data_source: data_source.ref(),
      xfield: xfield,
      yfield: yfield,
      color_field: color_field,
      color_mapper: color_mapper,
      mark: mark,
      xmapper: xmapper.ref(),
      ymapper: ymapper.ref(),
      parent: table_model.ref()
    }, options);
    return table_model.set({
      'renderers': [scatter_plot.ref()]
    }, options);
  };

  make_range_and_mapper = function(data_source, datafields, padding, screen_range, ordinal, options) {
    var mapper, range;

    if (!ordinal) {
      range = Collections('DataRange1d').create({
        sources: [
          {
            ref: data_source.ref(),
            columns: datafields
          }
        ],
        rangepadding: padding
      }, options);
      mapper = Collections('LinearMapper').create({
        data_range: range.ref(),
        screen_range: screen_range.ref()
      }, options);
    } else {
      range = Collections('DataFactorRange').create({
        data_source: data_source.ref(),
        columns: [field]
      }, options);
      mapper = Collections('FactorMapper').create({
        data_range: range.ref(),
        screen_range: screen_range.ref()
      }, options);
    }
    return [range, mapper];
  };

  bar_plot = function(parent, data_source, xfield, yfield, orientation, local) {
    var options, plot_model, xaxis, xdr, xmapper, yaxis, ydr, ymapper, _ref, _ref1;

    if (_.isUndefined(local)) {
      local = true;
    }
    options = {
      'local': local
    };
    plot_model = Collections('Plot').create({
      data_sources: {
        source_name: data_source.ref()
      },
      parent: parent
    }, options);
    _ref = make_range_and_mapper(data_source, [xfield], d3.max([1 / (data_source.get('data').length - 1), 0.1]), plot_model.get_obj('xrange'), false, options), xdr = _ref[0], xmapper = _ref[1];
    _ref1 = make_range_and_mapper(data_source, [yfield], d3.max([1 / (data_source.get('data').length - 1), 0.1]), plot_model.get_obj('yrange'), false, options), ydr = _ref1[0], ymapper = _ref1[1];
    bar_plot = Collections("BarRenderer").create({
      data_source: data_source.ref(),
      xfield: xfield,
      yfield: yfield,
      xmapper: xmapper.ref(),
      ymapper: ymapper.ref(),
      parent: plot_model.ref(),
      orientation: orientation
    }, options);
    xaxis = Collections('LinearAxis').create({
      orientation: 'bottom',
      mapper: xmapper.ref(),
      parent: plot_model.ref()
    }, options);
    yaxis = Collections('LinearAxis').create({
      orientation: 'left',
      mapper: ymapper.ref(),
      parent: plot_model.ref()
    }, options);
    return plot_model.set({
      renderers: [bar_plot.ref()],
      axes: [xaxis.ref(), yaxis.ref()]
    }, options);
  };

  line_plot = function(parent, data_source, xfield, yfield, local) {
    var options, plot_model, source_name, xaxis, xdr, yaxis, ydr;

    if (_.isUndefined(local)) {
      local = true;
    }
    options = {
      'local': local
    };
    source_name = data_source.get('name');
    plot_model = Collections('Plot').create({
      data_sources: {
        source_name: data_source.ref()
      },
      parent: parent
    }, options);
    xdr = Collections('DataRange1d').create({
      'sources': [
        {
          'ref': data_source.ref(),
          'columns': [xfield]
        }
      ]
    }, options);
    ydr = Collections('DataRange1d').create({
      'sources': [
        {
          'ref': data_source.ref(),
          'columns': [yfield]
        }
      ]
    }, options);
    line_plot = Collections("LineRenderer").create({
      data_source: data_source.ref(),
      xfield: xfield,
      yfield: yfield,
      xdata_range: xdr.ref(),
      ydata_range: ydr.ref(),
      parent: plot_model.ref()
    }, options);
    xaxis = Collections('LinearAxis').create({
      'orientation': 'bottom',
      'data_range': xdr.ref(),
      'mapper': 'linear',
      'parent': plot_model.ref()
    }, options);
    yaxis = Collections('LinearAxis').create({
      'orientation': 'left',
      'data_range': ydr.ref(),
      'mapper': 'linear',
      'parent': plot_model.ref()
    }, options);
    return plot_model.set({
      'renderers': [line_plot.ref()],
      'axes': [xaxis.ref(), yaxis.ref()]
    }, options);
  };

  glyph_plot = function(data_source, renderer, dom_element, xdatanames, ydatanames) {
    var plot_model, xaxis, xdr, yaxis, ydr;

    if (xdatanames == null) {
      xdatanames = ['x'];
    }
    if (ydatanames == null) {
      ydatanames = ['y'];
    }
    plot_model = Collections('Plot').create();
    xdr = Collections('DataRange1d').create({
      sources: [
        {
          ref: data_source.ref(),
          columns: ['x']
        }
      ]
    });
    ydr = Collections('DataRange1d').create({
      sources: [
        {
          ref: data_source.ref(),
          columns: ['y']
        }
      ]
    });
    renderer.set('xdata_range', xdr.ref());
    renderer.set('ydata_range', ydr.ref());
    xaxis = Collections('LinearAxis').create({
      orientation: 'bottom',
      parent: plot_model.ref(),
      data_range: xdr.ref()
    });
    yaxis = Collections('LinearAxis').create({
      orientation: 'left',
      parent: plot_model.ref(),
      data_range: ydr.ref()
    });
    plot_model.set({
      renderers: [renderer.ref()],
      axes: [xaxis.ref(), yaxis.ref()]
    });
    return plot_model;
  };

  make_glyph_plot = function(data_source, defaults, glyphspecs, xrange, yrange, _arg) {
    var axes, boxselectionoverlay, dims, ds, g, glyph, glyphs, glyphspec, idx, legend, legend_name, legend_renderer, legends, pantool, plot_model, plot_title, plot_tools, pstool, reference_point, resizetool, selecttool, tools, val, x, xaxis1, xaxis2, xrule, yaxis1, yaxis2, yrule, zoomtool, _i, _j, _k, _len, _len1, _len2, _ref;

    dims = _arg.dims, tools = _arg.tools, axes = _arg.axes, legend = _arg.legend, legend_name = _arg.legend_name, plot_title = _arg.plot_title, reference_point = _arg.reference_point;
    if (dims == null) {
      dims = [400, 400];
    }
    if (tools == null) {
      tools = true;
    }
    if (axes == null) {
      axes = true;
    }
    if (legend == null) {
      legend = true;
    }
    if (legend_name == null) {
      legend_name = "glyph";
    }
    if (plot_title == null) {
      plot_title = "";
    }
    glyphs = [];
    if (!_.isArray(glyphspecs)) {
      glyphspecs = [glyphspecs];
    }
    if (!_.isArray(data_source)) {
      for (_i = 0, _len = glyphspecs.length; _i < _len; _i++) {
        glyphspec = glyphspecs[_i];
        glyph = Collections('GlyphRenderer').create({
          data_source: data_source.ref(),
          glyphspec: glyphspec,
          nonselection_glyphspec: {
            fill_alpha: 0.1,
            line_alpha: 0.1
          },
          reference_point: reference_point
        });
        glyph.set(defaults);
        glyphs.push(glyph);
      }
    } else {
      _ref = zip(glyphspecs, data_source);
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        val = _ref[_j];
        glyphspec = val[0], ds = val[1];
        glyph = Collections('GlyphRenderer').create({
          xdata_range: xrange.ref(),
          ydata_range: yrange.ref(),
          data_source: ds.ref(),
          glyphspec: glyphspec
        });
        glyph.set(defaults);
        glyphs.push(glyph);
      }
    }
    plot_model = Collections('Plot').create({
      x_range: xrange.ref(),
      y_range: yrange.ref(),
      canvas_width: dims[0],
      canvas_height: dims[1],
      outer_width: dims[0],
      outer_height: dims[1],
      title: plot_title
    });
    plot_model.set(defaults);
    plot_model.add_renderers((function() {
      var _k, _len2, _results;

      _results = [];
      for (_k = 0, _len2 = glyphs.length; _k < _len2; _k++) {
        g = glyphs[_k];
        _results.push(g.ref());
      }
      return _results;
    })());
    if (axes) {
      xaxis1 = Collections('GuideRenderer').create({
        guidespec: {
          type: 'linear_axis',
          dimension: 0
        },
        axis_label: 'x',
        plot: plot_model.ref()
      });
      yaxis1 = Collections('GuideRenderer').create({
        guidespec: {
          type: 'linear_axis',
          dimension: 1
        },
        axis_label: 'y',
        plot: plot_model.ref()
      });
      xaxis2 = Collections('GuideRenderer').create({
        guidespec: {
          type: 'linear_axis',
          dimension: 0,
          location: 'max'
        },
        plot: plot_model.ref()
      });
      yaxis2 = Collections('GuideRenderer').create({
        guidespec: {
          type: 'linear_axis',
          dimension: 1,
          location: 'max'
        },
        plot: plot_model.ref()
      });
      xrule = Collections('GuideRenderer').create({
        guidespec: {
          type: 'rule',
          dimension: 0,
          bounds: 'auto'
        },
        plot: plot_model.ref()
      });
      yrule = Collections('GuideRenderer').create({
        guidespec: {
          type: 'rule',
          dimension: 1,
          bounds: 'auto'
        },
        plot: plot_model.ref()
      });
      plot_model.add_renderers([xrule.ref(), yrule.ref(), xaxis1.ref(), yaxis1.ref(), xaxis2.ref(), yaxis2.ref()]);
    }
    if (tools) {
      pantool = Collections('PanTool').create({
        dataranges: [xrange.ref(), yrange.ref()],
        dimensions: ['width', 'height']
      });
      zoomtool = Collections('ZoomTool').create({
        dataranges: [xrange.ref(), yrange.ref()],
        dimensions: ['width', 'height']
      });
      selecttool = Collections('SelectionTool').create({
        renderers: (function() {
          var _k, _len2, _results;

          _results = [];
          for (_k = 0, _len2 = glyphs.length; _k < _len2; _k++) {
            x = glyphs[_k];
            _results.push(x.ref());
          }
          return _results;
        })()
      });
      boxselectionoverlay = Collections('BoxSelectionOverlay').create({
        tool: selecttool.ref()
      });
      resizetool = Collections('ResizeTool').create();
      pstool = Collections('PreviewSaveTool').create();
      plot_tools = [pantool, zoomtool, pstool, resizetool, selecttool];
      plot_model.set_obj('tools', plot_tools);
      plot_model.add_renderers([boxselectionoverlay.ref()]);
    }
    if (legend) {
      legends = {};
      legend_renderer = Collections("AnnotationRenderer").create({
        plot: plot_model.ref(),
        annotationspec: {
          type: "legend",
          orientation: "top_right",
          legends: legends
        }
      });
      for (idx = _k = 0, _len2 = glyphs.length; _k < _len2; idx = ++_k) {
        g = glyphs[idx];
        legends[legend_name + String(idx)] = [g.ref()];
      }
      plot_model.add_renderers([legend_renderer.ref()]);
    }
    return plot_model;
  };

  make_glyph_test = function(test_name, data_source, defaults, glyphspecs, xrange, yrange, _arg) {
    var axes, dims, legend, legend_name, plot_title, reference_point, tools;

    dims = _arg.dims, tools = _arg.tools, axes = _arg.axes, legend = _arg.legend, legend_name = _arg.legend_name, plot_title = _arg.plot_title, reference_point = _arg.reference_point;
    if (dims == null) {
      dims = [400, 400];
    }
    if (tools == null) {
      tools = true;
    }
    if (axes == null) {
      axes = true;
    }
    if (legend == null) {
      legend = true;
    }
    if (legend_name == null) {
      legend_name = "glyph";
    }
    if (plot_title == null) {
      plot_title = "";
    }
    return function() {
      var div, myrender, opts, plot_model;

      expect(0);
      opts = {
        dims: dims,
        tools: tools,
        axes: axes,
        legend: legend,
        legend_name: legend_name,
        plot_title: plot_title,
        reference_point: reference_point
      };
      plot_model = make_glyph_plot(data_source, defaults, glyphspecs, xrange, yrange, opts);
      div = $('<div class="plotdiv"></div>');
      $('body').append(div);
      myrender = function() {
        var view;

        view = new plot_model.default_view({
          model: plot_model
        });
        div.append(view.$el);
        return console.log('Test ' + test_name);
      };
      return _.defer(myrender);
    };
  };

  window.bokehprettyprint = function(obj) {
    var key, val, _results;

    _results = [];
    for (key in obj) {
      if (!__hasProp.call(obj, key)) continue;
      val = obj[key];
      _results.push(console.log(key, val));
    }
    return _results;
  };

  exports.scatter_plot = scatter_plot;

  exports.data_table = data_table;

  exports.make_range_and_mapper = make_range_and_mapper;

  exports.bar_plot = bar_plot;

  exports.line_plot = line_plot;

  exports.glyph_plot = glyph_plot;

  exports.make_glyph_test = make_glyph_test;

  exports.make_glyph_plot = make_glyph_plot;

}).call(this);
}, "pandas/pandaspivot": function(exports, require, module) {module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      var column, computed_column, idx, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3;
    
      __out.push('<form class="form-inline tablecontrolform">\n<label>Transform </label>:  <select class="tablecontrolstate">\n    <option value="groupby" selected="selected">Group By</option>\n    <option value="filtering">Filtering</option>\n    <option value="computed">Computed Columns</option>\n  </select>\n  <br/>\n  ');
    
      if (this.tablecontrolstate === 'groupby') {
        __out.push('\n  <label>GroupBy </label>\n  <input type="text" class="pandasgroup" value="');
        __out.push(__sanitize(this.group));
        __out.push('"/>\n  <label>Aggregation</label>\n  <select class="pandasagg">\n    <option value="sum">sum</option>\n    <option value="mean">mean</option>\n    <option value="std">std</option>\n    <option value="max">max</option>\n    <option value="min">min</option>\n  </select>\n  ');
      }
    
      __out.push('\n  ');
    
      if (this.tablecontrolstate === 'filtering') {
        __out.push('\n  <label class="checkbox" >\n    ');
        if (this.filterselected) {
          __out.push('\n    <input type="checkbox" class="filterselected" checked="checked"/>\n    ');
        } else {
          __out.push('\n    <input type="checkbox" class="filterselected"/>\n    ');
        }
        __out.push('\n    Filter Selection\n  </label>\n  <input type="button" class="clearselected btn btn-mini" value="Clear Selection"/>\n  <label>\n    Search\n  </label>\n  <input type="text" class="search input-large"/>\n  ');
      }
    
      __out.push('\n  \n  ');
    
      if (this.tablecontrolstate === 'computed') {
        __out.push('\n  <table class="table">\n    <thead>\n      <th>\n        Name\n      </th>\n      <th>\n        Value\n      </th>\n      <th>\n      </th>\n    </thead>\n    ');
        _ref = this.computed_columns;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          computed_column = _ref[_i];
          __out.push('\n    <tr>\n      <td>\n        ');
          __out.push(__sanitize(computed_column.name));
          __out.push('\n      </td>\n      <td>\n        ');
          __out.push(__sanitize(computed_column.code));
          __out.push('\n      </td>\n      <td>\n        <a class="column_del" \n           name="');
          __out.push(__sanitize(computed_column.name));
          __out.push('" href="#">[delete]</a>\n      </td>\n    </tr>\n    ');
        }
        __out.push('\n    <tr>\n      <td>\n        <input type="text" class="computedname input-mini"/>\n      </td>\n      <td>\n        <input type="text" class="computedtxtbox input-medium"/>\n      </td>\n      <td>\n      </td>\n    </tr>\n  </table>\n  ');
      }
    
      __out.push('\n  \n</form>\n\n<table class="bokehdatatable table table-bordered"\n');
    
      if (this.width) {
        __out.push('\n       style="max-height:');
        __out.push(__sanitize(this.height));
        __out.push('px;max-width:');
        __out.push(__sanitize(this.width));
        __out.push('px"\n');
      } else {
        __out.push('\n       style="max-height:');
        __out.push(__sanitize(this.height));
        __out.push('px"\n');
      }
    
      __out.push('\n       >\n  <thead>\n    ');
    
      if (this.counts) {
        __out.push('\n    <th>counts</th>\n    ');
      }
    
      __out.push('\n    <th>index</th>\n    ');
    
      _ref1 = this.columns;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        column = _ref1[_j];
        __out.push('\n    ');
        if (!this.skip[column]) {
          __out.push('\n    <th><a class="pandascolumn">');
          __out.push(__sanitize(column));
          __out.push('</a>\n      \n      ');
          if (this.sort_ascendings[column] === true) {
            __out.push('\n      <i class="icon-caret-up"></i>\n      ');
          } else if (this.sort_ascendings[column] === false) {
            __out.push('\n      <i class="icon-caret-down"></i>\n      ');
          }
          __out.push('\n      \n      ');
        }
        __out.push('\n    </th>\n    ');
      }
    
      __out.push('\n  </thead>\n  ');
    
      _ref2 = _.range(this.length);
      for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
        idx = _ref2[_k];
        __out.push('\n  <tr class="pandasrow" rownum="');
        __out.push(__sanitize(idx));
        __out.push('">\n    ');
        if (this.selected && this.selected[idx]) {
          __out.push('\n      <td style="background-color:');
          __out.push(__sanitize(this.colors[idx]));
          __out.push('"> \n        ');
          __out.push(__sanitize(this.selected[idx]));
          __out.push('/');
          __out.push(__sanitize(this.counts[idx]));
          __out.push('\n      </td>      \n    ');
        } else {
          __out.push('\n      <td> ');
          __out.push(__sanitize(this.counts[idx]));
          __out.push(' </td>\n    ');
        }
        __out.push('\n    <td> ');
        __out.push(__sanitize(this.index[idx]));
        __out.push(' </td>\n    ');
        _ref3 = this.columns;
        for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
          column = _ref3[_l];
          __out.push('\n      ');
          if (!this.skip[column]) {
            __out.push('    \n      <td> ');
            __out.push(__sanitize(this.data[column][idx]));
            __out.push(' </td>\n      ');
          }
          __out.push('\n    ');
        }
        __out.push('\n  </tr>\n  ');
      }
    
      __out.push('\n</table>\n<form>\n  <center>\n    <div class="btn-group pagination">\n      <button class="btn btn-mini">First</button>\n      <button class="btn btn-mini">Previous</button>\n      <button class="btn btn-mini">Next</button>\n      <button class="btn btn-mini">Last</button>  \n    </div>\n    <div class="paginatedisplay">\n      Show <input type="text" class="pandassize" value="');
    
      __out.push(__sanitize(this.length));
    
      __out.push('"> records\n      From <input type="text" class="pandasoffset" value="');
    
      __out.push(__sanitize(this.offset));
    
      __out.push('">\n      to ');
    
      __out.push(__sanitize(this.length + this.offset));
    
      __out.push(' - \n      Total : ');
    
      __out.push(__sanitize(this.totallength));
    
      __out.push('\n    </div>\n  </center>\n</form>\n');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}}, "pandas/pandas": function(exports, require, module) {(function() {
  var Collection, ContinuumView, ENTER, HasParent, HasProperties, IPythonRemoteData, PandasPivotTable, PandasPivotView, PandasPlotSource, PandasPlotSources, base, coll, datasource, _ref, _ref1, _ref2, _ref3, _ref4,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  base = require("../base");

  datasource = require("../common/datasource");

  ContinuumView = require("../common/continuum_view").ContinuumView;

  HasParent = base.HasParent;

  HasProperties = base.HasProperties;

  Collection = Backbone.Collection;

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

  coll = Collection.extend({
    model: IPythonRemoteData
  });

  exports.ipythonremotedatas = new coll();

  ENTER = 13;

  PandasPlotSource = (function(_super) {
    __extends(PandasPlotSource, _super);

    function PandasPlotSource() {
      _ref1 = PandasPlotSource.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    PandasPlotSource.prototype.type = 'PandasPlotSource';

    return PandasPlotSource;

  })(datasource.ColumnDataSource);

  coll = Collection.extend({
    model: PandasPlotSource
  });

  exports.pandasplotsources = new coll();

  PandasPlotSources = (function(_super) {
    __extends(PandasPlotSources, _super);

    function PandasPlotSources() {
      _ref2 = PandasPlotSources.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    PandasPlotSources.prototype.model = PandasPlotSource;

    return PandasPlotSources;

  })(Backbone.Collection);

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
      this.search = __bind(this.search, this);      _ref3 = PandasPivotView.__super__.constructor.apply(this, arguments);
      return _ref3;
    }

    PandasPivotView.prototype.template = require("./pandaspivot");

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
        var _i, _len, _ref4, _ref5, _results;

        _ref4 = _.zip(selected, counts);
        _results = [];
        for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
          _ref5 = _ref4[_i], select = _ref5[0], count = _ref5[1];
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
      var colors, group, html, obj, sort, sort_ascendings, source, template_data, _i, _len, _ref4;

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
      _ref4 = this.mget('sort');
      for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
        obj = _ref4[_i];
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

  })(ContinuumView);

  PandasPivotTable = (function(_super) {
    __extends(PandasPivotTable, _super);

    function PandasPivotTable() {
      this.toggle_column_sort = __bind(this.toggle_column_sort, this);
      this.dinitialize = __bind(this.dinitialize, this);      _ref4 = PandasPivotTable.__super__.constructor.apply(this, arguments);
      return _ref4;
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

    PandasPivotTable.prototype.defaults = {
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

    PandasPivotTable.prototype.default_view = PandasPivotView;

    return PandasPivotTable;

  })(HasParent);

  coll = Collection.extend({
    model: PandasPivotTable
  });

  exports.pandaspivottables = new coll();

}).call(this);
}, "renderers/annotation/legend": function(exports, require, module) {(function() {
  var HasParent, Legend, LegendView, PlotWidget, base, line_properties, properties, text_properties, textutils, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  base = require('../../base');

  HasParent = base.HasParent;

  PlotWidget = require('../../common/plot_widget').PlotWidget;

  properties = require('../properties');

  textutils = require('../../common/textutils');

  line_properties = properties.line_properties;

  text_properties = properties.text_properties;

  "Legends:\n\nlegend_padding is the boundary between the legend and the edge of the plot\nlegend_spacing goes between each legend entry and the edge of the legend,\nas well as between 2 adjacent legend entries.  It is also the space between\nthe legend label, and the legend glyph.\n\nA legend in the top right corner looks like this\n\nplotborder\npadding\nlegendborder\nspacing\nlegendborder|spacing|label|spacing|glyph|spacing|legendborder|padding|plotborder\nspacing\nlegendborder|spacing|label|spacing|glyph|spacing|legendborder|padding|plotborder\nspacing\nborder\n";

  LegendView = (function(_super) {
    __extends(LegendView, _super);

    function LegendView() {
      _ref = LegendView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    LegendView.prototype.initialize = function(options) {
      LegendView.__super__.initialize.call(this, options);
      return this.change_annotationspec();
    };

    LegendView.prototype.delegateEvents = function(events) {
      LegendView.__super__.delegateEvents.call(this, events);
      this.listenTo(this.model, 'change:annotationspec', this.change_annotationspec);
      return this.listenTo(this.plot_view.view_state, 'change', this.calc_dims);
    };

    LegendView.prototype.change_annotationspec = function() {
      this.annotationspec = this.mget('annotationspec');
      this.label_props = new text_properties(this, this.annotationspec, 'label_');
      this.border_props = new line_properties(this, this.annotationspec, 'border_');
      if (this.annotationspec.legend_names) {
        this.legend_names = this.annotationspec.legend_names;
      } else {
        this.legend_names = _.keys(this.annotationspec.legends);
      }
      return this.calc_dims();
    };

    LegendView.prototype.calc_dims = function(options) {
      var ctx, h_range, label_height, label_width, legend_padding, legend_spacing, orientation, text_width, text_widths, v_range, x, y, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8;

      label_height = (_ref1 = this.annotationspec.label_height) != null ? _ref1 : this.mget('label_height');
      this.glyph_height = (_ref2 = this.annotationspec.glyph_height) != null ? _ref2 : this.mget('glyph_height');
      label_width = (_ref3 = this.annotationspec.label_width) != null ? _ref3 : this.mget('label_width');
      this.glyph_width = (_ref4 = this.annotationspec.glyph_width) != null ? _ref4 : this.mget('glyph_width');
      legend_spacing = (_ref5 = this.annotationspec.legend_spacing) != null ? _ref5 : this.mget('legend_spacing');
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
      orientation = (_ref6 = this.annotationspec.orientation) != null ? _ref6 : this.mget('orientation');
      legend_padding = (_ref7 = this.annotationspec.legend_padding) != null ? _ref7 : this.mget('legend_padding');
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
        _ref8 = this.annotationspec.absolute_coords, x = _ref8[0], y = _ref8[1];
      }
      x = this.plot_view.view_state.sx_to_device(x);
      y = this.plot_view.view_state.sy_to_device(y);
      return this.box_coords = [x, y];
    };

    LegendView.prototype.render = function() {
      var ctx, idx, legend_name, legend_spacing, renderer, view, x, x1, x2, y, y1, y2, yoffset, yspacing, _i, _j, _len, _len1, _ref1, _ref2, _ref3;

      ctx = this.plot_view.ctx;
      ctx.save();
      ctx.fillStyle = this.plot_model.get('background_fill');
      this.border_props.set(ctx, this);
      ctx.beginPath();
      ctx.rect(this.box_coords[0], this.box_coords[1], this.legend_width, this.legend_height);
      ctx.fill();
      ctx.stroke();
      this.label_props.set(ctx, this);
      legend_spacing = (_ref1 = this.annotationspec.legend_spacing) != null ? _ref1 : this.mget('legend_spacing');
      _ref2 = this.legend_names;
      for (idx = _i = 0, _len = _ref2.length; _i < _len; idx = ++_i) {
        legend_name = _ref2[idx];
        yoffset = idx * this.label_height;
        yspacing = (1 + idx) * legend_spacing;
        y = this.box_coords[1] + this.label_height / 2.0 + yoffset + yspacing;
        x = this.box_coords[0] + legend_spacing;
        x1 = this.box_coords[0] + 2 * legend_spacing + this.label_width;
        x2 = x1 + this.glyph_width;
        y1 = this.box_coords[1] + yoffset + yspacing;
        y2 = y1 + this.glyph_height;
        ctx.fillText(legend_name, x, y);
        _ref3 = this.model.resolve_ref(this.annotationspec.legends[legend_name]);
        for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
          renderer = _ref3[_j];
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

    Legend.prototype.type = 'AnnotationRenderer';

    return Legend;

  })(HasParent);

  Legend.prototype.defaults = _.clone(Legend.prototype.defaults);

  Legend.prototype.display_defaults = _.clone(Legend.prototype.display_defaults);

  _.extend(Legend.prototype.display_defaults, {
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
    label_text_align: "center",
    label_text_baseline: "middle",
    glyph_height: 20,
    glyph_width: 20,
    label_height: 20,
    label_width: 50,
    legend_padding: 10,
    legend_spacing: 3,
    orientation: "top_right",
    label_text_align: "left",
    label_text_baseline: "middle",
    datapoint: null
  });

  exports.Legend = Legend;

}).call(this);
}, "renderers/annotation/title": function(exports, require, module) {(function() {


}).call(this);
}, "renderers/glyph/arc": function(exports, require, module) {(function() {
  var Arc, ArcView, Glyph, GlyphView, glyph, glyph_properties, line_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  line_properties = properties.line_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  ArcView = (function(_super) {
    __extends(ArcView, _super);

    function ArcView() {
      _ref = ArcView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ArcView.prototype.initialize = function(options) {
      var glyphspec;

      glyphspec = this.mget('glyphspec');
      this.glyph_props = new glyph_properties(this, glyphspec, ['x', 'y', 'radius', 'start_angle', 'end_angle', 'direction:string'], [new line_properties(this, glyphspec)]);
      this.do_stroke = this.glyph_props.line_properties.do_stroke;
      return ArcView.__super__.initialize.call(this, options);
    };

    ArcView.prototype._set_data = function(data) {
      var angle, dir, end_angle, i, obj, start_angle, _i, _ref1, _results;

      this.data = data;
      this.x = this.glyph_props.v_select('x', data);
      this.y = this.glyph_props.v_select('y', data);
      start_angle = (function() {
        var _i, _len, _results;

        _results = [];
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          obj = data[_i];
          _results.push(this.glyph_props.select('start_angle', obj));
        }
        return _results;
      }).call(this);
      this.start_angle = (function() {
        var _i, _len, _results;

        _results = [];
        for (_i = 0, _len = start_angle.length; _i < _len; _i++) {
          angle = start_angle[_i];
          _results.push(-angle);
        }
        return _results;
      })();
      end_angle = (function() {
        var _i, _len, _results;

        _results = [];
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          obj = data[_i];
          _results.push(this.glyph_props.select('end_angle', obj));
        }
        return _results;
      }).call(this);
      this.end_angle = (function() {
        var _i, _len, _results;

        _results = [];
        for (_i = 0, _len = end_angle.length; _i < _len; _i++) {
          angle = end_angle[_i];
          _results.push(-angle);
        }
        return _results;
      })();
      this.direction = new Array(this.data.length);
      _results = [];
      for (i = _i = 0, _ref1 = this.data.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        dir = this.glyph_props.select('direction', data[i]);
        if (dir === 'clock') {
          _results.push(this.direction[i] = false);
        } else if (dir === 'anticlock') {
          _results.push(this.direction[i] = true);
        } else {
          _results.push(this.direction[i] = NaN);
        }
      }
      return _results;
    };

    ArcView.prototype._render = function() {
      var ctx, _ref1;

      _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
      this.radius = this.distance(this.data, 'x', 'radius', 'edge');
      ctx = this.plot_view.ctx;
      ctx.save();
      if (this.glyph_props.fast_path) {
        this._fast_path(ctx);
      } else {
        this._full_path(ctx);
      }
      return ctx.restore();
    };

    ArcView.prototype._fast_path = function(ctx) {
      var i, _i, _ref1, _results;

      if (this.do_stroke) {
        this.glyph_props.line_properties.set(ctx, this.glyph_props);
        _results = [];
        for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (isNaN(this.sx[i] + this.sy[i] + this.radius[i] + this.start_angle[i] + this.end_angle[i] + this.direction[i])) {
            continue;
          }
          ctx.beginPath();
          ctx.arc(this.sx[i], this.sy[i], this.radius[i], this.start_angle[i], this.end_angle[i], this.direction[i]);
          _results.push(ctx.stroke());
        }
        return _results;
      }
    };

    ArcView.prototype._full_path = function(ctx) {
      var i, _i, _ref1, _results;

      if (this.do_stroke) {
        _results = [];
        for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (isNaN(this.sx[i] + this.sy[i] + this.radius[i] + this.start_angle[i] + this.end_angle[i] + this.direction[i])) {
            continue;
          }
          ctx.beginPath();
          ctx.arc(this.sx[i], this.sy[i], this.radius[i], this.start_angle[i], this.end_angle[i], this.direction[i]);
          this.glyph_props.line_properties.set(ctx, this.data[i]);
          _results.push(ctx.stroke());
        }
        return _results;
      }
    };

    ArcView.prototype.draw_legend = function(ctx, x1, x2, y1, y2) {
      var border, d, data_r, direction, end_angle, glyph_props, glyph_settings, line_props, r, reference_point, start_angle;

      glyph_props = this.glyph_props;
      line_props = glyph_props.line_properties;
      ctx.save();
      reference_point = this.get_reference_point();
      if (reference_point != null) {
        glyph_settings = reference_point;
        data_r = this.distance([reference_point], 'x', 'radius', 'edge')[0];
        start_angle = -this.glyph_props.select('start_angle', reference_point);
        end_angle = -this.glyph_props.select('end_angle', reference_point);
      } else {
        glyph_settings = glyph_props;
        start_angle = -0.1;
        end_angle = -3.9;
      }
      direction = this.glyph_props.select('direction', glyph_settings);
      direction = direction === "clock" ? false : true;
      border = line_props.select(line_props.line_width_name, glyph_settings);
      ctx.beginPath();
      d = _.min([Math.abs(x2 - x1), Math.abs(y2 - y1)]);
      d = d - 2 * border;
      r = d / 2;
      if (data_r != null) {
        r = data_r > r ? r : data_r;
      }
      ctx.arc((x1 + x2) / 2.0, (y1 + y2) / 2.0, r, start_angle, end_angle, direction);
      line_props.set(ctx, glyph_settings);
      ctx.stroke();
      return ctx.restore();
    };

    return ArcView;

  })(GlyphView);

  Arc = (function(_super) {
    __extends(Arc, _super);

    function Arc() {
      _ref1 = Arc.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Arc.prototype.default_view = ArcView;

    Arc.prototype.type = 'GlyphRenderer';

    return Arc;

  })(Glyph);

  Arc.prototype.display_defaults = _.clone(Arc.prototype.display_defaults);

  _.extend(Arc.prototype.display_defaults, {
    diection: 'anticlock',
    line_color: 'red',
    line_width: 1,
    line_alpha: 1.0,
    line_join: 'miter',
    line_cap: 'butt',
    line_dash: [],
    line_dash_offset: 0
  });

  exports.Arc = Arc;

  exports.ArcView = ArcView;

}).call(this);
}, "renderers/glyph/multi_line": function(exports, require, module) {(function() {
  var Glyph, GlyphView, MultiLine, MultiLineView, glyph, glyph_properties, line_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  line_properties = properties.line_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  MultiLineView = (function(_super) {
    __extends(MultiLineView, _super);

    function MultiLineView() {
      _ref = MultiLineView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    MultiLineView.prototype.initialize = function(options) {
      var glyphspec;

      glyphspec = this.mget('glyphspec');
      this.glyph_props = new glyph_properties(this, glyphspec, ['xs:array', 'ys:array'], [new line_properties(this, glyphspec)]);
      this.do_stroke = this.glyph_props.line_properties.do_stroke;
      return MultiLineView.__super__.initialize.call(this, options);
    };

    MultiLineView.prototype._set_data = function(data) {
      this.data = data;
    };

    MultiLineView.prototype._render = function() {
      var ctx;

      ctx = this.plot_view.ctx;
      ctx.save();
      if (this.glyph_props.fast_path) {
        this._fast_path(ctx);
      } else {
        this._full_path(ctx);
      }
      return ctx.restore();
    };

    MultiLineView.prototype._fast_path = function(ctx) {
      var i, pt, sx, sy, x, y, _i, _j, _len, _ref1, _ref2, _ref3, _results;

      if (this.do_stroke) {
        this.glyph_props.line_properties.set(ctx, this.glyph_props);
        _ref1 = this.data;
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          pt = _ref1[_i];
          x = this.glyph_props.select('xs', pt);
          y = this.glyph_props.select('ys', pt);
          _ref2 = this.plot_view.map_to_screen(x, this.glyph_props.xs.units, y, this.glyph_props.ys.units), sx = _ref2[0], sy = _ref2[1];
          for (i = _j = 0, _ref3 = sx.length - 1; 0 <= _ref3 ? _j <= _ref3 : _j >= _ref3; i = 0 <= _ref3 ? ++_j : --_j) {
            if (i === 0) {
              ctx.beginPath();
              ctx.moveTo(sx[i], sy[i]);
              continue;
            } else if (isNaN(sx[i]) || isNaN(sy[i])) {
              ctx.stroke();
              ctx.beginPath();
              continue;
            } else {
              ctx.lineTo(sx[i], sy[i]);
            }
          }
          _results.push(ctx.stroke());
        }
        return _results;
      }
    };

    MultiLineView.prototype._full_path = function(ctx) {
      var i, pt, sx, sy, x, y, _i, _j, _len, _ref1, _ref2, _ref3, _results;

      if (this.do_stroke) {
        _ref1 = this.data;
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          pt = _ref1[_i];
          x = this.glyph_props.select('xs', pt);
          y = this.glyph_props.select('ys', pt);
          _ref2 = this.plot_view.map_to_screen(x, this.glyph_props.xs.units, y, this.glyph_props.ys.units), sx = _ref2[0], sy = _ref2[1];
          this.glyph_props.line_properties.set(ctx, pt);
          for (i = _j = 0, _ref3 = sx.length - 1; 0 <= _ref3 ? _j <= _ref3 : _j >= _ref3; i = 0 <= _ref3 ? ++_j : --_j) {
            if (i === 0) {
              ctx.beginPath();
              ctx.moveTo(sx[i], sy[i]);
              continue;
            } else if (isNaN(sx[i]) || isNaN(sy[i])) {
              ctx.stroke();
              ctx.beginPath();
              continue;
            } else {
              ctx.lineTo(sx[i], sy[i]);
            }
          }
          _results.push(ctx.stroke());
        }
        return _results;
      }
    };

    MultiLineView.prototype.draw_legend = function(ctx, x1, x2, y1, y2) {
      var glyph_props, glyph_settings, line_props, reference_point;

      glyph_props = this.glyph_props;
      line_props = glyph_props.line_properties;
      reference_point = this.get_reference_point();
      if (reference_point != null) {
        glyph_settings = reference_point;
      } else {
        glyph_settings = glyph_props;
      }
      line_props.set(ctx, glyph_settings);
      ctx.beginPath();
      ctx.moveTo(x1, (y1 + y2) / 2);
      ctx.lineTo(x2, (y1 + y2) / 2);
      ctx.stroke();
      ctx.beginPath();
      return ctx.restore();
    };

    return MultiLineView;

  })(GlyphView);

  MultiLine = (function(_super) {
    __extends(MultiLine, _super);

    function MultiLine() {
      _ref1 = MultiLine.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    MultiLine.prototype.default_view = MultiLineView;

    MultiLine.prototype.type = 'GlyphRenderer';

    return MultiLine;

  })(Glyph);

  MultiLine.prototype.display_defaults = _.clone(MultiLine.prototype.display_defaults);

  _.extend(MultiLine.prototype.display_defaults, {
    line_color: 'red',
    line_width: 1,
    line_alpha: 1.0,
    line_join: 'miter',
    line_cap: 'butt',
    line_dash: [],
    line_dash_offset: 0
  });

  exports.MultiLine = MultiLine;

  exports.MultiLineView = MultiLineView;

}).call(this);
}, "renderers/glyph/image_rgba": function(exports, require, module) {(function() {
  var Glyph, GlyphView, ImageRGBAGlyph, ImageRGBAView, glyph, glyph_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  ImageRGBAView = (function(_super) {
    __extends(ImageRGBAView, _super);

    function ImageRGBAView() {
      _ref = ImageRGBAView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ImageRGBAView.prototype.initialize = function(options) {
      var glyphspec;

      glyphspec = this.mget('glyphspec');
      this.glyph_props = new glyph_properties(this, glyphspec, ['image:array', 'width', 'height', 'x', 'y', 'dw', 'dh'], []);
      return ImageRGBAView.__super__.initialize.call(this, options);
    };

    ImageRGBAView.prototype._set_data = function(data) {
      var ctx, h, height, i, img, obj, width, _i, _j, _ref1, _ref2, _results;

      this.data = data;
      this.x = this.glyph_props.v_select('x', data);
      this.y = this.glyph_props.v_select('y', data);
      h = this.glyph_props.v_select('dh', data);
      for (i = _i = 0, _ref1 = this.y.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        this.y[i] += h[i];
      }
      width = this.glyph_props.v_select('width', data);
      height = this.glyph_props.v_select('height', data);
      img = (function() {
        var _j, _len, _results;

        _results = [];
        for (_j = 0, _len = data.length; _j < _len; _j++) {
          obj = data[_j];
          _results.push(this.glyph_props.select('image', obj));
        }
        return _results;
      }).call(this);
      if ((this.image_data == null) || this.image_data.length !== data.length) {
        this.image_data = new Array(data.length);
      }
      if ((this.image_canvas == null) || this.image_canvas.length !== data.length) {
        this.image_canvas = new Array(data.length);
      }
      _results = [];
      for (i = _j = 0, _ref2 = data.length - 1; 0 <= _ref2 ? _j <= _ref2 : _j >= _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
        if ((this.image_canvas[i] == null) || (this.image_canvas[i].width !== width[i] || this.image_canvas[i].height !== height[i])) {
          this.image_canvas[i] = document.createElement('canvas');
          this.image_canvas[i].width = width[i];
          this.image_canvas[i].height = height[i];
          ctx = this.image_canvas[i].getContext('2d');
          this.image_data[i] = ctx.createImageData(width[i], height[i]);
        }
        ctx = this.image_canvas[i].getContext('2d');
        this.image_data[i].data.set(new Uint8ClampedArray(img[i]));
        _results.push(ctx.putImageData(this.image_data[i], 0, 0));
      }
      return _results;
    };

    ImageRGBAView.prototype._render = function() {
      var ctx, i, old_smoothing, y_offset, _i, _ref1, _ref2;

      _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
      this.sw = this.distance(this.data, 'x', 'dw', 'edge');
      this.sh = this.distance(this.data, 'y', 'dh', 'edge');
      ctx = this.plot_view.ctx;
      ctx.save();
      old_smoothing = ctx.getImageSmoothingEnabled();
      ctx.setImageSmoothingEnabled(false);
      for (i = _i = 0, _ref2 = this.sx.length - 1; 0 <= _ref2 ? _i <= _ref2 : _i >= _ref2; i = 0 <= _ref2 ? ++_i : --_i) {
        if (isNaN(this.sx[i] + this.sy[i] + this.sw[i] + this.sh[i])) {
          continue;
        }
        y_offset = this.sy[i] + this.sh[i] / 2;
        ctx.translate(0, y_offset);
        ctx.scale(1, -1);
        ctx.translate(0, -y_offset);
        ctx.drawImage(this.image_canvas[i], this.sx[i] | 0, this.sy[i] | 0, this.sw[i], this.sh[i]);
        ctx.translate(0, y_offset);
        ctx.scale(1, -1);
        ctx.translate(0, -y_offset);
      }
      ctx.setImageSmoothingEnabled(old_smoothing);
      return ctx.restore();
    };

    return ImageRGBAView;

  })(GlyphView);

  ImageRGBAGlyph = (function(_super) {
    __extends(ImageRGBAGlyph, _super);

    function ImageRGBAGlyph() {
      _ref1 = ImageRGBAGlyph.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    ImageRGBAGlyph.prototype.default_view = ImageRGBAView;

    ImageRGBAGlyph.prototype.type = 'GlyphRenderer';

    return ImageRGBAGlyph;

  })(Glyph);

  ImageRGBAGlyph.prototype.display_defaults = _.clone(ImageRGBAGlyph.prototype.display_defaults);

  _.extend(ImageRGBAGlyph.prototype.display_defaults, {
    level: 'underlay'
  });

  exports.ImageRGBA = ImageRGBAGlyph;

  exports.ImageRGBAView = ImageRGBAView;

}).call(this);
}, "renderers/glyph/square": function(exports, require, module) {(function() {
  var Glyph, GlyphView, Square, SquareView, fill_properties, glyph, glyph_properties, line_properties, properties, rect, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  line_properties = properties.line_properties;

  fill_properties = properties.fill_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  rect = require("./rect");

  SquareView = (function(_super) {
    __extends(SquareView, _super);

    function SquareView() {
      _ref = SquareView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    SquareView.prototype.initialize = function(options) {
      var spec;

      SquareView.__super__.initialize.call(this, options);
      this.glyph_props = this.init_glyph(this.mget('glyphspec'));
      if (this.mget('selection_glyphspec')) {
        spec = _.extend({}, this.mget('glyphspec'), this.mget('selection_glyphspec'));
        this.selection_glyphprops = this.init_glyph(spec);
      }
      if (this.mget('nonselection_glyphspec')) {
        spec = _.extend({}, this.mget('glyphspec'), this.mget('nonselection_glyphspec'));
        this.nonselection_glyphprops = this.init_glyph(spec);
      }
      this.do_fill = this.glyph_props.fill_properties.do_fill;
      return this.do_stroke = this.glyph_props.line_properties.do_stroke;
    };

    SquareView.prototype.init_glyph = function(glyphspec) {
      var fill_props, glyph_props, line_props;

      fill_props = new fill_properties(this, glyphspec);
      line_props = new line_properties(this, glyphspec);
      glyph_props = new glyph_properties(this, glyphspec, ['x', 'y', 'size', 'angle'], [line_props, fill_props]);
      return glyph_props;
    };

    SquareView.prototype._map_data = function() {
      var _ref1;

      _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
      this.sw = this.distance(this.data, 'x', 'size', 'center');
      return this.sh = this.sw;
    };

    SquareView.prototype.draw_legend = function(ctx, x1, x2, y1, y2) {
      var border, data_h, data_w, fill_props, glyph_props, glyph_settings, h, line_props, reference_point, w, x, y;

      glyph_props = this.glyph_props;
      line_props = glyph_props.line_properties;
      fill_props = glyph_props.fill_properties;
      ctx.save();
      reference_point = this.get_reference_point();
      if (reference_point != null) {
        glyph_settings = reference_point;
        data_w = this.distance([reference_point], 'x', 'size', 'center')[0];
        data_h = data_w;
      } else {
        glyph_settings = glyph_props;
      }
      border = line_props.select(line_props.line_width_name, glyph_settings);
      ctx.beginPath();
      w = Math.abs(x2 - x1);
      h = Math.abs(y2 - y1);
      w = w - 2 * border;
      h = h - 2 * border;
      if (data_w != null) {
        w = data_w > w ? w : data_w;
      }
      if (data_h != null) {
        h = data_h > h ? h : data_h;
      }
      x = (x1 + x2) / 2 - (w / 2);
      y = (y1 + y2) / 2 - (h / 2);
      ctx.rect(x, y, w, h);
      fill_props.set(ctx, glyph_settings);
      ctx.fill();
      line_props.set(ctx, glyph_settings);
      ctx.stroke();
      return ctx.restore();
    };

    return SquareView;

  })(rect.RectView);

  Square = (function(_super) {
    __extends(Square, _super);

    function Square() {
      _ref1 = Square.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Square.prototype.default_view = SquareView;

    Square.prototype.type = 'GlyphRenderer';

    return Square;

  })(rect.Rect);

  exports.Square = Square;

  exports.SquareView = SquareView;

}).call(this);
}, "renderers/glyph/line": function(exports, require, module) {(function() {
  var Glyph, GlyphView, Line, LineView, glyph, glyph_properties, line_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  line_properties = properties.line_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  LineView = (function(_super) {
    __extends(LineView, _super);

    function LineView() {
      _ref = LineView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    LineView.prototype.initialize = function(options) {
      var spec;

      LineView.__super__.initialize.call(this, options);
      this.glyph_props = this.init_glyph(this.mget('glyphspec'));
      if (this.mget('selection_glyphspec')) {
        spec = _.extend({}, this.mget('glyphspec'), this.mget('selection_glyphspec'));
        this.selection_glyphprops = this.init_glyph(spec);
      }
      if (this.mget('nonselection_glyphspec')) {
        spec = _.extend({}, this.mget('glyphspec'), this.mget('nonselection_glyphspec'));
        this.nonselection_glyphprops = this.init_glyph(spec);
      }
      return this.do_stroke = this.glyph_props.line_properties.do_stroke;
    };

    LineView.prototype.init_glyph = function(glyphspec) {
      var glyph_props;

      glyph_props = new glyph_properties(this, glyphspec, ['x:number', 'y:number'], [new line_properties(this, glyphspec)]);
      return glyph_props;
    };

    LineView.prototype._set_data = function(data) {
      var i, _i, _ref1, _results;

      this.data = data;
      this.x = this.glyph_props.v_select('x', data);
      this.y = this.glyph_props.v_select('y', data);
      this.selected_mask = new Array(data.length - 1);
      _results = [];
      for (i = _i = 0, _ref1 = this.selected_mask.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        _results.push(this.selected_mask[i] = false);
      }
      return _results;
    };

    LineView.prototype._map_data = function() {
      var _ref1;

      return _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1], _ref1;
    };

    LineView.prototype._render = function() {
      var ctx, idx, props, selected, _i, _len;

      this._map_data();
      ctx = this.plot_view.ctx;
      ctx.save();
      selected = this.mget_obj('data_source').get('selected');
      for (_i = 0, _len = selected.length; _i < _len; _i++) {
        idx = selected[_i];
        this.selected_mask[idx] = true;
      }
      if (selected && selected.length && this.nonselection_glyphprops) {
        if (this.selection_glyphprops) {
          props = this.selection_glyphprops;
        } else {
          props = this.glyph_props;
        }
        this._draw_path(ctx, this.nonselection_glyphprops, false);
        this._draw_path(ctx, props, true);
      } else {
        this._draw_path(ctx);
      }
      return ctx.restore();
    };

    LineView.prototype._draw_path = function(ctx, glyph_props, draw_selected) {
      var drawing, i, selected_mask, sx, sy, _i, _ref1;

      if (!glyph_props) {
        glyph_props = this.glyph_props;
      }
      glyph_props.line_properties.set(ctx, glyph_props);
      sx = this.sx;
      sy = this.sy;
      selected_mask = this.selected_mask;
      drawing = false;
      for (i = _i = 0, _ref1 = sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        if (isNaN(sx[i] + sy[i]) || (draw_selected && !selected_mask[i]) || (!draw_selected && selected_mask[i])) {
          if (drawing) {
            ctx.stroke();
          }
          drawing = false;
          continue;
        }
        if (!drawing) {
          ctx.beginPath();
          ctx.moveTo(sx[i], sy[i]);
          drawing = true;
        } else {
          ctx.lineTo(sx[i], sy[i]);
        }
      }
      if (drawing) {
        return ctx.stroke();
      }
    };

    LineView.prototype.draw_legend = function(ctx, x1, x2, y1, y2) {
      var glyph_props, glyph_settings, line_props, reference_point;

      glyph_props = this.glyph_props;
      line_props = glyph_props.line_properties;
      reference_point = this.get_reference_point();
      if (reference_point != null) {
        glyph_settings = reference_point;
      } else {
        glyph_settings = glyph_props;
      }
      line_props.set(ctx, glyph_settings);
      ctx.beginPath();
      ctx.moveTo(x1, (y1 + y2) / 2);
      ctx.lineTo(x2, (y1 + y2) / 2);
      ctx.stroke();
      ctx.beginPath();
      return ctx.restore();
    };

    LineView.prototype.select = function(xscreenbounds, yscreenbounds) {
      var i, selected, _i, _ref1;

      xscreenbounds = [this.plot_view.view_state.sx_to_device(xscreenbounds[0]), this.plot_view.view_state.sx_to_device(xscreenbounds[1])];
      yscreenbounds = [this.plot_view.view_state.sy_to_device(yscreenbounds[0]), this.plot_view.view_state.sy_to_device(yscreenbounds[1])];
      xscreenbounds = [_.min(xscreenbounds), _.max(xscreenbounds)];
      yscreenbounds = [_.min(yscreenbounds), _.max(yscreenbounds)];
      selected = [];
      for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        if (xscreenbounds) {
          if (this.sx[i] < xscreenbounds[0] || this.sx[i] > xscreenbounds[1]) {
            continue;
          }
        }
        if (yscreenbounds) {
          if (this.sy[i] < yscreenbounds[0] || this.sy[i] > yscreenbounds[1]) {
            continue;
          }
        }
        selected.push(i);
      }
      return selected;
    };

    return LineView;

  })(GlyphView);

  Line = (function(_super) {
    __extends(Line, _super);

    function Line() {
      _ref1 = Line.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Line.prototype.default_view = LineView;

    Line.prototype.type = 'GlyphRenderer';

    return Line;

  })(Glyph);

  Line.prototype.display_defaults = _.clone(Line.prototype.display_defaults);

  _.extend(Line.prototype.display_defaults, {
    line_color: 'red',
    line_width: 1,
    line_alpha: 1.0,
    line_join: 'miter',
    line_cap: 'butt',
    line_dash: [],
    line_dash_offset: 0
  });

  exports.Line = Line;

  exports.LineView = LineView;

}).call(this);
}, "renderers/glyph/ray": function(exports, require, module) {(function() {
  var Glyph, GlyphView, Ray, RayView, glyph, glyph_properties, line_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  line_properties = properties.line_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  RayView = (function(_super) {
    __extends(RayView, _super);

    function RayView() {
      _ref = RayView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    RayView.prototype.initialize = function(options) {
      var glyphspec;

      glyphspec = this.mget('glyphspec');
      this.glyph_props = new glyph_properties(this, glyphspec, ['x', 'y', 'angle', 'length'], [new line_properties(this, glyphspec)]);
      this.do_stroke = this.glyph_props.line_properties.do_stroke;
      return RayView.__super__.initialize.call(this, options);
    };

    RayView.prototype._set_data = function(data) {
      var angle, angles, obj;

      this.data = data;
      this.x = this.glyph_props.v_select('x', data);
      this.y = this.glyph_props.v_select('y', data);
      angles = (function() {
        var _i, _len, _results;

        _results = [];
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          obj = data[_i];
          _results.push(this.glyph_props.select('angle', obj));
        }
        return _results;
      }).call(this);
      this.angle = (function() {
        var _i, _len, _results;

        _results = [];
        for (_i = 0, _len = angles.length; _i < _len; _i++) {
          angle = angles[_i];
          _results.push(-angle);
        }
        return _results;
      })();
      return this.length = this.glyph_props.v_select('length', data);
    };

    RayView.prototype._render = function() {
      var ctx, height, i, inf_len, width, _i, _ref1, _ref2;

      _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
      width = this.plot_view.view_state.get('width');
      height = this.plot_view.view_state.get('height');
      inf_len = 2 * (width + height);
      this.slength = this.length.slice(0);
      for (i = _i = 0, _ref2 = this.slength.length - 1; 0 <= _ref2 ? _i <= _ref2 : _i >= _ref2; i = 0 <= _ref2 ? ++_i : --_i) {
        if (this.slength[i] === 0) {
          this.slength[i] = inf_len;
        }
      }
      ctx = this.plot_view.ctx;
      ctx.save();
      if (this.glyph_props.fast_path) {
        this._fast_path(ctx);
      } else {
        this._full_path(ctx);
      }
      return ctx.restore();
    };

    RayView.prototype._fast_path = function(ctx) {
      var i, _i, _ref1;

      if (this.do_stroke) {
        this.glyph_props.line_properties.set(ctx, this.glyph_props);
        ctx.beginPath();
        for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (isNaN(this.sx[i] + this.sy[i] + this.angle[i] + this.slength[i])) {
            continue;
          }
          ctx.translate(this.sx[i], this.sy[i]);
          ctx.rotate(this.angle[i]);
          ctx.moveTo(0, 0);
          ctx.lineTo(this.slength[i], 0);
          ctx.rotate(-this.angle[i]);
          ctx.translate(-this.sx[i], -this.sy[i]);
        }
        return ctx.stroke();
      }
    };

    RayView.prototype._full_path = function(ctx) {
      var i, _i, _ref1, _results;

      if (this.do_stroke) {
        _results = [];
        for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (isNaN(this.sx[i] + this.sy[i] + this.angle[i] + this.slength[i])) {
            continue;
          }
          ctx.translate(this.sx[i], this.sy[i]);
          ctx.rotate(this.angle[i]);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(this.slength[i], 0);
          this.glyph_props.line_properties.set(ctx, this.data[i]);
          ctx.stroke();
          ctx.rotate(-this.angle[i]);
          _results.push(ctx.translate(-this.sx[i], -this.sy[i]));
        }
        return _results;
      }
    };

    RayView.prototype.draw_legend = function(ctx, x1, x2, y1, y2) {
      var angle, glyph_props, glyph_settings, line_props, r, reference_point, sx, sy;

      glyph_props = this.glyph_props;
      line_props = glyph_props.line_properties;
      reference_point = this.get_reference_point();
      if (reference_point != null) {
        glyph_settings = reference_point;
      } else {
        glyph_settings = glyph_props;
      }
      angle = -this.glyph_props.select('angle', glyph_settings);
      r = _.min([Math.abs(x2 - x1), Math.abs(y2 - y1)]) / 2;
      sx = (x1 + x2) / 2;
      sy = (y1 + y2) / 2;
      ctx.beginPath();
      ctx.translate(sx, sy);
      ctx.rotate(angle);
      ctx.moveTo(0, 0);
      ctx.lineTo(r, 0);
      ctx.rotate(-angle);
      ctx.translate(-sx, -sy);
      line_props.set(ctx, glyph_settings);
      ctx.stroke();
      return ctx.restore();
    };

    return RayView;

  })(GlyphView);

  Ray = (function(_super) {
    __extends(Ray, _super);

    function Ray() {
      _ref1 = Ray.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Ray.prototype.default_view = RayView;

    Ray.prototype.type = 'GlyphRenderer';

    return Ray;

  })(Glyph);

  Ray.prototype.display_defaults = _.clone(Ray.prototype.display_defaults);

  _.extend(Ray.prototype.display_defaults, {
    line_color: 'red',
    line_width: 1,
    line_alpha: 1.0,
    line_join: 'miter',
    line_cap: 'butt',
    line_dash: [],
    line_dash_offset: 0
  });

  exports.Ray = Ray;

  exports.RayView = RayView;

}).call(this);
}, "renderers/glyph/image": function(exports, require, module) {(function() {
  var ColorMapper, Glyph, GlyphView, ImageGlyph, ImageView, all_palettes, glyph, glyph_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  all_palettes = require('../../palettes/palettes').all_palettes;

  ColorMapper = require('../../mappers/color/linear_color_mapper').LinearColorMapper;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  ImageView = (function(_super) {
    __extends(ImageView, _super);

    function ImageView() {
      _ref = ImageView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ImageView.prototype.initialize = function(options) {
      var glyphspec;

      glyphspec = this.mget('glyphspec');
      this.glyph_props = new glyph_properties(this, glyphspec, ['image:array', 'width', 'height', 'x', 'y', 'dw', 'dh', 'palette:string'], []);
      return ImageView.__super__.initialize.call(this, options);
    };

    ImageView.prototype._set_data = function(data) {
      var buf, buf8, canvas, cmap, ctx, h, height, i, image_data, img, obj, width, _i, _j, _ref1, _ref2, _results;

      this.data = data;
      this.x = this.glyph_props.v_select('x', data);
      this.y = this.glyph_props.v_select('y', data);
      h = this.glyph_props.v_select('dh', data);
      for (i = _i = 0, _ref1 = this.y.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        this.y[i] += h[i];
      }
      this.pal = this.glyph_props.v_select('palette', data);
      width = this.glyph_props.v_select('width', data);
      height = this.glyph_props.v_select('height', data);
      img = (function() {
        var _j, _len, _results;

        _results = [];
        for (_j = 0, _len = data.length; _j < _len; _j++) {
          obj = data[_j];
          _results.push(this.glyph_props.select('image', obj));
        }
        return _results;
      }).call(this);
      this.image_data = new Array(data.length);
      _results = [];
      for (i = _j = 0, _ref2 = data.length - 1; 0 <= _ref2 ? _j <= _ref2 : _j >= _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
        canvas = document.createElement('canvas');
        canvas.width = width[i];
        canvas.height = height[i];
        ctx = canvas.getContext('2d');
        image_data = ctx.getImageData(0, 0, width[i], height[i]);
        cmap = new ColorMapper({}, {
          palette: all_palettes[this.pal[i]]
        });
        buf = cmap.v_map_screen(img[i]);
        buf8 = new Uint8ClampedArray(buf);
        image_data.data.set(buf8);
        ctx.putImageData(image_data, 0, 0);
        _results.push(this.image_data[i] = canvas);
      }
      return _results;
    };

    ImageView.prototype._render = function() {
      var ctx, i, old_smoothing, y_offset, _i, _ref1, _ref2;

      _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
      this.sw = this.distance(this.data, 'x', 'dw', 'edge');
      this.sh = this.distance(this.data, 'y', 'dh', 'edge');
      ctx = this.plot_view.ctx;
      ctx.save();
      old_smoothing = ctx.getImageSmoothingEnabled();
      ctx.setImageSmoothingEnabled(false);
      for (i = _i = 0, _ref2 = this.sx.length - 1; 0 <= _ref2 ? _i <= _ref2 : _i >= _ref2; i = 0 <= _ref2 ? ++_i : --_i) {
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

  })(GlyphView);

  ImageGlyph = (function(_super) {
    __extends(ImageGlyph, _super);

    function ImageGlyph() {
      _ref1 = ImageGlyph.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    ImageGlyph.prototype.default_view = ImageView;

    ImageGlyph.prototype.type = 'GlyphRenderer';

    return ImageGlyph;

  })(Glyph);

  ImageGlyph.prototype.display_defaults = _.clone(ImageGlyph.prototype.display_defaults);

  _.extend(ImageGlyph.prototype.display_defaults, {
    level: 'underlay'
  });

  exports.Image = ImageGlyph;

  exports.ImageView = ImageView;

}).call(this);
}, "renderers/glyph/segment": function(exports, require, module) {(function() {
  var Glyph, GlyphView, Segment, SegmentView, glyph, glyph_properties, line_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  line_properties = properties.line_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  SegmentView = (function(_super) {
    __extends(SegmentView, _super);

    function SegmentView() {
      _ref = SegmentView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    SegmentView.prototype.initialize = function(options) {
      var glyphspec;

      glyphspec = this.mget('glyphspec');
      this.glyph_props = new glyph_properties(this, glyphspec, ['x0', 'y0', 'x1', 'y1'], [new line_properties(this, glyphspec)]);
      this.do_stroke = this.glyph_props.line_properties.do_stroke;
      return SegmentView.__super__.initialize.call(this, options);
    };

    SegmentView.prototype._set_data = function(data) {
      this.data = data;
      this.x0 = this.glyph_props.v_select('x0', data);
      this.y0 = this.glyph_props.v_select('y0', data);
      this.x1 = this.glyph_props.v_select('x1', data);
      return this.y1 = this.glyph_props.v_select('y1', data);
    };

    SegmentView.prototype._render = function() {
      var ctx, _ref1, _ref2;

      _ref1 = this.plot_view.map_to_screen(this.x0, this.glyph_props.x0.units, this.y0, this.glyph_props.y0.units), this.sx0 = _ref1[0], this.sy0 = _ref1[1];
      _ref2 = this.plot_view.map_to_screen(this.x1, this.glyph_props.x1.units, this.y1, this.glyph_props.y1.units), this.sx1 = _ref2[0], this.sy1 = _ref2[1];
      ctx = this.plot_view.ctx;
      ctx.save();
      if (this.glyph_props.fast_path) {
        this._fast_path(ctx);
      } else {
        this._full_path(ctx);
      }
      return ctx.restore();
    };

    SegmentView.prototype._fast_path = function(ctx) {
      var i, _i, _ref1;

      if (this.do_stroke) {
        this.glyph_props.line_properties.set(ctx, this.glyph_props);
        ctx.beginPath();
        for (i = _i = 0, _ref1 = this.sx0.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (isNaN(this.sx0[i] + this.sy0[i] + this.sx1[i] + this.sy1[i])) {
            continue;
          }
          ctx.moveTo(this.sx0[i], this.sy0[i]);
          ctx.lineTo(this.sx1[i], this.sy1[i]);
        }
        return ctx.stroke();
      }
    };

    SegmentView.prototype._full_path = function(ctx) {
      var i, _i, _ref1, _results;

      if (this.do_stroke) {
        _results = [];
        for (i = _i = 0, _ref1 = this.sx0.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (isNaN(this.sx0[i] + this.sy0[i] + this.sx1[i] + this.sy1[i])) {
            continue;
          }
          ctx.beginPath();
          ctx.moveTo(this.sx0[i], this.sy0[i]);
          ctx.lineTo(this.sx1[i], this.sy1[i]);
          this.glyph_props.line_properties.set(ctx, this.data[i]);
          _results.push(ctx.stroke());
        }
        return _results;
      }
    };

    SegmentView.prototype.draw_legend = function(ctx, x1, x2, y1, y2) {
      var glyph_props, glyph_settings, line_props, reference_point;

      glyph_props = this.glyph_props;
      line_props = glyph_props.line_properties;
      reference_point = this.get_reference_point();
      if (reference_point != null) {
        glyph_settings = reference_point;
      } else {
        glyph_settings = glyph_props;
      }
      line_props.set(ctx, glyph_settings);
      ctx.beginPath();
      ctx.moveTo(x1, (y1 + y2) / 2);
      ctx.lineTo(x2, (y1 + y2) / 2);
      ctx.stroke();
      ctx.beginPath();
      return ctx.restore();
    };

    return SegmentView;

  })(GlyphView);

  Segment = (function(_super) {
    __extends(Segment, _super);

    function Segment() {
      _ref1 = Segment.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Segment.prototype.default_view = SegmentView;

    Segment.prototype.type = 'GlyphRenderer';

    return Segment;

  })(Glyph);

  Segment.prototype.display_defaults = _.clone(Segment.prototype.display_defaults);

  _.extend(Segment.prototype.display_defaults, {
    line_color: 'red',
    line_width: 1,
    line_alpha: 1.0,
    line_join: 'miter',
    line_cap: 'butt',
    line_dash: [],
    line_dash_offset: 0
  });

  exports.Segment = Segment;

  exports.SegmentView = SegmentView;

}).call(this);
}, "renderers/glyph/oval": function(exports, require, module) {(function() {
  var Glyph, GlyphView, Oval, OvalView, fill_properties, glyph, glyph_properties, line_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  line_properties = properties.line_properties;

  fill_properties = properties.fill_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  OvalView = (function(_super) {
    __extends(OvalView, _super);

    function OvalView() {
      _ref = OvalView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    OvalView.prototype.initialize = function(options) {
      var spec;

      this.glyph_props = this.init_glyph(this.mget('glyphspec'));
      if (this.mget('selection_glyphspec')) {
        spec = _.extend({}, this.mget('glyphspec'), this.mget('selection_glyphspec'));
        this.selection_glyphprops = this.init_glyph(spec);
      }
      if (this.mget('nonselection_glyphspec')) {
        spec = _.extend({}, this.mget('glyphspec'), this.mget('nonselection_glyphspec'));
        this.nonselection_glyphprops = this.init_glyph(spec);
      }
      this.do_fill = this.glyph_props.fill_properties.do_fill;
      this.do_stroke = this.glyph_props.line_properties.do_stroke;
      return OvalView.__super__.initialize.call(this, options);
    };

    OvalView.prototype.init_glyph = function(glyphspec) {
      var glyph_props;

      glyph_props = new glyph_properties(this, glyphspec, ['x', 'y', 'width', 'height', 'angle'], [new fill_properties(this, glyphspec), new line_properties(this, glyphspec)]);
      return glyph_props;
    };

    OvalView.prototype._set_data = function(data) {
      var angle, angles, i, obj, _i, _ref1, _results;

      this.data = data;
      this.x = this.glyph_props.v_select('x', data);
      this.y = this.glyph_props.v_select('y', data);
      angles = (function() {
        var _i, _len, _results;

        _results = [];
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          obj = data[_i];
          _results.push(this.glyph_props.select('angle', obj));
        }
        return _results;
      }).call(this);
      this.angle = (function() {
        var _i, _len, _results;

        _results = [];
        for (_i = 0, _len = angles.length; _i < _len; _i++) {
          angle = angles[_i];
          _results.push(-angle);
        }
        return _results;
      })();
      this.selected_mask = new Array(data.length - 1);
      _results = [];
      for (i = _i = 0, _ref1 = this.selected_mask.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        _results.push(this.selected_mask[i] = false);
      }
      return _results;
    };

    OvalView.prototype._render = function() {
      var ctx, idx, props, selected, _i, _len, _ref1;

      _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
      this.sw = this.distance(this.data, 'x', 'width', 'center');
      this.sh = this.distance(this.data, 'y', 'height', 'center');
      ctx = this.plot_view.ctx;
      ctx.save();
      selected = this.mget_obj('data_source').get('selected');
      for (_i = 0, _len = selected.length; _i < _len; _i++) {
        idx = selected[_i];
        this.selected_mask[idx] = true;
      }
      if (this.glyph_props.fast_path) {
        this._fast_path(ctx);
      } else {
        if (selected && selected.length && this.nonselection_glyphprops) {
          if (this.selection_glyphprops) {
            props = this.selection_glyphprops;
          } else {
            props = this.glyph_props;
          }
          this._full_path(ctx, props, 'selected');
          this._full_path(ctx, this.nonselection_glyphprops, 'unselected');
        } else {
          this._full_path(ctx);
        }
      }
      return ctx.restore();
    };

    OvalView.prototype._fast_path = function(ctx) {
      var i, _i, _j, _ref1, _ref2;

      if (this.do_fill) {
        this.glyph_props.fill_properties.set(ctx, this.glyph_props);
        for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (isNaN(this.sx[i] + this.sy[i] + this.sw[i] + this.sh[i] + this.angle[i])) {
            continue;
          }
          ctx.translate(this.sx[i], this.sy[i]);
          ctx.rotate(this.angle[i]);
          ctx.beginPath();
          ctx.moveTo(0, -this.sh[i] / 2);
          ctx.bezierCurveTo(this.sw[i] / 2, -this.sh[i] / 2, this.sw[i] / 2, this.sh[i] / 2, 0, this.sh[i] / 2);
          ctx.bezierCurveTo(-this.sw[i] / 2, this.sh[i] / 2, -this.sw[i] / 2, -this.sh[i] / 2, 0, -this.sh[i] / 2);
          ctx.closePath();
          ctx.fill();
          ctx.rotate(-this.angle[i]);
          ctx.translate(-this.sx[i], -this.sy[i]);
        }
      }
      if (this.do_fill) {
        this.glyph_props.line_properties.set(ctx, this.glyph_props);
        ctx.beginPath();
        for (i = _j = 0, _ref2 = this.sx.length - 1; 0 <= _ref2 ? _j <= _ref2 : _j >= _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
          if (isNaN(this.sx[i] + this.sy[i] + this.sw[i] + this.sh[i] + this.angle[i])) {
            continue;
          }
          ctx.translate(this.sx[i], this.sy[i]);
          ctx.rotate(this.angle[i]);
          ctx.moveTo(0, -this.sh[i] / 2);
          ctx.bezierCurveTo(this.sw[i] / 2, -this.sh[i] / 2, this.sw[i] / 2, this.sh[i] / 2, 0, this.sh[i] / 2);
          ctx.bezierCurveTo(-this.sw[i] / 2, this.sh[i] / 2, -this.sw[i] / 2, -this.sh[i] / 2, 0, -this.sh[i] / 2);
          ctx.rotate(-this.angle[i]);
          ctx.translate(-this.sx[i], -this.sy[i]);
        }
        return ctx.stroke();
      }
    };

    OvalView.prototype._full_path = function(ctx, glyph_props, use_selection) {
      var i, _i, _ref1, _results;

      if (!glyph_props) {
        glyph_props = this.glyph_props;
      }
      _results = [];
      for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        if (isNaN(this.sx[i] + this.sy[i] + this.sw[i] + this.sh[i] + this.angle[i])) {
          continue;
        }
        if (isNaN(this.sx[i] + this.sy[i] + this.sw[i] + this.sh[i] + this.angle[i])) {
          continue;
        }
        if (use_selection === 'selected' && !this.selected_mask[i]) {
          continue;
        }
        if (use_selection === 'unselected' && this.selected_mask[i]) {
          continue;
        }
        ctx.translate(this.sx[i], this.sy[i]);
        ctx.rotate(this.angle[i]);
        ctx.beginPath();
        ctx.moveTo(0, -this.sh[i] / 2);
        ctx.bezierCurveTo(this.sw[i] / 2, -this.sh[i] / 2, this.sw[i] / 2, this.sh[i] / 2, 0, this.sh[i] / 2);
        ctx.bezierCurveTo(-this.sw[i] / 2, this.sh[i] / 2, -this.sw[i] / 2, -this.sh[i] / 2, 0, -this.sh[i] / 2);
        ctx.closePath();
        if (this.do_fill) {
          glyph_props.fill_properties.set(ctx, this.data[i]);
          ctx.fill();
        }
        if (this.do_stroke) {
          glyph_props.line_properties.set(ctx, this.data[i]);
          ctx.stroke();
        }
        ctx.rotate(-this.angle[i]);
        _results.push(ctx.translate(-this.sx[i], -this.sy[i]));
      }
      return _results;
    };

    OvalView.prototype.draw_legend = function(ctx, x1, x2, y1, y2) {
      var border, fill_props, glyph_props, glyph_settings, h, line_props, ratio, ratio1, ratio2, reference_point, sh, sw, w;

      glyph_props = this.glyph_props;
      line_props = glyph_props.line_properties;
      fill_props = glyph_props.fill_properties;
      ctx.save();
      reference_point = this.get_reference_point();
      if (reference_point != null) {
        glyph_settings = reference_point;
        sw = this.distance([reference_point], 'x', 'width', 'center')[0];
        sh = this.distance([refrence_point], 'y', 'height', 'center')[0];
      } else {
        glyph_settings = glyph_props;
        sw = 1.0;
        sh = 2.0;
      }
      border = line_props.select(line_props.line_width_name, glyph_settings);
      w = Math.abs(x2 - x1);
      h = Math.abs(y2 - y1);
      w = w - 2 * border;
      h = h - 2 * border;
      ratio1 = h / sh;
      ratio2 = w / sw;
      ratio = _.min([ratio1, ratio2]);
      h = sh * ratio;
      w = sw * ratio;
      ctx.translate((x1 + x2) / 2, (y1 + y2) / 2);
      ctx.beginPath();
      ctx.moveTo(0, -h / 2);
      ctx.bezierCurveTo(w / 2, -h / 2, w / 2, h / 2, 0, h / 2);
      ctx.bezierCurveTo(-w / 2, h / 2, -w / 2, -h / 2, 0, -h / 2);
      ctx.closePath();
      fill_props.set(ctx, glyph_settings);
      ctx.fill();
      line_props.set(ctx, glyph_settings);
      ctx.stroke();
      return ctx.restore();
    };

    OvalView.prototype.select = function(xscreenbounds, yscreenbounds) {
      var i, selected, _i, _ref1;

      xscreenbounds = [this.plot_view.view_state.sx_to_device(xscreenbounds[0]), this.plot_view.view_state.sx_to_device(xscreenbounds[1])];
      yscreenbounds = [this.plot_view.view_state.sy_to_device(yscreenbounds[0]), this.plot_view.view_state.sy_to_device(yscreenbounds[1])];
      xscreenbounds = [_.min(xscreenbounds), _.max(xscreenbounds)];
      yscreenbounds = [_.min(yscreenbounds), _.max(yscreenbounds)];
      selected = [];
      for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        if (xscreenbounds) {
          if (this.sx[i] < xscreenbounds[0] || this.sx[i] > xscreenbounds[1]) {
            continue;
          }
        }
        if (yscreenbounds) {
          if (this.sy[i] < yscreenbounds[0] || this.sy[i] > yscreenbounds[1]) {
            continue;
          }
        }
        selected.push(i);
      }
      return selected;
    };

    return OvalView;

  })(GlyphView);

  Oval = (function(_super) {
    __extends(Oval, _super);

    function Oval() {
      _ref1 = Oval.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Oval.prototype.default_view = OvalView;

    Oval.prototype.type = 'GlyphRenderer';

    return Oval;

  })(Glyph);

  Oval.prototype.display_defaults = _.clone(Oval.prototype.display_defaults);

  _.extend(Oval.prototype.display_defaults, {
    fill: 'gray',
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

  exports.Oval = Oval;

  exports.OvalView = OvalView;

}).call(this);
}, "renderers/glyph/annulus": function(exports, require, module) {(function() {
  var Annulus, AnnulusView, Glyph, GlyphView, fill_properties, glyph, glyph_properties, line_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  line_properties = properties.line_properties;

  fill_properties = properties.fill_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  AnnulusView = (function(_super) {
    __extends(AnnulusView, _super);

    function AnnulusView() {
      _ref = AnnulusView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    AnnulusView.prototype.initialize = function(options) {
      var spec;

      this.glyph_props = this.init_glyph(this.mget('glyphspec'));
      if (this.mget('selection_glyphspec')) {
        spec = _.extend({}, this.mget('glyphspec'), this.mget('selection_glyphspec'));
        this.selection_glyphprops = this.init_glyph(spec);
      }
      if (this.mget('nonselection_glyphspec')) {
        spec = _.extend({}, this.mget('glyphspec'), this.mget('nonselection_glyphspec'));
        this.nonselection_glyphprops = this.init_glyph(spec);
      }
      this.do_fill = this.glyph_props.fill_properties.do_fill;
      this.do_stroke = this.glyph_props.line_properties.do_stroke;
      return AnnulusView.__super__.initialize.call(this, options);
    };

    AnnulusView.prototype.init_glyph = function(glyphspec) {
      var glyph_props;

      glyph_props = new glyph_properties(this, glyphspec, ['x', 'y', 'inner_radius', 'outer_radius'], [new fill_properties(this, glyphspec), new line_properties(this, glyphspec)]);
      return glyph_props;
    };

    AnnulusView.prototype._set_data = function(data) {
      var i, _i, _ref1, _results;

      this.data = data;
      this.x = this.glyph_props.v_select('x', data);
      this.y = this.glyph_props.v_select('y', data);
      this.selected_mask = new Array(data.length - 1);
      _results = [];
      for (i = _i = 0, _ref1 = this.selected_mask.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        _results.push(this.selected_mask[i] = false);
      }
      return _results;
    };

    AnnulusView.prototype._render = function() {
      var ctx, idx, props, selected, _i, _len, _ref1;

      _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
      this.inner_radius = this.distance(this.data, 'x', 'inner_radius', 'edge');
      this.outer_radius = this.distance(this.data, 'x', 'outer_radius', 'edge');
      ctx = this.plot_view.ctx;
      ctx.save();
      selected = this.mget_obj('data_source').get('selected');
      for (_i = 0, _len = selected.length; _i < _len; _i++) {
        idx = selected[_i];
        this.selected_mask[idx] = true;
      }
      if (this.glyph_props.fast_path) {
        return this._fast_path(ctx);
      } else {
        if (selected && selected.length && this.nonselection_glyphprops) {
          if (this.selection_glyphprops) {
            props = this.selection_glyphprops;
          } else {
            props = this.glyph_props;
          }
          this._full_path(ctx, props, 'selected');
          this._full_path(ctx, this.nonselection_glyphprops, 'unselected');
        } else {
          this._full_path(ctx);
        }
        return ctx.restore();
      }
    };

    AnnulusView.prototype._fast_path = function(ctx) {
      var i, _i, _j, _ref1, _ref2, _results;

      if (this.do_fill) {
        this.glyph_props.fill_properties.set(ctx, this.glyph_props);
        for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (isNaN(this.sx[i] + this.sy[i] + this.inner_radius[i] + this.outer_radius[i])) {
            continue;
          }
          ctx.beginPath();
          ctx.arc(this.sx[i], this.sy[i], this.inner_radius[i], 0, 2 * Math.PI * 2, false);
          ctx.arc(this.sx[i], this.sy[i], this.outer_radius[i], 0, 2 * Math.PI * 2, true);
          ctx.fill();
        }
      }
      if (this.do_stroke) {
        this.glyph_props.line_properties.set(ctx, this.glyph_props);
        _results = [];
        for (i = _j = 0, _ref2 = this.sx.length - 1; 0 <= _ref2 ? _j <= _ref2 : _j >= _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
          if (isNaN(this.sx[i] + this.sy[i] + this.inner_radius[i] + this.outer_radius[i])) {
            continue;
          }
          ctx.beginPath();
          ctx.arc(this.sx[i], this.sy[i], this.inner_radius[i], 0, 2 * Math.PI * 2, false);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(this.sx[i], this.sy[i], this.outer_radius[i], 0, 2 * Math.PI * 2, true);
          _results.push(ctx.stroke());
        }
        return _results;
      }
    };

    AnnulusView.prototype._full_path = function(ctx, glyph_props, use_selection) {
      var i, _i, _ref1, _results;

      if (!glyph_props) {
        glyph_props = this.glyph_props;
      }
      _results = [];
      for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        if (isNaN(this.sx[i] + this.sy[i] + this.inner_radius[i] + this.outer_radius[i])) {
          continue;
        }
        if (use_selection === 'selected' && !this.selected_mask[i]) {
          continue;
        }
        if (use_selection === 'unselected' && this.selected_mask[i]) {
          continue;
        }
        ctx.beginPath();
        ctx.arc(this.sx[i], this.sy[i], this.inner_radius[i], 0, 2 * Math.PI * 2, false);
        ctx.moveTo(this.sx[i] + this.outer_radius[i], this.sy[i]);
        ctx.arc(this.sx[i], this.sy[i], this.outer_radius[i], 0, 2 * Math.PI * 2, true);
        if (this.do_fill) {
          glyph_props.fill_properties.set(ctx, this.data[i]);
          ctx.fill();
        }
        if (this.do_stroke) {
          glyph_props.line_properties.set(ctx, this.data[i]);
          _results.push(ctx.stroke());
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    AnnulusView.prototype.draw_legend = function(ctx, x1, x2, y1, y2) {
      var border, d, fill_props, glyph_props, glyph_settings, inner_radius, line_props, outer_radius, r, ratio, reference_point, sx, sy;

      glyph_props = this.glyph_props;
      line_props = glyph_props.line_properties;
      fill_props = glyph_props.fill_properties;
      ctx.save();
      reference_point = this.get_reference_point();
      if (reference_point != null) {
        glyph_settings = reference_point;
        outer_radius = this.distance([reference_point], 'x', 'outer_radius', 'edge');
        outer_radius = outer_radius[0];
        inner_radius = this.distance([reference_point], 'x', 'inner_radius', 'edge');
        inner_radius = inner_radius[0];
      } else {
        glyph_settings = glyph_props;
      }
      border = line_props.select(line_props.line_width_name, glyph_settings);
      d = _.min([Math.abs(x2 - x1), Math.abs(y2 - y1)]);
      d = d - 2 * border;
      r = d / 2;
      if ((outer_radius != null) || (inner_radius != null)) {
        ratio = r / outer_radius;
        outer_radius = r;
        inner_radius = inner_radius * ratio;
      } else {
        outer_radius = r;
        inner_radius = r / 2;
      }
      sx = (x1 + x2) / 2.0;
      sy = (y1 + y2) / 2.0;
      ctx.beginPath();
      ctx.arc(sx, sy, inner_radius, 0, 2 * Math.PI * 2, false);
      ctx.moveTo(sx + outer_radius, sy);
      ctx.arc(sx, sy, outer_radius, 0, 2 * Math.PI * 2, true);
      fill_props.set(ctx, glyph_settings);
      ctx.fill();
      line_props.set(ctx, glyph_settings);
      ctx.stroke();
      return ctx.restore();
    };

    AnnulusView.prototype.select = function(xscreenbounds, yscreenbounds) {
      var i, selected, _i, _ref1;

      xscreenbounds = [this.plot_view.view_state.sx_to_device(xscreenbounds[0]), this.plot_view.view_state.sx_to_device(xscreenbounds[1])];
      yscreenbounds = [this.plot_view.view_state.sy_to_device(yscreenbounds[0]), this.plot_view.view_state.sy_to_device(yscreenbounds[1])];
      xscreenbounds = [_.min(xscreenbounds), _.max(xscreenbounds)];
      yscreenbounds = [_.min(yscreenbounds), _.max(yscreenbounds)];
      selected = [];
      for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        if (xscreenbounds) {
          if (this.sx[i] < xscreenbounds[0] || this.sx[i] > xscreenbounds[1]) {
            continue;
          }
        }
        if (yscreenbounds) {
          if (this.sy[i] < yscreenbounds[0] || this.sy[i] > yscreenbounds[1]) {
            continue;
          }
        }
        selected.push(i);
      }
      return selected;
    };

    return AnnulusView;

  })(GlyphView);

  Annulus = (function(_super) {
    __extends(Annulus, _super);

    function Annulus() {
      _ref1 = Annulus.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Annulus.prototype.default_view = AnnulusView;

    Annulus.prototype.type = 'GlyphRenderer';

    return Annulus;

  })(Glyph);

  Annulus.prototype.display_defaults = _.clone(Annulus.prototype.display_defaults);

  _.extend(Annulus.prototype.display_defaults, {
    fill: 'gray',
    fill_alpha: 1.0,
    line_color: 'red',
    line_width: 1,
    line_alpha: 1.0,
    line_join: 'miter',
    line_cap: 'butt',
    line_dash: [],
    line_dash_offset: 0
  });

  exports.Annulus = Annulus;

  exports.AnnulusView = AnnulusView;

}).call(this);
}, "renderers/glyph/circle": function(exports, require, module) {(function() {
  var Circle, CircleView, Glyph, GlyphView, fill_properties, glyph, glyph_properties, line_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  line_properties = properties.line_properties;

  fill_properties = properties.fill_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  CircleView = (function(_super) {
    __extends(CircleView, _super);

    function CircleView() {
      _ref = CircleView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    CircleView.prototype.initialize = function(options) {
      var spec;

      CircleView.__super__.initialize.call(this, options);
      this.glyph_props = this.init_glyph(this.mget('glyphspec'));
      if (this.mget('selection_glyphspec')) {
        spec = _.extend({}, this.mget('glyphspec'), this.mget('selection_glyphspec'));
        this.selection_glyphprops = this.init_glyph(spec);
      }
      if (this.mget('nonselection_glyphspec')) {
        spec = _.extend({}, this.mget('glyphspec'), this.mget('nonselection_glyphspec'));
        this.nonselection_glyphprops = this.init_glyph(spec);
      }
      return this.have_new_data = false;
    };

    CircleView.prototype.init_glyph = function(glyphspec) {
      var glyph_props;

      glyph_props = new glyph_properties(this, glyphspec, ['x', 'y', 'radius'], [new fill_properties(this, glyphspec), new line_properties(this, glyphspec)]);
      return glyph_props;
    };

    CircleView.prototype._set_data = function(data) {
      var i, _i, _ref1;

      this.data = data;
      this.x = this.glyph_props.v_select('x', data);
      this.y = this.glyph_props.v_select('y', data);
      this.mask = new Array(data.length - 1);
      this.selected_mask = new Array(data.length - 1);
      for (i = _i = 0, _ref1 = this.mask.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        this.mask[i] = true;
        this.selected_mask[i] = false;
      }
      return this.have_new_data = true;
    };

    CircleView.prototype._render = function(plot_view, have_new_mapper_state) {
      var ctx, i, idx, oh, ow, props, selected, _i, _j, _len, _ref1, _ref2;

      if (have_new_mapper_state == null) {
        have_new_mapper_state = true;
      }
      _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
      ow = this.plot_view.view_state.get('outer_width');
      oh = this.plot_view.view_state.get('outer_height');
      if (this.have_new_data || have_new_mapper_state) {
        this.radius = this.distance(this.data, 'x', 'radius', 'edge');
        this.have_new_data = false;
      }
      ow = this.plot_view.view_state.get('outer_width');
      oh = this.plot_view.view_state.get('outer_height');
      for (i = _i = 0, _ref2 = this.mask.length - 1; 0 <= _ref2 ? _i <= _ref2 : _i >= _ref2; i = 0 <= _ref2 ? ++_i : --_i) {
        if ((this.sx[i] + this.radius[i]) < 0 || (this.sx[i] - this.radius[i]) > ow || (this.sy[i] + this.radius[i]) < 0 || (this.sy[i] - this.radius[i]) > oh) {
          this.mask[i] = false;
        } else {
          this.mask[i] = true;
        }
      }
      selected = this.mget_obj('data_source').get('selected');
      for (_j = 0, _len = selected.length; _j < _len; _j++) {
        idx = selected[_j];
        this.selected_mask[idx] = true;
      }
      ctx = this.plot_view.ctx;
      ctx.save();
      if (true) {
        if (selected && selected.length && this.nonselection_glyphprops) {
          if (this.selection_glyphprops) {
            props = this.selection_glyphprops;
          } else {
            props = this.glyph_props;
          }
          this._fast_path(ctx, props, true);
          this._fast_path(ctx, this.nonselection_glyphprops, false);
        } else {
          this._fast_path(ctx);
        }
      } else {
        if (selected && selected.length && this.nonselection_glyphprops) {
          if (this.selection_glyphprops) {
            props = this.selection_glyphprops;
          } else {
            props = this.glyph_props;
          }
          this._full_path(ctx, props, true);
          this._full_path(ctx, this.nonselection_glyphprops, false);
        } else {
          this._full_path(ctx);
        }
      }
      return ctx.restore();
    };

    CircleView.prototype._fast_path = function(ctx, glyph_props, use_selection) {
      var i, _i, _j, _ref1, _ref2;

      if (!glyph_props) {
        glyph_props = this.glyph_props;
      }
      if (glyph_props.fill_properties.do_fill) {
        glyph_props.fill_properties.set(ctx, this.glyph_props);
        ctx.beginPath();
        for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (isNaN(this.sx[i] + this.sy[i] + this.radius[i]) || !this.mask[i]) {
            continue;
          }
          if (use_selection && !this.selected_mask[i]) {
            continue;
          }
          if (use_selection === false && this.selected_mask[i]) {
            continue;
          }
          ctx.moveTo(this.sx[i], this.sy[i]);
          ctx.arc(this.sx[i], this.sy[i], this.radius[i], 0, 2 * Math.PI, false);
        }
        ctx.fill();
      }
      if (glyph_props.line_properties.do_stroke) {
        glyph_props.line_properties.set(ctx, this.glyph_props);
        ctx.beginPath();
        for (i = _j = 0, _ref2 = this.sx.length - 1; 0 <= _ref2 ? _j <= _ref2 : _j >= _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
          if (isNaN(this.sx[i] + this.sy[i] + this.radius[i]) || !this.mask[i]) {
            continue;
          }
          if (use_selection && !this.selected_mask[i]) {
            continue;
          }
          if (use_selection === false && this.selected_mask[i]) {
            continue;
          }
          ctx.moveTo(this.sx[i], this.sy[i]);
          ctx.arc(this.sx[i], this.sy[i], this.radius[i], 0, 2 * Math.PI, false);
        }
        return ctx.stroke();
      }
    };

    CircleView.prototype._full_path = function(ctx, glyph_props, use_selection) {
      var i, _i, _ref1, _results;

      if (!glyph_props) {
        glyph_props = this.glyph_props;
      }
      _results = [];
      for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        if (isNaN(this.sx[i] + this.sy[i] + this.radius[i]) || !this.mask[i]) {
          continue;
        }
        if (use_selection && !this.selected_mask[i]) {
          continue;
        }
        if (use_selection === false && this.selected_mask[i]) {
          continue;
        }
        ctx.beginPath();
        ctx.arc(this.sx[i], this.sy[i], this.radius[i], 0, 2 * Math.PI, false);
        if (glyph_props.fill_properties.do_fill) {
          glyph_props.fill_properties.set(ctx, this.data[i]);
          ctx.fill();
        }
        if (glyph_props.line_properties.do_stroke) {
          glyph_props.line_properties.set(ctx, this.data[i]);
          _results.push(ctx.stroke());
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    CircleView.prototype.select = function(xscreenbounds, yscreenbounds) {
      var i, selected, _i, _ref1;

      xscreenbounds = [this.plot_view.view_state.sx_to_device(xscreenbounds[0]), this.plot_view.view_state.sx_to_device(xscreenbounds[1])];
      yscreenbounds = [this.plot_view.view_state.sy_to_device(yscreenbounds[0]), this.plot_view.view_state.sy_to_device(yscreenbounds[1])];
      xscreenbounds = [_.min(xscreenbounds), _.max(xscreenbounds)];
      yscreenbounds = [_.min(yscreenbounds), _.max(yscreenbounds)];
      selected = [];
      for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        if (xscreenbounds) {
          if (this.sx[i] < xscreenbounds[0] || this.sx[i] > xscreenbounds[1]) {
            continue;
          }
        }
        if (yscreenbounds) {
          if (this.sy[i] < yscreenbounds[0] || this.sy[i] > yscreenbounds[1]) {
            continue;
          }
        }
        selected.push(i);
      }
      return selected;
    };

    CircleView.prototype.draw_legend = function(ctx, x1, x2, y1, y2) {
      var border, d, data_r, fill_props, glyph_props, glyph_settings, line_props, r, reference_point;

      glyph_props = this.glyph_props;
      line_props = glyph_props.line_properties;
      fill_props = glyph_props.fill_properties;
      ctx.save();
      reference_point = this.get_reference_point();
      if (reference_point != null) {
        glyph_settings = reference_point;
        data_r = this.distance([reference_point], 'x', 'radius', 'edge')[0];
      } else {
        glyph_settings = glyph_props;
        data_r = glyph_props.select('radius', glyph_props)["default"];
      }
      border = line_props.select(line_props.line_width_name, glyph_settings);
      ctx.beginPath();
      d = _.min([Math.abs(x2 - x1), Math.abs(y2 - y1)]);
      d = d - 2 * border;
      r = d / 2;
      if (data_r != null) {
        r = data_r > r ? r : data_r;
      }
      ctx.arc((x1 + x2) / 2.0, (y1 + y2) / 2.0, r, 2 * Math.PI, false);
      fill_props.set(ctx, glyph_settings);
      ctx.fill();
      line_props.set(ctx, glyph_settings);
      ctx.stroke();
      return ctx.restore();
    };

    return CircleView;

  })(GlyphView);

  Circle = (function(_super) {
    __extends(Circle, _super);

    function Circle() {
      _ref1 = Circle.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Circle.prototype.default_view = CircleView;

    Circle.prototype.type = 'GlyphRenderer';

    return Circle;

  })(Glyph);

  Circle.prototype.display_defaults = _.clone(Circle.prototype.display_defaults);

  _.extend(Circle.prototype.display_defaults, {
    fill: 'gray',
    fill_alpha: 1.0,
    line_color: 'red',
    line_width: 1,
    line_alpha: 1.0,
    line_join: 'miter',
    line_cap: 'butt',
    line_dash: [],
    line_dash_offset: 0
  });

  exports.Circle = Circle;

  exports.CircleView = CircleView;

}).call(this);
}, "renderers/glyph/text": function(exports, require, module) {(function() {
  var Glyph, GlyphView, Text, TextView, glyph, glyph_properties, properties, text_properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  text_properties = properties.text_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  TextView = (function(_super) {
    __extends(TextView, _super);

    function TextView() {
      _ref = TextView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    TextView.prototype.initialize = function(options) {
      var glyphspec;

      glyphspec = this.mget('glyphspec');
      this.glyph_props = new glyph_properties(this, glyphspec, ['x', 'y', 'angle', 'text:string'], [new text_properties(this, glyphspec)]);
      return TextView.__super__.initialize.call(this, options);
    };

    TextView.prototype._set_data = function(data) {
      var angle, angles, obj;

      this.data = data;
      this.x = this.glyph_props.v_select('x', data);
      this.y = this.glyph_props.v_select('y', data);
      angles = (function() {
        var _i, _len, _results;

        _results = [];
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          obj = data[_i];
          _results.push(this.glyph_props.select("angle", obj));
        }
        return _results;
      }).call(this);
      this.angle = (function() {
        var _i, _len, _results;

        _results = [];
        for (_i = 0, _len = angles.length; _i < _len; _i++) {
          angle = angles[_i];
          _results.push(-angle);
        }
        return _results;
      })();
      return this.text = this.glyph_props.v_select("text", data);
    };

    TextView.prototype._render = function() {
      var ctx, _ref1;

      _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
      ctx = this.plot_view.ctx;
      ctx.save();
      if (this.glyph_props.fast_path) {
        this._fast_path(ctx);
      } else {
        this._full_path(ctx);
      }
      return ctx.restore();
    };

    TextView.prototype._fast_path = function(ctx) {
      var i, _i, _ref1, _results;

      this.glyph_props.text_properties.set(ctx, this.glyph_props);
      _results = [];
      for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        if (isNaN(this.sx[i] + this.sy[i] + this.angle[i])) {
          continue;
        }
        if (angle[i]) {
          ctx.translate(this.sx[i], this.sy[i]);
          ctx.rotate(this.angle[i]);
          ctx.fillText(this.text[i], 0, 0);
          ctx.rotate(-this.angle[i]);
          _results.push(ctx.translate(-this.sx[i], -this.sy[i]));
        } else {
          _results.push(ctx.fillText(text[i], this.sx[i], this.sy[i]));
        }
      }
      return _results;
    };

    TextView.prototype._full_path = function(ctx) {
      var i, _i, _ref1, _results;

      _results = [];
      for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        if (isNaN(this.sx[i] + this.sy[i] + this.angle[i])) {
          continue;
        }
        ctx.translate(this.sx[i], this.sy[i]);
        ctx.rotate(this.angle[i]);
        this.glyph_props.text_properties.set(ctx, this.data[i]);
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

  })(GlyphView);

  Text = (function(_super) {
    __extends(Text, _super);

    function Text() {
      _ref1 = Text.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Text.prototype.default_view = TextView;

    Text.prototype.type = 'GlyphRenderer';

    return Text;

  })(Glyph);

  Text.prototype.display_defaults = _.clone(Text.prototype.display_defaults);

  _.extend(Text.prototype.display_defaults, {
    text_font: "helvetica",
    text_font_size: "12pt",
    text_font_style: "normal",
    text_color: "#444444",
    text_alpha: 1.0,
    text_align: "left",
    text_baseline: "bottom"
  });

  exports.Text = Text;

  exports.TextView = TextView;

}).call(this);
}, "renderers/glyph/quad": function(exports, require, module) {(function() {
  var Glyph, GlyphView, Quad, QuadView, fill_properties, glyph, glyph_properties, line_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  line_properties = properties.line_properties;

  fill_properties = properties.fill_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  QuadView = (function(_super) {
    __extends(QuadView, _super);

    function QuadView() {
      _ref = QuadView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    QuadView.prototype.initialize = function(options) {
      var glyphspec;

      glyphspec = this.mget('glyphspec');
      this.glyph_props = new glyph_properties(this, glyphspec, ['right', 'left', 'bottom', 'top'], [new fill_properties(this, glyphspec), new line_properties(this, glyphspec)]);
      this.do_fill = this.glyph_props.fill_properties.do_fill;
      this.do_stroke = this.glyph_props.line_properties.do_stroke;
      return QuadView.__super__.initialize.call(this, options);
    };

    QuadView.prototype._set_data = function(data) {
      var i, _i, _ref1, _results;

      this.data = data;
      this.left = this.glyph_props.v_select('left', data);
      this.top = this.glyph_props.v_select('top', data);
      this.right = this.glyph_props.v_select('right', data);
      this.bottom = this.glyph_props.v_select('bottom', data);
      this.mask = new Array(data.length - 1);
      _results = [];
      for (i = _i = 0, _ref1 = this.mask.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        _results.push(this.mask[i] = true);
      }
      return _results;
    };

    QuadView.prototype._render = function() {
      var ctx, i, oh, ow, _i, _ref1, _ref2, _ref3;

      _ref1 = this.plot_view.map_to_screen(this.left, this.glyph_props.left.units, this.top, this.glyph_props.top.units), this.sx0 = _ref1[0], this.sy0 = _ref1[1];
      _ref2 = this.plot_view.map_to_screen(this.right, this.glyph_props.right.units, this.bottom, this.glyph_props.bottom.units), this.sx1 = _ref2[0], this.sy1 = _ref2[1];
      ow = this.plot_view.view_state.get('outer_width');
      oh = this.plot_view.view_state.get('outer_height');
      for (i = _i = 0, _ref3 = this.mask.length - 1; 0 <= _ref3 ? _i <= _ref3 : _i >= _ref3; i = 0 <= _ref3 ? ++_i : --_i) {
        if ((this.sx0[i] < 0 && this.sx1[i] < 0) || (this.sx0[i] > ow && this.sx1[i] > ow) || (this.sy0[i] < 0 && this.sy1[i] < 0) || (this.sy0[i] > oh && this.sy1[i] > oh)) {
          this.mask[i] = false;
        } else {
          this.mask[i] = true;
        }
      }
      ctx = this.plot_view.ctx;
      ctx.save();
      if (this.glyph_props.fast_path) {
        this._fast_path(ctx);
      } else {
        this._full_path(ctx);
      }
      return ctx.restore();
    };

    QuadView.prototype._fast_path = function(ctx) {
      var i, _i, _j, _ref1, _ref2;

      if (this.do_fill) {
        this.glyph_props.fill_properties.set(ctx, this.glyph_props);
        ctx.beginPath();
        for (i = _i = 0, _ref1 = this.sx0.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (isNaN(this.sx0[i] + this.sy0[i] + this.sx1[i] + this.sy1[i]) || !this.mask[i]) {
            continue;
          }
          ctx.rect(this.sx0[i], this.sy0[i], this.sx1[i] - this.sx0[i], this.sy1[i] - this.sy0[i]);
        }
        ctx.fill();
      }
      if (this.do_stroke) {
        this.glyph_props.line_properties.set(ctx, this.glyph_props);
        ctx.beginPath();
        for (i = _j = 0, _ref2 = this.sx0.length - 1; 0 <= _ref2 ? _j <= _ref2 : _j >= _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
          if (isNaN(this.sx0[i] + this.sy0[i] + this.sx1[i] + this.sy1[i]) || !this.mask[i]) {
            continue;
          }
          ctx.rect(this.sx0[i], this.sy0[i], this.sx1[i] - this.sx0[i], this.sy1[i] - this.sy0[i]);
        }
        return ctx.stroke();
      }
    };

    QuadView.prototype._full_path = function(ctx) {
      var i, _i, _ref1, _results;

      _results = [];
      for (i = _i = 0, _ref1 = this.sx0.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        if (isNaN(this.sx0[i] + this.sy0[i] + this.sx1[i] + this.sy1[i]) || !this.mask[i]) {
          continue;
        }
        ctx.beginPath();
        ctx.rect(this.sx0[i], this.sy0[i], this.sx1[i] - this.sx0[i], this.sy1[i] - this.sy0[i]);
        if (this.do_fill) {
          this.glyph_props.fill_properties.set(ctx, this.data[i]);
          ctx.fill();
        }
        if (this.do_stroke) {
          this.glyph_props.line_properties.set(ctx, this.data[i]);
          _results.push(ctx.stroke());
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    QuadView.prototype.draw_legend = function(ctx, x1, x2, y1, y2) {
      var border, bottom, data_h, data_w, fill_props, glyph_props, glyph_settings, h, left, line_props, ratio, ratio1, ratio2, reference_point, right, sx0, sx1, sy0, sy1, top, w, x, y, _ref1, _ref2;

      glyph_props = this.glyph_props;
      line_props = glyph_props.line_properties;
      fill_props = glyph_props.fill_properties;
      ctx.save();
      reference_point = this.get_reference_point();
      if (reference_point != null) {
        glyph_settings = reference_point;
        left = this.glyph_props.select('left', glyph_settings);
        top = this.glyph_props.select('top', glyph_settings);
        right = this.glyph_props.select('right', glyph_settings);
        bottom = this.glyph_props.select('bottom', glyph_settings);
        _ref1 = this.plot_view.map_to_screen([left], this.glyph_props.left.units, [top], this.glyph_props.top.units), sx0 = _ref1[0], sy0 = _ref1[1];
        _ref2 = this.plot_view.map_to_screen([right], this.glyph_props.right.units, [bottom], this.glyph_props.bottom.units), sx1 = _ref2[0], sy1 = _ref2[1];
        data_w = sx1[0] - sx0[0];
        data_h = sy1[0] - sy0[0];
      } else {
        glyph_settings = glyph_props;
        data_w = 1;
        data_h = 1;
      }
      border = line_props.select(line_props.line_width_name, glyph_settings);
      data_w = data_w - 2 * border;
      data_h = data_h - 2 * border;
      w = Math.abs(x2 - x1);
      h = Math.abs(y2 - y1);
      ratio1 = w / data_w;
      ratio2 = h / data_h;
      ratio = _.min([ratio1, ratio2]);
      w = ratio * data_w;
      h = ratio * data_h;
      x = (x1 + x2) / 2 - (w / 2);
      y = (y1 + y2) / 2 - (h / 2);
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      fill_props.set(ctx, glyph_settings);
      ctx.fill();
      line_props.set(ctx, glyph_settings);
      ctx.stroke();
      return ctx.restore();
    };

    return QuadView;

  })(GlyphView);

  Quad = (function(_super) {
    __extends(Quad, _super);

    function Quad() {
      _ref1 = Quad.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Quad.prototype.default_view = QuadView;

    Quad.prototype.type = 'GlyphRenderer';

    return Quad;

  })(Glyph);

  Quad.prototype.display_defaults = _.clone(Quad.prototype.display_defaults);

  _.extend(Quad.prototype.display_defaults, {
    fill: 'gray',
    fill_alpha: 1.0,
    line_color: 'red',
    line_width: 1,
    line_alpha: 1.0,
    line_join: 'miter',
    line_cap: 'butt',
    line_dash: [],
    line_dash_offset: 0
  });

  exports.Quad = Quad;

  exports.QuadView = QuadView;

}).call(this);
}, "renderers/glyph/image_uri": function(exports, require, module) {(function() {
  var Glyph, GlyphView, ImageURIGlyph, ImageURIView, glyph, glyph_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  ImageURIView = (function(_super) {
    __extends(ImageURIView, _super);

    function ImageURIView() {
      _ref = ImageURIView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ImageURIView.prototype.initialize = function(options) {
      var glyphspec;

      glyphspec = this.mget('glyphspec');
      this.glyph_props = new glyph_properties(this, glyphspec, ['url:string', 'x', 'y', 'angle'], []);
      return ImageURIView.__super__.initialize.call(this, options);
    };

    ImageURIView.prototype._set_data = function(data) {
      var img, obj;

      this.data = data;
      this.x = this.glyph_props.v_select('x', data);
      this.y = this.glyph_props.v_select('y', data);
      this.url = (function() {
        var _i, _len, _results;

        _results = [];
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          obj = data[_i];
          _results.push(this.glyph_props.select('url', obj));
        }
        return _results;
      }).call(this);
      this.angle = (function() {
        var _i, _len, _results;

        _results = [];
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          obj = data[_i];
          _results.push(this.glyph_props.select('angle', obj));
        }
        return _results;
      }).call(this);
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

    ImageURIView.prototype._render = function() {
      var ctx, i, img, vs, _i, _ref1, _ref2,
        _this = this;

      _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
      ctx = this.plot_view.ctx;
      vs = this.plot_view.view_state;
      ctx.save();
      for (i = _i = 0, _ref2 = this.sx.length - 1; 0 <= _ref2 ? _i <= _ref2 : _i >= _ref2; i = 0 <= _ref2 ? ++_i : --_i) {
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

  })(GlyphView);

  ImageURIGlyph = (function(_super) {
    __extends(ImageURIGlyph, _super);

    function ImageURIGlyph() {
      _ref1 = ImageURIGlyph.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    ImageURIGlyph.prototype.default_view = ImageURIView;

    ImageURIGlyph.prototype.type = 'GlyphRenderer';

    return ImageURIGlyph;

  })(Glyph);

  ImageURIGlyph.prototype.display_defaults = _.clone(ImageURIGlyph.prototype.display_defaults);

  _.extend(ImageURIGlyph.prototype.display_defaults, {
    level: 'underlay'
  });

  exports.ImageURI = ImageURIGlyph;

  exports.ImageURIView = ImageURIView;

}).call(this);
}, "renderers/glyph/bezier": function(exports, require, module) {(function() {
  var Bezier, BezierView, Glyph, GlyphView, glyph, glyph_properties, line_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  line_properties = properties.line_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  BezierView = (function(_super) {
    __extends(BezierView, _super);

    function BezierView() {
      _ref = BezierView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    BezierView.prototype.initialize = function(options) {
      var glyphspec;

      glyphspec = this.mget('glyphspec');
      this.glyph_props = new glyph_properties(this, glyphspec, ['x0', 'y0', 'x1', 'y1', 'cx0', 'cy0', 'cx1', 'cy1'], [new line_properties(this, glyphspec)]);
      this.do_stroke = this.glyph_props.line_properties.do_stroke;
      return BezierView.__super__.initialize.call(this, options);
    };

    BezierView.prototype._set_data = function(data) {
      this.data = data;
      this.x0 = this.glyph_props.v_select('x0', data);
      this.y0 = this.glyph_props.v_select('y0', data);
      this.x1 = this.glyph_props.v_select('x1', data);
      this.y1 = this.glyph_props.v_select('y1', data);
      this.cx0 = this.glyph_props.v_select('cx0', data);
      this.cy0 = this.glyph_props.v_select('cy0', data);
      this.cx1 = this.glyph_props.v_select('cx1', data);
      return this.cy1 = this.glyph_props.v_select('cy1', data);
    };

    BezierView.prototype._render = function() {
      var ctx, _ref1, _ref2, _ref3, _ref4;

      _ref1 = this.plot_view.map_to_screen(this.x0, this.glyph_props.x0.units, this.y0, this.glyph_props.y0.units), this.sx0 = _ref1[0], this.sy0 = _ref1[1];
      _ref2 = this.plot_view.map_to_screen(this.x1, this.glyph_props.x1.units, this.y1, this.glyph_props.y1.units), this.sx1 = _ref2[0], this.sy1 = _ref2[1];
      _ref3 = this.plot_view.map_to_screen(this.cx0, this.glyph_props.cx0.units, this.cy0, this.glyph_props.cy0.units), this.scx0 = _ref3[0], this.scy0 = _ref3[1];
      _ref4 = this.plot_view.map_to_screen(this.cx1, this.glyph_props.cx1.units, this.cy1, this.glyph_props.cy1.units), this.scx1 = _ref4[0], this.scy1 = _ref4[1];
      ctx = this.plot_view.ctx;
      ctx.save();
      if (this.glyph_props.fast_path) {
        this._fast_path(ctx);
      } else {
        this._full_path(ctx);
      }
      return ctx.restore();
    };

    BezierView.prototype._fast_path = function(ctx) {
      var i, _i, _ref1;

      if (this.do_stroke) {
        this.glyph_props.line_properties.set(ctx, this.glyph_props);
        ctx.beginPath();
        for (i = _i = 0, _ref1 = this.sx0.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (isNaN(this.sx0[i] + this.sy0[i] + this.sx1[i] + this.sy1[i] + this.scx0[i] + this.scy0[i] + this.scx1[i] + this.scy1[i])) {
            continue;
          }
          ctx.moveTo(this.sx0[i], this.sy0[i]);
          ctx.bezierCurveTo(this.scx0[i], this.scy0[i], this.scx1[i], this.scy1[i], this.sx1[i], this.sy1[i]);
        }
        return ctx.stroke();
      }
    };

    BezierView.prototype._full_path = function(ctx) {
      var i, _i, _ref1, _results;

      if (this.do_stroke) {
        _results = [];
        for (i = _i = 0, _ref1 = this.sx0.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (isNaN(this.sx0[i] + this.sy0[i] + this.sx1[i] + this.sy1[i] + this.scx0[i] + this.scy0[i] + this.scx1[i] + this.scy1[i])) {
            continue;
          }
          ctx.beginPath();
          ctx.moveTo(this.sx0[i], this.sy0[i]);
          ctx.bezierCurveTo(this.scx0[i], this.scy0[i], this.scx1[i], this.scy1[i], this.sx1[i], this.sy1[i]);
          this.glyph_props.line_properties.set(ctx, this.data[i]);
          _results.push(ctx.stroke());
        }
        return _results;
      }
    };

    return BezierView;

  })(GlyphView);

  Bezier = (function(_super) {
    __extends(Bezier, _super);

    function Bezier() {
      _ref1 = Bezier.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Bezier.prototype.default_view = BezierView;

    Bezier.prototype.type = 'GlyphRenderer';

    return Bezier;

  })(Glyph);

  Bezier.prototype.display_defaults = _.clone(Bezier.prototype.display_defaults);

  _.extend(Bezier.prototype.display_defaults, {
    line_color: 'red',
    line_width: 1,
    line_alpha: 1.0,
    line_join: 'miter',
    line_cap: 'butt',
    line_dash: [],
    line_dash_offset: 0
  });

  exports.Bezier = Bezier;

  exports.BezierView = BezierView;

}).call(this);
}, "renderers/glyph/annular_wedge": function(exports, require, module) {(function() {
  var AnnularWedge, AnnularWedgeView, Glyph, GlyphView, fill_properties, glyph, glyph_properties, line_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  line_properties = properties.line_properties;

  fill_properties = properties.fill_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  AnnularWedgeView = (function(_super) {
    __extends(AnnularWedgeView, _super);

    function AnnularWedgeView() {
      _ref = AnnularWedgeView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    AnnularWedgeView.prototype.initialize = function(options) {
      var spec;

      this.glyph_props = this.init_glyph(this.mget('glyphspec'));
      if (this.mget('selection_glyphspec')) {
        spec = _.extend({}, this.mget('glyphspec'), this.mget('selection_glyphspec'));
        this.selection_glyphprops = this.init_glyph(spec);
      }
      if (this.mget('nonselection_glyphspec')) {
        spec = _.extend({}, this.mget('glyphspec'), this.mget('nonselection_glyphspec'));
        this.nonselection_glyphprops = this.init_glyph(spec);
      }
      this.do_fill = this.glyph_props.fill_properties.do_fill;
      this.do_stroke = this.glyph_props.line_properties.do_stroke;
      return AnnularWedgeView.__super__.initialize.call(this, options);
    };

    AnnularWedgeView.prototype.init_glyph = function(glyphspec) {
      var glyph_props;

      glyph_props = new glyph_properties(this, glyphspec, ['x', 'y', 'inner_radius', 'outer_radius', 'start_angle', 'end_angle', 'direction:string'], [new fill_properties(this, glyphspec), new line_properties(this, glyphspec)]);
      return glyph_props;
    };

    AnnularWedgeView.prototype._set_data = function(data) {
      var angle, dir, end_angle, i, obj, start_angle, _i, _j, _k, _ref1, _ref2, _ref3, _results;

      this.data = data;
      this.x = this.glyph_props.v_select('x', data);
      this.y = this.glyph_props.v_select('y', data);
      start_angle = (function() {
        var _i, _len, _results;

        _results = [];
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          obj = data[_i];
          _results.push(this.glyph_props.select('start_angle', obj));
        }
        return _results;
      }).call(this);
      this.start_angle = (function() {
        var _i, _len, _results;

        _results = [];
        for (_i = 0, _len = start_angle.length; _i < _len; _i++) {
          angle = start_angle[_i];
          _results.push(-angle);
        }
        return _results;
      })();
      end_angle = (function() {
        var _i, _len, _results;

        _results = [];
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          obj = data[_i];
          _results.push(this.glyph_props.select('end_angle', obj));
        }
        return _results;
      }).call(this);
      this.end_angle = (function() {
        var _i, _len, _results;

        _results = [];
        for (_i = 0, _len = end_angle.length; _i < _len; _i++) {
          angle = end_angle[_i];
          _results.push(-angle);
        }
        return _results;
      })();
      this.angle = new Array(this.start_angle.length);
      for (i = _i = 0, _ref1 = this.start_angle.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        this.angle[i] = this.end_angle[i] - this.start_angle[i];
      }
      this.direction = new Array(this.data.length);
      for (i = _j = 0, _ref2 = this.data.length - 1; 0 <= _ref2 ? _j <= _ref2 : _j >= _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
        dir = this.glyph_props.select('direction', data[i]);
        if (dir === 'clock') {
          this.direction[i] = false;
        } else if (dir === 'anticlock') {
          this.direction[i] = true;
        } else {
          this.direction[i] = NaN;
        }
      }
      this.selected_mask = new Array(data.length - 1);
      _results = [];
      for (i = _k = 0, _ref3 = this.selected_mask.length - 1; 0 <= _ref3 ? _k <= _ref3 : _k >= _ref3; i = 0 <= _ref3 ? ++_k : --_k) {
        _results.push(this.selected_mask[i] = false);
      }
      return _results;
    };

    AnnularWedgeView.prototype._render = function() {
      var ctx, idx, props, selected, _i, _len, _ref1;

      _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
      this.inner_radius = this.distance(this.data, 'x', 'inner_radius', 'edge');
      this.outer_radius = this.distance(this.data, 'x', 'outer_radius', 'edge');
      ctx = this.plot_view.ctx;
      ctx.save();
      selected = this.mget_obj('data_source').get('selected');
      for (_i = 0, _len = selected.length; _i < _len; _i++) {
        idx = selected[_i];
        this.selected_mask[idx] = true;
      }
      if (this.glyph_props.fast_path) {
        this._fast_path(ctx);
      } else {
        if (selected && selected.length && this.nonselection_glyphprops) {
          if (this.selection_glyphprops) {
            props = this.selection_glyphprops;
          } else {
            props = this.glyph_props;
          }
          this._full_path(ctx, props, 'selected');
          this._full_path(ctx, this.nonselection_glyphprops, 'unselected');
        } else {
          this._full_path(ctx);
        }
      }
      return ctx.restore();
    };

    AnnularWedgeView.prototype._fast_path = function(ctx) {
      var i, _i, _j, _ref1, _ref2;

      if (this.do_fill) {
        this.glyph_props.fill_properties.set(ctx, this.glyph_props);
        for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (isNaN(this.sx[i] + this.sy[i] + this.inner_radius[i] + this.outer_radius[i] + this.start_angle[i] + this.end_angle[i])) {
            continue;
          }
          ctx.translate(this.sx[i], this.sy[i]);
          ctx.rotate(this.start_angle[i]);
          ctx.moveTo(this.outer_radius[i], 0);
          ctx.beginPath();
          ctx.arc(0, 0, this.outer_radius[i], 0, this.angle[i], this.direction[i]);
          ctx.rotate(this.angle[i]);
          ctx.lineTo(this.inner_radius[i], 0);
          ctx.arc(0, 0, this.inner_radius[i], 0, -this.angle[i], !this.direction[i]);
          ctx.closePath();
          ctx.fill();
          ctx.rotate(-this.angle[i] - this.start_angle[i]);
          ctx.translate(-this.sx[i], -this.sy[i]);
        }
      }
      if (this.do_stroke) {
        this.glyph_props.line_properties.set(ctx, this.glyph_props);
        ctx.beginPath();
        for (i = _j = 0, _ref2 = this.sx.length - 1; 0 <= _ref2 ? _j <= _ref2 : _j >= _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
          if (isNaN(this.sx[i] + this.sy[i] + this.inner_radius[i] + this.outer_radius[i] + this.start_angle[i] + this.end_angle[i])) {
            continue;
          }
          ctx.translate(this.sx[i], this.sy[i]);
          ctx.rotate(this.start_angle[i]);
          ctx.moveTo(this.outer_radius[i], 0);
          ctx.arc(0, 0, this.outer_radius[i], 0, this.angle[i], this.direction[i]);
          ctx.rotate(this.angle[i]);
          ctx.lineTo(this.inner_radius[i], 0);
          ctx.arc(0, 0, this.inner_radius[i], 0, -this.angle[i], !this.direction[i]);
          ctx.closePath();
          ctx.rotate(-this.angle[i] - this.start_angle[i]);
          ctx.translate(-this.sx[i], -this.sy[i]);
        }
        return ctx.stroke();
      }
    };

    AnnularWedgeView.prototype._full_path = function(ctx, glyph_props, use_selection) {
      var i, _i, _ref1, _results;

      if (!glyph_props) {
        glyph_props = this.glyph_props;
      }
      _results = [];
      for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        if (isNaN(this.sx[i] + this.sy[i] + this.inner_radius[i] + this.outer_radius[i] + this.start_angle[i] + this.end_angle[i])) {
          continue;
        }
        if (use_selection === 'selected' && !this.selected_mask[i]) {
          continue;
        }
        if (use_selection === 'unselected' && this.selected_mask[i]) {
          continue;
        }
        ctx.translate(this.sx[i], this.sy[i]);
        ctx.rotate(this.start_angle[i]);
        ctx.moveTo(this.outer_radius[i], 0);
        ctx.beginPath();
        ctx.arc(0, 0, this.outer_radius[i], 0, this.angle[i], this.direction[i]);
        ctx.rotate(this.angle[i]);
        ctx.lineTo(this.inner_radius[i], 0);
        ctx.arc(0, 0, this.inner_radius[i], 0, -this.angle[i], !this.direction[i]);
        ctx.closePath();
        ctx.rotate(-this.angle[i] - this.start_angle[i]);
        ctx.translate(-this.sx[i], -this.sy[i]);
        if (this.do_fill) {
          glyph_props.fill_properties.set(ctx, this.data[i]);
          ctx.fill();
        }
        if (this.do_stroke) {
          glyph_props.line_properties.set(ctx, this.data[i]);
          _results.push(ctx.stroke());
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    AnnularWedgeView.prototype.draw_legend = function(ctx, x1, x2, y1, y2) {
      var angle, border, d, direction, end_angle, fill_props, glyph_props, glyph_settings, inner_radius, line_props, outer_radius, r, ratio, reference_point, start_angle, sx, sy;

      glyph_props = this.glyph_props;
      line_props = glyph_props.line_properties;
      fill_props = glyph_props.fill_properties;
      ctx.save();
      reference_point = this.get_reference_point();
      if (reference_point != null) {
        glyph_settings = reference_point;
        outer_radius = this.distance([reference_point], 'x', 'outer_radius', 'edge');
        outer_radius = outer_radius[0];
        inner_radius = this.distance([reference_point], 'x', 'inner_radius', 'edge');
        inner_radius = inner_radius[0];
        start_angle = -this.glyph_props.select('start_angle', reference_point);
        end_angle = -this.glyph_props.select('end_angle', reference_point);
      } else {
        glyph_settings = glyph_props;
        start_angle = -0.1;
        end_angle = -3.9;
      }
      angle = end_angle - start_angle;
      direction = this.glyph_props.select('direction', glyph_settings);
      direction = direction === "clock" ? false : true;
      border = line_props.select(line_props.line_width_name, glyph_settings);
      d = _.min([Math.abs(x2 - x1), Math.abs(y2 - y1)]);
      d = d - 2 * border;
      r = d / 2;
      if ((outer_radius != null) || (inner_radius != null)) {
        ratio = r / outer_radius;
        outer_radius = r;
        inner_radius = inner_radius * ratio;
      } else {
        outer_radius = r;
        inner_radius = r / 2;
      }
      sx = (x1 + x2) / 2.0;
      sy = (y1 + y2) / 2.0;
      ctx.translate(sx, sy);
      ctx.rotate(start_angle);
      ctx.moveTo(outer_radius, 0);
      ctx.beginPath();
      ctx.arc(0, 0, outer_radius, 0, angle, direction);
      ctx.rotate(angle);
      ctx.lineTo(inner_radius, 0);
      ctx.arc(0, 0, inner_radius, 0, -angle, !direction);
      ctx.closePath();
      fill_props.set(ctx, glyph_settings);
      ctx.fill();
      line_props.set(ctx, glyph_settings);
      ctx.stroke();
      return ctx.restore();
    };

    AnnularWedgeView.prototype.select = function(xscreenbounds, yscreenbounds) {
      var i, selected, _i, _ref1;

      xscreenbounds = [this.plot_view.view_state.sx_to_device(xscreenbounds[0]), this.plot_view.view_state.sx_to_device(xscreenbounds[1])];
      yscreenbounds = [this.plot_view.view_state.sy_to_device(yscreenbounds[0]), this.plot_view.view_state.sy_to_device(yscreenbounds[1])];
      xscreenbounds = [_.min(xscreenbounds), _.max(xscreenbounds)];
      yscreenbounds = [_.min(yscreenbounds), _.max(yscreenbounds)];
      selected = [];
      for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        if (xscreenbounds) {
          if (this.sx[i] < xscreenbounds[0] || this.sx[i] > xscreenbounds[1]) {
            continue;
          }
        }
        if (yscreenbounds) {
          if (this.sy[i] < yscreenbounds[0] || this.sy[i] > yscreenbounds[1]) {
            continue;
          }
        }
        selected.push(i);
      }
      return selected;
    };

    return AnnularWedgeView;

  })(GlyphView);

  AnnularWedge = (function(_super) {
    __extends(AnnularWedge, _super);

    function AnnularWedge() {
      _ref1 = AnnularWedge.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    AnnularWedge.prototype.default_view = AnnularWedgeView;

    AnnularWedge.prototype.type = 'GlyphRenderer';

    return AnnularWedge;

  })(Glyph);

  AnnularWedge.prototype.display_defaults = _.clone(AnnularWedge.prototype.display_defaults);

  _.extend(AnnularWedge.prototype.display_defaults, {
    direction: 'anticlock',
    fill: 'gray',
    fill_alpha: 1.0,
    line_color: 'red',
    line_width: 1,
    line_alpha: 1.0,
    line_join: 'miter',
    line_cap: 'butt',
    line_dash: [],
    line_dash_offset: 0
  });

  exports.AnnularWedge = AnnularWedge;

  exports.AnnularWedgeView = AnnularWedgeView;

}).call(this);
}, "renderers/glyph/patches": function(exports, require, module) {(function() {
  var Glyph, GlyphView, Patches, PatchesView, fill_properties, glyph, glyph_properties, line_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  line_properties = properties.line_properties;

  fill_properties = properties.fill_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  PatchesView = (function(_super) {
    __extends(PatchesView, _super);

    function PatchesView() {
      _ref = PatchesView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    PatchesView.prototype.initialize = function(options) {
      var glyphspec;

      glyphspec = this.mget('glyphspec');
      this.glyph_props = new glyph_properties(this, glyphspec, ['xs:array', 'ys:array'], [new fill_properties(this, glyphspec), new line_properties(this, glyphspec)]);
      this.do_fill = this.glyph_props.fill_properties.do_fill;
      this.do_stroke = this.glyph_props.line_properties.do_stroke;
      return PatchesView.__super__.initialize.call(this, options);
    };

    PatchesView.prototype._set_data = function(data) {
      this.data = data;
    };

    PatchesView.prototype._render = function() {
      var ctx, i, pt, sx, sy, x, y, _i, _j, _k, _len, _ref1, _ref2, _ref3, _ref4;

      ctx = this.plot_view.ctx;
      ctx.save();
      _ref1 = this.data;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        pt = _ref1[_i];
        x = this.glyph_props.select('xs', pt);
        y = this.glyph_props.select('ys', pt);
        _ref2 = this.plot_view.map_to_screen(x, this.glyph_props.xs.units, y, this.glyph_props.ys.units), sx = _ref2[0], sy = _ref2[1];
        if (this.do_fill) {
          this.glyph_props.fill_properties.set(ctx, pt);
          for (i = _j = 0, _ref3 = sx.length - 1; 0 <= _ref3 ? _j <= _ref3 : _j >= _ref3; i = 0 <= _ref3 ? ++_j : --_j) {
            if (i === 0) {
              ctx.beginPath();
              ctx.moveTo(sx[i], sy[i]);
              continue;
            } else if (isNaN(sx[i] + sy[i])) {
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              continue;
            } else {
              ctx.lineTo(sx[i], sy[i]);
            }
          }
          ctx.closePath();
          ctx.fill();
        }
        if (this.do_stroke) {
          this.glyph_props.line_properties.set(ctx, pt);
          for (i = _k = 0, _ref4 = sx.length - 1; 0 <= _ref4 ? _k <= _ref4 : _k >= _ref4; i = 0 <= _ref4 ? ++_k : --_k) {
            if (i === 0) {
              ctx.beginPath();
              ctx.moveTo(sx[i], sy[i]);
              continue;
            } else if (isNaN(sx[i] + sy[i])) {
              ctx.closePath();
              ctx.stroke();
              ctx.beginPath();
              continue;
            } else {
              ctx.lineTo(sx[i], sy[i]);
            }
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
      return ctx.restore();
    };

    return PatchesView;

  })(GlyphView);

  Patches = (function(_super) {
    __extends(Patches, _super);

    function Patches() {
      _ref1 = Patches.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Patches.prototype.default_view = PatchesView;

    Patches.prototype.type = 'GlyphRenderer';

    return Patches;

  })(Glyph);

  Patches.prototype.display_defaults = _.clone(Patches.prototype.display_defaults);

  _.extend(Patches.prototype.display_defaults, {
    fill: 'gray',
    fill_alpha: 1.0,
    line_color: 'red',
    line_width: 1,
    line_alpha: 1.0,
    line_join: 'miter',
    line_cap: 'butt',
    line_dash: [],
    line_dash_offset: 0
  });

  exports.Patches = Patches;

  exports.PatchesView = PatchesView;

}).call(this);
}, "renderers/glyph/patch": function(exports, require, module) {(function() {
  var Glyph, GlyphView, Patch, PatchView, fill_properties, glyph, glyph_properties, line_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  line_properties = properties.line_properties;

  fill_properties = properties.fill_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  PatchView = (function(_super) {
    __extends(PatchView, _super);

    function PatchView() {
      _ref = PatchView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    PatchView.prototype.initialize = function(options) {
      var glyphspec;

      glyphspec = this.mget('glyphspec');
      this.glyph_props = new glyph_properties(this, glyphspec, ['x:number', 'y:number'], [new fill_properties(this, glyphspec), new line_properties(this, glyphspec)]);
      this.do_fill = this.glyph_props.fill_properties.do_fill;
      this.do_stroke = this.glyph_props.line_properties.do_stroke;
      return PatchView.__super__.initialize.call(this, options);
    };

    PatchView.prototype._set_data = function(data) {
      this.data = data;
      this.x = this.glyph_props.v_select('x', data);
      return this.y = this.glyph_props.v_select('y', data);
    };

    PatchView.prototype._render = function() {
      var ctx, i, sx, sy, _i, _j, _ref1, _ref2, _ref3;

      ctx = this.plot_view.ctx;
      ctx.save();
      _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), sx = _ref1[0], sy = _ref1[1];
      if (this.do_fill) {
        this.glyph_props.fill_properties.set(ctx, this.glyph_props);
        for (i = _i = 0, _ref2 = sx.length - 1; 0 <= _ref2 ? _i <= _ref2 : _i >= _ref2; i = 0 <= _ref2 ? ++_i : --_i) {
          if (i === 0) {
            ctx.beginPath();
            ctx.moveTo(sx[i], sy[i]);
            continue;
          } else if (isNaN(sx[i] + sy[i])) {
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            continue;
          } else {
            ctx.lineTo(sx[i], sy[i]);
          }
        }
        ctx.closePath();
        ctx.fill();
      }
      if (this.do_stroke) {
        this.glyph_props.line_properties.set(ctx, this.glyph_props);
        for (i = _j = 0, _ref3 = sx.length - 1; 0 <= _ref3 ? _j <= _ref3 : _j >= _ref3; i = 0 <= _ref3 ? ++_j : --_j) {
          if (i === 0) {
            ctx.beginPath();
            ctx.moveTo(sx[i], sy[i]);
            continue;
          } else if (isNaN(sx[i] + sy[i])) {
            ctx.closePath();
            ctx.stroke();
            ctx.beginPath();
            continue;
          } else {
            ctx.lineTo(sx[i], sy[i]);
          }
        }
        ctx.closePath();
        ctx.stroke();
      }
      return ctx.restore();
    };

    return PatchView;

  })(GlyphView);

  Patch = (function(_super) {
    __extends(Patch, _super);

    function Patch() {
      _ref1 = Patch.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Patch.prototype.default_view = PatchView;

    Patch.prototype.type = 'GlyphRenderer';

    return Patch;

  })(Glyph);

  Patch.prototype.display_defaults = _.clone(Patch.prototype.display_defaults);

  _.extend(Patch.prototype.display_defaults, {
    fill: 'gray',
    fill_alpha: 1.0,
    line_color: 'red',
    line_width: 1,
    line_alpha: 1.0,
    line_join: 'miter',
    line_cap: 'butt',
    line_dash: [],
    line_dash_offset: 0
  });

  exports.Patch = Patch;

  exports.PatchView = PatchView;

}).call(this);
}, "renderers/glyph/wedge": function(exports, require, module) {(function() {
  var Glyph, GlyphView, Wedge, WedgeView, fill_properties, glyph, glyph_properties, line_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  line_properties = properties.line_properties;

  fill_properties = properties.fill_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  WedgeView = (function(_super) {
    __extends(WedgeView, _super);

    function WedgeView() {
      _ref = WedgeView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    WedgeView.prototype.initialize = function(options) {
      var glyphspec;

      glyphspec = this.mget('glyphspec');
      this.glyph_props = new glyph_properties(this, glyphspec, ['x', 'y', 'radius', 'start_angle', 'end_angle', 'direction:string'], [new fill_properties(this, glyphspec), new line_properties(this, glyphspec)]);
      this.do_fill = this.glyph_props.fill_properties.do_fill;
      this.do_stroke = this.glyph_props.line_properties.do_stroke;
      return WedgeView.__super__.initialize.call(this, options);
    };

    WedgeView.prototype._set_data = function(data) {
      var angle, dir, end_angle, i, obj, start_angle, _i, _ref1, _results;

      this.data = data;
      this.x = this.glyph_props.v_select('x', data);
      this.y = this.glyph_props.v_select('y', data);
      start_angle = (function() {
        var _i, _len, _results;

        _results = [];
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          obj = data[_i];
          _results.push(this.glyph_props.select('start_angle', obj));
        }
        return _results;
      }).call(this);
      this.start_angle = (function() {
        var _i, _len, _results;

        _results = [];
        for (_i = 0, _len = start_angle.length; _i < _len; _i++) {
          angle = start_angle[_i];
          _results.push(-angle);
        }
        return _results;
      })();
      end_angle = (function() {
        var _i, _len, _results;

        _results = [];
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          obj = data[_i];
          _results.push(this.glyph_props.select('end_angle', obj));
        }
        return _results;
      }).call(this);
      this.end_angle = (function() {
        var _i, _len, _results;

        _results = [];
        for (_i = 0, _len = end_angle.length; _i < _len; _i++) {
          angle = end_angle[_i];
          _results.push(-angle);
        }
        return _results;
      })();
      this.direction = new Array(this.data.length);
      _results = [];
      for (i = _i = 0, _ref1 = this.data.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        dir = this.glyph_props.select('direction', data[i]);
        if (dir === 'clock') {
          _results.push(this.direction[i] = false);
        } else if (dir === 'anticlock') {
          _results.push(this.direction[i] = true);
        } else {
          _results.push(this.direction[i] = NaN);
        }
      }
      return _results;
    };

    WedgeView.prototype._render = function() {
      var ctx, _ref1;

      _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
      this.radius = this.distance(this.data, 'x', 'radius', 'edge');
      ctx = this.plot_view.ctx;
      ctx.save();
      if (this.glyph_props.fast_path) {
        this._fast_path(ctx);
      } else {
        this._full_path(ctx);
      }
      return ctx.restore();
    };

    WedgeView.prototype._fast_path = function(ctx) {
      var i, _i, _j, _ref1, _ref2, _results;

      if (this.do_fill) {
        this.glyph_props.fill_properties.set(ctx, this.glyph_props);
        for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (isNaN(this.sx[i] + this.sy[i] + this.radius[i] + this.start_angle[i] + this.end_angle[i] + this.direction[i])) {
            continue;
          }
          ctx.beginPath();
          ctx.arc(this.sx[i], this.sy[i], this.radius[i], this.start_angle[i], this.end_angle[i], this.direction[i]);
          ctx.lineTo(this.sx[i], this.sy[i]);
          ctx.closePath();
          ctx.fill();
        }
      }
      if (this.do_stroke) {
        this.glyph_props.line_properties.set(ctx, this.glyph_props);
        _results = [];
        for (i = _j = 0, _ref2 = this.sx.length - 1; 0 <= _ref2 ? _j <= _ref2 : _j >= _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
          if (isNaN(this.sx[i] + this.sy[i] + this.radius[i] + this.start_angle[i] + this.end_angle[i] + this.direction[i])) {
            continue;
          }
          ctx.beginPath();
          ctx.arc(this.sx[i], this.sy[i], this.radius[i], this.start_angle[i], this.end_angle[i], this.direction[i]);
          ctx.lineTo(this.sx[i], this.sy[i]);
          ctx.closePath();
          _results.push(ctx.stroke());
        }
        return _results;
      }
    };

    WedgeView.prototype._full_path = function(ctx) {
      var i, _i, _ref1, _results;

      _results = [];
      for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        if (isNaN(this.sx[i] + this.sy[i] + this.radius[i] + this.start_angle[i] + this.end_angle[i] + this.direction[i])) {
          continue;
        }
        ctx.beginPath();
        ctx.arc(this.sx[i], this.sy[i], this.radius[i], this.start_angle[i], this.end_angle[i], this.direction[i]);
        ctx.lineTo(this.sx[i], this.sy[i]);
        ctx.closePath();
        if (this.do_fill) {
          this.glyph_props.fill_properties.set(ctx, this.data[i]);
          ctx.fill();
        }
        if (this.do_stroke) {
          this.glyph_props.line_properties.set(ctx, this.data[i]);
          _results.push(ctx.stroke());
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    WedgeView.prototype.draw_legend = function(ctx, x1, x2, y1, y2) {
      var angle, border, d, data_r, direction, end_angle, fill_props, glyph_props, glyph_settings, line_props, r, reference_point, start_angle, sx, sy;

      glyph_props = this.glyph_props;
      line_props = glyph_props.line_properties;
      fill_props = glyph_props.fill_properties;
      ctx.save();
      reference_point = this.get_reference_point();
      if (reference_point != null) {
        glyph_settings = reference_point;
        data_r = this.distance([reference_point], 'x', 'radius', 'edge')[0];
        start_angle = -this.glyph_props.select('start_angle', reference_point);
        end_angle = -this.glyph_props.select('end_angle', reference_point);
      } else {
        glyph_settings = glyph_props;
        start_angle = -0.1;
        end_angle = -3.9;
      }
      angle = end_angle - start_angle;
      direction = this.glyph_props.select('direction', glyph_settings);
      direction = direction === "clock" ? false : true;
      border = line_props.select(line_props.line_width_name, glyph_settings);
      d = _.min([Math.abs(x2 - x1), Math.abs(y2 - y1)]);
      d = d - 2 * border;
      r = d / 2;
      if (data_r != null) {
        r = data_r > r ? r : data_r;
      }
      ctx.beginPath();
      sx = (x1 + x2) / 2.0;
      sy = (y1 + y2) / 2.0;
      ctx.arc(sx, sy, r, start_angle, end_angle, direction);
      ctx.lineTo(sx, sy);
      ctx.closePath();
      fill_props.set(ctx, glyph_settings);
      ctx.fill();
      line_props.set(ctx, glyph_settings);
      ctx.stroke();
      return ctx.restore();
    };

    return WedgeView;

  })(GlyphView);

  Wedge = (function(_super) {
    __extends(Wedge, _super);

    function Wedge() {
      _ref1 = Wedge.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Wedge.prototype.default_view = WedgeView;

    Wedge.prototype.type = 'GlyphRenderer';

    return Wedge;

  })(Glyph);

  Wedge.prototype.display_defaults = _.clone(Wedge.prototype.display_defaults);

  _.extend(Wedge.prototype.display_defaults, {
    direction: 'anticlock',
    fill: 'gray',
    fill_alpha: 1.0,
    line_color: 'red',
    line_width: 1,
    line_alpha: 1.0,
    line_join: 'miter',
    line_cap: 'butt',
    line_dash: [],
    line_dash_offset: 0
  });

  exports.Wedge = Wedge;

  exports.WedgeView = WedgeView;

}).call(this);
}, "renderers/glyph/quadcurve": function(exports, require, module) {(function() {
  var Glyph, GlyphView, Quadcurve, QuadcurveView, glyph, glyph_properties, line_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  line_properties = properties.line_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  QuadcurveView = (function(_super) {
    __extends(QuadcurveView, _super);

    function QuadcurveView() {
      _ref = QuadcurveView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    QuadcurveView.prototype.initialize = function(options) {
      var glyphspec;

      glyphspec = this.mget('glyphspec');
      this.glyph_props = new glyph_properties(this, glyphspec, ['x0', 'y0', 'x1', 'y1', 'cx', 'cy'], [new line_properties(this, glyphspec)]);
      this.do_stroke = this.glyph_props.line_properties.do_stroke;
      return QuadcurveView.__super__.initialize.call(this, options);
    };

    QuadcurveView.prototype._set_data = function(data) {
      this.data = data;
      this.x0 = this.glyph_props.v_select('x0', data);
      this.y0 = this.glyph_props.v_select('y0', data);
      this.x1 = this.glyph_props.v_select('x1', data);
      this.y1 = this.glyph_props.v_select('y1', data);
      this.cx = this.glyph_props.v_select('cx', data);
      return this.cy = this.glyph_props.v_select('cy', data);
    };

    QuadcurveView.prototype._render = function() {
      var ctx, _ref1, _ref2, _ref3;

      _ref1 = this.plot_view.map_to_screen(this.x0, this.glyph_props.x0.units, this.y0, this.glyph_props.y0.units), this.sx0 = _ref1[0], this.sy0 = _ref1[1];
      _ref2 = this.plot_view.map_to_screen(this.x1, this.glyph_props.x1.units, this.y1, this.glyph_props.y1.units), this.sx1 = _ref2[0], this.sy1 = _ref2[1];
      _ref3 = this.plot_view.map_to_screen(this.cx, this.glyph_props.cx.units, this.cy, this.glyph_props.cy.units), this.scx = _ref3[0], this.scy = _ref3[1];
      ctx = this.plot_view.ctx;
      ctx.save();
      if (this.glyph_props.fast_path) {
        this._fast_path(ctx);
      } else {
        this._full_path(ctx);
      }
      return ctx.restore();
    };

    QuadcurveView.prototype._fast_path = function(ctx) {
      var i, _i, _ref1;

      if (this.do_stroke) {
        this.glyph_props.line_properties.set(ctx, this.glyph_props);
        ctx.beginPath();
        for (i = _i = 0, _ref1 = this.sx0.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (isNaN(this.sx0[i] + this.sy0[i] + this.sx1[i] + this.sy1[i] + this.scx[i] + this.scy[i])) {
            continue;
          }
          ctx.moveTo(this.sx0[i], this.sy0[i]);
          ctx.quadraticCurveTo(this.scx[i], this.scy[i], this.sx1[i], this.sy1[i]);
        }
        return ctx.stroke();
      }
    };

    QuadcurveView.prototype._full_path = function(ctx) {
      var i, _i, _ref1, _results;

      if (this.do_stroke) {
        _results = [];
        for (i = _i = 0, _ref1 = this.sx0.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (isNaN(this.sx0[i] + this.sy0[i] + this.sx1[i] + this.sy1[i] + this.scx[i] + this.scy[i])) {
            continue;
          }
          ctx.beginPath();
          ctx.moveTo(this.sx0[i], this.sy0[i]);
          ctx.quadraticCurveTo(this.scx[i], this.scy[i], this.sx1[i], this.sy1[i]);
          this.glyph_props.line_properties.set(ctx, this.data[i]);
          _results.push(ctx.stroke());
        }
        return _results;
      }
    };

    return QuadcurveView;

  })(GlyphView);

  Quadcurve = (function(_super) {
    __extends(Quadcurve, _super);

    function Quadcurve() {
      _ref1 = Quadcurve.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Quadcurve.prototype.default_view = QuadcurveView;

    Quadcurve.prototype.type = 'GlyphRenderer';

    return Quadcurve;

  })(Glyph);

  Quadcurve.prototype.display_defaults = _.clone(Quadcurve.prototype.display_defaults);

  _.extend(Quadcurve.prototype.display_defaults, {
    line_color: 'red',
    line_width: 1,
    line_alpha: 1.0,
    line_join: 'miter',
    line_cap: 'butt',
    line_dash: [],
    line_dash_offset: 0
  });

  exports.Quadcurve = Quadcurve;

  exports.QuadcurveView = QuadcurveView;

}).call(this);
}, "renderers/glyph/glyph": function(exports, require, module) {(function() {
  var Glyph, GlyphView, HasParent, PlotWidget, base, safebind, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  base = require('../../base');

  HasParent = base.HasParent;

  safebind = base.safebind;

  PlotWidget = require('../../common/plot_widget').PlotWidget;

  GlyphView = (function(_super) {
    __extends(GlyphView, _super);

    function GlyphView() {
      _ref = GlyphView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    GlyphView.prototype.initialize = function(options) {
      GlyphView.__super__.initialize.call(this, options);
      return this.need_set_data = true;
    };

    GlyphView.prototype.set_data = function(request_render) {
      var data, source;

      if (request_render == null) {
        request_render = true;
      }
      source = this.mget_obj('data_source');
      if (source.type === 'ObjectArrayDataSource') {
        data = source.get('data');
      } else if (source.type === 'ColumnDataSource') {
        data = source.datapoints();
      } else if (source.type === 'PandasPlotSource') {
        data = source.datapoints();
      } else {
        console.log('Unknown data source type: ' + source.type);
      }
      this._set_data(data);
      if (request_render) {
        return this.request_render();
      }
    };

    GlyphView.prototype.render = function(have_new_mapper_state) {
      if (have_new_mapper_state == null) {
        have_new_mapper_state = true;
      }
      if (this.need_set_data) {
        this.set_data(false);
        this.need_set_data = false;
      }
      return this._render(this.plot_view, have_new_mapper_state);
    };

    GlyphView.prototype.select = function() {
      return 'pass';
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
      var d, halfspan, i, mapper, pt0, pt1, pt_units, ptc, span_units, spt0, spt1, x;

      pt_units = this.glyph_props[pt].units;
      span_units = this.glyph_props[span].units;
      if (pt === 'x') {
        mapper = this.plot_view.xmapper;
      } else if (pt === 'y') {
        mapper = this.plot_view.ymapper;
      }
      span = (function() {
        var _i, _len, _results;

        _results = [];
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          x = data[_i];
          _results.push(this.glyph_props.select(span, x));
        }
        return _results;
      }).call(this);
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
          for (i = _i = 0, _ref1 = ptc.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
            _results.push(ptc[i] - halfspan[i]);
          }
          return _results;
        })();
        pt1 = (function() {
          var _i, _ref1, _results;

          _results = [];
          for (i = _i = 0, _ref1 = ptc.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
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
          for (i = _i = 0, _ref1 = pt0.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
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
        for (i = _i = 0, _ref1 = spt0.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          _results.push(spt1[i] - spt0[i]);
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

    GlyphView.prototype.draw_legend = function(ctx, x1, x2, y1, y2) {};

    return GlyphView;

  })(PlotWidget);

  Glyph = (function(_super) {
    __extends(Glyph, _super);

    function Glyph() {
      _ref1 = Glyph.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    return Glyph;

  })(HasParent);

  Glyph.prototype.defaults = _.clone(Glyph.prototype.defaults);

  _.extend(Glyph.prototype.defaults, {
    data_source: null
  });

  Glyph.prototype.display_defaults = _.clone(Glyph.prototype.display_defaults);

  _.extend(Glyph.prototype.display_defaults, {
    level: 'glyph',
    radius_units: 'screen',
    length_units: 'screen',
    angle_units: 'deg',
    start_angle_units: 'deg',
    end_angle_units: 'deg'
  });

  exports.GlyphView = GlyphView;

  exports.Glyph = Glyph;

}).call(this);
}, "renderers/glyph/rect": function(exports, require, module) {(function() {
  var Glyph, GlyphView, Rect, RectView, fill_properties, glyph, glyph_properties, line_properties, properties, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = require('../properties');

  glyph_properties = properties.glyph_properties;

  line_properties = properties.line_properties;

  fill_properties = properties.fill_properties;

  glyph = require('./glyph');

  Glyph = glyph.Glyph;

  GlyphView = glyph.GlyphView;

  RectView = (function(_super) {
    __extends(RectView, _super);

    function RectView() {
      _ref = RectView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    RectView.prototype.initialize = function(options) {
      var spec;

      RectView.__super__.initialize.call(this, options);
      this.glyph_props = this.init_glyph(this.mget('glyphspec'));
      if (this.mget('selection_glyphspec')) {
        spec = _.extend({}, this.mget('glyphspec'), this.mget('selection_glyphspec'));
        this.selection_glyphprops = this.init_glyph(spec);
      }
      if (this.mget('nonselection_glyphspec')) {
        spec = _.extend({}, this.mget('glyphspec'), this.mget('nonselection_glyphspec'));
        this.nonselection_glyphprops = this.init_glyph(spec);
      }
      this.do_fill = this.glyph_props.fill_properties.do_fill;
      return this.do_stroke = this.glyph_props.line_properties.do_stroke;
    };

    RectView.prototype.init_glyph = function(glyphspec) {
      var fill_props, glyph_props, line_props;

      fill_props = new fill_properties(this, glyphspec);
      line_props = new line_properties(this, glyphspec);
      glyph_props = new glyph_properties(this, glyphspec, ['x', 'y', 'width', 'height', 'angle'], [line_props, fill_props]);
      return glyph_props;
    };

    RectView.prototype._set_data = function(data) {
      var angle, angles, i, obj, _i, _ref1, _results;

      this.data = data;
      this.x = this.glyph_props.v_select('x', data);
      this.y = this.glyph_props.v_select('y', data);
      angles = (function() {
        var _i, _len, _results;

        _results = [];
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          obj = data[_i];
          _results.push(this.glyph_props.select('angle', obj));
        }
        return _results;
      }).call(this);
      this.angle = (function() {
        var _i, _len, _results;

        _results = [];
        for (_i = 0, _len = angles.length; _i < _len; _i++) {
          angle = angles[_i];
          _results.push(-angle);
        }
        return _results;
      })();
      this.selected_mask = new Array(data.length - 1);
      _results = [];
      for (i = _i = 0, _ref1 = this.selected_mask.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        _results.push(this.selected_mask[i] = false);
      }
      return _results;
    };

    RectView.prototype._map_data = function() {
      var _ref1;

      _ref1 = this.plot_view.map_to_screen(this.x, this.glyph_props.x.units, this.y, this.glyph_props.y.units), this.sx = _ref1[0], this.sy = _ref1[1];
      this.sw = this.distance(this.data, 'x', 'width', 'center');
      return this.sh = this.distance(this.data, 'y', 'height', 'center');
    };

    RectView.prototype._render = function() {
      var ctx, idx, props, selected, _i, _len;

      this._map_data();
      ctx = this.plot_view.ctx;
      selected = this.mget_obj('data_source').get('selected');
      for (_i = 0, _len = selected.length; _i < _len; _i++) {
        idx = selected[_i];
        this.selected_mask[idx] = true;
      }
      ctx.save();
      if (this.glyph_props.fast_path) {
        this._fast_path(ctx);
      } else {
        if (selected && selected.length && this.nonselection_glyphprops) {
          if (this.selection_glyphprops) {
            props = this.selection_glyphprops;
          } else {
            props = this.glyph_props;
          }
          this._full_path(ctx, props, 'selected');
          this._full_path(ctx, this.nonselection_glyphprops, 'unselected');
        } else {
          this._full_path(ctx);
        }
      }
      return ctx.restore();
    };

    RectView.prototype._fast_path = function(ctx) {
      var i, _i, _j, _ref1, _ref2;

      if (this.do_fill) {
        this.glyph_props.fill_properties.set(ctx, this.glyph_props);
        ctx.beginPath();
        for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (isNaN(this.sx[i] + this.sy[i] + this.sw[i] + this.sh[i] + this.angle[i])) {
            continue;
          }
          if (this.angle[i]) {
            ctx.translate(this.sx[i], this.sy[i]);
            ctx.rotate(this.angle[i]);
            ctx.rect(-this.sw[i] / 2, -this.sh[i] / 2, this.sw[i], this.sh[i]);
            ctx.rotate(-this.angle[i]);
            ctx.translate(-this.sx[i], -this.sy[i]);
          } else {
            ctx.rect(this.sx[i] - this.sw[i] / 2, this.sy[i] - this.sh[i] / 2, this.sw[i], this.sh[i]);
          }
        }
        ctx.fill();
      }
      if (this.do_stroke) {
        this.glyph_props.line_properties.set(ctx, this.glyph_props);
        ctx.beginPath();
        for (i = _j = 0, _ref2 = this.sx.length - 1; 0 <= _ref2 ? _j <= _ref2 : _j >= _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
          if (isNaN(this.sx[i] + this.sy[i] + this.sw[i] + this.sh[i] + this.angle[i])) {
            continue;
          }
          if (this.angle[i]) {
            ctx.translate(this.sx[i], this.sy[i]);
            ctx.rotate(this.angle[i]);
            ctx.rect(-this.sw[i] / 2, -this.sh[i] / 2, this.sw[i], this.sh[i]);
            ctx.rotate(-this.angle[i]);
            ctx.translate(-this.sx[i], -this.sy[i]);
          } else {
            ctx.rect(this.sx[i] - this.sw[i] / 2, this.sy[i] - this.sh[i] / 2, this.sw[i], this.sh[i]);
          }
        }
        return ctx.stroke();
      }
    };

    RectView.prototype.draw_legend = function(ctx, x1, x2, y1, y2) {
      var border, data_h, data_w, fill_props, glyph_props, glyph_settings, h, line_props, reference_point, w, x, y;

      glyph_props = this.glyph_props;
      line_props = glyph_props.line_properties;
      fill_props = glyph_props.fill_properties;
      ctx.save();
      reference_point = this.get_reference_point();
      if (reference_point != null) {
        glyph_settings = reference_point;
        data_w = this.distance([reference_point], 'x', 'width', 'center')[0];
        data_h = this.distance([reference_point], 'y', 'height', 'center')[0];
      } else {
        glyph_settings = glyph_props;
      }
      border = line_props.select(line_props.line_width_name, glyph_settings);
      ctx.beginPath();
      w = Math.abs(x2 - x1);
      h = Math.abs(y2 - y1);
      w = w - 2 * border;
      h = h - 2 * border;
      if (data_w != null) {
        w = data_w > w ? w : data_w;
      }
      if (data_h != null) {
        h = data_h > h ? h : data_h;
      }
      x = (x1 + x2) / 2 - (w / 2);
      y = (y1 + y2) / 2 - (h / 2);
      ctx.rect(x, y, w, h);
      fill_props.set(ctx, glyph_settings);
      ctx.fill();
      line_props.set(ctx, glyph_settings);
      ctx.stroke();
      return ctx.restore();
    };

    RectView.prototype._full_path = function(ctx, glyph_props, use_selection) {
      var i, _i, _ref1, _results;

      if (!glyph_props) {
        glyph_props = this.glyph_props;
      }
      _results = [];
      for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        if (isNaN(this.sx[i] + this.sy[i] + this.sw[i] + this.sh[i] + this.angle[i])) {
          continue;
        }
        if (use_selection === 'selected' && !this.selected_mask[i]) {
          continue;
        }
        if (use_selection === 'unselected' && this.selected_mask[i]) {
          continue;
        }
        ctx.translate(this.sx[i], this.sy[i]);
        ctx.rotate(this.angle[i]);
        ctx.beginPath();
        ctx.rect(-this.sw[i] / 2, -this.sh[i] / 2, this.sw[i], this.sh[i]);
        if (this.do_fill) {
          glyph_props.fill_properties.set(ctx, this.data[i]);
          ctx.fill();
        }
        if (this.do_stroke) {
          glyph_props.line_properties.set(ctx, this.data[i]);
          ctx.stroke();
        }
        ctx.rotate(-this.angle[i]);
        _results.push(ctx.translate(-this.sx[i], -this.sy[i]));
      }
      return _results;
    };

    RectView.prototype.select = function(xscreenbounds, yscreenbounds) {
      var i, selected, _i, _ref1;

      xscreenbounds = [this.plot_view.view_state.sx_to_device(xscreenbounds[0]), this.plot_view.view_state.sx_to_device(xscreenbounds[1])];
      yscreenbounds = [this.plot_view.view_state.sy_to_device(yscreenbounds[0]), this.plot_view.view_state.sy_to_device(yscreenbounds[1])];
      xscreenbounds = [_.min(xscreenbounds), _.max(xscreenbounds)];
      yscreenbounds = [_.min(yscreenbounds), _.max(yscreenbounds)];
      selected = [];
      for (i = _i = 0, _ref1 = this.sx.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        if (xscreenbounds) {
          if (this.sx[i] < xscreenbounds[0] || this.sx[i] > xscreenbounds[1]) {
            continue;
          }
        }
        if (yscreenbounds) {
          if (this.sy[i] < yscreenbounds[0] || this.sy[i] > yscreenbounds[1]) {
            continue;
          }
        }
        selected.push(i);
      }
      return selected;
    };

    return RectView;

  })(GlyphView);

  Rect = (function(_super) {
    __extends(Rect, _super);

    function Rect() {
      _ref1 = Rect.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Rect.prototype.default_view = RectView;

    Rect.prototype.type = 'GlyphRenderer';

    return Rect;

  })(Glyph);

  Rect.prototype.display_defaults = _.clone(Rect.prototype.display_defaults);

  _.extend(Rect.prototype.display_defaults, {
    fill: 'gray',
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

  exports.Rect = Rect;

  exports.RectView = RectView;

}).call(this);
}, "renderers/annotation_renderer": function(exports, require, module) {(function() {
  var AnnotationRenderers, Collections, annotations, base, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  base = require('../base');

  Collections = base.Collections;

  annotations = require('./annotations');

  AnnotationRenderers = (function(_super) {
    __extends(AnnotationRenderers, _super);

    function AnnotationRenderers() {
      _ref = AnnotationRenderers.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    AnnotationRenderers.prototype.model = function(attrs, options) {
      var model, type, _ref1;

      if (((_ref1 = attrs.annotationspec) != null ? _ref1.type : void 0) == null) {
        console.log("missing annotation type");
        return;
      }
      type = attrs.annotationspec.type;
      if (!(type in annotations)) {
        console.log("unknown annotation type '" + type + "'");
        return;
      }
      model = annotations[type];
      return new model(attrs, options);
    };

    return AnnotationRenderers;

  })(Backbone.Collection);

  exports.annotationrenderers = new AnnotationRenderers;

}).call(this);
}, "renderers/glyphs": function(exports, require, module) {(function() {
  var annular_wedge, annulus, arc, bezier, circle, image, image_rgba, image_uri, line, multi_line, oval, patch, patches, quad, quadcurve, ray, rect, segment, square, text, wedge;

  annular_wedge = require("./glyph/annular_wedge");

  annulus = require("./glyph/annulus");

  arc = require("./glyph/arc");

  bezier = require("./glyph/bezier");

  circle = require("./glyph/circle");

  image = require("./glyph/image");

  image_rgba = require("./glyph/image_rgba");

  image_uri = require("./glyph/image_uri");

  line = require("./glyph/line");

  multi_line = require("./glyph/multi_line");

  oval = require("./glyph/oval");

  patch = require("./glyph/patch");

  patches = require("./glyph/patches");

  quad = require("./glyph/quad");

  quadcurve = require("./glyph/quadcurve");

  ray = require("./glyph/ray");

  rect = require("./glyph/rect");

  square = require("./glyph/square");

  segment = require("./glyph/segment");

  text = require("./glyph/text");

  wedge = require("./glyph/wedge");

  exports.annular_wedge = annular_wedge.AnnularWedge;

  exports.annulus = annulus.Annulus;

  exports.arc = arc.Arc;

  exports.bezier = bezier.Bezier;

  exports.circle = circle.Circle;

  exports.image = image.Image;

  exports.image_rgba = image_rgba.ImageRGBA;

  exports.image_uri = image_uri.ImageURI;

  exports.line = line.Line;

  exports.multi_line = multi_line.MultiLine;

  exports.oval = oval.Oval;

  exports.patch = patch.Patch;

  exports.patches = patches.Patches;

  exports.quad = quad.Quad;

  exports.quadcurve = quadcurve.Quadcurve;

  exports.ray = ray.Ray;

  exports.square = square.Square;

  exports.rect = rect.Rect;

  exports.segment = segment.Segment;

  exports.text = text.Text;

  exports.wedge = wedge.Wedge;

}).call(this);
}, "renderers/guide_renderer": function(exports, require, module) {(function() {
  var Collections, GuideRenderers, base, guides, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  base = require('../base');

  Collections = base.Collections;

  guides = require('./guides');

  GuideRenderers = (function(_super) {
    __extends(GuideRenderers, _super);

    function GuideRenderers() {
      _ref = GuideRenderers.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    GuideRenderers.prototype.model = function(attrs, options) {
      var model, type, _ref1;

      if (((_ref1 = attrs.guidespec) != null ? _ref1.type : void 0) == null) {
        console.log("missing guide type");
        return;
      }
      type = attrs.guidespec.type;
      if (!(type in guides)) {
        console.log("unknown guide type '" + type + "'");
        return;
      }
      model = guides[type];
      return new model(attrs, options);
    };

    return GuideRenderers;

  })(Backbone.Collection);

  exports.guiderenderers = new GuideRenderers;

}).call(this);
}, "renderers/annotations": function(exports, require, module) {(function() {
  var legend;

  legend = require("./annotation/legend");

  exports.legend = legend.Legend;

}).call(this);
}, "renderers/guides": function(exports, require, module) {(function() {
  var axis, rule;

  axis = require("./guide/axis");

  rule = require("./guide/rule");

  exports.linear_axis = axis.LinearAxis;

  exports.rule = rule.Rule;

}).call(this);
}, "renderers/guide/axis": function(exports, require, module) {(function() {
  var HasParent, LinearAxes, LinearAxis, LinearAxisView, PlotWidget, base, line_properties, properties, safebind, signum, text_properties, ticking, _align_lookup, _angle_lookup, _baseline_lookup, _ref, _ref1, _ref2,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  base = require('../../base');

  HasParent = base.HasParent;

  safebind = base.safebind;

  properties = require('../properties');

  line_properties = properties.line_properties;

  text_properties = properties.text_properties;

  PlotWidget = require('../../common/plot_widget').PlotWidget;

  ticking = require('../../common/ticking');

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
      var guidespec;

      LinearAxisView.__super__.initialize.call(this, attrs, options);
      guidespec = this.mget('guidespec');
      this.rule_props = new line_properties(this, guidespec, 'axis_');
      this.major_tick_props = new line_properties(this, guidespec, 'major_tick_');
      this.major_label_props = new text_properties(this, guidespec, 'major_label_');
      return this.axis_label_props = new text_properties(this, guidespec, 'axis_label_');
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

      _ref1 = coords = this.mget('rule_coords'), x = _ref1[0], y = _ref1[1];
      _ref2 = this.plot_view.map_to_screen(x, "data", y, "data"), sx = _ref2[0], sy = _ref2[1];
      this.rule_props.set(ctx, this);
      ctx.beginPath();
      ctx.moveTo(sx[0], sy[0]);
      for (i = _i = 1, _ref3 = sx.length - 1; 1 <= _ref3 ? _i <= _ref3 : _i >= _ref3; i = 1 <= _ref3 ? ++_i : --_i) {
        ctx.lineTo(sx[i], sy[i]);
      }
      ctx.stroke();
    };

    LinearAxisView.prototype._draw_major_ticks = function(ctx) {
      var coords, i, nx, ny, sx, sy, tin, tout, x, y, _i, _ref1, _ref2, _ref3, _ref4;

      _ref1 = coords = this.mget('major_coords'), x = _ref1[0], y = _ref1[1];
      _ref2 = this.plot_view.map_to_screen(x, "data", y, "data"), sx = _ref2[0], sy = _ref2[1];
      _ref3 = this.mget('normals'), nx = _ref3[0], ny = _ref3[1];
      tin = this.mget('major_tick_in');
      tout = this.mget('major_tick_out');
      this.major_tick_props.set(ctx, this);
      for (i = _i = 0, _ref4 = sx.length - 1; 0 <= _ref4 ? _i <= _ref4 : _i >= _ref4; i = 0 <= _ref4 ? ++_i : --_i) {
        ctx.beginPath();
        ctx.moveTo(sx[i] + nx * tout, sy[i] + ny * tout);
        ctx.lineTo(sx[i] - nx * tin, sy[i] - ny * tin);
        ctx.stroke();
      }
    };

    LinearAxisView.prototype._draw_major_labels = function(ctx) {
      var angle, coords, dim, formatter, i, labels, nx, ny, orient, side, standoff, sx, sy, x, y, _i, _ref1, _ref2, _ref3, _ref4;

      _ref1 = coords = this.mget('major_coords'), x = _ref1[0], y = _ref1[1];
      _ref2 = this.plot_view.map_to_screen(x, "data", y, "data"), sx = _ref2[0], sy = _ref2[1];
      _ref3 = this.mget('normals'), nx = _ref3[0], ny = _ref3[1];
      dim = this.mget('guidespec').dimension;
      side = this.mget('side');
      orient = this.mget('major_label_orientation');
      if (_.isString(orient)) {
        angle = _angle_lookup[side][orient];
      } else {
        angle = -orient;
      }
      standoff = this._tick_extent() + this.mget('major_label_standoff');
      formatter = new ticking.BasicTickFormatter();
      labels = formatter.format(coords[dim]);
      this.major_label_props.set(ctx, this);
      this._apply_location_heuristics(ctx, side, orient);
      for (i = _i = 0, _ref4 = sx.length - 1; 0 <= _ref4 ? _i <= _ref4 : _i >= _ref4; i = 0 <= _ref4 ? ++_i : --_i) {
        if (angle) {
          ctx.translate(sx[i] + nx * standoff, sy[i] + ny * standoff);
          ctx.rotate(angle);
          ctx.fillText(labels[i], 0, 0);
          ctx.rotate(-angle);
          ctx.translate(-sx[i] - nx * standoff, -sy[i] - ny * standoff);
        } else {
          ctx.fillText(labels[i], sx[i] + nx * standoff, sy[i] + ny * standoff);
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
      var angle, c, coords, dim, extent, factor, formatter, h, i, labels, orient, rounding, s, side, val, w, _i, _j, _ref1, _ref2;

      extent = 0;
      dim = this.mget('guidespec').dimension;
      coords = this.mget('major_coords');
      side = this.mget('side');
      orient = this.mget('major_label_orientation');
      formatter = new ticking.BasicTickFormatter();
      labels = formatter.format(coords[dim]);
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
        for (i = _i = 0, _ref1 = labels.length - 1; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
          if (labels[i] == null) {
            continue;
          }
          w = this.plot_view.ctx.measureText(labels[i]).width * 1.3;
          h = this.plot_view.ctx.measureText(labels[i]).ascent;
          val = w * s + (h / factor) * c;
          if (val > extent) {
            extent = val;
          }
        }
      } else {
        for (i = _j = 0, _ref2 = labels.length - 1; 0 <= _ref2 ? _j <= _ref2 : _j >= _ref2; i = 0 <= _ref2 ? ++_j : --_j) {
          if (labels[i] == null) {
            continue;
          }
          w = this.plot_view.ctx.measureText(labels[i]).width * 1.3;
          h = this.plot_view.ctx.measureText(labels[i]).ascent;
          val = w * c + (h / factor) * s;
          if (val > extent) {
            extent = val;
          }
        }
      }
      if (extent > 0) {
        extent += this.mget('major_label_standoff');
      }
      rounding = this.mget('rounding_value');
      return (Math.floor(extent / rounding) + 1) * rounding;
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
        w = this.plot_view.ctx.measureText(this.mget('axis_label')).width;
        h = this.plot_view.ctx.measureText(this.mget('axis_label')).ascent;
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
      loc = (_ref1 = this.mget('guidespec').location) != null ? _ref1 : 'min';
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

    LinearAxis.prototype.type = 'GuideRenderer';

    LinearAxis.prototype.initialize = function(attrs, options) {
      LinearAxis.__super__.initialize.call(this, attrs, options);
      this.register_property('bounds', this._bounds, false);
      this.add_dependencies('bounds', this, ['guidespec']);
      this.register_property('rule_coords', this._rule_coords, false);
      this.add_dependencies('rule_coords', this, ['bounds', 'dimension', 'location']);
      this.register_property('major_coords', this._major_coords, false);
      this.add_dependencies('major_coords', this, ['bounds', 'dimension', 'location']);
      this.register_property('normals', this._normals, false);
      this.add_dependencies('normals', this, ['bounds', 'dimension', 'location']);
      this.register_property('side', this._side, false);
      this.add_dependencies('side', this, ['normals']);
      return this.register_property('padding_request', this._padding_request, false);
    };

    LinearAxis.prototype.dinitialize = function(attrs, options) {
      return this.add_dependencies('bounds', this.get_obj('plot'), ['x_range', 'y_range']);
    };

    LinearAxis.prototype._bounds = function() {
      var end, i, j, range_bounds, ranges, start, user_bounds, _ref2;

      i = this.get('guidespec').dimension;
      j = (i + 1) % 2;
      ranges = [this.get_obj('plot').get_obj('x_range'), this.get_obj('plot').get_obj('y_range')];
      user_bounds = (_ref2 = this.get('guidespec').bounds) != null ? _ref2 : 'auto';
      range_bounds = [ranges[i].get('min'), ranges[i].get('max')];
      if (_.isArray(user_bounds)) {
        start = Math.min(user_bounds[0], user_bounds[1]);
        end = Math.max(user_bounds[0], user_bounds[1]);
      } else {
        start = range_bounds[0], end = range_bounds[1];
      }
      return [start, end];
    };

    LinearAxis.prototype._rule_coords = function() {
      var coords, cross_range, end, i, j, loc, range, range_max, range_min, ranges, start, xs, ys, _ref2, _ref3, _ref4;

      i = this.get('guidespec').dimension;
      j = (i + 1) % 2;
      ranges = [this.get_obj('plot').get_obj('x_range'), this.get_obj('plot').get_obj('y_range')];
      range = ranges[i];
      cross_range = ranges[j];
      _ref2 = this.get('bounds'), start = _ref2[0], end = _ref2[1];
      xs = new Array(2);
      ys = new Array(2);
      coords = [xs, ys];
      loc = (_ref3 = this.get('guidespec').location) != null ? _ref3 : 'min';
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
      var coords, cross_range, end, i, ii, interval, j, loc, range, range_max, range_min, ranges, start, ticks, tmp, xs, ys, _i, _ref2, _ref3, _ref4, _ref5;

      i = this.get('guidespec').dimension;
      j = (i + 1) % 2;
      ranges = [this.get_obj('plot').get_obj('x_range'), this.get_obj('plot').get_obj('y_range')];
      range = ranges[i];
      cross_range = ranges[j];
      _ref2 = this.get('bounds'), start = _ref2[0], end = _ref2[1];
      tmp = Math.min(start, end);
      end = Math.max(start, end);
      interval = ticking.auto_interval(start, end);
      ticks = ticking.auto_ticks(null, null, start, end, interval);
      loc = (_ref3 = this.get('guidespec').location) != null ? _ref3 : 'min';
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
      for (ii = _i = 0, _ref5 = ticks.length - 1; 0 <= _ref5 ? _i <= _ref5 : _i >= _ref5; ii = 0 <= _ref5 ? ++_i : --_i) {
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

      i = this.get('guidespec').dimension;
      j = (i + 1) % 2;
      ranges = [this.get_obj('plot').get_obj('x_range'), this.get_obj('plot').get_obj('y_range')];
      range = ranges[i];
      cross_range = ranges[j];
      _ref2 = this.get('bounds'), start = _ref2[0], end = _ref2[1];
      loc = (_ref3 = this.get('guidespec').location) != null ? _ref3 : 'min';
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

    return LinearAxis;

  })(HasParent);

  LinearAxis.prototype.defaults = _.clone(LinearAxis.prototype.defaults);

  LinearAxis.prototype.display_defaults = _.clone(LinearAxis.prototype.display_defaults);

  _.extend(LinearAxis.prototype.display_defaults, {
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
    axis_label_text_baseline: "alphabetic",
    rounding_value: 20
  });

  LinearAxes = (function(_super) {
    __extends(LinearAxes, _super);

    function LinearAxes() {
      _ref2 = LinearAxes.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    LinearAxes.prototype.model = LinearAxis;

    return LinearAxes;

  })(Backbone.Collection);

  exports.linearaxes = new LinearAxes();

  exports.LinearAxis = LinearAxis;

  exports.LinearAxisView = LinearAxisView;

}).call(this);
}, "renderers/guide/rule": function(exports, require, module) {(function() {
  var HasParent, PlotWidget, Rule, RuleView, Rules, base, line_properties, properties, safebind, ticking, _ref, _ref1, _ref2,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  base = require('../../base');

  HasParent = base.HasParent;

  safebind = base.safebind;

  properties = require('../properties');

  line_properties = properties.line_properties;

  PlotWidget = require('../../common/plot_widget').PlotWidget;

  ticking = require('../../common/ticking');

  RuleView = (function(_super) {
    __extends(RuleView, _super);

    function RuleView() {
      _ref = RuleView.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    RuleView.prototype.initialize = function(attrs, options) {
      var guidespec;

      RuleView.__super__.initialize.call(this, attrs, options);
      guidespec = this.mget('guidespec');
      return this.rule_props = new line_properties(this, guidespec, 'rule_');
    };

    RuleView.prototype.render = function() {
      var ctx;

      ctx = this.plot_view.ctx;
      ctx.save();
      this._draw_rules(ctx);
      return ctx.restore();
    };

    RuleView.prototype.bind_bokeh_events = function() {
      return safebind(this, this.model, 'change', this.request_render);
    };

    RuleView.prototype._draw_rules = function(ctx) {
      var i, sx, sy, xs, ys, _i, _j, _ref1, _ref2, _ref3, _ref4;

      _ref1 = this.mget('rule_coords'), xs = _ref1[0], ys = _ref1[1];
      this.rule_props.set(ctx, this);
      for (i = _i = 0, _ref2 = xs.length - 1; 0 <= _ref2 ? _i <= _ref2 : _i >= _ref2; i = 0 <= _ref2 ? ++_i : --_i) {
        _ref3 = this.plot_view.map_to_screen(xs[i], "data", ys[i], "data"), sx = _ref3[0], sy = _ref3[1];
        ctx.beginPath();
        ctx.moveTo(sx[0], sy[0]);
        for (i = _j = 1, _ref4 = sx.length - 1; 1 <= _ref4 ? _j <= _ref4 : _j >= _ref4; i = 1 <= _ref4 ? ++_j : --_j) {
          ctx.lineTo(sx[i], sy[i]);
        }
        ctx.stroke();
      }
    };

    return RuleView;

  })(PlotWidget);

  Rule = (function(_super) {
    __extends(Rule, _super);

    function Rule() {
      _ref1 = Rule.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Rule.prototype.default_view = RuleView;

    Rule.prototype.type = 'GuideRenderer';

    Rule.prototype.initialize = function(attrs, options) {
      Rule.__super__.initialize.call(this, attrs, options);
      this.register_property('bounds', this._bounds, false);
      this.add_dependencies('bounds', this, ['guidespec']);
      this.register_property('rule_coords', this._rule_coords, false);
      return this.add_dependencies('rule_coords', this, ['bounds', 'dimension', 'location']);
    };

    Rule.prototype._bounds = function() {
      var end, i, j, range_bounds, ranges, start, user_bounds, _ref2;

      i = this.get('guidespec').dimension;
      j = (i + 1) % 2;
      ranges = [this.get_obj('plot').get_obj('x_range'), this.get_obj('plot').get_obj('y_range')];
      user_bounds = (_ref2 = this.get('guidespec').bounds) != null ? _ref2 : 'auto';
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

    Rule.prototype._rule_coords = function() {
      var N, cmax, cmin, coords, cross_range, dim_i, dim_j, end, i, ii, interval, j, loc, max, min, n, range, ranges, start, ticks, tmp, _i, _j, _ref2, _ref3, _ref4;

      i = this.get('guidespec').dimension;
      j = (i + 1) % 2;
      ranges = [this.get_obj('plot').get_obj('x_range'), this.get_obj('plot').get_obj('y_range')];
      range = ranges[i];
      cross_range = ranges[j];
      _ref2 = this.get('bounds'), start = _ref2[0], end = _ref2[1];
      tmp = Math.min(start, end);
      end = Math.max(start, end);
      start = tmp;
      interval = ticking.auto_interval(start, end);
      ticks = ticking.auto_ticks(null, null, start, end, interval);
      min = range.get('min');
      max = range.get('max');
      cmin = cross_range.get('min');
      cmax = cross_range.get('max');
      coords = [[], []];
      for (ii = _i = 0, _ref3 = ticks.length - 1; 0 <= _ref3 ? _i <= _ref3 : _i >= _ref3; ii = 0 <= _ref3 ? ++_i : --_i) {
        if (ticks[ii] === min || ticks[ii] === max) {
          continue;
        }
        dim_i = [];
        dim_j = [];
        N = 2;
        for (n = _j = 0, _ref4 = N - 1; 0 <= _ref4 ? _j <= _ref4 : _j >= _ref4; n = 0 <= _ref4 ? ++_j : --_j) {
          loc = cmin + (cmax - cmin) / (N - 1) * n;
          dim_i.push(ticks[ii]);
          dim_j.push(loc);
        }
        coords[i].push(dim_i);
        coords[j].push(dim_j);
      }
      return coords;
    };

    return Rule;

  })(HasParent);

  Rule.prototype.defaults = _.clone(Rule.prototype.defaults);

  Rule.prototype.display_defaults = _.clone(Rule.prototype.display_defaults);

  _.extend(Rule.prototype.display_defaults, {
    level: 'underlay',
    rule_line_color: '#aaaaaa',
    rule_line_width: 1,
    rule_line_alpha: 1.0,
    rule_line_join: 'miter',
    rule_line_cap: 'butt',
    rule_line_dash: [4, 6],
    rule_line_dash_offset: 0
  });

  Rules = (function(_super) {
    __extends(Rules, _super);

    function Rules() {
      _ref2 = Rules.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    Rules.prototype.model = Rule;

    return Rules;

  })(Backbone.Collection);

  exports.rules = new Rules();

  exports.Rule = Rule;

  exports.RuleView = RuleView;

}).call(this);
}, "renderers/properties": function(exports, require, module) {(function() {
  var fill_properties, glyph_properties, line_properties, properties, text_properties,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  properties = (function() {
    function properties() {}

    properties.prototype.string = function(styleprovider, glyphspec, attrname) {
      var default_value, glyph_value;

      default_value = styleprovider.mget(attrname);
      if (!(attrname in glyphspec)) {
        if (_.isString(default_value)) {
          this[attrname] = {
            "default": default_value
          };
        } else {
          console.log(("string property '" + attrname + "' given invalid default value: ") + default_value);
        }
        return;
      }
      glyph_value = glyphspec[attrname];
      if (_.isString(glyph_value)) {
        return this[attrname] = {
          "default": glyph_value
        };
      } else if (_.isObject(glyph_value)) {
        this[attrname] = glyph_value;
        if (this[attrname]["default"] == null) {
          return this[attrname]["default"] = default_value;
        }
      } else {
        return console.log(("string property '" + attrname + "' given invalid glyph value: ") + glyph_value);
      }
    };

    properties.prototype.number = function(styleprovider, glyphspec, attrname) {
      var default_units, default_value, glyph_value, _ref;

      default_value = styleprovider.mget(attrname);
      default_units = (_ref = styleprovider.mget(attrname + '_units')) != null ? _ref : 'data';
      if (attrname + '_units' in glyphspec) {
        default_units = glyphspec[attrname + '_units'];
      }
      if (!(attrname in glyphspec)) {
        if (_.isNumber(default_value)) {
          this[attrname] = {
            "default": default_value,
            units: default_units
          };
        } else {
          console.log(("number property '" + attrname + "' given invalid default value: ") + default_value);
        }
        return;
      }
      glyph_value = glyphspec[attrname];
      if (_.isString(glyph_value)) {
        return this[attrname] = {
          field: glyph_value,
          "default": default_value,
          units: default_units
        };
      } else if (_.isNumber(glyph_value)) {
        return this[attrname] = {
          "default": glyph_value,
          units: default_units
        };
      } else if (_.isObject(glyph_value)) {
        this[attrname] = glyph_value;
        if (this[attrname]["default"] == null) {
          this[attrname]["default"] = default_value;
        }
        if (this[attrname].units == null) {
          return this[attrname].units = default_units;
        }
      } else {
        return console.log(("number property '" + attrname + "' given invalid glyph value: ") + glyph_value);
      }
    };

    properties.prototype.color = function(styleprovider, glyphspec, attrname) {
      var default_value, glyph_value;

      default_value = styleprovider.mget(attrname);
      if (!(attrname in glyphspec)) {
        if (_.isString(default_value) || _.isNull(default_value)) {
          this[attrname] = {
            "default": default_value
          };
        } else {
          console.log(("color property '" + attrname + "' given invalid default value: ") + default_value);
        }
        return;
      }
      glyph_value = glyphspec[attrname];
      if (_.isString(glyph_value) || _.isNull(glyph_value)) {
        return this[attrname] = {
          "default": glyph_value
        };
      } else if (_.isObject(glyph_value)) {
        this[attrname] = glyph_value;
        if (this[attrname]["default"] == null) {
          return this[attrname]["default"] = default_value;
        }
      } else {
        return console.log(("color property '" + attrname + "' given invalid glyph value: ") + glyph_value);
      }
    };

    properties.prototype.array = function(styleprovider, glyphspec, attrname) {
      var default_units, default_value, glyph_value, _ref;

      default_value = styleprovider.mget(attrname);
      default_units = (_ref = styleprovider.mget(attrname + "_units")) != null ? _ref : 'data';
      if (attrname + '_units' in glyphspec) {
        default_units = glyphspec[attrname + '_units'];
      }
      if (!(attrname in glyphspec)) {
        if (_.isArray(default_value)) {
          this[attrname] = {
            "default": default_value,
            units: default_units
          };
        } else {
          console.log(("array property '" + attrname + "' given invalid default value: ") + default_value);
        }
        return;
      }
      glyph_value = glyphspec[attrname];
      if (_.isString(glyph_value)) {
        return this[attrname] = {
          field: glyph_value,
          "default": default_value,
          units: default_units
        };
      } else if (_.isArray(glyph_value)) {
        return this[attrname] = {
          "default": glyph_value,
          units: default_units
        };
      } else if (_.isObject(glyph_value)) {
        this[attrname] = glyph_value;
        if (this[attrname]["default"] == null) {
          return this[attrname]["default"] = default_value;
        }
      } else {
        return console.log(("array property '" + attrname + "' given invalid glyph value: ") + glyph_value);
      }
    };

    properties.prototype["enum"] = function(styleprovider, glyphspec, attrname, vals) {
      var default_value, glyph_value, levels_value;

      default_value = styleprovider.mget(attrname);
      levels_value = vals.split(" ");
      if (!(attrname in glyphspec)) {
        if (_.isString(default_value) && __indexOf.call(levels_value, default_value) >= 0) {
          this[attrname] = {
            "default": default_value
          };
        } else {
          console.log(("enum property '" + attrname + "' given invalid default value: ") + default_value);
          console.log("    acceptable values:" + levels_value);
        }
        return;
      }
      glyph_value = glyphspec[attrname];
      if (_.isString(glyph_value)) {
        if (__indexOf.call(levels_value, glyph_value) >= 0) {
          return this[attrname] = {
            "default": glyph_value
          };
        } else {
          return this[attrname] = {
            field: glyph_value,
            "default": default_value
          };
        }
      } else if (_.isObject(glyph_value)) {
        this[attrname] = glyph_value;
        if (this[attrname]["default"] == null) {
          return this[attrname]["default"] = default_value;
        }
      } else {
        console.log(("enum property '" + attrname + "' given invalid glyph value: ") + glyph_value);
        return console.log("    acceptable values:" + levels_value);
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
        return;
      }
      if (this[attrname].field != null) {
        if (this[attrname].field in obj) {
          return obj[this[attrname].field];
        }
      }
      if (obj[attrname] != null) {
        return obj[attrname];
      }
      if ((this[attrname] != null) && 'default' in this[attrname]) {
        return this[attrname]["default"];
      } else {
        return console.log("selection for attribute '" + attrname + "' failed on object: " + obj);
      }
    };

    properties.prototype.v_select = function(attrname, objs) {
      var i, obj, result, _i, _ref;

      if (!(attrname in this)) {
        return;
      }
      result = new Array(objs.length);
      for (i = _i = 0, _ref = objs.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
        obj = objs[i];
        if ((this[attrname].field != null) && (this[attrname].field in obj)) {
          result[i] = obj[this[attrname].field];
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
      this.do_stroke = this[this.line_color_name]["default"] != null;
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

    return line_properties;

  })(properties);

  fill_properties = (function(_super) {
    __extends(fill_properties, _super);

    function fill_properties(styleprovider, glyphspec, prefix) {
      if (prefix == null) {
        prefix = "";
      }
      this.fill_name = "" + prefix + "fill";
      this.fill_alpha_name = "" + prefix + "fill_alpha";
      this.color(styleprovider, glyphspec, this.fill_name);
      this.number(styleprovider, glyphspec, this.fill_alpha_name);
      this.do_fill = this[this.fill_name]["default"] != null;
    }

    fill_properties.prototype.set = function(ctx, obj) {
      ctx.fillStyle = this.select(this.fill_name, obj);
      return ctx.globalAlpha = this.select(this.fill_alpha_name, obj);
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

    return text_properties;

  })(properties);

  glyph_properties = (function(_super) {
    __extends(glyph_properties, _super);

    function glyph_properties(styleprovider, glyphspec, attrnames, properties) {
      var attrname, attrtype, prop, _i, _j, _len, _len1, _ref;

      for (_i = 0, _len = attrnames.length; _i < _len; _i++) {
        attrname = attrnames[_i];
        attrtype = "number";
        if (attrname.indexOf(":") > -1) {
          _ref = attrname.split(":"), attrname = _ref[0], attrtype = _ref[1];
        }
        this.setattr(styleprovider, glyphspec, attrname, attrtype);
      }
      for (_j = 0, _len1 = properties.length; _j < _len1; _j++) {
        prop = properties[_j];
        this[prop.constructor.name] = prop;
      }
      this.fast_path = false;
      if ('fast_path' in glyphspec) {
        this.fast_path = glyphspec.fast_path;
      }
    }

    return glyph_properties;

  })(properties);

  exports.glyph_properties = glyph_properties;

  exports.fill_properties = fill_properties;

  exports.line_properties = line_properties;

  exports.text_properties = text_properties;

}).call(this);
}, "renderers/glyph_renderer": function(exports, require, module) {(function() {
  var Collections, GlyphRenderers, base, glyphs, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  base = require('../base');

  Collections = base.Collections;

  glyphs = require('./glyphs');

  GlyphRenderers = (function(_super) {
    __extends(GlyphRenderers, _super);

    function GlyphRenderers() {
      _ref = GlyphRenderers.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    GlyphRenderers.prototype.model = function(attrs, options) {
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

    return GlyphRenderers;

  })(Backbone.Collection);

  exports.glyphrenderers = new GlyphRenderers;

}).call(this);
}, "base": function(exports, require, module) {(function() {
  var Collections, Config, HasParent, HasProperties, WebSocketWrapper, build_views, load_models, locations, mod_cache, safebind, submodels, _ref, _ref1,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Config = {
    prefix: ''
  };

  safebind = function(binder, target, event, callback) {
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

  load_models = function(modelspecs) {
    var attrs, coll, coll_attrs, model, newspecs, oldspecs, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m;

    newspecs = [];
    oldspecs = [];
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

  HasProperties = (function(_super) {
    __extends(HasProperties, _super);

    function HasProperties() {
      this.rpc = __bind(this.rpc, this);
      this.get_obj = __bind(this.get_obj, this);
      this.resolve_ref = __bind(this.resolve_ref, this);
      this.convert_to_ref = __bind(this.convert_to_ref, this);      _ref = HasProperties.__super__.constructor.apply(this, arguments);
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
          computed = getter.apply(this, this);
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
        return Collections(ref['type']).get(ref['id']);
      }
    };

    HasProperties.prototype.get_obj = function(ref_name) {
      var ref;

      ref = this.get(ref_name);
      if (ref) {
        return this.resolve_ref(ref);
      }
    };

    HasProperties.prototype.url = function() {
      var base;

      base = Config.prefix + "/bokeh/bb/" + this.get('doc') + "/" + this.type + "/";
      if (this.isNew()) {
        return base;
      }
      return base + this.get('id') + "/";
    };

    HasProperties.prototype.sync = function(method, model, options) {
      return options.success(model, null, {});
    };

    HasProperties.prototype.defaults = {};

    HasProperties.prototype.rpc = function(funcname, args, kwargs) {
      var data, docid, id, prefix, resp, type, url;

      prefix = Config.prefix;
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

  HasParent = (function(_super) {
    __extends(HasParent, _super);

    function HasParent() {
      _ref1 = HasParent.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    HasParent.prototype.get_fallback = function(attr) {
      var retval;

      if (this.get_obj('parent') && _.indexOf(this.get_obj('parent').parent_properties, attr) >= 0 && !_.isUndefined(this.get_obj('parent').get(attr))) {
        return this.get_obj('parent').get(attr);
      } else {
        retval = this.display_defaults[attr];
        return retval;
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

  build_views = function(view_storage, view_models, options, view_types) {
    var created_views, error, i_model, key, model, newmodels, to_remove, view_specific_option, _i, _j, _len, _len1;

    if (view_types == null) {
      view_types = [];
    }
    "use strict";
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

  locations = {
    AnnotationRenderer: ['./renderers/annotation_renderer', 'annotationrenderers'],
    GlyphRenderer: ['./renderers/glyph_renderer', 'glyphrenderers'],
    GuideRenderer: ['./renderers/guide_renderer', 'guiderenderers'],
    PanTool: ['./tools/pan_tool', 'pantools'],
    ZoomTool: ['./tools/zoom_tool', 'zoomtools'],
    ResizeTool: ['./tools/resize_tool', 'resizetools'],
    SelectionTool: ['./tools/select_tool', 'selectiontools'],
    DataRangeBoxSelectionTool: ['./tools/select_tool', 'datarangeboxselectiontools'],
    PreviewSaveTool: ['./tools/preview_save_tool', 'previewsavetools'],
    EmbedTool: ['./tools/preview_save_tool', 'embedtools'],
    BoxSelectionOverlay: ['./overlays/boxselectionoverlay', 'boxselectionoverlays'],
    ObjectArrayDataSource: ['./common/datasource', 'objectarraydatasources'],
    ColumnDataSource: ['./common/datasource', 'columndatasources'],
    Range1d: ['./common/ranges', 'range1ds'],
    DataRange1d: ['./common/ranges', 'datarange1ds'],
    DataFactorRange: ['./common/ranges', 'datafactorranges'],
    Plot: ['./common/plot', 'plots'],
    GMapPlot: ['./common/gmap_plot', 'gmapplots'],
    GridPlotContainer: ['./common/grid_plot', 'gridplotcontainers'],
    CDXPlotContext: ['./common/plot_context', 'plotcontexts'],
    PlotContext: ['./common/plot_context', 'plotcontexts'],
    PlotList: ['./common/plot_context', 'plotlists'],
    DataTable: ['./widgets/table', 'datatables'],
    IPythonRemoteData: ['./pandas/pandas', 'ipythonremotedatas'],
    PandasPivotTable: ['./pandas/pandas', 'pandaspivottables'],
    PandasPlotSource: ['./pandas/pandas', 'pandasplotsources'],
    LinearAxis: ['./renderers/guide/axis', 'linearaxes'],
    Rule: ['./renderers/guide/rule', 'rules'],
    Legend: ['./renderers/annotation_renderer', 'annotationrenderers'],
    DataSlider: ['./tools/slider', 'datasliders']
  };

  exports.locations = locations;

  mod_cache = {};

  Collections = function(typename) {
    var collection, modulename, _ref2;

    if (!locations[typename]) {
      throw "./base: Unknown Collection " + typename;
    }
    _ref2 = locations[typename], modulename = _ref2[0], collection = _ref2[1];
    if (mod_cache[modulename] == null) {
      console.log("calling require", modulename);
      mod_cache[modulename] = require(modulename);
    }
    return mod_cache[modulename][collection];
  };

  Collections.bulksave = function(models) {
    var doc, jsondata, m, url, xhr;

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

  exports.Collections = Collections;

  exports.Config = Config;

  exports.safebind = safebind;

  exports.load_models = load_models;

  exports.WebSocketWrapper = WebSocketWrapper;

  exports.submodels = submodels;

  exports.HasProperties = HasProperties;

  exports.HasParent = HasParent;

  exports.build_views = build_views;

}).call(this);
}
});

