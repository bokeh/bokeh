from __future__ import absolute_import
import ast


from ..api_crawler import api_crawler, differ


sample_class = """
class SampleClass:
    def __init__(self):
        pass
"""

sample_function = """
def sample_function(self):
    pass
"""

sample_code = """
class SampleClass:
    def __init__(self):
        pass
def sample_function(self):
    pass
"""


class TestApiCrawler(object):
    crawler = api_crawler("bokeh")

    def test_get_crawl_dict(self):
        crawl_dict = self.crawler.get_crawl_dict()
        assert crawl_dict

    def test_name_is_public(self):
        filename = "_apple"
        assert not self.crawler.is_public(filename)
        filename = "__init__"
        assert self.crawler.is_public(filename)
        filename = "apple"
        assert self.crawler.is_public(filename)

    def test_filename_is_public(self):
        # Should not crawl __init__.py files
        filename = "__init__.py"
        assert not self.crawler.is_public(filename)

        filename = "_apple.py"
        assert not self.crawler.is_public(filename)
        filename = "apple.py"
        assert self.crawler.is_public(filename)

    def test_is_function(self):
        parsed_function = ast.parse(sample_function).body[0]
        assert self.crawler.is_function(parsed_function)

    def test_is_class(self):
        parsed_class = ast.parse(sample_class).body[0]
        assert self.crawler.is_class(parsed_class)

    def test_get_functions(self):
        functions = self.crawler.get_functions(sample_code)
        assert "sample_function" in functions

    def test_get_classes(self):
        classes = self.crawler.get_classes(sample_code)
        assert "SampleClass" in classes


old_version = {
    "models": {},
    "bands": {
        "classes": {
            "Radiohead": {
                "methods": ["thom", "jonny", "colin", "ed", "phil"]
            },
            "Beatles": {
                "methods": ["Here Comes the Sun"]
            }
        },
        "functions": ["john", "paul", "ringo"]
    }
}

new_version = {
    "bands": {
        "classes": {
            "Radiohead": {
                "methods": ["thom", "colin", "ed", "phil"]
            },
            "Pixies": {"methods": ["debaser"]}
        },
        "functions": ["john", "paul", "george"]
    }
}

expected_diff = {
    "models": {},
    "bands": {
        "classes": {
            "Radiohead": {
                "methods": ["jonny"]
            },
            "Beatles": {}
        },
        "functions": ["ringo"]
    }
}

expected_additions = {
    'bands': {
        'classes': {
            'Pixies': {}
        },
        'functions': ['george']
    }
}

expected_parsed_diff = [
    'DELETED models',
    'DELETED bands.Radiohead.jonny',
    'DELETED bands.Apple',
    'DELETED bands.ringo',
    'DELETED bands.Beatles'
]

expected_parsed_additions = [
    'ADDED bands.george',
    'ADDED bands.Pixies'
]

single_class_old = {
    "bands": {"functions": [], "classes": {"Radiohead": {"methods": ["thom", "jonny", "colin", "ed", "phil"]}}}
}

single_class_new = {
    "bands": {"functions": [], "classes": {"Radiohead": {"methods": ["thom", "colin", "ed", "phil"]}}}
}

expected_single_class = {
    "bands": {"classes": {"Radiohead": {"methods": ["jonny"]}}}
}


class TestDiffer(object):
    differ = differ(old_version, new_version)

    def test_accurate_diff(self):
        self.differ.additions = False
        raw_diff = self.differ.diff_modules()
        assert raw_diff == expected_diff

    def test_catch_key_error(self):
        self.differ.additions = False
        self.differ.former = single_class_old
        self.differ.latter = single_class_new
        raw_diff = self.differ.diff_modules()
        assert raw_diff == expected_single_class

        self.differ.former = old_version
        self.differ.latter = new_version

    def test_get_diff(self):
        diff = self.differ.get_diff()
        expected_diff = expected_parsed_diff + expected_parsed_additions
        for x in diff:
            assert x in expected_diff

    def test_diff_additions(self):
        self.differ.additions = True
        raw_diff = self.differ.diff_modules()
        assert raw_diff == expected_additions

    def test_removed_parsing(self):
        self.differ.additions = False
        raw_diff = self.differ.diff_modules()
        raw_diff = self.differ.parse_diff(raw_diff)
        for x in raw_diff:
            assert x in expected_parsed_diff

    def test_additions_parsing(self):
        self.differ.additions = True
        raw_diff = self.differ.diff_modules()
        raw_diff = self.differ.parse_diff(raw_diff)
        for x in raw_diff:
            assert x in expected_parsed_additions

    def test_operators(self):
        a = {"one", "two", "three", "four"}
        b = {"one", "two", "three", "five"}
        assert self.differ.diff_operation(a, b) == ["four"]
        assert self.differ.combinaton_diff_operation(a, b) == ["five"]

    def test_diff_files(self):
        self.differ.additions = False
        intersection, diff = self.differ.diff_files()
        assert list(diff.keys()) == ["models"]
        assert list(intersection.keys()) == ["bands"]
        self.differ.additions = True
        intersection, diff = self.differ.diff_files()
        assert list(diff.keys()) == []
        for x in intersection.keys():
            assert x in ["models", "bands"]

    def test_diff_classes_functions(self):
        self.differ.additions = False
        intersection, diff = self.differ.diff_files()
        diff = self.differ.diff_functions_classes(diff, intersection)
        assert diff["bands"]["functions"] == ["ringo"]
        for x in diff["bands"]["classes"].keys():
            assert x in expected_diff["bands"]["classes"].keys()
        self.differ.additions = True
        intersection, diff = self.differ.diff_files()
        diff = self.differ.diff_functions_classes(diff, intersection)
        assert diff["bands"]["functions"] == ["george"]
        assert list(diff["bands"]["classes"].keys()) == ["Pixies"]

    def test_diff_methods(self):
        self.differ.additions = False
        intersection, diff = self.differ.diff_files()
        diff = self.differ.diff_functions_classes(diff, intersection)
        diff = self.differ.diff_methods(diff, intersection)
        assert diff["bands"]["classes"]["Radiohead"]["methods"] == ["jonny"]
