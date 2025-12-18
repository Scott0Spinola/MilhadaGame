export default class EndScene extends Phaser.Scene {
    constructor() {
        super('EndScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        this.add.image(width / 2, height / 2, 'background').setDisplaySize(width, height);

        // End game screen logic will go here
    }
}