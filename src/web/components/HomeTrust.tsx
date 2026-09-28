const trust = [
  { icon: 'tabler-truck', label: 'Pan-India shipping' },
  { icon: 'tabler-cash', label: 'Cash on delivery' },
  { icon: 'tabler-refresh', label: 'Easy exchange' },
  { icon: 'tabler-sparkles', label: 'Hand embroidered' }
]

const HomeTrust = () => (
  <section className='vn-trust' aria-label='Store promises'>
    {trust.map(item => (
      <div key={item.label}>
        <i className={item.icon} />
        <span>{item.label}</span>
      </div>
    ))}
  </section>
)

export default HomeTrust
