#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc. and contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

# Standard library imports
from html import escape

# Bokeh imports
from bokeh.document import Document
from bokeh.models import Button, Div


def modify_document(doc: Document) -> None:
    context = doc.session_context
    assert context is not None
    request = context.request
    root_path = getattr(request, "root_path", "")
    status = Div(text=(
        f'<span id="proxy-request" data-host="{escape(request.host)}" '
        f'data-root-path="{escape(root_path)}" data-clicks="0">'
        "Bokeh reverse proxy ready"
        "</span>"
    ))
    button = Button(label="Check connection")

    def check_connection() -> None:
        status.text = status.text.replace('data-clicks="0"', 'data-clicks="1"')

    button.on_click(check_connection)
    doc.add_root(button)
    doc.add_root(status)
