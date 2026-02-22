import * as vscode from "vscode";
import { ConnectionTreeProvider } from "../views/connectionTreeProvider";
import { getNonce } from "../util/utilFun";
import { checkConn, createConn } from "../util/dbUtil/postgresUtil";
import { Connection } from "../dataType";

export async function openCreateConnectionPanel(context: vscode.ExtensionContext, treeProvider: ConnectionTreeProvider) {
    const panel = vscode.window.createWebviewPanel(
        "createConnectionView",
        "Create Connection",
        vscode.ViewColumn.One,
        {
        enableScripts: true,
        localResourceRoots: [
            vscode.Uri.joinPath(context.extensionUri, "media")
        ]
        }
    );
    const mediaPath = vscode.Uri.joinPath(context.extensionUri, "media");

    const htmlUri = vscode.Uri.joinPath(
        mediaPath,
        "createConnectionView",
        "createConnectionView.html"
    );

    const cssUri = panel.webview.asWebviewUri(
        vscode.Uri.joinPath(
            mediaPath,
            "createConnectionView",
            "createConnectionView.css"
        )
    );

    const scriptUri = panel.webview.asWebviewUri(
        vscode.Uri.joinPath(
            mediaPath,
            "createConnectionView",
            "createConnectionView.js"
        )
    );

    // 读取 html 文件
    const htmlBytes = await vscode.workspace.fs.readFile(htmlUri);
    let html = new TextDecoder("utf-8").decode(htmlBytes);

    // 替换占位符
    const nonce = getNonce();
    html = html.replace(/{{styleUri}}/g, cssUri.toString());
    html = html.replace(/{{scriptUri}}/g, scriptUri.toString());
    html = html.replace(/{{nonce}}/g, nonce);

    html = html.replace(/{{webview.cspSource}}/g, panel.webview.cspSource);

    panel.webview.html = html;

    panel.webview.onDidReceiveMessage(async message => {
        if (message.command === "webviewReady") {
            const connections = context.globalState.get<Connection>("connections", 
                {
                    id: "",
                    name: "",
                    host: "",
                    port: 5432,
                    user: "",
                    database: ""
                }
            );
            const password = await context.secrets.get(
                `connections-password-${connections.id}`
            ) || "";
            const remberData = {
                name: connections.name,
                database: connections.database,
                host: connections.host,
                port: connections.port,
                user: connections.user,
                password: password
            };
            panel.webview.postMessage({
                command: "render",
                data: remberData
            });
        }
        if (message.command === "cancleCreateConnection") {
            panel.dispose();
        }
        if (message.command === "testConnection") {
            // const id = Date.now().toString();
            const id = "123456789".toString();
            const connections = {
                id: id,
                name: message.data.name,
                database: message.database,
                host: message.data.host,
                port: message.data.port,
                user: message.data.user,
            };
            try {
                await checkConn(connections, message.data.password);
                panel.webview.postMessage({
                    command: "testResult",
                    success: true
                });
            } catch (err: any) {
                panel.webview.postMessage({
                    command: "testResult",
                    success: false,
                    error: err.message
                });
            }
        }

        if (message.command === "saveConnection") {
            // const id = Date.now().toString();
            const id = "123456789".toString();
            const connections = {
                id: id,
                name: message.data.name,
                database: message.data.database,
                host: message.data.host,
                port: message.data.port,
                user: message.data.user,
            };

            try {
                await checkConn(connections, message.data.password);
            } catch (error: any) {
                vscode.window.showErrorMessage("Connection is invalid:" + error.message);
                return;
            }

            await context.globalState.update("connections", connections);
            await context.secrets.store(
                `connections-password-${id}`,
                message.data.password
            );
            const client = await createConn(connections, message.data.password, context);
            treeProvider.client = client;
            treeProvider.connections = connections;

            treeProvider.isAtive = true;
            treeProvider.refresh();
            panel.dispose();
        }
    });
}