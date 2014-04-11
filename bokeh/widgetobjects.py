import six
from .plotobject import PlotObject
from .properties import (HasProps, Dict, Enum, 
                         Either, Float, Instance, Int,
                         List, String, Color, Include, Bool, 
                         Tuple, Any, lookup_descriptor)
import copy
import logging
logger = logging.getLogger(__name__)

class HBox(PlotObject):
    children = List(Instance(PlotObject, has_ref=True), has_ref=True)
class VBox(PlotObject):
    children = List(Instance(PlotObject, has_ref=True), has_ref=True)

#parent class only, you need to set the fields you want
class VBoxModelForm(PlotObject):
    _children  = List(Instance(PlotObject, has_ref=True), has_ref=True)
    _field_defs = Dict(String, Any)
    input_specs = None
    jsmodel = "VBoxModelForm"
    def __init__(self, *args, **kwargs):
        super(VBoxModelForm, self).__init__(*args, **kwargs)
        for prop in self.properties():
            propobj = lookup_descriptor(self.__class__, prop)
            if isinstance(propobj, Float):
                self._field_defs[prop] = "Float"
            elif isinstance(propobj, Int):
                self._field_defs[prop] = "Int"
            else:
                self._field_defs[prop] = "String"
    def create_inputs(self, session):
        session.add(self)        
        if self.input_specs:
            for input_spec in self.input_specs:
                input_spec = copy.copy(input_spec)
                widget = input_spec.pop('widget')
                widget = widget.create(**input_spec)
                session.add(widget)
                self._children.append(widget)


class InputWidget(PlotObject):
    title = String()
    name = String()
    value = String()
    @classmethod
    def coerce_value(cls, val):
        prop_obj = lookup_descriptor(cls, 'value')
        if isinstance(prop_obj, Float):
            return float(val)
        if isinstance(prop_obj, Int):
            return int(val)
        if isinstance(prop_obj, String):
            return str(val)
            
    @classmethod
    def create(cls, *args, **kwargs):
        """Only called the first time we make an object, 
        whereas __init__ is called every time it's loaded
        """
        if kwargs.get('title') is None:
            kwargs['title'] = kwargs['name']
        if kwargs.get('value') is not None:
            kwargs['value'] = cls.coerce_value(kwargs.get('value'))
        return cls(**kwargs)

class TextInput(InputWidget):
    value = String()    

class BokehApplet(PlotObject):
    modelform = Instance(VBoxModelForm, has_ref=True)
    children = List(Instance(PlotObject, has_ref=True), has_ref=True)
    jsmodel = "HBox"
    extra_generated_classes = List(Tuple(String, String, String))
    
    def update(self, **kwargs):
        super(BokehApplet, self).update(**kwargs)
        self.setup_events()
        
    def setup_events(self):
        if self.modelform:
            self.bind_modelform()
        
    def bind_modelform(self):
        for prop in self.modelform.__properties__:
            if not prop.startswith("_"):
                self.modelform.on_change(prop, self, 
                                         'input_change')

    def input_change(self, obj, attrname, old, new):
        pass

    def create(self):
        pass
    def add_all(self, session):
        objs = self.references()
        for obj in objs:
            session.add(obj)

    @classmethod
    def add_route(cls, route, bokeh_url):
        from bokeh.server.app import bokeh_app
        from bokeh.pluginutils import app_document
        from bokeh.plotting import session
        from flask import render_template
        @app_document(cls.__view_model__, bokeh_url)
        def make_app():
            app = cls()
            app.create(session())
            return app
            
        def exampleapp():
            app = make_app()
            docname = session().docname
            docid = session().docid
            extra_generated_classes = app.extra_generated_classes
            if len(extra_generated_classes) == 0:
                extra_generated_classes.append((
                    app.__view_model__,
                    app.__view_model__,
                    app.jsmodel))
                extra_generated_classes.append((
                    app.modelform.__view_model__,
                    app.modelform.__view_model__,
                    app.modelform.jsmodel))
            return render_template(
                'applet.html', 
                extra_generated_classes=extra_generated_classes,
                title=app.__class__.__view_model__,
                docname=docname, 
                docid=docid,
                splitjs=bokeh_app.splitjs)
        exampleapp.__name__ = cls.__view_model__
        bokeh_app.route(route)(exampleapp)
    
class Paragraph(PlotObject):
    text = String()
    
class PreText(Paragraph):
    pass

class Select(InputWidget):
    options = List(Either(String(), Dict(String(), String())))
    value = String()

    @classmethod
    def create(self, *args, **kwargs):
        options = kwargs.pop('options', [])
        new_options = []
        for opt in options:
            if isinstance(opt, six.string_types):
                opt = {'name' : opt, 'value' : opt}
            new_options.append(opt)
        kwargs['options'] = new_options
        return super(Select, self).create(*args, **kwargs)
        
class Slider(InputWidget):
    value = Float()
    start = Float()
    end = Float()
    steps = Int(default=50)
    orientation = Enum("horizontal", "vertical")
