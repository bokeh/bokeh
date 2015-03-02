import copy
from functools import wraps
import logging
logger = logging.getLogger(__name__)

from six import string_types

from .utils import cached_property, arg_filter
from .models.widgets.layouts import HBox, VBox, VBoxForm
from .plot_object import PlotObject
from .properties import String, Instance, Dict, Any, Either
from .plotting import curdoc, cursession, push, show as pshow

create_registry = {}
update_registry = {}
layout = {}

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
        create_registry[func.__name__] = func
        update_registry[func.__name__] = []

    def __call__(self, *args, **kwargs):
        return self.func(*args, **kwargs)

    def layout(self, func):



    def update(self, selectors):
        def wrapper(func):
            update_registry[self.name].append((selectors, func))
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


class SimpleApp(HBox):
    name = String()
    widgets = Instance(VBoxForm)
    output = Instance(PlotObject)

    @classmethod
    def create(cls, name, widgets):
        obj = cls(name=name, widgets=VBoxForm(children=widgets))
        obj.set_output()
        return obj

    @cached_property
    def widget_dict(self):
        result = {}
        for widget in self.widgets.children:
            result[widget.name] = widget
        return result

    def set_debounce(self):
        self._debounce_called = {}

    def clear_debounce(self):
        delattr(self, "_debounce_called")

    def callback(self, func, set_output=False):
        @wraps(func)
        def signature_change_call_once(obj, attrname, old, new):
            debounce_called = getattr(self, "_debounce_called", None)
            if debounce_called is not None and func.__name__ in debounce_called:
                return
            args = self.args_for_func(func)
            logger.debug("calling %s", func.__name__)
            result = func(**args)
            if set_output:
                self.output = result
            curdoc()._add_all()
            if debounce_called is not None:
                debounce_called[func.__name__] = True
            return result
        return signature_change_call_once

    def setup_events(self):
        ## hack - what we want to do is execute the update callback once
        ## and only if some properties in the graph have changed
        ## so we set should_update to be True in setup_events, and
        ## set it to be false as soon as the callback is done
        for k in self.__dict__.keys():
            if k.startswith('_func'):
                self.__dict__.pop(k)
        counter = 0
        if not update_registry.get(self.name):
            name = '_func%d'  % counter
            func = create_registry[self.name]
            setattr(self, name, self.callback(func, set_output=True))
            for obj in self.references():
                if obj == self:
                    continue
                for attr in obj.class_properties():
                    obj.on_change(attr, self, name)
            return

        for selectors, func in update_registry[self.name]:
            #hack because we lookup callbacks by func name
            name = '_func%d'  % counter
            counter += 1
            setattr(self, name, self.callback(func))
            for selector in selectors:
                if isinstance(selector, string_types):
                    self.widget_dict[selector].on_change('value', self, name)
                    continue
                elif isinstance(selector, tuple):
                    selector, attrs = selector
                else:
                    attrs = None
                for obj in self.select(selector):
                    if obj == self:
                        continue
                    if attrs:
                        toiter = attrs
                    else:
                        toiter = obj.class_properties()
                    for attr in toiter:
                        obj.on_change(attr, self, name)
        self.set_debounce()

    def args_for_func(self, func):
        args = {}
        for widget in self.widgets.children:
            args[widget.name] = widget.value
        args['app'] = self
        args = arg_filter(func, args)
        return args

    def set_output(self):
        func = create_registry[self.name]
        args = self.args_for_func(func)
        result = func(**args)
        self.output = result
