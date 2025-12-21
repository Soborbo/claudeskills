# Image Accessibility

## Informative Images

Provide descriptive alt text that conveys the purpose:

```html
<img src="team.jpg" alt="Our Bristol-based removal team loading a van">
```

## Decorative Images

Use empty alt text and role="presentation" for purely decorative images:

```html
<img src="decoration.svg" alt="" role="presentation">
```

## Complex Images

Use `aria-describedby` for images requiring detailed description:

```html
<figure>
  <img src="process.png" alt="Our 4-step moving process" aria-describedby="process-desc">
  <figcaption id="process-desc">
    Step 1: Free quote. Step 2: Book date. Step 3: We pack. Step 4: Delivered.
  </figcaption>
</figure>
```

## Logo Images

```html
<img src="logo.png" alt="Company Name - Home">
```

## Alt Text Best Practices

- Be concise but descriptive
- Don't start with "Image of" or "Picture of"
- Include text that appears in the image
- For links, describe the destination
- For buttons, describe the action
- Empty alt (`alt=""`) for decorative only
