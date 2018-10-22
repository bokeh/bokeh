#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2018, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports

# Module under test
import bokeh.embed.wrappers as bew

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class Test_wrap_in_onload(object):

    def test_render(self):
        assert bew.wrap_in_onload("code\nmorecode") == """\
(function() {
  var fn = function() {
    code
    morecode
  };
  if (document.readyState != "loading") fn();
  else document.addEventListener("DOMContentLoaded", fn);
})();\
"""

class Test_wrap_in_safely(object):

    def test_render(self):
        assert bew.wrap_in_safely("code\nmorecode") == """\
Bokeh.safely(function() {
  code
  morecode
});\
"""

class Test_wrap_in_script_tag(object):

    def test_render(self):
        assert bew.wrap_in_script_tag("code\nmorecode") == """
<script type="text/javascript">
  code
  morecode
</script>\
"""

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def test__ONLOAD():
    assert bew._ONLOAD == """\
(function() {
  var fn = function() {
%(code)s
  };
  if (document.readyState != "loading") fn();
  else document.addEventListener("DOMContentLoaded", fn);
})();\
"""

def test__SAFELY():
    assert bew._SAFELY == """\
Bokeh.safely(function() {
%(code)s
});"""\

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
