import sys

from conda_build import api

section = {
    'build': 'requirements/build',
    'run':   'requirements/run',
    'test':  'test/requires',
}

names = set(sys.argv[1:])

if not all(name in section for name in names):
    print("Got unknown section name. Valid section names are: build, run, or test")
    sys.exit(1)

metadata, _, _ = api.render('conda.recipe')

deps = ""

for name in sys.argv[1:]:
    deps += " ".join(s.replace(" ", "") for s in metadata.get_value(section[name])) + " "

print(deps)
