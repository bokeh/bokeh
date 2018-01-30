import pytest
import bokeh.util.dependencies as dep

class Test_detect_phantomjs(object):

    def test_detect_phantomjs_success(self):
        assert dep.detect_phantomjs() is not None

    def test_detect_phantomjs_bad_path(self, monkeypatch):
        monkeypatch.setenv("BOKEH_PHANTOMJS_PATH", "bad_path")
        with pytest.raises(RuntimeError):
            dep.detect_phantomjs()

    def test_detect_phantomjs_bad_version(self):
        with pytest.raises(RuntimeError) as e:
            dep.detect_phantomjs('10.1')
        assert str(e).endswith("PhantomJS version to old. Version>=10.1 required, installed: 2.1.1")

    def test_detect_phantomjs_default_required_version(self):
        assert dep.detect_phantomjs.__defaults__ == ('2.1',)

class Test_import_optional(object):

    def test_success(self):
        assert dep.import_optional('sys') is not None

    def test_fail(self):
        assert dep.import_optional('bleepbloop') is None

class Test_import_required(object):

    def test_success(self):
        assert dep.import_required('sys', 'yep') is not None

    def test_fail(self):
        with pytest.raises(RuntimeError) as excinfo:
            dep.import_required('bleepbloop', 'nope')
        assert 'nope' in str(excinfo.value)
