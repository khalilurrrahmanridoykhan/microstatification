import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { CiUser, CiMail, CiLock } from "react-icons/ci";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { IoCheckmark } from "react-icons/io5";
import { CiAt } from "react-icons/ci";
import { MdEditLocationAlt } from "react-icons/md";
import { IoIosArrowRoundBack } from "react-icons/io";
import { GrGlobe } from "react-icons/gr";
import { GoOrganization } from "react-icons/go";
import { MdWorkOutline } from "react-icons/md";
import ProgressBar from "./Authentication/ProgressBar";
import { FiSend } from "react-icons/fi";
import { BACKEND_URL } from "../config";
import { toast } from "sonner";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);
  // console.log(formData)
  const nextStep = () => {
    if (currentStep === 1) {
      if (
        !formData.first_name.trim() ||
        !formData.last_name.trim() ||
        !formData.username.trim()
      ) {
        setError("Please fill in all required fields.");
        return;
      }
    } else if (currentStep === 3) {
      if (
        !formData.email.trim() ||
        !formData.password.trim() ||
        !formData.confirmPassword.trim() ||
        formData.password !== formData.confirmPassword
      ) {
        setError("Please fill in all required fields.");
        return;
      }
    }

    setError("");
    setCurrentStep((prev) => prev + 1);
  };
  const prevStep = () => setCurrentStep((prev) => prev - 1);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      await axios.post(`${BACKEND_URL}/api/auth/register/`, {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
      });
      toast.success("User registered successfully");
      navigate("/login");
      window.location.reload();
    } catch (err) {
      if (err.response && err.response.data) {
        const errorMessages = Object.values(err.response.data).flat().join(" ");
        setError(errorMessages);
      } else {
        setError("Error registering user");
      }
    }
  };

  return (
    <div
      className="h-screen bg-cover bg-center bg-no-repeat bg-[var(--svgMapBackgroundColor)]"
      style={{ backgroundImage: "url('/svg_earth.svg')" }}
    >
      <div className="z-10 flex items-center justify-center h-screen  md:h-screen">
        <form
          onSubmit={handleSubmit}
          className="md:w-[506px] lg:w-[506px]  bg-white  p-4 rounded-[12px] border-2 border-gray-900  lg:mt-[5%] mb-4 drop-shadow-[var(--svgMapBackgroundColor)] transition-all duration-800 ease-in-out"
          style={{
            background:
              "linear-gradient(to bottom, var(--gradientStart) 0%, var(--gradientEnd) 30%)",
          }}
        >
          <div className="mb-2 text-center">
            <div className="inline-block p-2 rounded-md bg-blue-300/50">
              <MdEditLocationAlt className="w-8 h-8 text-blue-600" />
            </div>
            <h3>Get started</h3>
            <p className="text-sm text-muted"> Create a new account</p>
            <div className="flex justify-center mt-4 ml-[20%]">
              <ProgressBar currentStage={currentStep} />
            </div>

            <hr />
          </div>

          {currentStep === 1 && (
            <>
              <div className="mb-3 inputForm">
                <CiUser className="w-6 h-6" />
                <input
                  type="text"
                  className="input"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="Enter first name"
                  required
                />
              </div>

              <div className="mb-3 inputForm">
                <CiUser className="w-6 h-6" />
                <input
                  type="text"
                  className="input"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Enter last name"
                  required
                />
              </div>
              <div className="mb-3 inputForm">
                <CiAt className="w-6 h-6" />
                <input
                  type="text"
                  className="input"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter username"
                  required
                />
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              {/* Country Selection */}
              <div className="mb-3 inputForm">
                <GrGlobe className="w-6 h-6" />
                <select
                  name="country"

                  onChange={handleChange}
                  required
                  className="input"
                >
                  <option value="" disabled>
                    Select country
                  </option>
                  <option value="Bangladesh">Bangladesh</option>
                  {/* <option value="India">India</option> */}
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="Germany">Germany</option>
                  <option value="France">France</option>
                  <option value="Australia">Australia</option>
                  <option value="other">Other</option>
                  {/* Add more countries as needed */}
                </select>
              </div>

              {/* Sector Selection */}
              <div className="mb-3 inputForm">
                <MdWorkOutline className="w-6 h-6" />
                <select
                  name="sector"

                  onChange={handleChange}
                  required
                  className="input"
                >
                  <option value="" disabled>
                    Select sector
                  </option>
                  <option value="Health">Health</option>
                  <option value="Education">Education</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="WASH">WASH (Water, Sanitation, and Hygiene)</option>
                  <option value="Environment">Environment</option>
                  <option value="Technology">Technology</option>
                  <option value="Human Rights">Human Rights</option>
                  <option value="Research">Research</option>
                  {/* Add more sectors as needed */}
                </select>
              </div>

              {/* Organization Type */}
              <div className="mb-3 inputForm">
                <GoOrganization className="w-6 h-6" />
                <select
                  name="organization_type"
                  value={formData.organization_type}
                  onChange={handleChange}
                  required
                  className="input"
                >
                  <option value="" disabled>
                    Select organization type
                  </option>
                  <option value="Government Organizations">
                    Government Organizations
                  </option>
                  <option value="Autonomous & Semi-Autonomous Bodies">
                    Autonomous & Semi-Autonomous Bodies
                  </option>
                  <option value="Non-Governmental Organizations (NGOs)">
                    Non-Governmental Organizations (NGOs)
                  </option>
                  <option value="International Organizations / UN Agencies">
                    International Organizations / UN Agencies
                  </option>
                  <option value="Private Sector Organizations">
                    Private Sector Organizations
                  </option>
                  <option value="Academic & Research Institutions">
                    Academic & Research Institutions
                  </option>
                  <option value="Local Government Institutions">
                    Local Government Institutions
                  </option>
                  <option value="Community-Based Organizations (CBOs)">
                    Community-Based Organizations (CBOs)
                  </option>
                  <option value="Social Enterprises & Foundations">
                    Social Enterprises & Foundations
                  </option>
                </select>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <div className="mb-3 inputForm">
                <CiMail className="w-6 h-6" />
                <input
                  type="email"
                  className="input"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email"
                  required
                />
              </div>
              <div className="mb-3 inputForm">
                <CiLock className="w-6 h-6" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="input"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  required
                />
                <div
                  onClick={() => setShowPassword(!showPassword)}
                  className="pr-4 cursor-pointer"
                >
                  {showPassword ? (
                    <FiEye className="w-5 h-5" />
                  ) : (
                    <FiEyeOff className="w-5 h-5" />
                  )}
                </div>
              </div>

              <div className="mb-3 inputForm">
                <IoCheckmark className="w-6 h-6" />
                <input
                  type={showConfirm ? "text" : "password"}
                  className="input"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  required
                />
                <div
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="pr-4 cursor-pointer"
                >
                  {showConfirm ? (
                    <FiEye className="w-5 h-5" />
                  ) : (
                    <FiEyeOff className="w-5 h-5" />
                  )}
                </div>
              </div>
            </>
          )}

          <div className="flex justify-between mt-4">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="btn-secondaryColor rounded-[6px] border p-2 flex items-center gap-1 flex-row text-sm"
              >
                <IoIosArrowRoundBack />
                <span>Previous </span>
              </button>
            )}
            {currentStep < 3 && (
              <button
                type="button"
                onClick={nextStep}
                className="btn-primaryColor rounded-[6px] ml-auto border p-2 flex items-center gap-1 flex-row text-sm"
              >
                <span>Next </span>
                <IoIosArrowRoundBack className="rotate-180" />
              </button>
            )}
            {currentStep === 3 && (
              <button
                type="submit"
                className="btn-primaryColor rounded-[6px] border px-4 flex items-center gap-1 flex-row text-sm justify-center ml-2"
              >
                <span className="m-0">Register</span>
                <FiSend className="" />{" "}
              </button>
            )}
          </div>

          {error && (
            <p className="p-1 text-center text-red-700 border bg-red-400/70">
              {error}
            </p>
          )}

          <p className="mt-3 text-sm text-muted">
            Aleady have an account?{" "}
            <Link to="/login" className="font-semibold linkTag">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
