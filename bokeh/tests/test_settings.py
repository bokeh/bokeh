from __future__ import absolute_import, print_function

import logging
import os
from bokeh.settings import settings

logging.basicConfig(level=logging.DEBUG)


class TestSettings(object):
    def test_get_list_single(self):
        os.environ["BOKEH_FOO"] = "foo"
        result = settings._get_list("FOO", None)
        assert result == ["foo"]
        del os.environ["BOKEH_FOO"]

    def test_get_list_multiple(self):
        os.environ["BOKEH_FOO"] = "foo,bar,foobar"
        result = settings._get_list("FOO", None)
        assert result == ["foo", "bar", "foobar"]
        del os.environ["BOKEH_FOO"]

    def test_get_list_default(self):
        result = settings._get_list("FOO", None)
        assert result is None
