''' Pick a single value from a dropdown list.

.. bokeh-example-metadata::
    :title: Select widget
    :keywords: select widget, interaction, widgets
    :apis: bokeh.models.CustomJS, bokeh.models.Select
'''

from bokeh.io import show
from bokeh.models import CustomJS, Select

select = Select(title="Option:", value="foo", options=["foo", "bar", "baz", "quux"])
select.js_on_change("value", CustomJS(code="""
    console.log('select: value=' + this.value, this.toString())
"""))

show(select)
