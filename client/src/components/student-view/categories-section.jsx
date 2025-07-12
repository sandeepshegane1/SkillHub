import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Code, PenTool, Lightbulb, Database, LineChart, Globe, Cpu, BookOpen } from 'lucide-react';

const CategoriesSection = () => {
  const navigate = useNavigate();

  const categories = [
    {
      name: 'Web Development',
      icon: Code,
      color: 'from-blue-500/30 to-blue-600/30',
      bgColor: 'bg-blue-900/30',
      iconColor: 'text-blue-400'
    },
    {
      name: 'Design',
      icon: PenTool,
      color: 'from-purple-500/30 to-purple-600/30',
      bgColor: 'bg-purple-900/30',
      iconColor: 'text-purple-400'
    },
    {
      name: 'Business',
      icon: LineChart,
      color: 'from-green-500/30 to-green-600/30',
      bgColor: 'bg-green-900/30',
      iconColor: 'text-green-400'
    },
    {
      name: 'Data Science',
      icon: Database,
      color: 'from-yellow-500/30 to-yellow-600/30',
      bgColor: 'bg-yellow-900/30',
      iconColor: 'text-yellow-400'
    },
    {
      name: 'Personal Development',
      icon: Lightbulb,
      color: 'from-pink-500/30 to-pink-600/30',
      bgColor: 'bg-pink-900/30',
      iconColor: 'text-pink-400'
    },
    {
      name: 'Languages',
      icon: Globe,
      color: 'from-indigo-500/30 to-indigo-600/30',
      bgColor: 'bg-indigo-900/30',
      iconColor: 'text-indigo-400'
    },
    {
      name: 'IT & Software',
      icon: Cpu,
      color: 'from-red-500/30 to-red-600/30',
      bgColor: 'bg-red-900/30',
      iconColor: 'text-red-400'
    },
    {
      name: 'Academics',
      icon: BookOpen,
      color: 'from-teal-500/30 to-teal-600/30',
      bgColor: 'bg-teal-900/30',
      iconColor: 'text-teal-400'
    },
  ];

  const handleCategoryClick = (category) => {
    // Store filter in session storage
    const currentFilter = {
      category: [category],
    };
    sessionStorage.setItem("filters", JSON.stringify(currentFilter));

    // Navigate to courses page
    navigate("/courses");
  };

  return (
    <div className="py-16 relative">
      {/* Background elements - these match the instructor dashboard */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_-100px,rgba(120,119,198,0.3),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_600px_at_20%_400px,rgba(78,161,255,0.2),transparent)]" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Explore Categories
          </h2>
          <p className="text-white/80 mt-2 max-w-2xl mx-auto">
            Discover courses in various categories to enhance your skills and knowledge
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onClick={() => handleCategoryClick(category.name)}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group"
            >
              <div className="p-6 flex flex-col items-center text-center">
                <div className={`p-4 rounded-full ${category.bgColor} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <category.icon className={`h-8 w-8 ${category.iconColor}`} />
                </div>
                <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors duration-300">
                  {category.name}
                </h3>
              </div>
              <div className={`h-1 w-full bg-gradient-to-r ${category.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoriesSection;
