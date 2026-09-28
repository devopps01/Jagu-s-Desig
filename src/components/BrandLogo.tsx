const BrandLogo = ({ height = 96, className = '' }: { height?: number; className?: string }) => (
  <img
    src='/images/brand/jagu-logo.png'
    alt="Jagu's Designing — Chaniya Choli"
    height={height}
    className={className}
    style={{ width: 'auto', maxWidth: '100%', display: 'block', objectFit: 'contain', objectPosition: 'center' }}
  />
)

export default BrandLogo
