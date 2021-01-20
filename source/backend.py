import sqlite3
import os
import hashlib

import pandas as pd
from flask import Flask, request, json, render_template, send_from_directory, abort, g
from passlib.apps import custom_app_context as pwd_context
from flask_httpauth import HTTPBasicAuth

auth = HTTPBasicAuth()

working_directory = os.path.dirname(__file__)

app = Flask(__name__) 

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


def generate_upcoming_tasks(merged):
    """Generates upcoming tasks given information about last checked dates and master data."""
    
    today = pd.Timestamp.today()

    schedules = []
    for i, row in merged.iterrows():
        schedule = pd.date_range(row['date_checked'], today+pd.Timedelta(13, 'W'), freq=f'{row["frequency"]*7}D')
        schedule = schedule[schedule >= today]
        schedules.append((row['item'],schedule))

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
    users = pd.read_sql('select * from users', 
        con = connection, 
        params={"username": username})
    
    if len(users) == 0:
        return False

    encrypted_password = users['password'].iloc[0]
    g.user = username
    return pwd_context.verify(password, encrypted_password)


def create_user(username, password):
    """Creates a user in the database including its own set of tables."""
    connection = sqlite3.connect(os.path.join(working_directory, master_database))
    try:
        existing_users = pd.read_sql('select * from users', con = connection)
    except:
        existing_users = []

    current_id = len(existing_users) + 1 # we don't depend on id input anywhere so it's fine to not use better UUIDs

    if len(existing_users) > 0:
        if username in existing_users['username']:
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


@app.route('/route_ben_secrete_because_it_crashes')
def crash_me():
    a = 3442/0
    return 'help'


@app.route('/')
def hello_world():
    return render_template("index.html")


@app.route('/users/register', methods=['POST'])
def register_user():
    username = request.json.get('username')
    password = request.json.get('password')
    if username is None or password is None:
        abort(400)
    
    created = create_user(username, password)
    
    return json.jsonify({ 'username_created': created })
    

@app.route('/search/<name>')
@auth.login_required
def search_rx(name):
    """Queries the DB for the relevant rows, based on search bar"""
    user_database = get_user_database_name(g.user)
    try:
        connection = sqlite3.connect(os.path.join(working_directory, user_database))
        inventory = pd.read_sql('SELECT * from inventory_log', con = connection)
        checks_count = len(inventory[inventory['item'] == name].index)
        search_return_dict = {"checks_count": checks_count}
        # What else should we return when someone asks for information about an item?
        # TODO: Name, last_check, next_check, need_to_check?
        search_return_dict["name"] = name
        last_checked = inventory[inventory['item'] == name]["date"].max()
        search_return_dict["last_checked"] = last_checked
        merged = inspect_inventory_log(username = g.user)
        need_to_check = merged[merged['item'] == name].iloc[0]['need_to_check'].astype(str)
        search_return_dict["need_to_check"] = need_to_check
        # Maybe also add the median time between checks
    except:
        search_return_dict = {}
    return json.jsonify(search_return_dict)


@app.route('/upload_master_data', methods=['POST'])
@auth.login_required
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


@app.route('/upcoming_items')
@auth.login_required
def get_upcoming_items():
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
    except:
        return_values = []
    return json.jsonify(return_values)


@app.route('/create_report')
@auth.login_required
def create_report():
    """Creates a report of due checks."""
    merged = inspect_inventory_log(username = g.user)    
    
    merged.insert(0, 'id', pd.RangeIndex(len(merged)))
    merged['need_to_check'] = merged['need_to_check'].astype(str)

    return merged.to_json(orient='split', index=False)


@app.route('/update_inventory_log', methods=['POST'])
@auth.login_required
def update_inventory_log():
    """Update the inventory log given a form with items and the time of their most recent check."""
    
    items = request.form.getlist('items')
    dates = request.form.getlist('dates')
    
    df = pd.DataFrame(columns=['date', 'item'])
    df['date'] = dates
    df['item'] = items

    user_database = get_user_database_name(username = g.user)
    connection = sqlite3.connect(os.path.join(working_directory, user_database))
    df.to_sql('inventory_log', con=connection, if_exists='append', index=False)

    return f'Updated {len(items)} items'


if __name__ == "__main__":
    app.run(debug=True,port=4000)

# http://127.0.0.1:4000/create_report