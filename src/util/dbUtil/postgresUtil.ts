import * as vscode from "vscode";
import { Client } from "pg";
import { Connection } from "../../dataType";


export async function checkConn(conn: Connection, password: string) {

  const client = new Client({
    host: conn.host,
    port: Number(conn.port),
    user: conn.user,
    password: password,
    database: conn.database,
    ssl: false
  });
  await client.connect();
  await client.end();
}

export async function createConn(conn: Connection, password: string, context: vscode.ExtensionContext): Promise<Client> {

  const client = new Client({
    host: conn.host,
    port: Number(conn.port),
    user: conn.user,
    password: password,
    database: conn.database,
    ssl: false
  });

  await client.connect();
  return client;
}


export async function closeConn(client: Client) {
  try {
    if (client) {
      await client.end();
    }else {
      vscode.window.showWarningMessage("No active connection to close.");
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to close connection: ${error}`);
  }
}

export async function getDataBases(client: Client) {
  const result = await client.query(`
    SELECT datname FROM pg_database;
  `);

  const dbs = result.rows.map(row => row.datname);
  return dbs;
}

export async function getSchema(client: Client) {
  const result = await client.query(`
    SELECT nspname
    FROM pg_namespace
;
  `);

  const schemas = result.rows.map(row => row.nspname);
  return schemas;
}

export async function getPgTables(client: Client, schemaname: string = "public") {
  const result = await client.query(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = '${schemaname}'
  `);

  return result.rows.map(row => row.tablename);
}


export async function getTableData(client: Client, schemaname: string = "public", tableName: string) {
  const result = await client.query(`
    SELECT * 
    FROM "${schemaname}"."${tableName}"
  `);

  return result.rows;
}