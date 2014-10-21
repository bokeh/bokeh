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
      _print(_safe('<div class="bk-crossfilter-container">\n\n  <table>\n\n    <tr>\n\n      <td class="aligntable">\n\n        <div class="bk-crossfilter-configuration bk-bs-container">\n\n          <div class="bk-crossfilter-row">\n\n            <div class="col-md-5 bk-column-list" />\n\n            <div class="col-md-7 bk-filters-facets">\n\n              <div class="bk-bs-panel bk-bs-panel-primary bk-filters">\n                <div class="bk-bs-panel-heading bk-crossfilter-panel-heading"> Filter </div>\n                <div class="bk-bs-panel-body bk-filters-selections" />\n              </div>\n\n              <div class="bk-bs-panel bk-bs-panel-primary bk-facet bk-facet-x">\n                <div class="bk-bs-panel-heading bk-crossfilter-panel-heading"> Facet X </div>\n                <div class="bk-facets-selections " />\n              </div>\n\n              <div class="bk-bs-panel bk-bs-panel-primary bk-facet bk-facet-y">\n                <div class="bk-bs-panel-heading bk-crossfilter-panel-heading"> Facet Y </div>\n                <div class="bk-facets-selections " />\n              </div>\n\n              <div class="bk-bs-panel bk-bs-panel-primary bk-facet bk-facet-tab">\n                <div class="bk-bs-panel-heading bk-crossfilter-panel-heading"> Facet Tab (Coming Soon) </div>\n                <div class="bk-facets-selections " />\n              </div>\n\n            </div>\n\n          </div>\n\n        </div>\n\n      </td>\n\n      <td class="aligntable">\n\n        <div class="bk-plot-selection">\n\n          <form class="bk-widget-form">\n            <ul class="bk-crossfilter-selector">\n              <li class="bk-plot-selector col-md-3"> </li>\n              <li class="bk-x-selector col-md-3"> </li>\n              <li class="bk-y-selector col-md-3"> </li>\n              <li class="bk-agg-selector col-md-3"> </li>\n            </ul>\n          </form>\n\n        </div>\n\n        <div class="bk-plot" />\n      </td>\n\n    </tr>\n\n  </table>\n\n</div>\n'));
    
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
