import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Percent, Tag } from "lucide-react";
import { updateCourseDiscountStatusService } from "@/services";
import { useToast } from "@/hooks/use-toast";

export default function DiscountDialog({
  isOpen,
  onClose,
  course,
  onDiscountUpdated
}) {
  const [discountActive, setDiscountActive] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Initialize form with course data when dialog opens
  useEffect(() => {
    if (course) {
      setDiscountActive(course.discountActive || false);
      setDiscountPercentage(course.discountPercentage || 0);
    }
  }, [course, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (discountPercentage < 0 || discountPercentage > 100) {
      toast({
        title: "Invalid discount",
        description: "Discount percentage must be between 0 and 100",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await updateCourseDiscountStatusService(course._id, {
        discountActive,
        discountPercentage: parseFloat(discountPercentage)
      });

      if (response.success) {
        toast({
          title: "Success",
          description: response.message,
        });

        // Call the callback to update the parent component
        if (onDiscountUpdated) {
          onDiscountUpdated(response.data);
        }

        // Close the dialog
        onClose();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update discount",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating discount:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate the discounted price
  const originalPrice = course?.pricing || 0;
  const discountedPrice = discountActive
    ? originalPrice * (1 - discountPercentage / 100)
    : originalPrice;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Tag className="h-5 w-5 text-blue-400" />
            Manage Course Discount
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Set a discount for your course "{course?.title}"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-white">Enable Discount</Label>
              <p className="text-sm text-gray-400">
                Toggle to activate or deactivate the discount
              </p>
            </div>
            <Switch
              checked={discountActive}
              onCheckedChange={setDiscountActive}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="discountPercentage" className="text-white">
              Discount Percentage
            </Label>
            <div className="relative">
              <Input
                id="discountPercentage"
                type="number"
                min="0"
                max="100"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white pr-10"
                disabled={!discountActive}
              />
              <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {discountActive && (
            <div className="bg-gray-800 p-4 rounded-md border border-gray-700 mt-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Price Preview</h4>
              <div className="flex items-center gap-3">
                <div className="text-lg font-bold text-blue-400">
                  ₹{discountedPrice.toFixed(0)}
                </div>
                {discountPercentage > 0 && (
                  <>
                    <div className="text-sm line-through text-gray-500">
                      ₹{originalPrice}
                    </div>
                    <div className="text-xs font-medium text-green-400 bg-green-900/30 px-2 py-1 rounded">
                      {discountPercentage}% OFF
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
