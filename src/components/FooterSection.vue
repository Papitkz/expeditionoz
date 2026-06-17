<script setup lang="ts">
const currentYear = new Date().getFullYear()

const expeditionLinks = [
  { label: 'Dive Expedition', to: '/expeditions/dive' },
  { label: 'Ocean Safari', to: '/expeditions/ocean-safari' },
  { label: 'Special Expeditions', to: '/expeditions/special' },
  { label: 'Upcoming Dates', to: '/expeditions/dates' },
  { label: 'Inclusions', to: '/expeditions/inclusions' },
  { label: 'FAQ', to: '/faq' },
]

const aboutLinks = [
  { label: 'Our Story', to: '/about' },
  { label: 'Our Boats', to: '/about/boats' },
  { label: 'Our Crew', to: '/about/crew' },
  { label: 'Sustainability', to: '/about/sustainability' },
  { label: 'Partners', to: '/about/partners' },
]

const journalLinks = [
  { label: 'Stories', to: '/journal/stories' },
  { label: 'Wildlife', to: '/journal/wildlife' },
  { label: 'Behind The Scenes', to: '/journal/behind-the-scenes' },
  { label: 'News', to: '/journal/news' },
]

const contactLinks = [
  { label: 'Booking Enquiry', to: '/book' },
  { label: 'Get In Touch', to: '/contact' },
]
</script>

<template>
  <footer class="site-footer">
    <div class="footer-inner">

      <!-- Main Grid -->
      <div class="footer-grid">

        <!-- Brand Column -->
        <div class="brand-col">
          <div class="brand-logo">
            <span class="logo-eyebrow">EXPEDITION</span>
            <span class="logo-oz">OZ</span>
          </div>
          <p class="brand-tagline">
            All inclusive small group expeditions exploring Ningaloo Reef by sail.
          </p>
          <div class="social-row ">
            <a href="https://www.instagram.com/ExpeditionOz/" class="social-btn" aria-label="Instagram">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
            <a href="https://www.facebook.com/ExpeditionOz/" class="social-btn" aria-label="Facebook">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
            <a href="https://m.youtube.com/@ExpeditionOz" class="social-btn" aria-label="YouTube">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
                <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
              </svg>
            </a>
          </div>
        </div>

        <!-- Divider (desktop only) -->
        <div class="brand-divider" aria-hidden="true"></div>

        <!-- Link Matrix Container -->
        <div class="footer-links-matrix">
          
          <!-- Expeditions Column -->
          <div class="nav-col expeditions-panel">
            <h4 class="nav-col-heading">EXPEDITIONS</h4>
            <ul class="nav-list">
              <li v-for="link in expeditionLinks" :key="link.to">
                <router-link :to="link.to" class="nav-link">{{ link.label }}</router-link>
              </li>
            </ul>
          </div>

          <!-- About Column -->
          <div class="nav-col about-panel">
            <h4 class="nav-col-heading">ABOUT</h4>
            <ul class="nav-list">
              <li v-for="link in aboutLinks" :key="link.to">
                <router-link :to="link.to" class="nav-link">{{ link.label }}</router-link>
              </li>
            </ul>
          </div>

          <!-- Journal Column -->
          <div class="nav-col journal-panel">
            <h4 class="nav-col-heading">JOURNAL</h4>
            <ul class="nav-list">
              <li v-for="link in journalLinks" :key="link.to">
                <router-link :to="link.to" class="nav-link">{{ link.label }}</router-link>
              </li>
            </ul>
          </div>

          <!-- Contact Column -->
          <div class="nav-col contact-panel">
            <h4 class="nav-col-heading">CONTACT</h4>
            <div class="nav-list">
              <ul>
                <li v-for="link in contactLinks" :key="link.to">
                  <router-link :to="link.to" class="nav-link">{{ link.label }}</router-link>
                </li>
              </ul>
              <div class="contact-details">
                <a href="mailto:info@expeditionoz.com.au" class="nav-link contact-item">info@expeditionoz.com.au</a>
                <a href="tel:+61812345678" class="nav-link contact-item">+61 8 1234 5678</a>
              </div>
            </div>
          </div>

        </div>

      </div>

      <!-- Bottom Bar -->
      <div class="footer-bottom">
        <p class="bottom-copy">&copy; {{ currentYear }} Expedition OZ</p>
        <div class="bottom-links">
          <a href="#" class="bottom-link">Privacy Policy</a>
          <span class="bottom-sep" aria-hidden="true">|</span>
          <a href="#" class="bottom-link">Terms &amp; Conditions</a>
        </div>
      </div>

    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  background-color: #0b1a28;
  color: #e8e4dc;
  font-family: var(--font-body, 'Georgia', serif);
}

.footer-inner {
  margin: auto;
  padding: 40px 40px 0;
}

/* ── Main grid ── */
.footer-grid {
  display: flex;
  align-items: flex-start;
  gap: 0;
}

.footer-links-matrix {
  display: flex;
  flex: 1;
  gap: 0;
}

/* ── Brand column ── */
.brand-col {
  flex: 0 0 220px;
  padding-right: 40px;
}

.brand-logo {
  display: flex;
  flex-direction: column;
  line-height: 1;
  margin-bottom: 14px;
}

.logo-eyebrow {
  font-size: 0.6rem;
  letter-spacing: 0.25em;
  color: rgba(232, 228, 220, 0.65);
  font-family: var(--font-heading, sans-serif);
  font-weight: 500;
  margin-bottom: 4px;
}

.logo-oz {
  font-size: 2.6rem;
  font-weight: 700;
  color: #e8e4dc;
  font-family: var(--font-heading, sans-serif);
  letter-spacing: 0.04em;
}

.brand-tagline {
  font-size: 0.8rem;
  line-height: 1.65;
  color: rgba(232, 228, 220, 0.55);
  margin-bottom: 20px;
}

.social-row {
  display: flex;
  gap: 10px;
}

.social-btn {
  width: 34px;
  height: 34px;
  border: 1px solid rgba(232, 228, 220, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(232, 228, 220, 0.6);
  text-decoration: none;
  transition: color 0.2s, border-color 0.2s;
}

.social-btn:hover {
  color: #e8e4dc;
  border-color: rgba(232, 228, 220, 0.6);
}

/* ── Vertical divider ── */
.brand-divider {
  width: 1px;
  background: rgba(232, 228, 220, 0.12);
  margin: 0 44px 20px 44px;
  align-self: stretch;
  flex-shrink: 0;
}

/* ── Nav columns ── */
.nav-col {
  flex: 1;
  min-width: 0;
}

.nav-col ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-col-heading {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #e8e4dc;
  margin-top: 0;
  margin-bottom: 14px;
  font-family: var(--font-heading, sans-serif);
}

.nav-link {
  display: block;
  font-size: 0.82rem;
  color: rgba(232, 228, 220, 0.55);
  text-decoration: none;
  padding: 3.5px 0;
  transition: color 0.2s;
  font-family: var(--font-body, serif);
}

.nav-link:hover {
  color: #e8e4dc;
}

.contact-details {
  margin-top: 20px;
}

.contact-item {
  display: block;
}

/* ── Bottom bar ── */
.footer-bottom {
  margin-top: 48px;
  border-top: 1px solid rgba(232, 228, 220, 0.1);
  padding: 18px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.bottom-copy {
  font-size: 0.75rem;
  color: rgba(232, 228, 220, 0.4);
  margin: 0;
}

.bottom-links {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bottom-sep {
  color: rgba(232, 228, 220, 0.25);
  font-size: 0.75rem;
}

.bottom-link {
  font-size: 0.75rem;
  color: rgba(232, 228, 220, 0.4);
  text-decoration: none;
  transition: color 0.2s;
}

.bottom-link:hover {
  color: rgba(232, 228, 220, 0.75);
}

/* ── Tablet Breakpoint ── */
@media (max-width: 900px) and (min-width: 601px) {
  .footer-inner {
    padding-top: 40px;
  }

  .footer-grid {
    flex-wrap: wrap;
    gap: 36px;
  }

  .footer-links-matrix {
    width: 100%;
    flex-wrap: wrap;
    gap: 36px;
  }

  .brand-col {
    flex: 0 0 100%;
    padding-right: 0;
    padding-bottom: 0;
  }

  .brand-divider {
    display: none;
  }

  .nav-col {
    flex: 1 1 140px;
  }
}

/* ── Mobile View Overhaul (Widths Under 600px) ── */
@media (max-width: 600px) {
  .footer-inner {
    padding: 24px 16px 8px;
  }

  .footer-grid {
    flex-direction: column;
    align-items: stretch;
    gap: 20px;
  }

  .brand-col {
    flex: unset;
    width: 100%;
    padding-right: 0;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .brand-logo {
    margin-bottom: 8px;
  }

  .brand-tagline {
    font-size: 0.78rem;
    margin-bottom: 12px;
    max-width: 290px;
  }

  .brand-divider {
    display: none;
  }

  /* 
    2-COLUMN ORDERED MATRIX GRID
    Maps explicit named grid template areas to keep pairs aligned cleanly:
    Row 1: Expeditions | Journal
    Row 2: About       | Contact
  */
  .footer-links-matrix {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-areas: 
      "expeditions journal"
      "about contact";
    width: 100%;
    gap: 24px 16px;
    border-top: 1px solid rgba(232, 228, 220, 0.08);
    padding-top: 20px;
  }

  .expeditions-panel { grid-area: expeditions; }
  .journal-panel     { grid-area: journal; }
  .about-panel       { grid-area: about; }
  .contact-panel     { grid-area: contact; }

  .nav-col {
    text-align: left;
  }

  .nav-col-heading {
    font-size: 0.68rem;
    letter-spacing: 0.08em;
    margin-bottom: 8px;
    color: rgba(232, 228, 220, 0.9);
  }

  .nav-link {
    font-size: 0.78rem;
    padding: 3px 0;
  }

  .contact-details {
    margin-top: 8px;
    padding-top: 0;
    border-top: none;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .footer-bottom {
    margin-top: 24px;
    padding: 14px 0 8px;
    flex-direction: column;
    gap: 8px;
  }

  .bottom-links {
    gap: 12px;
  }
}
</style>