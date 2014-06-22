# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import numpy as np
import pandas as pd
from bokeh.plotting import *

# Generate some synthetic time series for six different categories
cats = list("abcdef")
y = np.random.randn(2000)
g = np.random.choice(cats, 2000)
for i, l in enumerate(cats):
    y[g == l] += i // 2
df = pd.DataFrame(dict(score=y, group=g))

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
    for value in out[cat]:
        outx.append(cat)
        outy.append(value)

output_server('boxplot')

figure(tools="previewsave", background_fill="#EFE8E2", title="")

hold()

# stems
segment(cats, upper.score, cats, q3.score, x_range=cats,
        line_width=2, line_color="black", )
segment(cats, lower.score, cats, q1.score, x_range=cats,
        line_width=2, line_color="black")
# boxes
rect(cats, (q3.score+q2.score)/2, 0.7, q3.score-q2.score,
     fill_color="#E08E79", line_width=2, line_color="black")
rect(cats, (q2.score+q1.score)/2, 0.7, q2.score-q1.score,
     fill_color="#3B8686", line_width=2, line_color="black")

# whisters (0-height rects simpler than segments)
rect(cats, lower.score, 0.2, 0, line_color="black")
rect(cats, upper.score, 0.2, 0, line_color="black")

# outliers
circle(outx, outy, size=6, color="#F38630", fill_alpha=0.6)

xgrid().grid_line_color = None
ygrid().grid_line_color = "white"
ygrid().grid_line_width = 2
xaxis().major_label_text_font_size="12pt"
show()
