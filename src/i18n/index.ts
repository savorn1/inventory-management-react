import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en'
import zh from './zh'
import kh from './kh'

const savedLocale = localStorage.getItem('locale') || 'en'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
    kh: { translation: kh },
  },
  lng: savedLocale,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
