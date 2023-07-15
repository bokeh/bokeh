from bokeh.io import show
from bokeh.models import AutocompleteInput
from bokeh.sampledata.world_cities import data

completion_list = data["name"].tolist()

auto_complete_input =  AutocompleteInput(title="Enter a city:", completions=completion_list, search_strategy="includes")

show(auto_complete_input)
