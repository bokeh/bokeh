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
        source = ServerDataSource()
        plot = square('oneA', 'oneB', color='#FF00FF', source=source)
        arplot = ar.heatmap(
            plot,
            spread=3,
            transform=None,
            title="Server-rendered, uncorrected")
        source = arplot.select({'type' : ServerDataSource})[0]
        resample_parameters = source.transform
        render_state = None
        screen_x_range = Range1d(start=0, end=200)
        screen_y_range = Range1d(start=0, end=200)
        plot_state = {'screen_x' : curdoc().dump(screen_x_range)[0]['attributes'],
                      'screen_y' : curdoc().dump(screen_x_range)[0]['attributes'],
                      'data_x' : curdoc().dump(screen_x_range)[0]['attributes'],
                      'data_y' : curdoc().dump(screen_x_range)[0]['attributes']}
        push()
        data = {'plot_state' : plot_state,
                'expr' : {'op': 'Field', 'args': [':leaf', 'gauss']}
        }

        url = "/render/%s/%s" % (curdoc().docid, source._id)
        result = self.client.post(
            url,
            data=json.dumps(data),
            headers={'content-type' : 'application/json'}
        )
        data = json.loads(result.data)
        import pdb;pdb.set_trace()
