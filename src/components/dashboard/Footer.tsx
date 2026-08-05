export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white px-6 py-3 flex items-center justify-center gap-2 shrink-0">
      <span className="text-label text-gray-400">
        © {new Date().getFullYear()} 1CloudHub Tracker. All rights reserved.
      </span>
      <span className="text-label text-gray-300">·</span>
      <span className="text-label text-gray-400">v1.0.0</span>
    </footer>
  )
}
