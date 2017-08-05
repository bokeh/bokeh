import base64

from os.path import exists
from tests.plugins.image_diff import image_diff


class ScreenshotMismatchError(AssertionError):
    """ Custom assertion error for report handling. """
    def __init__(self, *args, **kwargs):
        super(AssertionError, self).__init__(*args, **kwargs)


class Screenshot(object):

    def __init__(self, item=None, request=None, set_new_base=False):
        if item:
            self.driver = getattr(item, '_driver', None)
            thing = item
        if request:
            self.driver = getattr(request.node, '_driver', None)
            thing = request
        assert self.driver is not None
        self.base_screenshot_path = self.get_screenshot_path_root(thing, 'base')
        self.current_screenshot_path = self.get_screenshot_path_root(thing, 'current')
        self.diff_screenshot_path = self.get_screenshot_path_root(thing, 'diff')
        self.set_new_base = set_new_base

    @classmethod
    def get_screenshot_path_root(cls, item, prefix):
        # Get the path for the screenshot based on the test name
        #
        # item: Can be item or request

        screenshot_dir = item.fspath.dirpath().join('screenshots')
        screenshot_dir.ensure_dir()
        test_file = item.fspath.basename.split('.py')[0]
        test_name = item.function.__name__
        screenshot_path_root = screenshot_dir.join(prefix + '__' + test_file + '__' + test_name + '.png')
        return screenshot_path_root.strpath

    @classmethod
    def get_screenshot_as_b64(cls, path):
        with open(path, 'rb') as f:
            screenshot = f.read()
        b64_screenshot = base64.b64encode(screenshot).decode("utf-8")
        return b64_screenshot

    def set_current_screenshot(self):
        self.driver.get_screenshot_as_file(self.current_screenshot_path)

    def set_base_screenshot(self):
        self.driver.get_screenshot_as_file(self.base_screenshot_path)

    def get_diff_as_base64(self):
        if exists(self.diff_screenshot_path):
            return self.get_screenshot_as_b64(self.diff_screenshot_path)

    def get_base_as_base64(self):
        if exists(self.base_screenshot_path):
            return self.get_screenshot_as_b64(self.base_screenshot_path)

    def get_current_as_base64(self):
        if exists(self.base_screenshot_path):
            return self.get_screenshot_as_b64(self.current_screenshot_path)

    def assert_is_valid(self):
        self.set_current_screenshot()
        if self.set_new_base:
            self.set_base_screenshot()
        image_diff_result = image_diff(
            self.diff_screenshot_path,
            self.base_screenshot_path,
            self.current_screenshot_path
        )
        if image_diff_result != 0:
            __tracebackhide__ = True
            raise ScreenshotMismatchError("The current screenshot doesn't match the base image.")
