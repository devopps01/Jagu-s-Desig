import { billPayments, mergedBillPayments, type RentBill } from '@admin/views/rentBill'

export type SaleRow = {
  id: string
  orderKey?: string
  productSlug?: string
  productName: string
  productImage?: string
  size: string
  quantity: number
  customerName: string
  customerPhone: string
  customerEmail?: string
  notes?: string
  productPrice: number
  finalPrice: number
  discountAmount?: number
  gstEnabled?: boolean
  gstRate?: number
  gstAmount?: number
  paymentOption?: RentBill['paymentOption']
  paymentMethod?: string
  paymentNote?: string
  payments?: RentBill['payments']
  paidAmount: number
  balanceAmount: number
  status?: 'sold' | 'cancelled'
  returnFee?: number
  refundAmount?: number
  cancelledAt?: string | Date | null
  createdAt: string | Date
}

const productNumber = (image?: string, slug?: string) => {
  const fromImage = (image || '').match(/(\d+)(?:\.[a-z0-9]+)?$/i)

  if (fromImage) return fromImage[1].padStart(2, '0')

  return (slug || '00').slice(-4).toUpperCase()
}

const day = (value: string | Date) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10)

  const month = String(date.getMonth() + 1).padStart(2, '0')
  const dateNo = String(date.getDate()).padStart(2, '0')

  return `${date.getFullYear()}-${month}-${dateNo}`
}

export const saleToBill = (sale: SaleRow): RentBill => {
  const soldOn = day(sale.createdAt)
  const quantity = Math.max(1, Number(sale.quantity) || 1)
  const number = productNumber(sale.productImage, sale.productSlug)

  return {
    id: sale.id,
    kind: 'sale',
    quantity,
    productName: sale.productName,
    productNo: number,
    lines: [
      {
        name: sale.productName,
        productNo: number,
        size: sale.size,
        quantity,
        startDate: soldOn,
        endDate: soldOn,
        price: Number(sale.finalPrice) || 0
      }
    ],
    size: sale.size,
    startDate: soldOn,
    endDate: soldOn,
    startTime: '',
    endTime: '',
    customerName: sale.customerName,
    customerPhone: sale.customerPhone,
    customerEmail: sale.customerEmail || '',
    notes: sale.notes || '',
    productPrice: sale.productPrice,
    finalPrice: sale.finalPrice,
    discountAmount: sale.discountAmount || 0,
    gstEnabled: Boolean(sale.gstEnabled),
    gstRate: sale.gstRate || 0,
    gstAmount: sale.gstAmount || 0,
    paymentOption: sale.paymentOption || 'unpaid',
    paymentMethod: sale.paymentMethod || '',
    paymentNote: sale.paymentNote || '',
    payments: billPayments({
      payments: sale.payments,
      paidAmount: sale.paidAmount,
      paymentMethod: sale.paymentMethod
    } as RentBill),
    paidAmount: sale.paidAmount,
    balanceAmount: sale.balanceAmount,
    status: 'sold',
    createdAt: new Date(sale.createdAt).toISOString()
  }
}

export const saleOrders = (rows: SaleRow[]) => {
  const groups = new Map<string, SaleRow[]>()

  for (const row of rows) {
    const key = row.orderKey || row.id
    const list = groups.get(key) || []

    list.push(row)
    groups.set(key, list)
  }

  return [...groups.values()]
}

export const saleOrderBill = (rows: SaleRow[]): RentBill => {
  const first = saleToBill(rows[0])

  if (rows.length < 2) return first

  const bills = rows.map(saleToBill)
  const sum = (pick: (row: SaleRow) => number) => rows.reduce((total, row) => total + (Number(pick(row)) || 0), 0)

  return {
    ...first,
    quantity: rows.reduce((total, row) => total + Math.max(1, Number(row.quantity) || 1), 0),
    productName: rows.map(row => row.productName).filter(Boolean).join(', '),
    productNo: String(rows.length),
    size: rows.map(row => row.size).filter(Boolean).join(', '),
    lines: rows.map(row => ({
      name: row.productName,
      productNo: productNumber(row.productImage, row.productSlug),
      size: row.size,
      quantity: Math.max(1, Number(row.quantity) || 1),
      startDate: first.startDate,
      endDate: first.endDate,
      price: Number(row.finalPrice) || 0
    })),
    productPrice: sum(row => row.productPrice),
    finalPrice: sum(row => row.finalPrice),
    discountAmount: sum(row => row.discountAmount || 0),
    gstAmount: sum(row => row.gstAmount || 0),
    gstEnabled: rows.some(row => row.gstEnabled),
    gstRate: Number(rows.find(row => row.gstRate)?.gstRate) || 0,
    paidAmount: sum(row => row.paidAmount),
    balanceAmount: sum(row => row.balanceAmount),
    payments: mergedBillPayments(bills),
    paymentMethod: mergedBillPayments(bills).map(line => line.method).join(' + ')
  }
}
