from bokeh.io import curdoc
from bokeh.models import AutocompleteInput
from bokeh.layouts import row
import requests
from bokeh.models import CustomJS

json_url = (
    "https://raw.githubusercontent.com/jeancroy/FuzzySearch/master/demo/movies.json"
)
resp = requests.get(url=json_url)
completions = resp.json()

completions = ["100001", "aAaaaa", "aAaBbb", "AAAaAA", "aAaBbB"]
autocomplete_input = AutocompleteInput(
    placeholder="Enter value (auto-complete) ...", completions=completions, fuzzy_threshold=2, case_sensitive=False
)

autocomplete_input.js_on_change(
    "value",
    CustomJS(
        code="""
    console.log('text_input: value=' + this.value, this.toString())
"""
    ),
)

curdoc().add_root(row(autocomplete_input, width=800))
curdoc().title = "Autocomplete Fuzzy"
