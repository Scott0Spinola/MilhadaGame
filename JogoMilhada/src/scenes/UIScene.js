export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene', active: false });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const centerX = width / 2;
        const centerY = height / 2;

        this.gameScene = this.scene.get('GameScene');
        this.latestState = null;

        const table = this.add.image(centerX, centerY, 'table');
        table.setScale(0.4);

        this.textStyle = { fontSize: '20px', fill: '#fff' };
        this.headerStyle = { fontSize: '24px', fill: '#fff' };

        this.roundText = this.add.text(width - 20, 20, 'Ronda: -', this.headerStyle).setOrigin(1, 0);
        this.phaseText = this.add.text(20, 20, 'Fase: -', this.headerStyle).setOrigin(0, 0);
        this.messageText = this.add.text(20, 55, '', { fontSize: '18px', fill: '#fff', wordWrap: { width: width - 40 } }).setOrigin(0, 0);

        this.playerSummaryText = this.add.text(20, height - 160, '', this.textStyle).setOrigin(0, 0);
        this.aiSummaryText = this.add.text(20, height - 120, '', this.textStyle).setOrigin(0, 0);
        this.revealText = this.add.text(20, height - 80, '', this.textStyle).setOrigin(0, 0);

        this._buildControls(width, height);

        this.gameScene.events.on('state', (snapshot) => {
            this.latestState = snapshot;
            this._render(snapshot);
        });

        // In case the first state was emitted before this scene finished creating.
        this.gameScene.events.emit('requestState');
    }

    _buildControls(width, height) {
        this.controls = this.add.container(0, 0).setDepth(10);

        this.inputTitle = this.add.text(width - 360, height - 220, '', this.headerStyle).setOrigin(0, 0);
        this.controls.add(this.inputTitle);

        this.handPreview = this.add.image(width - 250, height - 145, 'mao1').setOrigin(0.5);
        this.handPreview.setScale(0.45);
        this.controls.add(this.handPreview);

        this.valueText = this.add.text(width - 250, height - 75, '0', { fontSize: '28px', fill: '#fff' }).setOrigin(0.5);
        this.controls.add(this.valueText);

        const makeButton = (x, y, label, onClick) => {
            const t = this.add.text(x, y, label, { fontSize: '28px', fill: '#fff' }).setOrigin(0.5);
            t.setInteractive({ useHandCursor: true });
            t.on('pointerdown', onClick);
            this.controls.add(t);
            return t;
        };

        this.leftBtn = makeButton(width - 330, height - 145, '←', () => this._changeValue(-1));
        this.rightBtn = makeButton(width - 170, height - 145, '→', () => this._changeValue(+1));
        this.confirmBtn = makeButton(width - 250, height - 25, 'Confirmar', () => this._confirm());

        // Player hand shown on the table area (closed after choosing)
        // Player hand shown bottom-left (closed after choosing)
        this.playerHandOnTable = this.add.image(20, height - 20, 'maoFechado').setOrigin(0, 1);
        this.playerHandOnTable.setScale(0.5);
        this.playerHandOnTable.setVisible(false);

        this._setControlMode('hidden');
    }

    _setControlMode(mode, options = {}) {
        // mode: hidden | bet | guess
        this.controlMode = mode;
        this.minValue = options.min ?? 0;
        this.maxValue = options.max ?? 0;
        this.currentValue = options.value ?? this.minValue;

        const visible = mode !== 'hidden';
        this.controls.setVisible(visible);
        if (!visible) return;

        this.currentValue = Math.max(this.minValue, Math.min(this.maxValue, this.currentValue));
        this.valueText.setText(String(this.currentValue));

        if (this.controlMode === 'bet') {
            this._setHandPreviewForBet(this.currentValue);
        }

        if (mode === 'bet') this.inputTitle.setText('Aposta (moedas)');
        if (mode === 'guess') this.inputTitle.setText('Palpite (total)');

        this.handPreview.setVisible(mode === 'bet');
        if (this.leftBtn) this.leftBtn.setVisible(mode === 'bet');
        if (this.rightBtn) this.rightBtn.setVisible(mode === 'bet');
    }

    _changeValue(delta) {
        if (this.controlMode === 'hidden') return;
        this.currentValue = Math.max(this.minValue, Math.min(this.maxValue, this.currentValue + delta));
        this.valueText.setText(String(this.currentValue));
        if (this.controlMode === 'bet') {
            this._setHandPreviewForBet(this.currentValue);
        }
    }

    _confirm() {
        if (!this.latestState) return;
        if (this.controlMode === 'bet') {
            this.gameScene.events.emit('playerBet', this.currentValue);
            this._setControlMode('hidden');
            return;
        }
        if (this.controlMode === 'guess') {
            this.gameScene.events.emit('playerGuess', this.currentValue);
            this._setControlMode('hidden');
            return;
        }
    }

    _render(state) {
        this.roundText.setText(`Ronda: ${state.gameRound}`);
        this.phaseText.setText(`Fase: ${this._phaseLabel(state.phase)}`);
        this.messageText.setText(state.message || '');

        const activePlayers = state.players.filter(p => p.active);
        const threshold = this._thresholdForCount(activePlayers.length);

        const player = state.players.find(p => p.isHuman);
        if (player) {
            this.playerSummaryText.setText(`Player — moedas: ${player.coins} | acertos: ${player.hits}/${threshold} | ativo: ${player.active ? 'sim' : 'não'}`);
        }

        const aiList = state.players.filter(p => !p.isHuman).map(p => `${p.name}(${p.id}) moedas:${p.coins} acertos:${p.hits}`).join(' | ');
        this.aiSummaryText.setText(aiList);

        if (state.phase === 'reveal' || state.phase === 'ended') {
            const lines = [];
            if (typeof state.potTotal === 'number') lines.push(`Total em jogo: ${state.potTotal}`);
            for (const p of state.players.filter(p => p.active)) {
                if (p.guess !== null && p.guess !== undefined) lines.push(`${p.name} palpite: ${p.guess}`);
            }
            this.revealText.setText(lines.join(' | '));
        } else {
            this.revealText.setText('');
        }

        // Controls depending on phase
        if (!player || !player.active || state.phase === 'ended') {
            this._setControlMode('hidden');
            this.playerHandOnTable.setVisible(false);
            return;
        }

        if (state.phase === 'bet') {
            const minBet = state.minBet;
            const maxBet = player.coins;
            // If player already has bet, hide controls (shouldn't happen in this flow)
            if (player.bet !== null && player.bet !== undefined) {
                this._setControlMode('hidden');
                this.playerHandOnTable.setTexture('maoFechado');
                this.playerHandOnTable.setVisible(true);
            } else {
                this._setControlMode('bet', { min: minBet, max: maxBet, value: minBet });
                this.playerHandOnTable.setVisible(false);
            }
            return;
        }

        if (state.phase === 'guess') {
            if (player.guess !== null && player.guess !== undefined) {
                this._setControlMode('hidden');
            } else {
                this._setControlMode('guess', { min: 0, max: state.maxGuess, value: 0 });
            }
            // During guess and reveal, keep the closed hand visible if the player has already bet.
            if (player.bet !== null && player.bet !== undefined) {
                this.playerHandOnTable.setTexture('maoFechado');
                this.playerHandOnTable.setVisible(true);
            } else {
                this.playerHandOnTable.setVisible(false);
            }
            return;
        }

        this._setControlMode('hidden');
        if (player.bet !== null && player.bet !== undefined) {
            this.playerHandOnTable.setTexture('maoFechado');
            this.playerHandOnTable.setVisible(true);
        } else {
            this.playerHandOnTable.setVisible(false);
        }
    }

    _setHandPreviewForBet(bet) {
        const key = `mao${bet}`;
        if (this.textures.exists(key)) {
            this.handPreview.setTexture(key);
        }
        this.valueText.setText(`Mão: ${bet}`);
    }

    _phaseLabel(phase) {
        if (phase === 'bet') return 'Aposta (escondida)';
        if (phase === 'guess') return 'Palpites';
        if (phase === 'reveal') return 'Resultado';
        if (phase === 'ended') return 'Fim';
        return phase;
    }

    _thresholdForCount(activeCount) {
        if (activeCount > 3) return 1;
        if (activeCount === 3) return 2;
        return 3;
    }
}