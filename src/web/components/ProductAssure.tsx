const notes = [
  {
    icon: 'tabler-truck',
    title: 'Shipping',
    points: [
      'Free shipping across India on every order.',
      'Cash on delivery available at checkout.',
      'Dispatch in 2–4 working days after confirmation.',
      'Worldwide shipping on request. Tracking is shared on WhatsApp.'
    ]
  },
  {
    icon: 'tabler-shield-check',
    title: 'Quality assurance',
    points: [
      'Each chaniya choli is checked for stitch, fit and embroidery.',
      'Mirror and thread work is packed to travel safely.',
      'If a piece arrives damaged or with a quality issue, we exchange it.',
      'WhatsApp us with photos and we will make it right.'
    ]
  }
]

const ProductAssure = () => (
  <section className='vn-assure' aria-label='Shipping and quality'>
    {notes.map(note => (
      <article key={note.title}>
        <h2>
          <i className={note.icon} />
          {note.title}
        </h2>
        <ul>
          {note.points.map(point => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </article>
    ))}
  </section>
)

export default ProductAssure
