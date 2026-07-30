import * as PIXI from 'pixi.js';

let app;

export function initGame(container) {
    app = new PIXI.Application({
        width: container.clientWidth || 800,
        height: container.clientHeight || 600,
        backgroundColor: 0x111111,
        resizeTo: container
    });
    
    container.appendChild(app.view);

    const graphics = new PIXI.Graphics();
    app.stage.addChild(graphics);

    const textStyle = new PIXI.TextStyle({ fill: '#ffffff', fontSize: 20 });
    const instructions = new PIXI.Text('City Sprint - Tap/Click or Space to Jump', textStyle);
    instructions.x = 10;
    instructions.y = 10;
    app.stage.addChild(instructions);

    let score = 0;
    const scoreText = new PIXI.Text('Score: 0', textStyle);
    scoreText.x = 10;
    scoreText.y = 40;
    app.stage.addChild(scoreText);

    let player = { x: 50, y: app.screen.height - 100, width: 40, height: 40, vy: 0 };
    let obstacles = [];
    let coins = [];
    let gravity = 0.8;
    let jumpForce = -15;
    let isGrounded = true;
    let speed = 5;
    let frame = 0;
    let gameOver = false;

    const jump = () => {
        if (isGrounded) {
            player.vy = jumpForce;
            isGrounded = false;
        }
    };

    const keydown = (e) => { if (e.code === 'Space') jump(); };
    window.addEventListener('keydown', keydown);
    app.view.addEventListener('pointerdown', jump);

    app.ticker.add(() => {
        if (gameOver) return;
        frame++;

        // Physics
        player.vy += gravity;
        player.y += player.vy;
        
        if (player.y >= app.screen.height - 100) {
            player.y = app.screen.height - 100;
            player.vy = 0;
            isGrounded = true;
        }

        // Spawning
        if (frame % 100 === 0) {
            obstacles.push({ x: app.screen.width, y: app.screen.height - 80, width: 30, height: 40 });
        }
        if (frame % 60 === 0 && Math.random() > 0.5) {
            coins.push({ x: app.screen.width, y: app.screen.height - 150 - Math.random() * 50, radius: 10 });
        }

        graphics.clear();
        
        // Ground
        graphics.beginFill(0x333333);
        graphics.drawRect(0, app.screen.height - 60, app.screen.width, 60);
        graphics.endFill();

        // Player
        graphics.beginFill(0x8B5CF6);
        graphics.drawRect(player.x, player.y - player.height, player.width, player.height);
        graphics.endFill();

        // Obstacles
        graphics.beginFill(0xFF5F4D);
        for (let i = obstacles.length - 1; i >= 0; i--) {
            let obs = obstacles[i];
            obs.x -= speed;
            graphics.drawRect(obs.x, obs.y - obs.height, obs.width, obs.height);
            
            // Collision
            if (player.x < obs.x + obs.width && player.x + player.width > obs.x &&
                player.y - player.height < obs.y && player.y > obs.y - obs.height) {
                gameOver = true;
                const goText = new PIXI.Text('GAME OVER', { fill: '#ff0000', fontSize: 40 });
                goText.x = app.screen.width/2 - 100;
                goText.y = app.screen.height/2;
                app.stage.addChild(goText);
            }
            if (obs.x < -100) obstacles.splice(i, 1);
        }
        graphics.endFill();

        // Coins
        graphics.beginFill(0xFFC93C);
        for (let i = coins.length - 1; i >= 0; i--) {
            let coin = coins[i];
            coin.x -= speed;
            graphics.drawCircle(coin.x, coin.y, coin.radius);
            
            // Collision (simple AABB for circle)
            if (player.x < coin.x + coin.radius && player.x + player.width > coin.x - coin.radius &&
                player.y - player.height < coin.y + coin.radius && player.y > coin.y - coin.radius) {
                score += 10;
                scoreText.text = 'Score: ' + score;
                coins.splice(i, 1);
                speed += 0.1;
            } else if (coin.x < -50) {
                coins.splice(i, 1);
            }
        }
        graphics.endFill();
    });

    app.customCleanup = () => {
        window.removeEventListener('keydown', keydown);
        app.view.removeEventListener('pointerdown', jump);
    };
}

export function destroyGame() {
    if (app) {
        if (app.customCleanup) app.customCleanup();
        app.destroy(true, { children: true, texture: true, baseTexture: true });
        app = null;
    }
}
