import React, {useState, useEffect } from 'react';
import { Box, Button } from '@material-ui/core';
import { DataGrid } from '@material-ui/data-grid';


export default function OwnDataTable(props) {
    const [selection, setSelection] = useState([]);

    useEffect(() => {
      console.log(props)
    })

    return (
 
        <div style={{ height: 400, width: '100%' }}>
            <DataGrid rows={props.rows || []} columns={props.columns || []} 
            pageSize={10} 
            // checkboxSelection       
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