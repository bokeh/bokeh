
from __future__ import absolute_import, print_function

import os
from flask.ext.testing import LiveServerTestCase


class RawSeleniumTestFixture(LiveServerTestCase):
    """
    Raw basic fixture which initialize bokeh server and selenium environment as well.
    """

    def setUp(self):
        from bokeh.selenium.utils import initialize_standalone_testing_env, initialize_distributive_testing_env
        from bokeh.selenium.run_selenium_tests import settings as test_settings

        LiveServerTestCase.setUp(self)

        # TODO:
        # - Uncomment below line when proper bokeh server initialization will be added in 'create_app' function.
        #self.check_if_server_is_up_and_running()

        self.test_settings = test_settings

        if self.test_settings.headless_mode:
            if os.environ.has_key('DISPLAY'):
                os.environ['OLD_DISPLAY'] = os.environ['DISPLAY']
            os.environ['DISPLAY'] = self.test_settings.headless_mode_display

        if self.test_settings.env_mode == 'standalone':
            os.environ['SELENIUM_SERVER_JAR'] = self.test_settings.selenium_server_jar_path

            self.driver = initialize_standalone_testing_env(self.test_settings.browser_engine,
                self.test_settings.get_browser_bin(self.test_settings.browser_engine))
        elif self.test_settings.env_mode == 'distributive':
            self.driver = initialize_distributive_testing_env(self.test_settings.browser_engine,
                self.test_settings.browser_caps, self.test_settings.selenium_hub_address)
        else:
            print("Unsupported mode of testing environment: %s" % (self.test_settings.env_mode))
            sys.exit(1)

        self.driver.start_client()

        self.addCleanup(self.driver.quit)

    def create_app(self):
        from bokeh.server.app import app

        # TODO:
        # - Setup appropriate bokeh server initialization.

        return app

    def check_if_server_is_up_and_running(self):
        from urllib2 import urlopen

        response = urlopen(self.get_server_url())
        self.assertEqual(response.code, 200)

    def tearDown(self):
        if self.test_settings.headless_mode:
            if os.environ.has_key('OLD_DISPLAY'):
                os.environ['DISPLAY'] = os.environ['OLD_DISPLAY']
                del os.environ['DISPLAY']

        LiveServerTestCase.tearDown(self)


class BasicSeleniumTestFixture(RawSeleniumTestFixture):
    """
    Basic fixture which guarantee clean testing environment.
    """

    def setUp(self):
        RawSeleniumTestFixture.setUp(self)

    def tearDown(self):
        RawSeleniumTestFixture.tearDown(self)
