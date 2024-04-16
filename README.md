# The project is built using the following tools
Typescript
Express (Framework)
PostgresSQL database
GMAIL SMTP (for sending Mails)
Postman

# Follow the instructions to after cloning repo
create a free postgress instance on elephantSQL or include the following files in your .env folder.

port=3000
DB_CONNECTION_URL=postgres://ewisqoes:9zxBrRSahevU5hCCxPaBWQJjyJ7zHKfz@salt.db.elephantsql.com/ewisqoes
JWT_SECRET= "Team Skool LMS"
secret='skool-lms'
GMAIL_SMP_USERNAME=info.skool.lms@gmail.com
GMAIL_SMP_PASSWORD=hhqtivfbsyoewbik


# run the following commands on the project terminal
run `yarn` or `npm install`
`yarn tsc--watch` (build/compile) watch mode
`yarn dev` | `npm run dev`

# API DOCUMENTATION

# Endpoint: Create User
Description:
This endpoint allows users to create a new account.

URL: POST /users/register

Request Body:

firstName (string): The first name of the user.
lastName (string): The last name of the user.
email (string): The email address of the user.
phoneNumber (string): The phone number of the user.
password (string): The password for the user account.
countryOfResidence (string): The country of residence of the user.

Example:
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "johndoe@example.com",
  "phoneNumber": "1234567890",
  "password": "password123",
  "countryOfResidence": "USA",
}

Response:
status (number): HTTP status code indicating the success or failure of the request.
message (string): A message indicating the result of the request.
user (object): Details of the newly created user account.
    id (string): The unique identifier (UUID) of the user.
    firstName (string): The first name of the user.
    lastName (string): The last name of the user.
    email (string): The email address of the user.
    phoneNumber (string): The phone number of the user.
    countryOfResidence (string): The country of residence of the user.
    isAdmin (boolean): Indicates whether the user is an admin.
    createdAt (string): The date and time when the user account was created (ISO 8601 format).

Example (Success - HTTP status code 200):

{
  "status": 200,
  "message": "User signup successful check your email to comfirm otp",
  "user": {
    "id": "6d6e9d6d-5a89-4a1f-a6b2-2de9ee0fa335",
    "firstName": "John",
    "lastName": "Doe",
    "email": "johndoe@example.com",
    "phoneNumber": "1234567890",
    "countryOfResidence": "USA",
    "isAdmin": false,
    "createdAt": "2024-04-15T12:00:00Z"
  }
}

Example (Failure - HTTP status code 400):
{
  "status": 400,
  "error": "All fields are required"
}

# Endpoint: Verify OTP Email Authentication
Description:
This endpoint allows users to verify their email address using a one-time password (OTP).

URL: POST /users/verify-otp

Request Body:

otp (string): The one-time password (OTP) sent to the user's email address.
Example:
{
  "otp": "123456"
}
Response:

status (number): HTTP status code indicating the success or failure of the request.
message (string): A message indicating the result of the request.

Example (Success - HTTP status code 200):
{
  "status": 200,
  "message": "OTP verified successfully"
}

Example (Failure - HTTP status code 400):
{
  "status": 400,
  "invalidOtp": "Invalid OTP, try again"
}
Example (Failure - HTTP status code 400):
{
  "status": 400,
  "expiredOtp": "Expired OTP"
}
Example (Failure - HTTP status code 500):
{
  "status": 500,
  "error": "Internal Server Error"
}

# Endpoint: User Login
Description:
This endpoint allows users to log in to their account.

URL: POST /users/login

Request Body:

email (string): The email address of the user.
password (string): The password of the user.

Example:
{
  "email": "example@example.com",
  "password": "password123"
}

Response:

status (number): HTTP status code indicating the success or failure of the request.
message (string): A message indicating the result of the request.
token (string): A JWT token for accessing protected routes.
Example (Success - HTTP status code 200):

{
  "status": 200,
  "userOnboarded": "User logged in successfully",
  "token": "<JWT token>"
}

Example (Failure - HTTP status code 400):
{
  "status": 400,
  "error": "Email and password are required"
}
Example (Failure - HTTP status code 400):
{
  "status": 400,
  "error": "User not found, try again"
}
Example (Failure - HTTP status code 400):
{
  "status": 400,
  "error": "Invalid credentials, try again"
}
Example (Failure - HTTP status code 500):
{
  "status": 500,
  "error": "Internal Server Error"
}

# Endpoint: Add Transaction
Description:
This endpoint allows users to add a new transaction.

URL: POST /users/transaction

Request Body:

amount (number): The amount of the transaction.
description (string): A description of the transaction.
type (string): The type of transaction. Must be either "income" or "expense".
Example:

{
  "amount": 100.50,
  "description": "Grocery shopping",
  "type": "expense"
}

Response:

status (number): HTTP status code indicating the success or failure of the request.
message (string): A message indicating the result of the request.
transaction (object): Details of the newly created transaction.
Balance (number): The updated balance of the user after the transaction.

Request Header:
key: Authorization value: Bearer: <token>

Example (Failure - HTTP status code 400):
{
  "status": 400,
  "message": "All fields are required"
}

{
  "status": 400,
  "message": "Amount must be a number"
}

{
  "status": 400,
  "message": "Description must be a string"
}

{
  "status": 400,
  "message": "Transaction Type must be either 'income' or 'expense'"
}

{
  "status": 404,
  "message": "User not found"
}

{
  "status": 500,
  "message": "Internal server error"
}


Response (Unauthorized - Token not provided):
{
  "noTokenError": "Unauthorized - Token not provided"
}

Response (Unauthorized - Token has expired):
{
  "TokenExpiredError": "Unauthorized - Token has expired"
}

Response (Unauthorized - Token verification failed):
{
  "verificationError": "Unauthorized - Token verification failed"
}


Example (Success - HTTP status code 201):
{
  "status": 201,
  "message": "Transaction created successfully",
  "transaction": {
    "id": "<transaction_id>",
    "userId": "<user_id>",
    "type": "expense",
    "description": "Grocery shopping",
    "amount": 100.50,
    "createdAt": "<timestamp>",
    "updatedAt": "<timestamp>"
  },
  "Balance": <updated_balance>
}

# Endpoint: Get Transactions By User ID
Description:
This endpoint allows users to retrieve transactions for a specific user from the database.

URL: GET /users/transactions/:userId

Request Parameters:

userId (string): The unique identifier of the user whose transactions are to be retrieved.
Example URL: GET /users/transactions/123456789

Response:

status (number): HTTP status code indicating the success or failure of the request.
transactions (array of objects): List of transactions belonging to the specified user.
transactionId (string): The unique identifier of the transaction.
userId (string): The unique identifier of the user associated with the transaction.
type (string): The type of the transaction (e.g., "income" or "expense").
description (string): A description of the transaction.
amount (number): The amount involved in the transaction.
date (string): The date and time when the transaction occurred.


Example Response (Success - HTTP status code 200):
{
  "transactions": [
    {
      "transactionId": "123456789",
      "userId": "987654321",
      "type": "income",
      "description": "Salary",
      "amount": 2000.50,
      "date": "2024-04-15T10:30:00Z"
    },
    {
      "transactionId": "987654321",
      "userId": "987654321",
      "type": "expense",
      "description": "Grocery shopping",
      "amount": 50.75,
      "date": "2024-04-14T15:45:00Z"
    }
  ]
}

Example Response (No Transactions Found - HTTP status code 404):
{
  "message": "No transactions found for the user"
}

Example Response (Internal Server Error - HTTP status code 500):
{
  "message": "Internal server error"
}

# Endpoint: Get User Account Balance
Description:
This endpoint allows users to retrieve their account balance.

URL: GET /users/balance/:userId

Parameters:

userId (string): The unique identifier of the user whose balance is being retrieved.

Response:

status (number): HTTP status code indicating the success or failure of the request.
message (string): A message indicating the result of the request.
balance (number): The current balance of the user's account.

Example Response (Success - HTTP status code 200):
{
  "message": "Successfully retrieved User Account Balance",
  "balance": 2500.75
}

Example Response (User Not Found - HTTP status code 404):
{
  "message": "User not found"
}

Example Response (Internal Server Error - HTTP status code 500):

{
  "message": "Internal server error"
}