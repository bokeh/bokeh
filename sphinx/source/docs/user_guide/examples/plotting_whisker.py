from bokeh.models import ColumnDataSource, Whisker
from bokeh.plotting import figure, show
from bokeh.sampledata.autompg import autompg as df

colors = ["red", "olive", "darkred", "goldenrod", "skyblue", "orange", "salmon"]

p = figure(plot_width=600, plot_height=300, title="Years vs mpg with Quartile Ranges")

base, lower, upper = [], [], []

for i, year in enumerate(list(df.yr.unique())):
    year_mpgs = df[df['yr'] == year]['mpg']
    mpgs_mean = year_mpgs.mean()
    mpgs_std = year_mpgs.std()
    lower.append(mpgs_mean - mpgs_std)
    upper.append(mpgs_mean + mpgs_std)
    base.append(year)

source_error = ColumnDataSource(data=dict(base=base, lower=lower, upper=upper))

p.add_layout(
    Whisker(source=source_error, base="base", upper="upper", lower="lower")
)

for i, year in enumerate(list(df.yr.unique())):
    y = df[df['yr'] == year]['mpg']
    color = colors[i % len(colors)]
    p.circle(x=year, y=y, color=color)

show(p)
