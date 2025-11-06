'use client';
import HeroSection from "@/components/shared/HeroSection";
import StatsSection from "@/components/shared/StatsSection";
import Card from "@/components/ui/Card";
import TestimonialCard from "@/components/ui/TestimonialCard";
import {
  FaFutbol,
  FaTrophy,
  FaRunning,
  FaUsers,
} from "react-icons/fa";
import { GiSoccerField } from "react-icons/gi";

const Home = () => {
  const programs = [
    {
      id: 1,
      title: "Athlete Scouting Program",
      description:
        "Discover and nurture young football talent across Liberia with professional scouting and mentorship from FIFA-licensed coaches.",
      duration: "Ongoing",
      level: "All Levels",
      icon: <FaFutbol className="text-4xl mb-4 text-[#03045e]" />
    },
    {
      id: 2,
      title: "Elite Training Academy",
      description:
        "Intensive football training programs focusing on skills, fitness, and tactics to prepare athletes for professional and grassroots competitions.",
      duration: "12 weeks",
      level: "Intermediate",
      icon: <FaRunning className="text-4xl mb-4 text-[#03045e]" />
    },
    {
      id: 3,
      title: "Tournament & Event Management",
      description:
        "Organize and participate in local and regional football tournaments, fostering community engagement and showcasing talent.",
      duration: "Event-Based",
      level: "All Levels",
      icon: <FaTrophy className="text-4xl mb-4 text-[#03045e]" />
    },
    {
      id: 4,
      title: "Community Outreach Program",
      description:
        "Support grassroots football through equipment donations, workshops, and community events to empower young athletes.",
      duration: "Ongoing",
      level: "Beginner",
      icon: <FaUsers className="text-4xl mb-4 text-[#03045e]" />
    },
  ];

  const testimonials = [
    {
      name: "Emmanuel Saye",
      role: "Aspiring Footballer",
      content:
        "BSM's scouting program gave me the chance to train with top coaches. I'm now playing for Benzard FC and dreaming big!",
      image: "https://placehold.co/80x80/68c2ca/ffffff?text=ES",
      icon: <FaFutbol className="text-2xl text-[#68c2ca]" />,
    },
    {
      name: "Grace Toe",
      role: "Youth Coach",
      content:
        "The training academy helped me develop my coaching skills, and now I'm mentoring young players to reach their potential.",
      image: "https://placehold.co/80x80/03045e/ffffff?text=GT",
      icon: <FaRunning className="text-2xl text-[#68c2ca]" />,
    },
    {
      name: "Joseph Kpadeh",
      role: "Community Member",
      content:
        "BSM's outreach program provided our local team with new kits and training. The kids in our community are inspired!",
      image: "https://placehold.co/80x80/68c2ca/ffffff?text=JK",
      icon: <FaUsers className="text-2xl text-[#68c2ca]" />,
    },
  ];

  return (
    <>
      <HeroSection />
      <StatsSection />

      {/* Featured Programs */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#03045e] mb-4">
              Our Programs
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover how Benzard Sports Management builds champions through scouting, training, events, and community support.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mx-auto max-w-6xl">
            {programs.map((program) => (
              <Card
                key={program.id}
                className="h-full flex flex-col w-full max-w-sm"
              >
                <div className="bg-gray-100 p-6 flex justify-center">
                  {program.icon}
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-semibold text-[#03045e] mb-3">
                    {program.title}
                  </h3>
                  <p className="text-gray-600 mb-4 flex-1">
                    {program.description}
                  </p>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <div className="flex items-center">
                      <GiSoccerField className="mr-1 text-[#68c2ca]" />
                      <span>{program.duration}</span>
                    </div>
                    <span className="bg-[#68c2ca] text-[#03045e] px-3 py-1 rounded-full text-xs font-medium">
                      {program.level}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-[#f8f9fa] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#03045e] mb-4">
              Success Stories
            </h2>
            <p className="text-xl text-gray-600">
              Hear from our athletes, coaches, and community members
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.name} {...testimonial} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;