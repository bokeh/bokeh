import Int = Bokeh.Int;

export function transpose<T>(array: Array<Array<T>>): Array<Array<T>> {
    let rows = array.length;
    let cols = array[0].length;

    let transposed: Array<Array<T>> = [];

    for (let j = 0; j < cols; j++) {
        transposed[j] = [];

        for (let i = 0; i < rows; i++) {
            transposed[j][i] = array[i][j];
        }
    }

    return transposed;
}

export function linspace(a: number, b: number, length: Int = 100): Array<number> {
    let increment = (b - a) / (length - 1);
    let array = new Array(length);

    for (let i = 0; i < length; i++) {
        array[i] = a + increment*i;
    }

    return array;
}
