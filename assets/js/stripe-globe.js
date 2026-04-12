import * as THREE from 'three';
console.log('Stripe Globe: Script loaded and initializing...');

const initGlobe = () => {
    const canvases = document.querySelectorAll('.stripe-globe-canvas');
    if (!canvases.length) return;

    canvases.forEach(canvas => {
        // Prevent double initialization
        if (canvas.dataset.initialized) return;
        canvas.dataset.initialized = 'true';

        const width = parseInt(canvas.getAttribute('data-width') || '500', 10);
        const height = parseInt(canvas.getAttribute('data-height') || '500', 10);

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio || 1);
        renderer.setSize(width, height);

        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 260; // Slightly further back to fit arcs
    camera.position.y = 50;
    camera.lookAt(0, 0, 0);

    const radius = 100;
    const colorTop = new THREE.Color('#ff5722'); // Orange
    const colorMiddle = new THREE.Color('#ab47bc'); // Purple
    const colorBottom = new THREE.Color('#4a148c'); // Dark Purple

    // Helper functions
    function latLonToVector3(lat, lon, r) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        return new THREE.Vector3(
            -(r * Math.sin(phi) * Math.cos(theta)),
            r * Math.cos(phi),
            r * Math.sin(phi) * Math.sin(theta)
        );
    }

    // Load Earth map to filter continents
    const img = new Image();
    img.crossOrigin = 'anonymous';
    // Using a water map where oceans are white (light) and land is black (dark)
    img.src = 'https://unpkg.com/three-globe/example/img/earth-water.png';
    img.onload = () => {
        const imgCanvas = document.createElement('canvas');
        imgCanvas.width = img.width;
        imgCanvas.height = img.height;
        const ctx = imgCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, imgCanvas.width, imgCanvas.height).data;

        // Generate uniform points using Fibonacci sphere, then filter by continent
        const numBaseParticles = 40800; // Decreased by 20%
        const positions = [];
        const colors = [];
        
        const phiGolden = Math.PI * (3 - Math.sqrt(5)); // Golden angle

        for (let i = 0; i < numBaseParticles; i++) {
            const yNormalized = 1 - (i / (numBaseParticles - 1)) * 2; // 1 to -1
            const rBase = Math.sqrt(1 - yNormalized * yNormalized);
            const thetaVal = phiGolden * i;

            // Map to UV
            let normalizedTheta = thetaVal % (2 * Math.PI);
            if (normalizedTheta < 0) normalizedTheta += 2 * Math.PI;
            const phiSpherical = Math.acos(yNormalized);

            // Map spherical to image coordinates (flipping X to fix mirrored projection)
            let xImg = Math.floor((1 - (normalizedTheta / (2 * Math.PI))) * img.width);
            xImg = Math.min(Math.max(xImg, 0), img.width - 1); // Clamp safely
            
            let yImg = Math.floor((phiSpherical / Math.PI) * img.height);
            yImg = Math.min(Math.max(yImg, 0), img.height - 1); // Clamp safely
            
            const pixelIndex = (yImg * img.width + xImg) * 4;
            const rVal = imgData[pixelIndex];

            // In earth-water.png, water is white (> 200) and land is black (< 50)
            if (rVal < 50) { 
                const x = Math.cos(thetaVal) * rBase * radius;
                const y = yNormalized * radius;
                const z = Math.sin(thetaVal) * rBase * radius;

                positions.push(x, y, z);

                // Interpolate color based on Y
                const gradientY = (yNormalized + 1) / 2; // 0 to 1
                const c = new THREE.Color();
                if (gradientY < 0.5) {
                    c.lerpColors(colorBottom, colorMiddle, gradientY * 2);
                } else {
                    c.lerpColors(colorMiddle, colorTop, (gradientY - 0.5) * 2);
                }
                colors.push(c.r, c.g, c.b);
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        // Create round texture
        const canvasPoint = document.createElement('canvas');
        canvasPoint.width = 32;
        canvasPoint.height = 32;
        const context = canvasPoint.getContext('2d');
        context.beginPath();
        context.arc(16, 16, 16, 0, Math.PI * 2, true);
        context.fillStyle = '#ffffff';
        context.fill();
        const texturePoint = new THREE.CanvasTexture(canvasPoint);

        const dotMaterial = new THREE.PointsMaterial({
            size: 1.32, // Increased by 20% from 1.1
            map: texturePoint,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true,
            alphaTest: 0.1
        });

        const globeSystem = new THREE.Points(geometry, dotMaterial);
        globeSystem.rotation.z = 0.2;
        globeSystem.rotation.x = 0.1;
        scene.add(globeSystem);

        let currentFrame;
        const animate = () => {
            currentFrame = requestAnimationFrame(animate);
            globeSystem.rotation.y -= 0.0015; // 25% slower
            
            renderer.render(scene, camera);
        };
        animate();
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGlobe);
} else {
    initGlobe();
}
