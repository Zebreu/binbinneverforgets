import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from "@fullcalendar/interaction";

function handleDateClick (arg) { alert(arg.dateStr)}

function MyCalendar (props) {
    const [value, onChange] = useState(new Date());
    const [events, setEvents] = useState([]);
    const style = {backgroudColor: 'white'}      

    function get_events() {
        fetch('/upcoming_items', { headers : 
            new Headers({'Authorization': `Bearer ${window.localStorage['usertoken']}`})})
        .then(res => res.json())
        .then(data => {setEvents(data);});
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