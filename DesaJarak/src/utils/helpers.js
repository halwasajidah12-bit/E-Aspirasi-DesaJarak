export function formatNumber(n) {
  return Number(n || 0).toLocaleString('id-ID')
}

export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null)
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
