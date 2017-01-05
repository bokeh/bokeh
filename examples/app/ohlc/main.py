from numpy import asarray, cumprod, convolve, exp, ones
from numpy.random import lognormal, gamma, uniform

from bokeh.layouts import row, column, gridplot
from bokeh.models import ColumnDataSource, Slider, Select
from bokeh.plotting import curdoc, figure
from bokeh.driving import count

BUFSIZE = 200
MA12, MA26, EMA12, EMA26 = '12-tick Moving Avg', '26-tick Moving Avg', '12-tick EMA', '26-tick EMA'

source = ColumnDataSource(dict(
    time=[], average=[], low=[], high=[], open=[], close=[],
    ma=[], macd=[], macd9=[], macdh=[], color=[]
))

p = figure(plot_height=500, tools="xpan,xwheel_zoom,xbox_zoom,reset", x_axis_type=None, y_axis_location="right")
p.x_range.follow = "end"
p.x_range.follow_interval = 100
p.x_range.range_padding = 0

p.line(x='time', y='average', alpha=0.2, line_width=3, color='navy', source=source)
p.line(x='time', y='ma', alpha=0.8, line_width=2, color='orange', source=source)
p.segment(x0='time', y0='low', x1='time', y1='high', line_width=2, color='black', source=source)
p.segment(x0='time', y0='open', x1='time', y1='close', line_width=8, color='color', source=source)

p2 = figure(plot_height=250, x_range=p.x_range, tools="xpan,xwheel_zoom,xbox_zoom,reset", y_axis_location="right")
p2.line(x='time', y='macd', color='red', source=source)
p2.line(x='time', y='macd9', color='blue', source=source)
p2.segment(x0='time', y0=0, x1='time', y1='macdh', line_width=6, color='black', alpha=0.5, source=source)

mean = Slider(title="mean", value=0, start=-0.01, end=0.01, step=0.001)
stddev = Slider(title="stddev", value=0.04, start=0.01, end=0.1, step=0.01)
mavg = Select(value=MA12, options=[MA12, MA26, EMA12, EMA26])

def _create_prices(t):
    last_average = 100 if t==0 else source.data['average'][-1]
    returns = asarray(lognormal(mean.value, stddev.value, 1))
    average =  last_average * cumprod(returns)
    high = average * exp(abs(gamma(1, 0.03, size=1)))
    low = average / exp(abs(gamma(1, 0.03, size=1)))
    delta = high - low
    open = low + delta * uniform(0.05, 0.95, size=1)
    close = low + delta * uniform(0.05, 0.95, size=1)
    return open[0], high[0], low[0], close[0], average[0]

def _moving_avg(prices, days=10):
    if len(prices) < days: return [100]
    return convolve(prices[-days:], ones(days, dtype=float), mode="valid") / days

def _ema(prices, days=10):
    if len(prices) < days or days < 2: return [prices[-1]]
    a = 2.0 / (days+1)
    kernel = ones(days, dtype=float)
    kernel[1:] = 1 - a
    kernel = a * cumprod(kernel)
    # The 0.8647 normalizes out that we stop the EMA after a finite number of terms
    return convolve(prices[-days:], kernel, mode="valid") / (0.8647)

@count()
def update(t):
    open, high, low, close, average = _create_prices(t)
    color = "green" if open < close else "red"

    new_data = dict(
        time=[t],
        open=[open],
        high=[high],
        low=[low],
        close=[close],
        average=[average],
        color=[color],
    )

    close = source.data['close'] + [close]
    ma12 = _moving_avg(close[-12:], 12)[0]
    ma26 = _moving_avg(close[-26:], 26)[0]
    ema12 = _ema(close[-12:], 12)[0]
    ema26 = _ema(close[-26:], 26)[0]

    if   mavg.value == MA12:  new_data['ma'] = [ma12]
    elif mavg.value == MA26:  new_data['ma'] = [ma26]
    elif mavg.value == EMA12: new_data['ma'] = [ema12]
    elif mavg.value == EMA26: new_data['ma'] = [ema26]

    macd = ema12 - ema26
    new_data['macd'] = [macd]

    macd_series = source.data['macd'] + [macd]
    macd9 = _ema(macd_series[-26:], 9)[0]
    new_data['macd9'] = [macd9]
    new_data['macdh'] = [macd - macd9]

    source.stream(new_data, 300)

curdoc().add_root(column(row(mean, stddev, mavg), gridplot([[p], [p2]], toolbar_location="left", plot_width=1000)))

curdoc().add_periodic_callback(update, 50)
curdoc().title = "OHLC"
