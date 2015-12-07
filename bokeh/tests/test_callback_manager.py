from __future__ import absolute_import, print_function

import unittest

from bokeh.util.callback_manager import _check_callback, _callback_argspec
from functools import partial

class TestCallbackManager(unittest.TestCase):

    def test_successful_check_callback_partial_function(self):

        def f(foo, bar, baz, check="check", check1="check1"):
            pass

        p = partial(f, check="test", check1="test1")
        try:
            _check_callback(p, ('attr', 'old', 'new'))
        except:
            self.fail("Callback check failed")

    def test_successful_check_callback_partial_method(self):

        class Klass(object):
            def f(self, foo, bar, baz, check="check", check1="check1"):
                pass

        k = Klass()
        p = partial(k.f, check="test", check1="test1")
        try:
            _check_callback(p, ('attr', 'old', 'new'))
        except:
            self.fail("Callback check failed")
