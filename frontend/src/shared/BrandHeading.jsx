import React from "react";
import { Link } from "react-router-dom";

export const BRAND_MAIN_TITLE = "Climate and Health Data Acquisition System";
export const BRAND_ACRONYM = "CHaDAS";
export const BRAND_FULL_TITLE = `${BRAND_MAIN_TITLE} (${BRAND_ACRONYM})`;
export const BRAND_TAGLINE =
  "Collecting climate and health data for informed action.";

const ALIGNMENT_CLASS_MAP = {
  left: { container: "items-start text-left", text: "text-left" },
  center: { container: "items-center text-center", text: "text-center" },
  right: { container: "items-end text-right", text: "text-right" },
};

const BrandHeading = ({
  to = "/dashboard",
  className = "",
  align = "center",
  showLongTitle = true,
}) => {
  const { container, text } =
    ALIGNMENT_CLASS_MAP[align] || ALIGNMENT_CLASS_MAP.center;

  const titleBlock = (
    <div className={`leading-tight ${text}`}>
      {showLongTitle && (
        <span className="block text-[11px] font-semibold uppercase tracking-[0.25em] text-gray-500">
          {BRAND_MAIN_TITLE}
        </span>
      )}
      <span className="mt-1 block text-2xl font-black tracking-tight text-gray-900">
        {BRAND_ACRONYM}
      </span>
      <span className="mt-1 block text-xs font-medium text-gray-500">
        {BRAND_TAGLINE}
      </span>
    </div>
  );

  const wrapperClasses = `brand-heading flex flex-col ${container} ${className}`;

  return (
    <div className={wrapperClasses} aria-label={BRAND_FULL_TITLE}>
      {to ? (
        <Link to={to} className="no-underline text-current">
          {titleBlock}
        </Link>
      ) : (
        titleBlock
      )}
    </div>
  );
};

export default BrandHeading;
