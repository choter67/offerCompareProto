import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { FileText, Upload, CheckCircle, Loader2 } from "lucide-react";

interface FileUploadProps {
  listingId: number;
  onExtracted: (extractedData: any) => void;
}

export default function FileUpload({ listingId, onExtracted }: FileUploadProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    
    if (selectedFile) {
      // Check file type
      const validTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      
      if (!validTypes.includes(selectedFile.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF, TXT, DOC, or DOCX file",
          variant: "destructive",
        });
        return;
      }
      
      // Check file size (limit to 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }
      
      setFile(selectedFile);
      setIsSuccess(false);
    }
  };
  
  // Handle file upload and extraction
  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('document', file);
      formData.append('listingId', listingId.toString());
      
      // Upload file
      const response = await fetch('/api/offers/extract', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to extract offer details');
      }
      
      const data = await response.json();
      
      // Update UI
      setIsSuccess(true);
      setIsUploading(false);
      
      // Notify success
      toast({
        title: "Document processed successfully",
        description: "Offer details have been extracted",
        variant: "default",
      });
      
      // Pass extracted data to parent
      onExtracted(data.extractedData);
      
    } catch (error) {
      setIsUploading(false);
      
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Offer Document</CardTitle>
        <CardDescription>
          Upload a PDF, DOC, or DOCX file containing the offer details. Our AI will automatically extract key information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="border border-dashed border-neutral-300 rounded-lg p-10">
            <div className="flex flex-col items-center justify-center text-center">
              {isSuccess ? (
                <div className="flex flex-col items-center">
                  <div className="bg-green-100 rounded-full p-3 mb-4">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Document Processed!</h3>
                  <p className="text-neutral-500 mb-4">{file?.name}</p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setFile(null);
                      setIsSuccess(false);
                    }}
                  >
                    Upload another document
                  </Button>
                </div>
              ) : (
                <>
                  <div className="bg-neutral-100 rounded-full p-3 mb-4">
                    {file ? (
                      <FileText className="h-10 w-10 text-primary" />
                    ) : (
                      <Upload className="h-10 w-10 text-neutral-400" />
                    )}
                  </div>
                  
                  {file ? (
                    <div>
                      <h3 className="text-lg font-medium mb-2">File Selected</h3>
                      <p className="text-neutral-500 mb-4">{file.name}</p>
                      <div className="flex gap-3">
                        <Button 
                          variant="outline" 
                          onClick={() => setFile(null)}
                          disabled={isUploading}
                        >
                          Change file
                        </Button>
                        <Button 
                          onClick={handleUpload}
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>Process Document</>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Upload Document</h3>
                      <p className="text-neutral-500 mb-6">
                        Drag and drop your offer document here, or click to browse files
                      </p>
                      <Label 
                        htmlFor="document-upload" 
                        className="bg-primary text-white rounded-md px-4 py-2 cursor-pointer hover:bg-primary-dark transition-colors"
                      >
                        Browse Files
                      </Label>
                      <Input
                        id="document-upload"
                        type="file"
                        accept=".pdf,.txt,.doc,.docx"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="bg-neutral-50 rounded-lg p-4">
            <h4 className="font-medium mb-2">What happens next?</h4>
            <ul className="list-disc list-inside text-sm space-y-1 text-neutral-600">
              <li>Our AI will extract key information including price, contingencies, and closing timeline</li>
              <li>You'll have a chance to review and edit the extracted data</li>
              <li>Each document processing counts as one usage event for billing purposes</li>
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter className="text-sm text-neutral-500 justify-between border-t pt-4">
        <div>Supported formats: PDF, DOC, DOCX, TXT</div>
        <div>Max file size: 10MB</div>
      </CardFooter>
    </Card>
  );
}
