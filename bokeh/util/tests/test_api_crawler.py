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
            "Apple": {
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
            }
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
            "Apple": {}
        },
        "functions": ["ringo"]
    }
}


class TestApiCrawler(object):
    crawler = api_crawler("./")

    def test_get_crawl_dict(self):
        self.crawl_dict = self.crawler.get_crawl_dict()
        assert self.crawl_dict

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
        diff_dict = self.crawler.diff_modules(old_version, new_version)
        assert diff_dict == expected_diff
