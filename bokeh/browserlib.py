
from os.path import abspath
import webbrowser

from . import settings

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

def view(filename, browser=None, new=False, autoraise=True):
        """ Opens a browser to view the file pointed to by this sessions.

        **new** can be None, "tab", or "window" to view the file in the
        existing page, a new tab, or a new windows.  **autoraise** causes
        the browser to be brought to the foreground; this may happen
        automatically on some platforms regardless of the setting of this
        variable.
        """
        new_map = { False: 0, "window": 1, "tab": 2 }
        file_url = "file://" + abspath(filename)

        try:
            controller = get_browser_controller(browser)
            controller.open(file_url, new=new_map[new], autoraise=autoraise)
        except (SystemExit, KeyboardInterrupt):
            raise
        except:
            pass