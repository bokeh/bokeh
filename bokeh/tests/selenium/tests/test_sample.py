
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
        ref_file = self.test_settings.screenshot_dir+'/ref-screenshot-01.png'
        gen_file = self.test_settings.screenshot_dir+'/gen-screenshot-01.png'

        self.load_document(doc_name)

        # TODO:
        # - Put here valid test.

        plot = look_for_element(self.driver, "div.bk-canvas-events")

        now = self.actions.move_to_element(plot)
        now.drag_and_drop_by_offset(plot, 100, 0)
        now.perform()

        self.driver.save_screenshot(gen_file)

        if not check_if_images_are_the_same(ref_file, gen_file):
            assert 0, "No expected output from screenshot, according to {0}".format(ref_file)

        self.unload_document(doc_name)
