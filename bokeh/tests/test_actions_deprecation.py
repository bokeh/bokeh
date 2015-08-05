from __future__ import absolute_import

import unittest
import warnings

from bokeh.models import Action as modelsAction
from bokeh.models.actions import Callback, OpenURL, Action
from bokeh.models import callbacks


class ActionsDeprecationTests(unittest.TestCase):

    # Test warnings

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

    def test_models_action_is_deprecated(self):
        self._test_for_future_warning(modelsAction)

    # Test new return classes

    def test_actions_callback_returns_callbacks_customjs(self):
        callback = Callback()
        self.assertIsInstance(callback, callbacks.CustomJS)

    def test_actions_openurl_returns_callbacks_openurl(self):
        openurl = OpenURL()
        self.assertIsInstance(openurl, callbacks.OpenURL)

    def test_actions_action_returns_callbacks_callback(self):
        action = Action()
        self.assertIsInstance(action, callbacks.Callback)

    def test_models_action_returns_callbacks_callback(self):
        models_action = modelsAction()
        self.assertIsInstance(models_action, callbacks.Callback)
