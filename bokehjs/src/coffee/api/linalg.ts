import Int = Bokeh.Int;

export function transpose<T>(array: Array<Array<T>>): Array<Array<T>> {
  const rows = array.length;
  const cols = array[0].length;

  let transposed: Array<Array<T>> = [];

  for (let j = 0; j < cols; j++) {
    transposed[j] = [];

    for (let i = 0; i < rows; i++) {
      transposed[j][i] = array[i][j];
    }
  }

  return transposed;
}

export function linspace(start: number, stop: number, num: Int = 100): Array<number> {
  const step = (stop - start) / (num - 1);
  let array = new Array(num);

  for (let i = 0; i < num; i++) {
    array[i] = start + step*i;
  }

  return array;
}

export function arange(start: number, stop: number, step: number = 1): Array<number> {
  const num = Math.ceil((stop - start) / step);
  let array = new Array(num);

  for (let i = 0; i < num; i++) {
    array[i] = start + step*i;
  }

  return array;
}
