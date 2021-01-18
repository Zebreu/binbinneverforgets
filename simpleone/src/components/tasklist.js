import React, {useState, useEffect, Fragment} from 'react';
import OwnDataTable from './datatable';
import { Checkbox } from '@material-ui/core';

export default function TaskList() {
    const [tasks, setTasks] = useState();
    const [columns, setColumns] = useState();
    
    function get_tasks() {
        fetch('/get_tasks')
        .then(res => res.json())
        .then(data => {
            // data looks like this: {'somedate': ['sometask', (...)], 'someotherdate': ['tasks', (...)]}
            
            // Define column
            let column_def = {
                field: 'item',
                headerName: 'Items',
                flex: 1,
                renderCell: (params) => (
                    (Date.parse(params.value) ? <strong>{(params.value)}</strong> : 
                    <span><Checkbox></Checkbox>{(params.value)}</span>)

                )
            }
            setColumns([column_def])
            
            // Figure out the rows
            let rows = []
            if (data) {
                let dates = Object.keys(data)
                dates.forEach(date => {
                    // For each date, push the date row first
                    rows.push({id: rows.length, item: date})
                    // Then push each item to check as the next row under the date
                    data[date].forEach(item_to_check => rows.push({id: rows.length, item: item_to_check}))
                })
                setTasks(rows); // tasks looks like this [{id: 1, item: 'nameofthingtocheck'}, (...)]
                
            }

        })
    }
    
    useEffect(() => {
        get_tasks();
    }, []);

    return (
        <Fragment> 
            <OwnDataTable columns={columns} rows={tasks}/>
        </Fragment>
        
    )
}