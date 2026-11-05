from __future__ import annotations

from io import StringIO
from pathlib import Path
from types import SimpleNamespace
from typing import Any, cast

import pytest
from docutils import nodes
from sphinx.application import Sphinx
from sphinx.environment.adapters import toctree
from sphinx.errors import ExtensionError

from bokeh.sphinxext._internal.bokeh_toc import (
    _cache_titles_only_tocs,
    _shorten_reference_toc_titles,
)


def _toc(docname: str, title: str) -> nodes.bullet_list:
    reference = nodes.reference("", "", nodes.Text(title), refuri=docname, anchorname="")
    return nodes.bullet_list("", nodes.list_item("", nodes.paragraph("", "", reference)))


def test_shorten_reference_toc_titles() -> None:
    client = _toc("docs/reference/client", "bokeh.client")
    connection = _toc("docs/reference/client/connection", "bokeh.client.connection")
    handlers = _toc("docs/reference/application/handlers", "Handlers")
    user_guide = _toc("docs/user_guide/intro", "bokeh.intro")
    env = SimpleNamespace(tocs={
        "docs/reference/client": client,
        "docs/reference/client/connection": connection,
        "docs/reference/application/handlers": handlers,
        "docs/user_guide/intro": user_guide,
    })

    _shorten_reference_toc_titles(None, cast(Any, env))

    assert client.astext() == "client"
    assert connection.astext() == "connection"
    assert handlers.astext() == "Handlers"
    assert user_guide.astext() == "bokeh.intro"


@pytest.mark.parametrize("parallel", [1, 2])
def test_titles_only_navigation_preserves_html_and_incremental_updates(tmp_path: Path, parallel: int) -> None:
    pytest.importorskip("pydata_sphinx_theme")
    source = tmp_path / "source"
    source.mkdir()
    (source / "conf.py").write_text("""
extensions = ['sphinx.ext.autodoc', 'bokeh.sphinxext._internal.bokeh_autodoc']
html_theme = 'pydata_sphinx_theme'
html_theme_options = {'collapse_navigation': False}
master_doc = 'index'
""")
    files = {
        "index": "Navigation\n==========\n\n.. toctree::\n   :caption: Examples\n\n   section\n",
        "section": "Section\n=======\n\n.. toctree::\n   :hidden:\n\n   nested/child\n   conditional\n   limited\n",
        "nested/child": "Child\n=====\n\nMember\n------\n\nDetails.\n",
        "conditional": "Conditional\n===========\n\n.. only:: latex\n\n   .. toctree::\n\n      excluded\n",
        "limited": ":tocdepth: 1\n\nLimited\n=======\n\nMembers\n-------\n\n.. toctree::\n\n   leaf\n",
        "excluded": "Excluded\n========\n\nNot in HTML navigation.\n",
        "leaf": "Leaf\n====\n\nDetails.\n",
    }
    for name, text in files.items():
        path = source / f"{name}.rst"
        path.parent.mkdir(exist_ok=True)
        path.write_text(text)

    original_entries = toctree._entries_from_toctree

    def build(cached: bool, fresh: bool) -> dict[str, str]:
        output = tmp_path / ("cached" if cached else "baseline")
        app = Sphinx(str(source), str(source), str(output), str(output / ".doctrees"), "html",
                     status=StringIO(), warning=StringIO(), freshenv=fresh, parallel=parallel)
        if not cached:
            for listener in list(app.events.listeners["write-started"]):
                if listener.handler is _cache_titles_only_tocs:
                    app.disconnect(listener.id)
        app.build()
        assert app.statuscode == 0
        assert toctree._entries_from_toctree is original_entries
        assert ("Member" if fresh else "Updated member") in app.env.tocs["nested/child"].astext()
        return {name: (output / f"{name}.html").read_text() for name in files}

    baseline = build(False, True)
    assert build(True, True) == baseline

    # Use a new page and toctree entry so a cache from the previous build would
    # miss both the new navigation link and the rewritten member heading.
    (source / "nested/child.rst").write_text("Child\n=====\n\nUpdated member\n--------------\n\nDetails.\n")
    (source / "section.rst").write_text(files["section"] + "   added\n")
    (source / "added.rst").write_text("Added\n=====\n\nDetails.\n")
    files["added"] = ""
    baseline = build(False, False)
    candidate = build(True, False)
    assert candidate == baseline
    assert "added.html" in candidate["section"]
    assert "Updated member" in candidate["nested/child"]


def test_titles_only_cache_is_released_before_other_finish_handlers(tmp_path: Path) -> None:
    source = tmp_path / "source"
    source.mkdir()
    (source / "conf.py").write_text("extensions = ['bokeh.sphinxext._internal.bokeh_autodoc']\n")
    (source / "index.rst").write_text("Example\n=======\n")
    output = tmp_path / "output"
    app = Sphinx(str(source), str(source), str(output), str(output / ".doctrees"), "html",
                 status=StringIO(), warning=StringIO())
    original_entries = toctree._entries_from_toctree

    def fail(app: Any, exception: Exception | None) -> None:
        raise RuntimeError("copy failed")

    app.connect("build-finished", fail)
    with pytest.raises(ExtensionError, match="copy failed"):
        app.build()
    assert toctree._entries_from_toctree is original_entries
