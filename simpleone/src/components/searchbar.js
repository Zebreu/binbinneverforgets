import React, { useState, useEffect } from 'react';
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete'

export default function SearchBar () {
    const [results, setResults] = useState({'item': []});

    function parseData(data) {
        setResults(data);
        console.log(data);
    }

    function sendValue() {
        fetch('/suggestion', {
            headers : new Headers({'Authorization': `Bearer ${window.localStorage['usertoken']}`})
        })
            .then(res => res.json())
            .then(parseData);
    }

    useEffect(sendValue, []);

    function sendSelection(event, value, reason) {
        if (reason==="clear") {
            //do something
            sendValue(event)
        } else {
            console.log(event)
            console.log(value)
            console.log(reason)
            fetch('/search/'.concat('', value), {
                headers : new Headers({'Authorization': `Bearer ${window.localStorage['usertoken']}`})
            })
                .then(res => res.json())
                .then(parseData);
        }
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