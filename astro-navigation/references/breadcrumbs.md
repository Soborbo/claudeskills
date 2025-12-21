# Breadcrumbs

```astro
---
interface Props {
  items: Array<{ label: string; href?: string }>;
}

const { items } = Astro.props;
---

<nav aria-label="Breadcrumb" class="text-sm text-gray-500 mb-4">
  <ol class="flex items-center gap-2" itemscope itemtype="https://schema.org/BreadcrumbList">
    {items.map((item, index) => (
      <li
        class="flex items-center gap-2"
        itemprop="itemListElement"
        itemscope
        itemtype="https://schema.org/ListItem"
      >
        {index > 0 && <span aria-hidden="true">/</span>}
        {item.href ? (
          <a href={item.href} itemprop="item" class="hover:text-primary">
            <span itemprop="name">{item.label}</span>
          </a>
        ) : (
          <span itemprop="name" aria-current="page" class="text-gray-900 font-medium">
            {item.label}
          </span>
        )}
        <meta itemprop="position" content={String(index + 1)} />
      </li>
    ))}
  </ol>
</nav>
```
