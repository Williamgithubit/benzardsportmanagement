"use client";
import React, { useEffect, useState } from "react";
import { useAppSelector } from "@/store/store";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Counter from "@/components/ui/Counter";
import { motion } from "framer-motion";
import { getEvents, Event as EventType } from "@/services/eventService";

const Events = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const all = await getEvents();
        // show upcoming events only (status === 'upcoming' or startDate in the future)
        const now = new Date();
        const upcoming = all.filter(
          (e) => e.status === "upcoming" || (e.startDate && e.startDate > now)
        );
        setEvents(upcoming);
      } catch (err) {
        console.error(err);
        console.error('Failed to load events', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleEventRegister = (eventId: string) => {
    if (!isAuthenticated || !user) {
      alert("Please log in to register for events");
      return;
    }
    const event = events.find((e) => e.id === eventId);
    if (!event) {
      alert("Event not found");
      return;
    }
    if ((event.registrations || 0) >= (event.capacity || 0)) {
      alert("Sorry, this event is full");
      return;
    }
    alert(`Successfully registered for ${event.title}!`);
  };

  // stats
  const totalEvents = events.length;
  const totalParticipants = events.reduce(
    (s, e) => s + (e.registrations || 0),
    0
  );

  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#03045e] mb-4">
            Upcoming Football Events
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join our tournaments, training camps, and community outreach events
            to grow your skills and connect with the football community.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#000054]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {events.map((event) => (
              <Card key={event.id}>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-[#03045e] mb-2">
                        {event.title}
                      </h3>
                      <div className="flex items-center text-gray-600 mb-1">
                        <svg
                          className="h-5 w-5 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {event.startDate?.toLocaleDateString()} •{" "}
                        {event.startDate?.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <svg
                          className="h-5 w-5 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {event.location}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#03045e]">
                        {(event.capacity || 0) - (event.registrations || 0)}
                      </div>
                      <div className="text-sm text-gray-600">spots left</div>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-6">{event.description}</p>
                  <Button
                    onClick={() => handleEventRegister(event.id)}
                    fullWidth
                    className="bg-[#03045e] text-white hover:bg-[#68c2ca]"
                  >
                    Register Now
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-12 bg-gradient-to-r from-[#03045e] to-[#1a1a6e] rounded-2xl p-10 text-white overflow-hidden relative">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-2 text-center">
              Past Events Highlights
            </h2>
            <p className="text-blue-100 mb-8 text-center max-w-2xl mx-auto">
              Our impact in numbers - transforming lives through football and
              community engagement
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  number: totalEvents,
                  label: "Tournaments Hosted",
                  suffix: "+",
                  duration: 2000,
                },
                {
                  number: totalParticipants,
                  label: "Participants",
                  suffix: "+",
                  duration: 2500,
                },
                {
                  number: 90,
                  label: "Satisfaction Rate",
                  suffix: "%",
                  duration: 3000,
                },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <div className="text-4xl md:text-5xl font-bold text-white mb-3">
                    <Counter
                      end={stat.number}
                      suffix={stat.suffix}
                      duration={stat.duration}
                    />
                  </div>
                  <div className="text-blue-100 text-lg">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#ADF802] rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-[#03045e] rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        </div>
      </div>
    </div>
  );
};

export default Events;
