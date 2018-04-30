/* global _ $ Vue audiodir */

Vue.component('annotationsaudioplayer', {
	delimiters: ['${', '}'],
	template: '#annotationsaudioplayer-template',
	props: ['audiofile'],
	data: function () {
		return {
			audio: undefined,
			loaded: false,
			duration: 0,
			aPos: 0,
			aPosRel: 0,
			paused: true,
			playing: false
		};
	},
	computed: {
		audiofileC: function () {
			var taf = this.audiofile;
			taf = taf.replace(/\\/g, '/');
			if (taf.charAt(0) === '/') {
				taf = taf.substr(1);
			}
			return taf;
		},
		audiodirC: function () {
			var tad = audiodir;
			tad = tad.replace(/\\/g, '/');
			if (!tad.slice(-1) === '/') {
				tad = tad + '/';
			}
			return tad;
		}
	},
	methods: {
		play: function () {
			if (this.playing && !this.paused) return;
			this.paused = false;
			this.audio.play();
			this.playing = true;
		},
		pause: function () {
			this.paused = !this.paused;
			(this.paused) ? this.audio.pause() : this.audio.play();
		},
		audioPlayPause: function (e) {
			if (e.type === 'pause' && this.playing === false) {
				this.paused = true;
			}
		},
		audioPlayingUI: function (e) {
			this.aPos = parseInt(this.audio.currentTime);
			this.aPosRel = (this.aPos / this.duration);
		},
		audioLoaded: function () {
			if (this.audio.readyState >= 2) {
				this.loaded = true;
				this.duration = parseInt(this.audio.duration);
			} else {
				throw new Error('Failed to load sound file');
			}
		},
		/* Zeit umrechnen */
		durationToSeconds: function (hms) {
			var s = 0.0;
			if (hms && hms.indexOf(':') > -1) {
				var a = hms.split(':');
				if (a.length > 2) { s += parseFloat(a[a.length - 3]) * 60 * 60; }
				if (a.length > 1) { s += parseFloat(a[a.length - 2]) * 60; }
				if (a.length > 0) { s += parseFloat(a[a.length - 1]); }
			} else {
				s = parseFloat(hms);
				if (isNaN(s)) { s = 0.0; }
			}
			return s;
		},
		secondsToDuration: function (sec, fix = 6) {
			var v = '';
			if (sec < 0) { sec = -sec; v = '-'; }
			var h = parseInt(sec / 3600);
			sec %= 3600;
			var m = parseInt(sec / 60);
			var s = sec % 60;
			return v + ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2) + ':' + ('0' + s.toFixed(fix)).slice(-(3 + fix));
		}
	},
	mounted: function () {
		this.audio = this.$el.querySelectorAll('audio')[0];
		this.audio.addEventListener('timeupdate', this.audioPlayingUI);
		this.audio.addEventListener('loadeddata', this.audioLoaded);
		this.audio.addEventListener('pause', this.audioPlayPause);
		this.audio.addEventListener('play', this.audioPlayPause);
	},
	beforeDestroy: function () {
		this.audio.removeEventListener('timeupdate', this.audioPlayingUI);
		this.audio.removeEventListener('loadeddata', this.audioLoaded);
		this.audio.removeEventListener('pause', this.audioPlayPause);
		this.audio.removeEventListener('play', this.audioPlayPause);
	}
});
