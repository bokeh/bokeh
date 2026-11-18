''' Choose multiple options from a list of checkboxes.

.. bokeh-example-metadata::
    :title: Checkbox group
    :keywords: checkbox group, interaction, widgets
    :apis: bokeh.models.CheckboxGroup, bokeh.models.CustomJS
'''

from bokeh.io import show
from bokeh.models import CheckboxGroup, CustomJS

LABELS = ["Option 1", "Option 2", "Option 3"]

checkbox_group = CheckboxGroup(labels=LABELS, active=[0, 1])
checkbox_group.js_on_change('active', CustomJS(code="""
    console.log('checkbox_group: active=' + this.active, this.toString())
"""))

show(checkbox_group)
