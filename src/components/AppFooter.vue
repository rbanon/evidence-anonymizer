<template>
  <footer class="footer no-print">
    <div class="footer__inner">
      <span class="footer__credit">
        {{ t('footer.builtBy') }}
        <a
          href="https://github.com/banonrafael"
          target="_blank"
          rel="noopener noreferrer"
          class="footer__link"
        >{{ t('footer.author') }}</a>
      </span>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
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
    font-family: var(--font-body);
    font-size: 0.75rem;
    color: var(--muted);
  }

  &__link {
    color: var(--muted2);
    text-decoration: none;
    transition: color 0.15s;

    &:hover {
      color: var(--accent);
    }
  }
}
</style>
