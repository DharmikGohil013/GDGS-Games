import Phaser from 'phaser';

let game;

export function initGame(container) {
    class MainScene extends Phaser.Scene {
        constructor() {
            super('MainScene');
        }

        create() {
            this.colors = [0xFF5F4D, 0x3E6BFF, 0x1FC98B, 0x8B5CF6, 0xFFC93C];
            this.width = this.sys.game.config.width;
            this.height = this.sys.game.config.height;

            this.add.text(10, 10, 'Tower Stacker\nTap to drop blocks', { fontSize: '20px', fill: '#ffffff' });
            
            this.score = 0;
            this.scoreText = this.add.text(10, 60, 'Score: 0', { fontSize: '24px', fill: '#ffffff' });

            this.blocks = [];
            this.currentBlock = null;
            this.blockSpeed = 200;
            this.blockDirection = 1;
            
            this.baseWidth = 200;
            this.blockHeight = 30;
            
            this.spawnBase();
            this.spawnBlock();

            this.input.on('pointerdown', this.placeBlock, this);
        }

        spawnBase() {
            let base = this.add.rectangle(this.width / 2, this.height - 20, this.baseWidth, this.blockHeight * 2, 0x888888);
            this.blocks.push(base);
        }

        spawnBlock() {
            let lastBlock = this.blocks[this.blocks.length - 1];
            let y = lastBlock.y - this.blockHeight * 1.5;
            
            let color = this.colors[this.score % this.colors.length];
            let width = lastBlock.width;

            this.currentBlock = this.add.rectangle(0, y, width, this.blockHeight, color);
            this.blockDirection = Math.random() > 0.5 ? 1 : -1;
            this.currentBlock.x = this.blockDirection === 1 ? -width : this.width + width;
        }

        update(time, delta) {
            if (this.currentBlock) {
                this.currentBlock.x += this.blockSpeed * this.blockDirection * (delta / 1000);
                if (this.currentBlock.x > this.width + this.currentBlock.width) this.blockDirection = -1;
                if (this.currentBlock.x < -this.currentBlock.width) this.blockDirection = 1;
            }
        }

        placeBlock() {
            if (!this.currentBlock) return;

            let lastBlock = this.blocks[this.blocks.length - 1];
            let overlap = lastBlock.width / 2 + this.currentBlock.width / 2 - Math.abs(this.currentBlock.x - lastBlock.x);

            if (overlap > 0) {
                // Cut block
                let newWidth = overlap;
                let direction = this.currentBlock.x > lastBlock.x ? 1 : -1;
                let offset = (lastBlock.width - newWidth) / 2;
                
                this.currentBlock.width = newWidth;
                this.currentBlock.x = lastBlock.x + (direction * offset);
                
                this.blocks.push(this.currentBlock);
                this.currentBlock = null;
                
                this.score++;
                this.scoreText.setText('Score: ' + this.score);
                this.blockSpeed += 10;
                
                // Move camera down if tower is high
                if (this.blocks.length > 5) {
                    this.cameras.main.scrollY -= this.blockHeight;
                }

                this.spawnBlock();
            } else {
                this.currentBlock.setFillStyle(0xff0000);
                this.add.text(this.width/2 - 50, this.cameras.main.scrollY + this.height/2, 'GAME OVER', { fontSize: '32px', fill: '#ff0000' });
                this.currentBlock = null;
                this.input.off('pointerdown', this.placeBlock, this);
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
