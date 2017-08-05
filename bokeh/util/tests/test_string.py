from __future__ import absolute_import

from bokeh.util.string import snakify, format_docstring

def test_snakify():
    assert snakify("MyClassName") == "my_class_name"
    assert snakify("My1Class23Name456") == "my1_class23_name456"
    assert snakify("MySUPERClassName") == "my_super_class_name"

def test_format_docstring_no_argument():
    doc__ = "hello world"
    assert format_docstring(doc__) == doc__
    doc__ = None
    assert format_docstring(doc__) == None

def test_format_docstring_arguments_unused():
    doc__ = "hello world"
    assert format_docstring(doc__, 'hello ', not_used='world') == doc__
    doc__ = None
    assert format_docstring(doc__, 'hello ', not_used='world') == None

def test_format_docstring_arguments():
    doc__ = "-- {}{as_parameter} --"
    assert format_docstring(doc__, 'hello ', as_parameter='world') == "-- hello world --"
    doc__ = None
    assert format_docstring(doc__, 'hello ', as_parameter='world') == None
