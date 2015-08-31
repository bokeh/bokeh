import importlib
import yaml
from yaml import SafeLoader, Loader, BaseLoader, ScalarNode
import pandas as pd
from six import string_types

from .models.widgets import (HBox, VBox, VBoxForm, PreText, DataTable,
                                  AppVBox, AppHBox, CheckboxGroup, Dialog,
                                  AutocompleteInput, Button, TextInput,
                                  Paragraph, Select, Panel, Tabs, Slider, Dialog)
from .models.sources import ColumnDataSource
from .plotting import figure, show
from .simpleapp import simpleapp, SimpleApp


def io_constructor(loader, node):
    """
    Use pandas IO tools to easily load local and remote data files
    """
    bits = loader.construct_mapping(node, deep=True)

    # Pandas io read method as the key
    read_method = [key for key in bits.keys()][0]

    # Read value can be a file or url
    read_value = bits.pop(read_method)

    limit = bits.pop('limit', None)

    ds = getattr(pd, read_method)(read_value, **bits)

    if limit is not None:
        ds = ds[:int(limit)]

    return ds

def app_object_constructor(loader, node):
    """
    A YAML constructor for the bokeh.plotting module
    http://bokeh.pydata.org/en/latest/docs/reference/plotting.html
    """
    data = loader.construct_mapping(node, deep=True)
    loaded_widget = loader._objects[data['name']]

    child = data.get('child', None)
    if child is not None:
        loaded_widget._child = child

    tabs = data.get('tabs', None)
    if tabs is not None:
        loaded_widget._tabs = tabs

    content = data.get('content', None)
    if content is not None:
        loaded_widget._content = content

    return loaded_widget


def app_event_handler(loader, node):
    """
    A YAML constructor for the bokeh.plotting module
    http://bokeh.pydata.org/en/latest/docs/reference/plotting.html
    """
    data = loader.construct_mapping(node, deep=True)
    return data

def cds_constructor(loader, node):
    data = loader.construct_mapping(node, deep=True)

    cds_data = data.pop('data', {})
    source = ColumnDataSource(data=cds_data, **data)

    return source


def get_lazy_evals(data):
    lazy_evals = {}
    for k, v in data.items():
        if isinstance(v, string_types) and \
                (v.startswith('{{') and v.endswith('}}')):
            stripped = v[2:-2].strip()
            lazy_evals[k] = stripped

    for k in lazy_evals:
        data.pop(k)

    return lazy_evals

def figure_constructor(loader, node):
    """
    A YAML constructor for the bokeh.plotting module
    http://bokeh.pydata.org/en/latest/docs/reference/plotting.html
    """
    figure_data = loader.construct_mapping(node, deep=True)

    lazy_evals = get_lazy_evals(figure_data['figure'])
    data = figure_data['figure']

    # Create the figure, using the ``figure`` key
    p = figure(**data)
    p._lazy_evals = lazy_evals

    # Add glyphs to the figure using the ``glyphs`` key
    glyphs = figure_data.pop('glyphs', {})

    # TODO: This is definitely an ugly hack. Need better engineered way
    #       way of saving glyphs declaration for lazy loading sources
    #       and holding the glyphs creation until all app sources have
    #       been created

    p._glyphs = glyphs

    return p

class UILoader(SafeLoader):
    def __init__(self, *args, **kws):
        self._objects = {}
        self._lazy_evals = {}
        super(UILoader, self).__init__(*args, **kws)

    def construct_object(self, node, deep=False):
        # TODO: Hack!
        if isinstance(node, ScalarNode):
            self._prev_obj = node
        return super(UILoader, self).construct_object(node, deep=deep)

    @classmethod
    def add_widget_constructor(cls, widget_class):
        tag = "!%s" % widget_class.__name__

        def constructor(loader, node):
            prev_obj = loader._prev_obj
            data = loader.construct_mapping(node, deep=True)

            if 'name' in data:
                name = data['name']
            else:
                name = data['name'] = prev_obj.value

            for k, v in data.items():
                if isinstance(v, string_types) and \
                        (v.startswith('{{') and v.endswith('}}')):
                    stripped = v[2:-2].strip().split(" ")
                    if len(stripped) >= 2:
                        import pdb; pdb.set_trace()
                        box, items = stripped[0], stripped[1:]
                        if box.lower() == 'hbox':
                            box = HBox
                        elif box.lower() == 'vbox':
                            box = VBox
                        else:
                            raise ValueError("Impossible to parse value: %s" % v)

                        loaded_widgets = [loader._objects.get(item, item) for item in items]
                        clean = box(*loaded_widgets)
                    else:
                        clean = stripped[0]

                    data[k] = clean

            widget = widget_class(**data)
            loader._objects[name] = widget

            return widget

        cls.add_constructor(tag, constructor)


UILoader.add_constructor("!app_object", app_object_constructor)
UILoader.add_constructor("!figure", figure_constructor)
UILoader.add_constructor("!Event", app_event_handler)
UILoader.add_constructor("!io", io_constructor)
UILoader.add_constructor("!ColumnDataSource", cds_constructor)

widgets = [TextInput, PreText, Dialog, Panel, Tabs, Paragraph, AppVBox, AppHBox,
           Button, CheckboxGroup, Slider, Select]

for klass in widgets:
    UILoader.add_widget_constructor(klass)


def load_from_yaml(yaml_path):
    with open (yaml_path, 'r') as source:
        text = source.read()

    data = yaml.load (text, Loader=UILoader)
    if 'widgets' not in data:
        data['widgets'] = {}

    return data

def add_app_box(yaml_box, app, yaml_layout):
    yaml_box.app = app

    for i, v in enumerate(yaml_box.children):
        if isinstance(v, string_types) and not v in app.objects:
            yaml_box.children[i] = yaml_layout[v]


def get_obj(name, app, layout, return_object=False):
    if isinstance(name, string_types) and not name in app.objects:
        if name.startswith('{{') and name.endswith('}}'):
            stripped = name[2:-2].strip().split(" ")
            if len(stripped) >= 2:
                box, items = stripped[0], stripped[1:]
                if box.lower() == 'hbox':
                    box = HBox
                elif box.lower() == 'vbox':
                    box = VBox
                else:
                    raise ValueError("Impossible to parse value: %s" % v)

                loaded_widgets = [get_obj(item, app, layout, True) for item in items]
                return box(*loaded_widgets)
            else:
                raise ValueError("Invalid value %s" % name)
        else:
            return layout[name]

    if return_object and isinstance(name, string_types):
        return app.objects[name]

    return name


def create_app(name, route, yaml_path, constructor=None):
    yapp = load_from_yaml(yaml_path)


    @simpleapp(**yapp['widgets'].values())
    def app(search_button):
        objects = dict(yapp['ui'])

        if callable(constructor):
            return constructor(objects)

    @app.layout
    def create_layout(app):
        layout = yapp['layout']
        for k, v in layout.items():
            if k != 'app' and isinstance(v, (AppHBox, AppVBox)):
                ui.add_app_box(v, app, layout)

        for k, v in layout.items():
            if k != 'app' and isinstance(v, Panel):
                v.child = ui.get_obj(v.child, app, layout)

        for k, v in layout.items():
            if k != 'app' and isinstance(v, Tabs):
                v.tabs = [ui.get_obj(x, app, layout, True) for x in v.tabs]

        for k, v in layout.items():
            if k != 'app' and isinstance(v, Dialog):
                v.content = ui.get_obj(v.content, app, layout)

        add_app_box(layout['app'], app, layout)

        return layout['app']

    app.route(route)

class YamlApp(object):
    def __init__(self, yaml_path, route=None, theme=None):
        self.yaml_path = yaml_path
        self.yapp = load_from_yaml(yaml_path)

        if isinstance(theme, string_types):
            self.theme = load_from_yaml(theme)
        else:
            self.theme = theme or None

        self.datasets = {}
        self.sources = {}
        self.env = {}
        self.objects = {}
        self._values = {}
        self._lazy_evals = {}
        self._event_handlers = {}

        self.init_datasets()
        self.post_process_datasets()
        self.create_sources()

        self.init_objects()
        self.lazy_eval(self.objects, self.yapp['ui'])

        @simpleapp(*self.yapp['widgets'].values())
        def napp(*args):
            return self.app_objects(self.objects, *args)

        @napp.layout
        def create_layout(app):
            return self.create_layout(app)


        # TODO: We should validate and raise an error if no route is specified
        napp.route(route or self.yapp.get('route', '/'))

        self.app = napp
        self.init_app()
        self.add_events()

        self.apply_theme(self.objects)

        # TODO: Hacks!
        SimpleApp.datasets = self.datasets
        SimpleApp.env = self.env
        SimpleApp._app = self

    def apply_theme(self, objects):
        if self.theme:
            for name, obj in objects.items():
                if name in self.theme:
                    rules = self.theme[name]
                    for attr, value in rules.items():
                        setattr(obj, attr, value)

                classname = obj.__class__.__name__
                if classname in self.theme:
                    rules = self.theme[classname]
                    for attr, value in rules.items():
                        setattr(obj, attr, value)

    def add_objects(self, objects):
        self.apply_theme(objects)
        self.objects.update(objects)
        return objects

    def init_app(self):
        """ Init hook that can be used to customize application initialization
        without ovewriting __init__ """

    def init_datasets(self):
        datasets = self.yapp.get('datasets', {})

        for dsname, ds in datasets.items():
            self.datasets[dsname] = ds

    def post_process_datasets(self):
        pass

    def create_sources(self):
        for dsname, ds in self.datasets.items():
            if isinstance(ds, pd.DataFrame):
                self.sources[dsname] = ColumnDataSource(ds.to_dict(orient='list'), tags=[dsname])
            elif isinstance(ds, ColumnDataSource):
                self.sources[dsname] = ds
            else:
                self.sources[dsname] = ColumnDataSource(ds)


    def init_objects(self):
        for k, obj in self.yapp['ui'].items():
            if not hasattr(obj, 'name'):
                # autocreate a name for the widget in case it wasn't specified
                obj.name = k

            if hasattr(obj, '_glyphs'):
                glyphs = obj._glyphs

                for glyph_name, glyph_values in glyphs.items():
                    tmp = glyph_values
                    if 'source' in tmp:

                        # Convert source to column data source
                        tmp['source'] = self.sources[tmp['source']]

                    getattr(obj, glyph_name)(**tmp)


            if hasattr(obj, '_lazy_evals'):
                self._lazy_evals[k] = obj._lazy_evals

            self.objects[k] = obj
            if hasattr(obj, 'value'):
                self._values[k] = obj.value


    def lazy_eval(self, objects, env):
        for k, evals in self._lazy_evals.items():
            for attr, v in evals.items():
                new_var = eval(v, dict(env))
                setattr(objects[k], attr, new_var)

        return objects

    @property
    def name(self):
        return self.app.name

    @property
    def widgets(self):
        return self.app.widgets

    def add_events(self):
        handlers = self.yapp.get('event_handlers', {})
        module = ''

        if handlers:
            module = handlers.pop('module', '')
            if module:
                module = importlib.import_module(module)

        def load_foo(fooname):
            if module:
                return getattr(module, fooname)
            else:
                return globals()[fooname]

        for evt_handler in handlers.values():
            key = ''
            for k in ['tags', 'name']:
                if k in evt_handler:
                    key = k

            assert key, "Event handlers must specify at least 'tags' or 'name' field!"

            object_name = evt_handler[key]

            foo = load_foo(evt_handler['handler'])
            foo = attach_lazy_eval(foo)
            fname = foo.__name__
            if fname not in self._event_handlers:
                self._event_handlers[fname] = foo = self.app.update(
                    [({key:  object_name}, [evt_handler['property']])])(foo)


    def app_objects(self, objects):
        return objects

    def create_layout(self, app):
        layout = self.yapp['layout']
        for k, v in layout.items():
            if k != 'app' and isinstance(v, (AppHBox, AppVBox)):
                add_app_box(v, app, layout)

        for k, v in layout.items():
            if k != 'app' and isinstance(v, Panel):
                v.child = get_obj(v.child, app, layout)

        for k, v in layout.items():
            if k != 'app' and isinstance(v, Tabs):
                v.tabs = [get_obj(x, app, layout, True) for x in v.tabs]

        for k, v in layout.items():
            if k != 'app' and isinstance(v, Dialog):
                v.content = get_obj(v.content, app, layout)

        add_app_box(layout['app'], app, layout)

        return layout['app']

def attach_lazy_eval(foo):
    def _(app, *args, **kws):
        app._app.objects = objs = app._app.lazy_eval(app.objects, app.objects)
        app._values = {k: obj.value for k, obj in objs.items() if hasattr(obj, 'value')}
        objs = foo(app, *args, **kws)

        if objs is not None:
            app._app.apply_theme(objs)

        return objs
    return _


def bokeh_app(yaml_file, route='/', handler=None, theme=None):
    app = YamlApp(yaml_file, route=route, theme=theme)

    if callable(handler):
        handler = attach_lazy_eval(handler)
        value_widgets = (TextInput, PreText, CheckboxGroup, Slider, Select)
        click_widgets = (Button)
        for object_name, obj in app.objects.items():
            if isinstance(obj, value_widgets):
                property = 'value'
                handler = app.app.update([({'name':  object_name}, [property])])(handler)

            if isinstance(obj, click_widgets):
                property = 'clicks'
                handler = app.app.update([({'name':  object_name}, [property])])(handler)



    return app