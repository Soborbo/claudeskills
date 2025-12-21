# i18n Components

## Base Layout with hreflang

```astro
---
import { languages, defaultLang, type Lang } from '@/i18n/config';
import { getLangFromUrl, t } from '@/i18n/utils';

interface Props {
  title: string;
  description: string;
}

const { title, description } = Astro.props;
const lang = getLangFromUrl(Astro.url);
const langConfig = languages[lang];

// Build hreflang alternates
const alternates = Object.entries(languages).map(([code, config]) => ({
  hreflang: config.code,
  href: new URL(
    Astro.url.pathname.replace(`/${lang}/`, `/${code}/`),
    Astro.site
  ).href,
}));
---

<!doctype html>
<html lang={langConfig.code} dir={langConfig.dir}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    <meta name="description" content={description} />

    <!-- hreflang tags for SEO -->
    {alternates.map(({ hreflang, href }) => (
      <link rel="alternate" hreflang={hreflang} href={href} />
    ))}
    <link
      rel="alternate"
      hreflang="x-default"
      href={new URL(`/${defaultLang}/`, Astro.site).href}
    />
  </head>
  <body>
    <slot />
  </body>
</html>
```

## Language Switcher Component

```astro
---
import { languages, type Lang } from '@/i18n/config';
import { getLangFromUrl, getLocalizedUrl } from '@/i18n/utils';

const currentLang = getLangFromUrl(Astro.url);
---

<div class="language-switcher">
  <button
    type="button"
    class="lang-trigger"
    aria-expanded="false"
    aria-haspopup="listbox"
  >
    <span class="current-lang">{languages[currentLang].name}</span>
    <svg class="icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
    </svg>
  </button>

  <ul class="lang-menu" role="listbox" hidden>
    {Object.entries(languages).map(([code, config]) => (
      <li role="option" aria-selected={code === currentLang}>
        <a
          href={getLocalizedUrl(Astro.url, code as Lang)}
          class:list={['lang-option', { active: code === currentLang }]}
          hreflang={config.code}
        >
          {config.name}
        </a>
      </li>
    ))}
  </ul>
</div>

<style>
  .language-switcher {
    position: relative;
  }

  .lang-trigger {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem 0.75rem;
    background: transparent;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    cursor: pointer;
  }

  .icon {
    width: 1rem;
    height: 1rem;
  }

  .lang-menu {
    position: absolute;
    top: 100%;
    right: 0;
    min-width: 10rem;
    margin-top: 0.25rem;
    padding: 0.25rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    list-style: none;
  }

  .lang-menu[hidden] {
    display: none;
  }

  .lang-option {
    display: block;
    padding: 0.5rem 0.75rem;
    text-decoration: none;
    color: inherit;
    border-radius: 0.25rem;
  }

  .lang-option:hover {
    background: #f3f4f6;
  }

  .lang-option.active {
    background: #eff6ff;
    color: #1d4ed8;
  }
</style>

<script>
  function initLanguageSwitcher() {
    const switcher = document.querySelector('.language-switcher');
    if (!switcher) return;

    const trigger = switcher.querySelector('.lang-trigger');
    const menu = switcher.querySelector('.lang-menu');

    trigger?.addEventListener('click', () => {
      const expanded = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', String(!expanded));
      menu?.toggleAttribute('hidden');
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!switcher.contains(e.target as Node)) {
        trigger?.setAttribute('aria-expanded', 'false');
        menu?.setAttribute('hidden', '');
      }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        trigger?.setAttribute('aria-expanded', 'false');
        menu?.setAttribute('hidden', '');
      }
    });
  }

  initLanguageSwitcher();
  document.addEventListener('astro:page-load', initLanguageSwitcher);
</script>
```
