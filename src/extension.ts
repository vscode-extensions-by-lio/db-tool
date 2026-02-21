// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ConnectionTreeProvider } from "./views/connectionTreeProvider";
import { openCreateConnectionPanel } from './createConnectionView/createConnectionView';
import { openTableViewPanel } from './tableView/tableView';
import { closeConn } from './util/dbUtil/postgresUtil';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {


	// 注册左侧栏树视图
	const provider = new ConnectionTreeProvider(context);
	vscode.window.registerTreeDataProvider(
		"dbTool.connections",
		provider
	);

	// 注册命令:创建连接
	context.subscriptions.push(
		vscode.commands.registerCommand("dbTool.addConnection", () => {
			vscode.commands.executeCommand("dbTool.addConnectionView");
		})
	);

	// 注册命令:导入连接
	context.subscriptions.push(
		vscode.commands.registerCommand("dbTool.importConnection", () => {
			const connections = context.globalState.get("connections", []);
			vscode.window.showInformationMessage("Import clicked"+ JSON.stringify(connections, null, 2));
		})
	);

	// 注册命令:打开创建连接面板
	context.subscriptions.push(
		vscode.commands.registerCommand("dbTool.addConnectionView", () => {
			openCreateConnectionPanel(context, provider);
		})
	);

	// 注册命令:显示表格
	context.subscriptions.push(
		vscode.commands.registerCommand("dbTool.openTable", (client, schema, table) => {
			vscode.window.showInformationMessage("Open table: " + table + " in schema: " + schema);

			openTableViewPanel(context, client, schema, table);
		})
	);

	// 注册命令:断开连接
	context.subscriptions.push(
		vscode.commands.registerCommand("dbTool.closeConnection", async () => {
			if (provider.client) {
				await closeConn(provider.client);
			}
			provider.client = null;
			provider.refresh();
		})
	);

}

// This method is called when your extension is deactivated
export function deactivate() {}
