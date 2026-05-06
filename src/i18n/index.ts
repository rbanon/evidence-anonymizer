import { createI18n } from 'vue-i18n'
import en from './locales/en'
import es from './locales/es'

const savedLocale = localStorage.getItem('locale') as 'en' | 'es' | null
const defaultLocale = savedLocale ?? (navigator.language.startsWith('es') ? 'es' : 'en')

export const i18n = createI18n({
  legacy: false,
  locale: defaultLocale,
  fallbackLocale: 'en',
  messages: { en, es },
})
