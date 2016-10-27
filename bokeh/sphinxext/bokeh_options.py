""" Thoroughly document Bokeh options classes.

The ``bokeh-options`` directive will automatically document
all the properties) of a Bokeh Options class.


This directive takes the path to a Bokeh model class as an
argument::

    .. bokeh-options:: Opts
        :module: bokeh.sphinxext.sample

Examples
--------

For the following definition of ``bokeh.sphinxext.sample.Opts``::

    class Opts(Options):
        ''' This is an Options class '''

        host = String(default="localhost", help="a host to connect to")
        port = Int(default="5890", help="a port to connect to")


the above usage yields the output:

    .. bokeh-options:: Opts
        :module: bokeh.sphinxext.sample

"""
from __future__ import absolute_import, print_function

import importlib
import re
import textwrap

from docutils import nodes
from docutils.parsers.rst.directives import unchanged
from docutils.statemachine import ViewList

from sphinx.errors import SphinxError
from sphinx.util.compat import Directive
from sphinx.util.nodes import nested_parse_with_titles

from ..core.properties import Options
from .templates import OPTIONS_DETAIL

# taken from Sphinx autodoc
py_sig_re = re.compile(
    r'''^ ([\w.]*\.)?            # class name(s)
          (\w+)  \s*             # thing name
          (?: \((.*)\)           # optional: arguments
           (?:\s* -> \s* (.*))?  #           return annotation
          )? $                   # and nothing more
          ''', re.VERBOSE)

class BokehOptionsDirective(Directive):

    has_content = True
    required_arguments = 1
    optional_arguments = 2

    option_spec = {
        'module': unchanged
    }

    def run(self):
        sig = " ".join(self.arguments)

        m = py_sig_re.match(sig)
        if m is None:
            raise SphinxError("Unable to parse signature for bokeh-options: %r" % sig)
        name_prefix, options_name, arglist, retann = m.groups()

        module_name = self.options['module']

        try:
            module = importlib.import_module(module_name)
        except ImportError:
            raise SphinxError("Unable to generate reference docs for %s, couldn't import module '%s'" % (options_name, module_name))

        options = getattr(module, options_name, None)
        if options is None:
            raise SphinxError("Unable to generate reference docs for %s, no options '%s' in %s" % (options_name, options_name, module_name))

        if not issubclass(options, Options):
            raise SphinxError("Unable to generate reference docs for %s, options '%s' is not a subclass of Options" % (options_name, options_name))

        options_obj = options({})

        opts = [];
        for prop_name in sorted(options_obj.properties()):
            prop = getattr(options_obj.__class__, prop_name)
            opts.append(dict(
                name=prop_name,
                type=prop._sphinx_type(),
                default=None,
                doc="" if prop.__doc__ is None else textwrap.dedent(prop.__doc__),
            ))

        rst_text = OPTIONS_DETAIL.render(opts=opts)

        result = ViewList()
        for line in rst_text.split("\n"):
            result.append(line, "<bokeh-options>")
        node = nodes.paragraph()
        node.document = self.state.document
        nested_parse_with_titles(self.state, result, node)
        return node.children

def setup(app):
    app.add_directive_to_domain('py', 'bokeh-options', BokehOptionsDirective)
