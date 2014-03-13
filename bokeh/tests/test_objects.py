import unittest
from six import add_metaclass
from mock import patch, Mock, MagicMock

def large_plot(n):
    from bokeh.objects import (Plot, PlotContext, LinearAxis, Grid, Glyph,
        ColumnDataSource, DataRange1d, PanTool, WheelZoomTool, BoxZoomTool,
        BoxSelectTool, BoxSelectionOverlay, ResizeTool, PreviewSaveTool,
        ResetTool)
    from bokeh.glyphs import Line

    context = PlotContext()
    objects = set([context])

    for i in xrange(n):
        source = ColumnDataSource(data=dict(x=[0, i+1], y=[0, i+1]))
        xdr = DataRange1d(sources=[source.columns("x")])
        ydr = DataRange1d(sources=[source.columns("y")])
        plot = Plot(x_range=xdr, y_range=ydr, data_sources=[source])
        xaxis = LinearAxis(plot=plot, dimension=0)
        yaxis = LinearAxis(plot=plot, dimension=1)
        xgrid = Grid(plot=plot, dimension=0)
        ygrid = Grid(plot=plot, dimension=1)
        renderer = Glyph(data_source=source, xdata_range=xdr, ydata_range=ydr, glyph=Line(x='x', y='y'))
        plot.renderers.append(renderer)
        pan = PanTool(plot=plot, dataranges=[xdr, ydr])
        wheel_zoom = WheelZoomTool(plot=plot, dataranges=[xdr, ydr])
        box_zoom = BoxZoomTool(plot=plot)
        box_select = BoxSelectTool(plot=plot)
        box_selection = BoxSelectionOverlay(tool=box_select)
        resize = ResizeTool(plot=plot)
        previewsave = PreviewSaveTool(plot=plot, dataranges=[xdr, ydr])
        reset = ResetTool(plot=plot)
        tools = [pan, wheel_zoom, box_zoom, box_select, box_selection, resize, previewsave, reset]
        plot.tools.append(tools)
        context.children.append(plot)
        objects |= set([source, xdr, ydr, plot, xaxis, yaxis, xgrid, ygrid, renderer] + tools)

    return context, objects

class TestViewable(unittest.TestCase):

    def setUp(self):
        from bokeh.objects import Viewable
        self.viewable = Viewable

    def tearDown(self):
        self.viewable.model_class_reverse_map = {}

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
        from bokeh.objects import usesession
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
        from bokeh.objects import json_apply

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

    @patch('bokeh.objects.logging')
    def test_resolve_json(self, mock_logging):
        from bokeh.objects import resolve_json

        models = {'foo': 'success', 'otherfoo': 'othersuccess'}
        fragment = [{'id': 'foo', 'type': 'atype'}, {'id': 'foo', 'type': 'atype'}, {'id': 'otherfoo', 'type': 'othertype'}]
        self.assertEqual(resolve_json(fragment, models), ['success', 'success', 'othersuccess'])
        fragment.append({'id': 'notfoo', 'type': 'badtype'})
        self.assertEqual(resolve_json(fragment, models), ['success', 'success', 'othersuccess', None])
        self.assertTrue(mock_logging.error.called)
        self.assertTrue('badtype' in repr(mock_logging.error.call_args))\



class TestTraversePlotObjects(unittest.TestCase):

    def test_traverse(self):
        from bokeh.objects import PlotObject, traverse_plot_object
        pobject = PlotObject()

        pobject.properties_with_refs = Mock(return_value=['test1', 'test2'])
        pobject.test1 = PlotObject()
        pobject.test2 = 2
        pobject.test3 = PlotObject()
        result = traverse_plot_object(pobject)
        self.assertTrue(pobject.test1 in result)
        self.assertTrue(len(result) == 1)


class TestRecursivleyTraversePlotObjects(unittest.TestCase):

    def test_recursive_traverse(self):
        from bokeh.objects import PlotObject, recursively_traverse_plot_object
        pobject1 = PlotObject()
        pobject2 = PlotObject()
        pobject3 = PlotObject()
        pobject4 = PlotObject()
        pobject1.pobject2 = pobject2
        pobject1.pobject3 = pobject3
        pobject3.pobject4 = pobject4
        pobject1.properties_with_refs = Mock(return_value=['pobject2', 'pobject3'])
        pobject3.properties_with_refs = Mock(return_value=['pobject4'])
        resultset = recursively_traverse_plot_object(pobject1)
        expectedset = set([pobject1, pobject2, pobject3, pobject4])
        self.assertEqual(resultset, expectedset)

    def test_recursive_traverse_large(self):
        from bokeh.objects import recursively_traverse_plot_object
        from bokeh.session.session import Session

        context, objects = large_plot(500)

        objects1 = recursively_traverse_plot_object(context)
        objects2 = set(Session._collect_objs(context))

        self.assertEqual(objects1, objects)
        self.assertEqual(objects1, objects)

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
        created_obj = self.pObjectClass.load_json({'id': 'test_id', 'other_attr': '1'})
        self.assertEqual(created_obj.other_attr, '1')
        self.assertEqual(created_obj._id, 'test_id')
        created_obj.load_json({'id': 'test_id', 'other_other_attr': '2', 'other_attr': '5'}, instance=created_obj)
        self.assertEqual(created_obj.other_other_attr, '2')
        self.assertEqual(created_obj.other_attr, '5')

    def test_finalize(self):
        testobj = self.pObjectClass()
        testobj._ref_props = {'id': 'foo', 'type': 'atype'}
        models = {'foo': {'test': 5}}
        testobj.finalize(models)
        self.assertEqual(testobj.test, 5)

if __name__ == "__main__":
    unittest.main()
