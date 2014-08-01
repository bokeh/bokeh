import unittest

import bokeh.plotting as plotting

class TestPlotting(unittest.TestCase):

    def test_reset_output(self):
        plotting._default_document = 10
        plotting._default_session = 10
        plotting._default_file = 10
        plotting._default_notebook = 10
        plotting.reset_output()
        self.assertTrue(isinstance(plotting._default_document, plotting.Document))
        self.assertEqual(plotting._default_session, None)
        self.assertEqual(plotting._default_file, None)
        self.assertEqual(plotting._default_notebook, None)


