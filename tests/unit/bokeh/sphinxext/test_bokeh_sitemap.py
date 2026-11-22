from __future__ import annotations

from types import SimpleNamespace

from bokeh.sphinxext._internal.bokeh_sitemap import _sitemap_links, build_finished


def test_sitemap_links_include_html_output_and_respect_metadata(tmp_path) -> None:
    (tmp_path / "index.html").touch()
    (tmp_path / "reference").mkdir()
    (tmp_path / "reference" / "Model.html").touch()
    (tmp_path / "reference" / "legacy.html").touch()
    (tmp_path / "objects.inv").touch()
    (tmp_path / "_static").mkdir()
    (tmp_path / "_static/webpack-macros.html").touch()

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


def test_sitemap_writer_preserves_https(tmp_path) -> None:
    (tmp_path / "index.html").touch()
    app = SimpleNamespace(
        builder=SimpleNamespace(format="html"),
        config=SimpleNamespace(html_context={"SITEMAP_BASE_URL": "https://docs.bokeh.org/en/"}, version="4.0.0"),
        env=SimpleNamespace(metadata={}), outdir=tmp_path, verbosity=0,
    )
    build_finished(app, None)
    assert "https://docs.bokeh.org/en/4.0.0/index.html" in (tmp_path / "sitemap.xml").read_text()
    assert "http://docs.bokeh.org" not in (tmp_path / "sitemap.xml").read_text()
