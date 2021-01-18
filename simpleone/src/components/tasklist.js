import React, {useState, useEffect, Fragment} from 'react';
import FreeformTable from './freeformtable';
import OwnDataTable from './datatable';
import { Checkbox } from '@material-ui/core';

export default function TaskList() {
    const [tasks, setTasks] = useState();
    const [columns, setColumns] = useState();
    
    function get_tasks() {
        fetch('/get_tasks')
        .then(res => res.json())
        .then(data => {
            console.log(data, 'data')
            let rows = []
            let dates = Object.keys(data)
            console.log(dates, 'dates')
            if (data) {
                dates.forEach(date => {

                    console.log('entering, should push')
                    rows.push({id: rows.length, item: date})
                    data[date].forEach(item_to_check => rows.push({id: rows.length, item: item_to_check}))
                })
                console.log(rows)
                setTasks(rows);
                let column_def = {
                    field: 'item',
                    headerName: 'Items',
                    flex: 1,
                    renderCell: (params) => (
                        (Date.parse(params.value) ? <strong>{(params.value)}</strong> : 
                        <span><Checkbox></Checkbox>{(params.value)}</span>)

                    )
                }
                // setColumns([{ field: 'item', headerName: 'Items', flex: 1}])
                setColumns([column_def])
            }

        })
    }

    useEffect(() => {
        console.log('useEfdfssect')
        get_tasks();
    }, []);

    return (
        <Fragment> 
            Tasks
            {/* <FreeformTable rows={tasks} columns={columns} /> */}
            <OwnDataTable columns={columns} rows={tasks}/>
        </Fragment>
        
    )
}