(function() {
  define(["underscore"], function(_) {
    var monkey_patch;
    monkey_patch = function() {
      return _.uniqueId = function(prefix) {
        var hexDigits, i, s, uuid, _i;
        s = [];
        hexDigits = "0123456789ABCDEF";
        for (i = _i = 0; _i <= 31; i = ++_i) {
          s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        s[12] = "4";
        s[16] = hexDigits.substr((s[16] & 0x3) | 0x8, 1);
        uuid = s.join("");
        if (prefix) {
          return prefix + "-" + uuid;
        } else {
          return uuid;
        }
      };
    };
    _.isNullOrUndefined = function(x) {
      return _.isNull(x) || _.isUndefined(x);
    };
    _.setdefault = function(obj, key, value) {
      if (_.has(obj, key)) {
        return obj[key];
      } else {
        obj[key] = value;
        return value;
      }
    };
    return {
      "monkey_patch": monkey_patch
    };
  });

}).call(this);

/*
//@ sourceMappingURL=custom.js.map
*/