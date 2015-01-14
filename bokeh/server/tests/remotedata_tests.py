import json

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
                      'screen_y' : curdoc().dump(screen_x_range)[0]['attributes'],
                      'data_x' : curdoc().dump(screen_x_range)[0]['attributes'],
                      'data_y' : curdoc().dump(screen_x_range)[0]['attributes']}

        #save data to server
        push()

        # note we actually have to pass the expr as part of the json payload like this
        # so that blaze understands it even though it's encoded in the server source
        # that the server already has.. actually that's not even true because it
        # gets lost when we clone the server source in the replot call

        data = {'plot_state' : plot_state,
                'expr' : orig_source.expr
        }

        url = "/render/%s/%s" % (curdoc().docid, source._id)
        result = self.client.post(
            url,
            data=json.dumps(data),
            headers={'content-type' : 'application/json'}
        )
        data = json.loads(result.data)
