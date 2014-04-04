from .plotobject import PlotObject
from .properties import (HasProps, Dict, Enum, 
                         Either, Float, Instance, Int,
                         List, String, Color, Include, Bool, 
                         Tuple, Any)

class HBox(PlotObject):
    children = List(Instance(PlotObject, has_ref=True), has_ref=True)
class VBox(PlotObject):
    children = List(Instance(PlotObject, has_ref=True), has_ref=True)

#parent class only, you need to set the fields you want
class VBoxModelForm(PlotObject):
    _children  = List(Instance(PlotObject, has_ref=True), has_ref=True)
    _field_defs = Dict()
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
            
class InputWidget(PlotObject):
    title = String()
    name = String()
    value = String()
    
class TextInput(InputWidget):
    pass

class ShinyApp(PlotObject):
    modelform = Instance(VBoxModelForm, has_ref=True)
    children = List(Instance(PlotObject, has_ref=True), has_ref=True)

    def update(self, **kwargs):
        super(ShinyApp, self).update(**kwargs)
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
