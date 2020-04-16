import numpy as np

def eq_hist(data, mask=None, nbins=256*256):
    """Return a numpy array after histogram equalization.

    For use in `shade`.

    Parameters
    ----------
    data : ndarray
    mask : ndarray, optional
       Boolean array of missing points. Where True, the output will be `NaN`.
    nbins : int, optional
        Number of bins to use. Note that this argument is ignored for integer
        arrays, which bin by the integer values directly.

    Notes
    -----
    This function is adapted from the implementation in scikit-image [1]_.

    References
    ----------
    .. [1] http://scikit-image.org/docs/stable/api/skimage.exposure.html#equalize-hist
    """
    if not isinstance(data, np.ndarray):
        raise TypeError("data must be np.ndarray")
    data2 = data if mask is None else data[~mask]
    if data2.dtype == bool or np.issubdtype(data2.dtype, np.integer):
        hist = np.bincount(data2.ravel())
        bin_centers = np.arange(len(hist))
        idx = np.nonzero(hist)[0][0]
        hist, bin_centers = hist[idx:], bin_centers[idx:]
    else:
        hist, bin_edges = np.histogram(data2, bins=nbins)
        #print(hist)
        bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2
    cdf = hist.cumsum()
    cdf = cdf / float(cdf[-1])
    #print(cdf, len(cdf), 256*256)
    out = np.interp(data.flat, bin_centers, cdf).reshape(data.shape)
    return out if mask is None else np.where(mask, np.nan, out)

def _eq_hist(data, nbins=256*256):
    print("===============================")
    print(data)
    hist, bin_edges = np.histogram(data, bins=nbins)
    bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2
    cdf = hist.cumsum()
    cdf = cdf / float(cdf[-1])
    out = np.interp(data.flat, bin_centers, cdf)
    print(out)
    result = out.reshape(data.shape)
    print(result)
    return result

from bokeh.plotting import figure, save
from bokeh.models import (
    Range1d,
    ColorBar,
    LinearColorMapper, LogColorMapper, EqHistColorMapper,
    BasicTicker, BasicTickFormatter,
    LogTicker, LogTickFormatter,
)
from bokeh.layouts import column

tooltips = [("x", "$x"), ("y", "$y"), ("value", "@image")]

N = 16 # 200 # 150 # 50 # 500
x = np.linspace(0, 10, N)
y = np.linspace(0, 10, N)
xx, yy = np.meshgrid(x, y)

d = 10*np.sin(xx)*np.cos(yy)
d[8:9, 8:9] = 20
eq_hist_d = _eq_hist(d, 32)

print(f"{d.shape} low={d.min()}, high={d.max()}")

from bokeh.palettes import Inferno256
#palette = "Inferno256"
palette = Inferno256
print(len(palette), palette)

def f(mapper, image_d):
    x_range = Range1d(-1, 11)
    y_range = Range1d(-1, 11)
    p = figure(plot_width=300, plot_height=300, x_range=x_range, y_range=y_range, tooltips=tooltips)
    p.image(image=[image_d], x=0, y=0, dw=10, dh=10, level="image", color_mapper=mapper)
    return p

def cb(mapper):
    color_bar = ColorBar(color_mapper=mapper, location=(0,0), orientation='horizontal',
        padding=0, ticker=BasicTicker(), formatter=BasicTickFormatter())
    return color_bar

mapper1 = LinearColorMapper(palette=palette, low=d.min(), high=d.max(), low_color="pink", high_color="purple")
#mapper2 = EqHistColorMapper(palette=palette, low=d.min(), high=d.max(), low_color="pink", high_color="purple") #, bins=1024)
mapper2 = LinearColorMapper(palette=palette, low=eq_hist_d.min(), high=eq_hist_d.max(), low_color="pink", high_color="purple") #, bins=1024)
mapper3 = EqHistColorMapper(palette=palette, low=d.min(), high=d.max(), low_color="pink", high_color="purple", bins=32) #, bins=1024)

#mapper1 = LinearColorMapper(palette=palette, source/field | glyph, low=_fixed_low, high=_fixed_low, low_color="pink", high_color="purple")
#mapper2 = EqHistColorMapper(palette=palette, source/field | glyph, low=_fixed_low, high=_fixed_low, low_color="pink", high_color="purple", bins=1024)

p1 = f(mapper1, d)
p2 = f(mapper2, eq_hist_d)
p3 = f(mapper3, d)

p1.add_layout(cb(mapper1), "below")
p2.add_layout(cb(mapper2), "below")
p3.add_layout(cb(mapper3), "below")

save(column([p1, p2, p3]))
#save(p2)
