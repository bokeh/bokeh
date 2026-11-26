#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc. and contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

import json
from pathlib import Path

import pytest

from bokeh.sphinxext._internal.bokeh_example_metadata import read_example_metadata

REPO_ROOT = Path(__file__).parents[4]
GALLERY = REPO_ROOT / "docs/bokeh/source/docs/gallery.json"
IMAGES = REPO_ROOT / "docs/bokeh/source/_images/examples/server/app"


def test_server_gallery_uses_new_demo_catalog() -> None:
    gallery = json.loads(GALLERY.read_text())
    assert set(gallery) == {"server/app"}
    entries = gallery["server/app"]

    names = [entry["name"] for entry in entries]
    assert names == [
        "mobility",
        "terrain-contours",
        "airport-access",
        "climate",
        "market-monitor",
        "task-scheduler",
        "chaotic-motion",
        "wave-field",
        "spectrum-monitor",
        "research-lineage",
        "image-processing",
        "cellular-automata",
    ]
    assert {path.name for path in IMAGES.glob("*.png")} == {
        f"{name}{suffix}.png"
        for name in names
        for suffix in ("", "@2x")
    }
    for entry in entries:
        name = entry["name"]
        assert entry["title"]
        assert entry["url"] == f"https://demo.bokeh.org/{name}"
        assert "https://github.com/bokeh/demo.bokeh.org/blob/main/" in entry["desc"]
        assert (IMAGES / f"{name}.png").is_file()
        assert (IMAGES / f"{name}@2x.png").is_file()


def test_example_metadata_does_not_parse_newer_python_syntax(tmp_path: Path) -> None:
    example = tmp_path / "example.py"
    example.write_text(
        '"""\n'
        'A ``scatter`` example with a `dataset`_.\n\n'
        '.. bokeh-example-metadata::\n'
        '    :apis: bokeh.plotting.figure.line,\n'
        '        bokeh.models.HoverTool\n'
        '    :gallery: A line plot.\n'
        '"""\n'
        'this is deliberately ! invalid syntax\n',
        encoding="utf-8",
    )
    summary, fields = read_example_metadata(example)
    assert summary == "A ``scatter`` example with a `dataset`_."
    assert fields == {
        "apis": "bokeh.plotting.figure.line, bokeh.models.HoverTool",
        "gallery": "A line plot.",
    }


def test_gallery_rejects_unknown_directory(tmp_path: Path, monkeypatch) -> None:
    from types import SimpleNamespace

    import pytest
    from sphinx.errors import SphinxError

    from bokeh.sphinxext._internal import bokeh_gallery

    monkeypatch.setattr(bokeh_gallery, "REPO_TOP", tmp_path)
    monkeypatch.setattr(bokeh_gallery, "_read_inventory", lambda directive: [])
    directive = SimpleNamespace(
        content=["topics/hierarchal"],
        env=SimpleNamespace(config=SimpleNamespace(bokeh_example_categories=[]), srcdir=tmp_path,
                            note_dependency=lambda path: None),
    )
    with pytest.raises(SphinxError, match=r"Unknown example category.*topics/hierarchal"):
        bokeh_gallery.BokehGalleryDirective.run(directive)


def test_empty_gallery_does_not_emit_raw_directive(tmp_path: Path, monkeypatch) -> None:
    from types import SimpleNamespace

    from bokeh.sphinxext._internal import bokeh_gallery

    (tmp_path / "examples/basic/lines").mkdir(parents=True)
    monkeypatch.setattr(bokeh_gallery, "REPO_TOP", tmp_path)
    monkeypatch.setattr(bokeh_gallery, "_read_inventory", lambda directive: [])
    directive = SimpleNamespace(
        content=["basic/lines"],
        env=SimpleNamespace(config=SimpleNamespace(bokeh_example_categories=[]), srcdir=tmp_path,
                            note_dependency=lambda path: None),
    )
    assert bokeh_gallery.BokehGalleryDirective.run(directive) == []


def test_category_defaults_and_overrides() -> None:
    from bokeh.sphinxext._internal.bokeh_gallery import _example_categories

    path = Path("plotting/stocks.py")
    assert _example_categories(path, {}) == ["plotting"]
    assert _example_categories(path, {"categories": "basic/lines, topics/timeseries, basic/lines"}) == [
        "basic/lines", "topics/timeseries",
    ]
    assert _example_categories(Path("basic/annotations/quiver.py"), {"categories": "topics/vector_fields"}) == [
        "topics/vector_fields",
    ]


def test_category_validation(tmp_path: Path) -> None:
    from types import SimpleNamespace

    import pytest
    from sphinx.errors import SphinxError

    from bokeh.sphinxext._internal.bokeh_gallery import _validate_category

    (tmp_path / "basic/lines").mkdir(parents=True)
    config = SimpleNamespace(bokeh_example_categories=["topics/vector_fields"])
    for category in ("basic/lines", "topics/vector_fields"):
        _validate_category(category, tmp_path, config)
    for category in ("basic/lnies", "topics/vector_feilds", "", "../examples", "/tmp", "basic/lines,"):
        with pytest.raises(SphinxError, match=r"Unknown example category.* in examples/plotting/stocks.py"):
            _validate_category(category, tmp_path, config, source=Path("plotting/stocks.py"))


def test_index_uses_small_thumbnails_without_gallery_selection(tmp_path: Path, monkeypatch) -> None:
    from types import SimpleNamespace

    from bokeh.sphinxext._internal import bokeh_gallery

    examples = tmp_path / 'examples/basic/lines'
    examples.mkdir(parents=True)
    for name in ('with_image', 'without_image'):
        (examples / f'{name}.py').write_text('"""Draw a line."""')
    (examples / 'helper.py').write_text('"""Support module.\n\n.. bokeh-example-metadata::\n    :no-index:\n"""')
    srcdir = tmp_path / 'docs'
    thumbnail = srcdir / '_images/examples/_index/basic/lines/with_image.png'
    thumbnail.parent.mkdir(parents=True)
    thumbnail.touch()
    gallery = srcdir / 'docs/gallery.rst'
    gallery.parent.mkdir()
    gallery.write_text('.. bokeh-gallery::\n\n    basic/lines\n')
    monkeypatch.setattr(bokeh_gallery, 'REPO_TOP', tmp_path)
    monkeypatch.setattr(bokeh_gallery, '_read_inventory', lambda directive: [
        Path('basic/lines/without_image.py'), Path('basic/lines/with_image.py'), Path('basic/lines/helper.py'),
    ])
    directive = SimpleNamespace(
        env=SimpleNamespace(
            srcdir=srcdir,
            config=SimpleNamespace(bokeh_example_subdirs=['basic/*'], bokeh_examples_dir='docs/examples'),
            note_dependency=lambda path: None,
        ),
        parse=lambda content, source: content,
    )
    rendered = bokeh_gallery.BokehSearchableExamplesDirective.run(directive)
    assert 'helper.py' not in rendered
    assert 'without_image.py' in rendered
    assert rendered.count('<img') == 1
    assert '../_images/examples/_index/basic/lines/with_image.png' in rendered
    assert 'srcset' not in rendered
    assert rendered.index('With image') < rendered.index('Without image')
    assert '["Basic plotting / Lines"]' in rendered


@pytest.mark.parametrize("content", [
    "{",
    "[]",
    '{}',
    '{"server/app": {}}',
    '{"server/app": [{}]}',
    '{"server/app": [{"name": 1}]}',
])
def test_catalog_reports_invalid_entries(tmp_path: Path, content: str) -> None:
    from sphinx.errors import SphinxError

    from bokeh.sphinxext._internal.bokeh_gallery import _load_catalog

    catalog = tmp_path / 'gallery.json'
    catalog.write_text(content)
    with pytest.raises(SphinxError, match=r"gallery.json"):
        _load_catalog(catalog, 'server/app')


def test_catalog_loads_external_demos() -> None:
    from bokeh.sphinxext._internal.bokeh_gallery import _load_catalog

    assert _load_catalog(GALLERY, 'server/app') == json.loads(GALLERY.read_text())['server/app']


def test_gallery_template_escapes_attributes_and_preserves_descriptions() -> None:
    from bokeh.sphinxext._internal.templates import GALLERY_PAGE

    card = dict(url='https://example.org/?a=1&b="two"', target='_blank', img='a&b',
                alt='A "quoted" label', title='A & B', desc='<em>HTML description</em>', parse_desc=False)
    rendered = GALLERY_PAGE.render(groups=[dict(title='A & B', cards=[card])])
    assert 'href="https://example.org/?a=1&amp;b=&#34;two&#34;"' in rendered
    assert 'alt="A &#34;quoted&#34; label"' in rendered
    assert '>A &amp; B</span>' in rendered
    assert '<em>HTML description</em>' in rendered
    card.update(desc='A :ref:`linked summary`.', parse_desc=True)
    rendered = GALLERY_PAGE.render(groups=[dict(title='', cards=[card])])
    assert '.. container:: bk-thumbnail-description' in rendered
    assert 'A :ref:`linked summary`.' in rendered


def test_gallery_template_has_markdown_links() -> None:
    from bokeh.sphinxext._internal.bokeh_gallery import (
        _html_to_markdown,
        _markdown_link,
    )
    from bokeh.sphinxext._internal.templates import GALLERY_PAGE

    assert _markdown_link('A [B]', 'examples/a/b.md') == r'**[A \[B\]](examples/a/b.md)**'
    assert _html_to_markdown("Text. <em>(<a target='_blank' href='https://example.org/a.py'>source code</a>)</em>") == \
        'Text. ([source code](https://example.org/a.py))'

    card = dict(url='examples/a/b.html', target=None, img='examples/a/b', alt='alt', title='A B',
                desc='A summary.', parse_desc=True, markdown=_markdown_link('A B', 'examples/a/b.md'))
    rendered = GALLERY_PAGE.render(groups=[dict(title='Bars', cards=[card])])
    assert '.. raw:: markdown\n\n    #### Bars\n' in rendered
    assert '.. raw:: markdown\n\n    **[A B](examples/a/b.md)**\n' in rendered
