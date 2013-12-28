import unittest , sys , platform , os
import mock

#would use stringIO but flush is called by bokeh.test which wipes it!
class CaptureString():
	value = ""
	def write(self,string):
		self.value += string
	def flush(self):
		pass

def CaptureStdOut():
	#replace stdout with something we can capture
	out = CaptureString()
	sys.stdout = out
	return out

class TestPrintVersions(unittest.TestCase):
	def setUp(self):
		self.out = CaptureStdOut()

	def test_print(self):
		import bokeh
		#remove nodename from the system info
		sysinfo = list(platform.uname())
		del sysinfo[1]		
		bokeh.print_versions()
		#check the correct info is present
		for info in sysinfo:
			self.assertIn(info,self.out.value)
		self.assertIn(sys.version,self.out.value)
		self.assertIn(bokeh.__version__,self.out.value)


class MetaTest(unittest.TestCase):
	def setUp(self):
		#replace stdout with something we can capture
		self.out = CaptureStdOut()

	def test_testing(self):
		import nose , bokeh
		nose.main = mock.MagicMock(return_value=True)
		result = bokeh.test(verbosity=100,xunitfile='xunitcapturefiledotxml.xml',exit=False)
		bokehdir = os.path.dirname(bokeh.__file__)
		nose.main.assert_called_with(
								 	exit= False, 
									argv= 	[
											'nosetests',
											'--verbosity=100',
											'--with-xunit',
											'--xunit-file=xunitcapturefiledotxml.xml',
											'--logging-level=WARN',
											os.path.join(bokehdir,'tests'),
											os.path.join(bokehdir,'server/tests'),
											os.path.join(bokehdir,'server/templates/tests')
										 	]
									)
									


if __name__ == "__main__":
    unittest.main()
