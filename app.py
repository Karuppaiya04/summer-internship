from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask_mysqldb import MySQL
from datetime import datetime, date
import os

app = Flask(__name__)

# MySQL Configuration
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = 'your_password'  # Change this to your MySQL password
app.config['MYSQL_DB'] = 'birthday_reminder'
app.config['MYSQL_CURSORCLASS'] = 'DictCursor'

mysql = MySQL(app)

# Route to home page
@app.route('/')
def index():
    return render_template('index.html')

# Route to get all birthdays
@app.route('/api/birthdays', methods=['GET'])
def get_birthdays():
    try:
        cur = mysql.connection.cursor()
        cur.execute("SELECT * FROM birthdays ORDER BY MONTH(birth_date), DAY(birth_date)")
        birthdays = cur.fetchall()
        cur.close()
        
        # Calculate days until birthday
        today = date.today()
        for birthday in birthdays:
            birth_date = birthday['birth_date']
            next_birthday = date(today.year, birth_date.month, birth_date.day)
            
            if next_birthday < today:
                next_birthday = date(today.year + 1, birth_date.month, birth_date.day)
            
            days_until = (next_birthday - today).days
            birthday['days_until'] = days_until
            birthday['birth_date'] = birth_date.strftime('%Y-%m-%d')
            
            # Calculate age
            age = today.year - birth_date.year
            if next_birthday > today or (next_birthday.month == today.month and next_birthday.day == today.day):
                birthday['age'] = age
            else:
                birthday['age'] = age + 1
        
        return jsonify(birthdays)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Route to add a birthday
@app.route('/api/birthdays', methods=['POST'])
def add_birthday():
    try:
        data = request.get_json()
        name = data.get('name')
        birth_date = data.get('birth_date')
        email = data.get('email', '')
        phone = data.get('phone', '')
        
        if not name or not birth_date:
            return jsonify({'error': 'Name and birth date are required'}), 400
        
        cur = mysql.connection.cursor()
        cur.execute(
            "INSERT INTO birthdays (name, birth_date, email, phone) VALUES (%s, %s, %s, %s)",
            (name, birth_date, email, phone)
        )
        mysql.connection.commit()
        birthday_id = cur.lastrowid
        cur.close()
        
        return jsonify({'id': birthday_id, 'message': 'Birthday added successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Route to update a birthday
@app.route('/api/birthdays/<int:id>', methods=['PUT'])
def update_birthday(id):
    try:
        data = request.get_json()
        name = data.get('name')
        birth_date = data.get('birth_date')
        email = data.get('email', '')
        phone = data.get('phone', '')
        
        if not name or not birth_date:
            return jsonify({'error': 'Name and birth date are required'}), 400
        
        cur = mysql.connection.cursor()
        cur.execute(
            "UPDATE birthdays SET name=%s, birth_date=%s, email=%s, phone=%s WHERE id=%s",
            (name, birth_date, email, phone, id)
        )
        mysql.connection.commit()
        cur.close()
        
        return jsonify({'message': 'Birthday updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Route to delete a birthday
@app.route('/api/birthdays/<int:id>', methods=['DELETE'])
def delete_birthday(id):
    try:
        cur = mysql.connection.cursor()
        cur.execute("DELETE FROM birthdays WHERE id=%s", (id,))
        mysql.connection.commit()
        cur.close()
        
        return jsonify({'message': 'Birthday deleted successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Route to get upcoming birthdays (next 30 days)
@app.route('/api/birthdays/upcoming', methods=['GET'])
def get_upcoming_birthdays():
    try:
        cur = mysql.connection.cursor()
        cur.execute("SELECT * FROM birthdays")
        birthdays = cur.fetchall()
        cur.close()
        
        today = date.today()
        upcoming = []
        
        for birthday in birthdays:
            birth_date = birthday['birth_date']
            next_birthday = date(today.year, birth_date.month, birth_date.day)
            
            if next_birthday < today:
                next_birthday = date(today.year + 1, birth_date.month, birth_date.day)
            
            days_until = (next_birthday - today).days
            
            if days_until <= 30:
                birthday['days_until'] = days_until
                birthday['birth_date'] = birth_date.strftime('%Y-%m-%d')
                upcoming.append(birthday)
        
        upcoming.sort(key=lambda x: x['days_until'])
        return jsonify(upcoming)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
