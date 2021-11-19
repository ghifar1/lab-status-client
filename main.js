"use strict";

const {
	app,
	nativeImage,
	Tray,
	Menu,
	BrowserWindow,
	Notification,
} = require("electron");
const { io } = require("socket.io-client");
const os = require("os");
const AutoLaunch = require("auto-launch");
const { activity, ev } = require("./activity");
const { getRowCount, getRow, resetTable, addRow } = require("./database");
const http = require("http");
const qs = require("querystring");
const path = require("path");

let serv = http
	.createServer((req, res) => {
		let url = req.url;

		switch (url) {
			case "/save":
				if (req.method == "POST") {
					let body = "";
					req.on("data", (data) => {
						body += data;
						if (body.length > 1e6) request.connection.destroy();
					});

					let post = "";

					req.on("end", () => {
						post = qs.parse(body);
						console.log(post.urltarget);
						addRow(post.urltarget);
						res.writeHead(200, {
							"Content-Type": "application/json",
						});
						res.end(JSON.stringify("OK"));
						socketInitializer(post.urltarget);
						top.setting.close();
					});
				}
				break;

			default:
				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(JSON.stringify("not found"));
				break;
		}
	})
	.listen(5000);

let top = {
	socket: null,
	icons: null,
}; // prevent gc to keep windows
let state = "";

ev.on("stateChange", (stat) => {
	state = stat;
});

activity();

function showNotification(title, body) {
	new Notification({ title: title, body: body }).show();
}

async function resetSocket() {
	top.socket.disconnect();
	top.socket.removeAllListeners();
	top.socket = null;
	await resetTable();
	console.log("reset database");
}

async function socketInitializer(url = null) {
	top.tray.setImage(
		nativeImage.createFromPath(path.resolve(__dirname, "img/connect.png"))
	);
	if (url == null) {
		let row = await getRow;
		url = row.url;
	}

	top.socket = io(url);
	top.socket.on("connect", () => {
		top.tray.setImage(
			nativeImage.createFromPath(path.resolve(__dirname, "img/logo.png"))
		);
		console.log(top.socket.id); // x8WIv7-mJelg7on_ALbx
		console.log("success");
		top.socket.emit("active-pc", {
			hostname: os.hostname(),
			uptime: os.uptime(),
			state: state,
		});
	});

	let iterator_error = 0;

	top.socket.on("connect_error", (err) => {
		top.tray.setImage(
			nativeImage.createFromPath(path.resolve(__dirname, "img/error.png"))
		);
		console.log(err);
		iterator_error++;
		if (iterator_error > 3) {
			return resetSocket();
		}
	});
}

function trayMaker() {
	// TRAY INSTANCE
	const tray = new Tray(
		nativeImage.createFromPath(path.resolve(__dirname, "img/logo.png"))
	);
	top.tray = tray;
	top.tray.setToolTip("Lab Status");
	const menu = Menu.buildFromTemplate([
		{
			label: "Setting",
			type: "normal",
			click: () => showSetting(),
		},
		{
			label: "Reset",
			type: "normal",
			click: () => resetSocket(),
		},
		{ type: "separator" },
		{ role: "quit" }, // "role": system prepared action menu
	]);
	//top.tray.setTitle("Tray Example"); // macOS only
	top.tray.setContextMenu(menu);
}

function showSetting() {
	if (!top.setting) {
		top.setting = new BrowserWindow({
			width: 800,
			height: 600,
		});

		top.setting.loadFile("./form.html");
		top.setting.on("close", (ev) => {
			top.setting = null;
			//console.log(ev);
			ev.sender.hide();
			ev.preventDefault(); // prevent quit process
		});
	}
}

app.once("ready", async (ev) => {
	let autoLaunch = new AutoLaunch({
		name: "HIMTI",
		path: app.getPath("exe"),
	});

	autoLaunch.isEnabled().then((isEnabled) => {
		if (!isEnabled) autoLaunch.enable();
	});

	trayMaker();

	let jumlah = await getRowCount;
	console.log(jumlah);

	if (jumlah) {
		await socketInitializer();
	} else {
		top.tray.setImage(
			nativeImage.createFromPath(path.resolve(__dirname, "img/error.png"))
		);
		await socketInitializer("https://status.himti.id");
	}
	setInterval(() => {
		if (top.socket != null) {
			top.socket.emit("pc-update", {
				uptime: os.uptime(),
				state: state,
			});
		}
	}, 5000);
});

app.on("before-quit", (ev) => {
	// BrowserWindow "close" event spawn after quit operation,
	// it requires to clean up listeners for "close" event
	top.win.removeAllListeners("close");
	// release windows
	top = null;
	db.close();
});

