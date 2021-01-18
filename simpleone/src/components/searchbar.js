import React, { useState, useEffect } from 'react';
import TextField from '@material-ui/core/TextField';

export default function SearchBar () {
    const [text, setText] = useState('Search');
    const [results, setResults] = useState([]);
    /*
    function get_events() {
        fetch('/upcoming_items')
        .then(res => res.json())
        .then(data => {setEvents(data);});
    };
    */


    function on_change() {
        console.log("peen")
        //fetch('/search/'.concat('', text))
        //.then(res => res.json())
        //.then(data => {setResults(data); console.log(results);});
    }

    //useEffect(get_events, []);
``` not sure how much of it is necessary, like the method or whatever
and not 100% sure it works without axios on a get.
let url = '/search';
let params = {body: {myface: 'face'}, method: "GET"}
fetch(url, params)
```
    return (
        <div> 
            <TextField
                id="search-bar" label="Search" variant="outlined"
                onChange= {on_change}
            />
        </div>
    );
}