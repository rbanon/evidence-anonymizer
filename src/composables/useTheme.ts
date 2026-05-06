import { ref, onMounted, watch } from 'vue'

type Theme = 'dark' | 'light'

const theme = ref<Theme>('dark')

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function applyTheme(t: Theme) {
  if (t === 'light') {
    document.documentElement.classList.add('theme-light')
  } else {
    document.documentElement.classList.remove('theme-light')
  }
}

export function useTheme() {
  onMounted(() => {
    const saved = localStorage.getItem('theme') as Theme | null
    if (saved) {
      theme.value = saved
    } else {
      theme.value = getSystemTheme()
      window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
          theme.value = e.matches ? 'light' : 'dark'
        }
      })
    }
    applyTheme(theme.value)
  })

  watch(theme, (newTheme) => {
    applyTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  })

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  return { theme, toggleTheme }
}
