export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Load assets for the loading screen
        this.load.audio('background_music', 'assets/audio/good-night-lofi-cozy-chill-music-160166.mp3');
        this.load.image('table', 'assets/img/squareTable.png');
        this.load.image('background', 'assets/img/fundo.png');
        this.load.image('mao0', 'assets/img/mao0.png');
        this.load.image('mao1', 'assets/img/mao1.png');
        this.load.image('mao2', 'assets/img/mao2.png');
        this.load.image('mao3', 'assets/img/mao3.png');
        this.load.image('maoFechado', 'assets/img/maoFechado.png');
    }

    create() {
        this.scene.start('MainMenuScene');
    }
}