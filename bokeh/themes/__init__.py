
from os.path import join
import yaml

default = yaml.load(open(join(__path__[0], "default.yaml")))

del join, yaml
