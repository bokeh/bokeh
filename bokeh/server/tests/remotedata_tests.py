import json

import numpy as np

from ..app import bokeh_app, app
from ..models import user

from . import test_utils
from ...plotting import (reset_output, output_server, square, push, curdoc)
from ...session import TestSession
from ...models.sources import ServerDataSource
from ...models.ranges import Range1d
from ...transforms import ar_downsample as ar

class TestAr(test_utils.FlaskClientTestCase):
    def test_ar(self):
        #move to setUp
        reset_output()
        sess = TestSession(client=app.test_client())
        output_server('ar', session=sess)

        # wierd - server source has no params now besides the blaze expression
        # we don't pass a data_url right now because right now we assume the
        # server is the bokeh server, however that can be handled later

        orig_source = ServerDataSource(expr={'op': 'Field', 'args': [':leaf', 'gauss']})

        #make template plot
        plot = square('oneA', 'oneB', color='#FF00FF', source=orig_source)

        #replace that plot with an abstract rendering one
        arplot = ar.heatmap(
            plot,
            spread=3,
            transform=None,
            title="Server-rendered, uncorrected")
        arplot.x_range.start = -2.0
        arplot.x_range.end = 2.0
        arplot.y_range.start = -2.0
        arplot.y_range.end = 2.0

        #extract the original data source because it was replaced?!
        source = arplot.select({'type' : ServerDataSource})[0]

        #what is render state?
        render_state = None

        #our docs don't have screen ranges, because we make those on the fly in javascript
        #so we make fake ones!
        screen_x_range = Range1d(start=0, end=200)
        screen_y_range = Range1d(start=0, end=200)

        #this dumping to json thing is terrible
        plot_state = {'screen_x' : curdoc().dump(screen_x_range)[0]['attributes'],
                      'screen_y' : curdoc().dump(screen_y_range)[0]['attributes'],
                      'data_x' : curdoc().dump(arplot.x_range)[0]['attributes'],
                      'data_y' : curdoc().dump(arplot.y_range)[0]['attributes']}

        #save data to server
        push()
        data = {'plot_state' : plot_state}
        url = "/render/%s/%s" % (curdoc().docid, source._id)
        result = self.client.post(
            url,
            data=json.dumps(data),
            headers={'content-type' : 'application/json'}
        )
        data = json.loads(result.data)
        image = np.array(data['image'][0])

        #I guess it's data dependent so the shape changes....
        assert image.shape[0] >200
        assert image.shape[1] >200
