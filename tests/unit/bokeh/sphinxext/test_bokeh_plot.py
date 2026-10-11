from __future__ import annotations

# Standard library imports
import json
from io import StringIO
from pathlib import Path
from types import SimpleNamespace

# External imports
import pytest
from docutils import nodes
from docutils.utils import new_document
from sphinx.application import Sphinx

# Bokeh imports
from bokeh import __version__
from bokeh.embed.resources import (
    ExtensionRequirement,
    ResourceAssetRequirement,
    ResourceRequirements,
)
from bokeh.settings import PrioritizedSetting
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


@pytest.mark.parametrize("version", [None, "4.0.0"])
def test_bokeh_plot_build_loads_resources_before_multiple_plots(
        cdn_version_setting: PrioritizedSetting[str | None], tmp_path: Path,
        monkeypatch: pytest.MonkeyPatch, version: str | None) -> None:
    monkeypatch.delenv("BOKEH_CDN_VERSION", raising=False)
    monkeypatch.delenv("BOKEH_DOCS_CDN", raising=False)
    if version is not None:
        monkeypatch.setenv("BOKEH_CDN_VERSION", version)
    source = tmp_path / "source"
    source.mkdir()
    (source / "conf.py").write_text(
        "extensions = ['bokeh.sphinxext.bokeh_plot']\nmaster_doc = 'index'\n", encoding="utf-8",
    )
    (source / "index.rst").write_text("""Plots
=====

.. bokeh-plot::

    from bokeh.models import Div
    from bokeh.io import show
    show(Div(text="first ā"))

.. bokeh-plot::

    from bokeh.plotting import figure, show
    plot = figure()
    plot.line([1, 2], [3, 4])
    show(plot)
""", encoding="utf-8")
    output = tmp_path / "html"
    warnings = StringIO()
    app = Sphinx(str(source), str(source), str(output), str(tmp_path / "doctrees"), "html",
        status=StringIO(), warning=warnings, freshenv=True)
    app.build()

    assert app.statuscode == 0, warnings.getvalue()
    html = (output / "index.html").read_text(encoding="utf-8")
    assert html.count('src="https://cdn.bokeh.org/bokeh/') == 2
    assert html.index('src="https://cdn.bokeh.org/bokeh/') < html.index('data-bokeh-embed-bootstrap')
    assert html.count('<script data-bokeh-embed-bootstrap') == 2
    payloads = list(output.glob("bokeh-content-*.json"))
    assert len(payloads) == 2
    assert all(json.loads(payload.read_text(encoding="utf-8"))["bokeh_version"] == __version__ for payload in payloads)
    assert any("ā" in payload.read_text(encoding="utf-8") for payload in payloads)
    if version is None:
        assert "data-bokeh-resource-override-version" not in html
    else:
        assert html.count(f'data-bokeh-resource-override-version="{version}"') == 2
        assert f'bokeh-{version}.min.js' in html
