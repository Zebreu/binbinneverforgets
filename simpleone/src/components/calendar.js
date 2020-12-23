import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { Calendar as BigCalendar, momentLocalizer  } from 'react-big-calendar' 
import 'react-calendar/dist/Calendar.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment';
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from "@fullcalendar/interaction";

function handleDateClick (arg) { alert(arg.dateStr)}

function MyCalendar (props) {
    const localizer = momentLocalizer(moment);
    console.log(localizer)
    const [value, onChange] = useState(new Date());
    const myEventsList = [];
    const style = {backgroudColor: 'white'}      
    return (
        <div>
            

  <FullCalendar
        plugins={[ dayGridPlugin, interactionPlugin ]}
        initialView="dayGridMonth"
        weekends={false}
        events={[
            { title: 'event 1', date: '2020-12-01' },
            { title: 'event 2', date: '2020-12-02' }
        ]}
        dateClick={handleDateClick}
      />
  </div>

        
    );
      
}

function getFormatDate(date) {
    return `${date.getFullYear()}${('0' + (date.getMonth() + 1)).slice(-2)}${('0' + date.getDate()).slice(-2)}`;
};


export default MyCalendar