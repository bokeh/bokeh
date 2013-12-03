require(['main'], (Bokeh) ->
  data = {
    x: [1, 2, 3, 4, 5]
    y: [5, 4, 3, 2, 1]
    y2: [4, 5, 3, 5.5, 2]
    small_size: [0.2, 0.3, 0.4, 0.5, 0.6]
    large_size: [5, 10, 15, 20, 25]
    angle: [0.5, 1, 1.5, 2, 2.5]
    colors: ['pink', 'orange', 'red', 'blue', 'green']
    alpha: [0.6, 0.5, 0.4, 0.3, 0.2]
    width: [0.2, 0.4, 0.6, 0.8, 1]
    height: [1, 0.8, 0.6, 0.4, 0.2]
    lw: [1, 2, 3, 4, 5]
  }

  make_plot = Bokeh.Plotting.make_plot

  options = {
    dims: [400, 400]
    xrange: [0, 6]
    yrange: [0, 6]
    xaxes: "min"
    yaxes: "min"
    tools: false
    legend: false
  }


  annular_wedge = {
    type: 'annular_wedge'
    x: 'x' 
    y: 'y'
    fill_color: 'colors'
    line_color: 'colors'
    fill_alpha: 'alpha'
    inner_radius: 0.3
    outer_radius: 0.7
    start_angle: 0
    end_angle: 'angle'
  }

  options.title = 'Annular Wedges'
  plot = make_plot(annular_wedge, data, options)
  Bokeh.Plotting.show(plot)


  annulus = {
    type: 'annulus'
    x: 'x' 
    y: 'y'
    fill_color: 'colors'
    line_color: 'colors'
    fill_alpha: 'alpha'
    inner_radius: 'small_size'
    outer_radius: 0.8
  }

  options.title = 'Annulus'
  plot2 = make_plot(annulus, data, options)
  Bokeh.Plotting.show(plot2)

  arc = {
    type: 'arc'
    x: 'x'
    y: 'y'
    line_width: 'lw'
    line_color: 'colors'
    radius: 20            # for some reason, radius is in pixels.
    start_angle: 0
    end_angle: 2
  }

  options.title = 'Arc'
  plot3 = make_plot(arc, data, options)
  Bokeh.Plotting.show(plot3)

  asterisk = {
    type: 'asterisk'
    x: 'x'
    y: 'y'
    line_color: 'colors'
    size: 'small_size'
  }

  options.title = 'Asterisk'
  plot4 = make_plot(asterisk, data, options)
  Bokeh.Plotting.show(plot4)

  # bezier = {
  #   type: 'bezier'
  #   x0: 'x'
  #   y0: 'y'
  #   line_color: 'colors'
  #   size: 'size'
  # }

  # options.title = "Bezier"
  # plot5 = make_plot(bezier, data, options)
  # Bokeh.Plotting.show(plot5)

  circle = {
    type: 'circle'
    x: 'x'
    y: 'y'
    radius: 'large_size'
    fill_color: 'colors'
    line_color: 'colors'
    fill_alpha: 'alpha'
    line_width: 'lw'
  }

  options.title = 'Circle'
  plot6 = make_plot(circle, data, options)
  Bokeh.Plotting.show(plot6)

  circle_cross = {
    type: 'circle_cross'
    x: 'x'
    y: 'y'
    size: 'small_size'
    fill_color: 'white'
    line_width: 2
    line_color: 'colors'
  }

  options.title = 'Circle Cross'
  plot7 = make_plot(circle_cross, data, options)
  Bokeh.Plotting.show(plot7)


  circle_x = {
    type: 'circle_x'
    x: 'x'
    y: 'y'
    size: 'small_size'
    fill_color: 'white'
    line_width: 2
    line_color: 'colors'
  }

  options.title = "Circle X"
  plot8 = make_plot(circle_x, data, options)
  Bokeh.Plotting.show(plot8)

  cross = {
    type: 'cross'
    x: 'x'
    y: 'y'
    size: 'small_size'
    line_width: 2
    line_color: 'colors'
  }

  options.title = 'Cross'
  plot9 = make_plot(cross, data, options)
  Bokeh.Plotting.show(plot9)


  diamond = {
    type: 'diamond'
    x: 'x'
    y: 'y'
    size: 'small_size'
    line_width: 2
    fill_color: 'colors'
    fill_alpha: 'alpha'
    line_color: 'colors'
  }

  options.title = 'Diamond'
  plot10 = make_plot(diamond, data, options)
  Bokeh.Plotting.show(plot10)

  diamond_cross = {
    type: 'diamond_cross'
    x: 'x'
    y: 'y'
    size: 'small_size'
    fill_color: 'white'
    line_width: 2
    line_color: 'colors'
  }

  options.title = 'Diamond Cross'
  plot11 = make_plot(diamond_cross, data, options)
  Bokeh.Plotting.show(plot11)

  # image = {

  # }

  # options.title = 'Image'
  # plot12 = make_plot(diamond_cross, data, options)
  # Bokeh.Plotting.show(plot12)


  inverted_triangle = {
     type: 'inverted_triangle'
     x: 'x'
     y: 'y'
     size: 'small_size'
     line_width: 2
     fill_color: 'colors'
     fill_alpha: 'alpha'
     line_color: 'colors'
  }

  options.title = 'Inverted Triangle'
  plot12 = make_plot(inverted_triangle, data, options)
  Bokeh.Plotting.show(plot12)

  line = {
    type: 'line'
    x: 'x'
    y: 'y2'
    line_width: 2
    line_dash: [5, 2]
    line_color: '#43A2CA'
  }

  options.title = 'Line'
  plot13 = make_plot(line, data, options)
  Bokeh.Plotting.show(plot13)
  
  # rect = {
  #   type: 'rect'
  #   x: 'x'
  #   y: 'y'
  #   angle: 'angle'
  #   width: 'width'
  #   height: 'height'
  #   fill_alpha: 'alpha'
  #   fill_color: 'colors'
  #   line_color: 'colors'
  # }

  # options.title = 'Rects'
  # plot = make_plot(rect, data, options)
  # Bokeh.Plotting.show(plot)

  # square = {
  #   type: 'square'
  #   x: 'x'
  #   y: 'y'
  #   size: 'size'
  #   angle: 'angle'
  #   fill_alpha: 'alpha'
  #   fill_color: 'colors'
  #   line_color: 'colors'
  # }

  # options.title = 'Squares'
  # plot2 = make_plot(square, data, options)
  # Bokeh.Plotting.show(plot2)
  



  

)