import React, { useEffect, useState } from 'react';
import { Calendar, momentLocalizer, Event } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';

const localizer = momentLocalizer(moment);

interface ScheduleEvent extends Event {
  _id: string;
  title: string;
  date: string;
  notes: string;
}

const StudentSchedule: React.FC = () => {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const studentId = JSON.parse(localStorage.getItem('user') || '{}')._id;

  const fetchSchedule = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`http://localhost:3000/api/schedule/student/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching student schedule:', error);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  return (
    <div>
      <h3>Ваше расписание</h3>
      <Calendar
        localizer={localizer}
        events={events.map(event => ({
          ...event,
          start: new Date(event.date),
          end: new Date(event.date)
        }))}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
      />
    </div>
  );
};

export default StudentSchedule;
