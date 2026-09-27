import { edukasiList } from '../user/data/edukasi.js'

const categoryNames = {
  'pembangunan-desa': 'Pembangunan Desa',
  'penggunaan-website': 'Penggunaan Website',
  'pendoman-aspirasi': 'Pedoman Aspirasi',
  'syarat-dan-ketentuan': 'Syarat dan Ketentuan',
}

const iconNames = {
  'pembangunan-desa': 'home',
  'penggunaan-website': 'file-check',
  'pendoman-aspirasi': 'users',
  'syarat-dan-ketentuan': 'file-check',
}

export const initialEducationModules = edukasiList.map((item) => ({
  id: item.slug,
  slug: item.slug,
  category: categoryNames[item.slug] || item.judul,
  title: categoryNames[item.slug] || item.judul,
  desc: item.deskripsi,
  subtitle: item.subtitle,
  sections: item.sections,
  iconName: iconNames[item.slug] || 'file-check',
  image: '',
  status: 'Publish',
  date: '10 Ags 2026',
  updatedAt: null,
}))

export const educationCategories = Object.values(categoryNames)

export const sortEducationModules = (items) => [...items].sort((a, b) => {
  const categoryDifference = educationCategories.indexOf(a.category) - educationCategories.indexOf(b.category)
  return categoryDifference || String(a.title).localeCompare(String(b.title), 'id')
})

export const educationContentText = (sections = []) => sections.map((section) => {
  const blocks = []
  if (section.heading) blocks.push(`## ${section.heading}`)
  blocks.push(...(section.paragraphs || []))
  const listItems = [
    ...(section.bullets || []),
    ...(section.tips || []),
    ...(section.steps || []).map((item) => `${item.title}: ${item.desc}`),
    ...(section.checklist || []).map((item) => `${item.title}: ${item.desc}`),
    ...(section.twoCol || []).map((item) => `${item.title}: ${item.desc}`),
    ...(section.priorities || []).map((item) => `${item.title}: ${item.desc}`),
    ...(section.sanksi || []).map((item) => `${item.title}: ${item.desc}`),
  ]
  if (listItems.length) blocks.push(listItems.map((item) => `- ${item}`).join('\n'))
  if (section.tipsNote) blocks.push(`${section.tipsNote.before}${section.tipsNote.linkText}${section.tipsNote.after}`)
  return blocks.filter(Boolean).join('\n\n')
}).filter(Boolean).join('\n\n')