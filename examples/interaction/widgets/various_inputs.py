from bokeh import models
from bokeh.io import show
from bokeh.layouts import column
from bokeh.models import CustomJS
from bokeh.palettes import Accent8

widgets: list[models.InputWidget] = [
  models.PasswordInput(title="Password:", description="Enter password"),
  models.PasswordInput(title="Password with placeholder:", placeholder="Enter password...", description="Enter password"),
  models.PasswordInput(title="Password with prefix:", placeholder="Enter password...", prefix="Prefix", description="Enter password"),
  models.PasswordInput(title="Password with suffix:", placeholder="Enter password...", suffix="Suffix", description="Enter password"),
  models.PasswordInput(title="Password with prefix & suffix:", placeholder="Enter password...", prefix="Prefix", suffix="Suffix", description="Enter password"),
  models.TextInput(title="Text:", description="Enter text"),
  models.TextInput(title="Text with placeholder:", placeholder="Enter text...", description="Enter text"),
  models.TextInput(title="Text with prefix:", placeholder="Enter text...", prefix="Prefix", description="Enter text"),
  models.TextInput(title="Text with suffix:", placeholder="Enter text...", suffix="Suffix", description="Enter text"),
  models.TextInput(title="Text with prefix & suffix:", placeholder="Enter text...", prefix="Prefix", suffix="Suffix", description="Enter text"),
  models.NumericInput(),
  models.Spinner(),
  models.TextAreaInput(),
  models.FileInput(),
  models.AutocompleteInput(),
  models.Select(),
  models.MultiSelect(),
  models.MultiChoice(),
  models.ColorPicker(),
  models.PaletteSelect(value="Accent8", items=[("Accent8", Accent8)]),
]

cb = CustomJS(code="""console.log(`${this}: value=${this.value}`)""")
for widget in widgets:
  widget.js_on_change("value", cb)

layout = column(*widgets)
show(layout)
