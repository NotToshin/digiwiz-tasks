import mysql from 'mysql2/promise';
export const pool = mysql.createPool({
 socketPath: process.env.DB_SOCKET || undefined,
 host: process.env.DB_HOST || '127.0.0.1',
 port: Number(process.env.DB_PORT || 3306),
 user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '',
 database: process.env.DB_NAME || 'digiwiz_tasks',
 connectionLimit: 5, charset: 'utf8mb4', dateStrings: true, timezone: 'Z',
});
