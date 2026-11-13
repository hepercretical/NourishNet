export default function TrackHub({ date }) {
  return (
    <>
      <h1>Track food</h1>
      <p>Add food for {date}. Choose a search or scan, then review the serving and meal.</p>
      <nav className="personal-menu" aria-label="Food entry">
        <a href="#/app/search">Search foods</a>
        <a href="#/app/scan">Scan barcode or enter barcode number</a>
        <a href="#/app/submissions">My product submissions</a>
      </nav>
    </>
  );
}
