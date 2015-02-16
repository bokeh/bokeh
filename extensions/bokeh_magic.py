# -*- coding: utf-8 -*-

#-----------------------------------------------------------------------------
#  Copyright (C) 2014  Bokeh Development Team
#
#  The license is in the LICENCE.txt, distributed as part of this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

import IPython
from IPython.core.magic import (Magics, magics_class, line_magic)
from IPython.testing.skipdoctest import skip_doctest
from IPython.core.magic_arguments import (argument, magic_arguments,
    parse_argstring)
from IPython.core.error import UsageError
try:
    from bokeh.plotting import (output_notebook, show, hold, figure)
    old_bokeh = False
except ImportError:
    old_bokeh = True

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


@magics_class
class BokehMagics(Magics):
    """Magic to embed Bokeh into the IPython notebook."""

    if old_bokeh:
        raise DeprecationWarning("%bokeh magic is deprecated, "
                                 "and will not work in versions > 0.7.1")

    if IPython.__version__.startswith("1"):
        is_ipytwo = False
    else:
        is_ipytwo = True

    has_run = False

    @skip_doctest
    @magic_arguments()
    @argument('-n', '--notebook', action="store_true",
              help='This option enable the execution of the Bokeh '
              'output_notebook() funtion.')
    @argument('-f', '--figure', action="store_true",
              help='This option enable the execution of the Bokeh figure() '
              'function at the start of each cell.')
    @argument('-f-off', '--figure-off', action="store_true",
              help='This option disable the execution of the Bokeh figure() '
              'function at the start of each cell.')
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

            In [3]: %bokeh --notebook [-n]

        Then you can use a several `modes` (show, hold, figure)::

            In [4]: %bokeh --show [-s] # to enable the autoshow function

            In [5]: %bokeh --show-off [-s-off] to disable the autoshow function

        You can add concatenate `modes` as arguments::

            In [6]: %bokeh --notebook [-n] --show-off [-s-off]

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
            if not self.has_run:
                self.notebook_output()

        if args.figure:
            if not self.has_run:
                self.notebook_output()
            # Register the figure function.
            if self.is_ipytwo:
                ip.events.register('pre_run_cell', figure)
                print("Automatic figure() is enabled.")
            else:
                #ip.set_hook('pre_run_code_hook', figure)  # not working
                print("The --figure mode is not supported for this version of IPython.")
        elif args.figure_off:
            if not self.has_run:
                self.notebook_output()
            if self.is_ipytwo:
                try:
                    # Unregister a figure function.
                    ip.events.unregister('pre_run_cell', figure)
                    print("Automatic figure() is disabled.")
                except ValueError:
                    raise UsageError("""You have to enable the --figure mode before trying to disable it.""")
            else:
                print("The --figure mode is not supported for this version of IPython.")

        if args.hold:
            if not self.has_run:
                self.notebook_output()
            # Register the hold function.
            if self.is_ipytwo:
                try:
                    ip.events.unregister('pre_run_cell', self._hold_false)
                    ip.events.register('pre_run_cell', self._hold_true)
                except ValueError:
                    ip.events.register('pre_run_cell', self._hold_true)
                print("Automatic hold() is enabled.")
            else:
                ip.set_hook('pre_run_code_hook', hold)
                print("Automatic hold() is irreversible for IPython 1.x. Just restart your kernel to disable.")
        elif args.hold_off:
            if not self.has_run:
                self.notebook_output()
            if self.is_ipytwo:
                try:
                    # Unregister a figure function.
                    ip.events.unregister('pre_run_cell', self._hold_true)
                    ip.events.register('pre_run_cell', self._hold_false)
                    print("Automatic hold() is disabled.")
                except ValueError:
                    raise UsageError("""You have to enable the --hold mode before trying to disable it.""")
            else:
                print("Automatic hold() can not be disabled for IPython 1.x without restarting your kernel. Did you activate it before?")

        if args.show:
            if not self.has_run:
                self.notebook_output()
            # Register a function for calling after code execution.
            if self.is_ipytwo:
                ip.events.register('post_run_cell', self.notebook_show)
            else:
                ip.register_post_execute(self.notebook_show)
            print("Automatic show() is enabled.")
        elif args.show_off:
            if not self.has_run:
                self.notebook_output()
            if self.is_ipytwo:
                try:
                    # Unregister a function
                    ip.events.unregister('post_run_cell', self.notebook_show)
                    print("Automatic show() is disabled.")
                except ValueError:
                    raise UsageError("""You have to enable the --show mode before trying to disable it.""")
            else:
                try:
                    # Unregister a function from the _post_execute dict.
                    del ip._post_execute[self.notebook_show]
                    print("Automatic show() is disabled.")
                except KeyError:
                    raise UsageError("""You have to enable the --show mode before trying to disable it.""")

    def notebook_output(self):
        """Wrapper to execute the open notebook function just once to avoid 
        a javascript annoying bug when it is called multiple times."""
        output_notebook()
        self.has_run = True

    def notebook_show(self):
        "Wrapper to avoid the exception when the cell does not contain a plot."
        try:
            show()
        except AttributeError as e:
            # no plot object in the current cell gives us an AttributeError
            if str(e) != "'NoneType' object has no attribute 'get_ref'":
                raise
            else:
                pass

    def _hold_true(self):
        "Wrapper to set up the the hold function to True to avoid toggling."
        hold(True)

    def _hold_false(self):
        "Wrapper to set up the the hold function to True to avoid toggling."
        hold(False)


def load_ipython_extension(ip):
    ip.register_magics(BokehMagics)
    print("Bokeh magic loaded.")
