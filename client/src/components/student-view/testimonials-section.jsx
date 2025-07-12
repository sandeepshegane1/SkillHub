import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const TestimonialsSection = () => {
  const testimonials = [
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'UX Designer',
      image: 'https://randomuser.me/api/portraits/women/1.jpg',
      text: 'The courses on this platform completely transformed my career. I went from knowing nothing about UX design to landing my dream job in just 6 months!',
    },
    {
      id: 2,
      name: 'Michael Chen',
      role: 'Software Engineer',
      image: 'https://randomuser.me/api/portraits/men/2.jpg',
      text: 'The instructors are world-class and the course material is always up-to-date with the latest industry standards. I\'ve recommended these courses to all my colleagues.',
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      role: 'Data Scientist',
      image: 'https://randomuser.me/api/portraits/women/3.jpg',
      text: 'I\'ve taken courses from many platforms, but the quality of instruction and community support here is unmatched. It\'s been instrumental in my transition to data science.',
    },
    {
      id: 4,
      name: 'David Kim',
      role: 'Marketing Manager',
      image: 'https://randomuser.me/api/portraits/men/4.jpg',
      text: 'The business courses helped me understand digital marketing at a deeper level. I\'ve been able to implement strategies that have doubled our company\'s growth.',
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <div className="py-16 relative">
      {/* Background elements - these match the instructor dashboard */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_-100px,rgba(120,119,198,0.3),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_600px_at_80%_400px,rgba(78,161,255,0.2),transparent)]" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            What Our Students Say
          </h2>
          <p className="text-white/80 mt-2 max-w-2xl mx-auto">
            Join thousands of satisfied learners who have transformed their careers
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Testimonial cards */}
            <div className="relative h-[400px] md:h-[300px]">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: index === activeIndex ? 1 : 0,
                    scale: index === activeIndex ? 1 : 0.8,
                    zIndex: index === activeIndex ? 10 : 0,
                  }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl p-8 h-full">
                    <div className="flex flex-col md:flex-row gap-6 h-full">
                      <div className="flex-shrink-0 flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-2 border-white/20">
                          <img
                            src={testimonial.image}
                            alt={testimonial.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h4 className="font-bold text-center text-white">{testimonial.name}</h4>
                        <p className="text-sm text-white/60 text-center">{testimonial.role}</p>
                      </div>

                      <div className="flex-grow flex flex-col justify-center">
                        <div className="mb-4">
                          <Quote className="h-8 w-8 text-blue-400 opacity-50" />
                        </div>
                        <p className="text-white/80 italic">
                          "{testimonial.text}"
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Navigation dots */}
            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === activeIndex
                      ? 'bg-blue-400 w-6'
                      : 'bg-white/20 hover:bg-blue-400/50'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestimonialsSection;
