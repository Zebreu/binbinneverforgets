import pandas as pd
import sqlite3
import random

from flask import Flask
app = Flask(__name__)

@app.route('/')
def hello_world():
    return 'Hello, World!'


@app.route('/read')
def read():
    df = pd.read_csv('horaire_data.csv')
    df['date'] = pd.to_datetime(df['date'])
    connection = sqlite3.connect('database.db')
    df[['date', 'produit']].to_sql('inventory_check', con=connection, if_exists='append', index=False)

    checks = pd.read_sql('SELECT * from inventory_check', con = connection)
    checks['date'] = pd.to_datetime(checks['date'])
    last_checked = checks.sort_values('date').groupby(['produit']).last().reset_index()

    merged = df.merge(last_checked, on='produit', suffixes=('_initial','_checked'))
    today = pd.Timestamp.today()
    merged['week_difference'] = (today - merged['date_checked']).dt.days/7 
    
    merged['need_to_check'] = merged['week_difference'] > merged['horaire']

    schedules = []
    for i, row in merged.iterrows():
        schedule = pd.date_range(row['date_checked'], today+pd.Timedelta(52, 'W'), freq=f'{row["horaire"]*7}D')
        schedule = schedule[schedule >= today]
        schedules.append(schedule)

    total = []
    for schedule in schedules:
        for day in schedule:
            total.append((day, 1))

    schedule_df = pd.DataFrame(total, columns=['date', 'check'])

    schedule_series = pd.Series(schedule_df['check'])
    schedule_series.index = schedule_df['date']

    print(merged)
    return 'I have read something'

if __name__ == "__main__":
    app.run()