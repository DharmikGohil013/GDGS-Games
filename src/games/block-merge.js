import Phaser from 'phaser';

let game;

export function initGame(container) {
    class MainScene extends Phaser.Scene {
        constructor() {
            super('MainScene');
        }

        create() {
            this.width = this.sys.game.config.width;
            this.height = this.sys.game.config.height;

            this.add.text(10, 10, 'Block Merge (2048)', { fontSize: '20px', fill: '#ffffff' });
            this.score = 0;
            this.scoreText = this.add.text(10, 40, 'Score: 0', { fontSize: '24px', fill: '#ffffff' });
            
            this.gridSize = 4;
            this.tileSize = 80;
            this.gridX = this.width / 2 - (this.gridSize * this.tileSize) / 2;
            this.gridY = this.height / 2 - (this.gridSize * this.tileSize) / 2;

            this.grid = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(0));
            this.tiles = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(null));

            this.colors = {
                2: 0xFF5F4D, 4: 0x3E6BFF, 8: 0x1FC98B, 16: 0x8B5CF6, 32: 0xFFC93C, 
                64: 0xFF5F4D, 128: 0x3E6BFF, 256: 0x1FC98B, 512: 0x8B5CF6, 1024: 0xFFC93C, 2048: 0xffffff
            };

            this.spawnTile();
            this.spawnTile();
            this.drawGrid();

            this.input.keyboard.on('keydown-LEFT', () => this.move(-1, 0));
            this.input.keyboard.on('keydown-RIGHT', () => this.move(1, 0));
            this.input.keyboard.on('keydown-UP', () => this.move(0, -1));
            this.input.keyboard.on('keydown-DOWN', () => this.move(0, 1));
        }

        spawnTile() {
            let emptySpaces = [];
            for (let i = 0; i < this.gridSize; i++) {
                for (let j = 0; j < this.gridSize; j++) {
                    if (this.grid[i][j] === 0) emptySpaces.push({i, j});
                }
            }
            if (emptySpaces.length > 0) {
                let spot = emptySpaces[Math.floor(Math.random() * emptySpaces.length)];
                this.grid[spot.i][spot.j] = Math.random() > 0.9 ? 4 : 2;
            }
        }

        drawGrid() {
            for (let i = 0; i < this.gridSize; i++) {
                for (let j = 0; j < this.gridSize; j++) {
                    if (this.tiles[i][j]) {
                        this.tiles[i][j].destroy();
                        this.tiles[i][j] = null;
                    }
                    let val = this.grid[i][j];
                    
                    let x = this.gridX + j * this.tileSize + this.tileSize / 2;
                    let y = this.gridY + i * this.tileSize + this.tileSize / 2;

                    let bg = this.add.rectangle(x, y, this.tileSize - 4, this.tileSize - 4, val === 0 ? 0x333333 : (this.colors[val] || 0xffffff));
                    if (val > 0) {
                        let txt = this.add.text(x, y, val.toString(), { fontSize: '24px', fill: '#000000', fontStyle: 'bold' }).setOrigin(0.5);
                        this.tiles[i][j] = this.add.group([bg, txt]);
                    } else {
                        this.tiles[i][j] = bg;
                    }
                }
            }
            this.scoreText.setText('Score: ' + this.score);
        }

        move(dx, dy) {
            let moved = false;
            // A simple unoptimized merge logic for brevity
            for(let step = 0; step < this.gridSize; step++) {
                for (let i = 0; i < this.gridSize; i++) {
                    for (let j = 0; j < this.gridSize; j++) {
                        let x = dx === 1 ? this.gridSize - 1 - j : j;
                        let y = dy === 1 ? this.gridSize - 1 - i : i;
                        
                        let nx = x + dx;
                        let ny = y + dy;
                        
                        if (nx >= 0 && nx < this.gridSize && ny >= 0 && ny < this.gridSize) {
                            if (this.grid[y][x] > 0) {
                                if (this.grid[ny][nx] === 0) {
                                    this.grid[ny][nx] = this.grid[y][x];
                                    this.grid[y][x] = 0;
                                    moved = true;
                                } else if (this.grid[ny][nx] === this.grid[y][x]) {
                                    this.grid[ny][nx] *= 2;
                                    this.score += this.grid[ny][nx];
                                    this.grid[y][x] = 0;
                                    moved = true;
                                }
                            }
                        }
                    }
                }
            }
            
            if (moved) {
                this.spawnTile();
                this.drawGrid();
            }
        }
    }

    const config = {
        type: Phaser.AUTO,
        parent: container,
        width: container.clientWidth || 800,
        height: container.clientHeight || 600,
        backgroundColor: '#1a1a2e',
        scene: MainScene
    };

    game = new Phaser.Game(config);
}

export function destroyGame() {
    if (game) {
        game.destroy(true);
        game = null;
    }
}
