from __future__ import annotations

# Standard library imports
from types import SimpleNamespace

# Bokeh imports
from bokeh.sphinxext._internal.bokeh_sitemap import _sitemap_links


def test_sitemap_links_include_html_output_and_respect_metadata(tmp_path) -> None:
    (tmp_path / "index.html").touch()
    (tmp_path / "reference").mkdir()
    (tmp_path / "reference" / "Model.html").touch()
    (tmp_path / "reference" / "legacy.html").touch()
    (tmp_path / "objects.inv").touch()

    app = SimpleNamespace(
        config=SimpleNamespace(
            html_context={"SITEMAP_BASE_URL": "https://docs.example/en/"},
            version="1.2.3",
        ),
        env=SimpleNamespace(metadata={"reference/legacy": {"no-sitemap": ""}}),
        outdir=tmp_path,
    )

    assert _sitemap_links(app) == [
        "https://docs.example/en/1.2.3/index.html",
        "https://docs.example/en/1.2.3/reference/Model.html",
    ]
