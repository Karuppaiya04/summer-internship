# 🚀 Quick Start Guide - Birthday Reminder Project

## ✅ Prerequisites

Before running the project, make sure you have:

- **Python 3.8+** installed on your system
- **pip** (Python package manager)
- **Web browser** (Chrome, Firefox, Edge, etc.)

## 📦 Installation Steps

### Step 1: Install Python Dependencies

Open PowerShell in the project directory and run:

```powershell
pip install Flask Flask-MySQLdb mysqlclient python-dotenv
```

Or simply:

```powershell
pip install -r requirements.txt
```

### Step 2: Configure Python Environment (Already Done ✓)

The Python environment has been configured automatically.

## 🎯 Running the Project

### Option 1: Run with SQLite (Recommended - No MySQL needed!)

```powershell
python app_sqlite.py
```

OR using the full path:

```powershell
C:/Python313/python.exe app_sqlite.py
```

### Option 2: Run with MySQL (If you have MySQL installed)

1. **Install MySQL Server** (if not already installed)

   - Download from: https://dev.mysql.com/downloads/

2. **Create the Database**

   ```powershell
   mysql -u root -p < database.sql
   ```

3. **Update MySQL Credentials**

   - Open `app.py`
   - Change line 11: `app.config['MYSQL_PASSWORD'] = 'your_password'`

4. **Run the Application**
   ```powershell
   python app.py
   ```

## 🌐 Accessing the Application

1. After running the command, you'll see:

   ```
   ==================================================
   🎉 Birthday Reminder App Starting...
   ==================================================

   📍 Open your browser and go to: http://127.0.0.1:5000
   ```

2. **Open your web browser** and navigate to:

   ```
   http://127.0.0.1:5000
   ```

   OR

   ```
   http://localhost:5000
   ```

3. The application will open with a beautiful interface!

## 🎨 First Time Setup

The SQLite version automatically:

- ✅ Creates the database file (`birthday_reminder.db`)
- ✅ Creates the necessary tables
- ✅ Inserts 3 sample birthdays for testing

You can immediately start using the app!

## 🛑 Stopping the Application

To stop the Flask server:

- Press `CTRL + C` in the PowerShell terminal

## 🔧 Troubleshooting

### Issue: "Module not found" error

**Solution:** Install the missing package

```powershell
pip install Flask
```

### Issue: "Port 5000 already in use"

**Solution:** Either:

1. Kill the process using port 5000
2. Or modify `app_sqlite.py` line 223 to use a different port:
   ```python
   app.run(debug=True, port=5001)
   ```
   Then access: http://127.0.0.1:5001

### Issue: "Python command not found"

**Solution:** Use the full path:

```powershell
C:/Python313/python.exe app_sqlite.py
```

### Issue: Browser shows "Connection refused"

**Solution:**

1. Make sure the Flask app is running (check terminal output)
2. Try http://localhost:5000 instead
3. Check if firewall is blocking the connection

## 📁 Project Structure

```
internship/
├── app.py                     # Flask app (MySQL version)
├── app_sqlite.py              # Flask app (SQLite version) ⭐ USE THIS
├── database.sql               # MySQL database schema
├── requirements.txt           # Python dependencies
├── birthday_reminder.db       # SQLite database (auto-created)
├── templates/
│   └── index.html            # Main HTML page
└── static/
    ├── css/
    │   └── style.css         # Styles & animations
    └── js/
        └── script.js         # JavaScript functionality
```

## 🎯 Quick Commands Reference

| Command                           | Description             |
| --------------------------------- | ----------------------- |
| `python app_sqlite.py`            | Start the application   |
| `CTRL + C`                        | Stop the application    |
| `pip install -r requirements.txt` | Install dependencies    |
| `pip list`                        | Show installed packages |

## 🚀 What's Running?

When you start the application:

- **Backend**: Flask server on http://127.0.0.1:5000
- **Database**: SQLite file (`birthday_reminder.db`)
- **Frontend**: HTML/CSS/JavaScript served by Flask

## ✨ Using the Application

### Add a Birthday:

1. Click the **"Add Birthday"** button
2. Fill in the name and birth date (required)
3. Optionally add email and phone
4. Click **"Save"**

### Edit a Birthday:

1. Click the **pencil icon** ✏️ next to any birthday
2. Update the information
3. Click **"Save"**

### Delete a Birthday:

1. Click the **trash icon** 🗑️ next to any birthday
2. Confirm deletion

### Search Birthdays:

- Type in the search box at the top
- Results filter in real-time

### Advanced Features:

- 🌙 **Dark Mode**: Click moon icon (bottom-right)
- 📊 **View Toggle**: Switch between Table/Card view
- 📥 **Export**: Download birthdays as CSV
- 🔍 **Filters**: Click All/Today/Week/Month buttons
- ⬆️⬇️ **Sort**: Click column headers to sort

## 🎉 Features You'll See

1. **Statistics Dashboard** - Real-time birthday counts
2. **Animated Particles** - Floating background effect
3. **Confetti** - Automatic celebration for today's birthdays
4. **Toast Notifications** - Success/error messages
5. **Smooth Animations** - Professional UI transitions
6. **Dark Mode** - Easy on the eyes
7. **Responsive Design** - Works on all devices

## 📚 Additional Resources

- **Advanced Features Guide**: See `ADVANCED_FEATURES.md`
- **Full Documentation**: See `README.md`
- **API Endpoints**: Documented in `README.md`

## 💡 Tips

1. **Use SQLite version** (`app_sqlite.py`) - It's simpler and doesn't require MySQL installation
2. **Keep terminal open** - The Flask server needs to keep running
3. **Refresh browser** - If you make code changes, refresh to see them
4. **Check terminal** - Error messages appear in the terminal window

## 🎓 Learning Points

This project demonstrates:

- ✅ Full-stack web development
- ✅ RESTful API design
- ✅ Database operations (CRUD)
- ✅ Front-end animations
- ✅ Responsive design
- ✅ Modern JavaScript (ES6+)
- ✅ Bootstrap framework
- ✅ Flask web framework

---

## 🎯 TL;DR (Too Long; Didn't Read)

**Just want to run it quickly?**

```powershell
# 1. Install dependencies (one-time)
pip install Flask

# 2. Run the app
python app_sqlite.py

# 3. Open browser
# Go to: http://127.0.0.1:5000

# 4. To stop
# Press CTRL+C in terminal
```

That's it! Enjoy your Birthday Reminder App! 🎂🎉✨
