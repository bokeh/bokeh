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
