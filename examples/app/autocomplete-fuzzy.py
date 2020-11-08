import requests

from bokeh.io import curdoc
from bokeh.layouts import column
from bokeh.models import AutocompleteInput, CustomJS

json_url = (
    "https://raw.githubusercontent.com/jeancroy/FuzzySearch/master/demo/movies.json"
)
resp = requests.get(url=json_url)
completions = resp.json()

# completions = ["100001", "aAaaaa", "aAaBbb", "AAAaAA", "aAaBbB"]
print(completions)
autocomplete_input_trh_5 = AutocompleteInput(
    placeholder="Enter value Threshold 5 no sensitive) ...", completions=completions, fuzzy_threshold=5, case_sensitive=False
)
autocomplete_input_trh_20 = AutocompleteInput(
    placeholder="Enter value Threshold 20 no case sensitive ...", completions=completions, fuzzy_threshold=20, case_sensitive=False
)
autocomplete_input_trh_5_sens = AutocompleteInput(
    placeholder="Enter value Threshold 5 sensitive ...", completions=completions, fuzzy_threshold=5, case_sensitive=True
)
autocomplete_input_trh_20_sens = AutocompleteInput(
    placeholder="Enter value Threshold 20 sensitive ...", completions=completions, fuzzy_threshold=20, case_sensitive=True
)
autocomplete_input_trh_5.js_on_change(
    "value",
    CustomJS(
        code="""
    console.log('text_input: value=' + this.value, this.toString())
"""
    ),
)

curdoc().add_root(column(
	autocomplete_input_trh_5,
	autocomplete_input_trh_20,
	autocomplete_input_trh_5_sens,
	autocomplete_input_trh_20_sens,
	width=800)
)
curdoc().title = "Autocomplete Fuzzy"
