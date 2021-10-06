#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
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


# Module under test
import bokeh.embed.wrappers as bew # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------


class Test_wrap_in_onload:
    def test_render(self) -> None:
        assert bew.wrap_in_onload("code\nmorecode") == """\
(function() {
  const fn = function() {
    code
    morecode
  };
  if (document.readyState != "loading") fn();
  else document.addEventListener("DOMContentLoaded", fn);
})();\
"""


class Test_wrap_in_safely:
    def test_render(self) -> None:
        assert bew.wrap_in_safely("code\nmorecode") == """\
Bokeh.safely(function() {
  code
  morecode
});\
"""


class Test_wrap_in_script_tag:
    def test_render(self) -> None:
        assert bew.wrap_in_script_tag("code\nmorecode") == """
<script type="text/javascript">
  code
  morecode
</script>\
"""

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def test__ONLOAD() -> None:
    assert bew._ONLOAD == """\
(function() {
  const fn = function() {
%(code)s
  };
  if (document.readyState != "loading") fn();
  else document.addEventListener("DOMContentLoaded", fn);
})();\
"""

def test__SAFELY() -> None:
    assert bew._SAFELY == """\
Bokeh.safely(function() {
%(code)s
});"""\

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
