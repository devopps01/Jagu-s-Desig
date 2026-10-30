import { Document, Image, Page, Path, StyleSheet, Svg, Text, View } from '@react-pdf/renderer'

import { billHeading, billPayments, RENT_SHOP, rentBillNo, rentDayCount, rentDayLabel, rentMoney, rentSlotLabel, rentStatusLabel, type RentBill } from '@admin/views/rentBill'

const ink = '#2a1220'
const plum = '#7a1458'
const gold = '#c9a24a'
const blush = '#fff4f8'
const line = '#f3d5e2'
const muted = '#8a4d66'

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, color: ink, backgroundColor: '#fffafc' },
  header: { backgroundColor: '#fff', paddingHorizontal: 28, paddingTop: 14, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 57, height: 53, marginRight: 10 },
  shopName: { color: plum, fontFamily: 'Helvetica-Bold', fontSize: 16 },
  shopLine: { color: gold, fontSize: 8, letterSpacing: 1.2, marginTop: 2 },
  address: { color: muted, marginTop: 3, fontSize: 8, lineHeight: 1.35, maxWidth: 280 },
  billSide: { alignItems: 'flex-end' },
  billKicker: { color: plum, fontSize: 8, letterSpacing: 1.4 },
  billTitle: { color: ink, fontFamily: 'Helvetica-Bold', fontSize: 14, marginTop: 2 },
  billMeta: { color: muted, fontSize: 9, marginTop: 3, textAlign: 'right' },
  goldBar: { height: 4, backgroundColor: gold },
  body: { paddingHorizontal: 32, paddingTop: 22, paddingBottom: 28 },
  cards: { flexDirection: 'row' },
  card: { flex: 1, borderWidth: 1, borderColor: line, borderRadius: 8, backgroundColor: '#fff', padding: 12 },
  cardGap: { width: 12 },
  cardHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: plum, letterSpacing: 0.6, marginLeft: 6 },
  name: { fontFamily: 'Helvetica-Bold', fontSize: 12 },
  quiet: { color: muted, marginTop: 3, lineHeight: 1.4 },
  outfit: { marginTop: 12, backgroundColor: blush, borderRadius: 8, padding: 14, borderWidth: 1, borderColor: line },
  outfitLabel: { color: muted, fontSize: 8, letterSpacing: 0.8, marginBottom: 4 },
  outfitName: { fontFamily: 'Helvetica-Bold', fontSize: 14 },
  table: { marginTop: 12, borderWidth: 1, borderColor: line, borderRadius: 8, overflow: 'hidden' },
  tableHead: { flexDirection: 'row', backgroundColor: plum, paddingVertical: 7, paddingHorizontal: 10 },
  tableHeadText: { color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 8, letterSpacing: 0.4 },
  tableRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 10, alignItems: 'flex-start' },
  tableAlt: { backgroundColor: blush },
  colOutfit: { width: '40%' },
  colSize: { width: '12%' },
  colDates: { width: '30%' },
  colAmount: { width: '18%', textAlign: 'right' },
  colSaleOutfit: { width: '34%' },
  colSaleSize: { width: '14%' },
  colQty: { width: '12%', textAlign: 'right' },
  colPrice: { width: '20%', textAlign: 'right' },
  colSaleAmount: { width: '20%', textAlign: 'right' },
  tableFoot: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 10, backgroundColor: blush, borderTopWidth: 1, borderTopColor: line },
  lineName: { fontFamily: 'Helvetica-Bold', fontSize: 10 },
  chips: { flexDirection: 'row', marginTop: 8 },
  chip: { backgroundColor: '#fff', borderRadius: 10, paddingVertical: 3, paddingHorizontal: 8, marginRight: 6, color: plum, fontFamily: 'Helvetica-Bold', fontSize: 9 },
  pay: { marginTop: 14, borderWidth: 1, borderColor: line, borderRadius: 8, overflow: 'hidden' },
  payHead: { backgroundColor: plum, color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 9, letterSpacing: 0.6, paddingVertical: 8, paddingHorizontal: 12 },
  payRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, paddingHorizontal: 12 },
  payAlt: { backgroundColor: blush },
  payLabel: { color: muted },
  discountText: { color: plum, fontFamily: 'Helvetica-Bold' },
  strongText: { color: ink, fontFamily: 'Helvetica-Bold' },
  due: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: plum, paddingVertical: 12, paddingHorizontal: 12 },
  dueLabel: { color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 11 },
  dueValue: { color: gold, fontFamily: 'Helvetica-Bold', fontSize: 14 },
  paid: { backgroundColor: '#166534' },
  notes: { marginTop: 12, padding: 12, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: line },
  notesTitle: { fontFamily: 'Helvetica-Bold', color: plum, fontSize: 9, marginBottom: 4 },
  foot: { marginTop: 18, paddingTop: 10, borderTopWidth: 1, borderTopColor: gold, color: muted, fontSize: 9, lineHeight: 1.45 }
})

const statusTone = (status: string) => {
  if (status === 'ongoing') return '#b45309'
  if (status === 'returned') return '#166534'
  if (status === 'cancelled') return '#6b7280'

  return plum
}

const Glyph = ({ d, color }: { d: string; color: string }) => (
  <Svg width={14} height={14} viewBox='0 0 24 24'>
    <Path d={d} stroke={color} strokeWidth={1.8} strokeLinecap='round' strokeLinejoin='round' fill='none' />
  </Svg>
)

const user = 'M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2'
const calendar = 'M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2zM16 3v4M8 3v4M4 11h16'

const PayRow = ({ label, value, alt = false, tone = 'plain' }: { label: string; value: string; alt?: boolean; tone?: 'plain' | 'discount' | 'strong' }) => (
  <View style={alt ? [styles.payRow, styles.payAlt] : styles.payRow}>
    <Text style={tone === 'discount' ? styles.discountText : tone === 'strong' ? styles.strongText : styles.payLabel}>{label}</Text>
    <Text style={tone === 'discount' ? styles.discountText : tone === 'strong' ? styles.strongText : undefined}>{value}</Text>
  </View>
)

const logoSrc = () => (typeof window === 'undefined' ? '/images/brand/jagu-logo.png' : `${window.location.origin}/images/brand/jagu-logo.png`)

const issuedOn = (value: string) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const RentBillPdf = ({ bill }: { bill: RentBill }) => {
  const days = rentDayCount(bill.startDate, bill.endDate)
  const issued = issuedOn(bill.createdAt)
  const settled = (bill.balanceAmount || 0) <= 0
  const payments = billPayments(bill)
  const subtotal = Math.max(0, Math.round(bill.finalPrice || 0))
  const discount = Math.min(subtotal, Math.max(0, Math.round(bill.discountAmount || 0)))
  const afterDiscount = Math.max(0, subtotal - discount)
  const gst = Math.max(0, Math.round(bill.gstAmount || 0))
  const total = afterDiscount + gst
  const sale = bill.kind === 'sale'
  const saleLines = sale
    ? bill.lines?.length
      ? bill.lines
      : [
          {
            name: bill.productName,
            productNo: bill.productNo,
            size: bill.size,
            quantity: Math.max(1, bill.quantity || 1),
            startDate: bill.startDate,
            endDate: bill.endDate,
            price: bill.finalPrice
          }
        ]
    : null
  const lines = !sale && bill.lines && bill.lines.length > 1 ? bill.lines : null
  const sameDates = !lines || lines.every(line => line.startDate === bill.startDate && line.endDate === bill.endDate)
  const saleQty = saleLines ? saleLines.reduce((sum, line) => sum + Math.max(1, line.quantity || 1), 0) : 0
  const saleAmount = saleLines ? saleLines.reduce((sum, line) => sum + Math.max(0, Math.round(line.price || 0)), 0) : 0

  return (
    <Document title={`${sale ? 'Sale' : 'Rent'} bill ${sale ? billHeading(bill) : rentBillNo(bill.id)}`} author={RENT_SHOP.name}>
      <Page size='A4' style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <Image src={logoSrc()} style={styles.logo} />
            <View>
              <Text style={styles.shopName}>{RENT_SHOP.name}</Text>
              <Text style={styles.shopLine}>CHANIYA CHOLI</Text>
              <Text style={styles.address}>
                {RENT_SHOP.line1}, {RENT_SHOP.line2}
                {'\n'}
                {RENT_SHOP.phone}
              </Text>
            </View>
          </View>
          <View style={styles.billSide}>
            <Text style={styles.billKicker}>{sale ? 'SALE BILL' : 'RENT BILL'}</Text>
            <Text style={styles.billTitle}>{sale ? billHeading(bill) : rentBillNo(bill.id)}</Text>
            <Text style={styles.billMeta}>
              {issued ? `Issued ${issued}` : ''}
              {issued ? '\n' : ''}
              {rentStatusLabel(bill.status)}
            </Text>
          </View>
        </View>
        <View style={styles.goldBar} />

        <View style={styles.body}>
          <View style={styles.cards}>
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Glyph d={user} color={plum} />
                <Text style={styles.cardTitle}>CUSTOMER</Text>
              </View>
              <Text style={styles.name}>{bill.customerName || '-'}</Text>
              <Text style={styles.quiet}>
                {bill.customerPhone || '-'}
                {bill.customerEmail ? `\n${bill.customerEmail}` : ''}
              </Text>
            </View>
            <View style={styles.cardGap} />
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Glyph d={calendar} color={plum} />
                <Text style={styles.cardTitle}>{sale ? 'SALE' : 'RENTAL'}</Text>
              </View>
              <Text style={styles.name}>
                {sale
                  ? `${saleLines?.length || 1} ${(saleLines?.length || 1) === 1 ? 'outfit' : 'outfits'}`
                  : lines
                    ? `${lines.length} outfits`
                    : `${rentDayLabel(bill.startDate)} · ${rentSlotLabel(bill.startTime)}`}
              </Text>
              <Text style={styles.quiet}>
                {sale
                  ? `Quantity ${saleQty}`
                  : lines
                    ? sameDates
                      ? `${rentDayLabel(bill.startDate)} · ${rentSlotLabel(bill.startTime)}\nReturn ${rentDayLabel(bill.endDate)} · ${rentSlotLabel(bill.endTime)}`
                      : 'Dates are listed with each outfit'
                    : `Return ${rentDayLabel(bill.endDate)} · ${rentSlotLabel(bill.endTime)}\n${days} ${days === 1 ? 'day' : 'days'} · Size ${bill.size}`}
              </Text>
            </View>
          </View>

          {saleLines ? (
            <View style={styles.table}>
              <View style={styles.tableHead}>
                <Text style={[styles.tableHeadText, styles.colSaleOutfit]}>OUTFIT</Text>
                <Text style={[styles.tableHeadText, styles.colSaleSize]}>SIZE</Text>
                <Text style={[styles.tableHeadText, styles.colQty]}>QTY</Text>
                <Text style={[styles.tableHeadText, styles.colPrice]}>PRICE</Text>
                <Text style={[styles.tableHeadText, styles.colSaleAmount]}>AMOUNT</Text>
              </View>
              {saleLines.map((line, index) => {
                const qty = Math.max(1, line.quantity || 1)
                const amount = Math.max(0, Math.round(line.price || 0))

                return (
                  <View key={`${line.productNo}-${line.name}-${index}`} style={index % 2 ? [styles.tableRow, styles.tableAlt] : styles.tableRow}>
                    <View style={styles.colSaleOutfit}>
                      <Text style={styles.lineName}>{line.name}</Text>
                      {line.productNo ? <Text style={styles.quiet}>#{line.productNo}</Text> : null}
                    </View>
                    <Text style={styles.colSaleSize}>{line.size}</Text>
                    <Text style={styles.colQty}>{String(qty)}</Text>
                    <Text style={styles.colPrice}>{rentMoney(Math.round(amount / qty))}</Text>
                    <Text style={[styles.colSaleAmount, styles.lineName]}>{rentMoney(amount)}</Text>
                  </View>
                )
              })}
              <View style={styles.tableFoot}>
                <Text style={styles.lineName}>Subtotal</Text>
                <Text style={styles.lineName}>{rentMoney(saleAmount)}</Text>
              </View>
            </View>
          ) : lines ? (
            <View style={styles.table}>
              <View style={styles.tableHead}>
                <Text style={[styles.tableHeadText, styles.colOutfit]}>OUTFIT</Text>
                <Text style={[styles.tableHeadText, styles.colSize]}>SIZE</Text>
                <Text style={[styles.tableHeadText, styles.colDates]}>{sale ? 'QTY' : 'DATES'}</Text>
                <Text style={[styles.tableHeadText, styles.colAmount]}>AMOUNT</Text>
              </View>
              {lines.map((line, index) => (
                <View key={`${line.productNo}-${line.name}-${index}`} style={index % 2 ? [styles.tableRow, styles.tableAlt] : styles.tableRow}>
                  <View style={styles.colOutfit}>
                    <Text style={styles.lineName}>{line.name}</Text>
                    {line.productNo ? <Text style={styles.quiet}>#{line.productNo}</Text> : null}
                  </View>
                  <Text style={styles.colSize}>{line.size}</Text>
                  <Text style={styles.colDates}>
                    {sale
                      ? String(Math.max(1, line.quantity || 1))
                      : `${rentDayLabel(line.startDate)}\n${rentDayLabel(line.endDate)}`}
                  </Text>
                  <Text style={[styles.colAmount, styles.lineName]}>{rentMoney(line.price)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.outfit}>
              <Text style={styles.outfitLabel}>OUTFIT</Text>
              <Text style={styles.outfitName}>{bill.productName || '-'}</Text>
              <View style={styles.chips}>
                {bill.productNo ? <Text style={styles.chip}>#{bill.productNo}</Text> : null}
                <Text style={styles.chip}>Size {bill.size}</Text>
                {sale ? <Text style={styles.chip}>Qty {Math.max(1, bill.quantity || 1)}</Text> : null}
                <Text style={[styles.chip, { color: statusTone(bill.status) }]}>{rentStatusLabel(bill.status)}</Text>
              </View>
            </View>
          )}

          <View style={styles.pay}>
            <Text style={styles.payHead}>PAYMENT</Text>
            <PayRow label='Product price' value={rentMoney(bill.productPrice)} />
            <PayRow label='Subtotal' value={rentMoney(subtotal)} alt />
            <PayRow label='Discount' value={discount > 0 ? `- ${rentMoney(discount)}` : rentMoney(0)} tone='discount' />
            {discount > 0 ? <PayRow label='After discount' value={rentMoney(afterDiscount)} alt /> : null}
            <PayRow label={gst && bill.gstRate ? `GST (${bill.gstRate}%)` : 'GST'} value={rentMoney(gst)} alt={discount <= 0} />
            <PayRow label='Total' value={rentMoney(total)} tone='strong' />
            {payments.map((line, index) => (
              <PayRow key={`${line.method}-${index}`} label={`Paid by ${line.method}`} value={rentMoney(line.amount)} alt={index % 2 === 0} />
            ))}
            <PayRow label='Received' value={rentMoney(bill.paidAmount)} tone='strong' />
            {bill.paymentNote ? <PayRow label='Note' value={bill.paymentNote} alt /> : null}
            <View style={settled ? [styles.due, styles.paid] : styles.due}>
              <Text style={styles.dueLabel}>{settled ? 'Paid in full' : 'Left to collect'}</Text>
              <Text style={styles.dueValue}>{settled ? rentMoney(bill.paidAmount) : rentMoney(bill.balanceAmount)}</Text>
            </View>
          </View>

          {bill.notes ? (
            <View style={styles.notes}>
              <Text style={styles.notesTitle}>NOTES</Text>
              <Text>{bill.notes}</Text>
            </View>
          ) : null}

          <Text style={styles.foot}>
            {sale
              ? `Thank you for shopping at ${RENT_SHOP.name}.`
              : `Thank you for renting from ${RENT_SHOP.name}.${lines ? ` Please return the ${lines.length} outfits on the dates above.` : ` Please return the outfit on ${rentDayLabel(bill.endDate)}.`}`}
          </Text>
        </View>
      </Page>
    </Document>
  )
}

export default RentBillPdf
