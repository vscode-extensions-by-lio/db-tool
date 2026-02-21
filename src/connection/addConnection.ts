import * as vscode from "vscode";
import { ConnectionTreeProvider } from "../views/connectionTreeProvider";
import { Connection } from "../dataType";

export async function openCreateConnectionPanel(context: vscode.ExtensionContext, treeProvider: ConnectionTreeProvider) {
    const panel = vscode.window.createWebviewPanel(
        "createConnection",
        "Create Connection",
        vscode.ViewColumn.One,
        {
        enableScripts: true,
        localResourceRoots: [
            vscode.Uri.joinPath(context.extensionUri, "media")
        ]
        }
    );

    const htmlUri = vscode.Uri.joinPath(
        context.extensionUri,
        "src",
        "connection",
        "media",
        "createConnection.html"
    );

    const cssUri = panel.webview.asWebviewUri(
        vscode.Uri.joinPath(
            context.extensionUri,
            "src",
            "connection",
            "media",
            "createConnection.css"
        )
    );

    // 读取 html 文件
    const htmlBytes = await vscode.workspace.fs.readFile(htmlUri);
    let html = new TextDecoder("utf-8").decode(htmlBytes);

    // 替换占位符
    html = html.replace("{{styleUri}}", cssUri.toString());

    panel.webview.html = html;

    panel.webview.onDidReceiveMessage(async message => {
    if (message.command === "saveConnection") {

        // const id = Date.now().toString();
        const id = "123456789".toString();
        const connections = {
            id: id,
            name: message.name,
            host: message.host,
            port: message.port,
            user: message.user
        };

        await context.globalState.update("connections", connections);

        await context.secrets.store(
            `connections-password-${id}`,
            message.password
        );

        vscode.window.showInformationMessage("Connection saved");
        treeProvider.refresh();
        panel.dispose();
    }
    });
}