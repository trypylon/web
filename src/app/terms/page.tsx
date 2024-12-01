"use client";

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>

      <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Terms</h2>
          <p>
            By accessing https://app.modelflowai.com, operated by Itz Magic Inc,
            you agree to be bound by these terms of service. If you disagree
            with any part of the terms, you may not access the service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Use License</h2>
          <p>
            Permission is granted to temporarily access Pylon for personal,
            non-commercial transitory viewing only.
          </p>
          <p className="mt-2">
            This license shall automatically terminate if you violate any of
            these restrictions:
          </p>
          <ul className="list-disc pl-6 mt-2">
            <li>Use the service for any unlawful purpose</li>
            <li>
              Attempt to decompile or reverse engineer any software contained in
              Pylon
            </li>
            <li>Remove any copyright or other proprietary notations</li>
            <li>
              Transfer the materials to another person or "mirror" the materials
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Disclaimer</h2>
          <p>
            The materials on Pylon are provided on an 'as is' basis. Itz Magic
            Inc makes no warranties, expressed or implied, and hereby disclaims
            and negates all other warranties including, without limitation,
            implied warranties or conditions of merchantability, fitness for a
            particular purpose, or non-infringement of intellectual property or
            other violation of rights.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Limitations</h2>
          <p>
            In no event shall Itz Magic Inc or its suppliers be liable for any
            damages (including, without limitation, damages for loss of data or
            profit, or due to business interruption) arising out of the use or
            inability to use Pylon.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">
            5. Accuracy of Materials
          </h2>
          <p>
            The materials appearing on Pylon could include technical,
            typographical, or photographic errors. Itz Magic Inc does not
            warrant that any of the materials on Pylon are accurate, complete,
            or current.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Links</h2>
          <p>
            Itz Magic Inc has not reviewed all of the sites linked to its
            Service and is not responsible for the contents of any such linked
            site. The inclusion of any link does not imply endorsement by Itz
            Magic Inc of the site.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Modifications</h2>
          <p>
            Itz Magic Inc may revise these terms of service at any time without
            notice. By using Pylon you are agreeing to be bound by the then
            current version of these terms of service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at:{" "}
            <a
              href="mailto:sistilli.business@gmail.com"
              className="text-blue-600 hover:underline"
            >
              sistilli.business@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
