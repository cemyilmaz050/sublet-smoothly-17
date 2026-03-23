type LogoProps = {
  variant?: "dark" | "light";
  className?: string;
};

const Logo = ({ variant = "dark", className = "" }: LogoProps) => {
  const subColor = variant === "light" ? "#FFFFFF" : "#1a1a1a";

  return (
    <span
      className={`font-bold leading-none select-none text-[20px] sm:text-[22px] ${className}`}
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <span style={{ color: subColor }}>Sub</span>
      <span style={{ color: "#7C3AED" }}>In</span>
    </span>
  );
};

export default Logo;
