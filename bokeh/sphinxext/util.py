#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Install some functions for the bokeh theme to make use of.


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
from copy import deepcopy

# External imports
from docutils import nodes
from sphinx.directives.code import container_wrapper, dedent_lines
from sphinx.locale import __
from sphinx.util import parselinenos
from sphinx.util.nodes import set_source_info

# Bokeh imports
from bokeh.resources import Resources
from bokeh.settings import settings

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'get_codeblock_node',
    'get_sphinx_resources',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def get_sphinx_resources(include_bokehjs_api=False):
    docs_cdn = settings.docs_cdn()

    # if BOKEH_DOCS_CDN is unset just use default CDN resources
    if docs_cdn is None:
        resources = Resources(mode="cdn")
    else:
        # "BOKEH_DOCS_CDN=local" is used for building and displaying the docs locally
        if docs_cdn == "local":
            resources = Resources(mode="server", root_url="/en/latest/")

        # "BOKEH_DOCS_CDN=test:newthing" is used for building and deploying test docs to
        # a one-off location "en/newthing" on the docs site
        elif docs_cdn.startswith("test:"):
            resources = Resources(
                mode="server", root_url="/en/%s/" % docs_cdn.split(":")[1])

        # Otherwise assume it is a dev/rc/full release version and use CDN for it
        else:
            resources = Resources(mode="cdn", version=docs_cdn)
    sphinx_resources = deepcopy(resources)
    if include_bokehjs_api:
        sphinx_resources.js_components.append("bokeh-api")
    return sphinx_resources

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

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
