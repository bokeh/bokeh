define(function(){
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
      var field, _i, _len, _ref;
    
      if (this.label === "Continuous") {
        _print(_safe('\n<div class="bk-bs-panel-heading bk-crossfilter-panel-heading bk-crossfilter-panel-continuous-heading">\n'));
      } else {
        _print(_safe('\n<div class="bk-bs-panel-heading bk-crossfilter-panel-heading bk-crossfilter-panel-factor-heading">\n'));
      }
    
      _print(_safe('\n  '));
    
      _print(this.name);
    
      _print(_safe(' <span style="font-size:x-small;">('));
    
      _print(this.label);
    
      _print(_safe(')</span>\n</div>\n\n\n<div class="bk-bs-panel-body">\n\n  <table class="bk-table">\n\n    <tbody>\n\n      '));
    
      _ref = this.fields;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        field = _ref[_i];
        _print(_safe('\n      <tr> <td> '));
        _print(field);
        _print(_safe('  </td> <td> '));
        _print(this[field]);
        _print(_safe('  </td> </tr>\n      '));
      }
    
      _print(_safe('\n\n    </tbody>\n\n  </table>\n\n</div>'));
    
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
