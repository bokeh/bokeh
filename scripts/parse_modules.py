import ast, os
import yaml


__all__ = ["api_crawler"]


class APICrawler(object):
    exclude = ("tests", "static", "sampledata", "mplexplorer")

    def __init__(self, directory):
        self.directory = directory

    def is_private(self, name):
        if name.startswith("_", 0, 1) and name != "__init__":
            return True
        else:
            return False

    def get_filenames(self, directory):
        files = []
        p = os.walk(directory, topdown=True, followlinks=False)
        for dirpath, dirnames, filenames in p:
            for d in self.exclude:
                if d in dirpath:
                    break
            else:
                for x in filenames:
                    if x.endswith(".py") and not x.startswith("_"):
                        files.append((dirpath + "/" + x, x))
        return files

    def get_classes(self, file_path, filename):
        with open(file_path, "r") as f:
            source = f.read()
            parsed = ast.parse(source)
            classes = [node for node in ast.walk(parsed) if isinstance(node, ast.ClassDef) and not self.is_private(node.name)]
            class_defs = {}
            class_defs["classes"] = {}
            class_defs["functions"] = self.get_functions(parsed)
            for x in classes:
                class_defs["classes"][x.name] = {}
                methods = []
                for y in x.body:
                    if type(y) == ast.FunctionDef and not self.is_private(y.name):
                        methods.append(y.name)
                class_defs["classes"][x.name]["methods"] = methods
            return class_defs

    def get_functions(self, source):
        parsed = ast.parse(source)
        functions = [node for node in ast.walk(parsed) if isinstance(node, ast.FunctionDef) and not self.is_private(node.name)]
        functions = [x.name for x in functions]
        return functions

    def get_files_dict(self, filenames):
        files_dict = {}
        for x in filenames:
            files_dict[x[0]] = self.get_classes(x[0], x[1])
        return files_dict

    def dump_yaml(self, output_file):
        files = self.get_filenames(self.directory)
        files_dict = self.get_files_dict(files)
        with open(output_file, "w") as stream:
            yaml.dump(files_dict, stream, default_flow_style=False)


api_crawler = APICrawler
