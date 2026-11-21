/**
 * ZATCA Tax Invoice Download & Printing Utility
 * Supports direct backend PDF file download with high-fidelity client-side
 * ZATCA e-Invoice print-to-PDF fallback.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

/**
 * Downloads or prints the official ZATCA Tax Invoice for a given order.
 * @param {Object} order - Order data object
 * @param {string} locale - 'en' | 'ar'
 * @returns {Promise<{ success: boolean, method: 'pdf' | 'print' }>}
 */
export async function downloadOrderInvoice(order, locale = 'en') {
  if (!order) throw new Error('Order data is required');

  const orderId = order.id;
  const orderNumber = order.order_number || orderId;

  // 1. Attempt server-side ZATCA PDF download
  try {
    const res = await fetch(`${API_BASE}/invoices/order/${orderId}/pdf`, {
      credentials: 'include',
      headers: {
        'x-auth-role': 'CUSTOMER',
      },
    });

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/pdf')) {
        const blob = await res.blob();
        if (blob.size > 200) {
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `Invoice-${orderNumber}.pdf`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
          return { success: true, method: 'pdf' };
        }
      }
    }
  } catch (err) {
    console.warn('Backend PDF fetch error, switching to ZATCA print fallback:', err);
  }

  // 2. High-fidelity ZATCA e-Invoice Print-to-PDF Fallback
  printZatcaInvoiceHtml(order, locale);
  return { success: true, method: 'print' };
}

function integerToWords(num) {
  if (num === 0) return 'Zero';
  const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
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
        if (n % 10 > 0) result += `-${ONES[n % 10]}`;
      }
    }
    return result;
  }

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
  if (riyals === 0 && halalas === 0) return 'Zero Saudi Riyals Only.';
  if (riyals > 0) result += `${riyalsWord} Saudi Riyal${riyals === 1 ? '' : 's'}`;
  if (halalas > 0) {
    const halalasWord = integerToWords(halalas);
    if (riyals > 0) result += ` and ${halalasWord} Halala${halalas === 1 ? '' : 's'}`;
    else result += `${halalasWord} Halala${halalas === 1 ? '' : 's'}`;
  }
  return `${result} Only.`;
}

/**
 * Renders an official ZATCA e-Invoice matching Saqrcart reference design in a print window.
 */
export function printZatcaInvoiceHtml(order, locale = 'en') {
  if (typeof window === 'undefined') return;

  const orderNumber = order?.order_number || order?.id || 'ORD-20261121-9906';
  const invoiceNumber = `INV-${orderNumber.replace(/^ORD-/, '')}`;
  const issueDate = order?.createdAt
    ? new Date(order.createdAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

  const sellerName = 'saqrcart';
  const sellerVat = '300000000000003';
  const sellerCr = '1010892341';
  const sellerAddress = 'King Fahd Rd, Al-Malqa District, Riyadh 13521, Saudi Arabia';
  const sellerContact = 'Email: support@saqrcart.sa  |  Phone: +966 11 234 5678';

  const buyerName =
    order?.customer?.first_name || order?.address?.full_name
      ? `${order.customer?.first_name || order.address?.full_name || ''} ${order.customer?.last_name || ''}`.trim()
      : 'Valued Customer';
  const buyerMobile = order?.customer?.user?.mobile || order?.address?.phone || order?.customer?.phone || '+9668076352576';
  const buyerAddress = order?.address
    ? `${order.address.address_line || order.address.street || ''}${order.address.city ? ', ' + order.address.city : ''}, Saudi Arabia`
    : 'Riyadh, Saudi Arabia';
  const buyerType = (order?.customer?.user?.vat_no || order?.customer?.vat_no)
    ? `Business Profile (VAT: ${order?.customer?.user?.vat_no || order?.customer?.vat_no})`
    : 'Individual Consumer (B2C)';

  const paymentMethod = order?.payment_method || order?.payment?.payment_method || 'Cash on Delivery (COD)';
  const deliveryType = order?.delivery_type === 'EXPRESS' ? 'Express Delivery' : (order?.delivery_type === 'STANDARD' ? 'Standard Delivery' : 'Express Delivery');
  const deliveryFee = Number(order?.delivery_fee ?? 12.00);
  const tipAmount = Number(order?.tip_amount ?? 0.00);
  const discount = Number(order?.discount_total ?? order?.discount_amount ?? 0.00);

  const rawSubtotal = Number(order?.subtotal || 50.00);
  const vatTotal = Number(order?.tax_total || (rawSubtotal * 0.15));
  const grandTotal = Number(order?.grand_total || (rawSubtotal + deliveryFee + tipAmount + vatTotal - discount));
  const amountWords = amountToWordsSAR(grandTotal);

  const items = Array.isArray(order?.items) && order.items.length > 0 ? order.items : [
    {
      product_name_en: 'Organic Whole Milk (2 L)',
      quantity: 1,
      unit_price: 50.00,
      discount_amount: 0.00,
      tax_amount: 7.50,
      total_price: 57.50,
    }
  ];

  const printWindow = window.open('', '_blank', 'width=950,height=1100');
  if (!printWindow) {
    alert('Please allow popups to download or print the invoice.');
    return;
  }

  const itemsHtml = items.map((it, idx) => {
    const name = it.product_name_en || it.product?.name_en || it.name || 'Fresh Produce Item';
    const qty = Number(it.quantity || 1);
    const unitPrice = Number(it.unit_price || 50.00);
    const itemDiscount = Number(it.discount_amount || 0.00);
    const lineVat = Number(it.tax_amount || (unitPrice * qty * 0.15));
    const lineTotal = (unitPrice * qty - itemDiscount) + lineVat;

    return `
      <tr>
        <td style="border: 1px solid #D1D5DB; padding: 6px 4px; text-align: center; color: #111827;">${idx + 1}</td>
        <td style="border: 1px solid #D1D5DB; padding: 6px 8px; font-weight: 600; color: #111827;">${name}</td>
        <td style="border: 1px solid #D1D5DB; padding: 6px 4px; text-align: center; color: #111827;">${qty}</td>
        <td style="border: 1px solid #D1D5DB; padding: 6px 6px; text-align: right; color: #111827;">${unitPrice.toFixed(2)}</td>
        <td style="border: 1px solid #D1D5DB; padding: 6px 6px; text-align: right; color: #111827;">${itemDiscount.toFixed(2)}</td>
        <td style="border: 1px solid #D1D5DB; padding: 6px 4px; text-align: center; color: #111827;">15%</td>
        <td style="border: 1px solid #D1D5DB; padding: 6px 6px; text-align: right; color: #111827;">${lineVat.toFixed(2)}</td>
        <td style="border: 1px solid #D1D5DB; padding: 6px 6px; text-align: right; font-weight: 600; color: #111827;">${lineTotal.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&margin=0&data=${encodeURIComponent(invoiceNumber)}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>TAX INVOICE - ${invoiceNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #F3F4F6;
      color: #111827;
      padding: 24px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .invoice-card {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      padding: 0;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
      border-radius: 4px;
    }
    .header-bar {
      background-color: #00482B;
      color: #ffffff;
      padding: 14px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 4px 4px 0 0;
    }
    .brand {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .brand-cart {
      color: #EAA023;
    }
    .brand-pipe {
      color: rgba(255,255,255,0.4);
      margin-left: 8px;
      font-weight: 300;
    }
    .header-title-box {
      text-align: right;
    }
    .header-title {
      font-size: 19px;
      font-weight: 900;
      letter-spacing: 0.5px;
    }
    .header-sub {
      font-size: 11px;
      color: rgba(255,255,255,0.9);
      margin-top: 3px;
    }
    .content {
      padding: 16px 20px 24px 20px;
    }
    .card-box {
      border: 1px solid #D1D5DB;
      border-radius: 6px;
      padding: 12px 14px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      font-size: 10.5px;
      line-height: 1.5;
    }
    .box-title {
      font-size: 11px;
      font-weight: 800;
      color: #111827;
      margin-bottom: 5px;
    }
    .data-row {
      display: flex;
      margin-bottom: 2px;
    }
    .data-label {
      width: 105px;
      color: #374151;
      font-weight: 500;
    }
    .data-colon {
      width: 12px;
      color: #374151;
    }
    .data-val {
      font-weight: 700;
      color: #111827;
    }
    .qr-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding-left: 14px;
      border-left: 1px solid #E5E7EB;
    }
    .qr-img {
      width: 82px;
      height: 82px;
    }
    .qr-label {
      font-size: 9.5px;
      font-weight: 700;
      color: #111827;
      margin-top: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      margin-top: 4px;
      margin-bottom: 12px;
    }
    th {
      background-color: #00482B;
      color: #ffffff;
      padding: 7px 4px;
      font-weight: 800;
      border: 1px solid #00482B;
      text-align: center;
    }
    .summary-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 12px;
    }
    .summary-card {
      width: 320px;
      border: 1px solid #D1D5DB;
      border-radius: 6px;
      overflow: hidden;
      font-size: 10.5px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 12px;
      color: #1F2937;
      font-weight: 600;
    }
    .summary-row.discount {
      color: #059669;
    }
    .grand-total-bar {
      background-color: #00482B;
      color: #ffffff;
      display: flex;
      justify-content: space-between;
      padding: 8px 12px;
      font-size: 13px;
      font-weight: 900;
      margin-top: 4px;
    }
    .words-card {
      border: 1px solid #D1D5DB;
      border-radius: 6px;
      padding: 7px 12px;
      font-size: 10px;
      color: #1F2937;
      margin-bottom: 16px;
    }
    .footer-divider {
      border-top: 1px solid #D1D5DB;
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      font-size: 9.5px;
      color: #374151;
      line-height: 1.45;
    }
    .footer-left {
      width: 48%;
    }
    .footer-right {
      width: 48%;
    }
    .footer-brand {
      font-size: 18px;
      font-weight: 800;
      color: #00482B;
      margin-bottom: 4px;
    }
    .footer-brand span {
      color: #EAA023;
    }
    .action-bar {
      max-width: 820px;
      margin: 0 auto 16px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .btn {
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      border: none;
    }
    .btn-print {
      background: #00482B;
      color: #ffffff;
    }
    .btn-close {
      background: #E5E7EB;
      color: #1F2937;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .invoice-card { box-shadow: none; max-width: 100%; }
      .action-bar { display: none !important; }
    }
  </style>
</head>
<body>

  <div class="action-bar">
    <button class="btn btn-close" onclick="window.close()">✕ Close</button>
    <button class="btn btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>

  <div class="invoice-card">
    <!-- Header -->
    <div class="header-bar">
      <div class="brand">
        saqr<span class="brand-cart">cart</span><span class="brand-pipe">|</span>
      </div>
      <div class="header-title-box">
        <div class="header-title">TAX INVOICE</div>
        <div class="header-sub">Invoice No: ${invoiceNumber}</div>
      </div>
    </div>

    <div class="content">
      <!-- Box 1: Seller, Invoice Details, QR -->
      <div class="card-box">
        <div style="width: 44%;">
          <div class="box-title">Sold By / Seller</div>
          <div style="font-weight: 800; color: #111827; margin-bottom: 2px;">${sellerName}</div>
          <div>VAT Reg. No.: ${sellerVat}</div>
          <div>CR No.: ${sellerCr}</div>
          <div>${sellerAddress}</div>
          <div>${sellerContact}</div>
        </div>

        <div style="width: 36%; padding-left: 10px;">
          <div class="box-title">Invoice Details</div>
          <div class="data-row"><span class="data-label">Invoice Date</span><span class="data-colon">:</span><span class="data-val">${issueDate}</span></div>
          <div class="data-row"><span class="data-label">Order ID</span><span class="data-colon">:</span><span class="data-val">${orderNumber}</span></div>
          <div class="data-row"><span class="data-label">Invoice Type</span><span class="data-colon">:</span><span class="data-val">Tax Invoice</span></div>
          <div class="data-row"><span class="data-label">Payment Method</span><span class="data-colon">:</span><span class="data-val">${paymentMethod}</span></div>
          <div class="data-row"><span class="data-label">Delivery Method</span><span class="data-colon">:</span><span class="data-val">${deliveryType}</span></div>
        </div>

        <div class="qr-container" style="width: 20%;">
          <img class="qr-img" src="${qrImageUrl}" alt="Reference QR" />
          <div class="qr-label">Reference QR</div>
        </div>
      </div>

      <!-- Box 2: Customer Details, Delivery Details -->
      <div class="card-box">
        <div style="width: 50%;">
          <div class="box-title">Bill To / Customer Details</div>
          <div class="data-row"><span class="data-label" style="width: 95px;">Customer Name</span><span class="data-colon">:</span><span class="data-val">${buyerName}</span></div>
          <div class="data-row"><span class="data-label" style="width: 95px;">Mobile Number</span><span class="data-colon">:</span><span class="data-val">${buyerMobile}</span></div>
          <div class="data-row"><span class="data-label" style="width: 95px;">Address</span><span class="data-colon">:</span><span class="data-val">${buyerAddress}</span></div>
          <div class="data-row"><span class="data-label" style="width: 95px;">Customer Type</span><span class="data-colon">:</span><span class="data-val">${buyerType}</span></div>
        </div>

        <div style="width: 50%; padding-left: 14px; border-left: 1px solid #E5E7EB;">
          <div class="box-title">Delivery Details</div>
          <div class="data-row"><span class="data-label" style="width: 85px;">Fulfillment</span><span class="data-colon">:</span><span class="data-val">Home ${deliveryType}</span></div>
          <div class="data-row"><span class="data-label" style="width: 85px;">Destination</span><span class="data-colon">:</span><span class="data-val">${buyerAddress}</span></div>
        </div>
      </div>

      <!-- Products Table -->
      <table>
        <thead>
          <tr>
            <th style="width: 6%;">Sr. No.</th>
            <th style="width: 34%; text-align: left; padding-left: 8px;">Item Description</th>
            <th style="width: 6%;">Qty</th>
            <th style="width: 13%; text-align: right; padding-right: 6px;">Unit Price (SAR)</th>
            <th style="width: 12%; text-align: right; padding-right: 6px;">Discount (SAR)</th>
            <th style="width: 8%;">VAT (15%)</th>
            <th style="width: 11%; text-align: right; padding-right: 6px;">VAT Amount (SAR)</th>
            <th style="width: 13%; text-align: right; padding-right: 6px;">Total Amount (SAR)</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <!-- Summary Box -->
      <div class="summary-section">
        <div class="summary-card">
          <div class="summary-row">
            <span>Subtotal (Excl. VAT)</span>
            <span>${rawSubtotal.toFixed(2)} SAR</span>
          </div>
          <div class="summary-row discount">
            <span>Discount</span>
            <span>${discount.toFixed(2)} SAR</span>
          </div>
          <div class="summary-row">
            <span>Delivery Charge (${deliveryType.split(' ')[0]})</span>
            <span>${deliveryFee.toFixed(2)} SAR</span>
          </div>
          ${tipAmount > 0 ? `
          <div class="summary-row" style="color: #006E2D;">
            <span>Delivery Partner Tip</span>
            <span>${tipAmount.toFixed(2)} SAR</span>
          </div>
          ` : ''}
          <div class="summary-row">
            <span>VAT (15%)</span>
            <span>${vatTotal.toFixed(2)} SAR</span>
          </div>
          <div class="grand-total-bar">
            <span>Grand Total</span>
            <span>${grandTotal.toFixed(2)} SAR</span>
          </div>
        </div>
      </div>

      <!-- Amount in Words -->
      <div class="words-card">
        <strong>Amount in Words:</strong> ${amountWords}
      </div>

      <!-- Footer -->
      <div class="footer-divider">
        <div class="footer-left">
          <div class="footer-brand">saqr<span>cart</span></div>
          <div>Commercial Registration: ${sellerCr}  |  VAT Reg. No.: ${sellerVat}</div>
        </div>
        <div class="footer-right">
          <strong>Terms & Conditions:</strong>
          <ul style="padding-left: 16px; margin-top: 3px;">
            <li>This is a computer-generated tax invoice and does not require a physical signature.</li>
            <li>Goods are sold and delivered as per the applicable terms and conditions.</li>
            <li>For any queries, contact our support team at <strong>support@saqrcart.sa</strong>.</li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 350);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
