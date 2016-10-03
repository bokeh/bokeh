"""Example implementation of two double ended sliders as extension widgets"""
from bokeh.core.properties import Float, Instance, Tuple, Bool, Enum
from bokeh.models import InputWidget
from bokeh.models.callbacks import Callback
from bokeh.core.enums import SliderCallbackPolicy

from bokeh.layouts import column
from bokeh.models import Slider, CustomJS, ColumnDataSource
from bokeh.io import show
from bokeh.plotting import Figure


jquery_ui_range_slider_coffee = """
# These are similar to python imports. BokehJS vendors its own versions
# of Underscore and JQuery. They are available as show here.
_ = require "underscore"
$ = require "jquery"
$2 = require "jquery-ui/slider"
# The "core/properties" module has all the property types
p = require "core/properties"

# We will subclass in JavaScript from the same class that was subclassed
# from in Python
InputWidget = require "models/widgets/input_widget"
slidertemplate = require "models/widgets/slidertemplate"

# This model will actually need to render things, so we must provide
# view. The LayoutDOM model has a view already, so we will start with that
class JQueryRangeSliderView extends InputWidget.View
  tagName: "div"
  template: slidertemplate

  initialize: (options) ->
    super(options)
    @listenTo(@model, 'change', @render)
    @$el.empty()
    html = @template(@model.attributes)
    @$el.html(html)
    @callbackWrapper = null
    if @model.callback_policy == 'continuous'
      @callbackWrapper = () ->
        @model.callback?.execute(@model)
    if @model.callback_policy == 'throttle' and @model.callback
      @callbackWrapper = _.throttle(() ->
        @model.callback?.execute(@model)
      , @model.callback_throttle)
    @render()

  render: () ->
    super()
    # Set up parameters
    max = @model.end
    min = @model.start
    disabled = @model.disabled
    values = @model.range or [min, max]
    step = @model.step or ((max - min)/50)
    opts = {
      range: true,
      disabled: disabled
      min: min,
      max: max,
      values: values,
      orientation: @model.orientation,
      animate: "fast",
      step: step ,
      stop: @slidestop,
      slide: @slide
    }
    @$el.find('.slider').slider(opts)
    @$( "##{ @model.id }" ).val( @$('.slider').slider('values').join(' - ') )
    @$el.find('.bk-slider-parent').height(@model.height)
    bk_handle = @$el.find('.bk-ui-slider-handle')
    # Map bk handle to ui handle - otherwise slide doesn't work
    if bk_handle.length == 2
      bk_handle[0].style.left = @$el.find('.ui-slider-handle')[0].style.left
      bk_handle[1].style.left = @$el.find('.ui-slider-handle')[1].style.left
    return @


  slidestop: (event, ui) =>
    if @model.callback_policy == 'mouseup' or @model.callback_policy == 'throttle'
      @model.callback?.execute(@model)

  slide: (event, ui) =>
    values = ui.values
    @$( "##{ @model.id }" ).val( ui.values.join(' - ') )
    @model.range = values
    if @callbackWrapper then @callbackWrapper()

class JQueryRangeSlider extends InputWidget.Model

  # If there is an associated view, this is boilerplate.
  default_view: JQueryRangeSliderView

  # The ``type`` class attribute should generally match exactly the name
  # of the corresponding Python class.
  type: "JQueryRangeSlider"

  # The @define block adds corresponding "properties" to the JS model. These
  # should basically line up 1-1 with the Python model class. Most property
  # types have counterparts, e.g. bokeh.core.properties.String will be
  # p.String in the JS implementation. Where the JS type system is not yet
  # as rich, you can use p.Any as a "wildcard" property type.
  @define {
      range:             [ p.Any                       ]
      start:             [ p.Number,      0            ]
      end:               [ p.Number,      1            ]
      step:              [ p.Number,      0.1          ]
      orientation:       [ p.Orientation, "horizontal" ]
      callback_throttle: [ p.Number,      200          ]
      callback_policy:   [ p.String,      "throttle"   ]
  }

# This is boilerplate. Every implementation should export a Model
# and (when applicable) also a View.
module.exports =
  Model: JQueryRangeSlider
  View: JQueryRangeSliderView
"""


ion_range_slider_coffee = """
# These are similar to python imports. BokehJS vendors its own versions
# of Underscore and JQuery. They are available as show here.
_ = require "underscore"
$ = require "jquery"
# The "core/properties" module has all the property types
p = require "core/properties"

# We will subclass in JavaScript from the same class that was subclassed
# from in Python
InputWidget = require "models/widgets/input_widget"
ionslidertemplate = require "models/widgets/slidertemplate"

# This model will actually need to render things, so we must provide
# view. The LayoutDOM model has a view already, so we will start with that
class IonRangeSliderView extends InputWidget.View
  tagName: "div"
  template: ionslidertemplate

  initialize: (options) ->
    super(options)
    @listenTo(@model, 'change', @render)
    @$el.empty()
    html = @template(@model.attributes)
    # replace div slider to input slider
    html = html.replace('<div class="slider "','<input type="text" class="slider "')
    html = html.replace('<div class="bk-slider-horizontal">','<div class="bk-slider-horizontal bk-ion-slider">')
    @$el.html(html)
    @callbackWrapper = null
    if @model.callback_policy == 'continuous'
      @callbackWrapper = () ->
        @model.callback?.execute(@model)
    if @model.callback_policy == 'throttle' and @model.callback
      @callbackWrapper = _.throttle(() ->
        @model.callback?.execute(@model)
      , @model.callback_throttle)
    @render()


  render: () ->
    # Backbone Views create <div> elements by default, accessible as @$el.
    # Many Bokeh views ignore this default <div>, and instead do things
    # like draw to the HTML canvas. In this case though, we change the
    # contents of the <div>, based on the current slider value.
    super()
    # Set up parameters
    max = @model.end
    min = @model.start
    grid = @model.grid
    disable = @model.disabled
    range = @model.range or [max, min]
    [from, to] = range
    step = @model.step or ((max - min)/50)
    opts = {
      type: "double",
      grid: grid,
      min: min,
      max: max,
      from: from,
      to: to,
      step: step,
      disable: disable,
      onChange: @slide,
      onFinish: @slidestop
    }

    input = @$el.find('.slider')[0]
    slider = jQuery(input).ionRangeSlider(opts)
    range = [from, to]
    @$( "##{ @model.id }" ).val( range.join(' - '))
    @$el.find('.bk-slider-parent').height(@model.height)
    return @


  slidestop: (data) =>
    if @model.callback_policy == 'mouseup' or @model.callback_policy == 'throttle'
      @model.callback?.execute(@model)

  slide: (data) =>
    range = [data.from, data.to]
    value = range.join(' - ')
    @$( "##{ @model.id }" ).val( value )
    @model.range = range
    if @callbackWrapper then @callbackWrapper()


class IonRangeSlider extends InputWidget.Model

  # If there is an associated view, this is boilerplate.
  default_view: IonRangeSliderView

  # The ``type`` class attribute should generally match exactly the name
  # of the corresponding Python class.
  type: "IonRangeSlider"

  # The @define block adds corresponding "properties" to the JS model. These
  # should basically line up 1-1 with the Python model class. Most property
  # types have counterparts, e.g. bokeh.core.properties.String will be
  # p.String in the JS implementation. Where the JS type system is not yet
  # as rich, you can use p.Any as a "wildcard" property type.
  @define {
      range:             [ p.Any,                      ]
      start:             [ p.Number,      0            ]
      end:               [ p.Number,      1            ]
      step:              [ p.Number,      0.1          ]
      grid:              [ p.Bool,        true         ]
      orientation:       [ p.Orientation, "horizontal" ]
      callback_throttle: [ p.Number,      200          ]
      callback_policy:   [ p.String,      "throttle"   ]
  }

# This is boilerplate. Every implementation should export a Model
# and (when applicable) also a View.
module.exports =
  Model: IonRangeSlider
  View: IonRangeSliderView
"""


class IonRangeSlider(InputWidget):
    # The special class attribute ``__implementation__`` should contain a string
    # of JavaScript (or CoffeeScript) code that implements the JavaScript side
    # of the custom extension model.

    __implementation__ = ion_range_slider_coffee
    __javascript__ = ["https://ajax.googleapis.com/ajax/libs/jquery/3.1.0/jquery.min.js",
                      "https://cdnjs.cloudflare.com/ajax/libs/ion-rangeslider/2.1.4/js/ion.rangeSlider.js"]
    __css__ = ["https://cdnjs.cloudflare.com/ajax/libs/normalize/4.2.0/normalize.css",
               "https://cdnjs.cloudflare.com/ajax/libs/ion-rangeslider/2.1.4/css/ion.rangeSlider.css",
               "https://cdnjs.cloudflare.com/ajax/libs/ion-rangeslider/2.1.4/css/ion.rangeSlider.skinFlat.min.css",
               "https://cdnjs.cloudflare.com/ajax/libs/ion-rangeslider/2.1.4/img/sprite-skin-flat.png"]

    # Below are all the "properties" for this model. Bokeh properties are
    # class attributes that define the fields (and their types) that can be
    # communicated automatically between Python and the browser. Properties
    # also support type validation. More information about properties in
    # can be found here:
    #
    #    http://bokeh.pydata.org/en/latest/docs/reference/core.html#bokeh-core-properties

    disable = Bool(default=True, help="""
    Enable or disable the slider.
    """)

    grid = Bool(default=True, help="""
    Show or hide the grid beneath the slider.
    """)

    start = Float(default=0, help="""
    The minimum allowable value.
    """)

    end = Float(default=1, help="""
    The maximum allowable value.
    """)

    range = Tuple(Float, Float, help="""
    The start and end values for the range.
    """)
    step = Float(default=0.1, help="""
    The step between consecutive values.
    """)

    callback = Instance(Callback, help="""
    A callback to run in the browser whenever the current Slider value changes.
    """)

    callback_throttle = Float(default=200, help="""
    Number of microseconds to pause between callback calls as the slider is moved.
    """)

    callback_policy = Enum(SliderCallbackPolicy, default="throttle", help="""
    When the callback is initiated. This parameter can take on only one of three options:
       "continuous": the callback will be executed immediately for each movement of the slider
       "throttle": the callback will be executed at most every ``callback_throttle`` milliseconds.
       "mouseup": the callback will be executed only once when the slider is released.
       The `mouseup` policy is intended for scenarios in which the callback is expensive in time.
    """)


class JQueryRangeSlider(InputWidget):
    # The special class attribute ``__implementation__`` should contain a string
    # of JavaScript (or CoffeeScript) code that implements the JavaScript side
    # of the custom extension model.

    __implementation__ = jquery_ui_range_slider_coffee

    # Below are all the "properties" for this model. Bokeh properties are
    # class attributes that define the fields (and their types) that can be
    # communicated automatically between Python and the browser. Properties
    # also support type validation. More information about properties in
    # can be found here:
    #
    #    http://bokeh.pydata.org/en/latest/docs/reference/core.html#bokeh-core-properties
    disable = Bool(default=True, help="""
    Enable or disable the slider.
    """)

    range = Tuple(Float, Float, default=(0.1, 0.9), help="""
    Initial or selected range.
    """)

    start = Float(default=0, help="""
    The minimum allowable value.
    """)

    end = Float(default=1, help="""
    The maximum allowable value.
    """)

    step = Float(default=0.1, help="""
    The step between consecutive values.
    """)

    orientation = Enum("horizontal", "vertical", help="""
    Orient the slider either horizontally (default) or vertically.
    """)

    callback = Instance(Callback, help="""
    A callback to run in the browser whenever the current Slider value changes.
    """)

    callback_throttle = Float(default=200, help="""
    Number of microseconds to pause between callback calls as the slider is moved.
    """)

    callback_policy = Enum(SliderCallbackPolicy, default="throttle", help="""
    When the callback is initiated. This parameter can take on only one of three options:
       "continuous": the callback will be executed immediately for each movement of the slider
       "throttle": the callback will be executed at most every ``callback_throttle`` milliseconds.
       "mouseup": the callback will be executed only once when the slider is released.
       The `mouseup` policy is intended for scenarios in which the callback is expensive in time.
    """)


x = [x*0.005 for x in range(2, 198)]
y = x
w = [w*0.005 for w in range(2, 198)]
z = [z**0.5 for z in w]

source = ColumnDataSource(data=dict(x=x, y=y, w=w, z=z))

plot = Figure(plot_width=400, plot_height=400)
plot.line('x', 'y', source=source, line_width=3, line_alpha=0.6, color='#ed5565')
plot.line('w', 'z', source=source, line_width=3, line_alpha=0.6)

callback_single = CustomJS(args=dict(source=source), code="""
        var data = source.data;
        var f = cb_obj.value
        x = data['x']
        y = data['y']
        w = data['w']
        z = data['z']
        for (i = 0; i < x.length; i++) {
            y[i] = Math.pow(x[i], f)
            z[i] = Math.pow(w[i], f/2)
        }
        source.trigger('change');
    """)


callback_ion = CustomJS(args=dict(source=source), code="""
        var data = source.data;
        var f = cb_obj.range
        x = data['x']
        y = data['y']
        pow = (Math.log(y[100])/Math.log(x[100]))
        console.log(pow)
        delta = (f[1]-f[0])/x.length
        for (i = 0; i < x.length; i++) {
            x[i] = delta*i + f[0]
            y[i] = Math.pow(x[i], pow)
        }
        source.trigger('change');
    """)

callback_jquery = CustomJS(args=dict(source=source), code="""
        var data = source.data;
        var f = cb_obj.range
        w = data['w']
        z = data['z']
        pow = (Math.log(z[100])/Math.log(w[100]))
        console.log(pow)
        delta = (f[1]-f[0])/w.length
        for (i = 0; i < w.length; i++) {
            w[i] = delta*i + f[0]
            z[i] = Math.pow(w[i], pow)
        }
        source.trigger('change');
    """)

slider = Slider(start=0, end=5, step=0.1, value=1, title="Bokeh Slider - Power", callback=callback_single)
ion_range_slider = IonRangeSlider(start=0.01, end=0.99, step=0.01, range=(min(x), max(x)), title='Ion Range Slider - Range', callback=callback_ion, callback_policy='continuous')
jquery_range_slider = JQueryRangeSlider(start=0.01, end=0.99, step=0.01, range=(min(w), max(w)), title='JQuery UI Slider - Range', callback=callback_jquery, callback_policy='continuous')

layout = column(plot, slider, jquery_range_slider, ion_range_slider)
show(layout)
