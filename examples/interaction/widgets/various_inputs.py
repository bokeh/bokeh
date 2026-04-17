from bokeh import models
from bokeh.io import show
from bokeh.layouts import column
from bokeh.models import CustomJS
from bokeh.palettes import Accent8

widgets: list[models.InputWidget] = [
  models.PasswordInput(title="Password:"),
  models.PasswordInput(title="Password with placeholder:", placeholder="Enter password..."),
  models.PasswordInput(title="Password with prefix:", placeholder="Enter password...", prefix="Prefix"),
  models.PasswordInput(title="Password with suffix:", placeholder="Enter password...", suffix="Suffix"),
  models.PasswordInput(title="Password with prefix & suffix:", placeholder="Enter password...", prefix="Prefix", suffix="Suffix"),
  models.TextInput(title="Text:"),
  models.TextInput(title="Text with placeholder:", placeholder="Enter text..."),
  models.TextInput(title="Text with prefix:", placeholder="Enter text...", prefix="Prefix"),
  models.TextInput(title="Text with suffix:", placeholder="Enter text...", suffix="Suffix"),
  models.TextInput(title="Text with prefix & suffix:", placeholder="Enter text...", prefix="Prefix", suffix="Suffix"),
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
