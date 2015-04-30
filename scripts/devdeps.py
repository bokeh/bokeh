from __future__ import print_function
from os import path

try:
    import colorama
    def blue(text): return "%s%s%s" % (colorama.Fore.BLUE, text, colorama.Style.RESET_ALL)
    def red(text): return "%s%s%s" % (colorama.Fore.RED, text, colorama.Style.RESET_ALL)
except ImportError:
    def blue(text) : return text
    def red(text) : return text

npm_missing = """
npm packages do not appear to be installed.
Please navigate to the bokehjs directory and type 'npm install'\n
"""

def npm_check():
    """Check that the bokehjs/node_modules directory exists, as its absence
    is the best indication that npm is not installed."""


    if not path.exists('../bokehjs/node_modules'):
        print(red(npm_missing))


def depend_check(deps_name, *args):
    """Check for missing dependencies"""

    missing = []

    for dependency in args:
        try:
            __import__(dependency)
        except ImportError:
            missing.append(dependency)
            found = False

    print('-'*80)
    if len(missing):
        print(red("You are missing the following %s dependencies:") % deps_name)

        for dep in missing:
            name = pkg_info_dict.get(dep, dep)
            print(" * ", name)
        print()
        return False
    else:
        print(blue("All %s dependencies installed!  You are good to go!\n") % deps_name)
        return True

if __name__ == '__main__':

    npm_check()

    #Dictionary maps module names to package names
    pkg_info_dict =  {'bs4'           : 'beautiful-soup',
                      'websocket'         : 'websocket-client',
                      'sphinx_bootstrap_theme'   : 'sphinx-bootstrap-theme',
                      'sphinxcontrib.httpdomain' : 'sphinxcontrib-httpdomain',
                      'pdiffer'                    : 'pdiff'
                     }

    dev_deps = ['bs4', 'colorama', 'pdiffer', 'boto', 'nose', 'mock', 'coverage',
                'websocket']
    depend_check('Dev', *dev_deps)

    docs_deps = ['graphviz', 'sphinx', 'pygments', 'sphinx_bootstrap_theme',
                 'sphinxcontrib.httpdomain']
    depend_check('Docs', *docs_deps)
