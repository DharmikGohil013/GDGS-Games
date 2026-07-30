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

            this.add.text(10, 10, 'Ball Drop (Plinko)\nClick top to drop ball', { fontSize: '20px', fill: '#ffffff' });
            this.score = 0;
            this.scoreText = this.add.text(10, 60, 'Score: 0', { fontSize: '24px', fill: '#ffffff' });

            // Pegs
            this.pegs = [];
            let rows = 10;
            let cols = 8;
            for (let i = 0; i < rows; i++) {
                let y = 150 + i * 40;
                let c = i % 2 === 0 ? cols : cols - 1;
                let offset = (this.width - (c - 1) * 60) / 2;
                for (let j = 0; j < c; j++) {
                    let x = offset + j * 60;
                    let peg = this.matter.add.circle(x, y, 5, { isStatic: true, restitution: 0.8 });
                    this.add.circle(x, y, 5, 0xffffff);
                }
            }

            // Zones
            let zoneWidth = this.width / 5;
            for (let i = 0; i < 5; i++) {
                let x = i * zoneWidth + zoneWidth / 2;
                let y = this.height - 20;
                let val = [10, 50, 100, 50, 10][i];
                let zone = this.matter.add.rectangle(x, y, zoneWidth - 4, 40, { isStatic: true, isSensor: true, label: 'zone_' + val });
                this.add.rectangle(x, y, zoneWidth - 4, 40, 0x3E6BFF);
                this.add.text(x, y, val.toString(), { fill: '#fff' }).setOrigin(0.5);
            }

            this.input.on('pointerdown', (pointer) => {
                if (pointer.y < 100) {
                    let ball = this.matter.add.circle(pointer.x, pointer.y, 10, { restitution: 0.6, density: 0.05 });
                    let g = this.add.circle(pointer.x, pointer.y, 10, 0xFF5F4D);
                    ball.gameObject = g;
                    
                    this.events.on('update', () => {
                        if(ball.position.y > this.height) {
                           g.destroy();
                        } else {
                           g.x = ball.position.x;
                           g.y = ball.position.y;
                        }
                    });
                }
            });

            this.matter.world.on('collisionstart', (event) => {
                for (let pair of event.pairs) {
                    let bodyA = pair.bodyA;
                    let bodyB = pair.bodyB;
                    
                    if (bodyA.label.startsWith('zone_') || bodyB.label.startsWith('zone_')) {
                        let zone = bodyA.label.startsWith('zone_') ? bodyA : bodyB;
                        let ball = bodyA.label.startsWith('zone_') ? bodyB : bodyA;
                        
                        let val = parseInt(zone.label.split('_')[1]);
                        this.score += val;
                        this.scoreText.setText('Score: ' + this.score);
                        
                        if (ball.gameObject) ball.gameObject.destroy();
                        this.matter.world.remove(ball);
                    }
                }
            });
        }
    }

    const config = {
        type: Phaser.AUTO,
        parent: container,
        width: container.clientWidth || 800,
        height: container.clientHeight || 600,
        backgroundColor: '#1a1a2e',
        physics: {
            default: 'matter',
            matter: { gravity: { y: 1 }, debug: false }
        },
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
