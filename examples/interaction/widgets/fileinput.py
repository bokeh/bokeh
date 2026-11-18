''' Select local files through a file input widget.

.. bokeh-example-metadata::
    :title: Fileinput
    :keywords: fileinput, interaction, widgets
    :apis: bokeh.models.FileInput
'''

from bokeh.io import show
from bokeh.models import FileInput

file_input = FileInput()

show(file_input)
