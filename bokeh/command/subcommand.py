''' Provides a base class for defining subcommands of the bokeh command
line application.

'''

class Subcommand(object):
    ''' Abstract base class for subcommands '''

    def __init__(self, parser):
        ''' Initialize the subcommand with its parser

        The initializer can call parser.add_argument to add subcommand flags.

        '''
        self.parser = parser

    def func(self, args):
        ''' Takes over main program flow to perform the subcommand. '''
        raise NotImplementedError("Implement func(args)")