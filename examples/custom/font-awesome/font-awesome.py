from bokeh.plotting import show
from bokeh.layouts import column
from bokeh.models import CustomJS
from bokeh.models.widgets import Button
from fontawesome_icon import FontAwesomeIcon

btn = Button(icon=FontAwesomeIcon(icon_name="thumbs-o-up", size=2),
             label="It works!",
             callback=CustomJS(code="alert('It works!');"))
show(column(btn))
