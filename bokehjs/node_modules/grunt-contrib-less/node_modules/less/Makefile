#
# Run all tests
#
test: 
	node test/less-test.js

#
# Run benchmark
#
benchmark:
	node benchmark/less-benchmark.js

#
# Build less.js
#
SRC = lib/less
HEADER = build/header.js
VERSION = `cat package.json | grep version \
														| grep -o '[0-9]\.[0-9]\.[0-9]\+'`
DIST = dist/less-${VERSION}.js
RHINO = dist/less-rhino-${VERSION}.js
DIST_MIN = dist/less-${VERSION}.min.js

browser-prepare: DIST := test/browser/less.js

alpha: DIST := dist/less-${VERSION}-alpha.js
alpha: DIST_MIN := dist/less-${VERSION}-alpha.min.js

beta: DIST := dist/less-${VERSION}-beta.js
beta: DIST_MIN := dist/less-${VERSION}-beta.min.js

less:
	@@mkdir -p dist
	@@touch ${DIST}
	@@cat ${HEADER} | sed s/@VERSION/${VERSION}/ > ${DIST}
	@@echo "(function (window, undefined) {" >> ${DIST}
	@@cat build/require.js\
	      ${SRC}/parser.js\
	      ${SRC}/functions.js\
	      ${SRC}/colors.js\
	      ${SRC}/tree/*.js\
	      ${SRC}/tree.js\
	      ${SRC}/env.js\
	      ${SRC}/visitor.js\
	      ${SRC}/import-visitor.js\
	      ${SRC}/join-selector-visitor.js\
	      ${SRC}/extend-visitor.js\
	      ${SRC}/browser.js\
	      build/amd.js >> ${DIST}
	@@echo "})(window);" >> ${DIST}
	@@echo ${DIST} built.
	
browser-prepare: less
	node test/browser-test-prepare.js
	
browser-test: browser-prepare
	phantomjs test/browser/phantom-runner.js

browser-test-server: browser-prepare
	phantomjs test/browser/phantom-runner.js --no-tests

rhino:
	@@mkdir -p dist
	@@touch ${RHINO}
	@@cat build/require-rhino.js\
	      ${SRC}/parser.js\
	      ${SRC}/env.js\
	      ${SRC}/visitor.js\
	      ${SRC}/import-visitor.js\
	      ${SRC}/join-selector-visitor.js\
	      ${SRC}/extend-visitor.js\
	      ${SRC}/functions.js\
	      ${SRC}/colors.js\
	      ${SRC}/tree/*.js\
	      ${SRC}/tree.js\
	      ${SRC}/rhino.js > ${RHINO}
	@@echo ${RHINO} built.

min: less
	@@echo minifying...
	@@uglifyjs ${DIST} > ${DIST_MIN}
	@@echo ${DIST_MIN} built.

alpha: min

beta: min

alpha-release: alpha
	git add dist/*.js
	git commit -m "Update alpha ${VERSION}"

dist: min rhino
	git add dist/*
	git commit -a -m "(dist) build ${VERSION}"
	git archive master --prefix=less/ -o less-${VERSION}.tar.gz
	npm publish less-${VERSION}.tar.gz

stable:
	npm tag less@${VERSION} stable


.PHONY: test benchmark
