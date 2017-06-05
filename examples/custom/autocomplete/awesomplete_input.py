from bokeh.core.properties import List, String, Int, Bool
from bokeh.models.widgets import TextInput

class AwesompleteInput(TextInput):
    """ Single-line input widget with auto-completion. """

    __implementation__ = "awesomplete_input.coffee"
    __css__ = ["https://cdnjs.cloudflare.com/ajax/libs/awesomplete/1.1.1/awesomplete.css"]
    __javascript__ = ["https://cdnjs.cloudflare.com/ajax/libs/awesomplete/1.1.1/awesomplete.js"]

    completions = List(String, help="""
    A list of completion strings. This will be used to guide the
    user upon typing a substring of a desired value.
    """)

    min_chars = Int(default=2, help="""
    Minimum characteres the user has to type before the autocomplete
    popup shows up.
    """)

    max_items = Int(default=10, help="""
    Maximum number of suggestions to display.
    """)

    auto_first = Bool(default=False, help="""
    Whether the first element should be automatically selected
    """)
