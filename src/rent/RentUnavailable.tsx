const RentUnavailable = () => (
  <section className='vn-section jr-account'>
    <div className='jr-hero'>
      <p className='vn-section-note'>Jagu&apos;s Rent</p>
      <h1>Database is not reachable</h1>
      <div className='vn-rule' />
      <p>
        MongoDB Atlas closed the secure connection, so this page could not load outfits. In Atlas, open Network Access and
        allow your current IP address, then refresh.
      </p>
    </div>
  </section>
)

export default RentUnavailable
