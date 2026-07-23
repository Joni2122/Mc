/**
 * Startanimation: Minecraft-Grasblock mit Abbau-Animation und Partikel-Explosion.
 * Gibt ein Promise zurück, das aufgelöst wird, wenn die Animation fertig ist.
 */
export function playStartAnimation() {
  return new Promise((resolve) => {
    const startScreen = document.getElementById('start-screen');
    const particlesContainer = document.getElementById('particles');

    // Partikel-Explosion beim "Abbauen" des Blocks auslösen
    const spawnParticles = () => {
      const rect = startScreen.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const particleCount = 40;

      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';

        const angle = Math.random() * Math.PI * 2;
        const distance = 60 + Math.random() * 180;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;

        particle.style.left = `${centerX}px`;
        particle.style.top = `${centerY}px`;
        particle.style.setProperty('--dx', `${dx}px`);
        particle.style.setProperty('--dy', `${dy}px`);
        particle.style.animationDelay = `${Math.random() * 0.15}s`;

        // Zufällige Grasblock-Farbtöne
        const colors = ['#6abe30', '#4a9e20', '#8b5a2b', '#6b4423'];
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];

        particlesContainer.appendChild(particle);
      }
    };

    // Partikel nach der "Mining"-Phase des Blocks spawnen (ca. bei 70% der mineBlock-Animation)
    setTimeout(spawnParticles, 1400);

    // Gesamtdauer der Startanimation (muss zur CSS-Animation fadeOutScreen passen: 2.6s)
    const totalDuration = 2600;

    setTimeout(() => {
      resolve();
    }, totalDuration);

    // Fallback: Klick zum Überspringen der Animation
    startScreen.addEventListener('click', () => {
      resolve();
    }, { once: true });
  });
}
