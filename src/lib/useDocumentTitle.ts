import { useEffect } from 'react'

const SUFFIX = '1CloudHub Tracker'

/** Sets the browser tab title to `${title} · 1CloudHub Tracker` while mounted,
 * restoring the previous title on unmount. Pass undefined/empty while data is
 * still loading to keep showing the plain suffix rather than flashing "undefined". */
export function useDocumentTitle(title?: string | null) {
  useEffect(() => {
    const previous = document.title
    document.title = title ? `${title} · ${SUFFIX}` : SUFFIX
    return () => {
      document.title = previous
    }
  }, [title])
}
