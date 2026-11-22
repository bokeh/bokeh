from bokeh.core.properties import Instance, Nullable
from bokeh.model import DataModel, Model
from bokeh.models import Column, Div


class Holder(DataModel):
    child = Nullable(Instance(Model))
    data = Nullable(Instance(DataModel))


class DerivedHolder(Holder):
    pass

div = Div(text="hi")
output = Column(div, tags=[Holder(child=div, data=DerivedHolder(child=div))])
