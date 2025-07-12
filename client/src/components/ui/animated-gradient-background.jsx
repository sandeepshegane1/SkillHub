import React, { useEffect, useRef } from 'react';

const AnimatedGradientBackground = ({ children, className }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let mouseX = 0;
    let mouseY = 0;
    
    // Handle resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    // Track mouse movement
    const handleMouseMove = (e) => {
      mouseX = e.clientX / window.innerWidth;
      mouseY = e.clientY / window.innerHeight;
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    handleResize();
    
    // Create gradient points
    const points = [];
    for (let i = 0; i < 5; i++) {
      points.push({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.001,
        vy: (Math.random() - 0.5) * 0.001,
        radius: Math.random() * 0.1 + 0.1,
        color: [
          Math.floor(Math.random() * 100) + 155, // Higher R values for brighter colors
          Math.floor(Math.random() * 100) + 155, // Higher G values
          Math.floor(Math.random() * 100) + 155, // Higher B values
        ],
      });
    }
    
    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update points
      points.forEach(point => {
        // Add slight mouse influence
        point.vx += (mouseX - point.x) * 0.00001;
        point.vy += (mouseY - point.y) * 0.00001;
        
        // Update position
        point.x += point.vx;
        point.y += point.vy;
        
        // Bounce off edges
        if (point.x <= 0 || point.x >= 1) point.vx *= -1;
        if (point.y <= 0 || point.y >= 1) point.vy *= -1;
      });
      
      // Create gradient
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.8
      );
      
      // Add color stops based on points
      points.forEach((point, i) => {
        const [r, g, b] = point.color;
        const color = `rgba(${r}, ${g}, ${b}, 0.5)`;
        gradient.addColorStop(i / points.length, color);
      });
      
      // Fill background
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw subtle circular gradients at each point
      points.forEach(point => {
        const [r, g, b] = point.color;
        const pointGradient = ctx.createRadialGradient(
          point.x * canvas.width, point.y * canvas.height, 0,
          point.x * canvas.width, point.y * canvas.height, point.radius * canvas.width
        );
        
        pointGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.3)`);
        pointGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = pointGradient;
        ctx.beginPath();
        ctx.arc(
          point.x * canvas.width, 
          point.y * canvas.height, 
          point.radius * canvas.width, 
          0, 
          Math.PI * 2
        );
        ctx.fill();
      });
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full -z-10"
        style={{ filter: 'blur(80px)' }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default AnimatedGradientBackground;
