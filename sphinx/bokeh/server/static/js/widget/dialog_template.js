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
      var button, i, _i, _len, _ref;
    
      _print(_safe('<div class="bk-bs-modal" tabindex="-1">\n  <div class="bk-bs-modal-dialog">\n    <div class="bk-bs-modal-content">\n      <div class="bk-bs-modal-header">\n        '));
    
      if (this.closable) {
        _print(_safe('\n          <button type="button" class="bk-bs-close" data-bk-bs-dismiss="modal">&times;</button>\n        '));
      }
    
      _print(_safe('\n        <h4 class="bk-bs-modal-title">'));
    
      _print(this.title);
    
      _print(_safe('</h4>\n      </div>\n      <div class="bk-bs-modal-body">\n        '));
    
      _print(this.content);
    
      _print(_safe('\n      </div>\n      <div class="bk-bs-modal-footer">\n        '));
    
      _ref = this.buttons;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        button = _ref[i];
        _print(_safe('\n          '));
        if (i === 0) {
          _print(_safe('\n            <button type="button" class="bk-bs-btn bk-bs-btn-primary" data-bk-bs-dismiss="modal">'));
          _print(button);
          _print(_safe('</button>\n          '));
        } else {
          _print(_safe('\n            <button type="button" class="bk-bs-btn bk-bs-btn-default">'));
          _print(button);
          _print(_safe('</button>\n          '));
        }
        _print(_safe('\n        '));
      }
    
      _print(_safe('\n      </div>\n    </div>\n  </div>\n</div>\n'));
    
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
