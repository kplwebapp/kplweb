/** Thin bar pinned to the top of the screen while a page loads; unmounting it hides it. */
export default function PageProgress() {
  return (
    <div className="page-progress" role="progressbar" aria-label="Loading page">
      <div className="page-progress__bar" />
    </div>
  )
}
