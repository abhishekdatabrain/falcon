/**
 * Converts a numeric amount to English words formatted specifically for Saudi Riyals (SAR) and Halalas.
 * Example: 71.30 -> "Seventy-One Saudi Riyals and Thirty Halalas Only."
 */

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
];

function convertLessThanOneThousand(n) {
  let result = '';
  if (n >= 100) {
    result += `${ONES[Math.floor(n / 100)]} Hundred`;
    n %= 100;
    if (n > 0) result += ' ';
  }
  if (n > 0) {
    if (n < 20) {
      result += ONES[n];
    } else {
      result += TENS[Math.floor(n / 10)];
      if (n % 10 > 0) {
        result += `-${ONES[n % 10]}`;
      }
    }
  }
  return result;
}

function integerToWords(num) {
  if (num === 0) return 'Zero';

  const billions = Math.floor(num / 1000000000);
  num %= 1000000000;
  const millions = Math.floor(num / 1000000);
  num %= 1000000;
  const thousands = Math.floor(num / 1000);
  const remainder = num % 1000;

  const parts = [];
  if (billions) parts.push(`${convertLessThanOneThousand(billions)} Billion`);
  if (millions) parts.push(`${convertLessThanOneThousand(millions)} Million`);
  if (thousands) parts.push(`${convertLessThanOneThousand(thousands)} Thousand`);
  if (remainder) parts.push(convertLessThanOneThousand(remainder));

  return parts.join(' ');
}

function amountToWordsSAR(amount) {
  const numericAmount = Math.max(0, Number(amount || 0));
  const riyals = Math.floor(numericAmount);
  const halalas = Math.round((numericAmount - riyals) * 100);

  const riyalsWord = integerToWords(riyals);
  let result = '';

  if (riyals === 0 && halalas === 0) {
    return 'Zero Saudi Riyals Only.';
  }

  if (riyals > 0) {
    result += `${riyalsWord} Saudi Riyal${riyals === 1 ? '' : 's'}`;
  }

  if (halalas > 0) {
    const halalasWord = integerToWords(halalas);
    if (riyals > 0) {
      result += ` and ${halalasWord} Halala${halalas === 1 ? '' : 's'}`;
    } else {
      result += `${halalasWord} Halala${halalas === 1 ? '' : 's'}`;
    }
  }

  return `${result} Only.`;
}

module.exports = {
  amountToWordsSAR,
};
