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

    const gridSize = 20;
    let snake = [{x: 10, y: 10}];
    let dir = {x: 1, y: 0};
    let nextDir = {x: 1, y: 0};
    let food = {x: 15, y: 15};
    let score = 0;
    
    const colors = [0xFF5F4D, 0x3E6BFF, 0x1FC98B, 0x8B5CF6, 0xFFC93C];
    
    const graphics = new PIXI.Graphics();
    app.stage.addChild(graphics);

    const textStyle = new PIXI.TextStyle({ fill: '#ffffff', fontSize: 20 });
    const instructions = new PIXI.Text('Neon Snake - Arrow Keys to move', textStyle);
    instructions.x = 10;
    instructions.y = 10;
    app.stage.addChild(instructions);

    const scoreText = new PIXI.Text('Score: 0', textStyle);
    scoreText.x = 10;
    scoreText.y = 40;
    app.stage.addChild(scoreText);

    let lastTime = 0;
    const speed = 100; // ms per move
    let gameOver = false;

    function spawnFood() {
        food.x = Math.floor(Math.random() * (app.screen.width / gridSize));
        food.y = Math.floor(Math.random() * (app.screen.height / gridSize));
    }

    const keydownHandler = (e) => {
        if (e.key === 'ArrowUp' && dir.y === 0) nextDir = {x: 0, y: -1};
        if (e.key === 'ArrowDown' && dir.y === 0) nextDir = {x: 0, y: 1};
        if (e.key === 'ArrowLeft' && dir.x === 0) nextDir = {x: -1, y: 0};
        if (e.key === 'ArrowRight' && dir.x === 0) nextDir = {x: 1, y: 0};
    };
    window.addEventListener('keydown', keydownHandler);

    app.ticker.add(() => {
        if (gameOver) return;

        const now = Date.now();
        if (now - lastTime > speed) {
            lastTime = now;
            dir = nextDir;
            
            let head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
            
            // Wall collision
            if (head.x < 0 || head.x >= app.screen.width / gridSize || head.y < 0 || head.y >= app.screen.height / gridSize) {
                gameOver = true;
                const goText = new PIXI.Text('GAME OVER', { fill: '#ff0000', fontSize: 40 });
                goText.x = app.screen.width/2 - 100;
                goText.y = app.screen.height/2;
                app.stage.addChild(goText);
                return;
            }
            
            // Self collision
            if (snake.some(s => s.x === head.x && s.y === head.y)) {
                gameOver = true;
                return;
            }

            snake.unshift(head);

            if (head.x === food.x && head.y === food.y) {
                score++;
                scoreText.text = 'Score: ' + score;
                spawnFood();
            } else {
                snake.pop();
            }
        }

        graphics.clear();
        
        // Draw food
        graphics.beginFill(0xFFC93C);
        graphics.drawRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
        graphics.endFill();

        // Draw snake
        for (let i = 0; i < snake.length; i++) {
            graphics.beginFill(i === 0 ? 0x1FC98B : 0x3E6BFF);
            graphics.drawRect(snake[i].x * gridSize, snake[i].y * gridSize, gridSize - 2, gridSize - 2);
            graphics.endFill();
        }
    });

    app.customCleanup = () => {
        window.removeEventListener('keydown', keydownHandler);
    };
}

export function destroyGame() {
    if (app) {
        if (app.customCleanup) app.customCleanup();
        app.destroy(true, { children: true, texture: true, baseTexture: true });
        app = null;
    }
}
