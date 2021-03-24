import numpy as np

from bokeh.core.properties import Float
from bokeh.model import DataModel
from bokeh.models import ColumnDataSource, CustomJS
from bokeh.plotting import figure


class Params(DataModel):
    amp = Float(default=0.1, help="Amplitude")
    freq = Float(default=0.1, help="Frequency")
    phase = Float(default=0, help="Phase")
    offset = Float(default=-5, help="Offset")

def plot(params):
    A = params.amp
    k = params.freq
    phi = params.phase
    B = params.offset
    x = np.linspace(0, 10, 100)
    y = A*np.sin(k*x + phi) + B

    source = ColumnDataSource(data=dict(x=x, y=y))

    plot = figure(tags=[params], y_range=(-10, 10), title="Data models example")
    plot.line("x", "y", source=source, line_width=3, line_alpha=0.6)

    callback = CustomJS(args=dict(source=source, params=params), code="""
        const data = source.data
        const A = params.amp
        const k = params.freq
        const phi = params.phase
        const B = params.offset
        const {x, y} = data
        for (let i = 0; i < x.length; i++) {
            y[i] = A*Math.sin(k*x[i] + phi) + B
        }
        source.change.emit()
    """)

    params.js_on_change("amp", callback)
    params.js_on_change("freq", callback)
    params.js_on_change("phase", callback)
    params.js_on_change("offset", callback)

    return plot

# TODO: add support for multiple documents to show()/save()
from bokeh.document import Document
from bokeh.embed.bundle import bundle_for_objs_and_resources
from bokeh.embed.elements import html_page_for_render_items
from bokeh.embed.util import standalone_docs_json_and_render_items
from bokeh.resources import Resources
from bokeh.settings import settings

params0 = Params(amp=2, freq=3, phase=0.4, offset=1)
params1 = Params(amp=10, freq=30, phase=0.1, offset=0)

p0 = plot(params0)
p1 = plot(params1)

d0 = Document()
d0.add_root(p0)

d1 = Document()
d1.add_root(p1)

docs = [d0, d1]
(docs_json, render_items) = standalone_docs_json_and_render_items(docs)
resources = Resources(mode=settings.resources())
bundle = bundle_for_objs_and_resources(docs, resources)
html = html_page_for_render_items(bundle, docs_json, render_items, "Multiple data models")

from pathlib import Path
HERE = Path(__file__).parent.resolve()

with open(HERE / "data_models.html", mode="w", encoding="utf-8") as f:
    f.write(html)
