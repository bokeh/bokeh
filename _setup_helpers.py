import os

def upgrade_npm():
    # Workaround to upgrade ``npm`` since Read the Docs build environment have
    # ``3.5.2`` and we need at least ``npm>=6.0``
    os.system('cd ~ ; mkdir bin ; npm install npm')
    os.environ['PATH'] = '/home/docs/node_modules/.bin/:{}'.format(os.environ.get('PATH'))
    print('PATH: {}'.format(os.environ.get('PATH')))

def set_env_to_build_bokehjs()
    # TODO: this can be defined using Environment Variables on Read the Docs
    # https://docs.readthedocs.io/en/latest/guides/environment-variables.html

    # Tell Bokeh install script to always build the Javascript files
    os.environ['BOKEH_BUILD_JS'] = '1'
