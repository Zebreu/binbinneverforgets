import time
import sqlite3
import os
import hashlib
import traceback

import pandas as pd
from flask import Flask, request, json, render_template, send_from_directory, abort, g
from passlib.apps import custom_app_context as pwd_context
from flask_httpauth import HTTPBasicAuth, HTTPTokenAuth

auth = HTTPBasicAuth()
tokenauth = HTTPTokenAuth()

working_directory = os.path.dirname(__file__)

app = Flask(__name__) 

tokens = dict()

master_database = 'master.db'

def create_heatmap(schedules):
    """Represents upcoming tasks as a calendar heatmap."""
    
    total = []
    for item, schedule in schedules:
        for day in schedule:
            total.append((day, 1, item))

    
    schedule_df = pd.DataFrame(total, columns=['date', 'check', 'item'])
    schedule_df.index = schedule_df['date']
    schedule_df = schedule_df.drop(columns=['date'])
    
    resampled = schedule_df.resample('D').agg({'check': 'sum', 'item': list})
    resampled = resampled[resampled['check'] > 0].reset_index()
    
    return resampled


def generate_upcoming_tasks(merged, exclude_past=True):
    """Generates upcoming tasks given information about last checked dates and master data."""
    
    today = pd.Timestamp.today()

    schedules = []
    for i, row in merged.iterrows():
        schedule = pd.date_range(row['date_checked'], today+pd.Timedelta(13, 'W'), freq=f'{row["frequency"]*7}D')
        schedule = schedule[1:]
        if len(schedule) == 0:
            continue
        if exclude_past:
            schedule = schedule[schedule >= today]
        schedules.append((row['item'], schedule))

    return schedules


def get_user_database_name(username):
    connection = sqlite3.connect(os.path.join(working_directory, master_database))
    df = pd.read_sql('select database from user_to_database where username = :username', 
        con = connection, params = {"username": username})
    return df['database'].iloc[0]


def inspect_inventory_log(username):
    """Gathers observations and master data."""
    today = pd.Timestamp.today()
    user_database = get_user_database_name(username)
    connection = sqlite3.connect(os.path.join(working_directory, user_database))
    checks = pd.read_sql('SELECT * from inventory_log', con = connection)
    checks['date'] = pd.to_datetime(checks['date'])
    checks = checks.sort_values('date')
    last_checked = checks.groupby(['item']).last().reset_index()

    master_data = pd.read_sql('SELECT * from master_data', con = connection)
    recent_master_data = master_data.sort_values('date_added').groupby('item').last().reset_index()

    merged = recent_master_data.merge(last_checked, on='item', suffixes=('_initial','_checked'))
    merged['week_difference'] = (today - merged['date_checked']).dt.days/7
    merged['need_to_check'] = merged['week_difference'] > merged['frequency']

    return merged 


@auth.verify_password
def verify_password(username, password):
    connection = sqlite3.connect(os.path.join(working_directory, master_database))
    users = pd.read_sql('select * from users where username=:username', 
        con = connection, 
        params={"username": username})
    
    if len(users) == 0:
        return False
    
    encrypted_password = users['password'].iloc[0]
    g.user = username
    return pwd_context.verify(password, encrypted_password)


@tokenauth.verify_token
def verify_token(token):
    today = pd.Timestamp.today()

    if token in tokens:
        if tokens[token]['expiry'] > today:
            g.user = tokens[token]['username']
            return True
        else:
            tokens.pop(token, None)

    return False    


def create_user(username, password):
    """Creates a user in the database including its own set of tables."""
    connection = sqlite3.connect(os.path.join(working_directory, master_database))
    try:
        existing_users = pd.read_sql('select * from users', con = connection)
    except:
        existing_users = []

    current_id = len(existing_users) + 1 # we don't depend on id input anywhere so it's fine to not use better UUIDs

    if len(existing_users) > 0:
        if username in set(existing_users['username']):
            return False

    user = pd.DataFrame()   
    user['username'] = [username]
    user['password'] = [pwd_context.hash(password)] # encryption
    user['active'] = [True]
    user['id'] = [current_id]
    user.to_sql('users', con = connection, if_exists='append')
    
    new_db = f'user{current_id}.db'
    user_db_mapping = pd.DataFrame()
    user_db_mapping['username'] = [username]
    user_db_mapping['database'] = [new_db]
    user_db_mapping.to_sql('user_to_database', con = connection, if_exists='append')
    
    return True 


@app.route('/')
def hello_world():
    return render_template("index.html")


@app.route('/users/login', methods=['GET'])
@auth.login_required
def login_user():
    today = pd.Timestamp.today()
    
    current_tokens = list(tokens.keys())
    for token in current_tokens:
        if tokens[token]['expiry'] < today:
            tokens.pop(token, None)

    expiry = today + pd.Timedelta(11, 'H')
    frontend_expiry = int((time.time() + (60*60*11)) * 1000)
    token_string = hashlib.sha256((g.user+str(today)).encode()).hexdigest()
    token = {'username': g.user, 'expiry': expiry}
    print(token)
    tokens[token_string] = token
    return json.jsonify({'token_created': token_string, 'username': g.user, 'token_expiry': frontend_expiry})


@app.route('/users/register', methods=['POST'])
def register_user():
    print(request)
    username = request.form.get('username')
    password = request.form.get('password')
    if username is None or password is None:
        abort(400)
    
    created = create_user(username, password)
    return json.jsonify({ 'username_created': created })


@app.route('/suggestion')
@tokenauth.login_required
def rx_suggestion():
    """Queries the DB for all rx names and return them to be used as suggestions"""
    user_database = get_user_database_name(g.user)
    try:
        connection = sqlite3.connect(os.path.join(working_directory, user_database))
        inventory = pd.read_sql('SELECT DISTINCT item from inventory_log', con = connection)
        suggestions_dict = inventory.to_dict(orient='list')
        print(suggestions_dict)
    except:
        suggestions_dict = {'item': []}
    return json.jsonify(suggestions_dict)


@app.route('/search/<name>')
@tokenauth.login_required
def search_rx(name):
    """Queries the DB for the relevant rows, based on search bar"""
    user_database = get_user_database_name(g.user)
    try:
        connection = sqlite3.connect(os.path.join(working_directory, user_database))
        inventory = pd.read_sql('SELECT * from inventory_log', con = connection)
        low_name = name.lower()
        sub_inventory = inventory[inventory['item'].str.lower() == low_name]
        actual_name = sub_inventory['item'].iloc[0]
        checks_count = len(sub_inventory.index)
        print(checks_count)
        search_return_dict = {"checks_count": checks_count}
        # What else should we return when someone asks for information about an item?
        # TODO: next_check
        search_return_dict["item"] = [actual_name]
        search_return_dict["last_checked"] = sub_inventory["date"].max()
        merged = inspect_inventory_log(username = g.user)
        need_to_check = merged[merged['item'] == actual_name].iloc[0]['need_to_check'].astype(str)
        search_return_dict["need_to_check"] = need_to_check
        # Maybe also add the median time between checks
    except:
        search_return_dict = {'item': []}
    return json.jsonify(search_return_dict)


@app.route('/add_item', methods=['POST'])
@tokenauth.login_required
def add_item(inventory_checked=True):
    today = pd.Timestamp.today()
    username = g.user
    
    
    df = pd.DataFrame()
    df['item'] = [request.form.get('name')]
    df['date'] = pd.to_datetime([request.form.get('date')])
    df['frequency'] = [int(request.form.get('frequency'))]
    df['date_added'] = [today]
    print(df)
    user_database = get_user_database_name(username)
    connection = sqlite3.connect(os.path.join(working_directory, user_database))
    df.to_sql('master_data', con=connection, if_exists='append', index=False)
    
    if inventory_checked:
        df[['date', 'item']].to_sql('inventory_log', con=connection, if_exists='append', index=False)
    
    return df.to_json(orient='split', index=False)

@app.route('/upload_master_data', methods=['POST'])
@tokenauth.login_required
def upload_master_data(inventory_checked=True):
    """Updates a master table from an input file."""
    today = pd.Timestamp.today()
    username = g.user
    
    #df = pd.read_csv(os.path.join(working_directory, 'horaire_data.csv'))
    
    csv = request.files.get('file')
    filename = hashlib.md5(username.encode()).hexdigest()+'.csv'
    csv.save(filename) # TODO avoid writing to disk
    df = pd.read_csv(filename)
    
    
    df['date'] = pd.to_datetime(df['date'])
    df['date_added'] = today

    user_database = get_user_database_name(username)
    connection = sqlite3.connect(os.path.join(working_directory, user_database))
    df.to_sql('master_data', con=connection, if_exists='append', index=False)
    
    if inventory_checked:
        df[['date', 'item']].to_sql('inventory_log', con=connection, if_exists='append', index=False)
    
    return df.to_json(orient='split', index=False)


@app.route('/all_events')
@tokenauth.login_required
def get_all_events():
    """Creates a schedule ahead of time."""
    try:
        merged = inspect_inventory_log(username = g.user)
        schedules = generate_upcoming_tasks(merged)

        return_values = []
        for schedule in schedules:
            title = schedule[0]
            events = schedule[1]
            for event in events:
                item = dict()
                item['title'] = title
                item['date'] = event.strftime(format='%Y-%m-%d')
                return_values.append(item)

        user_database = get_user_database_name(username = g.user)
        connection = sqlite3.connect(os.path.join(working_directory, user_database))
        log = pd.read_sql('select * from inventory_log', con=connection)
        log['title'] = log['item']
        log = log[['date', 'title']]
        log['date'] = log['date'].apply(lambda x: x.split(' ')[0])
        log['color'] = 'green'
        past = log.to_dict('records')
        return_values.extend(past)

    except:
        traceback.print_exc()
        return_values = []
    return json.jsonify(return_values)


@app.route('/get_tasks')
@tokenauth.login_required
def get_tasks():
    try:
        merged = inspect_inventory_log(username = g.user)
        schedules = generate_upcoming_tasks(merged, exclude_past=False)
        today = pd.Timestamp.today()
        grouped_tasks = dict()
        schedules = sorted(schedules, key=lambda x: x[1][0])
        for schedule in schedules:
            title = schedule[0]
            check_date = schedule[1][0]
            if check_date < today:
                check_date = "Past due"
            elif check_date == today:
                check_date = "Today"
            elif check_date.week == today.week:
                check_date = 'This week'
            elif check_date.week == (today+pd.Timedelta(1, 'W')).week:
                check_date = 'Next week'
            else:
                continue
            grouped_tasks.setdefault(check_date, []).append(title)
    except:
        grouped_tasks = dict()

    return json.jsonify(grouped_tasks)


@app.route('/create_report')
@tokenauth.login_required
def create_report():
    """Creates a report of due checks."""
    merged = inspect_inventory_log(username = g.user)    
    
    merged.insert(0, 'id', pd.RangeIndex(len(merged)))
    merged['need_to_check'] = merged['need_to_check'].astype(str)

    return merged.to_json(orient='split', index=False)


@app.route('/update_inventory_log', methods=['POST'])
@tokenauth.login_required
def update_inventory_log():
    """Update the inventory log given a form with items and the time of their most recent check."""
    
    items = request.form.get('items').split(',')
    dates = [pd.Timestamp.today()]*len(items)
    df = pd.DataFrame(columns=['date', 'item'])
    df['date'] = dates
    df['item'] = items

    user_database = get_user_database_name(username = g.user)
    connection = sqlite3.connect(os.path.join(working_directory, user_database))
    df.to_sql('inventory_log', con=connection, if_exists='append', index=False)

    return json.jsonify(f'Updated {len(items)} items')


if __name__ == "__main__":
    app.run(debug = True, port = 4000)