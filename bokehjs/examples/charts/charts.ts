namespace Charts {
  import plt = Bokeh.Plotting;

  const pie_data = {
    labels: ['Work', 'Eat', 'Commute', 'Sport', 'Watch TV', 'Sleep'],
    values: [8, 2, 2, 4, 0, 8],
  }

  const p11 = Bokeh.Charts.pie(pie_data)
  const p12 = Bokeh.Charts.pie(pie_data, {inner_radius: 0.2, start_angle: Math.PI/2})
  const p13 = Bokeh.Charts.pie(pie_data, {inner_radius: 0.2, start_angle: Math.PI/6, end_angle: 5*Math.PI/6})
  const p14 = Bokeh.Charts.pie(pie_data, {inner_radius: 0.2, palette: "Oranges9", slice_labels: "percentages"})

  const bar_data = [
    ['City'              , '2010 Population' , '2000 Population'],
    ['New York City, NY' , 8175000           , 8008000          ],
    ['Los Angeles, CA'   , 3792000           , 3694000          ],
    ['Chicago, IL'       , 2695000           , 2896000          ],
    ['Houston, TX'       , 2099000           , 1953000          ],
    ['Philadelphia, PA'  , 1526000           , 1517000          ],
  ]

  const p21 = Bokeh.Charts.bar(bar_data, {axis_number_format: "0.[00]a"})
  const p22 = Bokeh.Charts.bar(bar_data, {axis_number_format: "0.[00]a", stacked: true})
  const p23 = Bokeh.Charts.bar(bar_data, {axis_number_format: "0.[00]a", orientation: "vertical"})
  const p24 = Bokeh.Charts.bar(bar_data, {axis_number_format: "0.[00]a", orientation: "vertical", stacked: true})

  const plots = [
    [p11, p12, p13, p14],
    [p21, p22, p23, p24],
  ]

  plt.show(plt.gridplot(plots))
}
