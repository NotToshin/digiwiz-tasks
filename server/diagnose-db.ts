import mysql from 'mysql2/promise';

const options = {
 host: process.env.DB_HOST || '127.0.0.1',
 port: Number(process.env.DB_PORT || 3306),
 user: process.env.DB_USER || 'root',
 password: process.env.DB_PASSWORD || '',
 connectTimeout: 5000,
};

console.log('Testing MySQL at', options.host, options.port);
try {
 const connection = await mysql.createConnection(options);
 try {
  const [rows] = await connection.query('SELECT VERSION() AS version');
  console.log('Handshake and login succeeded.', rows);
  const database = process.env.DB_NAME || 'digiwiz_tasks';
  await connection.changeUser({ database });
  console.log('Database selected successfully. Run npm.cmd run db:migrate next.');
 } finally { await connection.end(); }
} catch (error) {
 const failure = error as { code?: string; errno?: number };
 console.error('Database check failed.', failure.code || 'Unknown error', failure.errno || '');
 console.error('EACCES/10013 means the process cannot open the socket. ECONNREFUSED means no server accepted the connection. PROTOCOL_CONNECTION_LOST means the server closed the handshake. ER_BAD_DB_ERROR means the named database is missing.');
 process.exitCode = 1;
}
