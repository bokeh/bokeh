import logging
logger = logging.getLogger(__name__)

from .models.widgets.layouts import HBox, VBox, VBoxForm, SimpleApp
from .plot_object import PlotObject
from .properties import String, Instance, Dict, Any, Either
from .plotting import curdoc, cursession, push, show as pshow

(HBox, VBox, VBoxForm, SimpleApp, PlotObject)
(String, Instance, Dict, Any, Either)

def simpleapp(*args):
    def decorator(func):
        wrapper = SimpleAppWrapper(func, args)
        return wrapper
    return decorator

class SimpleAppWrapper(object):
    def __init__(self, func, args):
        self.name = func.__name__
        self.widgets = list(args)
        self.func = func
        SimpleApp.create_registry[func.__name__] = func
        SimpleApp.update_registry[func.__name__] = []

    def __call__(self, *args, **kwargs):
        return self.func(*args, **kwargs)

    def layout(self, func):
        SimpleApp.layout_registry[self.name] = func

    def update(self, selectors):
        def wrapper(func):
            SimpleApp.update_registry[self.name].append((selectors, func))
            return func
        return wrapper

    def run(self, show=True):
        app = SimpleApp.create(self.name, self.widgets)
        curdoc().add(app)
        push()
        if show:
            pshow(app)
        cursession().poll_document(curdoc())

    def route(self, *args, **kwargs):
        from bokeh.server.app import bokeh_app
        from bokeh.server.utils.plugins import object_page
        def gen():
            app = SimpleApp.create(self.name, [x.clone() for x in self.widgets])
            return app
        gen.__name__ = self.name
        bokeh_app.route(*args, **kwargs)(object_page(self.name)(gen))
