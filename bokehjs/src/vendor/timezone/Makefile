continents = africa antarctica asia australasia europe \
	northamerica southamerica etcetera backward

zone_sources = $(continents:%=eggert/tz/%)
olson_as_json = $(continents:%=build/olson/%.js)
root_sources = package.json README.md CHANGELOG
src_sources = synopsis.js rfc822.js loaded.js .npmignore
locale_sources = $(wildcard src/locales/*.js)

root_targets = $(root_sources:%=build/timezone/%)
src_targets = $(src_sources:%=build/timezone/%)
locale_targets = $(locale_sources:src/locales/%=build/timezone/%)

# GNU `make` will build and rebuild `build/Makefile.deps` when it is out of
# date. See the **The GNU `make include` Directive** section of [Advanced
# Auto-Dependency Generation](http://make.paulandlesley.org/autodep.html) for
# details.
-include build/Makefile.deps

zoneinfo_files = $(timezones:%=build/zoneinfo/%)

olson = $(olson_as_json:build/olson/%.js=eggert/tz/%)

all: $(root_targets) $(src_targets) $(locale_targets) \
	build/timezone/index.js \
	build/timezone/locales.js build/timezone/zones.js \
	build/timezone/America/Detroit.js \
	$(zoneinfo_files) \
	build/transitions.txt

zic: eggert/tz/zic

$(locale_targets): build/timezone/%: src/locales/%
	mkdir -p build/timezone
	cp $< $@

build/timezone/zones.js: src/common_index.js
	mkdir -p build/timezone
	cp $< $@
	cp $< $@

build/timezone/locales.js: src/common_index.js
	mkdir -p build/timezone
	cp $< $@

build/olson/index.js: src/common_index.js
	mkdir -p build/timezone
	cp $< $@

build/transitions.txt: $(olson_as_json) build/olson/index.js util/verifiable.js
	node util/verifiable.js > build/transitions.txt
	touch $@

build/timezone/America/Detroit.js: $(olson_as_json) build/olson/index.js util/zones.js
	node util/zones.js
	for dir in $$(find build/timezone -mindepth 1 -type d); do \
		cp src/common_index.js $$dir/index.js; \
	done
	touch $@

eggert/tz/zic:
	make -C eggert/tz -f Makefile	

$(zoneinfo_files): $(zone_sources)
	mkdir -p build
	@(cd eggert/tz && echo "Using zic: $$(which ./zic || which zic)")
	(cd eggert/tz && $$(which ./zic || which zic) -d ../../build/zoneinfo $(continents))

build/olson/%.js: eggert/tz/%
	mkdir -p build/olson
	node util/tz2json.js $< > $@
	touch $@

build/timezone/index.js: src/timezone.js
	mkdir -p build/timezone
	cp $< $@

$(src_targets): build/timezone/%: src/%
	mkdir -p build/timezone
	cp $< $@

$(root_targets): build/timezone/%: %
	mkdir -p build/timezone
	cp $< $@

clean:
	rm -rf build
	make -C eggert/tz -f Makefile clean

build/Makefile.deps: $(zone_sources)
	mkdir -p build
	node util/tz2deps.js $^ > $@

publish:
	make zic && make
	find . -depth \( -name .AppleDouble -o -name .DS_Store \) -exec rm -rf {} \;
	find . \( -name .AppleDouble -o -name .DS_Store \) ;
	(cd build/timezone && npm publish)

.PHONEY: publish
