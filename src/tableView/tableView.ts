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

    const htmlUri = vscode.Uri.joinPath(
        context.extensionUri,
        "src",
        "tableView",
        "media",
        "tableView.html"
    );

    const cssUri = panel.webview.asWebviewUri(
        vscode.Uri.joinPath(
            context.extensionUri,
            "src",
            "tableView",
            "media",
            "tableView.css"
        )
    );

    // 读取 html 文件
    const htmlBytes = await vscode.workspace.fs.readFile(htmlUri);
    let html = new TextDecoder("utf-8").decode(htmlBytes);

    // 替换占位符
    const nonce = getNonce();
    html = html.replace(/{{styleUri}}/g, cssUri.toString());
    html = html.replace(/{{nonce}}/g, nonce);
    
    panel.webview.html = html;

    try {
        const rows = await getTableData(client, schema, table);
        console.log('Table data:', rows);
        panel.webview.postMessage({
            tableName: table,
            headers: Object.keys(rows[0] || {}),
            rows: rows
        });
    } catch (err: any) {
        console.error('Error getting table data:', err);
        panel.webview.postMessage({
            tableName: table,
            headers: ['error'],
            rows: [{ error: err.message }]
        });
    }
}