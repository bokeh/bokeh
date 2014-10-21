(function() {
  define([], function() {
    var LEVELS, delay_animation, throttle_animation, _delay_animation;
    LEVELS = ['image', 'underlay', 'glyph', 'overlay', 'annotation', 'tool'];
    _delay_animation = function(f) {
      return f();
    };
    delay_animation = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || _delay_animation;
    throttle_animation = function(func, wait) {
      var args, context, later, pending, previous, result, timeout, _ref;
      _ref = [null, null, null, null], context = _ref[0], args = _ref[1], timeout = _ref[2], result = _ref[3];
      previous = 0;
      pending = false;
      later = function() {
        previous = new Date;
        timeout = null;
        pending = false;
        return result = func.apply(context, args);
      };
      return function() {
        var now, remaining;
        now = new Date;
        remaining = wait - (now - previous);
        context = this;
        args = arguments;
        if (remaining <= 0 && !pending) {
          clearTimeout(timeout);
          pending = true;
          delay_animation(later);
        } else if (!timeout) {
          timeout = setTimeout((function() {
            return delay_animation(later);
          }), remaining);
        }
        return result;
      };
    };
    return {
      "LEVELS": LEVELS,
      "throttle_animation": throttle_animation
    };
  });

}).call(this);

/*
//@ sourceMappingURL=plot_utils.js.map
*/