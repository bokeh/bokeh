from bokeh.core.properties import List, String, Int, Bool
from bokeh.models.widgets import InputWidget

class TokenInput(InputWidget):
    """ Single-line input widget with multiple tag auto-completion.

    FIXME: JQuery plugin?
    """

    __implementation__ = "token_input.coffee"
    # __javascript__ = ["js/textext.core.js"]
    __javascript__ = ["https://cdnjs.cloudflare.com/ajax/libs/jquery/3.1.1/jquery.js",
                      "https://cdn.jsdelivr.net/jquery.tokeninput/1.6.0/jquery.tokeninput.js",
                     ]
    __css__ = ["https://cdn.jsdelivr.net/jquery.tokeninput/1.6.0/styles/token-input.css",
               "https://cdn.jsdelivr.net/jquery.tokeninput/1.6.0/styles/token-input-facebook.css",
               # https://cdn.jsdelivr.net/jquery.tokeninput/1.6.0/styles/token-input-mac.css
              ]

    values = List(String, help="""
    """)

    placeholder = String(help="""
    """)

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
    (Not yet implemented.)
    """)
