from __future__ import absolute_import

from bokeh.io import save
from bokeh.models import Tabs
from bokeh.models.widgets import MultiSelect

select = MultiSelect(options=["First option", "Second option"])
tabs = Tabs(tabs=[("A tab", select)], width=300)

save(tabs)
