from __future__ import absolute_import

from bokeh.util.string import snakify

def test_snakify():
    assert snakify("MyClassName") == "my_class_name"
    assert snakify("My1Class23Name456") == "my1_class23_name456"
    assert snakify("MySUPERClassName") == "my_super_class_name"
