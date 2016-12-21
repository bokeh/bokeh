from __future__ import absolute_import

from os.path import abspath
import webbrowser

from ..settings import settings

# todo: need this locally
ICON = 'http://bokeh.pydata.org/en/latest/_static/images/favicon.ico'

def get_browser_controller(browser=None):
    browser = settings.browser(browser)

    if browser is not None:
        if browser == 'none':
            class DummyWebBrowser(object):
                def open(self, url, new=0, autoraise=True):
                    pass

            controller = DummyWebBrowser()
        elif browser.lower() in ('xul', ):
            from flexx.webruntime import launch
            class XulWebBrowser(object):
                def open(self, url, new=0, autoraise=True):
                    self.c = launch(url,  browser, title='Bokeh plot', icon=ICON)

            controller = XulWebBrowser()
        else:
            controller = webbrowser.get(browser)
    else:
        controller = webbrowser

    return controller


def view(location, browser=None, new="same", autoraise=True):
        ''' Opens a browser to view the specified location.

        Args:
            location (str) : Location to open
                If location does not begin with "http:" it is assumed
                to be a file path on the local filesystem.
            browser (str) : what browser to use
            new (str) : How to open the location. Valid values are:

                ``"same"`` - open in the current tab

                ``"tab"`` - open a new tab in the current window

                ``"window"`` - open in a new window
            autoraise (bool) : Whether to raise the new location

        Returns:
            None

        '''
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
