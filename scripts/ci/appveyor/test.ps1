function test(){
    conda install $(python scripts/deps.py run test).split() | % {$_}
    conda install phantomjs
    bokeh sampledata
}

test
