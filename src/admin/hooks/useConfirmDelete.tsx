'use client'

import { useCallback, useState } from 'react'

import ConfirmActionDialog from '@admin/views/ConfirmActionDialog'

type ConfirmDeleteRequest = {
  /** Item name shown in the message, e.g. product title */
  name?: string
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  icon?: string
  onConfirm: () => void | Promise<unknown>
}

type ConfirmState = {
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  icon: string
  onConfirm: () => void | Promise<unknown>
}

/**
 * Delete only after the user confirms in a dialog.
 * Usage: const { askDelete, confirmDialog } = useConfirmDelete()
 * askDelete({ name: row.name, onConfirm: () => deleteRow(row.id) })
 * return (<>…{confirmDialog}</>)
 */
export const useConfirmDelete = () => {
  const [state, setState] = useState<ConfirmState | null>(null)
  const [loading, setLoading] = useState(false)

  const askDelete = useCallback((request: ConfirmDeleteRequest) => {
    const label = request.name?.trim()

    setState({
      title: request.title || 'Delete permanently?',
      message:
        request.message ||
        (label
          ? `Delete “${label}”? This cannot be undone.`
          : 'Are you sure you want to delete this? This cannot be undone.'),
      confirmLabel: request.confirmLabel || 'Delete',
      cancelLabel: request.cancelLabel || 'Cancel',
      icon: request.icon || 'tabler-trash',
      onConfirm: request.onConfirm
    })
  }, [])

  const close = useCallback(() => {
    if (loading) return
    setState(null)
  }, [loading])

  const confirmDialog = (
    <ConfirmActionDialog
      open={Boolean(state)}
      title={state?.title}
      message={state?.message || ''}
      confirmLabel={state?.confirmLabel || 'Delete'}
      cancelLabel={state?.cancelLabel || 'Cancel'}
      icon={state?.icon || 'tabler-trash'}
      loading={loading}
      onClose={close}
      onConfirm={() => {
        if (!state) return

        void (async () => {
          setLoading(true)

          try {
            await state.onConfirm()
          } finally {
            setLoading(false)
            setState(null)
          }
        })()
      }}
    />
  )

  return { askDelete, confirmDialog, isConfirmOpen: Boolean(state) }
}

export default useConfirmDelete
