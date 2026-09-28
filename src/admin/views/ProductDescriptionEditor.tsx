'use client'

import { useEffect } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import { Placeholder } from '@tiptap/extension-placeholder'
import { TextAlign } from '@tiptap/extension-text-align'
import { Underline } from '@tiptap/extension-underline'
import type { Editor } from '@tiptap/react'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import classnames from 'classnames'

import CustomIconButton from '@core/components/mui/IconButton'
import '@/libs/styles/tiptapEditor.css'

export const htmlToText = (html: string) =>
  String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export const sanitizeHtml = (html: string) =>
  String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')

const toHtml = (value: string) => {
  const text = String(value || '').trim()

  if (!text) return '<p></p>'
  if (/<[a-z][\s\S]*>/i.test(text)) return text

  return `<p>${text.replace(/\n/g, '<br>')}</p>`
}

const Toolbar = ({ editor }: { editor: Editor | null }) => {
  const editorState = useEditorState({
    editor,
    selector: ctx => {
      if (!ctx.editor) {
        return {
          isBold: false,
          isItalic: false,
          isUnderline: false,
          isStrike: false,
          isBullet: false,
          isOrdered: false,
          isH2: false,
          isH3: false
        }
      }

      return {
        isBold: ctx.editor.isActive('bold'),
        isItalic: ctx.editor.isActive('italic'),
        isUnderline: ctx.editor.isActive('underline'),
        isStrike: ctx.editor.isActive('strike'),
        isBullet: ctx.editor.isActive('bulletList'),
        isOrdered: ctx.editor.isActive('orderedList'),
        isH2: ctx.editor.isActive('heading', { level: 2 }),
        isH3: ctx.editor.isActive('heading', { level: 3 })
      }
    }
  })

  if (!editor || !editorState) return null

  const btn = (active: boolean, icon: string, onClick: () => void) => (
    <CustomIconButton {...(active && { color: 'primary' })} variant='tonal' size='small' onClick={onClick}>
      <i className={classnames(icon, { 'text-textSecondary': !active })} />
    </CustomIconButton>
  )

  return (
    <div className='flex flex-wrap gap-x-2 gap-y-1 pbs-4 pbe-3 pli-4'>
      {btn(editorState.isBold, 'tabler-bold', () => editor.chain().focus().toggleBold().run())}
      {btn(editorState.isItalic, 'tabler-italic', () => editor.chain().focus().toggleItalic().run())}
      {btn(editorState.isUnderline, 'tabler-underline', () => editor.chain().focus().toggleUnderline().run())}
      {btn(editorState.isStrike, 'tabler-strikethrough', () => editor.chain().focus().toggleStrike().run())}
      {btn(editorState.isH2, 'tabler-h-2', () => editor.chain().focus().toggleHeading({ level: 2 }).run())}
      {btn(editorState.isH3, 'tabler-h-3', () => editor.chain().focus().toggleHeading({ level: 3 }).run())}
      {btn(editorState.isBullet, 'tabler-list', () => editor.chain().focus().toggleBulletList().run())}
      {btn(editorState.isOrdered, 'tabler-list-numbers', () => editor.chain().focus().toggleOrderedList().run())}
      {btn(false, 'tabler-align-left', () => editor.chain().focus().setTextAlign('left').run())}
      {btn(false, 'tabler-align-center', () => editor.chain().focus().setTextAlign('center').run())}
      {btn(false, 'tabler-align-right', () => editor.chain().focus().setTextAlign('right').run())}
    </div>
  )
}

const ProductDescriptionEditor = ({
  open,
  productId,
  value,
  onChange
}: {
  open: boolean
  productId: string
  value: string
  onChange: (html: string, plain: string) => void
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Write fabric, look, occasion and styling notes…' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline
    ],
    immediatelyRender: false,
    content: toHtml(value),
    onUpdate: ({ editor: current }) => {
      const html = current.getHTML()

      onChange(html, htmlToText(html))
    }
  })

  useEffect(() => {
    if (!editor || !open) return

    editor.commands.setContent(toHtml(value), { emitUpdate: false })
    // Reset only when the dialog / product changes, not while typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, open, productId])

  return (
    <div>
      <Typography className='mbe-1'>Description</Typography>
      <Card className='p-0 border shadow-none'>
        <CardContent className='p-0'>
          <Toolbar editor={editor} />
          <Divider className='mli-4' />
          <EditorContent editor={editor} className='bs-[220px] overflow-y-auto' />
        </CardContent>
      </Card>
    </div>
  )
}

export default ProductDescriptionEditor
