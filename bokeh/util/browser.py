''' Utility functions for helping with operations involving browsers.

'''
from __future__ import absolute_import

from os.path import abspath
import webbrowser

from ..settings import settings

NEW_PARAM = {'tab': 2, 'window': 1}

class DummyWebBrowser(object):
    ''' A "no-op" web-browser controller.

    '''
    def open(self, url, new=0, autoraise=True):
        ''' Receive standard arguments and take no action. '''
        pass

def get_browser_controller(browser=None):
    ''' Return a browser controller.

    Args:
        browser (str or None) : browser name, or ``None`` (default: ``None``)
            If passed the string ``'none'``, a dummy web browser controller
            is returned

            Otherwise, use the value to select an appropriate controller using
            the ``webbrowser`` standard library module. In the value is
            ``None`` then a system default is used.

    .. note::
        If the environment variable ``BOKEH_BROWSER`` is set, it will take
        precedence.

    Returns:
        controller : a web browser controller

    '''
    browser = settings.browser(browser)

    if browser is not None:
        if browser == 'none':
            controller = DummyWebBrowser()
        else:
            controller = webbrowser.get(browser)
    else:
        controller = webbrowser

    return controller

def view(location, browser=None, new="same", autoraise=True):
        ''' Open a browser to view the specified location.

        Args:
            location (str) : Location to open
                If location does not begin with "http:" it is assumed
                to be a file path on the local filesystem.
            browser (str or None) : what browser to use (default: None)
                If ``None``, use the system default browser.
            new (str) : How to open the location. Valid values are:

                ``'same'`` - open in the current tab

                ``'tab'`` - open a new tab in the current window

                ``'window'`` - open in a new window
            autoraise (bool) : Whether to automatically raise the location
                in a new browser window (default: True)

        Returns:
            None

        '''
        try:
            new = { "same": 0, "window": 1, "tab": 2 }[new]
        except KeyError:
            raise RuntimeError("invalid 'new' value passed to view: %r, valid values are: 'same', 'window', or 'tab'" % new)

        if location.startswith("http"):
            url = location
        else:
            url = "file://" + abspath(location)

        try:
            controller = get_browser_controller(browser)
            controller.open(url, new=new, autoraise=autoraise)
        except (SystemExit, KeyboardInterrupt):
            raise
        except:
            pass
