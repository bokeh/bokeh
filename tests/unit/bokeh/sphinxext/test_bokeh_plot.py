from __future__ import annotations

# Standard library imports
from io import StringIO
from pathlib import Path
from types import SimpleNamespace

# External imports
from docutils import nodes
from docutils.utils import new_document
from sphinx.application import Sphinx

# Bokeh imports
from bokeh.embed.resources import (
    ExtensionRequirement,
    ResourceAssetRequirement,
    ResourceRequirements,
)
from bokeh.sphinxext.bokeh_plot import add_page_resources, autoload_script


def test_page_resources_union_includes_custom_assets_once() -> None:
    extension = ExtensionRequirement("custom", (
        ResourceAssetRequirement("script", url="https://example.test/custom.js"),
        ResourceAssetRequirement("style", url="https://example.test/custom.css"),
    ))
    document = new_document("plots")
    document += autoload_script(requirements=ResourceRequirements(("bokeh/core",)).to_dict())
    document += autoload_script(requirements=ResourceRequirements(("bokeh/core", "bokeh/widgets"), (extension,)).to_dict())
    document += autoload_script(requirements=ResourceRequirements(("bokeh/core", "bokeh/widgets"), (extension,)).to_dict())

    add_page_resources(SimpleNamespace(builder=SimpleNamespace(format="html")), document, "plots")

    [resources] = list(document.findall(nodes.raw))
    html = resources.astext()
    assert html.count('<script src=') == 3
    assert html.count('https://example.test/custom.js') == 1
    assert html.count('https://example.test/custom.css') == 1
    assert document.children[0] is resources


def test_bokeh_plot_build_loads_resources_before_multiple_plots(tmp_path: Path) -> None:
    source = tmp_path / "source"
    source.mkdir()
    (source / "conf.py").write_text("extensions = ['bokeh.sphinxext.bokeh_plot']\nmaster_doc = 'index'\n")
    (source / "index.rst").write_text("""Plots
=====

.. bokeh-plot::

    from bokeh.models import Div
    from bokeh.io import show
    show(Div(text="first"))

.. bokeh-plot::

    from bokeh.plotting import figure, show
    plot = figure()
    plot.line([1, 2], [3, 4])
    show(plot)
""")
    output = tmp_path / "html"
    warnings = StringIO()
    app = Sphinx(str(source), str(source), str(output), str(tmp_path / "doctrees"), "html",
        status=StringIO(), warning=warnings, freshenv=True)
    app.build()

    assert app.statuscode == 0, warnings.getvalue()
    html = (output / "index.html").read_text()
    assert html.count('src="https://cdn.bokeh.org/bokeh/') == 2
    assert html.index('src="https://cdn.bokeh.org/bokeh/') < html.index('data-bokeh-embed-bootstrap')
    assert html.count('<script data-bokeh-embed-bootstrap') == 2
    assert len(list(output.glob("bokeh-content-*.json"))) == 2
