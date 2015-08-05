from __future__ import absolute_import

import unittest
import warnings
from bokeh.models.actions import Callback, OpenURL, Action


class ActionsDeprecationTests(unittest.TestCase):

    def _test_for_future_warning(self, ClassFunction):
        with warnings.catch_warnings(record=True) as w:
            ClassFunction()
            self.assertEqual(len(w), 1)
            self.assertTrue(w[0].category is FutureWarning)

    def test_actions_callback_is_deprecated(self):
        self._test_for_future_warning(Callback)

    def test_actions_openurl_is_deprecated(self):
        self._test_for_future_warning(OpenURL)

    def test_actions_action_is_deprecated(self):
        self._test_for_future_warning(Action)
