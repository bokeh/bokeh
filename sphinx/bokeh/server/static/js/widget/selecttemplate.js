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
      var option, _i, _len, _ref;
    
      _print(_safe('<label for="'));
    
      _print(this.id);
    
      _print(_safe('"> '));
    
      _print(this.title);
    
      _print(_safe(' </label>\n<select class="bk-widget-form-input" id="'));
    
      _print(this.id);
    
      _print(_safe('" name="'));
    
      _print(this.name);
    
      _print(_safe('">\n  '));
    
      _ref = this.options;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        option = _ref[_i];
        _print(_safe('\n    '));
        if (_.isString(option)) {
          _print(_safe('\n      <option '));
          _print(option === this.value ? _print(_safe('selected="selected"')) : void 0);
          _print(_safe(' value="'));
          _print(option);
          _print(_safe('">'));
          _print(option);
          _print(_safe('</option>\n    '));
        } else {
          _print(_safe('\n      <option '));
          _print(option.value === this.value ? _print(_safe('selected="selected"')) : void 0);
          _print(_safe(' value="'));
          _print(option.value);
          _print(_safe('">'));
          _print(option.name);
          _print(_safe('</option>\n    '));
        }
        _print(_safe('\n  '));
      }
    
      _print(_safe('\n</select>\n'));
    
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
