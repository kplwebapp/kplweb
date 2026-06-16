import './Footer.scss'

export default function Footer() {
  return (
    <footer className="mt-5 py-4 bg-light">
      <div className="container text-center small">
        © {new Date().getFullYear()} KPL — Built with React
      </div>
    </footer>
  )
}
