#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import re

# Bokeh imports
from bokeh.core.types import ID
from bokeh.document.json import DocJson
from bokeh.embed.bundle import URL, Bundle
from bokeh.embed.util import RenderItem

# Module under test
import bokeh.embed.elements as bee # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class Test_div_for_render_item:
    def test_render(self) -> None:
        render_item = RenderItem(docid=ID("doc123"), elementid=ID("foo123"))
        assert bee.div_for_render_item(render_item).strip() == \
            """<div id="foo123" style="display: contents;"></div>"""

class Test_html_page_for_render_items:
    def test_issue_13629(self) -> None:
        bundle = Bundle(js_files=[
            URL(url='http://localhost:5006/static/js/bokeh.js'),
        ])
        render_item = RenderItem(docid=ID("doc123"), elementid=ID("foo123"))
        docs_json = {
            ID("doc123"): DocJson(
                version="3.4",
                title="Bokeh Plot",
                roots=[],
            ),
        }
        html = bee.html_page_for_render_items(bundle, docs_json, [render_item], None)

        script_pattern = re.compile(r'<script\s*type="application/json"\s*id="([^"]*)"\s*>')
        uuid_pattern = re.compile(r"^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$")

        result = script_pattern.search(html)
        assert result is not None

        (id,) = result.groups()

        result = uuid_pattern.match(id)
        assert result is not None

class Test_script_for_render_items:
    pass

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
