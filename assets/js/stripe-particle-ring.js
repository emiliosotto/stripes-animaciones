class StripeParticleRing {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        
        // Configuration
        this.numParticles = 1000;
        this.baseRadius = 200; 
        this.ringThickness = 60; 
        
        this.mouseRadius = 37.5; 
        this.mouseForce = 0.15; 
        this.springForce = 0.03; 
        this.friction = 0.88; 

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
        const wrapper = this.canvas.parentElement;
        const rect = wrapper.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.width = rect.width;
        this.height = rect.height;

        // Use explicit data attributes from shortcode (intended size)
        const explicitWidth = parseInt(this.canvas.dataset.width) || this.width;
        const explicitHeight = parseInt(this.canvas.dataset.height) || this.height;

        // Scale math: use explicit size for the ring geometry
        const minDimension = Math.min(explicitWidth, explicitHeight);
        this.baseRadius = minDimension * 0.25;
        this.ringThickness = minDimension * 0.075;

        // Visual canvas resolution (pixels)
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        
        if (this.particles.length > 0) {
            this.createParticles();
        }
    }

    createParticles() {
        this.particles = [];
        const ringAlign = this.canvas.dataset.ringAlign || 'center';
        
        let centerX = this.width / 2;
        const centerY = this.height / 2;

        // Adjust horizontal center based on ring_align
        if (ringAlign === 'left') {
            centerX = this.baseRadius + this.ringThickness + 20; 
        } else if (ringAlign === 'right') {
            centerX = this.width - (this.baseRadius + this.ringThickness + 20);
        }

        for (let i = 0; i < this.numParticles; i++) {
            const angle = Math.random() * Math.PI * 2;
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
                rangeX: Math.random() * 6 + 2, 
                rangeY: Math.random() * 6 + 2,
                speedX: Math.random() * 0.015 + 0.005,
                speedY: Math.random() * 0.015 + 0.005,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                size: Math.random() * 2 + 1 
            });
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        for (let i = 0; i < this.numParticles; i++) {
            const p = this.particles[i];

            // 1. Repulsion from mouse
            const dxMouse = this.mouse.x - p.x;
            const dyMouse = this.mouse.y - p.y;
            const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

            if (distMouse < this.mouseRadius) {
                const force = (this.mouseRadius - distMouse) / this.mouseRadius;
                const dirX = -dxMouse / distMouse;
                const dirY = -dyMouse / distMouse;
                p.vx += dirX * force * this.mouseForce * 100;
                p.vy += dirY * force * this.mouseForce * 100;
            }

            // 2. Idle motion offset
            p.phaseX += p.speedX;
            p.phaseY += p.speedY;
            const offsetX = Math.sin(p.phaseX) * p.rangeX;
            const offsetY = Math.cos(p.phaseY) * p.rangeY;

            // 3. Spring force
            const dxOrig = (p.origX + offsetX) - p.x;
            const dyOrig = (p.origY + offsetY) - p.y;
            p.vx += dxOrig * this.springForce;
            p.vy += dyOrig * this.springForce;

            // 4. Physics
            p.vx *= this.friction;
            p.vy *= this.friction;
            p.x += p.vx;
            p.y += p.vy;

            // Draw
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        requestAnimationFrame(() => this.animate());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const canvases = document.querySelectorAll('.stripe-particle-ring-canvas');
    canvases.forEach(canvas => {
        new StripeParticleRing(canvas);
    });
});
