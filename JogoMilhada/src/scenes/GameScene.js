export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        this.background = this.add.tileSprite(0, 0, width, height, 'background');
        this.background.setOrigin(0, 0);
        this.background.setDepth(-1);
        this.background.setTint(0x331a00);
        this.background.setTileScale(0.5);

        this.scene.launch('UIScene');
        // Game logic will go here
    }
}