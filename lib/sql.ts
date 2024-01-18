import mysql  from 'mysql2';

export const connectDb =  (database : string, type: string) =>
{
  // create a new MySQL connection
const connection = mysql.createConnection({
  host: process.env.AWS_SQL_ENDPOINT,
  port: 3306,
  user: process.env.SQL_USERNAME,
  password: process.env.SQL_PASSWORD,
  database: database
});


// connect to the MySQL database
connection.connect((error) => {
  if (error) {
    console.error('Error connecting to MySQL database:', error);
  } else {
    console.log('Connected to MySQL database! type: ' , type);
  }
});

// returb the MySQL connection
return connection;
}
