import * as vscode from "vscode";
import { getTableData } from "../common/dbUtil/postgresUtil";
import { Client } from "pg";
import { getNonce } from "../common/utilFun";
import * as path from 'path';


export async function openTableViewPanel(context: vscode.ExtensionContext, client: Client, schema: string, table: string) {
    const panel = vscode.window.createWebviewPanel(
        "tableView",
        "Table View",
        vscode.ViewColumn.One,
        {
        enableScripts: true,
        localResourceRoots: [
            vscode.Uri.joinPath(context.extensionUri, "media", "tableView", "edit-html-like-excel", "dist")
        ]
        }
    );

    const distPath = vscode.Uri.joinPath(context.extensionUri, "media", "tableView", "edit-html-like-excel", "dist");

    const htmlUri = vscode.Uri.joinPath(
        distPath,
        "index.html"
    );


    // 读取 html 文件
    const htmlBytes = await vscode.workspace.fs.readFile(htmlUri);
    let html = new TextDecoder("utf-8").decode(htmlBytes);

      // 替换所有 src/href
    html = html.replace(
        /(src|href)="(.+?)"/g,
        (match, attr, src) => {
        if (src.startsWith('http')) {return match;};

        const resourcePath = vscode.Uri.joinPath(distPath, src);

        const webviewUri = panel.webview.asWebviewUri(resourcePath);

        return `${attr}="${webviewUri}"`;
        }
    );

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