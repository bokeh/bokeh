#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
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
import hashlib
import re
import sys
from os.path import abspath, join, split

# Bokeh imports
from bokeh.embed import file_html
from bokeh.plotting import figure
from bokeh.resources import Resources, ResourcesMode

# Module under test
import bokeh.core.templates as bct # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

TOP_PATH = abspath(join(split(bct.__file__)[0]))

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _crlf_cr_2_lf_bin(s):
    return re.sub(b"\r\n|\r|\n", b"\n", s)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def compute_sha256(data):
    sha256 = hashlib.sha256()
    sha256.update(data)
    return sha256.hexdigest()

def get_html_lines(resource_mode: ResourcesMode) -> list[str]:
    p = figure()
    p.scatter(x=[], y=[])
    html = file_html(p, resources=Resources(resource_mode))
    return html.split('\n')

pinned_template_sha256 = "527b63a6551a6a530089318a509e498fbd4d7057d77a0c23c6270313dcc7570a"

def test_autoload_template_has_changed() -> None:
    """This is not really a test but a reminder that if you change the
    autoload_nb_js.js template then you should make sure that insertion of
    plots into notebooks is working as expected. In particular, this test was
    created as part of https://github.com/bokeh/bokeh/issues/7125.
    """
    with open(join(TOP_PATH, "_templates/autoload_nb_js.js"), mode="rb") as f:
        current_template_sha256 = compute_sha256(_crlf_cr_2_lf_bin(f.read()))
        assert pinned_template_sha256 == current_template_sha256, """\
            It seems that the template autoload_nb_js.js has changed.
            If this is voluntary and that proper testing of plots insertion
            in notebooks has been completed successfully, update this test
            with the new file SHA256 signature."""

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
