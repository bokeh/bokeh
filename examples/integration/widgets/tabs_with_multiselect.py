from __future__ import absolute_import

from bokeh.io import save
from bokeh.models.widgets import MultiSelect, Panel, Tabs

select = MultiSelect(options=["First option", "Second option"])
panel = Panel(title="A tab", child=select)
tabs = Tabs(tabs=[panel], width=300)

save(tabs)
