#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
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
from sphinx.directives.code import CodeBlock, dedent_lines, container_wrapper
from sphinx.locale import __
from sphinx.util import logging
from sphinx.util import parselinenos
from sphinx.util.nodes import set_source_info
from sphinx.errors import SphinxError
# Bokeh imports
from .util import get_sphinx_resources
from .templates import BJS_PROLOGUE, BJS_EPILOGUE, BJS_CODEPEN_INIT, BJS_HTML

if False:
    # For type annotation
    #From directives.code.CodeBlock.run
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

    def get_codeblock_node(self, code, language):
        """this is copied from sphinx.directives.code.CodeBlock.run

        it has been changed to accept code and language as an arguments instead
        of reading from self

        """

        document = self.state.document
        location = self.state_machine.get_source_and_line(self.lineno)

        linespec = self.options.get('emphasize-lines')
        if linespec:
            try:
                nlines = len(code.split('\n'))
                hl_lines = parselinenos(linespec, nlines)
                if any(i >= nlines for i in hl_lines):
                    log.warning(__('line number spec is out of range(1-%d): %r') %
                                   (nlines, self.options['emphasize-lines']),
                                   location=location)

                hl_lines = [x + 1 for x in hl_lines if x < nlines]
            except ValueError as err:
                return [document.reporter.warning(str(err), line=self.lineno)]
        else:
            hl_lines = None

        if 'dedent' in self.options:
            location = self.state_machine.get_source_and_line(self.lineno)
            lines = code.split('\n')
            lines = dedent_lines(lines, self.options['dedent'], location=location)
            code = '\n'.join(lines)

        literal = nodes.literal_block(code, code)
        literal['language'] = language
        literal['linenos'] = 'linenos' in self.options or \
                             'lineno-start' in self.options
        literal['classes'] += self.options.get('class', [])
        extra_args = literal['highlight_args'] = {}
        if hl_lines is not None:
            extra_args['hl_lines'] = hl_lines
        if 'lineno-start' in self.options:
            extra_args['linenostart'] = self.options['lineno-start']
        set_source_info(self, literal)

        caption = self.options.get('caption')
        if caption:
            try:
                literal = container_wrapper(self, literal, caption)
            except ValueError as exc:
                return [document.reporter.warning(str(exc), line=self.lineno)]

        # literal will be note_implicit_target that is linked from caption and numref.
        # when options['name'] is provided, it should be primary ID.
        self.add_name(literal)

        return [literal]

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
            path = env.bokeh_plot_auxdir  # code runner just needs any real path
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
        cb = self.get_codeblock_node(
            code_content, language)
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
