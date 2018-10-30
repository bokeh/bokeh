function table_to_csv(data_table) {
    const columns = Object.keys(data_table)
    const nrows = data_table[columns[0]].length
    const lines = [columns.join(',')]

    for (let i = 0; i < nrows; i++) {
        let row = [];
        for (let j = 0; j < columns.length; j++) {
            const column = columns[j]
            row.push(data_table[column][i].toString())
        }
        lines.push(row.join(','))
    }
    filetext = lines.join('\n').concat('\n')
    return filetext
}


const data = source.data
const filename = 'data_result.csv'
filetext = table_to_csv(data)
const blob = new Blob([filetext], { type: 'text/csv;charset=utf-8;' })

//addresses IE
if (navigator.msSaveBlob) {
    navigator.msSaveBlob(blob, filename)
} else {
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.target = '_blank'
    link.style.visibility = 'hidden'
    link.dispatchEvent(new MouseEvent('click'))
}
