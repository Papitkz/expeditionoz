<template>
  <v-main class="error-page pa-0">
    <!-- Animated Ocean Background -->
    <div class="ocean-bg">
      <div class="ocean-bg__layer ocean-bg__layer--back" :style="backImage ? { backgroundImage: `url(${backImage})` } : {}" />
      <div class="ocean-bg__layer ocean-bg__layer--mid" :style="midImage ? { backgroundImage: `url(${midImage})` } : {}" />
      <div class="ocean-bg__layer ocean-bg__layer--front" :style="frontImage ? { backgroundImage: `url(${frontImage})` } : {}" />
    </div>

    <!-- Floating Particles Canvas -->
    <canvas ref="particleCanvas" class="particle-canvas" />

    <!-- Vignette & Depth Overlay -->
    <div class="depth-overlay" />

    <!-- Main Hero - PERFECTLY CENTERED -->
    <section class="hero-section">
      <v-container class="pa-0 fill-height">
        <v-row class="fill-height no-gutters" justify="center" align="center">
          <v-col cols="12" md="10" lg="8" class="text-center hero-col pa-4 pa-md-8">
            <!-- Status Badge -->
            <div class="status-badge mb-6 mt-5">
              <span class="status-badge__pulse" />
              <span class="status-badge__text">Signal Lost</span>
            </div>

            <!-- Massive 404 with Character Animation -->
            <div class="error-code-wrapper mb-2">
              <span
                v-for="(char, i) in '404'"
                :key="i"
                class="error-char"
                :style="{ animationDelay: `${i * 0.15}s` }"
              >
                {{ char }}
              </span>
            </div>

            <!-- Divider -->
            <div class="ornament-divider mb-6">
              <span class="ornament-divider__line" />
              <v-icon icon="mdi-anchor" size="small" class="ornament-divider__icon mx-4" />
              <span class="ornament-divider__line" />
            </div>

            <!-- Title -->
            <h1 class="hero-title mb-5">
              Lost in the
              <span class="text-gold">Abyss</span>
            </h1>

            <!-- Subtitle -->
            <p class="hero-subtitle mb-10 mx-auto">
              The coordinates you entered lead to uncharted waters. 
              Our navigation systems cannot locate this destination in the reef network.
            </p>

            <!-- Action Buttons -->
            <div class="d-flex flex-column flex-sm-row justify-center ga-5">
              <v-btn
                to="/"
                class="btn-luxury-primary"
                size="x-large"
                rounded="0"
                elevation="0"
              >
                <v-icon start icon="mdi-compass" class="mr-2" />
                Return to Surface
              </v-btn>

              <v-btn
                to="/expeditions"
                class="btn-luxury-outline"
                size="x-large"
                variant="outlined"
                rounded="0"
              >
                <v-icon start icon="mdi-map-marker-path" class="mr-2" />
                Chart a Course
              </v-btn>
            </div>

            <!-- Depth Indicator -->
            <div class="depth-indicator mt-16">
              <div class="depth-indicator__label">Current Depth</div>
              <div class="depth-indicator__value">404 <span class="depth-indicator__unit">meters</span></div>
              <div class="depth-indicator__bar">
                <div class="depth-indicator__progress" />
              </div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- Navigation Cards -->
    <section class="navigation-cards">
      <div class="section-divider" />
<center>
        
      <v-container>
        <div class="text-center mb-12">
          <span class="overline-text">Alternative Routes</span>
          <h2 class="section-title mt-3">Find Your Bearing</h2>
          <div class="gold-divider mx-auto mt-4" />
        </div>

        <v-row>
          <v-col
            v-for="(link, i) in links"
            :key="i"
            cols="12"
            sm="6"
            md="4"
          >
            <v-card
              :to="link.to"
              class="nav-card h-100"
              elevation="0"
              rounded="0"
              :ripple="false"
            >
              <div class="nav-card__shine" />
              
              <v-card-text class="pa-8 text-center">
                <!-- Icon with orbit animation -->
                <div class="nav-card__icon-wrapper mb-6">
                  <v-icon
                    :icon="link.icon"
                    size="48"
                    class="nav-card__icon"
                  />
                  <div class="nav-card__orbit" />
                </div>

                <h3 class="nav-card__title text-h5 mb-3">{{ link.title }}</h3>
                <p class="nav-card__desc text-body-2 mb-6">{{ link.desc }}</p>

                <div class="nav-card__cta">
                  <span>{{ link.cta }}</span>
                  <v-icon icon="mdi-arrow-right" size="small" class="ml-2 nav-card__arrow" />
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
</center>
    </section>

    <!-- Footer Marquee -->
    <div class="marquee-bar">
      <div class="marquee-bar__track">
        <span v-for="n in 10" :key="n" class="marquee-bar__item">
          <v-icon icon="mdi-waves" size="x-small" class="mx-4" />
          404 — UNCHARTED WATERS
          <v-icon icon="mdi-waves" size="x-small" class="mx-4" />
          DEPTH: 404 METERS
        </span>
      </div>
    </div>
  </v-main>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useComponentCMS } from '@/composables/useComponentCMS'

const cms = useComponentCMS('NotFoundView')

const backImage = computed(() => cms.getImageUrl('oceanLayers', 0))
const midImage = computed(() => cms.getImageUrl('oceanLayers', 1))
const frontImage = computed(() => cms.getImageUrl('oceanLayers', 2))

// Navigation links
const links = ref([
  {
    title: 'Ocean Safari Expedition',
    desc: 'Premium 6-day live-aboard through the Northern Reef passages. Limited berths available.',
    icon: 'mdi-sail-boat',
    to: '/expeditions/ocean-safari',
    cta: 'Reserve Berth'
  },
  {
    title: 'Dive Expedition Expedition',
    desc: 'The ultimate 9-day traverse covering the full reef system. Our flagship voyage.',
    icon: 'mdi-ferry',
    to: '/expeditions/dive-expedition',
    cta: 'View Itinerary'
  },
  {
    title: 'Plan Your Journey',
    desc: 'Connect with our expedition planners to customize your reef experience.',
    icon: 'mdi-map-search',
    to: '/contact',
    cta: 'Contact Concierge'
  }
])

// Particle Canvas Logic
const particleCanvas = ref(null)
let animationId = null
let particles = []

class Particle {
  constructor(canvas) {
    this.canvas = canvas
    this.reset()
  }

  reset() {
    this.x = Math.random() * this.canvas.width
    this.y = this.canvas.height + Math.random() * 100
    this.size = Math.random() * 2 + 0.5
    this.speedY = Math.random() * 0.5 + 0.2
    this.speedX = (Math.random() - 0.5) * 0.3
    this.opacity = Math.random() * 0.5 + 0.1
    this.wobble = Math.random() * Math.PI * 2
    this.wobbleSpeed = Math.random() * 0.02 + 0.01
  }

  update() {
    this.y -= this.speedY
    this.x += Math.sin(this.wobble) * 0.3 + this.speedX
    this.wobble += this.wobbleSpeed
    
    if (this.y < -10) {
      this.reset()
    }
  }

  draw(ctx) {
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(201, 168, 76, ${this.opacity})`
    ctx.fill()
  }
}

const initParticles = () => {
  const canvas = particleCanvas.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  
  const resize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  resize()
  window.addEventListener('resize', resize)

  // Create particles
  for (let i = 0; i < 60; i++) {
    particles.push(new Particle(canvas))
  }

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    particles.forEach(p => {
      p.update()
      p.draw(ctx)
    })
    animationId = requestAnimationFrame(animate)
  }
  animate()

  return () => window.removeEventListener('resize', resize)
}

onMounted(() => {
  const cleanup = initParticles()
  cms.load()
  onUnmounted(() => {
    if (animationId) cancelAnimationFrame(animationId)
    cleanup?.()
  })
})
</script>

<style scoped>
/* ============================================
   DESIGN TOKENS & VARIABLES
   ============================================ */
:root {
  --ocean-950: #030c1a;
  --ocean-900: #071a2b;
  --ocean-800: #0d2a42;
  --ocean-700: #143d5c;
  --gold-400: #c9a84c;
  --gold-300: #d4b96a;
  --gold-500: #a88a3a;
  --gold-600: #8a6f2e;
  --sand-100: #f8f5ef;
  --sand-200: #e6e1d7;
  --sand-300: #d4cdc0;
  
  --font-display: 'Playfair Display', 'Times New Roman', serif;
  --font-body: 'Montserrat', 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

/* ============================================
   LAYOUT & BACKGROUND
   ============================================ */
.error-page :deep(.v-main__wrap) {
  padding: 0 !important;
}

.error-page {
  position: relative;
  background-color: var(--ocean-950);
  overflow-x: hidden;
  margin: 0;
}

/* Animated Ocean Layers */
.ocean-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.ocean-bg__layer {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0;
  animation: oceanFade 20s infinite;
}

.ocean-bg__layer--back {
  animation-delay: 0s;
  filter: brightness(0.3) saturate(1.2);
}

.ocean-bg__layer--mid {
  animation-delay: -7s;
  filter: brightness(0.4) saturate(1.4);
}

.ocean-bg__layer--front {
  animation-delay: -14s;
  filter: brightness(0.5) saturate(1.6);
}

@keyframes oceanFade {
  0%, 33% { opacity: 0; }
  16%, 20% { opacity: 1; }
  100% { opacity: 0; }
}

/* Particle Canvas */
.particle-canvas {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

/* Depth Vignette */
.depth-overlay {
  position: fixed;
  inset: 0;
  z-index: 2;
  background: 
    radial-gradient(ellipse at center, transparent 0%, transparent 40%, var(--ocean-950) 100%),
    linear-gradient(to bottom, rgba(3, 12, 26, 0.8) 0%, transparent 30%, transparent 70%, rgba(3, 12, 26, 0.95) 100%);
  pointer-events: none;
}

/* ============================================
   HERO SECTION - PERFECT CENTERING
   ============================================ */
.hero-section {
  position: relative;
  z-index: 3;
  height: 100vh; /* Full viewport height */
  display: flex;
  align-items: center;
  justify-content: center; /* KEY: Perfect centering */
  padding: 2rem 0;
}

.hero-col {
  animation: heroEnter 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  opacity: 0;
  transform: translateY(30px);
  max-width: 800px; /* Prevent stretching */
  width: 100%;
}

@keyframes heroEnter {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Status Badge */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1.25rem;
  border: 1px solid rgba(201, 168, 76, 0.3);
  background: rgba(201, 168, 76, 0.05);
  position: relative;
}

.status-badge__pulse {
  width: 8px;
  height: 8px;
  background: var(--gold-400);
  border-radius: 50%;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  box-shadow: 0 0 0 0 rgba(201, 168, 76, 0.7);
}

@keyframes pulse {
  0%, 100% { 
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(201, 168, 76, 0.7);
  }
  50% { 
    opacity: 0.5;
    box-shadow: 0 0 0 8px rgba(201, 168, 76, 0);
  }
}

.status-badge__text {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--gold-400);
}

/* 404 Characters */
.error-code-wrapper {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  line-height: 1;
}

.error-char {
  font-family: var(--font-display);
  font-size: clamp(8rem, 20vw, 14rem);
  font-weight: 400;
  color: transparent;
  -webkit-text-stroke: 2px rgba(201, 168, 76, 0.4);
  display: inline-block;
  animation: charReveal 1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  opacity: 0;
  transform: translateY(40px) rotateX(-40deg);
  transform-origin: center bottom;
}

@keyframes charReveal {
  to {
    opacity: 1;
    transform: translateY(0) rotateX(0);
  }
}

/* Ornament Divider */
.ornament-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gold-400);
  opacity: 0.6;
}

.ornament-divider__line {
  display: block;
  width: 60px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold-400), transparent);
}

/* Typography */
h1, h2, h3, p, .hero-title, .section-title, .hero-subtitle, .nav-card__title, .nav-card__desc {
  margin-top: 0 !important;
}

.hero-title {
  font-family: var(--font-display);
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 400;
  color: var(--sand-100);
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.text-gold {
  color: var(--gold-400);
  font-style: italic;
  position: relative;
}

.text-gold::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--gold-400), transparent);
  opacity: 0.5;
}

.hero-subtitle {
  font-family: var(--font-body);
  font-size: clamp(0.9rem, 1.5vw, 1.1rem);
  color: var(--sand-300);
  font-weight: 300;
  line-height: 1.7;
  max-width: 520px;
  letter-spacing: 0.02em;
}

/* Buttons - GOLDEN PERFECTION */
.btn-luxury-primary {
  background: linear-gradient(135deg, #E8C547 0%, #D4AF37 50%, #AA8C2C 100%) !important;
  color: #030c1a !important; 
  border: none !important;
  font-family: var(--font-body);
  text-transform: uppercase;
  letter-spacing: 0.15em;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0 2.5rem !important;
  height: 56px !important;
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
}

.btn-luxury-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  transition: left 0.6s;
}

.btn-luxury-primary:hover::before {
  left: 100%;
}

.btn-luxury-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(212, 175, 55, 0.5); 
}

.btn-luxury-outline {
  color: #D4AF37 !important; 
  border: 1px solid #D4AF37 !important; 
  font-family: var(--font-body);
  text-transform: uppercase;
  letter-spacing: 0.15em;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0 2.5rem !important;
  height: 56px !important;
  transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  background: transparent !important;
}

.btn-luxury-outline:hover {
  background: rgba(212, 175, 55, 0.1) !important; 
  border-color: #FFD700 !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(212, 175, 55, 0.2);
}

/* Depth Indicator */
.depth-indicator {
  opacity: 0.7;
}

.depth-indicator__label {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--gold-400);
  margin-bottom: 0.5rem;
}

.depth-indicator__value {
  font-family: var(--font-display);
  font-size: 2.5rem;
  color: var(--sand-100);
  line-height: 1;
}

.depth-indicator__unit {
  font-size: 1rem;
  color: var(--gold-400);
  font-style: italic;
  margin-left: 0.25rem;
}

.depth-indicator__bar {
  width: 120px;
  height: 2px;
  background: rgba(201, 168, 76, 0.2);
  margin: 1rem auto 0;
  position: relative;
  overflow: hidden;
}

.depth-indicator__progress {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 40%;
  background: var(--gold-400);
  animation: depthPulse 3s ease-in-out infinite;
}

@keyframes depthPulse {
  0%, 100% { width: 40%; opacity: 1; }
  50% { width: 70%; opacity: 0.6; }
}

/* Navigation Cards */
.section-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(201, 168, 76, 0.3), transparent);
  margin: 0 auto;
  max-width: 200px;
}

.navigation-cards {
  position: relative;
  z-index: 3;
  padding: 6rem 0;
  background: linear-gradient(to bottom, transparent, rgba(3, 12, 26, 0.5));
}

.overline-text {
  font-family: var(--font-body);
  text-transform: uppercase;
  letter-spacing: 0.25em;
  font-size: 0.7rem;
  color: var(--gold-400);
  display: block;
}

.section-title {
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 3vw, 2.5rem);
  color: var(--sand-100);
  font-weight: 400;
}

.gold-divider {
  width: 40px;
  height: 2px;
  background: var(--gold-400);
}

.nav-card {
  background: rgba(255, 255, 255, 0.02) !important;
  border: 1px solid rgba(201, 168, 76, 0.15) !important;
  position: relative;
  overflow: hidden;
  transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  cursor: pointer;
  text-decoration: none;
  display: flex;
  flex-direction: column;
}

.nav-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(201, 168, 76, 0.05), transparent 60%);
  opacity: 0;
  transition: opacity 0.5s;
}

.nav-card:hover::before {
  opacity: 1;
}

.nav-card:hover {
  border-color: rgba(201, 168, 76, 0.4) !important;
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.nav-card__shine {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 40%,
    rgba(201, 168, 76, 0.03) 50%,
    transparent 60%
  );
  transform: rotate(30deg);
  transition: all 0.8s;
  pointer-events: none;
}

.nav-card:hover .nav-card__shine {
  transform: rotate(30deg) translate(20%, 20%);
}

.nav-card__icon-wrapper {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-card__icon {
  color: var(--gold-400);
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

.nav-card:hover .nav-card__icon {
  transform: scale(1.1);
}

.nav-card__orbit {
  position: absolute;
  inset: 0;
  border: 1px solid rgba(201, 168, 76, 0.2);
  border-radius: 50%;
  animation: orbitRotate 8s linear infinite;
}

.nav-card__orbit::before {
  content: '';
  position: absolute;
  top: -2px;
  left: 50%;
  width: 4px;
  height: 4px;
  background: var(--gold-400);
  border-radius: 50%;
  transform: translateX(-50%);
}

@keyframes orbitRotate {
  to { transform: rotate(360deg); }
}

.nav-card__title {
  font-family: var(--font-display);
  color: var(--sand-100);
  font-weight: 400;
}

.nav-card__desc {
  color: var(--sand-300);
  line-height: 1.6;
  opacity: 0.8;
}


.nav-card__cta {
  display: inline-flex;
  align-items: center;
  color: var(--gold-400);
  font-family: var(--font-body);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  font-weight: 600;
  position: relative;
  margin-top: auto; /* Pushes CTA to bottom if cards have different heights */
}

.nav-card__cta::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 1px;
  background: var(--gold-400);
  transition: width 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

.nav-card:hover .nav-card__cta::after {
  width: 100%;
}

.nav-card__arrow {
  transition: transform 0.3s;
}

.nav-card:hover .nav-card__arrow {
  transform: translateX(4px);
}

/* ============================================
   MARQUEE BAR
   ============================================ */
.marquee-bar {
  position: relative;
  z-index: 3;
  background: rgba(201, 168, 76, 0.05);
  border-top: 1px solid rgba(201, 168, 76, 0.15);
  padding: 1rem 0;
  overflow: hidden;
}

.marquee-bar__track {
  display: flex;
  animation: marqueeScroll 30s linear infinite;
  width: max-content;
}

.marquee-bar__item {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(201, 168, 76, 0.4);
  white-space: nowrap;
  padding-right: 2rem;
}

@keyframes marqueeScroll {
  to { transform: translateX(-50%); }
}

/* ============================================
   RESPONSIVE
   ============================================ */
@media (max-width: 600px) {
  .error-char {
    font-size: 6rem;
    -webkit-text-stroke: 1px rgba(201, 168, 76, 0.4);
  }
  
  .hero-title {
    font-size: 1.75rem;
  }
  
  .btn-luxury-primary,
  .btn-luxury-outline {
    width: 100%;
    justify-content: center;
  }
  
  .nav-card {
    margin-bottom: 1rem;
  }
}
/* Buttons */
.btn-luxury-primary {
  /* Rich Metallic Gold Gradient */
  background: linear-gradient(135deg, #E8C547 0%, #D4AF37 50%, #AA8C2C 100%) !important;
  
  /* Dark text for contrast (or use white if you prefer) */
  color: #030c1a !important; 
  
  border: none !important;
  font-family: var(--font-body);
  text-transform: uppercase;
  letter-spacing: 0.15em;
  font-size: 0.8rem;
  font-weight: 700; /* Bold for better visibility on gold */
  padding: 0 2.5rem !important;
  height: 56px !important;
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3); /* Gold glow */
}

/* Shine Effect on Hover */
.btn-luxury-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  transition: left 0.6s;
}

.btn-luxury-primary:hover::before {
  left: 100%;
}

.btn-luxury-primary:hover {
  transform: translateY(-2px);
  /* Brighter shadow on hover */
  box-shadow: 0 10px 25px rgba(212, 175, 55, 0.5); 
}

/* --- Outline Button (Gold Border & Text) --- */
.btn-luxury-outline {
  /* Pure Gold Color */
  color: #D4AF37 !important; 
  
  /* Gold Border */
  border: 1px solid #D4AF37 !important; 
  
  font-family: var(--font-body);
  text-transform: uppercase;
  letter-spacing: 0.15em;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0 2.5rem !important;
  height: 56px !important;
  transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  background: transparent !important;
}

.btn-luxury-outline:hover {
  /* Subtle Gold Fill on Hover */
  background: rgba(212, 175, 55, 0.1) !important; 
  border-color: #FFD700 !important; /* Brighter Gold on hover */
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(212, 175, 55, 0.2);
}
</style>
