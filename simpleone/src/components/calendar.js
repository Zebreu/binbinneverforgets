import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from "@fullcalendar/interaction";

function handleDateClick (arg) {
    fetch('/day_log/'+arg.dateStr, { headers : 
        new Headers({'Authorization': `Bearer ${window.localStorage['usertoken']}`})})
    .then(res => res.json())
    .then(date => console.log(date))
}

function MyCalendar (props) {
    const [events, setEvents] = useState([]);    

    function get_events() {
        fetch('/all_events', { headers : 
            new Headers({'Authorization': `Bearer ${window.localStorage['usertoken']}`})})
        .then(res => res.json())
        .then(data => {setEvents(data);console.log(data)});
    };

    useEffect(get_events, []);

    return (
        <div>            
        <FullCalendar
            plugins={[ dayGridPlugin, interactionPlugin ]}
            initialView="dayGridMonth"
            firstDay="1"
            weekends={true}
            events={events}
            dateClick={handleDateClick}
            height={700}
        />
        </div>
    );
}
export default MyCalendar