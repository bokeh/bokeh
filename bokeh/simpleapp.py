import copy

from .models.widgets.layouts import HBox, VBox, VBoxForm
from .plot_object import PlotObject
from .properties import String, Instance, Dict, Any, Either
from .plotting import curdoc, cursession, push, show as pshow

create_registry = {}
update_registry = {}

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

    def __call__(self, *args, **kwargs):
        return self.func(*args, **kwargs)

    def update(self, func):
        update_registry[self.name] = func

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
    state = Dict(String(), Either(Instance(PlotObject), Any))

    @classmethod
    def create(cls, name, widgets):
        obj = cls(name=name, widgets=VBoxForm(children=widgets))
        obj.set_output()
        return obj

    def setup_events(self):
        ## hack - what we want to do is execute the update callback once
        ## and only if some properties in the graph have changed
        ## so we set should_update to be True in setup_events, and
        ## set it to be false as soon as the callback is done
        self._should_update = True
        for obj in self.references():
            for name in obj.class_properties():
                obj.on_change(name, self, 'default_callback')

    def args(self):
        args = {}
        for widget in self.widgets.children:
            args[widget.name] = widget.value
        return args

    def set_output(self):
        result = create_registry[self.name](**self.args())
        if isinstance(result, tuple):
            output, state = result
            self.state = state
            self.output = output
        else:
            self.state = {}
            self.output = result

    def execute_update(self):
        state = copy.copy(self.state)
        args = self.args()
        state['app'] = self
        update_registry[self.name](args, state)

    def default_callback(self, obj, attrname, old, new):
        print('calling callback')
        if not self._should_update:
            return
        self._should_update = False
        if self.name not in update_registry:
            self.set_output()
        else:
            self.execute_update()
        curdoc()._add_all()
