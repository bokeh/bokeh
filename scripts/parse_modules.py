import ast, os
import yaml


__all__ = ["api_crawler"]


class APICrawler(object):
    exclude = ("tests", "static", "sampledata", "mplexplorer")

    def __init__(self, directory):
        self.directory = directory

    def is_public(self, name):
        if name.startswith("_", 0, 1) and name != "__init__":
            return False
        else:
            return True

    def is_function(self, ast_node):
        if isinstance(ast_node, ast.FunctionDef) and ast_node.col_offset == 0:
            return True
        else:
            return False

    def is_class(self, ast_node):
        if isinstance(ast_node, ast.ClassDef):
            return True
        else:
            return False

    def get_classes(self, source):
        parsed = ast.parse(source)
        classes = [node for node in ast.walk(parsed) if self.is_class(node) and self.is_public(node.name)]
        class_defs = {}
        for x in classes:
            class_defs[x.name] = {}
            methods = []
            for y in x.body:
                if type(y) == ast.FunctionDef and self.is_public(y.name):
                    methods.append(y.name)
            class_defs[x.name]["methods"] = methods
        return class_defs

    def get_functions(self, source):
        parsed = ast.parse(source)
        functions = [node for node in ast.walk(parsed) if self.is_function(node) and self.is_public(node.name)]
        functions = [x.name for x in functions]
        return functions

    def get_filenames(self, directory):
        files = []
        tree = os.walk(directory, topdown=True, followlinks=False)
        for dirpath, dirnames, filenames in tree:
            for folder in self.exclude:
                if folder in dirpath:
                    break
            else:
                for name in filenames:
                    if name.endswith(".py") and not name.startswith("_"):
                        files.append(dirpath + "/" + name)
        return files

    def get_files_dict(self, filenames):
        files_dict = {}
        for x in filenames:
            with open(x, "r") as f:
                source = f.read()
                files_dict[x] = {"classes": {}, "functions": []}
                files_dict[x]["classes"] = self.get_classes(source)
                files_dict[x]["functions"] = self.get_functions(source)
        return files_dict

    def dump_yaml(self, output_file):
        files = self.get_filenames(self.directory)
        files_dict = self.get_files_dict(files)
        with open(output_file, "w") as stream:
            yaml.dump(files_dict, stream, default_flow_style=False)


api_crawler = APICrawler
