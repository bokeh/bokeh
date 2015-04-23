from __future__ import absolute_import
import unittest

from mock import Mock
from six import add_metaclass
from six.moves import xrange
import copy

def large_plot(n):
    from bokeh.models import (Plot, PlotContext, LinearAxis, Grid, GlyphRenderer,
        ColumnDataSource, DataRange1d, PanTool, WheelZoomTool, BoxZoomTool,
        BoxSelectTool, BoxSelectionOverlay, ResizeTool, PreviewSaveTool,
        ResetTool)
    from bokeh.models.glyphs import Line

    context = PlotContext()
    objects = set([context])

    for i in xrange(n):
        source = ColumnDataSource(data=dict(x=[0, i + 1], y=[0, i + 1]))
        xdr = DataRange1d()
        ydr = DataRange1d()
        plot = Plot(x_range=xdr, y_range=ydr)
        xaxis = LinearAxis(plot=plot)
        yaxis = LinearAxis(plot=plot)
        xgrid = Grid(plot=plot, dimension=0)
        ygrid = Grid(plot=plot, dimension=1)
        tickers = [xaxis.ticker, xaxis.formatter, yaxis.ticker, yaxis.formatter]
        glyph = Line(x='x', y='y')
        renderer = GlyphRenderer(data_source=source, glyph=glyph)
        plot.renderers.append(renderer)
        pan = PanTool(plot=plot)
        wheel_zoom = WheelZoomTool(plot=plot)
        box_zoom = BoxZoomTool(plot=plot)
        box_select = BoxSelectTool(plot=plot)
        box_selection = BoxSelectionOverlay(tool=box_select)
        resize = ResizeTool(plot=plot)
        previewsave = PreviewSaveTool(plot=plot)
        reset = ResetTool(plot=plot)
        tools = [pan, wheel_zoom, box_zoom, box_select, box_selection, resize, previewsave, reset]
        plot.tools.append(tools)
        context.children.append(plot)
        objects |= set([source, xdr, ydr, plot, xaxis, yaxis, xgrid, ygrid, renderer, glyph, plot.tool_events] + tickers + tools)

    return context, objects

class TestViewable(unittest.TestCase):

    def setUp(self):
        from bokeh.plot_object import Viewable
        self.viewable = Viewable
        self.old_map = copy.copy(self.viewable.model_class_reverse_map)

    def tearDown(self):
        self.viewable.model_class_reverse_map = self.old_map

    def mkclass(self):
        @add_metaclass(self.viewable)
        class Test_Class():
            foo = 1
        return Test_Class

    def test_metaclassing(self):
        tclass = self.mkclass()
        self.assertTrue(hasattr(tclass, '__view_model__'))
        self.assertRaises(Warning, self.mkclass)

    def test_get_class(self):
        self.mkclass()
        tclass = self.viewable.get_class('Test_Class')
        self.assertTrue(hasattr(tclass, 'foo'))
        self.assertRaises(KeyError, self.viewable.get_class, 'Imaginary_Class')

class TestCollectPlotObjects(unittest.TestCase):

    def test_references_large(self):
        context, objects = large_plot(500)
        self.assertEqual(set(context.references()), objects)

class TestPlotObject(unittest.TestCase):

    def setUp(self):
        from bokeh.models import PlotObject
        self.pObjectClass = PlotObject

    def test_init(self):
        oldmethod = self.pObjectClass.setup_events
        self.pObjectClass.setup_events = Mock()
        testObject = self.pObjectClass(id='test_id', _block_events=True)
        self.assertFalse(testObject.setup_events.called)
        self.assertEqual(testObject._id, 'test_id')

        testObject2 = self.pObjectClass()
        self.assertTrue(testObject2.setup_events.called)
        self.assertIsNot(testObject2._id, None)

        self.pObjectClass.setup_events = oldmethod

    def test_ref(self):
        testObject = self.pObjectClass(id='test_id')
        self.assertEqual({'type': 'PlotObject', 'id': 'test_id'}, testObject.ref)

    def test_load_json(self):
        cls = self.pObjectClass.get_class("Plot")
        obj = cls.load_json({'id': 'test_id', 'min_border': 100})
        self.assertEqual(obj._id, 'test_id')
        self.assertEqual(obj.title, '')
        self.assertEqual(obj.min_border, 100)

        obj.load_json({'id': 'test_id', 'title': 'xyz'}, instance=obj)
        self.assertEqual(obj._id, 'test_id')
        self.assertEqual(obj.title, 'xyz')
        self.assertEqual(obj.min_border, 100)

    def test_references_by_ref_by_value(self):
        from bokeh.properties import HasProps, Instance, Int

        class T(self.pObjectClass):
            t = Int(0)

        class Y(self.pObjectClass):
            t1 = Instance(T)

        class Z1(HasProps):
            t2 = Instance(T)

        class Z2(self.pObjectClass):
            t2 = Instance(T)

        class X1(self.pObjectClass):
            y = Instance(Y)
            z1 = Instance(Z1)

        class X2(self.pObjectClass):
            y = Instance(Y)
            z2 = Instance(Z2)

        t1, t2 = T(t=1), T(t=2)
        y = Y(t1=t1)
        z1, z2 = Z1(t2=t2), Z2(t2=t2)

        x1 = X1(y=y, z1=z1)
        x2 = X2(y=y, z2=z2)

        self.assertEqual(x1.references(), {t1, y, t2,     x1})
        self.assertEqual(x2.references(), {t1, y, t2, z2, x2})

    def test_references_in_containers(self):
        from bokeh.properties import Int, String, Instance, List, Tuple, Dict

        # XXX: can't use Y, because of:
        #
        # Warning: Duplicate __view_model__ declaration of 'Y' for class Y.
        #          Previous definition: <class 'bokeh.tests.test_objects.Y'>

        class U(self.pObjectClass):
            a = Int

        class V(self.pObjectClass):
            u1 = Instance(U)
            u2 = List(Instance(U))
            u3 = Tuple(Int, Instance(U))
            u4 = Dict(String, Instance(U))
            u5 = Dict(String, List(Instance(U)))

        u1, u2, u3, u4, u5 = U(a=1), U(a=2), U(a=3), U(a=4), U(a=5)
        v = V(u1=u1, u2=[u2], u3=(3, u3), u4={"4": u4}, u5={"5": [u5]})

        self.assertEqual(v.references(), set([v, u1, u2, u3, u4, u5]))

if __name__ == "__main__":
    unittest.main()
