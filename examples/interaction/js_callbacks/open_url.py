from bokeh.models import ColumnDataSource, OpenURL, TapTool
from bokeh.plotting import figure, show

p = figure(width=400, height=400,
           tools="tap", title="Click the Dots")

source = ColumnDataSource(data=dict(
    x=[1, 2, 3, 4, 5],
    y=[2, 5, 8, 2, 7],
    color=["navy", "orange", "olive", "firebrick", "gold"],
    ))

p.scatter('x', 'y', color='color', size=20, source=source)

# use the "color" column of the CDS to complete the URL
# e.g. if the glyph at index 10 is selected, then @color
# will be replaced with source.data['color'][10]
url = "https://www.html-color-names.com/@color.php"
taptool = p.select(type=TapTool)
taptool.callback = OpenURL(url=url)

show(p)
