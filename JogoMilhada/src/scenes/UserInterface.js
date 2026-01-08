export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene', active: false });
    }

    create() {
        this.width = this.cameras.main.width;
        this.height = this.cameras.main.height;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;

        this.gameScene = this.scene.get('GameScene');

        // --- Static Background Elements ---
        // Table background (could be in GameScene, but UI has it currently)
        const table = this.add.image(this.centerX, this.centerY, 'table');
        table.setScale(0.4);
        table.setDepth(-10); // Ensure it's behind

        // --- Static HUD ---
        this.headerStyle = { fontSize: '24px', fill: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 };
        this.textStyle = { fontSize: '20px', fill: '#fff', stroke: '#000', strokeThickness: 2 };

        this.roundText = this.add.text(this.width - 20, 20, 'Ronda: -', this.headerStyle).setOrigin(1, 0);
        this.phaseText = this.add.text(20, 20, 'Fase: -', this.headerStyle).setOrigin(0, 0);
        this.totalCoinsText = this.add.text(this.centerX, 20, 'Moedas em Jogo: -', this.headerStyle).setOrigin(0.5, 0);
        
        // Message area (top left, below phase)
        this.messageText = this.add.text(20, 60, '', { 
            fontSize: '18px', 
            fill: '#eee', 
            wordWrap: { width: this.width - 40 } 
        }).setOrigin(0, 0);

        // Player Stats (Bottom Left)
        this.playerStatsText = this.add.text(20, this.height - 40, '', this.textStyle).setOrigin(0, 1);
        
        // AI Stats (Top Right / Right Side - Simplified list)
        this.aiStatsText = this.add.text(this.width - 20, 60, '', { 
            fontSize: '16px', 
            fill: '#ccc', 
            align: 'right' 
        }).setOrigin(1, 0);

        // --- Dynamic Content Container ---
        // We will clear and fill this container when the phase changes
        this.phaseContainer = this.add.container(0, 0);

        this.currentPhase = null;

        // --- Event Listeners ---
        this.gameScene.events.on('state', (state) => {
            this._updateHUD(state);
            
            // Only rebuild UI if phase changed
            if (this.currentPhase !== state.phase) {
                this.currentPhase = state.phase;
                this._rebuildPhaseUI(state);
            }
        });

        // Initial Request
        this.gameScene.events.emit('requestState');
    }

    _updateHUD(state) {
        this.roundText.setText(`Ronda: ${state.gameRound}`);
        this.phaseText.setText(`Fase: ${this._getPhaseName(state.phase)}`);
        
        // Calculate pot/coins
        const activePlayers = state.players.filter(p => p.active);
        const pot = state.potTotal || 0; 
        const totalCoinsInPlay = state.players.reduce((sum, p) => sum + (p.active ? p.coins + (p.bet||0) : 0), 0);
        this.totalCoinsText.setText(`Moedas em Jogo: ${totalCoinsInPlay}`);
        
        this.messageText.setText(state.message || '');

        // Player Stats
        const player = state.players.find(p => p.isHuman);
        if (player) {
            this.playerStatsText.setText(
                `PLAYER: ${player.coins} Moedas | Acertos: ${player.hits} | ${player.active ? 'ATIVO' : 'ELIMINADO'}`
            );
        }

        // AI Stats
        const ais = state.players.filter(p => !p.isHuman && p.active);
        const aiStr = ais.map(p => `${p.name}: ${p.coins} ($)`).join('\n');
        this.aiStatsText.setText(aiStr);
    }

    _rebuildPhaseUI(state) {
        // Clear previous UI
        this.phaseContainer.removeAll(true); // true = destroy children

        const player = state.players.find(p => p.isHuman);
        
        // If player is dead, show spectator UI or simple message
        if (player && !player.active) {
            this._buildSpectatorUI(state);
            return;
        }

        switch (state.phase) {
            case 'bet':
                this._buildBetUI(state, player);
                break;
            case 'guess':
                this._buildGuessUI(state, player);
                break;
            case 'reveal':
                this._buildRevealUI(state);
                break;
            case 'ended':
                // Do nothing or show "Game Over"
                const gameOver = this.add.text(this.centerX, this.centerY, 'FIM DE JOGO', { fontSize: '64px', fill: 'red', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5);
                this.phaseContainer.add(gameOver);
                break;
        }
    }

    // --- Phase Builders ---

    _buildBetUI(state, player) {
        // Control Panel
        const panelY = this.height - 150;
        
        // Title
        const title = this.add.text(this.centerX, panelY - 100, 'FAÇA A SUA APOSTA', { fontSize: '32px', fill: '#ffff00', fontStyle: 'bold' }).setOrigin(0.5);
        this.phaseContainer.add(title);

        // State for local selection
        let currentSelection = state.minBet;
        const maxSelection = player.coins;

        // Hand Preview Image
        const handImage = this.add.image(this.centerX, panelY, `mao${currentSelection}`).setScale(0.5);
        this.phaseContainer.add(handImage);

        // Value text
        const valueText = this.add.text(this.centerX, panelY + 60, `${currentSelection} moedas`, { fontSize: '28px', fill: '#fff' }).setOrigin(0.5);
        this.phaseContainer.add(valueText);

        // Decrease Button
        const btnMinus = this._createButton(this.centerX - 120, panelY, '<<', () => {
            if (currentSelection > state.minBet) {
                currentSelection--;
                this._updateBetVisuals(handImage, valueText, currentSelection);
            }
        });
        this.phaseContainer.add(btnMinus);

        // Increase Button
        const btnPlus = this._createButton(this.centerX + 120, panelY, '>>', () => {
            if (currentSelection < maxSelection) {
                currentSelection++;
                this._updateBetVisuals(handImage, valueText, currentSelection);
            }
        });
        this.phaseContainer.add(btnPlus);

        // Confirm Button
        const btnConfirm = this._createButton(this.centerX, panelY + 120, 'CONFIRMAR APOSTA', () => {
            // Disable interactions to prevent double send
            this.input.enabled = false; 
            this.gameScene.events.emit('playerBet', currentSelection);
            
            // Re-enable input slightly later just in case phase switch is instant
            this.time.delayedCall(100, () => { this.input.enabled = true; });
        }, { fontSize: '28px', backgroundColor: '#00aa00', padding: { x: 20, y: 10 } });
        this.phaseContainer.add(btnConfirm);
        
        // Initial Visual Update
        this._updateBetVisuals(handImage, valueText, currentSelection);
    }

    _updateBetVisuals(img, txt, val) {
        if (this.textures.exists(`mao${val}`)) {
            img.setTexture(`mao${val}`);
        }
        txt.setText(`${val} moedas`);
    }

    _buildGuessUI(state, player) {
        // Logic for guessing total
        
        const panelY = this.height - 150;

        const title = this.add.text(this.centerX, panelY - 100, 'ADIVINHE A SOMA TOTAL', { fontSize: '32px', fill: '#00ffff', fontStyle: 'bold' }).setOrigin(0.5);
        this.phaseContainer.add(title);
        
        let currentGuess = 0;
        const maxGuess = state.maxGuess || 20; // fallback

        // Number Display
        const guessDisplay = this.add.text(this.centerX, panelY, '0', { fontSize: '72px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        this.phaseContainer.add(guessDisplay);

        // Minus
        const btnMinus = this._createButton(this.centerX - 100, panelY, '-', () => {
            if (currentGuess > 0) {
                currentGuess--;
                guessDisplay.setText(String(currentGuess));
            }
        }, { fontSize: '60px', color: '#ff0000' });
        this.phaseContainer.add(btnMinus);

        // Plus
        const btnPlus = this._createButton(this.centerX + 100, panelY, '+', () => {
            if (currentGuess < maxGuess) {
                currentGuess++;
                guessDisplay.setText(String(currentGuess));
            }
        }, { fontSize: '60px', color: '#00ff00' });
        this.phaseContainer.add(btnPlus);

        // Confirm
        const btnConfirm = this._createButton(this.centerX, panelY + 120, 'CONFIRMAR PALPITE', () => {
            this.input.enabled = false;
            this.gameScene.events.emit('playerGuess', currentGuess);
            this.time.delayedCall(100, () => { this.input.enabled = true; });
        }, { fontSize: '28px', backgroundColor: '#00aa00', padding: { x: 20, y: 10 } });
        this.phaseContainer.add(btnConfirm);
    }

    _buildRevealUI(state) {
        // Show everything!
        
        // Positions for players.
        // Player: Bottom Center
        // AI 1: Left
        // AI 2: Top
        // AI 3: Right
        
        const positions = [
            { id: 'p1', x: this.centerX, y: this.height - 150 }, // Player
            { id: 'ai1', x: 200, y: this.centerY },
            { id: 'ai2', x: this.centerX, y: 150 },
            { id: 'ai3', x: this.width - 200, y: this.centerY }
        ];

        // Map players to positions
        state.players.forEach((p, index) => {
            if (!p.active) return;

            let pos = positions.find(pos => pos.id === p.id);
            if (!pos) {
                // Fallback
                pos = positions[index % positions.length];
            }

            // Group for this player reveal
            const container = this.add.container(pos.x, pos.y);
            this.phaseContainer.add(container);

            // Name
            const nameText = this.add.text(0, -70, p.name, { fontSize: '20px', fill: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5);
            container.add(nameText);

            // Hand Image (Open hand showing coins)
            const handKey = `mao${p.bet}`;
            if (this.textures.exists(handKey)) {
                const hand = this.add.image(0, 0, handKey).setScale(0.4);
                container.add(hand);
            } else {
                const handText = this.add.text(0, 0, `[${p.bet} moedas]`, { fontSize: '18px' }).setOrigin(0.5);
                container.add(handText);
            }

            // Guess Bubble
            if (p.guess !== null) {
                const bubbleY = -100;
                const guessText = this.add.text(0, bubbleY, `🗣 ${p.guess}`, { 
                    fontSize: '24px', 
                    fill: '#ffcc00', 
                    backgroundColor: '#000',
                    padding: { x: 4, y: 2 }
                }).setOrigin(0.5);
                container.add(guessText);
            }
        });

        // Center Result Text (Big)
        const totalText = this.add.text(this.centerX, this.centerY, `TOTAL: ${state.potTotal}`, {
            fontSize: '80px', fill: '#fff', stroke: '#00af00', strokeThickness: 8
        }).setOrigin(0.5);
        this.phaseContainer.add(totalText);
    }

    _buildSpectatorUI(state) {
        const txt = this.add.text(this.centerX, this.height - 100, 'Você foi eliminado. Aguardando fim do jogo...', {
            fontSize: '24px', fill: '#888'
        }).setOrigin(0.5);
        this.phaseContainer.add(txt);
        
        if (state.phase === 'reveal') {
            this._buildRevealUI(state);
        }
    }

    // --- Helpers ---

    _createButton(x, y, text, callback, style = {}) {
        const fontSize = style.fontSize || '40px';
        const color = style.color || '#ffffff';
        const bgColor = style.backgroundColor || '#333333';
        const padding = style.padding || { x: 10, y: 10 };

        const btn = this.add.text(x, y, text, { 
            fontSize: fontSize, 
            fill: color, 
            backgroundColor: bgColor,
            padding: padding 
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', callback)
        .on('pointerover', () => btn.setStyle({ fill: '#ffff00' }))
        .on('pointerout', () => btn.setStyle({ fill: color }));

        return btn;
    }

    _getPhaseName(phase) {
        const names = {
            'bet': 'Apostas',
            'guess': 'Palpites',
            'reveal': 'Resultado',
            'ended': 'Fim'
        };
        return names[phase] || phase;
    }
}
