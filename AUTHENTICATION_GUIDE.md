# 🔐 Login & Signup System Documentation

## ✨ Overview

The Birthday Reminder application now includes a complete user authentication system with:

- **User Registration (Sign Up)**
- **User Login**
- **Session Management**
- **Secure Password Hashing**
- **User-specific Data Isolation**
- **Logout Functionality**

---

## 🎯 Features

### 1. **User Registration**

- Create new user accounts
- Unique username and email validation
- Password strength indicator
- Password confirmation
- Full name support
- Secure password hashing (SHA-256)

### 2. **User Login**

- Secure authentication
- Session-based login
- Remember user across requests
- Automatic redirection

### 3. **Data Security**

- Each user sees only their own birthdays
- Password hashing for security
- Session-based authentication
- Protected API endpoints

### 4. **User Experience**

- Beautiful gradient UI
- Responsive design
- Real-time password strength checker
- Animated transitions
- Clear error messages

---

## 🚀 How to Use

### **Sign Up (New Users)**

1. **Open the app** at http://127.0.0.1:5000
2. You'll be **redirected to login page** (since you're not logged in)
3. Click **"Sign Up"** link
4. Fill in the form:
   - **Full Name**: Your actual name
   - **Username**: Unique username for login
   - **Email**: Your email address
   - **Password**: Strong password (6+ characters)
   - **Confirm Password**: Re-enter password
5. Click **"Create Account"**
6. You'll be **automatically logged in** and redirected to dashboard

### **Login (Existing Users)**

1. **Open the app** at http://127.0.0.1:5000
2. Enter your **username** and **password**
3. Click **"Login"**
4. You'll be redirected to the **birthday dashboard**

### **Logout**

1. Click your **username** in the top navigation bar
2. Click **"Logout"**
3. You'll be redirected to the login page
4. Your session will be cleared

---

## 📋 Database Structure

### **Users Table**

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### **Birthdays Table (Updated)**

```sql
CREATE TABLE birthdays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,              -- NEW: Links birthday to user
    name TEXT NOT NULL,
    birth_date DATE NOT NULL,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
)
```

**Key Change:** Added `user_id` foreign key to link birthdays to specific users.

---

## 🔧 Technical Implementation

### **Backend Changes (app_sqlite.py)**

#### 1. **New Imports**

```python
from flask import session, redirect, url_for
import hashlib
import secrets
```

#### 2. **Session Configuration**

```python
app.secret_key = secrets.token_hex(32)  # Secure random key
```

#### 3. **Password Hashing**

```python
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()
```

#### 4. **Login Required Decorator**

```python
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function
```

#### 5. **New API Endpoints**

- `GET /login` - Login page
- `GET /signup` - Signup page
- `POST /api/login` - Handle login
- `POST /api/signup` - Handle signup
- `GET /logout` - Logout user

#### 6. **Protected Routes**

All birthday routes now require login:

```python
@app.route('/api/birthdays', methods=['GET'])
@login_required
def get_birthdays():
    user_id = session.get('user_id')
    # Filter by user_id...
```

---

## 🎨 Frontend Pages

### **1. Login Page (`login.html`)**

**Features:**

- Left panel with app description
- Right panel with login form
- Animated birthday icon
- Username and password fields
- Link to signup page
- Real-time validation
- Error/success alerts

**URL:** `http://127.0.0.1:5000/login`

### **2. Signup Page (`signup.html`)**

**Features:**

- Left panel with feature list
- Right panel with signup form
- Animated gift icon
- Full name, username, email, password fields
- Password strength indicator (Weak/Fair/Good/Strong)
- Password confirmation
- Real-time validation
- Error/success alerts

**URL:** `http://127.0.0.1:5000/signup`

### **3. Dashboard (Updated `index.html`)**

**New Features:**

- Username displayed in navbar
- Logout button in navbar
- User-specific birthdays only
- Session-based access control

---

## 🔐 Security Features

### **1. Password Security**

- ✅ SHA-256 hashing algorithm
- ✅ Passwords never stored in plain text
- ✅ Secure comparison during login

### **2. Session Management**

- ✅ Secure session cookies
- ✅ Random secret key generation
- ✅ Session cleared on logout

### **3. Data Isolation**

- ✅ Users see only their own data
- ✅ API endpoints filter by user_id
- ✅ Foreign key constraints

### **4. Input Validation**

- ✅ Required field validation
- ✅ Email format validation
- ✅ Unique username/email check
- ✅ Password minimum length (6 characters)
- ✅ Password confirmation match

---

## 📱 User Flow

```
┌─────────────────┐
│  Visit App      │
│  (Port 5000)    │
└────────┬────────┘
         │
    Not Logged In
         │
         ↓
┌─────────────────┐
│  Login Page     │
│  /login         │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
New User   Existing
    │         │
    ↓         ↓
┌───────┐ ┌──────┐
│Signup │ │Login │
└───┬───┘ └───┬──┘
    │         │
    └────┬────┘
         │
    Logged In
         │
         ↓
┌─────────────────┐
│  Dashboard      │
│  /              │
│  (index.html)   │
└────────┬────────┘
         │
    Use App
         │
         ↓
┌─────────────────┐
│  Logout         │
│  /logout        │
└────────┬────────┘
         │
    Back to Login
```

---

## 🎯 API Endpoints

### **Authentication Endpoints**

| Method | Endpoint      | Description       | Auth Required |
| ------ | ------------- | ----------------- | ------------- |
| GET    | `/login`      | Login page        | No            |
| GET    | `/signup`     | Signup page       | No            |
| POST   | `/api/login`  | Authenticate user | No            |
| POST   | `/api/signup` | Create new user   | No            |
| GET    | `/logout`     | Logout user       | Yes           |

### **Birthday Endpoints (All Require Auth)**

| Method | Endpoint                  | Description            |
| ------ | ------------------------- | ---------------------- |
| GET    | `/api/birthdays`          | Get user's birthdays   |
| POST   | `/api/birthdays`          | Add new birthday       |
| PUT    | `/api/birthdays/<id>`     | Update birthday        |
| DELETE | `/api/birthdays/<id>`     | Delete birthday        |
| GET    | `/api/birthdays/upcoming` | Get upcoming birthdays |
| GET    | `/api/birthdays/today`    | Get today's birthdays  |
| POST   | `/api/send-whatsapp`      | Send WhatsApp message  |
| POST   | `/api/send-whatsapp-bulk` | Bulk WhatsApp send     |

---

## 🧪 Testing the System

### **Test 1: Create New Account**

```
1. Go to http://127.0.0.1:5000
2. Click "Sign Up"
3. Enter:
   - Full Name: Test User
   - Username: testuser
   - Email: test@example.com
   - Password: password123
   - Confirm: password123
4. Click "Create Account"
5. Should redirect to dashboard
```

### **Test 2: Login with Existing Account**

```
1. Logout if logged in
2. Go to /login
3. Enter:
   - Username: testuser
   - Password: password123
4. Click "Login"
5. Should redirect to dashboard
```

### **Test 3: Data Isolation**

```
1. Create account A, add some birthdays
2. Logout
3. Create account B, add different birthdays
4. Each user should see only their own birthdays
```

### **Test 4: Protected Routes**

```
1. Logout
2. Try to access http://127.0.0.1:5000
3. Should redirect to login page
4. Try to access /api/birthdays directly
5. Should redirect to login page
```

---

## 💡 Password Strength Rules

The signup page includes a real-time password strength checker:

| Strength   | Requirements          | Color       |
| ---------- | --------------------- | ----------- |
| **Weak**   | < 8 characters        | Red         |
| **Fair**   | 8+ chars + lowercase  | Yellow      |
| **Good**   | + uppercase + numbers | Light Green |
| **Strong** | + special characters  | Green       |

---

## 🎨 Design Features

### **Gradient Theme**

- Primary: `#667eea` → `#764ba2`
- Consistent across all pages
- Smooth animations
- Modern glassmorphism effects

### **Animations**

- Bounce effect on login icon
- Rotate effect on signup icon
- Slide-down alerts
- Smooth transitions
- Hover effects

### **Responsive Design**

- Mobile-friendly
- Tablet-optimized
- Desktop layouts
- Flexible containers

---

## 🔄 Migration Notes

### **Existing Database**

If you have an existing `birthday_reminder.db` file:

**Option 1: Fresh Start (Recommended)**

1. Delete `birthday_reminder.db`
2. Restart the app
3. New tables will be created
4. Create a new account

**Option 2: Manual Migration**

```sql
-- Add users table
CREATE TABLE users (...);

-- Add user_id column to birthdays
ALTER TABLE birthdays ADD COLUMN user_id INTEGER;

-- Create a default user
INSERT INTO users (username, email, password_hash, full_name)
VALUES ('admin', 'admin@example.com', 'hash', 'Admin User');

-- Link existing birthdays to default user
UPDATE birthdays SET user_id = 1;
```

---

## 🚀 Quick Start Guide

### **For New Users:**

1. Start the server: `python app_sqlite.py`
2. Open browser: `http://127.0.0.1:5000`
3. Click "Sign Up"
4. Create your account
5. Start adding birthdays!

### **For Developers:**

All authentication code is in:

- **Backend:** `app_sqlite.py`
- **Login Page:** `templates/login.html`
- **Signup Page:** `templates/signup.html`
- **Navbar Update:** `templates/index.html`

---

## 📊 Session Data Stored

When logged in, session contains:

```python
{
    'user_id': 1,              # User's database ID
    'username': 'testuser',    # Username
    'full_name': 'Test User'   # Full name
}
```

---

## ✅ Benefits

### **Security**

- ✅ Passwords never visible
- ✅ Secure hashing algorithm
- ✅ Session-based authentication
- ✅ Protected API endpoints

### **Privacy**

- ✅ Data isolation per user
- ✅ Can't access other user's data
- ✅ Personal birthday management

### **User Experience**

- ✅ Beautiful UI design
- ✅ Easy registration process
- ✅ Clear error messages
- ✅ Smooth navigation

### **Functionality**

- ✅ Multi-user support
- ✅ Individual accounts
- ✅ Personal data management
- ✅ Session persistence

---

## 🎉 Summary

**The authentication system is now fully functional!**

- ✅ **2 new pages** (login.html, signup.html)
- ✅ **Database updated** (users table, user_id in birthdays)
- ✅ **All routes protected** (login required)
- ✅ **Secure password hashing**
- ✅ **Session management**
- ✅ **Data isolation**
- ✅ **Beautiful UI**

**Start the server and try it out!** 🚀

```bash
python app_sqlite.py
```

Then visit: **http://127.0.0.1:5000**
