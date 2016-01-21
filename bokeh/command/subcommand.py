''' Provides a base class for defining subcommands of the Bokeh command
line application.

'''
from abc import ABCMeta, abstractmethod

from bokeh.util.future import with_metaclass

class Subcommand(with_metaclass(ABCMeta)):
    ''' Abstract base class for subcommands

    Subclasses should implement an ``invoke(self, args)`` method that accepts
    a set of argparse processed arguments as input.

    Subclasses should also define the following class attributes:

        * ``name`` a name for this subcommand
        * ``help`` a help string for argparse to use for this subcommand
        * ``args`` the parameters to pass to ``parser.add_argument``

        The format of the ``args`` should be a sequence of tuples of the form:

            ('argname', dict(
                metavar='ARGNAME',
                nargs='+',
            ))

    '''

    def __init__(self, parser):
        ''' Initialize the subcommand with its parser

        This method will automatically add all the arguments described in
        ``self.args``. Subclasses can perform any additional customizations
        on ``self.parser``.

        '''
        self.parser = parser
        args = getattr(self, 'args', ())
        for arg in args:
            flags = arg[0]
            if not isinstance(flags, tuple):
                flags = (flags,)
            self.parser.add_argument(*flags, **arg[1])

    @abstractmethod
    def invoke(self, args):
        ''' Takes over main program flow to perform the subcommand.

        Args:
            args (seq) : command line arguments for the subcommand to parse

        '''
        raise NotImplementedError("implement invoke()")
