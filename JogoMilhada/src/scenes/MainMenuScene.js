export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const centerX = width / 2;
        const centerY = height / 2;

        this.add.image(centerX, centerY, 'background').setDisplaySize(width, height);

        this.music = this.sound.add('background_music', { loop: true });
        this.music.play();

        this.add.text(centerX, centerY - 100, 'Milhada Game', { fontSize: '64px', fill: '#fff' }).setOrigin(0.5);
        
        const startButton = this.add.text(centerX, centerY, 'Start Game', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
        startButton.setInteractive();
        startButton.on('pointerdown', () => this.scene.start('GameScene'));

        const settingsButton = this.add.text(centerX, centerY + 50, 'Settings', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
        settingsButton.setInteractive();
        settingsButton.on('pointerdown', () => this.showSettings());

        const quitButton = this.add.text(centerX, centerY + 100, 'Quit', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
        quitButton.setInteractive();
        quitButton.on('pointerdown', () => this.game.destroy(true));

        this.createSettingsOverlay(centerX, centerY);
    }

    createSettingsOverlay(x, y) {
        this.settingsOverlay = this.add.container(x, y).setDepth(1).setVisible(false);

        const background = this.add.graphics();
        background.fillStyle(0x000000, 0.8);
        background.fillRect(-200, -150, 400, 300);
        this.settingsOverlay.add(background);

        const title = this.add.text(0, -120, 'Settings', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
        this.settingsOverlay.add(title);

        const volumeText = this.add.text(-50, -50, 'Volume:', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);
        this.settingsOverlay.add(volumeText);

        const plusButton = this.add.text(50, -50, '+', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
        plusButton.setInteractive();
        plusButton.on('pointerdown', () => {
            if (this.music.volume < 1) {
                this.music.setVolume(this.music.volume + 0.1);
            }
        });
        this.settingsOverlay.add(plusButton);

        const minusButton = this.add.text(100, -50, '-', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
        minusButton.setInteractive();
        minusButton.on('pointerdown', () => {
            if (this.music.volume > 0) {
                this.music.setVolume(this.music.volume - 0.1);
            }
        });
        this.settingsOverlay.add(minusButton);

        const closeButton = this.add.text(0, 100, 'Close', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);
        closeButton.setInteractive();
        closeButton.on('pointerdown', () => this.hideSettings());
        this.settingsOverlay.add(closeButton);
    }

    showSettings() {
        this.settingsOverlay.setVisible(true);
    }

    hideSettings() {
        this.settingsOverlay.setVisible(false);
    }
}