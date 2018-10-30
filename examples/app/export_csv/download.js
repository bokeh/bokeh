function table_to_csv(data_table) {
    var columns = Object.keys(data_table)
    var nrows = data_table[columns[0]].length
    var lines = [columns.join(',')]

    for (var i = 0; i < nrows; i++) {
        var row = [];
        for (var j = 0; j < columns.length; j++) {
            var column = columns[j]
            row.push(data_table[column][i].toString())
        }
        lines.push(row.join(','))
    }
    filetext = lines.join('\n').concat('\n')
    return filetext
}


var data = source.data
var filetext = table_to_csv(data)
var filename = 'data_result.csv'
var blob = new Blob([filetext], { type: 'text/csv;charset=utf-8;' })

//addresses IE
if (navigator.msSaveBlob) {
    navigator.msSaveBlob(blob, filename)
} else {
    var link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.target = "_blank"
    link.style.visibility = 'hidden'
    link.dispatchEvent(new MouseEvent('click'))
}
