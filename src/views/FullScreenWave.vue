<!-- Alternative: FullScreenWave.vue - For hero sections -->
<template>
  <section class="fullscreen-wave">
    <div class="wave-hero-content">
      <slot />
    </div>
    
    <div class="wave-animation">
      <div class="wave wave-1"></div>
      <div class="wave wave-2"></div>
      <div class="wave wave-3"></div>
      <div class="wave wave-4"></div>
    </div>
    
    <div class="wave-overlay"></div>
  </section>
</template>

<style scoped>
.fullscreen-wave {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(
    180deg,
    #001f3f 0%,
    #003366 50%,
    #071a2b 100%
  );
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wave-hero-content {
  position: relative;
  z-index: 10;
  text-align: center;
  padding: 2rem;
  max-width: 900px;
}

.wave-animation {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.wave {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 200%;
  height: 200px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%23c9a84c' fill-opacity='0.2' d='M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E") repeat-x;
  background-size: 50% 100%;
  animation: wave-scroll 20s linear infinite;
}

.wave-1 {
  bottom: 0;
  opacity: 0.3;
  animation-duration: 25s;
  height: 180px;
}

.wave-2 {
  bottom: 10px;
  opacity: 0.2;
  animation-duration: 20s;
  animation-delay: -5s;
  height: 200px;
}

.wave-3 {
  bottom: 20px;
  opacity: 0.15;
  animation-duration: 15s;
  animation-delay: -2s;
  height: 220px;
}

.wave-4 {
  bottom: 30px;
  opacity: 0.1;
  animation-duration: 30s;
  animation-delay: -10s;
  height: 250px;
}

@keyframes wave-scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

.wave-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(ellipse at center, transparent 0%, rgba(7, 26, 43, 0.4) 100%),
    linear-gradient(to bottom, rgba(0, 31, 63, 0.3) 0%, transparent 50%);
  z-index: 2;
  pointer-events: none;
}

@media (max-width: 768px) {
  .wave {
    height: 120px;
  }
}
</style>