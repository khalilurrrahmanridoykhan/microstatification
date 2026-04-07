import React from "react";
import { FaAndroid, FaDownload, FaShieldAlt, FaSyncAlt } from "react-icons/fa";
import { BiCloudUpload } from "react-icons/bi";
import {
  BRAND_ACRONYM,
  BRAND_FULL_TITLE,
  BRAND_TAGLINE,
} from "./BrandHeading";

const downloadUrl = "/mobileapp/MDCollect.apk";

const features = [
  {
    title: "Field-ready & Offline",
    description:
      "Collect submissions anywhere. MDCollect automatically syncs when a secure connection is available.",
    icon: <BiCloudUpload className="text-2xl text-blue-600" />,
  },
  {
    title: "Secure by Design",
    description:
      "Encrypted storage, verified users, and tamper-proof audit trails keep sensitive public-health data safe.",
    icon: <FaShieldAlt className="text-2xl text-blue-600" />,
  },
  {
    title: "Live Updates",
    description:
      "Enjoy the same projects, templates, and translations you configure on the web dashboard.",
    icon: <FaSyncAlt className="text-2xl text-blue-600" />,
  },
];

const steps = [
  "Tap the download button below or copy the link into your browser.",
  "Approve the download if your device warns you about external APKs.",
  "Open the downloaded APK, grant permission to install, and follow the prompts.",
  `Sign in with your ${BRAND_ACRONYM} credentials and tap ‘Sync’ to fetch assignments.`,
];

const requirements = [
  "Android 8.0 (Oreo) or newer",
  "Minimum free storage: 200 MB",
  "Camera + GPS enabled for rich question types",
  "Stable connection for first-time sync (Wi‑Fi recommended)",
];

const MobileAppDownload = () => {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-8 rounded-3xl bg-white p-8 shadow-lg lg:flex-row lg:items-center">
          <div className="flex-1 space-y-4">
            <p className="inline-flex items-center rounded-full bg-blue-100 px-4 py-1 text-sm font-semibold text-blue-700">
              <FaAndroid className="mr-2" /> {BRAND_ACRONYM} Mobile
            </p>
            <h1 className="text-3xl font-bold text-gray-900 lg:text-4xl">
              Collect data on the move with MDCollect
            </h1>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-500">
              {BRAND_FULL_TITLE}
            </p>
            <p className="text-gray-600">
              The official {BRAND_ACRONYM} Android companion keeps templates,
              translations, and follow-up workflows at your fingertips. Empower
              enumerators, supervisors, and medical staff to capture verified
              data—even offline. {BRAND_TAGLINE}
            </p>
            <div className="flex flex-wrap gap-6 pt-4">
              <a
                href={downloadUrl}
                className="inline-flex items-center rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
                download
              >
                <FaDownload className="mr-2 text-lg" />
                Download Android APK
              </a>
              <div className="text-sm text-gray-500">
                File: MDCollect.apk
                <br />
                (<span className="font-medium">Signed build</span>)
              </div>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="relative w-full max-w-sm">
              <div className="absolute inset-0 -z-10 rounded-[40px] bg-gradient-to-br from-blue-100 to-white blur-2xl" />
              <div className="rounded-[32px] border border-gray-100 bg-gray-900 p-6 text-white shadow-2xl">
                <div className="flex justify-between text-sm">
                  <span>MDCollect</span>
                  <span>Sync Ready</span>
                </div>
                <div className="mt-8 space-y-4">
                  <div className="rounded-2xl bg-gray-800 p-4">
                    <p className="text-xs uppercase tracking-widest text-gray-400">
                      Next Action
                    </p>
                    <p className="text-lg font-semibold">Download & Install</p>
                  </div>
                  <div className="rounded-2xl bg-blue-600/20 p-4 text-sm text-blue-100">
                    Works seamlessly with {BRAND_ACRONYM} follow-up templates.
                  </div>
                </div>
                <div className="mt-8 flex items-center justify-between text-xs text-gray-400">
                  <span>Android</span>
                  <span>Version 2.4</span>
                  <span>64 MB</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl bg-white p-6 shadow hover:shadow-md"
            >
              <div className="mb-4 inline-flex rounded-2xl bg-blue-50 p-3">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-8 shadow">
            <h3 className="text-xl font-semibold text-gray-900">
              Install in four steps
            </h3>
            <ol className="mt-4 space-y-3 text-gray-700">
              {steps.map((step, index) => (
                <li key={step} className="flex gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                    {index + 1}
                  </span>
                  <p className="pt-1 text-sm">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-3xl bg-gray-900 p-8 text-white shadow">
            <h3 className="text-xl font-semibold">Device requirements</h3>
            <ul className="mt-4 space-y-3 text-sm text-gray-200">
              {requirements.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-blue-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileAppDownload;
