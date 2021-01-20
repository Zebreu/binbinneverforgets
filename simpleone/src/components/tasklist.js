import React, {useState, useEffect } from 'react';
import { Checkbox, FormControl, FormGroup, FormControlLabel, FormLabel, Button } from '@material-ui/core';

export default function TaskList() {
    const [checked, setChecked] = useState({});
    const [data, setData] = useState();

    function get_tasks() {
        fetch('/get_tasks')
        .then(res => res.json())
        .then(data => {
            setData(data);
            // data looks like this: {'somedate': ['sometask', (...)], 'someotherdate': ['tasks', (...)]}
            let allTasks = {}
            if (data) {
                let dates = Object.keys(data)
                dates.forEach(date => {
                    // Then push each item to check as the next row under the date
                    data[date].forEach(item_to_check =>  allTasks[item_to_check] = false)
                })
                setChecked(allTasks);
            }
        })
    }
    
    function handleChange(event) {
        const item = event.target.name;
        const isChecked = event.target.checked;
        setChecked({...checked, [item]: isChecked});
        console.log(checked)
    }

    function buttonClick() {
        const formData = new FormData();
        formData.append("items", Object.keys(checked).filter(item => checked[item]))
        fetch('/update_inventory_log', {
            method: "POST",  
            body: formData})
        .then(res => res.json())
        .then(data => {
            console.log(data); 
            get_tasks()});
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
                        control={<Checkbox onChange={handleChange} name={task} />}
                        label={task} />
                        ))}
                </FormGroup>
            </FormControl>
            <br/>
            </span>))}
            <FormGroup>
                <FormControlLabel
                    control={<Button onClick={buttonClick} variant="contained" color="primary">Submit</Button>}
                    />
            </FormGroup>
        </div>
    )
}