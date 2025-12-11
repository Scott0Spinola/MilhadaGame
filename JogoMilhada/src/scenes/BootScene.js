export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Load assets for the loading screen
        this.load.audio('background_music', 'assets/audio/good-night-lofi-cozy-chill-music-160166.mp3');
        this.load.image('background', 'assets/img/pattern_0015.png');
    }

    create() {
        this.scene.start('MainMenuScene');
    }
}