# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import numpy as np
import pandas as pd

from bokeh.plotting import *

# Generate some synthetic time series for six different categories
cats = list("abcdef")
data = np.random.randn(2000)
g = np.random.choice(cats, 2000)
for i, l in enumerate(cats):
    data[g == l] += i // 2
df = pd.DataFrame(dict(score=data, group=g))

# Find the quartiles and IQR foor each category
groups = df.groupby('group')
q1 = groups.quantile(q=0.25)
q2 = groups.quantile(q=0.5)
q3 = groups.quantile(q=0.75)
iqr = q3 - q1
upper = q2 + 1.5*iqr
lower = q2 - 1.5*iqr

# find the outliers for each category
def outliers(group):
   cat = group.name
   return group[(group.score > upper.loc[cat][0]) | (group.score < lower.loc[cat][0])]['score']
out = groups.apply(outliers).dropna()

# Prepare outlier data for plotting, we need coordinate for every outlier.
outx = []
outy = []
for cat in cats:
    # only add outliers if they exist
    if not out.loc[cat].empty:
        for value in out[cat]:
            outx.append(cat)
            outy.append(value)

output_server('boxplot')

p = figure(tools="previewsave", background_fill="#EFE8E2", title="", x_range=cats)

# If no outliers, shrink lengths of stems to be no longer than the minimums or maximums
qmin = groups.quantile(q=0.00)
qmax = groups.quantile(q=1.00)
upper.score = [min([x,y]) for (x,y) in zip(list(qmax.iloc[:,0]),upper.score) ]
lower.score = [max([x,y]) for (x,y) in zip(list(qmin.iloc[:,0]),lower.score) ]

# stems
p.segment(cats, upper.score, cats, q3.score, line_width=2, line_color="black")
p.segment(cats, lower.score, cats, q1.score, line_width=2, line_color="black")

# boxes
p.rect(cats, (q3.score+q2.score)/2, 0.7, q3.score-q2.score,
    fill_color="#E08E79", line_width=2, line_color="black")
p.rect(cats, (q2.score+q1.score)/2, 0.7, q2.score-q1.score,
    fill_color="#3B8686", line_width=2, line_color="black")

# whisters (almost-0 height rects simpler than segments)
p.rect(cats, lower.score, 0.2, 0.01, line_color="black")
p.rect(cats, upper.score, 0.2, 0.01, line_color="black")

# outliers
p.circle(outx, outy, size=6, color="#F38630", fill_alpha=0.6)

p.xgrid.grid_line_color = None
p.ygrid.grid_line_color = "white"
p.ygrid.grid_line_width = 2
p.xaxis.major_label_text_font_size="12pt"

show(p)
