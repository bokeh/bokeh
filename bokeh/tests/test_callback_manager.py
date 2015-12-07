from __future__ import absolute_import, print_function

import unittest

from bokeh.util.callback_manager import _check_callback
from functools import partial

class Klass(object):

    def callback1(self, attr, old, new):
        pass

    def callback2(self, attr, old, new, check="check", check1="check1"):
        pass


class TestCallbackManager(unittest.TestCase):

    def setUp(self):
        self.expected_args = ('attr', 'old', 'new')

    def test_successful_check_callback_function(self):

        def f(foo, bar, baz):
            pass

        try:
            _check_callback(f, self.expected_args)
        except:
            self.fail("Callback check failed")

    def test_successful_check_callback_function_with_kwarg(self):

        def f(foo, bar, baz, check="check"):
            pass

        try:
            _check_callback(f, self.expected_args)
        except:
            self.fail("Callback check failed")

    def test_successful_check_callback_lambda(self):

        try:
            _check_callback(lambda x, y, z: (x, y, z), self.expected_args)
        except:
            self.fail("Callback check failed")

    def test_successful_check_callback_method(self):
        try:
            k = Klass()
            _check_callback(k.callback1, self.expected_args)
        except:
            self.fail("Callback check failed")

    def test_successful_check_callback_partial_function(self):

        def f(foo, bar, baz, blank):
            pass

        p = partial(f, 'test')
        try:
            _check_callback(p, self.expected_args)
        except:
            self.fail("Callback check failed")

    def test_successful_check_callback_partial_method(self):
        k = Klass()
        p = partial(k.callback2, check="test", check1="test1")
        try:
            _check_callback(p, self.expected_args)
        except:
            raise
            self.fail("Callback check failed")

    def test_raises_value_error_on_invalid_callback(self):
        self.assertRaises(ValueError, _check_callback, lambda x: x, self.expected_args)
