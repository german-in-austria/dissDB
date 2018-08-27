/* global annotationsTool performance */

const searchfilter = {
	wShowSuche: function (nVal, oVal) {
		if (nVal) {
			this.$nextTick(() => { this.focusSuchText(); });
		} else {
			this.suchText = '';
			this.focusFocusCatch();
		}
	},
	wShowFilter: function (nVal, oVal) {
		if (!nVal) {
			Object.keys(this.aInformanten).map(function (iKey, iI) {
				this.aInformanten[iKey].show = true;
			}, this);
			this.debouncedUpdateInfShow();
		}
	},
	wSuchText: function (nVal, oVal) {
		if (nVal.length > 0) {
			this.debouncedSuche();
		} else {
			this.suchTokens = [];
			this.suchTokensInfo = {};
		}
	},

	sucheCatchKeyUp: function (e) {
		if (e.keyCode === 27) { // ESC
			e.preventDefault();
			this.showSuche = false;
		} else if (e.keyCode === 13) { // Enter
			e.preventDefault();
			annotationsTool.focusFocusCatch();
		}
	},
	sucheCatchKeyDown: function (e) {
		if (e.keyCode === 114) { // F3
			e.preventDefault();
			this.naechsterSuchToken(!e.shiftKey);
			annotationsTool.focusFocusCatch();
		}
	},

	suche: function () {
		if (this.showSuche && !this.suchen) {
			this.suchen = true;
			this.suchTokens = [];
			this.suchTokensInfo = {};
			if (this.suchText.length > 1) {	// Suche durchführen
				var t0 = performance.now();
				if (this.suchModus === 'volltext') {
					if (!this.aTokenTextInf) {
						this.updateATokenTextInf();
					}
					if (this.aTokenTextInf) {
						let sTxt = this.suchText.toLowerCase().replace(String.fromCharCode(160), ' ').trim();
						let sTxtLen = sTxt.length;
						Object.keys(this.aTokenTextInf).forEach(function (aInfKey) {
							if (parseInt(this.suchInf) === 0 || aInfKey === parseInt(this.suchInf)) {
								[{'prop': 'text', 'opt': 'suchOptText'}, {'prop': 'ortho', 'opt': 'suchOptOrtho'}, {'prop': 'text_in_ortho', 'opt': 'suchOptTextInOrtho'}].forEach(function (aField) {
									if (this[aField.opt]) {
										let aTxt = this.aTokenTextInf[aInfKey][aField.prop].toLowerCase();
										let sTxtPos = aTxt.indexOf(sTxt, 0);
										let fPos = [];
										while (sTxtPos > -1) {
											fPos.push(sTxtPos);
											sTxtPos = aTxt.indexOf(sTxt, sTxtPos + sTxtLen - 1);
										}
										if (fPos.length > 0) {
											Object.keys(this.aTokenTextInf[aInfKey].tokens).forEach(function (aTokenId) {
												if (this.suchTokens.indexOf(parseInt(aTokenId)) === -1) {
													let aToken = this.aTokenTextInf[aInfKey].tokens[aTokenId][aField.prop];
													fPos.forEach(function (vPos) {
														let bPos = vPos + sTxtLen - 1;
														if ((vPos <= aToken.b && bPos >= aToken.v)) {
															this.suchTokens.push(parseInt(aTokenId));
															this.suchTokensInfo[parseInt(aTokenId)] = {'z': 0};
														}
													}, this);
												}
											}, this);
										}
									}
								}, this);
							}
						}, this);
					}
				} else if (this.suchModus === 'token') {
					this.aTokenReihung.forEach(function (key) {
						if (parseInt(this.suchInf) === 0 || this.aTokens[key].i === parseInt(this.suchInf)) {
							var aToken = this.aTokens[key];
							var addToken = false;
							if (this.suchOptText && aToken.t && aToken.t.toLowerCase().indexOf(this.suchText.toLowerCase()) >= 0) { addToken = true; } else
							if (this.suchOptOrtho && aToken.o && aToken.o.toLowerCase().indexOf(this.suchText.toLowerCase()) >= 0) { addToken = true; } else
							if (this.suchOptTextInOrtho && aToken.to && aToken.to.toLowerCase().indexOf(this.suchText.toLowerCase()) >= 0) { addToken = true; }
							if (addToken) {
								this.suchTokens.push(parseInt(key));
								this.suchTokensInfo[parseInt(key)] = {'z': 0};
							}
						}
					}, this);
				}
				console.log('suche (' + this.suchModus + '): ' + Math.ceil(performance.now() - t0) + ' ms');
			}
			if (this.suchTokens.length > 0 && this.suchTokens.indexOf(this.selToken) < 0) {
				this.naechsterSuchToken();
			}
			this.suchen = false;
		}
	},
	naechsterSuchToken: function (next = true) {
		if (this.suchTokens.length > 0) {
			var aList = this.listeNachWertLoop(this.aTokenReihung, this.selToken, next);
			aList.some(function (val, index) {
				if (this.suchTokens.indexOf(val) >= 0) {
					this.selToken = val;
					return true;
				}
			}, this);
		}
	},

	sucheZuAuswahlListe: function () {
		this.suchTokens.forEach(function (val) {
			if (this.selTokenListe.indexOf(val) < 0) {
				this.updateSelTokenListe(val);
			}
		}, this);
		this.focusFocusCatch();
	}
};
