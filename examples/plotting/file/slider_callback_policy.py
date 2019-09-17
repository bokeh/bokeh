from bokeh.io import output_file, show
from bokeh.layouts import column
from bokeh.models import CustomJS, Slider, Div

para = Div(text="<h1>Slider Values:</h1><p>Slider 1: 0<p>Slider 2: 0<p>Slider 3: 0")

s1 = Slider(title="Slider 1 (Continuous)", start=0, end=1000, value=0, step=1,
            callback_policy="continuous")
s2 = Slider(title="Slider 2 (Throttle)", start=0, end=1000, value=0, step=1,
            callback_policy="throttle", callback_throttle=1000)
s3 = Slider(title="Slider 3 (Mouse Up)", start=0, end=1000, value=0, step=1,
            callback_policy="mouseup")

callback = CustomJS(args=dict(para=para, s1=s1, s2=s2, s3=s3), code="""
    para.text = "<h1>Slider Values</h1><p>Slider 1: " + s1.value  + "<p>Slider 2: " + s2.value + "<p>Slider 3: " + s3.value
""")

s1.js_on_change('value_throttled', callback)
s2.js_on_change('value_throttled', callback)
s3.js_on_change('value_throttled', callback)

output_file('slider_callback_policy.html')

show(column(s1, s2, s3, para))
