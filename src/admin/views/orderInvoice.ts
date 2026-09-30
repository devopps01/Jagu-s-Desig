import { formatPrice } from '@web/data/catalog'

export type InvoiceOrder = {
  id: string
  orderNo: string
  invoiceNo: string
  status: string
  payment: string
  total: number
  subtotal: number
  shipping: number
  productSavings: number
  discountCode: string
  discountAmount: number
  sisterName: string
  sisterDiscountAmount: number
  gstEnabled?: boolean
  gstRate?: number
  gstAmount?: number
  gstLabel?: string
  items: { title: string; qty: number; unit: number; mrp: number; lineTotal: number }[]
  customer: {
    name: string
    phone: string
    address: string
    locality?: string
    city: string
    state?: string
    pincode: string
  }
  userEmail?: string
  paymentMethodTitle?: string
  paymentMethodType?: string
  razorpayOrderId?: string
  razorpayPaymentId?: string
  cancelRequestStatus?: string
  returnRequestStatus?: string
  createdAt: string | Date
}

const money = (value: number) => formatPrice(value || 0)

export const invoiceHtml = (order: InvoiceOrder, kind: 'invoice' | 'slip' = 'invoice') => {
  const date = new Date(order.createdAt).toLocaleString('en-IN')
  const address = [order.customer.address, order.customer.locality, order.customer.city, order.customer.state, order.customer.pincode]
    .filter(Boolean)
    .join(', ')
  const title = kind === 'slip' ? 'Packing slip' : 'Tax invoice / Bill'
  const rows = order.items
    .map(
      (item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${item.title}</td>
        <td>${item.qty}</td>
        <td>${money(item.mrp || item.unit)}</td>
        <td>${money(item.unit)}</td>
        <td>${money(item.lineTotal)}</td>
      </tr>`
    )
    .join('')

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title} ${order.invoiceNo || order.orderNo}</title>
  <style>
    body { font-family: Georgia, serif; color: #2b1a12; margin: 32px; }
    h1 { font-size: 28px; margin: 0; }
    .muted { color: #6d584c; font-size: 13px; }
    .row { display: flex; justify-content: space-between; gap: 24px; margin: 24px 0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border-bottom: 1px solid #eadfd4; padding: 8px; text-align: left; font-size: 13px; }
    th { text-transform: uppercase; letter-spacing: .08em; font-size: 11px; }
    td:nth-child(n+3), th:nth-child(n+3) { text-align: right; }
    .totals { width: 320px; margin-left: auto; }
    .totals p { display: flex; justify-content: space-between; margin: 6px 0; }
    .grand { font-size: 18px; font-weight: 700; border-top: 1px solid #2b1a12; padding-top: 8px; }
    @media print { button { display: none !important; } body { margin: 12px; } }
  </style>
</head>
<body>
  <div class="row">
    <div>
      <h1>Jagu's Designing</h1>
      <p class="muted">Jagu's Designing Collections<br/>93, Ambika Nagar Society, Mahadev Chowk, Mota Varachha<br/>Surat, Gujarat 394101, India<br/>Phone: (+91) 8154 0000 63</p>
    </div>
    <div>
      <strong>${title}</strong>
      <p class="muted">Order ${order.orderNo}<br/>Invoice ${order.invoiceNo || '-'}<br/>${date}<br/>Payment: ${order.paymentMethodTitle || order.payment.toUpperCase()} · ${order.payment.toUpperCase()}${order.razorpayPaymentId ? `<br/>Razorpay ${order.razorpayPaymentId}` : ''} · ${order.status}</p>
    </div>
  </div>
  <div class="row">
    <div>
      <strong>Bill to</strong>
      <p class="muted">${order.customer.name}<br/>${order.customer.phone}${order.userEmail ? `<br/>${order.userEmail}` : ''}<br/>${address}</p>
    </div>
    ${order.sisterName ? `<div><strong>Referral sister</strong><p class="muted">${order.sisterName}</p></div>` : ''}
  </div>
  <table>
    <thead>
      <tr><th>#</th><th>Item</th><th>Qty</th><th>MRP</th><th>Rate</th><th>Amount</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals">
    ${order.productSavings ? `<p><span>Product discount</span><span>− ${money(order.productSavings)}</span></p>` : ''}
    <p><span>Item total</span><span>${money(order.subtotal)}</span></p>
    ${order.discountAmount ? `<p><span>Coupon ${order.discountCode || ''}</span><span>− ${money(order.discountAmount)}</span></p>` : ''}
    ${order.sisterDiscountAmount ? `<p><span>Sister offer</span><span>− ${money(order.sisterDiscountAmount)}</span></p>` : ''}
    <p><span>Shipping</span><span>${order.shipping ? money(order.shipping) : 'Free'}</span></p>
    ${order.gstAmount ? `<p><span>${order.gstLabel || 'GST'}${order.gstRate ? ` (${order.gstRate}%)` : ''}</span><span>${money(order.gstAmount)}</span></p>` : ''}
    <p class="grand"><span>To pay</span><span>${money(order.total)}</span></p>
  </div>
  <p class="muted">${order.paymentMethodTitle || 'Cash on delivery'} unless marked paid. This bill is generated automatically with the order.</p>
</body>
</html>`
}

export const printInvoice = (order: InvoiceOrder, kind: 'invoice' | 'slip' = 'invoice') => {
  const popup = window.open('', '_blank', 'width=900,height=1000')

  if (!popup) return

  popup.document.write(invoiceHtml(order, kind))
  popup.document.close()
  popup.focus()
  popup.print()
}
