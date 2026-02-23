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
    SELECT *, ctid 
    FROM "${schemaname}"."${tableName}"
  `);

  return result.rows;
}

export async function updateTableData(client: any, schemaname: string = "public", tableName: string, list: any[]) {
  if (!list.length) return;

  // 获取列名
  const allColumns = Object.keys(list[0]);

  // 排除更新条件列
  const updateColumns = allColumns.filter(col => col !== 'ctid');

  await client.query('BEGIN');

  try {
    for (const item of list) {

      const setClause = updateColumns
        .map((col, index) => `${col} = $${index + 1}`)
        .join(', ');

      const values = updateColumns.map(col => item[col]);

      // ctid 作为最后一个参数
      values.push(item.ctid);

      const sql = `
        UPDATE ${tableName}
        SET ${setClause}
        WHERE ctid = $${values.length}
      `;

      await client.query(sql, values);
    }

    await client.query('COMMIT');

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}