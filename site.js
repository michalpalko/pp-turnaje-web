import { fetchTournamentsFromFirestore, fetchSponsorsFromStorage } from "./firebase.js?v=2";

const PHOTO_MANIFEST_URL = "./data/photo-manifest.json";
const STAKEHOLDERS_URL = "./data/stakeholders.json";
const SPONSORS_URL = "./data/sponsors.json";

let tournaments = [];
let photoManifest = {};
let stakeholders = [];
let sponsors = [];

async function boot() {
  const cacheVersion = Date.now();
  tournaments = await loadTournaments();
  photoManifest = await loadPhotoManifest(cacheVersion);
  stakeholders = await loadStakeholders(cacheVersion);
  sponsors = await loadSponsors(cacheVersion);
  window.addEventListener("hashchange", route);
  setupMenu();
  route();
}

async function loadTournaments() {
  const firestoreTournaments = await fetchTournamentsFromFirestore();
  if (!firestoreTournaments || !firestoreTournaments.length) {
    throw new Error("Firestore nevrátil žiadne turnaje.");
  }
  return firestoreTournaments;
}

async function loadStakeholders(cacheVersion) {
  try {
    const response = await fetch(`${STAKEHOLDERS_URL}?v=${cacheVersion}`);
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

async function loadSponsors(cacheVersion) {
  try {
    const storageSponsors = await fetchSponsorsFromStorage();
    if (storageSponsors && storageSponsors.length) {
      return storageSponsors;
    }
  } catch (error) {
    console.warn("Nepodarilo sa načítať sponzorov z Firebase Storage, používam lokálny súbor data/sponsors.json.", error);
  }
  try {
    const response = await fetch(`${SPONSORS_URL}?v=${cacheVersion}`);
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

async function loadPhotoManifest(cacheVersion) {
  try {
    const response = await fetch(`${PHOTO_MANIFEST_URL}?v=${cacheVersion}`);
    if (!response.ok) return {};
    return await response.json();
  } catch {
    return {};
  }
}

function route() {
  const [page, rawId] = location.hash.replace("#", "").split("/");
  if (!page || page === "domov") return renderHome();
  if (page === "historia") return renderHistory();
  if (page === "o-nas") return renderAbout();
  if (page === "turnaj") return renderTournament(rawId ? decodeURIComponent(rawId) : rawId);
  if (page === "kontakt") return renderContact();
  renderNotFound();
}

function renderHome() {
  const pastTournaments = getPastTournaments();
  const upcomingTournaments = getUpcomingTournaments();
  const latest = pastTournaments.slice(0, 3);
  setApp(`
    <section class="hero">
      <div class="hero-logo-wrap" aria-hidden="true">
        <img class="hero-logo" src="./assets/logo-pp-turnaje.png" alt="" />
      </div>
      <div class="hero-content">
        <h1>Organizujeme hru, ktorú milujete!</h1>
        <p>
          Organizujeme futbalové turnaje pre mládežnícke kategórie po Slovensku.
          Staviame na jasnej komunikácii, dobrom harmonograme, férovom priebehu a peknej spomienke po turnaji.
        </p>
        <div class="actions">
          <a class="btn" href="#historia">Pozrieť históriu</a>
          <a class="btn secondary" href="#kontakt">Kontakt</a>
        </div>
      </div>
    </section>

    <section class="sponsor-section" aria-label="Sponzori a partneri">
      <div>
        <p class="eyebrow">Partneri</p>
        <h2>Sponzori turnajov</h2>
      </div>
      <div class="sponsor-logos">
        ${sponsors.map(sponsorLogo).join("") || `<span class="sponsor-empty">Logá sponzorov budú doplnené.</span>`}
      </div>
    </section>

    <section class="match-strip">
      <article>
        <span>Archív</span>
        <strong>${pastTournaments.length}</strong>
        <small>spracované turnaje</small>
      </article>
      <article>
        <span>Kategórie</span>
        <strong>${new Set(tournaments.map((item) => item.category)).size}</strong>
        <small>mládežnícke ročníky</small>
      </article>
      <article>
        <span>Fotky</span>
        <strong>${tournaments.reduce((sum, item) => sum + getTournamentPhotos(item).length, 0)}</strong>
        <small>ukážkové médiá</small>
      </article>
    </section>

    <section class="section">
      <div class="section-head">
        <div>
          <p class="eyebrow">Čoskoro</p>
          <h2>Nadchádzajúce turnaje</h2>
        </div>
      </div>
      <div class="cards">
        ${
          upcomingTournaments.length
            ? upcomingTournaments.map(card).join("")
            : `<div class="empty">Momentálne nie je naplánovaný žiadny nadchádzajúci turnaj.</div>`
        }
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <div>
          <p class="eyebrow">Najnovšie</p>
          <h2>Posledné turnaje</h2>
        </div>
        <a href="#historia">Všetky turnaje <span aria-hidden="true">&gt;</span></a>
      </div>
      <div class="cards">${latest.map(card).join("") || `<div class="empty">Zatiaľ tu nie je žiadny odohratý turnaj.</div>`}</div>
    </section>
  `);
  setupGalleryPreview();
}

function sponsorLogo(sponsor) {
  return `
    <figure class="sponsor-logo">
      <img src="${sponsor.url}" alt="${sponsor.alt}" loading="lazy" />
    </figure>
  `;
}

function renderHistory() {
  const pastTournaments = getPastTournaments();
  const categories = [...new Set(pastTournaments.map((tournament) => tournament.category))].sort();
  setApp(`
    <section class="page-heading dark">
      <p class="eyebrow">Archív P&P Turnaje</p>
      <h1>História turnajov</h1>
      <p>Prehľad všetkých odohratých turnajov. Nový turnaj sa v histórii zobrazí automaticky, akonáhle jeho dátum prejde.</p>
    </section>

    <section class="section">
      <div class="filters">
        <label>
          Vyhľadať
          <input id="search" type="search" placeholder="Názov, mesto, kategória..." />
        </label>
        <label>
          Kategória
          <select id="category">
            <option value="all">Všetky kategórie</option>
            ${categories.map((category) => `<option value="${category}">${category}</option>`).join("")}
          </select>
        </label>
      </div>
      <div class="cards" id="historyCards"></div>
    </section>
  `);

  const search = document.getElementById("search");
  const category = document.getElementById("category");
  const cards = document.getElementById("historyCards");
  const update = () => {
    const term = search.value.trim().toLowerCase();
    const selectedCategory = category.value;
    const filtered = pastTournaments.filter((tournament) => {
      const text = `${tournament.title} ${tournament.location} ${tournament.category}`.toLowerCase();
      return text.includes(term) && (selectedCategory === "all" || tournament.category === selectedCategory);
    });
    cards.innerHTML = filtered.map(card).join("") || `<div class="empty">Nenašli sa žiadne turnaje.</div>`;
  };
  search.addEventListener("input", update);
  category.addEventListener("change", update);
  update();
}

function renderAbout() {
  setApp(`
    <section class="page-heading dark">
      <p class="eyebrow">O nás</p>
      <h1>Kto sme</h1>
      <p>
        P&P Turnaje je občianske združenie zamerané na organizáciu futbalových turnajov a športových
        podujatí pre deti a mládež po celom Slovensku.
      </p>
    </section>
    <section class="two-col">
      <div>
        <p class="eyebrow">Náš cieľ</p>
        <h2>Radosť z futbalu, tímová atmosféra a nezabudnuteľné momenty.</h2>
        <p class="lead">
          Naším cieľom je vytvárať kvalitné, profesionálne a dobre zorganizované turnaje, ktoré ponúkajú
          mladým futbalistom a futbalistkám nielen možnosť porovnať si svoje schopnosti s rovesníkmi
          z rôznych klubov, ale predovšetkým zažiť radosť z futbalu, tímovú atmosféru a nezabudnuteľné
          športové momenty.
        </p>
      </div>
      <div class="values">
        <article class="value">
          <h3>Hodnoty</h3>
          <p>
            Pri organizácii kladieme dôraz na férovosť, profesionalitu, bezpečnosť, kvalitné športové
            podmienky a športového ducha. Chceme, aby naše turnaje boli pozitívnym zážitkom nielen pre
            samotných hráčov, ale aj pre trénerov, rodičov, futbalové kluby a všetkých návštevníkov podujatia.
          </p>
        </article>
        <article class="value">
          <h3>Spolupráca a komunita</h3>
          <p>
            P&P Turnaje postupne prepája futbalové kluby a mladé talenty z rôznych regiónov Slovenska.
            Našou ambíciou je vytvárať turnaje, na ktoré sa budú tímy radi vracať a ktoré si postupne
            vybudujú dobré meno, tradíciu a stabilné miesto v kalendári mládežníckeho futbalu.
          </p>
        </article>
        <article class="value">
          <h3>Filozofia</h3>
          <p>
            Veríme, že mládežnícky šport nie je iba o výsledkoch a víťazstvách. Je predovšetkým o radosti
            z pohybu, priateľstvách, rešpekte, tímovej spolupráci a skúsenostiach, ktoré si deti odnášajú
            zo športoviska aj do bežného života.
          </p>
        </article>
        <article class="value">
          <h3>Vízia</h3>
          <p>
            Našou víziou je P&P Turnaje dlhodobo rozvíjať, prinášať turnaje do ďalších miest a regiónov
            Slovenska, budovať spoluprácu s futbalovými klubmi, mestami, obcami a partnermi a neustále
            zvyšovať úroveň našich podujatí.
          </p>
        </article>
      </div>
    </section>
  `);
}

function renderTournament(id) {
  const tournament = tournaments.find((item) => item.id === id);
  if (!tournament) return renderNotFound();
  const photos = getTournamentPhotos(tournament);
  setApp(`
    <section class="detail">
      <article class="detail-main">
        <img class="cover" src="${tournament.cover}" alt="${tournament.title}" />
        <p class="eyebrow">${tournament.category} | ${formatDate(tournament.date)}</p>
        <h1>${tournament.title}</h1>
        ${tournamentCopy(tournament)}

        <section class="detail-gallery">
          <div class="section-head">
            <div>
              <p class="eyebrow">Fotogaléria</p>
              <h2>Fotky z turnaja</h2>
            </div>
          </div>
          <div class="gallery">
            ${photos.map(galleryItem).join("") || `<div class="empty">Fotky budú doplnené.</div>`}
          </div>
        </section>
      </article>

      <aside class="fact-panel">
        <dl>
          <div>
            <dt>Miesto</dt>
            <dd>${tournament.location}</dd>
          </div>
          <div>
            <dt>Dátum</dt>
            <dd>${formatDate(tournament.date)}</dd>
          </div>
          <div>
            <dt>Kategória</dt>
            <dd>${tournament.category}</dd>
          </div>
          <div>
            <dt>Počet tímov</dt>
            <dd>${tournament.teamsCount}</dd>
          </div>
          <div>
            <dt>Víťaz</dt>
            <dd>${tournament.winner || "Bude známy po turnaji"}</dd>
          </div>
        </dl>
        <div class="actions">
          <a class="btn" href="#historia">Späť na históriu</a>
        </div>

        ${linkPanel(tournament)}
      </aside>
    </section>
  `);
  setupGalleryPreview();
}

function tournamentCopy(tournament) {
  if (tournament.description && tournament.summary) {
    return `
      <p class="detail-copy">${tournament.description}</p>
      <p class="eyebrow detail-summary-label">Sumár</p>
      <p class="detail-copy">${tournament.summary}</p>
    `;
  }

  return `<p class="detail-copy">${tournament.description || tournament.summary || "Popis turnaja bude doplnený."}</p>`;
}

function linkPanel(tournament) {
  const items = [];

  if (tournament.liveResultsUrl) {
    items.push(`
      <a class="link-item link-item-live" href="${tournament.liveResultsUrl}" target="_blank" rel="noreferrer">
        <span class="link-item-icon" aria-hidden="true"><span class="live-dot"></span></span>
        <span class="link-item-text">
          <strong>Výsledky naživo</strong>
          <small>Sledujte aktuálny priebeh turnaja online</small>
        </span>
        <span class="link-item-arrow" aria-hidden="true">→</span>
      </a>
    `);
  }

  if (tournament.facebookUrl) {
    items.push(`
      <a class="link-item link-item-facebook" href="${tournament.facebookUrl}" target="_blank" rel="noreferrer">
        <span class="link-item-icon" aria-hidden="true">f</span>
        <span class="link-item-text">
          <strong>Facebook</strong>
          <small>Príspevok alebo udalosť turnaja</small>
        </span>
        <span class="link-item-arrow" aria-hidden="true">→</span>
      </a>
    `);
  }

  if (!items.length) return "";

  return `
    <div class="link-panel">
      <p class="eyebrow">Odkazy</p>
      ${items.join("")}
    </div>
  `;
}

function renderContact() {
  setApp(`
    <section class="page-heading dark">
      <p class="eyebrow">Kontakt</p>
      <h1>Máte záujem o turnaj?</h1>
      <p>Napíšte alebo zavolajte, radi zodpovieme všetky otázky ohľadom turnajov.</p>
    </section>
    <section class="contact-grid">
      <div class="value">
        <h3>P&amp;P turnaje, o. z.</h3>
        <p>
          Hrušková 15133/17<br />
          080 01 Prešov<br />
          IČO: 57318476
        </p>
      </div>
      <div class="value">
        <h3>Telefón</h3>
        <p>
          +421 903 926 392<br />
          +421 918 749 410
        </p>
      </div>
      <a class="value value-link" href="mailto:ppturnaje@gmail.com">
        <h3>Email</h3>
        <p>ppturnaje@gmail.com</p>
      </a>
      <div class="value">
        <h3>Bankové spojenie</h3>
        <p>IBAN: SK7783300000002503371312</p>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <div>
          <p class="eyebrow">Sociálne siete</p>
          <h2>Sledujte nás</h2>
        </div>
      </div>
      <div class="social-links">
        <a class="link-item link-item-facebook" href="https://www.facebook.com/profile.php?id=61578093538885" target="_blank" rel="noreferrer">
          <span class="link-item-icon" aria-hidden="true">f</span>
          <span class="link-item-text">
            <strong>Facebook</strong>
            <small>Najnovšie fotky, výsledky a pozvánky na turnaje</small>
          </span>
          <span class="link-item-arrow" aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  `);
}

function renderNotFound() {
  setApp(`
    <section class="page-heading">
      <p class="eyebrow">404</p>
      <h1>Stránka sa nenašla</h1>
      <p>Skúste sa vrátiť na domov alebo históriu turnajov.</p>
      <div class="actions">
        <a class="btn" href="#domov">Domov</a>
      </div>
    </section>
  `);
}

function card(tournament) {
  const photos = getTournamentPhotos(tournament);
  const cardContent = `
    <img src="${tournament.cover}" alt="${tournament.title}" loading="lazy" />
    <div class="card-body">
      <div class="meta">
        <span class="pill">${tournament.category}</span>
        <span class="pill blue">${formatDate(tournament.date)}</span>
      </div>
      <h3>${tournament.title}</h3>
      <p>${tournament.description || tournament.summary || ""}</p>
      <div class="meta">
        <span class="pill">${tournament.location}</span>
        <span class="pill">${photos.length} ${photoCountLabel(photos.length)}</span>
      </div>
    </div>
  `;

  const detailUrl = `#turnaj/${encodeURIComponent(tournament.id)}`;

  return `
    <article class="card">
      <a class="card-main-link" href="${detailUrl}" aria-label="Otvoriť detail pre ${tournament.title}">${cardContent}</a>
      <div class="card-footer">
        <a class="btn" href="${detailUrl}">Otvoriť detail</a>
      </div>
    </article>
  `;
}

function photoCountLabel(count) {
  if (count === 1) return "Fotka";
  if (count >= 2 && count <= 4) return "Fotky";
  return "Fotiek";
}

function getTournamentPhotos(tournament) {
  const folderPhotos = photoManifest[tournament.id] || [];
  const photos = folderPhotos.length ? folderPhotos : tournament.photos || [];
  return photos.map(normalizePhoto);
}

function normalizePhoto(photo) {
  // Firestore dokumenty niekedy maju "photos" ako pole obycajnych URL
  // retazcov namiesto pola { url, alt } map - podporime obe podoby.
  return typeof photo === "string" ? { url: photo, alt: "" } : photo;
}

function galleryItem(photo) {
  if (isDirectImage(photo.url)) {
    return `
      <button class="gallery-item" type="button" data-preview-src="${photo.url}" data-preview-alt="${photo.alt || "Fotka z turnaja"}">
        <img src="${photo.url}" alt="${photo.alt || "Fotka z turnaja"}" loading="lazy" onerror="this.closest('.gallery-item').classList.add('image-missing')" />
      </button>
    `;
  }

  return `
    <a class="gallery-external" href="${photo.url}" target="_blank" rel="noreferrer">
      <strong>Facebook fotka</strong>
      <span>${photo.alt || "Otvoriť fotku na Facebooku"}</span>
      <em>Otvoriť externý link</em>
    </a>
  `;
}

function getPastTournaments() {
  const todayIso = toIsoDate(new Date());
  return tournaments
    .filter((tournament) => tournament.date <= todayIso)
    .sort((a, b) => b.date.localeCompare(a.date));
}

function getUpcomingTournaments() {
  const todayIso = toIsoDate(new Date());
  return tournaments
    .filter((tournament) => tournament.date > todayIso)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function isDirectImage(url) {
  return /\.(png|jpe?g|webp|gif|avif)(\?.*)?$/i.test(url) || url.includes("images.unsplash.com");
}

let previewItems = [];
let previewIndex = 0;

function setupGalleryPreview() {
  const nodes = document.querySelectorAll("[data-preview-src]");
  const items = Array.from(nodes).map((node) => ({
    src: node.dataset.previewSrc,
    alt: node.dataset.previewAlt
  }));
  nodes.forEach((node, index) => {
    node.addEventListener("click", () => openPreview(items, index));
  });
}

function openPreview(items, index) {
  previewItems = items;
  previewIndex = index;
  renderPreview();
  document.body.classList.add("preview-open");
  document.addEventListener("keydown", handlePreviewKeydown);
}

function renderPreview() {
  let preview = document.querySelector(".lightbox");
  if (!preview) {
    preview = document.createElement("div");
    preview.className = "lightbox";
    preview.setAttribute("role", "dialog");
    preview.setAttribute("aria-modal", "true");
    preview.addEventListener("click", (event) => {
      if (event.target === preview) closePreview();
    });
    document.body.append(preview);
  }

  const item = previewItems[previewIndex];
  const hasMultiple = previewItems.length > 1;

  preview.innerHTML = `
    <button class="lightbox-close" type="button" aria-label="Zavrieť náhľad">×</button>
    ${hasMultiple ? `<button class="lightbox-nav lightbox-prev" type="button" aria-label="Predchádzajúca fotka">‹</button>` : ""}
    <figure>
      <img src="${item.src}" alt="${item.alt || "Fotka z turnaja"}" />
      <figcaption>
        ${item.alt || "Fotka z turnaja"}
        ${hasMultiple ? `<span class="lightbox-counter">${previewIndex + 1} / ${previewItems.length}</span>` : ""}
      </figcaption>
    </figure>
    ${hasMultiple ? `<button class="lightbox-nav lightbox-next" type="button" aria-label="Ďalšia fotka">›</button>` : ""}
  `;

  preview.querySelector(".lightbox-close").addEventListener("click", closePreview);
  preview.querySelector(".lightbox-prev")?.addEventListener("click", (event) => {
    event.stopPropagation();
    showPreviewOffset(-1);
  });
  preview.querySelector(".lightbox-next")?.addEventListener("click", (event) => {
    event.stopPropagation();
    showPreviewOffset(1);
  });
}

function showPreviewOffset(offset) {
  previewIndex = (previewIndex + offset + previewItems.length) % previewItems.length;
  renderPreview();
}

function handlePreviewKeydown(event) {
  if (event.key === "Escape") return closePreview();
  if (event.key === "ArrowLeft") return showPreviewOffset(-1);
  if (event.key === "ArrowRight") return showPreviewOffset(1);
}

function closePreview() {
  document.querySelector(".lightbox")?.remove();
  document.body.classList.remove("preview-open");
  document.removeEventListener("keydown", handlePreviewKeydown);
}

function setApp(html) {
  closePreview();
  document.getElementById("app").innerHTML = html;
  closeMenu();
  updateActiveNav();
  window.scrollTo({ top: 0, behavior: "auto" });
}

function setupMenu() {
  const toggle = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-menu]");
  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("menu-open", isOpen);
  });
  menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
}

function closeMenu() {
  const toggle = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-menu]");
  if (!toggle || !menu) return;
  menu.classList.remove("open");
  toggle.setAttribute("aria-expanded", "false");
  document.body.classList.remove("menu-open");
}

function updateActiveNav() {
  const current = location.hash.replace("#", "").split("/")[0] || "domov";
  document.querySelectorAll(".main-nav a").forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${current}`);
  });
}

function formatDate(date) {
  return new Intl.DateTimeFormat("sk-SK", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(`${date}T12:00:00`));
}

function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

boot().catch((error) => {
  console.error(error);
  document.getElementById("app").innerHTML = `
    <section class="page-heading">
      <h1>Ups, niečo sa pokazilo.</h1>
      <p>Na odstránení chyby usilovne pracujeme.</p>
    </section>
  `;
});
