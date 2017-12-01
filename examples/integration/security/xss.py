from __future__ import print_function

from bokeh.plotting import figure
from bokeh.io import save

p = figure()
p.text(0, 0, ["</script><script>alert('xss')</script>"])

save(p)
