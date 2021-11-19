const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const db = new sqlite3.Database(path.resolve(__dirname, 'sqlite.db'));

const getRowCount = new Promise((resolve, reject) => {
	db.serialize(() => {
		db.run("CREATE TABLE IF NOT EXISTS clientsocket (url TEXT)");

		db.get("SELECT count(*) as jumlah FROM clientsocket", (err, row) => {
			console.log(row);
			resolve(row.jumlah);
		});
	});
});

const getRow = new Promise((resolve, reject) => {
	db.serialize(() => {
		db.get("SELECT url FROM clientsocket", (err, row) => {
			resolve(row);
		});
	});
});

async function resetTable() {
	const promise = new Promise((resolve, reject) => {
		db.serialize(() => {
			db.run("DELETE FROM clientsocket");
			resolve();
		});
	});

	let status = await promise;
	return status;
}

async function addRow(data) {
	const promise = new Promise((resolve, reject) => {
		db.serialize(() => {
			db.run("DELETE FROM clientsocket");
			let stmt = db.prepare("INSERT INTO clientsocket VALUES (?)");
			stmt.run(data);
			stmt.finalize();
			resolve("OK");
		});
	});

	let status = await promise;

	return status;
}

module.exports = {
	getRowCount,
	getRow,
	addRow,
	resetTable,
};
