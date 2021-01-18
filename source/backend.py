import sqlite3
import os

import pandas as pd
from flask import Flask, request, json, render_template, send_from_directory

working_directory = os.path.dirname(__file__)

app = Flask(__name__) 


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


def inspect_inventory_log():
    """Gathers observations and master data."""
    today = pd.Timestamp.today()
    
    connection = sqlite3.connect(os.path.join(working_directory,'database.db'))
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


@app.route('/')
def hello_world():
    return render_template("index.html")


@app.route('/search/<name>')
def search_rx(name):
    """Queries the DB for the relevant rows, based on search bar"""
    connection = sqlite3.connect(os.path.join(working_directory, 'database.db'))
    inventory = pd.read_sql('SELECT * from inventory_log', con = connection)
    checks_count = len(inventory[inventory['item'] == name].index)
    search_return_dict = {"checks_count": checks_count}
    # What else should we return when someone asks for information about an item?
    # TODO: Name, last_check, next_check, need_to_check?
    search_return_dict = {"name": name}
    last_checked = inventory[inventory['item'] == name]["date"].max()
    search_return_dict = {"last_checked": last_checked}
    merged = inspect_inventory_log()
    need_to_check = merged[merged['item'] == name]['need_to_check']
    search_return_dict = {"need_to_check", need_to_check}
    return json.jsonify(search_return_dict)


@app.route('/upload_master_data', methods=['POST'])
def upload_master_data(inventory_checked=True):
    """Updates a master table from an input file."""
    today = pd.Timestamp.today()

    #df = pd.read_csv(os.path.join(working_directory, 'horaire_data.csv'))
    
    csv = request.files.get('file')
    csv.save('temporary_file.csv')
    df = pd.read_csv('temporary_file.csv')
    
    df['date'] = pd.to_datetime(df['date'])
    df['date_added'] = today

    connection = sqlite3.connect(os.path.join(working_directory, 'database.db'))
    df.to_sql('master_data', con=connection, if_exists='append', index=False)
    
    if inventory_checked:
        df[['date', 'item']].to_sql('inventory_log', con=connection, if_exists='append', index=False)
    
    return df.to_json(orient='split', index=False)


@app.route('/upcoming_items')
def get_upcoming_items():
    """Creates a schedule ahead of time."""
    try:
        merged = inspect_inventory_log()
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
def create_report():
    """Creates a report of due checks."""
    merged = inspect_inventory_log()    
    
    merged.insert(0, 'id', pd.RangeIndex(len(merged)))
    merged['need_to_check'] = merged['need_to_check'].astype(str)

    return merged.to_json(orient='split', index=False)


@app.route('/update_inventory_log', methods=['POST'])
def update_inventory_log():
    """Update the inventory log given a form with items and the time of their most recent check."""
    
    items = request.form.getlist('items')
    dates = request.form.getlist('dates')
    
    df = pd.DataFrame(columns=['date', 'item'])
    df['date'] = dates
    df['item'] = items

    connection = sqlite3.connect(os.path.join(working_directory,'database.db'))
    df.to_sql('inventory_log', con=connection, if_exists='append', index=False)

    return f'Updated {len(items)} items'


if __name__ == "__main__":
    app.run("0.0.0.0",debug=True,port=5000)
