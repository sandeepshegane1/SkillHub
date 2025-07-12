import MediaProgressbar from "@/components/media-progress-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InstructorContext } from "@/context/instructor-context";
import { mediaUploadService } from "@/services";
import { useContext } from "react";

function CourseSettings() {
  const {
    courseLandingFormData,
    setCourseLandingFormData,
    mediaUploadProgress,
    setMediaUploadProgress,
    mediaUploadProgressPercentage,
    setMediaUploadProgressPercentage,
  } = useContext(InstructorContext);

  async function handleImageUploadChange(event) {
    const selectedImage = event.target.files[0];

    if (selectedImage) {
      const imageFormData = new FormData();
      imageFormData.append("file", selectedImage);

      try {
        setMediaUploadProgress(true);
        const response = await mediaUploadService(
          imageFormData,
          setMediaUploadProgressPercentage
        );
        if (response.success) {
          setCourseLandingFormData({
            ...courseLandingFormData,
            image: response.data.url,
          });
          setMediaUploadProgress(false);
        }
      } catch (e) {
        console.log(e);
      }
    }
  }

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-xl overflow-hidden text-white">
      <CardHeader className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border-b border-white/10">
        <CardTitle className="text-xl font-bold text-white">Course Settings</CardTitle>
        <p className="text-gray-300 text-sm mt-1">Upload a compelling course thumbnail image</p>
      </CardHeader>

      {mediaUploadProgress ? (
        <div className="p-6 bg-white/5 border-b border-white/10">
          <p className="text-sm text-blue-300 mb-2 font-medium">Uploading image...</p>
          <MediaProgressbar
            isMediaUploading={mediaUploadProgress}
            progress={mediaUploadProgressPercentage}
          />
        </div>
      ) : null}

      <CardContent className="p-6">
        {courseLandingFormData?.image ? (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Course Thumbnail</h3>
            <div className="relative group overflow-hidden rounded-lg border border-white/20 shadow-xl">
              <img
                src={courseLandingFormData.image}
                alt="Course thumbnail"
                className="w-full h-auto object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-4">
                <button
                  onClick={() => setCourseLandingFormData({...courseLandingFormData, image: ''})}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-all duration-200 text-sm font-medium"
                >
                  Replace Image
                </button>
              </div>
            </div>
            <p className="text-gray-300 text-sm">A good thumbnail image can significantly increase course enrollment rates.</p>
          </div>
        ) : (
          <div className="bg-black/30 p-8 rounded-lg border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-600/30 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Upload Course Thumbnail</h3>
            <p className="text-gray-400 mb-6 max-w-md">Add an eye-catching image that represents your course (recommended size: 1280x720px)</p>

            <div className="max-w-xs w-full">
              <Label className="text-white mb-2 block">Select Image File</Label>
              <Input
                onChange={handleImageUploadChange}
                type="file"
                accept="image/*"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CourseSettings;
