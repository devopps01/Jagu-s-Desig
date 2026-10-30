'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useParams, useRouter } from 'next/navigation'

import Card from '@mui/material/Card'

import { adminApi } from '@admin/libs/adminApi'
import RentCalendar from '@admin/views/RentCalendar'
import RentFormDialog, { emptyRentForm, loadAdminRentProducts, productNumber, type RentFormValue } from '@admin/views/RentFormDialog'
import RentPreviewDialog, { type PreviewProduct } from '@admin/views/RentPreviewDialog'
import { type RentBill } from '@admin/views/rentBill'
import AppFullCalendar from '@/libs/styles/AppFullCalendar'
import type { RentBooking } from '@/libs/rentals'

const RentBillDialog = dynamic(() => import('@admin/views/RentBillDialog'), { ssr: false })

type ProductOption = PreviewProduct & {
  id: string
  listingType?: string
}

const toForm = (dates?: { startDate: string; endDate: string }): RentFormValue => ({
  ...emptyRentForm,
  startDate: dates?.startDate || '',
  endDate: dates?.endDate || dates?.startDate || ''
})

const toBill = (row: RentBooking, products: ProductOption[]): RentBill => {
  const outfit = products.find(item => item.slug === row.productSlug || item.id === row.productId)
  const created = row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt || '')

  return {
    id: row.id,
    productName: row.productName,
    productNo: productNumber(outfit || { imageUrl: row.productImage, id: row.productId, slug: row.productSlug }),
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
    gstRate: row.gstRate || 0,
    gstAmount: row.gstAmount || 0,
    discountAmount: row.discountAmount || 0,
    payments: row.payments || [],
    createdAt: created
  }
}

const RentDashboardCalendar = () => {
  const params = useParams()
  const router = useRouter()
  const lang = String(params.lang || 'en')
  const [products, setProducts] = useState<ProductOption[]>([])
  const [bookings, setBookings] = useState<RentBooking[]>([])
  const [form, setForm] = useState<RentFormValue>(emptyRentForm)
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<RentBooking | null>(null)
  const [bill, setBill] = useState<RentBill | null>(null)

  const loadBookings = async () => {
    const result = await adminApi<{ data?: RentBooking[] }>('/api/admin/rentals?all=1', undefined, { silentSuccess: true })

    setBookings(Array.isArray(result.data?.data) ? result.data.data : [])
  }

  useEffect(() => {
    void loadAdminRentProducts().then(setProducts)
    void loadBookings()
  }, [])

  const save = async (values: RentFormValue) => {
    const result = await adminApi(
      '/api/admin/rentals',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      },
      { successMessage: 'Rental saved successfully', errorMessage: 'Could not save rental. Please try again.' }
    )

    if (!result.ok) throw new Error(result.message || 'Save failed')

    setOpen(false)
    setForm(emptyRentForm)
    await loadBookings()
  }

  const saveDates = async (row: RentBooking) => {
    const result = await adminApi(
      `/api/admin/rentals/${row.id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row)
      },
      { successMessage: 'Rental dates updated', errorMessage: 'Could not update rental dates' }
    )

    if (!result.ok) {
      await loadBookings()

      return
    }

    await loadBookings()
  }

  return (
    <>
      <Card className='overflow-visible' sx={{ overflow: 'visible' }}>
        <AppFullCalendar className='app-calendar'>
          <RentCalendar
            bookings={bookings}
            onAdd={dates => {
              setForm(toForm(dates))
              setOpen(true)
            }}
            onSelect={row => setPreview(row)}
            onDatesChange={row => void saveDates(row)}
          />
        </AppFullCalendar>
      </Card>
      <RentPreviewDialog
        open={Boolean(preview)}
        booking={preview}
        product={products.find(item => item.slug === preview?.productSlug) || { slug: preview?.productSlug || '', imageUrl: preview?.productImage, name: preview?.productName }}
        onClose={() => setPreview(null)}
        onEdit={() => {
          if (!preview) return

          const id = preview.id

          setPreview(null)
          router.push(`/${lang}/store/rentals/book?id=${id}`)
        }}
        onBill={() => {
          if (!preview) return

          setBill(toBill(preview, products))
        }}
      />
      <RentBillDialog open={Boolean(bill)} bill={bill} onClose={() => setBill(null)} />
      <RentFormDialog open={open} initial={form} products={products} availability='' onClose={() => setOpen(false)} onSave={save} />
    </>
  )
}

export default RentDashboardCalendar
