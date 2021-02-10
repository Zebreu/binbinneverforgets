import React, { useState, useEffect } from 'react';
import { Grid, Checkbox, FormControl, FormGroup, FormControlLabel, FormLabel, Button } from '@material-ui/core';
import moment from 'moment';

export default function TaskList() {
    const [checked, setChecked] = useState({});
    const [data, setData] = useState();



    function get_tasks() {
        fetch('api/get_tasks', { headers : 
            new Headers({'Authorization': `Bearer ${window.localStorage['usertoken']}`})})
            .then(res => res.json())
            .then(data => {
                var orderedDates = {};
                if (data['Past due']) {
                    orderedDates['Past due'] = data['Past due']
                }
                if (data['Today']) {
                    orderedDates['Today'] = data['Today']
                }
                
                if (data['This week']) {
                    orderedDates['This week'] = data['This week']
                }

                if (data['Next week']) {
                    orderedDates['Next week'] = data['Next week']
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

    function submitCompletedTasks() {
        //get_tasks(); // Swap with the line below if we're going to manage state better
        window.location.reload(true);
    }

    function buttonClick() {
        const formData = new FormData();
        formData.append("items", Object.keys(checked).filter(item => checked[item]))
        fetch('api/update_inventory_log', {
            method: "POST",
            body: formData,
            headers : new Headers({'Authorization': `Bearer ${window.localStorage['usertoken']}`})
        })
            .then(res => res.json())
            .then(data => {
                submitCompletedTasks();
            });
    }

    useEffect(() => {
        get_tasks();
    }, []);

    

    return (
        <div>
            <Grid container direction='row' justify='flex-end'>
            <Grid item>{<Button onClick={buttonClick} variant="contained" color='primary'>Submit</Button>}</Grid>
            </Grid>
            {data && Object.keys(data).map((date) =>
            (<div key={date}><FormLabel>{date}</FormLabel>
                    <FormGroup >
                        {data[date].map((task) =>
                        (<FormControlLabel key={task}
                            control={<Checkbox checked={checked[task] || false} onChange={handleChange} name={task} />}
                            label={task} />
                        ))}
                    </FormGroup>
            </div>))}
            
             
        </div>
    )
}