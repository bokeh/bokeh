''' Choose several values from a list box.

.. bokeh-example-metadata::
    :title: Multiselect
    :keywords: multiple selection, list
    :apis: bokeh.models.CustomJS, bokeh.models.MultiSelect
    :gallery: A list box showing foo, bar, baz, and quux.
'''

from bokeh.io import show
from bokeh.models import CustomJS, MultiSelect

OPTIONS = [("1", "foo"), ("2", "bar"), ("3", "baz"), ("4", "quux")]

multi_select = MultiSelect(value=["1", "2"], options=OPTIONS)
multi_select.js_on_change("value", CustomJS(code="""
    console.log('multi_select: value=' + this.value, this.toString())
"""))

show(multi_select)
