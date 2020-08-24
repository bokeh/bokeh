#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from urllib.parse import quote_plus

# Module under test
import bokeh.util.string as bus # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Test_format_docstring:
    def test_no_argument(self) -> None:
        doc__ = "hello world"
        assert bus.format_docstring(doc__) == doc__
        doc__ = None
        assert bus.format_docstring(doc__) == None

    def test_arguments_unused(self) -> None:
        doc__ = "hello world"
        assert bus.format_docstring(doc__, 'hello ', not_used='world') == doc__
        doc__ = None
        assert bus.format_docstring(doc__, 'hello ', not_used='world') == None

    def test_arguments(self) -> None:
        doc__ = "-- {}{as_parameter} --"
        assert bus.format_docstring(doc__, 'hello ', as_parameter='world') == "-- hello world --"
        doc__ = None
        assert bus.format_docstring(doc__, 'hello ', as_parameter='world') == None

class Test_format_url_query_arguments:
    def test_no_arguments(self) -> None:
        assert bus.format_url_query_arguments("url") == "url"

    @pytest.mark.parametrize('value', ["10", "10.2", "bar", "a b", "a&b", "'ab'", "a\"b", "a@b", "a?b", "a:b", "a/b", "a=b"])
    def test_one_argument(self, value: str) -> None:
        assert bus.format_url_query_arguments("url", dict(foo=value)) == f"url?foo={quote_plus(value)}"

    def test_two_arguments(self) -> None:
        assert bus.format_url_query_arguments("url", dict(foo="10", bar="a b")) == "url?foo=10&bar=a+b"

    def test_several_arguments(self) -> None:
        args = dict(foo="10.2", bar="a=b", baz="a?b", quux="a@@ b")
        assert bus.format_url_query_arguments("url", args) == "url?foo=10.2&bar=a%3Db&baz=a%3Fb&quux=a%40%40+b"

class Test_indent:
    TEXT = "some text\nto indent\n  goes here"

    def test_default_args(self) -> None:
        assert bus.indent(self.TEXT) == "  some text\n  to indent\n    goes here"

    def test_with_n(self) -> None:
        assert bus.indent(self.TEXT, n=3) == "   some text\n   to indent\n     goes here"

    def test_with_ch(self) -> None:
        assert bus.indent(self.TEXT, ch="-") == "--some text\n--to indent\n--  goes here"


class Test_nice_join:
    def test_default(self) -> None:
        assert bus.nice_join(["one"]) == "one"
        assert bus.nice_join(["one", "two"]) == "one or two"
        assert bus.nice_join(["one", "two", "three"]) == "one, two or three"
        assert bus.nice_join(["one", "two", "three", "four"]) == "one, two, three or four"

    def test_string_conjunction(self) -> None:
        assert bus.nice_join(["one"], conjuction="and") == "one"
        assert bus.nice_join(["one", "two"], conjuction="and") == "one and two"
        assert bus.nice_join(["one", "two", "three"], conjuction="and") == "one, two and three"
        assert bus.nice_join(["one", "two", "three", "four"], conjuction="and") == "one, two, three and four"

    def test_None_conjunction(self) -> None:
        assert bus.nice_join(["one"], conjuction=None) == "one"
        assert bus.nice_join(["one", "two"], conjuction=None) == "one, two"
        assert bus.nice_join(["one", "two", "three"], conjuction=None) == "one, two, three"
        assert bus.nice_join(["one", "two", "three", "four"], conjuction=None) == "one, two, three, four"

    def test_sep(self) -> None:
        assert bus.nice_join(["one"], sep='; ') == "one"
        assert bus.nice_join(["one", "two"], sep='; ') == "one or two"
        assert bus.nice_join(["one", "two", "three"], sep='; ') == "one; two or three"
        assert bus.nice_join(["one", "two", "three", "four"], sep="; ") == "one; two; three or four"

def test_snakify() -> None:
    assert bus.snakify("MyClassName") == "my_class_name"
    assert bus.snakify("My1Class23Name456") == "my1_class23_name456"
    assert bus.snakify("MySUPERClassName") == "my_super_class_name"

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
