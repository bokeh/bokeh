''' Provides a base class for defining subcommands of the Bokeh command
line application.

'''
from abc import ABCMeta, abstractmethod

from bokeh.util.future import with_metaclass

class Subcommand(with_metaclass(ABCMeta)):
    ''' Abstract base class for subcommands '''

    def __init__(self, parser):
        ''' Initialize the subcommand with its parser

        The initializer can call parser.add_argument to add subcommand flags.

        '''
        self.parser = parser

    @abstractmethod
    def invoke(self, args):
        ''' Takes over main program flow to perform the subcommand.

        Args:
            args (seq) : command line arguments for the subcommand to parse

        '''
        pass