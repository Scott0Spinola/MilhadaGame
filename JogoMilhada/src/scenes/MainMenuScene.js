export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
    }

   
    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        this.background = this.add.tileSprite(0, 0, width, height, 'background');
        this.background.setOrigin(0, 0);
        this.background.setDepth(-1);
        this.background.setTint(0x331a00);
        this.background.setTileScale(0.5);

        this.music = this.sound.add('background_music', { loop: true });
        this.music.play();

        this.add.text(400, 150, 'Milhada Game', { fontSize: '64px', fill: '#fff' }).setOrigin(0.5);
        
        const startButton = this.add.text(400, 400, 'Start Game', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
        startButton.setInteractive();
        startButton.on('pointerdown', () => {
            this.scene.launch('GameScene');
            this.scene.launch('UIScene');
            this.scene.stop();
        });

        const settingsButton = this.add.text(400, 450, 'Settings', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
        settingsButton.setInteractive();
        settingsButton.on('pointerdown', () => this.showSettings());

        const quitButton = this.add.text(400, 500, 'Quit', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
        quitButton.setInteractive();
        quitButton.on('pointerdown', () => this.game.destroy(true));

        this.createSettingsOverlay();
    }

    createSettingsOverlay() {
        this.settingsOverlay = this.add.container(400, 300).setDepth(1).setVisible(false);

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