
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
  type: 'Quad'
  source: 'data'
  left: 'al'
  right: 'ar'
  top: 'at'
  bottom: 'ab'
  fill_color: '#A6CEE3'
  line_color: null
}

b = {
  type: 'Quad'
  source: 'data'
  left: 'bl'
  right: 'br'
  top: 'bt'
  bottom: 'bb'
  fill_color: '#1F78B4'
  line_color: null
}

c = {
  type: 'Quad'
  source: 'data'
  left: 'cl'
  right: 'cr'
  top: 'ct'
  bottom: 'cb'
  fill_color: '#B2DF8A'
  line_color: null
}


xaxis = {
  type: "auto"
  location: "below"
  grid: false
}

yaxis = {
  type: "auto"
  location: "left"
  grid: true
}

options = {
  title: "Grouped Bars Demo"
  plot_width: 600
  plot_height: 600
  x_range: [0, 18]
  y_range: [0, 8]
}

$("#target").bokeh("figure", {
  options: options
  sources: { data: data }
  glyphs: [a, b, c]
  guides: [xaxis, yaxis]
  tools: ["Pan", "WheelZoom" ,"Resize" ,"PreviewSave"]
})



