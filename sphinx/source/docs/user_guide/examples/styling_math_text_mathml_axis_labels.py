from numpy import arange

from bokeh.models import MathML
from bokeh.plotting import figure, show

x = arange(-10, 10, 0.1)
y = (x * 0.5) ** 2

mathml = """
<math>
  <mrow>
    <mfrac>
      <mn>1</mn>
      <mn>4</mn>
    </mfrac>
    <msup>
      <mi>x</mi>
      <mn>2</mn>
    </msup>
  </mrow>
</math>
"""

plot = figure(height=200)
plot.line(x, y)

plot.xaxis.axis_label = MathML(text=mathml)

show(plot)
