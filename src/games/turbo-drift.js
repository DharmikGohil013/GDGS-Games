import * as THREE from 'three';

let renderer, scene, camera, reqId;
let customCleanup;

export function initGame(container) {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);

    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Light
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 10, 10);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    // Car
    const carGeo = new THREE.BoxGeometry(1, 0.5, 2);
    const carMat = new THREE.MeshLambertMaterial({ color: 0xFF5F4D });
    const car = new THREE.Mesh(carGeo, carMat);
    car.position.y = 0.25;
    scene.add(car);

    // Ground
    const groundGeo = new THREE.PlaneGeometry(100, 1000);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Coins
    const coins = [];
    const coinGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 16);
    const coinMat = new THREE.MeshLambertMaterial({ color: 0xFFC93C });
    for (let i = 0; i < 50; i++) {
        const coin = new THREE.Mesh(coinGeo, coinMat);
        coin.rotation.x = Math.PI / 2;
        coin.position.set((Math.random() - 0.5) * 20, 0.5, -Math.random() * 500 - 10);
        scene.add(coin);
        coins.push(coin);
    }

    camera.position.set(0, 3, 5);

    // UI
    const ui = document.createElement('div');
    ui.style.position = 'absolute';
    ui.style.top = '10px';
    ui.style.left = '10px';
    ui.style.color = '#fff';
    ui.style.fontFamily = 'sans-serif';
    ui.style.pointerEvents = 'none';
    ui.innerHTML = '<h2>Turbo Drift</h2><p>Arrow keys to steer</p><h3 id="td-score">Score: 0</h3>';
    container.appendChild(ui);

    let score = 0;
    const keys = { ArrowLeft: false, ArrowRight: false };
    const keydown = (e) => { if (keys.hasOwnProperty(e.key)) keys[e.key] = true; };
    const keyup = (e) => { if (keys.hasOwnProperty(e.key)) keys[e.key] = false; };
    
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);

    let speed = 0.2;

    function animate() {
        reqId = requestAnimationFrame(animate);

        // Move car forward relative to its local z? Or just move ground?
        // Let's move car forward
        car.position.z -= speed;
        
        if (keys.ArrowLeft) car.position.x -= 0.1;
        if (keys.ArrowRight) car.position.x += 0.1;

        camera.position.z = car.position.z + 5;
        camera.position.x = car.position.x;
        
        // Collision
        for (let i = coins.length - 1; i >= 0; i--) {
            coins[i].rotation.z += 0.05;
            if (car.position.distanceTo(coins[i].position) < 1.5) {
                scene.remove(coins[i]);
                coins.splice(i, 1);
                score++;
                document.getElementById('td-score').innerText = 'Score: ' + score;
                speed += 0.01;
            }
        }

        renderer.render(scene, camera);
    }

    animate();

    customCleanup = () => {
        window.removeEventListener('keydown', keydown);
        window.removeEventListener('keyup', keyup);
        ui.remove();
    };
}

export function destroyGame() {
    if (reqId) cancelAnimationFrame(reqId);
    if (customCleanup) customCleanup();
    if (renderer) {
        renderer.dispose();
        renderer.domElement.remove();
        renderer = null;
    }
}
