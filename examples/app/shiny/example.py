from flask import render_template
from bokeh.server.app import bokeh_app
from bokeh.plotting import line, session
from bokeh.pluginutils import app_document
from bokeh.widgetobjects import (VBoxModelForm, VBox, HBox,
                                 ShinyApp, TextInput)
from bokeh.objects import Plot, ColumnDataSource
from bokeh.plotobject import PlotObject
from bokeh.properties import (HasProps, Dict, Enum, 
                         Either, Float, Instance, Int,
                         List, String, Color, Include, Bool, 
                         Tuple, Any)
import numpy as np
from bokeh.pluginutils import app_document


class MyModel(VBoxModelForm):
    offset = Float(1.0)
    scale = Float(1.0)

class MyApp(ShinyApp):
    plot = Instance(Plot, has_ref=True)
    source = Instance(ColumnDataSource, has_ref=True)

    def create(self):
        self.modelform = MyModel()
        input1 = TextInput(title="offset", 
                           name="offset", 
                           value=str(self.modelform.offset)
        )
        input2 = TextInput(title="scale", 
                           name="scale", 
                           value=str(self.modelform.offset)
        )
        session().add(input1)
        session().add(input2)
        self.modelform._children.append(input1)
        self.modelform._children.append(input2)        
        
        self.source = ColumnDataSource(data={'x':[], 'y':[]})
        self.update_data()
        self.plot = line('x', 'y', source=self.source,
                         plot_width=400, plot_height=400
        )
        self.children.append(self.modelform)
        self.children.append(self.plot)
        session().add(self.modelform)

    def update_data(self):
        N = 80
        x = np.linspace(0, 4*np.pi, N)
        y = np.sin(x)
        y = self.modelform.offset + y * self.modelform.scale
        self.source.data = {'x' : x, 'y' : y}
        
    def input_change(self, obj, attrname, old, new):
        self.update_data()
    
bokeh_location = "localhost:5006"
bokeh_url = "http://" + bokeh_location
@app_document("sampleapp", bokeh_url)
def make_app():
    app = MyApp()
    app.create()
    return app

@bokeh_app.route("/exampleapp")
def exampleapp():
    app = make_app()
    docname = session().docname
    docid = session().docid
    extra_generated_classes = [
        ('MyModel', 'MyModel', 'VBoxModelForm'),
        ('MyApp', 'MyApp', 'HBox'),
    ]
    return render_template(
        'shiny.html', 
        extra_generated_classes=extra_generated_classes,
        title=docname, 
        docid=docid,
        splitjs=bokeh_app.splitjs)
    
