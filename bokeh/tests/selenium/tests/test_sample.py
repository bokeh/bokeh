
from __future__ import absolute_import, print_function

import os
import sys
import unittest

from selenium.common.exceptions import NoSuchElementException

from bokeh.tests.selenium.fixtures import BasicSeleniumTestFixture
from bokeh.tests.selenium.utils import look_for_element, check_if_images_are_the_same


class TestSample(BasicSeleniumTestFixture):
    """
    Sample test - just to check if basic selenium environment works as it is expected.
    """

    #@unittest.skip("Just a simple test - only for internal testing purposes.")
    def test_sample(self):
        """Check if we are able to load basic document to boker server."""

        doc_name = 'simple_line'

        self.load_document(doc_name)

        # TODO:
        # - Put here valid test.

        self.unload_document(doc_name)
