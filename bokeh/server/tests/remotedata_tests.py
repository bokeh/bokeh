from __future__ import absolute_import

import json

import numpy as np

from ..app import app

from . import test_utils
from ...plotting import (reset_output, output_server, push, curdoc, figure)
from ...session import TestSession
from ...models.sources import ServerDataSource
from ...models.ranges import Range1d
from ...models.renderers import GlyphRenderer
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
        p = figure(x_range=Range1d(start=0, end=0), y_range=Range1d(start=0, end=0))
        plot = p.square('oneA', 'oneB', color='#FF00FF', source=orig_source)

        #replace that plot with an abstract rendering one
        arplot = ar.heatmap(
            plot,
            spread=3,
            transform=None,
            title="Server-rendered, uncorrected")
        # set explicit value for ranges, or else they are set at 0
        # until the javascript auto-sets it
        arplot.x_range = Range1d(start=-2.0, end=2.0)
        arplot.y_range = Range1d(start=-2.0, end=2.0)
        glyph = arplot.select({'type' : GlyphRenderer})[0].glyph
        #extract the original data source because it was replaced?!
        source = arplot.select({'type' : ServerDataSource})[0]
        
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
        #hack - because recent changes broke AR
        push()
        data = {'plot_state' : plot_state}
        url = "/render/%s/%s/%s" % (curdoc().docid, source._id, glyph._id)
        result = self.client.post(
            url,
            data=json.dumps(data),
            headers={'content-type' : 'application/json'}
        )
        assert result.status_code == 200
        data = json.loads(result.data.decode('utf-8'))
        image = np.array(data['data']['image'][0])

        #I guess it's data dependent so the shape changes....
        assert image.shape[0] >200
        assert image.shape[1] >200

    def test_line1d_downsample(self):
        reset_output()
        sess = TestSession(client=app.test_client())
        output_server('ar', session=sess)
        source = ServerDataSource(expr={'op': 'Field', 'args': [':leaf', 'aapl']})
        source.transform = dict(direction='x',
                                     resample='line1d',
                                     method='minmax')
        # hacky - we have to specify range, otherwise code doesn't know how to serialize
        # data ranges
        p = figure(x_range=Range1d(start=0, end=0), y_range=Range1d(start=0, end=0))
        plot = p.line('date', 'close',
                      x_axis_type = "datetime",
                      color='#A6CEE3', tools="pan,wheel_zoom,box_zoom,reset,previewsave",
                      source=source,
                      legend='AAPL')
        push()
        screen_x_range = Range1d(start=0, end=200)
        screen_y_range = Range1d(start=0, end=200)
        plot_state = {'screen_x' : curdoc().dump(screen_x_range)[0]['attributes'],
                      'screen_y' : curdoc().dump(screen_y_range)[0]['attributes'],
                      'data_x' : curdoc().dump(plot.x_range)[0]['attributes'],
                      'data_y' : curdoc().dump(plot.y_range)[0]['attributes']}
        data = {'plot_state' : plot_state, 'auto_bounds' : 'True'}
        glyph = plot.select({'type' : GlyphRenderer})[0].glyph
        url = "/render/%s/%s/%s" % (curdoc().docid, source._id, glyph._id)
        result = self.client.post(
            url,
            data=json.dumps(data),
            headers={'content-type' : 'application/json'}
        )
        assert result.status_code == 200
        data = json.loads(result.data.decode('utf-8'))
        #2 x plot size (200)
        assert len(data['data']['close']) == 400

    def test_heatmap_downsample(self):
        reset_output()
        sess = TestSession(client=app.test_client())
        output_server('ar', session=sess)
        source = ServerDataSource(expr={'op': 'Field', 'args': [':leaf', 'array']})
        source.transform = dict(resample='heatmap',
                                global_x_range=[0, 10],
                                global_y_range=[0, 10],
                                global_offset_x=0,
                                global_offset_y=0,
                                type="ndarray",
        )
        # hacky - we have to specify range, otherwise code doesn't know how to serialize
        # data ranges
        p = figure(x_range=Range1d(start=0, end=10), y_range=Range1d(start=0, end=10))
        plot = p.image(image="image",
                       x='x',
                       y='y',
                       dw='dw',
                       dh='dh',
                       source=source,
        )
        push()
        screen_x_range = Range1d(start=0, end=200)
        screen_y_range = Range1d(start=0, end=200)

        plot_state = {'screen_x' : curdoc().dump(screen_x_range)[0]['attributes'],
                      'screen_y' : curdoc().dump(screen_y_range)[0]['attributes'],
                      'data_x' : curdoc().dump(plot.x_range)[0]['attributes'],
                      'data_y' : curdoc().dump(plot.y_range)[0]['attributes']}

        data = {'plot_state' : plot_state}
        glyph = plot.select({'type' : GlyphRenderer})[0].glyph
        url = "/render/%s/%s/%s" % (curdoc().docid, source._id, glyph._id)

        result = self.client.post(
            url,
            data=json.dumps(data),
            headers={'content-type' : 'application/json'}
        )
        assert result.status_code == 200
        data = json.loads(result.data.decode('utf-8'))
        #2 x plot size (200)
        assert np.array(data['data']['image'][0]).shape == (200,200)
