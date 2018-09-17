function test_error($error, $message){
	if(-NOT  ($error -eq 0)){
		throw $message
	}
}

function test(){
	conda install $(python scripts/deps.py run test).split() | where {$_}
	conda install phantomjs
	bokeh sampledata
	
	py.test -m unit --diff-ref HEAD
	test_error $LastExitCode "Tests failure"
}

test
