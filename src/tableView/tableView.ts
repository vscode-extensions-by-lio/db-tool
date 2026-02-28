import * as vscode from "vscode";
import { addTableData, commit, deleteTableData, getTableColType, getTableData, updateTableData } from "../common/dbUtil/postgresUtil";
import { Client } from "pg";

export async function openTableViewPanel(context: vscode.ExtensionContext, client: Client, schema: string, table: string) {
    const panel = vscode.window.createWebviewPanel(
        "tableView",
        table,
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

    panel.webview.onDidReceiveMessage(async (message) => {
        if (message.command === "webviewReady") {
            const result = await getTableData(client, schema, table);
            const colType = await getTableColType(client, schema, table);
            panel.webview.postMessage({
                command: "render",
                data: {
                    tableName: table,
                    headers: result.fields.map(f => f.name),
                    // headers: colType.rows.map(item => `${item.column_name}(${item.full_data_type})\n${item.notnull}`),
                    rows: result.rows
                }
            });
        }

        if (message.command === "saveData") {
        try {
            await updateTableData(client, schema, table, message.data.modified);
            await addTableData(client, schema, table, message.data.added);
            await deleteTableData(client, schema, table, message.data.deleted);
            
            await commit(client);

            const result = await getTableData(client, schema, table);
            const colType = await getTableColType(client, schema, table);
            panel.webview.postMessage({
                command: "render",
                data: {
                    tableName: table,
                    headers: result.fields.map(f => f.name),
                    // headers: colType.rows.map(item => `${item.column_name}(${item.full_data_type})\n${item.notnull}`),
                    rows: result.rows
                }
            });
            vscode.window.showInformationMessage("Update succeeded.");
        } catch (error) {
            await client.query('ROLLBACK');
            vscode.window.showErrorMessage("Update failed.");
            throw error;
        }
        }
    });

}