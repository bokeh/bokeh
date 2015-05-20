import numpy as np
import pandas as pd

from bokeh.plotting import figure, output_file, show

# Generate some synthetic time series for six different categories
cats = list("abcdef")
score = np.random.randn(2000)
g = np.random.choice(cats, 2000)
for i, l in enumerate(cats):
    score[g == l] += i // 2
df = pd.DataFrame(dict(score=score, group=g))

# Find the quartiles, IQR, and outliers for each category
groups = df.groupby('group')
q1 = groups.quantile(q=0.25)
q2 = groups.quantile(q=0.5)
q3 = groups.quantile(q=0.75)
iqr = q3 - q1
upper = q3 + 1.5*iqr
lower = q1 - 1.5*iqr
def outliers(group):
   cat = group.name
   return group[(group.score > upper.loc[cat][0]) | (group.score < lower.loc[cat][0])]['score']
out = groups.apply(outliers).dropna()

# Prepare outlier data for plotting, we need and x (categorical) and y (numeric)
# coordinate for every outlier.
outx = []
outy = []
for cat in cats:
    # only add outliers if they exist
    if not out.loc[cat].empty:
        for value in out[cat]:
            outx.append(cat)
            outy.append(value)

# EXERCISE: output static HTML file

# create a figure with the categories as the default x-range
p = figure(title="", tools="", background_fill="#EFE8E2", x_range=cats)

# If no outliers, shrink lengths of stems to be no longer than the minimums or maximums
qmin = groups.quantile(q=0.00)
qmax = groups.quantile(q=1.00)
upper.score = [min([x,y]) for (x,y) in zip(list(qmax.iloc[:,0]),upper.score) ]
lower.score = [max([x,y]) for (x,y) in zip(list(qmin.iloc[:,0]),lower.score) ]

# Draw the upper segment extending from the box plot using `p.segment` which
# takes x0, x1 and y0, y1 as data
p.segment(cats, upper.score, cats, q3.score, line_width=2, line_color="black")

# EXERCISE: use `p.segment` to  draw the lower segment

# Draw the upper box of the box plot using `p.rect`
p.rect(cats, (q3.score+q2.score)/2, 0.7, q3.score-q2.score,
       fill_color="#E08E79", line_width=2, line_color="black")

# EXERCISE: use `p.rect` to draw the bottom box with a different color

# OK here we use `p.rect` to draw the whiskers. It's slightly cheating, but it's
# easier than using segments or lines, since we can specify widths simply with
# categorical percentage units
p.rect(cats, lower.score, 0.2, 0.01, line_color="black")
p.rect(cats, upper.score, 0.2, 0.01, line_color="black")

# EXERCISE: use `p.circle` to draw the outliers

# EXERCISE: use `p.grid`, `p.axis`, etc. to style the plot. Some suggestions:
#   - remove the X grid lines, change the Y grid line color
#   - make the tick labels bigger

show(p)