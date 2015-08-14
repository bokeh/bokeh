from __future__ import division
# The following demo dashboard is a mock up of a simple trading application for interest rate swaps.
# It is based upon data_tables(_server).py/curs

from bokeh.models.widgets import TextInput, Select, Button # for new trades
from bokeh.models.widgets import DataTable, TableColumn, StringFormatter, NumberFormatter, StringEditor, IntEditor, NumberEditor, SelectEditor
from bokeh.models import NumeralTickFormatter
from bokeh.resources import INLINE
from bokeh.browserlib import view

from bokeh.plotting import figure, output_server, show, ColumnDataSource, vplot, hplot, cursession, curdoc
import pandas as pd
from bokeh.document import Document
from bokeh.session import Session
from bokeh.server.app import bokeh_app
from threading import Thread
import numpy as np
import time

# global variables to maintain state. Not the best of solutions but it works for a demo.
ds_prev = None          # table of previous positions
ds_new = None           # table of new trades
new_notional = None     # size of new trade in form
new_maturity = None     # maturity date of new trade in form
new_rate = None         # fixed rate of new trade in form

def create(new_df, df):
    """ Create dashboard containing: 2 Plots, a DataTable and a new Trade form """
    global ds_prev
    global ds_new
    global new_notional
    global new_maturity
    global new_rate
    
    # add a column to the dataframe for the midpoints of the bars
    df['Mid'] = 0.5 * df['PNL'] 

    # Take a 'snapshot' of the df.
    # Consider the ColumnDataSource as a picture of a dataframe. It's got the data, but not the functionality
    ds_prev = ColumnDataSource(df)

    # Create two plots based on the same source

    # Yield curves - line plot. Create figure, then add line and circle glyphs.
    plot_rates = figure(
       y_range=[0.00, 0.03], title="Swap Rates",
       x_axis_label='Maturity (yr)', y_axis_label='Rate ( / yr )',
       width=1000, height=500
    )
    plot_rates.line("Maturity","Live", source=ds_prev, color="#396285", legend="Live")
    plot_rates.circle("Maturity","Live", source=ds_prev, fill_color="#396285", size=8, legend="Live")
    plot_rates.line("Maturity","Close", source=ds_prev, color="#CE603D", legend="Close")
    plot_rates.circle("Maturity","Close", source=ds_prev, fill_color="#CE603D", size=8, legend="Close")

    # PNL - bar plot
    plot_pnl = figure(
            y_range=[-50000, 50000], title='PNL', x_axis_label='Maturity (yr)', 
            width=1000, height=300
    )
    plot_pnl.yaxis[0].formatter = NumeralTickFormatter(format="$ 0,0")
    plot_pnl.rect(x="Maturity", y="Mid", width=1, height="PNL", source=ds_prev, fill_color="#CAB2D6")


    # Create DataTable widget from dataframe 'snapshot'
    columns = [
        TableColumn(field="Maturity",   title="Maturity",   editor=IntEditor()),
        TableColumn(field="Duration",   title="Duration",   editor=NumberEditor(step=0.1),    formatter=NumberFormatter(format="0.00")),
        TableColumn(field="Position",   title="Position",   editor=NumberEditor(step=0.1),    formatter=NumberFormatter(format="$ 0,0[.]00")),
        TableColumn(field="Close",      title="Close",      editor=NumberEditor(step=0.1),    formatter=NumberFormatter(format="0.000%")),
        TableColumn(field="Live",       title="Live",       editor=NumberEditor(step=0.1),    formatter=NumberFormatter(format="0.000%")),
        TableColumn(field="Change",     title="Change",     editor=NumberEditor(step=0.1),    formatter=NumberFormatter(format="0.000%")),
        TableColumn(field="PNL",        title="PNL",        editor=NumberEditor(step=0.1),    formatter=NumberFormatter(format="$ 0,0[.]00")),
    ]

    data_table = DataTable(source=ds_prev, columns=columns, editable=True, width=1000)

    
    # Add ability to add new trades as a form
    # Input and buttons
    new_notional = TextInput(value="1000000.00", title="Notional:")
    new_rate = TextInput(value="0.01", title="Fixed Rate:")
    new_maturity = Select(title="Maturity:", value="1", options=['1','2','5','10','30'])
    bookit = Button(label="Book it!", type="success")
    bookit.on_click(bookit_clicked)

    new_trade_entry = hplot(bookit, new_maturity, new_notional, new_rate)

    # Create DataTable for New Trades
    ds_new = ColumnDataSource(new_df)
    print 'new_df:'
    print new_df
    #if ds_new is not None and len(ds_new.data) > 0:
    new_trade_table = DataTable(source=ds_new, columns=columns, editable=True, width=1000)
    return vplot(plot_rates, plot_pnl, data_table, new_trade_entry, new_trade_table)
    #else:
    #    return vplot(plot_rates, plot_pnl, new_trade_entry, data_table) 


def get_data():
    """ Import data from Excel into a pandas dataframe """    
    xls = 'swap_pnl_dashboard.xlsm'
    df = pd.read_excel(xls, sheetname='data', index_col=0, skip_footer=1)
    print 'df_live, df_close', df['Live'], df['Close']
    return df

def run():
    """ Initialize and show dashboard, begin simulating yield curve """
    # table for opening positions
    init_df = get_data()
    # table for today's new trades
    new_df = init_df.drop(init_df.index) # same columns, no rows
    dashboard = create(new_df, init_df)
    show(dashboard)
    # kick off 2-factor mean reverting process for yield curve
    Thread(target=background_thread, args=(ds_prev,)).start()


def background_thread_gaussian(ds):
    """Plot animation, update data if play is True, otherwise stop"""
    try:
        while True:
            for i in np.hstack((np.linspace(1, -1, 100), np.linspace(-1, 1, 100))):
                w1 = np.random.randn() / 100000.
                w2 = np.random.randn() / 100000.
                ds.data["Live"] = ( np.array(ds.data["Live"]) 
                                    + w1 * np.array(ds.data["Level"]) 
                                    + w2 * np.array(ds.data["Slope"]))
                ds.data["Change"] = ( np.array(ds.data["Live"]) 
                                        - np.array(ds.data["Close"]))
                ds.data["PNL"] = ( np.array(ds.data["Position"]) 
                                 * np.array(ds.data["Duration"]) 
                                 * np.array(ds.data["Change"])) 
                ds.data["Mid"] = 0.5 * np.array(ds.data["PNL"])
            
            cursession().store_objects(ds)
            time.sleep(0.1)
    except:
        # logger.exception("An error occurred")
        raise

def background_thread(ds):
    """Plot animation, update data if play is True, otherwise stop
    
        This version uses a two factor mean-reverting process
    """
    
    vol = 5e-5 
    mr = 0.001
    try:
        while True:
            for i in np.hstack((np.linspace(1, -1, 100), np.linspace(-1, 1, 100))):
                w1 = vol * np.random.randn() 
                w2 = vol * np.random.randn()
                ds.data["Live"] = ( np.array(ds.data["Live"]) 
                                    + mr * (np.array(ds.data["Close"]) - np.array(ds.data["Live"])) 
                                    + w1 * np.array(ds.data["Level"]) 
                                    + w2 * np.array(ds.data["Slope"]))
                ds.data["Change"] = ( np.array(ds.data["Live"]) 
                                        - np.array(ds.data["Close"]))
                ds.data["PNL"] = ( np.array(ds.data["Position"]) 
                                 * np.array(ds.data["Duration"]) 
                                 * np.array(ds.data["Change"])) 
                ds.data["Mid"] = 0.5 * np.array(ds.data["PNL"])
            
            cursession().store_objects(ds)
            time.sleep(0.1)
    except:
        # logger.exception("An error occurred")
        raise


def bookit_clicked():
    print("button_handler: stop click")
    size = float(new_notional.value)
    rate = float(new_rate.value)
    mat  = float(new_maturity.value)
    
    # Add row to new trade table, ds_new
    ds_new.data["Maturity"].append(mat)
    ds_new.data["Close"].append(rate)
    ds_new.data["Position"].append(size)

    # Find corresponding maturity in ds_prev and use market values
    idx = ds_prev.data["Maturity"].index(mat)
    live = ds_prev.data["Live"][idx]
    ds_new.data["Live"].append(live)
    duration = ds_prev.data["Duration"][idx]
    ds_new.data["Duration"].append(duration)
    change = ds_prev.data["Live"][idx] - rate
    ds_new.data["Change"].append(change) 
    pnl = size * duration * change
    ds_new.data["PNL"].append(pnl) 
    ds_new.data["Slope"].append(0.0) 
    ds_new.data["Level"].append(0.0) 
    
    #import pdb; pdb.set_trace()    
    print ds_new.data
    cursession().store_objects(ds_new)

if __name__ == "__main__":
    name = "pnl_dashboard" # name of document to push to bokeh server
    output_server(name) # see io.py
    run()

    cursession().poll_document(curdoc(), 0.1) # poll document for updates every 0.1 sec
