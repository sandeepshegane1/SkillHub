import MediaProgressbar from "@/components/media-progress-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import VideoPlayer from "@/components/video-player";
import { courseCurriculumInitialFormData } from "@/config";
import { InstructorContext } from "@/context/instructor-context";
import {
  mediaBulkUploadService,
  mediaDeleteService,
  mediaUploadService,
} from "@/services";
import { Upload } from "lucide-react";
import { useContext, useRef } from "react";

function CourseCurriculum() {
  const {
    courseCurriculumFormData,
    setCourseCurriculumFormData,
    mediaUploadProgress,
    setMediaUploadProgress,
    mediaUploadProgressPercentage,
    setMediaUploadProgressPercentage,
  } = useContext(InstructorContext);

  const bulkUploadInputRef = useRef(null);

  function handleNewLecture() {
    setCourseCurriculumFormData([
      ...courseCurriculumFormData,
      {
        ...courseCurriculumInitialFormData[0],
      },
    ]);
  }

  function handleCourseTitleChange(event, currentIndex) {
    let cpyCourseCurriculumFormData = [...courseCurriculumFormData];
    cpyCourseCurriculumFormData[currentIndex] = {
      ...cpyCourseCurriculumFormData[currentIndex],
      title: event.target.value,
    };

    setCourseCurriculumFormData(cpyCourseCurriculumFormData);
  }

  function handleFreePreviewChange(currentValue, currentIndex) {
    let cpyCourseCurriculumFormData = [...courseCurriculumFormData];
    cpyCourseCurriculumFormData[currentIndex] = {
      ...cpyCourseCurriculumFormData[currentIndex],
      freePreview: currentValue,
    };

    setCourseCurriculumFormData(cpyCourseCurriculumFormData);
  }

  function handleDurationChange(event, currentIndex) {
    const minutes = parseInt(event.target.value) || 0;
    const seconds = minutes * 60; // Convert minutes to seconds

    console.log(`Setting duration for lecture ${currentIndex + 1}: ${minutes} minutes (${seconds} seconds)`);

    let cpyCourseCurriculumFormData = [...courseCurriculumFormData];
    cpyCourseCurriculumFormData[currentIndex] = {
      ...cpyCourseCurriculumFormData[currentIndex],
      duration: seconds, // Store duration in seconds
    };

    setCourseCurriculumFormData(cpyCourseCurriculumFormData);
  }

  async function handleSingleLectureUpload(event, currentIndex) {
    const selectedFile = event.target.files[0];

    if (selectedFile) {
      const videoFormData = new FormData();
      videoFormData.append("file", selectedFile);

      try {
        setMediaUploadProgress(true);
        const response = await mediaUploadService(
          videoFormData,
          setMediaUploadProgressPercentage
        );
        if (response.success) {
          let cpyCourseCurriculumFormData = [...courseCurriculumFormData];
          cpyCourseCurriculumFormData[currentIndex] = {
            ...cpyCourseCurriculumFormData[currentIndex],
            videoUrl: response?.data?.url,
            public_id: response?.data?.public_id,
          };
          setCourseCurriculumFormData(cpyCourseCurriculumFormData);
          setMediaUploadProgress(false);
        }
      } catch (error) {
        console.log(error);
      }
    }
  }

  async function handleReplaceVideo(currentIndex) {
    let cpyCourseCurriculumFormData = [...courseCurriculumFormData];
    const getCurrentVideoPublicId =
      cpyCourseCurriculumFormData[currentIndex].public_id;

    const deleteCurrentMediaResponse = await mediaDeleteService(
      getCurrentVideoPublicId
    );

    if (deleteCurrentMediaResponse?.success) {
      cpyCourseCurriculumFormData[currentIndex] = {
        ...cpyCourseCurriculumFormData[currentIndex],
        videoUrl: "",
        public_id: "",
      };

      setCourseCurriculumFormData(cpyCourseCurriculumFormData);
    }
  }

  function isCourseCurriculumFormDataValid() {
    return courseCurriculumFormData.every((item) => {
      return (
        item &&
        typeof item === "object" &&
        item.title.trim() !== "" &&
        item.videoUrl.trim() !== ""
      );
    });
  }

  function handleOpenBulkUploadDialog() {
    bulkUploadInputRef.current?.click();
  }

  function areAllCourseCurriculumFormDataObjectsEmpty(arr) {
    return arr.every((obj) => {
      return Object.entries(obj).every(([key, value]) => {
        if (typeof value === "boolean") {
          return true;
        }
        return value === "";
      });
    });
  }

  async function handleMediaBulkUpload(event) {
    const selectedFiles = Array.from(event.target.files);
    const bulkFormData = new FormData();

    selectedFiles.forEach((fileItem) => bulkFormData.append("files", fileItem));

    try {
      setMediaUploadProgress(true);
      const response = await mediaBulkUploadService(
        bulkFormData,
        setMediaUploadProgressPercentage
      );

      console.log(response, "bulk");
      if (response?.success) {
        let cpyCourseCurriculumFormdata =
          areAllCourseCurriculumFormDataObjectsEmpty(courseCurriculumFormData)
            ? []
            : [...courseCurriculumFormData];

        cpyCourseCurriculumFormdata = [
          ...cpyCourseCurriculumFormdata,
          ...response?.data.map((item, index) => ({
            videoUrl: item?.url,
            public_id: item?.public_id,
            title: `Lecture ${
              cpyCourseCurriculumFormdata.length + (index + 1)
            }`,
            freePreview: false,
            duration: 0, // Default duration, instructor should update this
          })),
        ];
        setCourseCurriculumFormData(cpyCourseCurriculumFormdata);
        setMediaUploadProgress(false);
      }
    } catch (e) {
      console.log(e);
    }
  }

  async function handleDeleteLecture(currentIndex) {
    let cpyCourseCurriculumFormData = [...courseCurriculumFormData];
    const getCurrentSelectedVideoPublicId =
      cpyCourseCurriculumFormData[currentIndex].public_id;

    const response = await mediaDeleteService(getCurrentSelectedVideoPublicId);

    if (response?.success) {
      cpyCourseCurriculumFormData = cpyCourseCurriculumFormData.filter(
        (_, index) => index !== currentIndex
      );

      setCourseCurriculumFormData(cpyCourseCurriculumFormData);
    }
  }

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-xl overflow-hidden text-white">
      <CardHeader className="flex flex-row justify-between items-center bg-gradient-to-r from-blue-900/40 to-purple-900/40 border-b border-white/10">
        <div>
          <CardTitle className="text-xl font-bold text-white">Course Curriculum</CardTitle>
          <p className="text-gray-300 text-sm mt-1">Build your course structure with lectures and videos</p>
        </div>
        <div>
          <Input
            type="file"
            ref={bulkUploadInputRef}
            accept="video/*"
            multiple
            className="hidden"
            id="bulk-media-upload"
            onChange={handleMediaBulkUpload}
          />
          <Button
            as="label"
            htmlFor="bulk-media-upload"
            variant="outline"
            className="cursor-pointer bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white transition-all duration-200"
            onClick={handleOpenBulkUploadDialog}
          >
            <Upload className="w-4 h-5 mr-2" />
            Bulk Upload
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <Button
            disabled={!isCourseCurriculumFormDataValid() || mediaUploadProgress}
            onClick={handleNewLecture}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Add New Lecture
          </Button>
          <div className="text-gray-300 text-sm">
            {courseCurriculumFormData.length} {courseCurriculumFormData.length === 1 ? 'Lecture' : 'Lectures'} in this course
          </div>
        </div>

        {mediaUploadProgress ? (
          <div className="mb-6 bg-white/5 p-4 rounded-lg border border-white/10">
            <p className="text-sm text-blue-300 mb-2 font-medium">Uploading video...</p>
            <MediaProgressbar
              isMediaUploading={mediaUploadProgress}
              progress={mediaUploadProgressPercentage}
            />
          </div>
        ) : null}

        <div className="mt-4 space-y-6">
          {courseCurriculumFormData.map((curriculumItem, index) => (
            <div key={index} className="border border-white/10 bg-white/5 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:bg-white/10">
              <div className="flex flex-col md:flex-row md:gap-5 md:items-center">
                <div className="flex items-center gap-3 mb-4 md:mb-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <Input
                    name={`title-${index + 1}`}
                    placeholder="Enter lecture title"
                    className="max-w-96 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400"
                    onChange={(event) => handleCourseTitleChange(event, index)}
                    value={courseCurriculumFormData[index]?.title}
                  />
                </div>

                <div className="flex items-center gap-3 mb-4 md:mb-0">
                  <Label htmlFor={`duration-${index + 1}`} className="text-sm text-gray-300 whitespace-nowrap">
                    Duration (minutes):
                  </Label>
                  <Input
                    id={`duration-${index + 1}`}
                    name={`duration-${index + 1}`}
                    type="number"
                    min="0"
                    placeholder="Enter duration in minutes"
                    className="w-24 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400"
                    onChange={(event) => handleDurationChange(event, index)}
                    value={courseCurriculumFormData[index]?.duration ? Math.round(courseCurriculumFormData[index].duration / 60) : ''}
                  />
                </div>

                <div className="flex items-center space-x-2 ml-auto bg-white/10 px-3 py-1 rounded-full">
                  <Switch
                    onCheckedChange={(value) =>
                      handleFreePreviewChange(value, index)
                    }
                    checked={courseCurriculumFormData[index]?.freePreview}
                    id={`freePreview-${index + 1}`}
                    className="data-[state=checked]:bg-blue-500"
                  />
                  <Label htmlFor={`freePreview-${index + 1}`} className="text-sm text-gray-300">
                    Free Preview
                  </Label>
                </div>
              </div>

              <div className="mt-6">
                {courseCurriculumFormData[index]?.videoUrl ? (
                  <div className="flex flex-col lg:flex-row gap-4 bg-black/30 p-4 rounded-lg">
                    <div className="flex-1">
                      <VideoPlayer
                        url={courseCurriculumFormData[index]?.videoUrl}
                        width="100%"
                        height="200px"
                        onDurationChange={(duration) => {
                          // Only set duration if it hasn't been manually set
                          if (!courseCurriculumFormData[index]?.duration) {
                            console.log(`Auto-detecting duration for lecture ${index + 1}: ${duration} seconds`);
                            let cpyCourseCurriculumFormData = [...courseCurriculumFormData];
                            cpyCourseCurriculumFormData[index] = {
                              ...cpyCourseCurriculumFormData[index],
                              duration: Math.round(duration)
                            };
                            console.log(`Updated lecture ${index + 1} with auto-detected duration:`, cpyCourseCurriculumFormData[index].duration);
                            setCourseCurriculumFormData(cpyCourseCurriculumFormData);
                          } else {
                            console.log(`Not updating duration for lecture ${index + 1} as it was manually set to ${courseCurriculumFormData[index].duration} seconds`);
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-3 justify-center">
                      <Button
                        onClick={() => handleReplaceVideo(index)}
                        className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200"
                      >
                        Replace Video
                      </Button>
                      <Button
                        onClick={() => handleDeleteLecture(index)}
                        className="bg-red-600 hover:bg-red-700 text-white transition-all duration-200"
                      >
                        Delete Lecture
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-black/30 p-8 rounded-lg border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-center">
                    <Upload className="h-12 w-12 text-blue-400 mb-3" />
                    <h3 className="text-lg font-medium text-white mb-2">Upload Lecture Video</h3>
                    <p className="text-gray-400 mb-4 max-w-md">Drag and drop your video file here, or click to browse</p>
                    <Input
                      type="file"
                      accept="video/*"
                      onChange={(event) =>
                        handleSingleLectureUpload(event, index)
                      }
                      className="max-w-xs bg-white/10 border-white/20 text-white"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          {courseCurriculumFormData.length === 0 && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-10 text-center">
              <Upload className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No lectures yet</h3>
              <p className="text-gray-400 max-w-md mx-auto mb-6">Start building your course by adding lectures or uploading videos in bulk.</p>
              <Button
                onClick={handleNewLecture}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Add Your First Lecture
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default CourseCurriculum;
