(function() {
    var start = function() {
        var req = new XMLHttpRequest();
        req.open("POST", "http://localhost:50060/notifications");

        req.onload = function() {
            if (req.status != 200) {
                setTimeout(function() { start() }, 1000);
            } else {
                var dataList = JSON.parse(req.responseText);

                for (var i = 0; i < dataList.length; i++) {
                    var data = dataList[i];

                    switch (data[0]) {
                        case "print":
                            console[data[1]](data[2]);
                            break;
                        case "reload":
                            console.log("Reloading page ...");
                            location.reload();
                            break;
                    }
                }
                start();
            }
        }
        req.send();
    }
    start();
})();
