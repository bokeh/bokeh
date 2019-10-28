#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import atexit
import shutil
from os.path import devnull
from typing import Any, Optional

# External imports
from typing_extensions import Literal

# Bokeh imports
from ..util.dependencies import import_optional, import_required

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

webdriver = import_required('selenium.webdriver',
                            'To use bokeh.io image export functions you need selenium ' +
                            '("conda install selenium" or "pip install selenium")')

DriverKind = Literal["firefox", "chromium"]

WebDriver = Any

__all__ = (
    'webdriver_control',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def create_firefox_webdriver() -> WebDriver:
    options = webdriver.firefox.options.Options()
    options.add_argument("--headless")
    return webdriver.Firefox(options=options, log_path=devnull)

def create_chromium_webdriver() -> WebDriver:
    options = webdriver.chrome.options.Options()
    options.add_argument("--headless")
    return webdriver.Chrome(options=options) # log_path=devnull

"""
import shutil
from subprocess import Popen, PIPE
from packaging.version import Version as V
from ..settings import settings
def detect_phantomjs(version='2.1'):
    ''' Detect if PhantomJS is avaiable in PATH, at a minimum version.

    Args:
        version (str, optional) :
            Required minimum version for PhantomJS (mostly for testing)

    Returns:
        str, path to PhantomJS

    '''
    if settings.phantomjs_path() is not None:
        phantomjs_path = settings.phantomjs_path()
    else:
        phantomjs_path = shutil.which("phantomjs") or "phantomjs"

    try:
        proc = Popen([phantomjs_path, "--version"], stdout=PIPE, stderr=PIPE)
        (stdout, stderr) = proc.communicate()

        if len(stderr) > 0:
            raise RuntimeError('Error encountered in PhantomJS detection: %r' % stderr.decode('utf8'))

        required = V(version)
        installed = V(stdout.decode('utf8'))
        if installed < required:
            raise RuntimeError('PhantomJS version to old. Version>=%s required, installed: %s' % (required, installed))

    except OSError:
        raise RuntimeError('PhantomJS is not present in PATH or BOKEH_PHANTOMJS_PATH. Try "conda install phantomjs" or \
            "npm install -g phantomjs-prebuilt"')

    return phantomjs_path

class Test_detect_phantomjs(object):

    def test_detect_phantomjs_success(self):
        assert dep.detect_phantomjs() is not None

    def test_detect_phantomjs_bad_path(self, monkeypatch):
        monkeypatch.setenv("BOKEH_PHANTOMJS_PATH", "bad_path")
        with pytest.raises(RuntimeError):
            dep.detect_phantomjs()

    def test_detect_phantomjs_bad_version(self):
        with pytest.raises(RuntimeError) as e:
            dep.detect_phantomjs('10.1')
        assert str(e.value).endswith("PhantomJS version to old. Version>=10.1 required, installed: 2.1.1")

    def test_detect_phantomjs_default_required_version(self):
        assert dep.detect_phantomjs.__defaults__ == ('2.1',)


    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", ".*", UserWarning, "selenium.webdriver.???.webdriver")
"""

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

class _WebdriverState(object):
    '''

    '''

    _reuse: bool
    _kind: DriverKind

    current: Optional[WebDriver]

    def __init__(self, reuse: bool = True, kind: DriverKind = "firefox"):
        self.reuse = reuse
        self.kind = kind
        self.current = None

    @staticmethod
    def terminate(driver: WebDriver) -> None:
        driver.quit()

    def reset(self) -> None:
        if self.current is not None:
            self.terminate(self.current)
            self.current = None

    def get(self) -> WebDriver:
        if not self.reuse or self.current is None:
            if self.current is not None:
                self.terminate(self.current)
            self.current = self.create()
        return self.current

    def create(self) -> WebDriver:
        if self.kind == "firefox":
            return create_firefox_webdriver()
        elif self.kind == "chromium":
            return create_chromium_webdriver()
        else:
            raise ValueError(f"Unknown webdriver kind {self.kind}")

    @property
    def reuse(self) -> bool:
        return self._reuse

    @reuse.setter
    def reuse(self, value: bool) -> None:
        self._reuse = value

    @property
    def kind(self) -> DriverKind:
        return self._kind

    @kind.setter
    def kind(self, value: DriverKind) -> None:
        self._kind = value

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

webdriver_control = _WebdriverState()

atexit.register(lambda: webdriver_control.reset())
