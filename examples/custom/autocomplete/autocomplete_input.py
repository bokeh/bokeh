from bokeh.core.properties import List, String, Int, Bool
from bokeh.models.widgets import TextInput

class AutocompleteInput(TextInput):
    """ Single-line input widget with auto-completion. """

    __implementation__ = "autocomplete_input.coffee"
    __css__ = ["https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.12.1/jquery-ui.css"]

    completions = List(String, help="""
    A list of completion strings. This will be used to guide the
    user upon typing the beginning of a desired value.
    """)

    min_chars = Int(default=2, help="""
    Minimum characteres the user has to type before the autocomplete
    popup shows up.
    """)

    auto_first = Bool(default=False, help="""
    Whether the first element should be automatically selected
    """)
