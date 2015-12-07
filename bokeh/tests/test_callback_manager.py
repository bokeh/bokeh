from __future__ import absolute_import, print_function

import unittest

from bokeh.util.callback_manager import _check_callback, _callback_argspec
from functools import partial

class TestCallbackManager(unittest.TestCase):

    def test_successful_check_callback_partial(self):

        def f(foo, bar, check="check"):
            pass

        p = partial(f, check="test")
        try:
            _check_callback(p, ('attr', 'old', 'new'))
        except:
            self.fail("Callback check failed")
