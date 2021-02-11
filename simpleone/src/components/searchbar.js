import React, { useState } from 'react';
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete'

export default function SearchBar () {
    const [results, setResults] = useState({'item': []});

    function parseData(data) {
        setResults(data);
        console.log(data);
    }

    function sendValue(event) {
        console.log(event.target.value)
        fetch('/suggestion', {
            headers : new Headers({'Authorization': `Bearer ${window.localStorage['usertoken']}`})
        })
            .then(res => res.json())
            .then(parseData);
    }

    function sendSelection(event, value, reason) {
        console.log(event)
        console.log(value)
        console.log(reason)
        fetch('/search/'.concat('', value), {
            headers : new Headers({'Authorization': `Bearer ${window.localStorage['usertoken']}`})
        })
            .then(res => res.json())
            .then(parseData);
    }

    return (
        <div style={{ width: 300 }}> 
            <Autocomplete
                id = "search-bar"
                freeSolo
                onChange = {sendSelection}
                options = {results.item}
                renderInput = {(params) => (
                    <TextField {...params} label = "Search" variant = "outlined" onChange = {sendValue} />
                )}
            />
        </div>
    );
}