import unittest

from mock import patch, Mock
from six import add_metaclass
from six.moves import xrange
import copy

def large_plot(n):
    from bokeh.objects import (Plot, PlotContext, LinearAxis, Grid, Glyph,
        ColumnDataSource, DataRange1d, PanTool, WheelZoomTool, BoxZoomTool,
        BoxSelectTool, BoxSelectionOverlay, ResizeTool, PreviewSaveTool,
        ResetTool)
    from bokeh.glyphs import Line

    context = PlotContext()
    objects = set([context])

    for i in xrange(n):
        source = ColumnDataSource(data=dict(x=[0, i + 1], y=[0, i + 1]))
        xdr = DataRange1d(sources=[source.columns("x")])
        ydr = DataRange1d(sources=[source.columns("y")])
        plot = Plot(x_range=xdr, y_range=ydr, data_sources=[source])
        xaxis = LinearAxis(plot=plot)
        yaxis = LinearAxis(plot=plot)
        xgrid = Grid(plot=plot, dimension=0)
        ygrid = Grid(plot=plot, dimension=1)
        tickers = [xaxis.ticker, xaxis.formatter, yaxis.ticker, yaxis.formatter]
        renderer = Glyph(data_source=source, xdata_range=xdr, ydata_range=ydr, glyph=Line(x='x', y='y'))
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
        objects |= set([source, xdr, ydr, plot, xaxis, yaxis, xgrid, ygrid, renderer] + tickers + tools)

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


class Test_UseSession(unittest.TestCase):

    def setUp(self):
        from bokeh.plot_object import usesession
        self.usesession = usesession

    def test_transparent(self):
        class test_class():
            session = None

            @self.usesession
            def test_func(self, session=None):
                return session
        tc = test_class()
        self.assertEqual(tc.test_func.__name__, 'test_func')

    def test_withkw(self):
        class test_class():
            session = None

            @self.usesession
            def test_func(self, session=None):
                return session
        tc = test_class()
        self.assertEqual(tc.test_func(session='not_default'), 'not_default')

    def test_withoutkw(self):
        class test_class():
            session = None

            @self.usesession
            def test_func(self, session=None):
                return session
        tc = test_class()
        self.assertRaises(RuntimeError, tc.test_func)
        tc.session = 'something'
        self.assertEqual(tc.test_func(), 'something')

    def test_without_session_attr(self):
        class test_class():

            @self.usesession
            def test_func(self, session=None):
                return session
        tc = test_class()
        self.assertEqual(tc.test_func(session='not_default'), 'not_default')


class TestJsonapply(unittest.TestCase):

    def test_jsonapply(self):
        from bokeh.plot_object import json_apply

        def check_func(frag):
            if frag == 'goal':
                return True

        def func(frag):
            return frag + 'ed'

        result = json_apply('goal', check_func, func)
        self.assertEqual(result, 'goaled')
        result = json_apply([[['goal', 'junk'], 'junk', 'junk']], check_func, func)
        self.assertEqual(result, [[['goaled', 'junk'], 'junk', 'junk']])
        result = json_apply({'1': 'goal', 1.5: {'2': 'goal', '3': 'junk'}}, check_func, func)
        self.assertEqual(result, {'1': 'goaled', 1.5: {'2': 'goaled', '3': 'junk'}})


class TestResolveJson(unittest.TestCase):

    @patch('bokeh.plot_object.logging')
    def test_resolve_json(self, mock_logging):
        from bokeh.plot_object import resolve_json

        models = {'foo': 'success', 'otherfoo': 'othersuccess'}
        fragment = [{'id': 'foo', 'type': 'atype'}, {'id': 'foo', 'type': 'atype'}, {'id': 'otherfoo', 'type': 'othertype'}]
        self.assertEqual(resolve_json(fragment, models), ['success', 'success', 'othersuccess'])
        fragment.append({'id': 'notfoo', 'type': 'badtype'})
        self.assertEqual(resolve_json(fragment, models), ['success', 'success', 'othersuccess', None])
        self.assertTrue(mock_logging.error.called)
        self.assertTrue('badtype' in repr(mock_logging.error.call_args))


class TestCollectPlotObjects(unittest.TestCase):

    def test_references(self):
        from bokeh.plot_object import PlotObject
        pobject1 = PlotObject()
        pobject2 = PlotObject()
        pobject3 = PlotObject()
        pobject4 = PlotObject()
        pobject1.pobject2 = pobject2
        pobject1.pobject3 = pobject3
        pobject3.pobject4 = pobject4
        pobject1.properties_with_refs = Mock(return_value=['pobject2', 'pobject3'])
        pobject3.properties_with_refs = Mock(return_value=['pobject4'])
        resultset = set(pobject1.references())
        expectedset = set([pobject1, pobject2, pobject3, pobject4])
        self.assertEqual(resultset, expectedset)

    def test_references_large(self):
        context, objects = large_plot(500)
        self.assertEqual(set(context.references()), objects)

class TestPlotObject(unittest.TestCase):

    def setUp(self):
        from bokeh.objects import PlotObject
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

    def test_get_ref(self):
        testObject = self.pObjectClass(id='test_id')
        self.assertEqual({'type': 'PlotObject', 'id': 'test_id'}, testObject.get_ref())

    def test_load_json(self):
        from bokeh.plot_object import PlotObject

        cls = PlotObject.get_class("Plot")
        obj = cls.load_json({'id': 'test_id', 'min_border': 100})
        self.assertEqual(obj._id, 'test_id')
        self.assertEqual(obj.title, '')
        self.assertEqual(obj.min_border, 100)

        obj.load_json({'id': 'test_id', 'title': 'xyz'}, instance=obj)
        self.assertEqual(obj._id, 'test_id')
        self.assertEqual(obj.title, 'xyz')
        self.assertEqual(obj.min_border, 100)

    def test_references_by_ref_by_value(self):
        from bokeh.objects import PlotObject
        from bokeh.properties import HasProps, Instance, Int

        class T(PlotObject):
            t = Int(0)

        class Y(PlotObject):
            t1 = Instance(T)

        class Z1(HasProps):
            t2 = Instance(T)

        class Z2(PlotObject):
            t2 = Instance(T)

        class X1(PlotObject):
            y = Instance(Y)
            z1 = Instance(Z1)

        class X2(PlotObject):
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
        from bokeh.objects import PlotObject
        from bokeh.properties import Int, String, Instance, List, Tuple, Dict

        # XXX: can't use Y, because of:
        #
        # Warning: Duplicate __view_model__ declaration of 'Y' for class Y.
        #          Previous definition: <class 'bokeh.tests.test_objects.Y'>

        class U(PlotObject):
            a = Int

        class V(PlotObject):
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
