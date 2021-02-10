import React, { useState, useEffect } from 'react';
import TextField from '@material-ui/core/TextField';

export default function SearchBar () {
    const [results, setResults] = useState({});

    function parseData(data) {
        setResults(data);
        console.log(data);
    }

    function sendValue(event) {

        fetch('api/search/'.concat('', event.target.value))
            .then(res => res.json())
            .then(parseData);
    }

    return (
        <div> 
            <TextField
                id="search-bar" label="Search" variant="outlined"
                onChange= {sendValue}
            />
        </div>
    );
}