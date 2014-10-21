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
      _print(_safe('<div class="bk-bs-modal-dialog">\n  <div class="bk-bs-modal-content">\n    <div class="bk-bs-modal-header">\n      <button type="button" class="bk-bs-close" data-bk-bs-dismiss="modal">&times;</button>\n      <h4 class="bk-bs-modal-title">Image Preview (right click -> \'Save As\' to save PNG)</h4>\n    </div>\n    <div class="bk-bs-modal-body">\n      <img style="max-height: 300px; max-width: 400px">\n    </div>\n    <div class="bk-bs-modal-footer">\n      <button type="button" class="bk-bs-btn bk-bs-btn-primary" data-bk-bs-dismiss="modal">Close</button>\n    </div>\n  </div>\n</div>'));
    
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
