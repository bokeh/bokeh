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
import logging

# External imports

# Bokeh imports
from bokeh.model import Model
from bokeh.core.properties import Int, String, List
from bokeh.document.document import Document
from bokeh.util.logconfig import basicConfig
from bokeh.events import Tap

# Module under test
import bokeh.embed.util as beu

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------
# needed for caplog tests to function
basicConfig()

# Taken from test_callback_manager.py
class _GoodPropertyCallback(object):

    def __init__(self):
        self.last_name = None
        self.last_old = None
        self.last_new = None

    def __call__(self, name, old, new):
        self.method(name, old, new)

    def method(self, name, old, new):
        self.last_name = name
        self.last_old = old
        self.last_new = new

    def partially_good(self, name, old, new, newer):
        pass

    def just_fine(self, name, old, new, extra='default'):
        pass

class _GoodEventCallback(object):

    def __init__(self):
        self.last_name = None
        self.last_old = None
        self.last_new = None

    def __call__(self, event):
        self.method(event)

    def method(self, event):
        self.event = event

    def partially_good(self, arg, event):
        pass

# Taken from test_model
class EmbedTestUtilModel(Model):
    a = Int(12)
    b = String("hello")
    c = List(Int, [1, 2, 3])

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
        render_item = beu.RenderItem(docid="doc123", elementid="foo123")
        assert beu.div_for_render_item(render_item).strip() == """<div class="bk-root" id="foo123"></div>"""

class Test_find_existing_docs(object):
    pass

class Test_html_page_for_render_items(object):
    pass

class Test_script_for_render_items(object):
    pass

class Test_standalone_docs_json_and_render_items(object):

    def test_log_warning_if_python_property_callback(self, caplog):
        d = Document()
        m1 = EmbedTestUtilModel()
        c1 = _GoodPropertyCallback()
        d.add_root(m1)

        m1.on_change('name', c1)
        assert len(m1._callbacks) != 0

        with caplog.at_level(logging.WARN):
            beu.standalone_docs_json_and_render_items(m1)
            assert len(caplog.records) == 1
            assert caplog.text != ''

    def test_log_warning_if_python_event_callback(self, caplog):
        d = Document()
        m1 = EmbedTestUtilModel()
        c1 = _GoodEventCallback()
        d.add_root(m1)

        m1.on_event(Tap, c1)
        assert len(m1._event_callbacks) != 0

        with caplog.at_level(logging.WARN):
            beu.standalone_docs_json_and_render_items(m1)
            assert len(caplog.records) == 1
            assert caplog.text != ''

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
