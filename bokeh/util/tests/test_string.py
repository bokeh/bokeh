from __future__ import absolute_import

import bokeh.util.string as bus

class Test_escape(object):

    def test_default_quote(self):
        assert bus.escape("foo'bar") == "foo&#x27;bar"
        assert bus.escape('foo"bar') == "foo&quot;bar"

    def test_quote_False(self):
        assert bus.escape("foo'bar", quote=False) == "foo'bar"
        assert bus.escape('foo"bar', quote=False) == 'foo"bar'

    def test_quote_custom(self):
        assert bus.escape("foo'bar", quote=('"'),) == "foo'bar"
        assert bus.escape("foo'bar", quote=("'"),) == "foo&#x27;bar"

        assert bus.escape('foo"bar', quote=("'"),) == 'foo"bar'
        assert bus.escape('foo"bar', quote=('"'),) == "foo&quot;bar"

    def test_amp(self):
        assert bus.escape("foo&bar") == "foo&amp;bar"

    def test_lt(self):
        assert bus.escape("foo<bar") == "foo&lt;bar"

    def test_gt(self):
        assert bus.escape("foo>bar") == "foo&gt;bar"

class Test_format_doctring(object):
    def test_no_argument(self):
        doc__ = "hello world"
        assert bus.format_docstring(doc__) == doc__
        doc__ = None
        assert bus.format_docstring(doc__) == None

    def test_arguments_unused(self):
        doc__ = "hello world"
        assert bus.format_docstring(doc__, 'hello ', not_used='world') == doc__
        doc__ = None
        assert bus.format_docstring(doc__, 'hello ', not_used='world') == None

    def test_arguments(self):
        doc__ = "-- {}{as_parameter} --"
        assert bus.format_docstring(doc__, 'hello ', as_parameter='world') == "-- hello world --"
        doc__ = None
        assert bus.format_docstring(doc__, 'hello ', as_parameter='world') == None

class Test_indent(object):
    TEXT = "some text\nto indent\n  goes here"

    def test_default_args(self):
        assert bus.indent(self.TEXT) == "  some text\n  to indent\n    goes here"

    def test_with_n(self):
        assert bus.indent(self.TEXT, n=3) == "   some text\n   to indent\n     goes here"

    def test_with_ch(self):
        assert bus.indent(self.TEXT, ch="-") == "--some text\n--to indent\n--  goes here"

def test_snakify():
    assert bus.snakify("MyClassName") == "my_class_name"
    assert bus.snakify("My1Class23Name456") == "my1_class23_name456"
    assert bus.snakify("MySUPERClassName") == "my_super_class_name"
