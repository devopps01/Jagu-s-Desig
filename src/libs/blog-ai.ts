export type BlogAiInput = {
  topic: string
  tone?: string
  language?: string
  keywords?: string
  length?: 'short' | 'medium' | 'long'
}

export type BlogAiDraft = {
  title: string
  slug: string
  excerpt: string
  content: string
  tags: string[]
  coverImageAlt: string
  author: string
}

const BRAND = `Jagu's Designing is a Surat atelier for designer chaniya choli, lehenga, and celebration wear for Navratri, weddings, engagement, and festive occasions. Write like a warm fashion journal for Indian women — practical, elegant, never salesy spam.`

const lengthGuide = (length: BlogAiInput['length']) => {
  if (length === 'short') return 'Write about 350–450 words across 3–4 short paragraphs.'
  if (length === 'long') return 'Write about 900–1100 words across 6–8 paragraphs.'

  return 'Write about 550–700 words across 4–6 paragraphs.'
}

const buildPrompt = (input: BlogAiInput) => {
  const topic = input.topic.trim()
  const tone = (input.tone || 'warm and helpful').trim()
  const language = (input.language || 'English').trim()
  const keywords = (input.keywords || '').trim()

  return `${BRAND}

Create one original blog post as JSON only (no markdown fences).

Topic: ${topic}
Tone: ${tone}
Language: ${language}
${keywords ? `Include these ideas naturally: ${keywords}` : ''}
${lengthGuide(input.length)}

Rules:
- Title under 70 characters, specific and clickable
- excerpt under 160 characters
- content is plain text paragraphs separated by blank lines (\\n\\n). No markdown headings, no bullet lists, no HTML
- 3 to 5 short tags (strings)
- coverImageAlt describes a suitable cover photo in one short sentence
- author must be "Jagu's Designing"
- slug is lowercase kebab-case from the title
- Do not invent fake discounts, prices, or fake customer names
- Mentions of Surat atelier / craft / fit / occasion are welcome when natural

Return exactly this JSON shape:
{"title":"","slug":"","excerpt":"","content":"","tags":[""],"coverImageAlt":"","author":"Jagu's Designing"}`
}

const extractJson = (raw: string) => {
  const trimmed = raw.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced ? fenced[1].trim() : trimmed
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')

  if (start < 0 || end <= start) throw new Error('AI did not return valid JSON')

  return JSON.parse(candidate.slice(start, end + 1)) as Partial<BlogAiDraft>
}

const normalizeDraft = (data: Partial<BlogAiDraft>): BlogAiDraft => {
  const title = String(data.title || '').trim()
  const content = String(data.content || '').trim()

  if (!title || !content) throw new Error('AI draft was incomplete. Try again.')

  const tags = Array.isArray(data.tags)
    ? data.tags.map(tag => String(tag || '').trim()).filter(Boolean).slice(0, 6)
    : []

  return {
    title,
    slug: String(data.slug || title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, ''),
    excerpt: String(data.excerpt || content.replace(/\s+/g, ' ').slice(0, 160)).trim(),
    content: content.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n'),
    tags,
    coverImageAlt: String(data.coverImageAlt || title).trim(),
    author: "Jagu's Designing"
  }
}

const callOpenAI = async (prompt: string) => {
  const key = process.env.OPENAI_API_KEY?.trim()

  if (!key) return null

  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini'
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You write fashion journal posts for an Indian ethnic wear brand. Reply with JSON only.'
        },
        { role: 'user', content: prompt }
      ]
    })
  })

  if (!res.ok) {
    const text = await res.text()

    throw new Error(`OpenAI error: ${text.slice(0, 180) || res.statusText}`)
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  const content = json.choices?.[0]?.message?.content

  if (!content) throw new Error('OpenAI returned an empty response')

  return content
}

const callGemini = async (prompt: string) => {
  const key = (process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || '').trim()

  if (!key) return null

  const model = process.env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json'
      }
    })
  })

  if (!res.ok) {
    const text = await res.text()

    throw new Error(`Gemini error: ${text.slice(0, 180) || res.statusText}`)
  }

  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  const content = json.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('') || ''

  if (!content) throw new Error('Gemini returned an empty response')

  return content
}

export const generateBlogDraft = async (input: BlogAiInput): Promise<BlogAiDraft> => {
  const topic = String(input.topic || '').trim()

  if (topic.length < 4) throw new Error('Enter a topic (at least a few words)')

  const prompt = buildPrompt({ ...input, topic })
  const prefer = (process.env.BLOG_AI_PROVIDER || '').trim().toLowerCase()

  let raw: string | null = null

  if (prefer === 'gemini') {
    raw = (await callGemini(prompt)) || (await callOpenAI(prompt))
  } else if (prefer === 'openai') {
    raw = (await callOpenAI(prompt)) || (await callGemini(prompt))
  } else {
    raw = (await callOpenAI(prompt)) || (await callGemini(prompt))
  }

  if (!raw) {
    throw new Error('Add OPENAI_API_KEY or GEMINI_API_KEY in .env to generate blogs with AI')
  }

  return normalizeDraft(extractJson(raw))
}
