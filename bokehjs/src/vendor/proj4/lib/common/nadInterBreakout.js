module.exports = function(indx, frct, letter, number, ct) {
  var inx;
  if (indx[letter] < 0) {
    if (!(indx[letter] === -1 && frct[letter] > 0.99999999999)) {
      return false;
    }
    indx[letter]++;
    frct[letter] = 0;
  }
  else {
    inx = indx[letter] + 1;
    if (inx >= ct.lim[number]) {
      if (!(inx === ct.lim[number] && frct[letter] < 1e-11)) {
        return false;
      }
      if (letter === 'x') {
        indx[letter]--;
      }
      else {
        indx[letter]++;
      }
      frct[letter] = 1;
    }
  }
  return [indx, frct];
};