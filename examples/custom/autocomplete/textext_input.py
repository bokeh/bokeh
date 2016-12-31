from bokeh.core.properties import List, String, Int, Bool
from bokeh.models.widgets import TextInput

class TextExtInput(TextInput):
    """ Single-line input widget with multiple tag auto-completion.

    FIXME: JQuery plugin?
    """

    __implementation__ = "textext_input.coffee"
    __javascript__ = ["https://cdnjs.cloudflare.com/ajax/libs/jquery/3.1.1/jquery.js",
                      "https://cdnjs.cloudflare.com/ajax/libs/jquery-textext/1.3.0/jquery.textext.min.js",
                     ]
    __css__ = ["https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.12.1/jquery-ui.css"]

    completions = List(String, help="""
    A list of completion strings. This will be used to guide the
    user upon typing the beginning of a desired value.
    """)

    min_chars = Int(default=2, help="""
    Minimum characteres the user has to type before the autocomplete
    popup shows up. (Not yet implemented.)
    """)

    auto_first = Bool(default=False, help="""
    Whether the first element should be automatically selected
    (Not yet implemented.)
    """)
