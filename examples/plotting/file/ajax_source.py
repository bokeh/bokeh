import numpy as np

from bokeh.plotting import figure, show, output_file
from bokeh.models.sources import AjaxDataSource

output_file("ajax_source.html", title="ajax_source.py example")
source = AjaxDataSource(data_url='http://localhost:5050/data',
                        polling_interval=1000)
p = figure()
p.circle('x', 'y', source=source)
show(p)

from flask import Flask, jsonify
from bokeh.server.crossdomain import crossdomain

app = Flask(__name__)

@app.route('/data', methods=['GET', 'OPTIONS'])
@crossdomain(origin="*", methods=['GET', 'POST'], headers=None)
def hello_world():
    return jsonify(x=np.random.random(5).tolist(), y=np.random.random(5).tolist())

if __name__ ==  "__main__":
    app.run(port=5050)
