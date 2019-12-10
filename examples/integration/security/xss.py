from bokeh.io import save
from bokeh.plotting import figure

p = figure()
p.text(0, 0, ["</script><script>alert('xss')</script>"])

save(p)
