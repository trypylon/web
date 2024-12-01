"use client";

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
          <p>
            Itz Magic Inc ("we", "our", or "us") operates the website
            https://app.modelflowai.com (the "Service"). This page informs you
            of our policies regarding the collection, use, and disclosure of
            personal data when you use our Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">
            2. Information Collection and Use
          </h2>
          <p>
            We collect several different types of information for various
            purposes to provide and improve our Service to you:
          </p>
          <ul className="list-disc pl-6 mt-2">
            <li>Email address</li>
            <li>Name</li>
            <li>Usage Data</li>
            <li>
              Authentication data from third-party providers (Google, GitHub)
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Use of Data</h2>
          <p>We use the collected data for various purposes:</p>
          <ul className="list-disc pl-6 mt-2">
            <li>To provide and maintain our Service</li>
            <li>To notify you about changes to our Service</li>
            <li>To provide customer support</li>
            <li>To detect, prevent and address technical issues</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">
            4. Data Storage and Transfer
          </h2>
          <p>
            Your information may be transferred to — and maintained on —
            computers located outside of your state, province, country, or other
            governmental jurisdiction where the data protection laws may differ
            from those of your jurisdiction.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Security</h2>
          <p>
            The security of your data is important to us but remember that no
            method of transmission over the Internet or method of electronic
            storage is 100% secure.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact
            us at:{" "}
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
