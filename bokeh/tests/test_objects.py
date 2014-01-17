import unittest
from six import add_metaclass

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
		self.assertTrue(hasattr(tclass,'__view_model__'))
		self.assertRaises(Warning,self.mkclass)

	def test_get_class(self):
		self.mkclass()
		tclass = self.viewable.get_class('Test_Class')
		self.assertTrue(hasattr(tclass,'foo'))
		self.assertRaises(KeyError,self.viewable.get_class,'Imaginary_Class')

class Test_UseSession(unittest.TestCase):

	def setUp(self):
		from bokeh.objects import usesession
		self.usesession = usesession

	def test_transparent(self):
		class test_class():
			session = None
			@self.usesession
			def test_func(self,session=None):
				return session
		tc = test_class()
		self.assertEqual(tc.test_func.__name__,'test_func')

	def test_withkw(self):
		class test_class():
			session = None
			@self.usesession
			def test_func(self,session=None):
				return session
		tc = test_class()
		self.assertEqual(tc.test_func(session='not_default'),'not_default')

	def test_withoutkw(self):
		class test_class():
			session = None
			@self.usesession
			def test_func(self,session=None):
				return session
		tc = test_class()
		self.assertRaises(RuntimeError,tc.test_func)
		tc.session = 'something'
		self.assertEqual(tc.test_func(),'something')
		# this one does not work as it's a nonkeyword argument, limitation of decorators for this purpose?
		# self.assertEqual(tc.test_func('not_default'),'not_default')

	def test_without_session_attr(self):
		class test_class():
			@self.usesession
			def test_func(self,session=None):
				return session
		tc = test_class()
		self.assertEqual(tc.test_func(session='not_default'),'not_default')

class TestJsonapply(unittest.TestCase):
	def test_jsonapply(self):
		from bokeh.objects import json_apply

		def check_func(frag):
			if frag == 'goal':
				return True
		def func(frag):
			return frag + 'ed'

		result = json_apply('goal', check_func,func)
		self.assertEqual(result, 'goaled')
		result = json_apply([[['goal', 'junk'], 'junk', 'junk']], check_func, func)
		self.assertEqual(result, [[['goaled', 'junk'], 'junk', 'junk']])
		result = json_apply({'1': 'goal', 1.5 : {'2': 'goal', '3': 'junk'}}, check_func, func)
		self.assertEqual(result, {'1': 'goaled', 1.5 : {'2': 'goaled', '3': 'junk'}})


if __name__ == "__main__":
    unittest.main()
