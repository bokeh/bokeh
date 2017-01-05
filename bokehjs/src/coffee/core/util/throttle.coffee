_delay_animation = (f) ->
  return f()

delay_animation = window?.requestAnimationFrame ||
        window?.mozRequestAnimationFrame || window?.webkitRequestAnimationFrame ||
        window?.msRequestAnimationFrame || _delay_animation

# Returns a function, that, when invoked, will only be triggered at
# most once during a given window of time.
#
# In addition, if the browser supports requestAnimationFrame, the
# throttled function will be run no more frequently than request
# animation frame allows.
#
# @param func [function] the function to throttle
# @param wait [number] time in milliseconds to use for window
# @return [function] throttled function
#
export throttle = (func, wait) ->
  [context , args, timeout, result] = [null, null, null, null]
  previous = 0
  pending = false
  later = () ->
    previous = new Date
    timeout = null
    pending = false
    result = func.apply(context, args)

  return () ->
    now = new Date
    remaining = wait - (now - previous)
    context = this
    args = arguments
    if (remaining <= 0 and !pending)
      clearTimeout(timeout)
      pending = true
      delay_animation(later)
    else if (!timeout and !pending)
      timeout = setTimeout((-> delay_animation(later)), remaining)
    return result
