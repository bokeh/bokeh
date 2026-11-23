''' Put a Font Awesome icon on a button that opens a browser alert.

.. bokeh-example-metadata::
    :title: Font awesome
    :keywords: Font Awesome, icon, button, CustomJS
    :apis: bokeh.models.Button, bokeh.models.CustomJS
'''

from bokeh.events import ButtonClick
from bokeh.layouts import column
from bokeh.models import Button, CustomJS
from bokeh.plotting import show

from fontawesome_icon import FontAwesomeIcon

btn = Button(icon=FontAwesomeIcon(icon_name="thumbs-o-up", size=2),
             label="It works!")
btn.js_on_event(ButtonClick, CustomJS(code="alert('It works!')"))

show(column(btn))
