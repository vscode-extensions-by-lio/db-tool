import * as vscode from "vscode";
import { ConnectionTreeProvider } from "../views/connectionTreeProvider";
import { getTableData } from "../util/dbUtil/postgresUtil";
import { Client } from "pg";
import { getNonce } from "../util/utilFun";

export async function openTableViewPanel(context: vscode.ExtensionContext, client: Client, schema: string, table: string) {
    const panel = vscode.window.createWebviewPanel(
        "tableView",
        "Table View",
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
        "tableView",
        "tableView.html"
    );

    const cssUri = panel.webview.asWebviewUri(
        vscode.Uri.joinPath(
            mediaPath,
            "tableView",
            "tableView.css"
        )
    );

    const scriptUri = panel.webview.asWebviewUri(
        vscode.Uri.joinPath(
            mediaPath,
            "tableView",
            "tableView.js"
        )
    );

    const agGridJsUri = panel.webview.asWebviewUri(
        vscode.Uri.joinPath(
            mediaPath,
            "tableView",
            "ag-grid-community.min.js"
        )
    );

    const agGridCssUri = panel.webview.asWebviewUri(
        vscode.Uri.joinPath(
            mediaPath,
            "tableView",
            "ag-theme-alpine.min.css"
        )
    );

    const agThemeUri = panel.webview.asWebviewUri(
        vscode.Uri.joinPath(
            mediaPath,
            "tableView",
            "ag-theme-alpine.min.css"
        )
    );

    // 读取 html 文件
    const htmlBytes = await vscode.workspace.fs.readFile(htmlUri);
    let html = new TextDecoder("utf-8").decode(htmlBytes);

    // 替换占位符
    const nonce = getNonce();
    html = html.replace(/{{styleUri}}/g, cssUri.toString());
    html = html.replace(/{{scriptUri}}/g, scriptUri.toString());
    
    html = html.replace(/{{agGridCssUri}}/g, agGridCssUri.toString());
    html = html.replace(/{{agThemeUri}}/g, agThemeUri.toString());
    html = html.replace(/{{agGridJsUri}}/g, agGridJsUri.toString());

    html = html.replace(/{{nonce}}/g, nonce);
    html = html.replace(/{{webview.cspSource}}/g, panel.webview.cspSource);

    panel.webview.html = html;

    panel.webview.onDidReceiveMessage(async (msg) => {
        if (msg.command === "webviewReady") {
            const rows = await getTableData(client, schema, table);
            panel.webview.postMessage({
                command: "render",
                tableName: table,
                headers: Object.keys(rows[0] || {}),
                rows: rows
            });
        }
    });

}