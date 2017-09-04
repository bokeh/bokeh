from bokeh.model import Model
from bokeh.core.properties import Int, Instance, String, DistanceSpec

class AnotherModelInTestDocument(Model):
    bar = Int(1)

class SomeModelInTestDocument(Model):
    foo = Int(2)
    child = Instance(Model)

class ModelThatOverridesName(Model):
    name = String()

class ModelWithSpecInTestDocument(Model):
    foo = DistanceSpec(2)
