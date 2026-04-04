# Card Component

```astro
---
// src/components/ui/Card.astro
interface Props {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  class?: string;
}

const {
  variant = 'default',
  padding = 'md',
  class: className,
} = Astro.props;

const variants = {
  default: 'bg-white',
  elevated: 'bg-white shadow-card hover:shadow-card-hover transition-shadow',
  outlined: 'bg-white border border-primary-200',
};

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};
---

<div class:list={['rounded-card', variants[variant], paddings[padding], className]}>
  <slot />
</div>
```

## Usage

```astro
<Card>Default card content</Card>
<Card variant="elevated">Elevated with shadow</Card>
<Card variant="outlined" padding="lg">Large outlined card</Card>
```

# Badge Component

```astro
---
// src/components/ui/Badge.astro
interface Props {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  class?: string;
}

const {
  variant = 'default',
  size = 'md',
  class: className,
} = Astro.props;

const variants = {
  default: 'bg-primary-100 text-primary-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
};

const sizes = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
};
---

<span class:list={['inline-flex items-center font-medium rounded-full', variants[variant], sizes[size], className]}>
  <slot />
</span>
```

## Usage

```astro
<Badge>Default</Badge>
<Badge variant="success">Verified</Badge>
<Badge variant="error" size="sm">Urgent</Badge>
```

# Alert Component

```astro
---
// src/components/ui/Alert.astro
interface Props {
  variant?: 'info' | 'success' | 'warning' | 'error';
  class?: string;
}

const {
  variant = 'info',
  class: className,
} = Astro.props;

const variants = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  error: 'bg-red-50 border-red-200 text-red-800',
};
---

<div
  role="alert"
  class:list={[
    'flex items-start gap-3 p-4 rounded-lg border',
    variants[variant],
    className,
  ]}
>
  <div class="flex-1">
    <slot />
  </div>
</div>
```

## Usage

```astro
<Alert>Info message</Alert>
<Alert variant="success">Success message</Alert>
<Alert variant="error">Error message</Alert>
```

Note: Dismissible alerts require island architecture - see astro-forms skill.
