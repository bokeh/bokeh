
from __future__ import absolute_import, print_function

import os
import sys
import unittest

from selenium.common.exceptions import NoSuchElementException

from bokeh.tests.selenium.fixtures import BasicSeleniumTestFixture
from bokeh.tests.selenium.utils import look_for_element, check_if_images_are_the_same


class TestGestures(BasicSeleniumTestFixture):
    """
    Gestures test - check if all gestures work as expected.
    """

    @unittest.skip("Now implemented yet.")
    def test_box_select_tool(self):
        pass

    def test_box_zoom_tool(self):

        doc_name = 'area_chart'
        ref_file = self.test_settings.screenshot_dir+'/ref-screenshot-box-zoom-tool.png'
        gen_file = self.test_settings.screenshot_dir+'/gen-screenshot-box-zoom-tool.png'

        document_url = self.load_document(doc_name)

        box_zoom_button = look_for_element(self.driver, "span.bk-handler-box-zoom")

        box_zoom_button.click()

        plot = look_for_element(self.driver, "div.bk-canvas-events")

        now = self.actions.move_to_element(plot)
        now.drag_and_drop_by_offset(plot, 120, -40)
        now.perform()

        self.driver.save_screenshot(gen_file)

        if not check_if_images_are_the_same(ref_file, gen_file):
            assert 0, "No expected output from {} - according to {}".format(gen_file, ref_file)

    @unittest.skip("Now implemented yet.")
    def test_lasso_select_tool(self):
        pass

    def test_pan_tool(self):
        """Check if pan tool is working as expected."""

        doc_name = 'simple_line'
        ref_file = self.test_settings.screenshot_dir+'/ref-screenshot-pan-tool.png'
        gen_file = self.test_settings.screenshot_dir+'/gen-screenshot-pan-tool.png'

        document_url = self.load_document(doc_name)

        plot = look_for_element(self.driver, "div.bk-canvas-events")

        now = self.actions.move_to_element(plot)
        now.drag_and_drop_by_offset(plot, 100, -20)
        now.perform()

        self.driver.save_screenshot(gen_file)

        if not check_if_images_are_the_same(ref_file, gen_file):
            assert 0, "No expected output from {} - according to {}".format(gen_file, ref_file)

    @unittest.skip("Now implemented yet.")
    def test_poly_select_tool(self):
        pass

    def test_reset_tool(self):
        doc_name = 'area_chart'
        ref_file = self.test_settings.screenshot_dir+'/ref-screenshot-reset-tool.png'
        gen_file = self.test_settings.screenshot_dir+'/gen-screenshot-reset-tool.png'

        self.test_box_zoom_tool()

        reset_button = look_for_element(self.driver, "span.bk-handler-reset")

        reset_button.click()

        self.driver.save_screenshot(gen_file)

        if not check_if_images_are_the_same(ref_file, gen_file):
            assert 0, "No expected output from {} - according to {}".format(gen_file, ref_file)

    @unittest.skip("Now implemented yet.")
    def test_resize_tool(self):
        pass

    @unittest.skip("Now implemented yet.")
    def test_tap_tool(self):
        pass

    @unittest.skip("Now implemented yet.")
    def test_wheel_zoom_tool(self):
        """Check if wheel zoom tool is working as expected."""

        doc_name = 'area_chart'
        ref_in_file = self.test_settings.screenshot_dir+'/ref-screenshot-wheel-zoom-in-tool.png'
        ref_out_file = self.test_settings.screenshot_dir+'/ref-screenshot-wheel-zoom-out-tool.png'
        gen_in_file = self.test_settings.screenshot_dir+'/gen-screenshot-wheel-zoom-in-tool.png'
        gen_out_file = self.test_settings.screenshot_dir+'/gen-screenshot-wheel-zoom-out-tool.png'

        document_url = self.load_document(doc_name)

        plot = look_for_element(self.driver, "div.bk-canvas-events")

        now = self.actions.move_to_element(plot)

        now.perform()

        # TODO:
        # - Invoke zoom in action under the plot.

        self.driver.save_screenshot(gen_in_file)

        if not check_if_images_are_the_same(ref_in_file, gen_in_file):
            assert 0, "No expected output from {} - according to {}".format(gen_in_file, ref_in_file)

        now = self.actions.move_to_element(plot)

        now.perform()

        # TODO:
        # - Invoke zoom out action under the plot.

        self.driver.save_screenshot(gen_out_file)

        if not check_if_images_are_the_same(ref_out_file, gen_out_file):
            assert 0, "No expected output from {} - according to {}".format(gen_out_file, ref_out_file)

