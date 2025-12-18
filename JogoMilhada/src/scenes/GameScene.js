export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        this.add.image(width / 2, height / 2, 'background').setDisplaySize(width, height);

        this.scene.launch('UIScene');
        // Game logic will go here
    }
}