# Empty States

## Empty State Component

```astro
---
interface Props {
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  icon?: 'search' | 'inbox' | 'folder' | 'calendar';
}

const { title, description, action, icon = 'inbox' } = Astro.props;

const icons = {
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  inbox: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4',
  folder: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
};
---

<div class="empty-state">
  <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
    <path d={icons[icon]} stroke-linecap="round" stroke-linejoin="round" />
  </svg>

  <h3 class="empty-title">{title}</h3>
  <p class="empty-description">{description}</p>

  {action && (
    <a href={action.href} class="btn btn-primary">
      {action.label}
    </a>
  )}
</div>

<style>
  .empty-state {
    text-align: center;
    padding: 3rem 1.5rem;
  }

  .empty-icon {
    width: 3rem;
    height: 3rem;
    color: #9ca3af;
    margin: 0 auto 1rem;
  }

  .empty-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .empty-description {
    color: #6b7280;
    margin-bottom: 1.5rem;
    max-width: 20rem;
    margin-left: auto;
    margin-right: auto;
  }
</style>
```
