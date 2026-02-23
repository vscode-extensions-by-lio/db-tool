// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ConnectionTreeProvider } from "./views/connectionTreeProvider";
import { openCreateConnectionPanel } from './createConnectionView/createConnectionView';
import { openTableViewPanel } from './tableView/tableView';
import { closeConn, createConn } from './common/dbUtil/postgresUtil';
import { Connection } from './dataType';

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

	// 注册命令:编辑连接
	context.subscriptions.push(
		vscode.commands.registerCommand("dbTool.editConnection", async () => {
			openCreateConnectionPanel(context, provider);
		})
	);

	// 注册命令:删除连接
	context.subscriptions.push(
		vscode.commands.registerCommand("dbTool.deleteConnection", async (treeItem: any) => {
			const connection = treeItem?.connectionData as Connection;
			if (!connection || !connection.id) {
				return;
			}
			await context.globalState.update("connections", null);

			if (provider.connections && provider.connections.id === connection.id) {
				if (provider.client) {
					await closeConn(provider.client);
				}
				provider.connections = {} as Connection;
				provider.client = null;
			}
			provider.refresh();
		})
	);

	// 注册命令:断开连接
	context.subscriptions.push(
		vscode.commands.registerCommand("dbTool.closeConnection", async () => {
			provider.isAtive = false;
			if (provider.client) {
				await closeConn(provider.client);
			}
			provider.connections = {} as Connection;
			provider.client = null;
			provider.refresh();
		})
	);

	// 注册命令:刷新连接
	context.subscriptions.push(
		vscode.commands.registerCommand("dbTool.refreshConnection", async () => {
			if (provider.client) {
				await closeConn(provider.client);
			}
			const password = await context.secrets.get(
				`connections-password-${provider.connections.id}`
			) || "";
			provider.client = await createConn(provider.connections, password, context);
			provider.refresh();
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
