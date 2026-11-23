''' Suggest completions as the user types into a text field.

.. bokeh-example-metadata::
    :title: Autocompleteinput
    :keywords: autocomplete, text, input
    :apis: bokeh.models.AutocompleteInput
    :sampledata: world_cities
'''

from bokeh.io import show
from bokeh.models import AutocompleteInput
from bokeh.sampledata.world_cities import data

completion_list = data["name"].tolist()

auto_complete_input =  AutocompleteInput(title="Enter a city:", completions=completion_list, search_strategy="includes")

show(auto_complete_input)
