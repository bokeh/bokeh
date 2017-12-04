import hashlib
from os.path import abspath, join, split, pardir

TOP_PATH = abspath(join(split(__file__)[0], pardir))


def test_autoload_template_has_changed():
    """This is not really a test but a reminder that if you change the 
    autoload_nb_js.js template then you should make sure that insertion of
    plots into notebooks is working as expected. In particular, this test was
    created as part of https://github.com/bokeh/bokeh/issues/7125.
    """
    with open(join(TOP_PATH, '_templates/autoload_nb_js.js'), mode='rb') as f:
        # compute a hash of the template and compare it against the
        # last known hash
        hash = hashlib.sha224(f.read()).hexdigest()
        assert  hash == \
        'dda19c5cb89b1ae6f10cdc24b052fa53738a1c31e654e5232e60ea59', \
        """It seems that the template autoload_nb_js.js has changed. 
        If this is voluntary and that proper testing of plots insertion 
        in notebooks has been completed successfully, update this test
         with this new file hash {}""".format(hash)

