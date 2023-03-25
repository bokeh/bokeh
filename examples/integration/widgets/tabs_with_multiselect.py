from bokeh.io import save
from bokeh.models import MultiSelect, Tabs

select = MultiSelect(options=["First option", "Second option"])
tabs = Tabs(tabs=[("A tab", select)], width=300)

save(tabs)
