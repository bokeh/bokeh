from os.path import join
from typing import Any

from django.conf import settings
from django.http import HttpRequest, HttpResponse
from django.shortcuts import render

from bokeh.document import Document
from bokeh.embed import server_document
from bokeh.layouts import column
from bokeh.models import ColumnDataSource, Slider
from bokeh.plotting import figure
from bokeh.sampledata.sea_surface_temperature import sea_surface_temperature
from bokeh.themes import Theme

from .shape_viewer import shape_viewer

theme = Theme(filename=join(settings.THEMES_DIR, "theme.yaml"))

def shape_viewer_handler(doc: Document) -> None:
    panel = shape_viewer()
    panel.server_doc(doc)

def sea_surface_handler(doc: Document) -> None:
    df = sea_surface_temperature.copy()
    source = ColumnDataSource(data=df)

    plot = figure(x_axis_type="datetime", y_range=(0, 25), y_axis_label="Temperature (Celsius)",
                  title="Sea Surface Temperature at 43.18, -70.43")
    plot.line("time", "temperature", source=source)

    def callback(attr: str, old: Any, new: Any) -> None:
        if new == 0:
            data = df
        else:
            data = df.rolling(f"{new}D").mean()
        source.data = dict(ColumnDataSource(data=data).data)

    slider = Slider(start=0, end=30, value=0, step=1, title="Smoothing by N Days")
    slider.on_change("value", callback)

    doc.theme = theme
    doc.add_root(column(slider, plot))

def with_request(f):
    def wrapper(doc):
        return f(doc, doc.session_context.request)
    return wrapper

@with_request
def sea_surface_handler_with_template(doc: Document, request: Any) -> None:
    sea_surface_handler(doc)
    doc.template = """
{% block title %}Embedding a Bokeh Apps In Django{% endblock %}
{% block preamble %}
<style>
.bold { font-weight: bold; }
</style>
{% endblock %}
{% block contents %}
    <div>
    This Bokeh app below is served by a <span class="bold">Django</span> server for {{ username }}:
    </div>
    {{ super() }}
{% endblock %}
    """
    doc.template_variables["username"] = request.user

def sea_surface(request: HttpRequest) -> HttpResponse:
    script = server_document(request.build_absolute_uri())
    return render(request, "embed.html", dict(script=script))

def sea_surface_custom_uri(request: HttpRequest) -> HttpResponse:
    script = server_document(request._current_scheme_host + "/sea_surface")
    return render(request, "embed.html", dict(script=script))
