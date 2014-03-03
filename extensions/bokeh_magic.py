# -*- coding: utf-8 -*-

#-----------------------------------------------------------------------------
#  Copyright (C) 2014  Bokeh Development Team
#
#  The license is in the LICENCE.txt, distributed as part of this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

import collections
from IPython.core.magic import (Magics, magics_class, line_magic)
from IPython.testing.skipdoctest import skip_doctest
from IPython.core.magic_arguments import (argument, magic_arguments,
    parse_argstring)
from IPython.core.error import UsageError
from bokeh.plotting import (output_notebook, figure, hold, show)

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

@magics_class
class BokehMagics(Magics):
    """Magic to embed Bokeh into the IPython notebook."""

    has_run = False

    @skip_doctest
    @magic_arguments()
    @argument('-n', '--notebook', action="store_true",
              help='This option enable the execution of the Bokeh '
              'output_notebook() funtion.')
    @argument('-h', '--hold', action="store_true",
              help='This option enable the execution of the Bokeh hold() '
              'function at the start of each cell.')
    @argument('-h-off', '--hold-off', action="store_true",
              help='This option disable the execution of the Bokeh hold() '
              'function at the start of each cell.')
    @argument('-s', '--show', action="store_true",
              help='This option enable the execution of the Bokeh show() '
              'function at the end of each cell.')
    @argument('-s-off', '--show-off', action="store_true",
              help='This option disable the execution of the Bokeh show() '
              'function at the end of each cell.')
    @line_magic
    def bokeh(self, arg, line=None):
        """ Set up Bokeh to work interactively.

        This function lets you activate bokeh interactive support
        at any point during an IPython session. It does not import any other
        bokeh objects into the interactive namespace.

        Examples
        --------


            In [1]: %install_ext url_for_bokeh_extension

            In [2]: %load_ext bokeh_magic

        To load it each time IPython starts, list it in your configuration file:

            c.InteractiveShellApp.extensions = ['bokeh_magic']

        To enable bokeh for usage with the IPython Notebook::

            In [3]: %bokeh --notebook

        Then you can use several `modes` listed below::

            In [4]: %bokeh --hold [-h] # to enable the autohold function

            In [5]: %bokeh --hold-off [-h-off] to disable the autohold function

            In [6]: %bokeh --show [-s] # to enable the autoshow function

            In [7]: %bokeh --show-off [-s-off] to disable the autoshow function

        Note: In order to actually use this magic, you need to have
        get_ipython(), so you need to have a running IPython kernel.
        """

        # Get the current running IPython instance.
        ip = get_ipython()

        # Parse the arguments.
        args = parse_argstring(self.bokeh, arg)

        # Activate/deactivate the execution of func accordingly with the args.
        if args.notebook:
            # Configuring embedded BokehJS mode.
            self.notebook_output()
        elif args.hold:
            if not self.has_run:
                self.notebook_output()
            # Register a function for calling after code execution
            ip.register_post_execute(hold)
            # Set a prehook for calling a function before code execution.
            ip.set_hook('pre_run_code_hook', hold)
            print "Automatic hold() is enable."
        elif args.hold_off:
            try:
                if not self.has_run:
                    self.notebook_output()
                # Unregister a function from the _post_execute dict.
                del ip._post_execute[hold]
                # Set a dummy prehook for calling a do-nothing function.
                ip.set_hook('pre_run_code_hook', self.dummy)
                print "Automatic hold() is disable."
            except KeyError:
                raise UsageError("You have to enable the --hold mode before trying to disable it.")
        elif args.show:
            if not self.has_run:
                self.notebook_output()
            # Register a function for calling after code execution.
            ip.register_post_execute(self.notebook_show)
            print "Automatic show() is enable."
        elif args.show_off:
            try:
                if not self.has_run:
                    self.notebook_output()
                # Unregister a function from the _post_execute dict.
                del ip._post_execute[self.notebook_show]
                print "Automatic show() is disable."
            except KeyError:
                raise UsageError("You have to enable the --show mode before trying to disable it.")

    def notebook_output(self):
        output_notebook()
        self.has_run = True

    def notebook_show(self):
        try:
            show()
        except IndexError:
            # no plot object in the current cell gives us IndexError
            pass

    def dummy(self):
        pass


def load_ipython_extension(ip):
    ip.register_magics(BokehMagics)
    print ("Bokeh magic loaded.")
