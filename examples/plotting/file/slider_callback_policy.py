from bokeh.io import vform, output_file, show
from bokeh.models import CustomJS, Slider, Paragraph

# NOTE: the JS functions to forvide the format code for strings is found the answer
# from the user fearphage at http://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format
callback = CustomJS(code="""
    var s1 = slider1.get('value')
    var s2 = slider2.get('value')
    var s3 = slider3.get('value')

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

    para.set('text', "<H3>Slider Values</H3><P>Slider 1: {0}<P>Slider 2: {1}<P>Slider 3: {2}".format(s1, s2, s3))
""")

para = Paragraph(text = "")

s1 = Slider(title="Slider 1 (Continious)", start=0, end=1000, value=0, step=1, callback=callback, callback_policy="continious")
s2 = Slider(title="Slider 2 (Throttle)", start=0, end=1000, value=0, step=1, callback=callback, callback_policy="throttle")
s3 = Slider(title="Slider 3 (mouseup)", start=0, end=1000, value=0, step=1, callback=callback, callback_policy="mouseup")

callback.args['para'] = para
callback.args['slider1'] = s1
callback.args['slider2'] = s2
callback.args['slider3'] = s3

output_file('slider_callback_policy.html')

show(vform(s1, s2, s3, para))
