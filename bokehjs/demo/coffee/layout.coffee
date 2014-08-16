window.layout_main = (Bokeh) ->
  Backbone = Bokeh.Backbone
  _ = Bokeh._
  p1 = Bokeh.Collections('Paragraph').create(text : "hi how are you")
  p2 = Bokeh.Collections('Paragraph').create(text : "hi how are you2")
  p3 = Bokeh.Collections('Paragraph').create(text : "hi how are you3")

  hbox = Bokeh.Collections('HBox').create(
    children : [p1, p2, p3]
  )

  p1 = Bokeh.Collections('Paragraph').create(text : "hi how are you")
  p2 = Bokeh.Collections('Paragraph').create(text : "hi how are you2")
  p3 = Bokeh.Collections('Paragraph').create(text : "hi how are you3")

  vbox = Bokeh.Collections('VBox').create(
    children : [p1, p2, p3]
  )
  input1 = Bokeh.Collections('TextInput').create(
    title : "First Input"
    name : "input1"
    value : "hello"
  )
  vboxform = Bokeh.Collections('VBoxModelForm').create(
    _children : [vbox, hbox, input1]
  )
  view = new vboxform.default_view(model : vboxform)
  window.view = view
  $('body').append(view.$el)
