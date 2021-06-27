const SEGMENT_DATE = {
	'0': 0b1111110,
	'1': 0b0110000,
	'2': 0b1101101,
	'3': 0b1111001,
	'4': 0b0110011,
	'5': 0b1011011,
	'6': 0b1011111,
	'7': 0b1110010,
	'8': 0b1111111,
	'9': 0b1111011
};
const SEGMENT_AXIS = [
	true,
	false,
	false,
	true,
	false,
	false,
	true,
];
const SEGMENT_COORDS = [
	[0, 0],
	[1, 0],
	[1, 1],
	[0, 2],
	[0, 1],
	[0, 0],
	[0, 1]
];
const SETTING_STYLE = {
	top: 60,
	bottom: 220,
	interval: 40,
	width: 80,
	size: 40,
	margin: 10,
	lineWidth: 16,
	scaleDown: 2,
	start: {
		x: 600,
		y: 280,
		r: 30
	}
}
const TIMER_STYLE = {
	top: 80,
	bottom: 200,
	interval: 20,
	width: 50,
	lineWidth: 10,
	scaleDown: 2
}
const RESULT_STYLE = {
	y: 120,
	r: 60,
	color: "#000000",
	width: 16,
	button: {
		x: 320,
		y: 240,
		r: 40
	}
}
const BUTTON_STYLE = {
	top: 260,
	bottom: 320,
	left: 280,
	right: 360,
	outline: {
		width: 4,
		color: "#888888"
	},
	color: {
		active: "#444444",
		normal: "#ffffff"
	}
}
const COLORS = {
	on: '#000000',
	off: '#bbbbbb',
	button: {
		bg: "#ffffff",
		fg: "#000000"
	}
}

let itvId;
let can;
let ctx;
let state = 0;
/*
	0: 設定
	1: 対局中
	2: 勝敗
*/
let mode = 0;
/*
	0:時間切れ負け
*/
let timerL;
let timerR;
let settings = {};
let turn = 0;


class Timer {
	constructor(maxSeconds) {
		this.maxTime = maxSeconds;
		this.timer = maxSeconds;
	}
	countdown() {
		this.timer--;
		if (this.timer === 0) {
			return true;
		} else {
			return false;
		}
	}
	getShowing() {
		return this.timer >= 100 * 60 ? `${zeroPadding(Math.floor(this.timer / (60 * 60)), 2)}${zeroPadding(Math.floor(this.timer % (60 * 60) / 60), 2)}` : `${zeroPadding(Math.floor(this.timer / 60), 2)}${zeroPadding(this.timer % 60, 2)}`;
	}
	getSeparatorSymbol() {
		return this.timer >= 100 * 60 ? ":" : ".";
	}
}

class TimerWithSecond extends Timer {
	constructor(maxSeconds, movement) {
		super.constructor(maxSeconds);
		this.parMovement = movement;
		this.movementTimer = movement;
	}
	countdown() {
		if (this.timer == 0) {
			this.movementTimer--
			if (this.movementTimer == 0) {
				return true;
			} else {
				return false;
			}
		} else {
			super.countdown()
			return false
		}
	}
	getShowing() {
		return this.timer >= 100 * 60 ? `${zeroPadding(Math.floor(this.timer / (60 * 60)), 2)}${zeroPadding(Math.floor(this.timer % (60 * 60) / 60), 2)}` : `${zeroPadding(Math.floor(this.timer / 60), 2)}${zeroPadding(this.timer % 60, 2)}`;
	}
	getSeparatorSymbol() {
		return this.timer >= 100 * 60 ? ":" : ".";
	}
}

// 初期化
function startup() {
	can = document.getElementById('canvas');
	ctx = can.getContext('2d');
	can.width = 640;
	can.height = 320;
	canvas.addEventListener('click', onClick, false);
	resetMode();
	resetItv();
}

//一秒に満たない端数の切り捨て
function resetItv() {
	if (itvId != undefined) {
		clearInterval(itvId);
	}
	main(false);
	itvId = setInterval(main, 1000);
}

function resetMode() {
	switch (mode) {
	case 0:
		settings = {
			maxHours: 0,
			maxMinutes: 30
		};
		break;
	}
}
	
function resetTimer() {
	turn = 0;
	switch (mode) {
	case 0:
		let maxSeconds = settings.maxHours * 60 * 60 + settings.maxMinutes * 60;
		timerL = new Timer(maxSeconds);
		timerR = new Timer(maxSeconds);
		break;
	}
}

function mod(i, j) {
	return (i % j) < 0 ? (i % j) + 0 + (j < 0 ? -j : j) : (i % j + 0);
}

function zeroPadding(num, len){
	return (Array(len).join('0') + num).slice(-len);
}

function isInRect(x, y, x1, y1, x2, y2) {
	return x1 <= x && x <= x2 && y1 <= y && y <= y2;
}

function isInCircle(x, y, cx, cy, r) {
	return (x - cx) ** 2 + (y - cy) ** 2 <= r ** 2;
}

function isTimeOver() {
	switch (turn) {
	case -1:
		return timerL.isTimeOver();
	case 1:
		return timerR.isTimeOver();
		}
}

function drawHexagon(axis, x, y, length, width, edge, color) {
	let isX = axis === 'x' ? true : (axis === 'y' ? false : undefined);
	if (isX === undefined) {
		throw `ValueError: invalid axis: '${axis}'`;
	}
	let halfWidth = width / 2;
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.moveTo(x, y);
	if (isX) {
		ctx.lineTo(x + edge, y - halfWidth);
		ctx.lineTo(x + length - edge, y - halfWidth);
		ctx.lineTo(x + length, y);
		ctx.lineTo(x + length - edge, y + halfWidth);
		ctx.lineTo(x + edge, y + halfWidth);
	} else {
		ctx.lineTo(x - halfWidth, y + edge);
		ctx.lineTo(x - halfWidth, y + length - edge);
		ctx.lineTo(x, y + length);
		ctx.lineTo(x + halfWidth, y + length - edge);
		ctx.lineTo(x + halfWidth, y + edge);
	}
	ctx.closePath();
	ctx.fill();
}

function drawHexagon2(axis, x, y, length, width, edge, color, scaleDown) {
	if (axis === 'x'){
		drawHexagon(axis, x + scaleDown, y, length - (scaleDown * 2), width, edge, color)
	}	else if (axis === 'y') {
		drawHexagon(axis, x, y + scaleDown, length - (scaleDown * 2), width, edge, color)
	} else {
		throw `ValueError: invalid axis: '${axis}'`;
	}
}

function drawNumber(n, x1, y1, x2, y2, width, on, off, scaleDown) {
	let halfWidth = width / 2;
	if (typeof(n) == 'string' && n.length == 1 && "0" <= n && n <= "9") {
		drawNumber(Number(n), x1, y1, x2, y2, width, on, off, scaleDown);
	} else if (n == ".") {
		drawCircle((x1 + x2) / 2, y2 - halfWidth, halfWidth, on);
	} else if (n == ":") {
		drawCircle((x1 + x2) / 2, (y1 * 3 + y2) / 4, halfWidth, on);
		drawCircle((x1 + x2) / 2, (y1 + y2 * 3) / 4, halfWidth, on);
	} else if (0 <= n <= 9) {
		glyph = SEGMENT_DATE[String(n)];
		for (let i = 0; i < 7; i++) {
			color = ((glyph & (0b1000000 >>> i)) != 0) ? on : off;
			let axis = SEGMENT_AXIS[i];
			let length = axis ? x2 - x1 - width : (y2 - y1 - width) / 2;
			let x = SEGMENT_COORDS[i][0] === 0 ? x1 + halfWidth : x2 - halfWidth;
			let y = SEGMENT_COORDS[i][1] === 0 ? y1 + halfWidth : (SEGMENT_COORDS[i][1] === 1 ? (y1 + y2) / 2 : y2 - halfWidth);
			drawHexagon2(axis ? 'x' : 'y', x, y, length, width, halfWidth, color, scaleDown);
		}
	} else {
		throw `ValueError: invalid number: '${n}'`;
	}
}

function drawRect(x, y, w, h, color) {
	ctx.fillStyle = color;
	ctx.fillRect(x, y, w, h);
}

function drawRect2(x1, y1, x2, y2, color) {
	drawRect(x1, y1, x2 - x1, y2 - y1, color);
}

function drawCircle(x, y, r, color) {
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.arc(x, y, r, 0, Math.PI * 2, true);
	ctx.closePath();
	ctx.fill();
}

function drawCircleOutline(x, y, r, width, color) {
	ctx.strokeStyle = color;
	ctx.lineWidth = width;
	ctx.beginPath();
	ctx.arc(x, y, r, 0, Math.PI * 2, true);
	ctx.closePath();
	ctx.stroke();
}

function drawCross(x1, y1, x2, y2, width, color) {
	ctx.strokeStyle = color;
	ctx.lineWidth = width;
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.moveTo(x2, y1);
	ctx.lineTo(x1, y2);
	ctx.closePath();
	ctx.stroke();
}

function drawBackground() {
	centerH = can.width / 2;
	width = 10;
	halfWidth = width / 2;
	drawRect2(centerH - halfWidth, 0, centerH + halfWidth, can.height, 'gray');
}

function drawUpDownButton(facing, x1, y1, x2, y2, bg, fg) {
	let isUp = facing === 'up' ? true : (facing === 'down' ? false : undefined);
	if (isUp === undefined) {
		throw `ValueError: invalid axis: '${facing}'`;
	}
	drawRect2(x1, y1, x2, y2, bg);
	ctx.fillStyle = fg;
	ctx.beginPath();
	if (isUp) {
		ctx.moveTo((x1 + x2) / 2, (y1 * 3 + y2) / 4);
		ctx.lineTo((x1 * 3 + x2) / 4, (y1 + y2 * 3) / 4);
		ctx.lineTo((x1 + x2 * 3) / 4, (y1 + y2 * 3) / 4);
	} else {
		ctx.moveTo((x1 + x2) / 2, (y1 + y2 * 3) / 4);
		ctx.lineTo((x1 * 3 + x2) / 4, (y1 * 3 + y2) / 4);
		ctx.lineTo((x1 + x2 * 3) / 4, (y1 * 3 + y2) / 4);
	}
	ctx.closePath();
	ctx.fill();
}

function drawNumberButton(n, x1, y1, x2, y2, width, on, off, scaleDown, bg, fg, size, margin) {
	drawNumber(n, x1, y1, x2, y2, width, on, off, scaleDown);
	drawUpDownButton("up", x1, y1 - (size + margin), x2, y1 - margin, bg, fg);
	drawUpDownButton("down", x1, y2 + margin, x2, y2 + (size + margin), bg, fg);
}

function drawCheckButton(x, y, r, bg, fg) {
	drawCircle(x, y, r, bg);
	ctx.fillStyle = fg;
	ctx.beginPath();
	ctx.moveTo(x - r * 0.75, y);
	ctx.lineTo(x - r * 0.25, y + r * 0.75);
	ctx.lineTo(x + r * 0.625, y - r * 0.375);
	ctx.lineTo(x - r * 0.25, y + r * 0.375);
	ctx.closePath();
	ctx.fill()
}

function drawResetButton(x, y, r, bg, fg) {
	drawCircle(x, y, r, bg);
	ctx.strokeStyle = fg;
	ctx.lineWidth = r / 8;
	ctx.beginPath();
	ctx.arc(x, y, r * 0.5, Math.PI * 1.75, Math.PI * 3.25, false);
	ctx.arc(x, y, r * 0.5, Math.PI * 3.25, Math.PI * 1.75, true);
	ctx.closePath();
	ctx.stroke();
	ctx.fillStyle = fg;
	let coords = [x + Math.sin(Math.PI * 1.75) * r * 0.75, y - Math.cos(Math.PI * 1.75) * r * 0.75, x + Math.sin(Math.PI * 1.75) * r * 0.25, y - Math.cos(Math.PI * 1.75) * r * 0.25];
	ctx.beginPath();
	ctx.moveTo(coords[0], coords[1]);
	ctx.lineTo(coords[2], coords[3]);
	ctx.lineTo(coords[2], coords[1]);
	ctx.closePath();
	ctx.fill();
}

function drawTime(showing, symbol, center, top, bottom, width, lineWidth, interval) {
	let left = center - ((width + interval) * showing.length - interval) / 2;
	for (let i = 0; i < showing.length; i++) {
		drawNumber(showing[i], left + (width + interval) * i, top, left + (width + interval) * i + width, bottom, lineWidth, COLORS.on, COLORS.off, TIMER_STYLE.scaleDown);
	}
	drawNumber(symbol, center, top, center, bottom, lineWidth, COLORS.on, COLORS.off, TIMER_STYLE.scaleDown);
}

function drawPlayingButton() {
	let coords = [0, BUTTON_STYLE.left, BUTTON_STYLE.right, can.width];
	for (let i = -1; i < 2; i++) {
		drawRect2(coords[i + 1], BUTTON_STYLE.top, coords[i + 2], BUTTON_STYLE.bottom, turn == i ? BUTTON_STYLE.color.active : BUTTON_STYLE.color.normal);
	}
	drawRect2(0, BUTTON_STYLE.top - BUTTON_STYLE.outline.width, can.width, BUTTON_STYLE.top, BUTTON_STYLE.outline.color);
	drawRect2(BUTTON_STYLE.left - BUTTON_STYLE.outline.width, BUTTON_STYLE.top, BUTTON_STYLE.left, BUTTON_STYLE.bottom, BUTTON_STYLE.outline.color);
	drawRect2(BUTTON_STYLE.right - BUTTON_STYLE.outline.width, BUTTON_STYLE.top, BUTTON_STYLE.right, BUTTON_STYLE.bottom, BUTTON_STYLE.outline.color);
}

function drawSetting() {
	drawCheckButton(SETTING_STYLE.start.x, SETTING_STYLE.start.y, SETTING_STYLE.start.r, COLORS.button.bg, COLORS.button.fg);
	switch (mode) {
	case 0:
		let numbers = [
			Math.floor(settings.maxHours / 10),
			settings.maxHours % 10,
			Math.floor(settings.maxMinutes / 10),
			settings.maxMinutes % 10
		];
		for (let i = 0; i < 4; i++) {
			drawNumberButton(numbers[i], (SETTING_STYLE.interval + SETTING_STYLE.width) * i - (SETTING_STYLE.interval * 1.5 + SETTING_STYLE.width * 2) + can.width / 2, SETTING_STYLE.top, (SETTING_STYLE.interval + SETTING_STYLE.width) * i - (SETTING_STYLE.interval * 1.5 + SETTING_STYLE.width) + can.width / 2, SETTING_STYLE.bottom, SETTING_STYLE.lineWidth, COLORS.on, COLORS.off, SETTING_STYLE.scaleDown, COLORS.button.bg, COLORS.button.fg, SETTING_STYLE.size, SETTING_STYLE.margin);
		}
		break;
	}
}

function drawPlaying() {
	let showing = [timerL.getShowing(), timerR.getShowing()];
	let symbol = [timerL.getSeparatorSymbol(), timerR.getSeparatorSymbol()];
	for (let i = 0; i < 2; i++) {
		drawTime(showing[i], symbol[i], can.width * (i * 2 + 1) / 4, TIMER_STYLE.top, TIMER_STYLE.bottom, TIMER_STYLE.width, TIMER_STYLE.lineWidth, TIMER_STYLE.interval);
	}
	drawPlayingButton();
}

function drawResult() {
	let showing = turn == 1 ? [false, true] : [true, false];
	for (let i = 0; i < 2; i++) {
		if (showing[i]) {
			drawCircleOutline(can.width * (i * 2 + 1) / 4, RESULT_STYLE.y, RESULT_STYLE.r, RESULT_STYLE.width, RESULT_STYLE.color);
		} else {
			drawCross(can.width * (i * 2 + 1) / 4 - RESULT_STYLE.r, RESULT_STYLE.y - RESULT_STYLE.r, can.width * (i * 2 + 1) / 4 + RESULT_STYLE.r, RESULT_STYLE.y + RESULT_STYLE.r, RESULT_STYLE.width, RESULT_STYLE.color);
		}
	}
	drawResetButton(RESULT_STYLE.button.x, RESULT_STYLE.button.y, RESULT_STYLE.button.r, COLORS.button.bg, COLORS.button.fg);
}

function drawMain() {
	ctx.clearRect(0, 0, can.width, can.height);
	switch (state) {
	case 0:
		drawSetting();
		break;
	case 1:
		drawPlaying();
		break;
	case 2:
		drawResult();
		break;
	}
}

function drawTest() {
}

function settingClick(x, y) {
	switch (mode) {
	case 0:
		for (let j = 0; j < 8; j++) {
			i = Math.floor(j / 2);
			if (isInRect(x, y, (SETTING_STYLE.interval + SETTING_STYLE.width) * i - (SETTING_STYLE.interval * 1.5 + SETTING_STYLE.width * 2) + can.width / 2, j % 2 == 0 ? SETTING_STYLE.top - (SETTING_STYLE.margin + SETTING_STYLE.size) : SETTING_STYLE.bottom + SETTING_STYLE.margin, (SETTING_STYLE.interval + SETTING_STYLE.width) * i - (SETTING_STYLE.interval * 1.5 + SETTING_STYLE.width) + can.width / 2, j % 2 == 0 ? SETTING_STYLE.top - SETTING_STYLE.margin : SETTING_STYLE.bottom + (SETTING_STYLE.margin + SETTING_STYLE.size))) {
				let value = ((j % 2) * -2 + 1) * ((i % 2 == 0) ? 10 : 1);
				let before = i < 2 ? settings.maxHours : settings.maxMinutes;
				let after = mod(before + value, i < 2 ? 100 : 60);
				if (i < 2) {
					settings.maxHours = after;
				} else {
					settings.maxMinutes = after;
				}
			}
		}
		if (isInCircle(x, y, SETTING_STYLE.start.x, SETTING_STYLE.start.y, SETTING_STYLE.start.r)) {
			resetTimer();
			state = 1;
		}
		break;
	}
	drawSetting();
}

function playingClick(x, y) {
	let coords = [0, BUTTON_STYLE.left, BUTTON_STYLE.right, can.width];
	for (let i = -1; i < 2; i++) {
		if (isInRect(x, y, coords[i + 1], BUTTON_STYLE.top, coords[i + 2], BUTTON_STYLE.bottom)) {
			turn = i;
			resetItv();
			drawPlaying();
			break;
		}
	}
}

function resultClick(x, y) {
	if (isInCircle(x, y, RESULT_STYLE.button.x, RESULT_STYLE.button.y, RESULT_STYLE.button.r)) {
		resetTimer();
		state = 0;
		resetItv();
	}
}

function onClick(event) {
	let rect = event.target.getBoundingClientRect();
	let x = Math.floor(event.clientX * can.width / (rect.right - rect.left));
	let y = Math.floor(event.clientY * can.height / (rect.bottom - rect.top));
	switch (state) {
	case 0:
		settingClick(x, y);
		break;
	case 1:
		playingClick(x, y);
		break;
	case 2:
		resultClick(x, y);
		break;
	}
}

function countdownTimer() {
	switch (turn) {
	case 1:
		return timerL.countdown();
	case -1:
		return timerR.countdown();
	default:
		return false
	}
}

// メインループ風
function main(doCount=true) {
	if (state == 1 && doCount) {
		if (countdownTimer()) {
			state = 2;
		}
	}
	drawMain();
}

