function test(){
    conda install $(python scripts/deps.py run test).split() | % {$_}
    bokeh sampledata
}

test
