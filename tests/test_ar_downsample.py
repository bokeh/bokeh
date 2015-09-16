from __future__ import absolute_import, print_function

import unittest
import types

import abstract_rendering.numeric as numeric
import abstract_rendering.categories as categories
import abstract_rendering.contour as contour
import abstract_rendering.general as general
import abstract_rendering.glyphset as glyphset
import abstract_rendering.core as ar
import abstract_rendering.numpyglyphs as npg
import abstract_rendering.infos as infos

from ..server.tests import test_utils
from ..server.app import app
from ..session import TestSession
from ..plotting import (reset_output, output_server, curdoc, figure)
from ..transforms import ar_downsample as ar_downsample
from ..models.sources import ServerDataSource
from ..models.renderers import GlyphRenderer
from ..models.ranges import Range1d

def sort_init_first(_, a, b):
    if "_init_" in a:
        return -1
    elif "_init_" in b:
        return 1
    elif a > b:
        return -1
    elif a < b:
        return 1
    else:
        return 0

unittest.TestLoader.sortTestMethodsUsing = sort_init_first

class _SourceShim(object):
    defVal = 'value'

    def __init__(self, t, *k):
        self.transform = {'shader': t}
        self.data = dict(zip(k, [self.defVal]*len(k)))


class _FailsProxyReify(object):
    """Tests the test machinery.  Intentionally fails reification
       to check that the test suite will register exceptions as failures."""

    def reify(self):
        raise NotImplementedError



from unittest import skip

@skip
class Test_AR(test_utils.FlaskClientTestCase):
    #TODO - separate server from non-server tests
    def test_replot_remove(self):
        ar_downsample._loadAR()
        reset_output()
        sess = TestSession(client=app.test_client())
        output_server('Census', session=sess)
        source = ServerDataSource(
            expr={'op': 'Field', 'args': [':leaf', 'bivariate']}
        )
        plot = figure()
        plot.square('A', 'B', source=source)
        ar_downsample.replot(plot, remove_original=False)

        self.assertTrue(plot in curdoc().context.children, "Not retained")
        ar_downsample.replot(plot, remove_original=True)
        self.assertTrue(plot not in curdoc().context.children, "Not removed")

        try:
            ar_downsample.replot(plot, remove_original=True)
        except:
            self.assertTrue(False, "Error reploting plot not in curdoc")

    def test_replot_property_transfer(self):
        ar_downsample._loadAR()
        sess = TestSession(client=app.test_client())
        output_server('Census', session=sess)
        source = ServerDataSource(
            expr={'op': 'Field', 'args': [':leaf', 'bivariate']}
        )

        plot_width = 612
        plot_height = 408
        plot_title = "Test title"

        plot = figure(plot_width=plot_width, plot_height=plot_height, title=plot_title)
        plot.square('A', 'B', source=source)
        ar_plot = ar_downsample.replot(plot)

        self.assertEquals(ar_plot.plot_width, plot_width, "Plot width not transfered")
        self.assertEquals(ar_plot.plot_height, plot_height, "Plot height not transfered")
        self.assertEquals(ar_plot.title, plot_title, "Plot title not transfered")

        plot_width = 612
        plot_height = 408
        plot_title = "Test title"
        ar_plot = ar_downsample.replot(plot, title=plot_title, plot_width=plot_width, plot_height=plot_height)
        self.assertEquals(ar_plot.plot_width, plot_width, "Plot width override failed")
        self.assertEquals(ar_plot.plot_height, plot_height, "Plot height override failed")
        self.assertEquals(ar_plot.title, plot_title, "Plot title override failed")

    def _glyphspec(self, plot):
        rend = ar_downsample._renderer(plot)
        spec = rend.glyph.vm_serialize()
        spec['type'] = rend.glyph.__view_model__
        return spec

    def test_replot_result_type(self):
        ar_downsample._loadAR()
        sess = TestSession(client=app.test_client())
        output_server('Census', session=sess)
        source = ServerDataSource(
            expr={'op': 'Field', 'args': [':leaf', 'bivariate']}
        )
        plot = figure()
        plot.square('A', 'B', source=source)

        expected = {"image": "Image", "image_rgb": "ImageRGBA", "multi_line": "MultiLine"}

        shaders = dict()

        for name in dir(ar_downsample):
            item = getattr(ar_downsample, name)
            if isinstance(item, ar_downsample.Shader):
                shaders[item] = item.out

        for shader_class in shaders:
            shader = shader_class()
            rslt = ar_downsample.replot(plot, shader=shader)
            self.assertEquals(expected[shader.out], self._glyphspec(rslt)['type'],
                              "Error with {0}. Expected {1}, recieved {2}"
                              .format(str(shader_class), expected[shader.out], self._glyphspec(rslt)))

    def test_source(self):
        ar_downsample._loadAR()
        sess = TestSession(client=app.test_client())
        output_server('Census', session=sess)
        source = ServerDataSource(
            expr={'op': 'Field', 'args': [':leaf', 'bivariate']}
        )

        plot = figure()
        plot.square('A', 'B', source=source)

        agg = ar_downsample.CountCategories()
        info = ar_downsample.Const(val=1)
        shader = ar_downsample.InterpolateColor()

        new_source = ar_downsample.source(plot, agg=agg, info=info, shader=shader)
        self.assertIsNotNone(new_source.transform)
        trans = new_source.transform

        self.assertEquals(trans['resample'], 'abstract rendering')
        self.assertEquals(trans['agg'], agg)
        self.assertEquals(trans['info'], info)
        self.assertEquals(trans['shader'], shader)
        self.assertEquals(trans['glyphspec'],
                          plot.select({'type' : GlyphRenderer})[0].glyph)
        self.assertEquals(trans['points'], False)
    def test_init_AR(self):
        # simulate un-loading AR.. this test fails if ar is imported elsewhere before
        # this test is run
        if 'general' in ar_downsample.__dict__:
            ar_downsample.__dict__.pop('general')
        self.assertRaises(NameError, ar_downsample.Id().reify)
        ar_downsample._loadAR()
        self.assertIsNotNone(ar_downsample.Id().reify())
    def test_span(self):
        self.assertEquals(0, ar_downsample._span(Range1d(start=0, end=0)))
        self.assertEquals(2, ar_downsample._span(Range1d(start=0, end=2)))
        self.assertEquals(2, ar_downsample._span(Range1d(start=-2, end=0)))
        self.assertEquals(4, ar_downsample._span(Range1d(start=-2, end=2)))
        self.assertEquals(4, ar_downsample._span(Range1d(start=2, end=-2)))
        self.assertEquals(3, ar_downsample._span(Range1d(start=None, end=3)))
        self.assertEquals(3, ar_downsample._span(Range1d(start=3, end=None)))
        self.assertEquals(0, ar_downsample._span(Range1d(start=None, end=None)))
    def test_datacolumn(self):
        self.assertEquals('state', ar_downsample._datacolumn({'type': {'field': 'state'}}))
        self.assertEquals('state', ar_downsample._datacolumn({'fill_color': {'field': 'state'}}))
        self.assertEquals('state', ar_downsample._datacolumn({'fill_alpha': {'field': 'state'}}))
        self.assertEquals('state', ar_downsample._datacolumn({'line_color': {'field': 'state'}}))
        self.assertEquals('state', ar_downsample._datacolumn({'line_alpha': {'field': 'state'}}))
        self.assertEquals('state1', ar_downsample._datacolumn({'type': {'field': 'state1'}, 'fill_color': {'field': 'state2'}}))
        self.assertEquals('state2', ar_downsample._datacolumn({'fill_alpha': {'field': 'state1'}, 'fill_color': {'field': 'state2'}}))
        self.assertEquals('state1', ar_downsample._datacolumn({'fill_alpha': {'field': 'state1'}, 'line_color': {'field': 'state2'}}))
        self.assertEquals('state2', ar_downsample._datacolumn({'line_alpha': {'field': 'state1'}, 'line_color': {'field': 'state2'}}))
        self.assertEquals('state1', ar_downsample._datacolumn({'line_alpha': {'field': 'state1'}, 'other': {'field': 'state2'}}))

    def test_shaper_create(self):
        ar_downsample._loadAR()

        glyphspec = {'type': 'Square', 'size': {'value': 3}, 'radius': {'value': 3}}
        self.assertIsInstance(ar_downsample._shaper(glyphspec, False), glyphset.ToRect)
        self.assertIsInstance(ar_downsample._shaper(glyphspec, True), glyphset.ToPoint)
        self.assertIsInstance(ar_downsample._shaper(glyphspec, True), glyphset.ToPoint)
    def test_shaper_fail(self):
        ar_downsample._loadAR()
        with self.assertRaises(ValueError):
            ar_downsample._shaper({'type': 'blah', 'size': {'value': 3}}, False)

    def test_make_glyphset(self):
        glyphspec = {'type': 'Square', 'size': {'value': 1}}
        transform = {'points': True}
        glyphs = ar_downsample.make_glyphset([1], [1], [1], glyphspec, transform)
        self.assertIsInstance(glyphs, npg.Glyphset, "Point-optimized numpy version")

        transform = {'points': False}
        glyphs = ar_downsample.make_glyphset([1], [1], [1], glyphspec, transform)
        self.assertIsInstance(glyphs, glyphset.Glyphset, "Generic glyphset")
    # -------------- Mapping tests ----------
    def test_Image(self):
        source = _SourceShim(ar_downsample.Interpolate)
        result = ar_downsample.mapping(source)
        expected = {'x_range': Range1d(start=0, end=0),
                    'y_range': Range1d(start=0, end=0)}

        self.assertEquals(len(expected), len(result))
        self.assertEquals(sorted(expected.keys()), sorted(result.keys()))

        source = _SourceShim(ar_downsample.Interpolate, "A", "B", "C")
        result = ar_downsample.mapping(source)
        expected['A'] = source.defVal
        expected['B'] = source.defVal
        expected['C'] = source.defVal
        self.assertEquals(sorted(expected.keys()), sorted(result.keys()))
    def test_ImageRGB(self):
        source = _SourceShim(ar_downsample.InterpolateColor)
        result = ar_downsample.mapping(source)
        expected = {'x_range': Range1d(start=0, end=0),
                    'y_range': Range1d(start=0, end=0)}

        self.assertEquals(len(expected), len(result))
        self.assertEquals(sorted(expected.keys()), sorted(result.keys()))

        source = _SourceShim(ar_downsample.InterpolateColor, "A", "B", "C")
        result = ar_downsample.mapping(source)
        expected['A'] = source.defVal
        expected['B'] = source.defVal
        expected['C'] = source.defVal
        self.assertEquals(sorted(expected.keys()), sorted(result.keys()))
    def test_PolyLine(self):
        source = _SourceShim(ar_downsample.Contour)
        result = ar_downsample.mapping(source)
        expected = {'line_color': []}

        self.assertEquals(len(expected), len(result))
        self.assertEquals(sorted(expected.keys()), sorted(result.keys()))

        source = _SourceShim(ar_downsample.Contour, "A", "B", "C")
        result = ar_downsample.mapping(source)
        expected['A'] = source.defVal
        expected['B'] = source.defVal
        expected['C'] = source.defVal
        self.assertEquals(sorted(expected.keys()), sorted(result.keys()))
    # -------------------- Proxy object tests --------------
    def _reify_tester(self, proxy, reifyBase, kwargs):
        ar_downsample._loadAR()
        op = proxy.reify(**kwargs)
        self.assertIsNotNone(op, "Empty reification on %s" % type(proxy))
        self.assertIsInstance(op, reifyBase, "Reify to unexpected type (%s) for %s" % (type(op), type(proxy)))

    def _shader_tester(self, proxy, reify_base, kwargs):
        self.assertIn(proxy.out, ["image", "image_rgb", "multi_line"],
                      "Unknown output type.")

        self.assertIsNotNone(proxy.reformat(None),
                             "No reformat provided")

        op2 = proxy + ar_downsample.Id()
        self.assertIsNotNone(op2)
        self.assertIsInstance(op2, ar_downsample.Seq, "Unexpected result from sequencing")

        self._reify_tester(proxy, reify_base, kwargs)

    def test_infos(self):
        configs = [(ar_downsample.AutoEncode(), infos.AutoEncode, {}),
                   (ar_downsample.Const(val=3), types.FunctionType, {}),
                   #(ar_downsample.Encode(cats=[10, 20, 30]), types.FunctionType, {}) TODO: Error in Python 3, restore in AR 0.6
                   ]

        for (proxy, target, kwargs) in configs:
            self._reify_tester(proxy, target, kwargs)

    def test_aggregators(self):
        aggregators = [(ar_downsample.Sum(), numeric.Sum, {}),
                       (ar_downsample.Count(), numeric.Count, {}),
                       (ar_downsample.CountCategories(), categories.CountCategories, {})
                      ]

        for (agg, target, kwargs) in aggregators:
            self._reify_tester(agg, target, kwargs)

    def test_reify_tester(self):
        self.assertRaises(NotImplementedError, self._reify_tester, *(_FailsProxyReify(), object, {}))

    def test_shaders(self):
        shaders = [(ar_downsample.BinarySegment(low=1, high=2, divider=10), numeric.BinarySegment, {}),
                   (ar_downsample.Contour(), contour.Contour, {}),
                   (ar_downsample.Cuberoot(), numeric.Cuberoot, {}),
                   (ar_downsample.HDAlpha(), categories.HDAlpha, {}),
                   (ar_downsample.Id(), general.Id, {}),
                   (ar_downsample.Interpolate(low=0, high=10), numeric.Interpolate, {}),
                   (ar_downsample.InterpolateColor(low=(10, 10, 10), high=(200, 200, 200), reserve=(0, 0, 0), empty=-1), numeric.InterpolateColors, {}),
                   (ar_downsample.Log(), npg.Log10, {}),
                   (ar_downsample.NonZeros(), categories.NonZeros, {}),
                   (ar_downsample.Ratio(), categories.Ratio, {}),
                   (ar_downsample.Seq(first=ar_downsample.Id(), second=ar_downsample.Sqrt()), ar.Seq, {}),
                   (ar_downsample.Spread(factor=2), npg.Spread, {}),
                   (ar_downsample.Sqrt(), numeric.Sqrt, {}),
                   (ar_downsample.ToCounts(), categories.ToCounts, {}),
                   ]

        for (shader, target, kwargs) in shaders:
            self._shader_tester(shader, target, kwargs)
    # -------------------- Recipies ------------
    def _find_source(self, plot):
        return [r for r in plot.renderers if (isinstance(r, GlyphRenderer)
                    and hasattr(r, "data_source")
                    and r.data_source is not None)][0].data_source

    def test_contour_recipe(self):
        ar_downsample._loadAR()
        reset_output()
        sess = TestSession(client=app.test_client())
        output_server('Census', session=sess)
        source = ServerDataSource(
            expr={'op': 'Field', 'args': [':leaf', 'bivariate']}
        )
        plot = figure(plot_width=600,
                      plot_height=400,
                      title="Test Title")
        plot.square('A', 'B', source=source)

        plot2 = ar_downsample.contours(plot, title="Contour")
        source2 = self._find_source(plot2)

        self.assertEquals("Contour", plot2.title)
        self.assertEquals(type(source2), ServerDataSource)

        transform = source2.transform
        self.assertEquals(type(transform['info']), ar_downsample.Const)
        self.assertEquals(type(transform['agg']), ar_downsample.Count)
        self.assertEquals(type(transform['shader']), ar_downsample.Seq)
        self.assertEquals(transform['shader'].out, "multi_line")

    def test_heatmap_recipe(self):
        ar_downsample._loadAR()
        reset_output()
        sess = TestSession(client=app.test_client())
        output_server('Census', session=sess)
        source = ServerDataSource(
            expr={'op': 'Field', 'args': [':leaf', 'bivariate']}
        )
        plot = figure(plot_width=600,
                      plot_height=400,
                      title="Test Title")
        plot.square('A', 'B', source=source)

        plot2 = ar_downsample.heatmap(plot, palette="Reds9", reserve_val=0, points=True, client_color=True, title="Test Title 2")
        source2 = self._find_source(plot2)

        self.assertEquals("Test Title 2", plot2.title)
        self.assertEquals(type(source2), ServerDataSource)

        transform = source2.transform
        self.assertEquals(type(transform['info']), ar_downsample.Const)
        self.assertEquals(type(transform['agg']), ar_downsample.Count)
        self.assertEquals(type(transform['shader']), ar_downsample.Seq)
        self.assertEquals(transform['shader'].out, "image")
