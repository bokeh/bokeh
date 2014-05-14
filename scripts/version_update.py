import os
import re
import sys

def replace(verNum):
	target_files = {
		"../bokehjs/src/coffee/main.coffee" : ("Bokeh\.version",),
		"../sphinx/source/conf.py" : ("version", "release")
	}

	for target, keys in target_files.items():
		if os.path.exists(target):
			f = open(target, "r")
			text = f.read()
			f.close()

			for key in keys:
				pattern = re.search(r"(%s = '.*')" % key, text)
				if pattern:
					f = open(target, "w")
					# Remove '\' that escapes the '.' in Bokeh.version as a regex
					text = re.sub(pattern.group(1), "%s = '%s'" % (key.replace('\\', '') ,verNum), text) 
					f.write(text)
					f.close()
				else:
					print "Expected 'version' string not found in %s" % target

		else:
			print "%s not found." % target



if __name__ == '__main__':
    if len(sys.argv) == 2:

    	abspath = os.path.abspath(__file__)
    	dname = os.path.dirname(abspath)
    	os.chdir(dname)

        version = sys.argv[1]
        replace(version)
    else:
        print "Please supply a version number."
        sys.exit(1)