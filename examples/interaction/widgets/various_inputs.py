''' A showcase of input widgets in various visual states, e.g. with a title,
description (plain or a tooltip), prefix and suffix, or disabled.

'''
from bokeh import models
from bokeh.io import show
from bokeh.layouts import column
from bokeh.models import CustomJS, Div, GridBox, Tooltip
from bokeh.models.dom import HTML
from bokeh.palettes import Accent8, Spectral11, Viridis256

WIDTH = 220
NCOLS = 4

def tooltip(content: str) -> Tooltip:
    return Tooltip(content=HTML(content), position="right")

def group(name: str, *widgets: models.InputWidget) -> models.UIElement:
    for widget in widgets:
        widget.width = WIDTH
    children = [(widget, i // NCOLS, i % NCOLS) for i, widget in enumerate(widgets)]
    return column(Div(text=f"<h3>{name}</h3>"), GridBox(children=children, spacing=16))

options = ["Apples", "Bananas", "Cherries", "Dates", "Elderberries", "Figs"]
grouped_options = {"Fruits": ["Apples", "Bananas"], "Vegetables": ["Carrots", "Peas"]}

groups = [
    group("TextInput",
        models.TextInput(title="Text:", description="Enter text"),
        models.TextInput(title="Text with placeholder:", placeholder="Enter text...", description="Enter text"),
        models.TextInput(title="Text with value:", value="Some text", description="Enter text"),
        models.TextInput(title="Text with prefix:", placeholder="Enter text...", prefix="Prefix", description="Enter text"),
        models.TextInput(title="Text with suffix:", placeholder="Enter text...", suffix="Suffix", description="Enter text"),
        models.TextInput(title="Text with prefix & suffix:", placeholder="Enter text...", prefix="Prefix", suffix="Suffix", description="Enter text"),
        models.TextInput(title="Text with max length (5):", placeholder="Enter text...", max_length=5, description="Enter text"),
        models.TextInput(title="Text with tooltip:", placeholder="Enter text...", description=tooltip("Enter <b>any</b> text")),
        models.TextInput(placeholder="Text without title..."),
        models.TextInput(title="Disabled text:", value="Some text", prefix="Prefix", suffix="Suffix", description="Enter text", disabled=True),
    ),
    group("PasswordInput",
        models.PasswordInput(title="Password:", description="Enter password"),
        models.PasswordInput(title="Password with placeholder:", placeholder="Enter password...", description="Enter password"),
        models.PasswordInput(title="Password with value:", value="secret", description="Enter password"),
        models.PasswordInput(title="Password with prefix:", placeholder="Enter password...", prefix="Prefix", description="Enter password"),
        models.PasswordInput(title="Password with suffix:", placeholder="Enter password...", suffix="Suffix", description="Enter password"),
        models.PasswordInput(
            title="Password with prefix & suffix:",
            placeholder="Enter password...",
            prefix="Prefix",
            suffix="Suffix",
            description="Enter password",
        ),
        models.PasswordInput(title="Password with tooltip:", placeholder="Enter password...", description=tooltip("Enter a <b>strong</b> password")),
        models.PasswordInput(placeholder="Password without title..."),
        models.PasswordInput(title="Disabled password:", value="secret", prefix="Prefix", suffix="Suffix", description="Enter password", disabled=True),
    ),
    group("AutocompleteInput",
        models.AutocompleteInput(title="Autocomplete:", completions=options, description="Start typing a fruit"),
        models.AutocompleteInput(title="Autocomplete with placeholder:", placeholder="Enter fruit...", completions=options, description="Start typing a fruit"),
        models.AutocompleteInput(
            title="Autocomplete showing all on focus:",
            placeholder="Enter fruit...",
            completions=options,
            min_characters=0,
            description="Focus to see all fruits",
        ),
        models.AutocompleteInput(
            title="Autocomplete matching anywhere:",
            placeholder="Enter fruit...",
            completions=options,
            search_strategy="includes",
            case_sensitive=False,
            description="Type any part of a fruit",
        ),
        models.AutocompleteInput(
            title="Autocomplete not restricted:",
            placeholder="Enter anything...",
            completions=options,
            restrict=False,
            description="Any value is allowed",
        ),
        models.AutocompleteInput(
            title="Autocomplete with prefix & suffix:",
            placeholder="Enter fruit...",
            completions=options,
            prefix="Prefix",
            suffix="Suffix",
            description="Start typing a fruit",
        ),
        models.AutocompleteInput(
            title="Autocomplete with tooltip:",
            placeholder="Enter fruit...",
            completions=options,
            description=tooltip("Start typing a <b>fruit</b>"),
        ),
        models.AutocompleteInput(title="Disabled autocomplete:", value="Apples", completions=options, description="Start typing a fruit", disabled=True),
    ),
    group("TextAreaInput",
        models.TextAreaInput(title="Text area:", description="Enter text"),
        models.TextAreaInput(title="Text area with placeholder:", placeholder="Enter text...", description="Enter text"),
        models.TextAreaInput(title="Text area with value:", value="Some text\nspanning\nmultiple lines", rows=4, description="Enter text"),
        models.TextAreaInput(title="Resizable text area:", placeholder="Enter text...", resizable=True, description="Drag the corner to resize"),
        models.TextAreaInput(title="Text area with tooltip:", placeholder="Enter text...", description=tooltip("Enter <b>any</b> text")),
        models.TextAreaInput(title="Disabled text area:", value="Some text", description="Enter text", disabled=True),
    ),
    group("NumericInput",
        models.NumericInput(title="Integer:", description="Enter an integer"),
        models.NumericInput(title="Integer with placeholder:", placeholder="Enter number...", description="Enter an integer"),
        models.NumericInput(title="Integer within [0, 10]:", value=5, low=0, high=10, description="Enter an integer between 0 and 10"),
        models.NumericInput(title="Float with format:", value=3.14159, mode="float", format="0.00", description="Enter a float"),
        models.NumericInput(title="Number with prefix & suffix:", value=21, prefix="T", suffix="℃", description="Enter temperature"),
        models.NumericInput(title="Number with tooltip:", value=10, description=tooltip("Enter <b>any</b> number")),
        models.NumericInput(title="Disabled number:", value=10, prefix="T", suffix="℃", description="Enter temperature", disabled=True),
    ),
    group("Spinner",
        models.Spinner(title="Spinner:", description="Use arrows, keys or mouse wheel"),
        models.Spinner(title="Spinner with value:", value=10, description="Use arrows, keys or mouse wheel"),
        models.Spinner(title="Spinner with step (0.5) within [0, 5]:", value=1, step=0.5, low=0, high=5, description="Use arrows, keys or mouse wheel"),
        models.Spinner(title="Spinner with prefix & suffix:", value=21, prefix="T", suffix="℃", description="Enter temperature"),
        models.Spinner(title="Spinner with tooltip:", value=10, description=tooltip("Use <b>arrows</b>, keys or mouse wheel")),
        models.Spinner(title="Disabled spinner:", value=10, prefix="T", suffix="℃", description="Enter temperature", disabled=True),
    ),
    group("Select",
        models.Select(title="Select:", options=options, value="Apples", description="Choose a fruit"),
        models.Select(title="Select without value:", options=options, description="Choose a fruit"),
        models.Select(title="Select with groups:", options=grouped_options, value="Carrots", description="Choose a fruit or vegetable"),
        models.Select(title="Select with labels:", options=[("1", "One"), ("2", "Two"), ("3", "Three")], value="2", description="Choose a number"),
        models.Select(title="Select with tooltip:", options=options, value="Apples", description=tooltip("Choose a <b>fruit</b>")),
        models.Select(title="Disabled select:", options=options, value="Apples", description="Choose a fruit", disabled=True),
    ),
    group("MultiSelect",
        models.MultiSelect(title="Multi-select:", options=options, description="Choose fruits"),
        models.MultiSelect(title="Multi-select with value:", options=options, value=["Bananas", "Dates"], description="Choose fruits"),
        models.MultiSelect(title="Multi-select with size (3):", options=options, value=["Bananas"], size=3, description="Choose fruits"),
        models.MultiSelect(title="Multi-select with tooltip:", options=options, value=["Bananas"], description=tooltip("Choose <b>fruits</b>")),
        models.MultiSelect(title="Disabled multi-select:", options=options, value=["Bananas", "Dates"], description="Choose fruits", disabled=True),
    ),
    group("ColorPicker",
        models.ColorPicker(title="Color:", description="Choose a color"),
        models.ColorPicker(title="Color with value:", color="orange", description="Choose a color"),
        models.ColorPicker(title="Color with tooltip:", color="steelblue", description=tooltip("Choose a <b>color</b>")),
        models.ColorPicker(title="Disabled color:", color="orange", description="Choose a color", disabled=True),
    ),
    group("FileInput",
        models.FileInput(title="File:", description="Choose a file"),
        models.FileInput(title="File with accept (.csv, .json):", accept=".csv,.json", description="Choose a CSV or JSON file"),
        models.FileInput(title="Multiple files:", multiple=True, description="Choose one or more files"),
        models.FileInput(title="Directory:", directory=True, description="Choose a directory"),
        models.FileInput(title="File with tooltip:", description=tooltip("Choose <b>any</b> file")),
        models.FileInput(title="Disabled file:", description="Choose a file", disabled=True),
    ),
    group("MultiChoice",
        models.MultiChoice(title="Multi-choice:", options=options, description="Choose fruits"),
        models.MultiChoice(title="Multi-choice with value:", options=options, value=["Bananas", "Dates"], description="Choose fruits"),
        models.MultiChoice(title="Multi-choice with placeholder:", options=options, placeholder="Choose fruits...", description="Choose fruits"),
        models.MultiChoice(title="Multi-choice with tooltip:", options=options, description=tooltip("Choose <b>fruits</b>")),
        models.MultiChoice(title="Disabled multi-choice:", options=options, value=["Bananas"], description="Choose fruits", disabled=True),
    ),
    group("PaletteSelect",
        models.PaletteSelect(title="Palette:", value="Accent8", items=[("Accent8", Accent8), ("Spectral11", Spectral11)], description="Choose a palette"),
        models.PaletteSelect(
            title="Palette with many colors:",
            value="Viridis256",
            items=[("Viridis256", Viridis256), ("Accent8", Accent8)],
            description="Choose a palette",
        ),
        models.PaletteSelect(
            title="Palette with tooltip:",
            value="Accent8",
            items=[("Accent8", Accent8), ("Spectral11", Spectral11)],
            description=tooltip("Choose a <b>palette</b>"),
        ),
        models.PaletteSelect(title="Disabled palette:", value="Accent8", items=[("Accent8", Accent8)], description="Choose a palette", disabled=True),
    ),
]

layout = column(*groups)

for widget in layout.select({"type": models.InputWidget}):
    attr = "color" if isinstance(widget, models.ColorPicker) else "value"
    widget.js_on_change(attr, CustomJS(code=f"console.log(`${{cb_obj}}: {attr}=${{cb_obj.{attr}}}`)"))

show(layout)
