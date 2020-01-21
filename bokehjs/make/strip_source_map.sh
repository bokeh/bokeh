find "$1" -type f -print0 -name '*.js' | xargs -0 sed -i '' -e 's/sourceMappingURL=[^ ]*\.map//g'
