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
  public isAtive: boolean = true;


  // 返回子节点
  async getChildren(element?: ConnectionItem): Promise<ConnectionItem[]> {
    if (!element) {
        if (!this.client) {
          // 等待异步连接完成
          if (this.isAtive) {
            this.connections = this.context.globalState.get<Connection>("connections", {} as Connection);
          }
          if (!this.connections || Object.keys(this.connections).length === 0){
            return Promise.resolve([]);
          }
          const password = await this.context.secrets.get(
            `connections-password-${this.connections.id}`
          ) || "";
          const isConnValid = await checkConn(this.connections, password);
          if (!isConnValid) {
            return Promise.resolve([]);
          }
          this.client = await createConn(this.connections, password, this.context);

        }
        try {
          return Promise.resolve([
            new ConnectionItemDB(
              this.connections.name || "Unnamed Connection",
              "connection",
              vscode.TreeItemCollapsibleState.Collapsed,
              element,
              undefined,
              this.connections
            ),
          ]);
        } catch (err) {
          // 连接失败时处理
          vscode.window.showErrorMessage(`数据库连接失败`);
          return Promise.resolve([]);
        }
    }

    if (element.type === "connection" && this.client) {
      const dbs = [this.connections.database];
      // const dbs = await getSchema(this.client);
      return Promise.resolve(
        dbs.map(db => new ConnectionItemSchema(
          db,
          "dbLabel",
          vscode.TreeItemCollapsibleState.Collapsed,
          element
        ))
      );
    }


    if (element.type === "dbLabel" && this.client) {
      return Promise.resolve([
        new ConnectionItemSchemaList(
          "Schemas",
          "schemasLabel",
          vscode.TreeItemCollapsibleState.Collapsed,
          element
        ),
      ]);
    }

    if (element.type === "schemasLabel" && this.client) {
      const schemas = await getSchema(this.client);
      return Promise.resolve(
        schemas.map(schema => new ConnectionItemSchema(
          schema,
          "schemaLabel",
          vscode.TreeItemCollapsibleState.Collapsed,
          element
        ))
      );
    };

    if (element.type === "schemaLabel" && this.client) {
      return Promise.resolve([
        new ConnectionItemTableList(
          "Tables",
          "tablesLabel",
          vscode.TreeItemCollapsibleState.Collapsed,
          element
        ),
      ]);
    }

    if (element.type === "tablesLabel" && this.client) {
      const tables = await getPgTables(this.client);
      return Promise.resolve(
        tables.map(table => new ConnectionItemTable(
          table,
          "table",
          vscode.TreeItemCollapsibleState.None,
          element,
          {
            command: "dbTool.openTable",
            title: "Open Table",
            arguments: [this.client, element.parent?.label, table]
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
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly parent?: ConnectionItem
  ) {
    super(label, collapsibleState);

    this.tooltip = this.label;
    this.description = "";
    this.contextValue = "ConnectionItem";
    this.iconPath = new vscode.ThemeIcon("database");
  }
}

class ConnectionItemConn extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly type: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly parent?: ConnectionItem,
  ) {
    super(label, collapsibleState);

    this.tooltip = this.label;
    this.description = "";
    this.contextValue = "ConnectionItemConn";
    this.iconPath = new vscode.ThemeIcon("database");
  }
}


class ConnectionItemDB extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly type: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly parent?: ConnectionItem,
    public readonly command?: vscode.Command,
    public readonly connectionData?: Connection
  ) {
    super(label, collapsibleState);

    this.tooltip = this.label;
    this.description = "";
    this.contextValue = "ConnectionItemDB";
    this.iconPath = new vscode.ThemeIcon("database");

  }
}

class ConnectionItemSchemaList extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly type: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly parent?: ConnectionItem,
  ) {
    super(label, collapsibleState);

    this.tooltip = this.label;
    this.description = "";
    this.contextValue = "ConnectionItemSchemaList";
    this.iconPath = new vscode.ThemeIcon("list-tree");
  }
}

class ConnectionItemSchema extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly type: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly parent?: ConnectionItem,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);

    this.tooltip = this.label;
    this.description = "";
    this.contextValue = "ConnectionItemSchema";
    this.iconPath = new vscode.ThemeIcon("symbol-namespace");
  }
}

class ConnectionItemTableList extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly type: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly parent?: ConnectionItem,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);

    this.tooltip = this.label;
    this.description = "";
    this.contextValue = "ConnectionItemTableList";
    this.iconPath = new vscode.ThemeIcon("list-tree");
  }
}

class ConnectionItemTable extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly type: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly parent?: ConnectionItem,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);

    this.tooltip = this.label;
    this.description = "";
    this.contextValue = "ConnectionItemTable";
    this.iconPath = new vscode.ThemeIcon("table");
  }
}