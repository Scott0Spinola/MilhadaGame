export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        this.scene.launch('UIScene');
        // Game logic will go here
    }
}