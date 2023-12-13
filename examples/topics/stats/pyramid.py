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

bins = np.arange(0, 80, 3)
m_hist, edges = np.histogram(male_ages, bins=bins)
f_hist, edges = np.histogram(female_ages, bins=bins)

p = figure(title="Pyramid plot", height=400, width=600, x_range=(-60, 40), x_axis_label="count", y_axis_label="age (years)")

p.hbar(right=m_hist * -1, y=edges[1:], height=2, color="#055BB2")

p.hbar(right=f_hist, y=edges[1:], height=2, color="#CB6805")

# customise x-axis and y-axis
p.xaxis.ticker = (-40, -20, 0, 20, 40)
p.yaxis.ticker = (0, 20, 40, 60)

# apply the custom formatter to the x-axis using CustomJSTickFormatter
p.xaxis.formatter = CustomJSTickFormatter(args=dict(), code="return Math.abs(tick);")

# add labels
m_label = Label(x=-40, y=70, text="male", text_font_size="15pt", x_offset=5)
f_label = Label(x=20, y=70, text="female", text_font_size="15pt", x_offset=5)

p.add_layout(m_label)
p.add_layout(f_label)

show(p)
