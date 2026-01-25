import { useEffect, useRef } from "react";
import { Book } from "../components/Book";
import { Navbar } from "../components/Navbar";
import AboutUs from "./AboutUs";
import "../pages-css/Index.css";

export const Index = () => {
  const bookRef = useRef(null);
  const aboutRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -100px 0px",
      }
    );

    // Observing sections
    if (bookRef.current) observer.observe(bookRef.current);
    if (aboutRef.current) observer.observe(aboutRef.current);

    return () => {
      if (bookRef.current) observer.unobserve(bookRef.current);
      if (aboutRef.current) observer.unobserve(aboutRef.current);
    };
  }, []);

  return (
    <>
      <Navbar />
      <div ref={bookRef} className="scroll-animate book-section">
        <Book />
      </div>
      <div ref={aboutRef} className="scroll-animate about-section">
        <AboutUs />
      </div>
    </>
  );
};
