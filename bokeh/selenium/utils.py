
from __future__ import absolute_import, print_function

import os
import re
import sys
import glob

from subprocess import check_output

from selenium import selenium, webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import NoSuchElementException, TimeoutException

from selenium.webdriver.support.wait import WebDriverWait as WDW
from selenium.webdriver.support import expected_conditions as EC


DEF_WDW_WAIT_TIME = 10


def initialize_standalone_testing_env(browser, browser_bin):

    if not browser == 'ie':
        browser_bin_path = check_output(['which', browser_bin]).strip()

    if browser == 'chrome':
        os.environ["webdriver.chrome.driver"] = browser_bin_path

        return webdriver.Chrome(executable_path=browser_bin_path)
    elif browser == 'firefox':
        return webdriver.Firefox()
    elif browser == 'ie':
        browser_bin_path = ""

        return webdriver.Ie(executable_path=browser_bin_path)
    elif browser == 'opera':
        os.environ['OPERA_PATH'] = browser_bin_path

        return webdriver.Opera()
    elif browser == 'phantomjs':
        return webdriver.PhantomJS()
    elif browser == 'safari':
        return webdriver.Safari(executable_path=browser_bin_path)
    else:
        print("Internal error, not supported browser: %s" % (browser))
        sys.exit(1)


def initialize_distributive_testing_env(browser, browser_caps, selenium_hub_address):
    if browser == 'chrome':
        caps = webdriver.DesiredCapabilities.CHROME.copy()
    elif browser == 'firefox':
        caps = webdriver.DesiredCapabilities.FIREFOX.copy()
    elif browser == 'ie':
        caps = webdriver.DesiredCapabilities.INTERNETEXPLORER.copy()
    elif browser == 'opera':
        caps = webdriver.DesiredCapabilities.OPERA.copy()
    elif browser == 'phantomjs':
        print("The phantomjs browser engine is not available right now!")
        print("Bug: https://code.google.com/p/selenium/issues/detail?id=8102")
        sys.exit(1)
        caps = webdriver.DesiredCapabilities.PHANTOMJS.copy()
    elif browser == 'safari':
        caps = webdriver.DesiredCapabilities.SAFARI.copy()
    else:
        print("Internal error, not supported browser: %s" % (browser))
        sys.exit(1)

    caps.update({'platform':browser_caps.platform.upper()})
    caps.update({'version':browser_caps.version})

    return webdriver.Remote(selenium_hub_address, caps)


def get_latest_selenium_server_jar_path():
    selenium_servers = []
    selenium_server_jar_path = ''
    selenium_server_bin_path = check_output(['which', 'selenium-server-standalone']).strip()

    dir = os.path.dirname(selenium_server_bin_path)
    dir = os.path.join(dir, '../share/')

    for file in glob.glob(dir+"selenium-server-standalone-*.jar"):
        if os.path.isfile(file):
            selenium_servers.append(file)

    if not selenium_servers:
        return ''

    selenium_servers.reverse()

    selenium_server_jar_path = selenium_servers[0]
    selenium_server_jar_path = os.path.abspath(selenium_server_jar_path)

    return selenium_server_jar_path


def check_for_proper_arg(arg, choices):
    if arg in choices:
        return True

    return False


def param_type_check(param, type):
    if not isinstance(param, type):
        raise TypeError("Parameter '%s' is not %s" % (param, type))


def release_list(l):
    del l[:]
    del l


def check_if_element_exists(driver, element, method='css_selector'):
    try:
        if method == 'css_selector':
            ret = WDW(driver, DEF_WDW_WAIT_TIME).until(EC.presence_of_element_located((By.CSS_SELECTOR, element)))
        elif method == 'class_name':
            ret = WDW(driver, DEF_WDW_WAIT_TIME).until(EC.presence_of_element_located((By.CLASS_NAME, element)))
        elif method == 'id':
            ret = WDW(driver, DEF_WDW_WAIT_TIME).until(EC.presence_of_element_located((By.ID, element)))
        elif method == 'link_text':
            ret = WDW(driver, DEF_WDW_WAIT_TIME).until(EC.presence_of_element_located((By.LINK_TEXT, element)))
        elif method == 'name':
            ret = WDW(driver, DEF_WDW_WAIT_TIME).until(EC.presence_of_element_located((By.NAME, element)))
        elif method == 'partial_link_text':
            ret = WDW(driver, DEF_WDW_WAIT_TIME).until(EC.presence_of_element_located((By.PARTIAL_LINK_TEXT, element)))
        elif method == 'tag_name':
            ret = WDW(driver, DEF_WDW_WAIT_TIME).until(EC.presence_of_element_located((By.TAG_NAME, element)))
        elif method == 'xpath':
            ret = WDW(driver, DEF_WDW_WAIT_TIME).until(EC.presence_of_element_located((By.XPATH, element)))
        else:
            raise ValueError("Unsupported method: %s" % (method))
    except TimeoutException:
        return False

    return True


def check_if_elements_exist(driver, element, method='css_selector'):
    try:
        if method == 'css_selector':
            ret = WDW(driver, DEF_WDW_WAIT_TIME).until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, element)))
        elif method == 'class_name':
            ret = WDW(driver, DEF_WDW_WAIT_TIME).until(EC.presence_of_all_elements_located((By.CLASS_NAME, element)))
        elif method == 'id':
            ret = WDW(driver, DEF_WDW_WAIT_TIME).until(EC.presence_of_all_elements_located((By.ID, element)))
        elif method == 'link_text':
            ret = WDW(driver, DEF_WDW_WAIT_TIME).until(EC.presence_of_all_elements_located((By.LINK_TEXT, element)))
        elif method == 'name':
            ret = WDW(driver, DEF_WDW_WAIT_TIME).until(EC.presence_of_all_elements_located((By.NAME, element)))
        elif method == 'partial_link_text':
            ret = WDW(driver, DEF_WDW_WAIT_TIME).until(EC.presence_of_all_elements_located((By.PARTIAL_LINK_TEXT, element)))
        elif method == 'tag_name':
            ret = WDW(driver, DEF_WDW_WAIT_TIME).until(EC.presence_of_all_elements_located((By.TAG_NAME, element)))
        elif method == 'xpath':
            ret = WDW(driver, DEF_WDW_WAIT_TIME).until(EC.presence_of_all_elements_located((By.XPATH, element)))
        else:
            print("Unsupported method: %s" % (method))
            sys.exit(1)
    except NoSuchElementException:
        return 0

    return len(ret)


def look_for_element(driver, element, method='css_selector'):
    try:
        if method == 'css_selector':
            ret = WDW(driver, DEF_WDW_WAIT_TIME).until(EC.presence_of_element_located((By.CSS_SELECTOR, element)))
        elif method == 'class_name':
            ret = WDW(driver, DEF_WDW_WAIT_TIME).until(EC.presence_of_element_located((By.CLASS_NAME, element)))
        elif method == 'id':
            ret = WDW(driver, DEF_WDW_WAIT_TIME).until(EC.presence_of_element_located((By.ID, element)))
        elif method == 'link_text':
            ret = WDW(driver, DEF_WDW_WAIT_TIME).until(EC.presence_of_element_located((By.LINK_TEXT, element)))
        elif method == 'name':
            ret = WDW(driver, DEF_WDW_WAIT_TIME).until(EC.presence_of_element_located((By.NAME, element)))
        elif method == 'partial_link_text':
            ret = WDW(driver, DEF_WDW_WAIT_TIME).until(EC.presence_of_element_located((By.PARTIAL_LINK_TEXT, element)))
        elif method == 'tag_name':
            ret = WDW(driver, DEF_WDW_WAIT_TIME).until(EC.presence_of_element_located((By.TAG_NAME, element)))
        elif method == 'xpath':
            ret = WDW(driver, DEF_WDW_WAIT_TIME).until(EC.presence_of_element_located((By.XPATH, element)))
        else:
            print("Unsupported method: %s" % (method))
            sys.exit(1)
    except TimeoutException:
        assert 0, "Can't find %s %s (handler: %s)!" % (element_name, element_type, element)

    return ret


def look_for_elements(driver, element, method='css_selector'):
    try:
        if method == 'css_selector':
            ret = WDW(driver, DEF_WDW_WAIT_TIME).until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, element)))
        elif method == 'class_name':
            ret = WDW(driver, DEF_WDW_WAIT_TIME).until(EC.presence_of_all_elements_located((By.CLASS_NAME, element)))
        elif method == 'id':
            ret = WDW(driver, DEF_WDW_WAIT_TIME).until(EC.presence_of_all_elements_located((By.ID, element)))
        elif method == 'link_text':
            ret = WDW(driver, DEF_WDW_WAIT_TIME).until(EC.presence_of_all_elements_located((By.LINK_TEXT, element)))
        elif method == 'name':
            ret = WDW(driver, DEF_WDW_WAIT_TIME).until(EC.presence_of_all_elements_located((By.NAME, element)))
        elif method == 'partial_link_text':
            ret = WDW(driver, DEF_WDW_WAIT_TIME).until(EC.presence_of_all_elements_located((By.PARTIAL_LINK_TEXT, element)))
        elif method == 'tag_name':
            ret = WDW(driver, DEF_WDW_WAIT_TIME).until(EC.presence_of_all_elements_located((By.TAG_NAME, element)))
        elif method == 'xpath':
            ret = WDW(driver, DEF_WDW_WAIT_TIME).until(EC.presence_of_all_elements_located((By.XPATH, element)))
        else:
            print("Unsupported method: %s" % (method))
            sys.exit(1)
    except NoSuchElementException:
        assert 0, "Can't find %s %s (handler: %s)!" % (element_name, element_type, element)

    return ret


def compare_two_lists_for_expected_equal_text_values(expected_values, www_elements):
    if not len(expected_values) == len(www_elements):
        assert 0, "Not equal number of elements!"

    values = []

    for element in www_elements:
        values.append(element.text)

    for expected_value in expected_values:
        if not expected_value in values:
            assert 0, "No expected '%s' has been found!" % (expected_value)


class TestBrowserCaps(object):

    def __init__(self, metadata, **kwargs):
        self.metadata = metadata

        if kwargs.has_key('platform'):
            self.platform = kwargs['platform']
        else:
            self.platform = None

        if not self.platform:
            self.platform = 'linux'

        if not check_for_proper_arg(self.platform, self.metadata.platforms):
            print("Invalid testing environment type: %s" % (self.platform))
            sys.exit(1)

        param_type_check(self.platform, str)

        if kwargs.has_key('version'):
            self.version = kwargs['version']
        else:
            self.version = None

        if not self.version:
            self.version = '1.0.0'

        param_type_check(self.version, str)
