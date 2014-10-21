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
      var i, tab, _i, _j, _len, _len1, _ref, _ref1;
    
      _print(_safe('<ul class="bk-bs-nav bk-bs-nav-tabs">\n  '));
    
      _ref = this.tabs;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        tab = _ref[i];
        _print(_safe('\n    <li class="'));
        _print(this.active(i));
        _print(_safe('">\n      <a href="#tab-'));
        _print(tab.get('id'));
        _print(_safe('">'));
        _print(tab.get('title'));
        _print(_safe('</a>\n    </li>\n  '));
      }
    
      _print(_safe('\n</ul>\n<div class="bk-bs-tab-content">\n  '));
    
      _ref1 = this.tabs;
      for (i = _j = 0, _len1 = _ref1.length; _j < _len1; i = ++_j) {
        tab = _ref1[i];
        _print(_safe('\n    <div class="bk-bs-tab-pane '));
        _print(this.active(i));
        _print(_safe('" id="tab-'));
        _print(tab.get('id'));
        _print(_safe('"></div>\n  '));
      }
    
      _print(_safe('\n</div>\n'));
    
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
