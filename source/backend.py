import sqlite3
import os

import pandas as pd
from flask import Flask
from flask import request


app = Flask(__name__)

working_directory = os.path.dirname(__file__)

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
        schedule = pd.date_range(row['date_checked'], today+pd.Timedelta(52, 'W'), freq=f'{row["frequency"]*7}D')
        schedule = schedule[schedule >= today]
        schedules.append((row['item'],schedule))

    return schedules


@app.route('/')
def hello_world():
    return 'Binbin never forgets!'


@app.route('/read_master_data')
def read_master_data(inventory_checked = True):
    """Updates a master table from an input file."""
    
    today = pd.Timestamp.today()

    df = pd.read_csv(os.path.join(working_directory, 'horaire_data.csv'))
    df['date'] = pd.to_datetime(df['date'])
    df['date_added'] = today

    connection = sqlite3.connect(os.path.join(working_directory, 'database.db'))
    df.to_sql('master_data', con=connection, if_exists='append', index=False)
    
    if inventory_checked:
        df[['date', 'item']].to_sql('inventory_log', con=connection, if_exists='append', index=False)
    
    return df.to_json(orient='split', index=False)


@app.route('/create_report')
def create_report():
    """Creates a report of upcoming checks."""

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
    print(merged)
    
    schedules = generate_upcoming_tasks(merged)
    heatmap = create_heatmap(schedules)

    print(schedules)
    print(heatmap)

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
    app.run(debug=True)
