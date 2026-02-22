
const vscode = acquireVsCodeApi();


document.addEventListener("DOMContentLoaded", () => {
  vscode.postMessage({ command: "webviewReady" });
});


async function save() {
    const data = {
        name: document.getElementById("name").value,
        database: document.getElementById("database").value,
        host: document.getElementById("host").value,
        port: document.getElementById("port").value,
        user: document.getElementById("user").value,
        password: document.getElementById("password").value
    };
    vscode.postMessage({
        command: "saveConnection",
        data: data
    });
}

async function cancel() {
    vscode.postMessage({
        command: "cancleCreateConnection"
    });
}

async function test() {
    const data = {
      name: document.getElementById("name").value,
      database: document.getElementById("database").value,
      host: document.getElementById("host").value,
      port: document.getElementById("port").value,
      user: document.getElementById("user").value,
      password: document.getElementById("password").value
    };

    statusEl.textContent = "Testing...";
    statusEl.className = "status loading";

    vscode.postMessage({
      command: "testConnection",
      data
    });
}


window.addEventListener("message", event => {
    const message = event.data;
    if (message.command === "render") {
        const data = message.data;

        document.getElementById("name").value = data.name || "";
        document.getElementById("database").value = data.database || "";
        document.getElementById("host").value = data.host || "";
        document.getElementById("port").value = data.port || "";
        document.getElementById("user").value = data.user || "";
        document.getElementById("password").value = data.password || "";
    }
    if (message.command === "testResult") {
        if (message.success) {
            statusEl.textContent = "Connection successful";
            statusEl.className = "status success";
        } else {
            statusEl.textContent = "Connection failed: " + message.error;
            statusEl.className = "status error";
        }
    }
});


// 给按钮绑定事件

const testBtn = document.getElementById("testBtn");
const statusEl = document.getElementById("testStatus");

const cancleBtn = document.getElementById("secondary");
const saveBtn = document.getElementById("primary");

testBtn.addEventListener('click', test);
cancleBtn.addEventListener('click', cancel);
saveBtn.addEventListener('click', save);
