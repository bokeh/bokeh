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
      _print(_safe('<div class="panel panel-default">\n  <div class="panel-heading">\n    <h4 class="panel-title">\n      <a class="bokehdoclabel" href="#'));
    
      _print(this.bodyid);
    
      _print(_safe('" data-toggle="collapse">\n        Document: '));
    
      _print(this.model.get('title'));
    
      _print(_safe(' <span class="bokehdelete glyphicon glyphicon-trash"></i>\n      </a>\n    </h4>\n  </div>\n  <div id="'));
    
      _print(this.bodyid);
    
      _print(_safe('" class="panel-collapse collapse">\n    <div class="panel-body plots"></div>\n  </div>\n</div>\n'));
    
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
