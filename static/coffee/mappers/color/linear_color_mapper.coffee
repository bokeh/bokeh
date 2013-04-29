HasProperties = require('../../base').HasProperties


class LinearColorMapper extends HasProperties

  initialize: (attrs, options) ->
    super(attrs, options)
    @low           = options.low
    @high          = options.high
    @palette       = @_build_palette(options.palette)
    @little_endian = @_is_little_endian()

  v_map_screen: (data) ->
    buf = new ArrayBuffer(data.length * 4);
    color = new Uint32Array(buf);

    max = -Infinity;
    min =  Infinity
    value = 0
    for i in [0..data.length-1]
      value = data[i];
      if (value > max)
        max = value;
      if (value < min)
        min = value;

    if @low?
      low = @low
    else
      low = min
    if @high?
      high = @high
    else
      high = max

    N = @palette.length - 1
    scale = N/(high-low)
    offset = -scale*low

    if @little_endian
      for i in [0..data.length-1]
        d = data[i]
        if (d > high)
          d = high
        if (d < low)
          d = low
        value = @palette[Math.floor(d*scale+offset)]
        color[i] =
          (0xff << 24)               | # alpha
          ((value & 0xff0000) >> 16) | # blue
          (value & 0xff00)           | # green
          ((value & 0xff) << 16);      # red

    else
      for i in [0..data.length-1]
        d = data[i]
        if (d > high)
          d = high
        if (d < low)
          d = low
        value = @palette[Math.floor(d*scale+offset)] # rgb
        color[i] = (value << 8) | 0xff               # alpha

    return buf

  _is_little_endian: () ->
    buf = new ArrayBuffer(4);
    buf8 = new Uint8ClampedArray(buf);
    buf32 = new Uint32Array(buf);
    buf32[1] = 0x0a0b0c0d;

    little_endian = true;
    if (buf8[4]==0x0a && buf8[5]==0x0b && buf8[6]==0x0c && buf8[7]==0x0d)
      little_endian = false;
    return little_endian

  _build_palette: (palette) ->
    new_palette = new Uint32Array(palette.length+1)
    for i in [0..palette.length-1]
      new_palette[i] = palette[i]
    new_palette[new_palette.length-1] = palette[palette.length-1]
    return new_palette

exports.LinearColorMapper = LinearColorMapper
