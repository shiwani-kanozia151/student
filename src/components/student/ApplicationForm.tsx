import React from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
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
  firstName: string;
  middleName: string;
  lastName: string;
  sex: string;
  age: string;
  dob: string;
  nationality: string;
  address: string;
  contactNumber: string;
  parentContactNumber: string;
  fatherName: string;
  motherName: string;
  fatherOccupation: string;
  motherOccupation: string;
  address: string;
  courseType: string;
  courseName: string;
  tenthSchool: string;
  tenthPercentage: string;
  tenthBoard: string;
  twelfthSchool: string;
  twelfthPercentage: string;
  twelfthBoard: string;
  entranceExam: string;
  entranceScore: string;
  entranceRank: string;
  graduationSchool?: string;
  graduationPercentage?: string;
  graduationDegree?: string;
  pgSchool?: string;
  pgPercentage?: string;
  pgDegree?: string;
  researchProposal?: string;
  remarks: string;
  course_type: "UG" | "PG" | "Research";
  course_name: string;
}

interface UploadedDocument {
  type: string;
  file: File | null;
  uploaded: boolean;
  url?: string;
  required: boolean; 
}

const ApplicationForm = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { courseType, courseName } = location.state || { 
    courseType: "ug", 
    courseName: "" 
  };
  
  const [activeTab, setActiveTab] = React.useState("personal");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [studentName, setStudentName] = React.useState("");
  const [user, setUser] = React.useState<any>(null);

  const isUG = courseType === "ug";
  const isPG = courseType === "pg";
  const isResearch = courseType === "research";

  const [documents, setDocuments] = React.useState<Record<string, UploadedDocument>>({
    tenthMarksheet: { type: "10th Marksheet", file: null, uploaded: false, required: true },
    photo: { type: "Student Photo", file: null, uploaded: false, required: true },
    signature: { type: "Student Signature", file: null, uploaded: false, required: true },
    aadharCard: { type: "Aadhar Card", file: null, uploaded: false, required: true },
    ...(isUG && {
      twelfthMarksheet: { type: "12th Marksheet", file: null, uploaded: false, required: true },
      entranceScoreCard: { type: "Entrance Score Card", file: null, uploaded: false, required: true }
    }),
    ...(isPG && {
      twelfthMarksheet: { type: "12th Marksheet", file: null, uploaded: false, required: true },
      graduationMarksheet: { type: "Graduation Marksheet", file: null, uploaded: false, required: true },
      pgEntranceScoreCard: { type: "PG Entrance Score Card", file: null, uploaded: false, required: true }
    }),
    ...(isResearch && {
      twelfthMarksheet: { type: "12th Marksheet", file: null, uploaded: false, required: true },
      graduationMarksheet: { type: "UG Marksheet", file: null, uploaded: false, required: true },
      pgMarksheet: { type: "PG Marksheet", file: null, uploaded: false, required: true },
      researchEntranceScore: { type: "Research Entrance Score Card", file: null, uploaded: false, required: true }
    })
  });

  const [formData, setFormData] = React.useState<FormData>({
    firstName: studentName.split(' ')[0] || '',
    middleName: '',
    lastName: studentName.split(' ').slice(1).join(' ') || '',
    sex: "",
    age: "",
    dob: "",
    nationality: "",
    address: "",
    contactNumber: "",
    parentContactNumber: "",
    fatherName: "",
    motherName: "",
    fatherOccupation: "",
    motherOccupation: "",
    address: "",
    courseType: "UG", // Default to Undergraduate
    courseName: "Computer Science Engineering",
    tenthSchool: "",
    tenthPercentage: "",
    tenthBoard: "",
    twelfthSchool: "",
    twelfthPercentage: "",
    twelfthBoard: "",
    entranceExam: "",
    entranceScore: "",
    entranceRank: "",
    graduationSchool: "",
    graduationPercentage: "",
    graduationDegree: "",
    pgSchool: "",
    pgPercentage: "",
    pgDegree: "",
    researchProposal: "",
    remarks: "",
    course_type: courseType.toUpperCase() as "UG" | "PG" | "Research",
    course_name: courseName,
  });


  React.useEffect(() => {
    const checkExistingApplication = async () => {
      if (!user) return;
      
      try {
        const { data: application } = await supabase
          .from("applications")
          .select("id, status")
          .eq("student_id", user.id)
          .maybeSingle();

        if (application) {
          navigate("/student/dashboard");
        }
      } catch (err) {
        console.error("Error checking application:", err);
      }
    };

    checkExistingApplication();
  }, [user]);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          const { data: profile } = await supabase
            .from('students')
            .select('name, address')
            .eq('id', user.id)
            .single();
          
          if (profile?.name) {
            setStudentName(profile.name);
            if (profile.address) {
              setFormData(prev => ({ ...prev, address: profile.address }));
            }
          }
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };
    
    fetchUser();
  }, []);

  React.useEffect(() => {
    if (studentName) {
      const names = studentName.split(' ');
      setFormData(prev => ({
        ...prev,
        firstName: names[0] || '',
        lastName: names.length > 1 ? names[names.length - 1] : ''
      }));
    }
  }, [studentName]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (name: string, file: File | null) => {
    if (file) {
      setDocuments(prev => ({
        ...prev,
        [name]: { ...prev[name], file, uploaded: false },
      }));
    }
  };

  const uploadFile = async (file: File, path: string) => {
    await supabase.storage.from("applications").remove([path]);
    const { data, error } = await supabase.storage
      .from("applications")
      .upload(path, file, {
        upsert: true, // Add this option
        cacheControl: '3600'
      });

      if (error) throw error;
      return supabase.storage.from("applications").getPublicUrl(path).data.publicUrl;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
  
      // Common required fields
      const requiredFields = [
<<<<<<< HEAD
        'firstName', 'lastName', 'sex', 'age', 'contactNumber',
        'fatherName', 'motherName', 'address', 'courseType', 'courseName',
        'tenthSchool', 'tenthPercentage', 'twelfthSchool', 'twelfthPercentage'
=======
        'firstName', 'lastName', 'sex', 'age', 'dob', 'nationality', 'address',
        'contactNumber', 'fatherName', 'motherName', 'tenthSchool', 'tenthPercentage',
        'course_type', 'course_name'
>>>>>>> student-portal-changes
      ];

      if (isUG) {
        requiredFields.push('twelfthSchool', 'twelfthPercentage');
      }
      if (isPG) {
        requiredFields.push('twelfthSchool', 'twelfthPercentage', 'graduationSchool', 'graduationPercentage');
      }
      if (isResearch) {
        requiredFields.push(
          'twelfthSchool', 'twelfthPercentage',
          'graduationSchool', 'graduationPercentage',
          'pgSchool', 'pgPercentage'
        );
      }
  
      const missingFields = requiredFields.filter(field => !formData[field]);
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      const missingDocuments = Object.entries(documents)
      .filter(([_, doc]) => doc.file === null)
      .map(([key, _]) => key);
    
       if (missingDocuments.length > 0) {
         throw new Error(`Missing required documents: ${missingDocuments.join(', ')}`);
        }

      // Create application payload
      const fullName = `${formData.firstName} ${formData.middleName} ${formData.lastName}`.replace(/\s+/g, ' ').trim();
      
<<<<<<< HEAD
      const { data: application, error: appError } = await supabase
        .from("applications")
        .insert({
          student_id: user.id,
          course_id: courseId,
          department: formData.department,
          address: formData.address,
          course_type: formData.courseType,
          course_name: formData.courseName,
          personal_details: {
            name: fullName,
            sex: formData.sex,
            age: formData.age,
            contact_number: formData.contactNumber,
            parent_contact: formData.parentContactNumber,
            father_name: formData.fatherName,
            mother_name: formData.motherName,
            father_occupation: formData.fatherOccupation,
            mother_occupation: formData.motherOccupation,
=======
      const applicationPayload = {
        form_data: {},
        course_type: formData.course_type,
        student_id: user.id,
        course_id: courseId,
        course_name: formData.course_name,
        personal_details: {
          name: fullName,
          sex: formData.sex,
          age: formData.age,
          dob: formData.dob,
          nationality: formData.nationality,
          address: formData.address,
          contact_number: formData.contactNumber,
          parent_contact: formData.parentContactNumber,
          father_name: formData.fatherName,
          mother_name: formData.motherName,
          father_occupation: formData.fatherOccupation,
          mother_occupation: formData.motherOccupation,
        },
        academic_details: {
          tenth: {
            school: formData.tenthSchool,
            percentage: formData.tenthPercentage,
            board: formData.tenthBoard,
>>>>>>> student-portal-changes
          },
          ...(isUG || isPG || isResearch ? {
            twelfth: {
              school: formData.twelfthSchool,
              percentage: formData.twelfthPercentage,
              board: formData.twelfthBoard,
            }
          } : {}),
          ...(isPG || isResearch ? {
            graduation: {
              school: formData.graduationSchool,
              percentage: formData.graduationPercentage,
              degree: formData.graduationDegree,
            }
          } : {}),
          ...(isResearch ? {
            post_graduation: {
              school: formData.pgSchool,
              percentage: formData.pgPercentage,
              degree: formData.pgDegree,
            }
          } : {}),
          entrance: {
            exam: formData.entranceExam,
            score: formData.entranceScore,
            rank: formData.entranceRank,
          },
          ...(isResearch ? {
            research_proposal: formData.researchProposal
          } : {})
        },
        status: "pending",
        remarks: formData.remarks
      };

      // Submit to Supabase
      const { data: application, error: appError } = await supabase
        .from("applications")
        .insert(applicationPayload)
        .select()
        .single();

        if (!appError) {
          localStorage.setItem("hasSubmittedApplication", "true");
          setSuccess(true);
          toast.success("Application submitted successfully!");
          setTimeout(() => navigate("/student/dashboard"), 2000);
        }

      if (appError) throw appError;

      // Upload documents
      await Promise.all(
        Object.entries(documents)
          .filter(([_, doc]) => doc.file)
          .map(async ([key, doc]) => {
            const path = `documents/${user.id}/${courseId}/${key}/${doc.file!.name}`;
            const url = await uploadFile(doc.file!, path);
            
            await supabase
              .from('student_documents')
              .upsert({
                student_id: user.id,
                application_id: application.id,
                type: doc.type,
                url,
                name: doc.file!.name,
                uploaded_at: new Date().toISOString()
              });
          })
      );

<<<<<<< HEAD
      // Update student record
      const { error: studentError } = await supabase
        .from("students")
        .upsert({
          id: user.id,
          name: fullName,
          email: user.email,
          phone: formData.contactNumber,
          address: formData.address,
          department: formData.department,
          status: "pending",
          gender: formData.sex,
          updated_at: new Date().toISOString()
        });

      if (studentError) throw studentError;

      // Update status history
      await supabase.rpc('append_status_history', {
        student_id: user.id,
        new_status: 'pending',
        changed_by: 'student',
        remarks: 'Application submitted'
      });

=======
>>>>>>> student-portal-changes
      setSuccess(true);
      toast.success("Application submitted successfully!");
      setTimeout(() => navigate("/student/dashboard"), 2000);
    } catch (err: any) {
      console.error("Submission error:", err);
      setError(err.message || "Failed to submit application. Please try again.");
      toast.error(err.message || "Submission failed");
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
              Your application has been submitted successfully and is under review.
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
            Please fill in all the required information to complete your application.
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

                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <Label htmlFor="dob">Date of Birth *</Label>
        <Input
          id="dob"
          name="dob"
          type="date"
          value={formData.dob}
          onChange={handleInputChange}
          className="mt-1"
          required
        />
      </div>
      <div>
        <Label htmlFor="sex">Sex *</Label>
        <Select
          value={formData.sex}
          onValueChange={(value) => handleSelectChange("sex", value)}
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
          required
        />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="nationality">Nationality *</Label>
        <Input
          id="nationality"
          name="nationality"
          value={formData.nationality}
          onChange={handleInputChange}
          className="mt-1"
          required
        />
      </div>
      
    </div>

    <div>
      <Label htmlFor="address">Address *</Label>
      <Textarea
        id="address"
        name="address"
        value={formData.address}
        onChange={handleInputChange}
        className="mt-1"
        rows={3}
        required
      />
    </div>

                
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <Label htmlFor="course_type">Course Type *</Label>
      <Select
        value={formData.course_type}
        onValueChange={(value) => handleSelectChange("course_type", value as "UG" | "PG" | "Research")}
      >
        <SelectTrigger className="mt-1">
          <SelectValue placeholder="Select course type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="UG">Undergraduate (UG)</SelectItem>
          <SelectItem value="PG">Postgraduate (PG)</SelectItem>
          <SelectItem value="Research">Research</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div>
      <Label htmlFor="course_name">Course Name *</Label>
      <Input
        id="course_name"
        name="course_name"
        value={formData.course_name}
        onChange={handleInputChange}
        className="mt-1"
        placeholder="e.g. Computer Science"
      />
    </div>
  </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactNumber">Contact Number (Student) *</Label>
                    <Input
                      id="contactNumber"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="parentContactNumber">Contact Number (Parents)</Label>
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
                    <Label htmlFor="fatherOccupation">Father's Occupation</Label>
                    <Input
                      id="fatherOccupation"
                      name="fatherOccupation"
                      value={formData.fatherOccupation}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="motherOccupation">Mother's Occupation</Label>
                    <Input
                      id="motherOccupation"
                      name="motherOccupation"
                      value={formData.motherOccupation}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="col-span-full">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="courseType">Course Type *</Label>
                    <Select
                      value={formData.courseType}
                      onValueChange={(value) => handleSelectChange("courseType", value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select course type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UG">Undergraduate</SelectItem>
                        <SelectItem value="PG">Postgraduate</SelectItem>
                        <SelectItem value="Research">Research/PhD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="courseName">Course Name *</Label>
                    <Input
                      id="courseName"
                      name="courseName"
                      value={formData.courseName}
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

                  {(isPG || isResearch) && (
                    <div>
                      <h3 className="text-lg font-medium mb-4">
                        Undergraduate Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="graduationSchool">
                            College Name *
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
                          <Label htmlFor="graduationDegree">
                            University Name *
                          </Label>
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

                  {/* PG Details - shown only for Research */}
          {isResearch && (
            <div>
              <h3 className="text-lg font-medium mb-4">
                Postgraduate Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="pgSchool">College Name *</Label>
                  <Input
                    id="pgSchool"
                    name="pgSchool"
                    value={formData.pgSchool}
                    onChange={handleInputChange}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="pgPercentage">Percentage/CGPA *</Label>
                  <Input
                    id="pgPercentage"
                    name="pgPercentage"
                    value={formData.pgPercentage}
                    onChange={handleInputChange}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="pgDegree">University Name *</Label>
                  <Input
                    id="pgDegree"
                    name="pgDegree"
                    value={formData.pgDegree}
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
            <p className="text-sm text-gray-500">Date of Birth</p>
            <p>{formData.dob || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Nationality</p>
            <p>{formData.nationality || "N/A"}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-gray-500">Address</p>
            <p>{formData.address || "N/A"}</p>
          </div>
                      <div>
    <p className="text-sm text-gray-500">Course Type</p>
    <p>{formData.course_type}</p>
  </div>
  <div>
    <p className="text-sm text-gray-500">Course Name</p>
    <p>{formData.course_name}</p>
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
                            Undergraduate Details
                          </p>
                          <div className="grid grid-cols-3 gap-4 mt-1">
                            <div>
                              <p className="text-sm text-gray-500">
                                College Name
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
                              <p className="text-sm text-gray-500">
                                University Name
                              </p>
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