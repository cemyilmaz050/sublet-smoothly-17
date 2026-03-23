import logo from "@/assets/subin-logo.png";

type LogoProps = {
  variant?: "dark" | "light";
  className?: string;
};

/**
 * Reusable SubIn logo component.
 * - variant="dark"  → normal logo for light backgrounds
 * - variant="light" → brightened logo for dark backgrounds
 */
const Logo = ({ variant = "dark", className = "" }: LogoProps) => {
  return (
    <img
      src={logo}
      alt="SubIn"
      className={`h-8 sm:h-[32px] ${className}`}
      style={variant === "light" ? { filter: "brightness(10)" } : undefined}
    />
  );
};

export default Logo;
