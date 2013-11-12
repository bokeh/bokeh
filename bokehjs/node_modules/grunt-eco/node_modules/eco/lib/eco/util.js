(function() {
  var indent, repeat, trim;
  exports.repeat = repeat = function(string, count) {
    return Array(count + 1).join(string);
  };
  exports.indent = indent = function(string, width) {
    var line, lines, space;
    space = repeat(" ", width);
    lines = (function() {
      var _i, _len, _ref, _results;
      _ref = string.split("\n");
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        line = _ref[_i];
        _results.push(space + line);
      }
      return _results;
    })();
    return lines.join("\n");
  };
  exports.trim = trim = function(string) {
    return string.replace(/^\s+/, "").replace(/\s+$/, "");
  };
}).call(this);
