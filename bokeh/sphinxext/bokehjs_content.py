#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Make javascript code blocks also include a live link to codepen.io for instant experiementation.

This directive takes a title to use for the codepen example:

.. code-block:: rest

    .. bokehjs-content::
        :title: Some Code

        alert('this is called in the codepen');

This directive is identical to the standard ``code-block`` directive
that Sphinx supplies, with the addition of one new option:

title : string
    A title for the codepen.
js_file : string
    location of javascript source file
include_html: string
    if present, this code block will be emitted as a complete HTML template with
    js inside a script block
disable_codepen: string
    if present, this code block will not have a 'try on codepen' button.  Currently
    necessary when 'include_html' is turned on.

Examples
--------

The inline example code above produces the following output:

.. bokehjs-content::
    :title: Some Code

    alert('this is called in the codepen');

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from os.path import basename, join

# External imports
from docutils import nodes
from docutils.parsers.rst.directives import unchanged
from sphinx.directives.code import CodeBlock
from sphinx.errors import SphinxError
from sphinx.util import logging

# Bokeh imports
from .templates import BJS_CODEPEN_INIT, BJS_EPILOGUE, BJS_HTML, BJS_PROLOGUE
from .util import get_codeblock_node, get_sphinx_resources

if False:
    # For type annotation
    # from directives.code.CodeBlock.run
    from typing import Any, Dict, List, Tuple  # NOQA
    from sphinx.application import Sphinx  # NOQA
    from sphinx.config import Config  # NOQA

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'bokehjs_content',
    'BokehJSContent',
    'html_depart_bokehjs_content',
    'html_visit_bokehjs_content',
    'setup',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class bokehjs_content(nodes.General, nodes.Element):
    pass


class BokehJSContent(CodeBlock):

    has_content = True
    optional_arguments = 1
    required_arguments = 0

    option_spec = CodeBlock.option_spec
    option_spec.update(title=unchanged)
    option_spec.update(js_file=unchanged)
    option_spec.update(include_html=unchanged)
    option_spec.update(disable_codepen=unchanged)

    def get_js_source(self):
        env = self.state.document.settings.env
        js_file = self.options.get("js_file", False)
        # js_file *or* js code content, but not both
        if js_file and self.content:
            raise SphinxError("bokehjs-content:: directive can't have both js_file and content")

        if js_file:
            log.debug("[bokehjs-content] handling external example in %r: %s", env.docname, js_file)
            path = js_file
            if not js_file.startswith("/"):
                path = join(env.app.srcdir, path)
            js_source = open(path).read()
        else:
            log.debug("[bokehjs-content] handling inline example in %r", env.docname)
            js_source = '\n'.join(self.content)

        return js_source

    def get_code_language(self):
        """
        This is largely copied from bokeh.sphinxext.bokeh_plot.run
        """
        js_source = self.get_js_source()
        if self.options.get("include_html", False):
            resources = get_sphinx_resources(include_bokehjs_api=True)
            html_source = BJS_HTML.render(
                css_files=resources.css_files,
                js_files=resources.js_files,
                hashes=resources.hashes,
                bjs_script=js_source)
            return [html_source, "html"]
        else:
            return [js_source, "javascript"]


    def run(self):
        env = self.state.document.settings.env

        rst_source = self.state_machine.node.document['source']
        rst_filename = basename(rst_source)

        target_id = "%s.ccb-%d" % (rst_filename, env.new_serialno('ccb'))
        target_id = target_id.replace(".", "-")
        target_node = nodes.target('', '', ids=[target_id])

        node = bokehjs_content()
        node['target_id'] = target_id
        node['title'] = self.options.get("title", "bokehjs example")
        node['include_bjs_header'] = False
        node['disable_codepen'] = self.options.get("disable_codepen", False)
        node['js_source'] = self.get_js_source()

        source_doc = self.state_machine.node.document
        if not hasattr(source_doc, 'bjs_seen'):
            #we only want to inject the CODEPEN_INIT on one
            #bokehjs-content block per page, here we check to see if
            #bjs_seen exists, if not set it to true, and set
            #node['include_bjs_header'] to true.  This way the
            #CODEPEN_INIT is only injected once per document (html
            #page)
            source_doc.bjs_seen = True
            node['include_bjs_header'] = True
        code_content, language = self.get_code_language()
        cb = get_codeblock_node(self, code_content, language)
        node.setup_child(cb[0])
        node.children.append(cb[0])
        return [target_node, node]

def html_visit_bokehjs_content(self, node):
    if node['include_bjs_header']:
        #we only want to inject the CODEPEN_INIT on one
        #bokehjs-content block per page
        resources = get_sphinx_resources(include_bokehjs_api=True)
        self.body.append(BJS_CODEPEN_INIT.render(
            css_files=resources.css_files,
            js_files=resources.js_files))

    self.body.append(
        BJS_PROLOGUE.render(
            id=node['target_id'],
            title=node['title'],
        ))

def html_depart_bokehjs_content(self, node):
    self.body.append(BJS_EPILOGUE.render(
        title=node['title'],
        enable_codepen=not node['disable_codepen'],
        js_source=node['js_source']
    ))

def setup(app):
    ''' Required Sphinx extension setup function. '''
    app.add_node(
        bokehjs_content,
        html=(
            html_visit_bokehjs_content,
            html_depart_bokehjs_content
        )
    )
    app.add_directive('bokehjs-content', BokehJSContent)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
