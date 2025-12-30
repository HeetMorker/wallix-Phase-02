import { useMemo } from "react";

const useFilteredAndSortedData = (data, filters, sortOrder) => {
  const filteredAndSorted = useMemo(() => {
    const filtered = data.filter((item) =>
      Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        return item[key]
          ?.toString()
          .toLowerCase()
          .includes(value.toLowerCase());
      })
    );

    const sorted = filtered.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0);
      const dateB = new Date(b.updatedAt || b.createdAt || 0);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    return sorted;
  }, [data, filters, sortOrder]);

  return filteredAndSorted;
};

export default useFilteredAndSortedData;
