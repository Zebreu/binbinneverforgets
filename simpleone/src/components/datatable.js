import React, {useState, useEffect} from 'react';
import { Box, Button } from '@material-ui/core';
import { DataGrid } from '@material-ui/data-grid';

const columns = [
    { field: 'id', headerName: 'ID'},
    { field: 'firstName', headerName: 'First name'},
    { field: 'lastName', headerName: 'Last name', width:120},
    {
      field: 'age',
      headerName: 'Age',
      type: 'number',
      width: 60,
    },
    {
      field: 'fullName',
      headerName: 'Full name',
      description: 'This column has a value getter and is not sortable.',
      sortable: false,
      width: 160,
      valueGetter: (params) =>
        `${params.getValue('firstName') || ''} ${params.getValue('lastName') || ''}`,
    },
  ];
  
const rows = [
    { id: 1, lastName: 'Clifford', firstName: 'Ferrara', age: 44 },
    { id: 2, lastName: 'Frances', firstName: 'Rossini', age: 36 },
    { id: 3, lastName: 'Roxie', firstName: 'Harvey', age: 65 },
    { id: 4, lastName: 'Clifford', firstName: 'Ferrara', age: 44 },
    { id: 5, lastName: 'Frances', firstName: 'Rossini', age: 36 },
    { id: 6, lastName: 'Roxie', firstName: 'Harvey', age: 65 },
];

export default function OwnDataTable() {
    const [report, setReport] = useState();
    const [selection, setSelection] = useState([]);

    function get_report() {
        fetch('/create_report')
        .then(res => res.json())
        .then(data => {setReport(data);});
    };

    useEffect(() => {
        get_report();
    }, []);

    return (
 
        <div style={{ height: 400, width: '100%' }}>
        <DataGrid rows={rows} columns={columns} 
        pageSize={5} 
        checkboxSelection       
        onSelectionChange={(newSelection) => {
          setSelection(newSelection.rowIds);
        }}
        
        />
        <Box pt={40.5} textAlign='left' pl={2}>
        <Button variant='contained' color='primary' onClick={() => (alert(selection))}>Check</Button>
        </Box>
        </div>

    );
}