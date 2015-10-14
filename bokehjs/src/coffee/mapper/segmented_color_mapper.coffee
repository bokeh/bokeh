_ = require "underscore"
HasProperties = require "../common/has_properties"

class SegmentedColorMapper extends HasProperties

  initialize: (attrs, options) ->
    super(attrs, options)
    @palette             = @_build_palette(@get('palette'))
    @alpha               = @_rescale_alpha(@get('alpha'))
    @interpolationMethod = @get('interpolationMethod')
    @little_endian       = @_is_little_endian()
    @segments            = null
    if @get('segments')?
      @segments = @get('segments')

  generate_linear_interpolation: () ->
    # Extract the keys from the palette which are the break points
    breaks = @segments
    breaks_sorted = _.sortBy(breaks)

    # Extract the colors from the palette which are correlated to the break points
    colors = @palette

    # Align the colors based on the sorted breaks
    colors_sorted = new Uint32Array(colors.length)
    for i in _.range(breaks_sorted.length)
      unsortedindex = _.findIndex(breaks, (x)->
        return x == breaks_sorted[i]
      )
      if unsortedindex == -1
        raise('Unable to locate sorted break')
      colors_sorted[i] = colors[unsortedindex]

    breaks = breaks_sorted
    colors = colors_sorted

    # Extract the individual shades from the colors.  Do this here id save
    # cpu cycles since it will only be done once in the generator.
    reds = new Uint8ClampedArray(colors.length)
    greens = new Uint8ClampedArray(colors.length)
    blues = new Uint8ClampedArray(colors.length)
    alphas = new Uint8ClampedArray(colors.length)

    for i in _.range(colors.length)
      reds[i] = (colors[i] & 0xff0000) >> 16
      greens[i] = (colors[i] & 0xff00) >> 8
      blues[i] = (colors[i] & 0xff)
      alphas[i] = @alpha[i]

    # Determine the min and the max values of the breaks 
    breaks_min = Math.min.apply(null, breaks)
    breaks_max = Math.max.apply(null, breaks)

    # Initialize the return variable
    ret = null

    intermediateReturn = (interpolation_function, endian_combining_function) ->
      ret = (value) -> 
        # See if we are above the highest or lower than the lowest?
        # If we are greater than or less than, then the result will
        # be to have all values greater or less than to be colored
        # with either the highest or the lowest color, respectively.
        # (Jezz I am wordy)
        if(value > breaks_max)
          value = breaks_max

        if(value < breaks_min)
          value = breaks_min

        # Initialize the color variable
        red = null
        blue = null
        green = null
        alpha = null

        [red, green, blue, alpha] = interpolation_function(value, breaks, reds, greens, blues, alphas)

        color = endian_combining_function(red, blue, green, alpha)

        return(color)

    color_combination_little_endian = (red, blue, green, alpha) ->
      return (alpha << 24) | (blue << 16) | (green << 8) | (red)

    color_combination_big_endian = (red, blue, green, alpha) ->
      return (blue << 24) | (green << 16) | (red << 8) | (alpha)

    interpolator_linear = (value, breaks, reds, greens, blues, alphas) ->
      # See if we exaclty equal a break, if we do then return the associated color
      ind = _.findIndex(breaks, (x) -> 
        return x == value
      )
      if(ind != -1)
        color = colors[ind]
        red = reds[ind]
        green = greens[ind]
        blue = blues[ind]
        alpha = alphas[ind]
      else
        # We do not equal one of the breaks, therefore we must 
        # interpolate now to get the right color

        # Determine which two breaks we are inbetween
        ind = _.findIndex(breaks, (x) ->
          return value < x
        )

        break_start = breaks[ind-1]
        break_stop = breaks[ind]

        # Determine how far inbetween
        frac_shift = (value - break_start) / (break_stop - break_start)

        # Interpolate between the different colors by the correct amount
        red_start = reds[ind-1]
        red_stop = reds[ind]
        red = ((red_stop - red_start)*frac_shift) + red_start

        green_start = greens[ind-1]
        green_stop = greens[ind]
        green = ((green_stop - green_start)*frac_shift) + green_start

        blue_start = blues[ind-1]
        blue_stop = blues[ind]
        blue = ((blue_stop - blue_start)*frac_shift) + blue_start

        alpha_start = alphas[ind-1]
        alpha_stop = alphas[ind]
        alpha = ((alpha_stop - alpha_start)*frac_shift) + alpha_start
      return([red, green, blue, alpha])

    interpolator_step = (value, breaks, reds, greens, blues, alphas) ->
      # See if we exaclty equal a break, if we do then return the associated color
      ind = _.findLastIndex(breaks, (x) -> 
        return value >= x
      )

      red = reds[ind]
      green = greens[ind]
      blue = blues[ind]
      alpha = alphas[ind]

      return([red, green, blue, alpha])

    endian_combiner = null
    interpolator = null

    if @little_endian
      endian_combiner = color_combination_little_endian
    else
      endian_combiner = color_combination_big_endian

    if @interpolationMethod == 'linear'
      interpolator = interpolator_linear

    if @interpolationMethod == 'step'
      interpolator = interpolator_step

    if (endian_combiner != null) & (interpolator != null)
      ret = intermediateReturn(interpolator, endian_combiner)

    return(ret)

  v_map_screen: (data) ->
    buf = new ArrayBuffer(data.length * 4)
    color = new Uint32Array(buf)

    # Test to see if the 'segments' variable existst.
    # if it does not we need to set it to the appropriate
    # values for the data
    if @segments == null 
      # We need to use the data to set the limits
      @segments = [_.min(data), _.max(data)]

    # Equally spread the segment points throughout the color space
    if (@segments.length == 2) & (@palette.length > 2)
      segments_0 = @segments[0]
      segments_1 = @segments[1]
      @segments = _.range(segments_0, segments_1, (segments_1 - segments_0)/(@palette.length - 1))
      @segments[@palette.length - 1] = segments_1

    interp = @generate_linear_interpolation()

    for i in [0...data.length]
      d = data[i]
      color[i] = interp(d)

    return buf

  _is_little_endian: () ->
    buf = new ArrayBuffer(4)
    buf8 = new Uint8ClampedArray(buf)
    buf32 = new Uint32Array(buf)
    buf32[1] = 0x0a0b0c0d

    little_endian = true
    if (buf8[4]==0x0a && buf8[5]==0x0b && buf8[6]==0x0c && buf8[7]==0x0d)
      little_endian = false
    return little_endian

  _build_palette: (palette) ->
    new_palette = []
    _convert = (value) ->
      if _.isNumber(value)
        return value
      else
        return parseInt(value.slice(1), 16)
    
    for i in _.range(palette.length)
      new_palette[i] = _convert(palette[i])

    return new_palette

  _rescale_alpha: (alpha) ->
    new_alpha = new Uint8ClampedArray(alpha.length)
    _convert = (value) ->
      return 255 * value

    for i in _.range(alpha.length)
      new_alpha[i] = _convert(alpha[i])

    return(new_alpha)

module.exports =
  Model: SegmentedColorMapper