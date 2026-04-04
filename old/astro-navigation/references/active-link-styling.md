# Active Link Styling

```astro
---
const pathname = Astro.url.pathname;

function isActive(href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}
---

<a
  href="/services"
  class:list={[
    "transition-colors",
    isActive('/services') ? "text-primary font-semibold" : "text-gray-700 hover:text-primary"
  ]}
  aria-current={isActive('/services') ? 'page' : undefined}
>
  Services
</a>
```
