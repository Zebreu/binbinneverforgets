import React, { useState, useEffect } from 'react';
import { Checkbox, FormControl, FormGroup, FormControlLabel, FormLabel, Button } from '@material-ui/core';
import moment from 'moment';

export default function TaskList() {
    const [checked, setChecked] = useState({});
    const [data, setData] = useState();

    function get_tasks() {
        fetch('/get_tasks')
            .then(res => res.json())
            .then(data => {
                var orderedDates = {};
                if (data['Past Due']) {
                    orderedDates['Past Due'] = data['Past Due']
                }
                if (data['Today']) {
                    orderedDates['Today'] = data['Today']
                }
                
                Object.keys(data).sort(function (a, b) {
                    return moment(a, 'dddd, MMMM D').toDate() - moment(b, 'dddd, MMMM D').toDate();
                }).forEach(function (key) {
                    orderedDates[key] = data[key];
                })
                setData(orderedDates);
                console.log(data)
                // data looks like this: {'somedate': ['sometask', (...)], 'someotherdate': ['tasks', (...)]}
                let allTasks = {}
                if (data) {
                    let dates = Object.keys(data)
                    dates.forEach(date => {
                        // Then push each item to check as the next row under the date
                        data[date].forEach(item_to_check => allTasks[item_to_check] = false)
                    })
                    setChecked(allTasks);
                }
            })
    }

    function handleChange(event) {
        const item = event.target.name;
        const isChecked = event.target.checked;
        setChecked({ ...checked, [item]: isChecked });
        console.log(checked)
    }

    function buttonClick() {
        const formData = new FormData();
        formData.append("items", Object.keys(checked).filter(item => checked[item]))
        fetch('/update_inventory_log', {
            method: "POST",
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                console.log(data);
                get_tasks()
            });
    }

    useEffect(() => {
        get_tasks();
    }, []);

    return (
        <div>
            {data && Object.keys(data).map((date) =>
            (<span>
                <FormControl component='fieldset'>
                    <FormLabel component='legend'>{date}</FormLabel>
                    <FormGroup>
                        {data[date].map((task) =>
                        (<FormControlLabel
                            control={<Checkbox checked={checked[task] || false} onChange={handleChange} name={task} />}
                            label={task} />
                        ))}
                    </FormGroup>
                </FormControl>
                <br />
            </span>))}
            <FormGroup>
                <FormControlLabel
                    control={<Button onClick={buttonClick} variant="contained" color="primary">Submit</Button>}
                />
            </FormGroup>
        </div>
    )
}