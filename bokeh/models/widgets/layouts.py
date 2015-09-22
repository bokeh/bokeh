""" Various kinds of lyaout widgets.

"""
from __future__ import absolute_import
from functools import wraps
from six import string_types
import logging
import copy

from ...properties import abstract
from ...properties import Int, Instance, List, String, Dict, Either
from ...util.functions import cached_property, arg_filter
from ...validation.warnings import EMPTY_LAYOUT
from ... import validation

from ..widget import Widget

logger= logging.getLogger(__name__)

@abstract
class Layout(Widget):
    """ An abstract base class for layout widgets. ``Layout`` is not
    generally useful to instantiate on its own.

    """

    width = Int(help="""
    An optional width for the widget (in pixels).
    """)

    height = Int(help="""
    An optional height for the widget (in pixels).
    """)

@abstract
class BaseBox(Layout):
    """ Abstract base class for HBox and VBox. Do not use directly.
    """

    def __init__(self, *args, **kwargs):
        if len(args) > 0 and "children" in kwargs:
            raise ValueError("'children' keyword cannot be used with positional arguments")
        if (len(args) == 1 and hasattr(args[0], '__iter__') and
            not isinstance(args[0], Widget)):
            # Note: check that not Widget, in case Widget/Layout ever gets __iter__
            kwargs["children"] = list(args[0])
        elif len(args) > 0:
            kwargs["children"] = list(args)
        super(BaseBox, self).__init__(**kwargs)

    @validation.warning(EMPTY_LAYOUT)
    def _check_empty_layout(self):
        from itertools import chain
        if not list(chain(self.children)):
            return str(self)

    children = List(Instance(Widget), help="""
    The list of children, which can be other widgets (including layouts)
    and plots.
    """)


class HBox(BaseBox):
    """ Lay out child widgets in a single horizontal row.

    Children can be specified as positional arguments, as a single argument
    that is a sequence, or using the ``children`` keyword argument.
    """


class VBox(BaseBox):
    """ Lay out child widgets in a single vertical row.

    Children can be specified as positional arguments, as a single argument
    that is a sequence, or using the ``children`` keyword argument.
    """


# parent class only, you need to set the fields you want
class VBoxForm(VBox):
    """
    Basically, a VBox, where all components (generally form stuff)
    is wrapped in a <form> tag - important for bootstrap css
    """
class SimpleApp(Widget):

    create_registry = {}
    update_registry = {}
    layout_registry = {}

    name = String()
    objects = Dict(String, Either(String, Instance(Widget)))
    widget_list = List(String, help="list of widgets, for ordering")
    layout = Instance(Widget)

    @classmethod
    def create(cls, name, widgets):
        objects = {}
        widget_list = []
        for w in widgets:
            objects[w.name] = w
            widget_list.append(w.name)
        obj = cls(name=name, objects=objects, widget_list=widget_list)
        obj.set_output()
        return obj

    @cached_property
    def widget_dict(self):
        result = {}
        for widget_name in self.widget_list:
            result[widget_name] = self.objects[widget_name]
        return result

    def set_debounce(self):
        self._debounce_called = {}

    def clear_debounce(self):
        delattr(self, "_debounce_called")

    def process_user_result(self, result):
        if isinstance(result, Widget):
            result = {'output' : result}
        if isinstance(result, dict):
            # hack - so we can detect a change
            # kind of ok because it's a shallow copy
            dummy = copy.copy(self.objects)
            dummy.update(result)
            self.objects = dummy

    def callback(self, func):
        from ...plotting import curdoc
        @wraps(func)
        def signature_change_call_once(obj, attrname, old, new):
            debounce_called = getattr(self, "_debounce_called", None)
            if debounce_called is not None and func.__name__ in debounce_called:
                return
            args = self.args_for_func(func)
            logger.debug("calling %s", func.__name__)
            result = func(**args)
            self.process_user_result(result)
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
        if not self.name:
            return
        to_delete = []
        for k in self.__dict__.keys():
            if k.startswith('_func'):
                to_delete.append(k)
        for k in to_delete:
            self.__dict__.pop(k)
        counter = 0
        if not self.update_registry.get(self.name):
            name = '_func%d'  % counter
            func = self.create_registry[self.name]
            setattr(self, name, self.callback(func))
            for widget_name in self.widget_list:
                obj = self.objects.get(widget_name)
                if obj:
                    for attr in obj.class_properties():
                        obj.on_change(attr, self, name)
            return
        for selectors, func in self.update_registry[self.name]:
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
        for k,v in self.widget_dict.items():
            if hasattr(v, 'value'):
                args[k] = v.value
        args['app'] = self
        args = arg_filter(func, args)
        return args

    def set_output(self):
        func = self.create_registry[self.name]
        args = self.args_for_func(func)
        result = func(**args)
        self.process_user_result(result)
        func = self.layout_registry.get(self.name)
        if func:
            self.layout = func(**self.args_for_func(func))
        else:
            self.layout = self.default_layout()

    def default_layout(self):
        widgets = [self.objects[x] for x in self.widget_list]
        widgets = VBoxForm(children=widgets)
        layout = AppHBox(children=[widgets, "output"], app=self)
        return layout

class AppLayout(Layout):
    app = Instance(SimpleApp)

class AppVBox(VBox, AppLayout):
    """VBox, except children can be other plot objects, as well as
    strings (which are then evaluated in an app namespace for
    de-referencing
    """
    children = List(Either(Instance(Widget), String), help="""
    The list of children, which can be other widgets (including layouts)
    and plots - or strings. If strings, there must be a corresponding app
    which contains the widget/plot matching that string
    """)


class AppHBox(HBox, AppLayout):
    """VBox, except children can be other plot objects, as well as
    strings (which are then evaluated in an app namespace for
    de-referencing
    """
    children = List(Either(Instance(Widget), String), help="""
    The list of children, which can be other widgets (including layouts)
    and plots - or strings. If strings, there must be a corresponding app
    which contains the widget/plot matching that string
    """)

class AppVBoxForm(VBox, AppLayout):
    """VBox, except children can be other plot objects, as well as
    strings (which are then evaluated in an app namespace for
    de-referencing
    """
    children = List(Either(Instance(Widget), String), help="""
    The list of children, which can be other widgets (including layouts)
    and plots - or strings. If strings, there must be a corresponding app
    which contains the widget/plot matching that string
    """)
