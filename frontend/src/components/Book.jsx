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

  // This function fetches book data and reseller book data from the server
  const fetchBook = async () => {
    try {
      // Fetch both book list and reseller book list at the same time
      const [bookRes, sellOrderRes] = await Promise.all([
        fetch(`http://localhost:2606/api/Book`, {
          headers: {
            authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
        fetch(`${import.meta.env.VITE_BACK_URL}/api/resellerbook`, {
          headers: {
            authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
      ]);

      // Convert the responses to JSON format
      const [bookData, sellOrderData] = await Promise.all([
        bookRes.json(),
        sellOrderRes.json(),
      ]);

      // If the data is not in expected format, set empty book data and stop loading
      if (!Array.isArray(bookData) || !sellOrderData?.resellers) {
        setBookdata([]);
        setLoading(false);
        return;
      }

      // Save the fetched book data to state
      setBookdata(bookData);

      // Calculate the date 45 days ago from today
      const fourtyfiveDaysAgo = new Date();
      fourtyfiveDaysAgo.setDate(fourtyfiveDaysAgo.getDate() - 45);

      // Filter books published within last 45 days and not old books, set as new arrivals
      setNewArrivals(
        bookData.filter(
          (book) =>
            new Date(book.Publication_Date) > fourtyfiveDaysAgo && !book.Isoldbook
        )
      );

      // Filter books in specific subcategories (comics & novels) and not old books
      setComics(
        bookData.filter(
          (book) =>
            ["67795f5688651bc70ff2b3f0", "67ce7f7ad584df7a633ff379"].includes(
              book.Subcategory_id
            ) && !book.Isoldbook
        )
      );

      // Filter books in specific subcategories (academics) and not old books
      setSchoolBooks(
        bookData.filter(
          (book) =>
            ["67795eb888651bc70ff2b3e1", "67795edc88651bc70ff2b3e4"].includes(
              book.Subcategory_id
            ) && !book.Isoldbook
        )
      );

      // Get the IDs of reseller books that have status "Pending"
      const pendingBookIds = new Set(
        sellOrderData.resellers
          .filter((reseller) => reseller.Resell_Status === "Pending")
          .map((reseller) => reseller.Book_id)
      );

      // Set resellBooks state to old books whose IDs are in the pendingBookIds set
      setResellBooks(
        bookData.filter(
          (book) => book.Isoldbook && pendingBookIds.has(book._id)
        )
      );

      // Call function to delete old pending books (older than 15 days)
      await deleteOldPendingBooks(bookData, sellOrderData.resellers);

      // Set loading to false after all processing is done
      setLoading(false);
    } catch (error) {
      // If any error occurs during fetch, log it and set error state
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
            `http://localhost:2606/api/resellerbook/${reseller._id}`,
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
              <p>
                Your ultimate destination for buying and selling books with ease
                and joy.
              </p>
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
