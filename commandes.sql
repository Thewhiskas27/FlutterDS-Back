CREATE DATABASE reservations_db;
USE reservations_db;

CREATE TABLE reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  numberOfPeople INT NOT NULL,
  date DATE NOT NULL,
  time VARCHAR(10) NOT NULL
);

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL
);