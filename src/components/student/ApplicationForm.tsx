import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Upload, Check, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";

interface FormData {
  // Personal Details
  firstName: string;
  middleName: string;
  lastName: string;
  sex: string;
  age: string;
  contactNumber: string;
  parentContactNumber: string;
  fatherName: string;
  motherName: string;
  fatherOccupation: string;
  motherOccupation: string;

  // Academic Details - Common
  tenthSchool: string;
  tenthPercentage: string;
  tenthBoard: string;
  twelfthSchool: string;
  twelfthPercentage: string;
  twelfthBoard: string;
  entranceExam: string;
  entranceScore: string;
  entranceRank: string;

  // Academic Details - PG Only
  graduationSchool?: string;
  graduationPercentage?: string;
  graduationDegree?: string;

  // Other Details
  remarks: string;
}

interface UploadedDocument {
  type: string;
  file: File | null;
  uploaded: boolean;
  url?: string;
}

const ApplicationForm = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState("personal");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const isPG = courseId?.startsWith("mtech") || courseId?.startsWith("phd");

  const [formData, setFormData] = React.useState<FormData>({
    // Personal Details
    firstName: "",
    middleName: "",
    lastName: "",
    sex: "",
    age: "",
    contactNumber: "",
    parentContactNumber: "",
    fatherName: "",
    motherName: "",
    fatherOccupation: "",
    motherOccupation: "",

    // Academic Details - Common
    tenthSchool: "",
    tenthPercentage: "",
    tenthBoard: "",
    twelfthSchool: "",
    twelfthPercentage: "",
    twelfthBoard: "",
    entranceExam: "",
    entranceScore: "",
    entranceRank: "",

    // Academic Details - PG Only
    graduationSchool: "",
    graduationPercentage: "",
    graduationDegree: "",

    // Other Details
    remarks: "",
  });

  const [documents, setDocuments] = React.useState<
    Record<string, UploadedDocument>
  >(
    isPG
      ? {
          tenthMarksheet: {
            type: "10th Marksheet",
            file: null,
            uploaded: false,
          },
          twelfthMarksheet: {
            type: "12th Marksheet",
            file: null,
            uploaded: false,
          },
          graduationMarksheet: {
            type: "Graduation Marksheet",
            file: null,
            uploaded: false,
          },
          casteCertificate: {
            type: "Caste Certificate",
            file: null,
            uploaded: false,
          },
          entranceScoreCard: {
            type: "Entrance Score Card",
            file: null,
            uploaded: false,
          },
          photo: { type: "Student Photo", file: null, uploaded: false },
          signature: { type: "Student Signature", file: null, uploaded: false },
        }
      : {
          tenthMarksheet: {
            type: "10th Marksheet",
            file: null,
            uploaded: false,
          },
          twelfthMarksheet: {
            type: "12th Marksheet",
            file: null,
            uploaded: false,
          },
          casteCertificate: {
            type: "Caste Certificate",
            file: null,
            uploaded: false,
          },
          entranceRankCard: {
            type: "Entrance Rank Card",
            file: null,
            uploaded: false,
          },
          photo: { type: "Student Photo", file: null, uploaded: false },
          signature: { type: "Student Signature", file: null, uploaded: false },
        },
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (name: string, file: File | null) => {
    if (file) {
      setDocuments((prev) => ({
        ...prev,
        [name]: { ...prev[name], file, uploaded: false },
      }));
    }
  };

  const uploadFile = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from("student-documents")
      .upload(`${path}/${file.name}`, file);

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage
      .from("student-documents")
      .getPublicUrl(`${path}/${file.name}`);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Only validate required fields
      const requiredPersonalFields = [
        "firstName",
        "lastName",
        "sex",
        "age",
        "contactNumber",
        "fatherName",
        "motherName",
      ];
      const requiredAcademicFields = [
        "tenthSchool",
        "tenthPercentage",
        "tenthBoard",
        "twelfthSchool",
        "twelfthPercentage",
        "twelfthBoard",
      ];
      const requiredPGFields = isPG
        ? ["graduationSchool", "graduationPercentage", "graduationDegree"]
        : [];

      const requiredFields = [
        ...requiredPersonalFields,
        ...requiredAcademicFields,
        ...requiredPGFields,
      ];
      const missingFields = requiredFields.filter(
        (field) => !formData[field as keyof FormData],
      );

      if (missingFields.length > 0) {
        throw new Error(
          `Please fill in all required fields marked with asterisks (*): ${missingFields.join(", ")}`,
        );
      }

      // Check required documents only
      const requiredDocuments = isPG
        ? [
            "tenthMarksheet",
            "twelfthMarksheet",
            "graduationMarksheet",
            "photo",
            "signature",
          ]
        : ["tenthMarksheet", "twelfthMarksheet", "photo", "signature"];

      const missingDocuments = requiredDocuments.filter(
        (doc) => !documents[doc].file,
      );

      if (missingDocuments.length > 0) {
        throw new Error(
          `Please upload all required documents marked with asterisks (*): ${missingDocuments.map((d) => documents[d].type).join(", ")}`,
        );
      }

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload documents
      const uploadedDocs = [];
      for (const [key, doc] of Object.entries(documents)) {
        if (doc.file) {
          const url = await uploadFile(doc.file, `${user.id}/${courseId}`);
          uploadedDocs.push({
            type: doc.type,
            url,
          });

          // Update document state
          setDocuments((prev) => ({
            ...prev,
            [key]: { ...prev[key], uploaded: true, url },
          }));
        }
      }

      // Create application record
      const { error: applicationError } = await supabase
        .from("applications")
        .insert([
          {
            student_id: user.id,
            course_id: courseId,
            personal_details: {
              firstName: formData.firstName,
              middleName: formData.middleName,
              lastName: formData.lastName,
              sex: formData.sex,
              age: formData.age,
              contactNumber: formData.contactNumber,
              parentContactNumber: formData.parentContactNumber,
              fatherName: formData.fatherName,
              motherName: formData.motherName,
              fatherOccupation: formData.fatherOccupation,
              motherOccupation: formData.motherOccupation,
            },
            academic_details: {
              tenthSchool: formData.tenthSchool,
              tenthPercentage: formData.tenthPercentage,
              tenthBoard: formData.tenthBoard,
              twelfthSchool: formData.twelfthSchool,
              twelfthPercentage: formData.twelfthPercentage,
              twelfthBoard: formData.twelfthBoard,
              entranceExam: formData.entranceExam,
              entranceScore: formData.entranceScore,
              entranceRank: formData.entranceRank,
              ...(isPG
                ? {
                    graduationSchool: formData.graduationSchool,
                    graduationPercentage: formData.graduationPercentage,
                    graduationDegree: formData.graduationDegree,
                  }
                : {}),
            },
            documents: uploadedDocs,
            remarks: formData.remarks,
            status: "pending",
          },
        ]);

      if (applicationError) throw applicationError;

      setSuccess(true);
      setTimeout(() => {
        navigate("/student/dashboard");
      }, 2000);
    } catch (err) {
      console.error("Error submitting application:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const nextTab = () => {
    if (activeTab === "personal") setActiveTab("academic");
    else if (activeTab === "academic") setActiveTab("documents");
    else if (activeTab === "documents") setActiveTab("review");
  };

  const prevTab = () => {
    if (activeTab === "review") setActiveTab("documents");
    else if (activeTab === "documents") setActiveTab("academic");
    else if (activeTab === "academic") setActiveTab("personal");
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center text-green-600 flex items-center justify-center gap-2">
              <Check className="h-6 w-6" /> Application Submitted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-4">
              Your application has been submitted successfully and is under
              review.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate("/student/dashboard")}>
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0A2240]">
            Application Form: {courseId?.toUpperCase()}
          </h1>
          <p className="text-gray-600">
            Please fill in all the required information to complete your
            application.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full mb-6">
            <TabsTrigger value="personal">Personal Details</TabsTrigger>
            <TabsTrigger value="academic">Academic Details</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="review">Review & Submit</TabsTrigger>
          </TabsList>

          <Card>
            <CardContent className="pt-6">
              <TabsContent value="personal" className="mt-0 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="middleName">Middle Name</Label>
                    <Input
                      id="middleName"
                      name="middleName"
                      value={formData.middleName}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sex">Sex *</Label>
                    <Select
                      value={formData.sex}
                      onValueChange={(value) =>
                        handleSelectChange("sex", value)
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="age">Age *</Label>
                    <Input
                      id="age"
                      name="age"
                      type="number"
                      value={formData.age}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactNumber">
                      Contact Number (Student) *
                    </Label>
                    <Input
                      id="contactNumber"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="parentContactNumber">
                      Contact Number (Parents)
                    </Label>
                    <Input
                      id="parentContactNumber"
                      name="parentContactNumber"
                      value={formData.parentContactNumber}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fatherName">Father's Name *</Label>
                    <Input
                      id="fatherName"
                      name="fatherName"
                      value={formData.fatherName}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="motherName">Mother's Name *</Label>
                    <Input
                      id="motherName"
                      name="motherName"
                      value={formData.motherName}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fatherOccupation">
                      Father's Occupation
                    </Label>
                    <Input
                      id="fatherOccupation"
                      name="fatherOccupation"
                      value={formData.fatherOccupation}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="motherOccupation">
                      Mother's Occupation
                    </Label>
                    <Input
                      id="motherOccupation"
                      name="motherOccupation"
                      value={formData.motherOccupation}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={nextTab}>Next: Academic Details</Button>
                </div>
              </TabsContent>

              <TabsContent value="academic" className="mt-0 space-y-4">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">
                      10th Standard Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="tenthSchool">School Name *</Label>
                        <Input
                          id="tenthSchool"
                          name="tenthSchool"
                          value={formData.tenthSchool}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tenthPercentage">Percentage *</Label>
                        <Input
                          id="tenthPercentage"
                          name="tenthPercentage"
                          value={formData.tenthPercentage}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tenthBoard">Board Name *</Label>
                        <Input
                          id="tenthBoard"
                          name="tenthBoard"
                          value={formData.tenthBoard}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">
                      12th Standard Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="twelfthSchool">School Name *</Label>
                        <Input
                          id="twelfthSchool"
                          name="twelfthSchool"
                          value={formData.twelfthSchool}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="twelfthPercentage">Percentage *</Label>
                        <Input
                          id="twelfthPercentage"
                          name="twelfthPercentage"
                          value={formData.twelfthPercentage}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="twelfthBoard">Board Name *</Label>
                        <Input
                          id="twelfthBoard"
                          name="twelfthBoard"
                          value={formData.twelfthBoard}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {isPG && (
                    <div>
                      <h3 className="text-lg font-medium mb-4">
                        Graduation Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="graduationSchool">
                            College/University Name *
                          </Label>
                          <Input
                            id="graduationSchool"
                            name="graduationSchool"
                            value={formData.graduationSchool}
                            onChange={handleInputChange}
                            className="mt-1"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="graduationPercentage">
                            Percentage/CGPA *
                          </Label>
                          <Input
                            id="graduationPercentage"
                            name="graduationPercentage"
                            value={formData.graduationPercentage}
                            onChange={handleInputChange}
                            className="mt-1"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="graduationDegree">Degree *</Label>
                          <Input
                            id="graduationDegree"
                            name="graduationDegree"
                            value={formData.graduationDegree}
                            onChange={handleInputChange}
                            className="mt-1"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-medium mb-4">
                      Entrance Examination Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="entranceExam">Exam Name</Label>
                        <Input
                          id="entranceExam"
                          name="entranceExam"
                          value={formData.entranceExam}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="entranceScore">Score</Label>
                        <Input
                          id="entranceScore"
                          name="entranceScore"
                          value={formData.entranceScore}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="entranceRank">Rank</Label>
                        <Input
                          id="entranceRank"
                          name="entranceRank"
                          value={formData.entranceRank}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={prevTab}>
                    Previous: Personal Details
                  </Button>
                  <Button onClick={nextTab}>Next: Documents</Button>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="mt-0 space-y-4">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(documents).map(([key, doc]) => (
                      <div key={key} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <Label className="font-medium">
                            {doc.type}{" "}
                            {key === "tenthMarksheet" ||
                            key === "twelfthMarksheet" ||
                            key === "photo" ||
                            key === "signature" ||
                            (isPG && key === "graduationMarksheet")
                              ? "*"
                              : ""}
                          </Label>
                          {doc.uploaded && (
                            <Check className="h-5 w-5 text-green-500" />
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            type="file"
                            id={key}
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              handleFileChange(key, file);
                            }}
                            className="flex-1"
                          />
                        </div>

                        {doc.file && (
                          <p className="text-sm text-gray-500 mt-1">
                            Selected: {doc.file.name}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={prevTab}>
                    Previous: Academic Details
                  </Button>
                  <Button onClick={nextTab}>Next: Review & Submit</Button>
                </div>
              </TabsContent>

              <TabsContent value="review" className="mt-0 space-y-4">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">
                      Personal Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p>
                          {formData.firstName} {formData.middleName}{" "}
                          {formData.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Sex / Age</p>
                        <p>
                          {formData.sex} / {formData.age}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Contact Number</p>
                        <p>{formData.contactNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          Parent's Contact
                        </p>
                        <p>{formData.parentContactNumber || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Father's Name</p>
                        <p>{formData.fatherName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Mother's Name</p>
                        <p>{formData.motherName}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">
                      Academic Details
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                      <div>
                        <p className="text-sm text-gray-500 font-medium">
                          10th Standard
                        </p>
                        <div className="grid grid-cols-3 gap-4 mt-1">
                          <div>
                            <p className="text-sm text-gray-500">School</p>
                            <p>{formData.tenthSchool}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Percentage</p>
                            <p>{formData.tenthPercentage}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Board</p>
                            <p>{formData.tenthBoard}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500 font-medium">
                          12th Standard
                        </p>
                        <div className="grid grid-cols-3 gap-4 mt-1">
                          <div>
                            <p className="text-sm text-gray-500">School</p>
                            <p>{formData.twelfthSchool}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Percentage</p>
                            <p>{formData.twelfthPercentage}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Board</p>
                            <p>{formData.twelfthBoard}</p>
                          </div>
                        </div>
                      </div>

                      {isPG && formData.graduationSchool && (
                        <div>
                          <p className="text-sm text-gray-500 font-medium">
                            Graduation
                          </p>
                          <div className="grid grid-cols-3 gap-4 mt-1">
                            <div>
                              <p className="text-sm text-gray-500">
                                College/University
                              </p>
                              <p>{formData.graduationSchool}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">
                                Percentage/CGPA
                              </p>
                              <p>{formData.graduationPercentage}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Degree</p>
                              <p>{formData.graduationDegree}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {formData.entranceExam && (
                        <div>
                          <p className="text-sm text-gray-500 font-medium">
                            Entrance Examination
                          </p>
                          <div className="grid grid-cols-3 gap-4 mt-1">
                            <div>
                              <p className="text-sm text-gray-500">Exam</p>
                              <p>{formData.entranceExam}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Score</p>
                              <p>{formData.entranceScore}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Rank</p>
                              <p>{formData.entranceRank}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Documents</h3>
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                      {Object.entries(documents).map(([key, doc]) => (
                        <div key={key} className="flex items-center gap-2">
                          {doc.file ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                          <span>{doc.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="remarks">Remarks (if any)</Label>
                    <Textarea
                      id="remarks"
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleInputChange}
                      className="mt-1"
                      placeholder="Any additional information you want to provide"
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={prevTab}>
                    Previous: Documents
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading ? "Submitting..." : "Submit Application"}
                  </Button>
                </div>
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </div>
  );
};

export default ApplicationForm;
