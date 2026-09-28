// Indian Currency Number to Words converter
export function numberToWords(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Zero Only';
  const num = Math.round(Number(amount) * 100) / 100;
  if (num === 0) return 'Zero Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertLessThanOneThousand(n) {
    if (n === 0) return '';
    if (n < 20) return a[n] + ' ';
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '') + ' ';
    return a[Math.floor(n / 100)] + ' Hundred ' + convertLessThanOneThousand(n % 100);
  }

  const parts = num.toString().split('.');
  let integerPart = parseInt(parts[0], 10);
  const decimalPart = parts[1] ? parseInt(parts[1].substring(0, 2).padEnd(2, '0'), 10) : 0;

  let words = '';

  const crore = Math.floor(integerPart / 10000000);
  integerPart %= 10000000;
  if (crore > 0) {
    words += convertLessThanOneThousand(crore).trim() + ' Crore ';
  }

  const lakh = Math.floor(integerPart / 100000);
  integerPart %= 100000;
  if (lakh > 0) {
    words += convertLessThanOneThousand(lakh).trim() + ' Lakh ';
  }

  const thousand = Math.floor(integerPart / 1000);
  integerPart %= 1000;
  if (thousand > 0) {
    words += convertLessThanOneThousand(thousand).trim() + ' Thousand ';
  }

  if (integerPart > 0) {
    words += convertLessThanOneThousand(integerPart).trim() + ' ';
  }

  words = words.trim();

  let result = words ? words : 'Zero';
  if (decimalPart > 0) {
    result += ' and ' + convertLessThanOneThousand(decimalPart).trim() + ' Paise';
  }
  return result + ' Only';
}
