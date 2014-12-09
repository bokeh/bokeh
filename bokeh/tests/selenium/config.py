
from __future__ import absolute_import, print_function

import os
import sys
from shutil import rmtree

from .utils import TestBrowserCaps, check_for_proper_arg, get_latest_selenium_server_jar_path


DEF_CWD = os.path.abspath(os.path.dirname(os.path.realpath(__file__)))
DEF_BROWSER_ENGINE = 'phantomjs'
DEF_ENVIRONMENT_MODE = 'standalone'
DEF_DATA_DIR = '../selenium/data'
DEF_DOWNLOAD_DIR = '../selenium/down'
DEF_HEADLESS_MODE = False
DEF_HEADLESS_MODE_DISPLAY = ':25'
DEF_SELENIUM_HUB_ADDRESS = 'http://178.62.188.78:4444/wd/hub'


class TestMetadata(object):

    def __init__(self, cwd=DEF_CWD):
        self.cwd = cwd

        if not os.path.exists(self.cwd):
            print("The cwd '%s' doesn't exists!" % (self.cwd))
            sys.exit(1)

        if not os.path.isdir(self.cwd):
            print("The cwd'%s' is not a directory!" % (self.cwd))
            sys.exit(1)

        self.env_mode = 'standalone'
        self.env_modes = [ 'distributive', 'standalone' ]

        self.platforms = [ 'linux', 'windows', 'macosx' ]

        self.standalone_browsers_bin = {
            'chrome' :      'chromedriver',
            'firefox' :     'firefox',
            'ie' :          'iexplore',
            'opera' :       'opera',
            'phantomjs' :   'phantomjs',
            'safari' :      'safari',
        }
        self.distributive_browsers_caps = {
            'chrome' :      [ TestBrowserCaps(metadata=self, version='39.0.2171.65'), ],
            'firefox' :     [ TestBrowserCaps(metadata=self, version='34.0'), ],
            'ie' :          [ TestBrowserCaps(metadata=self, platform='windows', version='8'), ],
            'opera' :       [ TestBrowserCaps(metadata=self, version='12.16'), ],
            'phantomjs' :   [ TestBrowserCaps(metadata=self, version='1.9.7'), ],
            'safari' :      [ TestBrowserCaps(metadata=self, platform='macosx', version='7.0'), ],
        }

        self.browser_engines = self.standalone_browsers_bin.keys()
        self.browser_engine = DEF_BROWSER_ENGINE
        self.browser_caps = self.get_default_browser_caps(self.browser_engine)

        self.selenium_hub_address = DEF_SELENIUM_HUB_ADDRESS

        self.selenium_server_jar_path = get_latest_selenium_server_jar_path()

        self.data_dir = os.path.abspath(os.path.join(self.cwd, DEF_DATA_DIR))
        self.down_dir = os.path.abspath(os.path.join(self.cwd, DEF_DOWNLOAD_DIR))

        self.headless_mode = DEF_HEADLESS_MODE
        self.headless_mode_display = DEF_HEADLESS_MODE_DISPLAY

    def get_browser_bin(self, browser):
        return self.standalone_browsers_bin[browser]

    def print_default_browser_caps(self):
        for browser, caps in self.distributive_browsers_caps.iteritems():
            _counter = 0

            print("\n%s:" % (browser))
            for cap in caps:
                print("\tplatform: %s" % (cap.platform))
                print("\tversion:  %s" % (cap.version))
                if not _counter == 0:
                    print("")
                _counter += 1

    def get_default_browser_caps(self, browser):
        return self.distributive_browsers_caps[browser][0]

    def get_default_browser_cap(self, browser, capability='platform'):
        if capability == 'platform':
            return self.distributive_browsers_caps[browser][0].platform
        elif capability == 'version':
            return self.distributive_browsers_caps[browser][0].version
        else:
            print("Internal error, no support for capability: %s" % (cap_name))
            sys.exit(1)


class TestSettings(object):

    def __init__(self, metadata=None, **kwargs):
        if not metadata:
            self.metadata = TestMetadata()
        else:
            self.metadata = metadata

        if kwargs.has_key('env_mode'):
            self.env_mode = kwargs.get('env_mode')
        else:
            self.env_mode = None

        if not self.env_mode:
            self.env_mode = 'standalone'

        if not check_for_proper_arg(self.env_mode, self.metadata.env_modes):
            print("Invalid testing environment type: %s" % (self.env_mode))
            sys.exit(1)

        if kwargs.has_key('browser_engine'):
            self.browser_engine = kwargs.get('browser_engine')
        else:
            self.browser_engine = None

        if not self.browser_engine:
            self.browser_engine = self.metadata.browser_engine

        if not check_for_proper_arg(self.browser_engine, self.metadata.browser_engines):
            print("Invalid browser_engine: %s" % (self.browser_engine))
            sys.exit(1)

        if kwargs.has_key('browser_caps'):
            self.browser_caps = kwargs.get('browser_caps')
        else:
            self.browser_caps = None

        if not self.browser_caps:
            self.browser_caps = self.metadata.browser_caps

        self.standalone_browsers_bin = self.metadata.standalone_browsers_bin.copy()

        if kwargs.has_key('standalone_browsers_bin'):
            for key, value in kwargs.get('standalone_browsers_bin').iteritems():

                if self.standalone_browsers_bin.has_key(key):
                    self.standalone_browsers_bin.update({key:value})
                else:
                    print("Non existent 'browser_engine' key: %s" % (key))
                    sys.exit(1)

        if kwargs.has_key('selenium_server_jar_path'):
            self.selenium_server_jar_path = kwargs.get('selenium_server_jar_path')
        else:
            self.selenium_server_jar_path = None

        if not self.selenium_server_jar_path:
            self.selenium_server_jar_path = self.metadata.selenium_server_jar_path

        if kwargs.has_key('data_dir'):
            self.data_dir = kwargs.get('data_dir')
        else:
            self.data_dir = None

        if not self.data_dir:
            self.data_dir = self.metadata.data_dir

        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)

        if not os.path.isdir(self.data_dir):
            print("The data dir '%s' is not a directory!" % (self.data_dir))
            sys.exit(1)

        if kwargs.has_key('down_dir'):
            self.down_dir = kwargs.get('down_dir')
        else:
            self.down_dir = None

        if not self.down_dir:
            self.down_dir = self.metadata.down_dir

        if os.path.exists(self.down_dir):
            rmtree(self.down_dir)

        os.makedirs(self.down_dir)

        if kwargs.has_key('headless_mode'):
            self.headless_mode = kwargs.get('headless_mode')
        else:
            self.headless_mode = None

        if not self.headless_mode:
            self.headless_mode = self.metadata.headless_mode

        if kwargs.has_key('headless_mode_display'):
            self.headless_mode_display = kwargs.get('headless_mode_display')
        else:
            self.headless_mode_display = None

        if not self.headless_mode_display:
            self.headless_mode_display = self.metadata.headless_mode_display

        if kwargs.has_key('selenium_hub_address'):
            self.selenium_hub_address = kwargs.get('selenium_hub_address')
        else:
            self.selenium_hub_address = None

        if not self.selenium_hub_address:
            self.selenium_hub_address = self.metadata.selenium_hub_address

    def get_server_address(self):
        return self.get_server_url()

    def get_browser_bin(self, browser=None):
        browser = browser or self.browser_engine

        return self.standalone_browsers_bin[browser]
