from bokeh.io import output_file, show
from bokeh.layouts import widgetbox
from bokeh.models import CustomJS, Slider, Div

# NOTE: the JS functions to forvide the format code for strings is found the answer
# from the user fearphage at http://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format
callback = CustomJS(code="""
    var s1 = slider1.value;
    var s2 = slider2.value;
    var s3 = slider3.value;

    if (!String.prototype.format) {
      String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
          return typeof args[number] != 'undefined'
            ? args[number]
            : match
          ;
        });
      };
    }

    para.text = "<h1>Slider Values</h1><p>Slider 1: {0}<p>Slider 2: {1}<p>Slider 3: {2}".format(s1, s2, s3);
""")

para = Div(text="<h1>Slider Values:</h1><p>Slider 1: 0<p>Slider 2: 0<p>Slider 3: 0")

s1 = Slider(title="Slider 1 (Continuous)", start=0, end=1000, value=0, step=1,
            callback=callback, callback_policy="continuous")
s2 = Slider(title="Slider 2 (Throttle)", start=0, end=1000, value=0, step=1,
            callback=callback, callback_policy="throttle", callback_throttle=1000)
s3 = Slider(title="Slider 3 (Mouse Up)", start=0, end=1000, value=0, step=1,
            callback=callback, callback_policy="mouseup")

callback.args['para'] = para
callback.args['slider1'] = s1
callback.args['slider2'] = s2
callback.args['slider3'] = s3

output_file('slider_callback_policy.html')

show(widgetbox(s1, s2, s3, para))
