/**
 * StegnoFlow 3D Holographic Cryptographic Coprocessor
 * Three.js WebGL Visualization Engine
 * Renders an interactive 3D cryptographic polyhedron lattice,
 * dual rotating orbital rings, quantum entropy particle field,
 * and mouse-reactive parallax.
 */

let scene, camera, renderer, wireframeMesh, crystalMesh, particleSystem, ring1, ring2;
let targetSpeed = 0.009;
let currentSpeed = 0.009;
let mouseX = 0, mouseY = 0;

function init3DScene() {
  const container = document.getElementById("three-viewport");
  if (!container || typeof THREE === "undefined") return;

  const width = container.clientWidth || 260;
  const height = container.clientHeight || 160;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.z = 4.6;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.innerHTML = "";
  container.appendChild(renderer.domElement);

  // 1. Primary Polyhedron: Icosahedron Wireframe Lattice
  const coreGeo = new THREE.IcosahedronGeometry(1.2, 1);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0x00f2fe,
    wireframe: true,
    transparent: true,
    opacity: 0.75
  });
  wireframeMesh = new THREE.Mesh(coreGeo, coreMat);
  scene.add(wireframeMesh);

  // 2. Inner Glowing Cryptographic Crystal Core
  const innerGeo = new THREE.OctahedronGeometry(0.65, 0);
  const innerMat = new THREE.MeshBasicMaterial({
    color: 0xff007f,
    wireframe: false,
    transparent: true,
    opacity: 0.8
  });
  crystalMesh = new THREE.Mesh(innerGeo, innerMat);
  scene.add(crystalMesh);

  // 3. Orbital Ring 1 (Cyan)
  const ringGeo1 = new THREE.TorusGeometry(1.6, 0.015, 16, 100);
  const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x00f2fe, transparent: true, opacity: 0.5 });
  ring1 = new THREE.Mesh(ringGeo1, ringMat1);
  ring1.rotation.x = Math.PI / 3;
  scene.add(ring1);

  // 4. Orbital Ring 2 (Magenta)
  const ringGeo2 = new THREE.TorusGeometry(1.9, 0.012, 16, 100);
  const ringMat2 = new THREE.MeshBasicMaterial({ color: 0xff007f, transparent: true, opacity: 0.4 });
  ring2 = new THREE.Mesh(ringGeo2, ringMat2);
  ring2.rotation.y = Math.PI / 4;
  scene.add(ring2);

  // 5. Quantum Particle Starfield
  const particleCount = 220;
  const particleGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 9;
    positions[i + 1] = (Math.random() - 0.5) * 9;
    positions[i + 2] = (Math.random() - 0.5) * 9;
  }

  particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0x00ff88,
    size: 0.055,
    transparent: true,
    opacity: 0.85
  });

  particleSystem = new THREE.Points(particleGeo, particleMat);
  scene.add(particleSystem);

  // Event Listeners
  window.addEventListener("resize", onWindowResize);

  container.addEventListener("mousemove", (e) => {
    const rect = container.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / width) * 2 - 1;
    mouseY = -((e.clientY - rect.top) / height) * 2 + 1;
  });

  animate();
}

function onWindowResize() {
  const container = document.getElementById("three-viewport");
  if (!container || !renderer || !camera) return;
  const width = container.clientWidth || 260;
  const height = container.clientHeight || 160;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function animate() {
  requestAnimationFrame(animate);

  if (wireframeMesh && crystalMesh && particleSystem) {
    currentSpeed += (targetSpeed - currentSpeed) * 0.05;

    // Base rotations
    wireframeMesh.rotation.y += currentSpeed;
    wireframeMesh.rotation.x += currentSpeed * 0.7;

    crystalMesh.rotation.y -= currentSpeed * 1.5;
    crystalMesh.rotation.z += currentSpeed * 0.9;

    ring1.rotation.z += currentSpeed * 1.2;
    ring2.rotation.x -= currentSpeed * 0.8;

    particleSystem.rotation.y += 0.001;

    // Smooth Mouse Parallax
    wireframeMesh.rotation.y += mouseX * 0.02;
    wireframeMesh.rotation.x += mouseY * 0.02;
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// Reactivity to application state
window.setCryptoVisualState = function(state) {
  if (!wireframeMesh || !crystalMesh) return;
  if (state === "processing") {
    targetSpeed = 0.07;
    wireframeMesh.material.color.setHex(0xffb703); // Amber Pulse
    crystalMesh.material.color.setHex(0xff0055);
  } else if (state === "success") {
    targetSpeed = 0.02;
    wireframeMesh.material.color.setHex(0x00ff88); // Neon Green
    crystalMesh.material.color.setHex(0x00f2fe);
    setTimeout(() => { targetSpeed = 0.009; }, 2500);
  } else if (state === "error") {
    targetSpeed = 0.004;
    wireframeMesh.material.color.setHex(0xff0055); // Crimson Warning
  } else {
    targetSpeed = 0.009;
    wireframeMesh.material.color.setHex(0x00f2fe);
    crystalMesh.material.color.setHex(0xff007f);
  }
};

window.addEventListener("DOMContentLoaded", init3DScene);
