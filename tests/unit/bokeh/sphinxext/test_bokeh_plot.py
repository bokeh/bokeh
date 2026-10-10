from __future__ import annotations

# Standard library imports
import gzip
import json
from base64 import b64decode
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
    payloads = list(output.glob("bokeh-content-*.json"))
    assert len(payloads) == 2
    assert all(json.loads(payload.read_text())["bokeh_version"] == __version__ for payload in payloads)
    if version is None:
        assert "data-bokeh-resource-override-version" not in html
    else:
        assert html.count(f'data-bokeh-resource-override-version="{version}"') == 2
        assert f'bokeh-{version}.min.js' in html


@pytest.mark.parametrize("name", ["GOOGLE_API_KEY", "CARTO_API_KEY"])
def test_api_key_missing_policy(monkeypatch: pytest.MonkeyPatch, name: str) -> None:
    from sphinx.errors import SphinxError

    from bokeh.sphinxext.bokeh_plot import _check_api_keys

    monkeypatch.delenv(name, raising=False)
    env = SimpleNamespace(config=SimpleNamespace(bokeh_missing_map_api_keys_ok=False))
    _check_api_keys("unrelated source", env)
    with pytest.raises(SphinxError, match=name):
        _check_api_keys(f'key = "{name}"', env)
    env.config.bokeh_missing_map_api_keys_ok = True
    _check_api_keys(f'key = "{name}"', env)
    monkeypatch.setenv(name, "test-key")
    env.config.bokeh_missing_map_api_keys_ok = False
    _check_api_keys(f'key = "{name}"', env)


@pytest.mark.parametrize("relative", [False, True])
def test_map_examples_inject_keys_only_into_plot_payloads(
        tmp_path: Path, monkeypatch: pytest.MonkeyPatch, relative: bool) -> None:
    monkeypatch.setenv("GOOGLE_API_KEY", "test-google-key")
    monkeypatch.setenv("CARTO_API_KEY", "test-carto-key")
    source = tmp_path / "source"
    source.mkdir()
    (source / "conf.py").write_text("extensions = ['bokeh.sphinxext.bokeh_plot']\nmaster_doc = 'index'\n")
    repo = Path(__file__).resolve().parents[4]
    examples = repo / "examples/topics/geo"
    if relative:
        for name in ("tile_source.py", "gmap.py"):
            (source / name).write_text((examples / name).read_text())
        examples = Path(".")
    (source / "index.rst").write_text(f"""Maps
====

.. bokeh-plot:: {examples}/tile_source.py
    :source-position: below

.. bokeh-plot:: {examples}/gmap.py
    :source-position: below
""")
    output = tmp_path / "html"
    warnings = StringIO()
    app = Sphinx(str(source), str(source), str(output), str(tmp_path / "doctrees"), "html",
        status=StringIO(), warning=warnings, freshenv=True)
    app.build()
    assert app.statuscode == 0, warnings.getvalue()
    html = (output / "index.html").read_text()
    assert "CARTO_API_KEY" in html
    assert "GOOGLE_API_KEY" in html
    assert "test-carto-key" not in html
    assert "test-google-key" not in html
    payloads = "\n".join(p.read_text() for p in output.glob("bokeh-content-*.json"))
    assert "?key=test-carto-key" in payloads
    assert "@2x.png?key=" in payloads
    documents = [json.loads(p.read_text())["source"]["documents"][0]
                 for p in output.glob("bokeh-content-*.json")]
    [gmap] = [doc["roots"][0] for doc in documents if doc["roots"][0]["$type"] == "GMap"]
    assert gzip.decompress(b64decode(gmap["api_key"]["data"])) == b"test-google-key"
    assert "CARTO_API_KEY" not in payloads
    assert "GOOGLE_API_KEY" not in payloads


@pytest.mark.parametrize("name,example", [
    ("GOOGLE_API_KEY", "gmap.py"),
    ("CARTO_API_KEY", "tile_source.py"),
])
@pytest.mark.parametrize("key", [None, "local-test-key"])
def test_map_examples_read_environment_locally(
        monkeypatch: pytest.MonkeyPatch, name: str, example: str, key: str | None) -> None:
    import runpy

    from bokeh.models import GMapPlot, TileRenderer

    if key is None:
        monkeypatch.delenv(name, raising=False)
    else:
        monkeypatch.setenv(name, key)
    plots = []
    monkeypatch.setattr("bokeh.plotting.show", plots.append)
    repo = Path(__file__).resolve().parents[4]
    runpy.run_path(str(repo / "examples/topics/geo" / example))
    [plot] = plots
    expected = key if key is not None else name
    if isinstance(plot, GMapPlot):
        assert plot.api_key == expected.encode()
    else:
        [renderer] = [r for r in plot.renderers if isinstance(r, TileRenderer)]
        assert renderer.tile_source.url.endswith(f"?key={expected}")
        assert renderer.tile_source.pixel_ratio == 2
