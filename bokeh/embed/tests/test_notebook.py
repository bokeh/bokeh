#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from mock import patch

# External imports

# Bokeh imports
from bokeh.core.templates import DOC_NB_JS, PLOT_DIV
from bokeh.core.json_encoder import serialize_json

# Module under test
import bokeh.embed.notebook as ben

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

@pytest.fixture
def test_plot():
    from bokeh.plotting import figure
    test_plot = figure()
    test_plot.circle([1, 2], [2, 3])
    return test_plot

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Test_notebook_content(object):

    @patch('bokeh.embed.notebook.standalone_docs_json_and_render_items')
    def test_notebook_content(self, mock_sdjari, test_plot):
        (docs_json, render_items) = ("DOC_JSON", [dict(docid="foo", elementid="bar", modelid="bat")])
        mock_sdjari.return_value = (docs_json, render_items)

        expected_script = DOC_NB_JS.render(docs_json=serialize_json(docs_json),
                                        render_items=serialize_json(render_items))
        expected_div = PLOT_DIV.render(elementid=render_items[0]['elementid'])

        (script, div, _) = ben.notebook_content(test_plot)

        assert script == expected_script
        assert div == expected_div

    @patch('bokeh.embed.notebook.standalone_docs_json_and_render_items')
    def test_notebook_content_with_notebook_comms_target(self, mock_sdjari, test_plot):
        (docs_json, render_items) = ("DOC_JSON", [dict(docid="foo", elementid="bar", modelid="bat")])
        mock_sdjari.return_value = (docs_json, render_items)
        comms_target = "NOTEBOOK_COMMS_TARGET"

        ## assert that NOTEBOOK_COMMS_TARGET is added to render_items bundle
        assert 'notebook_comms_target' not in render_items[0]
        (script, _, _) = ben.notebook_content(test_plot, notebook_comms_target=comms_target)
        assert 'notebook_comms_target' in render_items[0]

        ## assert that NOTEBOOK_COMMS_TARGET ends up in generated script
        expected_script = DOC_NB_JS.render(docs_json=serialize_json(docs_json),
                                        render_items=serialize_json(render_items))

        assert script == expected_script

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

class Test__ModelInEmptyDocument(object):

    @patch('bokeh.document.document.check_integrity')
    def test_validates_document_by_default(self, check_integrity, test_plot):
        with ben._ModelInEmptyDocument(test_plot):
            pass
        assert check_integrity.called

    @patch('bokeh.document.document.check_integrity')
    def test_doesnt_validate_document_due_to_env_var(self, check_integrity, monkeypatch, test_plot):
        monkeypatch.setenv("BOKEH_VALIDATE_DOC", "false")
        with ben._ModelInEmptyDocument(test_plot):
            pass
        assert not check_integrity.called
