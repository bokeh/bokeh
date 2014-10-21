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
      var column, idx, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
    
      _print(_safe('<table class="bk-bs-table bk-bs-table-bordered">\n  <thead>\n    '));
    
      if (this.counts) {
        _print(_safe('\n      <th>counts</th>\n    '));
      }
    
      _print(_safe('\n    <th>index</th>\n    '));
    
      _ref = this.columns;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        column = _ref[_i];
        _print(_safe('\n      '));
        if (!this.skip[column]) {
          _print(_safe('\n        <th style="white-space: nowrap;" data-cdx-column="'));
          _print(column);
          _print(_safe('">\n          <a class="pandascolumn">'));
          _print(column);
          _print(_safe('</a>\n          '));
          if (this.sort_ascendings[column] === true) {
            _print(_safe('\n            <i class="cdx-column-sort fa fa-sort-up"></i>\n          '));
          } else if (this.sort_ascendings[column] === false) {
            _print(_safe('\n            <i class="cdx-column-sort fa fa-sort-down"></i>\n          '));
          } else {
            _print(_safe('\n            <i class="cdx-column-sort fa fa-sort"></i>\n          '));
          }
          _print(_safe('\n        </th>\n      '));
        }
        _print(_safe('\n    '));
      }
    
      _print(_safe('\n  </thead>\n  '));
    
      _ref1 = _.range(this.length);
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        idx = _ref1[_j];
        _print(_safe('\n  <tr class="pandasrow" rownum="'));
        _print(idx);
        _print(_safe('">\n    '));
        if (this.selected && this.selected[idx]) {
          _print(_safe('\n      <td style="background-color:'));
          _print(this.colors[idx]);
          _print(_safe('">\n        '));
          _print(this.selected[idx]);
          _print(_safe('/'));
          _print(this.counts[idx]);
          _print(_safe('\n      </td>\n    '));
        } else {
          _print(_safe('\n      <td> '));
          _print(this.counts[idx]);
          _print(_safe(' </td>\n    '));
        }
        _print(_safe('\n    <td> '));
        _print(this.index[idx]);
        _print(_safe(' </td>\n    '));
        _ref2 = this.columns;
        for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
          column = _ref2[_k];
          _print(_safe('\n      '));
          if (!this.skip[column]) {
            _print(_safe('\n      <td> '));
            _print(this.data[column][idx]);
            _print(_safe(' </td>\n      '));
          }
          _print(_safe('\n    '));
        }
        _print(_safe('\n  </tr>\n  '));
      }
    
      _print(_safe('\n</table>\n<form>\n  <center>\n    <ul class="pagination">\n      <li><a href="javascript://" class="cdx-go-first">First</a></li>\n      <li><a href="javascript://" class="cdx-go-prev">Previous</a></li>\n      <li><a href="javascript://" class="cdx-go-next">Next</a></li>\n      <li><a href="javascript://" class="cdx-go-last">Last</a></li>\n    </ul>\n    <div class="paginatedisplay">\n      Show <input type="text" class="pandassize" value="'));
    
      _print(this.length);
    
      _print(_safe('"> records\n      From <input type="text" class="pandasoffset" value="'));
    
      _print(this.offset);
    
      _print(_safe('">\n      to '));
    
      _print(this.length + this.offset);
    
      _print(_safe(' -\n      Total: '));
    
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
