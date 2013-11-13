
data = {
  al: [0.65, 4.5, 8.5]
  ar: [1.5, 5.5, 9.5]
  at: [6.2, 6.1, 5.5]
  ab: [0,0,0]
  bl: [1.5, 5.5, 9.5]
  br: [2.5, 6.5, 10.5]
  bt: [4.1, 6.8, 5.7]
  bb: [0,0,0]
  cl: [2.5, 6.5, 10.5]
  cr: [3.5, 7.5, 11.5]
  ct: [3.2, 5.4, 2.1]
  cb: [0,0,0]
}

a = {
  type: 'quad',
  left: 'al'
  right: 'ar'
  top: 'at'
  bottom: 'ab'
  fill_color: '#A6CEE3'
  line_color: null
}

b = {
  type: 'quad',
  left: 'bl'
  right: 'br'
  top: 'bt'
  bottom: 'bb'
  fill_color: '#1F78B4'
  line_color: null
}

c = {
  type: 'quad',
  left: 'cl'
  right: 'cr'
  top: 'ct'
  bottom: 'cb'
  fill_color: '#B2DF8A'
  line_color: null
}


options = {
  title: "Grouped Bars Demo"
  dims: [600, 600]
  xrange: [0, 8]
  yrange: [0, 8]
  xaxes: "min"
  yaxes: "min"
  xgrid: false
  tools: false
  legend: false
}

plot = Bokeh.Plotting.make_plot([a,b,c], data, options)
Bokeh.Plotting.show(plot)



