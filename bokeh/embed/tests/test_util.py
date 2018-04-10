#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
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
from bokeh.model import Model

# Module under test
import bokeh.embed.util as beu

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class Test_FromCurdoc(object):

    def test_type(self):
        assert isinstance(beu.FromCurdoc, type)

class Test_check_models_or_docs(object):
    pass

class Test_check_one_model_or_doc(object):

    def test_succeed_with_one_model(self):
        m = Model()
        assert beu.check_one_model_or_doc(m) is m

    def test_fails_with_multiple_models(self):
        m1 = Model()
        m2 = Model()
        with pytest.raises(ValueError):
            beu.check_one_model_or_doc([m1, m2])
        with pytest.raises(ValueError):
            beu.check_one_model_or_doc((m1, m2))
        with pytest.raises(ValueError):
            beu.check_one_model_or_doc(dict(m1=m1, m2=m2))

class Test_div_for_render_item(object):

    def test_render(self):
        assert beu.div_for_render_item(dict(elementid="foo123")) == """
<div class="bk-root">
    <div class="bk-plotdiv" id="foo123"></div>
</div>"""

class Test_find_existing_docs(object):
    pass

class Test_html_page_for_render_items(object):
    pass

class Test_script_for_render_items(object):
    pass

class Test_standalone_docs_json_and_render_items(object):
    pass

class Test_wrap_in_onload(object):

    def test_render(self):
        assert beu.wrap_in_onload("code\nmorecode") == """\
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
        assert beu.wrap_in_safely("code\nmorecode") == """\
Bokeh.safely(function() {
  code
  morecode
});\
"""

class Test_wrap_in_script_tag(object):

    def test_render(self):
        assert beu.wrap_in_script_tag("code\nmorecode") == """
<script type="text/javascript">
  code
  morecode
</script>\
"""

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def test__ONLOAD():
    assert beu._ONLOAD == """\
(function() {
  var fn = function() {
%(code)s
  };
  if (document.readyState != "loading") fn();
  else document.addEventListener("DOMContentLoaded", fn);
})();\
"""

def test__SAFELY():
    assert beu._SAFELY == """\
Bokeh.safely(function() {
%(code)s
});"""\
