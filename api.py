from flask import Flask, request, jsonify
import sqlite3

app = Flask(__name__)

# Подключение к базе данных SQLite3
def connect_db():
    return sqlite3.connect('users.db')

# Создание базы данных и таблицы (один раз)
def init_db():
    with connect_db() as conn:
        conn.execute('''CREATE TABLE IF NOT EXISTS users
                        (id INTEGER PRIMARY KEY, username TEXT, points INTEGER, levelIndex INTEGER)''')
        conn.commit()

# API для получения данных пользователя
@app.route('/get_user_data/<int:user_id>', methods=['GET'])
def get_user_data(user_id):
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id=?", (user_id,))
    user = cursor.fetchone()
    conn.close()

    if user:
        return jsonify({
            'id': user[0],
            'username': user[1],
            'points': user[2],
            'levelIndex': user[3]
        })
    else:
        return jsonify({'error': 'User not found'}), 404

# API для сохранения или обновления данных пользователя
@app.route('/save_user_data', methods=['POST'])
def save_user_data():
    data = request.json
    user_id = data.get('id')
    username = data.get('username')
    points = data.get('points')
    levelIndex = data.get('levelIndex')

    conn = connect_db()
    cursor = conn.cursor()

    # Проверяем, существует ли пользователь
    cursor.execute("SELECT * FROM users WHERE id=?", (user_id,))
    user = cursor.fetchone()

    if user:
        cursor.execute("UPDATE users SET points=?, levelIndex=? WHERE id=?", (points, levelIndex, user_id))
    else:
        cursor.execute("INSERT INTO users (id, username, points, levelIndex) VALUES (?, ?, ?, ?)",
                       (user_id, username, points, levelIndex))

    conn.commit()
    conn.close()

    return jsonify({'status': 'success'})

if __name__ == '__main__':
    init_db()  # Создаем таблицу при первом запуске
    app.run(debug=True)