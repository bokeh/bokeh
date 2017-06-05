"""
Example bokeh app for custom extensions to render a simple autocomplete
text input box, using JQuery, awesomplete, jquery-textext, and jquery-tokeninput
libraries respectively.

As it turns out, there are a lot of independent autocomplete implementations.
Some suggested libraries appear in these lists (many focus on ajax
support though which may be extraneous for bokeh apps):
* http://techslides.com/list-of-autocomplete-plugins-and-libraries
* http://ourcodeworld.com/articles/read/193/top-10-best-autocomplete-jquery-and-javascript-plugins
* http://jqueryhouse.com/20-best-jquery-autocomplete-plugins/

Some niche autocompletion libraries that may be of interest:
* http://vyasrao.github.io/tAutocomplete/ : tabular dropdown

Run with bokeh server, e.g.:

Examples:
    >>> bokeh serve -m examples/custom/autocomplete
"""
from __future__ import print_function

from bokeh.layouts import layout
from bokeh.models.widgets import (Button, CheckboxButtonGroup,
                                  Div, Slider, TextInput)
from bokeh.plotting import curdoc

from awesomplete_input import AwesompleteInput
from autocomplete_input import AutocompleteInput
# from textext_input import TextExtInput
from token_input import TokenInput

# Properties for autocompletion
completions = dir(__builtins__)
min_chars = 2
auto_first = False

div = Div(text="This is an example dashboard for playing with parameters for "
               "a few autocompletion libraries.<br />"
               "Autocomplete the name of a python built-in function/member;"
               " such as \"getattr\" and \"setattr\".")
div_values = Div(text="Current values:")
auto_input = AutocompleteInput(completions=completions,
                               min_chars=min_chars,
                               auto_first=auto_first,
                               title="jquery")
awes_input = AwesompleteInput(completions=completions,
                              min_chars=min_chars,
                              auto_first=auto_first,
                              title="awesomplete")
# FIXME
# Please note that these input widgets are not currently functional.
# The main issues:
#  1. CSS is not yet figured out, especially after the first pss.
#  2. Both of these autocompleters support tags, and do not directly
#     update the textinput's value field. Have not yet done any
#     wiring for such.
#  3. Selecting an autocompletion and then losing focus / pressing enter
#     does not seem to trigger an on_change() callback.
## text_input = TextExtInput(completions=completions,
##                           title="textext")
token_input = TokenInput(completions=completions,
                         title="token")
all_inputs = [auto_input,
              awes_input,
              # text_input,
              token_input]

new_input = TextInput(value="foo bar",
                      placeholder="option",
                      title="Add a new option to autocomplete:"
                     )
button = Button(label="Submit new option",
                button_type="primary")
slider = Slider(start=0, end=10, value=min_chars, step=1,
                title="Min length to trigger autocomplete")

checkboxes = CheckboxButtonGroup(labels=["Auto Focus First",
                                        ],
                                 active=[])

# Register callbacks to show what the input value is for the more complicated
# autocompletion widgets, such as those with multiple tags.
def on_input_value_update(attr, old_value, new_value):
    """Display current contents of autocompletion inputs"""
    div_values.text = "Current values:" + " | ".join([a.value for a in (auto_input, awes_input)] +
                                                     [str(a.values) for a in (token_input,)])
for a_input in [auto_input, awes_input]:
    a_input.on_change("value", on_input_value_update)

# Register callbacks to change properties of autocompletion menus,
# to get a sense of how the various properties work.
def on_new_option():
    """Add new option to autocomplete menu"""
    new_option = new_input.value
    print("Adding option:", new_option)
    for a_input in all_inputs:
        a_input.completions.append(new_option)
button.on_click(on_new_option)

def on_min_chars_change(attr, old_value, new_value):
    """Add min chars"""
    print("Changing min_chars from", old_value, "to", new_value)
    for a_input in all_inputs:
        a_input.min_chars = new_value
slider.on_change("value", on_min_chars_change)

def on_checkbox(attr, old_value, new_value):
    print("Checked options:", attr, new_value)
    auto_first = 0 in new_value
    for a_input in all_inputs:
        a_input.auto_first = auto_first
checkboxes.on_change("active", on_checkbox)

curdoc().add_root(layout([[div],
                          all_inputs,
                          [div_values],
                          [new_input, button],
                          [slider, checkboxes],
                         ], responsive=True
                         ))
