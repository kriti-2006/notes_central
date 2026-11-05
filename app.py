
from werkzeug.security import generate_password_hash, check_password_hash
from flask import Flask, render_template, request, redirect, url_for, session
import pymysql
from pymysql.cursors import DictCursor
import os
import re
import secrets


def load_env_file(path=os.path.join(os.path.dirname(__file__), '.env')):
    if not os.path.exists(path):
        return

    with open(path) as env_file:
        for line in env_file:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ.setdefault(
                    key.strip(), value.strip().strip('"').strip("'")
                )


load_env_file()

app = Flask(__name__, template_folder='tools/templates')

app.secret_key = (
    os.environ.get('FLASK_SECRET_KEY') or secrets.token_hex(32)
)

DB_CONFIG = {
    'host': os.environ.get('FLASK_MYSQL_HOST', 'localhost'),
    'user': os.environ.get('FLASK_MYSQL_USER', 'root'),
    'password': os.environ.get('FLASK_MYSQL_PASSWORD', ''),
    'database': os.environ.get('FLASK_MYSQL_DB', 'notes_db'),
    'cursorclass': DictCursor,
    'connect_timeout': 10,
}


def get_db_connection():
    return pymysql.connect(**DB_CONFIG)


@app.route('/')
@app.route('/login', methods=['GET', 'POST'])
def login():
    msg = ''

    if request.method == 'POST' and 'username' in request.form and 'password' in request.form:
        username = request.form['username']
        password = request.form['password']

        connection = get_db_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    'SELECT * FROM sinup WHERE username = %s',
                    (username,)
                )
                account = cursor.fetchone()
        finally:
            connection.close()

        if account and check_password_hash(account['password'], password):
            session['loggedin'] = True
            session['id'] = account['id']
            session['username'] = account['username']
            msg = 'Logged in successfully!'
            return render_template('index.html', msg=msg)
        else:
            msg = 'Incorrect username/password!'

    return render_template('login.html', msg=msg)


@app.route('/logout')
def logout():
    session.pop('loggedin', None)
    session.pop('id', None)
    session.pop('username', None)
    return redirect(url_for('login'))


@app.route('/register', methods=['GET', 'POST'])
def register():
    msg = ''

    if (
        request.method == 'POST'
        and 'username' in request.form
        and 'password' in request.form
        and 'email' in request.form
    ):
        username = request.form['username']
        password = request.form['password']
        email = request.form['email']

        if not username or not password or not email:
            msg = 'Please fill out the form!'
        elif not re.fullmatch(r'[A-Za-z0-9]+', username):
            msg = 'Username must contain only characters and numbers!'
        elif not re.fullmatch(r'[^@]+@[^@]+\.[^@]+', email):
            msg = 'Invalid email address!'
        else:
            connection = get_db_connection()
            try:
                with connection.cursor() as cursor:
                    cursor.execute(
                        'SELECT * FROM sinup WHERE username = %s',
                        (username,)
                    )
                    account = cursor.fetchone()

                    if account:
                        msg = 'Account already exists!'
                    else:
                        hashed_password = generate_password_hash(password)
                        cursor.execute(
                            'INSERT INTO sinup VALUES (NULL, %s, %s, %s)',
                            (username, hashed_password, email)
                        )
                        connection.commit()
                        msg = 'You have successfully registered!'
            finally:
                connection.close()

    elif request.method == 'POST':
        msg = 'Please fill out the form!'

    return render_template('register.html', msg=msg)


if __name__ == '__main__':
    app.run(debug=os.environ.get('FLASK_DEBUG') == '1')
