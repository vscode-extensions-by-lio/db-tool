
const vscode = acquireVsCodeApi();

async function save() {
    vscode.postMessage({
    command: "saveConnection",
    name: document.getElementById("name").value,
    database: document.getElementById("database").value,
    host: document.getElementById("host").value,
    port: document.getElementById("port").value,
    user: document.getElementById("user").value,
    password: document.getElementById("password").value,
    remember: document.getElementById("remember").checked
    });
}

async function conn() {
    vscode.postMessage({
    command: "testConnection",
    name: document.getElementById("name").value,
    database: document.getElementById("database").value,
    host: document.getElementById("host").value,
    port: document.getElementById("port").value,
    user: document.getElementById("user").value,
    password: document.getElementById("password").value
    });
}

// 给按钮绑定事件
document.getElementById("conn").addEventListener('click', conn);
document.getElementById("save").addEventListener('click', save);
