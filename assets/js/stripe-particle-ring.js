class StripeParticleRing {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        
        // Configuration
        this.numParticles = 1000;
        this.baseRadius = 200; // base radius of the ring
        this.ringThickness = 60; // noise/thickness of the ring
        
        this.mouseRadius = 37.5; // Allows mouse to get even closer
        this.mouseForce = 0.15; // Reaction force decreased by 25% (from 0.2)
        this.springForce = 0.03; // Adjust spring force
        this.friction = 0.88; // Lower friction means particles travel further before returning

        // Colors: fuchsias, pinks, light purples
        this.colors = ['#FF2A85', '#FF73FA', '#D05CFF', '#8A2BE2', '#E100FF'];

        this.particles = [];
        this.mouse = { x: -1000, y: -1000 };

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        const wrapper = this.canvas.parentElement;
        
        wrapper.addEventListener('mousemove', (e) => {
            const rect = wrapper.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        wrapper.addEventListener('mouseleave', () => {
            this.mouse.x = -1000;
            this.mouse.y = -1000;
        });

        this.createParticles();
        this.animate();
    }

    resize() {
        // Handle physical vs logical pixels for retina displays
        const wrapper = this.canvas.parentElement;
        const rect = wrapper.getBoundingClientRect();
        
        const dpr = window.devicePixelRatio || 1;
        
        this.width = rect.width;
        this.height = rect.height;

        // Use explicit data attributes from shortcode if present.
        // This decouples the mathematical scaling from CSS limitations (like max-width in themes),
        // allowing the ring geometric size to grow infinitely based on parameters.
        const explicitWidth = parseInt(this.canvas.dataset.width) || this.width;
        const explicitHeight = parseInt(this.canvas.dataset.height) || this.height;

        // Make the particle ring dynamically scale based on logical dimensions
        // (default scale: radius is 25% of min dimension, thickness is 7.5%)
        const minDimension = Math.min(explicitWidth, explicitHeight);
        this.baseRadius = minDimension * 0.25;
        this.ringThickness = minDimension * 0.075;

        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        
        // Re-center particles on resize if they exist
        if (this.particles.length > 0) {
            this.createParticles();
        }
    }

    createParticles() {
        this.particles = [];
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        for (let i = 0; i < this.numParticles; i++) {
            // Polar coordinates for a ring
            const angle = Math.random() * Math.PI * 2;
            
            // Randomness to create stardust thickness
            // Gaussian-like distribution for denser center of the ring
            const r = Math.random() + Math.random() + Math.random(); 
            const offset = (r - 1.5) * this.ringThickness; 
            const finalRadius = this.baseRadius + offset;

            const x = centerX + Math.cos(angle) * finalRadius;
            const y = centerY + Math.sin(angle) * finalRadius;

            this.particles.push({
                origX: x,
                origY: y,
                x: x,
                y: y,
                vx: 0,
                vy: 0,
                phaseX: Math.random() * Math.PI * 2,
                phaseY: Math.random() * Math.PI * 2,
                rangeX: Math.random() * 6 + 2, // 2px to 8px wander range
                rangeY: Math.random() * 6 + 2,
                speedX: Math.random() * 0.015 + 0.005,
                speedY: Math.random() * 0.015 + 0.005,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                size: Math.random() * 2 + 1 // 1px to 3px
            });
        }
    }

    animate() {
        // Transparent clear
        this.ctx.clearRect(0, 0, this.width, this.height);

        for (let i = 0; i < this.numParticles; i++) {
            const p = this.particles[i];

            // 1. Repulsion from mouse
            const dxMouse = this.mouse.x - p.x;
            const dyMouse = this.mouse.y - p.y;
            const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

            if (distMouse < this.mouseRadius) {
                // Force gets stronger as it gets closer
                const force = (this.mouseRadius - distMouse) / this.mouseRadius;
                
                // Direction of force (away from mouse)
                const dirX = -dxMouse / distMouse;
                const dirY = -dyMouse / distMouse;

                p.vx += dirX * force * this.mouseForce * 100;
                p.vy += dirY * force * this.mouseForce * 100;
            }

            // 2. Idle motion offset (breathing gentle effect)
            p.phaseX += p.speedX;
            p.phaseY += p.speedY;
            const offsetX = Math.sin(p.phaseX) * p.rangeX;
            const offsetY = Math.cos(p.phaseY) * p.rangeY;

            // 3. Spring force (return to original position + idle offset)
            const dxOrig = (p.origX + offsetX) - p.x;
            const dyOrig = (p.origY + offsetY) - p.y;
            
            p.vx += dxOrig * this.springForce;
            p.vy += dyOrig * this.springForce;

            // 4. Apply friction and velocity
            p.vx *= this.friction;
            p.vy *= this.friction;
            
            p.x += p.vx;
            p.y += p.vy;

            // Draw particle
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        requestAnimationFrame(() => this.animate());
    }
}

// Initialize when DOM is completely loaded
document.addEventListener('DOMContentLoaded', () => {
    // There could be multiple instances, but for now we look for the main ID.
    // In a real multi-instance scenario we'd use classes. Here the shortcode uses an ID.
    const canvasContainers = document.querySelectorAll('.stripe-particle-ring-wrapper');
    if (canvasContainers.length > 0) {
        // Just initializing the first one to match shortcode setup
        new StripeParticleRing('stripe-particle-ring-canvas');
    }
});
