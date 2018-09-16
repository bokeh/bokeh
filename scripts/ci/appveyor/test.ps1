function test(){
	conda install $(python scripts/deps.py run test).split() | % {$_}
	conda install -c conda-forge pillow #pillow from default channels raise ImportError: DLL load failed
}

test
