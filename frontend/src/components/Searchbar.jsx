import { FaSearch } from "react-icons/fa";
import "../components-css/Searchbar.css";
export const Searchbar = ({ search, setSearch, handleSearch }) => {
  return (
    <>
      <div className="homesearchbar">
        <input
          className="homesearch-input"
          type="text"
          placeholder="Search Books"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="homesearch-btn" onClick={handleSearch}>
          <FaSearch />
        </button>
      </div>
    </>
  );
};


