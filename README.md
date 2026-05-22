Project Overview

This project is a Full Stack Authentication System developed using Flask, MySQL, HTML, CSS, and JavaScript.

The application allows users to:

- Register a new account
- Login securely
- Access protected pages
- View profile information
- Logout securely
- Store passwords using hashing

Technologies Used :-

Backend
- Python
- Flask
- Flask-Bcrypt
- Flask-Session
- Flask-CORS
- MySQL
- MySQL Connector Python

Frontend
- HTML5
- CSS3
- JavaScript (Fetch API)

Features
 User Registration
- Username, Email, Password, Confirm Password
- Client-side validation
- Password confirmation check
- Password hashing using Bcrypt
- Duplicate email validation

User Login
- Username and Password authentication
- Password verification using hashed passwords
- Session creation after successful login

Protected Dashboard
- Accessible only after login
- Displays:
  - Username
  - User Role
  - Account Creation Date

User Profile
- Shows:
  - Username
  - Email
  - Role
  - Joined Date

User Logout
- Clears session securely
- Redirects user to login page

Project Structure

authentication-system/ - app.py. - static/ --> login.html --> register.html -->dashboard.html -->style.css -->script.js

Required Packages

Install the required packages:

pip install flask
pip install flask-bcrypt
pip install flask-session
pip install flask-cors
pip install mysql-connector-python

Authentication Flow

1. User Registration
2. Password Hashing
3. Store User in Database
4. User Login
5. Session Creation
6. Access Dashboard
7. Access Profile
8. Logout
9. Session Destroyed

Write-Up Questions

1. What is Password Hashing and Why is Storing Plain Text Passwords Dangerous?

Password hashing is the process of converting a password into an encrypted string using a hashing algorithm.

Storing plain text passwords is dangerous because if the database is compromised, attackers can view all user passwords directly. Hashing protects passwords by making them unreadable and difficult to reverse.


2. What is a Session and How Does Flask Use It?

A session is a way to store user information between requests.

Flask uses sessions to remember authenticated users after login. Session data is stored securely and allows users to access protected pages without logging in repeatedly.


3. What Happens When a Wrong Password is Entered?

When a user enters a password, Flask-Bcrypt compares the entered password with the stored hashed password.

If they do not match:

- Authentication fails
- No session is created
- A 401 Unauthorized response is returned
- The user receives an "Invalid username or password" message


