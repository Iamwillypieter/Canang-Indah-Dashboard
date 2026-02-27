import { useEffect, useState } from "react";

import particleBoard1 from "../assets/particle-board.jpg";
import particleBoard2 from "../assets/tjipta-product-particle-board-02.jpg";
import particleBoard3 from "../assets/tjipta-product-particle-board-03.jpg";
import particleBoard4 from "../assets/tjipta-product-particle-board-04.jpg";

import mdf1 from "../assets/tjipta-product-mdf-01.jpg";
import mdf2 from "../assets/tjipta-product-mdf-02.jpg";
import mdf3 from "../assets/tjipta-product-mdf-04.jpg";
import mdf4 from "../assets/tjipta-product-mdf-03.jpg";

import furniture1 from "../assets/tjipta-product-furniture-01.jpg";
import furniture2 from "../assets/tjipta-product-furniture-02.jpg";
import furniture3 from "../assets/tjipta-product-furniture-03.jpg";
import furniture4 from "../assets/tjipta-product-furniture-04.jpg";
import furniture5 from "../assets/tjipta-product-furniture-05.jpg";

import "./HomePage.css";

export default function HomePage() {
  const slideData = {
    particleBoard: [
      { image: particleBoard1, title: "Particle Board" },
      { image: particleBoard2, title: "Particle Board" },
      { image: particleBoard3, title: "Particle Board" },
      { image: particleBoard4, title: "Particle Board" },
    ],
    mdf: [
      { image: mdf1, title: "Medium-Density Fibreboard" },
      { image: mdf2, title: "Medium-Density Fibreboard" },
      { image: mdf3, title: "Medium-Density Fibreboard" },
      { image: mdf4, title: "Medium-Density Fibreboard" },
    ],
    furniture: [
      { image: furniture1, title: "Furniture Product" },
      { image: furniture2, title: "Furniture Product" },
      { image: furniture3, title: "Furniture Product" },
      { image: furniture4, title: "Furniture Product" },
      { image: furniture5, title: "Furniture Product" },
    ],
  };

  const [activeCategory, setActiveCategory] = useState("particleBoard");
  const [currentIndex, setCurrentIndex] = useState(0);

  const slides = slideData[activeCategory] || [];

  useEffect(() => {
    if (!slides.length) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= slides.length - 1) return 0;
        return prev + 1;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [activeCategory, slides.length]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [activeCategory]);

  return (
    <div className="home">
      {/* HERO */}
      <section className="hero">
        <div className="hero-left">
          <h1>
            PT <br />
            CANANG <br />
            INDAH<span>®</span>
          </h1>
          <p className="tagline">Industri Particle Board</p>
        </div>

        <div className="hero-right glass">
          {/* TAG FILTER */}
          <div className="hero-tags">
            <span
              className={activeCategory === "particleBoard" ? "active" : ""}
              onClick={() => setActiveCategory("particleBoard")}
            >
              Particle Board
            </span>
            <span
              className={activeCategory === "mdf" ? "active" : ""}
              onClick={() => setActiveCategory("mdf")}
            >
              MDF
            </span>
            <span
              className={activeCategory === "furniture" ? "active" : ""}
              onClick={() => setActiveCategory("furniture")}
            >
              Furniture
            </span>
          </div>

          <h2>Bisnis Kami</h2>
          <p>Jenis Produk</p>

          {/* SLIDER */}
          {slides.length > 0 && (
            <>
              <div className="roomtour-slider">
                <div className="slider-image-wrapper">
                  <img
                    src={slides[currentIndex].image}
                    alt={slides[currentIndex].title}
                    className="slider-image"
                  />
                </div>
                <span className="slider-caption">
                  {slides[currentIndex].title}
                </span>
              </div>

              {/* DOT INDICATOR */}
              <div className="slider-dots">
                {slides.map((_, index) => (
                  <span
                    key={index}
                    className={`dot ${index === currentIndex ? "active" : ""}`}
                    onClick={() => setCurrentIndex(index)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* INFO + VISI MISI */}
      <section className="info">
        <div className="info-card glass">
          <h3>Melalui Kayu Rekayasa yang Berkelanjutan</h3>
          <p>
            Tjipta Memajukan Bioekonomi dengan Berkontribusi 
            pada Masa Depan yang Lebih Hijau
          </p>
        </div>

        <div className="info-text">
          <h3 className="vision-title">VISI</h3>
          <p className="vision-text">
            Mengembangkan inovasi kayu berkelanjutan untuk berkontribusi
            pada masa depan yang lebih hijau bagi industri dan lingkungan.
          </p>

          <h4 className="mission-title">MISI</h4>
          <p className="mission-text">
            Menghadirkan produk kayu berkualitas tinggi melalui teknologi
            modern, kemitraan berkelanjutan, serta komitmen terhadap kepuasan
            pelanggan.
          </p>
        </div>
        <div className="info-metrics">
          <div className="info-center">
            <h2>50+</h2>
            <p>Years of Excellence</p>
          </div>

          <div className="info-center">
            <h2>25+</h2>
            <p>Global Markets</p>
          </div>

          <div className="info-center highlight">
            <h2>100%</h2>
            <p>Biomass Energy</p>
          </div>

          <div className="info-center">
            <h2>05+</h2>
            <p>Global Certifications</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="home-signature">
        © 2026 — Crafted & Engineered by{" "}
        <strong>Willy Pieter Julius Situmorang</strong>
      </footer>
    </div>
  );
}
