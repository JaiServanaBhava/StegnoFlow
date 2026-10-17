/**
 * StegnoFlow 3D WebGL Visualization & Tilt Physics Engine
 * Powered by Three.js
 * Visualizes:
 *   1. Fullscreen floating 3D quantum particle matrix
 *   2. Sidebar 3D Cryptographic Hologram Coprocessor
 *   3. Dynamic 3D Card Parallax Tilt with interactive lighting
 */

let scene, camera, renderer, wireframeMesh, crystalMesh, particleSystem, ring1, ring2;
let bgScene, bgCamera, bgRenderer, bgParticles;
let targetSpeed = 0.009;
let currentSpeed = 0.009;
let mouseX = 0, mouseY = 0;

function init3DScene() {
  initBackground3DCanvas();
  initSidebarCoprocessor();
  setup3DCardTiltPhysics();
}

// 1. Fullscreen Background 3D Matrix
function initBackground3DCanvas() {
  const bgCanvas = document.getElementById("bg-3d-canvas");
  if (!bgCanvas || typeof THREE === "undefined") return;

  bgScene = new THREE.Scene();
  bgCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  bgCamera.position.z = 25;

  bgRenderer = new THREE.WebGLRenderer({ canvas: bgCanvas, antialias: true, alpha: true });
  bgRenderer.setSize(window.innerWidth, window.innerHeight);
  bgRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // 350 floating 3D cyber dust particles
  const count = 350;
  const geom = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);

  for (let i = 0; i < count * 3; i += 3) {
    pos[i] = (Math.random() - 0.5) * 50;
    pos[i + 1] = (Math.random() - 0.5) * 50;
    pos[i + 2] = (Math.random() - 0.5) * 40;
  }

  geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0x00f2fe,
    size: 0.15,
    transparent: true,
    opacity: 0.45
  });

  bgParticles = new THREE.Points(geom, mat);
  bgScene.add(bgParticles);

  window.addEventListener("resize", () => {
    if (bgCamera && bgRenderer) {
      bgCamera.aspect = window.innerWidth / window.innerHeight;
      bgCamera.updateProjectionMatrix();
      bgRenderer.setSize(window.innerWidth, window.innerHeight);
    }
  });
}

// 2. Sidebar 3D Cryptographic Hologram
function initSidebarCoprocessor() {
  const container = document.getElementById("three-viewport");
  if (!container || typeof THREE === "undefined") return;

  const width = container.clientWidth || 250;
  const height = container.clientHeight || 135;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.z = 4.5;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.innerHTML = "";
  container.appendChild(renderer.domElement);

  // Icosahedron Wireframe
  const coreGeo = new THREE.IcosahedronGeometry(1.2, 1);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0x00f2fe,
    wireframe: true,
    transparent: true,
    opacity: 0.8
  });
  wireframeMesh = new THREE.Mesh(coreGeo, coreMat);
  scene.add(wireframeMesh);

  // Inner Solid Crystal Core
  const innerGeo = new THREE.OctahedronGeometry(0.65, 0);
  const innerMat = new THREE.MeshBasicMaterial({
    color: 0xff007f,
    wireframe: false,
    transparent: true,
    opacity: 0.85
  });
  crystalMesh = new THREE.Mesh(innerGeo, innerMat);
  scene.add(crystalMesh);

  // Orbital Ring 1
  const ringGeo1 = new THREE.TorusGeometry(1.6, 0.015, 16, 100);
  const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x00f2fe, transparent: true, opacity: 0.5 });
  ring1 = new THREE.Mesh(ringGeo1, ringMat1);
  ring1.rotation.x = Math.PI / 3;
  scene.add(ring1);

  // Orbital Ring 2
  const ringGeo2 = new THREE.TorusGeometry(1.9, 0.012, 16, 100);
  const ringMat2 = new THREE.MeshBasicMaterial({ color: 0xff007f, transparent: true, opacity: 0.4 });
  ring2 = new THREE.Mesh(ringGeo2, ringMat2);
  ring2.rotation.y = Math.PI / 4;
  scene.add(ring2);

  // Responsive Resizing
  window.addEventListener("resize", onSidebarResize);

  container.addEventListener("mousemove", (e) => {
    const rect = container.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / width) * 2 - 1;
    mouseY = -((e.clientY - rect.top) / height) * 2 + 1;
  });

  animate();
}

function onSidebarResize() {
  const container = document.getElementById("three-viewport");
  if (!container || !renderer || !camera) return;
  const width = container.clientWidth || 250;
  const height = container.clientHeight || 135;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function animate() {
  requestAnimationFrame(animate);

  if (wireframeMesh && crystalMesh && ring1 && ring2) {
    currentSpeed += (targetSpeed - currentSpeed) * 0.05;

    wireframeMesh.rotation.y += currentSpeed;
    wireframeMesh.rotation.x += currentSpeed * 0.7;

    crystalMesh.rotation.y -= currentSpeed * 1.5;
    crystalMesh.rotation.z += currentSpeed * 0.9;

    ring1.rotation.z += currentSpeed * 1.2;
    ring2.rotation.x -= currentSpeed * 0.8;

    wireframeMesh.rotation.y += mouseX * 0.02;
    wireframeMesh.rotation.x += mouseY * 0.02;
  }

  if (bgParticles) {
    bgParticles.rotation.y += 0.0008;
    bgParticles.rotation.x += 0.0004;
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }

  if (bgRenderer && bgScene && bgCamera) {
    bgRenderer.render(bgScene, bgCamera);
  }
}

// 3. Dynamic 3D Card Tilt Physics & Fullscreen Mouse Parallax
function setup3DCardTiltPhysics() {
  const cards = document.querySelectorAll(".card-3d-tilt, .dash-box, .unified-stego-card, .monolith-card");

  cards.forEach(card => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -5.5; // Max tilt 5.5 deg
      const rotateY = ((x - centerX) / centerX) * 5.5;

      card.style.transition = "transform 0.08s ease-out";
      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(8px)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transition = "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)";
      card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)";
    });
  });

  // Global Mouse Parallax for Background 3D Particles
  window.addEventListener("mousemove", (e) => {
    const normX = (e.clientX / window.innerWidth - 0.5) * 2;
    const normY = (e.clientY / window.innerHeight - 0.5) * 2;
    if (bgParticles) {
      bgParticles.rotation.y += normX * 0.001;
      bgParticles.rotation.x += normY * 0.001;
    }
  });
}

window.setCryptoVisualState = function(state) {
  if (!wireframeMesh || !crystalMesh) return;
  if (state === "processing") {
    targetSpeed = 0.07;
    wireframeMesh.material.color.setHex(0xffb703); // Amber
    crystalMesh.material.color.setHex(0xff0055);
  } else if (state === "success") {
    targetSpeed = 0.02;
    wireframeMesh.material.color.setHex(0x00ff88); // Neon Green
    crystalMesh.material.color.setHex(0x00f2fe);
    setTimeout(() => { targetSpeed = 0.009; }, 2500);
  } else if (state === "error") {
    targetSpeed = 0.004;
    wireframeMesh.material.color.setHex(0xff0055); // Crimson
  } else {
    targetSpeed = 0.009;
    wireframeMesh.material.color.setHex(0x00f2fe);
    crystalMesh.material.color.setHex(0xff007f);
  }
};

window.addEventListener("DOMContentLoaded", init3DScene);
