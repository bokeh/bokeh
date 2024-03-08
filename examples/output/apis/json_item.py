import json

from flask import Flask
from jinja2 import Template

from bokeh.embed import json_item
from bokeh.plotting import figure
from bokeh.resources import CDN
from bokeh.sampledata.penguins import data

app = Flask(__name__)

page = Template("""
<!DOCTYPE html>
<html lang="en">
<head>
  {{ resources }}
</head>

<body>
  <div id="myplot"></div>
  <div id="myplot2"></div>
  <script>
  fetch('/plot')
    .then(function(response) { return response.json(); })
    .then(function(item) { return Bokeh.embed.embed_item(item); })
  </script>
  <script>
  fetch('/plot2')
    .then(function(response) { return response.json(); })
    .then(function(item) { return Bokeh.embed.embed_item(item, "myplot2"); })
  </script>
</body>
""")

colormap = {'Adelie': 'red', 'Chinstrap': 'green', 'Gentoo': 'blue'}
colors = [colormap[x] for x in data['species']]

def make_plot(x, y):
    p = figure(title = "Penguin size", sizing_mode="fixed", width=400, height=400)
    p.xaxis.axis_label = x
    p.yaxis.axis_label = y
    p.scatter(data[x], data[y], color=colors, fill_alpha=0.2, size=10)
    return p

@app.route('/')
def root():
    return page.render(resources=CDN.render())

@app.route('/plot')
def plot():
    p = make_plot('flipper_length_mm', 'body_mass_g')
    return json.dumps(json_item(p, "myplot"))

@app.route('/plot2')
def plot2():
    p = make_plot('bill_length_mm', 'body_mass_g')
    return json.dumps(json_item(p))

if __name__ == '__main__':
    app.run()
