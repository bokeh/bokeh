#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Utility functions for helping with operations involving browsers.

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
import webbrowser
from os.path import abspath
from typing import Optional, cast

# External imports
from typing_extensions import Literal, Protocol

# Bokeh imports
from ..settings import settings

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

NEW_PARAM = {'tab': 2, 'window': 1}

__all__ = (
    'DummyWebBrowser',
    'get_browser_controller',
    'view',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class BrowserLike(Protocol):
    ''' Interface for browser-like objects.

    '''
    def open(self, url: str, new: int = 0, autoraise: bool = True) -> bool:
        ...

class DummyWebBrowser:
    ''' A "no-op" web-browser controller.

    '''
    def open(self, url: str, new: int = 0, autoraise: bool = True) -> bool:
        ''' Receive standard arguments and take no action. '''
        return True

def get_browser_controller(browser: Optional[str] = None) -> BrowserLike:
    ''' Return a browser controller.

    Args:
        browser (str or None) : browser name, or ``None`` (default: ``None``)
            If passed the string ``'none'``, a dummy web browser controller
            is returned

            Otherwise, use the value to select an appropriate controller using
            the ``webbrowser`` standard library module. In the value is
            ``None`` then a system default is used.

    Returns:
        controller : a web browser controller

    '''
    browser = settings.browser(browser)

    if browser is None:
        controller = cast(BrowserLike, webbrowser)
    elif browser == "none":
        controller = DummyWebBrowser()
    else:
        controller = webbrowser.get(browser)

    return controller

def view(location: str, browser: Optional[str] = None, new: Literal["same", "window", "tab"] = "same", autoraise: bool = True) -> None:
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
        new_id = {"same": 0, "window": 1, "tab": 2}[new]
    except KeyError:
        raise RuntimeError("invalid 'new' value passed to view: %r, valid values are: 'same', 'window', or 'tab'" % new)

    if location.startswith("http"):
        url = location
    else:
        url = "file://" + abspath(location)

    try:
        controller = get_browser_controller(browser)
        controller.open(url, new=new_id, autoraise=autoraise)
    except Exception:
        pass

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
