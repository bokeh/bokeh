base = require("../base")
Collections = base.Collections
testutils = require("../testutils")
line_plot = testutils.line_plot
scatter_plot = testutils.scatter_plot
glyph_plot = testutils.glyph_plot

test('circles_glyph', () ->
  expect(0)
  data_source = Collections('ObjectArrayDataSource').create(
    data : [
      {x : 1, y : 5, z:3, radius:10},
      {x : 2, y : 4, z:3},
      {x : 3, y : 3, z:3, color:"red"},
      {x : 4, y : 2, z:3, radius:8, alpha:0.5},
      {x : 5, y : 1, z:3},
    ]
  )
  plot_model = Collections('Plot').create()
  xdr = Collections('DataRange1d').create(
    sources : [{ref : data_source.ref(), columns : ['x']}]
  )
  ydr = Collections('DataRange1d').create(
    sources : [{ref : data_source.ref(), columns : ['y']}]
  )
  glyph_renderer = Collections('GlyphRenderer').create(
    data_source : data_source.ref()
    xdata_range : xdr.ref()
    ydata_range : ydr.ref()
    scatter_size : 10
    color : 'black'
    x : 'x'
    y : 'y'
    glyphs : [
        type : 'circles'
        #xfield: 'x'
        #yfield: 'y'
        #radiusfield: "radius"
        #radius: 5
        color: 'blue'
      ,
        #  type : 'circle'
        #  index : 0
        #,
        #  type : 'square'
        #  index : 1
        #,
        #  type : 'square'
        #  index : 2
        #  color : 'red'
        #,
          #  type : 'square'
          #  index : 2
          #  color : 'green'
          #  x : ['x', 0, 0.1]
          #,
          #  type : 'square'
          #  index : 2
          #  color : 'green'
          #  x : ['x', 0, -0.1]
    ]

  )
  xaxis = Collections('LinearAxis').create(
    orientation : 'bottom'
    parent : plot_model.ref()
    data_range : xdr.ref()
  )
  yaxis = Collections('LinearAxis').create(
    orientation : 'left',
    parent : plot_model.ref()
    data_range : ydr.ref()
  )
  plot_model.set(
    renderers : [glyph_renderer.ref()],
    axes : [xaxis.ref(), yaxis.ref()]
  )
  div = $('<div></div>')
  $('body').append(div)
  myrender  =  ->
    view = new plot_model.default_view(model : plot_model)
    div.append(view.$el)
    view.render()
  console.log('Test circles_glyph')
  _.defer(myrender)
)


test('line_glyph', () ->
  expect(0)
  data_source = Collections('ObjectArrayDataSource').create(
    data : [
      {x: 1, y: 4}
      {x: 2, y: 4}
      {x: 3, y: 3}
      {x: 4, y: 2}
      {x: 5, y: 2}
    ]
  )
  ds2 = Collections('ObjectArrayDataSource').create(
    data: [
      {x2: 1, y2: 1}
      {x2: 2, y2: 1.5}
      {x2: 2.5, y2: 3}
      {x2: 3, y2: 3.5}
      {x2: 3.5, y2: 2.8}
      {x2: 4, y2: 2.9}
      {x2: 5, y2: 3.5}
    ]
  )
  plot_model = Collections('Plot').create()
  xdr = Collections('DataRange1d').create(
    sources : [{ref : data_source.ref(), columns : ['x']},
               {ref : ds2.ref(), columns : ['x2']}]
  )
  ydr = Collections('DataRange1d').create(
    sources : [{ref : data_source.ref(), columns : ['y']},
               {ref : ds2.ref(), columns: ['y2']}]
  )
  glyph_renderer = Collections('GlyphRenderer').create(
    data_source : data_source.ref()
    xdata_range : xdr.ref()
    ydata_range : ydr.ref()
    glyphs : [
        type : 'line'
        line_width: 4
        line_color: 'red'
        alpha: 1
    ]
  )
  renderer2 = Collections('GlyphRenderer').create(
    data_source: ds2.ref()
    xdata_range : xdr.ref()
    ydata_range : ydr.ref()
    glyphs : [
        type : 'line'
        x: "x2"
        y: "y2"
        line_width: 2
        line_color: 'blue'
        alpha: 0.5
    ]
  )
  xaxis = Collections('LinearAxis').create(
    orientation : 'bottom'
    parent : plot_model.ref()
    data_range : xdr.ref()
  )
  yaxis = Collections('LinearAxis').create(
    orientation : 'left',
    parent : plot_model.ref()
    data_range : ydr.ref()
  )
  plot_model.set(
    renderers : [glyph_renderer.ref(), renderer2.ref()],
    axes : [xaxis.ref(), yaxis.ref()]
  )
  div = $('<div></div>')
  $('body').append(div)
  myrender  =  ->
    view = new plot_model.default_view(model : plot_model)
    div.append(view.$el)
    view.render()
  console.log('Test line_glyph')
  _.defer(myrender)
)

test('stacked_lines_glyph', () ->
  expect(0)
  data_source = Collections('ObjectArrayDataSource').create(
    data : [
      {x: 1, y0: 1, y1: 3}
      {x: 2, y0: 1.5, y1: 2}
      {x: 3, y0: 3.5, y1: 0.2}
      {x: 4, y0: 1.5, y1: 0.75}
      {x: 5, y0: 2.5, y1: 0.5}
    ]
  )
  plot_model = Collections('Plot').create()
  xdr = Collections('DataRange1d').create(
    sources : [{ref : data_source.ref(), columns : ['x']}]
  )
  ydr = Collections('DataRange1d').create(
    sources : [{ref : data_source.ref(), columns : ['y0','y1']}]
  )
  glyph_renderer = Collections('GlyphRenderer').create(
    data_source : data_source.ref()
    xdata_range : xdr.ref()
    ydata_range : ydr.ref()
    glyphs : [
        type : 'stacked_lines'
        x: 'x',
        y: ['y0', 'y1']
        fills: {
          y0:
            fill_color: "red"
            fill_alpha: 0.5
          y1:
            fill_color: "blue"
            fill_alpha: 0.5
        }
        lines: {
          y0:
            line_width: 1
            line_color: "black"
            line_alpha: 0.8
          y1:
            line_width: 1
            line_color: "black"
            line_alpha: 0.8
        }
    ]
  )
  xaxis = Collections('LinearAxis').create(
    orientation : 'bottom'
    parent : plot_model.ref()
    data_range : xdr.ref()
  )
  yaxis = Collections('LinearAxis').create(
    orientation : 'left',
    parent : plot_model.ref()
    data_range : ydr.ref()
  )
  plot_model.set(
    renderers : [glyph_renderer.ref()],
    axes : [xaxis.ref(), yaxis.ref()]
  )
  div = $('<div></div>')
  $('body').append(div)
  myrender  =  ->
    view = new plot_model.default_view(model : plot_model)
    div.append(view.$el)
    view.render()
  console.log('Test stacked_lines_glyph')
  _.defer(myrender)
)

test('stacked_rects_glyph', () ->
  expect(0)
  data_source = Collections('ObjectArrayDataSource').create(
    data : [
      {x: 1, y0: 1, y1: 3, y2: 1.5}
      {x: 2, y0: 1.5, y1: 2, y2: 1}
      {x: 3, y0: 6, y1: 0.1, y2: 0.1}
      {x: 4, y0: 1.5, y1: 0.75, y2: 1.25}
      {x: 5, y0: 2.5, y1: 0.5, y2: 1}
    ]
  )
  plot_model = Collections('Plot').create()
  xdr = Collections('DataRange1d').create(
    sources : [{ref : data_source.ref(), columns : ['x']}]
  )
  ydr = Collections('DataRange1d').create(
    sources : [{ref : data_source.ref(), columns : ['y0','y1','y2']}]
  )
  glyph_renderer = Collections('GlyphRenderer').create(
    data_source : data_source.ref()
    xdata_range : xdr.ref()
    ydata_range : ydr.ref()
    glyphs : [
        type : 'stacked_rects'
        x: 'x',
        y: ['y0', 'y1', 'y2']
        fills: {
          y0:
            fill_color: "red"
            fill_alpha: 0.5
          y1:
            fill_color: "blue"
            fill_alpha: 0.5
          y2:
            fill_color: "orange"
            fill_alpha: 0.5
        }
        lines: {
          y0:
            line_width: 1
            line_color: "black"
            line_alpha: 0.8
          y1:
            line_width: 1
            line_color: "black"
            line_alpha: 0.8
          y2:
            line_width: 1
            line_color: "black"
            line_alpha: 0.8
        }
    ]
  )
  xaxis = Collections('LinearAxis').create(
    orientation : 'bottom'
    parent : plot_model.ref()
    data_range : xdr.ref()
  )
  yaxis = Collections('LinearAxis').create(
    orientation : 'left',
    parent : plot_model.ref()
    data_range : ydr.ref()
  )
  plot_model.set(
    renderers : [glyph_renderer.ref()],
    axes : [xaxis.ref(), yaxis.ref()]
  )
  div = $('<div></div>')
  $('body').append(div)
  myrender  =  ->
    view = new plot_model.default_view(model : plot_model)
    div.append(view.$el)
    view.render()
  console.log('Test stacked_rects_glyph')
  _.defer(myrender)
)

test('rects_glyph', () ->
  expect(0)
  data_source = Collections('ObjectArrayDataSource').create(
    data : [
      {x: 1, y: 2, height: 0.5, width: 0.25}
      {x: 2, y: 3, height: 0.3, width: 0.3, color: "blue"}
      {x: 3, y: 4, height: 0.2, width: 0.35, outline_color: "none"}
      {x: 4, y: 3, height: 0.6, width: 0.4 }
      {x: 4.5, y: 3, height: 0.3, width: 0.4, angle: 20 }
      {x: 5, y: 5, height: 0.15, width: 0.4, alpha: 0.4}
    ]
  )
  plot_model = Collections('Plot').create()
  xdr = Collections('DataRange1d').create(
    sources : [{ref : data_source.ref(), columns : ['x']}]
  )
  ydr = Collections('DataRange1d').create(
    sources : [{ref : data_source.ref(), columns : ['y']}]
  )
  glyph_renderer = Collections('GlyphRenderer').create(
    data_source : data_source.ref()
    xdata_range : xdr.ref()
    ydata_range : ydr.ref()
    scatter_size : 10

    glyphs : [
        type : 'rects'
        x : 'x'
        color: 'red'
        outline_color: 'black'
      ,

        type : 'rects'
        color: 'gray'
        x: 'x'

        # Uncommenting the following block will cause all of the
        # Y values to be set to 2.5
        #y:
        #  field: 'bogus'
        #  default: 2.5
        #  units: 'data'

        # Uncommenting the following will set a fixed height and width
        # for every rect.(By specifying the name 'bogus' for the field,
        # we can be certain that none of the datapoints will override
        # this height value, and the default will always be used.)
        height:
          field: 'bogus'
          default: 12
          units: 'screen'
        width:
          field: 'bogus'
          default: 0.25
          units: 'data'
    ]

  )
  xaxis = Collections('LinearAxis').create(
    orientation : 'bottom'
    parent : plot_model.ref()
    data_range : xdr.ref()
  )
  yaxis = Collections('LinearAxis').create(
    orientation : 'left',
    parent : plot_model.ref()
    data_range : ydr.ref()
  )
  plot_model.set(
    renderers : [glyph_renderer.ref()],
    axes : [xaxis.ref(), yaxis.ref()]
  )
  div = $('<div></div>')
  $('body').append(div)
  myrender  =  ->
    view = new plot_model.default_view(model : plot_model)
    div.append(view.$el)
    view.render()
  console.log('Test rects_glyph')
  _.defer(myrender)
)

test('rects_glyph2', () ->
  expect(0)
  data_source = Collections('ObjectArrayDataSource').create(
    data : [
      {x : 1, y : 2, height: 0.5, width: 0.25}
      {x : 2, y : 3, height: 0.3, width: 0.3, color: "blue"}
      {x : 3, y : 4, height: 0.2, width: 0.35, outline_color: "none"}
      {x : 4, y : 3, height: 0.6, width: 0.4 }
      {x: 4.5, y: 3, height: 0.3, width: 0.4, angle: 20 }
      {x : 5, y : 5, height: 0.15, width: 0.4, alpha: 0.4}
    ]
  )
  renderer = Collections('GlyphRenderer').create(
    data_source : data_source.ref()

    glyphs : [
        type : 'rects'
        x : 'x'
        color: 'blue'
        outline_color: 'black'
      ,

        type : 'rects'
        color: 'gray'
        x: 'x'

        # Uncommenting the following block will cause all of the
        # Y values to be set to 2.5
        #y:
        #  field: 'bogus'
        #  default: 2.5
        #  units: 'data'

        # Uncommenting the following will set a fixed height and width
        # for every rect.(By specifying the name 'bogus' for the field,
        # we can be certain that none of the datapoints will override
        # this height value, and the default will always be used.)
        height:
          field: 'bogus'
          default: 12
          units: 'screen'
        width:
          field: 'bogus'
          default: 0.25
          units: 'data'
    ]

  )

  #glyph_plot(data_source, renderer, $('body'))
  plot_model = glyph_plot(data_source, renderer)
  div = $('<div></div>')
  $('body').append(div)
  myrender = ->
    div.append("<h2>rects_glyph_2</h2>")
    view = new plot_model.default_view(model: plot_model)
    div.append(view.$el)
    view.render()
  _.defer(myrender)

)


test('rect_regions_glyph_test', () ->
  expect(0)
  data_source = Collections('ObjectArrayDataSource').create(
    data : [
      {left: 1, right: 1.5, top: 1.5, bottom: 1.0}
      {left: 2, right: 2.6, top: 2.3, color: "blue"}
      {left: 3, right: 3.2, top: 3.2, outline_color: "none"}
      {left: 4, right: 4.2, top: 2.6, bottom: 1.0}
      {left: 4.8, right: 5.2, top: 2.6, alpha: 0.4}
    ]
  )
  plot_model = Collections('Plot').create()
  xdr = Collections('DataRange1d').create(
    sources : [{ref : data_source.ref(), columns : ['left', 'right']}]
  )
  ydr = Collections('DataRange1d').create(
    sources : [{ref : data_source.ref(), columns : ['bottom', 'top']}]
  )
  renderer = Collections('GlyphRenderer').create(
    data_source: data_source.ref()
    xdata_range: xdr.ref()
    ydata_range: ydr.ref()
    glyphs : [
      type : 'rectregions'
      left: 'left'
      right: 'right'
      bottom:
        field: 'bogus'
        default: 1.0
        units: 'data'

      color: 'red'
      outline_color: 'black'
    ]
  )
  xaxis = Collections('LinearAxis').create(
    orientation : 'bottom'
    parent : plot_model.ref()
    data_range : xdr.ref()
  )
  yaxis = Collections('LinearAxis').create(
    orientation : 'left',
    parent : plot_model.ref()
    data_range : ydr.ref()
  )
  plot_model.set(
    renderers : [renderer.ref()],
    axes : [xaxis.ref(), yaxis.ref()]
  )

  div = $('<div></div>')
  $('body').append(div)
  myrender = ->
    div.append("<h2>rect_regions_glyph_test</h2>")
    view = new plot_model.default_view(model: plot_model)
    div.append(view.$el)
    view.render()
  _.defer(myrender)
)


test('vector_data_test', () ->
  expect(0)
  data_source = Collections('ColumnDataSource').create(
    data : {
      x : [1, 2, 3, 4, 4.5, 5]
      y : [2, 3, 4, 3, 3, 5]
      height : [0.5, 0.3, 0.2, 0.6, 0.3, 0.15]
      width : [0.25, 0.3, 0.35, 0.4, 0.4, 0.4]
    }
  )
  renderer = Collections('GlyphRenderer').create(
    data_source : data_source.ref()

    glyphs : [
        type : 'rects'
        x : 'x'
        color: 'blue'
        outline_color: 'black'
      ,

        type : 'rects'
        color: 'gray'
        x: 'x'

        # Uncommenting the following block will cause all of the
        # Y values to be set to 2.5
        #y:
        #  field: 'bogus'
        #  default: 2.5
        #  units: 'data'

        # Uncommenting the following will set a fixed height and width
        # for every rect.(By specifying the name 'bogus' for the field,
        # we can be certain that none of the datapoints will override
        # this height value, and the default will always be used.)
        height:
          field: 'bogus'
          default: 12
          units: 'screen'
        width:
          field: 'bogus'
          default: 0.25
          units: 'data'
    ]

  )

  #glyph_plot(data_source, renderer, $('body'))
  plot_model = glyph_plot(data_source, renderer)
  div = $('<div></div>')
  $('body').append(div)
  myrender = ->
    div.append("<h2>vector_data_test</h2>")
    view = new plot_model.default_view(model: plot_model)
    div.append(view.$el)
    view.render()
  _.defer(myrender)
)

test('area_glyph', () ->
  expect(0)
  data_source = Collections('ObjectArrayDataSource').create(
    data : [
      {x: 1, y: 1}
      {x: 2, y: 2}
      {x: 2, y: 3}
      {x: 1, y: 3}
      {x: 0.5, y: 2}
    ]
  )
  plot_model = Collections('Plot').create()
  xdr = Collections('DataRange1d').create(
    sources : [{ref : data_source.ref(), columns : ['x']}]
  )
  ydr = Collections('DataRange1d').create(
    sources : [{ref : data_source.ref(), columns : ['y']}]
  )
  glyph_renderer = Collections('GlyphRenderer').create(
    data_source : data_source.ref()
    xdata_range : xdr.ref()
    ydata_range : ydr.ref()
    glyphs : [
        type: 'area'
        color: 'blue'
        outline_width: 4
        outline_color: 'black'
        alpha: 0.6
    ]
  )
  xaxis = Collections('LinearAxis').create(
    orientation : 'bottom'
    parent : plot_model.ref()
    data_range : xdr.ref()
  )
  yaxis = Collections('LinearAxis').create(
    orientation : 'left',
    parent : plot_model.ref()
    data_range : ydr.ref()
  )
  plot_model.set(
    renderers : [glyph_renderer.ref()],
    axes : [xaxis.ref(), yaxis.ref()]
  )
  div = $('<div></div>')
  $('body').append(div)
  myrender  =  ->
    view = new plot_model.default_view(model : plot_model)
    div.append(view.$el)
    view.render()
  console.log('Test area_glyph')
  _.defer(myrender)
)


test('boxplots_test', () ->
  expect(0)
  data_source = Collections('ObjectArrayDataSource').create(
    # style ['plain', 'notched', 'tufte']
    # x, median, width, q1, q3
    # fill, upper_fill, lower_fill
    # center_line_width, center_line_color, center_line_alpha, center_line_dash
    # outline_width, outline_color, outline_alpha, outline_dash
    # upper_line_width, upper_line_color, upper_line_alpha, upper_line_dash
    # lower_line_width, lower_line_color, lower_line_alpha, lower_line_dash
    # whisker_size, whisker_line_width, whisker_line_alphe
    # upper_whisker_size, upper_whisker_line_width, upper_whisker_line_alphe
    # lower_whisker_size, lower_whisker_line_width, lower_whisker_line_alphe
    # outliers
    # outliers_glyph, outliers_size, outliers_fill, outliers_outline, outliers_alpha
    # mean
    # mean_glyph, mean_size, mean_fill, mean_outline, mean_alpha
    data : [
      {x: 1, median: 4.0, size: 0.4, q1: 3.0, q3: 5.2 }
      {x: 2, median: 4.2, size: 0.6, q1: 3.0, q3: 5.0 }
      {x: 4, median: 3.7, size: 1.4, q1: 2.9, q3: 4.5 }
      {x: 6, median: 3.5, size: 0.5, q1: 2.6, q3: 4.1 }
    ]
  )

  plot_model = Collections('Plot').create()

  xdr = Collections('Range1d').create()
  xdr.set('start', 0)
  xdr.set('end', 7)

  ydr = Collections('Range1d').create()
  ydr.set('start', -2)
  ydr.set('end', 10)

  glyph_renderer = Collections('GlyphRenderer').create(
    data_source : data_source.ref()
    xdata_range : xdr.ref()
    ydata_range : ydr.ref()
    glyphs : [
        type: 'boxplots'
    ]
  )
  xaxis = Collections('LinearAxis').create(
    orientation : 'bottom'
    parent : plot_model.ref()
    data_range : xdr.ref()
  )
  yaxis = Collections('LinearAxis').create(
    orientation : 'left',
    parent : plot_model.ref()
    data_range : ydr.ref()
  )
  plot_model.set(
    renderers : [glyph_renderer.ref()],
    axes : [xaxis.ref(), yaxis.ref()]
  )
  div = $('<div></div>')
  $('body').append(div)
  myrender  =  ->
    view = new plot_model.default_view(model : plot_model)
    div.append(view.$el)
    view.render()
  console.log('Test boxplots_glyph')
  _.defer(myrender)

)

test('lines_test', () ->
  expect(0)
  data_source = Collections('ObjectArrayDataSource').create(
    data : [
      {
        xs: [1, 3, 7, 9],
        ys: [-1, 5, 3, 8],
        line_width: 0.5, line_color: "red", alpha: 1.0
      }
      {
        xs: [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0, 9.5],
        ys: [9.0, 8.9, 8.8, 8.6, 8.2, 6.6, 2.9, 2.3, 2.2, 2.05, 2.03, 2.02, 2.01, 2.01, 2.01, 2.01, 2.01, 2.0],
        line_width: 1, line_color: "blue", alpha: 0.6, line_dash: [6]
      }
      {
        xs: [ 0.0       ,   0.1010101 ,   0.2020202 ,   0.3030303 , 0.4040404 ,   0.50505051,   0.60606061,   0.70707071, 0.80808081,   0.90909091,   1.01010101,   1.11111111, 1.21212121,   1.31313131,   1.41414141,   1.51515152, 1.61616162,   1.71717172,   1.81818182,   1.91919192, 2.02020202,   2.12121212,   2.22222222,   2.32323232, 2.42424242,   2.52525253,   2.62626263,   2.72727273, 2.82828283,   2.92929293,   3.03030303,   3.13131313, 3.23232323,   3.33333333,   3.43434343,   3.53535354, 3.63636364,   3.73737374,   3.83838384,   3.93939394, 4.04040404,   4.14141414,   4.24242424,   4.34343434, 4.44444444,   4.54545455,   4.64646465,   4.74747475, 4.84848485,   4.94949495,   5.05050505,   5.15151515, 5.25252525,   5.35353535,   5.45454545,   5.55555556, 5.65656566,   5.75757576,   5.85858586,   5.95959596, 6.06060606,   6.16161616,   6.26262626,   6.36363636, 6.46464646,   6.56565657,   6.66666667,   6.76767677, 6.86868687,   6.96969697,   7.07070707,   7.17171717, 7.27272727,   7.37373737,   7.47474747,   7.57575758, 7.67676768,   7.77777778,   7.87878788,   7.97979798, 8.08080808,   8.18181818,   8.28282828,   8.38383838, 8.48484848,   8.58585859,   8.68686869,   8.78787879, 8.88888889,   8.98989899,   9.09090909,   9.19191919, 9.29292929,   9.39393939,   9.49494949,   9.5959596 , 9.6969697 ,   9.7979798 ,   9.8989899 ,  10.0],
        ys: [ 1.0       ,   1.02928051,   1.05941838,   1.09043869, 1.1223673 ,   1.15523079,   1.18905654,   1.22387273, 1.25970836,   1.29659327,   1.33455818,   1.37363473, 1.41385547,   1.45525388,   1.49786447,   1.54172271, 1.58686514,   1.63332937,   1.6811541 ,   1.73037915, 1.78104555,   1.83319548,   1.88687238,   1.94212098, 1.99898728,   2.05751866,   2.11776386,   2.17977308, 2.24359796,   2.30929166,   2.37690891,   2.44650603, 2.51814098,   2.59187345,   2.66776483,   2.74587836, 2.82627909,   2.909034  ,   2.99421201,   3.08188408, 3.17212324,   3.26500464,   3.36060565,   3.45900592, 3.56028739,   3.66453444,   3.7718339 ,   3.88227513, 3.99595015,   4.11295363,   4.23338303,   4.35733866, 4.48492378,   4.61624466,   4.75141068,   4.89053443, 5.03373179,   5.18112205,   5.33282797,   5.48897592, 5.64969596,   5.81512197,   5.98539173,   6.16064708, 6.341034  ,   6.52670274,   6.71780796,   6.91450883, 7.11696921,   7.32535774,   7.53984798,   7.76061861, 7.98785352,   8.22174198,   8.46247882,   8.71026456, 8.96530559,   9.22781435,   9.49800951,   9.77611612, 10.06236583,  10.35699708,  10.66025529,  10.97239305, 11.29367037,  11.62435485,  11.96472194,  12.31505516, 12.67564632,  13.04679577,  13.42881266,  13.82201521, 14.22673093,  14.64329694,  15.07206021,  15.5133779, 15.96761759,  16.43515765,  16.91638753,  17.41170806],
        line_width: 1.5, line_color: "green", alpha: 0.6, line_dash: [8,2]
      }
      {
        xs: [ 0.0       ,   0.1010101 ,   0.2020202 ,   0.3030303 , 0.4040404 ,   0.50505051,   0.60606061,   0.70707071, 0.80808081,   0.90909091,   1.01010101,   1.11111111, 1.21212121,   1.31313131,   1.41414141,   1.51515152, 1.61616162,   1.71717172,   1.81818182,   1.91919192, 2.02020202,   2.12121212,   2.22222222,   2.32323232, 2.42424242,   2.52525253,   2.62626263,   2.72727273, 2.82828283,   2.92929293,   3.03030303,   3.13131313, 3.23232323,   3.33333333,   3.43434343,   3.53535354, 3.63636364,   3.73737374,   3.83838384,   3.93939394, 4.04040404,   4.14141414,   4.24242424,   4.34343434, 4.44444444,   4.54545455,   4.64646465,   4.74747475, 4.84848485,   4.94949495,   5.05050505,   5.15151515, 5.25252525,   5.35353535,   5.45454545,   5.55555556, 5.65656566,   5.75757576,   5.85858586,   5.95959596, 6.06060606,   6.16161616,   6.26262626,   6.36363636, 6.46464646,   6.56565657,   6.66666667,   6.76767677, 6.86868687,   6.96969697,   7.07070707,   7.17171717, 7.27272727,   7.37373737,   7.47474747,   7.57575758, 7.67676768,   7.77777778,   7.87878788,   7.97979798, 8.08080808,   8.18181818,   8.28282828,   8.38383838, 8.48484848,   8.58585859,   8.68686869,   8.78787879, 8.88888889,   8.98989899,   9.09090909,   9.19191919, 9.29292929,   9.39393939,   9.49494949,   9.5959596 , 9.6969697 ,   9.7979798 ,   9.8989899 ,  10.0],
        ys: [ 0.0       ,  0.10083842,  0.20064886,  0.2984138 ,  0.39313661, 0.48385164,  0.56963411,  0.64960951,  0.72296256,  0.78894546, 0.84688556,  0.8961922 ,  0.93636273,  0.96698762,  0.98775469, 0.99845223,  0.99897117,  0.98930624,  0.96955595,  0.93992165, 0.90070545,  0.85230712,  0.79522006,  0.73002623,  0.65739025, 0.57805259,  0.49282204,  0.40256749,  0.30820902,  0.21070855, 0.11106004,  0.01027934, -0.09060615, -0.19056796, -0.28858706, -0.38366419, -0.47483011, -0.56115544, -0.64176014, -0.7158225 , -0.7825875 , -0.84137452, -0.89158426, -0.93270486, -0.96431712, -0.98609877, -0.99782778, -0.99938456, -0.99075324, -0.97202182, -0.94338126, -0.90512352, -0.85763861, -0.80141062, -0.73701276, -0.66510151, -0.58640998, -0.50174037, -0.41195583, -0.31797166, -0.22074597, -0.12126992, -0.0205576 ,  0.0803643 ,  0.18046693, 0.27872982,  0.37415123,  0.46575841,  0.55261747,  0.63384295, 0.7086068 ,  0.77614685,  0.83577457,  0.8868821 ,  0.92894843, 0.96154471,  0.98433866,  0.99709789,  0.99969234,  0.99209556, 0.97438499,  0.94674118,  0.90944594,  0.86287948,  0.8075165 , 0.74392141,  0.6727425 ,  0.59470541,  0.51060568,  0.42130064, 0.32770071,  0.23076008,  0.13146699,  0.03083368, -0.07011396, -0.17034683, -0.26884313, -0.36459873, -0.45663749, -0.54402111],
        line_width: 3, line_color: "orange", alpha: 0.4, line_dash: [2,4,4,2]
      }
    ]
  )

  plot_model = Collections('Plot').create()

  xdr = Collections('Range1d').create()
  xdr.set('start', 0)
  xdr.set('end', 10)

  ydr = Collections('Range1d').create()
  ydr.set('start', -2)
  ydr.set('end', 10)

  glyph_renderer = Collections('GlyphRenderer').create(
    data_source : data_source.ref()
    xdata_range : xdr.ref()
    ydata_range : ydr.ref()
    glyphs : [
        type: 'lines'
        line_dash: []
    ]
  )
  xaxis = Collections('LinearAxis').create(
    orientation : 'bottom'
    parent : plot_model.ref()
    data_range : xdr.ref()
  )
  yaxis = Collections('LinearAxis').create(
    orientation : 'left',
    parent : plot_model.ref()
    data_range : ydr.ref()
  )
  plot_model.set(
    renderers : [glyph_renderer.ref()],
    axes : [xaxis.ref(), yaxis.ref()]
  )
  div = $('<div></div>')
  $('body').append(div)
  myrender  =  ->
    view = new plot_model.default_view(model : plot_model)
    div.append(view.$el)
    view.render()
  console.log('Test lines_glyph')
  _.defer(myrender)

)


test('areas_glyph', () ->
  expect(0)
  data_source = Collections('ObjectArrayDataSource').create(
    data : [
      {
        xs: [1, 3, 5],
        ys: [1, 3.4, 1],
        color: "red",
      }
      {
        xs: [6, 4, 6, 8],
        ys: [2, 4, 6, 4],
        color: "blue",
        alpha: 0.3,
        outline_width: 0.1,
      }
      {
        xs: [6, 6.5, 8.5, 9],
        ys: [0, 1, 1, 0],
        color: "green",
        alpha: 0.6,
        outline_width: 3,
      }
      {
        xs: [2.0, 1.7, 3.0, 4.3, 4.0],
        ys: [6.0, 7.4, 8.7, 7.4, 6.0],
        color: "orange",
        alpha: 0.8,
        outline_color: "#df4f4f",
        outline_dash: [6,2]
      }
      {
        xs: [7,6,7,9,9.5,7.8],
        ys: [6,7,9,9,8.2,8],
        color: "#df4f7f"
        outline_dash: [2]
      }
    ]
  )
  plot_model = Collections('Plot').create()

  xdr = Collections('Range1d').create()
  xdr.set('start', 0)
  xdr.set('end', 10)

  ydr = Collections('Range1d').create()
  ydr.set('start', -2)
  ydr.set('end', 10)

  glyph_renderer = Collections('GlyphRenderer').create(
    data_source : data_source.ref()
    xdata_range : xdr.ref()
    ydata_range : ydr.ref()
    glyphs : [
        type: 'areas'
        outline_width: 1
        outline_color: 'black'
        outline_dash: []
        alpha: 0.8
    ]
  )

  xaxis = Collections('LinearAxis').create(
    orientation : 'bottom'
    parent : plot_model.ref()
    data_range : xdr.ref()
  )
  yaxis = Collections('LinearAxis').create(
    orientation : 'left',
    parent : plot_model.ref()
    data_range : ydr.ref()
  )
  plot_model.set(
    renderers : [glyph_renderer.ref()],
    axes : [xaxis.ref(), yaxis.ref()]
  )
  div = $('<div></div>')
  $('body').append(div)
  myrender  =  ->
    view = new plot_model.default_view(model : plot_model)
    div.append(view.$el)
    view.render()
  console.log('Test areas_glyph')
  _.defer(myrender)
)

test('rect_glyph_performance', () ->
  expect(0)
  x = ( (x/30) for x in _.range(600) )
  y = (Math.sin(y) for y in x)
  widths = (0.02 for i in x)
  heights = (0.2 for i in x)
  source = Collections('ColumnDataSource').create(
    data :
      x : x
      y : y
      width : widths
      height : heights
  )
  plot = Collections('Plot').create(height : 400, width:800)
  xdr = Collections('DataRange1d').create(
    sources : [{ref : source.ref(), columns : ['x']}]
  )
  ydr = Collections('DataRange1d').create(
    sources : [{ref : source.ref(), columns : ['y']}]
  )
  pantool = Collections('PanTool').create(
     dataranges : [xdr.ref(), ydr.ref()]
     dimensions : ['width', 'height']
  )
  rectglyph = {
    'color': 'red',
    'height': 'height',
    'outline_color': null,
    'outline_width': null,
    'type': 'rects',
    'width': 'width',
    'x': 'x',
    'y': 'y'}
  glyph_renderer = Collections('GlyphRenderer').create(
    data_source : source.ref()
    xdata_range : xdr.ref()
    ydata_range : ydr.ref()
    glyphs : [rectglyph]
  )
  xaxis = Collections('LinearAxis').create(
    orientation : 'bottom'
    parent : plot.ref()
    data_range : xdr.ref()
  )
  yaxis = Collections('LinearAxis').create(
    orientation : 'left'
    parent : plot.ref()
    data_range : ydr.ref()
  )
  plot.set('renderers', [glyph_renderer.ref()])
  plot.set('axes', [xaxis.ref(), yaxis.ref()])
  plot.set('tools', [pantool])
  myrender  =  ->
    div = $('<div></div>')
    $('body').append(div)
    view = new plot.default_view(model : plot)
    div.append(view.$el)
    view.render()
  _.defer(myrender)
)
