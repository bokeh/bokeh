
from __future__ import absolute_import, print_function

import os
import sys
import unittest

from selenium.common.exceptions import NoSuchElementException

from bokeh.selenium.fixtures import BasicSeleniumTestFixture
from bokeh.selenium.utils import look_for_element


class TestSample(BasicSeleniumTestFixture):
    """
    Sample test - just to check if basic selenium environment works as it is expected.
    """

    #@unittest.skip("Just a simple test - only for internal testing purposes.")
    def test_sample(self):
        """Simple test case."""

        # TODO:
        # - Right now only to show that selenium is working ok.
        # - After proper bokeh initialization the below test should be changed.
        self.driver.get('http://google.com')
        self.assertEqual(self.driver.title, 'Google')

if __name__ == '__main__':
    unittest.main()
