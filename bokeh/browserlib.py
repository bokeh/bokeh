from __future__ import absolute_import

from os.path import abspath
import webbrowser

from .settings import settings

def get_browser_controller(browser=None):
    browser = settings.browser(browser)

    if browser is not None:
        if browser == 'none':
            class DummyWebBrowser(object):
                def open(self, url, new=0, autoraise=True):
                    pass

            controller = DummyWebBrowser()
        else:
            controller = webbrowser.get(browser)
    else:
        controller = webbrowser

    return controller

def view(location, browser=None, new="same", autoraise=True):
        """ Opens a browser to view the specified location.

        Args:
            location (str) : location to open
                If location does not begin with "http:" it is assumed
                to be a file path on the local filesystem.
            browser (str) : what browser to use
            new (str) : how to open the location
                Valid values are:
                    * "same" - open in the current tab
                    * "tab" - open a new tab in the current window
                    * "window" - open in a new window
            autoraise (bool) : whether to raise the new location

        Returns:
            None

        """
        new_map = { "same": 0, "window": 1, "tab": 2 }
        if location.startswith("http"):
            url = location
        else:
            url = "file://" + abspath(location)

        try:
            controller = get_browser_controller(browser)
            controller.open(url, new=new_map[new], autoraise=autoraise)
        except (SystemExit, KeyboardInterrupt):
            raise
        except:
            pass
