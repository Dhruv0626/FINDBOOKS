import { useEffect, useState } from "react";
import { Bookcard } from "../components/Bookcard";
import { Searchbar } from "../components/Searchbar";
import Load from "./Load";
import "../components-css/Bookcard.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HomeFeatures } from "./HomeFeature";
import Cookies from "js-cookie";

export const Book = () => {
  const token = Cookies.get("token");
  const [bookdata, setBookdata] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [newArrivals, setNewArrivals] = useState([]);
  const [comics, setComics] = useState([]);
  const [schoolBooks, setSchoolBooks] = useState([]);
  const [resellBooks, setResellBooks] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const images = [
    "ai-generated-8266786_1280.png",
    "add1.jpg",
    "add2.jpg",
    "book.jpg",
    "add3.jpg",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isTransitioning) {
        nextSlide();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isTransitioning]);

  const nextSlide = () => {
    setIsTransitioning(true);
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const prevSlide = () => {
    setIsTransitioning(true);
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const goToSlide = (index) => {
    setIsTransitioning(true);
    setCurrentImageIndex(index);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const fetchBook = async () => {
    try {
      const [bookRes, sellOrderRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_RENDER_BACK}/api/Book`, {
          headers: {
            authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
        fetch(`${import.meta.env.VITE_RENDER_BACK}/api/resellerbook`, {
          headers: {
            authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
      ]);

      const bookText = await bookRes.text();
      const sellText = await sellOrderRes.text();

      let bookData, sellOrderData;
      try {
        bookData = JSON.parse(bookText);
      } catch (e) {
        throw new Error("Book API did not return valid JSON: " + bookText);
      }

      try {
        sellOrderData = JSON.parse(sellText);
      } catch (e) {
        throw new Error("Reseller API did not return valid JSON: " + sellText);
      }

      if (!Array.isArray(bookData) || !sellOrderData?.resellers) {
        setBookdata([]);
        setLoading(false);
        return;
      }

      setBookdata(bookData);

      const fourtyfiveDaysAgo = new Date();
      fourtyfiveDaysAgo.setDate(fourtyfiveDaysAgo.getDate() - 45);

      setNewArrivals(
        bookData.filter(
          (book) =>
            new Date(book.Publication_Date) > fourtyfiveDaysAgo &&
            !book.Isoldbook
        )
      );

      setComics(
        bookData.filter(
          (book) =>
            ["67795f5688651bc70ff2b3f0", "67ce7f7ad584df7a633ff379"].includes(
              book.Subcategory_id
            ) && !book.Isoldbook
        )
      );

      setSchoolBooks(
        bookData.filter(
          (book) =>
            ["67795eb888651bc70ff2b3e1", "67795edc88651bc70ff2b3e4"].includes(
              book.Subcategory_id
            ) && !book.Isoldbook
        )
      );

      const pendingBookIds = new Set(
        sellOrderData.resellers
          .filter((reseller) => reseller.Resell_Status === "Pending")
          .map((reseller) => reseller.Book_id)
      );

      setResellBooks(
        bookData.filter(
          (book) => book.Isoldbook && pendingBookIds.has(book._id)
        )
      );

      await deleteOldPendingBooks(bookData, sellOrderData.resellers);
      setLoading(false);
    } catch (error) {
      console.error("Fetch Error:", error);
      setError(error);
      setLoading(false);
    }
  };

  const deleteOldPendingBooks = async (books, resellers) => {
    const currentDate = new Date();
    const fifteenDaysAgo = new Date(
      currentDate.setDate(currentDate.getDate() - 15)
    );

    const pendingBooks = books.filter(
      (book) => book.Isoldbook && new Date(book.created_at) < fifteenDaysAgo
    );

    for (const book of pendingBooks) {
      const reseller = resellers.find(
        (r) => r.Book_id === book._id && r.Resell_Status === "Pending"
      );

      if (reseller) {
        try {
          await fetch(
            `${import.meta.env.VITE_RENDER_BACK}/api/resellerbook/${reseller._id}`,
            {
              method: "DELETE",
              headers: {
                authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
        } catch (error) {
          console.error("Delete error:", error);
        }
      }
    }
  };

  useEffect(() => {
    fetchBook();
  }, []);

  const handleSearch = () => {
    const lowerSearch = search.toLowerCase();
    setFilteredBooks(
      bookdata.filter((curBook) => {
        const bookName = curBook.BookName?.toLowerCase() || "";
        const author = curBook.Author?.toLowerCase() || "";
        const isbn = curBook.ISBN?.toLowerCase() || "";
        const publisher = curBook.Publisher?.toLowerCase() || "";

        return (
          bookName.includes(lowerSearch) ||
          author.includes(lowerSearch) ||
          isbn.includes(lowerSearch) ||
          publisher.includes(lowerSearch)
        );
      })
    );
  };

  if (loading)
    return (
      <h1>
        <Load />
      </h1>
    );
  if (error) return <h1>{error.message}</h1>;

  return (
    <>
      <div className="add-image">
        <div className="slideshow-container">
          <button className="slide-nav prev" onClick={prevSlide}>
            <ChevronLeft />
          </button>
          <div className="slideshow-wrapper">
            {images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Slide ${index + 1}`}
                className={`slideshow-image ${
                  index === currentImageIndex ? "active" : ""
                }`}
                style={{
                  transform: `translateX(${
                    (index - currentImageIndex) * 100
                  }%)`,
                  transition: isTransitioning
                    ? "transform 0.5s ease-in-out"
                    : "none",
                }}
              />
            ))}
          </div>
          <button className="slide-nav next" onClick={nextSlide}>
            <ChevronRight />
          </button>
          <div className="slide-indicators">
            {images.map((_, index) => (
              <button
                key={index}
                className={`indicator ${
                  index === currentImageIndex ? "active" : ""
                }`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <Searchbar
          search={search}
          setSearch={setSearch}
          handleSearch={handleSearch}
        />
      </div>

      {filteredBooks.length === 0 ? (
        <>
          {newArrivals.length > 0 && (
            <>
              <div className="booktype">New Arrival</div>
              <section className="card-container">
                <ul className="cards">
                  {newArrivals.map((book) => (
                    <Bookcard key={book._id} book={book} />
                  ))}
                </ul>
              </section>
            </>
          )}
          {comics.length > 0 && (
            <>
              <div className="booktype">Comics & Novels</div>
              <section className="card-container">
                <ul className="cards">
                  {comics.map((book) => (
                    <Bookcard key={book._id} book={book} />
                  ))}
                </ul>
              </section>
            </>
          )}
          <section className="welcome-image">
            <div className="hero-content">
              <h1>Welcome to FindBooks</h1>
              <p>Your ultimate destination for buying and selling books.</p>
            </div>
          </section>
          {schoolBooks.length > 0 && (
            <>
              <div className="booktype">Academics</div>
              <section className="card-container">
                <ul className="cards">
                  {schoolBooks.map((book) => (
                    <Bookcard key={book._id} book={book} />
                  ))}
                </ul>
              </section>
            </>
          )}
          <HomeFeatures />
          <br />
          {resellBooks.length > 0 && (
            <>
              <div className="booktype">Resell Books</div>
              <section className="card-container">
                <ul className="cards">
                  {resellBooks.map((book) => (
                    <Bookcard key={book._id} book={book} />
                  ))}
                </ul>
              </section>
            </>
          )}
        </>
      ) : (
        <section className="card-container">
          <ul className="cards">
            {filteredBooks.map((book) => (
              <Bookcard key={book._id} book={book} />
            ))}
          </ul>
        </section>
      )}
    </>
  );
};
