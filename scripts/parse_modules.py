import ast, os
import yaml


__all__ = ["api_crawler", "differ"]


def differ(old_version, new_version):
    with open(old_version, "r") as f:
        old = f.read()
    with open(new_version, "r") as f:
        new = f.read()
    old_version = yaml.load(old)
    new_version = yaml.load(new)
    union = []
    diff = []

    files_union = set(old_version) & set(new_version)
    files_diff = set(old_version) - set(new_version)

    union += list(files_union)
    diff += list(files_diff)

    classes_old = [{x: {"classes": list(old_version[x]["classes"].keys())}} for x in files_union]
    classes_new = [{x: {"classes": list(new_version[x]["classes"].keys())}} for x in files_union]
    for x, y in zip(classes_old, classes_new):
        assert(x.keys() == y.keys())
        old_value = list(x.values())[0]["classes"]
        new_value = list(y.values())[0]["classes"]
        x[list(x.keys())[0]] = dict(classes=list(set(old_value) & set(new_value)))
        y[list(y.keys())[0]] = dict(classes=list(set(old_value) - set(new_value)))
    classes_union = [x for x in classes_old if list(x.values())[0]["classes"]]
    classes_diff = [x for x in classes_new if list(x.values())[0]["classes"]]
    union += classes_union
    diff += classes_diff

    with open("diff.yaml", "w") as stream:
        yaml.dump(diff, stream, default_flow_style=False)
    return diff


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
