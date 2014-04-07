from .plotobject import PlotObject
from .properties import (HasProps, Dict, Enum, 
                         Either, Float, Instance, Int,
                         List, String, Color, Include, Bool, 
                         Tuple, Any)
import copy

class HBox(PlotObject):
    children = List(Instance(PlotObject, has_ref=True), has_ref=True)
class VBox(PlotObject):
    children = List(Instance(PlotObject, has_ref=True), has_ref=True)

#parent class only, you need to set the fields you want
class VBoxModelForm(PlotObject):
    _children  = List(Instance(PlotObject, has_ref=True), has_ref=True)
    _field_defs = Dict()
    input_specs = None
    jsmodel = "VBoxModelForm"
    def __init__(self, *args, **kwargs):
        super(VBoxModelForm, self).__init__(*args, **kwargs)
        for prop in self.__properties__:
            propobj = self.__class__.__dict__[prop]
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
                if input_spec.get('title') is None:
                    input_spec['title'] = input_spec['name']
                if input_spec.get('value') is not None:
                    input_spec['value'] = str(input_spec.get('value'))
                print (input_spec)
                widget = widget(**input_spec)
                session.add(widget)
                self._children.append(widget)


class InputWidget(PlotObject):
    title = String()
    name = String()
    value = String()
    
class TextInput(InputWidget):
    pass

class ShinyApp(PlotObject):
    modelform = Instance(VBoxModelForm, has_ref=True)
    children = List(Instance(PlotObject, has_ref=True), has_ref=True)
    jsmodel = "HBox"
    extra_generated_classes = List(Any)
    
    def update(self, **kwargs):
        super(ShinyApp, self).update(**kwargs)
        self. setup_events()
        
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
                'shiny.html', 
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
