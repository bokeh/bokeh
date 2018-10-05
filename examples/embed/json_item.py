from __future__ import print_function
import json

from bokeh.embed import json_item
from bokeh.plotting import figure
from bokeh.sampledata.iris import flowers

from flask import Flask
from jinja2 import Template

app = Flask(__name__)

page = Template("""
<!DOCTYPE html>
<html lang="en">
<head>
  <link href="http://localhost:5006/static/css/bokeh.css" rel="stylesheet" type="text/css">
  <script src="http://localhost:5006/static/js/bokeh.js"></script>
</head>

<body>
  <div id="myplot"></div>
  <div id="myplot2"></div>
  <script>
  fetch('/plot')
    .then(function(response) { return response.json(); })
    .then(function(item) { Bokeh.embed.embed_item(item); })
  </script>
  <script>
  fetch('/plot2')
    .then(function(response) { return response.json(); })
    .then(function(item) { Bokeh.embed.embed_item(item, "myplot2"); })
  </script>
</body>
""")

colormap = {'setosa': 'red', 'versicolor': 'green', 'virginica': 'blue'}
colors = [colormap[x] for x in flowers['species']]

def make_plot(x, y):
    p = figure(title = "Iris Morphology", sizing_mode="fixed")
    p.xaxis.axis_label = x
    p.yaxis.axis_label = y
    p.circle(flowers[x], flowers[y], color=colors, fill_alpha=0.2, size=10)
    return p

@app.route('/')
def root():
    return page.render()

@app.route('/plot')
def plot():
    p = make_plot('petal_width', 'petal_length')
    return json.dumps(json_item(p, "myplot"))

@app.route('/plot2')
def plot2():
    p = make_plot('sepal_width', 'sepal_length')
    return json.dumps(json_item(p))

if __name__ == '__main__':
    print("\n\n *** Run 'bokeh static --port 5006` in a separate window ***\n\n")
    app.run()
