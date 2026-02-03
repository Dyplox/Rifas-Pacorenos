import confetti from 'canvas-confetti';

// Pacoreños Brand Colors: Green, Medellín Yellow, White
const BRAND_COLORS = ['#58892B', '#F6BB31', '#ffffff', '#4a7524', '#ffcc00'];
const CELEBRATION_DURATION = 5000;

const randomInRange = (min, max) => Math.random() * (max - min) + min;

/**
 * Runs the winner celebration confetti animation
 */
export const runWinnerCelebration = () => {
    const animationEnd = Date.now() + CELEBRATION_DURATION;

    const frame = () => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return;

        // Side Cannons (continuous stream)
        confetti({
            particleCount: 4,
            angle: 50,
            spread: 80,
            origin: { x: 0, y: 0.6 },
            colors: BRAND_COLORS,
            scalar: 1.2,
            drift: 1,
        });
        confetti({
            particleCount: 4,
            angle: 130,
            spread: 80,
            origin: { x: 1, y: 0.6 },
            colors: BRAND_COLORS,
            scalar: 1.2,
            drift: -1,
        });

        // Rising Balloons
        if (Math.random() < 0.2) {
            confetti({
                particleCount: 1,
                origin: { x: Math.random(), y: 1.2 },
                colors: BRAND_COLORS,
                shapes: ['circle'],
                gravity: 0.25,
                scalar: randomInRange(1.0, 3.5),
                drift: (Math.random() - 0.5) * 0.5,
                ticks: 800,
                startVelocity: 80,
                decay: 0.98,
                angle: 90,
                spread: 40
            });
        }

        // Random Firework Bursts
        if (Math.random() < 0.05) {
            confetti({
                particleCount: 80,
                spread: 360,
                origin: { x: randomInRange(0.1, 0.9), y: randomInRange(0.1, 0.5) },
                colors: BRAND_COLORS,
                scalar: 0.7,
                gravity: 0.5,
                ticks: 60,
                startVelocity: 30,
                decay: 0.92,
                shapes: ['circle'],
            });
        }

        requestAnimationFrame(frame);
    };

    // Initial Massive Blast
    confetti({
        particleCount: 250,
        spread: 100,
        origin: { y: 0.6 },
        colors: BRAND_COLORS,
        scalar: 1.5,
        zIndex: 100
    });

    frame();
};
