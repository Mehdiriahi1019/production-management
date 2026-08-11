import { useEffect } from "react";
import { useSelector } from "react-redux";

const ThemeManager = () => {
  const theme = useSelector(
    (state) => state.settings.theme
  );

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      theme
    );
  }, [theme]);

  return null;
};

export default ThemeManager;