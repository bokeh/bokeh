from __future__ import absolute_import
import ast

import pytest, yaml

from ..api_crawler import api_crawler


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


class TestApiCrawler(object):
    crawler = api_crawler("./")

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

    def test_accurate_diff(self):
        self.crawler.additions = False
        raw_diff = self.crawler.diff_modules(old_version, new_version)
        assert raw_diff == expected_diff

    def test_diff_additions(self):
        self.crawler.additions = True
        raw_diff = self.crawler.diff_modules(old_version, new_version)
        assert raw_diff == expected_additions

    def test_removed_parsing(self):
        self.crawler.additions = False
        raw_diff = self.crawler.diff_modules(old_version, new_version)
        raw_diff = self.crawler.parse_diff(raw_diff)
        expected_parsed = ['DELETED models', 'DELETED bands.Radiohead.jonny', 'DELETED bands.Apple', 'DELETED bands.ringo', 'DELETED bands.Beatles']
        for x in raw_diff:
            assert x in expected_parsed

    def test_additions_parsing(self):
        self.crawler.additions = True
        raw_diff = self.crawler.diff_modules(old_version, new_version)
        raw_diff = self.crawler.parse_diff(raw_diff)
        expected_parsed = ['ADDED bands.george', 'ADDED bands.Pixies']
        for x in raw_diff:
            assert x in expected_parsed

    def test_operators(self):
        a = {"one", "two", "three", "four"}
        b = {"one", "two", "three", "five"}
        assert self.crawler.diff_operation(a, b) == ["four"]
        assert self.crawler.combinaton_diff_operation(a, b) == ["five"]

    def test_diff_files(self):
        self.crawler.additions = False
        intersection, diff = self.crawler.diff_files(old_version, new_version)
        assert diff.keys() == ["models"]
        assert intersection.keys() == ["bands"]
        self.crawler.additions = True
        intersection, diff = self.crawler.diff_files(old_version, new_version)
        assert diff.keys() == []
        for x in intersection.keys():
            assert x in ["models", "bands"]

    def test_diff_classes_functions(self):
        self.crawler.additions = False
        intersection, diff = self.crawler.diff_files(old_version, new_version)
        diff = self.crawler.diff_functions_classes(diff, intersection, old_version, new_version)
        assert diff["bands"]["functions"] == ["ringo"]
        for x in diff["bands"]["classes"].keys():
            assert x in expected_diff["bands"]["classes"].keys()
        self.crawler.additions = True
        intersection, diff = self.crawler.diff_files(old_version, new_version)
        diff = self.crawler.diff_functions_classes(diff, intersection, old_version, new_version)
        assert diff["bands"]["functions"] == ["george"]
        assert diff["bands"]["classes"].keys() == ["Pixies"]

    def test_diff_methods(self):
        self.crawler.additions = False
        intersection, diff = self.crawler.diff_files(old_version, new_version)
        diff = self.crawler.diff_functions_classes(diff, intersection, old_version, new_version)
        diff = self.crawler.diff_methods(diff, intersection, old_version, new_version)
        assert diff["bands"]["classes"]["Radiohead"]["methods"] == ["jonny"]
