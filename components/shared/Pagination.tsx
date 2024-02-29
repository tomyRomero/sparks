"use client";

import { useRouter, usePathname } from "next/navigation";

import { Button } from "../ui/button";
import { useAppContext } from "@/lib/AppContext";

interface Props {
  pageNumber: number;
  isNext: boolean;
  path: string;
  filter: boolean;
}

function Pagination({ pageNumber, isNext, filter, path}: Props) {
  const router = useRouter();

  const {title} = useAppContext();

  const currentPath = usePathname()
  console.log(currentPath)

  const handleNavigation = (type: string) => {
    let nextPageNumber = pageNumber;

    if (type === "prev") {
      nextPageNumber = Math.max(1, pageNumber - 1);
    } else if (type === "next") {
      nextPageNumber = pageNumber + 1;
    }

    const nextPagePath = filter
      ? `${currentPath.split("?")[0]}?page=${nextPageNumber}&title=${title}`
      : `${currentPath.split("?")[0]}?page=${nextPageNumber}`;

    

    if (nextPageNumber > 1) {
      router.push(nextPagePath);
    } else {
      router.push(`${currentPath.split("?")[0]}`);
    }
  };

  if (!isNext && pageNumber === 1) return null;

  return (
    <div className='pagination'>
      <Button
        onClick={() => handleNavigation("prev")}
        disabled={pageNumber === 1}
        className='!text-small-regular text-light-2 bg-primary-500'
      >
        Prev
      </Button>
      <p className='text-small-semibold text-black'>{pageNumber}</p>
      <Button
        onClick={() => handleNavigation("next")}
        disabled={!isNext}
        className='!text-small-regular text-light-2 bg-primary-500'
      >
        Next
      </Button>
    </div>
  );
}

export default Pagination;