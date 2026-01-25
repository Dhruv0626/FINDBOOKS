export function formatIndianNumber(x) {
  if (x == null) return "";

  const fixed = Number(x).toFixed(2); // ensures two decimal places
  const num = fixed.split(".");
  let lastThree = num[0].slice(-3);
  const otherNumbers = num[0].slice(0, -3);

  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }

  const res = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
  return res + "." + num[1];
}

export function formatIndianNumberWithoutDecimal(x) {
  if (x == null) return "";

  const numStr = Math.floor(Number(x)).toString();
  let lastThree = numStr.slice(-3);
  const otherNumbers = numStr.slice(0, -3);

  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }

  const res = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
  return res;
}
