# Kontaktný formulár (archivované)

Tento formulár bol odstránený zo stránky Kontakt (nahradený klikateľnou
kartou "Email" s `mailto:` odkazom). Kód je tu uložený pre prípad, že bude
v budúcnosti znova potrebný.

Odosielanie funguje cez `mailto:` odkaz - po odoslaní sa otvorí emailový
klient návštevníka s predvyplneným príjemcom (`ppturnaje@gmail.com`),
predmetom a telom správy (vrátane zadaného emailu odosielateľa, keďže
`mailto:` sám osebe neprenáša "reply-to" adresu).

## HTML (do `renderContact()` v `site.js`, za `.contact-grid` sekciu)

```html
<section class="section">
  <div class="section-head">
    <div>
      <p class="eyebrow">Napíšte nám</p>
      <h2>Kontaktný formulár</h2>
    </div>
  </div>
  <form id="contactForm" class="contact-form value">
    <label>
      Váš email
      <input type="email" name="email" required placeholder="vas@email.sk" />
    </label>
    <label>
      Predmet správy
      <input type="text" name="subject" required placeholder="Napr. Otázka k turnaju" />
    </label>
    <label>
      Text správy (nepovinné)
      <textarea name="message" rows="5" placeholder="Napíšte nám viac..."></textarea>
    </label>
    <button class="btn" type="submit">Odoslať</button>
  </form>
</section>
```

## JS (po zavolaní `setApp(...)` v `renderContact()`)

```js
const contactForm = document.getElementById("contactForm");
contactForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = contactForm.email.value.trim();
  const subject = contactForm.subject.value.trim();
  const message = contactForm.message.value.trim();
  const bodyLines = [`Email odosielateľa: ${email}`];
  if (message) bodyLines.push("", message);
  const mailtoUrl = `mailto:ppturnaje@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join("\n"))}`;
  window.location.href = mailtoUrl;
});
```

## CSS (`styles.css`)

```css
textarea {
  min-height: 120px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 7px;
  font: inherit;
  resize: vertical;
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 520px;
}

.contact-form label {
  min-width: 0;
}

.contact-form .btn {
  align-self: flex-start;
  min-width: 160px;
}
```
