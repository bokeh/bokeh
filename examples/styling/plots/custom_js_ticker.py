from bokeh.models import CustomJSTicker
from bokeh.plotting import figure, show

xticker = CustomJSTicker(
    # always three equally spaced ticks
    major_code="""
        const {start, end} = cb_data.range
        const interval = (end-start) / 4
        return [start + interval, start + 2*interval, start + 3*interval]
    """,
    # minor ticks in between the major ticks
    minor_code="""
        const {start, end, major_ticks} = cb_data
        return [
            (start+major_ticks[0])/2,
            (major_ticks[0]+major_ticks[1])/2,
            (major_ticks[1]+major_ticks[2])/2,
            (major_ticks[2]+end)/2,
        ]
    """,
)

yticker = CustomJSTicker(major_code="return ['a', 'c', 'e', 'g']")

p = figure(y_range=list("abcdefg"))
p.scatter([1, 2, 3, 4, 5], ["a", "d", "b", "f", "c"], size=30)

p.xaxis.ticker = xticker

# keep the grid lines at all original tick locations
p.ygrid.ticker = p.yaxis.ticker
p.yaxis.ticker = yticker

show(p)
