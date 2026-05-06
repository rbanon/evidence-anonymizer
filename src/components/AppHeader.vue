<template>
  <header class="header">
    <div class="header__inner">
      <div class="header__brand">
        <h1 class="header__title">{{ t('header.title') }}</h1>
        <p class="header__subtitle">{{ t('header.subtitle') }}</p>
      </div>

      <div class="header__controls">
        <div class="header__lang">
          <button :class="['lang-btn', { active: locale === 'en' }]" @click="setLocale('en')">EN</button>
          <span class="lang-divider">|</span>
          <button :class="['lang-btn', { active: locale === 'es' }]" @click="setLocale('es')">ES</button>
        </div>

        <button class="theme-btn" @click="toggleTheme" :title="t(`theme.${theme}`)">
          <IconSun v-if="theme === 'dark'" />
          <IconMoon v-else />
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useTheme } from '@/composables/useTheme'
import IconSun from './icons/IconSun.vue'
import IconMoon from './icons/IconMoon.vue'

const { t, locale } = useI18n()
const { theme, toggleTheme } = useTheme()

function setLocale(lang: 'en' | 'es') {
  locale.value = lang
  localStorage.setItem('locale', lang)
}
</script>

<style lang="scss" scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: var(--surface);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(8px);
  flex-shrink: 0;

  &__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 56px;
    padding: 0 24px;
  }

  &__brand {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1px;
  }

  &__title {
    font-family: var(--font-body);
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text);
    line-height: 1.2;
    margin: 0;
  }

  &__subtitle {
    font-family: var(--font-body);
    font-size: 0.72rem;
    color: var(--muted);
    line-height: 1.2;
    margin: 0;
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  &__lang {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
}

.lang-btn {
  background: none;
  border: none;
  color: var(--muted);
  font-family: var(--font-body);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.25rem 0.35rem;
  border-radius: 4px;
  transition: color 0.15s;

  &.active {
    color: var(--accent);
  }

  &:hover {
    color: var(--text);
  }
}

.lang-divider {
  color: var(--border2);
  font-size: 0.75rem;
}

.theme-btn {
  background: none;
  border: 1px solid var(--border);
  color: var(--text);
  cursor: pointer;
  padding: 0.4rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: border-color 0.15s, color 0.15s;

  &:hover {
    border-color: var(--accent);
    color: var(--accent);
  }
}
</style>
