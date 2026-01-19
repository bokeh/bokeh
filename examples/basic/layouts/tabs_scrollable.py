"""
Example demonstrating scrollable tabs when there are many tabs.

This addresses issue #14417 - restoring scroll functionality for large number of tabs.
"""
from bokeh.models import TabPanel
from bokeh.plotting import figure, show, output_file
from bokeh.layouts import layout
from bokeh.models.layouts import Tabs

# Prepare output
output_file("tabs_scrollable.html")

# Create multiple tabs to demonstrate scrolling
tab_panels = []

for i in range(20):
    # Create a simple plot for each tab
    p = figure(width=400, height=400, title=f"Plot {i+1}")
    p.circle([1, 2, 3, 4, 5], [i+1, i+2, i+3, i+4, i+5], size=10, color="navy", alpha=0.5)
    
    # Create a tab panel
    tab = TabPanel(child=p, title=f"Tab {i+1}")
    tab_panels.append(tab)

# Create Tabs widget with many tabs
tabs = Tabs(tabs=tab_panels)

# Show the layout
show(tabs)
