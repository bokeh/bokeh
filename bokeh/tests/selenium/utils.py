
from __future__ import absolute_import, print_function

import os
import re
import sys
import glob
import requests

from subprocess import check_output, Popen, PIPE

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
    dir = os.path.join(str(dir), '../share/')

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
            raise ValueError("Unsupported method: %s" % (method))
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
            raise ValueError("Unsupported method: %s" % (method))
    except TimeoutException:
        assert 0, "Can't find %s !" % (element)

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
            raise ValueError("Unsupported method: %s" % (method))
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


def check_if_images_are_the_same(ref_file, gen_file):
    diff_file = os.path.splitext(ref_file)[0] + "-diff.png"

    cmd = [ 'perceptualdiff', '-output', diff_file, gen_file, ref_file ]

    try:
        proc = Popen(cmd, stdout=PIPE, stderr=PIPE)
        code = proc.wait()
    except OSError:
        print("Failed to run: {0}".format(cmd))
        sys.exit(1)

    if code != 0:
        return False
    else:
        return True


def ret_screenshot_path(settings, file_name):
    file_name = os.path.splitext(file_name)[0] + '-' + settings.browser_engine +'.png'

    return os.path.join(settings.screenshot_dir, file_name)


def take_screenshot(driver, output_file, win_width, win_height):
    driver.set_window_size(win_width, win_height)
    driver.save_screenshot(output_file)


def download_ref_screenshots(site_address, output_dir, files):

    for file in files:
        file = os.path.basename(file)
        downloaded_file = os.path.join(output_dir, file)

        if not os.path.exists(downloaded_file):
            url = os.path.join(site_address, file)
            response = requests.get(url)

            print("Downloading {}".format(url))

            if not response.ok:
                assert 0, "Couldn't download file: {}".format(url)

            with open(downloaded_file, "wb") as f:
                f.write(response.content)


class TestBrowserCaps(object):

    def __init__(self, metadata, **kwargs):
        self.metadata = metadata

        self.platform = kwargs.get('platform', None)

        if not self.platform:
            self.platform = 'linux'

        if not check_for_proper_arg(self.platform, self.metadata.platforms):
            print("Invalid testing environment type: %s" % (self.platform))
            sys.exit(1)

        self.version = kwargs.get('version', None)

        if not self.version:
            self.version = '1.0.0'
