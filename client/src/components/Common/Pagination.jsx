export default function Pagination({
  currentPage,
  totalPages,
  onPrev,
  setCurrentPage,
  onNext,
}) {
  return (
    <nav aria-label="Page navigation example" className="mt-4">
      <ul className="pagination justify-content-center align-items-center gap-2 flex-wrap">
        {/* Previous Button */}
        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
          <button
            className="page-link"
            onClick={onPrev}
            aria-label="Previous"
            disabled={currentPage === 1}
          >
            &laquo;
          </button>
        </li>

        {/* Current Page Input */}
        <li className="page-item d-flex align-items-center">
          <div className="input-group input-group-sm">
            <input
              type="number"
              className="form-control text-center"
              min={1}
              max={totalPages}
              step={1}
              value={currentPage}
              style={{ width: "60px" }}
              onChange={(e) => {
                let inputPage = parseInt(e.target.value);
                if (inputPage > totalPages) setCurrentPage(totalPages);
                else if (inputPage < 1 || isNaN(inputPage)) setCurrentPage(1);
                else setCurrentPage(inputPage);
              }}
            />
            <span className="input-group-text">/ {totalPages}</span>
          </div>
        </li>

        {/* Next Button */}
        <li
          className={`page-item ${
            currentPage === totalPages ? "disabled" : ""
          }`}
        >
          <button
            className="page-link"
            onClick={onNext}
            aria-label="Next"
            disabled={currentPage === totalPages}
          >
            &raquo;
          </button>
        </li>
      </ul>
    </nav>
  );
}
