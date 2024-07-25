"use client"
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin, { Draggable, DropArg } from '@fullcalendar/interaction'
import timeGridPlugin from '@fullcalendar/timegrid'
import { Fragment, useEffect, useState } from 'react'

import { Dialog, Transition } from '@headlessui/react'
import { CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/20/solid'
import { EventSourceInput } from '@fullcalendar/core/index.js'
import { useRouter } from 'next/router'

interface Event {
  title: string;
  start: Date | string;
  end: Date | string;
  id: number;
}

export default function Home() {
  const router= useRouter();
const {id} = router.query;


  const [events, setEvents] = useState([
    { title: 'Une journée présentielle', id: '1' },
    { title: 'Une journée en ligne', id: '2' },
    { title: 'Réunion avec encadrant', id: '3' },
    { title: 'Réunion avec responsable stage', id: '4' },
    { title: 'Présentation', id: '5' },
  ])
  
  const [allEvents, setAllEvents] = useState<Event[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [idToDelete, setIdToDelete] = useState<number | null>(null)
  const [newEvent, setNewEvent] = useState<Event>({
    title: '',
    start: '',
    end: '',
    id: 0
  })
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch(`/api/calendar?personId=${id}`);
        const data = await response.json();
       if (response.ok) {
        setAllEvents(data.allEvents.map(event => ({
          title: event.title,
          start: event.start,
          end: event.end,
        })));
       } else {
        console.error('Error fetching events:', data.error);
       }
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    }
    
    if (id) {
      fetchEvents();
    }
  }, [id]);
  useEffect(() => {
    let draggableEl = document.getElementById('draggable-el')
    if (draggableEl) {
      new Draggable(draggableEl, {
        itemSelector: ".fc-event",
        eventData: function (eventEl) {
          let title = eventEl.getAttribute("title")
          let id = eventEl.getAttribute("data")
          let start = eventEl.getAttribute("start")
          let end= eventEl.getAttribute("end")
          return { title, id, start, end }
        }
      })
    }
    const handleDragStart = () => {
      document.body.style.cursor = 'move';
    };
  
    const handleDragEnd = () => {
      document.body.style.cursor = 'default';
    };
  
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('dragend', handleDragEnd);
  
    return () => {
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('dragend', handleDragEnd);
    };
  }, [])


  async function sendEventToAPI(event: Event) {
    console.log('Sending event to API:', event);
    try {
        const start = event.start instanceof Date ? event.start.toISOString() : event.start;
        const end = event.end instanceof Date ? event.end.toISOString() : event.end;

        const response = await fetch('/api/calendar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                personId: id,
                event: {
                    title: event.title,
                    start: start,
                    end: end,
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error('Error adding event: ' + errorText);
        }
        console.log('Event added successfully');
    } catch (error) {
        console.error('Error submitting event:', error);
    }
}
async function sendEventToAPIManual(eventData) {
  try {
      const response = await fetch('/api/calendar', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
      });

      if (!response.ok) {
          const errorText = await response.text();
          throw new Error('Error adding event: ' + errorText);
      }
      console.log('Event added successfully');
  } catch (error) {
      console.error('Error submitting event:', error);
  }
} 

  function handleDateClick(arg: { date: Date; allDay: boolean }) {
    const newEvent= {
      title:'',
      start: arg.date,
      id: new Date().getTime(),
    };
    setNewEvent(newEvent);
    setShowModal(true);
  }


  function addEvent(data: DropArg) {
    const event = {
      ...newEvent,
      start: data.date.toISOString(),
      title: data.draggedEl.innerText,
      end: data.date.toISOString(),
      id: new Date().getTime(),
    };
    
    setAllEvents([...allEvents, event]);
    console.log('Event added:', event);
    sendEventToAPI(event);
  }

  
  

  function handleDeleteModal(event) {
    setSelectedEvent(event);
    setShowDeleteModal(true);
  }


  async function handleDelete() {
    if (!selectedEvent) return;
  
    try {
      const response = await fetch('/api/calendar', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personId: id,
          title: selectedEvent.title,
          start: selectedEvent.start
        }),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('Error deleting event: ' + errorText);
      }
      setAllEvents(
        allEvents.filter(
          (event) => event.title !== selectedEvent.title || event.start !== selectedEvent.start
        )
      );
      setShowDeleteModal(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  }
  


  function handleCloseModal() {
    setShowModal(false)
    setNewEvent({
      title: '',
      start: '',
      end: '',
      id: 0
    })
    setShowDeleteModal(false)
    setIdToDelete(null)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setNewEvent({
      ...newEvent,
      title: e.target.value
    })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    let start = newEvent.start instanceof Date ? newEvent.start.toISOString() : newEvent.start;
    let end = newEvent.end instanceof Date ? newEvent.end.toISOString() : newEvent.end;

    if (!end || !start) {
        console.error('End/start date is missing');
        if (!end) { end = 'Not specified' }
        if (!start) { start = 'Not specified' }
    }

    const formattedEvent = {
        start: start,
        title: newEvent.title,
        end: end,
    };

    setAllEvents([...allEvents, { ...newEvent, start: formattedEvent.start, end: formattedEvent.end }]);


    const dataToSend = {
        personId: id,
        event: formattedEvent,
    };

    try {
        await sendEventToAPIManual(dataToSend);
        console.log('Event successfully added');
        setShowModal(false);
        setNewEvent({
            title: '',
            start: '',
            end: '',
            id: 0,
        });
    } catch (error) {
        console.error('Error adding event:', error);
    }
}
  
  return (
    <>
      <nav className="flex justify-between mb-12 border-b border-violet-100 p-4">
        <h1 className="font-bold text-2xl text-gray-700">Calendrier</h1>
      </nav>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="grid grid-cols-10">
          <div className="col-span-8">
            <FullCalendar
              plugins={[
                dayGridPlugin,
                interactionPlugin,
                timeGridPlugin
              ]}
              initialView={"dayGridMonth"}
              headerToolbar={{
                start: "today prev,next", 
                center: "title",
                end: "dayGridMonth",
                //end:"dayGridMonth, timeGridWeek, timeGridDay",
              }}
              events={allEvents as EventSourceInput}
              nowIndicator={true}
              editable={true}
              droppable={true}
              selectable={true}
              selectMirror={true}
              dateClick={handleDateClick}
              drop={(data) => addEvent(data)}
              eventClick={(info) => {
                setSelectedEvent({
                  title: info.event.title,
                  start: info.event.start.toISOString(),
                  end: info.event.end ? info.event.end.toISOString() : '',
                  id: info.event.id ? parseInt(info.event.id, 10) : 0,
                });
                setShowDeleteModal(true);
              }}
              eventDrop={(info) => {
                const updatedEvent = {
                  ...info.event,
                  start: info.event.start.toISOString(),
                  end: info.event.end ? info.event.end.toISOString() : '',
                };
                sendEventToAPI({
                  title: updatedEvent.title,
                  start: updatedEvent.start,
                  end: updatedEvent.end,
                  id: parseInt(updatedEvent.id, 10),
                });
              }}
              eventContent={(arg) => {
                const { event } = arg;
                return (
                  <div className="fc-event-content">
                    <div className="fc-event-title">
                      {event.title}
                    </div>
                  </div>
                );
              }}
            />
          </div>
          <div id="draggable-el" className="ml-8 w-full md:w-0.09 border-2 p-2 rounded-md mt-16 lg:h-1/2 bg-violet-50">
            <h1 className="font-bold text-lg text-center">Drag event</h1>
            {events.map(event => (
              <div
                className="fc-event border-2 p-1 m-2 w-full rounded-md ml-auto text-center bg-white"
                title={event.title}
                key={event.id}
                style={{ cursor: 'pointer' }}
              >
                {event.title}
              </div>
            ))}
          </div>
        </div>

        <Transition.Root show={showDeleteModal} as={Fragment}>
          <Dialog as="div" className="relative z-10" onClose={setShowDeleteModal}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"

            >
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>

            <div className="fixed inset-0 z-10 overflow-y-auto">
              <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                  enterTo="opacity-100 translate-y-0 sm:scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                  leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                >
                  <Dialog.Panel className="relative transform overflow-hidden rounded-lg
                   bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
                  >
                    <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                      <div className="sm:flex sm:items-start">
                        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center 
                      justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                          <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                        </div>
                        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                          <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                            Suppression d'un événement
                          </Dialog.Title>
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">
                              Etes-vous sûr de vouloir supprimer cet événement?
                            </p>
                            <p className="text-sm text-gray-500">
                                <strong>{selectedEvent?.title}</strong>
                           </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                      <button type="button" className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm 
                      font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto" onClick={handleDelete}>
                        Supprimer
                      </button>
                      <button type="button" className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 
                      shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                        onClick={handleCloseModal}
                      >
                        Annuler
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition.Root>

        <Transition.Root show={showModal} as={Fragment}>
          <Dialog as="div" className="relative z-10" onClose={setShowModal}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>

            <div className="fixed inset-0 z-10 overflow-y-auto">
              <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                  enterTo="opacity-100 translate-y-0 sm:scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                  leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                >
                  <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                    <div>
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <CheckIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
                      </div>
                      <div className="mt-3 text-center sm:mt-5">
                        <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                          L'ajout d'un événement
                        </Dialog.Title>
                        <form action="submit" onSubmit={handleSubmit}>
                          <div className="mt-2">
                            <input type="text" name="title" className="block w-full rounded-md border-0 py-1.5 text-gray-900 
                            shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 
                            focus:ring-2 
                            focus:ring-inset focus:ring-violet-600 
                            sm:text-sm sm:leading-6"
                              value={newEvent.title} onChange={(e) => handleChange(e)} placeholder="Title" />
                          </div>
                          <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                            <button
                              type="submit"
                              className="inline-flex w-full justify-center rounded-md bg-violet-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 sm:col-start-2 disabled:opacity-25"
                              disabled={newEvent.title === ''}
                            >
                              Ajouter
                            </button>
                            <button
                              type="button"
                              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                              onClick={handleCloseModal}

                            >
                              Annuler
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition.Root>
      </main >
    </>
  )
}