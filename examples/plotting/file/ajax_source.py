from bokeh.plotting import figure, show, output_file
from bokeh.models.sources import AjaxDataSource
from bokeh.models.ranges import Range1d

output_file("ajax_source.html", title="ajax_source.py example")
source = AjaxDataSource(data_url='http://localhost:5050/data')
p = figure(x_range=Range1d(start=0, end=5), y_range=Range1d(start=0, end=5))
p.circle('x', 'y', source=source)
show(p)

from flask import Flask, jsonify
from bokeh.server.crossdomain import crossdomain

app = Flask(__name__)

@app.route('/data', methods=['GET', 'OPTIONS'])
@crossdomain(origin="*", methods=['GET', 'POST'], headers=None)
def hello_world():
    return jsonify(x=[1,2,3,4,5], y=[5,4,3,2,1])

if __name__ ==  "__main__":
    app.run(port=5050)
