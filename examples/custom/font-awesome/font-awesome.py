from bokeh.layouts import column
from bokeh.models import Button, CustomJS
from bokeh.plotting import show
from fontawesome_icon import FontAwesomeIcon

btn = Button(icon=FontAwesomeIcon(icon_name="thumbs-o-up", size=2),
             label="It works!")
btn.js_on_click(CustomJS(code="alert('It works!')"))

show(column(btn))
