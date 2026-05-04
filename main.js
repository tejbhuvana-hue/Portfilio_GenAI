import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// --- Configuration ---
const COLORS = {
    primary: 0x00f2fe,
    secondary: 0x7000ff,
    bg: 0x020205
};
const menuToggle = document.getElementById('mobile-menu');
        const navLinks = document.querySelector('.nav-links');

        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
                navLinks.classList.remove('active');
            }
        });

// --- Scene Setup ---
const canvas = document.querySelector('#bg-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ReinhardToneMapping;

// --- Post Processing ---
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.2;
bloomPass.strength = 1.2;
bloomPass.radius = 0.5;

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// --- Neural Network Background ---
class NeuralNetwork {
    constructor(count = 100) {
        this.count = count;
        this.nodes = [];
        this.maxDist = 2.5;
        
        const geometry = new THREE.SphereGeometry(0.02, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: COLORS.primary });
        
        for (let i = 0; i < count; i++) {
            const node = new THREE.Mesh(geometry, material);
            node.position.set(
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 10
            );
            node.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.01,
                (Math.random() - 0.5) * 0.01,
                (Math.random() - 0.5) * 0.01
            );
            scene.add(node);
            this.nodes.push(node);
        }
        
        this.lineGeometry = new THREE.BufferGeometry();
        this.lineMaterial = new THREE.LineBasicMaterial({ 
            color: COLORS.primary, 
            transparent: true, 
            opacity: 0.2,
            blending: THREE.AdditiveBlending 
        });
        this.lineMesh = new THREE.LineSegments(this.lineGeometry, this.lineMaterial);
        scene.add(this.lineMesh);
    }

    update() {
        const positions = [];
        this.nodes.forEach((node, i) => {
            node.position.add(node.velocity);
            
            // Bounds check
            if (Math.abs(node.position.x) > 8) node.velocity.x *= -1;
            if (Math.abs(node.position.y) > 8) node.velocity.y *= -1;
            if (Math.abs(node.position.z) > 5) node.velocity.z *= -1;
            
            for (let j = i + 1; j < this.nodes.length; j++) {
                const node2 = this.nodes[j];
                const dist = node.position.distanceTo(node2.position);
                if (dist < this.maxDist) {
                    positions.push(node.position.x, node.position.y, node.position.z);
                    positions.push(node2.position.x, node2.position.y, node2.position.z);
                }
            }
        });
        this.lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        this.lineGeometry.attributes.position.needsUpdate = true;
    }
}

// --- Floating Abstract Objects ---
class FloatingObjects {
    constructor() {
        this.objects = [];
        const geometries = [
            new THREE.TorusKnotGeometry(0.5, 0.2, 100, 16),
            new THREE.OctahedronGeometry(0.7),
            new THREE.IcosahedronGeometry(0.6, 0)
        ];
        
        const material = new THREE.MeshPhysicalMaterial({
            color: COLORS.secondary,
            metalness: 0.9,
            roughness: 0.1,
            transmission: 0.5,
            thickness: 0.5,
            envMapIntensity: 1,
            transparent: true,
            opacity: 0.6
        });

        for (let i = 0; i < 6; i++) {
            const mesh = new THREE.Mesh(geometries[i % geometries.length], material);
            mesh.position.set(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 5
            );
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            scene.add(mesh);
            this.objects.push(mesh);
        }
    }

    update(time, mouseX, mouseY) {
        this.objects.forEach((obj, i) => {
            obj.rotation.x += 0.01;
            obj.rotation.y += 0.005;
            obj.position.y += Math.sin(time + i) * 0.002;
            
            // Mouse interaction (repel)
            const dx = obj.position.x - mouseX * 5;
            const dy = obj.position.y - mouseY * 5;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 2) {
                obj.position.x += dx * 0.01;
                obj.position.y += dy * 0.01;
            }
        });
    }
}

// --- Hero Special Model ---
class CyberHero {
    constructor() {
        this.group = new THREE.Group();
        
        // Inner Sphere
        const coreGeo = new THREE.IcosahedronGeometry(1, 15);
        const coreMat = new THREE.MeshStandardMaterial({
            color: COLORS.primary,
            emissive: COLORS.primary,
            emissiveIntensity: 2,
            wireframe: true
        });
        this.core = new THREE.Mesh(coreGeo, coreMat);
        this.group.add(this.core);

        // Outer Rings
        const ringGeo = new THREE.TorusGeometry(1.5, 0.02, 16, 100);
        const ringMat = new THREE.MeshStandardMaterial({ color: COLORS.secondary, emissive: COLORS.secondary, emissiveIntensity: 1 });
        
        this.rings = [];
        for (let i = 0; i < 3; i++) {
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.random() * Math.PI;
            ring.rotation.y = Math.random() * Math.PI;
            this.group.add(ring);
            this.rings.push(ring);
        }

        this.group.position.set(0, 0, 0);
        
        const container = document.querySelector('#hero-3d-model');
        if (container) {
            this.heroRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            this.heroRenderer.setSize(500, 500);
            container.appendChild(this.heroRenderer.domElement);
            
            this.heroScene = new THREE.Scene();
            this.heroCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
            this.heroCamera.position.z = 4;
            
            this.heroScene.add(this.group);
            this.heroScene.add(new THREE.AmbientLight(0xffffff, 0.5));
            const pLight = new THREE.PointLight(COLORS.primary, 10);
            pLight.position.set(2, 2, 2);
            this.heroScene.add(pLight);
        }
    }

    update(time) {
        this.core.rotation.y = time * 0.2;
        this.rings.forEach((ring, i) => {
            ring.rotation.x += 0.01 * (i + 1);
            ring.rotation.z += 0.005 * (i + 1);
        });
        if (this.heroRenderer) {
            this.heroRenderer.render(this.heroScene, this.heroCamera);
        }
    }
}

// --- Implementation ---
const network = new NeuralNetwork(80);
const floating = new FloatingObjects();
const hero = new CyberHero();

let mouseX = 0, mouseY = 0;
window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) - 0.5;
    mouseY = -(e.clientY / window.innerHeight) + 0.5;
});

// Scroll Parallax
gsap.registerPlugin(ScrollTrigger);
gsap.to(camera.position, {
    z: 2,
    scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: 1
    }
});

// --- Animation Loop ---
const clock = new THREE.Clock();
function animate() {
    const time = clock.getElapsedTime();
    
    network.update();
    floating.update(time, mouseX, mouseY);
    hero.update(time);
    
    // Smooth camera follow
    camera.position.x += (mouseX * 2 - camera.position.x) * 0.05;
    camera.position.y += (mouseY * 2 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);

    composer.render();
    requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

animate();
console.log("Ultra-Advanced Three.js initialized");
