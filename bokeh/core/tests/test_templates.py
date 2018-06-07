import io
import hashlib
from os.path import abspath, join, split, pardir

TOP_PATH = abspath(join(split(__file__)[0], pardir))

def compute_sha256(data):
    sha256 = hashlib.sha256()
    sha256.update(data)
    return sha256.hexdigest()

pinned_template_sha256 = "22c80ab04af3eb44b5be510bedd46c89d6c6d1d73bb3437050b799ee0e2ec044"

def test_autoload_template_has_changed():
    """This is not really a test but a reminder that if you change the
    autoload_nb_js.js template then you should make sure that insertion of
    plots into notebooks is working as expected. In particular, this test was
    created as part of https://github.com/bokeh/bokeh/issues/7125.
    """
    with io.open(join(TOP_PATH, '_templates/autoload_nb_js.js'), mode='rb') as f:
        assert pinned_template_sha256 == compute_sha256(f.read()), \
        """It seems that the template autoload_nb_js.js has changed.
        If this is voluntary and that proper testing of plots insertion
        in notebooks has been completed successfully, update this test
        with the new file SHA256 signature."""
