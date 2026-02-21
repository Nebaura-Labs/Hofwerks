import logo from "../assets/logo.png";

type LogoProps = {
  className?: string;
};

export const Logo = ({ className }: LogoProps) => {
  return <img alt="Hofwerks logo" className={className} height={96} src={logo} width={96} />;
};
