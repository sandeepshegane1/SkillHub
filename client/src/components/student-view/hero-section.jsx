import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { ArrowRight, BookOpen, Award, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: BookOpen,
      title: 'Diverse Courses',
      description: 'Explore hundreds of courses across various disciplines',
      color: 'from-blue-500/30 to-blue-600/30'
    },
    {
      icon: Award,
      title: 'Expert Instructors',
      description: 'Learn from industry professionals and academic experts',
      color: 'from-purple-500/30 to-purple-600/30'
    },
    {
      icon: Users,
      title: 'Community Learning',
      description: 'Join a global community of passionate learners',
      color: 'from-emerald-500/30 to-emerald-600/30'
    }
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Background elements - these match the instructor dashboard */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_-100px,rgba(120,119,198,0.3),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_600px_at_20%_400px,rgba(78,161,255,0.2),transparent)]" />

      {/* Animated shapes */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-3xl"
            style={{
              width: Math.random() * 400 + 200,
              height: Math.random() * 400 + 200,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 40 - 20],
              y: [0, Math.random() * 40 - 20],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 py-20 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Unlock Your Potential With Expert-Led Courses
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-lg md:text-xl text-white/80 mb-8"
            >
              Discover thousands of courses taught by expert instructors to help you master new skills, advance your career, and explore your passions.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button
                size="lg"
                onClick={() => navigate('/courses')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Explore Courses
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/student-courses')}
                className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 bg-indigo-950/30 backdrop-blur-sm"
              >
                My Learning
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="flex flex-wrap gap-8 mt-12"
            >
              {['10K+ Students', '500+ Courses', '50+ Instructors'].map((stat, index) => (
                <div key={index} className="flex items-center">
                  <div className="h-10 w-1 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full mr-3" />
                  <span className="text-lg font-semibold text-white">{stat}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Video element */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <div className="relative w-full h-[500px] rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(76,81,191,0.3)]">
              <video
                autoPlay
                loop
                muted
                className="absolute inset-0 w-full h-full object-cover"
              >
                <source src="/homepage.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/40 to-purple-900/40" />

              {/* Floating cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1 }}
                className="absolute -bottom-6 -left-6 bg-indigo-950/80 backdrop-blur-md p-4 rounded-lg shadow-xl border border-white/10"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-green-500/20 p-2 rounded-full">
                    <Award className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Certified Courses</p>
                    <p className="text-xs text-white/60">Get recognized skills</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                className="absolute -top-6 -right-6 bg-indigo-950/80 backdrop-blur-md p-4 rounded-lg shadow-xl border border-white/10"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/20 p-2 rounded-full">
                    <Users className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Community Support</p>
                    <p className="text-xs text-white/60">Learn together</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1 + index * 0.2 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/10 group"
            >
              <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${feature.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
              <p className="text-white/70">{feature.description}</p>
              <div className="h-1 w-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 mt-4 group-hover:via-white/30 transition-all duration-500"></div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default HeroSection;
