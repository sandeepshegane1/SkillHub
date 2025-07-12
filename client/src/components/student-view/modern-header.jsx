import { GraduationCap, Search, User, LogOut, BookOpen, Home, Menu, X, Settings, HelpCircle, UserCircle, ShoppingCart } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "../ui/button";
import { useContext, useState, useEffect, useRef } from "react";
import { AuthContext } from "@/context/auth-context";
import { CartContext } from "@/context/cart-context";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";

function ModernHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetCredentials, auth } = useContext(AuthContext);
  const { cartCount } = useContext(CartContext);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Track scroll position for header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function handleLogout() {
    resetCredentials();
    sessionStorage.clear();
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!auth?.user?.userName) return "U";
    return auth.user.userName.split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase();
  };

  const navItems = [
    { label: "Home", path: "/home", icon: Home },
    { label: "Courses", path: "/courses", icon: BookOpen },
    { label: "My Learning", path: "/student-courses", icon: User },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-indigo-950/80 backdrop-blur-md shadow-md border-b border-white/10' : 'bg-transparent'}`}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/home" className="flex items-center hover:opacity-80 transition-opacity">
          <motion.div
            initial={{ rotate: -10, scale: 0.9 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            <GraduationCap className="h-8 w-8 mr-2 text-blue-400" />
          </motion.div>
          <motion.span
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-extrabold text-xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
          >
            SkillHub
          </motion.span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-1">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path ||
                          (item.path === "/home" && location.pathname === "/");

            return (
              <Button
                key={item.path}
                variant={isActive ? "default" : "ghost"}
                onClick={() => navigate(item.path)}
                className={`text-sm font-medium transition-all ${isActive ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.label}
              </Button>
            );
          })}
        </div>

        {/* User Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/cart')}
            className="text-white/80 hover:text-white hover:bg-white/10 relative"
            aria-label="View Cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Button>
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs border border-white/20 hover:border-white/40 transition-colors cursor-pointer">
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-indigo-950/90 backdrop-blur-md border border-white/10 text-white shadow-xl">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                    <UserCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-none">{auth?.user?.userName || 'User'}</p>
                    <p className="text-xs text-white/60 leading-none mt-1">{auth?.user?.userEmail || 'user@example.com'}</p>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem className="hover:bg-white/10 focus:bg-white/10 cursor-pointer" onClick={() => navigate('/student-courses')}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  <span>My Learning</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                  onClick={() => navigate('/profile-settings')}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Profile Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-white/10 focus:bg-white/10 cursor-pointer">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Help</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem className="hover:bg-white/10 focus:bg-white/10 cursor-pointer" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-white hover:bg-white/10"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-indigo-950/90 backdrop-blur-md border-t border-white/10"
          >
            <div className="container mx-auto px-4 py-3 flex flex-col space-y-3">

              {navItems.map((item) => {
                const isActive = location.pathname === item.path ||
                              (item.path === "/home" && location.pathname === "/");

                return (
                  <Button
                    key={item.path}
                    variant={isActive ? "default" : "ghost"}
                    onClick={() => {
                      navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className={`justify-start text-sm ${isActive ? 'bg-blue-600 text-white' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                );
              })}

              <div className="border-t border-white/10 pt-3 mt-3">
                <div className="flex items-center gap-3 px-2 py-2 mb-2">
                  <Avatar className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs border border-white/20">
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-white">{auth?.user?.userName || 'User'}</p>
                    <p className="text-xs text-white/60">{auth?.user?.userEmail || 'user@example.com'}</p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  onClick={() => {
                    navigate('/cart');
                    setMobileMenuOpen(false);
                  }}
                  className="justify-start text-sm w-full text-white/80 hover:text-white hover:bg-white/10 relative"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Cart
                  {cartCount > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => navigate('/student-courses')}
                  className="justify-start text-sm w-full text-white/80 hover:text-white hover:bg-white/10"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  My Learning
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => {
                    navigate('/profile-settings');
                    setMobileMenuOpen(false);
                  }}
                  className="justify-start text-sm w-full text-white/80 hover:text-white hover:bg-white/10"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Profile Settings
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="justify-start text-sm w-full text-white/80 hover:text-white hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default ModernHeader;
