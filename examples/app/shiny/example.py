from bokeh.plotting import line, circle, session

from bokeh.widgetobjects import (VBoxModelForm, HBox,
                                 ShinyApp, TextInput)
from bokeh.objects import Plot, ColumnDataSource
from bokeh.plotobject import PlotObject
from bokeh.properties import (Dict, Float, String, Instance)
import numpy as np

class MyModel(VBoxModelForm):
    """Input Widgets, define the fields you want to 
    read from the input here as bokeh properties
    input_specs is a list of dictionary, specifying
    how the kind of input widget you want for each
    property.  the name field must match
    one of the properties, for example here, 
    we use names of offset and scale.  You can
    also specify title, if you want a different
    label in the generated form
    """
    offset = Float(1.0)
    scale = Float(1.0)
    input_specs = [
        {"widget" : TextInput,
         "name" : "offset",
         "value" : 1.0},
        {"widget" : TextInput,
         "name" : "scale",
         "value" : 1.0}
    ]
    
class MyApp(ShinyApp):
    plot = Instance(Plot, has_ref=True)
    source = Instance(ColumnDataSource, has_ref=True)
    
    def create(self, session):
        """
        This function is called once, and is responsible for 
        creating all objects (plots, datasources, etc)
        """
        self.modelform = MyModel()
        session.add(self.modelform)        
        self.modelform.create_inputs(session)
        self.source = ColumnDataSource(data={'x':[], 'y':[]})
        self.update_data()
        self.plot = line('x', 'y', source=self.source,
                         plot_width=400, plot_height=400
        )
        self.children.append(self.modelform)
        self.children.append(self.plot)

    def input_change(self, obj, attrname, old, new):
        """
        This function is called whenever the input form changes
        This is responsible for updating the plot, or whatever
        you want.  The signature is 
        obj : the object that changed
        attrname : the attr that changed
        old : old value of attr
        new : new value of attr
        """
        self.update_data()

    def update_data(self):
        N = 80
        x = np.linspace(0, 4*np.pi, N)
        y = np.sin(x)
        y = self.modelform.offset + y * self.modelform.scale
        self.source.data = {'x' : x, 'y' : y}

# the following addes "/exampleapp" as a url which renders MyApp
        
bokeh_url = "http://localhost:5006"
MyApp.add_route("/exampleapp", bokeh_url)



"""
Example 2
you need to run download.py to get the data from quantquote
"""
import os
from os.path import join, dirname, splitext
import pandas as pd
data_dir = join(dirname(__file__), "daily")
tickers = os.listdir(data_dir)
tickers = [splitext(x)[0].split("table_")[-1] for x in tickers]

class StockInputModel(VBoxModelForm):
    """Input Widgets, define the fields you want to 
    read from the input here as bokeh properties
    input_specs is a list of dictionary, specifying
    how the kind of input widget you want for each
    property.  the name field must match
    one of the properties, for example here, 
    we use names of offset and scale.  You can
    also specify title, if you want a different
    label in the generated form
    """
    ticker1 = String(default="AAPL")
    ticker2 = String(default="C")
    input_specs = [
        {"widget" : TextInput,
         "name" : "ticker1",
         "value" : "AAPL"},
        {"widget" : TextInput,
         "name" : "ticker2",
         "value" : "C"}
    ]
    
class StockApp(ShinyApp):
    plot = Instance(Plot, has_ref=True)
    source = Instance(ColumnDataSource, has_ref=True)
    def get_data(self, ticker1, ticker2):
        fname = join(data_dir, "table_%s.csv" % ticker1.lower())
        data1 = pd.read_csv(fname, 
                            names=['date', 'foo', 'o', 'h', 'l', 'c', 'v'], 
                            header=False,
                            parse_dates=['date'])
        data1 = data1.set_index('date')
        fname = join(data_dir, "table_%s.csv" % ticker2.lower())        
        data2 = pd.read_csv(fname, 
                            names=['date', 'foo', 'o', 'h', 'l', 'c', 'v'], 
                            header=False,
                            parse_dates=['date'])
        data2 = data2.set_index('date')
        data = pd.DataFrame({ticker1 : data1.c, ticker2 : data2.c})
        data[ticker1 + "_returns"] = data[ticker1].diff()
        data[ticker2 + "_returns"] = data[ticker2].diff()
        data = data.dropna()
        return data
        
    def create(self, session):
        """
        This function is called once, and is responsible for 
        creating all objects (plots, datasources, etc)
        """
        self.modelform = StockInputModel()
        session.add(self.modelform)        
        self.modelform.create_inputs(session)
        ticker1 = self.modelform.ticker1
        ticker2 = self.modelform.ticker2
        self.make_source(ticker1, ticker2)
        self.make_plots(ticker1, ticker2)
        self.children.append(self.modelform)
        self.children.append(self.plot)
        
    def make_source(self, ticker1, ticker2):
        df = self.get_data(ticker1, ticker2)
        self.source = ColumnDataSource(data=df)
        
    def make_plots(self, ticker1, ticker2):
        self.plot = circle(ticker1 + "_returns", ticker2 + "_returns", 
                           source=self.source,
                           plot_width=400, plot_height=400)
        session().plotcontext.children=[self]
        session().plotcontext._dirty = True
    def set_plots(self, ticker1, ticker2):
        import pdb; pdb.set_trace()
    def input_change(self, obj, attrname, old, new):
        """
        This function is called whenever the input form changes
        This is responsible for updating the plot, or whatever
        you want.  The signature is 
        obj : the object that changed
        attrname : the attr that changed
        old : old value of attr
        new : new value of attr
        """
        if attrname in ("ticker1", "ticker2"):
            ticker1 = self.modelform.ticker1
            ticker2 = self.modelform.ticker2
            self.make_source(ticker1, ticker2)
            self.set_plots(ticker1, ticker2)


# the following addes "/exampleapp" as a url which renders StockApp
        
bokeh_url = "http://localhost:5006"
StockApp.add_route("/stocks", bokeh_url)




