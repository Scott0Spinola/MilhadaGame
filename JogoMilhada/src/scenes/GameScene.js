export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        this.add.image(width / 2, height / 2, 'background').setDisplaySize(width, height);

        this.scene.launch('UIScene');

        this._rng = new Phaser.Math.RandomDataGenerator();

        this.state = {
            gameRound: 1, // global round count (1st round forces min bet 1)
            phase: 'bet', // bet | guess | reveal | ended
            minBet: 1,
            potTotal: 0,
            maxGuess: 0,
            message: '',
            players: [
                { id: 'p1', name: 'Player', isHuman: true, coins: 3, hits: 0, active: true, bet: null, guess: null },
                { id: 'ai1', name: 'Ai', isHuman: false, coins: 3, hits: 0, active: true, bet: null, guess: null },
                { id: 'ai2', name: 'Ai', isHuman: false, coins: 3, hits: 0, active: true, bet: null, guess: null },
                { id: 'ai3', name: 'Ai', isHuman: false, coins: 3, hits: 0, active: true, bet: null, guess: null }
            ],
            qualifiedOrder: [],
            winnerId: null
        };

        this._wireUiEvents();
        this._startBetPhase();
    }

    _wireUiEvents() {
        // UIScene calls these events on this scene
        this.events.on('playerBet', (amount) => this._onPlayerBet(amount));
        this.events.on('playerGuess', (amount) => this._onPlayerGuess(amount));
        this.events.on('requestState', () => this._emitState());
        this.events.on('restartToMenu', () => {
            this.scene.stop('UIScene');
            this.scene.start('MainMenuScene');
        });
    }

    _activePlayers() {
        return this.state.players.filter(p => p.active);
    }

    _getThresholdForActiveCount(activeCount) {
        if (activeCount > 3) return 1;
        if (activeCount === 3) return 2;
        return 3; // 2 players
    }

    _resetRoundFields() {
        for (const player of this.state.players) {
            player.bet = null;
            player.guess = null;
        }
        this.state.potTotal = 0;
        this.state.maxGuess = 0;
    }

    _emitState() {
        // Send a safe snapshot (no methods) for UI rendering.
        const snapshot = {
            gameRound: this.state.gameRound,
            phase: this.state.phase,
            minBet: this.state.minBet,
            potTotal: this.state.potTotal,
            maxGuess: this.state.maxGuess,
            message: this.state.message,
            qualifiedOrder: [...this.state.qualifiedOrder],
            winnerId: this.state.winnerId,
            players: this.state.players.map(p => ({
                id: p.id,
                name: p.name,
                isHuman: p.isHuman,
                coins: p.coins,
                hits: p.hits,
                active: p.active,
                bet: p.bet,
                guess: p.guess
            }))
        };
        this.events.emit('state', snapshot);
    }

    _startBetPhase() {
        this._resetRoundFields();

        this.state.phase = 'bet';
        this.state.minBet = this.state.gameRound === 1 ? 1 : 0;
        this.state.message = this.state.gameRound === 1
            ? 'Ronda 1: cada jogador mete pelo menos 1 moeda.'
            : 'Nova ronda: cada jogador pode meter 0 ou mais moedas.';

        // Ask player first; AIs will bet after.
        this._emitState();
    }

    _clampInt(value, min, max) {
        const n = Math.floor(Number(value));
        if (!Number.isFinite(n)) return min;
        return Math.max(min, Math.min(max, n));
    }

    _onPlayerBet(amount) {
        if (this.state.phase !== 'bet') return;

        const player = this.state.players.find(p => p.isHuman);
        if (!player || !player.active) return;

        const minBet = this.state.minBet;
        const maxBet = player.coins;
        const bet = this._clampInt(amount, minBet, maxBet);

        player.bet = bet;
        player.coins -= bet;

        // AI bets (hidden)
        for (const ai of this._activePlayers().filter(p => !p.isHuman)) {
            const aiMin = this.state.minBet;
            const aiMax = ai.coins;
            const aiBet = this._rng.between(aiMin, aiMax);
            ai.bet = aiBet;
            ai.coins -= aiBet;
        }

        this._startGuessPhase();
    }

    _startGuessPhase() {
        this.state.phase = 'guess';
        const active = this._activePlayers();
        const potTotal = active.reduce((sum, p) => sum + (p.bet ?? 0), 0);
        this.state.potTotal = potTotal;

        // Max guess is the sum of each player's pre-bet coins, i.e. coins + bet.
        this.state.maxGuess = active.reduce((sum, p) => sum + (p.coins + (p.bet ?? 0)), 0);

        this.state.message = 'Fase de palpites: todos dizem um número diferente.';
        this._emitState();
    }

    _onPlayerGuess(amount) {
        if (this.state.phase !== 'guess') return;
        const player = this.state.players.find(p => p.isHuman);
        if (!player || !player.active) return;

        const guess = this._clampInt(amount, 0, this.state.maxGuess);
        player.guess = guess;

        // AI guesses (must be unique)
        const used = new Set();
        used.add(guess);

        const activeAis = this._activePlayers().filter(p => !p.isHuman);
        for (const ai of activeAis) {
            const aiGuess = this._pickUniqueGuess(used, this.state.maxGuess);
            ai.guess = aiGuess;
            used.add(aiGuess);
        }

        this._revealAndResolve();
    }

    _pickUniqueGuess(used, maxGuess) {
        // Try random a few times, then fall back to scanning.
        for (let i = 0; i < 20; i++) {
            const g = this._rng.between(0, maxGuess);
            if (!used.has(g)) return g;
        }
        for (let g = 0; g <= maxGuess; g++) {
            if (!used.has(g)) return g;
        }
        // Should be impossible unless maxGuess is tiny and used is full.
        return 0;
    }

    _revealAndResolve() {
        this.state.phase = 'reveal';

        const active = this._activePlayers();
        const potTotal = this.state.potTotal;

        const winner = active.find(p => p.guess === potTotal) || null;
        if (!winner) {
            this.state.message = `Ninguém acertou. Total em jogo: ${potTotal}.`;
            this._emitState();
            this._nextRound();
            return;
        }

        winner.hits += 1;
        const threshold = this._getThresholdForActiveCount(active.length);

        if (active.length === 2 && winner.hits >= threshold) {
            this.state.winnerId = winner.id;
            this.state.message = `${winner.name} acertou (total ${potTotal}) e chegou a ${winner.hits}/${threshold}. Vitória!`;
            this._emitState();
            this._endGame();
            return;
        }

        if (winner.hits >= threshold) {
            winner.active = false;
            this.state.qualifiedOrder.push(winner.id);
            this.state.message = `${winner.name} acertou (total ${potTotal}) e saiu do jogo (${winner.hits}/${threshold}).`;
        } else {
            this.state.message = `${winner.name} acertou (total ${potTotal}). Acertos: ${winner.hits}/${threshold}.`;
        }

        this._emitState();
        this._nextRound();
    }

    _nextRound() {
        // Small delay so the player can read the message.
        this.time.delayedCall(1200, () => {
            if (this.state.winnerId) return;

            const active = this._activePlayers();
            if (active.length <= 1) {
                // Shouldn't happen with the defined rules, but handle gracefully.
                const remaining = active[0];
                this.state.winnerId = remaining ? remaining.id : null;
                this._endGame();
                return;
            }

            this.state.gameRound += 1;
            this._startBetPhase();
        });
    }

    _endGame() {
        this.state.phase = 'ended';
        this._emitState();

        this.time.delayedCall(400, () => {
            this.scene.stop('UIScene');
            this.scene.start('EndScene', { winnerId: this.state.winnerId, players: this.state.players });
        });
    }
}