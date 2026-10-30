'use client'

import { useMemo, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { AdminDataTable, useServerTable } from '@admin/components/table'
import { useConfirmDelete } from '@admin/hooks/useConfirmDelete'
import { adminApi, adminMutate } from '@admin/libs/adminApi'
import ImageDropCard from '@admin/views/ImageDropCard'
import MediaPickerModal, { type PickedMedia } from '@admin/views/MediaPickerModal'
import { slugify } from '@/libs/slug'

type BlogRow = {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage: string
  coverImageAlt: string
  author: string
  tags: string[]
  status: 'draft' | 'published'
  publishedAt: string | null
}

type AiDraft = {
  title: string
  slug: string
  excerpt: string
  content: string
  tags: string[]
  coverImageAlt: string
  author: string
}

const emptyForm = {
  id: '',
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverImage: '',
  coverImageAlt: '',
  author: "Jagu's Designing",
  tags: '' as string,
  status: 'draft' as 'draft' | 'published'
}

const emptyAi = {
  topic: '',
  tone: 'warm and helpful',
  language: 'English',
  keywords: '',
  length: 'medium' as 'short' | 'medium' | 'long'
}

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleString() : '—')

const BlogManager = () => {
  const { askDelete, confirmDialog } = useConfirmDelete()
  const [statusFilter, setStatusFilter] = useState('')
  const extraParams = useMemo(() => ({ status: statusFilter }), [statusFilter])
  const table = useServerTable<BlogRow>('/api/admin/blog', { extraParams })
  const [form, setForm] = useState(emptyForm)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiForm, setAiForm] = useState(emptyAi)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  const openCreate = () => {
    setError('')
    setForm(emptyForm)
    setOpen(true)
  }

  const openEdit = async (row: BlogRow) => {
    setError('')
    const result = await adminApi<BlogRow>(`/api/admin/blog/${row.id}`, undefined, { silentSuccess: true })

    if (!result.ok || !result.data) {
      setError(result.message || 'Could not load post')

      return
    }

    const post = result.data

    setForm({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImage: post.coverImage,
      coverImageAlt: post.coverImageAlt,
      author: post.author,
      tags: (post.tags || []).join(', '),
      status: post.status
    })
    setOpen(true)
  }

  const applyAiDraft = (draft: AiDraft) => {
    setForm(current => ({
      ...current,
      title: draft.title,
      slug: draft.slug || slugify(draft.title),
      excerpt: draft.excerpt,
      content: draft.content,
      coverImageAlt: draft.coverImageAlt || draft.title,
      author: draft.author || "Jagu's Designing",
      tags: (draft.tags || []).join(', '),
      status: current.status || 'draft'
    }))
    setAiOpen(false)
    setAiForm(emptyAi)
    setOpen(true)
  }

  const generateWithAi = async () => {
    setAiError('')
    setAiLoading(true)

    const result = await adminApi<AiDraft>(
      '/api/admin/blog/generate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiForm)
      },
      { successMessage: 'Blog draft generated', silentSuccess: false }
    )

    setAiLoading(false)

    if (!result.ok || !result.data) {
      setAiError(result.message || 'Could not generate blog')

      return
    }

    applyAiDraft(result.data)
  }

  const save = async () => {
    setError('')

    const payload = {
      title: form.title,
      slug: form.slug || slugify(form.title),
      excerpt: form.excerpt,
      content: form.content,
      coverImage: form.coverImage,
      coverImageAlt: form.coverImageAlt || form.title,
      author: form.author,
      tags: form.tags,
      status: form.status
    }

    const result = await adminApi(
      form.id ? `/api/admin/blog/${form.id}` : '/api/admin/blog',
      {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      },
      { successMessage: form.id ? 'Blog post updated' : 'Blog post saved' }
    )

    if (!result.ok) {
      setError(result.message || 'Save failed')

      return
    }

    setOpen(false)
    setForm(emptyForm)
    await table.reload()
  }

  const onPick = (media: PickedMedia) => {
    setForm(current => ({
      ...current,
      coverImage: media.url,
      coverImageAlt: current.coverImageAlt || current.title || media.alt || ''
    }))
    setPickerOpen(false)
    setPendingFile(null)
  }

  return (
    <>
      <AdminDataTable
        title='Blog'
        subtitle='Write stories for the website, or generate a draft with AI. Published posts appear on /blog.'
        search={table.search}
        searchPlaceholder='Search posts...'
        onSearchChange={table.setSearch}
        onRefresh={() => void table.reload()}
        actions={
          <>
            <TextField
              select
              size='small'
              label='Status'
              value={statusFilter}
              onChange={event => {
                table.setPage(1)
                setStatusFilter(event.target.value)
              }}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value=''>All</MenuItem>
              <MenuItem value='published'>Published</MenuItem>
              <MenuItem value='draft'>Draft</MenuItem>
            </TextField>
            <Button
              variant='tonal'
              color='primary'
              startIcon={<i className='tabler-sparkles' />}
              onClick={() => {
                setAiError('')
                setAiForm(emptyAi)
                setAiOpen(true)
              }}
            >
              Generate with AI
            </Button>
            <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={openCreate}>
              Add post
            </Button>
          </>
        }
        columns={[
          {
            id: 'cover',
            label: 'Cover',
            minWidth: 72,
            render: row =>
              row.coverImage ? (
                <img src={row.coverImage} alt='' width={48} height={64} style={{ objectFit: 'cover', borderRadius: 6 }} />
              ) : (
                '—'
              )
          },
          {
            id: 'title',
            label: 'Title',
            render: row => (
              <div>
                <Typography variant='body2' className='font-medium'>
                  {row.title}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  /blog/{row.slug}
                </Typography>
              </div>
            )
          },
          {
            id: 'status',
            label: 'Status',
            render: row => (
              <Switch
                size='small'
                checked={row.status === 'published'}
                onChange={() =>
                  void adminMutate(
                    `/api/admin/blog/${row.id}`,
                    {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: row.status === 'published' ? 'draft' : 'published' })
                    },
                    { successMessage: row.status === 'published' ? 'Moved to draft' : 'Published' },
                    () => table.reload()
                  )
                }
              />
            )
          },
          {
            id: 'publishedAt',
            label: 'Published',
            render: row => formatDate(row.publishedAt)
          },
          {
            id: 'actions',
            label: 'Actions',
            render: row => (
              <>
                <IconButton size='small' aria-label='Edit post' onClick={() => void openEdit(row)}>
                  <i className='tabler-edit' />
                </IconButton>
                <IconButton
                  size='small'
                  color='error'
                  aria-label='Delete post'
                  onClick={() =>
                    askDelete({
                      name: row.title,
                      onConfirm: () => {
                        void adminMutate(
                          `/api/admin/blog/${row.id}`,
                          { method: 'DELETE' },
                          { successMessage: 'Blog post deleted' },
                          () => table.reload()
                        )
                      }
                    })
                  }
                >
                  <i className='tabler-trash' />
                </IconButton>
              </>
            )
          }
        ]}
        rows={table.rows}
        rowKey={row => row.id}
        total={table.total}
        page={table.page}
        limit={table.limit}
        loading={table.loading}
        emptyText='No blog posts yet. Generate with AI or add your first story.'
        onPageChange={table.setPage}
        onLimitChange={table.setLimit}
      />

      <Dialog open={aiOpen} onClose={() => !aiLoading && setAiOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle>Generate blog with AI</DialogTitle>
        <DialogContent className='flex flex-col gap-4' sx={{ pt: 2 }}>
          <Typography variant='body2' color='text.secondary'>
            Describe the topic. AI will draft title, excerpt, tags and full post for Jagu&apos;s Designing. You can edit
            everything before saving.
          </Typography>
          {aiError ? <Alert severity='error'>{aiError}</Alert> : null}
          <TextField
            label='Topic'
            value={aiForm.topic}
            onChange={event => setAiForm(current => ({ ...current, topic: event.target.value }))}
            placeholder='e.g. How to choose a chaniya choli for Navratri garba'
            multiline
            minRows={2}
            autoFocus
          />
          <Box className='grid gap-4' sx={{ gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
            <TextField
              select
              label='Tone'
              value={aiForm.tone}
              onChange={event => setAiForm(current => ({ ...current, tone: event.target.value }))}
            >
              <MenuItem value='warm and helpful'>Warm & helpful</MenuItem>
              <MenuItem value='elegant magazine'>Elegant magazine</MenuItem>
              <MenuItem value='practical styling tips'>Practical tips</MenuItem>
              <MenuItem value='festive and exciting'>Festive</MenuItem>
            </TextField>
            <TextField
              select
              label='Language'
              value={aiForm.language}
              onChange={event => setAiForm(current => ({ ...current, language: event.target.value }))}
            >
              <MenuItem value='English'>English</MenuItem>
              <MenuItem value='Hindi'>Hindi</MenuItem>
              <MenuItem value='Gujarati'>Gujarati</MenuItem>
              <MenuItem value='Hinglish'>Hinglish</MenuItem>
            </TextField>
          </Box>
          <TextField
            select
            label='Length'
            value={aiForm.length}
            onChange={event =>
              setAiForm(current => ({ ...current, length: event.target.value as 'short' | 'medium' | 'long' }))
            }
          >
            <MenuItem value='short'>Short (~400 words)</MenuItem>
            <MenuItem value='medium'>Medium (~600 words)</MenuItem>
            <MenuItem value='long'>Long (~1000 words)</MenuItem>
          </TextField>
          <TextField
            label='Extra keywords (optional)'
            value={aiForm.keywords}
            onChange={event => setAiForm(current => ({ ...current, keywords: event.target.value }))}
            helperText='e.g. mirror work, comfort for dancing, Surat craft'
          />
        </DialogContent>
        <DialogActions>
          <Button disabled={aiLoading} onClick={() => setAiOpen(false)}>
            Cancel
          </Button>
          <Button
            variant='contained'
            disabled={aiLoading || aiForm.topic.trim().length < 4}
            startIcon={aiLoading ? <CircularProgress size={16} color='inherit' /> : <i className='tabler-sparkles' />}
            onClick={() => void generateWithAi()}
          >
            {aiLoading ? 'Generating…' : 'Generate draft'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth='md'>
        <DialogTitle>{form.id ? 'Edit blog post' : 'Add blog post'}</DialogTitle>
        <DialogContent className='flex flex-col gap-4' sx={{ pt: 2 }}>
          {error ? (
            <Typography color='error' variant='body2'>
              {error}
            </Typography>
          ) : null}
          <Box className='flex flex-wrap items-center justify-between gap-2'>
            <Typography variant='body2' color='text.secondary'>
              Tip: use Generate with AI, then refine the draft here.
            </Typography>
            <Button
              size='small'
              variant='tonal'
              startIcon={<i className='tabler-sparkles' />}
              onClick={() => {
                setAiError('')
                setAiForm(current => ({
                  ...emptyAi,
                  topic: form.title || current.topic
                }))
                setAiOpen(true)
              }}
            >
              Regenerate with AI
            </Button>
          </Box>
          <TextField
            label='Title'
            value={form.title}
            onChange={event =>
              setForm(current => ({
                ...current,
                title: event.target.value,
                slug: current.slug || slugify(event.target.value)
              }))
            }
          />
          <TextField
            label='URL slug'
            value={form.slug}
            onChange={event => setForm(current => ({ ...current, slug: slugify(event.target.value) }))}
            helperText='Shown as /blog/your-slug'
          />
          <TextField
            label='Short excerpt'
            value={form.excerpt}
            onChange={event => setForm(current => ({ ...current, excerpt: event.target.value }))}
            multiline
            minRows={2}
          />
          <TextField
            select
            label='Status'
            value={form.status}
            onChange={event => setForm(current => ({ ...current, status: event.target.value as 'draft' | 'published' }))}
          >
            <MenuItem value='draft'>Draft</MenuItem>
            <MenuItem value='published'>Published</MenuItem>
          </TextField>
          <TextField
            label='Author'
            value={form.author}
            onChange={event => setForm(current => ({ ...current, author: event.target.value }))}
          />
          <TextField
            label='Tags'
            value={form.tags}
            onChange={event => setForm(current => ({ ...current, tags: event.target.value }))}
            helperText='Comma separated, e.g. Navratri, Embroidery'
          />
          <div>
            <Typography variant='subtitle2' className='mbe-2'>
              Cover image
            </Typography>
            <ImageDropCard
              imageUrl={form.coverImage}
              imageName={form.coverImageAlt}
              imageAlt={form.coverImageAlt}
              onFile={file => {
                setPendingFile(file)
                setPickerOpen(true)
              }}
            />
            <TextField
              className='mbs-3'
              label='Cover alt text'
              value={form.coverImageAlt}
              onChange={event => setForm(current => ({ ...current, coverImageAlt: event.target.value }))}
              fullWidth
            />
          </div>
          <TextField
            label='Content'
            value={form.content}
            onChange={event => setForm(current => ({ ...current, content: event.target.value }))}
            multiline
            minRows={12}
            helperText='Use blank lines between paragraphs.'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={() => void save()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <MediaPickerModal
        open={pickerOpen}
        file={pendingFile}
        onClose={() => {
          setPickerOpen(false)
          setPendingFile(null)
        }}
        onSelect={onPick}
      />

      {confirmDialog}
    </>
  )
}

export default BlogManager
