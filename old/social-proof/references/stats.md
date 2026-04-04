# Stats Section

## Stats Section Component

```astro
---
const stats = [
  { value: '2,500+', label: 'Moves Completed' },
  { value: '4.9', label: 'Google Rating', suffix: '/5' },
  { value: '15+', label: 'Years Experience' },
  { value: '0', label: 'Damage Claims' },
];
---

<section class="bg-primary-900 text-white py-12">
  <div class="container mx-auto px-4">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
      {stats.map((stat) => (
        <div>
          <p class="text-4xl md:text-5xl font-bold mb-2">
            {stat.value}{stat.suffix && <span class="text-2xl">{stat.suffix}</span>}
          </p>
          <p class="text-primary-200">{stat.label}</p>
        </div>
      ))}
    </div>
  </div>
</section>
```
