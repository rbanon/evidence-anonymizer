<template>
  <footer class="footer no-print">
    <div class="footer__inner">
      <a
        href="https://github.com/banonrafael"
        target="_blank"
        rel="noopener noreferrer"
        class="footer__credit"
      >
        <img :src="logo" alt="RB" class="footer__logo" />
        <span>{{ t('footer.builtBy') }} {{ t('footer.author') }}</span>
      </a>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useTheme } from '@/composables/useTheme'
import logoWhite from '@/assets/svg/rb-logo-white.svg'
import logoBlack from '@/assets/svg/rb-logo-black.svg'
import { computed } from 'vue'

const { t } = useI18n()
const { theme } = useTheme()
const logo = computed(() => theme.value === 'dark' ? logoWhite : logoBlack)
</script>

<style lang="scss" scoped>
.footer {
  flex-shrink: 0;
  background-color: var(--surface);
  border-top: 1px solid var(--border);

  &__inner {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 38px;
    padding: 0 24px;
  }

  &__credit {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-body);
    font-size: 0.75rem;
    color: var(--muted);
    text-decoration: none;
    transition: color 0.15s;

    &:hover {
      color: var(--accent);
    }
  }

  &__logo {
    height: 20px;
    width: auto;
    border-radius: 3px;
    opacity: 0.75;
    transition: opacity 0.15s;

    .footer__credit:hover & {
      opacity: 1;
    }
  }
}
</style>
