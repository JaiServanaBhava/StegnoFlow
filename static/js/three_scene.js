/**
 * StegnoFlow 3D WebGL Cyber Viewport
 * Powered by Three.js
 * Visualizes a cryptographic rotating wireframe lattice,
 * encrypted floating quantum particle cloud, and dynamic state reactivity.
 */

let scene, camera, renderer, crystalMesh, wireframeMesh, particleSystem;
let targetSpeed = 0.008;
let currentSpeed = 0.008;

function init3DScene() {
  const container = document.getElementById("three-viewport");
  if (!container || typeof THREE === "undefined") return;

  const width = container.clientWidth || 250;
  const height = container.clientHeight || 150;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.z = 4.8;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.innerHTML = "";
  container.appendChild(renderer.domElement);

  // Core Octahedron Geometry (Cryptographic Cipher Core)
  const coreGeo = new THREE.OctahedronGeometry(1.2, 0);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0x00f2fe,
    wireframe: true,
    transparent: true,
    opacity: 0.85
  });
  wireframeMesh = new THREE.Mesh(coreGeo, coreMat);
  scene.add(wireframeMesh);

  // Inner Solid Crystal Core
  const innerGeo = new THREE.IcosahedronGeometry(0.65, 0);
  const innerMat = new THREE.MeshBasicMaterial({
    color: 0xff007f,
    wireframe: false,
    transparent: true,
    opacity: 0.6
  });
  crystalMesh = new THREE.Mesh(innerGeo, innerMat);
  scene.add(crystalMesh);

  // Particle Starfield (Entropy Dispersion)
  const particleCount = 180;
  const particleGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 8;
    positions[i + 1] = (Math.random() - 0.5) * 8;
    positions[i + 2] = (Math.random() - 0.5) * 8;
  }

  particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0x00ff88,
    size: 0.06,
    transparent: true,
    opacity: 0.7
  });

  particleSystem = new THREE.Points(particleGeo, particleMat);
  scene.add(particleSystem);

  // Responsive Resizing
  window.addEventListener("resize", onWindowResize);

  // Mouse interaction
  container.addEventListener("mousemove", (e) => {
    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / width) * 2 - 1;
    const y = -((e.clientY - rect.top) / height) * 2 + 1;
    wireframeMesh.rotation.y = x * 1.5;
    wireframeMesh.rotation.x = -y * 1.5;
  });

  animate();
}

function onWindowResize() {
  const container = document.getElementById("three-viewport");
  if (!container || !renderer || !camera) return;
  const width = container.clientWidth || 250;
  const height = container.clientHeight || 150;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function animate() {
  requestAnimationFrame(animate);

  if (wireframeMesh && crystalMesh && particleSystem) {
    currentSpeed += (targetSpeed - currentSpeed) * 0.05;
    
    wireframeMesh.rotation.y += currentSpeed;
    wireframeMesh.rotation.x += currentSpeed * 0.6;
    
    crystalMesh.rotation.y -= currentSpeed * 1.2;
    crystalMesh.rotation.z += currentSpeed * 0.8;
    
    particleSystem.rotation.y += 0.001;
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// Trigger state changes from application events
window.setCryptoVisualState = function(state) {
  if (!wireframeMesh || !crystalMesh) return;
  if (state === "processing") {
    targetSpeed = 0.06;
    wireframeMesh.material.color.setHex(0xffb703); // Amber
    crystalMesh.material.color.setHex(0xff007f);
  } else if (state === "success") {
    targetSpeed = 0.015;
    wireframeMesh.material.color.setHex(0x00ff88); // Neon Green
    crystalMesh.material.color.setHex(0x00f2fe);
    setTimeout(() => { targetSpeed = 0.008; }, 2000);
  } else if (state === "error") {
    targetSpeed = 0.005;
    wireframeMesh.material.color.setHex(0xff0055); // Crimson
  } else {
    targetSpeed = 0.008;
    wireframeMesh.material.color.setHex(0x00f2fe);
    crystalMesh.material.color.setHex(0xff007f);
  }
};

window.addEventListener("DOMContentLoaded", init3DScene);
