export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene', active: false });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const centerX = width / 2;
        const centerY = height / 2;
        // Table image in the middle
        const table = this.add.image(centerX, centerY, 'table');
        table.setScale(0.4);

        const style = { fontSize: '20px', fill: '#fff' };
        const distY = 200; // Distance for Top/Bottom
        const distX = 300; // Distance for Left/Right (wider for rectangle)

        // "Ai" to the right, top and left
        this.add.text(centerX, centerY - distY, 'Ai', style).setOrigin(0.5);
        this.add.text(centerX - distX, centerY, 'Ai', style).setOrigin(0.5);
        this.add.text(centerX + distX, centerY, 'Ai', style).setOrigin(0.5);

        // "Player" on the bottom
        this.add.text(centerX, centerY + distY, 'Player', style).setOrigin(0.5);

        // Round number top right
        this.add.text(width - 20, 20, 'Round: 1', { fontSize: '24px', fill: '#fff' }).setOrigin(1, 0);

        // Player picking status top left
        this.add.text(20, 20, 'player picking', { fontSize: '24px', fill: '#fff' }).setOrigin(0, 0);
    }
}