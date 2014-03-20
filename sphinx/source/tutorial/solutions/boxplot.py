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

# Find the quartiles, IQR, and outliers for each category
groups = df.groupby('group')
q1 = groups.quantile(q=0.25)
q2 = groups.quantile(q=0.5)
q3 = groups.quantile(q=0.75)
iqr = q3 - q1
upper = q2 + 1.5*iqr
lower = q2 - 1.5*iqr
def outliers(group):
   cat = group.name
   return group[(group.score > upper.loc[cat][0]) | (group.score < lower.loc[cat][0])]['score']
out = groups.apply(outliers).dropna()

# Prepare outlier data for plotting, we need and x (categorical) and y (numeric)
# coordinate for every outlier.
outx = []
outy = []
for cat in cats:
    for value in out[cat]:
        outx.append(cat)
        outy.append(value)

# EXERCISE: output static HTML file
output_file("boxplot.html")

# EXERCISE: turn on plot hold
hold()

# Draw the upper segment extending from the box plot using `segment` which
# takes x0, x1 and y0, y1 as data
segment(cats, upper.score, cats, q3.score, x_range=cats, line_width=2,
        tools="", background_fill="#EFE8E2", line_color="black", title="")

# EXERCISE: draw the lower segment
segment(cats, lower.score, cats, q1.score, x_range=cats,
        line_width=2, line_color="black")

# Draw the upper box of the box plot using `rect`
rect(cats, (q3.score+q2.score)/2, 0.7, q3.score-q2.score,
     fill_color="#E08E79", line_width=2, line_color="black")

# EXERCISE: use `rect` to draw the bottom box with a different color
rect(cats, (q2.score+q1.score)/2, 0.7, q2.score-q1.score,
     fill_color="#3B8686", line_width=2, line_color="black")

# OK here we use `rect` to draw the whiskers. It's slightly cheating, but it's
# easier than using segments or lines, since we can specify widths simply with
# categorical percentage units
rect(cats, lower.score, 0.2, 0, line_color="black")
rect(cats, upper.score, 0.2, 0, line_color="black")

# EXERCISE: use `circle` to draw the outliers
circle(outx, outy, size=6, color="#F38630", fill_alpha=0.6)

# EXERCISE: use grid(), axis(), etc. to style the plot. Some suggestions:
#   - remove the X grid lines, change the Y grid line color
#   - make the tick labels bigger
xgrid().grid_line_color = None
ygrid().grid_line_color = "white"
ygrid().grid_line_width = 2
xaxis().major_label_text_font_size="12pt"

show()