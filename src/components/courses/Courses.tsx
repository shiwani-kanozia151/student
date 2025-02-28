import React from "react";
import { Link } from "react-router-dom";

const Courses = () => {
  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[#002147] mb-8">Courses</h1>

        <div className="mb-12">
          <p className="text-gray-700 mb-6">
            The National Institute of Technology Tiruchirappalli offers a wide
            range of undergraduate, postgraduate, and doctoral programs across
            various disciplines. Below is a comprehensive list of courses
            available at our institution.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-bold text-[#002147] mb-4">
                Undergraduate Programs
              </h2>
              <ul className="space-y-3">
                <li className="p-3 bg-white rounded border border-gray-200 hover:bg-blue-50 transition-colors">
                  <Link to="/courses/btech" className="block font-medium">
                    B. Tech. / B. Arch.
                  </Link>
                  <p className="text-sm text-gray-600 mt-1">
                    Four-year undergraduate engineering and architecture
                    programs
                  </p>
                </li>
                <li className="p-3 bg-white rounded border border-gray-200 hover:bg-blue-50 transition-colors">
                  <Link to="/courses/bsc-bed" className="block font-medium">
                    B.Sc. B.Ed.
                  </Link>
                  <p className="text-sm text-gray-600 mt-1">
                    Integrated science and education program
                  </p>
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-bold text-[#002147] mb-4">
                Postgraduate Programs
              </h2>
              <ul className="space-y-3">
                <li className="p-3 bg-white rounded border border-gray-200 hover:bg-blue-50 transition-colors">
                  <Link to="/courses/mtech" className="block font-medium">
                    M. Tech. / M. Arch.
                  </Link>
                  <p className="text-sm text-gray-600 mt-1">
                    Two-year postgraduate engineering and architecture programs
                  </p>
                </li>
                <li className="p-3 bg-white rounded border border-gray-200 hover:bg-blue-50 transition-colors">
                  <Link to="/courses/msc" className="block font-medium">
                    M. Sc.
                  </Link>
                  <p className="text-sm text-gray-600 mt-1">
                    Two-year postgraduate science programs
                  </p>
                </li>
                <li className="p-3 bg-white rounded border border-gray-200 hover:bg-blue-50 transition-colors">
                  <Link to="/courses/mca" className="block font-medium">
                    MCA
                  </Link>
                  <p className="text-sm text-gray-600 mt-1">
                    Master of Computer Applications
                  </p>
                </li>
                <li className="p-3 bg-white rounded border border-gray-200 hover:bg-blue-50 transition-colors">
                  <Link to="/courses/mba" className="block font-medium">
                    MBA
                  </Link>
                  <p className="text-sm text-gray-600 mt-1">
                    Master of Business Administration
                  </p>
                </li>
                <li className="p-3 bg-white rounded border border-gray-200 hover:bg-blue-50 transition-colors">
                  <Link to="/courses/ma" className="block font-medium">
                    MA
                  </Link>
                  <p className="text-sm text-gray-600 mt-1">
                    Master of Arts programs
                  </p>
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-bold text-[#002147] mb-4">
                Research Programs
              </h2>
              <ul className="space-y-3">
                <li className="p-3 bg-white rounded border border-gray-200 hover:bg-blue-50 transition-colors">
                  <Link to="/courses/ms" className="block font-medium">
                    M.S. (by Research)
                  </Link>
                  <p className="text-sm text-gray-600 mt-1">
                    Master of Science by research
                  </p>
                </li>
                <li className="p-3 bg-white rounded border border-gray-200 hover:bg-blue-50 transition-colors">
                  <Link to="/courses/phd" className="block font-medium">
                    Ph. D.
                  </Link>
                  <p className="text-sm text-gray-600 mt-1">
                    Doctoral research programs across disciplines
                  </p>
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-bold text-[#002147] mb-4">
                Contact Information
              </h2>
              <div className="p-4 bg-white rounded border border-gray-200">
                <p className="font-medium mb-2">Academic Section</p>
                <p className="mb-1">National Institute of Technology</p>
                <p className="mb-1">Tiruchirappalli – 620 015</p>
                <p className="mb-4">Tamil Nadu, India</p>

                <p className="mb-1">
                  <span className="font-medium">Email:</span> academic@nitt.edu
                </p>
                <p>
                  <span className="font-medium">Phone:</span> +91-431-2503910
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Courses;
