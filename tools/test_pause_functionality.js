const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log("=== Testing Pause Menu Functionality ===");

// 1. Mock Complete DOM and Browser Environment
let isMatchPaused = false;
let currentScreen = 'battle';
let matchStarted = false;
let selectReturned = false;
let mainMenuReturned = false;
let camOrbit = { yaw: 0, pitch: 0 };
let sfx = {
    enabled: true,
    playHit: () => {},
    playWhoosh: () => {},
    setMasterVolume: (v) => {}
};

const elements = {};
function createElement(tag = 'div', id = '') {
    const el = {
        tagName: tag.toUpperCase(),
        id: id,
        classList: {
            classes: new Set(),
            add(c) { this.classes.add(c); },
            remove(c) { this.classes.delete(c); },
            contains(c) { return this.classes.has(c); },
            toggle(c, force) {
                if (force !== undefined) {
                    if (force) this.classes.add(c); else this.classes.delete(c);
                } else {
                    if (this.classes.has(c)) this.classes.delete(c); else this.classes.add(c);
                }
            }
        },
        get className() {
            return Array.from(this.classList.classes).join(' ');
        },
        set className(val) {
            this.classList.classes = new Set(val.split(/\s+/).filter(Boolean));
        },
        style: {},
        attributes: {},
        setAttribute(k, v) { this.attributes[k] = v; },
        getAttribute(k) { return this.attributes[k] || null; },
        listeners: {},
        addEventListener(event, fn) {
            if (!this.listeners[event]) this.listeners[event] = [];
            this.listeners[event].push(fn);
        },
        click() {
            if (this.listeners['click']) {
                this.listeners['click'].forEach(fn => fn({ target: this }));
            }
        },
        querySelectorAll(selector) {
            const res = [];
            if (selector.includes('.stone-slab-btn')) {
                for (let k in elements) {
                    if (elements[k].classList && elements[k].classList.contains('stone-slab-btn')) {
                        res.push(elements[k]);
                    }
                }
            }
            return res;
        },
        appendChild(child) {},
        insertAdjacentHTML(pos, html) {}
    };
    if (id) elements[id] = el;
    return el;
}

global.window = {
    innerWidth: 1280,
    innerHeight: 720,
    addEventListener: () => {},
    removeEventListener: () => {}
};
global.requestAnimationFrame = (fn) => setTimeout(fn, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

global.document = {
    getElementById: (id) => elements[id] || null,
    querySelectorAll: (selector) => {
        const res = [];
        if (selector.includes('#pauseOptionsList')) {
            const listIds = [
                'btnPauseResume',
                'btnPauseMoves',
                'btnPauseSettings',
                'btnPauseAudio',
                'btnPauseResetCam',
                'btnPauseRestart',
                'btnPauseSelect',
                'btnPauseMainMenu'
            ];
            listIds.forEach(id => { if (elements[id]) res.push(elements[id]); });
        }
        return res;
    },
    createElement: (tag) => createElement(tag)
};

// Mock UIKit
global.UIKit = {
    signal: (val) => {
        let _val = val;
        return {
            get value() { return _val; },
            set value(v) { _val = v; }
        };
    },
    computed: (fn) => fn(),
    Dialog: function(opts) {
        const dialogEl = createElement('div', opts.id);
        if (opts.className) {
            opts.className.split(/\s+/).forEach(c => dialogEl.classList.add(c));
        }
        this.el = dialogEl;
        this.mount = (target, position) => {
            // parse innerHTML to instantiate simulated child buttons
            const ids = [
                'pauseCanvas',
                'pauseMonolithCard',
                'btnPauseClose',
                'pauseOptionsList',
                'btnPauseResume',
                'btnPauseMoves',
                'btnPauseSettings',
                'btnPauseAudio',
                'pauseSoundIcon',
                'pauseAudioCapsule',
                'pauseAudioBtnOn',
                'pauseAudioBtnOff',
                'btnPauseResetCam',
                'btnPauseRestart',
                'btnPauseSelect',
                'btnPauseMainMenu'
            ];
            ids.forEach(id => {
                const btn = createElement('button', id);
                if (id.startsWith('btnPause')) {
                    btn.classList.add('stone-slab-btn');
                    btn.classList.add('pause-bone-btn');
                }
            });
        };
    }
};

global.sfx = sfx;
global.camOrbit = camOrbit;
global.isMatchPaused = isMatchPaused;
global.startMatch = () => { matchStarted = true; };
global.returnToSelect = () => { selectReturned = true; };
global.goToMainMenu = () => { mainMenuReturned = true; };
global.openSettingsModal = () => { currentScreen = 'settings'; };
global.spawnFloatingPopup = () => {};

// Load and evaluate header.js
const headerCode = fs.readFileSync(path.join(__dirname, '../js/menus/header.js'), 'utf8');
vm.runInThisContext(headerCode);

console.log("1. Initializing Header Menu...");
initHeaderMenu();

console.log("2. Testing openPauseMenu()...");
openPauseMenu();
if (!global.isMatchPaused) throw new Error("Match should be paused!");
const modal = document.getElementById('pauseModal');
if (modal.classList.contains('hidden')) throw new Error("pauseModal should not have hidden class!");
console.log("   -> Pause menu opened successfully. isMatchPaused:", global.isMatchPaused);

console.log("3. Testing getPauseNavButtons()...");
const navButtons = getPauseNavButtons();
console.log("   -> Found navigation buttons count:", navButtons.length);
if (navButtons.length !== 8) throw new Error(`Expected 8 buttons, got ${navButtons.length}`);

console.log("4. Testing focus update...");
pauseFocusIdx = 2; // Paramètres
updatePauseFocus();
if (!navButtons[2].classList.contains('active')) throw new Error("Button at index 2 should be active!");
if (navButtons[0].classList.contains('active')) throw new Error("Button at index 0 should NOT be active!");
console.log("   -> Focus update verified.");

console.log("5. Testing Audio Toggle button...");
const btnAudio = document.getElementById('btnPauseAudio');
const btnAudioOn = document.getElementById('pauseAudioBtnOn');
const btnAudioOff = document.getElementById('pauseAudioBtnOff');
console.log("   -> Audio initial:", sfx.enabled);
btnAudio.click();
console.log("   -> After click 1:", sfx.enabled);
if (sfx.enabled !== false) throw new Error("sfx.enabled should be false!");
if (btnAudioOn.classList.contains('active')) throw new Error("btnOn should be inactive!");
if (!btnAudioOff.classList.contains('active')) throw new Error("btnOff should be active!");

btnAudio.click();
console.log("   -> After click 2:", sfx.enabled);
if (sfx.enabled !== true) throw new Error("sfx.enabled should be true!");
if (!btnAudioOn.classList.contains('active')) throw new Error("btnOn should be active!");
if (btnAudioOff.classList.contains('active')) throw new Error("btnOff should be inactive!");

console.log("6. Testing Resume button...");
const btnResume = document.getElementById('btnPauseResume');
btnResume.click();
if (global.isMatchPaused) throw new Error("Match should not be paused after resume!");
if (!modal.classList.contains('hidden')) throw new Error("Modal should be hidden after resume!");
console.log("   -> Resume successful.");

console.log("7. Testing Restart match button...");
openPauseMenu();
const btnRestart = document.getElementById('btnPauseRestart');
btnRestart.click();
if (!matchStarted) throw new Error("startMatch should have been called!");
if (global.isMatchPaused) throw new Error("Match should unpause on restart!");
console.log("   -> Restart successful.");

console.log("8. Testing Return to Select button...");
openPauseMenu();
const btnSelect = document.getElementById('btnPauseSelect');
btnSelect.click();
if (!selectReturned) throw new Error("returnToSelect should have been called!");
console.log("   -> Select returned successful.");

console.log("9. Testing Return to Main Menu button...");
openPauseMenu();
const btnMainMenu = document.getElementById('btnPauseMainMenu');
btnMainMenu.click();
if (!mainMenuReturned) throw new Error("goToMainMenu should have been called!");
console.log("   -> Main Menu return successful.");

console.log("\nALL PAUSE MENU FUNCTIONALITY TESTS PASSED! 🎉");
