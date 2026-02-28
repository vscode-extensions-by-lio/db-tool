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

  return result;
}


export async function getTableColType(client: Client, schemaname: string = "public", tableName: string) {
  const result = await client.query(`
    SELECT
        a.attname AS column_name,
        pg_catalog.format_type(a.atttypid, a.atttypmod) AS full_data_type,
        case when (a.attnotnull) then 'required' else 'nullable' end as notnull
    FROM pg_catalog.pg_attribute a
    JOIN pg_catalog.pg_class c ON a.attrelid = c.oid
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    WHERE c.relname = '${tableName}'
      AND n.nspname = '${schemaname}'
      AND a.attnum > 0
      AND NOT a.attisdropped
    ORDER BY a.attnum
  `);

  return result;
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
        UPDATE ${schemaname}.${tableName}
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

// 删除函数
export async function deleteTableData(client: any, schemaname: string = "public", tableName: string, list: { ctid: string }[]) {
  if (!list.length) return;

  await client.query('BEGIN');

  try {
    for (const item of list) {
      const sql = `DELETE FROM ${schemaname}.${tableName} WHERE ctid = $1`;
      await client.query(sql, [item.ctid]);
    }
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

// 新增函数
export async function addTableData(client: any, schemaname: string = "public", tableName: string, list: any[]) {
  if (!list.length) return;

  await client.query('BEGIN');

  try {
    for (const item of list) {
      const columns = Object.keys(item);
      const values = Object.values(item);

      const colNames = columns.join(', ');
      const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(', ');

      const sql = `INSERT INTO ${schemaname}.${tableName} (${colNames}) VALUES (${placeholders})`;

      await client.query(sql, values);
    }

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

export async function commit(client: Client) {
  try {
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}