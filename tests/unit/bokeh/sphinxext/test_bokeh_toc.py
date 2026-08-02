from __future__ import annotations

# Standard library imports
from types import SimpleNamespace
from typing import Any, cast

# External imports
from docutils import nodes

# Bokeh imports
from bokeh.sphinxext._internal.bokeh_toc import _shorten_reference_toc_titles


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
