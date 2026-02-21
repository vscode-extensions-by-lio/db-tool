import * as vscode from "vscode";
import { checkConn, createConn, getPgTables, getSchema } from "../util/dbUtil/postgresUtil";
import { Connection } from "../dataType";
import { Client } from "pg";


export class ConnectionTreeProvider
  implements vscode.TreeDataProvider<ConnectionItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    ConnectionItem | undefined | null | void
  > = new vscode.EventEmitter<
    ConnectionItem | undefined | null | void
  >();


  readonly onDidChangeTreeData: vscode.Event<
    ConnectionItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  constructor(private context: vscode.ExtensionContext) {};

  refresh(): void {
    this._onDidChangeTreeData.fire();
  };

  public connections: Connection = {} as Connection;
  public client: Client | null = null;
  public selectedSchema: string = "";
  public selectedTable: string = "";


  // 返回子节点
  async getChildren(element?: ConnectionItem): Promise<ConnectionItem[]> {
    if (!element) {
        if (!this.client) {
          return Promise.resolve([]);
        }
        try {
          // 等待异步连接完成
          // this.connections = this.context.globalState.get<Connection>("connections", {} as Connection);
          // const password = await this.context.secrets.get(
          //   `connections-password-${this.connections.id}`
          // );
          // const isConnValid = await checkConn(this.connections, password || "");
          // if (!isConnValid) {
          //   return Promise.resolve([]);
          // }

          return Promise.resolve([
            new ConnectionItemDB(
              this.connections.name || "Unnamed Connection",
              "connection",
              vscode.TreeItemCollapsibleState.Collapsed,
            ),
          ]);
        } catch (err) {
          // 连接失败时处理
          vscode.window.showErrorMessage(`数据库连接失败`);
          return Promise.resolve([]);
        }
    }

    if (element.type === "connection" && this.client) {
      return Promise.resolve([
        new ConnectionItem(
          "Postgres",
          "db",
          vscode.TreeItemCollapsibleState.Collapsed
        ),
      ]);
    }


    if (element.type === "db" && this.client) {
      return Promise.resolve([
        new ConnectionItem(
          "Schemas",
          "schemasLabel",
          vscode.TreeItemCollapsibleState.Collapsed
        ),
      ]);
    }

    if (element.type === "schemasLabel" && this.client) {
      const schemas = await getSchema(this.client);
      return Promise.resolve(
        schemas.map(schema => new ConnectionItem(
          schema,
          "schema",
          vscode.TreeItemCollapsibleState.Collapsed
        ))
      );
    };

    if (element.type === "schema" && this.client) {
      const tables = await getPgTables(this.client);
      return Promise.resolve(
        tables.map(table => new ConnectionItemTable(
          table,
          "table",
          vscode.TreeItemCollapsibleState.None,
          {
            command: "dbTool.openTable",
            title: "Open Table",
            arguments: [this.client, element.label, table] // 会传给命令
          }
        ))
      );
    }

    return [];

  }

  // 定义节点样式
  getTreeItem(element: ConnectionItem): vscode.TreeItem {
    return element;
  }
}

class ConnectionItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly type: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);

    this.tooltip = this.label;
    this.description = "";
    this.contextValue = "connectionItem";
    this.iconPath = new vscode.ThemeIcon("database");
  }
}


class ConnectionItemDB extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly type: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);

    this.tooltip = this.label;
    this.description = "";
    this.contextValue = "closeConnection";
    this.iconPath = new vscode.ThemeIcon("database");
    // this.command = {
    //     command: 'dbTool.closeConnection',
    //     title: 'Close Connection',
    //     arguments: [this.client]
    // };

  }
}

class ConnectionItemTable extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly type: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);

    this.tooltip = this.label;
    this.description = "";
    this.contextValue = "connectionItem";
    this.iconPath = new vscode.ThemeIcon("database");
  }
}