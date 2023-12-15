''' A pyramid plot showing the age distribution of the male and female Titanic passengers using the `Bokeh` hbar glyph.

.. bokeh-example-metadata::
    :sampledata: titanic
    :apis: bokeh.plotting.figure.hbar
    :refs: :ref:`ug_topics_stats_pyramid`
    :keywords: pyramid, hbar
'''
import numpy as np

from bokeh.models import CustomJSTickFormatter, Label
from bokeh.plotting import figure, show
from bokeh.sampledata.titanic import data as df

sex_group = df.groupby("sex")

female_ages = sex_group.get_group("female")["age"].dropna()
male_ages = sex_group.get_group("male")["age"].dropna()

bin_width = 5
bins = np.arange(0, 72, bin_width)
m_hist, edges = np.histogram(male_ages, bins=bins)
f_hist, edges = np.histogram(female_ages, bins=bins)

colors = ("#055BB2", "#CB6805", "#808080")
bar_width = 4

p = figure(title="Age population pyramid of titanic passengers, by gender", height=400, width=600,
           x_range=(-90, 90), x_axis_label="count")

p.hbar(right=m_hist * -1, y=edges[1:], height=bar_width, color=colors[0], line_width=0)

p.hbar(right=f_hist, y=edges[1:], height=bar_width, color=colors[1], line_width=0)

# add text to every other bar
for i, (count, age) in enumerate(zip(f_hist, edges[1:])):
    if i % 2 == 0:
        p.text(x=count, y=edges[1:][i], text=[f"{age-bin_width}-{age}yrs"], x_offset=5, y_offset=7, text_font_size="12px", text_color=colors[2])
        
# customise x-axis and y-axis
p.xaxis.ticker = (-60, -40, -20, 0, 20, 40, 60)
p.xaxis.major_tick_out = 0
p.y_range.start = 3
p.ygrid.grid_line_color = None
p.yaxis.visible = False

# apply a custom formatter to the x-axis using CustomJSTickFormatter
p.xaxis.formatter = CustomJSTickFormatter(args=dict(), code="return Math.abs(tick);")

# add labels
m_label = Label(x=-40, y=70, text="Men", text_color=colors[0], x_offset=5)
f_label = Label(x=20, y=70, text="Women", text_color=colors[1], x_offset=5)

p.add_layout(m_label)
p.add_layout(f_label)

show(p)
