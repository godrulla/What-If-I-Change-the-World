// ===== RETRO AUDIO ENGINE =====
// Synthesized 8-bit sound effects using Web Audio API — no external files needed
// Each of the 13 games has a unique melody and celebration sound

class RetroAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicPlaying = false;
    this._initOnInteraction();
  }

  _initOnInteraction() {
    const init = () => {
      if (this.ctx) return;
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.3;
      this.sfxGain.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.12;
      this.musicGain.connect(this.ctx.destination);
    };
    ['click', 'touchstart', 'keydown'].forEach(evt =>
      document.addEventListener(evt, init, { once: false, passive: true })
    );
  }

  _ensureCtx() {
    if (!this.ctx) return false;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.enabled;
  }

  // === SOUND EFFECTS ===

  step() {
    if (!this._ensureCtx()) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 120 + Math.random() * 40;
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);
    osc.connect(gain).connect(this.sfxGain);
    osc.start(); osc.stop(this.ctx.currentTime + 0.06);
  }

  jump() {
    if (!this._ensureCtx()) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    osc.connect(gain).connect(this.sfxGain);
    osc.start(); osc.stop(this.ctx.currentTime + 0.2);
  }

  collect() {
    if (!this._ensureCtx()) return;
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.07 + 0.12);
      osc.connect(gain).connect(this.sfxGain);
      osc.start(this.ctx.currentTime + i * 0.07);
      osc.stop(this.ctx.currentTime + i * 0.07 + 0.12);
    });
  }

  dialog() {
    if (!this._ensureCtx()) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
    osc.connect(gain).connect(this.sfxGain);
    osc.start(); osc.stop(this.ctx.currentTime + 0.3);
  }

  hurt() {
    if (!this._ensureCtx()) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
    osc.connect(gain).connect(this.sfxGain);
    osc.start(); osc.stop(this.ctx.currentTime + 0.3);
  }

  click() {
    if (!this._ensureCtx()) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
    osc.connect(gain).connect(this.sfxGain);
    osc.start(); osc.stop(this.ctx.currentTime + 0.04);
  }

  unlock() {
    if (!this._ensureCtx()) return;
    const notes = [784, 988, 1175, 1319, 1568];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = this.ctx.currentTime + i * 0.08;
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain).connect(this.sfxGain);
      osc.start(t); osc.stop(t + 0.2);
    });
  }

  // === WIN CELEBRATIONS ===
  // Each game can call a different celebration type

  // Classic fanfare (default) — triumphant horns
  win(type) {
    if (type) return this.winCelebration(type);
    if (!this._ensureCtx()) return;
    const melody = [
      [523, 0.12], [523, 0.12], [523, 0.12], [659, 0.2],
      [784, 0.15], [659, 0.15], [784, 0.3], [1047, 0.4]
    ];
    let t = this.ctx.currentTime;
    melody.forEach(([freq, dur]) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.setValueAtTime(0.18, t + dur * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain).connect(this.sfxGain);
      osc.start(t); osc.stop(t + dur);
      t += dur;
    });
    // Harmony
    t = this.ctx.currentTime;
    [392, 494, 587, 784].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const start = t + 0.36 + i * 0.15;
      gain.gain.setValueAtTime(0.1, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
      osc.connect(gain).connect(this.sfxGain);
      osc.start(start); osc.stop(start + 0.3);
    });
  }

  winCelebration(type) {
    if (!this._ensureCtx()) return;
    const fn = this._celebrations[type];
    if (fn) fn.call(this);
    else this.win(); // fallback to default fanfare
  }

  get _celebrations() { return {
    // Crowd applause — filtered noise bursts simulating clapping
    applause: function() {
      const t = this.ctx.currentTime;
      for (let i = 0; i < 30; i++) {
        const bufSize = 2048;
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let j = 0; j < bufSize; j++) data[j] = (Math.random() * 2 - 1) * 0.5;
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 3000 + Math.random() * 2000;
        filter.Q.value = 0.5;
        const gain = this.ctx.createGain();
        const start = t + i * 0.06 + Math.random() * 0.04;
        const dur = 0.04 + Math.random() * 0.03;
        gain.gain.setValueAtTime(0.15 + Math.random() * 0.1, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
        src.connect(filter).connect(gain).connect(this.sfxGain);
        src.start(start); src.stop(start + dur);
      }
      // Triumphant chord on top
      [523, 659, 784].forEach(freq => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0.12, t + 0.2);
        g.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
        osc.connect(g).connect(this.sfxGain);
        osc.start(t + 0.2); osc.stop(t + 1.8);
      });
    },

    // Gentle chimes — soft bells cascading down
    chimes: function() {
      const t = this.ctx.currentTime;
      const notes = [1047, 988, 880, 784, 659, 784, 880, 1047, 1319];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const start = t + i * 0.15;
        gain.gain.setValueAtTime(0.14, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
        osc.connect(gain).connect(this.sfxGain);
        osc.start(start); osc.stop(start + 0.5);
        // Overtone
        const osc2 = this.ctx.createOscillator();
        const g2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.value = freq * 2;
        g2.gain.setValueAtTime(0.05, start);
        g2.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
        osc2.connect(g2).connect(this.sfxGain);
        osc2.start(start); osc2.stop(start + 0.3);
      });
    },

    // Heroic brass — bold rising power chord
    heroic: function() {
      const t = this.ctx.currentTime;
      const melody = [
        [262, 0.15], [330, 0.15], [392, 0.15], [523, 0.3],
        [659, 0.15], [784, 0.2], [1047, 0.5]
      ];
      let mt = t;
      melody.forEach(([freq, dur]) => {
        // Lead
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.12, mt);
        gain.gain.setValueAtTime(0.12, mt + dur * 0.6);
        gain.gain.exponentialRampToValueAtTime(0.001, mt + dur);
        osc.connect(gain).connect(this.sfxGain);
        osc.start(mt); osc.stop(mt + dur);
        // Fifth harmony
        const osc2 = this.ctx.createOscillator();
        const g2 = this.ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.value = freq * 1.5;
        g2.gain.setValueAtTime(0.06, mt);
        g2.gain.exponentialRampToValueAtTime(0.001, mt + dur);
        osc2.connect(g2).connect(this.sfxGain);
        osc2.start(mt); osc2.stop(mt + dur);
        mt += dur;
      });
    },

    // Sparkle magic — ascending glittery arpeggios
    sparkle: function() {
      const t = this.ctx.currentTime;
      const notes = [523,659,784,1047,1175,1319,1568,1760,2093];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const start = t + i * 0.09;
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
        osc.connect(gain).connect(this.sfxGain);
        osc.start(start); osc.stop(start + 0.35);
      });
      // Shimmer tail
      for (let i = 0; i < 8; i++) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 1500 + Math.random() * 1500;
        const start = t + 0.8 + i * 0.07;
        g.gain.setValueAtTime(0.06, start);
        g.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
        osc.connect(g).connect(this.sfxGain);
        osc.start(start); osc.stop(start + 0.2);
      }
    },

    // Ocean wave — whooshing with a bright finish
    wave: function() {
      const t = this.ctx.currentTime;
      // Whoosh via filtered noise
      const bufSize = this.ctx.sampleRate * 2;
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, t);
      filter.frequency.exponentialRampToValueAtTime(4000, t + 0.8);
      filter.frequency.exponentialRampToValueAtTime(200, t + 1.5);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.15, t + 0.5);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
      src.connect(filter).connect(g).connect(this.sfxGain);
      src.start(t); src.stop(t + 1.5);
      // Bright finish chord
      [659, 784, 988].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const og = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        og.gain.setValueAtTime(0.12, t + 1.0);
        og.gain.exponentialRampToValueAtTime(0.001, t + 2.0);
        osc.connect(og).connect(this.sfxGain);
        osc.start(t + 1.0); osc.stop(t + 2.0);
      });
    },

    // Marching victory — rhythmic drum-like beats + rising melody
    march: function() {
      const t = this.ctx.currentTime;
      // Drum hits
      for (let i = 0; i < 6; i++) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, t + i * 0.18);
        osc.frequency.exponentialRampToValueAtTime(40, t + i * 0.18 + 0.1);
        g.gain.setValueAtTime(0.2, t + i * 0.18);
        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.18 + 0.12);
        osc.connect(g).connect(this.sfxGain);
        osc.start(t + i * 0.18); osc.stop(t + i * 0.18 + 0.12);
      }
      // Rising melody
      [392, 440, 523, 587, 659, 784, 1047].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        const start = t + 1.1 + i * 0.1;
        g.gain.setValueAtTime(0.12, start);
        g.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
        osc.connect(g).connect(this.sfxGain);
        osc.start(start); osc.stop(start + 0.2);
      });
    },

    // Choir — warm sustained chord with vibrato
    choir: function() {
      const t = this.ctx.currentTime;
      [262, 330, 392, 523].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        // Vibrato
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.value = 5;
        lfoGain.gain.value = 3;
        lfo.connect(lfoGain).connect(osc.frequency);
        lfo.start(t + 0.1 * i);
        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(0.12, t + 0.3);
        g.gain.setValueAtTime(0.12, t + 1.5);
        g.gain.exponentialRampToValueAtTime(0.001, t + 2.5);
        osc.connect(g).connect(this.sfxGain);
        osc.start(t + 0.1 * i); osc.stop(t + 2.5);
        lfo.stop(t + 2.5);
      });
    }
  }; }

  // Sad descending — lose sound
  lose() {
    if (!this._ensureCtx()) return;
    const notes = [440, 392, 330, 262];
    let t = this.ctx.currentTime;
    notes.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(gain).connect(this.sfxGain);
      osc.start(t); osc.stop(t + 0.3);
      t += 0.25;
    });
  }

  // === BACKGROUND MUSIC ===
  // 13 unique melodies — one per game — plus the 6 legacy moods

  startMusic(mood) {
    if (!this._ensureCtx()) return;
    this.stopMusic();

    const melodies = {
      // Legacy moods (backward compatible)
      adventure: [262,294,330,349,392,349,330,294,262,247,220,247],
      ocean:     [330,392,440,392,330,294,262,294,330,392,440,523],
      peaceful:  [262,330,392,523,440,392,330,392,440,523,659,523],
      urgent:    [330,330,392,330,294,294,349,294,262,262,330,262],
      puzzle:    [440,494,523,587,659,587,523,494,440,392,349,392],
      dark:      [220,233,247,262,247,233,220,208,196,208,220,233],

      // Game 01: The Boy Who Caught the Wind — hopeful, uplifting C major
      wind:      [262,294,330,392,440,392,523,440,392,330,294,330],
      // Game 02: The Boy and the Well — folk/community, bouncy G major
      well:      [392,440,494,523,494,440,392,330,294,330,392,440],
      // Game 03: Plastic Bags and Fish — flowing, watery arpeggios
      fish:      [330,392,494,523,494,392,330,262,330,392,440,392],
      // Game 04: The School That Closed — playful, childlike F major
      school:    [349,392,440,523,440,349,330,294,262,294,349,440],
      // Game 05: Washing Machine of Wheels — rhythmic, mechanical groove
      machine:   [294,294,349,294,392,392,349,392,440,392,349,294],
      // Game 06: The Girl and the Poisoned Water — mysterious, chromatic
      poison:    [220,233,262,247,233,220,262,247,220,208,220,247],
      // Game 07: Trees Changed Everything — earthy, pentatonic growth
      trees:     [330,392,440,523,440,392,330,440,523,659,523,440],
      // Game 08: The Smallest Activist — urgent, driving, brave
      activist:  [262,311,330,392,330,311,262,330,392,440,392,330],
      // Game 09: Printer Made of Legos — quirky, bouncy invention
      lego:      [440,523,587,523,440,494,523,587,659,587,523,440],
      // Game 10: Water Protector — bold, determined march
      protector: [294,330,392,440,392,330,294,392,440,523,440,392],
      // Game 11: The Number Dreamer — whimsical, curious melody
      dreamer:   [370,415,440,494,523,494,440,415,370,330,370,415],
      // Game 12: Accidental Inventions — surprising, jazzy intervals
      inventions:[330,392,440,370,415,494,440,392,330,349,415,392],
      // Game 13: Si Dios Quiere — warm, nostalgic, gentle
      abuela:    [392,440,494,523,494,440,392,330,294,330,392,494],
    };

    // Tempo varies by mood
    const tempos = {
      wind:350, well:360, fish:420, school:320, machine:280,
      poison:450, trees:380, activist:300, lego:300, protector:340,
      dreamer:400, inventions:330, abuela:450,
      adventure:380, ocean:420, peaceful:450, urgent:280, puzzle:350, dark:450
    };

    // Instrument type varies by mood
    const instruments = {
      wind:'triangle', well:'square', fish:'sine', school:'square', machine:'square',
      poison:'triangle', trees:'sine', activist:'sawtooth', lego:'square', protector:'sawtooth',
      dreamer:'sine', inventions:'triangle', abuela:'sine',
      adventure:'triangle', ocean:'sine', peaceful:'sine', urgent:'square', puzzle:'triangle', dark:'triangle'
    };

    const notes = melodies[mood] || melodies.adventure;
    const tempo = tempos[mood] || 380;
    const wave = instruments[mood] || 'triangle';
    this.musicPlaying = true;
    this._musicNotes = notes;
    this._musicIndex = 0;
    this._musicInterval = setInterval(() => {
      if (!this.musicPlaying || !this.enabled) return;
      const freq = this._musicNotes[this._musicIndex % this._musicNotes.length];
      this._musicIndex++;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = wave;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain).connect(this.musicGain);
      osc.start(); osc.stop(this.ctx.currentTime + 0.35);

      // Bass note every 4 beats
      if (this._musicIndex % 4 === 0) {
        const bass = this.ctx.createOscillator();
        const bg = this.ctx.createGain();
        bass.type = 'sine';
        bass.frequency.value = freq / 2;
        bg.gain.setValueAtTime(0.06, this.ctx.currentTime);
        bg.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
        bass.connect(bg).connect(this.musicGain);
        bass.start(); bass.stop(this.ctx.currentTime + 0.4);
      }
    }, tempo);
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this._musicInterval) {
      clearInterval(this._musicInterval);
      this._musicInterval = null;
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) this.stopMusic();
    return this.enabled;
  }
}

// Global singleton
window.retroAudio = new RetroAudio();
