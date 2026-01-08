export default class EndScene extends Phaser.Scene {
    constructor() {
        super('EndScene');
    }

    create(data) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        this.add.image(width / 2, height / 2, 'background').setDisplaySize(width, height);

        const winnerId = data?.winnerId ?? null;
        const players = Array.isArray(data?.players) ? data.players : [];
        const winner = players.find(p => p.id === winnerId);

        this.add.text(width / 2, height / 2 - 80, 'Fim do jogo', { fontSize: '64px', fill: '#fff' }).setOrigin(0.5);
        this.add.text(
            width / 2,
            height / 2,
            winner ? `Vencedor: ${winner.name}` : 'Vencedor: -',
            { fontSize: '32px', fill: '#fff' }
        ).setOrigin(0.5);

        const back = this.add.text(width / 2, height / 2 + 120, 'Voltar ao menu', { fontSize: '28px', fill: '#fff' }).setOrigin(0.5);
        back.setInteractive({ useHandCursor: true });
        back.on('pointerdown', () => this.scene.start('MainMenuScene'));
    }
}