'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useParams, useRouter, useSearchParams } from 'next/navigation'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

import { adminApi } from '@admin/libs/adminApi'
import RentFormDialog, { emptyRentForm, loadAdminRentProducts, productNumber, type RentFormValue, type RentProductOption } from '@admin/views/RentFormDialog'
import { mergedBillPayments, type RentBill } from '@admin/views/rentBill'

const RentBillDialog = dynamic(() => import('@admin/views/RentBillDialog'), { ssr: false })

const RentBookPage = () => {
  const params = useParams()
  const router = useRouter()
  const search = useSearchParams()
  const lang = String(params.lang || 'en')
  const bookingId = search.get('id') || ''
  const startDate = search.get('start') || ''
  const endDate = search.get('end') || startDate
  const slug = search.get('slug') || ''
  const size = search.get('size') || ''
  const [products, setProducts] = useState<RentProductOption[]>([])
  const [initial, setInitial] = useState<RentFormValue>({
    ...emptyRentForm,
    startDate,
    endDate,
    productSlug: slug,
    size: size || emptyRentForm.size
  })
  const [ready, setReady] = useState(!bookingId)
  const [bill, setBill] = useState<RentBill | null>(null)

  useEffect(() => {
    let live = true

    if (!bookingId) {
      setInitial({
        ...emptyRentForm,
        startDate,
        endDate,
        productSlug: slug,
        size: size || emptyRentForm.size
      })
      setReady(true)
    } else {
      setReady(false)
    }

    void (async () => {
      let outfits = await loadAdminRentProducts()

      if (slug && !outfits.some(item => item.slug === slug)) {
        const found = await adminApi<{ data?: RentProductOption[] }>(
          `/api/admin/products?limit=20&search=${encodeURIComponent(slug)}`,
          undefined,
          { silentSuccess: true }
        )
        const extra = (found.data?.data || []).filter(item => item.slug === slug && item.listingType !== 'sale')

        outfits = [...extra, ...outfits]
      }

      if (!live) return

      setProducts(outfits)

      if (!bookingId) return

      const result = await adminApi<{ data?: RentFormValue[] }>('/api/admin/rentals?all=1', undefined, { silentSuccess: true })

      if (!live) return

      const row = (result.data?.data || []).find(item => item.id === bookingId)

      setInitial(
        row
          ? {
              ...emptyRentForm,
              id: row.id,
              productId: row.productId,
              productSlug: row.productSlug,
              size: row.size,
              startDate: row.startDate,
              endDate: row.endDate,
              startTime: row.startTime || '10:00',
              endTime: row.endTime || '18:00',
              customerName: row.customerName,
              customerPhone: row.customerPhone,
              customerEmail: row.customerEmail || '',
              notes: row.notes || '',
              status: row.status,
              productPrice: row.productPrice || 0,
              finalPrice: row.finalPrice || 0,
              paymentOption: row.paymentOption || 'unpaid',
              paymentMethod: row.paymentMethod || 'Cash',
              paymentNote: row.paymentNote || '',
              paidAmount: row.paidAmount || 0,
              balanceAmount: row.balanceAmount || 0,
              gstEnabled: Boolean(row.gstEnabled),
              gstRate: Number(row.gstRate) || emptyRentForm.gstRate,
              gstAmount: Number(row.gstAmount) || 0,
              discountAmount: Number(row.discountAmount) || 0,
              payments: row.payments?.length ? row.payments : [{ method: row.paymentMethod || 'Cash', amount: row.paidAmount || 0 }],
              updateCatalogPrice: false
            }
          : emptyRentForm
      )
      setReady(true)
    })()

    return () => {
      live = false
    }
  }, [bookingId, endDate, size, slug, startDate])

  const back = () => router.push(`/${lang}/store/rentals`)

  const save = async (values: RentFormValue, extras: RentFormValue[] = []) => {
    const rows = [values, ...extras]
    const orderKey = `ord-${Date.now().toString(36)}`
    let firstId = values.id

    for (const [index, row] of rows.entries()) {
      const result = await adminApi(
        row.id ? `/api/admin/rentals/${row.id}` : '/api/admin/rentals',
        {
          method: row.id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(row.id ? row : { ...row, orderKey })
        },
        {
          silentSuccess: index < rows.length - 1,
          successMessage: row.id ? 'Rent booking updated' : rows.length > 1 ? `${rows.length} outfits booked` : 'Rent booked',
          errorMessage: 'Could not book this rental'
        }
      )

      if (!result.ok) throw new Error(result.message || 'Save failed')

      if (index === 0) {
        const saved = result.data && typeof result.data === 'object' ? (result.data as { id?: string }) : {}

        firstId = saved.id || row.id || 'new'
      }
    }

    const names = rows.map(row => {
      const outfit = products.find(item => item.slug === row.productSlug || item.id === row.productId)

      return outfit?.name || row.productSlug
    })
    const outfit = products.find(item => item.slug === values.productSlug || item.id === values.productId)
    const productPrice = rows.reduce((sum, row) => sum + (Number(row.productPrice) || 0), 0)
    const finalPrice = rows.reduce((sum, row) => sum + (Number(row.finalPrice) || 0), 0)
    const paidAmount = rows.reduce((sum, row) => sum + (Number(row.paidAmount) || 0), 0)
    const balanceAmount = rows.reduce((sum, row) => sum + (Number(row.balanceAmount) || 0), 0)
    const gstAmount = rows.reduce((sum, row) => sum + (Number(row.gstAmount) || 0), 0)
    const discountAmount = rows.reduce((sum, row) => sum + (Number(row.discountAmount) || 0), 0)
    const payments = mergedBillPayments(rows)
    setBill({
      id: firstId || 'new',
      productName: names.filter(Boolean).join(', '),
      productNo: rows.length > 1 ? String(rows.length) : productNumber(outfit),
      lines:
        rows.length > 1
          ? rows.map((row, index) => {
              const piece = products.find(item => item.slug === row.productSlug || item.id === row.productId)

              return {
                name: names[index] || row.productSlug,
                productNo: productNumber(piece),
                size: row.size,
                startDate: row.startDate,
                endDate: row.endDate,
                price: Number(row.finalPrice) || 0
              }
            })
          : undefined,
      size: rows.length > 1 ? rows.map(row => row.size).join(', ') : values.size,
      startDate: values.startDate,
      endDate: values.endDate,
      startTime: values.startTime,
      endTime: values.endTime,
      customerName: values.customerName,
      customerPhone: values.customerPhone,
      customerEmail: values.customerEmail,
      notes: values.notes,
      status: values.status,
      productPrice,
      finalPrice,
      paymentOption: values.paymentOption,
      paymentMethod: payments.map(line => line.method).join(' + ') || values.paymentMethod,
      paymentNote: values.paymentNote,
      paidAmount,
      balanceAmount,
      gstEnabled: gstAmount > 0,
      gstRate: Number(values.gstRate) || 0,
      gstAmount,
      discountAmount,
      payments,
      createdAt: new Date().toISOString()
    })
  }

  return (
    <Card sx={{ width: '100%' }}>
      <CardContent>
        {ready ? (
          <RentFormDialog
            key={`${bookingId}|${slug}|${size}|${startDate}|${endDate}`}
            embedded
            open
            initial={initial}
            products={products}
            availability=''
            onClose={back}
            onSave={save}
          />
        ) : (
          <Typography color='text.secondary'>Loading booking...</Typography>
        )}
        <RentBillDialog open={Boolean(bill)} bill={bill} onClose={back} />
      </CardContent>
    </Card>
  )
}

export default RentBookPage
