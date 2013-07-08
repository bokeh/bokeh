base = require("../base")
Collections = base.Collections

testutils = require("./testutils")

xrange_normal = Collections('Range1d').create({start: 0, end: 10})
yrange_normal = Collections('Range1d').create({start: 0, end: 10})

xrange_flipped = Collections('Range1d').create({start: 10, end: 0})
yrange_flipped = Collections('Range1d').create({start: 10, end: 0})


one_axis_test = (testname, dim, xr, yr, loc, bds) ->
  test(testname, () ->
    expect(0)
    plot_model = Collections('Plot').create(
      x_range: xr
      y_range: yr
      canvas_width: 200
      canvas_height: 200
      outer_width: 200
      outer_height: 200
      border: 25
      title: ""
    )
    xaxis = Collections('GuideRenderer').create(
      guidespec: {
        type: 'linear_axis'
        dimension: dim
        location: loc
        bounds: bds
      }
      plot: plot_model.ref()
    )
    plot_model.add_renderers([xaxis])

    div = $("<div style='overflow:hidden;'></div>")
    plot_div = $("<div style='float:left;'></div>")
    div.append(plot_div)
    div.append($("<div style='float:left;margin-left:20px; margin-top:100px'>#{testname}</div>"))
    $('body').append(div)
    myrender  =  ->
      view = new plot_model.default_view(model: plot_model)
      plot_div.append(view.$el)
      console.log('Test ' + testname)
    _.defer(myrender)
  )

one_axis_test('dim0_normal_normal_min_autobounds', 0, xrange_normal, yrange_normal, 'min', 'auto')
one_axis_test('dim0_normal_normal_max_autobounds', 0, xrange_normal, yrange_normal, 'max', 'auto')
one_axis_test('dim1_normal_normal_min_autobounds', 1, xrange_normal, yrange_normal, 'min', 'auto')
one_axis_test('dim1_normal_normal_max_autobounds', 1, xrange_normal, yrange_normal, 'max', 'auto')

one_axis_test('dim0_flipped_normal_min_autobounds', 0, xrange_flipped, yrange_normal, 'min', 'auto')
one_axis_test('dim0_flipped_normal_max_autobounds', 0, xrange_flipped, yrange_normal, 'max', 'auto')
one_axis_test('dim1_normal_flipped_min_autobounds', 1, xrange_normal, yrange_flipped, 'min', 'auto')
one_axis_test('dim1_normal_flipped_max_autobounds', 1, xrange_normal, yrange_flipped, 'max', 'auto')

one_axis_test('dim0_normal_flipped_min_autobounds', 0, xrange_normal, yrange_flipped, 'min', 'auto')
one_axis_test('dim0_normal_flipped_max_autobounds', 0, xrange_normal, yrange_flipped, 'max', 'auto')
one_axis_test('dim1_flipped_normal_min_autobounds', 1, xrange_flipped, yrange_normal, 'min', 'auto')
one_axis_test('dim1_flipped_normal_max_autobounds', 1, xrange_flipped, yrange_normal, 'max', 'auto')

one_axis_test('dim0_flipped_flipped_min_autobounds', 0, xrange_flipped, yrange_flipped, 'min', 'auto')
one_axis_test('dim0_flipped_flipped_max_autobounds', 0, xrange_flipped, yrange_flipped, 'max', 'auto')
one_axis_test('dim1_flipped_flipped_min_autobounds', 1, xrange_flipped, yrange_flipped, 'min', 'auto')
one_axis_test('dim1_flipped_flipped_max_autobounds', 1, xrange_flipped, yrange_flipped, 'max', 'auto')



one_axis_test('dim0_normal_normal_min_bounds_nice', 0, xrange_normal, yrange_normal, 'min', [1, 9])
one_axis_test('dim1_normal_normal_min_bounds_nice', 1, xrange_normal, yrange_normal, 'min', [1, 9])

one_axis_test('dim0_normal_normal_min_bounds', 0, xrange_normal, yrange_normal, 'min', [0.5, 9.5])
one_axis_test('dim1_normal_normal_min_bounds', 1, xrange_normal, yrange_normal, 'min', [0.5, 9.5])

one_axis_test('dim0_normal_normal_min_bounds_large', 0, xrange_normal, yrange_normal, 'min', [-1, 11])
one_axis_test('dim1_normal_normal_min_bounds_large', 1, xrange_normal, yrange_normal, 'min', [-1, 11])



one_axis_test('dim0_normal_normal_bottom_autobounds', 0, xrange_normal, yrange_normal, 'bottom', 'auto')
one_axis_test('dim0_normal_normal_top_autobounds', 0, xrange_normal, yrange_normal, 'top', 'auto')
one_axis_test('dim1_normal_normal_left_autobounds', 1, xrange_normal, yrange_normal, 'left', 'auto')
one_axis_test('dim1_normal_normal_right_autobounds', 1, xrange_normal, yrange_normal, 'right', 'auto')

one_axis_test('dim0_normal_flipped_bottom_autobounds', 0, xrange_normal, yrange_flipped, 'bottom', 'auto')
one_axis_test('dim0_normal_flipped_top_autobounds', 0, xrange_normal, yrange_flipped, 'top', 'auto')
one_axis_test('dim1_flipped_normal_left_autobounds', 1, xrange_flipped, yrange_normal, 'left', 'auto')
one_axis_test('dim1_flipped_normal_right_autobounds', 1, xrange_flipped, yrange_normal, 'right', 'auto')

one_axis_test('dim0_flipped_normal_bottom_autobounds', 0, xrange_flipped, yrange_normal, 'bottom', 'auto')
one_axis_test('dim0_flipped_normal_top_autobounds', 0, xrange_flipped, yrange_normal, 'top', 'auto')
one_axis_test('dim1_normal_flipped_left_autobounds', 1, xrange_normal, yrange_flipped, 'left', 'auto')
one_axis_test('dim1_normal_flipped_right_autobounds', 1, xrange_normal, yrange_flipped, 'right', 'auto')

one_axis_test('dim0_flipped_flipped_bottom_autobounds', 0, xrange_flipped, yrange_flipped, 'bottom', 'auto')
one_axis_test('dim0_flipped_flipped_top_autobounds', 0, xrange_flipped, yrange_flipped, 'top', 'auto')
one_axis_test('dim1_flipped_flipped_left_autobounds', 1, xrange_flipped, yrange_flipped, 'left', 'auto')
one_axis_test('dim1_flipped_flipped_right_autobounds', 1, xrange_flipped, yrange_flipped, 'right', 'auto')



one_axis_test('dim0_normal_normal_2_autobounds', 0, xrange_normal, yrange_normal, 2, 'auto')
one_axis_test('dim1_normal_normal_2_autobounds', 1, xrange_normal, yrange_normal, 2, 'auto')

one_axis_test('dim0_normal_flipped_2_autobounds', 0, xrange_normal, yrange_flipped, 2, 'auto')
one_axis_test('dim1_flipped_normal_2_autobounds', 1, xrange_flipped, yrange_normal, 2, 'auto')

one_axis_test('dim0_flipped_normal_2_autobounds', 0, xrange_flipped, yrange_normal, 2, 'auto')
one_axis_test('dim1_normal_flipped_2_autobounds', 1, xrange_normal, yrange_flipped, 2, 'auto')

one_axis_test('dim0_flipped_flipped_2_autobounds', 0, xrange_flipped, yrange_flipped, 2, 'auto')
one_axis_test('dim1_flipped_flipped_2_autobounds', 1, xrange_flipped, yrange_flipped, 2, 'auto')



one_axis_test('dim0_normal_normal_5_autobounds', 0, xrange_normal, yrange_normal, 5, 'auto')
one_axis_test('dim1_normal_normal_5_autobounds', 1, xrange_normal, yrange_normal, 5, 'auto')

one_axis_test('dim0_normal_flipped_5_autobounds', 0, xrange_normal, yrange_flipped, 5, 'auto')
one_axis_test('dim1_flipped_normal_5_autobounds', 1, xrange_flipped, yrange_normal, 5, 'auto')

one_axis_test('dim0_flipped_normal_5_autobounds', 0, xrange_flipped, yrange_normal, 5, 'auto')
one_axis_test('dim1_normal_flipped_5_autobounds', 1, xrange_normal, yrange_flipped, 5, 'auto')

one_axis_test('dim0_flipped_flipped_5_autobounds', 0, xrange_flipped, yrange_flipped, 5, 'auto')
one_axis_test('dim1_flipped_flipped_5_autobounds', 1, xrange_flipped, yrange_flipped, 5, 'auto')


one_axis_test('dim0_normal_normal_8_autobounds', 0, xrange_normal, yrange_normal, 8, 'auto')
one_axis_test('dim1_normal_normal_8_autobounds', 1, xrange_normal, yrange_normal, 8, 'auto')

one_axis_test('dim0_normal_flipped_8_autobounds', 0, xrange_normal, yrange_flipped, 8, 'auto')
one_axis_test('dim1_flipped_normal_8_autobounds', 1, xrange_flipped, yrange_normal, 8, 'auto')

one_axis_test('dim0_flipped_normal_8_autobounds', 0, xrange_flipped, yrange_normal, 8, 'auto')
one_axis_test('dim1_normal_flipped_8_autobounds', 1, xrange_normal, yrange_flipped, 8, 'auto')

one_axis_test('dim0_flipped_flipped_8_autobounds', 0, xrange_flipped, yrange_flipped, 8, 'auto')
one_axis_test('dim1_flipped_flipped_8_autobounds', 1, xrange_flipped, yrange_flipped, 8, 'auto')



# one_axis_test('dim0_normal_normal_min_bounds_out_high', 0, xrange_normal, yrange_normal, 'min', [11, 12])
# one_axis_test('dim1_normal_normal_min_bounds_out_high', 1, xrange_normal, yrange_normal, 'min', [11, 12])
# one_axis_test('dim0_normal_normal_min_bounds_out_low', 0, xrange_normal, yrange_normal, 'min', [-2, -1])
# one_axis_test('dim1_normal_normal_min_bounds_out_low', 1, xrange_normal, yrange_normal, 'min', [-2, -1])
