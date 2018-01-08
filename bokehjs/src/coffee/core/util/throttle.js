/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _delay_animation = f => f();

const delay_animation = (typeof window !== 'undefined' && window !== null ? window.requestAnimationFrame : undefined) ||
        (typeof window !== 'undefined' && window !== null ? window.mozRequestAnimationFrame : undefined) || (typeof window !== 'undefined' && window !== null ? window.webkitRequestAnimationFrame : undefined) ||
        (typeof window !== 'undefined' && window !== null ? window.msRequestAnimationFrame : undefined) || _delay_animation;

// Returns a function, that, when invoked, will only be triggered at
// most once during a given window of time.
//
// In addition, if the browser supports requestAnimationFrame, the
// throttled function will be run no more frequently than request
// animation frame allows.
//
// @param func [function] the function to throttle
// @param wait [number] time in milliseconds to use for window
// @return [function] throttled function
//
export const throttle = function(func, wait) {
  let [context , args, timeout, result] = Array.from([null, null, null, null]);
  let previous = 0;
  let pending = false;
  const later = function() {
    previous = new Date;
    timeout = null;
    pending = false;
    return result = func.apply(context, args);
  };

  return function() {
    const now = new Date;
    const remaining = wait - (now - previous);
    context = this;
    args = arguments;
    if ((remaining <= 0) && !pending) {
      clearTimeout(timeout);
      pending = true;
      delay_animation(later);
    } else if (!timeout && !pending) {
      timeout = setTimeout((() => delay_animation(later)), remaining);
    }
    return result;
  };
};
