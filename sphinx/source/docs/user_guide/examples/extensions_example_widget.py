"""Example implementation of two double ended sliders as extension widgets"""
from bokeh.core.properties import Bool, Float, Instance, Tuple
from bokeh.io import show
from bokeh.layouts import column
from bokeh.models import Callback, ColumnDataSource, CustomJS, InputWidget, Slider
from bokeh.plotting import Figure


class IonRangeSlider(InputWidget):
    # The special class attribute ``__implementation__`` should contain a string
    # of JavaScript or TypeScript code that implements the web browser
    # side of the custom extension model or a string name of a file with the implementation.

    __implementation__ = 'extensions_ion_range_slider.ts'
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
    #    https://docs.bokeh.org/en/latest/docs/reference/core/properties.html#bokeh-core-properties

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

x = [x*0.005 for x in range(2, 198)]
y = x

source = ColumnDataSource(data=dict(x=x, y=y))

plot = Figure(plot_width=400, plot_height=400)
plot.line('x', 'y', source=source, line_width=3, line_alpha=0.6, color='#ed5565')

callback_single = CustomJS(args=dict(source=source), code="""
        var data = source.data;
        var f = cb_obj.value
        var x = data['x']
        var y = data['y']
        for (var i = 0; i < x.length; i++) {
            y[i] = Math.pow(x[i], f)
        }
        source.change.emit();
    """)


callback_ion = CustomJS(args=dict(source=source), code="""
        var data = source.data;
        var f = cb_obj.range
        var x = data['x']
        var y = data['y']
        var pow = (Math.log(y[100])/Math.log(x[100]))
        console.log(pow)
        var delta = (f[1] - f[0])/x.length
        for (var i = 0; i < x.length; i++) {
            x[i] = delta*i + f[0]
            y[i] = Math.pow(x[i], pow)
        }
        source.change.emit();
    """)


slider = Slider(start=0, end=5, step=0.1, value=1, title="Bokeh Slider - Power")
slider.js_on_change('value', callback_single)

ion_range_slider = IonRangeSlider(start=0.01, end=0.99, step=0.01, range=(min(x), max(x)),
    title='Ion Range Slider - Range')
ion_range_slider.js_on_change('range', callback_ion)

layout = column(plot, slider, ion_range_slider)
show(layout)
