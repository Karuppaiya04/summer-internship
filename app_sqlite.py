from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
import sqlite3
from datetime import datetime, date
import os
import urllib.parse
import webbrowser
import hashlib
import secrets

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', secrets.token_hex(32))  # Use environment variable or generate secure key

# Database file path
DATABASE = 'birthday_reminder.db'

# Initialize database
def init_db():
    conn = sqlite3.connect(DATABASE)
    cur = conn.cursor()
    
    # Create users table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create birthdays table with user_id
    cur.execute('''
        CREATE TABLE IF NOT EXISTS birthdays (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            birth_date DATE NOT NULL,
            email TEXT,
            phone TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("Database initialized with users and birthdays tables!")

# Get database connection
def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

# Password hashing function
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# Check if user is logged in
def login_required(f):
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# Route to login page
@app.route('/login', methods=['GET'])
def login():
    if 'user_id' in session:
        return redirect(url_for('index'))
    return render_template('login.html')

# Route to signup page
@app.route('/signup', methods=['GET'])
def signup():
    if 'user_id' in session:
        return redirect(url_for('index'))
    return render_template('signup.html')

# Route to handle login
@app.route('/api/login', methods=['POST'])
def api_login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400
        
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE username = ?", (username,))
        user = cur.fetchone()
        conn.close()
        
        if user and user['password_hash'] == hash_password(password):
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['full_name'] = user['full_name']
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'user': {
                    'username': user['username'],
                    'full_name': user['full_name']
                }
            })
        else:
            return jsonify({'error': 'Invalid username or password'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Route to handle signup
@app.route('/api/signup', methods=['POST'])
def api_signup():
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        full_name = data.get('full_name')
        
        if not username or not email or not password:
            return jsonify({'error': 'Username, email, and password are required'}), 400
        
        # Check if username or email already exists
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE username = ? OR email = ?", (username, email))
        existing_user = cur.fetchone()
        
        if existing_user:
            conn.close()
            return jsonify({'error': 'Username or email already exists'}), 400
        
        # Create new user
        password_hash = hash_password(password)
        cur.execute("""
            INSERT INTO users (username, email, password_hash, full_name)
            VALUES (?, ?, ?, ?)
        """, (username, email, password_hash, full_name))
        
        user_id = cur.lastrowid
        conn.commit()
        conn.close()
        
        # Log the user in
        session['user_id'] = user_id
        session['username'] = username
        session['full_name'] = full_name
        
        return jsonify({
            'success': True,
            'message': 'Account created successfully',
            'user': {
                'username': username,
                'full_name': full_name
            }
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Route to logout
@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

# Route to home page
@app.route('/')
@login_required
def index():
    return render_template('index.html')

# Route to get all birthdays
@app.route('/api/birthdays', methods=['GET'])
@login_required
def get_birthdays():
    try:
        user_id = session.get('user_id')
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, name, birth_date, email, phone 
            FROM birthdays 
            WHERE user_id = ?
            ORDER BY strftime('%m-%d', birth_date)
        """, (user_id,))
        rows = cur.fetchall()
        conn.close()
        
        # Calculate days until birthday
        today = date.today()
        birthdays = []
        
        for row in rows:
            birth_date = datetime.strptime(row['birth_date'], '%Y-%m-%d').date()
            next_birthday = date(today.year, birth_date.month, birth_date.day)
            
            if next_birthday < today:
                next_birthday = date(today.year + 1, birth_date.month, birth_date.day)
            
            days_until = (next_birthday - today).days
            
            # Calculate age
            age = today.year - birth_date.year
            if next_birthday > today or (next_birthday.month == today.month and next_birthday.day == today.day):
                current_age = age
            else:
                current_age = age + 1
            
            birthdays.append({
                'id': row['id'],
                'name': row['name'],
                'birth_date': row['birth_date'],
                'email': row['email'] or '',
                'phone': row['phone'] or '',
                'days_until': days_until,
                'age': current_age
            })
        
        return jsonify(birthdays)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Route to add a birthday
@app.route('/api/birthdays', methods=['POST'])
@login_required
def add_birthday():
    try:
        user_id = session.get('user_id')
        data = request.get_json()
        name = data.get('name')
        birth_date = data.get('birth_date')
        email = data.get('email', '')
        phone = data.get('phone', '')
        
        if not name or not birth_date:
            return jsonify({'error': 'Name and birth date are required'}), 400
        
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO birthdays (user_id, name, birth_date, email, phone) VALUES (?, ?, ?, ?, ?)",
            (user_id, name, birth_date, email, phone)
        )
        conn.commit()
        birthday_id = cur.lastrowid
        conn.close()
        
        return jsonify({'id': birthday_id, 'message': 'Birthday added successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Route to update a birthday
@app.route('/api/birthdays/<int:id>', methods=['PUT'])
@login_required
def update_birthday(id):
    try:
        user_id = session.get('user_id')
        data = request.get_json()
        name = data.get('name')
        birth_date = data.get('birth_date')
        email = data.get('email', '')
        phone = data.get('phone', '')
        
        if not name or not birth_date:
            return jsonify({'error': 'Name and birth date are required'}), 400
        
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "UPDATE birthdays SET name=?, birth_date=?, email=?, phone=?, updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=?",
            (name, birth_date, email, phone, id, user_id)
        )
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Birthday updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Route to delete a birthday
@app.route('/api/birthdays/<int:id>', methods=['DELETE'])
@login_required
def delete_birthday(id):
    try:
        user_id = session.get('user_id')
        conn = get_db()
        cur = conn.cursor()
        cur.execute("DELETE FROM birthdays WHERE id=? AND user_id=?", (id, user_id))
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Birthday deleted successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Route to get upcoming birthdays (next 30 days)
@app.route('/api/birthdays/upcoming', methods=['GET'])
@login_required
def get_upcoming_birthdays():
    try:
        user_id = session.get('user_id')
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT id, name, birth_date, email, phone FROM birthdays WHERE user_id = ?", (user_id,))
        rows = cur.fetchall()
        conn.close()
        
        today = date.today()
        upcoming = []
        
        for row in rows:
            birth_date = datetime.strptime(row['birth_date'], '%Y-%m-%d').date()
            next_birthday = date(today.year, birth_date.month, birth_date.day)
            
            if next_birthday < today:
                next_birthday = date(today.year + 1, birth_date.month, birth_date.day)
            
            days_until = (next_birthday - today).days
            
            if days_until <= 30:
                upcoming.append({
                    'id': row['id'],
                    'name': row['name'],
                    'birth_date': row['birth_date'],
                    'email': row['email'] or '',
                    'phone': row['phone'] or '',
                    'days_until': days_until
                })
        
        upcoming.sort(key=lambda x: x['days_until'])
        return jsonify(upcoming)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Route to get today's birthdays
@app.route('/api/birthdays/today', methods=['GET'])
@login_required
def get_today_birthdays():
    try:
        user_id = session.get('user_id')
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT id, name, birth_date, email, phone FROM birthdays WHERE user_id = ?", (user_id,))
        rows = cur.fetchall()
        conn.close()
        
        today = date.today()
        today_birthdays = []
        
        for row in rows:
            birth_date = datetime.strptime(row['birth_date'], '%Y-%m-%d').date()
            
            # Check if birthday is today
            if birth_date.month == today.month and birth_date.day == today.day:
                age = today.year - birth_date.year
                today_birthdays.append({
                    'id': row['id'],
                    'name': row['name'],
                    'birth_date': row['birth_date'],
                    'email': row['email'] or '',
                    'phone': row['phone'] or '',
                    'age': age
                })
        
        return jsonify(today_birthdays)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Route to send WhatsApp message
@app.route('/api/send-whatsapp', methods=['POST'])
@login_required
def send_whatsapp():
    try:
        data = request.get_json()
        phone = data.get('phone')
        name = data.get('name')
        age = data.get('age')
        custom_message = data.get('message', '')
        
        if not phone:
            return jsonify({'error': 'Phone number is required'}), 400
        
        # Clean phone number (remove spaces, dashes, etc.)
        clean_phone = ''.join(filter(str.isdigit, phone))
        
        # Create birthday message
        if custom_message:
            message = custom_message
        else:
            message = f"🎉🎂 Happy {age}th Birthday, {name}! 🎂🎉\n\n"
            message += f"✨ *Birthday Wishes:*\n"
            message += f"May God bless you with health, wealth, and happiness! "
            message += f"Wishing you a day filled with joy and a year filled with success! "
            message += f"May all your dreams and wishes come true. 🙏🎈\n\n"
            message += f"🛕 *Temple Visit Plan:*\n"
            message += f"On this special day, we plan to visit the temple to offer prayers for your long life and prosperity. "
            message += f"Your blessings mean the world to us! 🕉️\n\n"
            message += f"💝 *Birthday Donation:*\n"
            message += f"In honor of your birthday, we will make a donation to schools and charitable trusts "
            message += f"to help underprivileged children receive education and support. "
            message += f"Your special day will bring smiles to many faces! 📚🏫\n\n"
            message += f"Have a wonderful birthday celebration! �🎁\n"
            message += f"With love and best wishes! 💐"
        
        # Encode message for URL
        encoded_message = urllib.parse.quote(message)
        
        # Create WhatsApp Web URL
        whatsapp_url = f"https://wa.me/{clean_phone}?text={encoded_message}"
        
        return jsonify({
            'success': True,
            'url': whatsapp_url,
            'message': 'WhatsApp link generated successfully'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Route to send bulk WhatsApp messages to all today's birthdays
@app.route('/api/send-whatsapp-bulk', methods=['POST'])
@login_required
def send_whatsapp_bulk():
    try:
        user_id = session.get('user_id')
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT id, name, birth_date, phone FROM birthdays WHERE user_id = ? AND phone IS NOT NULL AND phone != ''", (user_id,))
        rows = cur.fetchall()
        conn.close()
        
        today = date.today()
        sent_messages = []
        
        for row in rows:
            birth_date = datetime.strptime(row['birth_date'], '%Y-%m-%d').date()
            
            # Check if birthday is today
            if birth_date.month == today.month and birth_date.day == today.day:
                age = today.year - birth_date.year
                phone = row['phone']
                name = row['name']
                
                # Clean phone number
                clean_phone = ''.join(filter(str.isdigit, phone))
                
                # Create message with wishes, temple plans, and donation info
                message = f"🎉🎂 Happy {age}th Birthday, {name}! 🎂🎉\n\n"
                message += f"✨ *Birthday Wishes:*\n"
                message += f"May God bless you with health, wealth, and happiness! "
                message += f"Wishing you a day filled with joy and a year filled with success! "
                message += f"May all your dreams and wishes come true. 🙏🎈\n\n"
                message += f"🛕 *Temple Visit Plan:*\n"
                message += f"On this special day, we plan to visit the temple to offer prayers for your long life and prosperity. "
                message += f"Your blessings mean the world to us! 🕉️\n\n"
                message += f"💝 *Birthday Donation:*\n"
                message += f"In honor of your birthday, we will make a donation to schools and charitable trusts "
                message += f"to help underprivileged children receive education and support. "
                message += f"Your special day will bring smiles to many faces! 📚🏫\n\n"
                message += f"Have a wonderful birthday celebration! �🎁\n"
                message += f"With love and best wishes! 💐"
                
                encoded_message = urllib.parse.quote(message)
                whatsapp_url = f"https://wa.me/{clean_phone}?text={encoded_message}"
                
                sent_messages.append({
                    'name': name,
                    'phone': phone,
                    'url': whatsapp_url
                })
        
        return jsonify({
            'success': True,
            'count': len(sent_messages),
            'messages': sent_messages
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Initialize database on module load (for production)
init_db()

if __name__ == '__main__':
    print("\n" + "="*50)
    print("🎉 Birthday Reminder App Starting...")
    print("="*50)
    print("\n📍 Open your browser and go to: http://127.0.0.1:5000")
    print("\n✨ Features:")
    print("   • Add, edit, and delete birthdays")
    print("   • View upcoming birthdays")
    print("   • Search by name")
    print("   • Auto age calculation")
    print("\n" + "="*50 + "\n")
    app.run(debug=True, port=5000)
