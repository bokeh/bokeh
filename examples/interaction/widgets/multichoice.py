''' Select several entries from a searchable choice widget.

.. bokeh-example-metadata::
    :title: Multichoice
    :keywords: multiple choice, selection, search
    :apis: bokeh.models.CustomJS, bokeh.models.MultiChoice
    :gallery: A searchable choice field with selected values from foo, bar, baz, and quux.
'''

from bokeh.io import show
from bokeh.models import CustomJS, MultiChoice

OPTIONS = ["foo", "bar", "baz", "quux"]

multi_choice = MultiChoice(value=["foo", "baz"], options=OPTIONS)
multi_choice.js_on_change("value", CustomJS(code="""
    console.log('multi_choice: value=' + this.value, this.toString())
"""))

show(multi_choice)
