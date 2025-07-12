import FormControls from "@/components/common-form/form-controls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { courseLandingPageFormControls } from "@/config";
import { InstructorContext } from "@/context/instructor-context";
import { useContext } from "react";

function CourseLanding() {
  const { courseLandingFormData, setCourseLandingFormData } =
    useContext(InstructorContext);
  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-xl overflow-hidden text-white">
      <CardHeader className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border-b border-white/10">
        <CardTitle className="text-xl font-bold text-white">Course Landing Page</CardTitle>
        <p className="text-gray-300 text-sm mt-1">Create an engaging landing page that attracts students to your course</p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 p-4 rounded-lg mb-6 border border-white/10">
          <h3 className="text-lg font-medium text-white mb-2">Landing Page Tips</h3>
          <ul className="text-gray-300 text-sm space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">•</span> Use a clear, specific title that includes keywords students might search for
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">•</span> Write a compelling description that highlights what students will learn
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">•</span> Set a competitive price based on the value and depth of your content
            </li>
          </ul>
        </div>

        <FormControls
          formControls={courseLandingPageFormControls}
          formData={courseLandingFormData}
          setFormData={setCourseLandingFormData}
          className="space-y-6 text-white"
        />
      </CardContent>
    </Card>
  );
}

export default CourseLanding;
