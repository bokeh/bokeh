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
import sys

# Bokeh imports
from bokeh.embed import file_html
from bokeh.plotting import figure
from bokeh.resources import Resources, ResourcesMode

# Module under test
import bokeh.core.templates as bct # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

def get_html_lines(resource_mode: ResourcesMode) -> list[str]:
    p = figure()
    p.scatter(x=[], y=[])
    html = file_html(p, resources=Resources(resource_mode))
    return html.split('\n')

def test_legacy_notebook_templates_are_removed() -> None:
    assert not hasattr(bct, "DOC_JS")
    assert not hasattr(bct, "PLOT_DIV")
    assert not hasattr(bct, "DOC_NB_JS")
    assert not hasattr(bct, "NOTEBOOK_RESOURCES_JS")
    assert not hasattr(bct, "APP_NB_CLEANUP")
    assert bct.PORTABLE_RESOURCES_JS is not None

def test_legacy_render_item_templates_are_removed() -> None:
    assert not hasattr(bct, "DOC_JS")
    assert not hasattr(bct, "PLOT_DIV")

def test_no_white_space_in_top_of_html() -> None:
    lines = get_html_lines("inline")
    any_character = re.compile(r"\S")
    assert(any_character.search(lines[0]) is not None)

MODES: list[ResourcesMode] = ["inline", "cdn", "server", "absolute"]
if sys.platform != "win32":
    MODES.append("relative")

@pytest.mark.parametrize("mode", MODES)
def test_dont_start_script_on_same_line_after_another_ends(mode: ResourcesMode) -> None:
    lines = get_html_lines(mode)
    for line in lines:
        if "<script" in line and "</script" in line:
            assert line.rfind("<script") < line.rfind("</script")

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
