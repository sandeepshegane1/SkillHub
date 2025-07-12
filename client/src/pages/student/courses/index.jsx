import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { filterOptions, sortOptions } from "@/config";
import { AuthContext } from "@/context/auth-context";
import { StudentContext } from "@/context/student-context";
import {
  checkCoursePurchaseInfoService,
  fetchStudentViewCourseListService,
} from "@/services";
import { ArrowUpDownIcon, Search, Filter, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import CourseCard from "@/components/ui/course-card";
import { Input } from "@/components/ui/input";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

function createSearchParamsHelper(filterParams) {
  const queryParams = [];

  for (const [key, value] of Object.entries(filterParams)) {
    if (Array.isArray(value) && value.length > 0) {
      const paramValue = value.join(",");

      queryParams.push(`${key}=${encodeURIComponent(paramValue)}`);
    }
  }

  return queryParams.join("&");
}

function StudentViewCoursesPage() {
  const [sort, setSort] = useState("price-lowtohigh");
  const [filters, setFilters] = useState({});
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCourses, setFilteredCourses] = useState([]);
  const {
    studentViewCoursesList,
    setStudentViewCoursesList,
    loadingState,
    setLoadingState,
  } = useContext(StudentContext);
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);

  function handleFilterOnChange(getSectionId, getCurrentOption) {
    let cpyFilters = { ...filters };
    const indexOfCurrentSeection =
      Object.keys(cpyFilters).indexOf(getSectionId);

    console.log(indexOfCurrentSeection, getSectionId);
    if (indexOfCurrentSeection === -1) {
      cpyFilters = {
        ...cpyFilters,
        [getSectionId]: [getCurrentOption.id],
      };

      console.log(cpyFilters);
    } else {
      const indexOfCurrentOption = cpyFilters[getSectionId].indexOf(
        getCurrentOption.id
      );

      if (indexOfCurrentOption === -1)
        cpyFilters[getSectionId].push(getCurrentOption.id);
      else cpyFilters[getSectionId].splice(indexOfCurrentOption, 1);
    }

    setFilters(cpyFilters);
    sessionStorage.setItem("filters", JSON.stringify(cpyFilters));
  }

  async function fetchAllStudentViewCourses(filters, sort) {
    const query = new URLSearchParams({
      ...filters,
      sortBy: sort,
    });
    const response = await fetchStudentViewCourseListService(query);
    if (response?.success) {
      setStudentViewCoursesList(response?.data);
      setLoadingState(false);
    }
  }

  async function handleCourseNavigate(getCurrentCourseId) {
    try {
      console.log('Navigating to course:', getCurrentCourseId, 'User ID:', auth?.user?._id);

      // Check if user is logged in
      if (!auth?.user?._id) {
        console.log('User not logged in, navigating directly to course details');
        navigate(`/course/details/${getCurrentCourseId}`);
        return;
      }

      const response = await checkCoursePurchaseInfoService(
        getCurrentCourseId,
        auth?.user?._id
      );

      console.log('Course purchase check response:', response);

      if (response?.success) {
        if (response?.data) {
          console.log('User has purchased this course, navigating to course progress');
          navigate(`/course-progress/${getCurrentCourseId}`);
        } else {
          console.log('User has not purchased this course, navigating to course details');
          navigate(`/course/details/${getCurrentCourseId}`);
        }
      } else {
        console.error('Failed to check course purchase info:', response?.message);
        // Default to course details page if there's an error
        navigate(`/course/details/${getCurrentCourseId}`);
      }
    } catch (error) {
      console.error('Error in handleCourseNavigate:', error);
      navigate(`/course/details/${getCurrentCourseId}`);
    }
  }

  useEffect(() => {
    const buildQueryStringForFilters = createSearchParamsHelper(filters);
    setSearchParams(new URLSearchParams(buildQueryStringForFilters));
  }, [filters]);

  useEffect(() => {
    setSort("price-lowtohigh");
    setFilters(JSON.parse(sessionStorage.getItem("filters")) || {});
  }, []);

  useEffect(() => {
    if (filters !== null && sort !== null)
      fetchAllStudentViewCourses(filters, sort);
  }, [filters, sort]);

  useEffect(() => {
    return () => {
      sessionStorage.removeItem("filters");
    };
  }, []);

  // Filter courses based on search query
  useEffect(() => {
    if (!studentViewCoursesList) return;

    if (!searchQuery.trim()) {
      setFilteredCourses(studentViewCoursesList);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = studentViewCoursesList.filter(course => {
      return (
        course.title.toLowerCase().includes(query) ||
        course.subtitle?.toLowerCase().includes(query) ||
        course.description?.toLowerCase().includes(query) ||
        course.category?.toLowerCase().includes(query) ||
        course.instructorName?.toLowerCase().includes(query)
      );
    });

    setFilteredCourses(filtered);
  }, [searchQuery, studentViewCoursesList]);

  // Initialize filtered courses when studentViewCoursesList changes
  useEffect(() => {
    if (studentViewCoursesList) {
      setFilteredCourses(studentViewCoursesList);
    }
  }, [studentViewCoursesList]);

  return (
    <div className="min-h-screen pt-6 pb-16 relative">
      {/* Background elements - these match the instructor dashboard */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_-100px,rgba(120,119,198,0.3),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_600px_at_20%_400px,rgba(78,161,255,0.2),transparent)]" />
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />

      {/* Hero section */}
      <div className="relative py-12 mb-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_0px,rgba(120,119,198,0.4),transparent)]" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto text-center"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">Discover Your Next Learning Adventure</h1>
            <p className="text-lg text-blue-200 mb-8">Browse our collection of high-quality courses taught by expert instructors</p>

            <div className="relative max-w-xl mx-auto">
              <Input
                type="search"
                placeholder="Search for courses..."
                className="pl-10 py-6 pr-4 w-full rounded-full text-white bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg focus-visible:ring-blue-500/50 focus-visible:border-blue-400/50 placeholder:text-white/60"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full lg:w-1/4 bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-xl shadow-md self-start sticky top-24"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Filters</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilters({});
                  sessionStorage.removeItem("filters");
                }}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                Clear All
              </Button>
            </div>

            {Object.keys(filterOptions).map((ketItem) => (
              <div key={ketItem} className="mb-6">
                <h3 className="font-semibold mb-3 flex items-center text-white">
                  <SlidersHorizontal className="h-4 w-4 mr-2 text-blue-400" />
                  {ketItem.toUpperCase()}
                </h3>
                <div className="space-y-2 pl-2">
                  {filterOptions[ketItem].map((option) => (
                    <div
                      key={option.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={option.id}
                        checked={
                          filters &&
                          Object.keys(filters).length > 0 &&
                          filters[ketItem] &&
                          filters[ketItem].indexOf(option.id) > -1
                        }
                        onCheckedChange={() =>
                          handleFilterOnChange(ketItem, option)
                        }
                        className="text-blue-400 border-white/30"
                      />
                      <Label
                        htmlFor={option.id}
                        className="text-sm font-medium leading-none cursor-pointer text-white/80 hover:text-white transition-colors"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Main content */}
          <div className="w-full lg:w-3/4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex justify-between items-center mb-6"
            >
              <h2 className="text-2xl font-bold text-white">
                {filteredCourses?.length || 0} Courses Available
                {searchQuery && filteredCourses?.length !== studentViewCoursesList?.length && (
                  <span className="text-sm font-normal ml-2 text-white/70">
                    (filtered from {studentViewCoursesList?.length} total)
                  </span>
                )}
              </h2>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-white/5 backdrop-blur-sm border-white/20 text-white hover:bg-white/10 hover:border-white/30">
                    <ArrowUpDownIcon className="mr-2 h-4 w-4" />
                    Sort By
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-indigo-950/90 backdrop-blur-md border-white/10 text-white">
                  <DropdownMenuRadioGroup value={sort} onValueChange={(value) => setSort(value)}>
                    {sortOptions.map((sortItem) => (
                      <DropdownMenuRadioItem
                        key={sortItem.id}
                        value={sortItem.id}
                        className="cursor-pointer hover:bg-white/10 focus:bg-white/10"
                      >
                        {sortItem.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {loadingState ? (
                [...Array(6)].map((_, index) => (
                  <div key={index} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden shadow-md">
                    <Skeleton className="h-48 w-full bg-white/10" />
                    <div className="p-4">
                      <Skeleton className="h-4 w-1/4 mb-2 bg-white/10" />
                      <Skeleton className="h-6 w-3/4 mb-4 bg-white/10" />
                      <Skeleton className="h-4 w-full mb-2 bg-white/10" />
                      <Skeleton className="h-4 w-2/3 bg-white/10" />
                    </div>
                  </div>
                ))
              ) : filteredCourses && filteredCourses.length > 0 ? (
                filteredCourses.map((course, index) => (
                  <motion.div
                    key={course._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <CourseCard
                      course={course}
                      onClick={() => handleCourseNavigate(course._id)}
                    />
                  </motion.div>
                ))
              ) : loadingState ? (
                [...Array(6)].map((_, index) => (
                  <div key={index} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden shadow-md">
                    <Skeleton className="h-48 w-full bg-white/10" />
                    <div className="p-4">
                      <Skeleton className="h-4 w-1/4 mb-2 bg-white/10" />
                      <Skeleton className="h-6 w-3/4 mb-4 bg-white/10" />
                      <Skeleton className="h-4 w-full mb-2 bg-white/10" />
                      <Skeleton className="h-4 w-2/3 bg-white/10" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Filter className="h-16 w-16 mx-auto text-white/40 mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">No Courses Found</h3>
                    <p className="text-white/70 mb-6">
                      {searchQuery ?
                        `No results found for "${searchQuery}". Try a different search term.` :
                        "Try adjusting your filters or search criteria"}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      {searchQuery && (
                        <Button
                          onClick={() => setSearchQuery("")}
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border border-white/20"
                        >
                          Clear Search
                        </Button>
                      )}
                      {Object.keys(filters).length > 0 && (
                        <Button
                          onClick={() => {
                            setFilters({});
                            sessionStorage.removeItem("filters");
                          }}
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border border-white/20"
                        >
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentViewCoursesPage;
