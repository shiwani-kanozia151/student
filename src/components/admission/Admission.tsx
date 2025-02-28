import React from "react";

const Admission = () => {
  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[#002147] mb-8">Admissions</h1>

        <div className="mb-12">
          <p className="text-gray-700 mb-6">
            Admission to the various courses offered by this institution are
            specific to the programme and details can be found under each
            specific programme.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors">
              <p className="font-medium">B. Tech. / B. Arch.</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors">
              <p className="font-medium">M. Tech. / M. Arch.</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors">
              <p className="font-medium">M. Sc.</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors">
              <p className="font-medium">MCA</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors">
              <p className="font-medium">MBA</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors">
              <p className="font-medium">MA</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors">
              <p className="font-medium">M.S. (by Research)</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors">
              <p className="font-medium">Ph. D.</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors">
              <p className="font-medium">B.Sc. B.Ed.</p>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-[#002147] mb-4">
            Coordinating Bodies / Institutes for Various Admission Processes
          </h2>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium mb-1">
                Joint Seat Allocation Authority (JoSAA)
              </p>
              <a
                href="https://josaa.nic.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                https://josaa.nic.in/
              </a>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium mb-1">
                Central Seat Allocation Board (CSAB)
              </p>
              <a
                href="https://csab.nic.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                https://csab.nic.in/
              </a>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium mb-1">
                Direct Admission of Students Abroad (DASA)
              </p>
              <a
                href="https://dasanit.org/dasa2024/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                https://dasanit.org/dasa2024/
              </a>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium mb-1">
                Indian Council for Cultural Relations (ICCR)
              </p>
              <a
                href="https://www.iccr.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                https://www.iccr.gov.in
              </a>
              <br />
              <a
                href="http://a2ascholarships.iccr.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                http://a2ascholarships.iccr.gov.in/
              </a>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium mb-1">Study in India (SII)</p>
              <a
                href="https://www.studyinindia.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                https://www.studyinindia.gov.in/
              </a>
              , Click here for SII admissions/registrations link
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium mb-1">
                Centralized Counselling for M.Tech./M.Arch. Admissions (CCMT)
              </p>
              <a
                href="https://ccmt.admissions.nic.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                https://ccmt.admissions.nic.in/
              </a>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium mb-1">
                Centralized Counselling for M. Sc. Admission (CCMN)
              </p>
              <a
                href="https://ccmn.admissions.nic.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                https://ccmn.admissions.nic.in/
              </a>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium mb-1">
                NIT MCA Common Entrance Test 2024(NIMCET)
              </p>
              <a
                href="http://www.nimcet.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                http://www.nimcet.in/
              </a>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium mb-1">
                NIMCET Counselling and Admission Services
              </p>
              <a
                href="https://nimcet.admissions.nic.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                https://nimcet.admissions.nic.in/
              </a>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-[#002147] mb-4">
            Centralized Admission Committee
          </h2>

          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li>Dr. S.T. Ramesh, Dean (Academic) - Chairperson</li>
            <li>
              Dr. S. Vinodh - Member / Professor Production Engineering,
              Chairperson UG Admission Committee
            </li>
            <li>
              Dr. T. Sivasankar - Member / Professor Chemical Engineering,
              Chairperson PG Admission Committee
            </li>
            <li>
              Dr. N. Ramesh Babu - Member / Professor Metallurgical and
              Materials Engineering, Chairperson (M.S & Ph.D.) Admission
              Committee
            </li>
          </ol>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-[#002147] mb-4">
            Contact Details
          </h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="font-medium mb-2">Centralized Admission Cell</p>
            <p className="mb-1">National Institute of Technology</p>
            <p className="mb-1">Tiruchirappalli – 620 015</p>
            <p className="mb-4">Tamil Nadu, India</p>

            <p className="mb-1">
              <span className="font-medium">Phone:</span> +91-431-2503931 (B.
              Tech. / B. Arch.) ; +91-431-2504940 (M. Tech. / M. Arch. / M. Sc.
              / MCA / MBA / MA) (During the admission schedule only)
            </p>
            <p className="mb-1">
              <span className="font-medium">E-Mail:</span> ug@nitt.edu (B. Tech.
              / B. Arch.) ; pg@nitt.edu (M. Tech. / M. Arch. / M. Sc. / MCA /
              MBA / MA) ;
            </p>
            <p>msadmission@nitt.edu (MS) ; phdadmission@nitt.edu (Ph.D.)</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admission;
