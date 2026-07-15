// ============================================
// 3D EGOSHOOTER - Combat Arena
// ============================================

// Global Game State
const gameState = {
    isRunning: false,
    isPaused: false,
    isGameOver: false,
    difficulty: 'normal',
    score: 0,
    kills: 0,
    startTime: 0,
    currentTime: 0
};

// Three.js Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: document.getElementById('canvas') });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowShadowMap;

// Scene Setup
scene.background = new THREE.Color(0x1a1a2e);
scene.fog = new THREE.Fog(0x1a1a2e, 200, 500);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(100, 100, 100);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.left = -200;
directionalLight.shadow.camera.right = 200;
directionalLight.shadow.camera.top = 200;
directionalLight.shadow.camera.bottom = -200;
scene.add(directionalLight);

// Player Object
const player = {
    position: new THREE.Vector3(0, 5, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    direction: new THREE.Vector3(0, 0, -1),
    health: 100,
    maxHealth: 100,
    speed: 0.3,
    jumpPower: 0.5,
    isGrounded: false,
    inventory: [
        { name: 'AR-15', ammo: 30, maxAmmo: 120, damage: 15, fireRate: 100, type: 'rifle' },
        { name: 'Shotgun', ammo: 8, maxAmmo: 40, damage: 45, fireRate: 500, type: 'shotgun' },
        { name: 'Sniper', ammo: 5, maxAmmo: 20, damage: 80, fireRate: 1000, type: 'sniper' },
        { name: 'Pistol', ammo: 15, maxAmmo: 90, damage: 10, fireRate: 80, type: 'pistol' }
    ],
    currentWeapon: 0,
    lastShot: 0,
    ammoPickups: 3,
    healthPickups: 2
};

camera.position.copy(player.position);

// Input Handling
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    
    // Weapon switching
    if (e.key === '1') player.currentWeapon = 0;
    if (e.key === '2') player.currentWeapon = 1;
    if (e.key === '3') player.currentWeapon = 2;
    if (e.key === '4') player.currentWeapon = 3;
    
    // Jump
    if ((e.key === ' ') && player.isGrounded && gameState.isRunning) {
        player.velocity.y = player.jumpPower;
        player.isGrounded = false;
    }
    
    // Reload
    if (e.key === 'r' || e.key === 'R') {
        reloadWeapon();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Mouse Look
let mouseX = 0, mouseY = 0;
let pitch = 0, yaw = 0;

window.addEventListener('mousemove', (e) => {
    if (!gameState.isRunning) return;
    
    mouseX = e.movementX || 0;
    mouseY = e.movementY || 0;
    
    yaw -= mouseX * 0.005;
    pitch -= mouseY * 0.005;
    pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
});

// Click to shoot
window.addEventListener('click', () => {
    if (!gameState.isRunning) return;
    shoot();
});

// Lock pointer on click
window.addEventListener('click', () => {
    if (!gameState.isRunning) return;
    document.body.requestPointerLock = document.body.requestPointerLock || document.body.mozRequestPointerLock;
    document.body.requestPointerLock();
});

// ESC to unlock
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
        document.exitPointerLock();
    }
});

// ============================================
// MAP GENERATION
// ============================================

function generateMap() {
    // Ground
    const groundGeometry = new THREE.PlaneGeometry(300, 300);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a3e });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Randomly place buildings/obstacles
    for (let i = 0; i < 20; i++) {
        const x = (Math.random() - 0.5) * 300;
        const z = (Math.random() - 0.5) * 300;
        const size = Math.random() * 20 + 10;
        const height = Math.random() * 30 + 20;
        
        const geometry = new THREE.BoxGeometry(size, height, size);
        const material = new THREE.MeshStandardMaterial({ 
            color: new THREE.Color().setHSL(Math.random(), 0.5, 0.4)
        });
        const building = new THREE.Mesh(geometry, material);
        building.position.set(x, height / 2, z);
        building.castShadow = true;
        building.receiveShadow = true;
        scene.add(building);
    }
    
    // Sky
    const skyGeometry = new THREE.SphereGeometry(400, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({
        color: 0x000a1a,
        side: THREE.BackSide
    });
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);
}

// ============================================
// ENEMIES (AI)
// ============================================

const enemies = [];

class Enemy {
    constructor(x, z) {
        this.position = new THREE.Vector3(x, 5, z);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.health = 50;
        this.maxHealth = 50;
        this.speed = 0.15;
        this.shootCooldown = 0;
        this.fireRate = 300;
        this.detectionRange = 100;
        this.lastTargetUpdate = 0;
        this.targetX = x;
        this.targetZ = z;
        
        // Create mesh
        const geometry = new THREE.BoxGeometry(1, 2, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0xff4444 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Eye (for direction visualization)
        const eyeGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
        const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        eye.position.z = -0.4;
        eye.position.y = 0.5;
        this.mesh.add(eye);
        
        scene.add(this.mesh);
    }
    
    update(deltaTime, playerPos) {
        const distance = this.position.distanceTo(playerPos);
        
        // Update target position periodically
        if (Date.now() - this.lastTargetUpdate > 500) {
            if (distance < this.detectionRange) {
                this.targetX = playerPos.x;
                this.targetZ = playerPos.z;
            } else {
                // Random patrol
                if (Math.random() > 0.9) {
                    this.targetX = (Math.random() - 0.5) * 200;
                    this.targetZ = (Math.random() - 0.5) * 200;
                }
            }
            this.lastTargetUpdate = Date.now();
        }
        
        // Move towards target
        const dirX = this.targetX - this.position.x;
        const dirZ = this.targetZ - this.position.z;
        const len = Math.sqrt(dirX * dirX + dirZ * dirZ);
        
        if (len > 1) {
            this.velocity.x = (dirX / len) * this.speed;
            this.velocity.z = (dirZ / len) * this.speed;
        }
        
        // Gravity
        this.velocity.y -= 0.01;
        this.position.add(this.velocity);
        
        // Ground collision
        if (this.position.y < 5.5) {
            this.position.y = 5.5;
            this.velocity.y = 0;
        }
        
        // Map bounds
        this.position.x = Math.max(-150, Math.min(150, this.position.x));
        this.position.z = Math.max(-150, Math.min(150, this.position.z));
        
        this.mesh.position.copy(this.position);
        
        // Shoot at player
        if (distance < 80 && distance < this.detectionRange) {
            this.shootCooldown -= deltaTime;
            if (this.shootCooldown <= 0) {
                this.shootAtPlayer(playerPos);
                this.shootCooldown = this.fireRate;
            }
        }
    }
    
    shootAtPlayer(playerPos) {
        const direction = playerPos.clone().sub(this.position).normalize();
        const projectile = new Projectile(
            this.position.clone().add(direction.clone().multiplyScalar(2)),
            direction,
            10,
            false
        );
    }
    
    takeDamage(damage) {
        this.health -= damage;
        this.mesh.material.color.setHex(0xff6666);
        setTimeout(() => {
            if (this.health > 0) {
                this.mesh.material.color.setHex(0xff4444);
            }
        }, 100);
    }
}

function spawnEnemy() {
    const angle = Math.random() * Math.PI * 2;
    const distance = 80 + Math.random() * 40;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    
    const enemy = new Enemy(x, z);
    enemies.push(enemy);
}

// ============================================
// PROJECTILES
// ============================================

const projectiles = [];

class Projectile {
    constructor(position, direction, speed, isPlayerProjectile) {
        this.position = position.clone();
        this.direction = direction.clone().normalize();
        this.speed = speed;
        this.isPlayerProjectile = isPlayerProjectile;
        this.lifetime = 5000; // ms
        this.createdAt = Date.now();
        
        // Create visual
        const geometry = new THREE.SphereGeometry(0.2, 8, 8);
        const material = new THREE.MeshStandardMaterial({
            color: isPlayerProjectile ? 0x00ff88 : 0xff6666,
            emissive: isPlayerProjectile ? 0x00ff88 : 0xff6666,
            emissiveIntensity: 0.8
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        scene.add(this.mesh);
        
        projectiles.push(this);
    }
    
    update() {
        this.position.addScaledVector(this.direction, this.speed);
        this.mesh.position.copy(this.position);
        
        // Check lifetime
        if (Date.now() - this.createdAt > this.lifetime) {
            this.destroy();
        }
    }
    
    destroy() {
        scene.remove(this.mesh);
        const index = projectiles.indexOf(this);
        if (index > -1) projectiles.splice(index, 1);
    }
}

// ============================================
// COMBAT
// ============================================

function shoot() {
    const weapon = player.inventory[player.currentWeapon];
    
    if (weapon.ammo <= 0) {
        reloadWeapon();
        return;
    }
    
    const now = Date.now();
    if (now - player.lastShot < weapon.fireRate) return;
    
    player.lastShot = now;
    weapon.ammo--;
    
    // Create projectile(s)
    if (weapon.type === 'shotgun') {
        // Multiple projectiles
        for (let i = 0; i < 8; i++) {
            const angle = (Math.random() - 0.5) * 0.3;
            const direction = new THREE.Vector3(0, 0, -1);
            const euler = new THREE.Euler(pitch + angle, yaw + angle, 0, 'YXZ');
            direction.applyEuler(euler);
            
            new Projectile(
                camera.position.clone(),
                direction,
                0.5,
                true
            );
        }
    } else {
        // Single projectile
        const direction = new THREE.Vector3(0, 0, -1);
        const euler = new THREE.Euler(pitch, yaw, 0, 'YXZ');
        direction.applyEuler(euler);
        
        new Projectile(
            camera.position.clone(),
            direction,
            0.5,
            true
        );
    }
    
    updateUI();
}

function reloadWeapon() {
    const weapon = player.inventory[player.currentWeapon];
    if (weapon.ammo === weapon.maxAmmo) return;
    
    const ammoNeeded = weapon.maxAmmo - weapon.ammo;
    const ammoUsed = Math.min(ammoNeeded, 30); // Reload 30 ammo from reserve
    weapon.ammo += ammoUsed;
    
    updateUI();
}

// ============================================
// COLLISION & DAMAGE
// ============================================

function checkCollisions() {
    // Projectile vs Enemies
    for (let p = projectiles.length - 1; p >= 0; p--) {
        const projectile = projectiles[p];
        
        for (let e = enemies.length - 1; e >= 0; e--) {
            const enemy = enemies[e];
            const distance = projectile.position.distanceTo(enemy.position);
            
            if (distance < 2) {
                enemy.takeDamage(player.inventory[player.currentWeapon].damage);
                projectile.destroy();
                
                if (enemy.health <= 0) {
                    gameState.kills++;
                    gameState.score += 100;
                    scene.remove(enemy.mesh);
                    enemies.splice(e, 1);
                    spawnEnemy();
                }
                break;
            }
        }
    }
    
    // Projectile vs Player
    for (let p = projectiles.length - 1; p >= 0; p--) {
        const projectile = projectiles[p];
        if (!projectile.isPlayerProjectile) {
            const distance = projectile.position.distanceTo(player.position);
            if (distance < 1.5) {
                player.health -= 10;
                projectile.destroy();
                
                if (player.health <= 0) {
                    endGame();
                }
            }
        }
    }
}

// ============================================
// PLAYER MOVEMENT
// ============================================

function updatePlayer() {
    // Movement input
    const moveDirection = new THREE.Vector3();
    
    if (keys['w']) moveDirection.z -= 1;
    if (keys['s']) moveDirection.z += 1;
    if (keys['a']) moveDirection.x -= 1;
    if (keys['d']) moveDirection.x += 1;
    
    if (moveDirection.length() > 0) {
        moveDirection.normalize();
        
        // Rotate movement based on camera direction
        const euler = new THREE.Euler(0, yaw, 0);
        moveDirection.applyEuler(euler);
        
        player.velocity.x = moveDirection.x * player.speed;
        player.velocity.z = moveDirection.z * player.speed;
    } else {
        player.velocity.x *= 0.8;
        player.velocity.z *= 0.8;
    }
    
    // Gravity
    player.velocity.y -= 0.02;
    
    // Update position
    player.position.add(player.velocity);
    
    // Ground collision
    player.isGrounded = false;
    if (player.position.y < 5.5) {
        player.position.y = 5.5;
        player.velocity.y = 0;
        player.isGrounded = true;
    }
    
    // Map bounds
    player.position.x = Math.max(-150, Math.min(150, player.position.x));
    player.position.z = Math.max(-150, Math.min(150, player.position.z));
    
    // Update camera
    camera.position.copy(player.position);
    camera.position.y += 0.5; // Eye height
    
    // Camera rotation
    const euler = new THREE.Euler(pitch, yaw, 0, 'YXZ');
    camera.quaternion.setFromEuler(euler);
}

// ============================================
// UI & HUD
// ============================================

let frameCount = 0;
let lastFpsUpdate = Date.now();
let currentFps = 0;

function updateUI() {
    // Health
    const healthPercent = (player.health / player.maxHealth) * 100;
    document.getElementById('healthFill').style.width = healthPercent + '%';
    document.getElementById('healthText').textContent = `${Math.round(player.health)}/${player.maxHealth}`;
    
    // Ammo
    const weapon = player.inventory[player.currentWeapon];
    document.getElementById('ammoText').textContent = `${weapon.ammo} / ${weapon.maxAmmo}`;
    document.getElementById('weaponName').textContent = weapon.name;
    
    // Inventory
    let inventoryHTML = '';
    player.inventory.forEach((w, i) => {
        const isActive = i === player.currentWeapon ? '▶ ' : '  ';
        inventoryHTML += `<div class="inventory-item">${isActive}${w.name} (${w.ammo})</div>`;
    });
    document.getElementById('inventoryList').innerHTML = inventoryHTML;
    
    // Stats
    document.getElementById('enemyCount').textContent = enemies.length;
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('kills').textContent = gameState.kills;
}

function updateFPS() {
    frameCount++;
    const now = Date.now();
    if (now - lastFpsUpdate >= 1000) {
        currentFps = frameCount;
        frameCount = 0;
        lastFpsUpdate = now;
        document.getElementById('fps').textContent = currentFps;
    }
}

function updateMinimap() {
    const canvas = document.getElementById('minimap');
    const ctx = canvas.getContext('2d');
    
    const scale = 0.5; // 150x150 / 300 range
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Clear
    ctx.fillStyle = 'rgba(20, 30, 50, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Player
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(
        centerX + (player.position.x * scale) - 3,
        centerY + (player.position.z * scale) - 3,
        6, 6
    );
    
    // Enemies
    ctx.fillStyle = '#ff4444';
    enemies.forEach(enemy => {
        ctx.fillRect(
            centerX + (enemy.position.x * scale) - 2,
            centerY + (enemy.position.z * scale) - 2,
            4, 4
        );
    });
    
    // Border
    ctx.strokeStyle = '#00ccff';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
}

// ============================================
// MENU HANDLING
// ============================================

let difficulty = 'normal';

document.getElementById('playBtn').addEventListener('click', startGame);
document.getElementById('difficultyBtn').addEventListener('click', () => {
    const difficulties = ['easy', 'normal', 'hard', 'insane'];
    const currentIndex = difficulties.indexOf(difficulty);
    difficulty = difficulties[(currentIndex + 1) % difficulties.length];
    document.getElementById('difficultyBtn').textContent = `SCHWIERIGKEIT: ${difficulty.toUpperCase()}`;
});

document.getElementById('creditsBtn').addEventListener('click', () => {
    alert('Combat Arena 3D\n\nEgoshooter mit KI Gegnern\n\nTasten:\nW/A/S/D - Bewegung\nMaus - Blick\nLinks Klick - Schießen\n1-4 - Waffe wechseln\nR - Munition laden\nLeerzeichen - Sprung\nESC - Maus freigeben');
});

document.getElementById('restartBtn').addEventListener('click', () => {
    location.reload();
});

function startGame() {
    document.getElementById('mainMenu').classList.add('hidden');
    gameState.isRunning = true;
    gameState.startTime = Date.now();
    
    // Spawn initial enemies based on difficulty
    const enemyCount = {
        'easy': 3,
        'normal': 5,
        'hard': 8,
        'insane': 12
    };
    
    for (let i = 0; i < enemyCount[difficulty]; i++) {
        spawnEnemy();
    }
    
    // Spawn more enemies periodically
    setInterval(() => {
        if (gameState.isRunning && enemies.length < 15) {
            spawnEnemy();
        }
    }, 3000);
}

function endGame() {
    gameState.isRunning = false;
    gameState.isGameOver = true;
    
    const survivalSeconds = Math.floor((Date.now() - gameState.startTime) / 1000);
    const minutes = Math.floor(survivalSeconds / 60);
    const seconds = survivalSeconds % 60;
    
    document.getElementById('gameOverTitle').textContent = gameState.kills > 5 ? '🎉 SIEG!' : '💀 GAME OVER';
    document.getElementById('enemiesKilled').textContent = gameState.kills;
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('survivalTime').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('gameOver').classList.remove('hidden');
}

// ============================================
// MAIN GAME LOOP
// ============================================

let lastTime = Date.now();

function gameLoop() {
    requestAnimationFrame(gameLoop);
    
    const now = Date.now();
    const deltaTime = now - lastTime;
    lastTime = now;
    
    if (!gameState.isRunning) return;
    
    // Update
    updatePlayer();
    
    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].update(deltaTime, player.position);
    }
    
    // Update projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        projectiles[i].update();
    }
    
    // Check collisions
    checkCollisions();
    
    // Update UI
    updateUI();
    updateMinimap();
    updateFPS();
    
    // Render
    renderer.render(scene, camera);
}

// ============================================
// INITIALIZATION
// ============================================

window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
});

// Generate world and start loop
generateMap();
gameLoop();