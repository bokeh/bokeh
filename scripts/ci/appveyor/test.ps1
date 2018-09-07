function test_error($error, $message){
	if(-NOT  ($error -eq 0)){
		throw $message
	}
}

function test(){
	conda install $(python scripts/deps.py run test).split() | where {$_}
	conda install -c conda-forge pillow #pillow from default channels raise ImportError: DLL load failed
	
	bokeh info
	test_error $LastExitCode "Error to get bokeh info"
}

test
