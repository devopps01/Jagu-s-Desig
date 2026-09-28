export type TableQuery = {
  page: number
  limit: number
  search: string
  skip: number
  status: string
  listingType: string
  payment: string
}

export type TableResponse<T> = {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const parseTableQuery = (url: URL): TableQuery => {
  const page = Math.max(1, Number(url.searchParams.get('page') || 1) || 1)
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 10) || 10))
  const search = (url.searchParams.get('search') || '').trim()
  const status = (url.searchParams.get('status') || '').trim()
  const listingType = (url.searchParams.get('listingType') || '').trim()
  const payment = (url.searchParams.get('payment') || '').trim()

  return {
    page,
    limit,
    search,
    skip: (page - 1) * limit,
    status,
    listingType,
    payment
  }
}

export const tableResponse = <T,>(data: T[], total: number, page: number, limit: number): TableResponse<T> => ({
  data,
  total,
  page,
  limit,
  totalPages: Math.max(1, Math.ceil(total / limit) || 1)
})

export const searchRegex = (search: string) =>
  search ? { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } : null
