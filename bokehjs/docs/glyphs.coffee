
#  * [annular_wedge](#annular_wedge)
#  * [annulus](#annulus)
#  * [arc](#arc)
#  * [asterisk](#asterisk)
#  * [bezier](#bezier)
#  * [circle](#circle)
#  * [circle_cross](#circle_cross)
#  * [circle_x](#circle_x)
#  * [cross](#cross)
#  * [diamond](#diamond)
#  * [diamond_cross](#diamond_cross)
#  * [image](#image)
#  * [image_rgba](#image_rgba)
#  * [image_uri](#image_uri)
#  * [inverted_triangle](#inverted_triangle)
#  * [line](#line)
#  * [multi_line](#multi_line)
#  * [oval](#oval)
#  * [patch](#patch)
#  * [patches](#patches)
#  * [quad](#quad)
#  * [quadratic](#quadratic)
#  * [ray](#ray)
#  * [rect](#rect)
#  * [segment](#segment)
#  * [square](#square)
#  * [square_cross](#square_cross)
#  * [square_x](#square_x)
#  * [text](#text)
#  * [triangle](#triangle)
#  * [wedge](#wedge)
#  * [x](#x)



# <a name="annular_wedge"></a>
# ### annular_wedge
#  * `x`, `y`
#  * `start_radius`, `end_radius`
#  * `start_angle`, `end_angle`
#  * `direction`
#    - values ``['clock', 'anticlock']`` (default: ``'anticlock'``)
#  * [line properties]()
#  * [fill properties]()
{
  type: 'annular_wedge'
  x: 'xdata'
  y: 'ydata'
  start_radius: 5
  end_radius: 10
  start_angle: "starts"
  end_angle: "ends"
}

# <a name="annulus"></a>
# ### annulus
#  * `x`, `y`
#  * `start_radius`, `end_radius`
#  * [line properties]()
#  * [fill properties]()
{
  type: 'annulus'
  x: 'xdata'
  y: 'ydata'
  start_radius: 5
  end_radius: 10
}

# <a name="arc"></a>
# ### arc
#  * `x`, `y`
#  * `radius`
#  * `start_angle`, `end_angle`
#  * `direction`
#    - values ``['clock', 'anticlock']`` (default: ``'anticlock'``)
#  * [line properties]()
{
  type: 'arc'
  x: 'xdata'
  y: 'ydata'
  radius: 5
  start_angle: "starts"
  end_angle: "ends"
}

# <a name="asterisk"></a>
# ### asterisk
#  * `x`, `y`
#  * `size`
#  * [line properties]()
{
  type: 'asterisk'
  x: 'xdata'
  y: 'ydata'
  size: 5
}

# <a name="bezier"></a>
# ### bezier
#  * `x0`, `y0`
#  * `x1`, `y1`
#  * `cx0`, `cy0`
#  * `cx1`, `cy1`
#  * [line properties]()
{
  type: 'bezier'
  x0: 'x0s'
  y0: 'y0s'
  x1: 'x1s'
  y1: 'y1s'
  cx0: 'control_x0s'
  cy0: 'control_y0s'
  cx1: 'control_x1s'
  cy1: 'control_y1s'
}

# <a name="circle"></a>
# ### circle
#  * `x`, `y`
#  * `radius`
#  * [fill properties]()
#  * [line properties]()
{
  type: 'circle'
  x: 'xdata'
  y: 'ydata'
  radius: 5
}

# <a name="circle_cross"></a>
# ### circle_cross
#  * `x`, `y`
#  * `size`
#  * [fill properties]()
#  * [line properties]()
{
  type: 'circle_cross'
  x: 'xdata'
  y: 'ydata'
  size: 5
}

# <a name="circle_x"></a>
# ### circle_x
#  * `x`, `y`
#  * `size`
#  * [fill properties]()
#  * [line properties]()
{
  type: 'circle_x'
  x: 'xdata'
  y: 'ydata'
  size: 5
}

# <a name="cross"></a>
# ### cross
#  * `x`, `y`
#  * `size`
#  * [line properties]()
{
  type: 'cross'
  x: 'xdata'
  y: 'ydata'
  size: 5
}

# <a name="diamond"></a>
# ### diamond
#  * `x`, `y`
#  * `size`
#  * [fill properties]()
#  * [line properties]()
{
  type: 'diamond'
  x: 'xdata'
  y: 'ydata'
  size: 5
}

# <a name="diamond_cross"></a>
# ### diamond_cross
#  * `x`, `y`
#  * `size`
#  * [fill properties]()
#  * [line properties]()
{
  type: 'diamond_cross'
  x: 'xdata'
  y: 'ydata'
  size: 5
}

# <a name="image">
# ### image
#  * image
#  * width, height
#  * `x`, `y`
#  * dw, dh
#  * palette
{
  type: 'image'
  image: 'image_data'
  width: 300
  height: 400
  x: 5
  y: 8
  palette: "Spectral"
}

# <a name="image_rgba">
# ### image_rgba
#  * `image`
#  * `width`, `height`
#  * `x`, `y`
#  * dw, dh
{
  type: 'image_rgba'
  image: 'rgba_data'
  width: 300
  height: 400
  x: 5
  y: 8
}

# <a name="image_uri">
# ### image_uri
#  * `x`, `y`
#  * `url`
#  * `angle`
{
  type: 'image_uri'
  x: 5
  y: 8
  url: "http://foo.bar/baz.png"
}

# <a name="inverted_triangle"></a> inverted_triangle
# ### inverted_triangle
#  * `x`, `y`
#  * `size`
#  * [fill properties]()
#  * [line properties]()
{
  type: 'inverted_triangle'
  x: 'xdata'
  y: 'ydata'
  size: 5
}

# <a name="line"></a>
# ### line
#  * `x`, `y`
#  * [line properties]()
{
  type: 'line'
  x: 'xdata'
  y: 'ydata'
}

# <a name="multi_line"></a>
# ### multi_line
#  * `xs`, `ys`
#  * [line properties]()
{
  type: 'multi_line'
  xs: 'xdata'
  ys: 'ydata'
}

# <a name="oval"></a>
# ### oval
#  * `x`, `y`
#  * `width`, `height`
#  * `angle` (default: 0)
#  * [fill properties]()
#  * [line properties]()
{
  type: 'oval'
  x: 'xdata'
  y: 'ydata'
  width: 'widths'
  height: 10
  angle: pi/4
}

# <a name="patch"></a>
# ### patch
#  * `x`, `y`
#  * [line properties]()
{
  type: 'patch'
  x: 'xdata'
  y: 'ydata'
}

# <a name="patches"></a>
# ### patches
#  * `xs`, `ys`
#  * [line properties]()
{
  type: 'patches'
  xs: 'xdata'
  ys: 'ydata'
}

# <a name="quad"></a>
# ### quad
#  * `left`
#  * `right`
#  * `top`
#  * `bottom`
#  * [fill properties]()
#  * [line properties]()
{
  type: 'quad'
  left: 'lefts'
  right: 'rights'
  top: 2
  bottom: 6
}

# <a name="quadratic"></a>
# ### quadratic
#  * `x0`, `y0`
#  * `x1`, `y1`
#  * `cx`, `cy`
#  * [line properties]()
{
  type: 'quadratic'
  x0: 'x0s'
  y0: 'y0s'
  x1: 'x1s'
  y1: 'y1s'
  cx: 'control_xs'
  cy: 'control_ys'
}

# <a name="ray"></a>
# ### ray
#  * x0, y0
#  * length
#  * `angle`
#  * [line properties]()
{
  type: 'ray'
  x0: 'x0'
  y0: 'y0'
  length: 20
  angle: 'angles'
}

# <a name="rect"></a>
# ### rect
#  * `x`, `y`
#  * `width`, `height`
#  * `angle` (default: 0)
#  * [fill properties]()
#  * [line properties]()
{
  type: 'rect'
  x: 'x'
  y: 'y'
  width: 2
  height: 6
  size: 5
}

# <a name="segment"></a>
# ### segment
#  * `x0`, `y0`
#  * `x1`, `y1`
#  * [line properties]()
{
  type: 'segment'
  x0: 'x0'
  y0: 'y0'
  x1: 6
  y1: 'y1'
}

# <a name="square"></a>
# ### square
#  * `x`, `y`
#  * `size`
#  * [fill properties]()
#  * [line properties]()
{
  type: 'square'
  x: 'xdata'
  y: 'ydata'
  size: 5
}

# <a name="square_cross"></a>
# ### square_cross
#  * `x`, `y`
#  * `size`
#  * [fill properties]()
#  * [line properties]()
{
  type: 'square_cross'
  x: 'xdata'
  y: 'ydata'
  size: 5
}

# <a name="square_x"></a>
# ### square_x
#  * `x`, `y`
#  * `size`
#  * [fill properties]()
#  * [line properties]()
{
  type: 'square_x'
  x: 'xdata'
  y: 'ydata'
  size: 5
}

# <a name="text"></a>
# ### text
#  * `x`, `y`
#  * `text`
#  * `angle` (default: 0)
#  * [text properties]()
{
  type: 'text'
  x: 'xdata'
  y: 'ydata'
  text: "foo bar baz"
}

# <a name="wedge"></a>
# ### wedge
#  * `x`, `y`
#  * `radius`
#  * `start_angle`, `end_angle`
#  * `direction`
#    - values ``['clock', 'anticlock']`` (default: ``'anticlock'``)
#  * [fill properties]()
#  * [line properties]()
{
  type: 'wedge'
  x: 'xdata'
  y: 'ydata'
  radius: 5
  start_angle: "starts"
  end_angle: "ends"
}


# <a name="x"></a> x
# ### x
#  * `x`, `y`
#  * `size`
#  * [line properties]()
{
  type: 'x'
  x: 'xdata'
  y: 'ydata'
  size: 5
}
