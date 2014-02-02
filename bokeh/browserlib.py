import webbrowser
import os
def get_browser_controller(browser=None):
    if browser is None:
        browser = os.environ.get("BOKEH_BROWSER", None)

    if browser is not None:
        if browser == 'dummy':
            class DummyWebBrowser(object):
                def open(self, url, new):
                    pass

            controller = DummyWebBrowser()
        else:
            controller = webbrowser.get(browser)
    else:
        controller = webbrowser
    return controller
    
    
